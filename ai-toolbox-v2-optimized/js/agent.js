/* agent.js M3.2 - ReAct tool loop v2
 * v2: tolerant parse + self-correct + loop guard */
'use strict';
(function(){
  var TOOLS={}, MAXIT=6;
  function register(t){
    if(t&&t.name&&!TOOLS[t.name])TOOLS[t.name]=t;
  }
  function stripFence(s){
    return s.replace(/\x60\x60\x60[^\n]*\n?/g,'')
      .replace(/\x60\x60\x60/g,'');
  }
  function manual(){
    var names=[],k;
    for(k in TOOLS)names.push(TOOLS[k]);
    if(!names.length)return '';
    var lines=['[可用工具] 确有需要才调用。'
      +'严格按一行输出：TOOL_CALL: '
      +'{"tool":"工具名","args":{...}}',
      '示例：TOOL_CALL: '
      +'{"tool":"calc","args":{"expr":"(1+2)*3"}}',
      '规则：任何数学计算必须调用calc，禁止心算；',/*MathCalcRule*/
      '收到[工具结果]后基于结果继续作答；'
      +'无需工具时直接正常回答，禁止输出TOOL_CALL字样。'];
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
    var s=stripFence(String(text||''));
    var i=s.indexOf('TOOL_CALL');
    if(i<0){/*BareCall*/
      var t2=s.trim().replace(/[\u3002.]\s*$/,'');
      var m2=t2.match(/^([A-Za-z_]\w*)\s*\(?\s*(\{[\s\S]*\})?\s*\)?$/);
      if(m2&&TOOLS[m2[1]]&&t2.length<200){
        var ag={};
        if(m2[2]){try{ag=JSON.parse(m2[2]);}catch(e){ag={};}}
        if(ag&&typeof ag==='object')
          return{tool:m2[1],args:ag};
      }
      return null;
    }
    var rest=s.slice(i+9).replace(/^[\s:：]+/,'');
    var a=rest.indexOf('{'),b=rest.lastIndexOf('}');
    var o=null,name=null,args={};
    if(a>=0&&b>a){
      try{o=JSON.parse(rest.slice(a,b+1));}
      catch(e){o=null;}
    }
    if(o){
      if(typeof o.tool==='string'){
        name=o.tool;
        args=(o.args&&typeof o.args==='object')?o.args:{};
      }else{args=o;}
    }
    if(!name){
      var m=rest.match(/^([A-Za-z_]\w*)/);
      if(m){name=m[1];}
      else if(o){
        var k,found=null,pk,hit;
        for(k in TOOLS){
          hit=0;
          for(pk in (TOOLS[k].params||{})){
            if(args&&(pk in args))hit++;
          }
          if(hit>0&&(!found||hit>found.h))
            found={n:k,h:hit};
        }
        if(found)name=found.n;
      }
    }
    if(!name||!TOOLS[name])return null;
    return {tool:name,args:args||{}};
  }
  function cleanTrace(mm){
    if(mm.role!=='assistant')return mm;
    var t=String(mm.content||'')
      .split('\n').filter(function(L){
        return L.indexOf('\u2699')!==0
          &&L.indexOf('\u21B3')!==0
          &&L.indexOf('\uff08\u5de5\u5177\u8c03\u7528')!==0;})
      .join('\n');
    return {role:'assistant',content:t};}
  function preCalc(base){
    var idx=-1,i,t,out=[],seen={};
    for(i=base.length-1;i>=0;i--){
      if(base[i].role==='user'){idx=i;break;}
    }
    if(idx<0)return;
    t=String(base[idx].content||'');
    var re=/[0-9(][0-9+\-*/().%\s]*[0-9)%]/g,m;
    while((m=re.exec(t))){
      var e=m[0].replace(/\s+/g,''),at=m.index;
      if(at>0&&/[A-Za-z0-9=_%]/.test(t.charAt(at-1)))continue;
      if(e.length<3||e.length>60||seen[e])continue;
      seen[e]=1;
      if(!/[+\-*/%]/.test(e))continue;
      if(/^\d+([\/.\-]\d+)+$/.test(e)
        &&e.split(/[\/.\-]/).length-1>=2)continue;
      var p=0,q=0,j;
      for(j=0;j<e.length;j++){
        if(e.charAt(j)==='(')p++;
        else if(e.charAt(j)===')')q++;
      }
      while(q>p){e='('+e;p++;}
      while(p>q){e=e+')';q++;}
      try{
        var v=Function('return ('+e+')')();
        if(typeof v==='number'&&isFinite(v))
          out.push(e+' = '+v);
      }catch(err){}
      if(out.length>=4)break;
    }
    if(!out.length)return;
    base[idx]={role:'user',content:t
      +'\n\n[系统计算器] 算式已预先计算：'
      +out.join('；')
      +'。若这已完整覆盖用户问题，直接引用结果；'
      +'若问题还含其它运算，请对完整算式调用calc。'};
  }
  function run(msgs,opt){
    opt=opt||{};
    var man=manual(),prefix='',signal=opt.signal;
    var base=msgs.slice().map(cleanTrace),lastSig='';
    if(man)base=base.concat([{role:'system',content:man}]);
    preCalc(base);
    function step(ms,n){
      if(n>MAXIT)
        return Promise.resolve(prefix+'（工具调用已达上限）');
      return llmChat(ms,{signal:signal,
        onProfile:opt.onProfile,
        onDelta:function(d,full){
          if(opt.onDelta)opt.onDelta(d,prefix+full);}})
      .then(function(text){
        var call=parseTool(text);
        if(!call){
          if(String(text).indexOf('TOOL_CALL')>=0){
            if(opt.onDelta)opt.onDelta('',
              prefix+'⚙ 正在解析工具调用…\n');
            return step(ms.concat([
              {role:'assistant',content:text},
              {role:'user',content:'格式有误。严格输出一行：'
                +'TOOL_CALL: {"tool":"工具名","args":{...}}'
                +'，或直接给出最终回答（不要出现TOOL_CALL）。'}
            ]),n+1);
          }
          return prefix+text;
        }
        var sig=call.tool+'|'+JSON.stringify(call.args||{});
        if(sig===lastSig)return prefix;
        lastSig=sig;
        var line='⚙ '+call.tool+'('
          +JSON.stringify(call.args||{})+')\n';
        if(opt.onDelta)opt.onDelta('',prefix+line);
        return exec(call.tool,call.args).then(function(res){
          prefix=prefix+line+'↳ '+res+'\n\n';
          if(opt.onDelta)opt.onDelta('',prefix);
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
