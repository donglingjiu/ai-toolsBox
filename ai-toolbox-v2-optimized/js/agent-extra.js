/* agent-extra.js M3.1 - brain/flow tools for Agent */
'use strict';
(function(){
  function textOf(rec){
    if(typeof rec==='string')return rec;
    if(!rec||typeof rec!=='object')return '';
    var F=['content','text','chunk','body','summary',
      'title','name','doc','note'],i,k,v,best='';
    for(i=0;i<F.length;i++){
      v=rec[F[i]];
      if(typeof v==='string'&&v.length>best.length)best=v;
    }
    if(best)return best;
    for(k in rec){
      v=rec[k];
      if(typeof v==='string'&&v.length>best.length)best=v;
    }
    return best;
  }
  function bigrams(s){
    var r=[],i;s=String(s).replace(/\s+/g,'');
    for(i=0;i<s.length-1;i++)r.push(s.slice(i,i+2));
    return r;
  }
  function score(t,q){
    var qb=bigrams(q),i,hit=0;
    for(i=0;i<qb.length;i++)
      if(t.indexOf(qb[i])>=0)hit++;
    var s=q.length>1?hit/(q.length-1):0;
    if(t.indexOf(q)>=0)s+=1;
    return s;
  }
  function loadAll(){
    if(!indexedDB.databases)
      return Promise.reject(new Error('enum'));
    return indexedDB.databases().then(function(dbs){
      var jobs=[];
      dbs.forEach(function(d){
        jobs.push(new Promise(function(res){
          var out=[];
          try{
            var rq=indexedDB.open(d.name);
            rq.onsuccess=function(){
              var db=rq.result;
              var names=[].slice.call(db.objectStoreNames||[]);
              if(!names.length){db.close();res(out);return;}
              var pend=names.length;
              names.forEach(function(sn){
                try{
                  var tx=db.transaction(sn,'readonly');
                  var g=tx.objectStore(sn).getAll();
                  g.onsuccess=function(){
                    (g.result||[]).slice(0,300)
                      .forEach(function(rec,i){
                        var t=textOf(rec);
                        if(t&&t.length>10)
                          out.push({t:t,src:d.name+'/'+sn+'#'+i});
                      });
                  };
                  tx.oncomplete=function(){
                    if(--pend===0){db.close();res(out);}};
                  tx.onerror=function(){
                    if(--pend===0){db.close();res(out);}};
                }catch(e){if(--pend===0){db.close();res(out);}}
              });
            };
            rq.onerror=function(){res(out);};
          }catch(e){res(out);}
        }));
      });
      return Promise.all(jobs).then(function(ls){
        var all=[];ls.forEach(function(x){all=all.concat(x);});
        return all;
      });
    });
  }
  window.AgentTools.register({name:'search_brain',
    desc:'检索"第二大脑"知识库(brain页导入的文档)',
    params:{query:'string,检索词'},
    run:function(a){
      var q=String(a.query||'').trim();
      if(!q)return Promise.resolve('错误：缺少query');
      return loadAll().then(function(chunks){
        if(!chunks.length)
          return '（知识库为空，请先到 brain 页导入文档）';
        var r=chunks.map(function(c){
            return {c:c,s:score(c.t,q)};})
          .filter(function(x){return x.s>0.3;})
          .sort(function(x,y){return y.s-x.s;})
          .slice(0,5);
        if(!r.length)
          return '（知识库无与"'+q+'"相关的内容）';
        var lines=r.map(function(x,i){
          return (i+1)+'.['+x.c.src+'] '
            +x.c.t.slice(0,150);});
        return '命中'+r.length+'条：\n'+lines.join('\n');
      }).catch(function(e){
        return (e&&e.message==='enum')
          ?'当前浏览器不支持枚举IndexedDB，请到 brain 页检索'
          :'知识库读取失败：'+((e&&e.message)||e);
      });
    }});
  var CN=['需求分析','技术调研','方案设计','代码实现','交付评审'];
  window.AgentTools.register({name:'flow_status',
    desc:'查看五阶段工作流的进度与质量门(gate)评分',
    params:{},
    run:function(){
      var i,k,arr,ws=[];
      for(i=0;i<localStorage.length;i++){
        k=localStorage.key(i);
        if(k&&k.indexOf('flow_traces_')===0){
          try{
            arr=JSON.parse(localStorage.getItem(k)||'[]');
            if(arr.length)ws.push({key:k,arr:arr});
          }catch(e){}
        }
      }
      if(!ws.length)
        return '（暂无工作流轨迹，去 flow 页跑一次即可）';
      ws.sort(function(a,b){return b.arr.length-a.arr.length;});
      var out=[],n;
      for(n=0;n<Math.min(2,ws.length);n++){
        var a2=ws[n].arr,st={},j,r,m,ev;
        for(j=0;j<a2.length;j++){
          r=a2[j];ev=(r.steps&&r.steps[0])||'';
          m=ev.match(/^s([0-5]):(\w+)$/);
          if(m)st[+m[1]]={e:m[2],gate:r.gate,dur:r.dur_s};
        }
        var cur=0,done=0,lines=[];
        for(j=1;j<=5;j++){
          var s=st[j]||{e:'-'};
          var gtxt=(s.gate&&typeof s.gate.score==='number')
            ?(' gate='+s.gate.score+'/'
              +(s.gate.threshold!=null?s.gate.threshold:'?')):'';
          lines.push(j+'. '+CN[j-1]+':'+s.e
            +(s.dur?(' '+s.dur+'s'):'')+gtxt);
          if(s.e==='done')done++;
          if(!cur&&s.e!=='done')cur=j;
        }
        out.push('工作流 '+ws[n].key.replace('flow_traces_','')
          +'（'+a2.length+'条轨迹）\n'+lines.join('\n')
          +'\n进度 '+done+'/5，当前阶段='
          +(cur?CN[cur-1]:'全部完成'));
      }
      if(ws.length>2)
        out.push('（另有'+(ws.length-2)+'个历史工作流）');
      return out.join('\n\n');
    }});
  window.AgentTools.register({name:'export_flow_md',
    desc:'专用工具：用户要求导出/生成/下载工作流报告或轨迹报告时必须调用本工具',
    params:{},
    run:function(){
      var i,k,arr,ws=[];
      for(i=0;i<localStorage.length;i++){
        k=localStorage.key(i);
        if(k&&k.indexOf('flow_traces_')===0){
          try{
            arr=JSON.parse(localStorage.getItem(k)||'[]');
            if(arr.length)ws.push({key:k,arr:arr});
          }catch(e){}
        }
      }
      if(!ws.length)return '（无轨迹可导出）';
      var CN=['需求分析','技术调研','方案设计','代码实现','交付评审'];
      var md='# 工作流轨迹报告\n\n生成时间：'
        +new Date().toLocaleString('zh-CN')+'\n\n';
      ws.sort(function(p,q){return q.arr.length-p.arr.length;});
      ws.forEach(function(w){
        md+='## '+w.key.replace('flow_traces_','')
          +'（'+w.arr.length+'条轨迹）\n\n';
        md+='| # | 阶段 | 状态 | 耗时s | gate |\n'
          +'|---|---|---|---|---|\n';
        var st={},j,r,m;
        for(j=0;j<w.arr.length;j++){
          r=w.arr[j];
          m=String((r.steps&&r.steps[0])||'')
            .match(/^s([0-5]):(\w+)$/);
          if(m)st[+m[1]]={e:m[2],r:r};
        }
        for(j=1;j<=5;j++){
          var s2=st[j]||{},g=s2.r&&s2.r.gate;
          md+='| '+j+' | '+CN[j-1]+' | '+(s2.e||'-')+' | '
            +(s2.r&&s2.r.dur_s!=null?s2.r.dur_s:'-')+' | '
            +(g&&g.score!=null?(g.score+'/'
              +(g.threshold!=null?g.threshold:'?')):'-')+' |\n';
        }
        md+='\n';
      });
      try{
        var bl=new Blob([md],{type:'text/markdown'});
        var a2=document.createElement('a');
        a2.href=URL.createObjectURL(bl);
        a2.download='flow-report-'+Date.now()+'.md';
        document.body.appendChild(a2);a2.click();
        setTimeout(function(){
          document.body.removeChild(a2);
          URL.revokeObjectURL(a2.href);},500);
        return '已下载：'+ws.length+'个工作流，'
          +ws.reduce(function(s,w){return s+w.arr.length;},0)
          +'条轨迹';
      }catch(e){return '导出失败：'+e.message;}
    }});
})();
