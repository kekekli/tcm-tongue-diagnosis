<template>
  <div class="trend-chart">
    <canvas ref="canvasRef" :width="width" :height="height"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

interface TrendData {
  date: string
  constitution: string
  percentage: number
  healthScore: number
}

interface Props {
  data: TrendData[]
  width?: number
  height?: number
  colors?: {
    line: string
    fill: string
    grid: string
    text: string
    point: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  width: 350,
  height: 200,
  colors: () => ({
    line: '#4CAF50',
    fill: 'rgba(76, 175, 80, 0.1)',
    grid: '#f0f0f0',
    text: '#666',
    point: '#4CAF50'
  })
})

const canvasRef = ref<HTMLCanvasElement>()

const drawTrendChart = () => {
  const canvas = canvasRef.value
  if (!canvas || props.data.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height, colors } = props
  const padding = { top: 20, right: 20, bottom: 40, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 清除画布
  ctx.clearRect(0, 0, width, height)

  // 计算数据范围
  const maxScore = Math.max(...props.data.map(d => d.healthScore))
  const minScore = Math.min(...props.data.map(d => d.healthScore))
  const scoreRange = Math.max(maxScore - minScore, 20) // 最小范围20

  // 绘制网格
  drawGrid(ctx, padding, chartWidth, chartHeight, colors.grid)

  // 绘制坐标轴
  drawAxes(ctx, padding, chartWidth, chartHeight, colors.text)

  // 绘制趋势线
  drawTrendLine(ctx, padding, chartWidth, chartHeight, minScore, scoreRange, colors)

  // 绘制数据点
  drawDataPoints(ctx, padding, chartWidth, chartHeight, minScore, scoreRange, colors)

  // 绘制标签
  drawLabels(ctx, padding, chartWidth, chartHeight, colors.text)
}

const drawGrid = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number,
  gridColor: string
) => {
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1

  // 垂直网格线
  const xStep = chartWidth / Math.max(props.data.length - 1, 1)
  for (let i = 0; i <= props.data.length - 1; i++) {
    const x = padding.left + i * xStep
    ctx.beginPath()
    ctx.moveTo(x, padding.top)
    ctx.lineTo(x, padding.top + chartHeight)
    ctx.stroke()
  }

  // 水平网格线
  const gridLines = 5
  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (i * chartHeight) / gridLines
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
  chartHeight: number,
  textColor: string
) => {
  ctx.strokeStyle = textColor
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

const drawTrendLine = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number,
  minScore: number,
  scoreRange: number,
  colors: any
) => {
  if (props.data.length < 2) return

  const xStep = chartWidth / (props.data.length - 1)
  
  // 绘制填充区域
  const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
  gradient.addColorStop(0, colors.fill)
  gradient.addColorStop(1, 'rgba(76, 175, 80, 0)')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  
  props.data.forEach((point, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight - ((point.healthScore - minScore) / scoreRange) * chartHeight
    
    if (index === 0) {
      ctx.moveTo(x, padding.top + chartHeight)
      ctx.lineTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
  ctx.closePath()
  ctx.fill()

  // 绘制线条
  ctx.strokeStyle = colors.line
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  
  ctx.beginPath()
  props.data.forEach((point, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight - ((point.healthScore - minScore) / scoreRange) * chartHeight
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.stroke()
}

const drawDataPoints = (
  ctx: CanvasRenderingContext2D,
  padding: any,
  chartWidth: number,
  chartHeight: number,
  minScore: number,
  scoreRange: number,
  colors: any
) => {
  const xStep = chartWidth / (props.data.length - 1)
  
  props.data.forEach((point, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight - ((point.healthScore - minScore) / scoreRange) * chartHeight
    
    // 外圈
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 内圈
    ctx.fillStyle = colors.point
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
    
    // 边框
    ctx.strokeStyle = colors.point
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
  chartHeight: number,
  textColor: string
) => {
  ctx.fillStyle = textColor
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // X轴标签（日期）
  const xStep = chartWidth / (props.data.length - 1)
  props.data.forEach((point, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight + 10
    ctx.fillText(point.date, x, y)
  })

  // Y轴标签（分数）
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  
  const maxScore = Math.max(...props.data.map(d => d.healthScore))
  const minScore = Math.min(...props.data.map(d => d.healthScore))
  const scoreRange = Math.max(maxScore - minScore, 20)
  
  const labelCount = 5
  for (let i = 0; i <= labelCount; i++) {
    const score = minScore + (scoreRange * i) / labelCount
    const y = padding.top + chartHeight - (i * chartHeight) / labelCount
    const x = padding.left - 10
    
    ctx.fillText(Math.round(score).toString(), x, y)
  }
}

watch(() => props.data, () => {
  nextTick(() => {
    drawTrendChart()
  })
}, { deep: true })

onMounted(() => {
  drawTrendChart()
})
</script>

<style scoped>
.trend-chart {
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