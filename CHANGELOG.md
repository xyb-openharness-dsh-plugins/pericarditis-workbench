## 0.1.4 — 2026-11-13

三缺口批量补齐（AC 型：只剩资料目录入口与新建患者）：

- **A 资料目录**：面板顶栏新增「配置目录」→ `uiWorkspace.pickDirectory()` → 口径硬拒（主目录本身/桌面/下载根/tmp，客户端+服务端 `checkDataDir` 双判）→ `POST /api/pericarditis/api/root` 落盘回显；新增 `schema/0002_app_setting.sql`（只增）让重开仍在，切库失败回滚原库。
- **C 新建患者**：`Workbench.listSubjects/createSubject/deleteSubject`（`is_demo=0`、`local-<时间戳>` 键、demo 不可删）；服务端 `GET/POST/DELETE /api/pericarditis/api/subjects`；档案弹窗加「＋ 新建我的档案」→ 建完自动切过去（空记录起步）。
- 校验：三闸门全绿；`npm run check` 全绿；`audit 43/44`（0 失败，1 待人工）；迁移表数断言 18→19（0002 新增 app_setting）。
- 未验证：界面加载与点击（需重开 Desktop 后人工走查）。

## 0.1.3（2026-11-11，AI 对话面板激活修复）

- 会话判定改用宿主归属 `ownedSession()`（`ownsSession(currentSession())`），不再用 `Boolean(conversation)`（customFrame 下没会话也会传隐藏容器 → 判断恒为真 → 点了没反应）。
- 创建路径改 `service.newSession(workspaceId)`，工作区取 `service.defaultWorkspace?.()?.workspaceId`；无可用工作区时由宿主提示选目录；不再用 `ensureSession({})`。
- 取消目录选择不留空会话并提示可重试；创建失败在工作台内显示原因；订阅会话变化触发重渲染；草稿仍只填不发。
- 版本与生成物同步 0.1.3；新增 `scripts/check-agent-pane-contract.mjs` 入 check 链；原型版本字面量随包重冻结（渲染内容未变）。
- **界面加载与真机点击待人工**（需退出重开 DSH Desktop 后新建会话走查）。

# CHANGELOG

## [0.1.2] - 2026-11-07（晨审反馈第二轮）

### 修复（用户实测三条）
1. 指标卡翻转双通道：aria-pressed + flipped class 同时驱动 CSS（宿主环境属性选择器失效时兜底）；探针 FLIP2 断言终态 matrix3d。
2. 临床按 35 号四段链路重做：**建档**（已确认入库字段网格 + 快照可对照项如实说明 + 偏好 chips）→ **检索**（按条件排，无分数）→ **匹配**（分数方块 + 「n / m 项对得上 · k 项待确认」固定行 + 逐条证据链 ✕/? 在前 + 候选池口径 + 入排原文缺失声明 + 官方登记页出口 + 拒收零副作用）→ **收藏与跟踪**（只存本机，无假进度条）。匹配纯函数抽 trial-match.js（E7 红线：可对照 <2 不给分；靶点不进分母——签名不收靶点）。
3. 六个可写页头部统一「＋ 添加记录」主按钮；补化验/报告/当下感受/家人支持四类录入表单（≤6 字段、三态保存）。

### 升版
- 0.1.1 → 0.1.2。


## [0.1.1] - 2026-11-07（晨审反馈修复）

### 修复（用户实测四条）
1. 设置改乳腺癌式弹层三 tab（工作区/文档解析 MinerU/临床数据库），顶栏「设置」直接打开（原导航页形态打不开的问题一并消除）。
2. 恢复「临床」一级菜单：数据库状态（来源通道终态如实，chictr_online FAILED 不冒充零结果）+ 登记浏览（快照 97 条离线检索；无匹配打分、登记状态未核实）。
3. 看板补「关键指标（最近值）」卡组。
4. 指标体系按病情规范扩充至 8 项 5 组：炎症（CRP/ESR）、血象（WBC）、心肌标志物（cTnI/NT-proBNP）、用药安全监测（ALT/Cr）、体征（体温）；阈值解读归医生【待核】。

### 重构
- dsh/demo.js 不再手工镜像演示数据：直接读 prototypes/v0.2/demo-data.js（装包回退 public 同字节副本）灌库——演示唯一源落到实处。
- 指标元数据（metricDefs/metricGroups）下沉进 demo-data.js，前端与服务端同源。

### 升版
- 0.1.0 → 0.1.1（改包必升版）。

# 变更记录

只增不删；每条写清"改了什么 + 为什么 + 用户可见结果"。版本号与 VERSION、package.json 三处必须一致。

## 0.1.0 — 2026-11-06

- 由社区脚手架 dsh-wb-cli@1.10.0-rc.18 (ead3420) 初始化，仅有注册骨架与健康接口，无业务功能。

## 0.1.0 — 2026-11-07（M5 开发版移植）

- public/ 定点移植（scripts/migrate-public.mjs）：prototypes/v0.2 七件复制，index.html/app.js 仅白名单替换点（版本/构建占位符 + 开发版横幅 + bootstrap 数据源块）；ui-parity 闸门与测试逐字节断言。
- 客户端外壳 src/client.js → scripts/build-client.mjs → lib/client.js：customFrame 自绘外壳、AI 面板 25%–45% 可拖、agent-draft 只填不发契约、连接失败显示可读状态不白屏。
- 服务端 dsh/：index（宿主接线 + root 未配置 503）、server（API + 静态 + 路径穿越拦截 + 服务时注入）、store（node:sqlite 迁移 ledger）、readmodels（demo 形状还原 + 派生值读时算 + 三出口私密过滤）、workbench（领域服务 + 试验快照只读检索）、mineru（六部件未接通形态，如实标注）、demo（两套合成档案灌库）。
- 版本簿记：VERSION 唯一手写处，lib/version.js 派生；检查链追加 build-version/build-client/migrate-public --check、check-public-tokens、check-wording、check-ui-parity、node --test。
- 测试 34 条：schema/readmodels/api-base/store/demo-parity/host-apply/ui-parity/version-inject。
