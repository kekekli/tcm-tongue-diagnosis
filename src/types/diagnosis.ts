export interface TongueAnalysis {
  tongueQuality: {
    color: string
    thickness: string
    moisture: string
    texture: string
  }
  tongueCoating: {
    color: string
    thickness: string
    distribution: string
    texture: string
  }
  tongueShape: {
    size: string
    cracks: boolean
    teethMarks: boolean
    spots: boolean
  }
}

export interface ConstitutionType {
  type: string
  name: string
  percentage: number
  description: string
  characteristics: string[]
}

export interface AnalysisResult {
  tongueAnalysis: TongueAnalysis
  constitution: ConstitutionType[]
  healthRisks: string[]
  recommendations: {
    diet: string[]
    lifestyle: string[]
    exercise: string[]
    herbs: string[]
  }
  products: ProductRecommendation[]
}

export interface ProductRecommendation {
  id: string
  name: string
  category: string
  reason: string
  price: string
  taobaoLink: string
  image: string
}

export interface DiagnosisRecord {
  id: string
  timestamp: number
  imageUrl: string
  analysis: AnalysisResult
  notes?: string
}

export interface KnowledgeItem {
  id: string
  title: string
  category: string
  content: string
  images?: string[]
  tags: string[]
}

export interface HealthReport {
  id: string
  userId: string
  generatedAt: number
  timeRange: {
    start: number
    end: number
  }
  summary: {
    totalDiagnoses: number
    constitutionTrend: ConstitutionType[]
    healthScore: number
    improvements: string[]
  }
  charts: {
    constitutionChart: any
    trendChart: any
  }
}