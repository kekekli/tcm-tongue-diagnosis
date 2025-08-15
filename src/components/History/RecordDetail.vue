<template>
  <div class="record-detail">
    <van-nav-bar
      title="诊断详情"
      left-arrow
      @click-left="$emit('close')"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="more-o" @click="showActions = true" />
      </template>
    </van-nav-bar>

    <div class="detail-content">
      <!-- 基本信息 -->
      <div class="basic-info card">
        <div class="info-header">
          <div class="record-date">
            {{ formatDate(record.timestamp) }}
          </div>
          <div class="health-score">
            <HealthScoreCircle 
              :score="healthScore" 
              :size="80"
            />
          </div>
        </div>
        
        <div class="tongue-image">
          <van-image
            :src="record.imageUrl"
            width="100%"
            height="200"
            fit="contain"
            @click="previewImage"
          />
        </div>
      </div>

      <!-- 体质分析 -->
      <div class="constitution-analysis card">
        <div class="section-title">体质分析结果</div>
        
        <div class="main-constitution">
          <div class="constitution-card">
            <div class="constitution-header">
              <h3>{{ mainConstitution.name }}</h3>
              <div class="constitution-percentage">
                {{ mainConstitution.percentage }}%
              </div>
            </div>
            <p class="constitution-desc">{{ mainConstitution.description }}</p>
            
            <div class="constitution-characteristics">
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
        </div>

        <!-- 体质分布雷达图 -->
        <div class="constitution-radar">
          <ConstitutionRadar :data="radarData" />
        </div>

        <!-- 其他体质 -->
        <div v-if="otherConstitutions.length > 0" class="other-constitutions">
          <div class="other-title">其他体质倾向</div>
          <div class="other-list">
            <div
              v-for="constitution in otherConstitutions"
              :key="constitution.type"
              class="other-item"
            >
              <span class="other-name">{{ constitution.name }}</span>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${constitution.percentage}%` }"
                ></div>
              </div>
              <span class="other-percentage">{{ constitution.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 舌象特征 -->
      <div class="tongue-features card">
        <div class="section-title">舌象特征分析</div>
        
        <div class="features-grid">
          <div class="feature-category">
            <h4>舌质特征</h4>
            <div class="feature-items">
              <div class="feature-item">
                <span class="feature-label">颜色</span>
                <span class="feature-value">{{ tongueAnalysis.tongueQuality.color }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-label">厚薄</span>
                <span class="feature-value">{{ tongueAnalysis.tongueQuality.thickness }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-label">润燥</span>
                <span class="feature-value">{{ tongueAnalysis.tongueQuality.moisture }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-label">质地</span>
                <span class="feature-value">{{ tongueAnalysis.tongueQuality.texture }}</span>
              </div>
            </div>
          </div>

          <div class="feature-category">
            <h4>舌苔特征</h4>
            <div class="feature-items">
              <div class="feature-item">
                <span class="feature-label">颜色</span>
                <span class="feature-value">{{ tongueAnalysis.tongueCoating.color }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-label">厚薄</span>
                <span class="feature-value">{{ tongueAnalysis.tongueCoating.thickness }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-label">分布</span>
                <span class="feature-value">{{ tongueAnalysis.tongueCoating.distribution }}</span>
              </div>
              <div class="feature-item">
                <span class="feature-label">质地</span>
                <span class="feature-value">{{ tongueAnalysis.tongueCoating.texture }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 异常特征 -->
        <div v-if="abnormalFeatures.length > 0" class="abnormal-features">
          <div class="abnormal-title">
            <van-icon name="warning-o" color="#e6a23c" />
            发现异常特征
          </div>
          <div class="abnormal-list">
            <van-tag
              v-for="feature in abnormalFeatures"
              :key="feature"
              type="warning"
              size="small"
            >
              {{ feature }}
            </van-tag>
          </div>
        </div>
      </div>

      <!-- 健康风险 -->
      <div v-if="record.analysis.healthRisks.length > 0" class="health-risks card">
        <div class="section-title text-warning">
          <van-icon name="warning-o" />
          健康风险提示
        </div>
        <div class="risks-list">
          <div
            v-for="risk in record.analysis.healthRisks"
            :key="risk"
            class="risk-item"
          >
            <van-icon name="info-o" color="#e6a23c" size="16" />
            <span>{{ risk }}</span>
          </div>
        </div>
      </div>

      <!-- 调理建议 -->
      <div class="recommendations card">
        <div class="section-title">调理建议</div>
        
        <van-collapse v-model="activeRecommendation">
          <van-collapse-item title="饮食调理" name="diet">
            <div class="recommendation-content">
              <div
                v-for="item in record.analysis.recommendations.diet"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
          
          <van-collapse-item title="生活方式" name="lifestyle">
            <div class="recommendation-content">
              <div
                v-for="item in record.analysis.recommendations.lifestyle"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
          
          <van-collapse-item title="运动建议" name="exercise">
            <div class="recommendation-content">
              <div
                v-for="item in record.analysis.recommendations.exercise"
                :key="item"
                class="recommendation-item"
              >
                <van-icon name="success" color="#4CAF50" />
                <span>{{ item }}</span>
              </div>
            </div>
          </van-collapse-item>
          
          <van-collapse-item title="中药调理" name="herbs">
            <div class="recommendation-content">
              <div
                v-for="item in record.analysis.recommendations.herbs"
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
      <div v-if="record.analysis.products.length > 0" class="products card">
        <div class="section-title">相关产品推荐</div>
        <div class="products-list">
          <div
            v-for="product in record.analysis.products"
            :key="product.id"
            class="product-item"
            @click="openProduct(product)"
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
      </div>

      <!-- 备注信息 -->
      <div class="notes-section card">
        <div class="section-title">备注信息</div>
        <div v-if="record.notes" class="notes-content">
          {{ record.notes }}
        </div>
        <div v-else class="notes-empty">
          <span>暂无备注</span>
          <van-button size="small" @click="$emit('add-note', record.id, '')">
            添加备注
          </van-button>
        </div>
      </div>
    </div>

    <!-- 操作菜单 -->
    <van-action-sheet
      v-model:show="showActions"
      :actions="actions"
      @select="handleAction"
      cancel-text="取消"
    />

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showImagePreview"
      :images="[record.imageUrl]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Toast } from 'vant'
import { formatDate } from '@/utils/date'
import ConstitutionRadar from '@/components/Charts/ConstitutionRadar.vue'
import HealthScoreCircle from '@/components/Charts/HealthScoreCircle.vue'
import type { DiagnosisRecord } from '@/types/diagnosis'

interface Props {
  record: DiagnosisRecord
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  delete: [recordId: string]
  'add-note': [recordId: string, note: string]
}>()

const showActions = ref(false)
const showImagePreview = ref(false)
const activeRecommendation = ref(['diet'])

const actions = [
  { name: '生成报告', icon: 'description' },
  { name: '分享结果', icon: 'share-o' },
  { name: '添加备注', icon: 'comment-o' },
  { name: '删除记录', icon: 'delete-o', color: '#f56c6c' }
]

const tongueAnalysis = computed(() => props.record.analysis.tongueAnalysis)

const mainConstitution = computed(() => {
  return props.record.analysis.constitution[0]
})

const otherConstitutions = computed(() => {
  return props.record.analysis.constitution.slice(1)
})

const radarData = computed(() => {
  return props.record.analysis.constitution.map(c => ({
    label: c.name,
    value: c.percentage
  }))
})

const abnormalFeatures = computed(() => {
  const features = []
  const shape = tongueAnalysis.value.tongueShape
  
  if (shape.cracks) features.push('舌体有裂纹')
  if (shape.teethMarks) features.push('有齿痕')
  if (shape.spots) features.push('有瘀斑')
  
  return features
})

const healthScore = computed(() => {
  // 简化的健康评分计算
  let score = 70
  
  if (mainConstitution.value?.type === 'ping_he') {
    score += 20
  } else if (mainConstitution.value?.percentage > 80) {
    score -= 10
  }
  
  score -= props.record.analysis.healthRisks.length * 5
  
  if (abnormalFeatures.value.length > 0) {
    score -= abnormalFeatures.value.length * 3
  }
  
  return Math.max(0, Math.min(100, score))
})

const previewImage = () => {
  showImagePreview.value = true
}

const handleAction = (action: any) => {
  showActions.value = false
  
  switch (action.name) {
    case '生成报告':
      generateReport()
      break
    case '分享结果':
      shareResult()
      break
    case '添加备注':
      addNote()
      break
    case '删除记录':
      deleteRecord()
      break
  }
}

const generateReport = () => {
  // 跳转到报告页面
  Toast('正在生成报告...')
}

const shareResult = () => {
  const shareText = `我的舌诊结果：
主要体质：${mainConstitution.value?.name}
健康评分：${healthScore.value}分
诊断时间：${formatDate(props.record.timestamp)}
#中医舌诊 #健康管理`

  if (navigator.share) {
    navigator.share({
      title: '舌诊结果分享',
      text: shareText
    }).catch(() => {
      navigator.clipboard.writeText(shareText)
      Toast.success('内容已复制到剪贴板')
    })
  } else {
    navigator.clipboard.writeText(shareText)
    Toast.success('内容已复制到剪贴板')
  }
}

const addNote = () => {
  // 触发添加备注事件
  const currentNote = props.record.notes || ''
  // 这里可以打开备注编辑界面
  Toast('请在历史记录页面添加备注')
}

const deleteRecord = () => {
  // 触发删除事件
  Toast('请在历史记录页面删除记录')
}

const openProduct = (product: any) => {
  window.open(product.taobaoLink, '_blank')
}
</script>

<style scoped>
.record-detail {
  height: 100vh;
  background: #f8f9fa;
  overflow-y: auto;
}

.detail-content {
  padding: 16px;
  padding-bottom: 80px;
}

.basic-info {
  margin-bottom: 16px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.record-date {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.tongue-image {
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
}

.constitution-analysis {
  margin-bottom: 16px;
}

.constitution-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.constitution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.constitution-header h3 {
  margin: 0;
  font-size: 18px;
  color: #4CAF50;
}

.constitution-percentage {
  font-size: 16px;
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

.constitution-radar {
  margin: 20px 0;
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
  gap: 12px;
}

.other-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.other-name {
  min-width: 80px;
  font-size: 14px;
  color: #333;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.other-percentage {
  min-width: 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.tongue-features {
  margin-bottom: 16px;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.feature-category h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.feature-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.feature-label {
  font-size: 14px;
  color: #666;
}

.feature-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.abnormal-features {
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.abnormal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #e6a23c;
  margin-bottom: 12px;
}

.abnormal-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.health-risks {
  margin-bottom: 16px;
}

.text-warning {
  color: #e6a23c;
}

.risks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.recommendations {
  margin-bottom: 16px;
}

.recommendation-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.products {
  margin-bottom: 16px;
}

.products-list {
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

.notes-section {
  margin-bottom: 16px;
}

.notes-content {
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  color: #333;
  line-height: 1.6;
}

.notes-empty {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  color: #999;
}
</style>