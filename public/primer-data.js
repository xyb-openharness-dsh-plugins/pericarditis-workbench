/* 36 号 · 疾病概要数据（复发性心包炎）· 纯字面量，正则可扫
 * 0 临床审核：全部内容为待核占位（thresholds【待核】），来源未取得原件的按二次来源标注。
 */
window.DISEASE_PRIMER = {
  brand: '小包宝 PeriPal',
  name: '复发性心包炎',
  en: 'Recurrent Pericarditis',
  updated: '2026-11-07（0 临床审核 · 待晨审补原件核数）',
  sections: [
    {
      id: 'definition',
      title: '定义',
      intro: '心包是包在心脏外面的一层薄膜与囊袋。心包炎是这层膜的炎症；「复发性」指一次发作缓解后，症状在没有症状的间隔期之后再次出现。本段只做事实整理，不做诊断。',
      points: [
        '常见表现包括胸痛（躺下加重、前倾可减轻）、发热、心包摩擦音等；本台只记录你自己的经历，不据症状做判断。',
        '复发的定义与间隔口径，各文献表述不一致，本台不写具体周数——这一句需要问你的医生。',
        '复发性心包炎列入《86 个罕见病病种诊疗指南（2025 年版）》目录第 70 条。',
        '本台不区分你是首次发病还是复发，只帮你把发作与缓解的时间线记清楚。'
      ],
      sources: [
        { org: '国家卫生健康委员会等', doc: '《86 个罕见病病种诊疗指南（2025 年版）》第 70 条 复发性心包炎', version: '2025 年版', original: false, nolink: true, page: 'p412', note: '原件未取得（夜间未联网核验）：官方全文需从国家卫生健康委官网检索下载，本台不冒充直链' },
        { org: 'European Society of Cardiology', doc: '2015 ESC Guidelines for the diagnosis and management of pericardial diseases', version: '2015', original: false, secondaryUrl: 'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Pericardial-Diseases', note: '未取得原件，据二次来源' }
      ]
    },
    {
      id: 'evidence',
      title: '医学资料规范和指南情况',
      intro: '下表是可查到的规范与指南入口。是否适用、适用哪一条，由医生判断；本台不把指南变成自测题。',
      table: {
        head: ['资料', '发布方', '版本', '语言', '入口'],
        rows: [
          ['《86 个罕见病病种诊疗指南》第 70 条 复发性心包炎', '国家卫生健康委员会等', '2025 年版', '中文', { text: '官方目录（需自行检索下载）', kind: 'link', url: 'https://www.nhc.gov.cn/' }],
          ['心包疾病诊断与管理指南', '欧洲心脏病学会 ESC', '2015', '英文', { text: '指南库入口', kind: 'link', url: 'https://www.escardio.org/Guidelines' }],
          ['复发性心包炎专题综述（多种）', '学术期刊', '2016–2023', '英文', { text: 'PubMed 检索入口', kind: 'link', url: 'https://pubmed.ncbi.nlm.nih.gov/' }]
        ]
      },
      points: [
        '中文规范以中国官方发布为准；本表只给入口，不摘要成「你该怎么做」。',
        '国际指南内容更新快，是否更新请以发布方页面为准；本台不替你判断版本新旧。'
      ],
      sources: [
        { org: '国家卫生健康委员会', doc: '86 个罕见病病种诊疗指南（2025 年版）', version: '2025 年版', original: false, nolink: true, note: '原件未取得：全文需从国家卫生健康委官网检索下载' }
      ]
    },
    {
      id: 'landscape',
      title: '治疗全景',
      intro: '下面只列「医生在复发性心包炎中通常会谈到哪些方向」这一事实，不代表任何一项适合你；具体用药、剂量与疗程需要问你的医生。',
      groups: [
        { label: '抗炎类药物方向', points: ['非甾体抗炎药（NSAID）是常被谈到的方向之一', '秋水仙碱常作为减少复发的方向之一被谈到', '糖皮质激素的使用语境较复杂，是否使用由医生决定'] },
        { label: '生物制剂方向', points: ['IL-1 拮抗剂在部分国家获批用于复发性心包炎；中国境内可及性与医保状态本台没有可靠信息——这一句需要问你的医生'] },
        { label: '随访与复查方向', points: ['炎症指标（如 CRP）复查、心脏超声观察心包积液等，频率与项目以医生安排为准【待核】'] }
      ],
      points: [
        '本段各方向按受累器官与病情轻重排列（心包局部炎症 → 全身炎症反应 → 长期随访），不代表任何一项适合你；具体选择需要问你的医生。'
      ],
      sources: [
        { org: 'European Society of Cardiology', doc: '2015 ESC 心包疾病指南', version: '2015', original: false, secondaryUrl: 'https://www.escardio.org/Guidelines/Clinical-Practice-Guidelines/Pericardial-Diseases', note: '未取得原件，据二次来源；仅列方向不列方案' }
      ]
    },
    {
      id: 'trend',
      title: '发展趋势',
      intro: '只写已经发生的事实，不预测。',
      points: [
        '2021 年，rilonacept（一种 IL-1 通路拮抗剂）获美国 FDA 批准用于复发性心包炎（登记信息可在 FDA 官网查询）。',
        '国内已有多项关于复发性心包炎管理与 IL-1 拮抗剂的学术讨论与研究登记（可在 ClinicalTrials.gov 检索到登记条目）。',
        '本台不预测任何治疗何时可用；可及性变化以官方发布为准。'
      ],
      sources: [
        { org: 'U.S. FDA', doc: 'FDA approves rilonacept for recurrent pericarditis', version: '2021-03', original: false, secondaryUrl: 'https://www.fda.gov/news-events/press-announcements/fda-approves-first-treatment-recurrent-pericarditis', note: '未取得原件，据二次来源' },
        { org: 'ClinicalTrials.gov', doc: '登记条目检索：recurrent pericarditis', version: '持续更新', original: false, secondaryUrl: 'https://clinicaltrials.gov/search?cond=Recurrent%20Pericarditis', note: '登记平台入口，条目状态以官网为准' }
      ]
    }
  ]
}
