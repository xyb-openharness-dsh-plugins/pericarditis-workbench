/* 35 号 · 试验匹配纯函数（展示层计算；可被 node 测试以 new Function 方式断言）
 * 红线（E7）：
 *   ① 判据只来自快照真实存在的字段（title/studyType）；未结构化 → '?' 不进分母
 *   ② 药物靶点不进分母（本快照本就没有靶点字段，函数签名也不收靶点）
 *   ③ 可对照项不足 2 条不给百分数
 *   ④ 反向条件必须显式反转（本台当前无反向条件字段，保留语义位）
 */
;(function (global) {
  'use strict'

  var RELEVANT = /pericarditis|心包炎/i

  function items(facts, prefs) {
    var out = []
    var title = String(facts && facts.title || '')
    var type = String(facts && facts.studyType || '')
    var pref = prefs && prefs.type ? String(prefs.type) : 'all'
    /* ① 疾病相关性（硬性）——来自快照真实字段 title */
    out.push({
      state: RELEVANT.test(title) ? '✓' : '✕',
      label: '与本台疾病相关（心包炎）',
      hard: true,
      got: '题目「' + (title.length > 40 ? title.slice(0, 40) + '…' : title) + '」（快照字段 title）',
      req: '登记题目或研究对象与心包炎相关'
    })
    /* ② 研究类型 vs 用户偏好——偏好=all 时不进分母（不产出该条） */
    if (pref !== 'all') {
      var want = pref === 'interventional' ? '介入性' : '观察性'
      out.push({
        state: type.indexOf(want) >= 0 ? '✓' : (type ? '✕' : '?'),
        label: '研究类型符合你的偏好',
        hard: false,
        got: type ? '登记类型「' + type + '」（快照字段 studyType）' : '快照未存类型（需人工核对）',
        req: '研究类型为「' + want + '」（你在建档里选的偏好，只影响排序与对照，不是入排条件）'
      })
    }
    /* ③ 招募状态——快照无状态字段，恒为 '?'，不进分母 */
    out.push({
      state: '?',
      label: '仍在招募（可入组）',
      hard: false,
      got: '本机快照只存结构化字段，登记状态一律「未核实」（快照会过期）',
      req: '当前在招募期且名额可用——需人工核对，官方登记页为准'
    })
    return out
  }

  function score(items) {
    var comparable = (items || []).filter(function (i) { return i.state !== '?' })
    if (comparable.length < 2) return { pct: null, ok: 0, m: comparable.length, reason: '可对照项不足 2 条，不给符合度' }
    var ok = comparable.filter(function (i) { return i.state === '✓' }).length
    return { pct: Math.round(ok / comparable.length * 100), ok: ok, m: comparable.length, reason: '' }
  }

  global.PeriTrialMatch = { items: items, score: score, RELEVANT: RELEVANT }
})(window)
