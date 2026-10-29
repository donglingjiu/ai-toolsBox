/* 客户端防护门槛：拦截常用入口 + 开发者工具打开时模糊整页 */
(function(){
  'use strict';
  /* guard-owner-bypass-v1: owner opt-out */
  try{
    if(localStorage.getItem('novaOwner') === '1') return;
  }catch(e){}
  function deny(e){ e.preventDefault(); return false; }
  document.addEventListener('keydown', function(e){
    var k = (e.key || '').toUpperCase();
    if (k === 'F12') return deny(e);
    if (e.ctrlKey && e.shiftKey && (k==='I'||k==='J'||k==='C')) return deny(e);
    if (e.ctrlKey && (k === 'U' || k === 'S')) return deny(e);
  });
  document.addEventListener('contextmenu', deny);
  var st = document.createElement('style');
  st.textContent = '.nova-guard-on{filter:blur(14px);pointer-events:none}';
  document.head.appendChild(st);
  var banner = document.createElement('div');
  banner.textContent = '⚠️ 检测到开发者工具，关闭后恢复使用';
  banner.style.cssText = 'position:fixed;left:0;right:0;top:40%;' +
    'text-align:center;z-index:99999;display:none;' +
    'font:600 16px system-ui;color:#b91c1c';
  document.addEventListener('DOMContentLoaded', function(){
    document.body.appendChild(banner);
  });
  var on = false;
  setInterval(function(){
    var now = window.outerWidth - window.innerWidth > 170 ||
              window.outerHeight - window.innerHeight > 170;
    if (now !== on) {
      on = now;
      document.documentElement.classList.toggle('nova-guard-on', on);
      banner.style.display = on ? 'block' : 'none';
    }
  }, 900);
})();
