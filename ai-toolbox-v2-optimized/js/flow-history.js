/* flow-history.js v1 - B4a: artifact ring + trace panel */
(function(){
'use strict';
var HKEY='nova-flow-hist-v1';
var CAP=5;
var Hist={};
try{Hist=JSON.parse(localStorage.getItem(HKEY)||'{}')||{}}
catch(e){Hist={}}
function saveH(){
  try{localStorage.setItem(HKEY,JSON.stringify(Hist))}catch(e){}
}
function curKey(){
  try{return NF_STAGES[State.stage].key}catch(e){return null}
}
function curTitle(){
  try{return ARTIFACT[State.stage]}catch(e){return ''}
}
function toastS(m,c){
  try{novaToast(m,c)}
  catch(e){try{console.log('[fh]',m)}catch(e2){}}
}
function snap(key,prev){
  if(!key||!prev||!prev.text)return;
  var arr=Hist[key]||(Hist[key]=[]);
  var i;
  for(i=0;i<arr.length;i++){
    if(arr[i].ts===prev.ts)return;
  }
  arr.push({text:prev.text,ts:prev.ts,len:prev.text.length});
  while(arr.length>CAP)arr.shift();
  saveH();refresh();
}
var btn=null;
function ensureBtn(){
  if(btn&&btn.isConnected)return;
  var head=document.querySelector('.out-head');
  if(!head)return;
  btn=document.createElement('button');
  btn.className='mini';
  btn.id='hist-btn';
  btn.style.display='none';
  btn.addEventListener('click',openPanel);
  head.appendChild(btn);
}
function refresh(){
  ensureBtn();
  if(!btn)return;
  var k=curKey();
  var nn=(k&&Hist[k])?Hist[k].length:0;
  btn.textContent='历史('+nn+')';
  btn.style.display=nn?'':'none';
  paintTrace();
}
var ov=null;
function closePanel(){
  if(ov&&ov.parentNode)ov.parentNode.removeChild(ov);
  ov=null;
}
function fmtD(d){
  var q=function(x){return('0'+x).slice(-2)};
  return d.getFullYear()+'-'+q(d.getMonth()+1)
    +'-'+q(d.getDate())
    +' '+q(d.getHours())+':'+q(d.getMinutes());
}
function openPanel(){
  closePanel();
  var k=curKey();
  if(!k){toastS('当前无阶段','error');return}
  var arr=(Hist[k]||[]).slice().reverse();
  ov=document.createElement('div');
  ov.style.position='fixed';
  ov.style.left='0';
  ov.style.top='0';
  ov.style.right='0';
  ov.style.bottom='0';
  ov.style.background='rgba(15,23,42,.45)';
  ov.style.zIndex='9999';
  ov.style.display='flex';
  ov.style.alignItems='center';
  ov.style.justifyContent='center';
  var card=document.createElement('div');
  card.style.background='#fff';
  card.style.borderRadius='14px';
  card.style.width='92%';
  card.style.maxWidth='640px';
  card.style.maxHeight='72vh';
  card.style.display='flex';
  card.style.flexDirection='column';
  card.style.overflow='hidden';
  card.style.boxShadow='0 12px 40px rgba(0,0,0,.18)';
  var hd=document.createElement('div');
  hd.style.padding='12px 16px';
  hd.style.borderBottom='1px solid #e5e7eb';
  hd.style.display='flex';
  hd.style.alignItems='center';
  hd.style.gap='8px';
  var tt=document.createElement('strong');
  tt.textContent='历史版本 · 《'+curTitle()+'》';
  var sp=document.createElement('span');
  sp.style.flex='1';
  var cb=document.createElement('button');
  cb.className='mini';
  cb.textContent='关闭';
  cb.addEventListener('click',closePanel);
  hd.appendChild(tt);
  hd.appendChild(sp);
  hd.appendChild(cb);
  var bd=document.createElement('div');
  bd.style.overflow='auto';
  bd.style.padding='10px 16px';
  if(!arr.length){
    var em=document.createElement('div');
    em.style.color='#6b7280';
    em.style.padding='16px 0';
    em.textContent='暂无历史版本（重跑后自动留档）';
    bd.appendChild(em);
  }
  var i;
  for(i=0;i<arr.length;i++){(function(v){
    var row=document.createElement('div');
    row.style.display='flex';
    row.style.alignItems='center';
    row.style.gap='8px';
    row.style.padding='8px 0';
    row.style.borderBottom='1px dashed #eee';
    var meta=document.createElement('span');
    meta.style.flex='1';
    meta.textContent=fmtD(new Date(v.ts))
      +' · '+v.len+' 字';
    var b1=document.createElement('button');
    b1.className='mini';
    b1.textContent='复制';
    b1.addEventListener('click',function(){
      try{
        navigator.clipboard.writeText(v.text)
          .then(function(){toastS('已复制该版本')},
            function(){toastS('复制未成功','error')});
      }catch(e){toastS('复制未成功','error')}
    });
    var b2=document.createElement('button');
    b2.className='mini';
    b2.textContent='恢复此版本';
    b2.addEventListener('click',function(){
      try{
        var cu=State.outputs[k];
        if(cu&&cu.text)snap(k,cu);
        State.outputs[k]={text:v.text,ts:Date.now()};
        saveState();paintOut();
        toastS('已恢复，当前产物已切换');
        closePanel();refresh();
      }catch(e){toastS('恢复未成功','error')}
    });
    row.appendChild(meta);
    row.appendChild(b1);
    row.appendChild(b2);
    bd.appendChild(row);
  })(arr[i]);}
  card.appendChild(hd);
  card.appendChild(bd);
  ov.appendChild(card);
  ov.addEventListener('click',function(e){
    if(e.target===ov)closePanel();
  });
  document.body.appendChild(ov);
}
function ensureTrace(){
  if(document.getElementById('fh-trace'))return;
  var rail=document.querySelector('.flow-rail');
  if(!rail)return;
  var d=document.createElement('details');
  d.className='teams';
  var sm2=document.createElement('summary');
  sm2.textContent='运行轨迹（自动记录）';
  var box=document.createElement('div');
  box.id='fh-trace';
  d.appendChild(sm2);
  d.appendChild(box);
  rail.appendChild(d);
}
function fmtTs(iso){
  try{return new Date(iso).toLocaleString()}
  catch(e){return String(iso||'')}
}
function paintTrace(){
  var box=document.getElementById('fh-trace');
  if(!box)return;
  var logs=[];
  try{
    if(window.FlowTrace&&FlowTrace.listTraces)
      logs=FlowTrace.listTraces()||[];
  }catch(e){}
  if(!logs.length){
    box.textContent='暂无轨迹（执行阶段后自动记录）';
    return;
  }
  var order=[],groups={},w,i;
  for(i=logs.length-1;i>=0;i--){
    w=logs[i].wf_id||'未知';
    if(!groups[w]){groups[w]=[];order.push(w)}
    groups[w].push(logs[i]);
  }
  box.innerHTML='';
  var j,m2,t,line,txt,ev,wrap,h,arr;
  for(j=0;j<order.length&&j<8;j++){
    wrap=document.createElement('div');
    wrap.className='teamcard';
    h=document.createElement('div');
    h.className='hd';
    h.textContent=order[j];
    wrap.appendChild(h);
    arr=groups[order[j]];
    for(m2=0;m2<arr.length&&m2<10;m2++){
      t=arr[m2];
      line=document.createElement('div');
      line.className='mb';
      ev=(t.steps&&t.steps[0])||'';
      txt=fmtTs(t.ts)+' · '+ev;
      if(t.dur_s)txt+=' · '+t.dur_s+'s';
      if(t.gate)txt+=' · 门'+t.gate.score
        +'/'+t.gate.threshold
        +(t.gate.passed?' 达标':' 未达');
      line.textContent=txt;
      wrap.appendChild(line);
    }
    box.appendChild(wrap);
  }
}
function init(){
  ensureTrace();ensureBtn();refresh();
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{init()}
window.FlowHist={snap:snap,refresh:refresh,
  paintTrace:paintTrace,openPanel:openPanel};
})();