/* pdf-img2pdf v1: images -> one PDF via pdf-lib */
(function(){
  var L = window.PDFLib;
  var P = window.NovaPdf;
  var inf = document.getElementById('i2p-file');
  var ib = document.getElementById('i2p-go');
  var ist = document.getElementById('i2p-st');
  if(!L || !P || !inf || !ib) return;
  function say(t){ ist.textContent = t; }
  function embed(doc, f, buf){
    var n = f.name.toLowerCase();
    if(/\.png$/.test(n)){
      return doc.embedPng(buf);
    }
    return doc.embedJpg(buf);
  }
  ib.addEventListener('click', function(){
    var fs = Array.prototype.slice.call(inf.files || []);
    fs = fs.filter(function(f){
      return /\.(png|jpe?g)$/i.test(f.name);
    });
    if(fs.length < 1){
      say('选择 PNG/JPG 图片');
      return;
    }
    say('处理中...');
    L.PDFDocument.create().then(function(doc){
      var i = 0;
      function next(){
        if(i >= fs.length) return doc.save();
        var f = fs[i];
        i++;
        return P.fr(f).then(function(buf){
          return embed(doc, f, buf);
        }).then(function(im){
          var pg = doc.addPage([im.width, im.height]);
          pg.drawImage(im, {x: 0, y: 0,
            width: im.width, height: im.height});
          say(i + ' / ' + fs.length);
          return next();
        });
      }
      return next();
    }).then(function(bytes){
      P.dl(bytes, 'images-' + Date.now() + '.pdf');
      say('完成，已下载');
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
