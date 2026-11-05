/* ppt-illustrate.js P0-5 - per-slide AI image (imgBase /images/generations) */
'use strict';
(function(){
  function st(){
    var s=null;
    try{if(typeof getSettings==='function')s=getSettings();}catch(e){}
    if(!s){try{s=JSON.parse(
      localStorage.getItem('at_settings_v1')||'{}');}catch(e2){}}
    s=s||{};
    return {base:s.imgBase||'',key:s.imgKey||s.apiKey||'',
      model:s.imgModel||'gpt-image-1'};
  }
  function wrap(){
    if(typeof window.renderSlideHTML!=='function')return false;
    if(window.renderSlideHTML.__ill)return true;
    var orig=window.renderSlideHTML;
    var f=function(slide,theme,idx,total){
      var h=orig(slide,theme,idx,total);
      if(slide&&slide.img){
        var im='<img src="'+slide.img+'" alt="" '
          +'style="position:absolute;right:4.5%;top:22%;'
          +'width:37%;max-height:60%;object-fit:contain;'
          +'border-radius:12px;background:#fff;'
          +'box-shadow:0 6px 18px rgba(0,0,0,.15);">';
        h=h.replace(/<\/div>\s*$/,im+'</div>');
      }
      return h;
    };
    f.__ill=1;
    window.renderSlideHTML=f;
    return true;
  }
  function promptOf(sl){
    var pts=(sl.points||[]).slice(0,4).join('; ');
    return 'Flat modern illustration for a business '
      +'presentation slide. Title: '+(sl.title||'')
      +'. '+(pts?'Key points: '+pts+'. ':'')
      +'No text, no letters, no watermark. Clean vector style.';
  }
  function toData(url,cb){
    try{
      fetch(url).then(function(r){return r.blob();})
        .then(function(b){
          var fr=new FileReader();
          fr.onload=function(){cb(String(fr.result));};
          fr.onerror=function(){cb(null);};
          fr.readAsDataURL(b);
        }).catch(function(){cb(null);});
    }catch(e){cb(null);}
  }
  function syncBtn(){
    var b=document.getElementById('btnIll');
    if(!b)return;
    var sl=(deck&&deck.slides&&deck.slides[cur])||null;
    b.textContent=(sl&&sl.img)?'\u79fb\u9664\u914d\u56fe'
      :'AI\u914d\u56fe';
  }
  function rerender(){
    try{if(typeof renderAll==='function')renderAll();}catch(e){}
    syncBtn();
  }
  function gen(){
    if(!deck||!deck.slides||!deck.slides.length){
      try{toast('\u8bf7\u5148\u751f\u6210\u5927\u7eb2\u5e76\u4e00\u952e\u6210\u7a3f');}catch(e){}
      return;
    }
    var i=(typeof cur==='number')?cur:0;
    var sl=deck.slides[i];
    if(!sl)return;
    if(sl.img){delete sl.img;rerender();return;}
    if(sl.layout==='title'||sl.layout==='end'){
      try{toast('\u5c01\u5c3e\u9875\u4e0d\u914d\u56fe\uff0c\u8bf7\u7ffb\u5230\u5185\u5bb9\u9875');}catch(e){}
      return;
    }
    var s=st();
    if(!s.base){
      try{toast('\u8bf7\u5148\u5728\u8bbe\u7f6e\u914d\u7f6e\u56fe\u50cfAPI(imgBase)');}catch(e){}
      return;
    }
    var btn=document.getElementById('btnIll');
    if(btn){btn.disabled=true;
      btn.textContent='\u914d\u56fe\u751f\u6210\u4e2d\u2026';}
    fetch(s.base.replace(/\/+$/,'')+'/images/generations',{
      method:'POST',
      headers:{'Content-Type':'application/json',
        Authorization:'Bearer '+s.key},
      body:JSON.stringify({model:s.model,
        prompt:promptOf(sl),n:1,size:'1024x1024',
        response_format:'b64_json'})})
      .then(function(r){
        if(!r.ok)throw new Error('HTTP '+r.status);
        return r.json();})
      .then(function(j){
        var it=j&&j.data&&j.data[0],d=null;
        if(it&&it.b64_json)
          d='data:image/png;base64,'+it.b64_json;
        else if(it&&it.url)d=it.url;
        if(!d)throw new Error('\u8fd4\u56de\u65e0\u56fe\u7247');
        if(d.slice(0,5)==='data:'){
          sl.img=d;rerender();
          try{toast('\u5df2\u914d\u56fe\uff0cPPTX\u5bfc\u51fa\u5c06\u5305\u542b\u56fe\u7247');}catch(e){}
        }else{
          toData(d,function(du){
            sl.img=du||d;rerender();
            if(!du){try{toast('\u56fe\u7247\u4e3a\u5916\u94feURL\uff0cPPTX\u5bfc\u51fa\u53ef\u80fd\u65e0\u6b64\u56fe');}catch(e){}}
          });
        }
      })
      .catch(function(e){
        try{toast('\u914d\u56fe\u5931\u8d25:'+(e.message||e));}
      })
      .then(function(){
        if(btn)btn.disabled=false;
        syncBtn();
      });
  }
  function boot(){
    if(!wrap()){setTimeout(boot,300);return;}
    var nav=document.querySelector('.stage .nav');
    if(!nav||document.getElementById('btnIll'))return;
    var b=document.createElement('button');
    b.id='btnIll';
    b.onclick=gen;
    nav.appendChild(b);
    syncBtn();
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
