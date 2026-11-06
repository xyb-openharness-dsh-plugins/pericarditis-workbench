# 开发强约束（DEV-REQUIREMENTS）· 2026-11-07

每条硬约束都可被命令或测试验证；验证方式写在条目内。本文档与 check 链同步维护：约束失效时先改验证，再改实现。

## A. 数据层

| # | 约束 | 验证 |
| --- | --- | --- |
| A1 | schema/0001_initial.sql 冻结：只增不改，迁移只新增 0002+ | `node scripts/check-schema-words.mjs .`（sha256 与 freeze-contract.md 一致）；`node --test test/schema.test.mjs` |
| A2 | 全库无判读列（诊断结论/危险度/活动度评分/复发标记类列一律不设） | `test/store-migrate.test.mjs`「判读列断言：全表全列 0 命中」 |
| A3 | 迁移幂等 + ledger 记录 sha256 | `test/store-migrate.test.mjs`「迁移：内存全建 18 表，幂等重跑不再执行」 |
| A4 | 业务数据目录 `config.root = !!js dshHomePath('pericarditis')`，缺 root 时健康接口返回 503 可读错误，不裸 throw 白屏 | `dsh/index.js` apply()（未配置分支）；`test/host-apply.test.mjs` |
| A5 | 化验可比组 = method + org，读模型不做跨组合并 | `dsh/readmodels.js` labs 逐行原样输出（`test/demo-parity.test.mjs` parity 断言） |

## B. 私密与三出口

| # | 约束 | 验证 |
| --- | --- | --- |
| B1 | `is_private=1` 的行随全量返回、带标记（页面显示「私密」徽标） | `test/demo-parity.test.mjs`「私密行随全量返回」 |
| B2 | 导出与 AI 上下文出口在读模型层剥掉全部私密行 | `test/readmodels.test.mjs`「三出口：export/ai 出口在读模型层剥掉全部私密行」 |
| B3 | 看板摘要三个派生数字（缓解第 N 天/距上次发作/近 90 天次数）只统计共享行，私密条数单独返回 | `test/readmodels.test.mjs`「派生值：私密发作不进聚合」 |
| B4 | 派生值读时算、不落库（flap_events 只存事实区间） | 同上 + schema A2（无派生列） |

## C. 界面与宿主

| # | 约束 | 验证 |
| --- | --- | --- |
| C1 | public/ 与 prototypes/v0.2 定点移植一致：五件逐字节相同，index.html/app.js 仅白名单替换点 | `node scripts/check-ui-parity.mjs` + `test/ui-parity.test.mjs` |
| C2 | 页面不写死版本/构建日期，走 `__VERSION_DISPLAY__`/`__BUILD_DATE__` 占位由服务端注入 | `node scripts/check-version-literal.mjs`；`test/version-inject.test.mjs` |
| C3 | 注入面只允许字符串字面量形态 `var apiBase = "__API_BASE__"`，禁 `window.__*` 令牌 | `node scripts/check-public-tokens.mjs` |
| C4 | 宿主 register() 描述符逐条合法（customFrame/businessSide/businessWidth 0.25–0.7/repository） | `node scripts/check-host-contract.mjs` + `node scripts/smoke-activate.mjs` |
| C5 | 静态引用真实存在，杜绝「HTML 当 JS」白屏 | `node scripts/check-static-refs.mjs` |
| C6 | apiBase 交界守卫：只禁交界处重复 /api；启动校验失败渲染横幅不抛 | `test/api-base.test.mjs` |

## D. 文案与合规

| # | 约束 | 验证 |
| --- | --- | --- |
| D1 | 患者可见面（prototypes/lib/public）0 命中结论式禁词（不诊断、不分级、不建议用药） | `node scripts/check-wording.mjs .` |
| D2 | 无底本病种/品牌残留 | `node scripts/check-derivative-leftovers.mjs .` |
| D3 | 疾病概要四段结构齐全、来源行标注原件/二次来源 | `node scripts/check-primer-links.mjs`；audit `primer/README` |
| D4 | 演示数据为合成示例，不冒充真实病历 | `dsh/demo.js` 全部档案 is_demo=1，名称带「示例」 |

## E. 发布卫生

| # | 约束 | 验证 |
| --- | --- | --- |
| E1 | 版本单一手写处 VERSION，其余派生 | `node scripts/build-version.mjs --check`；`test/version-inject.test.mjs` |
| E2 | `lib/client.js` 与 `src/client.js` 构建同步 | `node scripts/build-client.mjs --check` |
| E3 | `.secrets/` 不进仓库 | `.gitignore` 含 `.secrets/`（audit `mineru/忽略密钥`） |
| E4 | public/、schema/、research/ 随 npm 包发出 | `package.json` files + `test/pack-contents.test.mjs` |
