/* ppt-brand.js P0-3 - manual brand palette (deterministic, no LLM) */
'use strict';
(function(){
  function hexOf(v){var s=String(v||'').replace('#','').toUpperCase();
    return /^[0-9A-F]{6}$/.test(s)?s:null;}
  function lum(h){
    var r=parseInt(h.slice(0,2),16)/255,
      g=parseInt(h.slice(2,4),16)/255,
      b=parseInt(h.slice(4,6),16)/255;
    return 0.2126*r+0.7152*g+0.0722*b;}
  function curKey(){
    try{return localStorage.getItem('at_ppt_theme')||'business';}
    catch(e){return 'business';}}
  function boot(){
    var host=document.getElementById('aiThemeBadge');
    if(!host||typeof PPT_THEMES==='undefined')return;
    var card=host.closest('.aicard')||host.parentNode;
    var box=document.createElement('div');
    box.style.cssText='margin-top:10px;padding-top:10px;'
      +'border-top:1px dashed #ddd;';
    var lab=document.createElement('div');
    lab.style.cssText='font-size:12.5px;font-weight:700;';
    lab.textContent='\u6211\u7684\u54c1\u724c\u8272\u677f';
    box.appendChild(lab);
    var row=document.createElement('div');
    row.style.cssText='display:flex;gap:8px;flex-wrap:wrap;'
      +'margin-top:8px;align-items:flex-end;';
    var defs=[['bg','\u80cc\u666f'],['band','\u8f85\u52a9\u5e26'],
      ['accent','\u5f3a\u8c03'],['title','\u6807\u9898'],
      ['text','\u6b63\u6587']];
    var inputs={};
    var base=PPT_THEMES[curKey()]||PPT_THEMES.business;
    defs.forEach(function(d){
      var wrap=document.createElement('label');
      wrap.style.cssText='font-size:11px;color:#8a93a6;'
        +'display:flex;flex-direction:column;gap:2px;'
        +'align-items:center;';
      var inp=document.createElement('input');
      inp.type='color';
      inp.value='#'+(base[d[0]]||'FFFFFF');
      inp.style.cssText='width:34px;height:26px;padding:0;'
        +'border:1px solid #ddd;border-radius:6px;'
        +'background:none;cursor:pointer;';
      inputs[d[0]]=inp;
      wrap.appendChild(inp);
      var sp=document.createElement('span');sp.textContent=d[1];
      wrap.appendChild(sp);
      row.appendChild(wrap);
    });
    var btn=document.createElement('button');
    btn.className='btn ghost';
    btn.style.cssText='font-size:12px;padding:5px 12px;';
    btn.textContent='\u5e94\u7528\u54c1\u724c\u4e3b\u9898';
    row.appendChild(btn);
    box.appendChild(row);
    var hint=document.createElement('div');
    hint.style.cssText='font-size:11.5px;color:#8a93a6;'
      +'margin-top:6px;';
    box.appendChild(hint);
    btn.onclick=function(){
      var o={name:'\u6211\u7684\u54c1\u724c'},bad=null;
      defs.forEach(function(d){
        var v=hexOf(inputs[d[0]].value);
        if(!v)bad=d[0];
        o[d[0]]=v;});
      if(bad){hint.textContent='\u989c\u8272\u4e0d\u5408\u6cd5:'
        +bad;return;}
      o.muted=o.text;
      o.dark=lum(o.bg)<0.4;
      var t=validTheme(o);
      if(!t){hint.textContent='\u914d\u8272\u6821\u9a8c\u672a\u901a'
        +'\u8fc7\uff0c\u8bf7\u63d0\u9ad8\u5bf9\u6bd4\u5ea6';return;}
      PPT_THEMES.custom=t;
      try{localStorage.setItem('at_ppt_custom_theme',
        JSON.stringify(t));}catch(e){}
      if(typeof fillThemeSel==='function')fillThemeSel('custom');
      if(typeof pickTheme==='function')pickTheme('custom');
      hint.textContent='\u5df2\u5e94\u7528\u300c'+t.name
        +'\u300d\uff0c\u5237\u65b0\u540e\u4e0b\u62c9\u53ef\u627e\u56de';
    };
    card.appendChild(box);
    var saved=null;
    try{saved=JSON.parse(
      localStorage.getItem('at_ppt_custom_theme')||'null');}catch(e){}
    if(saved&&!PPT_THEMES.custom){
      var t2=validTheme(saved);
      if(t2){PPT_THEMES.custom=t2;
        if(typeof fillThemeSel==='function')
          fillThemeSel(curKey());}}
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
