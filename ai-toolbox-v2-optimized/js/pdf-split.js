/* pdf-split v1: split PDF by ranges via pdf-lib */
(function(){
  var L = window.PDFLib;
  var P = window.NovaPdf;
  var sf = document.getElementById('s-file');
  var sr = document.getElementById('s-range');
  var sb = document.getElementById('s-go');
  var ss = document.getElementById('s-st');
  if(!L || !P || !sf || !sb) return;
  function say(t){ ss.textContent = t; }
  function parseRange(txt, max){
    var out = [], i, m, a, b, p;
    if(txt.indexOf('every:') === 0){
      var n = parseInt(txt.slice(6), 10);
      if(!(n > 0)) return null;
      for(i = 0; i < max; i += n){
        out.push([i, Math.min(i + n - 1, max - 1)]);
      }
      return out.length ? out : null;
    }
    var parts = txt.split(',');
 
      p = parts[i].trim();
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
  sb.addEventListener('click', function(){
    var f = sf.files && sf.files[0];
    if(!f){ say('先选择 PDF'); return; }
    say('处理中...');
    P.fr(f).then(function(buf){
      return L.PDFDocument.load(buf,
        {ignoreEncryption: true});
    }).then(function(src){
      var n = src.getPageCount();
      var rg = parseRange((sr.value || '').trim(), n);
      if(!rg){
        say('范围不合法，共 ' + n + ' 页');
        return;
      }
      var base = f.name.rep
      var k = 0;
      function one(){
        if(k >= rg.length){
          say('完成，共 ' + rg.length + ' 个文件');
          return;
        }
        var seg = rg[k];
        k++;
        var idx = [];
        for(var j = seg[0]; j <= seg[1]; j++) idx.push(j);
        L.PDFDocument.create().then(function(d){
          return d.copyPages(src, idx).then(function(ps){
            ps.forEach(function(p){ d.addPage(p); });
            return d.save();
          });
        }).then(function(bytes){
          P.dl(bytes, base + '-p' + (seg[0] + 1) + '.pdf');
          say(k + ' / ' + rg.length);
          setTimeout(one, 350);
        }).catch(function(e){
          say('失败: ' + e.message);
        });
      }
      one();
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
