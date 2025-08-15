import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { DiagnosisRecord, HealthReport, ConstitutionType } from '@/types/diagnosis'
import { formatDate, formatDateRange } from '@/utils/date'

export interface ReportOptions {
  title?: string
  timeRange?: {
    start: number
    end: number
  }
  includeCharts?: boolean
  includeTrends?: boolean
  format?: 'pdf' | 'image' | 'html'
}

export const generateHealthReport = async (
  records: DiagnosisRecord[],
  options: ReportOptions = {}
): Promise<HealthReport> => {
  const {
    timeRange = {
      start: Date.now() - 30 * 24 * 60 * 60 * 1000, // 默认30天
      end: Date.now()
    }
  } = options

  // 筛选时间范围内的记录
  const filteredRecords = records.filter(record => 
    record.timestamp >= timeRange.start && record.timestamp <= timeRange.end
  )

  if (filteredRecords.length === 0) {
    throw new Error('所选时间范围内没有诊断记录')
  }

  // 分析体质趋势
  const constitutionTrend = analyzeConstitutionTrend(filteredRecords)
  
  // 计算健康评分
  const healthScore = calculateHealthScore(filteredRecords)
  
  // 生成改善建议
  const improvements = generateImprovements(filteredRecords)
  
  // 生成图表数据
  const charts = await generateChartData(filteredRecords)

  const report: HealthReport = {
    id: `report_${Date.now()}`,
    userId: 'current_user', // 在实际应用中应该是真实用户ID
    generatedAt: Date.now(),
    timeRange,
    summary: {
      totalDiagnoses: filteredRecords.length,
      constitutionTrend,
      healthScore,
      improvements
    },
    charts
  }

  return report
}

const analyzeConstitutionTrend = (records: DiagnosisRecord[]): ConstitutionType[] => {
  const constitutionMap = new Map<string, { total: number, count: number }>()
  
  records.forEach(record => {
    record.analysis.constitution.forEach(constitution => {
      const existing = constitutionMap.get(constitution.type) || { total: 0, count: 0 }
      constitutionMap.set(constitution.type, {
        total: existing.total + constitution.percentage,
        count: existing.count + 1
      })
    })
  })
  
  const result: ConstitutionType[] = []
  constitutionMap.forEach((data, type) => {
    const averagePercentage = Math.round(data.total / data.count)
    
    // 获取体质信息
    const constitutionInfo = getConstitutionInfo(type)
    
    result.push({
      type,
      name: constitutionInfo.name,
      percentage: averagePercentage,
      description: constitutionInfo.description,
      characteristics: constitutionInfo.characteristics
    })
  })
  
  return result.sort((a, b) => b.percentage - a.percentage)
}

const getConstitutionInfo = (type: string) => {
  const constitutionData = {
    qi_xu: {
      name: '气虚质',
      description: '元气不足，以疲乏、气短为主要特征',
      characteristics: ['容易疲劳', '声音低弱', '容易感冒', '不耐劳累']
    },
    yang_xu: {
      name: '阳虚质',
      description: '阳气不足，以畏寒怕冷为主要特征',
      characteristics: ['畏寒怕冷', '手足不温', '喜热饮食', '精神不振']
    },
    yin_xu: {
      name: '阴虚质',
      description: '阴液亏少，以口燥咽干为主要特征',
      characteristics: ['潮热盗汗', '手足心热', '口燥咽干', '眼干涩']
    },
    tan_shi: {
      name: '痰湿质',
      description: '痰湿凝聚，以形体肥胖为主要特征',
      characteristics: ['形体肥胖', '胸闷痰多', '身重困倦', '喜食肥甘']
    },
    shi_re: {
      name: '湿热质',
      description: '湿热内蕴，以面垢油腻为主要特征',
      characteristics: ['面部油腻', '易生痤疮', '口苦口干', '大便黏腻']
    },
    ping_he: {
      name: '平和质',
      description: '阴阳气血调和，体质良好',
      characteristics: ['精力充沛', '睡眠良好', '胃纳佳', '二便正常']
    }
  }
  
  return constitutionData[type as keyof typeof constitutionData] || {
    name: '未知体质',
    description: '体质类型不明确',
    characteristics: []
  }
}

const calculateHealthScore = (records: DiagnosisRecord[]): number => {
  if (records.length === 0) return 0
  
  let totalScore = 0
  
  records.forEach(record => {
    let recordScore = 70 // 基础分数
    
    const mainConstitution = record.analysis.constitution[0]
    
    // 根据主要体质类型调整分数
    if (mainConstitution.type === 'ping_he') {
      recordScore += 20 // 平和质加分
    } else if (mainConstitution.percentage > 80) {
      recordScore -= 10 // 极端体质偏向减分
    }
    
    // 根据健康风险调整
    const riskCount = record.analysis.healthRisks.length
    recordScore -= riskCount * 5
    
    // 根据异常舌象特征调整
    const tongueShape = record.analysis.tongueAnalysis.tongueShape
    if (tongueShape.cracks) recordScore -= 3
    if (tongueShape.teethMarks) recordScore -= 3
    if (tongueShape.spots) recordScore -= 5
    
    totalScore += Math.max(0, Math.min(100, recordScore))
  })
  
  return Math.round(totalScore / records.length)
}

const generateImprovements = (records: DiagnosisRecord[]): string[] => {
  const improvements: string[] = []
  const constitutionCount = new Map<string, number>()
  
  // 统计体质类型出现频率
  records.forEach(record => {
    const mainConstitution = record.analysis.constitution[0]
    constitutionCount.set(
      mainConstitution.type,
      (constitutionCount.get(mainConstitution.type) || 0) + 1
    )
  })
  
  // 根据最常见的体质类型生成建议
  const mostCommonConstitution = Array.from(constitutionCount.entries())
    .sort((a, b) => b[1] - a[1])[0]
  
  if (mostCommonConstitution) {
    const [type] = mostCommonConstitution
    const suggestions = getImprovementSuggestions(type)
    improvements.push(...suggestions)
  }
  
  // 添加通用建议
  improvements.push(
    '保持规律的作息时间',
    '适量运动，循序渐进',
    '定期进行舌诊自检',
    '如有不适及时就医'
  )
  
  return improvements.slice(0, 6) // 限制建议数量
}

const getImprovementSuggestions = (constitutionType: string): string[] => {
  const suggestions = {
    qi_xu: [
      '多食补气食物如山药、大枣',
      '避免过度劳累，适当休息',
      '练习太极拳或八段锦'
    ],
    yang_xu: [
      '注意保暖，避免贪凉',
      '多食温热性食物',
      '适当进行温和运动'
    ],
    yin_xu: [
      '滋阴润燥，多饮水',
      '避免熬夜，保证充足睡眠',
      '多食滋阴食物如银耳、枸杞'
    ],
    tan_shi: [
      '控制体重，清淡饮食',
      '多食化痰利湿食物',
      '增加有氧运动'
    ],
    shi_re: [
      '清热利湿，少食辛辣',
      '保持良好的清洁习惯',
      '多食清热食物如绿豆、薏米'
    ],
    ping_he: [
      '保持现有的良好状态',
      '继续均衡饮食',
      '维持适量运动'
    ]
  }
  
  return suggestions[constitutionType as keyof typeof suggestions] || []
}

const generateChartData = async (records: DiagnosisRecord[]) => {
  // 体质分布雷达图数据
  const constitutionChart = generateConstitutionChartData(records)
  
  // 时间趋势图数据
  const trendChart = generateTrendChartData(records)
  
  return {
    constitutionChart,
    trendChart
  }
}

const generateConstitutionChartData = (records: DiagnosisRecord[]) => {
  const constitutionSum = new Map<string, number>()
  const constitutionNames = new Map<string, string>()
  
  records.forEach(record => {
    record.analysis.constitution.forEach(constitution => {
      constitutionSum.set(
        constitution.type,
        (constitutionSum.get(constitution.type) || 0) + constitution.percentage
      )
      constitutionNames.set(constitution.type, constitution.name)
    })
  })
  
  const chartData: Array<{ label: string; value: number }> = []
  
  constitutionSum.forEach((sum, type) => {
    const average = Math.round(sum / records.length)
    chartData.push({
      label: constitutionNames.get(type) || type,
      value: average
    })
  })
  
  return chartData.sort((a, b) => b.value - a.value)
}

const generateTrendChartData = (records: DiagnosisRecord[]) => {
  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp)
  
  return sortedRecords.map(record => {
    const mainConstitution = record.analysis.constitution[0]
    return {
      date: formatDate(record.timestamp, 'MM-DD'),
      constitution: mainConstitution.name,
      percentage: mainConstitution.percentage,
      healthScore: calculateHealthScore([record])
    }
  })
}

export const exportReportAsPDF = async (
  report: HealthReport,
  options: { includeCharts?: boolean } = {}
): Promise<Blob> => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  let currentY = margin

  // 设置中文字体（需要预先加载字体文件）
  // pdf.addFont('path/to/chinese/font.ttf', 'chinese', 'normal')
  // pdf.setFont('chinese')

  // 标题
  pdf.setFontSize(20)
  pdf.text('中医舌诊健康报告', pageWidth / 2, currentY, { align: 'center' })
  currentY += 15

  // 报告信息
  pdf.setFontSize(12)
  pdf.text(`生成时间：${formatDate(report.generatedAt)}`, margin, currentY)
  currentY += 8
  pdf.text(`统计时间：${formatDateRange(report.timeRange.start, report.timeRange.end)}`, margin, currentY)
  currentY += 8
  pdf.text(`诊断次数：${report.summary.totalDiagnoses}次`, margin, currentY)
  currentY += 15

  // 健康评分
  pdf.setFontSize(16)
  pdf.text('健康评分', margin, currentY)
  currentY += 10
  
  pdf.setFontSize(24)
  pdf.setTextColor(76, 175, 80)
  pdf.text(`${report.summary.healthScore}分`, margin, currentY)
  pdf.setTextColor(0, 0, 0)
  currentY += 15

  // 主要体质
  pdf.setFontSize(16)
  pdf.text('主要体质类型', margin, currentY)
  currentY += 10

  report.summary.constitutionTrend.slice(0, 3).forEach((constitution, index) => {
    pdf.setFontSize(12)
    pdf.text(
      `${index + 1}. ${constitution.name}：${constitution.percentage}%`,
      margin + 5,
      currentY
    )
    currentY += 6
    
    pdf.setFontSize(10)
    pdf.setTextColor(100, 100, 100)
    pdf.text(constitution.description, margin + 10, currentY)
    pdf.setTextColor(0, 0, 0)
    currentY += 8
  })

  currentY += 10

  // 改善建议
  pdf.setFontSize(16)
  pdf.text('改善建议', margin, currentY)
  currentY += 10

  report.summary.improvements.forEach((improvement, index) => {
    pdf.setFontSize(12)
    pdf.text(`${index + 1}. ${improvement}`, margin + 5, currentY)
    currentY += 8
    
    // 检查是否需要换页
    if (currentY > pageHeight - 30) {
      pdf.addPage()
      currentY = margin
    }
  })

  return pdf.output('blob')
}

export const exportReportAsImage = async (
  elementId: string,
  filename: string = 'health-report.png'
): Promise<Blob> => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('未找到要导出的元素')
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2, // 提高清晰度
    logging: false,
    useCORS: true
  })

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png', 0.9)
  })
}

export const shareReport = async (report: HealthReport): Promise<void> => {
  const shareText = `我的中医舌诊健康报告：
健康评分：${report.summary.healthScore}分
主要体质：${report.summary.constitutionTrend[0]?.name}
诊断次数：${report.summary.totalDiagnoses}次
时间范围：${formatDateRange(report.timeRange.start, report.timeRange.end)}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: '中医舌诊健康报告',
        text: shareText
      })
    } catch (error) {
      // 用户取消分享或分享失败，使用备用方案
      await navigator.clipboard.writeText(shareText)
      throw new Error('内容已复制到剪贴板')
    }
  } else {
    // 不支持原生分享，复制到剪贴板
    await navigator.clipboard.writeText(shareText)
    throw new Error('内容已复制到剪贴板')
  }
}