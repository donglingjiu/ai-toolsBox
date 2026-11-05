/* brain-audio.js P1-1 - podcast-style audio overview (Web Speech, dual host) */
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
  function el(t,c,h){
    var n=document.createElement(t);
    if(c)n.className=c;
    if(h!=null)n.innerHTML=h;
    return n;
  }
  var voices=[],queue=[],state={playing:false,paused:false,cur:0};
  function loadV(){
    try{voices=speechSynthesis.getVoices().filter(function(v){
      return /^zh/i.test(v.lang);});}catch(e){voices=[];}
  }
  function voiceFor(w){
    if(!voices.length)return null;
    return w==='exp'?(voices[1]||voices[0]):voices[0];
  }
  function sentences(t){
    var p=String(t).split(/([。！？；!?;]+)/),out=[],i;
    for(i=0;i<p.length;i+=2){
      var s=((p[i]||'')+(p[i+1]||'')).trim();
      if(!s)continue;
      while(s.length>90){
        out.push(s.slice(0,88));s=s.slice(88);
      }
      out.push(s);
    }
    return out;
  }
  function parse(t){
    var out=[],ls=String(t||'').split(/\n+/),i;
    for(i=0;i<ls.length;i++){
      var m=ls[i].match(/^\s*(小睿|安研)\s*[:：]\s*(.+)$/);
      if(m)out.push({who:m[1]==='小睿'?'host':'exp',
        text:m[2].trim()});
    }
    var q=[];
    for(i=0;i<out.length;i++){
      var ss=sentences(out[i].text),k;
      for(k=0;k<ss.length;k++)
        q.push({who:out[i].who,text:ss[k]});
    }
    return q;
  }
  function upd(){
    var b=document.getElementById('baPlay'),
      s=document.getElementById('baStat');
    if(b)b.textContent=state.playing?
      (state.paused?'▶ 继续':'⏸ 暂停'):'▶ 播放';
    if(s)s.textContent=state.playing?
      ('正在播放 '+(queue[state.cur]?
        (queue[state.cur].who==='host'?'小睿':'安研'):'')
        +' ('+(state.cur+1)+'/'+queue.length+')')
      :(queue.length?('脚本就绪 '+queue.length+' 段'):'');
  }
  function stopPlay(){
    try{speechSynthesis.cancel();}catch(e){}
    state.playing=false;state.paused=false;upd();
  }
  function playFrom(i){
    if(i>=queue.length){stopPlay();return;}
    state.cur=i;
    var u=new SpeechSynthesisUtterance(queue[i].text),
      v=voiceFor(queue[i].who);
    if(v)u.voice=v;
    u.rate=1.05;u.pitch=queue[i].who==='exp'?0.9:1.05;
    u.onend=function(){
      if(state.playing)playFrom(i+1);
    };
    u.onerror=function(){
      try{toast('语音播放失败:系统可能缺少中文语音包,建议用Chrome','err');}catch(e){}
      stopPlay();
    };
    try{speechSynthesis.speak(u);}catch(e){
      try{toast('语音启动失败','err');}catch(e2){}
      stopPlay();return;
    }
    upd();
  }
  function gen(){
    var btn=document.getElementById('baGen'),
      ta=document.getElementById('baScript');
    if(!ta)return;
    if(typeof llmReady==='function'&&!llmReady()){
      try{toast('请先配置模型 API','err');}catch(e){}
      return;
    }
    btn.disabled=true;btn.textContent='编剧生成中…';
    stopPlay();ta.value='';
    getDocs(function(docs){
      if(!docs.length){
        btn.disabled=false;btn.textContent='♪ 生成脚本';
        try{toast('知识库为空,请先在文档页导入','err');}catch(e){}
        return;
      }
      var topic=document.getElementById('baTopic').value.trim();
      var sys='你是顶级中文播客编剧。根据资料写一段双人对话播客脚本:'
        +'角色「小睿」是好奇的主持人,负责开场、提问和串联;'
        +'角色「安研」是知识专家,负责讲解资料要点。'
        +'口语化自然,一来一回至少10轮,覆盖资料核心内容,结尾由安研总结。'
        +'输出格式严格:每行一条,以「小睿:」或「安研:」开头,'
        +'不要markdown、序号或舞台提示。';
      var usr='【主题】'+(topic||'知识库整体概览')
        +'\n\n【资料】\n'+material(docs);
      llmChat([
        {role:'system',content:sys},
        {role:'user',content:usr}],
        {stream:true,temperature:0.8,
         onDelta:function(d,f){ta.value=f;}})
        .then(function(full){
          ta.value=full;
          queue=parse(ta.value);
          upd();
          try{toast('脚本就绪,可编辑后点播放');}catch(e){}
        })
        .catch(function(e){
          try{toast('生成失败:'+(e.message||e),'err');}catch(e2){}
        })
        .then(function(){
          btn.disabled=false;btn.textContent='♪ 生成脚本';
        });
    });
  }
  function boot(){
    if(!('speechSynthesis' in window)){
      return;
    }
    loadV();
    try{speechSynthesis.onvoiceschanged=loadV;}catch(e){}
    var host=document.getElementById('pane-ask')
      ||document.getElementById('pane-docs');
    if(!host){
      var ao=document.getElementById('askOut');
      host=ao?ao:document.body;
    }
    if(document.getElementById('baGen'))return;
    var card=el('div','card');
    card.style.marginTop='14px';
    card.appendChild(el('h3',null,'♪ 音频概览 '
      +'<span class="badge">双人播客 · 本地合成</span>'));
    card.appendChild(el('div','hint',
      '把知识库变成一段双主持人播客(小睿×安研)。脚本由你的模型生成,语音用浏览器本地合成,全程不出设备。'));
    var row=el('div','row2');
    row.style.marginTop='8px';
    var inp=el('input');
    inp.id='baTopic';inp.placeholder='主题(可选),如:只讲项目进展';
    inp.style.flex='1';
    row.appendChild(inp);
    var g=el('button','btn');
    g.id='baGen';g.textContent='♪ 生成脚本';g.onclick=gen;
    row.appendChild(g);
    card.appendChild(row);
    var ta=el('textarea');
    ta.id='baScript';ta.rows='10';
    ta.placeholder='生成后此处为可编辑脚本(每行「小睿:…」或「安研:…」),改完直接播放。';
    ta.style.marginTop='8px';
    card.appendChild(ta);
    var ctl=el('div','row2');
    ctl.style.marginTop='8px';
    var p=el('button','btn ghost');
    p.id='baPlay';p.textContent='▶ 播放';
    p.onclick=function(){
      if(state.playing&&!state.paused){
        try{speechSynthesis.pause();}catch(e){}
        state.paused=true;upd();return;
      }
      if(state.playing&&state.paused){
        try{speechSynthesis.resume();}catch(e){}
        state.paused=false;upd();return;
      }
      var q=parse(document.getElementById('baScript').value);
      if(!q.length){
        try{toast('先点「生成脚本」,或按「小睿:/安研:」格式写几行');}catch(e){}
        return;
      }
      queue=q;state.playing=true;state.paused=false;
      playFrom(0);
    };
    ctl.appendChild(p);
    var st=el('button','btn ghost');
    st.textContent='⏹ 停止';st.onclick=stopPlay;
    ctl.appendChild(st);
    var stat=el('span','hint');
    stat.id='baStat';stat.style.marginLeft='8px';
    ctl.appendChild(stat);
    card.appendChild(ctl);
    host.insertBefore(card,host.firstChild);
    upd();
  }
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
