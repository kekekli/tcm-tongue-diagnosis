<template>
  <div class="constitution-trend-chart">
    <canvas ref="canvasRef" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import type { DiagnosisRecord } from '@/types/diagnosis'
import { formatDate } from '@/utils/date'

interface Props {
  records: DiagnosisRecord[]
  width?: number
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 350,
  height: 200
})

const canvasRef = ref<HTMLCanvasElement>()

const constitutionColors = {
  '气虚质': '#FF6B6B',
  '阳虚质': '#4ECDC4',
  '阴虚质': '#45B7D1',
  '痰湿质': '#96CEB4',
  '湿热质': '#FFEAA7',
  '血瘀质': '#DDA0DD',
  '气郁质': '#98D8C8',
  '特禀质': '#F7DC6F',
  '平和质': '#4CAF50'
}

const chartData = computed(() => {
  if (props.records.length === 0) return []
  
  return props.records
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(record => ({
      date: formatDate(record.timestamp, 'MM-DD'),
      timestamp: record.timestamp,
      constitution: record.analysis.constitution[0]?.name || '未知',
      percentage: record.analysis.constitution[0]?.percentage || 0
    }))
})

const drawChart = () => {
  const canvas = canvasRef.value
  if (!canvas || chartData.value.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = props
  const padding = { top: 20, right: 30, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  // 绘制背景网格
  drawGrid(ctx, padding, chartWidth, chartHeight)

  // 绘制坐标轴
  drawAxes(ctx, padding, chartWidth, chartHeight)

  // 绘制体质变化线
  drawConstitutionLines(ctx, padding, chartWidth, chartHeight)

  // 绘制数据点
  drawDataPoints(ctx, padding, chartWidth, chartHeight)

  // 绘制标签
  drawLabels(ctx, padding, chartWidth, chartHeight)

  // 绘制图例
  drawLegend(ctx, width, height)
}

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number
) => {
  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1

  // 垂直网格线
  const xStep = chartWidth / Math.max(chartData.value.length - 1, 1)
  for (let i = 0; i < chartData.value.length; i++) {
    const x = padding.left + i * xStep
    ctx.beginPath()
    ctx.moveTo(x, padding.top)
    ctx.lineTo(x, padding.top + chartHeight)
    ctx.stroke()
  }

  // 水平网格线
  const ySteps = 5
  for (let i = 0; i <= ySteps; i++) {
    const y = padding.top + (i * chartHeight) / ySteps
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()
  }
}

const drawAxes = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number
) => {
  ctx.strokeStyle = '#ccc'
  ctx.lineWidth = 2

  // X轴
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top + chartHeight)
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
  ctx.stroke()

  // Y轴
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + chartHeight)
  ctx.stroke()
}

const drawConstitutionLines = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number
) => {
  if (chartData.value.length < 2) return

  const xStep = chartWidth / (chartData.value.length - 1)
  
  // 按体质类型分组
  const constitutionGroups = new Map<string, Array<{ index: number; percentage: number }>>()
  
  chartData.value.forEach((point, index) => {
    if (!constitutionGroups.has(point.constitution)) {
      constitutionGroups.set(point.constitution, [])
    }
    constitutionGroups.get(point.constitution)!.push({
      index,
      percentage: point.percentage
    })
  })

  // 绘制每种体质的连线
  constitutionGroups.forEach((points, constitution) => {
    if (points.length < 2) return

    const color = constitutionColors[constitution as keyof typeof constitutionColors] || '#999'
    
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.setLineDash([])
    
    ctx.beginPath()
    points.forEach((point, i) => {
      const x = padding.left + point.index * xStep
      const y = padding.top + chartHeight - (point.percentage / 100) * chartHeight
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  })
}

const drawDataPoints = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number
) => {
  const xStep = chartWidth / (chartData.value.length - 1)
  
  chartData.value.forEach((point, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight - (point.percentage / 100) * chartHeight
    
    const color = constitutionColors[point.constitution as keyof typeof constitutionColors] || '#999'
    
    // 外圈
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 内圈
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.stroke()
  })
}

const drawLabels = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number
) => {
  ctx.fillStyle = '#666'
  ctx.font = '12px Arial'

  // X轴标签（日期）
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  const xStep = chartWidth / (chartData.value.length - 1)
  chartData.value.forEach((point, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight + 10
    ctx.fillText(point.date, x, y)
  })

  // Y轴标签（百分比）
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  
  for (let i = 0; i <= 5; i++) {
    const percentage = (i * 20).toString() + '%'
    const y = padding.top + chartHeight - (i * chartHeight) / 5
    const x = padding.left - 10
    
    ctx.fillText(percentage, x, y)
  }
}

const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const uniqueConstitutions = [...new Set(chartData.value.map(d => d.constitution))]
  
  if (uniqueConstitutions.length === 0) return

  const legendX = 20
  const legendY = height - 25
  const itemSpacing = Math.min(80, width / uniqueConstitutions.length)

  ctx.font = '10px Arial'
  ctx.textBaseline = 'middle'

  uniqueConstitutions.forEach((constitution, index) => {
    const x = legendX + index * itemSpacing
    const color = constitutionColors[constitution as keyof typeof constitutionColors] || '#999'

    // 绘制颜色指示器
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, legendY, 4, 0, Math.PI * 2)
    ctx.fill()

    // 绘制文字
    ctx.fillStyle = '#666'
    ctx.textAlign = 'left'
    ctx.fillText(constitution, x + 8, legendY)
  })
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
.constitution-trend-chart {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 8px;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>