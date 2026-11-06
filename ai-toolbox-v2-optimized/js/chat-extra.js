/* chat-extra.js P1-3g - fork v7: storage order aligned to
   display order (updatedAt desc) so engine open-mapping
   cannot misindex + v6 double-signed storage + v4 incognito */
'use strict';
(function(){
  var RK='chat_sessions_v1';
  var SK='at_temp_snap_v3';
  var OLD='at_temp_snap_v2';
  var on=false;
  function toastS(m){try{toast(m);}catch(e){}}
  function takeSnapshot(){
    var d={},i,k,n=localStorage.length;
    for(i=0;i<n;i++){
      k=localStorage.key(i);
      if(k===SK)continue;
      d[k]=localStorage.getItem(k);
    }
    return d;
  }
  function applyRestore(d){
    var k,i,cur=[];
    for(i=0;i<localStorage.length;i++){
      cur.push(localStorage.key(i));
    }
    for(i=0;i<cur.length;i++){
      if(!(cur[i] in d))
        localStorage.removeItem(cur[i]);
    }
    for(k in d){
      if(d[k]===null||d[k]===undefined)continue;
      localStorage.setItem(k,d[k]);
    }
  }
  function snapRestore(){
    var s=null,d=null;
    try{s=localStorage.getItem(SK);}catch(e){}
    if(s===null)return false;
    try{d=JSON.parse(s);}catch(e2){d=null;}
    try{localStorage.removeItem(SK);}catch(e3){}
    if(!d)return false;
    applyRestore(d);
    return true;
  }
  (function migrateV3(){
    var s=null,d=null;
    try{s=sessionStorage.getItem(OLD);}catch(e){}
    if(s===null)return;
    try{d=JSON.parse(s);}catch(e2){d=null;}
    try{sessionStorage.removeItem(OLD);}catch(e3){}
    if(d)applyRestore(d);
  })();
  (function restoreOnLoad(){
    var s=null,d=null;
    try{s=localStorage.getItem(SK);}catch(e){}
    if(s===null)return;
    try{d=JSON.parse(s);}catch(e2){d=null;}
    try{localStorage.removeItem(SK);}catch(e3){}
    if(d)applyRestore(d);
  })();
  function banner(){
    var b=document.getElementById('cxBan');
    if(on&&!b){
      b=document.createElement('div');
      b.id='cxBan';
      b.style.cssText='position:fixed;left:50%;bottom:96px;'
        +'transform:translateX(-50%);z-index:9999;'
        +'background:#111827;color:#fff;padding:6px 16px;'
        +'border-radius:999px;font-size:12.5px;'
        +'box-shadow:0 6px 18px rgba(0,0,0,.3);';
      b.textContent='\u4e34\u65f6\u804a\u5929\u4e2d \u00b7 \u5237\u65b0/\u5173\u95ed\u540e\u81ea\u52a8\u8fd8\u539f';
      document.body.appendChild(b);
    }
    if(!on&&b&&b.parentNode)b.parentNode.removeChild(b);
  }
  function setBtn(){
    var b=document.getElementById('cxTmp');
    if(b)b.textContent=on?'\u25cf \u4e34\u65f6\u4e2d'
      :'\u25cb \u4e34\u65f6\u804a\u5929';
  }
  function norm(x){
    return String(x===null||x===undefined?'':x)
      .replace(/\s+/g,'');
  }
  function deriveTitle(s){
    if(s&&s.title
      &&s.title.slice(-3)==='\u00b7\u5206\u53c9')return s.title;
    if(s&&s.messages&&s.messages.length){
      var c0=s.messages[0].content;
      if(c0)return String(c0).slice(0,18);
    }
    return (s&&s.title)||'';
  }
  function msgText(el){
    var ps=el.querySelectorAll('p');
    var out='',i;
    for(i=0;i<ps.length;i++)out+=ps[i].textContent;
    if(!out)out=el.textContent||'';
    out=out.split('\u5206\u53c9').join('');
    return out.trim();
  }
  function msgIndex(el){
    var p=el.parentElement;
    if(!p)return -1;
    var idx=-1,n,ch=p.children;
    for(n=0;n<ch.length;n++){
      if((' '+ch[n].className+' ').indexOf(' msg ')>=0){
        idx++;
        if(ch[n]===el)return idx;
      }
    }
    return -1;
  }
  function domCount(el){
    var p=el.parentElement,n,c=0,ch=p?p.children:[];
    for(n=0;n<ch.length;n++){
      if((' '+ch[n].className+' ').indexOf(' msg ')>=0)c++;
    }
    return c;
  }
  function findSrc(){
    var arr=null,i;
    try{arr=JSON.parse(
      localStorage.getItem(RK)||'[]');}catch(e){return null;}
    if(!arr||!arr.length)return null;
    var tt=document.querySelector('.sess.on .t');
    var t=tt?tt.textContent:'';
    if(!t)return null;
    for(i=0;i<arr.length;i++){
      if(deriveTitle(arr[i])===t)return arr[i];
    }
    return null;
  }
  function locateIdx(src,msgEl){
    var key=norm(msgText(msgEl)),i,j;
    var steps=[40,20,10,6];
    for(j=0;j<steps.length;j++){
      var k2=key.slice(0,steps[j]);
      if(!k2)break;
      for(i=src.messages.length-1;i>=0;i--){
        var m=src.messages[i];
        if(m&&m.role==='assistant'
          &&norm(m.content).indexOf(k2)>=0)return i;
      }
    }
    if(domCount(msgEl)===src.messages.length)
      return msgIndex(msgEl);
    return -1;
  }
  function doFork(msgEl){
    if(on){
      toastS('\u4e34\u65f6\u6a21\u5f0f\u4e0b\u4e0d\u53ef\u5206\u53c9\uff0c'
        +'\u8bf7\u5148\u5173\u95ed\u4e34\u65f6\u804a\u5929');
      return;
    }
    var src=findSrc();
    if(!src||!src.messages||!src.messages.length){
      toastS('\u5206\u53c9\u5931\u8d25:\u672a\u627e\u5230\u6e90\u4f1a\u8bdd');
      return;
    }
    var idx=locateIdx(src,msgEl);
    if(idx<0){
      toastS('\u5206\u53c9\u5931\u8d25:\u6d88\u606f\u672a\u5bf9\u9f50');
      return;
    }
    var arr=null;
    try{arr=JSON.parse(
      localStorage.getItem(RK)||'[]');}catch(e){}
    if(!arr){
      toastS('\u5206\u53c9\u5931\u8d25:\u5386\u53f2\u8bfb\u53d6\u5f02\u5e38');
      return;
    }
    var fork=JSON.parse(JSON.stringify(src));
    fork.id=Date.now().toString(36)
      +Math.random().toString(36).slice(2,7);
    fork.updatedAt=Date.now();
    fork.messages=src.messages.slice(0,idx+1);
    var _bt=deriveTitle(src);
    if(_bt.slice(-3)==='\u00b7\u5206\u53c9')
      _bt=_bt.slice(0,-3);
    fork.title=_bt+'\u00b7\u5206\u53c9';
    if('msgs' in fork)fork.msgs=[];
    arr.push(fork);
    arr.sort(function(a,b){
      return (b.updatedAt||0)-(a.updatedAt||0);
    });
    var blob=JSON.stringify(arr.slice(0,50));
    try{localStorage.setItem(RK,blob);}catch(e){}
    var opened=false;
    try{
      if(typeof load==='function'
        &&typeof renderAll==='function'
        &&typeof sessions!=='undefined'){
        load();
        window.curId=fork.id;
        renderAll();
        opened=true;
      }
    }catch(e2){opened=false;}
    if(opened){
      toastS('\u5206\u53c9\u5df2\u5efa\uff0c\u5df2\u6253\u5f00');
    }else{
      toastS('\u5206\u53c9\u5df2\u5efa\uff0c\u6b63\u5728\u6253\u5f00\u2026');
      setTimeout(function(){location.reload();},600);
    }
  }
  function sweep(){
    var ms=document.querySelectorAll('div.msg.assistant'),i;
    for(i=0;i<ms.length;i++){
      if(ms[i].getAttribute('data-fk'))continue;
      var _st=ms[i].querySelector('.st');
      var _tl=(ms[i].textContent||'').length
        -(_st?(_st.textContent||'').length:0);
      if(_tl<2)continue;
      ms[i].setAttribute('data-fk','1');
      var b=document.createElement('button');
      b.className='fk-act';
      b.textContent='\u5206\u53c9';
      b.style.cssText='font-size:11px;opacity:.55;'
        +'background:none;border:1px solid #c9cfdd;'
        +'border-radius:999px;padding:1px 9px;'
        +'cursor:pointer;margin-top:4px;color:#5b6472;';
      b.onmouseenter=function(){this.style.opacity='1';};
      b.onmouseleave=function(){this.style.opacity='.55';};
      b.onclick=(function(el){return function(ev){
        ev.stopPropagation();
        doFork(el);
      };})(ms[i]);
      ms[i].appendChild(b);
    }
  }
  function boot(){
    if(document.getElementById('cxTmp'))return;
    var b=document.createElement('button');
    b.id='cxTmp';
    b.textContent='\u25cb \u4e34\u65f6\u804a\u5929';
    b.style.cssText='position:fixed;left:14px;bottom:14px;'
      +'z-index:9998;background:#fff;'
      +'border:1px solid #d9dee8;border-radius:999px;'
      +'padding:6px 14px;font-size:12.5px;cursor:pointer;'
      +'box-shadow:0 2px 10px rgba(0,0,0,.08);';
    b.onclick=function(){
      on=!on;
      if(on){
        var ok=false;
        try{localStorage.setItem(SK,
          JSON.stringify(takeSnapshot()));ok=true;}catch(e){}
        if(!ok){on=false;
          try{toast('\u5386\u53f2\u6570\u636e\u8fc7\u5927\uff0c'
            +'\u4e34\u65f6\u6a21\u5f0f\u4e0d\u53ef\u7528','err');}catch(e2){}
          return;}
        banner();setBtn();
        toastS('\u5df2\u5f00\u542f\u4e34\u65f6\u804a\u5929\uff0c'
          +'\u5237\u65b0\u6216\u5173\u95ed\u5373\u8fd8\u539f');
        return;
      }
      banner();setBtn();
      if(confirm('\u7ed3\u675f\u5f53\u524d\u4e34\u65f6\u804a\u5929\uff1f'
        +'\u672a\u4fdd\u5b58\u5185\u5bb9\u5c06\u4e22\u5f03\uff0c'
        +'\u9875\u9762\u5237\u65b0\u56de\u5230\u771f\u5b9e\u4f1a\u8bdd\u3002')){
        snapRestore();
        location.reload();
      }else{on=true;banner();setBtn();}
    };
    document.body.appendChild(b);
    sweep();
    if(typeof MutationObserver!=='undefined'){
      var mo=new MutationObserver(sweep);
      mo.observe(document.body,{childList:true,subtree:true});
    }else{
      setInterval(sweep,900);
    }
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
