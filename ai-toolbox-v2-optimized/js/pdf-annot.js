/* pdf-annot v1: page numbers + watermark + optimize
   复用 NovaPdf.fr/dl；pdf-lib 标准字体 → 水印限 ASCII（CJK 需内嵌字体，不在本版） */
(function(){
  var L = window.PDFLib;
  var P = window.NovaPdf;
  if(!L || !P) return;
  function $(id){ return document.getElementById(id); }
  function load(f){
    return P.fr(f).then(function(buf){
      return L.PDFDocument.load(buf, {ignoreEncryption: true});
    });
  }
  function fmt(n){
    return n > 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB';
  }
  function fail(el, e){
    el.textContent = '失败：' + String(e && e.message || e);
  }
  function asciiOnly(s){ return /^[\x20-\x7E]*$/.test(s); }

  /* ---- 1. 页码 ---- */
  var nf = $('n-file'), np = $('n-pos'), ns = $('n-size'),
      nst = $('n-start'), nsk = $('n-skip'),
      ng = $('n-go'), nmsg = $('n-st');
  if(nf && ng){
    ng.addEventListener('click', function(){
      var f = nf.files && nf.files[0];
      if(!f){ nmsg.textContent = '先选择 PDF'; return; }
      nmsg.textContent = '处理中...';
      var sz = parseInt(ns.value, 10) || 12;
      var st0 = parseInt(nst.value, 10) || 1;
      var skip = nsk.checked;
      var pos = np.value;
      load(f).then(function(doc){
        return doc.embedFont(L.StandardFonts.Helvetica).then(function(font){
          var done = 0;
          doc.getPages().forEach(function(pg, i){
            if(skip && i === 0) return;
            var s = pg.getSize();
            var txt = String(st0 + i);
            var tw = font.widthOfTextAtSize(txt, sz);
            var x = pos === 'bc' ? (s.width - tw) / 2 : s.width - tw - 30;
            var y = pos === 'tr' ? s.height - 36 : 24;
            pg.drawText(txt, {x: x, y: y, size: sz, font: font, color: L.rgb(0.35, 0.35, 0.35)});
            done++;
          });
          nmsg.textContent = '完成：' + done + ' 页已编号';
          return doc.save();
        });
      }).then(function(out){
        P.dl(out, 'numbered.pdf');
      }).catch(function(e){ fail(nmsg, e); });
    });
  }

  /* ---- 2. 水印（ASCII 平铺 45 度） ---- */
  var wf = $('w-file'), wt = $('w-text'), wd = $('w-density'),
      wo = $('w-op'), wg = $('w-go'), wmsg = $('w-st');
  if(wf && wg){
    wg.addEventListener('click', function(){
      var f = wf.files && wf.files[0];
      if(!f){ wmsg.textContent = '先选择 PDF'; return; }
      var txt = (wt.value || '').trim();
      if(!txt){ wmsg.textContent = '先填写水印文字'; return; }
      if(!asciiOnly(txt)){ wmsg.textContent = '水印暂限英文/数字/符号（中文需内嵌字体，后续版本）'; return; }
      wmsg.textContent = '处理中...';
      var di = parseInt(wd.value, 10) || 1;
      di = Math.min(2, Math.max(0, di));
      var op = parseFloat(wo.value) || 0.15;
      var stepX = [280, 210, 150][di];
      var stepY = [220, 160, 115][di];
      load(f).then(function(doc){
        return doc.embedFont(L.StandardFonts.HelveticaBold).then(function(font){
          doc.getPages().forEach(function(pg){
            var s = pg.getSize();
            for(var y = 30; y < s.height + stepY; y += stepY){
              for(var x = 30; x < s.width + stepX; x += stepX){
                pg.drawText(txt, {x: x, y: y, size: 26, font: font,
                  color: L.rgb(0.55, 0.55, 0.55), opacity: op,
                  rotate: L.degrees(45)});
              }
            }
          });
          wmsg.textContent = '完成：已平铺水印';
          return doc.save();
        });
      }).then(function(out){
        P.dl(out, 'watermarked.pdf');
      }).catch(function(e){ fail(wmsg, e); });
    });
  }

  /* ---- 3. 压缩瘦身（结构级，如实报数） ---- */
  var zf = $('z-file'), zg = $('z-go'), zmsg = $('z-st');
  if(zf && zg){
    zg.addEventListener('click', function(){
      var f = zf.files && zf.files[0];
      if(!f){ zmsg.textContent = '先选择 PDF'; return; }
      zmsg.textContent = '处理中...';
      P.fr(f).then(function(buf){
        var before = buf.byteLength;
        return L.PDFDocument.load(buf, {ignoreEncryption: true}).then(function(doc){
          return doc.save({useObjectStreams: true}).then(function(out){
            var after = out.length;
            var pct = before ? Math.round((before - after) * 100 / before) : 0;
            var verdict = pct > 0 ? '（瘦身 ' + pct + '%）'
              : pct < 0 ? '（增大 ' + (-pct) + '%，源文件已优化）' : '（持平）';
            zmsg.textContent = fmt(before) + ' → ' + fmt(after) + verdict;
            P.dl(out, 'optimized.pdf');
          });
        });
      }).catch(function(e){ fail(zmsg, e); });
    });
  }
})();
