/* brain-study.js P1-2 - study center: outline tree + flashcards (zero-dep) */
'use strict';
(function(){
  function getDocs(cb){
    var r;
    try{r=indexedDB.open('ai-brain');}
    catch(e){cb([]);return;}
    r.onerror=function(){cb([]);};
    r.onsuccess=function(){
      var db=r.result,tx;
      try{
        tx=db.transaction('docs','readonly');
        var g=tx.objectStore('docs').getAll();
        g.onsuccess=function(){cb(g.result||[]);};
        g.onerror=function(){cb([]);};
      }catch(e){cb([]);}
    };
  }
  function material(docs){
    var d=docs.slice().sort(function(a,b){
      return (b.created||0)-(a.created||0);}).slice(0,4),
      out=[],i;
    for(i=0;i<d.length;i++){
      out.push('【文档'+(i+1)+'·'+(d[i].name||'未命名')
        +'】\n'+String(d[i].content||'').slice(0,2200));
    }
    return out.join('\n\n').slice(0,7000);
  }
  function escH(s){
    return String(s==null?'':s).replace(/&/g,'&amp;')
      .replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function el(t,c,h){
    var n=document.createElement(t);
    if(c)n.className=c;
    if(h!=null)n.innerHTML=h;
    return n;
  }
  function copyText(t,ok){
    var done=function(){
      try{toast(ok);}catch(e){}
    };
    try{
      if(navigator.clipboard&&navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(done,
          function(){fallback();});
        return;
      }
    }catch(e){}
    fallback();
    function fallback(){
      try{
        var ta=el('textarea');
        ta.value=t;
        ta.style.position='fixed';ta.style.opacity='0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      }catch(e2){
        try{toast('复制失败,请手动选择','err');}catch(e3){}
      }
    }
  }
  function buildTree(md){
    var ls=String(md).split(/\n+/),
      root={t:'\u77e5\u8bc6\u5e93\u5927\u7eb2',d:0,ch:[]},
      stack=[root],i;
    for(i=0;i<ls.length;i++){
      var m=ls[i].match(/^(#{1,4})\s+(.+)$/);
      if(!m)continue;
      var node={t:m[2].trim().slice(0,40),
        d:m[1].length,ch:[]};
      while(stack.length>1
        &&stack[stack.length-1].d>=node.d)stack.pop();
      stack[stack.length-1].ch.push(node);
      stack.push(node);
    }
    return root;
  }
  function renderTree(n){
    if(!n.ch||!n.ch.length)return '';
    return '<ul>'+n.ch.map(function(c){
      if(c.ch.length)
        return '<li><details><summary>'+escH(c.t)
          +'</summary>'+renderTree(c)+'</details></li>';
      return '<li class="lf">'+escH(c.t)+'</li>';
    }).join('')+'</ul>';
  }
  function extractJSON(t){
    var m=String(t).match(/\[[\s\S]*\]/);
    if(!m)return null;
    try{return JSON.parse(m[0]);}catch(e){return null;}
  }
  function genOutline(){
    var box=document.getElementById('bsTree'),
      btn=document.getElementById('bsOutline');
    if(typeof llmReady==='function'&&!llmReady()){
      try{toast('请先配置模型 API','err');}catch(e){}
      return;
    }
    btn.disabled=true;btn.textContent='大纲生成中…';
    getDocs(function(docs){
      if(!docs.length){
        btn.disabled=false;
        btn.textContent='\u25c8 \u751f\u6210\u5927\u7eb2';
        try{toast('知识库为空,请先导入文档','err');}catch(e){}
        return;
      }
      var sys='\u4f60\u662f\u77e5\u8bc6\u6574\u7406\u4e13\u5bb6\u3002'
        +'\u628a\u8d44\u6599\u6574\u7406\u6210\u4e09\u7ea7\u5927\u7eb2:'
        +'\u53ea\u7528markdown\u591a\u7ea7\u6807\u9898(\u4e95\u53f7\u6570\u91cf\u8868\u793a\u5c42\u7ea7\u6df1\u6d45),'
        +'\u4e0d\u8981\u6b63\u6587\u6bb5\u843d\u3001\u65e0\u5e8f\u5217\u8868\u6216\u4ee3\u7801\u5757\u3002'
        +'\u4e00\u7ea7\u4e0d\u8d85\u8fc76\u4e2a,\u6bcf\u7ea7\u6bcf\u8282\u70b9'
        +'\u4e0d\u8d85\u8fc78\u4e2a\u5b50\u8282\u70b9,\u6bcf\u4e2a\u6807\u9898\u4e0d\u8d85\u8fc716\u5b57\u3002';
      llmChat([
        {role:'system',content:sys},
        {role:'user',content:'\u3010\u8d44\u6599\u3011\n'
          +material(docs)}],
        {stream:false,temperature:0.4})
        .then(function(full){
          var tree=buildTree(full);
          box.innerHTML=renderTree(tree);
          copyText(full.replace(/^#{1,4}\s+/gm,
            function(m){return m;}),'大纲已复制,可粘贴到 Mind 脑图工作室');
        })
        .catch(function(e){
          try{toast('生成失败:'+(e.message||e),'err');}catch(e2){}
        })
        .then(function(){
          btn.disabled=false;
          btn.textContent='\u25c8 \u751f\u6210\u5927\u7eb2';
        });
    });
  }
  function renderCards(cs){
    var g=document.getElementById('bsCards');
    if(!g)return;
    g.innerHTML=cs.map(function(c,i){
      return '<div class="fcard" data-i="'+i+'">'
        +'<div class="finner"><div class="fface">'
        +escH(c.q)+'</div><div class="fface fback">'
        +escH(c.a)+'</div></div></div>';
    }).join('');
    Array.prototype.forEach.call(
      g.querySelectorAll('.fcard'),function(n){
        n.onclick=function(){n.classList.toggle('on');};
      });
  }
  function saveCards(cs){
    try{localStorage.setItem('at_brain_cards_v1',
      JSON.stringify(cs));}catch(e){}
  }
  function genCards(){
    var btn=document.getElementById('bsFlash');
    if(typeof llmReady==='function'&&!llmReady()){
      try{toast('请先配置模型 API','err');}catch(e){}
      return;
    }
    btn.disabled=true;btn.textContent='闪卡生成中…';
    getDocs(function(docs){
      if(!docs.length){
        btn.disabled=false;btn.textContent='生成闪卡';
        try{toast('知识库为空,请先导入文档','err');}catch(e){}
        return;
      }
      var sys='\u4f60\u662f\u8bb0\u5fc6\u5361\u8bbe\u8ba1\u4e13\u5bb6\u3002'
        +'\u57fa\u4e8e\u8d44\u6599\u751f\u621010\u5f20\u95ee\u7b54\u95ea\u5361,'
        +'\u53ea\u8f93\u51faJSON\u6570\u7ec4,\u7981\u6b62\u89e3\u91ca:'
        +'\u6bcf\u9879{"q":"\u95ee\u9898(15\u5b57\u5185)",'
        +'"a":"\u7b54\u6848(40\u5b57\u5185)"}\u3002'
        +'\u8986\u76d6\u8d44\u6599\u6838\u5fc3\u6982\u5ff5\u3002';
      llmChat([
        {role:'system',content:sys},
        {role:'user',content:'\u3010\u8d44\u6599\u3011\n'
          +material(docs)}],
        {stream:false,temperature:0.5})
        .then(function(full){
          var cs=extractJSON(full);
          if(!cs||!cs.length)throw new Error('返回格式异常,请重试');
          cs=cs.slice(0,12).map(function(c){
            return {q:String(c.q||'').slice(0,30),
              a:String(c.a||'').slice(0,80)};
          }).filter(function(c){return c.q&&c.a;});
          if(!cs.length)throw new Error('闪卡内容为空');
          renderCards(cs);
          saveCards(cs);
          try{toast('已生成 '+cs.length+' 张,点击卡片翻面');}catch(e2){}
        })
        .catch(function(e){
          try{toast('生成失败:'+(e.message||e),'err');}catch(e2){}
        })
        .then(function(){
          btn.disabled=false;btn.textContent='生成闪卡';
        });
    });
  }
  function style(){
    if(document.getElementById('bsStyle'))return;
    var s=el('style');
    s.id='bsStyle';
    s.textContent='.otree ul{list-style:none;padding-left:16px;'
      +'margin:2px 0 2px 8px;border-left:1px dashed #d6dbe6;}'
      +'.otree summary{cursor:pointer;font-size:13.5px;'
      +'padding:2px 0;}'
      +'.otree li.lf{font-size:13px;color:#555;'
      +'padding:2px 0 2px 14px;position:relative;}'
      +'.otree li.lf:before{content:"";position:absolute;'
      +'left:0;top:11px;width:10px;height:1px;'
      +'background:#d6dbe6;}'
      +'.fcards{display:flex;flex-wrap:wrap;gap:10px;}'
      +'.fcard{width:160px;height:110px;perspective:700px;'
      +'cursor:pointer;}'
      +'.finner{position:relative;width:100%;height:100%;'
      +'transform-style:preserve-3d;transition:transform .4s;}'
      +'.fcard.on .finner{transform:rotateY(180deg);}'
      +'.fface{position:absolute;left:0;top:0;width:100%;'
      +'height:100%;backface-visibility:hidden;'
      +'border-radius:10px;padding:10px;font-size:12.5px;'
      +'line-height:1.5;overflow:auto;background:#fff;'
      +'border:1px solid #e2e6ef;box-sizing:border-box;}'
      +'.fback{transform:rotateY(180deg);background:#eef3ff;}';
    document.head.appendChild(s);
  }
  function boot(){
    var host=document.getElementById('pane-ask')
      ||document.getElementById('pane-docs');
    if(!host)host=document.getElementById('askOut')
      ||document.body;
    if(document.getElementById('bsOutline'))return;
    style();
    var card=el('div','card');
    card.style.marginTop='14px';
    card.appendChild(el('h3',null,'◈ 学习中心 '
      +'<span class="badge">大纲 × 闪卡 · 本地</span>'));
    var d1=el('details');
    d1.appendChild(el('summary',null,'思维大纲'
      +'(生成后自动复制,可粘贴进 Mind 工作室)'));
    var r1=el('div','row2');
    r1.style.marginTop='6px';
    var b1=el('button','btn');
    b1.id='bsOutline';
    b1.textContent='\u25c8 \u751f\u6210\u5927\u7eb2';
    b1.onclick=genOutline;
    r1.appendChild(b1);
    d1.appendChild(r1);
    var tree=el('div','otree');
    tree.id='bsTree';
    tree.style.marginTop='6px';
    d1.appendChild(tree);
    card.appendChild(d1);
    var d2=el('details');
    d2.appendChild(el('summary',null,
      '记忆闪卡(点击翻面,自动保存在本机)'));
    var r2=el('div','row2');
    r2.style.marginTop='6px';
    var b2=el('button','btn');
    b2.id='bsFlash';b2.textContent='生成闪卡';
    b2.onclick=genCards;
    r2.appendChild(b2);
    var b3=el('button','btn ghost');
    b3.textContent='清空';
    b3.onclick=function(){
      document.getElementById('bsCards').innerHTML='';
      saveCards([]);
      try{toast('已清空');}catch(e){}
    };
    r2.appendChild(b3);
    d2.appendChild(r2);
    var grid=el('div','fcards');
    grid.id='bsCards';
    grid.style.marginTop='8px';
    d2.appendChild(grid);
    card.appendChild(d2);
    var anchor=null,g2=document.getElementById('baGen');
    if(g2&&g2.closest)anchor=g2.closest('.card');
    if(anchor&&anchor.parentNode)
      anchor.parentNode.insertBefore(card,anchor.nextSibling);
    else host.insertBefore(card,host.firstChild);
    try{
      var sv=JSON.parse(
        localStorage.getItem('at_brain_cards_v1')||'[]');
      if(sv&&sv.length)renderCards(sv);
    }catch(e){}
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
