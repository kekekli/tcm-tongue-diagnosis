<template>
  <div class="analysis-page">
    <van-nav-bar
      title="分析结果"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <!-- 加载状态 -->
    <div v-if="isAnalyzing" class="loading-section">
      <van-loading type="spinner" size="40px" color="#4CAF50">
        AI正在分析您的舌象...
      </van-loading>
      <p class="loading-text">请稍等，大约需要{{ remainingTime }}秒</p>
    </div>

    <!-- 分析结果 -->
    <div v-else-if="analysisResult" class="result-content">
      <!-- 舌象图片 -->
      <div class="tongue-image-section">
        <van-image
          :src="tongueImage"
          width="200"
          height="200"
          fit="cover"
          round
          class="tongue-image"
        />
      </div>

      <!-- 核心分析结果 -->
      <div class="analysis-summary card">
        <h3>分析结果</h3>
        
        <div class="result-item">
          <div class="result-label">舌质特征</div>
          <div class="result-value">{{ analysisResult.tongueBody.color }} · {{ analysisResult.tongueBody.texture }}</div>
        </div>
        
        <div class="result-item">
          <div class="result-label">舌苔情况</div>
          <div class="result-value">{{ analysisResult.coating.color }} · {{ analysisResult.coating.thickness }}</div>
        </div>
        
        <div class="health-advice">
          <van-icon name="info-o" color="#4CAF50" />
          <span>{{ getSimpleAdvice() }}</span>
        </div>
      </div>

      <!-- 推荐产品 -->
      <div class="products-section card">
        <h3>为您推荐</h3>
        <div class="product-grid">
          <div
            v-for="product in recommendedProducts"
            :key="product.id"
            class="product-card"
            @click="openProductLink(product.taobaoLink)"
          >
            <van-image
              :src="product.image"
              width="60"
              height="60"
              fit="cover"
              round
            />
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">¥{{ product.price }}</div>
            </div>
          </div>
        </div>
        
        <van-button
          type="primary"
          size="large"
          round
          block
          @click="viewAllProducts"
          class="view-all-btn"
        >
          查看更多推荐
        </van-button>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button @click="retakePicture" size="large" round>
          重新拍照
        </van-button>
      </div>
    </div>

    <!-- 错误状态 -->
    <van-empty
      v-else-if="error"
      image="error"
      :description="error"
    >
      <van-button type="primary" @click="retryAnalysis">重新分析</van-button>
    </van-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Toast } from 'vant'
import { analyzeTongueImage } from '@/utils/analysis'
import type { AnalysisResult } from '@/types/diagnosis'

const router = useRouter()
const route = useRoute()

const isAnalyzing = ref(false)
const remainingTime = ref(5)
const analysisResult = ref<AnalysisResult | null>(null)
const tongueImage = ref('')
const error = ref('')

const recommendedProducts = computed(() => {
  if (!analysisResult.value) return []
  return analysisResult.value.products.slice(0, 3)
})

const getSimpleAdvice = (): string => {
  if (!analysisResult.value) return ''
  
  const constitution = analysisResult.value.constitution.primary
  
  const adviceMap = {
    '气虚质': '建议多休息，适当补气养血',
    '阳虚质': '注意保暖，可适当温补',
    '阴虚质': '宜滋阴润燥，避免熬夜',
    '痰湿质': '饮食清淡，加强运动',
    '湿热质': '清热利湿，少食辛辣',
    '血瘀质': '活血化瘀，保持心情舒畅',
    '气郁质': '疏肝理气，多做运动',
    '特禀质': '避免过敏原，增强体质',
    '平和质': '保持良好生活习惯'
  }
  
  return adviceMap[constitution] || '建议咨询专业中医师'
}

const openProductLink = (link: string) => {
  if (link) {
    // 尝试打开淘宝app
    const taobaoAppLink = link.replace('https://', 'taobao://')
    
    const linkEl = document.createElement('a')
    linkEl.href = taobaoAppLink
    linkEl.style.display = 'none'
    document.body.appendChild(linkEl)
    linkEl.click()
    document.body.removeChild(linkEl)
    
    // 延迟后打开网页版
    setTimeout(() => {
      window.open(link, '_blank')
    }, 1000)
    
    Toast.success('正在跳转到购买页面...')
  }
}

const viewAllProducts = () => {
  router.push('/products')
}

const retakePicture = () => {
  router.push('/camera')
}

const retryAnalysis = () => {
  startAnalysis()
}

const startAnalysis = async () => {
  try {
    isAnalyzing.value = true
    error.value = ''
    remainingTime.value = 5
    
    // 倒计时
    const timer = setInterval(() => {
      remainingTime.value--
      if (remainingTime.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
    // 获取图片数据
    const imageId = route.params.id as string
    const imageUrl = route.query.imageUrl as string || localStorage.getItem(`tcm-image-${imageId}`)
    
    if (!imageUrl) {
      throw new Error('未找到图片数据')
    }
    
    tongueImage.value = imageUrl
    
    // 执行分析
    const result = await analyzeTongueImage({
      imageData: imageUrl
    })
    
    analysisResult.value = result
    
    clearInterval(timer)
  } catch (err) {
    console.error('分析失败:', err)
    error.value = '分析失败，请重试'
  } finally {
    isAnalyzing.value = false
  }
}

onMounted(() => {
  startAnalysis()
})
</script>

<style scoped>
.analysis-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.loading-text {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.result-content {
  padding: 20px;
}

.tongue-image-section {
  text-align: center;
  margin-bottom: 24px;
}

.tongue-image {
  border: 3px solid #4CAF50;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.analysis-summary h3,
.products-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:last-of-type {
  border-bottom: none;
}

.result-label {
  font-size: 14px;
  color: #666;
}

.result-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.health-advice {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 8px;
  font-size: 14px;
  color: #4CAF50;
  line-height: 1.5;
}

.product-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.product-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.product-card:active {
  background: #f0f0f0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.product-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff6034;
}

.view-all-btn {
  margin-top: 8px;
}

.action-buttons {
  text-align: center;
  margin-top: 20px;
}
</style>