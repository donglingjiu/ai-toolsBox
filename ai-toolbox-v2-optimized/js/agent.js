/* agent.js M3 - ReAct tool loop (provider-agnostic)
 * 对标 LangChain Tools / Coze 插件的最小浏览器实现 */
'use strict';
(function(){
  var TOOLS={}, MAXIT=4;
  function register(t){
    if(t&&t.name&&!TOOLS[t.name])TOOLS[t.name]=t;
  }
  function manual(){
    var names=[],k;
    for(k in TOOLS)names.push(TOOLS[k]);
    if(!names.length)return '';
    var lines=['[可用工具] 仅在确有需要时调用。'
      +'调用格式：单独输出一行以 TOOL_CALL: 开头，'
      +'紧跟JSON：{"tool":"工具名","args":{...}}。'
      +'收到[工具结果]后继续作答；'
      +'无需工具时直接正常回答，禁止提及TOOL_CALL。'];
    var i;
    for(i=0;i<names.length;i++){
      var t=names[i];
      lines.push('- '+t.name+'：'+t.desc
        +' 参数：'+JSON.stringify(t.params||{}));
    }
    return lines.join('\n');
  }
  function exec(name,args){
    var t=TOOLS[name];
    if(!t)return Promise.resolve('错误：未知工具 '+name);
    try{
      return Promise.resolve(t.run(args||{}))
        .then(function(r){
          return String(r===undefined?'（无输出）':r)
            .slice(0,500);
        });
    }catch(e){return Promise.resolve('错误：'+e.message);}
  }
  function parseTool(text){
    var s=String(text||'').trim();
    if(s.indexOf('TOOL_CALL:')!==0)return null;
    var j=s.slice(10),a=j.indexOf('{'),b=j.lastIndexOf('}');
    if(a<0||b<=a)return null;
    try{
      var o=JSON.parse(j.slice(a,b+1));
      return (o&&typeof o.tool==='string')?o:null;
    }catch(e){return null;}
  }
  function run(msgs,opt){
    opt=opt||{};
    var man=manual(),prefix='',signal=opt.signal;
    var base=msgs.slice();
    if(man)base=base.concat([{role:'system',content:man}]);
    function step(ms,n){
      if(n>MAXIT)return Promise.resolve(prefix);
      return llmChat(ms,{signal:signal,
        onProfile:opt.onProfile,
        onDelta:function(d,full){
          if(opt.onDelta)opt.onDelta(d,prefix+full);}})
      .then(function(text){
        var call=parseTool(text);
        if(!call)return prefix+text;
        var line='⚙ '+call.tool+'('
          +JSON.stringify(call.args||{})+')\n';
        if(opt.onDelta)opt.onDelta('',prefix+line);
        return exec(call.tool,call.args).then(function(res){
          prefix=prefix+line+'↳ '+res+'\n\n';
          if(opt.onEvent)try{opt.onEvent(call.tool,res);}
            catch(e){}
          return step(ms.concat([
            {role:'assistant',content:text},
            {role:'user',content:'[工具结果] '+res}
          ]),n+1);
        });
      });
    }
    return step(base,1);
  }
  register({name:'remember',
    desc:'把一条重要信息存入用户长期记忆',
    params:{content:'string,一句话'},
    run:function(a){
      var c=String(a.content||'').trim();
      if(!c)return '错误：缺少content';
      var n=window.Mem
        ?Mem.add([{type:'fact',content:c}],'agent'):0;
      return n?'已存入记忆':'重复或无效，未存入';
    }});
  register({name:'recall_memory',
    desc:'检索用户长期记忆，可按关键词过滤',
    params:{keyword:'string,可选'},
    run:function(a){
      if(!window.Mem)return '记忆系统未加载';
      var kw=String(a.keyword||''),arr=Mem.all(),r=[],i;
      for(i=arr.length-1;i>=0;i--){
        if(!kw||arr[i].content.indexOf(kw)>=0)
          r.push(arr[i].content);
        if(r.length>=10)break;
      }
      return r.length?r.join('\n'):'（暂无相关记忆）';
    }});
  register({name:'calc',desc:'计算数学表达式',
    params:{expr:'string,如 (1+2)*3'},
    run:function(a){
      var e=String(a.expr||'');
      if(!/^[0-9+\-*/().%\s]+$/.test(e))
        return '错误：表达式含非法字符';
      try{
        return String(Function('return ('+e+')')());
      }catch(err){return '错误：无法计算';}
    }});
  register({name:'get_time',desc:'获取当前日期时间',
    params:{},
    run:function(){return new Date().toLocaleString('zh-CN');}});
  register({name:'list_models',
    desc:'列出已配置模型及健康检测状态',
    params:{},
    run:function(){
      var ps=[],i,out=[];
      try{ps=getProfiles()||[];}catch(e){}
      for(i=0;i<ps.length;i++){
        if(ps[i].enabled===false)continue;
        var st='未检测';
        try{
          var c=ChatProbe.cache[ps[i].id];
          if(c)st=c.ok?('可用 '+c.ms+'ms')
            :('不可用 '+c.hint);
        }catch(e){}
        out.push((ps[i].name||'')+' · '
          +(ps[i].model||'')+'：'+st);
      }
      return out.length?out.join('\n'):'（无模型）';
    }});
  window.Agent={run:run,parseTool:parseTool,manual:manual};
  window.AgentTools={register:register};
})();
