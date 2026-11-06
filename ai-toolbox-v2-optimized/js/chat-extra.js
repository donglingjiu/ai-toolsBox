/* chat-extra.js P1-3d - incognito v4: snapshot-in-storage, restore-on-load-first-script */
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
  function msgIndex(el){
    var inner=document.getElementById('inner');
    if(!inner)return -1;
    var idx=-1,n,ch=inner.children;
    for(n=0;n<ch.length;n++){
      if((' '+ch[n].className+' ').indexOf(' msg ')>=0){
        idx++;
        if(ch[n]===el)return idx;
      }
    }
    return -1;
  }
  function curId(){
    var it=document.querySelector('.sess-item.cur');
    return it?it.getAttribute('data-id'):null;
  }
  function doFork(msgEl){
    if(!msgEl)return;
    var sb=document.getElementById('sendBtn');
    if(sb&&(' '+sb.className+' ').indexOf(' stop ')>=0){
      toastS('\u751f\u6210\u4e2d\u6682\u4e0d\u80fd\u5206\u53c9');return;
    }
    var idx=msgIndex(msgEl);
    if(idx<0){toastS('\u5206\u53c9\u5931\u8d25:\u672a\u5b9a\u4f4d\u6d88\u606f');return;}
    var cid=curId();
    if(!cid){toastS('\u5206\u53c9\u5931\u8d25:\u672a\u627e\u5230\u5f53\u524d\u4f1a\u8bdd');return;}
    var arr=null,i;
    try{arr=JSON.parse(localStorage.getItem(RK)||'[]');}catch(e){}
    if(!arr||!arr.length){toastS('\u5206\u53c9\u5931\u8d25:\u5386\u53f2\u4e3a\u7a7a');return;}
    var src=null;
    for(i=0;i<arr.length;i++){
      if(String(arr[i].id)===String(cid)){src=arr[i];break;}
    }
    if(!src||!src.msgs||!src.msgs.length){
      toastS('\u5206\u53c9\u5931\u8d25:\u6e90\u4f1a\u8bdd\u5f02\u5e38');return;
    }
    if(idx>=src.msgs.length)idx=src.msgs.length-1;
    var fork={id:Date.now().toString(36)
        +Math.random().toString(36).slice(2,7),
      title:(src.title||'\u65b0\u5bf9\u8bdd')
        +'\u00b7\u5206\u53c9',
      ts:Date.now(),
      msgs:JSON.parse(JSON.stringify(
        src.msgs.slice(0,idx+1)))};
    arr.push(fork);
    try{localStorage.setItem(RK,JSON.stringify(
      arr.slice(0,50)));}catch(e){}
    toastS(on?'\u5df2\u5206\u53c9(\u4e34\u65f6\u6a21\u5f0f\u4e0d\u843d\u76d8\uff0c\u5237\u65b0\u540e\u6d88\u5931)'
      :'\u5206\u53c9\u5df2\u5efa\uff0c\u6b63\u5728\u6253\u5f00\u2026');
    if(!on)setTimeout(function(){location.reload();},600);
  }
  function sweep(){
    var bars=document.querySelectorAll(
      '.msg.ai .msg-actions'),i;
    for(i=0;i<bars.length;i++){
      if(bars[i].getAttribute('data-fk'))continue;
      bars[i].setAttribute('data-fk','1');
      var b=document.createElement('button');
      b.className='act';
      b.textContent='\u5206\u53c9';
      b.onclick=(function(bar){
        return function(){
          doFork(bar.closest('.msg'));
        };
      })(bars[i]);
      bars[i].appendChild(b);
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
          try{toast('\u5386\u53f2\u6570\u636e\u8fc7\u5927\uff0c\u4e34\u65f6\u6a21\u5f0f\u4e0d\u53ef\u7528','err');}catch(e2){}
          return;}
        banner();setBtn();
        toastS('\u5df2\u5f00\u542f\u4e34\u65f6\u804a\u5929\uff0c\u5237\u65b0\u6216\u5173\u95ed\u5373\u8fd8\u539f');
        return;
      }
      banner();setBtn();
      if(confirm('\u7ed3\u675f\u4e34\u65f6\u804a\u5929\uff1f\u672a\u4fdd\u5b58\u5185\u5bb9\u5c06\u4e22\u5f03\uff0c\u9875\u9762\u5237\u65b0\u56de\u5230\u771f\u5b9e\u4f1a\u8bdd\u3002')){
        snapRestore();
        location.reload();
      }else{on=true;banner();setBtn();}
    };
    document.body.appendChild(b);
    sweep();
    if(typeof MutationObserver!=='undefined'){
      var mo=new MutationObserver(sweep),tg;
      tg=document.getElementById('inner');
      if(tg)mo.observe(tg,{childList:true,subtree:true});
    }else{
      setInterval(sweep,900);
    }
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
