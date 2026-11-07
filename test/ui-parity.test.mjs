/* ui-parity：public/ 与 prototypes/v0.2 的移植一致性断言
 * 口径（scripts/migrate-public.mjs 定点移植）：
 *   - style.css / demo-data.js / primer-data.js / primer.js / primer.css：与原型**逐字节相同**；
 *   - index.html / app.js：等于「原型 + 白名单替换点」（版本/构建占位符、开发版横幅、bootstrap 数据源块），
 *     除白名单外其余字符与原型一致——业务文件不改字符。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILES, expected, OUT } from '../scripts/migrate-public.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BYTE_COPY = ['style.css', 'demo-data.js', 'primer-data.js', 'primer.js', 'primer.css', 'trial-match.js'];

test('ui-parity: 六件纯复制文件与原型逐字节相同', () => {
  for (const f of BYTE_COPY) {
    const proto = readFileSync(join(ROOT, 'prototypes/v0.2', f));
    const pub = readFileSync(join(OUT, f));
    assert.ok(proto.equals(pub), `public/${f} 与原型逐字节不一致`);
  }
});

test('ui-parity: index.html / app.js 等于「原型 + 白名单替换点」产物', () => {
  for (const f of FILES) {
    const pub = readFileSync(join(OUT, f), 'utf8');
    assert.equal(pub, expected(f), `public/${f} 与定点移植产物不一致（白名单之外被改动）`);
  }
});

test('ui-parity: app.js 只追加不修改（原型主体是产物的前缀）', () => {
  const proto = readFileSync(join(ROOT, 'prototypes/v0.2/app.js'), 'utf8');
  const pub = readFileSync(join(OUT, 'app.js'), 'utf8');
  assert.ok(pub.startsWith(proto.replace(
    "var APP_INFO = { version: 'v0.2.0', build: '2026-11-07' }",
    "var APP_INFO = { version: '__VERSION_DISPLAY__', build: '__BUILD_DATE__' }")), 'app.js 主体不是原型前缀');
  assert.ok(pub.length > proto.length, 'app.js 追加块缺失');
});

test('ui-parity: index.html 替换点只允许 4 处（标题/横幅/ver-chip/页脚）', () => {
  const proto = readFileSync(join(ROOT, 'prototypes/v0.2/index.html'), 'utf8');
  const pub = readFileSync(join(OUT, 'index.html'), 'utf8');
  const spots = [
    ['<title>小包宝 PeriPal · 复发性心包炎工作台（交互原型 v0.2）</title>', '<title>小包宝 PeriPal · 复发性心包炎工作台</title>'],
    ['交互原型 v0.2 · 全部为模拟资料 · 合成示例', '开发版 · 本机数据 · 不上传'],
    ['<span class="ver-chip" id="ver-chip">v0.2.0</span>', '<span class="ver-chip" id="ver-chip">__VERSION_DISPLAY__</span>'],
    ['<b id="app-version">v0.2.0</b><em id="app-build">2026-11-07</em>', '<b id="app-version">__VERSION_DISPLAY__</b><em id="app-build">__BUILD_DATE__</em>'],
  ];
  for (const [oldSeg, newSeg] of spots) {
    assert.ok(proto.includes(oldSeg), `原型缺基准段：${oldSeg.slice(0, 40)}`);
    assert.ok(pub.includes(newSeg), `public/index.html 缺替换段：${newSeg.slice(0, 40)}`);
  }
  /* 除替换点外逐行一致：把替换段换回原型写法后应与原型完全相同 */
  let reverted = pub
    .replace('<title>小包宝 PeriPal · 复发性心包炎工作台</title>\n<meta name="robots" content="noindex,nofollow">', '<title>小包宝 PeriPal · 复发性心包炎工作台（交互原型 v0.2）</title>')
    .replace('<span>开发版 · 本机数据 · 不上传 · AI 面板由宿主提供 · 业务数据仍为演示内容直到导入真实资料</span>\n    <span>版本 <b>__VERSION_DISPLAY__</b></span>', '<span>交互原型 v0.2 · 全部为模拟资料 · 合成示例</span>\n    <span>仅本页演示 · 未接入 DSH/AI</span>')
    .replace('<span class="ver-chip" id="ver-chip">__VERSION_DISPLAY__</span>', '<span class="ver-chip" id="ver-chip">v0.2.0</span>')
    .replace('<b id="app-version">__VERSION_DISPLAY__</b><em id="app-build">__BUILD_DATE__</em>', '<b id="app-version">v0.2.0</b><em id="app-build">2026-11-07</em>');
  assert.equal(reverted, proto, 'index.html 白名单之外存在字符改动');
});
