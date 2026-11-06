/**
 * 演示数据种子（唯一源 = prototypes/v0.2/demo-data.js，随包灌库；幂等：非空库跳过）。
 * 首次开库（空库）写入 A/B 两套合成档案。
 *
 * 对应关系（schema/0001_initial.sql）：
 *   subjects（含 action_plan=医生行动计划原话）+ profile_facts（确诊经过/复发登记/就诊医院）
 *   flap_events / lab_results（可比组=method+org，不合并）/ treatment_events / meds /
 *   visit_questions / hospitals / reports（原件四态只登记不判读）/ documents / mind_notes
 * 演示字符串 id（a-f1…）不落库（表主键自增），读模型按 rowid 序确定性合成（见 readmodels.js）。
 */
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

  const mdIns = db.prepare('INSERT INTO metric_defs (key, title, category, unit, color, ord) VALUES (?,?,?,?,?,?)');
  const mdRows = [
    ['crp', 'CRP', 'inflammation', 'mg/L', '#b95023', 0],
    ['esr', 'ESR', 'inflammation', 'mm/h', '#8a6d3b', 1],
    ['temp', '体温', 'vitals', '℃', '#4a6fa5', 2],
  ];
  for (const r of mdRows) mdIns.run(...r);

  const subIns = db.prepare('INSERT INTO subjects (profile_key, name, meta, headline, action_plan, dash_keys, created_on, is_demo) VALUES (?,?,?,?,?,?,?,?)');
  const factIns = db.prepare('INSERT INTO profile_facts (profile_key, fact_key, fact_value, fact_date, ver) VALUES (?,?,?,?,1)');
  const flapIns = db.prepare('INSERT INTO flap_events (profile_key, start_date, end_date, note, is_private, ver) VALUES (?,?,?,?,?,1)');
  const labIns = db.prepare('INSERT INTO lab_results (profile_key, metric_key, measured_on, value, unit, method, org, is_private, note, ver) VALUES (?,?,?,?,?,?,?,?,?,1)');
  const treatIns = db.prepare('INSERT INTO treatment_events (profile_key, event_date, kind, name, note, is_private, ver) VALUES (?,?,?,?,?,?,1)');
  const medIns = db.prepare('INSERT INTO meds (profile_key, name, schedule_text, since_on, note, ver) VALUES (?,?,?,?,?,1)');
  const qIns = db.prepare('INSERT INTO visit_questions (profile_key, question, added_on, answered_on, is_private, ver) VALUES (?,?,?,?,?,1)');
  const hpIns = db.prepare('INSERT INTO hospitals (profile_key, name, dept, contact, ver) VALUES (?,?,?,?,?)');
  const repIns = db.prepare('INSERT INTO reports (profile_key, title, kind, reported_on, source_state, key_finding, is_private, ver) VALUES (?,?,?,?,?,?,?,1)');
  const docIns = db.prepare('INSERT INTO documents (profile_key, name, doc_type, doc_date, state, is_private) VALUES (?,?,?,?,?,0)');
  const mindIns = db.prepare('INSERT INTO mind_notes (profile_key, kind, noted_on, body, author, is_private, ver) VALUES (?,?,?,?,?,?,1)');

  /* ── 档案 A：刚确诊复发 · 记录少 ── */
  subIns.run('demo-a', '示例档案 A', '刚确诊复发 · 记录少', null,
    '若出现胸痛加重或发热，联系我（张医生）复诊。', null, '2026-11-07', 1);
  factIns.run('demo-a', '确诊经过', '2026-09 胸痛就诊，超声示心包积液，医生诊断心包炎（原文照录）', null);
  factIns.run('demo-a', '复发登记', '2026-09-20 起第二次发作（第一次时间未记，此处标注「未知」）', null);
  factIns.run('demo-a', '就诊医院', '示例市第一医院心内科', null);
  for (const r of [
    ['2026-09-20', '2026-10-05', '胸痛伴低热，服用医生开的药物后缓解（原文照录）', 0],
    ['2026-10-22', '2026-11-02', '复发，复诊调药后缓解', 0],
  ]) flapIns.run('demo-a', r[0], r[1], r[2], r[3]);
  for (const r of [
    ['crp', '2026-09-21', 68, 'mg/L', '免疫比浊', '示例市第一医院', 0],
    ['esr', '2026-09-21', 52, 'mm/h', 'Westergren', '示例市第一医院', 0],
    ['crp', '2026-10-08', 14, 'mg/L', '免疫比浊', '示例市第一医院', 0],
    ['crp', '2026-10-24', 41, 'mg/L', '免疫比浊', '示例市第一医院', 0],
    ['temp', '2026-09-21', 37.6, '℃', '腋表', '自录', 0],
  ]) labIns.run('demo-a', r[0], r[1], r[2], r[3], r[4], r[5], r[6], null);
  for (const r of [
    ['2026-09-21', '按次', '秋水仙碱（医生处方）', '开始服用；剂量与疗程见处方原件，本台不录判定', 0],
    ['2026-10-24', '按次', '复诊调整方案（原文照录：继续目前方案，两周后复查）', '', 0],
  ]) treatIns.run('demo-a', r[0], r[1], r[2], r[3], r[4]);
  medIns.run('demo-a', '秋水仙碱', '每日（具体见处方）', '2026-09-21', '合成示例：不写剂量');
  hpIns.run('demo-a', '示例市第一医院', '心内科', '电话见挂号单（未录入）', 1);
  for (const r of [
    ['心脏超声报告（2026-09-21）', '超声', '2026-09-21', '原件已登记', '少量心包积液（医生报告原文）', 0],
    ['化验单（CRP/ESR 2026-09-21）', '化验', '2026-09-21', '未取得原件', null, 0],
  ]) repIns.run('demo-a', r[0], r[1], r[2], r[3], r[4], r[5]);
  for (const r of [
    ['2026-09-21 出院小结', '病历', '2026-09-21', '已登记'],
    ['（日期未知示例）外院超声描述单', '超声', null, '待核对'],
  ]) docIns.run('demo-a', r[0], r[1], r[2], r[3]);
  for (const r of [
    ['feel', '2026-11-03', '这次复发比第一次更紧张，担心以后经常这样。', '本人', 0],
    ['feel', '2026-11-04', '（私密记录示例）夜里痛醒了一次，很害怕。', '本人', 1],
    ['family', '2026-11-04', '家人帮忙记了发作开始的那天晚上。', '家属', 0],
  ]) mindIns.run('demo-a', r[0], r[1], r[2], r[3], r[4]);

  /* ── 档案 B：长期随访 · 发作多次 · 记录多 ── */
  subIns.run('demo-b', '示例档案 B', '长期随访 · 发作多次 · 记录多', null,
    '若胸痛持续超过一天或发热超过 38℃，当天联系我或到急诊。（王医生 2025-11-02 门诊原话照录）', null, '2026-11-07', 1);
  factIns.run('demo-b', '确诊经过', '2024-03 首次心包炎发作，2024-05 复发，此后反复（合成示例）', null);
  factIns.run('demo-b', '复发登记', '发作次数由事件数据计算（见状态卡；私密发作不进聚合）', null);
  factIns.run('demo-b', '就诊医院', '示例市中心医院心内科；2025 起跨院随诊', null);
  for (const r of [
    ['2024-03-10', '2024-04-02', '首次发作（时间按病历整理）', 0],
    ['2024-05-18', '2024-06-10', '第一次复发', 0],
    ['2024-11-30', '2025-01-06', '冬季复发，较长', 0],
    ['2025-08-14', '2025-09-05', '复发，加用药物后缓解（原文照录）', 0],
    ['2026-08-02', '2026-08-27', '复发；开始按次注射治疗（见治疗记录）', 0],
    ['2026-10-28', '2026-11-02', '最近一次复发，较短', 0],
    ['2026-09-10', '2026-09-12', '（私密示例）短暂不适，未就医，仅自己记', 1],
  ]) flapIns.run('demo-b', r[0], r[1], r[2], r[3]);
  for (const r of [
    ['crp', '2024-03-11', 74, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['esr', '2024-03-11', 58, 'mm/h', 'Westergren', '示例市中心医院', 0],
    ['crp', '2024-04-05', 22, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2024-05-20', 61, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['esr', '2024-05-20', 49, 'mm/h', 'Westergren', '示例市中心医院', 0],
    ['crp', '2024-06-15', 9, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2024-12-02', 83, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['esr', '2024-12-02', 66, 'mm/h', 'Westergren', '示例市中心医院', 0],
    ['crp', '2025-01-10', 17, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2025-08-16', 55, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['esr', '2025-08-16', 44, 'mm/h', 'Westergren', '示例市中心医院', 0],
    ['crp', '2025-09-10', 11, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2026-08-04', 47, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2026-08-30', 12, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2026-10-29', 36, 'mg/L', '免疫比浊', '示例市中心医院', 0],
    ['crp', '2026-11-04', 8, 'mg/L', '免疫比浊', '示例市第一医院', 0],
    ['esr', '2026-11-04', 21, 'mm/h', '微量法', '示例市第一医院', 0],
    ['temp', '2026-10-28', 37.8, '℃', '腋表', '自录', 0],
    ['temp', '2026-11-02', 36.6, '℃', '腋表', '自录', 0],
    ['crp', '2026-09-14', 19, 'mg/L', '免疫比浊', '示例市中心医院', 1],
  ]) labIns.run('demo-b', r[0], r[1], r[2], r[3], r[4], r[5], r[6], null);
  for (const r of [
    ['2024-03-11', '按次', '秋水仙碱（医生处方）', '首次发作开始', 0],
    ['2025-11-02', '按次', '门诊调药（原文照录：维持目前方案）', '', 0],
    ['2026-08-05', '按次', 'IL-1 拮抗剂注射（医生处方，合成示例）', '第 1 次注射', 0],
    ['2026-08-19', '按次', 'IL-1 拮抗剂注射（合成示例）', '第 2 次', 0],
    ['2026-09-02', '按次', 'IL-1 拮抗剂注射（合成示例）', '第 3 次', 0],
    ['2026-09-16', '按次', 'IL-1 拮抗剂注射（合成示例）', '第 4 次', 0],
    ['2026-10-30', '按次', '复诊（原文照录：继续注射方案，下次复诊 2026-12）', '', 0],
    ['2025-08-16', '调药', '短期激素（医生处方，已按医嘱停用）', '疗程细节见原件', 0],
  ]) treatIns.run('demo-b', r[0], r[1], r[2], r[3], r[4]);
  medIns.run('demo-b', '秋水仙碱', '每日（具体见处方）', '2024-03-11', '合成示例');
  medIns.run('demo-b', 'IL-1 拮抗剂（注射）', '按次（每 2 周，医生安排）', '2026-08-05', '合成示例；可及性信息见疾病概要');
  for (const r of [
    ['注射治疗要坚持多久？什么时候评估效果？', '2026-10-20', 0],
    ['化验不同医院方法不一样，看趋势时怎么算可比？', '2026-10-20', 0],
    ['如果再复发，是先联系您还是直接做检查？', '2026-11-04', 0],
    ['（私密示例）可以把激素的事写进病历吗？', '2026-10-21', 1],
  ]) qIns.run('demo-b', r[0], r[1], null, r[2]);
  hpIns.run('demo-b', '示例市中心医院', '心内科', '0XX-00000000（合成）', 2);
  hpIns.run('demo-b', '示例市第一医院', '心内科（跨院随诊）', '出处：2026-11 挂号单', 1);
  hpIns.run('demo-b', '示例大学附属医院', '心内科（第二意见）', '未录入', 1);
  for (const r of [
    ['心脏超声（2024-03-11）', '超声', '2024-03-11', '原件已登记', '中量心包积液（报告原文）', 0],
    ['心脏超声（2025-08-16）', '超声', '2025-08-16', '原件已登记', '少量积液（报告原文）', 0],
    ['心脏超声（2026-10-29）', '超声', '2026-10-29', '原件已登记', '极少量积液（报告原文）', 0],
    ['化验单（2026-10-29）', '化验', '2026-10-29', '未取得原件', null, 0],
    ['门诊病历（2026-08-05）', '病历', '2026-08-05', '原件已登记', null, 0],
    ['注射记录单（2026-09-02）', '治疗', '2026-09-02', '原件已登记', null, 0],
    ['异地随诊小结（2026-11-04）', '病历', '2026-11-04', '原件已登记', null, 0],
    ['（私密示例）2025 精神科咨询小结', '其他', '2025-06-20', '原件已登记', null, 1],
  ]) repIns.run('demo-b', r[0], r[1], r[2], r[3], r[4], r[5]);
  for (const r of [
    ['2024-03-11 出院小结', '病历', '2024-03-11', '已登记'],
    ['2024-03-11 心脏超声', '超声', '2024-03-11', '已核对'],
    ['2024-05-20 化验单', '化验', '2024-05-20', '待核对'],
    ['2025-08-16 心脏超声', '超声', '2025-08-16', '已核对'],
    ['2026-08-05 门诊病历', '病历', '2026-08-05', '已核对'],
    ['2026-10-29 化验单', '化验', '2026-10-29', '待核对'],
    ['2026-11-04 随诊小结', '病历', '2026-11-04', '已登记'],
  ]) docIns.run('demo-b', r[0], r[1], r[2], r[3]);
  for (const r of [
    ['feel', '2025-06-20', '反反复复，最难的是不知道这次会不会再犯。', '本人', 0],
    ['feel', '2026-08-10', '开始注射治疗后，心里踏实了一点，但还是怕复发。', '本人', 0],
    ['feel', '2026-11-03', '这次三天就缓解了，比以前快。', '本人', 0],
    ['feel', '2026-10-25', '（私密记录示例）最近情绪很低落，不想让人知道。', '本人', 1],
    ['family', '2026-08-06', '家人负责记住每两周的注射日期。', '家属', 0],
    ['family', '2026-10-29', '这次发作家人连夜陪着去了急诊。', '家属', 0],
  ]) mindIns.run('demo-b', r[0], r[1], r[2], r[3], r[4]);

  const n = db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
  return { skipped: false, profiles: n };
}

export function hasDemoData(db) {
  return db.prepare('SELECT COUNT(*) c FROM subjects').get().c > 0;
}
