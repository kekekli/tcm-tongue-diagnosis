<template>
  <div class="camera-page">
    <van-nav-bar
      title="舌象采集"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="question-o" @click="showHelp = true" />
      </template>
    </van-nav-bar>

    <!-- 拍照模式选择 -->
    <van-tabs v-model:active="activeMode" sticky>
      <van-tab title="拍照" name="camera">
        <div class="mode-content">
          <CameraCapture @captured="handleImageCaptured" />
        </div>
      </van-tab>
      
      <van-tab title="相册" name="upload">
        <div class="mode-content">
          <div class="upload-container">
            <ImageUploader @uploaded="handleImageUploaded" />
            
            <!-- 使用提示 -->
            <div class="usage-tips card">
              <div class="tips-title">
                <van-icon name="bulb-o" color="#4CAF50" />
                拍照建议
              </div>
              <div class="tips-list">
                <div class="tip-item">
                  <van-icon name="success" color="#4CAF50" size="14" />
                  <span>自然光线下拍摄效果最佳</span>
                </div>
                <div class="tip-item">
                  <van-icon name="success" color="#4CAF50" size="14" />
                  <span>舌头自然伸出，不要过度用力</span>
                </div>
                <div class="tip-item">
                  <van-icon name="success" color="#4CAF50" size="14" />
                  <span>保持手机稳定，避免模糊</span>
                </div>
                <div class="tip-item">
                  <van-icon name="success" color="#4CAF50" size="14" />
                  <span>确保舌面完整显示</span>
                </div>
              </div>
            </div>

            <!-- 示例图片 -->
            <div class="example-images card">
              <div class="example-title">参考示例</div>
              <van-grid :column-num="2" :gutter="12">
                <van-grid-item
                  v-for="example in exampleImages"
                  :key="example.id"
                >
                  <div class="example-item">
                    <van-image
                      :src="example.src"
                      fit="cover"
                      radius="8px"
                      :show-error="false"
                    />
                    <div class="example-label" :class="example.type">
                      {{ example.label }}
                    </div>
                  </div>
                </van-grid-item>
              </van-grid>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 帮助弹窗 -->
    <van-popup
      v-model:show="showHelp"
      position="center"
      :style="{ width: '90%', maxHeight: '80vh' }"
      round
    >
      <div class="help-content">
        <div class="help-header">
          <h3>拍照指南</h3>
          <van-icon name="cross" @click="showHelp = false" />
        </div>
        
        <div class="help-steps">
          <div class="step-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>准备工作</h4>
              <p>选择光线充足的环境，避免逆光或阴影。建议在自然光下进行拍摄。</p>
            </div>
          </div>
          
          <div class="step-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>正确姿势</h4>
              <p>自然张口，舌头轻松伸出，不要过度用力。保持舌面平整，充分展示。</p>
            </div>
          </div>
          
          <div class="step-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>拍摄技巧</h4>
              <p>手机保持稳定，距离适中。确保整个舌面都在取景框内，对焦清晰。</p>
            </div>
          </div>
          
          <div class="step-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>注意事项</h4>
              <p>拍摄前勿刷牙、进食或饮用有色饮料，以确保舌象的真实性。</p>
            </div>
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 加载提示 -->
    <van-loading
      v-if="isProcessing"
      type="spinner"
      color="#4CAF50"
      vertical
      size="24px"
    >
      正在处理图片...
    </van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import CameraCapture from '@/components/Camera/CameraCapture.vue'
import ImageUploader from '@/components/ImageUpload/ImageUploader.vue'
import { useDiagnosisStore } from '@/stores/diagnosis'
import { processImage } from '@/utils/imageProcess'

const router = useRouter()
const diagnosisStore = useDiagnosisStore()

const activeMode = ref('camera')
const showHelp = ref(false)
const isProcessing = ref(false)

const exampleImages = ref([
  {
    id: 1,
    src: '/src/assets/images/example-good.jpg',
    label: '推荐',
    type: 'good'
  },
  {
    id: 2,
    src: '/src/assets/images/example-bad.jpg',
    label: '不推荐',
    type: 'bad'
  },
  {
    id: 3,
    src: '/src/assets/images/example-normal.jpg',
    label: '正常舌象',
    type: 'normal'
  },
  {
    id: 4,
    src: '/src/assets/images/example-abnormal.jpg',
    label: '异常舌象',
    type: 'abnormal'
  }
])

const goBack = () => {
  router.back()
}

const handleImageCaptured = async (imageData: string) => {
  await processImageData(imageData)
}

const handleImageUploaded = async (imageData: string) => {
  await processImageData(imageData)
}

const processImageData = async (imageData: string) => {
  try {
    isProcessing.value = true
    
    // 图片预处理
    const processedImage = await processImage(imageData)
    
    // 保存图片到临时存储
    const imageId = Date.now().toString()
    const imageUrl = await saveImageToLocal(processedImage, imageId)
    
    // 跳转到分析页面
    router.push({
      name: 'Analysis',
      params: { id: imageId },
      query: { imageUrl }
    })
    
    Toast.success('图片处理完成')
  } catch (error) {
    console.error('图片处理失败:', error)
    Toast.fail('图片处理失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

const saveImageToLocal = async (imageData: string, imageId: string): Promise<string> => {
  // 这里可以实现图片本地存储逻辑
  // 例如使用 IndexedDB 或 localStorage
  
  // 简化实现：直接返回 base64 数据
  localStorage.setItem(`tcm-image-${imageId}`, imageData)
  return imageData
}
</script>

<style scoped>
.camera-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.mode-content {
  min-height: calc(100vh - 140px);
}

.upload-container {
  padding: 16px;
}

.usage-tips {
  margin-top: 24px;
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.example-images {
  margin-top: 24px;
}

.example-title {
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.example-item {
  position: relative;
  text-align: center;
}

.example-item .van-image {
  width: 100%;
  height: 120px;
  border-radius: 8px;
}

.example-label {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  color: white;
}

.example-label.good {
  background: #4CAF50;
}

.example-label.bad {
  background: #f56c6c;
}

.example-label.normal {
  background: #409eff;
}

.example-label.abnormal {
  background: #e6a23c;
}

.help-content {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.help-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.help-steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-item {
  display: flex;
  gap: 16px;
}

.step-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.step-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.step-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #666;
}

.van-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 20px;
}
</style>