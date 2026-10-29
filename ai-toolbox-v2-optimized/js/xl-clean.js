/* xl-clean v1: dedup rows / trim cells / drop empty */
(function(){
  var X = window.XLSX, P = window.NovaXl;
  var cf = document.getElementById('cl-file');
  var cd = document.getElementById('cl-dedup');
  var ct = document.getElementById('cl-trim');
  var ce = document.getElementById('cl-empty');
  var cb = document.getElementById('cl-go');
  var cst = document.getElementById('cl-st');
  if(!X || !P || !cf || !cb) return;
  function say(t){ cst.textContent = t; }
  cb.addEventListener('click', function(){
    var f = cf.files && cf.files[0];
    if(!f){ say('先选择文件'); return; }
    say('处理中...');
    P.fr(f).then(function(buf){
      var wb = X.read(new Uint8Array(buf),
        {type: 'array'});
      var sn = wb.SheetNames[0];
      var rows = X.utils.sheet_to_json(
        wb.Sheets[sn],
        {header: 1, defval: '', raw: false});
      var c = {d: 0, t: 0, e: 0};
      var seen = {}, out = [];
      rows.forEach(function(r){
        var row = r.slice(0);
        if(ct.checked){
          row = row.map(function(v){
            var s = String(v);
            var x = s.replace(
              /^\s+|\s+$/g, '');
            if(x !== s) c.t++;
            return x;
          });
        }
        var blank = row.every(function(v){
          return String(v) === '';
        });
        if(ce.checked && blank){
          c.e++; return;
        }
        var key = row.join('\u0001');
        if(cd.checked){
          if(seen[key]){ c.d++; return; }
          seen[key] = 1;
        }
        out.push(row);
      });
      var nwb = X.utils.book_new();
      X.utils.book_append_sheet(nwb,
        X.utils.aoa_to_sheet(out), sn);
      var bin = X.write(nwb,
        {bookType: 'xlsx', type: 'array'});
      P.dlBin(bin,
        'cleaned-' + Date.now() + '.xlsx');
      say('完成 去重' + c.d + ' trim' + c.t +
        ' 空行' + c.e);
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
