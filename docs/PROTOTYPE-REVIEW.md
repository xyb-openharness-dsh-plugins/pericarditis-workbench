# HTML交互原型确认记录

状态：夜间无人值守自动评审 + 自动签认（待晨审追认）。未取得用户确认。

- HTML实际路径、版本与SHA-256：prototypes/v0.2/（index.html 15fef9c3…、app.js f52d1ee1…、demo-data.js/primer-data.js/primer.js/primer.css/style.css 同目录），版本 v0.2.0
- 当前SPEC/场景/数据模型版本：SPEC v0.1、SCENARIOS S1–S7、schema/0001_initial.sql（冻结 sha256 4df741ec…）
- 预览环境/容器尺寸/日期；无法预览及限制：headless Chrome（puppeteer-core + 本机 Chrome），1280×860 / 900 / 600 / 390(CDP)；2026-11-07。限制：无真实宿主、无真实资料目录
- 模拟数据/MockAdapter与真实功能界限：demo-data.js 两套合成档案为唯一源；无任何真实持久化（录入为内存演示，刷新重置）；AI 未接通（只填草稿）；MinerU 未接入
- 核心任务、二级页、弹窗/状态、回顾/导出覆盖与未覆盖项：19 条叶子路由全部渲染非空（probe IP2 19/19，孤儿页 0）；整页视图（导出预览/报告详情/化验记录/数据点详情）覆盖 A1–A10；未覆盖项：真实导入、MinerU 解析、宿主会话（M5/M6）
- 版本号显示与一致性（P1）：顶栏 ver-chip / 页脚 / APP_INFO 三处同源（paintVersion）；VERSION 0.1.0 为包版本（M5 对齐十处同源）
- 一图秀核对：docs/M2-CHECKLIST.md C1–C12 逐条（C7 非康复病种跳过；其余探针实测）
- 用户反馈及修订：夜间无用户输入；独立 Inspector 评审 1 轮，P0（私密聚合泄漏）已清零，见下表与 PROTOTYPE-REVIEW 历史（git log）

## 独立 Inspector 评审（2026-11-07 03:00）

一句话总评：整体红线执行到位，但存在一个真实隐私出口缺口——私密发作记录进入状态卡/导出/AI 的聚合数字。

| # | 项 | 评审结论 | 处置 |
| --- | --- | --- | --- |
| 1 | 禁词扫描 | 通过（仅 2 处否定句） | 保留 |
| 2 | 医生任务冒充 | 通过 | — |
| 3 | 隐私三出口 | **P0 失败**：derivedStatus 未过滤 | **已修**：sharedOnly 基础上计算 + 「未计入」标注 + 探针 Q35c（27/27 复测） |
| 4 | 数据唯一源 | P1/P2：窗口常量散布、缺零条/未知日期用例 | **已修**：NEAR_DAYS 唯一源；A questions 零条态、docs date:null |
| 5 | AI 契约 | 通过 | — |
| 6 | 空态 | P2：一图秀空态无按钮 | **已修** |
| 7 | IP6/IP8 | 通过（hospitals 按行编辑口径待人工） | 待晨审 |
| 8–10 | inputmode/口径/primer | 通过 | — |

P0 清零后全量复测：27/27 + 10/10 + 13/13 + 7/7 + check exit 0 + test 8/8（证据：docs/M2-CHECKLIST.md、探针输出汇总）。

## 走查表

| 模块/功能ID | 对应HTML/行为 | 实际走查证据 | 用户明确确认依据/人/日期 | 未确认项 | 允许实施的范围 |
| --- | --- | --- | --- | --- | --- |
| 看板状态卡/行动计划 | app.js pageDash | probe Q10/Q35a/c + 截图 v0.2-01 | 无（夜间自动） | 晨审追认 | M5 移植 |
| 化验一图秀 | app.js oneChart | probe C1a–C8 + 截图 v0.2-03 | 无 | 晨审追认 | M5 移植 |
| 时间线区间带 | app.js laneSVG | 截图 v0.2-04 | 无 | 晨审追认 | M5 移植 |
| 指标卡 3D | app.js recordsMetrics | probe MT04a/07/C11/C12/MT08a + v0.2-05 | 无 | 晨审追认 | M5 移植 |
| 疾病概要 DP | primer 三件套 | probe-disease-primer 10/10 + v0.2-08 | 无 | 晨审追认 | M5 移植 |
| 整页视图 | app.js pv 契约 | probe-page-view 13/13 + v0.2-09 | 无 | 晨审追认 | M5 移植 |
| 设置三 tab | app.js pageSettings | 截图 v0.2-10（MinerU/临床库如实标注） | 无 | 晨审追认 | M5 移植 |

只确认对应版本/模块，新增/重大交互变更重新展示；确认不代表服务接通、数据库冻结或业务验收通过。实际数据模型/API复核后实现，参见docs/14-HTML-AND-DATA-CONTRACT.md。
