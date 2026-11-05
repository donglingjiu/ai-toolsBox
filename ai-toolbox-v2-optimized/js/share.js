/* share.js P0-4 - conversation share (auto: PNG longpic | standalone HTML) */
'use strict';
(function(){
  function esc(s){return String(s).replace(/[&<>"']/g,function(c){ //qok
    return{'&':'&amp;','<':'&lt;','>':'&gt;',
      '"':'&quot;',"'":'&#39;'}[c];});} //qok
  function render(t){
    var h='';
    try{if(window.marked&&marked.parse)
      h=marked.parse(String(t||''));}catch(e){}
    if(!h)h='<p style="white-space:pre-wrap">'
      +esc(t)+'</p>';
    try{if(window.DOMPurify)h=DOMPurify.sanitize(h);}catch(e){}
    return h;
  }
  function msgsOf(c){
    var m=(c&&(c.msgs||c.messages))||[];
    return Array.isArray(m)?m:[];
  }
  function titleOf(c){
    var t=(c&&c.title)||'';
    if(!t||t==='\u65b0\u5bf9\u8bdd'){
      var m=msgsOf(c);
      if(m.length&&m[0].content)
        t=String(m[0].content).slice(0,24);
    }
    return t||'\u5bf9\u8bdd\u5206\u4eab';
  }
  function stats(c){
    var m=msgsOf(c),code=false,n=0,i;
    for(i=0;i<m.length;i++){
      n+=String(m[i].content||'').length;
      if(String(m[i].content||'').indexOf('\u0060\u0060\u0060')>=0)
        code=true;
    }
    return {n:m.length,chars:n,code:code};
  }
  function dl(name,blob){
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download=name;
    document.body.appendChild(a);a.click();
    setTimeout(function(){document.body.removeChild(a);
      URL.revokeObjectURL(a.href);},500);
  }
  function buildHTML(c){
    var m=msgsOf(c),i,h='';
    for(i=0;i<m.length;i++){
      var u=m[i].role==='user';
      h+='<div class="msg '+(u?'u':'a')+'">'
        +'<div class="who">'+(u?'\u6211':'AI')+'</div>'
        +'<div class="bubble">'
        +render(String(m[i].content||''))
        +'</div></div>';
    }
    var head='<!doctype html><html><head>'
      +'<meta charset="utf-8">'
      +'<meta name="viewport" content="width=device-width,initial-scale=1">'
      +'<title>'+esc(titleOf(c))+'</title><style>'
      +'body{margin:0;background:#f3f5f9;font-family:'
      +'-apple-system,"Segoe UI","PingFang SC",'
      +'"Microsoft YaHei",sans-serif;}'
      +'.wrap{max-width:760px;margin:0 auto;padding:24px 14px;}'
      +'h1{font-size:20px;color:#1f2937;}'
      +'.meta{color:#8a93a6;font-size:12px;margin-bottom:18px;}'
      +'.msg{margin:14px 0;display:flex;gap:10px;}'
      +'.msg.u{flex-direction:row-reverse;}'
      +'.who{font-size:12px;color:#8a93a6;padding-top:6px;}'
      +'.bubble{max-width:82%;background:#fff;border-radius:12px;'
      +'padding:10px 14px;font-size:14.5px;line-height:1.75;'
      +'color:#1f2937;box-shadow:0 1px 4px rgba(0,0,0,.06);'
      +'word-break:break-word;overflow-x:auto;}'
      +'.msg.u .bubble{background:#2563eb;}'
      +'.msg.u .bubble *{color:#fff!important;}'
      +'.bubble pre{background:#0f172a;color:#e2e8f0;'
      +'padding:10px;border-radius:8px;font-size:13px;}'
      +'.bubble code{background:rgba(37,99,235,.08);'
      +'border-radius:4px;padding:1px 4px;}'
      +'.msg.u .bubble code{background:rgba(255,255,255,.2);}'
      +'.bubble td,.bubble th{border:1px solid #e5e9f0;'
      +'padding:4px 8px;}'
      +'.foot{margin-top:26px;text-align:center;'
      +'color:#b6bdc9;font-size:12px;}'
      +'</style></head><body><div class="wrap">';
    var meta='<h1>'+esc(titleOf(c))+'</h1>'
      +'<div class="meta">'
      +new Date(c.ts||Date.now()).toLocaleString('zh-CN')
      +' \u00b7 '+m.length+' \u6761\u6d88\u606f'
      +' \u00b7 Nova \u5de5\u5177\u7bb1\u5bfc\u51fa</div>';
    return head+meta+h
      +'<div class="foot">Nova \u00b7 AI \u667a\u80fd\u5de5\u4f5c\u7a7a\u95f4</div>'
      +'</div></body></html>';
  }
  function shareHTML(c){
    dl('chat-share-'+Date.now()+'.html',
      new Blob([buildHTML(c)],{type:'text/html;charset=utf-8'}));
    try{toast('\u5df2\u5bfc\u51fa\u72ec\u7acbHTML\uff08\u957f\u5bf9\u8bdd/\u542b\u4ee3\u7801\uff09');}
    catch(e){}
  }
  function sharePNG(c){
    var m=msgsOf(c),host,i,k;
    host=document.createElement('div');
    host.style.cssText='position:fixed;left:-9999px;top:0;'
      +'width:720px;background:#f3f5f9;padding:24px;'
      +'font-family:-apple-system,"Segoe UI","PingFang SC",'
      +'"Microsoft YaHei",sans-serif;';
    var hd=document.createElement('div');
    hd.style.cssText='font-size:20px;font-weight:700;'
      +'color:#1f2937;margin-bottom:4px;';
    hd.textContent=titleOf(c);
    var mt=document.createElement('div');
    mt.style.cssText='font-size:12px;color:#8a93a6;'
      +'margin-bottom:16px;';
    mt.textContent=new Date(c.ts||Date.now())
      .toLocaleString('zh-CN')
      +' \u00b7 '+m.length+' \u6761\u6d88\u606f';
    host.appendChild(hd);host.appendChild(mt);
    for(i=0;i<m.length;i++){
      var u=m[i].role==='user';
      var row=document.createElement('div');
      row.style.cssText='margin:12px 0;display:flex;gap:10px;'
        +(u?'flex-direction:row-reverse;':'');
      var who=document.createElement('div');
      who.style.cssText='font-size:12px;color:#8a93a6;'
        +'padding-top:6px;flex:0 0 auto;';
      who.textContent=u?'\u6211':'AI';
      var bb=document.createElement('div');
      bb.style.cssText='max-width:82%;background:'
        +(u?'#2563eb':'#fff')
        +';border-radius:12px;padding:10px 14px;'
        +'font-size:14.5px;line-height:1.75;color:'
        +(u?'#fff':'#1f2937')
        +';box-shadow:0 1px 4px rgba(0,0,0,.06);'
        +'word-break:break-word;overflow-x:auto;';
      bb.innerHTML=render(String(m[i].content||''));
      if(u){
        var els=bb.querySelectorAll('*');
        for(k=0;k<els.length;k++)
          if(els[k].style)els[k].style.color='#fff';
      }
      row.appendChild(who);row.appendChild(bb);
      host.appendChild(row);
    }
    var ft=document.createElement('div');
    ft.style.cssText='margin-top:20px;text-align:center;'
      +'color:#b6bdc9;font-size:12px;';
    ft.textContent='Nova \u00b7 AI \u667a\u80fd\u5de5\u4f5c\u7a7a\u95f4';
    host.appendChild(ft);
    document.body.appendChild(host);
    var done=false;
    function finish(){
      if(done)return;done=true;
      try{document.body.removeChild(host);}catch(e){}
    }
    function go(){
      window.html2canvas(host,{backgroundColor:'#f3f5f9',
        scale:window.devicePixelRatio>1?2:1.5,useCORS:true})
        .then(function(cv){
          finish();
          try{toast('\u5df2\u5bfc\u51fa\u957f\u56fePNG');}catch(e){}
          cv.toBlob(function(bl){
            if(bl)dl('chat-share-'+Date.now()+'.png',bl);
            else shareHTML(c);
          },'image/png');
        })
        .catch(function(){finish();shareHTML(c);});
    }
    if(typeof window.html2canvas==='function'){go();return;}
    var sc=document.createElement('script');
    sc.src='js/vendor/html2canvas.min.js';
    sc.onload=function(){go();};
    sc.onerror=function(){finish();shareHTML(c);};
    document.head.appendChild(sc);
  }
  function share(c){
    if(!c)return;
    var st=stats(c);
    if(!st.n){try{toast('\u5f53\u524d\u5bf9\u8bdd\u4e3a\u7a7a');}catch(e){}return;}
    if(st.code||st.n>30||st.chars>6000)shareHTML(c);
    else sharePNG(c);
  }
  window.ChatShare={share:share,
    buildHTML:buildHTML,stats:stats};
})();
