import { test } from 'node:test';
import { openStore, closeStore, migrate, tableNames, migrationFiles } from '../dsh/store.js';

test('迁移：内存全建 18 表，幂等重跑不再执行', () => {
  const db = openStore(':memory:');
  try {
    const tables = tableNames(db);
    if (tables.length !== 18) throw new Error(`表数 ${tables.length} ≠ 18`);
    const again = migrate(db);
    if (again.ran !== 0) throw new Error(`迁移不幂等：重跑 ran=${again.ran}`);
    const ledger = db.prepare('SELECT migration, sha256 FROM schema_migrations ORDER BY rowid').all();
    if (ledger.length !== migrationFiles().length) throw new Error('ledger 行数与迁移文件数不符');
    if (ledger.some((r) => !/^[0-9a-f]{64}$/.test(r.sha256))) throw new Error('ledger sha256 缺失');
  } finally { closeStore(db); }
});

test('判读列断言：全表全列 0 命中（无判读列）', () => {
  const db = openStore(':memory:');
  try {
    const bad = /diagnosis|risk_level|activity_score|stage|severity_level|flare_flag|remission_flag|\bline\b|response\b/i;
    for (const t of tableNames(db)) {
      for (const c of db.prepare(`PRAGMA table_info(${t})`).all()) {
        if (bad.test(c.name)) throw new Error(`${t}.${c.name} 是判读列`);
      }
    }
  } finally { closeStore(db); }
});

test('生产形态：root 下开库自动建目录并播种（config.root=dshHomePath 落点）', async () => {
  const { mkdtempSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const root = mkdtempSync(join(tmpdir(), 'peri-store-'));
  const { Workbench } = await import('../dsh/workbench.js');
  const wb = new Workbench({ root });
  wb.open();
  try {
    if (!wb.stats.hasDemo) throw new Error('root 开库未播种演示数据');
    const st = wb.status();
    if (st.root !== root) throw new Error('status 未回显 root');
    if (!st.capabilities.includes('bootstrap')) throw new Error('capabilities 缺 bootstrap');
  } finally { wb.close(); }
});
