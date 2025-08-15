<template>
  <div class="home-page">
    <van-nav-bar title="中医舌诊助手" fixed placeholder>
      <template #right>
        <van-icon name="setting-o" @click="$router.push('/profile')" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 欢迎卡片 -->
      <div class="welcome-card card">
        <div class="welcome-content">
          <h2>欢迎使用舌诊助手</h2>
          <p>专业中医舌诊分析，智能体质辨识</p>
          <van-button
            type="primary"
            size="large"
            round
            @click="startDiagnosis"
            class="start-btn"
          >
            <van-icon name="camera-o" />
            开始舌诊
          </van-button>
        </div>
        <div class="welcome-image">
          <van-image
            src="/src/assets/images/tongue-demo.png"
            alt="舌诊示意图"
            fit="contain"
            :show-error="false"
            :show-loading="false"
          />
        </div>
      </div>

      <!-- 快捷功能 -->
      <div class="quick-actions">
        <div class="section-title">快捷功能</div>
        <van-grid :column-num="3" :gutter="16">
          <van-grid-item
            v-for="action in quickActions"
            :key="action.id"
            :to="action.path"
            class="action-item"
          >
            <van-icon :name="action.icon" size="28" :color="action.color" />
            <span class="action-text">{{ action.title }}</span>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 最近诊断 -->
      <div class="recent-diagnosis" v-if="recentRecords.length > 0">
        <div class="section-title flex-between">
          <span>最近诊断</span>
          <van-button
            type="primary"
            size="mini"
            plain
            @click="$router.push('/history')"
          >
            查看全部
          </van-button>
        </div>
        
        <div class="diagnosis-list">
          <div
            v-for="record in recentRecords"
            :key="record.id"
            class="diagnosis-item card"
            @click="viewDiagnosis(record)"
          >
            <div class="diagnosis-info">
              <div class="diagnosis-date">
                {{ formatDate(record.timestamp) }}
              </div>
              <div class="diagnosis-result">
                {{ getMainConstitution(record.analysis.constitution) }}
              </div>
            </div>
            <van-image
              :src="record.imageUrl"
              width="60"
              height="60"
              round
              fit="cover"
            />
          </div>
        </div>
      </div>

      <!-- 健康提示 -->
      <div class="health-tips card">
        <div class="section-title">今日健康提示</div>
        <van-swipe :autoplay="5000" indicator-color="#4CAF50">
          <van-swipe-item v-for="tip in healthTips" :key="tip.id">
            <div class="tip-content">
              <van-icon name="bulb-o" color="#4CAF50" size="20" />
              <p>{{ tip.content }}</p>
            </div>
          </van-swipe-item>
        </van-swipe>
      </div>
    </div>

    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" fixed>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="camera-o" to="/camera">拍照</van-tabbar-item>
      <van-tabbar-item icon="records" to="/history">历史</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDiagnosisStore } from '@/stores/diagnosis'
import { formatDate } from '@/utils/date'
import type { DiagnosisRecord } from '@/types/diagnosis'

const router = useRouter()
const diagnosisStore = useDiagnosisStore()
const activeTab = ref(0)

const quickActions = ref([
  {
    id: 1,
    title: '舌象拍照',
    icon: 'camera-o',
    color: '#4CAF50',
    path: '/camera'
  },
  {
    id: 2,
    title: '知识库',
    icon: 'book-o',
    color: '#2196F3',
    path: '/knowledge'
  },
  {
    id: 3,
    title: '健康报告',
    icon: 'chart-trending-o',
    color: '#FF9800',
    path: '/reports'
  },
  {
    id: 4,
    title: '产品推荐',
    icon: 'shop-o',
    color: '#f44336',
    path: '/products'
  },
  {
    id: 5,
    title: '历史记录',
    icon: 'records',
    color: '#9C27B0',
    path: '/history'
  },
  {
    id: 6,
    title: '体质测试',
    icon: 'medal-o',
    color: '#673AB7',
    path: '/constitution-test'
  }
])

const healthTips = ref([
  { id: 1, content: '早上起床后观察舌苔，是了解身体状况的好方法' },
  { id: 2, content: '舌苔厚腻提示脾胃功能不佳，建议清淡饮食' },
  { id: 3, content: '舌红少苔可能是阴虚体质，需要滋阴润燥' },
  { id: 4, content: '定期舌诊有助于及早发现身体变化' }
])

const recentRecords = computed(() => {
  return diagnosisStore.diagnosisHistory.slice(0, 3)
})

const startDiagnosis = () => {
  router.push('/camera')
}

const viewDiagnosis = (record: DiagnosisRecord) => {
  diagnosisStore.setCurrentAnalysis(record.analysis)
  router.push(`/analysis/${record.id}`)
}

const getMainConstitution = (constitutions: any[]) => {
  if (!constitutions || constitutions.length === 0) return '未知体质'
  return constitutions[0]?.name || '未知体质'
}

onMounted(() => {
  diagnosisStore.loadHistory()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  overflow: hidden;
  position: relative;
}

.welcome-content {
  flex: 1;
}

.welcome-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0 0 20px 0;
  opacity: 0.9;
  font-size: 14px;
}

.start-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.welcome-image {
  width: 100px;
  height: 100px;
  opacity: 0.8;
}

.quick-actions {
  margin-bottom: 24px;
}

.action-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.action-item:active {
  transform: scale(0.95);
}

.action-text {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.recent-diagnosis {
  margin-bottom: 24px;
}

.diagnosis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diagnosis-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.diagnosis-item:active {
  transform: scale(0.98);
}

.diagnosis-info {
  flex: 1;
}

.diagnosis-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.diagnosis-result {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.health-tips {
  margin-bottom: 80px;
}

.tip-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px;
}

.tip-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
}

.van-tabbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}
</style>