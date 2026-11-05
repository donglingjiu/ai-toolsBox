/* skill.js M6 - Skill runtime v2 (PROMPT_TOOLS + imported .md)
 * lazy-load; search+cat; apply; import/delete customs */
'use strict';
(function(){
  var panel=null,list=null;
  function customs(){
    try{return JSON.parse(
      localStorage.getItem('skills_custom_v1')||'[]');}
    catch(e){return [];}}
  function saveCustoms(a){
    try{localStorage.setItem(
      'skills_custom_v1',JSON.stringify(a));}catch(e){}}
  function lib(){
    var base=[];
    try{if(typeof PROMPT_TOOLS!=='undefined')
      base=PROMPT_TOOLS||[];}catch(e){}
    return base.concat(customs());
  }
  function parseMd(txt){
    var s=String(txt||'').replace(/\r\n/g,'\n').trim();
    var name='',body=s,m=s.match(/^---\n([\s\S]*?)\n---\n?/);
    if(m){
      var nm=m[1].match(/^name:\s*(.+)$/m);
      if(nm)name=nm[1].trim();
      body=s.slice(m[0].length).trim();
    }
    if(!name){
      var h=body.match(/^#\s+(.+)$/m);
      name=h?h[1].trim()
        :('Imported skill'+new Date().toISOString()
          .slice(5,10));
    }
    return {id:'c'+Date.now(),
      name:name.slice(0,40),cat:'custom',score:0,
      prompt:body.slice(0,6000)};
  }
  function ensureLib(cb){
    if(typeof PROMPT_TOOLS!=='undefined')return cb(true);
    var s=document.createElement('script');
    s.src='js/prompts.js?v=1';
    s.onload=function(){
      cb(typeof PROMPT_TOOLS!=='undefined');};
    s.onerror=function(){cb(false);};
    document.head.appendChild(s);
  }
  function esc(s){
    return String(s).replace(/[&<>"]/g,function(c){
      return{'&':'&amp;','<':'&lt;','>':'&gt;',
        '"':'&quot;'}[c];});
  }
  function cats(){
    var L=lib(),d={},r=[],i,k;
    for(i=0;i<L.length;i++)d[L[i].cat||'其他']=1;
    for(k in d)r.push(k);
    return r.sort();
  }
  function matches(it,kw,cat){
    if(cat&&cat!=='*'
      &&(it.cat||'其他')!==cat)return false;
    if(!kw)return true;
    var k=kw.toLowerCase();
    return ((it.name||'')+' '+(it.cat||''))
      .toLowerCase().indexOf(k)>=0
      ||(it.prompt||'').indexOf(kw)>=0;
  }
  function sysInput(){
    var i=document.querySelector(
      'input[placeholder*="系统提示词"]');
    if(i)return i;
    var t=document.querySelectorAll('#top input');
    return t.length?t[0]:null;
  }
  function setSys(v,msg){
    var el=sysInput();
    if(!el){try{toast('未找到系统提示词输入框');}
      catch(e){}return;}
    el.value=v;
    try{el.dispatchEvent(
      new Event('input',{bubbles:true}));}catch(e){}
    try{toast(msg);}catch(e){}
    toggle();
  }
  function apply(it){
    try{localStorage.setItem(
      'skill_last_v1',it.name||'');}catch(e){}
    setSys(it.prompt||'','已应用技能：'+(it.name||''));
  }
  function render(kw,cat){
    if(!list)return;
    list.innerHTML='';
    var L=lib().slice().sort(function(a,b){
      return (b.score||0)-(a.score||0);});
    var n=0,i,over=0;
    for(i=0;i<L.length;i++){
      if(!matches(L[i],kw,cat))continue;
      n++;
      if(n>80){over=1;continue;}
      (function(it){
        var row=document.createElement('div');
        row.style.cssText='padding:7px 4px;'
          +'border-bottom:1px solid #eee;cursor:pointer;';
        row.innerHTML='<b>'+esc(it.name||'未命名')
          +'</b> <span style="color:#888;font-size:12px;">'
          +esc(it.cat||'')+' · '+(it.score||'-')+'分</span>';
        row.title=(it.prompt||'').slice(0,120);
        row.onclick=function(){apply(it);};
        if(it.cat==='custom'){
          var d=document.createElement('span');
          d.textContent=' ✕';
          d.style.cssText='color:#c00;cursor:pointer;'
            +'font-size:12px;float:right;';
          d.onclick=function(ev){
            ev.stopPropagation();
            saveCustoms(customs().filter(function(x){
              return x.id!==it.id;}));
            render(kw,cat);
          };
          row.appendChild(d);
        }
        list.appendChild(row);
      })(L[i]);
    }
    if(!n)list.innerHTML=
      '<div style="color:#999;padding:8px;">无匹配技能</div>';
    else if(over){
      var tip=document.createElement('div');
      tip.style.cssText='color:#999;font-size:12px;padding:6px;';
      tip.textContent='结果过多，仅显示前80条，请搜索缩小范围';
      list.appendChild(tip);
    }
  }
  function refreshHead(){
    var cs=cats(),i,h='<option value="*">全部分类</option>';
    for(i=0;i<cs.length;i++)
      h+='<option value="'+esc(cs[i])+'">'
        +esc(cs[i])+'</option>';
    var sel=document.getElementById('skillC');
    if(sel)sel.innerHTML=h;
    var n=document.getElementById('skillN');
    if(n)n.textContent=' 共'+lib().length+'个';
  }
  function onFile(){
    var fi=document.getElementById('skillFile');
    return function(){
      var f=fi.files&&fi.files[0];
      if(!f)return;
      if(f.size>200*1024){
        try{toast('文件过大（限200KB）');}catch(e){}
        fi.value='';return;
      }
      var r=new FileReader();
      r.onload=function(){
        var it=parseMd(r.result);
        var arr=customs().filter(function(x){
          return x.name!==it.name;});
        arr.push(it);
        if(arr.length>20)arr=arr.slice(-20);
        saveCustoms(arr);
        fi.value='';
        try{toast('技能已导入：'+it.name);}catch(e){}
        refreshHead();
        var sel=document.getElementById('skillC');
        if(sel)sel.value='custom';
        render('','custom');
      };
      r.readAsText(f,'utf-8');
    };
  }
  function buildPanel(){
    panel=document.createElement('div');
    panel.id='skillPanel';
    panel.style.cssText='display:none;position:fixed;'
      +'right:16px;bottom:100px;width:360px;max-height:70vh;'
      +'overflow:auto;background:#fff;border:1px solid #e5e9f0;'
      +'border-radius:12px;padding:12px;z-index:99;'
      +'box-shadow:0 8px 30px rgba(0,0,0,.12);';
    panel.innerHTML='<div style="font-weight:600;'
      +'margin-bottom:6px;">⚡ 技能库'
      +'<span id="skillN" style="color:#888;font-weight:400;'
      +'font-size:12px;"></span></div>'
      +'<div style="display:flex;gap:6px;margin-bottom:6px;">'
      +'<input id="skillQ" placeholder="搜索技能…"'
      +' style="flex:1;padding:5px 8px;'
      +'border:1px solid #ddd;border-radius:8px;">'
      +'<select id="skillC" style="padding:5px;'
      +'border:1px solid #ddd;border-radius:8px;'
      +'max-width:110px;"><option value="*">全部分类</option>'
      +'</select></div>'
      +'<div id="skillList"></div>'
      +'<div style="margin-top:8px;display:flex;'
      +'justify-content:space-between;align-items:center;">'
      +'<button id="skillImp" style="border:1px solid #ddd;'
      +'background:#fff;border-radius:8px;padding:4px 10px;'
      +'cursor:pointer;font-size:12px;">导入.md技能<
      +'<button id="skillClr" style="border:0;background:none;'
      +'color:#c00;cursor:pointer;font-size:12px;">'
      +'清空系统提示词</button></div>'
      +'<input id="skillFile" type="file"'
      +' accept=".md,text/markdown" style="display:none;">';
    document.body.appendChild(panel);
    list=document.getElementById('skillList');
    var q=document.getElementById('skillQ');
    var sel=document.getElementById('skillC');
    q.oninput=function(){render(q.value.trim(),sel.value);};
    sel.onchange=function(){render(q.value.trim(),sel.value);};
    document.getElementById('skillClr').onclick=function(){
      setSys('','已清空系统提示词');};
    document.getElementById('skillImp').onclick=function(){
      document.getElementById('skillFile').click();};
    document.getElementById('skillFile').onchange=onFile();
  }
  function toggle(){
    if(!panel)return;
    var open=panel.style.display!=='none';
    panel.style.display=open?'none':'block';
    if(open)return;
    document.getElementById('skillQ').value='';
    if(typeof PROMPT_TOOLS!=='undefined'){
      refreshHead();render('','*');return;
    }
    document.getElementById('skillList').innerHTML=
      '<div style="color:#999;padding:8px;">加载技能库…</div>';
    ensureLib(function(ok){
      if(!ok){
        document.getElementById('skillList').innerHTML=
          '<div style="color:#c00;padding:8px;">技能库加载失败'
          +'（js/prompts.js 缺失？）</div>';
        return;
      }
      refreshHead();
      render('','*');
    });
  }
  function init(){
    var top=document.getElementById('top');
    if(!top||document.getElementById('skillBtn'))return;
    var b=document.createElement('button');
    b.id='skillBtn';
    b.innerHTML='⚡ 技能';
    b.onclick=toggle;
    var exp=document.getElementById('expBtn');
    if(exp)top.insertBefore(b,exp);else top.appendChild(b);
    buildPanel();
  }
  init();
  window.Skill={apply:apply,open:toggle,
    customs:customs,parseMd:parseMd};
})();
