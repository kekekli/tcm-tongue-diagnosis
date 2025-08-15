import type { 
  TongueAnalysis, 
  ConstitutionType, 
  AnalysisResult, 
  ProductRecommendation 
} from '@/types/diagnosis'

export interface AnalysisInput {
  imageData: string
  userInfo?: {
    age?: number
    gender?: 'male' | 'female'
    symptoms?: string[]
  }
}

export const analyzeTongueImage = async (input: AnalysisInput): Promise<AnalysisResult> => {
  // 这里可以集成真实的AI分析API
  // 目前使用模拟分析结果
  
  const { imageData, userInfo } = input
  
  // 模拟图像分析延迟
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 基于图像数据生成分析结果
  const analysis = await performImageAnalysis(imageData)
  
  // 结合用户信息优化分析结果
  if (userInfo) {
    optimizeAnalysisWithUserInfo(analysis, userInfo)
  }
  
  return analysis
}

const performImageAnalysis = async (imageData: string): Promise<AnalysisResult> => {
  // 模拟AI分析过程
  const mockAnalysis = generateMockAnalysis()
  
  // 这里可以调用真实的AI模型
  // const realAnalysis = await callAIModel(imageData)
  
  return mockAnalysis
}

const generateMockAnalysis = (): AnalysisResult => {
  // 随机生成分析结果，实际应用中由AI模型提供
  const tongueQualities = ['淡红', '红', '淡白', '绛红', '紫暗']
  const coatings = ['薄白', '厚白', '薄黄', '厚黄', '无苔']
  const constitutions = [
    { type: 'qi_xu', name: '气虚质', description: '元气不足，以疲乏、气短为主要特征' },
    { type: 'yang_xu', name: '阳虚质', description: '阳气不足，以畏寒怕冷为主要特征' },
    { type: 'yin_xu', name: '阴虚质', description: '阴液亏少，以口燥咽干为主要特征' },
    { type: 'tan_shi', name: '痰湿质', description: '痰湿凝聚，以形体肥胖为主要特征' },
    { type: 'shi_re', name: '湿热质', description: '湿热内蕴，以面垢油腻为主要特征' },
    { type: 'ping_he', name: '平和质', description: '阴阳气血调和，体质良好' }
  ]
  
  const randomQuality = tongueQualities[Math.floor(Math.random() * tongueQualities.length)]
  const randomCoating = coatings[Math.floor(Math.random() * coatings.length)]
  const mainConstitution = constitutions[Math.floor(Math.random() * constitutions.length)]
  
  const tongueAnalysis: TongueAnalysis = {
    tongueQuality: {
      color: randomQuality,
      thickness: ['正常', '胖大', '瘦薄'][Math.floor(Math.random() * 3)],
      moisture: ['润泽', '干燥', '滑腻'][Math.floor(Math.random() * 3)],
      texture: ['柔软', '坚硬', '松软'][Math.floor(Math.random() * 3)]
    },
    tongueCoating: {
      color: randomCoating.includes('白') ? '白' : '黄',
      thickness: randomCoating.includes('薄') ? '薄' : '厚',
      distribution: ['均匀', '不均匀', '地图舌'][Math.floor(Math.random() * 3)],
      texture: ['润滑', '粗糙', '腻滑'][Math.floor(Math.random() * 3)]
    },
    tongueShape: {
      size: ['正常', '偏大', '偏小'][Math.floor(Math.random() * 3)],
      cracks: Math.random() > 0.7,
      teethMarks: Math.random() > 0.6,
      spots: Math.random() > 0.8
    }
  }
  
  const constitution: ConstitutionType[] = [
    {
      ...mainConstitution,
      percentage: 65 + Math.floor(Math.random() * 25),
      characteristics: getConstitutionCharacteristics(mainConstitution.type)
    },
    {
      ...constitutions[(constitutions.indexOf(mainConstitution) + 1) % constitutions.length],
      percentage: 20 + Math.floor(Math.random() * 15),
      characteristics: []
    }
  ]
  
  const healthRisks = getHealthRisks(mainConstitution.type)
  const recommendations = getRecommendations(mainConstitution.type)
  const products = getProductRecommendations(mainConstitution.type)
  
  return {
    tongueAnalysis,
    constitution,
    healthRisks,
    recommendations,
    products
  }
}

const getConstitutionCharacteristics = (type: string): string[] => {
  const characteristics = {
    qi_xu: ['容易疲劳', '声音低弱', '容易感冒', '不耐劳累'],
    yang_xu: ['畏寒怕冷', '手足不温', '喜热饮食', '精神不振'],
    yin_xu: ['潮热盗汗', '手足心热', '口燥咽干', '眼干涩'],
    tan_shi: ['形体肥胖', '胸闷痰多', '身重困倦', '喜食肥甘'],
    shi_re: ['面部油腻', '易生痤疮', '口苦口干', '大便黏腻'],
    ping_he: ['精力充沛', '睡眠良好', '胃纳佳', '二便正常']
  }
  
  return characteristics[type as keyof typeof characteristics] || []
}

const getHealthRisks = (type: string): string[] => {
  const risks = {
    qi_xu: ['免疫力下降', '消化不良', '脏器下垂'],
    yang_xu: ['阳痿早泄', '不孕不育', '水肿'],
    yin_xu: ['失眠多梦', '骨质疏松', '糖尿病倾向'],
    tan_shi: ['高血压', '高血脂', '糖尿病'],
    shi_re: ['湿疹', '肝胆疾病', '泌尿系感染'],
    ping_he: ['保持良好状态', '注意预防']
  }
  
  return risks[type as keyof typeof risks] || []
}

const getRecommendations = (type: string) => {
  const recommendations = {
    qi_xu: {
      diet: ['多食补气食物如山药、大枣', '少食生冷寒凉', '规律饮食'],
      lifestyle: ['早睡早起', '避免过度劳累', '保持心情舒畅'],
      exercise: ['太极拳', '八段锦', '散步'],
      herbs: ['黄芪', '人参', '党参', '白术']
    },
    yang_xu: {
      diet: ['温热食物', '羊肉、韭菜', '生姜、肉桂'],
      lifestyle: ['注意保暖', '避免贪凉', '适当晒太阳'],
      exercise: ['慢跑', '游泳', '瑜伽'],
      herbs: ['附子', '干姜', '肉桂', '鹿茸']
    },
    yin_xu: {
      diet: ['滋阴食物', '枸杞、银耳', '蜂蜜、梨'],
      lifestyle: ['避免熬夜', '保持环境湿润', '静心养神'],
      exercise: ['太极拳', '瑜伽', '冥想'],
      herbs: ['麦冬', '玉竹', '沙参', '枸杞子']
    },
    tan_shi: {
      diet: ['清淡饮食', '少油腻', '多蔬菜水果'],
      lifestyle: ['控制体重', '保持室内干燥', '勤洗澡'],
      exercise: ['有氧运动', '游泳', '快走'],
      herbs: ['陈皮', '半夏', '茯苓', '苍术']
    },
    shi_re: {
      diet: ['清热利湿', '绿豆、薏米', '少辛辣油腻'],
      lifestyle: ['保持清洁', '避免湿热环境', '早睡早起'],
      exercise: ['游泳', '太极', '瑜伽'],
      herbs: ['黄连', '黄芩', '栀子', '龙胆草']
    },
    ping_he: {
      diet: ['均衡饮食', '适量运动', '按时作息'],
      lifestyle: ['保持良好习惯', '适度锻炼', '定期体检'],
      exercise: ['各种运动', '保持活跃', '循序渐进'],
      herbs: ['适当进补', '应季养生', '预防为主']
    }
  }
  
  return recommendations[type as keyof typeof recommendations] || recommendations.ping_he
}

const getProductRecommendations = (type: string): ProductRecommendation[] => {
  const products = {
    qi_xu: [
      {
        id: '1',
        name: '黄芪片',
        category: '中成药',
        reason: '补气健脾，提升免疫力',
        price: '¥28',
        taobaoLink: 'https://s.taobao.com/search?q=黄芪片',
        image: '/src/assets/images/products/huangqi.jpg'
      },
      {
        id: '2',
        name: '红枣枸杞茶',
        category: '养生茶',
        reason: '益气补血，滋养身体',
        price: '¥45',
        taobaoLink: 'https://s.taobao.com/search?q=红枣枸杞茶',
        image: '/src/assets/images/products/jujube-tea.jpg'
      }
    ],
    yang_xu: [
      {
        id: '3',
        name: '金匮肾气丸',
        category: '中成药',
        reason: '温肾助阳，改善阳虚症状',
        price: '¥35',
        taobaoLink: 'https://s.taobao.com/search?q=金匮肾气丸',
        image: '/src/assets/images/products/jingui.jpg'
      }
    ],
    yin_xu: [
      {
        id: '4',
        name: '六味地黄丸',
        category: '中成药',
        reason: '滋阴补肾，适合阴虚体质',
        price: '¥32',
        taobaoLink: 'https://s.taobao.com/search?q=六味地黄丸',
        image: '/src/assets/images/products/liuwei.jpg'
      }
    ]
  }
  
  return products[type as keyof typeof products] || []
}

const optimizeAnalysisWithUserInfo = (
  analysis: AnalysisResult,
  userInfo: NonNullable<AnalysisInput['userInfo']>
) => {
  // 根据年龄调整分析结果
  if (userInfo.age) {
    if (userInfo.age > 50) {
      // 老年人更容易阳虚
      const yangXuConstitution = analysis.constitution.find(c => c.type === 'yang_xu')
      if (yangXuConstitution) {
        yangXuConstitution.percentage += 10
      }
    } else if (userInfo.age < 30) {
      // 年轻人更容易湿热
      const shiReConstitution = analysis.constitution.find(c => c.type === 'shi_re')
      if (shiReConstitution) {
        shiReConstitution.percentage += 5
      }
    }
  }
  
  // 根据性别调整
  if (userInfo.gender === 'female') {
    // 女性更容易血虚、阴虚
    const yinXuConstitution = analysis.constitution.find(c => c.type === 'yin_xu')
    if (yinXuConstitution) {
      yinXuConstitution.percentage += 5
    }
  }
  
  // 根据症状调整
  if (userInfo.symptoms?.includes('疲劳')) {
    const qiXuConstitution = analysis.constitution.find(c => c.type === 'qi_xu')
    if (qiXuConstitution) {
      qiXuConstitution.percentage += 10
    }
  }
  
  // 重新排序体质结果
  analysis.constitution.sort((a, b) => b.percentage - a.percentage)
}

export const generateAnalysisReport = (result: AnalysisResult): string => {
  const { tongueAnalysis, constitution } = result
  const mainConstitution = constitution[0]
  
  return `
根据舌象分析，您的主要体质类型为${mainConstitution.name}（${mainConstitution.percentage}%）。

舌质特征：
- 颜色：${tongueAnalysis.tongueQuality.color}
- 厚薄：${tongueAnalysis.tongueQuality.thickness}
- 润燥：${tongueAnalysis.tongueQuality.moisture}

舌苔特征：
- 颜色：${tongueAnalysis.tongueCoating.color}
- 厚薄：${tongueAnalysis.tongueCoating.thickness}
- 分布：${tongueAnalysis.tongueCoating.distribution}

建议：
${result.recommendations.diet.join('、')}等饮食调理；
${result.recommendations.lifestyle.join('、')}等生活方式调整；
适当进行${result.recommendations.exercise.join('、')}等运动。
  `.trim()
}