/* 小包宝 PeriPal · 复发性心包炎工作台原型 v0.2
 * 结构对齐家族基准：小粉宝 v0.4（hero/五Tab/指标卡3D/primer 接线）、小橙宝 v0.2（导航分组/泳道/AI 面板）。
 * 非肿瘤语义：发作—缓解表达；无病期/线序/疗效/预后；阈值一律【待核】。
 * 数据唯一源：demo-data.js；页面不写死业务数字。全部为合成示例。
 */
(function (global) {
  'use strict'

  var APP_INFO = { version: '__VERSION_DISPLAY__', build: '__BUILD_DATE__' }
  var DATA = window.DEMO_DATA
  var TODAY = DATA.TODAY

  /* ---------- 常量 ---------- */
  var PAGES = [
    ['dash', '看板', 'home'],
    ['events', '发作与缓解', 'wave'],
    ['labs', '化验与趋势', 'flask'],
    ['treatment', '治疗记录', 'pill'],
    ['visits', '就诊准备', 'bag'],
    ['reports', '报告与原件', 'file'],
    ['mind', '心理与家庭', 'heart'],
    ['records', '病情档案', 'folder'],
    ['clinical', '临床', 'micro']
  ]
  var SUBPAGES = {
    events: [['list', '发作记录'], ['timeline', '时间线区间带']],
    labs: [['list', '化验列表'], ['chart', '一图秀']],
    treatment: [['log', '按次登记'], ['meds', '日常用药']],
    visits: [['prep', '复诊问题清单'], ['hospitals', '就医信息']],
    reports: [['list', '最近报告'], ['wall', '原件墙']],
    mind: [['feel', '当下感受'], ['family', '家庭与照护']],
    records: [['archive', '病情档案'], ['metrics', '指标检测'], ['summary', '病情汇总']],
    clinical: [['status', '数据库状态'], ['browse', '登记浏览']]
  }
  var SUBTITLES = {
    dash: '状态与最近变化都由你记录的事实算出；本台只回顾，不解读。',
    events: '每一次发作与缓解都算一条记录；这里只整理事实，不判断严重程度。',
    labs: '化验按「方法+机构」分组可比；不同方法不合并、不做差。',
    treatment: '按次登记医生安排的治疗；剂量与疗程以处方原件为准，本台不录判定。',
    visits: '复诊前把想问的事列清楚；就医信息支持多家医院。',
    reports: '报告与原件的登记处；私密报告不进导出与 AI 上下文。',
    mind: '只记录感受与家人支持事项，不做情绪评分。',
    records: '档案总览；派生数字（如缓解天数）读时计算，不落任何判定。',
    clinical: '临床试验与登记快照的离线检索；登记状态一律未核实，不做匹配打分。'
  }
  /* 设置（乳腺癌式弹层）：三 tab，顶栏「设置」打开 */
  var CFG_TABS = [['workspace', '工作区'], ['mineru', '文档解析（MinerU）'], ['clinic', '临床数据库']]
  /* 指标元数据唯一源 = demo-data.js 的 metricDefs/metricGroups；无数据文件时给最小兜底 */
  var METRIC_DEFS = DATA.metricDefs || [
    { key: 'CRP', title: 'CRP', category: 'inflammation', color: '#2f6f8f', ord: 0 },
    { key: 'ESR', title: 'ESR', category: 'inflammation', color: '#c96f2f', ord: 1 },
    { key: '体温', title: '体温', category: 'vitals', color: '#6b5b95', ord: 2 }
  ]
  var METRIC_ORDER = METRIC_DEFS.map(function (d) { return d.key })
  var METRIC_COLORS = {}, METRIC_TITLES = {}
  METRIC_DEFS.forEach(function (d) { METRIC_COLORS[d.key] = d.color; METRIC_TITLES[d.key] = d.title })
  var METRIC_GROUPS = DATA.metricGroups || [{ key: 'inflammation', title: '炎症指标', items: METRIC_ORDER.slice(0, 2) }]
  var RANGE_DEFS = [
    ['all', '全部'], ['1m', '近 1 月'], ['3m', '近 3 月'], ['6m', '近 6 月'], ['12m', '近 12 月']
  ]
  var EMBEDDED = (function () { try { return global.window !== global.top } catch (e) { return false } }())

  /* ---------- 状态 ---------- */
  var state = {
    profileId: DATA.profiles[0].id,
    page: 'dash',
    sub: {},
    range: 'all',
    picked: (function () { var o = {}; (DATA.metricDefs || []).forEach(function (d) { o[d.key] = (d.key === 'CRP' || d.key === 'ESR') }); return o })(),
    showEpisodes: true,
    flipped: {},
    agentOpen: false,
    sessions: {},
    draft: {}
  }

  /* ---------- 小工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel) }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }
  function fmtDate(d) { return d == null || d === '' ? '未知' : d }
  function daysBetween(a, b) {
    if (!a || !b) return null
    return Math.round((new Date(b) - new Date(a)) / 86400000)
  }
  function toast(msg) {
    var t = $('#toast')
    t.textContent = msg
    t.classList.add('show')
    clearTimeout(t._tid)
    t._tid = setTimeout(function () { t.classList.remove('show') }, 2200)
  }
  function profile() {
    return DATA.profiles.find(function (p) { return p.id === state.profileId })
  }
  /* 派生值读时算：状态卡三个数字——基于共享发作记录（私密不进三出口聚合，契约 Q35） */
  function derivedStatus() {
    var flaps = sharedOnly(profile().flaps)
    var act = flaps.find(function (f) { return f.end == null })
    var out = {}
    if (act) {
      out.mode = '发作中'
      out.dayN = daysBetween(act.start, TODAY) + 1
      var lastEnd = flaps.filter(function (f) { return f.end != null && f.end < act.start }).map(function (f) { return f.end }).sort().pop()
      out.sinceLast = lastEnd ? daysBetween(lastEnd, act.start) : null
    } else {
      var ends = flaps.map(function (f) { return f.end }).filter(Boolean).sort()
      var last = ends[ends.length - 1]
      out.mode = '缓解期'
      out.dayN = last ? daysBetween(last, TODAY) + 1 : null
      out.sinceLast = last ? daysBetween(last, TODAY) : null
    }
    out.nearCount = flaps.filter(function (f) { return new Date(f.start) >= nearCutoff() }).length
    out.privateFlaps = profile().flaps.length - flaps.length
    return out
  }
  /* P1：近 90 天窗口常量唯一源 */
  var NEAR_DAYS = 90
  function nearCutoff() {
    var d = new Date(TODAY); d.setDate(d.getDate() - NEAR_DAYS)
    return d
  }
  /* 私密过滤：三出口共用 */
  function isPrivate(x) { return !!x.private }
  function sharedOnly(list) { return (list || []).filter(function (x) { return !isPrivate(x) }) }
  function privacyLine(list) {
    var n = (list || []).length
    var m = (list || []).filter(isPrivate).length
    if (!n) return ''
    return m ? '本页 ' + n + ' 条中私密 ' + m + ' 条：私密记录不进看板摘要、导出与 AI 上下文。' : '本页 ' + n + ' 条，无私密标记。'
  }
  function aiBtn(page) {
    return '<button class="soft" data-action="ai" data-page="' + page + '">和 AI 讨论</button>'
  }
  function head(title, sub, page) {
    return '<div class="page-head"><div><span class="eyebrow">小包宝 · ' + esc(profile().name) + '</span><h1>' + esc(title) + '</h1><p>' + esc(sub || '') + '</p></div><div class="actions">' + aiBtn(page) + '</div></div>'
  }
  function section(title, desc, actionHtml) {
    return '<div class="section-title"><div><h2>' + esc(title) + '</h2>' + (desc ? '<p>' + esc(desc) + '</p>' : '') + '</div>' + (actionHtml || '') + '</div>'
  }
  function go(page, sub) {
    state.page = page
    if (sub) state.sub[page] = sub
    render()
  }
  function subOf(page) {
    var subs = SUBPAGES[page]
    if (!subs) return ''
    var cur = state.sub[page]
    if (!subs.some(function (s) { return s[0] === cur })) cur = subs[0][0]
    return cur
  }
  function subnav(page) {
    var subs = SUBPAGES[page]
    if (!subs) return ''
    var cur = subOf(page)
    return '<nav class="subnav" role="tablist" aria-label="二级页签">' + subs.map(function (s) {
      return '<button role="tab" aria-selected="' + (s[0] === cur) + '" data-action="sub" data-sub="' + s[0] + '">' + esc(s[1]) + '</button>'
    }).join('') + '</nav>'
  }
  function aiPromptFor(page) {
    var p = profile()
    var fact = ''
    if (page === 'labs') fact = '共 ' + sharedOnly(p.labs).length + ' 条化验记录（已排除私密）'
    else if (page === 'events') fact = '共 ' + sharedOnly(p.flaps).length + ' 次发作记录'
    else if (page === 'treatment') fact = '共 ' + sharedOnly(p.treatments).length + ' 条治疗登记'
    else if (page === 'visits') fact = '待问问题 ' + sharedOnly(p.questions).filter(function (q) { return !q.answered }).length + ' 条'
    else if (page === 'reports') fact = '报告 ' + sharedOnly(p.reports).length + ' 份'
    else if (page === 'mind') fact = '感受记录 ' + sharedOnly(p.mind.feel).length + ' 条、家人记录 ' + sharedOnly(p.mind.family).length + ' 条'
    else if (page === 'records') fact = '档案字段 ' + Object.keys(p.profile).length + ' 项'
    else if (page === 'clinical') fact = '试验快照 97 条（登记状态未核实，不做匹配打分）'
    else if (page === 'dash') fact = '状态：' + (derivedStatus().mode)
    return '和 AI 讨论本页（' + esc(profile().name) + ' · ' + fact + '）：帮我梳理这一页上我能核对的事实，以及我还没问医生的问题。只整理事实，判断交给医生。'
  }

  /* ---------- 页面：看板 ---------- */
  function pageDash() {
    var p = profile()
    var st = derivedStatus()
    var flaps = p.flaps
    var statusMain
    if (st.dayN == null) {
      statusMain = '<p class="small-note">还没有发作/缓解记录。先去「发作与缓解」记一条，状态卡就会亮起来。</p>'
    } else if (st.mode === '发作中') {
      statusMain = '<div class="stage-day"><b>发作中第 ' + st.dayN + ' 天</b><small>自 ' + esc(fmtDate(profile().flaps.find(function (f) { return f.end == null && !f.private }).start)) + ' 起</small></div>'
    } else {
      statusMain = '<div class="stage-day"><b>缓解期第 ' + st.dayN + ' 天</b><small>自最近一次缓解 ' + esc(fmtDate(activeEnd())) + ' 起</small></div>'
    }
    var since = st.sinceLast == null ? '未知' : st.sinceLast + ' 天'
    var prime = '<section class="card stage-card"><span class="eyebrow">状态卡 · 数字由发作记录算出，不是医生判断</span>' + statusMain +
      '<div class="stage-now"><span class="pill">' + esc(st.mode) + '</span><span>距上次发作：' + esc(since) + '</span><span>' + esc('近 ' + NEAR_DAYS + ' 天') + '发作 ' + st.nearCount + ' 次' + (st.privateFlaps ? '（另有私密 ' + st.privateFlaps + ' 条未计入）' : '') + '</span></div>' +
      '<p class="small-note">这些数字只统计你已记录的事件；漏记会让它偏小。口径以医生安排为准。</p>' +
      '<div class="stage-actions"><button class="primary" data-action="go" data-page="events">记一次发作或缓解 →</button>' +
      '<button class="soft" data-primer-open aria-label="疾病概要：复发性心包炎是什么？">疾病概要：复发性心包炎是什么？</button></div></section>'
    var docWords = p.profile['医生行动计划原话']
    var actionStrip = docWords
      ? '<div class="alert-strip"><div><b>医生行动计划（原话照录）</b><p>' + esc(docWords) + '</p></div><div class="actions"><button class="primary" data-action="go" data-page="visits">复诊准备 →</button></div></div>'
      : '<div class="alert-strip"><div><b>还没有医生确认的行动计划</b><p>什么时候该联系医生，请直接问医生；确认后可以把原话记进档案。</p></div><div class="actions"><button data-action="go" data-page="visits">去复诊准备 →</button></div></div>'
    var quick = '<div class="grid three">' +
      taskEntry('🌊', '记发作 / 缓解', '一条一条记，不漏', 'events') +
      taskEntry('🧪', '看化验趋势', '按方法分组，不合并', 'labs') +
      taskEntry('💊', '登记按次治疗', '注射、调药逐条记', 'treatment') +
      '</div>'
    var crpRows = sharedOnly(p.labs).filter(function (l) { return l.metric === 'CRP' }).sort(function (a, b) { return a.date < b.date ? -1 : 1 })
    var mini = ''
    if (crpRows.length) {
      var vals = crpRows.map(function (l) { return l.value })
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals)
      var pts = crpRows.map(function (l, i) {
        var x = 10 + i * (180 / Math.max(1, crpRows.length - 1))
        var y = 50 - (mx === mn ? 20 : (l.value - mn) / (mx - mn) * 40)
        var lastOne = i === crpRows.length - 1
        return (i ? '<line x1="' + (10 + (i - 1) * (180 / Math.max(1, crpRows.length - 1))) + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="#2f6f8f" stroke-width="2"/>' : '') +
          (lastOne ? '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#2f6f8f"><title>CRP ' + esc(l.value) + ' ' + esc(l.unit) + ' · ' + esc(l.date) + '</title></circle>' : '<circle cx="' + x + '" cy="' + y + '" r="2.5" fill="#2f6f8f"/>')
      }).join('')
      mini = '<section class="card mini-chart"><div class="card-head"><h3>CRP 最近走势（缩略）</h3><span class="pill">点末点看详情</span></div><button class="mini-pt" data-open="chart" data-metric="CRP" aria-label="看 CRP 最近一次数据点详情"><svg viewBox="0 0 200 60" role="img" aria-label="CRP 缩略走势，末点可点开数据点详情">' + pts + '</svg></button><p class="small-note">仅回顾，不解读；完整趋势见一图秀。<button class="linkish" data-open="labs">化验速览（整页层）</button></p></section>'
    }
    var reps = sharedOnly(p.reports).slice().sort(function (a, b) { return b.date < a.date ? -1 : 1 }).slice(0, 5)
    var privR = privacyLine(p.reports)
    var recent = '<section class="card"><div class="card-head"><h3>最近报告</h3><button class="linkish" data-action="go" data-page="reports">全部报告 →</button></div>' +
      (reps.length ? '<div class="table-wrap"><table><thead><tr><th>日期</th><th>名称</th><th>类型</th><th>原件</th></tr></thead><tbody>' +
        reps.map(function (r) { return '<tr><td>' + esc(fmtDate(r.date)) + '</td><td><button class="linkish" data-open="report" data-id="' + r.id + '">' + esc(r.title) + '</button></td><td>' + esc(r.kind) + '</td><td>' + esc(r.source) + '</td></tr>' }).join('') +
        '</tbody></table></div>' + (p.reports.length !== reps.length ? '<p class="small-note">' + esc(privR) + '</p>' : '')
        : '<div class="empty">还没有报告登记。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="go" data-page="reports">去登记第一份报告 →</button></div></div>') +
      '</section>'
    var caliber = '<section class="card"><h3>本台口径（每屏可见）</h3><ul>' +
      '<li>仅回顾，不解读；解读归医生。</li>' +
      '<li>不同方法/机构的化验不合并、不做差；可比组以「方法 + 机构」划分。</li>' +
      '<li>状态卡数字（缓解第 N 天等）由你记录的发作事件算出，漏记会偏小，不代表医生判断。</li>' +
      '<li>私密记录不进看板摘要、导出与 AI 上下文（三出口同一过滤）。</li>' +
      '<li>全部数据为合成示例，未接入宿主。</li>' +
      '</ul></section>'
    return head('看板', SUBTITLES.records, 'dash') + prime + actionStrip + quick +
      '<div class="dashboard-grid"><div>' + section('最近的变化', '由已记录的发作与化验算出') + recent + caliber + '</div>' +
      '<div>' + mini + dashMetricTiles() + tasksList() + '</div></div>'
  }
  function activeEnd() {
    var ends = profile().flaps.map(function (f) { return f.end }).filter(Boolean).sort()
    return ends[ends.length - 1]
  }
  /* 看板最近值指标卡（用户晨审补：每个有记录的指标一张，点去指标检测看 3D 卡与走势） */
  function dashMetricTiles() {
    var labs = sharedOnly(profile().labs)
    if (!labs.length) return ''
    var tiles = METRIC_ORDER.map(function (m) {
      var rows = labs.filter(function (l) { return l.metric === m }).sort(function (a, b) { return a.date < b.date ? -1 : 1 })
      if (!rows.length) return ''
      var last = rows[rows.length - 1]
      return '<section class="card stat-tile"><h3>' + esc(METRIC_TITLES[m]) + '</h3><p class="tile-val"><b>' + esc(last.value) + '</b> <span>' + esc(last.unit) + '</span></p>' +
        '<p class="small-note">' + esc(fmtDate(last.date)) + ' · ' + esc(last.org) + ' · 共 ' + rows.length + ' 条</p>' +
        '<button class="linkish" data-action="go" data-page="records">去指标检测 →</button></section>'
    }).join('')
    return section('关键指标（最近值）', '只列最近一次记录；不同方法/机构不合并；解读归医生') +
      '<div class="grid three">' + tiles + '</div>'
  }
  function taskEntry(icon, title, desc, page) {
    return '<button class="task-entry" data-action="go" data-page="' + page + '"><span class="entry-icon" aria-hidden="true">' + icon + '</span><span><b>' + esc(title) + '</b><span>' + esc(desc) + '</span></span><span class="arrow" aria-hidden="true">→</span></button>'
  }
  function tasksList() {
    var p = profile()
    var items = sharedOnly(p.questions).filter(function (q) { return !q.answered }).slice(0, 4)
    var nextVisit = sharedOnly(p.treatments).filter(function (t) { return /复诊/.test(t.name) }).sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0]
    var html = '<section class="card">'
    html += nextVisit ? '<div class="row-item"><span class="d">' + esc(fmtDate(nextVisit.date)) + '</span><span class="txt">' + esc(nextVisit.name) + '</span></div>' : '<p class="small-note">没有记录中的复诊安排；下一次复查时间以医生安排为准。</p>'
    html += '<h3 style="margin-top:10px">就诊前想问的事</h3>'
    html += items.length ? '<div class="list">' + items.map(function (q) { return '<div class="row-item"><span class="txt">' + esc(q.q) + '</span></div>' }).join('') + '</div>' : '<p class="small-note">还没有待问问题。</p>'
    html += '<div class="actions" style="margin-top:10px"><button data-action="go" data-page="visits">整理问题清单 →</button></div></section>'
    return html
  }

  /* ---------- 页面：发作与缓解 ---------- */
  function pageEvents() {
    var cur = subOf('events')
    return head('发作与缓解', SUBTITLES.events, 'events') + subnav('events') + (cur === 'list' ? eventsList() : eventsTimeline())
  }
  function eventsList() {
    var p = profile()
    var rows = p.flaps.slice().sort(function (a, b) { return a.start < b.start ? 1 : -1 })
    var listHtml = rows.length
      ? '<div class="list">' + rows.map(function (f) {
          var len = f.end ? daysBetween(f.start, f.end) + 1 : daysBetween(f.start, TODAY) + 1
          return '<div class="row-item"><span class="d">' + esc(fmtDate(f.start)) + ' ~ ' + esc(f.end ? fmtDate(f.end) : '进行中') + '</span>' +
            '<span class="txt">' + esc(f.note || '（无备注）') + '<div class="small-note">共 ' + len + ' 天 ' + (f.private ? '· <span class="pill private">私密</span>' : '') + '</div></span>' +
            '<button class="linkish" data-action="flap-priv" data-id="' + f.id + '">' + (f.private ? '改为共享' : '改为私密') + '</button></div>'
        }).join('') + '</div>'
      : '<div class="empty">还没有发作记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="show-form" data-form="flap">记第一次发作 →</button></div></div>'
    return listHtml + eventForm() + '<p class="notice plain">' + esc(privacyLine(p.flaps) || '记满一条后，这里会显示私密条数说明。') + '</p>'
  }
  function eventForm() {
    var d = state.draft.flap || {}
    return '<section class="card" id="form-flap"><h3>登记一次发作（缓解后再补一条结束日期）</h3>' +
      '<div class="form-grid">' +
      '<label>开始日期<span class="req">*</span><input type="date" data-draft="flap.start" value="' + esc(d.start || '') + '"></label>' +
      '<label>结束日期（未缓解就留空）<input type="date" data-draft="flap.end" value="' + esc(d.end || '') + '"></label>' +
      '<label class="full">经过备注（照抄医生原话或自己的事实描述）<input type="text" data-draft="flap.note" value="' + esc(d.note || '') + '" maxlength="120"></label>' +
      '<label><span>私密</span><select data-draft="flap.private"><option value="">共享</option><option value="1">私密</option></select></label>' +
      '</div><p class="err-msg" id="flap-err" role="alert"></p>' +
      '<div class="actions"><button class="primary" data-action="save-flap-continue">保存并继续录入</button><button data-action="save-flap-close">保存并关闭</button><button data-action="cancel-form" data-form="flap">取消</button></div>' +
      '<p class="small-note">更正=新增版本；本原型演示录入，不真实持久化（刷新重置）。</p></section>'
  }
  function eventsTimeline() {
    var svg = laneSVG()
    return '<section class="card"><h3>发作—缓解区间带</h3><p class="small-note">色带=发作区间；节点=缓解开始（○）/ 治疗或复诊（◆）。' + esc('近 ' + NEAR_DAYS + ' 天') + '窗口见看板状态卡。</p><div class="chart-wrap">' + svg + '</div><p class="scroll-hint">← 左右滑动查看 →</p></section>'
  }
  function laneSVG() {
    var p = profile()
    var flaps = sharedOnly(p.flaps)
    var trts = sharedOnly(p.treatments)
    if (!flaps.length) return '<div class="empty">还没有可画的发作记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="go" data-page="events">去记一条 →</button></div></div>'
    var W = 980, H = 190, L = 70, R = 16
    var dmin = flaps.reduce(function (m, f) { return f.start < m ? f.start : m }, flaps[0].start)
    var dmax = flaps.reduce(function (m, f) { return (f.end || TODAY) > m ? (f.end || TODAY) : m }, flaps[0].end || TODAY)
    var t0 = new Date(dmin), t1 = new Date(dmax)
    t0.setDate(1); t1.setMonth(t1.getMonth() + 1)
    var span = t1 - t0
    function x(d) { return L + (new Date(d) - t0) / span * (W - L - R) }
    var s = '<svg class="lane chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="发作—缓解区间带：色带为发作区间，圆点为缓解开始，菱形为治疗或复诊">'
    var bandY = 56, bandH = 30
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (bandY + bandH / 2) + '" y2="' + (bandY + bandH / 2) + '" stroke="var(--line-strong)" stroke-width="1.5"/>'
    s += '<rect x="' + L + '" y="' + bandY + '" width="' + (W - L - R) + '" height="' + bandH + '" fill="var(--brand-soft)"/>'
    var month = new Date(t0)
    while (month <= t1) {
      var mx = x(month.toISOString().slice(0, 10))
      s += '<line x1="' + mx + '" x2="' + mx + '" y1="' + bandY + '" y2="' + (bandY + bandH) + '" stroke="var(--surface)" stroke-width="1"/>'
      s += '<text x="' + mx + '" y="' + (bandY - 8) + '" text-anchor="middle">' + (month.getMonth() + 1) + '月</text>'
      month.setMonth(month.getMonth() + 3)
    }
    flaps.forEach(function (f) {
      var x1 = x(f.start), x2 = x(f.end || TODAY)
      s += '<rect x="' + x1 + '" y="' + bandY + '" width="' + Math.max(2, x2 - x1) + '" height="' + bandH + '" rx="6" fill="var(--brand)" opacity=".32"><title>发作 ' + esc(f.start) + (f.end ? ' ~ ' + esc(f.end) : ' ~ 进行中') + '</title></rect>'
      if (f.end) s += '<circle cx="' + x2 + '" cy="' + (bandY + bandH / 2) + '" r="5" fill="var(--ok)"><title>缓解开始 ' + esc(f.end) + '</title></circle>'
    })
    trts.forEach(function (t) {
      var tx = x(t.date)
      if (tx < L || tx > W - R) return
      s += '<path d="M ' + tx + ' ' + (bandY - 14) + ' l 5 5 l -5 5 l -5 -5 Z" fill="var(--action)"><title>' + esc(t.kind) + ' · ' + esc(t.name) + ' · ' + esc(t.date) + '</title></path>'
    })
    s += '<text x="8" y="' + (bandY + 18) + '" class="tick">发作带</text>'
    s += '<text x="' + L + '" y="' + (H - 16) + '" class="tick">' + esc(dmin) + ' ～ ' + esc(dmax) + ' · 合成示例</text>'
    s += '</svg>'
    return s
  }

  /* ---------- 页面：化验与趋势 ---------- */
  function pageLabs() {
    var cur = subOf('labs')
    return head('化验与趋势', SUBTITLES.labs, 'labs') + subnav('labs') + (cur === 'list' ? labsList() : oneChart())
  }
  function labsList() {
    var p = profile()
    var labs = sharedOnly(p.labs)
    var groups = METRIC_GROUPS.map(function (g) {
      var items = g.items.filter(function (m) { return labs.some(function (l) { return l.metric === m }) })
      if (!items.length) return ''
      var tables = items.map(function (m) {
        var rows = labs.filter(function (l) { return l.metric === m }).sort(function (a, b) { return a.date < b.date ? 1 : -1 })
        return '<h3 style="margin:12px 0 6px">' + esc(METRIC_TITLES[m]) + '</h3>' +
          '<div class="table-wrap"><table><thead><tr><th>日期</th><th>结果</th><th>方法</th><th>机构</th></tr></thead><tbody>' +
          rows.map(function (l) { return '<tr><td>' + esc(fmtDate(l.date)) + '</td><td><b>' + esc(l.value) + '</b> ' + esc(l.unit) + '</td><td>' + esc(l.method) + '</td><td>' + esc(l.org) + '</td></tr>' }).join('') +
          '</tbody></table></div>'
      }).join('')
      return section(g.title, '不同方法/机构不合并；解读归医生') + tables
    }).join('')
    return (groups || '<div class="empty">还没有化验记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="go" data-page="reports">先去登记报告 →</button></div></div>') +
      '<p class="notice plain">' + esc(privacyLine(p.labs) || '本页暂无私密标记说明。') + '</p>'
  }
  function pickableMetrics() {
    var p = profile()
    return METRIC_ORDER.filter(function (m) { return p.labs.some(function (l) { return l.metric === m }) })
  }
  function oneChart() {
    var rail = '<div class="overview"><div class="rail">' +
      '<div class="card"><b>时间范围</b><div class="chips" role="group" aria-label="时间范围">' + RANGE_DEFS.map(function (r) {
        return '<button aria-pressed="' + (state.range === r[0]) + '" data-action="range" data-range="' + r[0] + '">' + r[1] + '</button>'
      }).join('') + '</div></div>' +
      '<div class="card"><b>选择指标</b>' + '<p class="small-note" style="margin:2px 0 6px">按指标分组（同时最多 4 条）</p>' + METRIC_GROUPS.map(function (g) {
        var items = g.items.filter(function (m) { return pickableMetrics().indexOf(m) >= 0 })
        if (!items.length) return ''
        return '<details class="pick" open><summary>' + esc(g.title) + '</summary>' + items.map(function (m) {
          var last = sharedOnly(profile().labs).filter(function (l) { return l.metric === m }).sort(function (a, b) { return a.date < b.date ? 1 : -1 })[0]
          return '<label><input type="checkbox" data-action="metric" data-metric="' + m + '"' + (state.picked[m] ? ' checked' : '') + '><span class="dot" style="background:' + METRIC_COLORS[m] + '"></span>' + esc(m) + '<span class="last-val">最近 ' + esc(last ? last.value + ' ' + last.unit : '—') + '</span></label>'
        }).join('') + '</details>'
      }).join('') + '<p class="small-note">每条线按该指标全期范围归一化，两条线高低不代表可比——「不可比」。</p></div>' +
      '<div class="card"><b>显示内容</b><div class="chips">' +
      '<button aria-pressed="' + state.showEpisodes + '" data-action="episodes">发作区间</button></div>' +
      '<p class="small-note">关闭发作区间不会改动数据线。</p></div>' +
      '</div><div class="timeline-main">' + chartPanel() + '</div></div>'
    return rail
  }
  function rangeStart() {
    if (state.range === 'all') return null
    var months = { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[state.range]
    var d = new Date(TODAY); d.setMonth(d.getMonth() - months)
    return d.toISOString().slice(0, 10)
  }
  function seriesFor(metric) {
    var from = rangeStart()
    var rows = sharedOnly(profile().labs).filter(function (l) {
      return l.metric === metric && (!from || l.date >= from)
    }).sort(function (a, b) { return a.date < b.date ? -1 : 1 })
    return rows
  }
  function chartPanel() {
    var picked = METRIC_ORDER.filter(function (m) { return state.picked[m] })
    var any = picked.some(function (m) { return seriesFor(m).length })
    var W = 980, H = 400
    var s = '<div class="card chart-wrap" id="chart-panel"><div class="card-head"><h3>化验一图秀</h3><span class="pill">' + (state.range === 'all' ? '全部' : RANGE_DEFS.find(function (r) { return r[0] === state.range })[1]) + '</span></div>'
    if (!any) {
      s += '<div class="empty">没有所选指标在当前时间范围内的记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="sub" data-sub="list">回化验列表核对 →</button></div></div></div>'
      return s
    }
    s += '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="化验一图秀：每条线按该指标全期范围归一化，不同方法不合并">'
    var from = rangeStart()
    var t0 = from ? new Date(from) : new Date(minDate())
    var t1 = new Date(TODAY)
    var span = Math.max(86400000, t1 - t0)
    function x(d) { return 60 + (new Date(d) - t0) / span * (W - 130) }
    var bandTop = 30, bandH = (H - 70 - 20) / picked.filter(function (m) { return seriesFor(m).length }).length
    var idx = 0
    var paths = []
    picked.forEach(function (m) {
      var rows = seriesFor(m)
      if (!rows.length) return
      var vals = rows.map(function (r) { return r.value })
      var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals)
      var y0 = bandTop + idx * bandH
      var y = function (v) { return y0 + bandH - 10 - (vmax === vmin ? bandH - 20 : (v - vmin) / (vmax - vmin) * (bandH - 20)) }
      s += '<rect x="52" y="' + y0 + '" width="' + (W - 120) + '" height="' + bandH + '" fill="var(--paper)" stroke="var(--line)"/>'
      s += '<text x="8" y="' + (y0 + bandH / 2) + '" class="tick">' + esc(m) + '</text>'
      if (rows.length === 1) {
        s += '<circle cx="' + x(rows[0].date) + '" cy="' + y(rows[0].value) + '" r="5" fill="' + METRIC_COLORS[m] + '"><title>' + esc(m) + ' ' + esc(rows[0].value) + ' ' + esc(rows[0].unit) + ' · ' + esc(rows[0].date) + '</title></circle>'
      } else {
        var d = rows.map(function (r, i) { return (i ? 'L' : 'M') + x(r.date).toFixed(1) + ' ' + y(r.value).toFixed(1) }).join(' ')
        paths.push(d)
        s += '<path d="' + d + '" fill="none" stroke="' + METRIC_COLORS[m] + '" stroke-width="2.5" stroke-linecap="round"/>'
      }
      var lastRow = rows[rows.length - 1]
      s += '<text x="' + Math.min(x(lastRow.date) + 6, W - 60) + '" y="' + (y(lastRow.value) - 6) + '" fill="' + METRIC_COLORS[m] + '">' + esc(lastRow.value) + ' ' + esc(lastRow.unit) + '</text>'
      idx++
    })
    if (state.showEpisodes) {
      sharedOnly(profile().flaps).forEach(function (f) {
        if (from && f.start < from && (f.end || TODAY) < from) return
        var x1 = Math.max(60, x(f.start < (from || f.start) ? (from || f.start) : f.start))
        var x2 = Math.min(W - 60, x(f.end || TODAY))
        if (x2 > x1) s += '<rect x="' + x1 + '" y="' + (H - 46) + '" width="' + (x2 - x1) + '" height="12" fill="var(--brand)" opacity=".25"><title>发作 ' + esc(f.start) + '</title></rect>'
      })
      s += '<text x="8" y="' + (H - 37) + '" class="tick">发作带</text>'
    }
    var m0 = new Date(t0)
    while (m0 <= t1) {
      var mx = x(m0.toISOString().slice(0, 10))
      s += '<text x="' + mx + '" y="' + (H - 16) + '" text-anchor="middle">' + (m0.getMonth() + 1) + '月</text>'
      m0.setMonth(m0.getMonth() + 3)
    }
    s += '<text x="60" y="' + (H - 2) + '" class="tick">每条线按该指标全期范围归一化 · 两条线之间不可比 · 合成示例</text>'
    s += '</svg>'
    s += '</div>'
    s += '<p class="notice plain">单点只画点不连线；不同方法/机构的记录未合并画线；解读归医生。</p>'
    return s
  }
  function minDate() {
    var p = profile()
    return p.labs.reduce(function (m, l) { return l.date < m ? l.date : m }, TODAY)
  }

  /* ---------- 页面：治疗记录 ---------- */
  function pageTreatment() {
    var cur = subOf('treatment')
    return head('治疗记录', SUBTITLES.treatment, 'treatment') + subnav('treatment') + (cur === 'log' ? treatLog() : medsList())
  }
  function treatLog() {
    var p = profile()
    var rows = sharedOnly(p.treatments).sort(function (a, b) { return a.date < b.date ? 1 : -1 })
    var list = rows.length
      ? '<div class="table-wrap"><table><thead><tr><th>日期</th><th>类别</th><th>登记内容（照录）</th><th>备注</th></tr></thead><tbody>' +
        rows.map(function (t) { return '<tr><td>' + esc(fmtDate(t.date)) + '</td><td>' + esc(t.kind) + '</td><td>' + esc(t.name) + '</td><td>' + esc(t.note || '—') + '</td></tr>' }).join('') +
        '</tbody></table></div><p class="scroll-hint">← 左右滑动查看 →</p>'
      : '<div class="empty">还没有治疗登记。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="show-form" data-form="treat">记第一笔 →</button></div></div>'
    var d = state.draft.treat || {}
    var form = '<section class="card" id="form-treat"><h3>登记一笔治疗（按次/调药/复诊）</h3>' +
      '<div class="form-grid">' +
      '<label>日期<span class="req">*</span><input type="date" data-draft="treat.date" value="' + esc(d.date || '') + '"></label>' +
      '<label>类别<span class="req">*</span><select data-draft="treat.kind">' + ['按次', '调药', '复诊'].map(function (k) { return '<option' + (d.kind === k ? ' selected' : '') + '>' + k + '</option>' }).join('') + '</select></label>' +
      '<label class="full">内容（照抄医生原话或处方名，不写判断）<input type="text" data-draft="treat.name" value="' + esc(d.name || '') + '" maxlength="80"></label>' +
      '<label class="full">备注<input type="text" data-draft="treat.note" value="' + esc(d.note || '') + '" maxlength="120"></label>' +
      '</div><p class="err-msg" id="treat-err" role="alert"></p>' +
      '<div class="actions"><button class="primary" data-action="save-treat-continue">保存并继续录入</button><button data-action="save-treat-close">保存并关闭</button><button data-action="cancel-form" data-form="treat">取消</button></div>' +
      '<p class="small-note">连续录入时不清屏，可一口气记完一次随访的多笔。</p></section>'
    return list + form + '<p class="notice plain">' + esc(privacyLine(p.treatments) || '本页暂无私密标记说明。') + '</p>'
  }
  function medsList() {
    var p = profile()
    var cards = p.meds.map(function (m) {
      return '<section class="card"><div class="card-head"><h3>' + esc(m.name) + '</h3><span class="pill">自 ' + esc(fmtDate(m.since)) + '</span></div><p>' + esc(m.schedule) + '</p><p class="small-note">' + esc(m.note || '') + '</p></section>'
    }).join('')
    return (cards || '<div class="empty">还没有日常用药记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="go" data-page="treatment">去按次登记 →</button></div></div>') +
      '<p class="notice plain">本台不提供剂量与疗程建议；一切以处方原件与医生安排为准。</p>'
  }

  /* ---------- 页面：就诊准备 ---------- */
  function pageVisits() {
    var cur = subOf('visits')
    return head('就诊准备', SUBTITLES.visits, 'visits') + subnav('visits') + (cur === 'prep' ? visitsPrep() : hospitalsPage())
  }
  function visitsPrep() {
    var p = profile()
    var qs = p.questions
    var rows = qs.length ? '<div class="list">' + qs.map(function (q) {
      return '<div class="row-item"><span class="d">' + esc(fmtDate(q.addedOn)) + '</span><span class="txt">' + esc(q.q) + (q.private ? ' <span class="pill private">私密</span>' : '') + '<div class="small-note">' + (q.answered ? '已问过' : '待问') + ' · 由私密记录改写的问题同样算私密</div></span>' +
        '<button class="linkish" data-action="q-priv" data-id="' + q.id + '">' + (q.private ? '改为共享' : '改为私密') + '</button></div>'
    }).join('') + '</div>' : '<div class="empty">还没有待问问题。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="show-form" data-form="q">写下第一个问题 →</button></div></div>'
    var form = '<section class="card" id="form-q"><h3>添加复诊问题</h3><div class="form-grid">' +
      '<label class="full">想问的事<span class="req">*</span><input type="text" data-draft="q.q" value="' + esc((state.draft.q || {}).q || '') + '" maxlength="120"></label>' +
      '</div><div class="actions"><button class="primary" data-action="save-q-continue">保存并继续录入</button><button data-action="save-q-close">保存并关闭</button><button data-action="cancel-form" data-form="q">取消</button></div>' +
      '<button class="soft" style="margin-top:8px" data-action="ai" data-page="visits">让 AI 帮我起草候选问题（预览，需逐条核对）</button></section>'
    return rows + form + '<p class="notice plain">' + esc(privacyLine(qs) || '写满一条后这里会显示私密说明。') + '</p>'
  }
  function hospitalsPage() {
    var p = profile()
    var cards = p.hospitals.map(function (h) {
      return '<section class="card"><div class="card-head"><h3>' + esc(h.name) + '</h3><span class="pill">版本 v' + h.ver + '</span></div><p>' + esc(h.dept) + '</p><p class="small-note">联系方式：' + esc(h.contact) + '</p><button class="soft" data-action="hospital-edit" data-id="' + h.id + '">修改（=新版本，不覆盖）</button></section>'
    }).join('')
    var form = '<section class="card" id="form-hosp"><h3>添加一家医院</h3><div class="form-grid">' +
      '<label>名称<span class="req">*</span><input type="text" data-draft="hosp.name" value="' + esc((state.draft.hosp || {}).name || '') + '"></label>' +
      '<label>科室<input type="text" data-draft="hosp.dept" value="' + esc((state.draft.hosp || {}).dept || '') + '"></label>' +
      '<label class="full">联系方式（电话或「出处引用」）<input type="text" data-draft="hosp.contact" value="' + esc((state.draft.hosp || {}).contact || '') + '" maxlength="80"></label>' +
      '</div><div class="actions"><button class="primary" data-action="save-hosp">保存医院</button><button data-action="cancel-form" data-form="hosp">取消</button></div></section>'
    return '<div class="grid two">' + cards + '</div>' + form
  }

  /* ---------- 页面：报告与原件 ---------- */
  function pageReports() {
    var cur = subOf('reports')
    return head('报告与原件', SUBTITLES.reports, 'reports') + subnav('reports') + (cur === 'list' ? reportsList() : reportsWall())
  }
  function reportsList() {
    var p = profile()
    var rows = sharedOnly(p.reports).sort(function (a, b) { return b.date < a.date ? -1 : 1 })
    return '<div class="table-wrap"><table><thead><tr><th>日期</th><th>名称</th><th>类型</th><th>原件状态</th><th>备注</th><th>详情</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + esc(fmtDate(r.date)) + '</td><td>' + esc(r.title) + '</td><td>' + esc(r.kind) + '</td><td>' + esc(r.source) + '</td><td>' + esc(r.effusion || '—') + '</td><td><button class="linkish" data-action="pv-report" data-id="' + r.id + '">查看详情</button></td></tr>' }).join('') +
      '</tbody></table></div><p class="scroll-hint">← 左右滑动查看 →</p>' +
      '<p class="notice plain">' + esc(privacyLine(p.reports)) + '</p>' +
      '<p class="notice plain">同一份报告的历次修订用同一报告 ID 管理；本台不做任何判读。</p>'
  }
  function reportsWall() {
    var p = profile()
    var tones = ['#2f6f8f', '#c96f2f', '#6b5b95', '#2e7d5b']
    var cards = sharedOnly(p.reports).map(function (r, i) {
      return '<div class="wall-item"><div class="wall-thumb" style="background:' + tones[i % tones.length] + '" aria-hidden="true">' + esc(r.kind.slice(0, 1)) + '</div><div class="meta"><b>' + esc(r.title) + '</b><br>' + esc(fmtDate(r.date)) + ' · ' + esc(r.source) + '</div></div>'
    }).join('')
    return (cards ? '<div class="wall">' + cards + '</div>' : '<div class="empty">还没有原件登记。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="go" data-page="reports">去登记 →</button></div></div>') +
      '<p class="notice plain">私密报告不进原件墙预览（' + esc(privacyLine(p.reports)) + '）。</p>'
  }

  /* ---------- 页面：心理与家庭 ---------- */
  function pageMind() {
    var cur = subOf('mind')
    return head('心理与家庭', SUBTITLES.mind, 'mind') + subnav('mind') + (cur === 'feel' ? mindFeel() : mindFamily())
  }
  function mindFeel() {
    var p = profile()
    var rows = sharedOnly(p.mind.feel)
    var html = rows.length ? '<div class="list">' + rows.map(function (x, i) {
      return '<div class="row-item"><span class="d">' + esc(fmtDate(x.d)) + '</span><span class="txt">' + esc(x.text) + '<div class="small-note">' + esc(x.author) + '</div></span>' +
        '<button class="linkish" data-action="feel-priv" data-i="' + i + '">' + (x.private ? '改为共享' : '改为私密') + '</button></div>'
    }).join('') + '</div>' : '<div class="empty">还没有记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="show-form" data-form="feel">写一条当下感受 →</button></div></div>'
    return html + '<p class="notice warn">' + esc(privacyLine(p.mind.feel) || '本页支持私密标记。') + '三处出口（看板摘要 / 导出 / AI 上下文）共用同一过滤。</p>'
  }
  function mindFamily() {
    var p = profile()
    var rows = sharedOnly(p.mind.family)
    var html = rows.length ? '<div class="list">' + rows.map(function (x) {
      return '<div class="row-item"><span class="d">' + esc(fmtDate(x.d)) + '</span><span class="txt">' + esc(x.text) + '<div class="small-note">' + esc(x.author) + '</div></span></div>'
    }).join('') + '</div>' : '<div class="empty">还没有家人记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="show-form" data-form="family">记一条 →</button></div></div>'
    return html + '<p class="notice plain">照护者可以在「发作与缓解」里代记事实；本页只写感受与支持事项。</p>'
  }

  /* ---------- 页面：病情档案 ---------- */
  function pageRecords() {
    var cur = subOf('records')
    return head('病情档案', SUBTITLES.records, 'records') + subnav('records') +
      (cur === 'archive' ? recordsArchive() : cur === 'metrics' ? recordsMetrics() : recordsSummary())
  }
  function recordsArchive() {
    var p = profile()
    var dls = Object.keys(p.profile).map(function (k) {
      return '<div><dt style="color:var(--muted);font-size:12.5px">' + esc(k) + '</dt><dd style="margin:2px 0 12px">' + esc(p.profile[k]) + '</dd></div>'
    }).join('')
    return '<section class="card"><dl style="margin:0">' + dls + '</dl></section>' +
      '<p class="notice plain">这里只整理已核对入档的事实；「还缺什么」见汇总页。更正=新增版本。</p>'
  }
  function recordsMetrics() {
    var p = profile()
    var labs = sharedOnly(p.labs)
    var groups = METRIC_GROUPS.map(function (g) {
      var items = g.items.filter(function (m) { return labs.some(function (l) { return l.metric === m }) })
      if (!items.length) return ''
      var cards = items.map(function (m) {
        var rows = labs.filter(function (l) { return l.metric === m }).sort(function (a, b) { return a.date < b.date ? -1 : 1 })
        var last = rows[rows.length - 1]
        var prev = rows.length > 1 ? rows[rows.length - 2] : null
        var delta = prev ? '较上次 ' + (last.value - prev.value >= 0 ? '+' : '') + (last.value - prev.value) + ' ' + last.unit + '（' + esc(prev.date) + ' → ' + esc(last.date) + '）' : '仅 1 条记录'
        var back = '<svg viewBox="0 0 200 60" role="img" aria-label="' + esc(m) + ' 近期走势缩略图">' +
          rows.slice(-20).map(function (l, i, arr) {
            var vals = arr.map(function (z) { return z.value }); var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals)
            var x = 6 + i * (188 / Math.max(1, arr.length - 1))
            var y = 52 - (mx === mn ? 24 : (l.value - mn) / (mx - mn) * 44)
            return (i ? '<line x1="' + (6 + (i - 1) * (188 / Math.max(1, arr.length - 1))) + '" y1="' + y + '" x2="' + x + '" y2="' + y + '" stroke="' + METRIC_COLORS[m] + '" stroke-width="2"/>' : '') + '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="' + METRIC_COLORS[m] + '"/>'
          }).join('') + '</svg><div class="src">' + esc(rows[0].date) + ' ～ ' + esc(last.date) + ' · 共 ' + rows.length + ' 条 · 不同方法不合并</div>'
        return '<button class="mcard" data-action="flip" data-code="' + m + '" aria-pressed="' + !!state.flipped[m] + '" aria-label="' + esc(m) + ' 指标卡，按回车翻面看走势">' +
          '<span class="mcard-inner"><span class="mface front"><span class="cat">' + esc(METRIC_TITLES[m]) + '</span>' +
          '<span class="mval"><b>' + esc(last.value) + '</b> <i>' + esc(last.unit) + '</i></span>' +
          '<span class="delta">' + delta + '</span><span class="rec">共 ' + rows.length + ' 次记录</span>' +
          '<span class="src">' + esc(fmtDate(last.date)) + ' · ' + esc(last.org) + ' · ' + esc(last.method) + ' · 翻面↗</span></span>' +
          '<span class="mface back">' + back + '</span></span></button>'
      }).join('')
      return '<div class="metric-group"><div class="metric-group-head"><h3>' + esc(g.title) + '</h3><span>' + items.length + ' 项</span></div><div class="metric-grid">' + cards + '</div></div>'
    }).join('')
    return (groups || '<div class="empty">还没有指标记录。<div class="actions" style="justify-content:center;margin-top:8px"><button data-action="go" data-page="labs">去化验列表 →</button></div></div>') +
      '<p class="notice plain">差值只是两次记录之差，不写任何疗效结论；不同方法/机构不合并、不做差；心肌标志物与用药安全监测的解读归医生。</p>'
  }
  function recordsSummary() {
    var p = profile()
    var st = derivedStatus()
    var missing = []
    if (!p.reports.some(function (r) { return r.source === '原件已登记' })) missing.push('还没有任何「原件已登记」的报告')
    if (!p.labs.some(function (l) { return l.metric === 'ESR' })) missing.push('ESR 记录缺失')
    return '<div class="grid two">' +
      '<section class="card"><h3>病情汇总（只列事实）</h3><ul>' +
      '<li>当前状态：' + esc(st.mode) + (st.dayN == null ? '' : '（第 ' + st.dayN + ' 天，由记录算出）') + '</li>' +
      '<li>已记录发作（共享）' + sharedOnly(p.flaps).length + ' 次；近 ' + NEAR_DAYS + ' 天 ' + st.nearCount + ' 次' + (st.privateFlaps ? '（私密 ' + st.privateFlaps + ' 条未计入）' : '') + '</li>' +
      '<li>化验 ' + sharedOnly(p.labs).length + ' 条；治疗登记 ' + sharedOnly(p.treatments).length + ' 条；报告 ' + sharedOnly(p.reports).length + ' 份</li>' +
      '</ul><p class="small-note">导出会包含什么：上面这些共享记录 + 档案字段；私密记录不进导出。</p></section>' +
      '<section class="card"><h3>还缺什么</h3>' + (missing.length ? '<ul>' + missing.map(function (m) { return '<li>' + esc(m) + '</li>' }).join('') + '</ul>' : '<p>暂无明显缺口（按本台可检查项）。</p>') +
      '<div class="actions" style="margin-top:8px"><button data-action="go" data-page="reports">补报告 →</button><button data-action="go" data-page="labs">补化验 →</button></div></section>' +
      '</div>' +
      '<div class="actions" style="margin-top:12px"><button class="primary" data-action="pv-export">导出预览（私密过滤后）</button><span class="small-note">整页视图：可 Esc、← 返回、✕ 关闭</span></div>'
  }

  /* ---------- 设置弹层（乳腺癌 CFG_TABS 式）+ 临床页 ---------- */
  function settingsModal(tab) {
    var t = tab || 'workspace'
    var body = '<div class="subnav" role="tablist" aria-label="设置分区">' + CFG_TABS.map(function (x) {
      return '<button role="tab" aria-selected="' + (t === x[0]) + '" data-action="settings-tab" data-tab="' + x[0] + '">' + esc(x[1]) + '</button>'
    }).join('') + '</div><div style="margin-top:12px">' +
      (t === 'workspace' ? setWorkspace() : t === 'mineru' ? setMineru() : setClinical()) + '</div>' +
      '<div class="actions" style="margin-top:10px"><button class="primary" data-action="dialog-close">完成</button></div>'
    openDialog('设置', body)
  }
  function setWorkspace() {
    return '<section class="card"><h3>业务资料根目录</h3><p>当前（示意值）：<code>DSH 资料目录 / pericarditis</code></p>' +
      '<button class="soft" data-action="open-store">更改位置…</button>' +
      '<p class="notice warn">口径：拒绝主目录、桌面、下载根目录、tmp 作为资料目录；源码目录不是资料目录。</p>' +
      '<div class="grid three"><div class="card"><b>原件区</b><p class="small-note">0 个文件 · 示意</p></div><div class="card"><b>派生区</b><p class="small-note">0 个文件 · 示意</p></div><div class="card"><b>数据库</b><p class="small-note">未创建 · 示意</p></div></div>' +
      '<h3 style="margin-top:14px">备份与恢复</h3><p class="small-note">本原型未接入备份；开发版按 02 号契约提供。</p></section>'
  }
  function setMineru() {
    return '<section class="card"><h3>文档解析（MinerU）</h3>' +
      '<label><input type="checkbox" id="mineru-consent" data-action="mineru-consent"> 我已了解并将自行完成 MinerU Token 配置</label>' +
      '<p class="notice warn" id="mineru-warning">未勾选前：不会上传、不会调用任何解析服务。</p>' +
      '<h3 style="margin-top:12px">Token</h3><p>当前：<code>未配置</code>' + '（配置后只显示后 4 位）</p><button class="soft" data-action="mineru-token" disabled id="mineru-token-btn">替换 Token…</button>' +
      '<h3 style="margin-top:12px">解析模型</h3><p class="small-note">固定 pipeline；不可切换 VLM——原因：与家族统一解析对齐（18 号）。</p>' +
      '<h3 style="margin-top:12px">免费额度</h3><p class="small-note">Flash 免费额度上限：单文件 10 MB / 20 页；超出自动降级解析。</p>' +
      '<p class="notice warn">本仓未接入 MinerU：本页的勾选与保存都不联网。</p></section>'
  }
  function setClinical() {
    var snap = window.DEMO_DATA.snapshotMeta || { count: 0, date: null }
    return '<section class="card"><h3>临床数据库</h3>' +
      '<p>快照状态：<b>' + (snap.count ? snap.count + ' 条 · ' + esc(snap.date) : '本台未生成快照（0 条）') + '</b>；「临床」页可离线浏览。</p>' +
      '<h3 style="margin-top:10px">数据来源与通道终态（如实记录，FAILED ≠ 查过零结果）</h3>' +
      '<ul><li>ctv / ictrp / chinadrugtrials：SUCCESS（见临床页）。</li>' +
      '<li>chictr_online：<b>FAILED（未查过）</b>。</li>' +
      '<li>chictr_pancreatic_archive：NEEDS_SETUP（离线语料仅胰腺癌覆盖，本台无覆盖）。</li></ul>' +
      '<p class="small-note">登记状态一律「未核实」；快照会过期，请以官方登记页为准。</p>' +
      '<div class="actions" style="margin-top:8px"><button class="soft" data-action="go" data-page="clinical">去临床页浏览 →</button></div></section>'
  }
  function pageClinical() {
    var cur = subOf('clinical')
    return head('临床', SUBTITLES.clinical, 'clinical') + subnav('clinical') +
      (cur === 'status' ? clinicalStatus() : clinicalBrowse(''))
  }
  function clinicalStatus() {
    var snap = window.DEMO_DATA.snapshotMeta || {}
    return '<section class="card"><h3>快照状态</h3>' +
      '<p>' + (snap.count ? '共 <b>' + snap.count + '</b> 条登记（合并同登记号后）· 快照日期 ' + esc(snap.date) : '本台未生成快照。') + '</p>' +
      '<h3 style="margin-top:10px">来源通道终态（如实）</h3>' +
      '<div class="table-wrap"><table><thead><tr><th>通道</th><th>终态</th><th>说明</th></tr></thead><tbody>' +
      '<tr><td>ctv（ClinicalTrials.gov 本地索引）</td><td><span class="pill ok">SUCCESS</span></td><td>检索成功；零命中只代表本地索引未命中</td></tr>' +
      '<tr><td>ictrp（WHO ICTRP）</td><td><span class="pill ok">SUCCESS</span></td><td>上游导出存在已知静默缺口</td></tr>' +
      '<tr><td>chinadrugtrials</td><td><span class="pill ok">SUCCESS</span></td><td>中文关键词命中</td></tr>' +
      '<tr><td>chictr_online</td><td><span class="pill warn">FAILED</span></td><td><b>未查过</b>——不能当作零结果；晨审重跑</td></tr>' +
      '<tr><td>chictr_pancreatic_archive</td><td><span class="pill warn">NEEDS_SETUP</span></td><td>离线语料仅胰腺癌覆盖，本台无覆盖</td></tr>' +
      '</tbody></table></div><p class="scroll-hint">← 左右滑动查看 →</p>' +
      '<p class="notice plain">本页与「设置 · 临床数据库」tab 同一份数据口径（E10）。</p></section>'
  }
  function trialRows(rows) {
    if (!rows.length) return '<div class="empty">没有命中的登记。换关键词，或回「数据库状态」看通道终态。</div>'
    return '<div class="table-wrap"><table><thead><tr><th>登记号</th><th>题目</th><th>类型</th><th>状态</th><th>来源</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var reg = (r.registryNumbers || []).map(function (x) { return x.value }).join(' / ') || r.recordId
        return '<tr><td>' + esc(reg) + '</td><td style="white-space:normal;min-width:220px">' + esc(r.title || '') + '</td><td>' + esc(r.studyType || '—') + '</td><td>' + esc(r.statusNote || '登记状态，未核实') + '</td><td>' + esc(r.source || '') + '</td></tr>'
      }).join('') + '</tbody></table></div><p class="scroll-hint">← 左右滑动查看 →</p>'
  }
  function clinicalBrowse(keyword) {
    var demo = window.DEMO_DATA.trialsDemo || []
    return '<section class="card"><h3>登记浏览</h3>' +
      '<p class="small-note">快照离线检索；按你选的条件排，<b>不做匹配打分，不预测入选机会</b>。登记状态一律「未核实」。</p>' +
      '<div class="form-grid" style="grid-template-columns:1fr"><label>关键词（题目包含）<input type="search" id="trial-kw" value="' + esc(keyword || '') + '" placeholder="如 colchicine / 心包"></label></div>' +
      '<div class="actions" style="margin:8px 0 12px"><button class="primary" data-action="trial-search">检索快照</button></div>' +
      '<div id="trial-result">' + trialRows(demo) + '</div>' +
      '<p class="notice plain">原型内置 5 条<b>虚构示例</b>（不是真实研究，不含可用登记号）；开发版从本机快照（97 条）检索，术语与状态以官方登记页为准。</p></section>'
  }
  /* ---------- 导航与渲染 ---------- */
  function navIcons(key) {
    var icons = {
      home: '⌂', wave: '〰', flask: '⚗', pill: '💊', bag: '🧳', file: '📄', heart: '♡', folder: '🗂', micro: '🧪'
    }
    return icons[key] || '·'
  }
  function renderNav() {
    $('#nav').innerHTML = PAGES.map(function (p) {
      return '<button data-action="nav" data-page="' + p[0] + '"' + (state.page === p[0] ? ' aria-current="page"' : '') + '><span class="nav-ico" aria-hidden="true">' + navIcons(p[2]) + '</span>' + esc(p[1]) + '</button>'
    }).join('')
    $('#breadcrumb').textContent = (PAGES.find(function (p) { return p[0] === state.page }) || ['', '看板'])[1]
  }
  /* 路由表见文件末尾顶层 ROUTES（供检查器穷举）；本表为渲染分派 */
  function pageFor(key) {
    return {
      dash: pageDash, events: pageEvents, labs: pageLabs, treatment: pageTreatment,
      visits: pageVisits, reports: pageReports, mind: pageMind, records: pageRecords, clinical: pageClinical
    }[key]
  }
  function paintProfile() {
    var p = profile()
    $('#profile-name').textContent = p.name
    $('#profile-meta-tag').textContent = p.tag
    $('#profile-avatar').textContent = p.name.slice(-1)
  }
  function render() {
    renderNav()
    paintProfile()
    var fn = pageFor(state.page) || pageDash
    $('#main').innerHTML = fn()
    if (window.DiseasePrimer && window.DiseasePrimer.mount) window.DiseasePrimer.mount()
  }
  function navigate(page, sub) {
    var h = '#' + page + (sub ? '/' + sub : '')
    try { global.history.replaceState(null, '', h) } catch (e) { }
  }
  function applyHash() {
    var h = (global.location.hash || '').replace(/^#/, '')
    /* 整页视图深链：#page=labs 直达「化验记录」层（starter probe 契约） */
    var pvDeep = h.match(/^page=([a-z]+)$/)
    if (pvDeep) {
      state.page = 'dash'
      render()
      openPvLayer('化验记录', labsLayerHtml(), true)
      return
    }
    var parts = h.split('/')
    if (PAGES.some(function (p) { return p[0] === parts[0] })) {
      state.page = parts[0]
      if (parts[1]) state.sub[parts[0]] = parts[1]
    } else {
      state.page = 'dash'
    }
    render()
  }

  /* ---------- AI 面板 ---------- */
  function setAgent(open) {
    state.agentOpen = open
    $('#agent-pane').hidden = !open
    $('#agent-splitter').hidden = !open
    $('#agent-toggle').setAttribute('aria-expanded', String(open))
    if (open) draftToInput()
  }
  function draftToInput() {
    var input = $('#agent-input')
    if (state.draft.aiPrompt) {
      input.value = state.draft.aiPrompt
      input.focus()
      toast('草稿已填入输入框：只填不发，由你决定何时手动复制或发送')
    }
  }
  function agentDraft(prompt) {
    if (EMBEDDED) {
      try {
        global.parent.postMessage({ type: 'pericarditis:agent-draft', prompt: prompt, send: false }, '*')
      } catch (e) { /* 独立打开时不会走到这里 */ }
      toast('已通过 agent-draft 契约传给宿主（只填不发）')
    } else {
      setAgent(true)
    }
  }

  /* ---------- 整页视图（32 号 · starter probe-page-view 契约）----------
   * history 是导航栈唯一真源：每层一条 pushState；Esc/返回退一层；✕ 关全部。
   * 结构：.pv-overlay > .pv-panel(.pv-head(.pv-title+.pv-head-actions(返回,✕)) + .pv-crumb + .pv-body)
   * 深链：#page=labs 直达「化验记录」层。
   */
  var pvState = { el: null, stack: [], trigger: null, scrollY: 0 }
  function buildPageView() {
    var el = document.createElement('div')
    el.className = 'pv-overlay'
    el.hidden = true
    el.innerHTML = '<div class="pv-panel" tabindex="-1"><div class="pv-head"><span class="pv-crumb"></span><h2 class="pv-title"></h2><div class="pv-head-actions"><button data-pv="back">← 返回</button><button class="icon-button pv-btn" data-pv="close" aria-label="关闭整页视图">✕</button></div></div><div class="pv-body"></div></div>'
    document.body.appendChild(el)
    el.addEventListener('click', function (e) {
      if (e.target === el) { closePvAll(); return }
      var b = e.target.closest('[data-pv]')
      if (!b) return
      if (b.getAttribute('data-pv') === 'back') history.back()
      else closePvAll()
    })
    return el
  }
  function pvRender() {
    var top = pvState.stack[pvState.stack.length - 1]
    pvState.el.querySelector('.pv-title').textContent = top.title
    pvState.el.querySelector('.pv-crumb').textContent = pvState.stack.map(function (l) { return l.title }).join(' › ')
    pvState.el.querySelector('.pv-body').innerHTML = top.html
    var panel = pvState.el.querySelector('.pv-panel')
    if (panel && !panel.contains(document.activeElement)) panel.focus()
  }
  function openPvLayer(title, html, isDeep) {
    if (!pvState.el) pvState.el = buildPageView()
    if (!pvState.stack.length) {
      pvState.trigger = isDeep ? null : document.activeElement
      pvState.scrollY = global.scrollY
      document.documentElement.classList.add('pv-lock')
      pvState.el.hidden = false
    }
    pvState.stack.push({ title: title, html: html })
    pvRender()
    try { global.history.pushState({ pv: pvState.stack.length }, '', '#page-view') } catch (e) { }
  }
  function pvPop() {
    pvState.stack.pop()
    if (!pvState.stack.length) applyPvClose()
    else pvRender()
  }
  function pvRefocus() {
    var t = pvState.trigger
    if (!t) return
    /* 关闭会触发 hashchange → 重渲染，触发元素可能已脱离 DOM：按 data-open 特征重定位 */
    if (!t.isConnected && t.getAttribute && t.getAttribute('data-open')) {
      var sel = '[data-open="' + t.getAttribute('data-open') + '"]'
      if (t.getAttribute('data-id')) sel += '[data-id="' + t.getAttribute('data-id') + '"]'
      if (t.getAttribute('data-metric')) sel += '[data-metric="' + t.getAttribute('data-metric') + '"]'
      t = document.querySelector(sel) || t
    }
    try { t.focus({ preventScroll: true }) } catch (e) { }
  }
  function applyPvClose() {
    pvState.stack = []
    if (pvState.el) pvState.el.hidden = true
    document.documentElement.classList.remove('pv-lock')
    pvRefocus()
    /* history 导航会把焦点重置回 body：等导航落定后再补一次 */
    setTimeout(function () {
      if (!pvState.stack.length && document.activeElement === document.body) pvRefocus()
    }, 60)
    if (pvState.scrollY != null) { try { global.scrollTo(0, pvState.scrollY) } catch (e) { } }
  }
  function closePvAll() {
    if (!pvState.stack.length) return
    var n = pvState.stack.length
    try { global.history.go(-n) } catch (e) { applyPvClose() }
    setTimeout(function () { if (pvState.stack.length) applyPvClose() }, 350)
  }
  global.addEventListener('popstate', function () { if (pvState.stack.length) pvPop() })
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pvState.stack.length && !$('#dialog').open) { e.preventDefault(); history.back() }
  })
  function exportPreviewHtml() {
    var p = profile()
    var st = derivedStatus()
    var lines = []
    lines.push('档案：' + p.name + '（' + p.tag + '）· 合成示例')
    lines.push('状态：' + st.mode + (st.dayN == null ? '' : '（第 ' + st.dayN + ' 天，由记录算出）') + ' · 距上次发作 ' + (st.sinceLast == null ? '未知' : st.sinceLast + ' 天') + ' · 近 ' + NEAR_DAYS + ' 天发作 ' + st.nearCount + ' 次' + (st.privateFlaps ? '（私密 ' + st.privateFlaps + ' 条未计入）' : ''))
    lines.push('发作记录（共享 ' + sharedOnly(p.flaps).length + ' 条' + (p.flaps.length !== sharedOnly(p.flaps).length ? '，私密 ' + (p.flaps.length - sharedOnly(p.flaps).length) + ' 条未包含' : '') + '）：')
    sharedOnly(p.flaps).forEach(function (f) { lines.push('  · ' + f.start + ' ~ ' + (f.end || '进行中') + ' ' + (f.note || '')) })
    var labN = p.labs.length - sharedOnly(p.labs).length
    lines.push('化验（共享 ' + sharedOnly(p.labs).length + ' 条' + (labN ? '，私密 ' + labN + ' 条未包含' : '') + '，不同方法/机构不合并）：')
    sharedOnly(p.labs).forEach(function (l) { lines.push('  · ' + l.date + ' ' + l.metric + ' ' + l.value + ' ' + l.unit + '（' + l.method + ' · ' + l.org + '）') })
    var trN = p.treatments.length - sharedOnly(p.treatments).length
    lines.push('治疗登记（共享 ' + sharedOnly(p.treatments).length + ' 条' + (trN ? '，私密 ' + trN + ' 条未包含' : '') + '）：')
    sharedOnly(p.treatments).forEach(function (t) { lines.push('  · ' + t.date + ' ' + t.kind + ' ' + t.name) })
    lines.push('报告（共享 ' + sharedOnly(p.reports).length + ' 条' + (p.reports.length - sharedOnly(p.reports).length ? '，私密 ' + (p.reports.length - sharedOnly(p.reports).length) + ' 条未包含' : '') + '）')
    lines.push('口径：仅回顾，不解读；解读归医生。')
    return '<pre style="white-space:pre-wrap;font-family:inherit;font-size:14px">' + esc(lines.join('\n')) + '</pre><p class="notice plain">本预览已过滤私密记录；口径同看板摘要与 AI 上下文（三出口同一过滤函数）。</p>'
  }
  function reportDetailHtml(id) {
    var r = profile().reports.find(function (z) { return z.id === id })
    if (!r) return '<p class="notice warn">找不到该报告。</p>'
    return '<section class="card"><h3>' + esc(r.title) + '</h3><p>日期：' + esc(fmtDate(r.date)) + ' · 类型：' + esc(r.kind) + '</p><p>原件状态：' + esc(r.source) + '</p>' +
      (r.effusion ? '<p>关键描述（照录）：' + esc(r.effusion) + '</p>' : '') +
      '<button class="pv-btn soft" data-pv-drill="' + esc(r.id) + '">查看报告原文（示例）</button>' +
      '<p class="notice plain">本台不做判读；解读归医生。</p></section>'
  }
  function reportOriginalHtml(id) {
    var r = profile().reports.find(function (z) { return z.id === id })
    return '<section class="card"><h3>报告原文（登记摘要）</h3><p>名称：' + esc(r.title) + '</p><p>原件状态：' + esc(r.source) + '</p>' +
      (r.effusion ? '<p>关键描述（照录）：' + esc(r.effusion) + '</p>' : '<p>本条无关键描述字段。</p>') +
      '<p class="small-note">原型演示：原件文件未挂载；开发版按 02 号契约从资料目录读取。</p></section>'
  }
  function labsLayerHtml() {
    var p = profile()
    var labs = sharedOnly(p.labs)
    return '<div class="table-wrap"><table><thead><tr><th>日期</th><th>指标</th><th>结果</th><th>方法</th><th>机构</th></tr></thead><tbody>' +
      labs.sort(function (a, b) { return a.date < b.date ? 1 : -1 }).map(function (l) { return '<tr><td>' + esc(l.date) + '</td><td>' + esc(l.metric) + '</td><td><b>' + esc(l.value) + '</b> ' + esc(l.unit) + '</td><td>' + esc(l.method) + '</td><td>' + esc(l.org) + '</td></tr>' }).join('') +
      '</tbody></table></div><p class="notice plain">不同方法/机构不合并；解读归医生。' + esc(privacyLine(p.labs)) + '</p>'
  }
  function datapointHtml(metric) {
    var rows = seriesFor(metric)
    var last = rows[rows.length - 1]
    if (!last) return '<p class="notice warn">没有所选指标。</p>'
    return '<section class="card"><h3>' + esc(METRIC_TITLES[metric]) + ' · 最近一次</h3><p>' + esc(last.date) + '：<b>' + esc(last.value) + ' ' + esc(last.unit) + '</b>（' + esc(last.method) + ' · ' + esc(last.org) + '）</p><p class="notice plain">来源：' + esc(last.org) + ' 化验单；点「查看报告原文」见登记摘要。</p></section>'
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]')
    if (opener) {
      var kind = opener.getAttribute('data-open')
      if (kind === 'report') openPvLayer('报告详情', reportDetailHtml(opener.getAttribute('data-id')))
      else if (kind === 'labs') openPvLayer('化验记录', labsLayerHtml())
      else if (kind === 'chart') openPvLayer('数据点详情', datapointHtml(opener.getAttribute('data-metric')))
      return
    }
    var drill = e.target.closest('[data-pv-drill]')
    if (drill) { openPvLayer('报告原文', reportOriginalHtml(drill.getAttribute('data-pv-drill'))); return }
    var btn = e.target.closest('[data-action]')
    if (!btn) return
    var act = btn.getAttribute('data-action')
    var p = profile()
    if (act === 'nav') { go(btn.getAttribute('data-page')); navigate(state.page, subOf(state.page)) }
    else if (act === 'go') { go(btn.getAttribute('data-page')); navigate(state.page, subOf(state.page)) }
    else if (act === 'sub') { state.sub[state.page] = btn.getAttribute('data-sub'); render(); navigate(state.page, state.sub[state.page]) }
    else if (act === 'range') { state.range = btn.getAttribute('data-range'); render() }
    else if (act === 'metric') { state.picked[btn.getAttribute('data-metric')] = btn.checked; render() }
    else if (act === 'episodes') { state.showEpisodes = !state.showEpisodes; render() }
    else if (act === 'flip') {
      var code = btn.getAttribute('data-code')
      state.flipped[code] = !state.flipped[code]
      btn.setAttribute('aria-pressed', String(state.flipped[code]))
    }
    else if (act === 'font') {
      document.body.classList.toggle('large')
      btn.setAttribute('aria-pressed', String(document.body.classList.contains('large')))
    }
    else if (act === 'settings') { settingsModal('workspace') }
    else if (act === 'settings-tab') { settingsModal(btn.getAttribute('data-tab')) }
    else if (act === 'trial-search') { doTrialSearch() }
    else if (act === 'open-store') { openDialog('资料目录', '<p>开发版中选择本机目录；口径：拒绝主目录、桌面、下载根目录、tmp。</p><p>本原型为示意，目录未真实挂载。</p>') }
    else if (act === 'about') { openDialog('原型操作说明', '<p>全部数据为合成示例（两套档案，侧栏可切换）。</p><p>顶部「?」打开整页疾病概要；每页「和 AI 讨论」只填草稿不发送。</p><p>私密记录不进看板摘要、导出与 AI 上下文。</p>') }
    else if (act === 'dialog-close') { $('#dialog').close() }
    else if (act === 'agent-toggle') { setAgent(!state.agentOpen) }
    else if (act === 'agent-hide') { setAgent(false) }
    else if (act === 'ai') {
      var page = btn.getAttribute('data-page') || state.page
      state.draft.aiPrompt = aiPromptFor(page)
      agentDraft(state.draft.aiPrompt)
    }
    else if (act === 'profiles') { openProfiles() }
    else if (act === 'pick-profile') {
      state.profileId = btn.getAttribute('data-id')
      state.sessions = {}
      state.draft = {}
      setAgent(false)
      $('#profile-name').textContent = p.name
      $('#profile-meta-tag').textContent = p.tag
      $('#profile-avatar').textContent = p.name.slice(-1)
      closeDialog(); applyHash(); toast('已切换到 ' + p.name + '；会话与草稿已隔离')
    }
    else if (act === 'show-form') { var f = btn.getAttribute('data-form'); var el = $('#form-' + f); if (el) el.scrollIntoView({ block: 'center' }) }
    else if (act === 'cancel-form') { delete state.draft[btn.getAttribute('data-form')]; render() }
    else if (act === 'save-flap-continue' || act === 'save-flap-close') { saveFlap(act === 'save-flap-continue') }
    else if (act === 'save-treat-continue' || act === 'save-treat-close') { saveTreat(act === 'save-treat-continue') }
    else if (act === 'save-q-continue' || act === 'save-q-close') { saveQ(act === 'save-q-continue') }
    else if (act === 'save-hosp') { saveHosp() }
    else if (act === 'hospital-edit') { toast('更正=新增版本（本原型演示入口；开发版打开表单并保留历史版本）') }
    else if (act === 'flap-priv') {
      var f = p.flaps.find(function (z) { return z.id === btn.getAttribute('data-id') })
      f.private = !f.private; render(); toast('私密标记已切换；三出口共用同一过滤')
    }
    else if (act === 'q-priv') {
      var q = p.questions.find(function (z) { return z.id === btn.getAttribute('data-id') })
      q.private = !q.private; render()
    }
    else if (act === 'feel-priv') {
      var x = p.mind.feel[sharedOnly(p.mind.feel).map(function (z) { return z }).length ? sharedIndex(p.mind.feel, Number(btn.getAttribute('data-i'))) : -1]
      if (x) { x.private = !x.private; render() }
    }
    else if (act === 'mineru-consent') {
      var c = $('#mineru-consent')
      var warn = $('#mineru-warning')
      var tk = $('#mineru-token-btn')
      if (c.checked) { warn.textContent = '已勾选：本原型仍不联网（未接入 MinerU）。'; tk.removeAttribute('disabled') }
      else { warn.textContent = '未勾选前：不会上传、不会调用任何解析服务。'; tk.setAttribute('disabled', '') }
    }
    else if (act === 'mineru-token') { toast('本原型未接入 MinerU，Token 表单为占位') }
    else if (act === 'pv-export') { openPvLayer('导出预览（私密过滤后）', exportPreviewHtml()) }
    else if (act === 'pv-report') { openPvLayer('报告详情', reportDetailHtml(btn.getAttribute('data-id'))) }
    else if (act === 'pv-labs') { openPvLayer('化验记录', labsLayerHtml()) }
  })
  /* 临床检索：开发版优先本机快照 API，失败/独立打开回退内置示例（不裸 throw） */
  function doTrialSearch() {
    var kw = ($('#trial-kw') || {}).value || ''
    var base = window.__PERI_API_BASE__
    var done = function (rows, note) {
      $('#trial-result').innerHTML = trialRows(rows) + (note ? '<p class="notice plain">' + esc(note) + '</p>' : '')
    }
    if (base) {
      fetch(base + '/api/trials?keyword=' + encodeURIComponent(kw))
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
        .then(function (d) { done((d.records || []), d.available === false ? '快照不可用：' + (d.reason || '') : '共 ' + (d.records || []).length + ' 条命中 · 登记状态未核实') })
        .catch(function () { done(demoFilter(kw), '快照接口不可用，回退内置示例（虚构条目）。') })
    } else {
      done(demoFilter(kw), '原型内置示例（虚构条目）；开发版从本机快照检索。')
    }
  }
  function demoFilter(kw) {
    kw = (kw || '').trim()
    return (window.DEMO_DATA.trialsDemo || []).filter(function (r) { return !kw || (r.title || '').indexOf(kw) >= 0 })
  }
  function sharedIndex(list, shownIndex) {
    var shared = list.filter(function (z) { return !z.private })
    return list.indexOf(shared[shownIndex])
  }
  document.addEventListener('change', function (e) {
    var t = e.target
    if (t.matches('[data-draft]')) {
      var path = t.getAttribute('data-draft').split('.')
      state.draft[path[0]] = state.draft[path[0]] || {}
      state.draft[path[0]][path[1]] = t.type === 'checkbox' ? t.checked : t.value
      return
    }
    if (t.matches('[data-action="metric"]')) {
      state.picked[t.getAttribute('data-metric')] = t.checked
      render()
    }
  })
  function saveFlap(keep) {
    var d = state.draft.flap || {}
    if (!d.start) { $('#flap-err').textContent = '开始日期为必填项。'; return }
    profile().flaps.push({ id: 'new-' + Date.now(), start: d.start, end: d.end || null, note: d.note || '', private: !!d.private })
    delete state.draft.flap
    if (keep) { render(); toast('已保存 1 条（演示）；可继续录入') } else { render(); toast('已保存并关闭（演示）') }
  }
  function saveTreat(keep) {
    var d = state.draft.treat || {}
    if (!d.date || !d.name) { $('#treat-err').textContent = '日期与内容为必填项。'; return }
    profile().treatments.push({ id: 'new-' + Date.now(), date: d.date, kind: d.kind || '按次', name: d.name, note: d.note || '', private: false })
    if (!keep) delete state.draft.treat
    render(); toast(keep ? '已保存（演示）；继续录入' : '已保存并关闭（演示）')
  }
  function saveQ(keep) {
    var d = state.draft.q || {}
    if (!d.q) { toast('问题内容为必填'); return }
    profile().questions.push({ id: 'new-' + Date.now(), q: d.q, addedOn: TODAY, answered: false, private: false })
    if (!keep) delete state.draft.q
    render(); toast(keep ? '已保存（演示）；继续录入' : '已保存并关闭（演示）')
  }
  function saveHosp() {
    var d = state.draft.hosp || {}
    if (!d.name) { toast('医院名称为必填'); return }
    profile().hospitals.push({ id: 'new-' + Date.now(), name: d.name, dept: d.dept || '', contact: d.contact || '未录入', ver: 1 })
    delete state.draft.hosp
    render(); toast('已保存（演示）')
  }
  function openDialog(title, html) {
    $('#dialog-title').textContent = title
    $('#dialog-body').innerHTML = html
    $('#dialog').showModal()
  }
  function closeDialog() { var d = $('#dialog'); if (d.open) d.close() }
  function openProfiles() {
    var html = DATA.profiles.map(function (p) {
      return '<button style="width:100%;text-align:left;margin-bottom:8px" data-action="pick-profile" data-id="' + p.id + '" aria-pressed="' + (p.id === state.profileId) + '"><b>' + esc(p.name) + '</b> · ' + esc(p.tag) + '</button>'
    }).join('') + '<p class="small-note">切换后整页数据联动；会话与草稿按档案隔离。全部为合成示例。</p>'
    openDialog('切换演示档案', html)
  }

  /* 面板拖宽 25–45%，键盘步进 2% */
  (function initSplitter() {
    var sp = $('#agent-splitter')
    var dragging = false
    sp.addEventListener('pointerdown', function (e) { dragging = true; sp.setPointerCapture(e.pointerId) })
    sp.addEventListener('pointermove', function (e) {
      if (!dragging) return
      var rect = document.querySelector('.app-body').getBoundingClientRect()
      var pct = Math.round((rect.right - e.clientX) / rect.width * 100)
      setPct(Math.min(45, Math.max(25, pct)))
    })
    sp.addEventListener('pointerup', function () { dragging = false })
    sp.addEventListener('keydown', function (e) {
      var now = Number(sp.getAttribute('aria-valuenow'))
      if (e.key === 'ArrowLeft') { setPct(Math.min(45, now + 2)); e.preventDefault() }
      if (e.key === 'ArrowRight') { setPct(Math.max(25, now - 2)); e.preventDefault() }
      if (e.key === 'Home') { setPct(45); e.preventDefault() }
      if (e.key === 'End') { setPct(25); e.preventDefault() }
    })
    function setPct(pct) {
      $('#agent-pane').style.width = pct + '%'
      sp.setAttribute('aria-valuenow', String(pct))
    }
  })()

  global.addEventListener('hashchange', applyHash)
  global.addEventListener('message', function (e) { /* 预留：宿主→原型回执 */ })

  function paintVersion() {
    $('#app-version').textContent = APP_INFO.version
    $('#app-build').textContent = APP_INFO.build
    $('#ver-chip').textContent = APP_INFO.version
  }

  /* 路由渲染函数挂 window：文件末尾顶层 ROUTES（检查器穷举用）按名引用 */
  global.pageDash = pageDash
  global.pageEvents = pageEvents
  global.pageLabs = pageLabs
  global.pageTreatment = pageTreatment
  global.pageVisits = pageVisits
  global.pageReports = pageReports
  global.pageMind = pageMind
  global.pageRecords = pageRecords
  global.pageClinical = pageClinical

  /* 探针钩子：只暴露只读视图与渲染入口，业务逻辑不外泄 */
  global.__PERI_APP__ = {
    state: state,
    DATA: DATA,
    render: render,
    go: go,
    derivedStatus: derivedStatus,
    profile: profile,
    seriesCount: function (m) { return seriesFor(m).length },
    sharedOnly: sharedOnly,
    privacyLine: privacyLine,
    aiPromptFor: aiPromptFor,
    pv: pvState,
    version: APP_INFO.version
  }

  /* ---------- 启动 ---------- */
  paintVersion()
  var first = profile()
  $('#profile-name').textContent = first.name
  $('#profile-meta-tag').textContent = first.tag
  $('#profile-avatar').textContent = first.name.slice(-1)
  applyHash()
})(window)

/* 路由表（顶层，供 check-probe-coverage 穷举孤儿页）：
 * 'page/sub' → true。页面键与 SUBPAGES 一一对应，孤儿页 = SUBPAGES − ROUTES = 0 */
const ROUTES = {
  'dash': pageDash,
  'events/list': pageEvents,
  'events/timeline': pageEvents,
  'labs/list': pageLabs,
  'labs/chart': pageLabs,
  'treatment/log': pageTreatment,
  'treatment/meds': pageTreatment,
  'visits/prep': pageVisits,
  'visits/hospitals': pageVisits,
  'reports/list': pageReports,
  'reports/wall': pageReports,
  'mind/feel': pageMind,
  'mind/family': pageMind,
  'records/archive': pageRecords,
  'records/metrics': pageRecords,
  'records/summary': pageRecords,
  'clinical/status': pageClinical,
  'clinical/browse': pageClinical
};



/* ── 开发版数据源（scripts/migrate-public.mjs 注入点；原型无此块）──
   宿主形态优先 bootstrap（读模型还原 demo 形状，parity 由测试断言）；
   file:// 与拉取失败回退演示数据：不裸 throw、不白屏。 */
;(function () {
  var apiBase = "__API_BASE__"; /* 令牌会被宿主注入成字符串字面量；禁止把令牌挂在 window 对象上（注入后会语法错误） */
  if (location.protocol === 'file:') return; /* 独立双击打开：走演示态，未接通后端，页面已明说 */
  /* 部署态：AI 对话由宿主原生面板承载（agent-draft 契约）——页面内「AI 对话（演示）」坞整体退场 */
  if (window.parent !== window) {
    for (var dieId of ['agent-pane', 'agent-splitter', 'agent-toggle']) {
      var dead = document.getElementById(dieId)
      if (dead && dead.parentNode) dead.parentNode.removeChild(dead)
    }
  }
  fetch(apiBase + '/api/bootstrap').then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  }).then(function (b) {
    if (!b || !Array.isArray(b.profiles) || !b.profiles.length || b.TODAY == null) throw new Error('bootstrap 形状不符')
    window.DEMO_DATA.TODAY = b.TODAY
    window.DEMO_DATA.profiles = b.profiles
    var app = window.__PERI_APP__
    if (app && app.render) {
      app.state.profileId = b.profiles[0].id
      app.state.page = 'dash'
      app.state.sub = {}
      app.state.range = 'all'
      app.state.picked = { CRP: true, ESR: true, WBC: false, cTnI: false, 'NT-proBNP': false, ALT: false, Cr: false, '体温': false }
      app.state.showEpisodes = true
      app.state.flipped = {}
      app.render()
    }
    window.__PERI_API_BASE__ = apiBase
    console.info('[pericarditis] 已切换到本机数据库数据（' + b.profiles.length + ' 个档案）')
  }).catch(function (e) {
    console.warn('[pericarditis] bootstrap 不可用，继续使用演示数据：', String(e && e.message || e))
  });
})();