/* pdf-merge v1: merge PDFs via pdf-lib (local only) */
(function(){
  var L = window.PDFLib;
  var P = window.NovaPdf;
  var mf = document.getElementById('m-files');
  var ml = document.getElementById('m-list');
  var mb = document.getElementById('m-go');
  var ms = document.getElementById('m-st');
  if(!L || !P || !mf || !mb) return;
  var files = [];
  function say(t){ ms.textContent = t; }
  function item(f, i){
    var li = document.createElement('li');
    var sp = document.createElement('span');
    sp.textContent = (i + 1) + '. ' + f.name;
    var up = document.createElement('button');
    up.type = 'button';
    up.textContent = '\u2191';
    up.onclick = function(){
      if(i > 0){
        var t = files[i - 1];
        files[i - 1] = files[i];
        files[i] = t;
        render();
      }
    };
    var dx = document.createElement('button');
    dx.type = 'button';
    dx.textContent = '\u00d7';
    dx.onclick = function(){
      files.splice(i, 1);
      render();
    };
    li.appendChild(sp);
    li.appendChild(up);
    li.appendChild(dx);
    return li;
  }
  function render(){
    ml.innerHTML = '';
    files.forEach(function(f, i){
      ml.appendChild(item(f, i));
    });
  }
  mf.addEventListener('change', function(){
    Array.prototype.forEach.call(mf.files, function(f){
      if(f && files.indexOf(f) < 0) files.push(f);
    });
    mf.value = '';
    render();
  });
  mb.addEventListener('click', function(){
    if(files.length < 2){
      say('至少选择 2 个 PDF');
      return;
    }
    say('处理中...');
    var out = null;
    var i = 0;
    function next(){
      if(i >= files.length) return out.save();
      var f = files[i];
      i++;
      return P.fr(f).then(function(buf){
        return L.PDFDocument.load(buf,
          {ignoreEncryption: true});
      }).then(function(src){
        return out.copyPages(src,
          src.getPageIndices());
      }).then(function(ps){
        ps.forEach(function(p){ out.addPage(p); });
        say(i + ' / ' + files.length);
        return next();
      });
    }
    L.PDFDocument.create().then(function(d){
      out = d;
      return next();
    }).then(function(bytes){
      P.dl(bytes, 'merged-' + Date.now() + '.pdf');
      say('完成，已下载');
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
