/* pdf-rotate v1: rotate pages via pdf-lib */
(function(){
  var L = window.PDFLib;
  var P = window.NovaPdf;
  var rf = document.getElementById('r-file');
  var rd = document.getElementById('r-deg');
  var rr = document.getElementById('r-range');
  var rb = document.getElementById('r-go');
  var rs = document.getElementById('r-st');
  if(!L || !P || !rf || !rb) return;
  function say(t){ rs.textContent = t; }
  function parse(txt, max){
    var out = [], ps = txt.split(','), i, m, a, b;
    for(i = 0; i < ps.length; i++){
      var p = ps[i].trim();
      if(!p) continue;
      m = p.match(/^(\d+)-(\d+)$/);
      if(m){ a = +m[1]; b = +m[2]; }
      else if(/^\d+$/.test(p)){ a = b = +p; }
      else { return null; }
      if(a < 1 || b < a || b > max) return null;
      out.push([a - 1, b - 1]);
    }
    return out.length ? out : null;
  }
  function inSegs(i, segs){
    if(!segs) return true;
    for(var k = 0; k < segs.length; k++){
      if(i >= segs[k][0] && i <= segs[k][1]) return true;
    }
    return false;
  }
  rb.addEventListener('click', function(){
    var f = rf.files && rf.files[0];
    if(!f){ say('先选择 PDF'); return; }
    say('处理中...');
    P.fr(f).then(function(buf){
      return L.PDFDocument.load(buf,
        {ignoreEncryption: true});
    }).then(function(doc){
      var n = doc.getPageCount();
      var txt = (rr.value || '').trim();
      var segs = txt ? parse(txt, n) : null;
      if(txt && !segs){ say('范围不合法'); return; }
      var d = parseInt(rd.value, 10) || 90;
      var c = 0;
      for(var i = 0; i < n; i++){
        if(!inSegs(i, segs)) continue;
        var pg = doc.getPage(i);
        var cur = pg.getRotation().angle;
        pg.setRotation(L.degrees((cur + d) % 360));
        c++;
      }
      return doc.save().then(function(bytes){
        P.dl(bytes, 'rotated-' + Date.now() + '.pdf');
        say('完成，旋转 ' + c + ' 页');
      });
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
