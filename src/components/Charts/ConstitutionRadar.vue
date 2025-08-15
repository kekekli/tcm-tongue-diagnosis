<template>
  <div class="constitution-radar">
    <canvas ref="canvasRef" :width="size" :height="size"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

interface RadarData {
  label: string
  value: number
}

interface Props {
  data: RadarData[]
  size?: number
  colors?: {
    line: string
    fill: string
    point: string
    text: string
    grid: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  size: 300,
  colors: () => ({
    line: '#4CAF50',
    fill: 'rgba(76, 175, 80, 0.2)',
    point: '#4CAF50',
    text: '#333',
    grid: '#ddd'
  })
})

const canvasRef = ref<HTMLCanvasElement>()

const drawRadarChart = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { size, colors } = props
  const center = size / 2
  const radius = size * 0.35
  const levels = 5

  // 清除画布
  ctx.clearRect(0, 0, size, size)

  // 设置字体
  ctx.font = '12px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 绘制网格
  drawGrid(ctx, center, radius, levels, colors.grid)

  if (props.data.length === 0) return

  // 绘制数据
  drawData(ctx, center, radius, colors)

  // 绘制标签
  drawLabels(ctx, center, radius, colors.text)
}

const drawGrid = (
  ctx: CanvasRenderingContext2D, 
  center: number, 
  radius: number, 
  levels: number, 
  gridColor: string
) => {
  ctx.strokeStyle = gridColor
  ctx.lineWidth = 1

  // 绘制同心圆
  for (let i = 1; i <= levels; i++) {
    ctx.beginPath()
    ctx.arc(center, center, (radius * i) / levels, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 绘制射线
  const dataLength = Math.max(props.data.length, 6) // 至少6个维度
  for (let i = 0; i < dataLength; i++) {
    const angle = (Math.PI * 2 * i) / dataLength - Math.PI / 2
    const x = center + Math.cos(angle) * radius
    const y = center + Math.sin(angle) * radius

    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.lineTo(x, y)
    ctx.stroke()
  }
}

const drawData = (
  ctx: CanvasRenderingContext2D, 
  center: number, 
  radius: number, 
  colors: NonNullable<Props['colors']>
) => {
  if (props.data.length === 0) return

  const points: { x: number; y: number }[] = []
  const dataLength = props.data.length

  // 计算点的坐标
  props.data.forEach((item, index) => {
    const angle = (Math.PI * 2 * index) / dataLength - Math.PI / 2
    const value = Math.min(item.value, 100) / 100 // 归一化到0-1
    const distance = radius * value
    
    const x = center + Math.cos(angle) * distance
    const y = center + Math.sin(angle) * distance
    
    points.push({ x, y })
  })

  // 绘制填充区域
  if (points.length > 2) {
    ctx.fillStyle = colors.fill
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    
    ctx.closePath()
    ctx.fill()
  }

  // 绘制线条
  ctx.strokeStyle = colors.line
  ctx.lineWidth = 2
  ctx.beginPath()
  
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y)
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    
    if (points.length > 2) {
      ctx.closePath()
    }
    ctx.stroke()
  }

  // 绘制数据点
  ctx.fillStyle = colors.point
  points.forEach(point => {
    ctx.beginPath()
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
}

const drawLabels = (
  ctx: CanvasRenderingContext2D, 
  center: number, 
  radius: number, 
  textColor: string
) => {
  ctx.fillStyle = textColor
  ctx.font = '12px Arial'

  props.data.forEach((item, index) => {
    const angle = (Math.PI * 2 * index) / props.data.length - Math.PI / 2
    const labelRadius = radius + 20
    
    const x = center + Math.cos(angle) * labelRadius
    const y = center + Math.sin(angle) * labelRadius

    // 调整文本对齐方式
    if (Math.abs(Math.cos(angle)) < 0.1) {
      ctx.textAlign = 'center'
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = 'start'
    } else {
      ctx.textAlign = 'end'
    }

    ctx.fillText(item.label, x, y)

    // 绘制数值
    ctx.font = '10px Arial'
    ctx.fillStyle = '#666'
    const valueY = y + (Math.sin(angle) > 0 ? 15 : -15)
    ctx.fillText(`${item.value}%`, x, valueY)
    
    // 恢复样式
    ctx.font = '12px Arial'
    ctx.fillStyle = textColor
  })
}

watch(() => props.data, () => {
  nextTick(() => {
    drawRadarChart()
  })
}, { deep: true })

onMounted(() => {
  drawRadarChart()
})
</script>

<style scoped>
.constitution-radar {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>