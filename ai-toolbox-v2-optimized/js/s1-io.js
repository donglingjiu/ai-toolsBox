/* S1 数据备份/恢复 · 全站浮动入口（依赖 s1-backup.js）*/
(function(){
  'use strict';
  if (document.getElementById('s1-io')) return;
  var st = document.createElement('style'); st.id = 's1-io-style';
  st.textContent = '#s1-io{position:fixed;right:14px;bottom:60px;z-index:9999;display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-size:12px}' +
    '#s1-io button{padding:7px 12px;border:1px solid #d9ddf0;border-radius:999px;background:#fff;box-shadow:0 4px 14px rgba(31,36,48,.12);cursor:pointer;color:#333c56}' +
    '#s1-io button:hover{border-color:#8fa0ff}' +
    '#s1-io .s1-msg{background:#fff;border:1px solid #e6e8f2;border-radius:8px;padding:6px 10px;color:#5a6178;max-width:280px}';
  document.head.appendChild(st);
  var box = document.createElement('div'); box.id = 's1-io';
  var bk = document.createElement('button'); bk.textContent = '⬇ 备份全站数据';
  var rs = document.createElement('button'); rs.textContent = '⬆ 恢复备份';
  var fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.json'; fi.hidden = true;
  var mg = document.createElement('div'); mg.className = 's1-msg'; mg.hidden = true;
  box.appendChild(bk); box.appendChild(rs); box.appendChild(fi); box.appendChild(mg);
  document.body.appendChild(box);
  function say(t){ mg.hidden = false; mg.textContent = t; setTimeout(function(){ mg.hidden = true; }, 6000); }
  bk.addEventListener('click', async function(){
    bk.disabled = true; say('打包中…');
    try { var r = await NovaBackup.backupAll(); say('✅ 已导出 ' + r.ls + ' 键 · ' + r.stores + ' 库表'); }
    catch (e) { say('❌ ' + e.message); }
    bk.disabled = false;
  });
  rs.addEventListener('click', function(){ fi.click(); });
  fi.addEventListener('change', async function(){
    var f = fi.files[0]; if (!f) return; say('恢复中…');
    try { var n = await NovaBackup.restoreAll(f); say('✅ 写回 ' + n + ' 条，刷新生效'); }
    catch (e) { say('❌ ' + e.message); }
    fi.value = '';
  });
})();
