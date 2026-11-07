/* 读模型测试：派生值读时算不落库、私密三出口过滤、ORDER BY rowid 稳定读序 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function freshDb() {
  const db = new DatabaseSync(':memory:');
  for (const f of readdirSync(join(ROOT, 'schema')).filter((f) => /^\d{4}_.*\.sql$/.test(f)).sort()) {
    db.exec(readFileSync(join(ROOT, 'schema', f), 'utf-8'));
  }
  return db;
}

async function seeded() {
  const db = freshDb();
  const demo = await import(join(ROOT, 'dsh/demo.js'));
  demo.seedDemoData(db);
  const rm = await import(join(ROOT, 'dsh/readmodels.js'));
  return { db, rm };
}

test('派生值读时算：缓解第 N 天 / 距上次发作 / 近 90 天次数（以演示 TODAY 2026-11-07 复算）', async () => {
  const { db, rm } = await seeded();
  const st = rm.readDerivedStatus(db, 'demo-a', '2026-11-07');
  /* A 档案共享发作两次，最后缓解 2026-11-02 → 缓解第 6 天；距上次发作 5 天 */
  assert.equal(st.mode, '缓解期');
  assert.equal(st.dayN, 6);
  assert.equal(st.sinceLast, 5);
  assert.equal(st.nearCount, 2); /* 两次都在近 90 天窗口内 */
  assert.equal(st.privateFlaps, 0);

  const b = rm.readDerivedStatus(db, 'demo-b', '2026-11-07');
  /* B 档案 7 次发作中 1 次私密：聚合只用共享 6 次；最近共享缓解 2026-11-02 → 第 6 天 */
  assert.equal(b.privateFlaps, 1);
  assert.equal(b.mode, '缓解期');
  assert.equal(b.dayN, 6);
  assert.equal(b.nearCount, 1); /* 近 90 天窗口自 2026-08-09 起：只有 2026-10-28（08-02 在窗外，私密 09-10 不计） */
});

test('派生值：私密发作不进聚合（共享口径）', async () => {
  const { db, rm } = await seeded();
  const shared = db.prepare("SELECT COUNT(*) c FROM flap_events WHERE profile_key='demo-b' AND is_private=0").get().c;
  const st = rm.readDerivedStatus(db, 'demo-b', '2026-11-07');
  /* 近 90 天窗口自 2026-08-09 起：共享仅 2026-10-28（08-02 在窗外，私密 09-10 不计） */
  assert.equal(shared, 6);
  assert.equal(st.nearCount, 1);
});

test('派生值：发作中形态（插入一条 end 为 NULL 的共享发作）', async () => {
  const { db, rm } = await seeded();
  db.prepare("INSERT INTO flap_events (profile_key, start_date, end_date, note, is_private, ver) VALUES ('demo-a', '2026-11-01', NULL, '测试发作中', 0, 1)").run();
  const st = rm.readDerivedStatus(db, 'demo-a', '2026-11-07');
  assert.equal(st.mode, '发作中');
  assert.equal(st.dayN, 7); /* 2026-11-01 起第 7 天 */
});

test('三出口：export/ai 出口在读模型层剥掉全部私密行；dashboard 返回全量含标记', async () => {
  const { db, rm } = await seeded();
  for (const exit of ['export', 'ai']) {
    const b = rm.bootstrapForExit(db, exit);
    for (const p of b.profiles) {
      for (const x of [...p.flaps, ...p.labs, ...p.treatments, ...p.questions, ...p.reports]) {
        assert.equal(x.private, false, `${exit} 出口存在私密行：${p.id} ${x.id}`);
      }
      for (const x of [...p.mind.feel, ...p.mind.family]) {
        assert.equal(x.private, false, `${exit} 出口存在私密心记：${p.id} ${x.d}`);
      }
    }
    const bb = b.profiles.find((p) => p.id === 'demo-b');
    assert.equal(bb.flaps.length, 6, 'B 档案 export/ai 出口只剩 6 条共享发作');
  }
  const full = rm.bootstrapForExit(db, 'dashboard');
  const fb = full.profiles.find((p) => p.id === 'demo-b');
  assert.equal(fb.flaps.length, 7, 'dashboard 全量（页面显示私密徽标）');
});

test('读序稳定：两次 readBootstrap 输出逐字节一致（ORDER BY rowid）', async () => {
  const { db, rm } = await seeded();
  const a = JSON.stringify(rm.readBootstrap(db));
  const b = JSON.stringify(rm.readBootstrap(db));
  assert.equal(a, b);
  /* 反向插入一行后，旧行序不变、新行在尾部 */
  db.prepare("INSERT INTO lab_results (profile_key, metric_key, measured_on, value, unit, method, org, is_private, ver) VALUES ('demo-a', 'crp', '2026-11-05', 5, 'mg/L', '免疫比浊', '示例市第一医院', 0, 1)").run();
  const again = rm.readBootstrap(db);
  const labs = again.profiles.find((p) => p.id === 'demo-a').labs;
  assert.equal(labs[labs.length - 1].date, '2026-11-05');
  assert.equal(labs[0].date, '2026-09-21');
});

test('section_titles / metric_defs 读出（分节标题进表，不用 subjects 平铺列）', async () => {
  const { db, rm } = await seeded();
  db.prepare("INSERT INTO section_titles (profile_key, key, title, ord) VALUES ('demo-a', 'labs', '化验与趋势', 0)").run();
  const titles = rm.readSectionTitles(db, 'demo-a');
  assert.equal(titles.length, 1);
  assert.equal(titles[0].title, '化验与趋势');
  const defs = rm.readMetricDefs(db);
  assert.deepEqual(defs.map((m) => m.title), ['CRP', 'ESR', 'WBC', 'cTnI', 'NT-proBNP', 'ALT', 'Cr', '体温']);
});
