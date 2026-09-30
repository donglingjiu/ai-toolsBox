/* ============ 表格分析工具 · 页面交互 ============ */
'use strict';
(function () {
  var S = { parsed: null, table: null, profile: null, plan: null, result: null, fileName: '' };
  var $ = function (id) { return document.getElementById(id); };
  apiBannerIfNeeded();

  /* ---------- 拖放 / 选择文件 ---------- */
  var drop = $('drop'), fileInput = $('file');
  drop.addEventListener('click', function () { fileInput.click(); });
  drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('on'); });
  drop.addEventListener('dragleave', function () { drop.classList.remove('on'); });
  drop.addEventListener('drop', function (e) {
    e.preventDefault(); drop.classList.remove('on');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', function () { if (fileInput.files[0]) handleFile(fileInput.files[0]); });

  var MAX_BYTES = 8 * 1024 * 1024;
  function handleFile(file) {
    if (file.size > MAX_BYTES) { toast('文件超过 8MB，建议先拆分或用桌面 Excel 处理', 'warn'); return; }
    S.fileName = file.name.replace(/\.[^.]+$/, '');
    var info = $('fileinfo');
    info.style.display = 'block';
    info.textContent = '正在解析：' + file.name + '（' + (file.size / 1024).toFixed(1) + ' KB）';
    file.arrayBuffer().then(function (buf) {
      try {
        S.parsed = xlsxParse(buf);
      } catch (e) { info.textContent = '解析失败：' + (e.message || e); return; }
      info.textContent = '已解析：' + file.name + ' · 共 ' + S.parsed.sheetNames.length + ' 个工作表';
      var sel = $('sheetSel'); sel.innerHTML = '';
      S.parsed.sheetNames.forEach(function (nm) { sel.appendChild(el('option', { value: nm }, nm)); });
      $('sheetPick').classList.remove('hide');
      buildTable();
    });
  }

  $('reloadBtn').addEventListener('click', buildTable);
  $('sheetSel').addEventListener('change', buildTable);

  function buildTable() {
    if (!S.parsed) return;
    var nm = $('sheetSel').value || S.parsed.sheetNames[0];
    var hr = Math.max(1, parseInt($('headerRow').value, 10) || 1) - 1;
    var aoa = S.parsed.sheets[nm].aoa;
    S.table = toTable(aoa, hr);
    if (!S.table.headers.length) { toast('该工作表为空', 'warn'); return; }
    S.profile = profileTable(S.table, { sample: 8 });
    renderPreview();
    $('previewCard').classList.remove('hide');
    $('aiCard').classList.remove('hide');
    $('planCard').classList.add('hide');
    $('resultCard').classList.add('hide');
  }

  function renderPreview() {
    $('profileInfo').innerHTML = '共 <b>' + S.profile.rowCount + '</b> 行 · <b>' + S.profile.colCount + '</b> 列';
    var chips = $('colChips'); chips.innerHTML = '';
    S.profile.columns.forEach(function (c) {
      var sens = isSensitiveColumn(c.name);
      chips.appendChild(el('span', { class: 'chip' + (sens ? ' sens' : '') },
        c.name + ' · ' + c.type + (c.nullCount ? ' · 空' + c.nullCount : '') + (sens ? ' · 敏感' : '')));
    });
    renderDataTable($('previewTbl'), S.table.headers, S.profile.sample);
  }

  function renderDataTable(tbl, headers, rows) {
    tbl.innerHTML = '';
    var thead = el('thead'), htr = el('tr');
    headers.forEach(function (h) { htr.appendChild(el('th', {}, h)); });
    thead.appendChild(htr); tbl.appendChild(thead);
    var tbody = el('tbody');
    rows.forEach(function (r) {
      var tr = el('tr');
      headers.forEach(function (h) {
        var v = r[h];
        tr.appendChild(el('td', {}, v == null ? '' : (v instanceof Date ? v.toISOString().slice(0, 10) : String(v))));
      });
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
  }

  /* ---------- AI 生成方案 ---------- */
  $('sendSensitive').addEventListener('change', function () {
    $('privacyNote').innerHTML = this.checked
      ? '<b style="color:#b45309;">已允许发送敏感列真实值</b>：请确认接口可信。整表数据仍不会发送，只发送样本行。'
      : 'AI 分析时，仅把<b>列信息摘要 + 前几行样本</b>发送到你在设置里配置的模型接口；疑似敏感列默认以 *** 脱敏。整表数据不会发送。';
  });

  $('aiBtn').addEventListener('click', async function () {
    var goal = $('goal').value.trim();
    if (!goal) { setStatus('aiStatus', '请先描述整理目标', false); return; }
    if (!llmReady()) { setStatus('aiStatus', '请先在「设置」页配置文本模型', false); return; }
    var btn = this; btn.disabled = true;
    setStatus('aiStatus', 'AI 分析中…');
    var prompt = buildAnalyzePrompt(S.profile, S.table.headers, goal, $('sendSensitive').checked);
    try {
      var out = await llmChat([{ role: 'user', content: prompt }], { temperature: 0.2 });
      var plan;
      try { plan = extractPlanJSON(out); } catch (e) { throw new Error('模型未返回合法 JSON，请重试或换用其它模型'); }
      validateTransformPlan(plan, S.table);
      S.plan = plan;
      renderPlan();
      $('planCard').classList.remove('hide');
      setStatus('aiStatus', '✅ 方案已生成，请在下方确认', true);
    } catch (e) {
      setStatus('aiStatus', '❌ ' + (e.message || e), false);
    } finally { btn.disabled = false; }
  });

  $('localBtn').addEventListener('click', function () {
    S.result = { headers: S.table.headers.slice(), rows: S.table.rows.slice() };
    S.plan = null;
    renderResult('（未使用 AI，直接导出原表）');
  });

  function renderPlan() {
    $('planSummary').innerHTML = '<b>思路：</b>' + escapeHtml(S.plan.summary || '') +
      (S.plan.analysis ? '<div class="privacy" style="margin-top:8px;">' + escapeHtml(S.plan.analysis) + '</div>' : '');
    var ul = $('planOps'); ul.innerHTML = '';
    (S.plan.operations || []).forEach(function (op) {
      ul.appendChild(el('li', {}, describeOp(op)));
    });
  }

  function describeOp(op) {
    switch (op.type) {
      case 'select_columns': return '保留列：' + (op.columns || []).join('、');
      case 'rename_column': return '重命名：' + op.from + ' → ' + op.to;
      case 'filter_rows': return '筛选：' + op.column + ' ' + op.op + ' ' + (op.value != null ? op.value : '');
      case 'sort_rows': return '排序：按 ' + op.column + (op.desc ? ' 降序' : ' 升序');
      case 'dedupe_rows': return '去重：按 ' + (op.keys || []).join('、') + '（保留' + (op.keep === 'last' ? '最后' : '第一') + '条）';
      case 'trim_text': return '去除首尾空格：' + (op.columns || []).join('、');
      case 'coerce_number': return '转为数值：' + op.column;
      case 'group_aggregate': return '分组汇总：按 ' + (op.groupBy || []).join('、') + '，' + (op.metrics || []).map(function (m) { return m.op + '(' + m.column + ')'; }).join('、');
      case 'add_computed': return '新增列 ' + op.as + '：' + op.formula + '(' + (op.columns || []).join('、') + ')';
    }
    return op.type;
  }

  $('skipPlanBtn').addEventListener('click', function () { S.plan = null; $('planCard').classList.add('hide'); });

  $('applyBtn').addEventListener('click', function () {
    try {
      S.result = applyTransformPlan(S.table, S.plan);
      renderResult(S.plan.summary || '');
      setStatus('planStatus', '✅ 已应用', true);
    } catch (e) { setStatus('planStatus', '❌ 执行失败：' + (e.message || e), false); }
  });

  function renderResult(note) {
    $('resultInfo').innerHTML = '结果：<b>' + S.result.rows.length + '</b> 行 · <b>' + S.result.headers.length + '</b> 列' +
      (note ? '<div class="privacy" style="margin-top:8px;">' + escapeHtml(note) + '</div>' : '');
    renderDataTable($('resultTbl'), S.result.headers, S.result.rows.slice(0, 30));
    $('resultCard').classList.remove('hide');
    $('resultCard').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- 导出 ---------- */
  $('dlXlsx').addEventListener('click', function () {
    var wb = buildWorkbook([{ name: '整理结果', headers: S.result.headers, rows: S.result.rows }]);
    downloadBlob(S.fileName + '_整理结果.xlsx', workbookToBlob(wb, 'xlsx'));
  });
  $('dlCsv').addEventListener('click', function () {
    var wb = buildWorkbook([{ name: '整理结果', headers: S.result.headers, rows: S.result.rows }]);
    downloadBlob(S.fileName + '_整理结果.csv', workbookToBlob(wb, 'csv'));
  });
  $('dlReport').addEventListener('click', function () {
    var lines = ['表格分析说明', '源文件：' + S.fileName, '结果行数：' + S.result.rows.length + '，列数：' + S.result.headers.length, ''];
    if (S.plan) {
      lines.push('整理思路：' + (S.plan.summary || ''));
      if (S.plan.analysis) lines.push('数据分析：' + S.plan.analysis);
      lines.push('', '执行的操作：');
      (S.plan.operations || []).forEach(function (op, i) { lines.push((i + 1) + '. ' + describeOp(op)); });
    } else {
      lines.push('（未使用 AI，直接导出）');
    }
    downloadText(S.fileName + '_分析说明.txt', lines.join('\n'));
  });

  function setStatus(id, msg, ok) {
    var e = $(id); e.textContent = msg; e.className = 'status ' + (ok === true ? 'ok' : ok === false ? 'err' : '');
  }
})();
