/* excel-tools v1: read xlsx/csv + preview + export */
(function(){
  var X = window.XLSX;
  var xf = document.getElementById('x-file');
  var xs = document.getElementById('x-sheet');
  var xp = document.getElementById('x-prev');
  var xc = document.getElementById('x-csv');
  var xj = document.getElementById('x-json');
  var st = document.getElementById('x-st');
  if(!X || !xf) return;
  var wb = null;
  function say(t){ st.textContent = t; }
  function ws(){ return wb ? wb.Sheets[xs.value] : null; }
  xf.addEventListener('change', function(){
    var f = xf.files && xf.files[0];
    if(!f) return;
    say('读取中...');
    var r = new FileReader();
    r.onload = function(){
      try{
        wb = X.read(new Uint8Array(r.result),
          {type: 'array'});
      }catch(e){
        say('解析失败: ' + e.message);
        return;
      }
      xs.innerHTML = '';
      wb.SheetNames.forEach(function(n){
        var o = document.createElement('option');
        o.value = n;
        o.textContent = n;
        xs.appendChild(o);
      });
      say('已读入: ' + f.name);
      prev();
    };
    r.onerror = function(){ say('读取失败'); };
    r.readAsArrayBuffer(f);
  });
  xs.addEventListener('change', prev);
  function prev(){
    var w = ws();
    xp.innerHTML = '';
    if(!w) return;
    var rows = X.utils.sheet_to_json(w,
      {header: 1, defval: ''});
    var t = document.createElement('table');
    rows.slice(0, 20).forEach(function(row){
      var tr = document.createElement('tr');
      row.slice(0, 10).forEach(function(c){
        var td = document.createElement('td');
        td.textContent = String(c);
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    xp.appendChild(t);
    var h = document.createElement('div');
    h.className = 'hint';
    h.textContent = '预览前 20 行 × 前 10 列，'
      + '共 ' + rows.length + ' 行';
    xp.appendChild(h);
  }
  function base(){
    var f = xf.files && xf.files[0];
    var b = f ? f.name.replace(/\.[^.]+$/, '') : 'sheet';
    return b + '-' + (xs.value || 'data');
  }
  function dl(txt, ext, mime, bom){
    var head = bom ? '\ufeff' : '';
    var b = new Blob([head + txt], {type: mime});
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u;
    a.download = base() + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){
      URL.revokeObjectURL(u);
    }, 2000);
  }
  xc.addEventListener('click', function(){
    if(!ws()){ say('先选择文件'); return; }
    dl(X.utils.sheet_to_csv(ws()), '.csv',
      'text/csv;charset=utf-8', true);
    say('CSV 已下载');
  });
  xj.addEventListener('click', function(){
    if(!ws()){ say('先选择文件'); return; }
    var j = X.utils.sheet_to_json(ws(), {defval: ''});
    dl(JSON.stringify(j, null, 2), '.json',
      'application/json;charset=utf-8', false);
    say('JSON 已下载');
  });
})();
