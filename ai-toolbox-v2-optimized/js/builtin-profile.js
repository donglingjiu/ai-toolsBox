/* 内置默认模型：全站访客零配置可用；Key 在服务端，浏览器不存 */
(function(){
  'use strict';
  window.NOVA_BUILTIN_ID = 'builtin-zhipu';
  var K = 'at_settings_v1';
  try {
    var s = JSON.parse(localStorage.getItem(K) || '{}');
    s.llmProfiles = s.llmProfiles || [];
    var has = s.llmProfiles.some(function(p){
      return p.id === window.NOVA_BUILTIN_ID;
    });
    if (!has) {
      s.llmProfiles.unshift({
        id: window.NOVA_BUILTIN_ID,
        name: '智谱GLM(内置)',
        provider: 'openai-compatible',
        baseUrl: 'https://ai.donglingjiu.top/llm/bigmodel/api/paas/v4',
        apiKey: '',
        model: 'glm-4-flash',
        enabled: true
      });
      if (!s.activeProfileId) s.activeProfileId = window.NOVA_BUILTIN_ID;
      localStorage.setItem(K, JSON.stringify(s));
    }
  } catch (e) {}
})();
