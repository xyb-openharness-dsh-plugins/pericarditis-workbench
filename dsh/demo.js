/**
 * 演示数据种子（真·唯一源 = prototypes/v0.2/demo-data.js；装包后读 public/demo-data.js 同字节副本）。
 * 首次开库（空库）把 A/B 两套合成档案灌库；幂等：非空库跳过（force 可重灌）。
 *
 * 与旧版手工镜像的区别：本文件不再手抄数据——parity 测试（test/demo-parity.test.mjs）
 * 直接断言读模型输出与 demo-data.js canonical 一致，改数据只改 demo-data.js 一处。
 *
 * 对应关系（schema/0001_initial.sql）：
 *   subjects（action_plan=医生行动计划原话）+ profile_facts（profile 各字段）
 *   flap_events / lab_results（可比组=method+org，不合并）/ treatment_events / meds /
 *   visit_questions / hospitals / reports（原件四态只登记不判读）/ documents / mind_notes
 *   metric_defs ← demo-data.metricDefs（db 键映射在 defs.db）
 * 演示字符串 id（a-f1…）不落库（主键自增），读模型按 rowid 序确定性合成（见 readmodels.js）。
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** 唯一源加载：优先仓内原型目录，装包后 prototypes 不随包 → 读 public 同字节副本 */
function loadDemoData() {
  for (const rel of ['../prototypes/v0.2/demo-data.js', '../public/demo-data.js']) {
    try {
      const src = readFileSync(join(HERE, rel), 'utf8');
      return new Function('window', src + '; return window.DEMO_DATA;')({});
    } catch { /* 尝试下一个候选 */ }
  }
  throw new Error('demo-data.js 不可读（prototypes 与 public 都缺失）');
}

export function seedDemoData(db, { force = false } = {}) {
  const existing = db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
  if (existing > 0 && !force) return { skipped: true, profiles: existing };
  if (force) {
    for (const t of ['import_conflicts', 'import_candidates', 'import_batches', 'profile_facts',
      'treatment_events', 'flap_events', 'meds', 'documents', 'viewpoints', 'mind_notes',
      'visit_questions', 'hospitals', 'reports', 'lab_results', 'metric_group_titles',
      'section_titles', 'subjects', 'metric_defs']) {
      db.prepare(`DELETE FROM ${t}`).run();
    }
  }
  const D = loadDemoData();

  /* 指标目录：来自唯一源（db 键映射在 defs.db） */
  const mdIns = db.prepare('INSERT INTO metric_defs (key, title, category, unit, color, ord) VALUES (?,?,?,?,?,?)');
  /* title 存短名（labs.metric 显示与 demo-data 一致）；长名 title 由前端 METRIC_DEFS 使用 */
  for (const d of D.metricDefs ?? []) mdIns.run(d.db, d.key, d.category, d.unit, d.color, d.ord);

  const subIns = db.prepare('INSERT INTO subjects (profile_key, name, meta, headline, action_plan, dash_keys, created_on, is_demo) VALUES (?,?,?,?,?,?,?,?)');
  const factIns = db.prepare('INSERT INTO profile_facts (profile_key, fact_key, fact_value, fact_date, ver) VALUES (?,?,?,?,?)');
  const flapIns = db.prepare('INSERT INTO flap_events (profile_key, start_date, end_date, note, is_private, ver) VALUES (?,?,?,?,?,1)');
  const labIns = db.prepare('INSERT INTO lab_results (profile_key, metric_key, measured_on, value, unit, method, org, is_private, note, ver) VALUES (?,?,?,?,?,?,?,?,?,1)');
  const treatIns = db.prepare('INSERT INTO treatment_events (profile_key, event_date, kind, name, note, is_private, ver) VALUES (?,?,?,?,?,?,1)');
  const medIns = db.prepare('INSERT INTO meds (profile_key, name, schedule_text, since_on, note, ver) VALUES (?,?,?,?,?,1)');
  const qIns = db.prepare('INSERT INTO visit_questions (profile_key, question, added_on, answered_on, is_private, ver) VALUES (?,?,?,?,?,1)');
  const hpIns = db.prepare('INSERT INTO hospitals (profile_key, name, dept, contact, ver) VALUES (?,?,?,?,?)');
  const repIns = db.prepare('INSERT INTO reports (profile_key, title, kind, reported_on, source_state, key_finding, is_private, ver) VALUES (?,?,?,?,?,?,?,1)');
  const docIns = db.prepare('INSERT INTO documents (profile_key, name, doc_type, doc_date, state, is_private) VALUES (?,?,?,?,?,0)');
  const mindIns = db.prepare('INSERT INTO mind_notes (profile_key, kind, noted_on, body, author, is_private, ver) VALUES (?,?,?,?,?,?,1)');

  const dbKey = {};
  for (const d of D.metricDefs ?? []) dbKey[d.key] = d.db;

  for (const p of D.profiles ?? []) {
    subIns.run(p.id, p.name, p.tag ?? null, null, p.profile?.['医生行动计划原话'] ?? null, null, D.TODAY, p.isDemo ? 1 : 0);
    for (const [k, v] of Object.entries(p.profile ?? {})) {
      if (k === '医生行动计划原话') continue; /* 已入 subjects.action_plan */
      factIns.run(p.id, k, v, null, 1);
    }
    for (const f of p.flaps ?? []) flapIns.run(p.id, f.start, f.end ?? null, f.note ?? '', f.private ? 1 : 0);
    for (const l of p.labs ?? []) {
      if (!dbKey[l.metric]) continue; /* 未知指标不入库（metric_defs 外的键会破坏外键口径） */
      labIns.run(p.id, dbKey[l.metric], l.date ?? null, l.value ?? null, l.unit ?? null, l.method ?? null, l.org ?? null, l.private ? 1 : 0, null);
    }
    for (const t of p.treatments ?? []) treatIns.run(p.id, t.date, t.kind, t.name, t.note ?? '', t.private ? 1 : 0);
    for (const m of p.meds ?? []) medIns.run(p.id, m.name, m.schedule, m.since ?? null, m.note ?? '');
    for (const q of p.questions ?? []) qIns.run(p.id, q.q, q.addedOn ?? null, q.answered ? D.TODAY : null, q.private ? 1 : 0);
    for (const h of p.hospitals ?? []) hpIns.run(p.id, h.name, h.dept ?? '', h.contact ?? '', h.ver ?? 1);
    for (const r of p.reports ?? []) repIns.run(p.id, r.title, r.kind ?? null, r.date ?? null, r.source ?? null, r.effusion || null, r.private ? 1 : 0);
    for (const d of p.docs ?? []) docIns.run(p.id, d.name, d.type ?? null, d.date ?? null, d.state ?? null);
    for (const x of p.mind?.feel ?? []) mindIns.run(p.id, 'feel', x.d ?? null, x.text, x.author ?? null, x.private ? 1 : 0);
    for (const x of p.mind?.family ?? []) mindIns.run(p.id, 'family', x.d ?? null, x.text, x.author ?? null, x.private ? 1 : 0);
  }

  const n = db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
  return { skipped: false, profiles: n };
}

export function hasDemoData(db) {
  return db.prepare('SELECT COUNT(*) c FROM subjects').get().c > 0;
}
