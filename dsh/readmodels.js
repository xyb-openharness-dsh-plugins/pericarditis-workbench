/**
 * 读模型：把 SQLite 的行还原成 prototypes/v0.2/demo-data.js 同一形状（parity 唯一验收标准）。
 *
 * 规则：
 *   - 裸 SELECT 一律 ORDER BY rowid（家族契约）；lab_results 另按 measured_on 稳定读序的由索引保证，
 *     输出顺序仍以 rowid 为准（与演示数据插入顺序一致）；
 *   - 私密在 bootstrap 默认不过滤——返回全量、私密标记随行返回，页面按原型口径显示「私密」徽标、
 *     聚合只算共享行（sharedOnly，与原型同一份函数语义）；导出与 AI 两个出口走 bootstrapForExit，
 *     在读模型层剥掉 is_private=1 的行（三出口过滤中的两出口在服务层强制生效，看板摘要的
 *     过滤由 readDerivedStatus 只统计共享行实现）；
 *   - 派生值（缓解第 N 天 / 距上次发作 / 近 90 天发作次数）读时算（readDerivedStatus），不落库；
 *   - id 还原：演示数据的字符串 id（如 a-f1）不落库（表主键自增），读时按 rowid 序确定性合成：
 *     前缀取 profile_key 去掉 demo- 前缀，逐表重新编号——与种子写入顺序一致，parity 逐字节成立。
 */
const asText = (v) => (v === null || v === undefined ? null : String(v));

/** profile_key（demo-a）→ 演示 id 前缀（a）。 */
function idPrefix(profileKey) {
  return String(profileKey || '').replace(/^demo-/, '');
}

/**
 * 演示 id 的补零宽度是原型手写产物：B 档案的 labs/treatments 用两位（b-l01/b-t01），
 * 其余（含 A 档案全部）一位。读模型按同一规则合成，parity 才能逐字节成立。
 */
function idPad(profileKey, table) {
  return (profileKey === 'demo-b' && (table === 'labs' || table === 'treatments')) ? 2 : 1;
}

function synthId(pre, kindChar, i, pad) {
  return `${pre}-${kindChar}${String(i + 1).padStart(pad, '0')}`;
}

export function readMetricDefs(db) {
  return db.prepare('SELECT * FROM metric_defs ORDER BY ord, rowid').all();
}

export function readSectionTitles(db, profileKey) {
  return db.prepare('SELECT * FROM section_titles WHERE profile_key = ? ORDER BY ord, rowid').all(profileKey);
}

export function readBootstrap(db) {
  const rows = db.prepare('SELECT * FROM subjects ORDER BY rowid').all();
  const today = new Date();
  const todayText = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return {
    TODAY: todayText,
    profiles: rows.map((pr) => readSubject(db, pr)),
  };
}

export function readSubject(db, pr) {
  const key = pr.profile_key;
  const pre = idPrefix(key);

  const flaps = db.prepare('SELECT * FROM flap_events WHERE profile_key = ? ORDER BY rowid').all(key).map((f, i) => ({
    id: synthId(pre, 'f', i, idPad(key, 'flaps')), start: f.start_date, end: f.end_date ?? null, note: f.note ?? '', private: !!f.is_private,
  }));

  const metricTitle = {};
  for (const md of readMetricDefs(db)) metricTitle[md.key] = md.title;
  const labs = db.prepare('SELECT * FROM lab_results WHERE profile_key = ? ORDER BY rowid').all(key).map((l, i) => ({
    id: synthId(pre, 'l', i, idPad(key, 'labs')), metric: metricTitle[l.metric_key] || l.metric_key, date: l.measured_on ?? null,
    value: l.value, unit: l.unit || '', method: l.method || '', org: l.org || '', private: !!l.is_private,
  }));

  const treatments = db.prepare('SELECT * FROM treatment_events WHERE profile_key = ? ORDER BY rowid').all(key).map((t, i) => ({
    id: synthId(pre, 't', i, idPad(key, 'treatments')), date: t.event_date, kind: t.kind, name: t.name, note: t.note ?? '', private: !!t.is_private,
  }));

  const meds = db.prepare('SELECT * FROM meds WHERE profile_key = ? ORDER BY rowid').all(key).map((m, i) => ({
    id: synthId(pre, 'm', i, idPad(key, 'meds')), name: m.name, schedule: m.schedule_text || '', since: m.since_on ?? null, note: m.note ?? '',
  }));

  const questions = db.prepare('SELECT * FROM visit_questions WHERE profile_key = ? ORDER BY rowid').all(key).map((q, i) => ({
    id: synthId(pre, 'q', i, idPad(key, 'questions')), q: q.question, addedOn: q.added_on ?? null, answered: q.answered_on != null, private: !!q.is_private,
  }));

  const hospitals = db.prepare('SELECT * FROM hospitals WHERE profile_key = ? ORDER BY rowid').all(key).map((h, i) => ({
    id: synthId(pre, 'h', i, idPad(key, 'hospitals')), name: h.name, dept: h.dept || '', contact: h.contact || '', ver: h.ver || 1,
  }));

  const reports = db.prepare('SELECT * FROM reports WHERE profile_key = ? ORDER BY rowid').all(key).map((r, i) => ({
    id: synthId(pre, 'r', i, idPad(key, 'reports')), title: r.title, date: r.reported_on ?? null, kind: r.kind || '',
    source: r.source_state || '', effusion: r.key_finding ?? '', private: !!r.is_private,
  }));

  const docs = db.prepare('SELECT * FROM documents WHERE profile_key = ? ORDER BY rowid').all(key).map((d, i) => ({
    id: synthId(pre, 'd', i, idPad(key, 'docs')), name: d.name, date: d.doc_date ?? null, type: d.doc_type || '', state: d.state || '',
  }));

  const mindRows = db.prepare('SELECT * FROM mind_notes WHERE profile_key = ? ORDER BY rowid').all(key);
  const mind = { feel: [], family: [] };
  for (const m of mindRows) {
    const item = { d: m.noted_on ?? null, text: m.body, author: m.author || '', private: !!m.is_private };
    if (m.kind === 'family') mind.family.push(item);
    else mind.feel.push(item);
  }

  /* profile 键值（确诊经过/复发登记/就诊医院原文照录）+ 医生行动计划（subjects.action_plan 原话） */
  const facts = {};
  for (const f of db.prepare('SELECT * FROM profile_facts WHERE profile_key = ? ORDER BY rowid').all(key)) {
    facts[f.fact_key] = f.fact_value;
  }
  const profile = { 确诊经过: facts['确诊经过'] ?? '', 复发登记: facts['复发登记'] ?? '', 就诊医院: facts['就诊医院'] ?? '' };
  if (pr.action_plan != null) profile['医生行动计划原话'] = pr.action_plan;

  return {
    id: key, name: pr.name || '', tag: pr.meta || '', isDemo: !!pr.is_demo,
    profile, flaps, labs, treatments, meds, questions, hospitals, reports, docs, mind,
  };
}

/**
 * 派生状态（读时算，不落库）：缓解第 N 天 / 距上次发作 / 近 90 天发作次数。
 * 与原型 derivedStatus 同一语义：只统计共享行（私密发作不进聚合），私密条数单独返回。
 * @param {string} today YYYY-MM-DD（读模型不写死"今天"）
 */
export function readDerivedStatus(db, profileKey, today) {
  const all = db.prepare('SELECT * FROM flap_events WHERE profile_key = ? ORDER BY rowid').all(profileKey);
  const shared = all.filter((f) => !f.is_private);
  const dayBetween = (a, b) => (a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) : null);
  const cutoff = (() => {
    const d = new Date(today); d.setDate(d.getDate() - 90); return d;
  })();
  const out = {};
  const act = shared.find((f) => f.end_date == null);
  if (act) {
    out.mode = '发作中';
    out.dayN = dayBetween(act.start_date, today) + 1;
    const lastEnd = shared.filter((f) => f.end_date != null && f.end_date < act.start_date).map((f) => f.end_date).sort().pop();
    out.sinceLast = lastEnd ? dayBetween(lastEnd, act.start_date) : null;
  } else {
    const ends = shared.map((f) => f.end_date).filter(Boolean).sort();
    const last = ends[ends.length - 1];
    out.mode = '缓解期';
    out.dayN = last ? dayBetween(last, today) + 1 : null;
    out.sinceLast = last ? dayBetween(last, today) : null;
  }
  out.nearCount = shared.filter((f) => new Date(f.start_date) >= cutoff).length;
  out.privateFlaps = all.length - shared.length;
  return out;
}

/** 私密行剥离（深拷贝）：导出与 AI 上下文出口在读模型层强制过滤 is_private=1。 */
function stripPrivate(data) {
  const clone = JSON.parse(JSON.stringify(data));
  for (const p of clone.profiles || []) {
    p.flaps = (p.flaps || []).filter((x) => !x.private);
    p.labs = (p.labs || []).filter((x) => !x.private);
    p.treatments = (p.treatments || []).filter((x) => !x.private);
    p.questions = (p.questions || []).filter((x) => !x.private);
    p.reports = (p.reports || []).filter((x) => !x.private);
    p.docs = (p.docs || []).filter((x) => !x.private);
    if (p.mind) {
      p.mind.feel = (p.mind.feel || []).filter((x) => !x.private);
      p.mind.family = (p.mind.family || []).filter((x) => !x.private);
    }
  }
  return clone;
}

/**
 * 三出口读法：
 *   - 'dashboard'：页面渲染需要私密标记（「私密」徽标与"私密 N 条未计入"提示），返回全量；
 *     看板摘要的三个数字由 readDerivedStatus 只统计共享行，私密不进聚合。
 *   - 'export' / 'ai'：读模型层剥掉私密行，调用方拿到的数据里不存在 is_private=1 的内容。
 */
export function bootstrapForExit(db, exit = 'dashboard') {
  const full = readBootstrap(db);
  if (exit === 'export' || exit === 'ai') return stripPrivate(full);
  return full;
}
