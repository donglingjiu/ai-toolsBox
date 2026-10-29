/* mind-png-export-v4: file-delivered export (style inline + union bbox) */
(function(){
  var svg = document.getElementById('mind-svg');
  var dl = document.getElementById('mind-dl');
  if(!svg || !dl) return;
  var b = document.getElementById('mind-dl-png');
  if(!b){
    b = document.createElement('button');
    b.id = 'mind-dl-png';
    b.className = 'mbtn';
    b.type = 'button';
    b.textContent = '\u4e0b\u8f7d PNG';
    dl.parentNode.insertBefore(b, dl.nextSibling);
  }
  b.onclick = function(){
    if(!svg.childNodes.length){
      alert('load a mindmap first');
      return;
    }
    var cl = svg.cloneNode(true);
    cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    var la = [svg], ca = [cl], k = 0;
    while(k < la.length){
      var le = la[k], ce = ca[k];
      if(le.nodeType === 1 && le !== svg){
        try{
          var cs = window.getComputedStyle(le);
          var o = [], j;
          for(j = 0; j < cs.length; j++){
            var pn = cs[j];
            o.push(pn + ':' + cs.getPropertyValue(pn));
          }
          ce.setAttribute('style', o.join(';'));
        }catch(e){}
      }
      var a = le.childNodes, c = ce.childNodes, m;
      for(m = 0; m < a.length && m < c.length; m++){
        la.push(a[m]);
        ca.push(c[m]);
      }
      k++;
    }
    var pad = 24, x1, y1, x2, y2, ok = 0;
    x1 = y1 = Infinity;
    x2 = y2 = -Infinity;
    try{
      var inv = svg.getScreenCTM().inverse();
      var els = svg.querySelectorAll('*');
      var q, r, A, B, u, v;
      for(q = 0; q < els.length; q++){
        r = els[q].getBoundingClientRect();
        if(!r || (r.width === 0 && r.height === 0)) continue;
        A = svg.createSVGPoint();
        B = svg.createSVGPoint();
        A.x = r.left;
        A.y = r.top;
        B.x = r.right;
        B.y = r.bottom;
        u = A.matrixTransform(inv);
        v = B.matrixTransform(inv);
        x1 = Math.min(x1, u.x, v.x);
        y1 = Math.min(y1, u.y, v.y);
        x2 = Math.max(x2, u.x, v.x);
        y2 = Math.max(y2, u.y, v.y);
        ok = 1;
      }
    }catch(e){}
    if(!ok){
      var g = svg.getBBox();
      x1 = g.x;
      y1 = g.y;
      x2 = g.x + g.width;
      y2 = g.y + g.height;
    }
    x1 -= pad;
    y1 -= pad;
    x2 += pad;
    y2 += pad;
    var w = x2 - x1, h = y2 - y1;
    cl.setAttribute('viewBox', x1+' '+y1+' '+w+' '+h);
    cl.setAttribute('width', Math.round(w*2));
    cl.setAttribute('height', Math.round(h*2));
    var str = new XMLSerializer().serializeToString(cl);
    var img = new Image();
    img.onload = function(){
      var cv = document.createElement('canvas');
      cv.width = Math.round(w*2);
      cv.height = Math.round(h*2);
      var cx = cv.getContext('2d');
      cx.fillStyle = '#ffffff';
      cx.fillRect(0, 0, cv.width, cv.height);
      cx.drawImage(img, 0, 0, cv.width, cv.height);
      try{
        cv.toBlob(function(pb){
          if(!pb){ alert('png failed: empty blob'); return; }
          var pu = URL.createObjectURL(pb);
          var a2 = document.createElement('a');
          a2.href = pu;
          a2.download = 'mindmap-' + Date.now() + '.png';
          document.body.appendChild(a2);
          a2.click();
          a2.remove();
          setTimeout(function(){
            URL.revokeObjectURL(pu);
          }, 2000);
        }, 'image/png');
      }catch(err){
        alert('PNG blocked: ' + err.message);
      }
    };
    img.onerror = function(){ alert('svg render failed'); };
    img.src = 'data:image/svg+xml;charset=utf-8,'
      + encodeURIComponent(str);
  };
})();
