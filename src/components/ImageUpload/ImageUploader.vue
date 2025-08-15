<template>
  <div class="image-uploader">
    <div class="upload-area" @click="triggerUpload">
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        @change="handleFileSelect"
        style="display: none;"
      />
      
      <div class="upload-content">
        <van-icon name="photo-o" size="48" color="#4CAF50" />
        <div class="upload-text">
          <div class="main-text">从相册选择</div>
          <div class="sub-text">支持 JPG、PNG 格式</div>
        </div>
      </div>
    </div>

    <div v-if="selectedImage" class="image-preview">
      <div class="preview-header">
        <span>预览图片</span>
        <van-button size="mini" @click="clearImage">删除</van-button>
      </div>
      
      <div class="preview-container">
        <img :src="selectedImage" alt="选择的图片" />
        
        <!-- 图片处理选项 -->
        <div class="image-tools">
          <van-button size="small" @click="rotateImage">
            <van-icon name="replay" />
            旋转
          </van-button>
          <van-button size="small" @click="cropImage">
            <van-icon name="crop" />
            裁剪
          </van-button>
        </div>
      </div>

      <div class="preview-actions">
        <van-button @click="clearImage">重新选择</van-button>
        <van-button type="primary" @click="confirmImage">确认使用</van-button>
      </div>
    </div>

    <!-- 图片裁剪弹窗 -->
    <van-popup
      v-model:show="showCropDialog"
      position="center"
      :style="{ padding: '20px' }"
      round
    >
      <div class="crop-container">
        <div class="crop-title">调整图片</div>
        <div class="crop-canvas-container">
          <canvas ref="cropCanvasRef"></canvas>
        </div>
        <div class="crop-controls">
          <van-button @click="cancelCrop">取消</van-button>
          <van-button type="primary" @click="applyCrop">应用</van-button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Toast } from 'vant'

const emit = defineEmits<{
  uploaded: [imageData: string]
}>()

const fileInputRef = ref<HTMLInputElement>()
const cropCanvasRef = ref<HTMLCanvasElement>()
const selectedImage = ref<string>('')
const originalImage = ref<string>('')
const showCropDialog = ref(false)
const rotationAngle = ref(0)

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    Toast.fail('请选择图片文件')
    return
  }

  // 验证文件大小 (最大10MB)
  if (file.size > 10 * 1024 * 1024) {
    Toast.fail('图片文件过大，请选择小于10MB的图片')
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const result = e.target?.result as string
    originalImage.value = result
    selectedImage.value = result
  }
  reader.readAsDataURL(file)
}

const rotateImage = () => {
  rotationAngle.value = (rotationAngle.value + 90) % 360
  applyRotation()
}

const applyRotation = () => {
  if (!originalImage.value) return

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 根据旋转角度设置canvas尺寸
    if (rotationAngle.value % 180 === 0) {
      canvas.width = img.width
      canvas.height = img.height
    } else {
      canvas.width = img.height
      canvas.height = img.width
    }

    // 移动到中心点并旋转
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotationAngle.value * Math.PI) / 180)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)

    selectedImage.value = canvas.toDataURL('image/jpeg', 0.9)
  }
  img.src = originalImage.value
}

const cropImage = () => {
  if (!selectedImage.value) return
  showCropDialog.value = true
  
  nextTick(() => {
    initCropCanvas()
  })
}

const initCropCanvas = () => {
  if (!cropCanvasRef.value || !selectedImage.value) return

  const canvas = cropCanvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  img.onload = () => {
    // 设置canvas尺寸
    const maxSize = 300
    const scale = Math.min(maxSize / img.width, maxSize / img.height)
    
    canvas.width = img.width * scale
    canvas.height = img.height * scale
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    
    // 添加裁剪框
    drawCropFrame(ctx, canvas)
  }
  img.src = selectedImage.value
}

const drawCropFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const frameSize = Math.min(canvas.width, canvas.height) * 0.8
  const x = (canvas.width - frameSize) / 2
  const y = (canvas.height - frameSize) / 2
  
  // 半透明遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // 清除中心区域
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height / 2, frameSize / 2, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制裁剪框边框
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = '#4CAF50'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(canvas.width / 2, canvas.height / 2, frameSize / 2, 0, Math.PI * 2)
  ctx.stroke()
}

const applyCrop = () => {
  if (!cropCanvasRef.value || !selectedImage.value) return

  const canvas = cropCanvasRef.value
  const img = new Image()
  
  img.onload = () => {
    const cropCanvas = document.createElement('canvas')
    const ctx = cropCanvas.getContext('2d')
    if (!ctx) return

    // 计算裁剪区域
    const frameSize = Math.min(canvas.width, canvas.height) * 0.8
    const scale = img.width / canvas.width
    const cropSize = frameSize * scale
    const x = (img.width - cropSize) / 2
    const y = (img.height - cropSize) / 2

    // 创建圆形裁剪
    cropCanvas.width = cropSize
    cropCanvas.height = cropSize
    
    ctx.beginPath()
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2)
    ctx.clip()
    
    ctx.drawImage(img, x, y, cropSize, cropSize, 0, 0, cropSize, cropSize)
    
    selectedImage.value = cropCanvas.toDataURL('image/jpeg', 0.9)
    showCropDialog.value = false
  }
  
  img.src = selectedImage.value
}

const cancelCrop = () => {
  showCropDialog.value = false
}

const clearImage = () => {
  selectedImage.value = ''
  originalImage.value = ''
  rotationAngle.value = 0
  
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const confirmImage = () => {
  if (selectedImage.value) {
    emit('uploaded', selectedImage.value)
  }
}
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.upload-area {
  border: 2px dashed #4CAF50;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f9f9f9;
}

.upload-area:hover {
  border-color: #45a049;
  background: #f5f5f5;
}

.upload-area:active {
  transform: scale(0.98);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.main-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.sub-text {
  font-size: 12px;
  color: #666;
}

.image-preview {
  margin-top: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.preview-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
}

.preview-container img {
  width: 100%;
  height: 300px;
  object-fit: cover;
  display: block;
}

.image-tools {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}

.image-tools .van-button {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
}

.preview-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.preview-actions .van-button {
  flex: 1;
}

.crop-container {
  text-align: center;
}

.crop-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 20px;
}

.crop-canvas-container {
  margin-bottom: 20px;
}

.crop-canvas-container canvas {
  border: 1px solid #eee;
  border-radius: 8px;
  max-width: 100%;
}

.crop-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.crop-controls .van-button {
  min-width: 80px;
}
</style>