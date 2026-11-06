# PROGRESS

当前里程碑：M0 完成 → 进入 M1
更新：2026-11-07 00:40 · 夜间无人值守代理（samqin123）· 认领 Issue #62（已 claimed）

## 已完成

- 自动领取：BACKLOG ⬜ 筛选 → 复发性心包炎（罕见病 #70 · R2 T2）→ 认领 Issue #62 + /claim → claimed 标签确认
- 建仓：xyb-openharness-dsh-plugins/pericarditis-workbench（私有）→ clone → dsh-wb-cli init（220 文件）→ cordis.patch.yml 补 config.root: dshHomePath('pericarditis')
- 文档九件：SPEC / DEV-REQUIREMENTS / DIFF-MATRIX / PATIENT-FLOW / SCENARIOS / USER-RESEARCH / INTERACTION-DESIGN / CLINICAL-DATA / DEV-PLAN（全部本病种原创）
- 基线 npm run check：exit 0（SKIP 两项为原型期正常跳过，见 check 输出）

## 各闸口结论

| 闸口 | 结论 |
| --- | --- |
| M0 骨架 | 通过（自动签认待晨审追认）：staticPass=true，无底本残留 |

## 下一步

M1：三路并行调研（医学约束 10 主题 / 用户研究证据分层 / 家族结构对比）→ DIFF-MATRIX 重名率实测 → SOURCES 证据台账 → G1 自动签认

## 阻塞

无（github.com 网络曾抖动 3 次，git clone 第 4 次成功，已恢复）

---
M1 完成（2026-11-07 00:56）：EVIDENCE-LEDGER / PROTOTYPE-BASELINE / DIFF-MATRIX 实测重名率 33% / G1 自动签认。下一步 M2 原型。

---
M2 完成（01:05）：原型四件套 + primer 三件套 + demo 两套 + 整页视图；探针 27/27、10/10、13/13；check-primer-links 7/7；check exit 0；test 8/8；Inspector P0×1 清零。G2 自动签认。
M3 完成（01:05）：schema/0001_initial.sql（档案2/指标3/通用7/专属3/导入3，判读列 0）+ freeze-contract（sha256 4df741ec…）+ check-schema-words 入链 + 内存全建测试 4 条。下一步 M4 临床库。
M4 完成（01:06）：fetch-pericarditis-trials-2026（unified-trial-mcp stdio 四通道）→ 97 条合并；chictr_online FAILED 如实记录；四件套一致性 PASS；G3 自动签认。

---
M5 完成（2026-11-07）：开发版移植（tak 模式，参照 takayasu-workbench 同脚手架结构）。
- public/ 定点移植（migrate-public：五件逐字节 + index.html/app.js 白名单替换点：版本/构建占位、开发版横幅、bootstrap 数据源块）；check-ui-parity + test/ui-parity 闸门。
- src/client.js → build-client → lib/client.js（customFrame、AI 面板 25–45%、agent-draft 只填不发、断连显示态）；lib/{identity,layout,api-base,version}；smoke-activate 桩件 7 条校验通过。
- dsh/ 七件：index（root 未配置 503 可读错误）/server（注入 + 穿越拦截）/store（迁移 ledger）/readmodels（demo 形状 parity、派生值读时算、export/ai 出口剥私密、dashboard 全量带标记）/workbench/mineru（六部件未接通形态，如实标注）/demo（两套合成档案灌库）。
- 版本簿记：VERSION 唯一手写处；VERSION/package.json/lib/version.js/lib/client.js/ver-chip/页脚/CHANGELOG/tgz 同源 0.1.0。
- 检查链追加：build-version --check、build-client --check、migrate-public --check、check-public-tokens、check-wording、check-ui-parity、node --test（34 条）。
- 门槛实测：npm run check exit 0；npm test 34/34 exit 0；npm run audit 44/44 exit 0；probe-pericarditis-m2 27/27；probe-disease-primer 10/10；dev-server 冒烟（health/bootstrap/注入）通过。
- 遗留：scripts/probe-page-view.mjs 对 examples/page-view.html 的默认目标在 HEAD 即已失配（示例页无 data-open="report"，与本仓改动无关）。

M5 完成（01:35）：七步移植 tak 模式——public 七件（ui-parity 双闸）、src→build→lib、dsh/{server,store,readmodels,workbench,mineru,demo}、版本十处同源、apiBase 契约、测试 8 文件 34 条；check exit 0 / test 34/34 / audit 44/44 / 探针 27·27/10/10/13·13；V1 自动签认。

M6 完成（01:40）：pack 0.1.0 → check-install 四要素 → pnpm 装入 Desktop profile → bundles/state 登记 → 重启 → verify-desktop-load exit 0（V2 通过）；V3 服务层已验（真机库 20 表全建、演示数据 2/3/25/9）、UI 走查待人工（需会话授权，不冒充截图）。
