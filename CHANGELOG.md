# CHANGELOG

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
