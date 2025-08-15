<template>
  <div class="health-score-circle">
    <canvas ref="canvasRef" :width="size" :height="size"></canvas>
    <div class="score-overlay">
      <div class="score-number">{{ animatedScore }}</div>
      <div class="score-max">/100</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'

interface Props {
  score: number
  size?: number
  strokeWidth?: number
  colors?: {
    background: string
    progress: string
    text: string
  }
  animationDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 120,
  strokeWidth: 8,
  colors: () => ({
    background: '#f0f0f0',
    progress: '#4CAF50',
    text: '#333'
  }),
  animationDuration: 1500
})

const canvasRef = ref<HTMLCanvasElement>()
const animatedScore = ref(0)
const animationFrame = ref<number>()

const radius = computed(() => (props.size - props.strokeWidth) / 2)
const center = computed(() => props.size / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)

const drawCircle = (progress: number) => {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { colors, strokeWidth } = props
  
  // 清除画布
  ctx.clearRect(0, 0, props.size, props.size)
  
  // 设置线条样式
  ctx.lineWidth = strokeWidth
  ctx.lineCap = 'round'

  // 绘制背景圆环
  ctx.beginPath()
  ctx.arc(center.value, center.value, radius.value, 0, 2 * Math.PI)
  ctx.strokeStyle = colors.background
  ctx.stroke()

  // 绘制进度圆环
  const startAngle = -Math.PI / 2 // 从顶部开始
  const endAngle = startAngle + (progress / 100) * 2 * Math.PI
  
  ctx.beginPath()
  ctx.arc(center.value, center.value, radius.value, startAngle, endAngle)
  
  // 根据分数设置渐变色
  const gradient = ctx.createLinearGradient(0, 0, props.size, props.size)
  if (progress >= 90) {
    gradient.addColorStop(0, '#4CAF50')
    gradient.addColorStop(1, '#8BC34A')
  } else if (progress >= 80) {
    gradient.addColorStop(0, '#2196F3')
    gradient.addColorStop(1, '#03A9F4')
  } else if (progress >= 70) {
    gradient.addColorStop(0, '#FF9800')
    gradient.addColorStop(1, '#FFC107')
  } else if (progress >= 60) {
    gradient.addColorStop(0, '#FF5722')
    gradient.addColorStop(1, '#FF7043')
  } else {
    gradient.addColorStop(0, '#F44336')
    gradient.addColorStop(1, '#E57373')
  }
  
  ctx.strokeStyle = gradient
  ctx.stroke()

  // 添加端点圆点效果
  if (progress > 0) {
    const endX = center.value + radius.value * Math.cos(endAngle)
    const endY = center.value + radius.value * Math.sin(endAngle)
    
    ctx.beginPath()
    ctx.arc(endX, endY, strokeWidth / 2, 0, 2 * Math.PI)
    ctx.fillStyle = gradient
    ctx.fill()
  }
}

const animateScore = () => {
  const startTime = Date.now()
  const startValue = 0
  const endValue = props.score

  const animate = () => {
    const currentTime = Date.now()
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / props.animationDuration, 1)
    
    // 使用缓动函数
    const easedProgress = easeOutQuart(progress)
    const currentScore = Math.round(startValue + (endValue - startValue) * easedProgress)
    const currentProgress = startValue + (endValue - startValue) * easedProgress
    
    animatedScore.value = currentScore
    drawCircle(currentProgress)
    
    if (progress < 1) {
      animationFrame.value = requestAnimationFrame(animate)
    }
  }
  
  animate()
}

// 缓动函数：四次方缓出
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4)
}

const stopAnimation = () => {
  if (animationFrame.value) {
    cancelAnimationFrame(animationFrame.value)
    animationFrame.value = undefined
  }
}

watch(() => props.score, () => {
  stopAnimation()
  animateScore()
})

onMounted(() => {
  animateScore()
})
</script>

<style scoped>
.health-score-circle {
  position: relative;
  display: inline-block;
}

.score-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.score-number {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.score-max {
  font-size: 14px;
  color: #999;
  margin-top: 2px;
}
</style>