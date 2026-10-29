/* xl-merge v1: files -> one xlsx (file per sheet) */
(function(){
  var X = window.XLSX, P = window.NovaXl;
  var inf = document.getElementById('mg-file');
  var mb = document.getElementById('mg-go');
  var mst = document.getElementById('mg-st');
  if(!X || !P || !inf || !mb) return;
  function say(t){ mst.textContent = t; }
  function nm(base, used){
    var k = base || 'Sheet', i = 2;
    while(used.indexOf(k) >= 0){
      k = base + '-' + i; i++;
    }
    return k;
  }
  mb.addEventListener('click', function(){
    var fs = Array.prototype.slice.call(
      inf.files || []);
    if(fs.length < 2){
      say('至少选择 2 个文件'); return;
    }
    say('处理中...');
    var out = X.utils.book_new();
    var used = [], i = 0;
    function next(){
      if(i >= fs.length){
        var bin = X.write(out,
          {bookType: 'xlsx', type: 'array'});
        P.dlBin(bin,
          'merged-' + Date.now() + '.xlsx');
        say('完成，' + i + ' 个 sheet');
        return;
      }
      var f = fs[i];
      i++;
      return P.fr(f).then(function(buf){
        var wb = X.read(new Uint8Array(buf),
          {type: 'array'});
        var base = f.name
          .replace(/\.[^.]+$/, '').slice(0, 28);
        wb.SheetNames.forEach(function(sn){
          var n = nm(base, used);
          used.push(n);
          X.utils.book_append_sheet(out,
            wb.Sheets[sn], n);
        });
        say(i + ' / ' + fs.length);
        return next();
      });
    }
    next().catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
