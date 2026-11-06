# PROTOTYPE-BASELINE · 家族对照记录（M1 · 一手实测）

对照对象与口径逐字保留；只抄结构与元素体系，不抄病种语义。

## 小粉宝 breast-cancer-workbench/prototypes/v0.4（成熟对比基准）

- 骨架：index.html 53 行空壳 + app.js 1511 行渲染；脚本序 primer-data → primer → app。
- 顶栏 top-actions 顺序：资料目录(#ready-store) → AI(#ready-session) → 设置 → 大字 → **? 疾病概要** → 版本 chip。
- 五 Tab（#records）：资料库 / 整理草稿核对 / 病情档案 / 指标检测 / 病情汇总；subnav role=tablist。
- 分类区块眉题：.metric-group > .metric-group-head(h3 + N 项)；指标卡 .mcard 真 3D 翻转（perspective:1200px + preserve-3d + aria-pressed）。
- 首页 hero：.stage-card 大状态卡（30px 数字）+ .alert-strip 行动带 + .task-entry 快捷卡三连 + .dashboard-grid（左最近变化/右安排与问题）。
- **DP 模块**：#disease-primer 由 primer.js build() 动态创建（primer.js:148-170），app.js 仅 4 行引用（624/625/638/655 primerBtn + data-primer-open）；数据 window.DISEASE_PRIMER 四段 definition/evidence/landscape/trend；来源行 sourceLine（primer.js:72-96）：原件/官方入口/二次来源/缺失违规标记；open→pushState('#disease-primer')，close 走 history.back()+250ms 兜底；双入口（←返回 / ✕）+ Esc + 焦点/滚动恢复。
- 一图秀：手写 SVG（CW=980,CH=400）、rail 左栏（时间 chips + details 指标多选 + 显示内容 chips）、治疗色带、smoothPath、#pin-slot 点选看来源。
- token：--paper/--surface/--ink*/--line*/--pink*/--action/--radius:16px/--font:15px；tabular-nums；断点 1180/900/720/600；body.large 只放大字号。

## 小橙宝 aml-workbench/prototypes/v0.2（结构基准）

- 一级 10+1 页导航（PAGES app.js:58-61）+ 每页 SUBPAGES 分组命名（dx/tx/neu/mrd/tp/care/mind/trial/docs）。
- #mind 三子页：mind-feel 当下感受（双主体）/ mind-death（私密+三出口口径卡）/ mind-burden 家庭负担与照护者；空态「暂无记录。」+ 下一步按钮。
- 事件泳道：内联 SVG，LANES y 坐标常量（app.js:347），发作=圆角色带 rect、输注=节点+title、标签相邻错行避让（H-05/H-02）。
- AI 面板：#agent-splitter role=separator aria-valuemin=25/max=45/now=35 + #agent-pane 35%；setAgent 开关保留会话；拖动钳制 25–45%，ArrowLeft/Right 步进 2%。
- aiBtn 一键发送：EMBEDDED 走 postMessage({type:'aml:agent-draft',…})，独立打开进演示面板明说未接通。
- 档案切换：DATA.profiles 多套 + pick-profile，API 形态附加建档向导。

## starter examples（DP 官方参考）

- examples/disease-primer-data.js + disease-primer.html + assets/patterns/disease-primer.js|css：窗口 .dp-panel inset clamp(8px,1.2vw,16px)、.dp-body 内滚、四段渲染 sectionHtml、空段「本台尚未整理这一段」、缺来源「这一段还不能用」、window.DiseasePrimer API。

## 本台落点（抄什么）

hero 大状态卡（换「缓解期第 N 天」）、五 Tab、.metric-group 眉题、.mcard 3D 翻转、primer 三件套整体移植（只换 primer-data.js 内容）、rail 一图秀、AML 泳道（发作—缓解带替代疗程带）、AI splitter 面板。不抄：肿瘤分期/标志物/治疗线序语义。
