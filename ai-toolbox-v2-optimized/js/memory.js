/* memory.js M2 - long-term memory (pure frontend)
 * LLM extract -> localStorage -> ChatHooks inject */
'use strict';
(function(){
  var KEY='memory_store_v1', CAP=200;
  var store=[], panel=null, done={};
  try{store=JSON.parse(localStorage.getItem(KEY)||'[]');}catch(e){store=[];}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
  function all(){return store.slice();}
  function add(items,src){
    var n=0,i,t,j,dup;
    if(!items||!items.length)return 0;
    for(i=0;i<items.length;i++){
      t=items[i]&&items[i].content;
      if(typeof t!=='string')continue;
      t=t.trim();
      if(t.length<4||t.length>120)continue;
      dup=false;
      for(j=0;j<store.length;j++){
        if(store[j].content===t){dup=true;break;}
      }
      if(dup)continue;
      store.push({id:'m'+Date.now().toString(36)+i,
        type:(items[i].type||'fact'),
        content:t,src:src||'auto',ts:Date.now()});
      n++;
    }
    while(store.length>CAP)store.shift();
    if(n)save();
    return n;
  }
  function del(id){
    store=store.filter(function(m){return m.id!==id;});
    save();render();
  }
  function clearAll(){store=[];save();render();}
  function context(){
    if(!store.length)return '';
    var recent=store.slice(-10),lines=[],i;
    for(i=0;i<recent.length;i++){
      lines.push('- '+recent[i].content
        +'（'+recent[i].type+'）');
    }
    return '[长期记忆 - 关于这位用户，回答时可参考]\n'
      +lines.join('\n');
  }
  function pickProfile(s){
    var ps=[];
    try{ps=(getProfiles()||[]).filter(function(p){
      return p&&p.enabled!==false;});}catch(e){}
    if(!ps.length)return null;
    var i;
    for(i=0;i<ps.length;i++){
      if(ps[i].id===s.profileId)return ps[i];
    }
    return ps[0];
  }
  var EX_SYS='你是记忆提取器。从对话中提取值得跨会话记住的信息：'
    +'用户身份/偏好、项目背景/约束、明确要求记住的事。'
    +'只输出JSON数组，每项{"type":"preference|fact|project",'
    +'"content":"一句话"}，最多3条，没有则输出[]。';
  function extract(s){
    var p=pickProfile(s);
    if(!p)return;
    var msgs=[{role:'system',content:EX_SYS}];
    var tail=s.messages.slice(-6),i;
    for(i=0;i<tail.length;i++){
      if(tail[i].content)
        msgs.push({role:tail[i].role,content:tail[i].content});
    }
    _llmCallProfile(p,msgs,{stream:false})
      .then(function(t){
        var j=String(t||'');
        var a=j.indexOf('['),b=j.lastIndexOf(']');
        if(a<0||b<=a)return;
        var arr=JSON.parse(j.slice(a,b+1));
        var n=add(arr,'auto');
        if(n){console.log('[mem] +',n);render();}
      })
      .catch(function(){});
  }
  function onExchange(s){
    try{
      if(!s||!s.messages||s.messages.length<2)return;
      var m=s.messages,lu=null,la=null,i;
      for(i=m.length-1;i>=0;i--){
        if(!la&&m[i].role==='assistant')la=m[i];
        else if(!lu&&m[i].role==='user')lu=m[i];
        if(lu&&la)break;
      }
      if(!la||!la.content)return;
      if(la.content.indexOf('⚠')>=0)return;
      if(done[s.id]>=m.length)return;
      done[s.id]=m.length;
      if(lu&&lu.content.indexOf('记住：')===0){
        add([{type:'fact',
          content:lu.content.slice(3)}],'manual');
        render();
        try{toast('已存入长期记忆');}catch(e){}
        return;
      }
      extract(s);
    }catch(e){}
  }
  window.ChatHooks={
    beforeSend:function(msgs){
      var c=context();
      if(!c)return msgs;
      var m={role:'system',content:c};
      if(msgs.length&&msgs[0].role==='system')
        return msgs.slice(0,1).concat([m],msgs.slice(1));
      return [m].concat(msgs);
    }
  };
  function render(){
    var n=document.getElementById('memN');
    if(n)n.textContent=store.length;
    var box=document.getElementById('memList');
    if(!box)return;
    box.innerHTML='';
    var i;
    for(i=store.length-1;i>=0;i--){
      (function(m){
        var li=document.createElement('div');
        li.style.cssText='display:flex;gap:6px;'
          +'align-items:flex-start;padding:6px 0;'
          +'border-bottom:1px solid #eee;';
        var sp=document.createElement('span');
        sp.style.cssText='flex:1;font-size:13px;';
        sp.textContent=m.content;
        var b=document.createElement('button');
        b.textContent='✕';
        b.style.cssText='border:0;background:none;'
          +'cursor:pointer;color:#999;';
        b.onclick=function(){del(m.id);};
        li.appendChild(sp);li.appendChild(b);
        box.appendChild(li);
      })(store[i]);
    }
  }
  function toggle(){
    if(!panel)return;
    var open=panel.style.display!=='none';
    panel.style.display=open?'none':'block';
    if(!open)render();
  }
  function init(){
    var top=document.getElementById('top');
    if(!top||document.getElementById('memBtn'))return;
    var b=document.createElement('button');
    b.id='memBtn';
    b.innerHTML='◆ 记忆<span id="memN">'
      +store.length+'</span>';
    b.onclick=toggle;
    var exp=document.getElementById('expBtn');
    if(exp)top.insertBefore(b,exp);
    else top.appendChild(b);
    panel=document.createElement('div');
    panel.id='memPanel';
    panel.style.cssText='display:none;position:fixed;'
      +'right:16px;bottom:100px;width:320px;max-height:60vh;'
      +'overflow:auto;background:#fff;border:1px solid #e5e9f0;'
      +'border-radius:12px;padding:12px;z-index:99;'
      +'box-shadow:0 8px 30px rgba(0,0,0,.12);';
    panel.innerHTML='<div style="font-weight:600;'
      +'margin-bottom:6px;">◆ 长期记忆（跨会话自动注入）'
      +'</div><div id="memList"></div>'
      +'<div style="margin-top:8px;text-align:right;">'
      +'<button id="memClear" style="border:0;background:none;'
      +'color:#c00;cursor:pointer;font-size:12px;">清空全部'
      +'</button></div>';
    document.body.appendChild(panel);
    var c=document.getElementById('memClear');
    if(c)c.onclick=function(){
      if(confirm('清空全部长期记忆？'))clearAll();
    };
  }
  init();
  window.Mem={all:all,add:add,del:del,clear:clearAll,
    context:context,onExchange:onExchange,render:render};
})();
