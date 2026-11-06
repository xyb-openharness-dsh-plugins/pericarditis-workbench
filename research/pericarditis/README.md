# research/pericarditis · 临床库四件套（M4 · 2026-11-07 夜间）

## 是什么

- `manifest.json`：采集口径、来源终态、计数与 sha256（唯一入口账本）。
- `trials-2026.jsonl`：97 条合并后记录（同一登记号合并，其余并排保留来源）。
- `pericarditis_trials_2026.sqlite`：trials 97 行 + source_statuses 24 行。
- 本 README：口径与终态如实记录。

## 采集口径

- 唯一入口：unified-trial-mcp（MCP stdio），未自拼 URL。4 组关键词（复发性心包炎 / recurrent pericarditis / pericarditis / 心包炎），每源上限 200。
- 快照日期：manifest.snapshotDate。登记状态一律「登记状态，未核实」；快照会过期。

## 来源通道终态（如实记录，FAILED ≠ 查过零结果）

| 通道 | 终态 |
| --- | --- |
| chinadrugtrials（药监局线上） | SUCCESS/NO_RESULTS 视关键词（「心包炎」4 条） |
| xyb_chinadrugtrials_archive | NO_RESULTS |
| chictr_online | **FAILED**（全部关键词）——未查过，不得当作零结果；晨审重跑 |
| chictr_pancreatic_archive | NEEDS_SETUP（离线语料仅胰腺癌覆盖，本台无覆盖，如实记） |
| ctv（ClinicalTrials.gov 本地索引） | SUCCESS（复发性心包炎 32 条宽检索） |
| ictrp（WHO ICTRP） | SUCCESS/FAILED 视关键词（83 条） |

合并去重后 **97 条**：bySource chinadrugtrials 4 / ctv 10 / ictrp 83。

## 一致性断言

- manifest.recordCount = jsonl 行数 = sqlite trials 行数 = 97（check-trial-snapshot PASS：records=97/97 sourceStatuses=24）。
- 前端试验线已按 DEV-PLAN §四裁剪：本四件套是数据底座，仅「设置 · 临床数据库」tab 显示状态；界面不出现匹配指数/入排判读。
