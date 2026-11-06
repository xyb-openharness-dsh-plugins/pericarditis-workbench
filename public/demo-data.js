/* 演示数据（唯一源）· 两组合成档案
 * A：刚确诊复发、记录少、多处未知；B：多年随访、发作多次、指标与用药都多。
 * 全部为合成示例，不冒充真实病历；页面不写死数字，一切从这里读。
 * 本文件只放数据，不放逻辑；TODAY 由 app.js 固定为 2026-11-07。
 */
window.DEMO_DATA = {
  TODAY: '2026-11-07',
  profiles: [
    {
      id: 'demo-a',
      name: '示例档案 A',
      tag: '刚确诊复发 · 记录少',
      isDemo: true,
      profile: {
        确诊经过: '2026-09 胸痛就诊，超声示心包积液，医生诊断心包炎（原文照录）',
        复发登记: '2026-09-20 起第二次发作（第一次时间未记，此处标注「未知」）',
        就诊医院: '示例市第一医院心内科',
        医生行动计划原话: '若出现胸痛加重或发热，联系我（张医生）复诊。'
      },
      flaps: [
        { id: 'a-f1', start: '2026-09-20', end: '2026-10-05', note: '胸痛伴低热，服用医生开的药物后缓解（原文照录）', private: false },
        { id: 'a-f2', start: '2026-10-22', end: '2026-11-02', note: '复发，复诊调药后缓解', private: false }
      ],
      labs: [
        { id: 'a-l1', metric: 'CRP', date: '2026-09-21', value: 68, unit: 'mg/L', method: '免疫比浊', org: '示例市第一医院', private: false },
        { id: 'a-l2', metric: 'ESR', date: '2026-09-21', value: 52, unit: 'mm/h', method: 'Westergren', org: '示例市第一医院', private: false },
        { id: 'a-l3', metric: 'CRP', date: '2026-10-08', value: 14, unit: 'mg/L', method: '免疫比浊', org: '示例市第一医院', private: false },
        { id: 'a-l4', metric: 'CRP', date: '2026-10-24', value: 41, unit: 'mg/L', method: '免疫比浊', org: '示例市第一医院', private: false },
        { id: 'a-l5', metric: '体温', date: '2026-09-21', value: 37.6, unit: '℃', method: '腋表', org: '自录', private: false }
      ],
      treatments: [
        { id: 'a-t1', date: '2026-09-21', kind: '按次', name: '秋水仙碱（医生处方）', note: '开始服用；剂量与疗程见处方原件，本台不录判定', private: false },
        { id: 'a-t2', date: '2026-10-24', kind: '按次', name: '复诊调整方案（原文照录：继续目前方案，两周后复查）', note: '', private: false }
      ],
      meds: [
        { id: 'a-m1', name: '秋水仙碱', schedule: '每日（具体见处方）', since: '2026-09-21', note: '合成示例：不写剂量' }
      ],
      questions: [],
      hospitals: [
        { id: 'a-h1', name: '示例市第一医院', dept: '心内科', contact: '电话见挂号单（未录入）', ver: 1 }
      ],
      reports: [
        { id: 'a-r1', title: '心脏超声报告（2026-09-21）', date: '2026-09-21', kind: '超声', source: '原件已登记', effusion: '少量心包积液（医生报告原文）', private: false },
        { id: 'a-r2', title: '化验单（CRP/ESR 2026-09-21）', date: '2026-09-21', kind: '化验', source: '未取得原件', effusion: '', private: false }
      ],
      docs: [
        { id: 'a-d1', name: '2026-09-21 出院小结', date: '2026-09-21', type: '病历', state: '已登记' },
        { id: 'a-d2', name: '（日期未知示例）外院超声描述单', date: null, type: '超声', state: '待核对' }
      ],
      mind: {
        feel: [
          { d: '2026-11-03', text: '这次复发比第一次更紧张，担心以后经常这样。', author: '本人', private: false },
          { d: '2026-11-04', text: '（私密记录示例）夜里痛醒了一次，很害怕。', author: '本人', private: true }
        ],
        family: [
          { d: '2026-11-04', text: '家人帮忙记了发作开始的那天晚上。', author: '家属', private: false }
        ]
      }
    },
    {
      id: 'demo-b',
      name: '示例档案 B',
      tag: '长期随访 · 发作多次 · 记录多',
      isDemo: true,
      profile: {
        确诊经过: '2024-03 首次心包炎发作，2024-05 复发，此后反复（合成示例）',
        复发登记: '发作次数由事件数据计算（见状态卡；私密发作不进聚合）',
        就诊医院: '示例市中心医院心内科；2025 起跨院随诊',
        医生行动计划原话: '若胸痛持续超过一天或发热超过 38℃，当天联系我或到急诊。（王医生 2025-11-02 门诊原话照录）'
      },
      flaps: [
        { id: 'b-f1', start: '2024-03-10', end: '2024-04-02', note: '首次发作（时间按病历整理）', private: false },
        { id: 'b-f2', start: '2024-05-18', end: '2024-06-10', note: '第一次复发', private: false },
        { id: 'b-f3', start: '2024-11-30', end: '2025-01-06', note: '冬季复发，较长', private: false },
        { id: 'b-f4', start: '2025-08-14', end: '2025-09-05', note: '复发，加用药物后缓解（原文照录）', private: false },
        { id: 'b-f5', start: '2026-08-02', end: '2026-08-27', note: '复发；开始按次注射治疗（见治疗记录）', private: false },
        { id: 'b-f6', start: '2026-10-28', end: '2026-11-02', note: '最近一次复发，较短', private: false },
        { id: 'b-f7', start: '2026-09-10', end: '2026-09-12', note: '（私密示例）短暂不适，未就医，仅自己记', private: true }
      ],
      labs: [
        { id: 'b-l01', metric: 'CRP', date: '2024-03-11', value: 74, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l02', metric: 'ESR', date: '2024-03-11', value: 58, unit: 'mm/h', method: 'Westergren', org: '示例市中心医院', private: false },
        { id: 'b-l03', metric: 'CRP', date: '2024-04-05', value: 22, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l04', metric: 'CRP', date: '2024-05-20', value: 61, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l05', metric: 'ESR', date: '2024-05-20', value: 49, unit: 'mm/h', method: 'Westergren', org: '示例市中心医院', private: false },
        { id: 'b-l06', metric: 'CRP', date: '2024-06-15', value: 9, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l07', metric: 'CRP', date: '2024-12-02', value: 83, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l08', metric: 'ESR', date: '2024-12-02', value: 66, unit: 'mm/h', method: 'Westergren', org: '示例市中心医院', private: false },
        { id: 'b-l09', metric: 'CRP', date: '2025-01-10', value: 17, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l10', metric: 'CRP', date: '2025-08-16', value: 55, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l11', metric: 'ESR', date: '2025-08-16', value: 44, unit: 'mm/h', method: 'Westergren', org: '示例市中心医院', private: false },
        { id: 'b-l12', metric: 'CRP', date: '2025-09-10', value: 11, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l13', metric: 'CRP', date: '2026-08-04', value: 47, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l14', metric: 'CRP', date: '2026-08-30', value: 12, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l15', metric: 'CRP', date: '2026-10-29', value: 36, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: false },
        { id: 'b-l16', metric: 'CRP', date: '2026-11-04', value: 8, unit: 'mg/L', method: '免疫比浊', org: '示例市第一医院', private: false },
        { id: 'b-l17', metric: 'ESR', date: '2026-11-04', value: 21, unit: 'mm/h', method: '微量法', org: '示例市第一医院', private: false },
        { id: 'b-l18', metric: '体温', date: '2026-10-28', value: 37.8, unit: '℃', method: '腋表', org: '自录', private: false },
        { id: 'b-l19', metric: '体温', date: '2026-11-02', value: 36.6, unit: '℃', method: '腋表', org: '自录', private: false },
        { id: 'b-l20', metric: 'CRP', date: '2026-09-14', value: 19, unit: 'mg/L', method: '免疫比浊', org: '示例市中心医院', private: true }
      ],
      treatments: [
        { id: 'b-t01', date: '2024-03-11', kind: '按次', name: '秋水仙碱（医生处方）', note: '首次发作开始', private: false },
        { id: 'b-t02', date: '2025-11-02', kind: '按次', name: '门诊调药（原文照录：维持目前方案）', note: '', private: false },
        { id: 'b-t03', date: '2026-08-05', kind: '按次', name: 'IL-1 拮抗剂注射（医生处方，合成示例）', note: '第 1 次注射', private: false },
        { id: 'b-t04', date: '2026-08-19', kind: '按次', name: 'IL-1 拮抗剂注射（合成示例）', note: '第 2 次', private: false },
        { id: 'b-t05', date: '2026-09-02', kind: '按次', name: 'IL-1 拮抗剂注射（合成示例）', note: '第 3 次', private: false },
        { id: 'b-t06', date: '2026-09-16', kind: '按次', name: 'IL-1 拮抗剂注射（合成示例）', note: '第 4 次', private: false },
        { id: 'b-t07', date: '2026-10-30', kind: '按次', name: '复诊（原文照录：继续注射方案，下次复诊 2026-12）', note: '', private: false },
        { id: 'b-t08', date: '2025-08-16', kind: '调药', name: '短期激素（医生处方，已按医嘱停用）', note: '疗程细节见原件', private: false }
      ],
      meds: [
        { id: 'b-m1', name: '秋水仙碱', schedule: '每日（具体见处方）', since: '2024-03-11', note: '合成示例' },
        { id: 'b-m2', name: 'IL-1 拮抗剂（注射）', schedule: '按次（每 2 周，医生安排）', since: '2026-08-05', note: '合成示例；可及性信息见疾病概要' }
      ],
      questions: [
        { id: 'b-q1', q: '注射治疗要坚持多久？什么时候评估效果？', addedOn: '2026-10-20', answered: false, private: false },
        { id: 'b-q2', q: '化验不同医院方法不一样，看趋势时怎么算可比？', addedOn: '2026-10-20', answered: false, private: false },
        { id: 'b-q3', q: '如果再复发，是先联系您还是直接做检查？', addedOn: '2026-11-04', answered: false, private: false },
        { id: 'b-q4', q: '（私密示例）可以把激素的事写进病历吗？', addedOn: '2026-10-21', answered: false, private: true }
      ],
      hospitals: [
        { id: 'b-h1', name: '示例市中心医院', dept: '心内科', contact: '0XX-00000000（合成）', ver: 2 },
        { id: 'b-h2', name: '示例市第一医院', dept: '心内科（跨院随诊）', contact: '出处：2026-11 挂号单', ver: 1 },
        { id: 'b-h3', name: '示例大学附属医院', dept: '心内科（第二意见）', contact: '未录入', ver: 1 }
      ],
      reports: [
        { id: 'b-r1', title: '心脏超声（2024-03-11）', date: '2024-03-11', kind: '超声', source: '原件已登记', effusion: '中量心包积液（报告原文）', private: false },
        { id: 'b-r2', title: '心脏超声（2025-08-16）', date: '2025-08-16', kind: '超声', source: '原件已登记', effusion: '少量积液（报告原文）', private: false },
        { id: 'b-r3', title: '心脏超声（2026-10-29）', date: '2026-10-29', kind: '超声', source: '原件已登记', effusion: '极少量积液（报告原文）', private: false },
        { id: 'b-r4', title: '化验单（2026-10-29）', date: '2026-10-29', kind: '化验', source: '未取得原件', effusion: '', private: false },
        { id: 'b-r5', title: '门诊病历（2026-08-05）', date: '2026-08-05', kind: '病历', source: '原件已登记', effusion: '', private: false },
        { id: 'b-r6', title: '注射记录单（2026-09-02）', date: '2026-09-02', kind: '治疗', source: '原件已登记', effusion: '', private: false },
        { id: 'b-r7', title: '异地随诊小结（2026-11-04）', date: '2026-11-04', kind: '病历', source: '原件已登记', effusion: '', private: false },
        { id: 'b-r8', title: '（私密示例）2025 精神科咨询小结', date: '2025-06-20', kind: '其他', source: '原件已登记', effusion: '', private: true }
      ],
      docs: [
        { id: 'b-d1', name: '2024-03-11 出院小结', date: '2024-03-11', type: '病历', state: '已登记' },
        { id: 'b-d2', name: '2024-03-11 心脏超声', date: '2024-03-11', type: '超声', state: '已核对' },
        { id: 'b-d3', name: '2024-05-20 化验单', date: '2024-05-20', type: '化验', state: '待核对' },
        { id: 'b-d4', name: '2025-08-16 心脏超声', date: '2025-08-16', type: '超声', state: '已核对' },
        { id: 'b-d5', name: '2026-08-05 门诊病历', date: '2026-08-05', type: '病历', state: '已核对' },
        { id: 'b-d6', name: '2026-10-29 化验单', date: '2026-10-29', type: '化验', state: '待核对' },
        { id: 'b-d7', name: '2026-11-04 随诊小结', date: '2026-11-04', type: '病历', state: '已登记' }
      ],
      mind: {
        feel: [
          { d: '2025-06-20', text: '反反复复，最难的是不知道这次会不会再犯。', author: '本人', private: false },
          { d: '2026-08-10', text: '开始注射治疗后，心里踏实了一点，但还是怕复发。', author: '本人', private: false },
          { d: '2026-11-03', text: '这次三天就缓解了，比以前快。', author: '本人', private: false },
          { d: '2026-10-25', text: '（私密记录示例）最近情绪很低落，不想让人知道。', author: '本人', private: true }
        ],
        family: [
          { d: '2026-08-06', text: '家人负责记住每两周的注射日期。', author: '家属', private: false },
          { d: '2026-10-29', text: '这次发作家人连夜陪着去了急诊。', author: '家属', private: false }
        ]
      }
    }
  ]
}
