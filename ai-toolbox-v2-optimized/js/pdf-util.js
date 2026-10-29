/* pdf-util v1: shared helpers for pdf tools */
(function(){
  function fr(f){
    return new Promise(function(res, rej){
      var r = new FileReader();
      r.onload = function(){ res(r.result); };
      r.onerror = function(){ rej(new Error('read fail')); };
      r.readAsArrayBuffer(f);
    });
  }
  function dl(buf, name, mime){
    var b = new Blob([buf],
      {type: mime || 'application/pdf'});
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){
      URL.revokeObjectURL(u);
    }, 3000);
  }
  window.NovaPdf = { fr: fr, dl: dl };
})();
