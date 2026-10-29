/* xl-util v1: shared helpers for excel suite */
(function(){
  function fr(f){
    return new Promise(function(res, rej){
      var r = new FileReader();
      r.onload = function(){ res(r.result); };
      r.onerror = function(){
        rej(new Error('read fail'));
      };
      r.readAsArrayBuffer(f);
    });
  }
  function dl(b, name, mime){
    var u = URL.createObjectURL(
      new Blob([b], {type: mime}));
    var a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){
      URL.revokeObjectURL(u);
    }, 2000);
  }
  function dlText(t, name, mime, bom){
    dl((bom ? '\ufeff' : '') + t, name,
      mime || 'text/plain');
  }
  function dlBin(b, name){
    dl(b, name, 'application/octet-stream');
  }
  window.NovaXl = { fr: fr,
    dlText: dlText, dlBin: dlBin };
})();
