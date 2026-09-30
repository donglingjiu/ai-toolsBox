/* ============ 表格分析工具 · 核心逻辑（纯函数，可单测） ============ */
/* 依赖：全局 XLSX（js/vendor/xlsx.full.min.js）。解析 / 画像 / 受限变换 / 导出全部在本地完成。 */
'use strict';

/* ---------- 解析工作簿 ---------- */
/* 返回 { sheetNames, sheets:{name:{aoa}} }；aoa 为二维数组，保留原始类型 */
function xlsxParse(arrayBuffer) {
  var wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true, cellNF: false });
  var out = { sheetNames: wb.SheetNames.slice(), sheets: {} };
  wb.SheetNames.forEach(function (nm) {
    var ws = wb.Sheets[nm];
    /* header:1 → 每行是数组；defval:null 保留空单元格占位；raw:true 保留原始值 */
    var aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true, blankrows: false });
    out.sheets[nm] = { aoa: aoa };
  });
  return out;
}

/* ---------- 从 aoa 提取 {headers, rows} ---------- */
/* headerRow: 表头所在行下标（0 基）；其后为数据行。空表头列自动命名 列N */
function toTable(aoa, headerRow) {
  headerRow = headerRow || 0;
  if (!aoa || !aoa.length) return { headers: [], rows: [] };
  var raw = aoa[headerRow] || [];
  var width = 0;
  aoa.forEach(function (r) { if (r && r.length > width) width = r.length; });
  var headers = [];
  for (var c = 0; c < width; c++) {
    var h = raw[c];
    var name = (h == null || String(h).trim() === '') ? ('列' + (c + 1)) : String(h).trim();
    /* 去重同名列 */
    var base = name, k = 1;
    while (headers.indexOf(name) !== -1) { name = base + '_' + (++k); }
    headers.push(name);
  }
  var rows = [];
  for (var i = headerRow + 1; i < aoa.length; i++) {
    var r = aoa[i] || [];
    var obj = {};
    for (var j = 0; j < headers.length; j++) obj[headers[j]] = (r[j] === undefined ? null : r[j]);
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

/* ---------- 类型推断 ---------- */
function _cellType(v) {
  if (v == null || v === '') return 'empty';
  if (v instanceof Date) return 'date';
  if (typeof v === 'number') return 'number';
  if (typeof v === 'boolean') return 'boolean';
  var s = String(v).trim();
  if (/^-?\d+(\.\d+)?$/.test(s.replace(/,/g, ''))) return 'number';
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(s)) return 'date';
  return 'text';
}

/* ---------- 数据画像（本地统计，用于展示 + 给 AI 的摘要，不含全量数据） ---------- */
function profileTable(table, opt) {
  opt = opt || {};
  var sampleN = opt.sample || 5;
  var cols = table.headers.map(function (h) {
    var vals = table.rows.map(function (r) { return r[h]; });
    var nonNull = vals.filter(function (v) { return v != null && v !== ''; });
    var typeCount = {};
    nonNull.forEach(function (v) { var t = _cellType(v); typeCount[t] = (typeCount[t] || 0) + 1; });
    var domType = Object.keys(typeCount).sort(function (a, b) { return typeCount[b] - typeCount[a]; })[0] || 'empty';
    var uniq = {};
    nonNull.forEach(function (v) { uniq[String(v)] = 1; });
    var col = {
      name: h,
      type: domType,
      nonNull: nonNull.length,
      nullCount: vals.length - nonNull.length,
      unique: Object.keys(uniq).length,
    };
    if (domType === 'number') {
      var nums = nonNull.map(function (v) { return typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, '')); })
        .filter(function (n) { return !isNaN(n); });
      if (nums.length) {
        var sum = nums.reduce(function (a, b) { return a + b; }, 0);
        col.min = Math.min.apply(null, nums);
        col.max = Math.max.apply(null, nums);
        col.mean = sum / nums.length;
      }
    }
    return col;
  });
  var sample = table.rows.slice(0, sampleN);
  return {
    rowCount: table.rows.length,
    colCount: table.headers.length,
    columns: cols,
    sample: sample,
  };
}

/* 判断列名是否疑似敏感（默认不发送给 AI） */
function isSensitiveColumn(name) {
  return /手机|电话|phone|mobile|身份证|idcard|邮箱|email|地址|address|密码|password|token|secret|银行|卡号|account/i.test(String(name || ''));
}

/* ---------- 受限变换 DSL 校验 ---------- */
var ALLOWED_OPS = ['select_columns', 'rename_column', 'filter_rows', 'sort_rows', 'dedupe_rows', 'trim_text', 'coerce_number', 'group_aggregate', 'add_computed'];
var ALLOWED_AGG = ['sum', 'count', 'avg', 'min', 'max'];

function validateTransformPlan(plan, table) {
  if (!plan || typeof plan !== 'object') throw new Error('方案格式错误：非对象');
  if (!Array.isArray(plan.operations)) throw new Error('方案缺少 operations 数组');
  var headers = table.headers.slice();
  function assertCol(c, op) { if (headers.indexOf(c) === -1) throw new Error(op + '：列「' + c + '」不存在'); }
  plan.operations.forEach(function (op, i) {
    var tag = '操作#' + (i + 1) + '(' + op.type + ')';
    if (ALLOWED_OPS.indexOf(op.type) === -1) throw new Error(tag + '：不支持的操作类型');
    switch (op.type) {
      case 'select_columns':
        (op.columns || []).forEach(function (c) { assertCol(c, tag); });
        headers = op.columns.slice();
        break;
      case 'rename_column':
        assertCol(op.from, tag);
        headers = headers.map(function (h) { return h === op.from ? op.to : h; });
        break;
      case 'filter_rows':
        assertCol(op.column, tag);
        if (['eq', 'ne', 'gt', 'lt', 'ge', 'le', 'contains', 'not_empty', 'empty'].indexOf(op.op) === -1) throw new Error(tag + '：非法比较符');
        break;
      case 'sort_rows':
        assertCol(op.column, tag); break;
      case 'dedupe_rows':
        (op.keys || []).forEach(function (c) { assertCol(c, tag); }); break;
      case 'trim_text':
        (op.columns || []).forEach(function (c) { assertCol(c, tag); }); break;
      case 'coerce_number':
        assertCol(op.column, tag); break;
      case 'group_aggregate':
        (op.groupBy || []).forEach(function (c) { assertCol(c, tag); });
        (op.metrics || []).forEach(function (m) {
          assertCol(m.column, tag);
          if (ALLOWED_AGG.indexOf(m.op) === -1) throw new Error(tag + '：非法聚合 ' + m.op);
        });
        headers = (op.groupBy || []).concat((op.metrics || []).map(function (m) { return m.as || (m.op + '_' + m.column); }));
        break;
      case 'add_computed':
        if (!op.as) throw new Error(tag + '：缺少新列名 as');
        if (op.formula !== 'concat' && op.formula !== 'add' && op.formula !== 'subtract' && op.formula !== 'multiply' && op.formula !== 'divide') throw new Error(tag + '：仅支持 concat/add/subtract/multiply/divide');
        (op.columns || []).forEach(function (c) { assertCol(c, tag); });
        headers = headers.concat([op.as]);
        break;
    }
  });
  return true;
}

/* ---------- 执行受限变换（本地，确定性） ---------- */
function _num(v) { if (typeof v === 'number') return v; var n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isNaN(n) ? null : n; }

function applyTransformPlan(table, plan) {
  validateTransformPlan(plan, table);
  var headers = table.headers.slice();
  var rows = table.rows.map(function (r) { return Object.assign({}, r); });
  plan.operations.forEach(function (op) {
    if (op.type === 'select_columns') {
      headers = op.columns.slice();
      rows = rows.map(function (r) { var o = {}; headers.forEach(function (h) { o[h] = r[h]; }); return o; });
    } else if (op.type === 'rename_column') {
      headers = headers.map(function (h) { return h === op.from ? op.to : h; });
      rows = rows.map(function (r) { r[op.to] = r[op.from]; delete r[op.from]; return r; });
    } else if (op.type === 'filter_rows') {
      rows = rows.filter(function (r) {
        var v = r[op.column], val = op.value;
        switch (op.op) {
          case 'eq': return String(v) === String(val);
          case 'ne': return String(v) !== String(val);
          case 'gt': return _num(v) > _num(val);
          case 'lt': return _num(v) < _num(val);
          case 'ge': return _num(v) >= _num(val);
          case 'le': return _num(v) <= _num(val);
          case 'contains': return String(v == null ? '' : v).indexOf(String(val)) !== -1;
          case 'not_empty': return v != null && v !== '';
          case 'empty': return v == null || v === '';
        }
        return true;
      });
    } else if (op.type === 'sort_rows') {
      var dir = op.desc ? -1 : 1;
      rows.sort(function (a, b) {
        var x = a[op.column], y = b[op.column];
        var nx = _num(x), ny = _num(y);
        if (nx != null && ny != null) return (nx - ny) * dir;
        return String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'zh') * dir;
      });
    } else if (op.type === 'dedupe_rows') {
      var keys = op.keys && op.keys.length ? op.keys : headers;
      var seen = {}, keep = [];
      var iter = op.keep === 'last' ? rows.slice().reverse() : rows;
      iter.forEach(function (r) {
        var sig = keys.map(function (k) { return String(r[k]); }).join('\u0001');
        if (!seen[sig]) { seen[sig] = 1; keep.push(r); }
      });
      rows = op.keep === 'last' ? keep.reverse() : keep;
    } else if (op.type === 'trim_text') {
      op.columns.forEach(function (c) { rows.forEach(function (r) { if (typeof r[c] === 'string') r[c] = r[c].trim(); }); });
    } else if (op.type === 'coerce_number') {
      rows.forEach(function (r) { var n = _num(r[op.column]); r[op.column] = (n == null && op.invalid === 'null') ? null : (n == null ? r[op.column] : n); });
    } else if (op.type === 'group_aggregate') {
      var groups = {}, order = [];
      rows.forEach(function (r) {
        var key = (op.groupBy || []).map(function (g) { return String(r[g]); }).join('\u0001');
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(r);
      });
      var outHeaders = (op.groupBy || []).slice();
      (op.metrics || []).forEach(function (m) { outHeaders.push(m.as || (m.op + '_' + m.column)); });
      var outRows = order.map(function (key) {
        var members = groups[key], o = {};
        (op.groupBy || []).forEach(function (g) { o[g] = members[0][g]; });
        (op.metrics || []).forEach(function (m) {
          var col = m.as || (m.op + '_' + m.column);
          var nums = members.map(function (r) { return _num(r[m.column]); }).filter(function (n) { return n != null; });
          if (m.op === 'count') o[col] = members.length;
          else if (m.op === 'sum') o[col] = nums.reduce(function (a, b) { return a + b; }, 0);
          else if (m.op === 'avg') o[col] = nums.length ? nums.reduce(function (a, b) { return a + b; }, 0) / nums.length : null;
          else if (m.op === 'min') o[col] = nums.length ? Math.min.apply(null, nums) : null;
          else if (m.op === 'max') o[col] = nums.length ? Math.max.apply(null, nums) : null;
        });
        return o;
      });
      headers = outHeaders; rows = outRows;
    } else if (op.type === 'add_computed') {
      rows.forEach(function (r) {
        if (op.formula === 'concat') r[op.as] = (op.columns || []).map(function (c) { return r[c] == null ? '' : r[c]; }).join(op.sep || '');
        else {
          var ns = (op.columns || []).map(function (c) { return _num(r[c]) || 0; });
          var v = ns.length ? ns[0] : 0;
          for (var i = 1; i < ns.length; i++) {
            if (op.formula === 'add') v += ns[i];
            else if (op.formula === 'subtract') v -= ns[i];
            else if (op.formula === 'multiply') v *= ns[i];
            else if (op.formula === 'divide') v = ns[i] === 0 ? null : v / ns[i];
          }
          r[op.as] = v;
        }
      });
      if (headers.indexOf(op.as) === -1) headers.push(op.as);
    }
  });
  return { headers: headers, rows: rows };
}

/* ---------- 导出工作簿（防公式注入：文本单元格若以 =+-@ 开头加前导 '） ---------- */
function _safeCell(v) {
  if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}
function buildWorkbook(sheetsDef) {
  /* sheetsDef: [{name, headers, rows}] */
  var wb = XLSX.utils.book_new();
  sheetsDef.forEach(function (sd) {
    var aoa = [sd.headers.slice()];
    sd.rows.forEach(function (r) { aoa.push(sd.headers.map(function (h) { return _safeCell(r[h] == null ? '' : r[h]); })); });
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, (sd.name || 'Sheet').slice(0, 31));
  });
  return wb;
}
function workbookToBlob(wb, type) {
  var bookType = type === 'csv' ? 'csv' : 'xlsx';
  var out = XLSX.write(wb, { bookType: bookType, type: 'array' });
  var mime = bookType === 'csv' ? 'text/csv;charset=utf-8'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  return new Blob([out], { type: mime });
}

/* ---------- 构造给 AI 的分析提示（仅摘要 + 抽样，敏感列脱敏） ---------- */
function buildAnalyzePrompt(profile, headers, goal, includeSensitive) {
  var colDesc = profile.columns.map(function (c) {
    var masked = !includeSensitive && isSensitiveColumn(c.name);
    var extra = (!masked && c.type === 'number' && c.mean != null) ? ('，范围 ' + c.min + '~' + c.max + '，均值 ' + Math.round(c.mean * 100) / 100) : '';
    var typeLabel = masked ? c.type + ',敏感列已脱敏' : c.type;
    return '- ' + c.name + '（类型:' + typeLabel + '，非空:' + c.nonNull + '，唯一值:' + c.unique + '，空值:' + c.nullCount + extra + '）';
  }).join('\n');
  var sampleRows = profile.sample.map(function (r) {
    var o = {};
    headers.forEach(function (h) { o[h] = includeSensitive || !isSensitiveColumn(h) ? r[h] : '***'; });
    return o;
  });
  var opsRef = [
    'select_columns{columns:[]}', 'rename_column{from,to}',
    'filter_rows{column,op:eq|ne|gt|lt|ge|le|contains|not_empty|empty,value}',
    'sort_rows{column,desc:bool}', 'dedupe_rows{keys:[],keep:first|last}',
    'trim_text{columns:[]}', 'coerce_number{column,invalid:null|keep}',
    'group_aggregate{groupBy:[],metrics:[{column,op:sum|count|avg|min|max,as}]}',
    'add_computed{as,formula:concat|add|subtract|multiply|divide,columns:[],sep}',
  ].join('\n');
  return [
    '你是数据整理助手。下面是一张表格的结构摘要与少量样本行（并非全量数据）。',
    '用户目标：' + goal,
    '',
    '列信息：\n' + colDesc,
    '',
    '样本行（JSON）：\n' + JSON.stringify(sampleRows, null, 0),
    '',
    '请输出一个 JSON 对象（禁止 Markdown、禁止代码块、禁止解释文字），结构为：',
    '{"summary":"一句话说明整理思路","analysis":"对数据的简要分析","operations":[...]}',
    'operations 只能使用以下受限操作，且 column 必须是上面出现过的列名：',
    opsRef,
    '不要输出任何 JavaScript、公式、外部链接或未列出的操作。',
  ].join('\n');
}

/* 从模型输出中提取 JSON（兼容代码块包裹） */
function extractPlanJSON(text) {
  var t = String(text || '').trim();
  var fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  var start = t.indexOf('{'), end = t.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('未找到 JSON');
  return JSON.parse(t.slice(start, end + 1));
}

/* Node 单测导出 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { toTable: toTable, profileTable: profileTable, isSensitiveColumn: isSensitiveColumn, validateTransformPlan: validateTransformPlan, applyTransformPlan: applyTransformPlan, buildWorkbook: buildWorkbook, extractPlanJSON: extractPlanJSON, buildAnalyzePrompt: buildAnalyzePrompt, _cellType: _cellType };
}
