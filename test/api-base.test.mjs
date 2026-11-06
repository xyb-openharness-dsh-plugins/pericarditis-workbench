import { test } from 'node:test';
import { validateApiBase, buildApiUrl, normalizeApiBase, detectForm, guardStartupApiBase } from '../lib/api-base.js';

test('交界守卫：只禁交界处重复 /api，不禁宿主前缀含 /api', () => {
  if (validateApiBase('/api/pericarditis').ok !== true) throw new Error('宿主前缀 /api/pericarditis 应合法');
  if (validateApiBase('/api/pericarditis/api').ok !== false) throw new Error('交界处 /api 结尾应非法');
  if (validateApiBase('').ok !== true) throw new Error('独立启动空串应合法');
  if (buildApiUrl('/api/pericarditis', 'api/bootstrap') !== '/api/pericarditis/api/bootstrap') throw new Error('拼 URL 形态不对');
  if (buildApiUrl('', 'api/bootstrap') !== '/api/bootstrap') throw new Error('独立形态拼 URL 不对');
  if (detectForm('/api/pericarditis') !== 'hosted') throw new Error('宿主形态判定不对');
  if (detectForm('') !== 'standalone') throw new Error('独立形态判定不对');
});

test('启动守卫：失败不抛，返回可渲染横幅（禁白屏）', () => {
  const bad = guardStartupApiBase('/api/pericarditis/api');
  if (bad.ok !== false || !bad.banner || !bad.banner.title || !bad.banner.detail) throw new Error('启动守卫未给出横幅');
  const good = guardStartupApiBase('/api/pericarditis');
  if (good.ok !== true || good.banner !== null || good.base !== '/api/pericarditis') throw new Error('启动守卫误报');
});

test('规范化：尾斜杠去重、完整 URL 拒收（跨源会丢认证）', () => {
  if (normalizeApiBase('/api/pericarditis/') !== '/api/pericarditis') throw new Error('尾斜杠未去');
  if (validateApiBase('https://example.com').ok !== false) throw new Error('完整 URL 应拒收');
});
