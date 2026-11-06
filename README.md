# 小包宝 PeriPal · 复发性心包炎工作台（交互原型 v0.2）

本机优先的复发性心包炎发作—缓解记录、CRP/ESR 化验趋势、按次治疗登记、复诊准备工作台（合成演示，未接入宿主）。认领依据：[Issue #62](https://github.com/xyb-openharness-dsh-plugins/.github/issues/62)（罕见病 #70 · R2 · T2）。

## 疾病概要

复发性心包炎指心包炎症状在无症状间隔后再次出现的慢性病程，属《86 个罕见病病种诊疗指南（2025 年版）》目录第 70 条。患者日常最关心的不是「分型分期」，而是**发作与缓解的规律、炎症化验的趋势、按次治疗的记录、复诊时能带着清单去**。本台按这个优先级组织，全部内容只做事实整理：仅回顾，不解读；不同方法/机构不合并；解读归医生。顶栏「?」可随时打开整页疾病概要（定义 → 医学资料规范和指南情况 → 治疗全景 → 发展趋势，每段带来源行）。

**如实声明：0 患者访谈、0 临床审核**（场景句为改写描述，标注待验证；阈值一律【待核】）。

## 关键功能（截图墙）

### 1. 看板：状态卡 + 医生行动计划原话
![看板](docs/screenshots/v0.2-01-dashboard-A.png)
首屏状态卡直接回答「现在缓解第几天、距上次发作多久、近 90 天发作几次」——数字由你记录的发作事件算出，不是医生判断。医生行动计划只照录原话。

### 2. 化验一图秀：按方法分组可比线
![一图秀](docs/screenshots/v0.2-03-onechart-B.png)
每条线按该指标全期范围归一化，两条线之间「不可比」；单点只画点不连线；不同方法/机构不合并画线；关闭发作带不改数据线。

### 3. 发作—缓解时间线区间带
![时间线](docs/screenshots/v0.2-04-timeline-B.png)
色带=一次发作区间，圆点=缓解开始，菱形=治疗或复诊；非肿瘤语义，无 D+N 天数。

### 4. 指标卡 3D 翻转
![指标卡翻转](docs/screenshots/v0.2-05-metric-flipped.png)
正面：最近值/差值/次数/来源；背面：走势缩略图。定高 194px，翻转不改变栅格。

### 5. 疾病概要（整页，顶栏「?」或首页入口）
![疾病概要](docs/screenshots/v0.2-08-disease-primer.png)
四段固定结构，每段带来源行（原件/官方入口/二次来源/未取得，分开标注），趋势段只写已发生的事实。

### 6. 折叠收/展态（一图秀指标选择）
![折叠收起](docs/screenshots/v0.2-06-fold-collapsed.png)
![折叠展开](docs/screenshots/v0.2-07-fold-expanded.png)
原生 details 折叠；打印与键盘语义保留。

### 7. 整页视图（导出预览，私密过滤）
![整页视图](docs/screenshots/v0.2-09-page-view.png)
返回/关闭双入口、Esc 一层一退、history 为导航栈唯一真源；导出预览与看板摘要、AI 上下文共用同一私密过滤函数。

### 8. 其余实渲截图
- [AI 演示面板](docs/screenshots/v0.2-02-agent-pane.png)（右侧 35% 可拖 25–45%，未接通明说）
- [设置 · 文档解析 MinerU](docs/screenshots/v0.2-10-settings-mineru.png)（未勾选不上传；本仓未接入如实标注）
- [窄宽 390](docs/screenshots/v0.2-11-narrow-390.png)（无横向溢出）

## 怎么用

1. 浏览器直接打开 `prototypes/v0.2/index.html`（file:// 可用，全部为合成示例）。
2. 侧栏「示例档案 A/B」切换两套演示档案：A 刚确诊记录少、B 多年随访发作多次；切换后整页联动，会话与草稿按档案隔离。
3. 顶栏：资料目录 → AI 对话（演示） → 设置 → 大字 → **?** → 版本。
4. 「和 AI 讨论」只把草稿填入输入框，不自动发送；发送键在演示态禁用。

## 数据与口径

- 演示数据唯一源：`prototypes/v0.2/demo-data.js`（两套合成档案；页面不写死业务数字）。
- 口径：仅回顾，不解读；不同方法/机构不合并；解读归医生。私密记录不进看板摘要、导出与 AI 上下文。
- 阈值、疗程、可及性一律【待核】；本台无试验线前端（裁剪理由见 docs/DEV-PLAN.md §四），临床快照状态在设置页如实显示。

## 开发

```bash
npm run check   # 静态检查链（含探针覆盖断言）
npm test        # 单测
npm run audit   # 家族一致性检查
node scripts/probe-pericarditis-m2.mjs        # M2 真实浏览器探针（IP/C/MT/Q/A 组）
node scripts/probe-disease-primer.mjs --url http://127.0.0.1:8127/prototypes/v0.2/index.html
node scripts/probe-page-view.mjs --url http://127.0.0.1:8127/prototypes/v0.2/index.html
```
版本 v0.2.0（原型）；文档九件见 docs/；各闸口签认见 docs/signoffs/。
