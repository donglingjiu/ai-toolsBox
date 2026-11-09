/* learn-bridge.js v1 - prompts outBox -> ai-brain/docs bridge */
'use strict';
(function(){
  function save(name, text) {
    var t = String(text || '');
    if (!t.length) {
      try { toast('内容为空，未保存', 'err'); } catch (e) {}
      return Promise.resolve(false);
    }
    if (typeof idbPut !== 'function') {
      try { toast('存储助手不可用', 'err'); } catch (e) {}
      return Promise.resolve(false);
    }
    var doc = {
      id: 'doc_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
      name: String(name || '提示词结果'),
      content: t,
      created: Date.now(),
      size: t.length
    };
    return idbPut('ai-brain', 'docs', doc).then(function () {
      var ok = '已存入知识库：' + doc.name + '（brain 学习中心可消化）';
      try { toast(ok, 'ok'); } catch (e) {}
      return true;
    }).catch(function (e) {
      try { toast('存入失败：' + (e.message || e), 'err'); } catch (e2) {}
      return false;
    });
  }
  window.LearnBridge = { save: save };
})();
