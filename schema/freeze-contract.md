# freeze-contract · 迁移冻结账本

## 规则

- `0001_initial.sql` 冻结于 2026-11-07（M3，夜间无人值守自动签认，待晨审追认）。
- 结构变更只能新增 `000N_*.sql`；修改已冻结文件会被 check 拦下。
- 判读列 0：全库无 diagnosis / risk_level / activity_score / stage / 线序 / 疗效 / 复发评分列（scripts/check-schema-words.mjs 断言）。
- 派生值（缓解第 N 天、距上次发作、近 90 天次数）读时计算，不落库。

## sha256

| 文件 | sha256 | 冻结时点 |
| --- | --- | --- |
| schema/0001_initial.sql | `4df741ec94f5d14b2d9d9b3e9422fb55ecad53bdbbfaf1a91011dfdf3d0040e5` | 2026-11-07 M3 |
