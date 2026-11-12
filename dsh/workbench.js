/**
 * 领域服务：把"数据根 → 开库 → 播种 → 读模型"收在一个可测对象里。
 *
 * 为什么单独一层：`dsh/index.js` 要 import Schemastery（宿主提供的 peer，本仓装不上），
 * 那一行会让整个入口不可单测。把可测逻辑放这里，入口只留 wiring。
 */
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const HERE = dirname(fileURLToPath(import.meta.url));
import { openStore, closeStore, migrate } from './store.js';
import { seedDemoData, hasDemoData } from './demo.js';
import { readBootstrap } from './readmodels.js';
import { DB_FILE, HOME_DIR } from '../lib/identity.js';
import { version, displayVersion, build as buildDate } from '../lib/version.js';

export class Workbench {
  /**
   * @param {object} options
   * @param {string} options.root      用户资料目录（必须由用户明确指定；调用方负责校验）
   * @param {boolean} [options.seedDemo] 首次打开是否写入演示数据（默认 true，仅空库生效）
   */
  constructor({ root, seedDemo = true } = {}) {
    if (typeof root !== 'string' || root.trim() === '') throw new Error('Workbench 需要 root（用户资料目录）');
    this.root = root;
    this.dbFile = join(root, DB_FILE);
    this.db = null;
    this.seedDemo = seedDemo;
  }

  /** 打开（幂等）。迁移与播种都在这里完成。 */
  open() {
    if (this.db) return this;
    this.db = openStore(this.dbFile);
    this.migrations = migrate(this.db);
    /* 用户上次在面板里选过的资料目录优先于 cordis 默认值（目录还在才生效）。 */
    if (!this._rootApplied) {
      this._rootApplied = true;
      try {
        const row = this.db.prepare("SELECT value FROM app_setting WHERE key='data_root'").get();
        if (row?.value && row.value !== this.root && existsSync(row.value)) {
          closeStore(this.db);
          this.root = row.value;
          this.dbFile = join(this.root, DB_FILE);
          this.db = openStore(this.dbFile);
          this.migrations = migrate(this.db);
        }
      } catch { /* 旧库没有 app_setting 也不该拦住打开 */ }
    }
    this.seeded = this.seedDemo ? seedDemoData(this.db) : { skipped: true, profiles: 0 };
    return this;
  }

  get dataRoot() { return this.root }

  /** 切换资料目录：先开新库成功再替换，失败回滚到原库。 */
  setDataRoot(nextRoot) {
    this.open();
    const dir = String(nextRoot || '').trim();
    if (!dir || dir === this.root) return this.root;
    const prevRoot = this.root;
    const prevFile = this.dbFile;
    closeStore(this.db);
    this.db = null;
    try {
      this.dbFile = join(dir, DB_FILE);
      this.db = openStore(this.dbFile);
      this.migrations = migrate(this.db);
      this.root = dir;
      this.db.prepare("INSERT INTO app_setting(key,value,updated_at) VALUES('data_root',?,datetime('now')) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").run(dir);
      this.seeded = this.seedDemo ? seedDemoData(this.db) : { skipped: true, profiles: 0 };
      return this.root;
    } catch (error) {
      this.root = prevRoot; this.dbFile = prevFile;
      try { this.db = openStore(this.dbFile); } catch { this.db = null; }
      throw error;
    }
  }

  listSubjects() {
    this.open();
    return this.db.prepare('SELECT profile_key, name, meta, is_demo, created_on FROM subjects ORDER BY rowid DESC').all()
      .map((r) => ({ profileKey: r.profile_key, name: r.name, meta: r.meta, isDemo: !!r.is_demo, createdOn: r.created_on }));
  }

  /** 新建档案：is_demo=0；profile_key 用 local-<时间戳>，不与 demo 撞键。 */
  createSubject({ name, meta } = {}) {
    this.open();
    const clean = String(name || '').trim();
    if (!clean) throw new Error('请填写档案名（可以是昵称）');
    if (clean.length > 40) throw new Error('档案名太长（≤40 字）');
    const key = 'local-' + Date.now().toString(36);
    this.db.prepare('INSERT INTO subjects (profile_key, name, meta, is_demo) VALUES (?,?,?,0)').run(key, clean, String(meta || '').trim() || null);
    return { profileKey: key, name: clean, records: this.listSubjects() };
  }

  /** demo 档案（is_demo=1）不可删。 */
  deleteSubject(profileKey) {
    this.open();
    const key = String(profileKey || '');
    const info = this.db.prepare('DELETE FROM subjects WHERE profile_key = ? AND is_demo = 0').run(key);
    const changed = Number(info?.changes ?? 0);
    return { deleted: changed > 0 ? key : null, reason: changed > 0 ? undefined : '不存在或演示档案不可删除', records: this.listSubjects() };
  }

  close() {
    if (this.db) { closeStore(this.db); this.db = null; }
  }

  get stats() {
    if (!this.db) return null;
    const subjects = this.db.prepare('SELECT COUNT(*) c FROM subjects').get().c;
    const labs = this.db.prepare('SELECT COUNT(*) c FROM lab_results').get().c;
    const flaps = this.db.prepare('SELECT COUNT(*) c FROM flap_events').get().c;
    const metrics = this.db.prepare('SELECT COUNT(*) c FROM metric_defs').get().c;
    return { profiles: subjects, metrics, labs, flaps, hasDemo: subjects > 0 };
  }

  bootstrap() {
    this.open();
    return readBootstrap(this.db);
  }

  profile(profileId) {
    this.open();
    return readBootstrap(this.db, profileId);
  }

  /** 供宿主 /health 用：只报事实，不报"是否已验证" */
  status() {
    return {
      version, displayVersion, buildDate,
      homeDir: HOME_DIR,
      dbFile: DB_FILE,
      root: this.root,
      capabilities: ['bootstrap', 'profile', 'health'],
      stats: this.stats,
      seeded: this.seeded ?? null,
      migrations: this.migrations ?? null,
    };
  }

  /** 演示数据重载（幂等；force 才清空重播，仅供开发用） */
  reloadDemo(force = false) {
    this.open();
    return seedDemoData(this.db, { force });
  }

  get hasData() {
    this.open();
    return hasDemoData(this.db);
  }

  /**
   * 临床试验检索（M4 research 快照，登记状态未核实；无匹配指数、无判读列）。
   * keyword 大小写不敏感 LIKE；未取得快照时返回 honest 空态（不写零结果）。
   */
  trialMatch(keyword) {
    /* 双形态查找：包内（宿主装机，research 随包发出）→ root 旁路（dev 布局）；都没有如实返回不可用 */
    const candidates = [
      join(HERE, '..', 'research', 'pericarditis', 'pericarditis_trials_2026.sqlite'),
      join(this.root, '..', 'research', 'pericarditis', 'pericarditis_trials_2026.sqlite'),
    ];
    let dbPath = null;
    for (const c of candidates) if (existsSync(c)) { dbPath = c; break; }
    if (!dbPath) {
      return { available: false, reason: 'research/pericarditis 快照不可用（M4 快照未采集或未随包发出）', records: [] };
    }
    const rdb = new DatabaseSync(dbPath, { readOnly: true });
    const kw = String(keyword || '').trim();
    const rows = kw
      ? rdb.prepare('SELECT * FROM trials WHERE title LIKE ? ORDER BY rowid LIMIT 50').all('%' + kw + '%')
      : rdb.prepare('SELECT * FROM trials ORDER BY rowid LIMIT 50').all();
    const out = rows.map((r) => ({
      recordId: r.record_id, title: r.title, studyType: r.study_type,
      sponsors: r.sponsors ? JSON.parse(r.sponsors) : null,
      registryNumbers: r.registry_numbers ? JSON.parse(r.registry_numbers) : null,
      sourceUrl: r.source_url, statusNote: r.status_note, snapshotDate: r.snapshot_date,
    }));
    rdb.close();
    return { available: true, snapshotDate: out[0]?.snapshotDate ?? null, total: out.length, records: out };
  }
}

export { readBootstrap, seedDemoData, openStore, closeStore };
