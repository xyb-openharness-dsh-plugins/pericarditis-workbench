# M7 发布草稿（夜间冻结，待晨审追认后执行 tag + GitHub release）

## 冻结内容
- tag: v0.1.0（包版本，见 VERSION/package.json）
- 附件: @xyb-community/pericarditis-workbench-0.1.0.tgz + sha256（npm pack --pack-destination release 产物）
- 禁止夜间执行: gh release create、git push、tag push（无人值守对外动作红线）

## Release 说明（草稿）
### v0.1.0（2026-11-07）
复发性心包炎工作台首个社区包：发作—缓解事件带、CRP/ESR 可比趋势（方法+机构分组）、按次治疗登记、复诊问题清单、多医院就医信息、整页疾病概要（36 号 DP）、私密三出口过滤、两套合成演示档案。

已知如实声明：
- 0 患者访谈、0 临床审核（阈值一律【待核】）
- chictr_online 通道采集时 FAILED（未查过，非零结果）；chictr_pancreatic_archive 无覆盖（NEEDS_SETUP）
- MinerU 未接入（界面明示「勾选与保存不联网」）
- 试验线前端裁剪（理由 DEV-PLAN §四），快照数据底座保留

## CHANGELOG 发版段（同步写入 CHANGELOG.md）
见 docs/release-draft/CHANGELOG-entry.md

## M8 回填草稿（夜间冻结）
- 本地分支已备：scratch/backfill-github@backfill/pericarditis-claim-62（commit d80b12b，只改 BACKLOG #70 状态列，🔴⬜→🔵 版本+日期+依据，31 号口径）
- patch 存档: docs/release-draft/0001-BACKLOG-70-Issue-62-v0.1.0.patch
- 晨审执行序: cd 回填 clone → git pull --ff-only 最新 main → 重放 patch（冲突则以最新 main 为准重排）→ 推分支 → gh pr create → 合并后 Issue #62 与 BACKLOG 状态一致
