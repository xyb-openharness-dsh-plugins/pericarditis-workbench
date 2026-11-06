/* 复发性心包炎工作台 · 初始数据模型（0001）
 *
 * 家族四条契约（与宫颈癌/食管癌等同源）：
 *   1. 看法恒不为结论（viewpoints 只是记录，无 is_conclusion 列，读模型保证恒为"不是医生结论"）；
 *   2. 显式 null ≠ 0：未知日期、缺失值一律 NULL，不用空串冒充；
 *   3. 更正只新增版本，不覆盖（各事实表带 ver 与 superseded_by，历史行保留）；
 *   4. 事实四层不合并（文档 / 候选 / 记录 / 指标分表存放）。
 *
 * 非肿瘤三条数据层红线：
 *   A. 无判读列：全库不设 diagnosis / risk_level / activity_score / stage / 线序 / 疗效 类列；
 *      "缓解期第 N 天"等派生值读时计算（读模型 / 前端），不落库。
 *   B. 发作—缓解是第一实体：flap_events 一行=一次发作（start_date 到 end_date，end IS NULL 表示发作中）；
 *      状态卡三个数字（缓解第 N 天 / 距上次发作 / 近 90 天次数）全部由本表派生。
 *   C. 化验可比组 = method + org：lab_results 不做跨组合并，分类不进趋势（category 只作分组展示键）。
 *
 * 迁移只增不改：本文件冻结后（sha256 见 freeze-contract.md），
 * 要加结构只能新增 0002_*.sql，改这里会被 check 拦下。
 *
 * 约定：
 *   - ORDER BY rowid 为稳定读序（家族契约）；
 *   - in_use 标记候选/记录是否被采用；
 *   - 分节标题进 section_titles 表（不用 subjects 上一排 *_title 列，家族教训）；
 *   - is_private 缺省 0；读模型默认不过滤，三出口（看板摘要/导出/AI 上下文）必须显式过滤 is_private=1。
 */

/* ---------- 档案级（2） ---------- */

CREATE TABLE subjects (
  profile_key   TEXT PRIMARY KEY,
  name          TEXT,
  meta          TEXT,            -- 侧栏第二行（标签 · 随访阶段）
  headline      TEXT,            -- 看板顶部一句事实摘要
  action_plan   TEXT,            -- 医生行动计划【原话照录】，界面不生成；无则 NULL
  dash_keys     TEXT,            -- JSON 数组：看板快捷卡顺序
  created_on    TEXT,
  is_demo       INTEGER DEFAULT 0
);

/* 分节标题：key 与读模型 section 键一一对应；某档案没有这一节就不写行 */
CREATE TABLE section_titles (
  profile_key TEXT,
  key         TEXT,
  title       TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, key)
);

/* ---------- 指标（3） ---------- */

/* 指标目录：分类只作分组展示键，不进趋势 */
CREATE TABLE metric_defs (
  key         TEXT PRIMARY KEY,
  title       TEXT,
  category    TEXT,              -- inflammation / vitals（展示分组键）
  unit        TEXT,
  color       TEXT,
  ord         INTEGER
);

/* 化验结果：可比组 = method + org；不做跨组合并 */
CREATE TABLE lab_results (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  metric_key    TEXT NOT NULL REFERENCES metric_defs(key),
  measured_on   TEXT,            -- 未知则 NULL
  value         REAL,
  value_text    TEXT,            -- 文本型结果（如描述），与 value 二选一
  unit          TEXT,
  method        TEXT,            -- 免疫比浊 / Westergren / 微量法 / 腋表 …
  org           TEXT,            -- 机构或「自录」
  report_id     TEXT,            -- 同一报告的多次修订同 ID（最近报告表口径）
  is_private    INTEGER DEFAULT 0,
  note          TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 指标分组标题（指标页与一图秀共用同一目录，组名/顺序/项数一致） */
CREATE TABLE metric_group_titles (
  profile_key TEXT,
  category    TEXT,
  title       TEXT,
  ord         INTEGER,
  PRIMARY KEY (profile_key, category)
);

/* ---------- 通用（7） ---------- */

/* 报告登记（原件状态四态：原件已登记/官方入口/未取得原件/仅题录） */
CREATE TABLE reports (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  report_key    TEXT,            -- 同一报告历次修订同 key
  title         TEXT NOT NULL,
  kind          TEXT,            -- 超声 / 化验 / 病历 / 治疗 / 其他
  reported_on   TEXT,
  source_state  TEXT,            -- 原件已登记 / 未取得原件 / 仅题录
  key_finding   TEXT,            -- 关键描述【照录】，不做判读
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  created_on    TEXT
);

/* 就医信息：多家医院逐条卡 */
CREATE TABLE hospitals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  name          TEXT NOT NULL,
  dept          TEXT,
  contact       TEXT,            -- 电话或「出处引用」
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  created_on    TEXT
);

/* 复诊问题清单 */
CREATE TABLE visit_questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  question      TEXT NOT NULL,
  added_on      TEXT,
  answered_on   TEXT,            -- NULL=待问
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 心理与家庭：感受 / 家人支持事项（author=本人/家属；只记录不评估，无评分列） */
CREATE TABLE mind_notes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  kind          TEXT NOT NULL,   -- feel / family
  noted_on      TEXT,
  body          TEXT NOT NULL,
  author        TEXT,
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 看法（患者/家属视角记录，恒不为结论） */
CREATE TABLE viewpoints (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  scope         TEXT,            -- 关联的 section 键
  body          TEXT NOT NULL,
  author        TEXT,
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* 文档（资料库登记） */
CREATE TABLE documents (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  name          TEXT NOT NULL,
  doc_type      TEXT,
  doc_date      TEXT,
  state         TEXT,            -- 已登记 / 已核对 / 待核对
  file_path     TEXT,
  is_private    INTEGER DEFAULT 0,
  created_on    TEXT
);

/* 日常用药（医生安排的照录；无剂量推荐列，剂量写进 note 原文） */
CREATE TABLE meds (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  name          TEXT NOT NULL,
  schedule_text TEXT,            -- 「每日（具体见处方）」原文照录
  since_on      TEXT,
  note          TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER
);

/* ---------- 病种专属（3） ---------- */

/* 发作事件（第一实体）：end_date IS NULL = 发作中 */
CREATE TABLE flap_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  start_date    TEXT NOT NULL,
  end_date      TEXT,            -- NULL = 发作中（缓解日期未知也 NULL + note 说明）
  note          TEXT,            -- 经过【照录】，界面不生成
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  created_on    TEXT
);

/* 治疗按次登记：kind = 按次 / 调药 / 复诊；name=医生安排原话照录，不做疗效判定 */
CREATE TABLE treatment_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  event_date    TEXT NOT NULL,
  kind          TEXT NOT NULL,
  name          TEXT NOT NULL,
  note          TEXT,
  is_private    INTEGER DEFAULT 0,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  flap_id       INTEGER REFERENCES flap_events(id)
);

/* 确诊档案字段（key-value，原文照录；不含分期/危险度） */
CREATE TABLE profile_facts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  fact_key      TEXT NOT NULL,   -- 起病经过 / 复发登记 / 就诊医院 / 医生行动计划原话 …
  fact_value    TEXT NOT NULL,
  fact_date     TEXT,
  ver           INTEGER DEFAULT 1,
  superseded_by INTEGER,
  UNIQUE (profile_key, fact_key, ver)
);

/* ---------- 导入（3） ---------- */

CREATE TABLE import_batches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key   TEXT NOT NULL,
  imported_on   TEXT,
  source_desc   TEXT,
  status        TEXT             -- pending / partial / done / failed
);

CREATE TABLE import_candidates (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id      INTEGER NOT NULL REFERENCES import_batches(id),
  target_table  TEXT NOT NULL,   -- lab_results / reports / flap_events …
  payload       TEXT NOT NULL,   -- JSON
  in_use        INTEGER DEFAULT 0,  -- 核对采用才置 1；未采用候选不进事实层
  is_private    INTEGER DEFAULT 0,
  review_note   TEXT
);

CREATE TABLE import_conflicts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id      INTEGER NOT NULL REFERENCES import_batches(id),
  candidate_id  INTEGER REFERENCES import_candidates(id),
  conflict_kind TEXT,            -- duplicate / unit_mismatch / method_mismatch
  detail        TEXT,
  resolved_on   TEXT
);

/* 读序索引（ORDER BY rowid 契约的补充索引，不改变语义） */
CREATE INDEX idx_lab_profile_metric ON lab_results(profile_key, metric_key, measured_on);
CREATE INDEX idx_flap_profile ON flap_events(profile_key, start_date);
CREATE INDEX idx_treat_profile ON treatment_events(profile_key, event_date);
