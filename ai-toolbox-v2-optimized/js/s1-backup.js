/* S1 全站数据备份/恢复：localStorage + IndexedDB → 单个 JSON */
(function(){
  'use strict';
  function dl(name, text){
    var b = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 3000);
  }
  function openDB(name){
    return new Promise(function(res, rej){
      var r = indexedDB.open(name);
      r.onsuccess = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
    });
  }
  function getAll(db, store){
    return new Promise(function(res, rej){
      var rq = db.transaction(store, 'readonly').objectStore(store).getAll();
      rq.onsuccess = function(){ res(rq.result); };
      rq.onerror = function(){ rej(rq.error); };
    });
  }
  async function backupAll(){
    var out = { __nova_backup__: 1, at: new Date().toISOString(), ls: {}, idb: [] };
    try {
      for (var i = 0; i < localStorage.length; i++){
        var k = localStorage.key(i);
        out.ls[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    var dbs = [];
    try { dbs = await indexedDB.databases() || []; } catch (e) {}
    for (var d = 0; d < dbs.length; d++){
      try {
        var db = await openDB(dbs[d].name);
        var names = Array.prototype.slice.call(db.objectStoreNames || []);
        for (var s = 0; s < names.length; s++){
          out.idb.push({ db: dbs[d].name, store: names[s], rows: await getAll(db, names[s]) });
        }
        db.close();
      } catch (e) {}
    }
    dl('nova-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(out));
    return { ls: Object.keys(out.ls).length, stores: out.idb.length };
  }
  async function restoreAll(file){
    var data = JSON.parse(await file.text());
    if (!data || data.__nova_backup__ !== 1) throw new Error('不是有效的 Nova 备份文件');
    var n = 0;
    Object.keys(data.ls || {}).forEach(function(k){
      try { localStorage.setItem(k, data.ls[k]); n++; } catch (e) {}
    });
    for (var i = 0; i < (data.idb || []).length; i++){
      try {
        var rec = data.idb[i];
        var db = await openDB(rec.db);
        var ok = Array.prototype.slice.call(db.objectStoreNames).indexOf(rec.store) >= 0;
        if (ok){
          for (var j = 0; j < (rec.rows || []).length; j++){
            await new Promise(function(res, rej){
              var t = db.transaction(rec.store, 'readwrite');
              t.objectStore(rec.store).put(rec.rows[j]);
              t.oncomplete = res; t.onerror = function(){ rej(t.error); };
            });
            n++;
          }
        }
        db.close();
      } catch (e) {}
    }
    return n;
  }
  window.NovaBackup = { backupAll: backupAll, restoreAll: restoreAll };
})();
