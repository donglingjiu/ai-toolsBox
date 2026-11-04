'use strict';
(function(){
  var CK='chat_probe_v1', TTL=600000, STRICT=false;
  var cache={};
  try{cache=JSON.parse(localStorage.getItem(CK)||'{}')}catch(e){}
  function saveC(){try{localStorage.setItem(CK,JSON.stringify(cache))}catch(e){}}
  function hintFor(code,body){
    if(code===401)return 'API Key 无效或过期';
    if(code===402)return '余额不足';
    if(code===403)return '无该模型权限';
    if(code===404)return '端点路径不对(需含 /v1)';
    if(code===429)return '限流中，稍后再试';
    if(code>=500)return '服务端错误 '+code;
    if(body)return 'HTTP '+code+' '+String(body).slice(0,80);
    return 'HTTP '+code;
  }
  function probe(p,signal){
    var t0=Date.now();
    var url=(p.endpoint||'').replace(/\/+$/,'')+'/chat/completions';
    var opt={method:'POST',signal:signal,
      headers:{'Content-Type':'application/json',
        'Authorization':'Bearer '+(p.key||'')},
      body:JSON.stringify({model:p.model||'',
        messages:[{role:'user',content:'ping'}],
        max_tokens:1,stream:false})};
    return fetch(url,opt).then(function(r){
      var ms=Date.now()-t0;
      if(r.ok)return{ok:true,ms:ms};
      return r.text().catch(function(){return '';}).then(function(t){
        return{ok:false,ms:ms,code:r.status,hint:hintFor(r.status,t)};});
    }).catch(function(e){
      if(e.name==='AbortError')return{ok:false,code:0,hint:'检测超时/取消'};
      return{ok:false,code:-1,hint:'网络不可达或CORS拦截'};
    });
  }
  function profiles(){try{return window.getProfiles?getProfiles()||[]:[]}catch(e){return[]}}
  function fresh(v){return !!(v&&v.ts&&(Date.now()-v.ts)<TTL)}
  function pname(p){return (p.name||'')+' · '+(p.model||'')}
  function paint(id,st){
    var sel=document.querySelector('#modelSel');if(!sel)return;
    var ps=profiles(),i,j,o,name;
    for(i=0;i<ps.length;i++){
      if(ps[i].id!==id)continue;
      name=pname(ps[i]);
      for(j=0;j<sel.options.length;j++){
        o=sel.options[j];
        if(o.value!==id)continue;
        if(st===null)o.textContent='⏳ '+name;
        else if(st.ok)o.textContent='✅ '+name+' ('+st.ms+'ms)';
        else if(STRICT){o.disabled=true;o.textContent='⛔ '+name+' — '+st.hint;}
        else o.textContent='❌ '+name+' — '+st.hint;
      }
    }
  }
  function probeOne(p){
    paint(p.id,null);
    var ac=new AbortController();
    var tm=setTimeout(function(){ac.abort();},15000);
    return probe(p,ac.signal).then(function(st){
      clearTimeout(tm);st.ts=Date.now();cache[p.id]=st;saveC();paint(p.id,st);
      return st;});
  }
  function probeAll(silent){
    var ps=profiles(),okN=0,seq=Promise.resolve();
    if(!ps.length){if(!silent)try{toast('无模型配置')}catch(e){}return;}
    ps.forEach(function(p){
      seq=seq.then(function(){return probeOne(p);})
        .then(function(st){if(st.ok)okN++;});
    });
    seq.then(function(){
      if(silent)return;
      try{toast('检测完成：'+okN+'/'+ps.length+' 可用');}
      catch(e){console.log('[probe]',okN+'/'+ps.length);}
    });
  }
  function init(){
    var top=document.querySelector('#top');
    if(top&&!document.querySelector('#probeBtn')){
      var b=document.createElement('button');
      b.id='probeBtn';b.textContent='检测模型';
      b.onclick=function(){probeAll(false);};
      var exp=document.querySelector('#expBtn');
      if(exp)top.insertBefore(b,exp);else top.appendChild(b);
    }
    var sel=document.querySelector('#modelSel');
    if(sel)sel.addEventListener('change',function(){
      var st=cache[sel.value];
      if(st&&!st.ok)try{toast('该模型上次检测失败：'+st.hint+'（仍可尝试）');}catch(e){}
    });
    var stale=profiles().filter(function(p){return !fresh(cache[p.id]);});
    if(stale.length)probeAll(true);
  }
  init();
  window.ChatProbe={run:probeAll,cache:cache};
})();
