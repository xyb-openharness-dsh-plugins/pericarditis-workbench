/* M3 测试：schema 内存全建 + 判读列断言 + 演示数据形状 parity 前置 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

test('schema/0001_initial.sql 可在内存库全量建表', () => {
  const sql = readFileSync(join(ROOT, 'schema/0001_initial.sql'), 'utf8')
  const db = new DatabaseSync(':memory:')
  db.exec(sql)
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY rowid").all().map(r => r.name)
  for (const t of ['subjects', 'section_titles', 'metric_defs', 'lab_results', 'metric_group_titles', 'reports', 'hospitals', 'visit_questions', 'mind_notes', 'viewpoints', 'documents', 'meds', 'flap_events', 'treatment_events', 'profile_facts', 'import_batches', 'import_candidates', 'import_conflicts']) {
    assert.ok(tables.includes(t), `缺表 ${t}`)
  }
})

test('判读列断言：全表全列无 diagnosis/risk_level/分期/疗效类命名', () => {
  const sql = readFileSync(join(ROOT, 'schema/0001_initial.sql'), 'utf8')
  const banned = /diagnosis|risk_level|activity_score|staging?|line_of_treatment|efficacy|response_status|relapse_score|severity_grade|day_index|prognosis|病期|线序|疗效|危险度|预后/i
  const cols = [...sql.matchAll(/^\s*([a-z_][a-z0-9_]*)\s+(?:TEXT|INTEGER|REAL|BLOB)/gim)].map(m => m[1])
  const hits = cols.filter(c => banned.test(c))
  assert.deepEqual(hits, [], `发现判读类列: ${hits.join(',')}`)
})

test('发作中表达：flap_events.end_date 可空（显式 null，非空串）', () => {
  const sql = readFileSync(join(ROOT, 'schema/0001_initial.sql'), 'utf8')
  const db = new DatabaseSync(':memory:')
  db.exec(sql)
  db.exec("INSERT INTO subjects(profile_key,name,is_demo) VALUES ('t','T',1)")
  db.exec("INSERT INTO flap_events(profile_key,start_date,end_date) VALUES ('t','2026-01-01',NULL)")
  const row = db.prepare("SELECT end_date FROM flap_events WHERE profile_key='t' ORDER BY rowid DESC").get()
  assert.equal(row.end_date, null)
})

test('candidates 候选未核对不入事实层（in_use 缺省 0）', () => {
  const sql = readFileSync(join(ROOT, 'schema/0001_initial.sql'), 'utf8')
  const db = new DatabaseSync(':memory:')
  db.exec(sql)
  db.exec("INSERT INTO import_batches(profile_key) VALUES ('t')")
  db.exec("INSERT INTO import_candidates(batch_id,target_table,payload) VALUES (1,'lab_results','{}')")
  const row = db.prepare('SELECT in_use FROM import_candidates ORDER BY rowid DESC').get()
  assert.equal(row.in_use, 0)
})
