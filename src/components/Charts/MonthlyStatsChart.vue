<template>
  <div class="monthly-stats-chart">
    <canvas ref="canvasRef" :width="width" :height="height"></canvas>
    <div class="stats-summary">
      <div class="summary-item">
        <span class="summary-label">本月诊断</span>
        <span class="summary-value">{{ currentMonthCount }}次</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">上月对比</span>
        <span class="summary-value" :class="comparisonClass">
          {{ comparisonText }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { DiagnosisRecord } from '@/types/diagnosis'

interface Props {
  records: DiagnosisRecord[]
  width?: number
  height?: number
  months?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 350,
  height: 180,
  months: 6
})

const canvasRef = ref<HTMLCanvasElement>()

const monthlyData = computed(() => {
  const now = new Date()
  const data = []
  
  for (let i = props.months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthStart = date.getTime()
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime()
    
    const monthRecords = props.records.filter(
      record => record.timestamp >= monthStart && record.timestamp <= monthEnd
    )
    
    data.push({
      month: date.toLocaleDateString('zh-CN', { month: 'short' }),
      count: monthRecords.length,
      avgScore: monthRecords.length > 0 
        ? Math.round(monthRecords.reduce((sum, r) => sum + calculateHealthScore(r), 0) / monthRecords.length)
        : 0
    })
  }
  
  return data
})

const currentMonthCount = computed(() => {
  return monthlyData.value[monthlyData.value.length - 1]?.count || 0
})

const comparisonText = computed(() => {
  const current = currentMonthCount.value
  const previous = monthlyData.value[monthlyData.value.length - 2]?.count || 0
  
  if (previous === 0) return '首次统计'
  
  const diff = current - previous
  const percentage = Math.round((Math.abs(diff) / previous) * 100)
  
  if (diff > 0) return `+${percentage}%`
  if (diff < 0) return `-${percentage}%`
  return '持平'
})

const comparisonClass = computed(() => {
  const current = currentMonthCount.value
  const previous = monthlyData.value[monthlyData.value.length - 2]?.count || 0
  
  if (current > previous) return 'increase'
  if (current < previous) return 'decrease'
  return 'stable'
})

const calculateHealthScore = (record: DiagnosisRecord): number => {
  const mainConstitution = record.analysis.constitution[0]
  let score = 70
  
  if (mainConstitution?.type === 'ping_he') {
    score += 20
  } else if (mainConstitution?.percentage > 80) {
    score -= 10
  }
  
  score -= record.analysis.healthRisks.length * 5
  
  const shape = record.analysis.tongueAnalysis.tongueShape
  if (shape.cracks || shape.teethMarks || shape.spots) {
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

const drawChart = () => {
  const canvas = canvasRef.value
  if (!canvas || monthlyData.value.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = props
  const padding = { top: 20, right: 20, bottom: 40, left: 30 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  const maxCount = Math.max(...monthlyData.value.map(d => d.count), 5)
  const barWidth = chartWidth / monthlyData.value.length * 0.6
  const barSpacing = chartWidth / monthlyData.value.length

  // 绘制网格线
  drawGrid(ctx, padding, chartWidth, chartHeight, maxCount)

  // 绘制柱状图
  drawBars(ctx, padding, chartHeight, barWidth, barSpacing, maxCount)

  // 绘制标签
  drawLabels(ctx, padding, chartWidth, chartHeight, barSpacing, maxCount)
}

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number,
  maxCount: number
) => {
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1

  // 水平网格线
  const gridLines = 4
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (i * chartHeight) / gridLines
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
  }
}

const drawBars = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartHeight: number,
  barWidth: number,
  barSpacing: number,
  maxCount: number
) => {
  monthlyData.value.forEach((data, index) => {
    const barHeight = (data.count / maxCount) * chartHeight
    const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2
    const y = padding.top + chartHeight - barHeight

    // 渐变填充
    const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
    gradient.addColorStop(0, '#4CAF50')
    gradient.addColorStop(1, '#81C784')

    ctx.fillStyle = gradient
    ctx.fillRect(x, y, barWidth, barHeight)

    // 柱状图顶部显示数值
    if (data.count > 0) {
      ctx.fillStyle = '#333'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(data.count.toString(), x + barWidth / 2, y - 5)
    }

    // 柱状图上方显示平均分数（如果有数据）
    if (data.avgScore > 0) {
      ctx.fillStyle = '#666'
      ctx.font = '10px Arial'
      ctx.fillText(`${data.avgScore}分`, x + barWidth / 2, y - 18)
    }
  })
}

const drawLabels = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number,
  barSpacing: number,
  maxCount: number
) => {
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // X轴标签（月份）
  monthlyData.value.forEach((data, index) => {
    const x = padding.left + index * barSpacing + barSpacing / 2
    const y = padding.top + chartHeight + 10
    ctx.fillText(data.month, x, y)
  })

  // Y轴标签（次数）
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  
  const gridLines = 4
  for (let i = 0; i <= gridLines; i++) {
    const value = Math.round((maxCount * i) / gridLines)
    const y = padding.top + chartHeight - (i * chartHeight) / gridLines
    const x = padding.left - 10
    
    ctx.fillText(value.toString(), x, y)
  }
}

watch(() => props.records, () => {
  nextTick(() => {
    drawChart()
  })
}, { deep: true })

onMounted(() => {
  drawChart()
})
</script>

<style scoped>
.monthly-stats-chart {
  background: white;
  border-radius: 8px;
  padding: 10px;
}

canvas {
  max-width: 100%;
  height: auto;
  margin-bottom: 16px;
}

.stats-summary {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #999;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
}

.summary-value.increase {
  color: #4CAF50;
}

.summary-value.decrease {
  color: #f56c6c;
}

.summary-value.stable {
  color: #666;
}
</style>