<template>
  <div class="camera-container">
    <div class="camera-view" v-show="!capturedImage">
      <video
        ref="videoRef"
        :class="{ 'video-active': isVideoActive }"
        autoplay
        playsinline
        muted
      ></video>
      
      <!-- 拍照引导 -->
      <div class="camera-guide">
        <div class="guide-frame">
          <div class="frame-corners">
            <div class="corner top-left"></div>
            <div class="corner top-right"></div>
            <div class="corner bottom-left"></div>
            <div class="corner bottom-right"></div>
          </div>
          <div class="guide-text">请将舌头放在框内</div>
        </div>
      </div>

      <!-- 拍照控制 -->
      <div class="camera-controls">
        <div class="control-tips">
          <van-icon name="bulb-o" />
          <span>{{ currentTip }}</span>
        </div>
        
        <div class="control-buttons">
          <van-button
            round
            size="small"
            @click="switchCamera"
            v-if="cameras.length > 1"
          >
            <van-icon name="camera-switch" />
          </van-button>
          
          <div class="capture-btn" @click="capturePhoto">
            <div class="capture-inner"></div>
          </div>
          
          <van-button
            round
            size="small"
            @click="toggleFlash"
            v-if="hasFlash"
          >
            <van-icon :name="flashEnabled ? 'flash' : 'flash-o'" />
          </van-button>
        </div>
      </div>
    </div>

    <!-- 预览界面 -->
    <div class="photo-preview" v-show="capturedImage">
      <img :src="capturedImage" alt="拍摄的照片" />
      
      <div class="preview-controls">
        <van-button @click="retakePhoto" round>重新拍照</van-button>
        <van-button type="primary" @click="confirmPhoto" round>确认使用</van-button>
      </div>
    </div>

    <!-- 隐藏的canvas用于处理图片 -->
    <canvas ref="canvasRef" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Toast } from 'vant'

interface CameraDevice {
  deviceId: string
  label: string
}

const emit = defineEmits<{
  captured: [imageData: string]
}>()

const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const stream = ref<MediaStream | null>(null)
const capturedImage = ref<string>('')
const isVideoActive = ref(false)

const cameras = ref<CameraDevice[]>([])
const currentCameraIndex = ref(0)
const hasFlash = ref(false)
const flashEnabled = ref(false)

const tips = [
  '确保光线充足，避免阴影',
  '舌头自然伸出，不要过度用力',
  '保持手机稳定，避免模糊',
  '舌头完全展开，露出舌苔'
]
const currentTipIndex = ref(0)
const currentTip = ref(tips[0])

const initCamera = async () => {
  try {
    // 获取可用的摄像头
    const devices = await navigator.mediaDevices.enumerateDevices()
    cameras.value = devices
      .filter(device => device.kind === 'videoinput')
      .map(device => ({
        deviceId: device.deviceId,
        label: device.label || `摄像头 ${cameras.value.length + 1}`
      }))

    if (cameras.value.length === 0) {
      Toast.fail('未找到可用的摄像头')
      return
    }

    await startCamera()
    startTipRotation()
  } catch (error) {
    console.error('初始化摄像头失败:', error)
    Toast.fail('无法访问摄像头，请检查权限设置')
  }
}

const startCamera = async () => {
  try {
    if (stream.value) {
      stream.value.getTracks().forEach(track => track.stop())
    }

    const constraints = {
      video: {
        deviceId: cameras.value[currentCameraIndex.value]?.deviceId,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: currentCameraIndex.value === 0 ? 'environment' : 'user'
      },
      audio: false
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value
      await nextTick()
      
      videoRef.value.onloadedmetadata = () => {
        isVideoActive.value = true
      }

      // 检查是否支持闪光灯
      const track = stream.value.getVideoTracks()[0]
      const capabilities = track.getCapabilities?.()
      hasFlash.value = capabilities?.torch || false
    }
  } catch (error) {
    console.error('启动摄像头失败:', error)
    Toast.fail('摄像头启动失败')
  }
}

const switchCamera = async () => {
  if (cameras.value.length <= 1) return
  
  currentCameraIndex.value = (currentCameraIndex.value + 1) % cameras.value.length
  await startCamera()
  Toast.success(`已切换至${cameras.value[currentCameraIndex.value].label}`)
}

const toggleFlash = async () => {
  if (!hasFlash.value || !stream.value) return

  const track = stream.value.getVideoTracks()[0]
  try {
    await track.applyConstraints({
      advanced: [{ torch: !flashEnabled.value }]
    })
    flashEnabled.value = !flashEnabled.value
    Toast.success(flashEnabled.value ? '闪光灯已开启' : '闪光灯已关闭')
  } catch (error) {
    console.error('控制闪光灯失败:', error)
  }
}

const capturePhoto = () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')

  if (!ctx) return

  // 设置canvas尺寸
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // 绘制当前帧
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // 图片处理和压缩
  const quality = 0.8
  capturedImage.value = canvas.toDataURL('image/jpeg', quality)

  // 播放拍照音效
  playShutterSound()
}

const playShutterSound = () => {
  // 创建拍照音效
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.1)
}

const retakePhoto = () => {
  capturedImage.value = ''
}

const confirmPhoto = () => {
  if (capturedImage.value) {
    emit('captured', capturedImage.value)
  }
}

const startTipRotation = () => {
  setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % tips.length
    currentTip.value = tips[currentTipIndex.value]
  }, 3000)
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
    stream.value = null
  }
  isVideoActive.value = false
}

onMounted(() => {
  initCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.camera-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.camera-view {
  position: relative;
  width: 100%;
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-active {
  opacity: 1;
}

.camera-guide {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.guide-frame {
  position: relative;
  width: 280px;
  height: 280px;
  border: 2px solid rgba(76, 175, 80, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.frame-corners {
  position: absolute;
  inset: -10px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #4CAF50;
}

.corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
  border-radius: 8px 0 0 0;
}

.corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
  border-radius: 0 8px 0 0;
}

.corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
  border-radius: 0 0 0 8px;
}

.corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
  border-radius: 0 0 8px 0;
}

.guide-text {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  text-align: center;
}

.camera-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.control-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 0 20px;
  text-align: center;
}

.control-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.capture-btn {
  width: 80px;
  height: 80px;
  border: 4px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.capture-btn:active {
  transform: scale(0.9);
  background: rgba(255, 255, 255, 0.2);
}

.capture-inner {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.photo-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #000;
}

.photo-preview img {
  flex: 1;
  width: 100%;
  object-fit: contain;
}

.preview-controls {
  display: flex;
  gap: 16px;
  padding: 20px;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
}

.preview-controls .van-button {
  flex: 1;
  max-width: 120px;
}
</style>