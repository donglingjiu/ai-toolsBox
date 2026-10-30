/* pdf-extract v1: extract page ranges into one PDF */
(function(){
  var L = window.PDFLib;
  var P = window.NovaPdf;
 
  var ef = document.getElementById('e-file');
  var er = document.getElementById('e-range');
  var eb = document.getElementById('e-go');
  var est = document.getElementById('e-st');
  if(!L || !P || !ef || !eb) return;
  function say(t){ est.textContent = t; }
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
  eb.addEventListener('click', function(){
    var f = ef.files && ef.files[0];
    if(!f){ say('先选择 PDF'); return; }
    say('处理中...');
    P.fr(f).then(function(buf){
      return L.PDFDocument.load(buf,
        {ignoreEncryption: true});
    }).then(function(src){
      var n = src.getPageCount();
      var segs = parse((er.value || '').trim(), n);
      if(!segs){
        say('范围不合法，共 ' + n + ' 页');
        return;
      }
      var idx = [];
      segs.forEach(function(s){
        for(var i = s[0]; i <= s[1]; i++) idx.push(i);
      });
      return L.PDFDocument.create().then(function(d){
        return d.copyPages(src, idx).then(function(ps){
          ps.forEach(function(p){ d.addPage(p); });
          return d.save();
        });
      }).then(function(bytes){
        P.dl(bytes, 'extract-' + Date.now() + '.pdf');
        say('完成，' + idx.length + ' 页');
      });
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
