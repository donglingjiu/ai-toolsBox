/* xl-split v1: chunk rows into CSV parts */
(function(){
  var X = window.XLSX, P = window.NovaXl;
  var sf = document.getElementById('sp-file');
  var sn = document.getElementById('sp-n');
  var sb = document.getElementById('sp-go');
  var sst = document.getElementById('sp-st');
  if(!X || !P || !sf || !sb) return;
  function say(t){ sst.textContent = t; }
  sb.addEventListener('click', function(){
    var f = sf.files && sf.files[0];
    if(!f){ say('先选择文件'); return; }
    var n = parseInt(sn.value, 10);
    if(!(n > 0)){
      say('每份行数需大于 0'); return;
    }
    say('处理中...');
    P.fr(f).then(function(buf){
      var wb = X.read(new Uint8Array(buf),
        {type: 'array'});
      var rows = X.utils.sheet_to_json(
        wb.Sheets[wb.SheetNames[0]],
        {header: 1, defval: '', raw: false});
      var head = rows[0] || [];
      var body = rows.slice(1);
      var base = f.name.replace(/\.[^.]+$/, '');
      var total = Math.max(1, Math.ceil(
        body.length / n));
      var k = 0;
      function one(){
        if(k * n >= body.length && k > 0){
          say('完成，共 ' + k + ' 份');
          return;
        }
        var aoa = [head].concat(
          body.slice(k * n, (k + 1) * n));
        var csv = X.utils.sheet_to_csv(
          X.utils.aoa_to_sheet(aoa));
        k++;
        P.dlText(csv,
          base + '-part' + k + '.csv',
          'text/csv;charset=utf-8', true);
        say(k + ' / ' + total);
        setTimeout(one, 350);
      }
      one();
    }).catch(function(e){
      say('失败: ' + e.message);
    });
  });
})();
