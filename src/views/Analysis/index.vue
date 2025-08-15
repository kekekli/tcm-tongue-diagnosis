<template>
  <div class="analysis-page">
    <van-nav-bar
      title="分析结果"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="share" @click="shareResult" />
      </template>
    </van-nav-bar>

    <!-- 加载状态 -->
    <div v-if="isAnalyzing" class="analyzing-container">
      <div class="analyzing-content">
        <van-loading type="spinner" size="40" color="#4CAF50">
          AI正在分析中...
        </van-loading>
        <div class="analyzing-tips">
          <p>正在运用专业中医理论分析您的舌象</p>
          <p>预计需要 {{ remainingTime }} 秒</p>
        </div>
      </div>
    </div>

    <!-- 分析结果 -->
    <div v-else-if="analysisResult" class="analysis-content">
      <!-- 舌象图片 -->
      <div class="image-section card">
        <van-image
          :src="tongueImage"
          fit="cover"
          round
          width="120"
          height="120"
        />
        <div class="image-info">
          <div class="analysis-date">{{ formatDate(timestamp) }}</div>
          <div class="image-quality">
            <van-tag :type="qualityTagType" size="mini">
              {{ qualityText }}
            </van-tag>
          </div>
        </div>
      </div>

      <!-- 体质分析结果 -->
      <div class="constitution-section card">
        <div class="section-title">体质分析</div>
        
        <div class="main-constitution">
          <div class="constitution-header">
            <h3>{{ mainConstitution.name }}</h3>
            <div class="constitution-percentage">
              {{ mainConstitution.percentage }}%
            </div>
          </div>
          <p class="constitution-desc">{{ mainConstitution.description }}</p>
          
          <!-- 体质特征 -->
          <div class="characteristics">
            <div class="characteristics-title">主要特征</div>
            <div class="characteristics-tags">
              <van-tag
                v-for="char in mainConstitution.characteristics"
                :key="char"
                type="primary"
                size="mini"
                plain
              >
                {{ char }}
              </van-tag>
            </div>
          </div>
        </div>

        <!-- 体质分布雷达图 -->
        <div class="constitution-chart">
          <ConstitutionRadar :data="constitutionChartData" />
        </div>

        <!-- 其他体质倾向 -->
        <div v-if="otherConstitutions.length > 0" class="other-constitutions">
          <div class="other-title">其他体质倾向</div>
          <div class="other-list">
            <div
              v-for="constitution in otherConstitutions"
              :key="constitution.type"
              class="other-item"
            >
              <span>{{ constitution.name }}</span>
              <span class="other-percentage">{{ constitution.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 舌象特征分析 -->
      <div class="tongue-features card">
        <div class="section-title">舌象特征</div>
        
        <van-grid :column-num="2" :gutter="12">
          <van-grid-item>
            <div class="feature-item">
              <div class="feature-label">舌质颜色</div>
              <div class="feature-value">{{ analysisResult.tongueAnalysis.tongueQuality.color }}</div>
            </div>
          </van-grid-item>
          
          <van-grid-item>
            <div class="feature-item">
              <div class="feature-label">舌苔颜色</div>
              <div class="feature-value">{{ analysisResult.tongueAnalysis.tongueCoating.color }}</div>
            </div>
          </van-grid-item>
          
          <van-grid-item>
            <div class="feature-item">
              <div class="feature-label">舌体厚薄</div>
              <div class="feature-value">{{ analysisResult.tongueAnalysis.tongueQuality.thickness }}</div>
            </div>
          </van-grid-item>
          
          <van-grid-item>
            <div class="feature-item">
              <div class="feature-label">苔质厚薄</div>
              <div class="feature-value">{{ analysisResult.tongueAnalysis.tongueCoating.thickness }}</div>
            </div>
          </van-grid-item>
        </van-grid>

        <!-- 异常特征 -->
        <div class="abnormal-features" v-if="hasAbnormalFeatures">
          <div class="abnormal-title">发现异常特征</div>
          <div class="abnormal-list">
            <van-tag
              v-if="analysisResult.tongueAnalysis.tongueShape.cracks"
              type="warning"
              size="mini"
            >
              舌体有裂纹
            </van-tag>
            <van-tag
              v-if="analysisResult.tongueAnalysis.tongueShape.teethMarks"
              type="warning"
              size="mini"
            >
              有齿痕
            </van-tag>
            <van-tag
              v-if="analysisResult.tongueAnalysis.tongueShape.spots"
              type="warning"
              size="mini"
            >
              有瘀斑
            </van-tag>
          </div>
        </div>
      </div>

      <!-- 健康风险提示 -->
      <div v-if="analysisResult.healthRisks.length > 0" class="health-risks card">
        <div class="section-title text-warning">
          <van-icon name="warning-o" />
          健康风险提示
        </div>
        <van-cell-group inset>
          <van-cell
            v-for="risk in analysisResult.healthRisks"
            :key="risk"
            :title="risk"
            icon="info-o"
          />
        </van-cell-group>
      </div>

      <!-- 调理建议 -->
      <div class="recommendations card">
        <div class="section-title">调理建议</div>
        
        <van-collapse v-model="activeRecommendation">
          <van-collapse-item title="饮食调理" name="diet">
            <div class="recommendation-list">
              <div
                v-for="item in analysisResult.recommendations.diet"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
          
          <van-collapse-item title="生活方式" name="lifestyle">
            <div class="recommendation-list">
              <div
                v-for="item in analysisResult.recommendations.lifestyle"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
          
          <van-collapse-item title="运动建议" name="exercise">
            <div class="recommendation-list">
              <div
                v-for="item in analysisResult.recommendations.exercise"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
          
          <van-collapse-item title="中药调理" name="herbs">
            <div class="recommendation-list">
              <div
                v-for="item in analysisResult.recommendations.herbs"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>

      <!-- 产品推荐 -->
      <div v-if="analysisResult.products.length > 0" class="product-recommendations card">
        <div class="section-title">相关产品推荐</div>
        
        <div class="product-list">
          <div
            v-for="product in analysisResult.products"
            :key="product.id"
            class="product-item"
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
              <div class="product-reason">{{ product.reason }}</div>
              <div class="product-footer">
                <span class="product-category">{{ product.category }}</span>
                <span class="product-price">{{ product.price }}</span>
              </div>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
        
        <van-button
          type="primary"
          size="large"
          round
          block
          @click="viewMoreProducts"
          class="view-more-btn"
        >
          <van-icon name="shop-o" />
          查看更多产品推荐
        </van-button>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button @click="saveResult" :loading="isSaving">
          <van-icon name="bookmark-o" />
          保存结果
        </van-button>
        
        <van-button type="primary" @click="generateReport">
          <van-icon name="description" />
          生成报告
        </van-button>
        
        <van-button @click="retakePicture">
          <van-icon name="camera-o" />
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
import { useDiagnosisStore } from '@/stores/diagnosis'
import { analyzeTongueImage, generateAnalysisReport } from '@/utils/analysis'
import { formatDate } from '@/utils/date'
import ConstitutionRadar from '@/components/Charts/ConstitutionRadar.vue'
import type { AnalysisResult } from '@/types/diagnosis'

const router = useRouter()
const route = useRoute()
const diagnosisStore = useDiagnosisStore()

const isAnalyzing = ref(false)
const analysisResult = ref<AnalysisResult | null>(null)
const tongueImage = ref('')
const timestamp = ref(Date.now())
const error = ref('')
const isSaving = ref(false)
const activeRecommendation = ref(['diet'])
const remainingTime = ref(5)

const mainConstitution = computed(() => {
  return analysisResult.value?.constitution[0]
})

const otherConstitutions = computed(() => {
  return analysisResult.value?.constitution.slice(1) || []
})

const constitutionChartData = computed(() => {
  if (!analysisResult.value) return []
  
  return analysisResult.value.constitution.map(c => ({
    label: c.name,
    value: c.percentage
  }))
})

const hasAbnormalFeatures = computed(() => {
  if (!analysisResult.value) return false
  
  const shape = analysisResult.value.tongueAnalysis.tongueShape
  return shape.cracks || shape.teethMarks || shape.spots
})

const qualityTagType = computed(() => {
  // 这里可以根据图片质量返回不同的标签类型
  return 'success' // 'success' | 'primary' | 'warning' | 'danger'
})

const qualityText = computed(() => {
  return '图片质量良好'
})

const goBack = () => {
  router.back()
}

const shareResult = () => {
  if (navigator.share && analysisResult.value) {
    const report = generateAnalysisReport(analysisResult.value)
    navigator.share({
      title: '我的舌诊分析结果',
      text: report,
      url: window.location.href
    })
  } else {
    Toast.success('已复制分析结果到剪贴板')
  }
}

const saveResult = async () => {
  if (!analysisResult.value) return
  
  try {
    isSaving.value = true
    
    const record = {
      id: Date.now().toString(),
      timestamp: timestamp.value,
      imageUrl: tongueImage.value,
      analysis: analysisResult.value
    }
    
    diagnosisStore.addDiagnosisRecord(record)
    Toast.success('分析结果已保存')
  } catch (error) {
    console.error('保存失败:', error)
    Toast.fail('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

const generateReport = () => {
  router.push({
    name: 'Reports',
    query: { from: 'analysis', id: route.params.id }
  })
}

const retakePicture = () => {
  router.push('/camera')
}

const openProductLink = (link: string) => {
  window.open(link, '_blank')
}

const viewMoreProducts = () => {
  router.push('/products')
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
    diagnosisStore.setCurrentAnalysis(result)
    
    clearInterval(timer)
  } catch (err) {
    console.error('分析失败:', err)
    error.value = '分析失败，请重试'
  } finally {
    isAnalyzing.value = false
  }
}

onMounted(() => {
  // 检查是否有现有的分析结果
  if (diagnosisStore.currentAnalysis) {
    analysisResult.value = diagnosisStore.currentAnalysis
    // 尝试获取图片
    const imageId = route.params.id as string
    const imageUrl = route.query.imageUrl as string || localStorage.getItem(`tcm-image-${imageId}`)
    if (imageUrl) {
      tongueImage.value = imageUrl
    }
  } else {
    startAnalysis()
  }
})
</script>

<style scoped>
.analysis-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 80px;
}

.analyzing-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.analyzing-content {
  text-align: center;
}

.analyzing-tips {
  margin-top: 24px;
  color: #666;
  line-height: 1.6;
}

.analyzing-tips p {
  margin: 8px 0;
}

.analysis-content {
  padding: 16px;
}

.image-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.image-info {
  flex: 1;
}

.analysis-date {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.constitution-section {
  margin-bottom: 16px;
}

.main-constitution {
  margin-bottom: 24px;
}

.constitution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.constitution-header h3 {
  margin: 0;
  font-size: 20px;
  color: #4CAF50;
}

.constitution-percentage {
  font-size: 18px;
  font-weight: 600;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.constitution-desc {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.6;
}

.characteristics-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #333;
}

.characteristics-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.constitution-chart {
  margin: 24px 0;
}

.other-constitutions {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.other-title {
  font-weight: 500;
  margin-bottom: 12px;
  color: #333;
}

.other-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.other-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.other-percentage {
  color: #666;
  font-size: 14px;
}

.tongue-features {
  margin-bottom: 16px;
}

.feature-item {
  text-align: center;
  padding: 12px;
}

.feature-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.feature-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.abnormal-features {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.abnormal-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #e6a23c;
}

.abnormal-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.health-risks {
  margin-bottom: 16px;
}

.recommendations {
  margin-bottom: 16px;
}

.recommendation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.product-recommendations {
  margin-bottom: 16px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.product-item:active {
  background: #f0f0f0;
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.product-reason {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-category {
  font-size: 12px;
  color: #999;
}

.product-price {
  font-weight: 500;
  color: #f56c6c;
}

.view-more-btn {
  margin-top: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.action-buttons .van-button {
  flex: 1;
}

.text-warning {
  color: #e6a23c;
}
</style>