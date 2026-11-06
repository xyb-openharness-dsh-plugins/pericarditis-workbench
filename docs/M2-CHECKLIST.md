# M2 检查点记录（原型 v0.2.0 · 逐条三态）

结论词只用「通过 / 失败 / 跳过（原因）/ 待人工」。证据=探针输出（本文件附汇总）或截图路径。

## Q 组（开工前三件事 + 通用）

| 编号 | 结论 | 证据 |
| --- | --- | --- |
| Q1 | 通过 | INTERACTION-DESIGN.md v0.1（IP1）+ 本文件签认记录 |
| Q2 | 通过 | PROTOTYPE-BASELINE.md 可搜到基准名与路径 |
| Q3 | 通过 | file:// 首屏非空（截图 v0.2-01）；两套档案就位 |
| Q4 | 通过 | probe: Q4 顶栏顺序「资料目录→AI 对话→设置→大字 Aa→?→v0.2.0」 |
| Q5 | 通过 | probe: Q5 面板 35%（25–45 内） |
| Q6 | 通过 | style.css：--font:15px、行高 1.66、页脚贴底（flex 布局）、面板可拖可收 |
| Q7 | 通过 | 颜色均引用 :root token；grep 十六进制仅 style.css/primer.css 的 token 区 |
| Q8 | 通过 | 禁词扫描见 Inspector 报告（独立评审）+ probe ERR=0 |
| Q9 | 通过 | demo-data.js 两套档案；切换页头显示档案名（probe Q10） |
| Q10 | 通过 | probe Q10：A→B→A 三处抽查不串档 |
| Q11 | 通过 | A 套：单条（体温 1 条）、未知日期（就诊医院联系方式「未录入」）、私密（mind a）、无原件（a-r2 未取得原件）；B 套多条、私密 3 项 |
| Q12 | 通过 | 状态卡/汇总/一图秀读同一 demo 数据（probe C8 用 seriesCount 对账）；页面无写死业务数字（Inspector 核对） |
| Q13 | 通过 | 首屏声明条 + 页脚「全部为合成示例」 |
| Q14 | 通过 | probe Q14：每页 aiBtn + 顶栏 AI 入口 |
| Q15/Q16/Q17/Q19 | 通过 | probe Q17（只填不发、无 postMessage）、Q19（无判定词）；独立 file:// 进演示面板（v0.2-02） |
| Q18 | 通过 | 面板开关/收起重开会话保留；splitter 键盘/拖动（app.js initSplitter） |
| Q20–Q26 | 通过 | probe Q26：390 无溢出；断点 1180/900/600（style.css）；grid minmax(0,1fr) |
| Q27 | 通过 | docs/screenshots 11 张实渲，文件名含 v0.2；折叠收/展各 1 张 |
| Q28/Q29 | 通过 | README 五段：疾病概要/关键功能/怎么用/数据与口径/开发 |
| Q30 | 跳过 | 未装机（M6 后补真机截图） |
| Q31–Q34 | 通过 | A 族面板：语义 header→main→1px splitter→aside 常挂载（index.html DOM 序）；收起是 hidden 非卸载 |
| Q35 | 通过 | probe Q35a（看板+AI 上下文）、Q35b（导出预览）排除私密 |
| Q36 | 通过 | 改为私密/共享按钮逐条；更正=新版本（医院卡「修改（=新版本，不覆盖）」） |
| Q37/Q38/Q39 | 待人工 | M3 schema 后断言 |

## IP / X 组

| 编号 | 结论 | 证据 |
| --- | --- | --- |
| IP1 | 通过 | 本文件头部版本与文档一致 |
| IP2/X1 | 通过 | probe IP2：19 条叶子路由全部渲染非空，孤儿页=0 |
| IP3 | 通过 | ROUTES 键 = SUBPAGES 键逐字一致（app.js） |
| IP4 | 通过 | 每条路径有可观察产物（列表 +1、预览层打开）+ 导航可达首页 |
| IP5 | 通过 | 可写实体均有 AI 候选通道（visits 起草按钮等）；演示态不写库 |
| IP6 | 通过 | 每页显式编辑入口 1 个；表单 ≤6 字段 |
| IP7 | 通过 | 日期用 input[type=date]；数值字段为量少且只读展示 |
| IP8 | 通过 | 无「不可恢复」文案；更正=新版本 |
| IP9/X3 | 通过 | 手工/AI/导入三通道同写事实层（演示态为同一 demo 数组） |
| IP10/IP11 | 通过 | 每个一级页头部「和 AI 讨论」预写提示词，不自动发送 |
| X2 | 通过 | probe X2：深链接 #records/metrics 直达 |
| X4 | 通过 | 探针输出计数（本文件附） |

## C / MT 组（探针实测数字）

| 编号 | 结论 | 证据 |
| --- | --- | --- |
| C1/C1a | 通过 | probe C1a：2 条 path、fill=none、d 非空 |
| C2 | 通过 | probe C2：A 档案体温单点 path=0、circle=1 |
| C3 | 通过 | probe C3：近 1 月 ESR 空窗口文案「没有所选指标」 |
| C4 | 通过 | probe C4：关闭发作带 path[d] 逐项相等且非空 |
| C5 | 通过 | probe C5：每序列 1 个末点标签（=2） |
| C6 | 通过 | 标签 x 钳制 W-60 内（app.js chartPanel） |
| C7 | 跳过 | 康复类指标本台无（非康复病种） |
| C8 | 通过 | probe C8：ESR 全部 5 条 → 近 3 月 1 条 |
| C9 | 通过 | probe Q26（390 无溢出，CDP 真模拟） |
| C10 | 通过 | prefers-reduced-motion 下 mcard transition:none（style.css） |
| C11 | 通过 | probe C11：翻转 DOM 71→71、焦点保持 |
| C12 | 通过 | probe C12：单卡 pressed 其余 false |
| MT04–MT08a | 通过 | probe MT04a/MT07（194±1、高度差 0）/C11/C12/MT08a（preserve-3d） |
| MT09 | 通过 | 图上数据点（mini-chart 末点/一图秀点）打开详情层，整卡不翻（probe-page-view A4b 走 chart 触发） |
| MT11 | 通过 | 最近报告来自同一 reports 数组（report id 同源），未知留空（effusion '—'） |
| MT12 | 通过 | 390/900/1280 三档无溢出（probe + 截图 v0.2-11） |
| MT13 | 通过 | probe Q10（切换隔离，草稿与会话清空） |
| MT14 | 待人工 | 100+ 记录压测在 M5 数据层后做 |
| MT15 | 通过 | 本文件 + README 截图版本标注 + docs/signoffs/ |

## A / P 组

| 编号 | 结论 | 证据 |
| --- | --- | --- |
| A1–A10 | 通过 | probe-page-view 13/13（A1 真滚轮、A2 Esc 一层一退、A3 返回键、A4a/b 焦点、A5 滚动恢复、A6 390 三处无溢出、A7 #page=labs 深链、A8 减少动效终态、A9 标题、A10 双入口）；--self-test 3/3 缺陷全命中 |
| P1–P9 | 通过 | probe-disease-primer 10/10（跑在本仓原型上，非 starter examples） |

## 探针汇总（2026-11-07 夜间实测）

- probe-pericarditis-m2.mjs：26/26 PASS（IP2 19/19、Q10、MT04a/07、C11/C12/MT08a、C1a/C5/C4/C2/C3/C8、Q35a/b、A1/A10/A9、A2/A5、Q14/Q17/Q19、Q26、Q4/Q5、ERR=0、X2）
- probe-disease-primer.mjs --url 本仓原型：P1–P9+E0 = 10/10 PASS
- probe-page-view.mjs --url 本仓原型：13/13 PASS；--self-test 3/3 缺陷命中（A1、A9、A10）
- check-primer-links.mjs：7/7（--http 未跑：夜间未联网，如实记 SKIP）
- npm run check：exit 0；npm test：4/4

## 独立评审

见 docs/PROTOTYPE-REVIEW.md（P0 清零记录）。
