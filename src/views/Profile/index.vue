<template>
  <div class="profile-page">
    <van-nav-bar title="个人中心" fixed placeholder>
      <template #right>
        <van-icon name="setting-o" @click="goToSettings" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 用户信息卡片 -->
      <div class="user-info card">
        <div class="user-avatar">
          <van-image
            :src="userInfo.avatar || '/src/assets/images/default-avatar.png'"
            width="80"
            height="80"
            round
            fit="cover"
            @click="changeAvatar"
          />
          <div class="avatar-edit">
            <van-icon name="camera-o" size="16" />
          </div>
        </div>
        
        <div class="user-details">
          <div class="user-name" @click="editUserInfo">
            {{ userInfo.name || '未设置昵称' }}
            <van-icon name="edit" size="14" />
          </div>
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-number">{{ totalDiagnoses }}</span>
              <span class="stat-label">总诊断</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ continuousDays }}</span>
              <span class="stat-label">连续打卡</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">{{ averageScore }}</span>
              <span class="stat-label">平均分数</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 健康概览 -->
      <div class="health-overview card">
        <div class="overview-header">
          <div class="overview-title">健康概览</div>
          <van-button size="mini" @click="$router.push('/reports')">
            查看详情
          </van-button>
        </div>
        
        <div class="health-summary">
          <div class="main-constitution">
            <div class="constitution-info">
              <span class="constitution-name">{{ mainConstitution }}</span>
              <span class="constitution-desc">主要体质类型</span>
            </div>
            <div class="constitution-chart">
              <HealthScoreCircle :score="currentHealthScore" :size="60" />
            </div>
          </div>
          
          <div class="recent-trend">
            <div class="trend-item">
              <span class="trend-label">最近诊断</span>
              <span class="trend-value">{{ lastDiagnosisDate }}</span>
            </div>
            <div class="trend-item">
              <span class="trend-label">健康趋势</span>
              <span class="trend-value" :class="trendClass">{{ healthTrend }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能菜单 -->
      <div class="feature-menu">
        <van-cell-group inset>
          <van-cell
            v-for="menu in menuItems"
            :key="menu.id"
            :title="menu.title"
            :icon="menu.icon"
            is-link
            @click="handleMenuClick(menu)"
          >
            <template #right-icon>
              <van-badge 
                v-if="menu.badge" 
                :content="menu.badge"
                :dot="menu.dot"
              />
              <van-icon name="arrow" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 数据统计 -->
      <div class="data-stats card">
        <div class="section-title">使用统计</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <van-icon name="calendar-o" color="#4CAF50" size="24" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ thisWeekDiagnoses }}</div>
              <div class="stat-label">本周诊断</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <van-icon name="chart-trending-o" color="#2196F3" size="24" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ thisMonthDiagnoses }}</div>
              <div class="stat-label">本月诊断</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <van-icon name="bookmark-o" color="#FF9800" size="24" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ collectionsCount }}</div>
              <div class="stat-label">知识收藏</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <van-icon name="medal-o" color="#E91E63" size="24" />
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ achievementsCount }}</div>
              <div class="stat-label">获得成就</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 成就系统 -->
      <div class="achievements card">
        <div class="section-title">我的成就</div>
        <div class="achievements-list">
          <div
            v-for="achievement in recentAchievements"
            :key="achievement.id"
            class="achievement-item"
            :class="{ unlocked: achievement.unlocked }"
          >
            <div class="achievement-icon">
              <van-icon :name="achievement.icon" :size="32" />
            </div>
            <div class="achievement-info">
              <div class="achievement-name">{{ achievement.name }}</div>
              <div class="achievement-desc">{{ achievement.description }}</div>
              <div v-if="achievement.unlocked" class="achievement-date">
                {{ formatDate(achievement.unlockedAt) }}
              </div>
            </div>
            <div v-if="!achievement.unlocked" class="achievement-progress">
              <van-progress
                :percentage="achievement.progress"
                stroke-width="4"
                color="#4CAF50"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 设置入口 -->
      <div class="settings-section">
        <van-cell-group inset>
          <van-cell
            title="设置与隐私"
            icon="setting-o"
            is-link
            @click="goToSettings"
          />
          <van-cell
            title="帮助与反馈"
            icon="question-o"
            is-link
            @click="showHelp"
          />
          <van-cell
            title="关于我们"
            icon="info-o"
            is-link
            @click="showAbout"
          />
        </van-cell-group>
      </div>
    </div>

    <!-- 用户信息编辑弹窗 -->
    <van-popup
      v-model:show="showUserEdit"
      position="center"
      round
      :style="{ width: '90%' }"
    >
      <div class="user-edit-dialog">
        <div class="edit-header">
          <h3>编辑个人信息</h3>
          <van-icon name="cross" @click="showUserEdit = false" />
        </div>
        
        <van-form @submit="saveUserInfo">
          <van-field
            v-model="editUserInfo.name"
            label="昵称"
            placeholder="请输入昵称"
            required
          />
          
          <van-field
            v-model="editUserInfo.age"
            label="年龄"
            type="number"
            placeholder="请输入年龄"
          />
          
          <van-field
            v-model="editUserInfo.gender"
            label="性别"
            readonly
            is-link
            @click="showGenderPicker = true"
          />
          
          <van-field
            v-model="editUserInfo.phone"
            label="手机号"
            placeholder="请输入手机号"
          />
          
          <div class="edit-actions">
            <van-button @click="showUserEdit = false">取消</van-button>
            <van-button type="primary" native-type="submit">保存</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <!-- 性别选择器 -->
    <van-popup v-model:show="showGenderPicker" position="bottom" round>
      <van-picker
        :columns="genderColumns"
        @confirm="onGenderConfirm"
        @cancel="showGenderPicker = false"
      />
    </van-popup>

    <!-- 头像选择菜单 -->
    <van-action-sheet
      v-model:show="showAvatarActions"
      :actions="avatarActions"
      @select="handleAvatarAction"
      cancel-text="取消"
    />

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import { useDiagnosisStore } from '@/stores/diagnosis'
import { useAppStore } from '@/stores/app'
import { formatDate, isThisWeek, isThisMonth } from '@/utils/date'
import HealthScoreCircle from '@/components/Charts/HealthScoreCircle.vue'

const router = useRouter()
const diagnosisStore = useDiagnosisStore()
const appStore = useAppStore()
const activeTab = ref(3)

const showUserEdit = ref(false)
const showGenderPicker = ref(false)
const showAvatarActions = ref(false)

const userInfo = ref({
  name: '',
  avatar: '',
  age: '',
  gender: '',
  phone: '',
  joinDate: Date.now()
})

const editUserInfo = ref({ ...userInfo.value })

const genderColumns = ['男', '女', '不便透露']

const avatarActions = [
  { name: '拍照', icon: 'camera-o' },
  { name: '从相册选择', icon: 'photo-o' },
  { name: '删除头像', icon: 'delete-o', color: '#f56c6c' }
]

const menuItems = ref([
  {
    id: 1,
    title: '我的收藏',
    icon: 'star-o',
    badge: null,
    dot: false
  },
  {
    id: 2,
    title: '体质测试',
    icon: 'user-circle-o',
    badge: null,
    dot: false
  },
  {
    id: 3,
    title: '健康提醒',
    icon: 'bell-o',
    badge: null,
    dot: true
  },
  {
    id: 4,
    title: '数据导出',
    icon: 'description',
    badge: null,
    dot: false
  },
  {
    id: 5,
    title: '邀请朋友',
    icon: 'friends-o',
    badge: 'NEW',
    dot: false
  }
])

const recentAchievements = ref([
  {
    id: 1,
    name: '初次尝试',
    description: '完成第一次舌诊',
    icon: 'medal',
    unlocked: true,
    unlockedAt: Date.now() - 86400000,
    progress: 100
  },
  {
    id: 2,
    name: '坚持不懈',
    description: '连续7天进行舌诊',
    icon: 'calendar',
    unlocked: false,
    progress: 42
  },
  {
    id: 3,
    name: '知识达人',
    description: '收藏10篇知识文章',
    icon: 'bookmark',
    unlocked: false,
    progress: 60
  }
])

// 计算属性
const totalDiagnoses = computed(() => diagnosisStore.diagnosisHistory.length)

const thisWeekDiagnoses = computed(() => {
  return diagnosisStore.diagnosisHistory.filter(
    record => isThisWeek(record.timestamp)
  ).length
})

const thisMonthDiagnoses = computed(() => {
  return diagnosisStore.diagnosisHistory.filter(
    record => isThisMonth(record.timestamp)
  ).length
})

const continuousDays = computed(() => {
  // 简化的连续天数计算
  return Math.min(totalDiagnoses.value, 7)
})

const averageScore = computed(() => {
  if (totalDiagnoses.value === 0) return 0
  
  const totalScore = diagnosisStore.diagnosisHistory.reduce((sum, record) => {
    return sum + calculateHealthScore(record)
  }, 0)
  
  return Math.round(totalScore / totalDiagnoses.value)
})

const mainConstitution = computed(() => {
  if (totalDiagnoses.value === 0) return '暂无数据'
  
  const constitutionCount = new Map<string, number>()
  
  diagnosisStore.diagnosisHistory.forEach(record => {
    const main = record.analysis.constitution[0]
    if (main) {
      constitutionCount.set(
        main.name,
        (constitutionCount.get(main.name) || 0) + 1
      )
    }
  })
  
  let mostCommon = '暂无数据'
  let maxCount = 0
  
  constitutionCount.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count
      mostCommon = name
    }
  })
  
  return mostCommon
})

const currentHealthScore = computed(() => {
  if (totalDiagnoses.value === 0) return 0
  
  const latestRecord = diagnosisStore.diagnosisHistory[0]
  return latestRecord ? calculateHealthScore(latestRecord) : 0
})

const lastDiagnosisDate = computed(() => {
  if (totalDiagnoses.value === 0) return '暂无记录'
  
  const latest = diagnosisStore.diagnosisHistory[0]
  return formatDate(latest.timestamp)
})

const healthTrend = computed(() => {
  if (totalDiagnoses.value < 2) return '数据不足'
  
  const recent = diagnosisStore.diagnosisHistory.slice(0, 2)
  const current = calculateHealthScore(recent[0])
  const previous = calculateHealthScore(recent[1])
  
  if (current > previous) return '上升'
  if (current < previous) return '下降'
  return '稳定'
})

const trendClass = computed(() => {
  const trend = healthTrend.value
  if (trend === '上升') return 'trend-up'
  if (trend === '下降') return 'trend-down'
  return 'trend-stable'
})

const collectionsCount = computed(() => {
  const collections = JSON.parse(
    localStorage.getItem('tcm-knowledge-collections') || '[]'
  )
  return collections.length
})

const achievementsCount = computed(() => {
  return recentAchievements.value.filter(a => a.unlocked).length
})

// 方法
const calculateHealthScore = (record: any): number => {
  const mainConstitution = record.analysis.constitution[0]
  let score = 70
  
  if (mainConstitution?.type === 'ping_he') {
    score += 20
  } else if (mainConstitution?.percentage > 80) {
    score -= 10
  }
  
  score -= record.analysis.healthRisks.length * 5
  
  const shape = record.analysis.tongueAnalysis.tongueShape
  if (shape.cracks || shape.teethMarks || shape.spots) {
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

const editUserInfo_func = () => {
  editUserInfo.value = { ...userInfo.value }
  showUserEdit.value = true
}

const saveUserInfo = () => {
  userInfo.value = { ...editUserInfo.value }
  localStorage.setItem('tcm-user-info', JSON.stringify(userInfo.value))
  showUserEdit.value = false
  Toast.success('个人信息已保存')
}

const onGenderConfirm = ({ selectedValues }: any) => {
  editUserInfo.value.gender = selectedValues[0]
  showGenderPicker.value = false
}

const changeAvatar = () => {
  showAvatarActions.value = true
}

const handleAvatarAction = (action: any) => {
  showAvatarActions.value = false
  
  switch (action.name) {
    case '拍照':
      // 调用相机
      Toast('拍照功能开发中')
      break
    case '从相册选择':
      // 选择相册
      Toast('相册选择功能开发中')
      break
    case '删除头像':
      userInfo.value.avatar = ''
      localStorage.setItem('tcm-user-info', JSON.stringify(userInfo.value))
      Toast.success('头像已删除')
      break
  }
}

const handleMenuClick = (menu: any) => {
  switch (menu.id) {
    case 1: // 我的收藏
      showMyCollections()
      break
    case 2: // 体质测试
      router.push('/constitution-test')
      break
    case 3: // 健康提醒
      showHealthReminder()
      break
    case 4: // 数据导出
      exportData()
      break
    case 5: // 邀请朋友
      inviteFriends()
      break
  }
}

const showMyCollections = () => {
  Toast('收藏功能开发中')
}

const showHealthReminder = () => {
  Toast('健康提醒功能开发中')
}

const exportData = () => {
  Toast('数据导出功能开发中')
}

const inviteFriends = () => {
  const inviteText = `我在使用中医舌诊助手，通过舌诊了解自己的体质，非常实用！推荐给你：${window.location.origin}`
  
  if (navigator.share) {
    navigator.share({
      title: '中医舌诊助手',
      text: inviteText
    }).catch(() => {
      navigator.clipboard.writeText(inviteText)
      Toast.success('邀请链接已复制到剪贴板')
    })
  } else {
    navigator.clipboard.writeText(inviteText)
    Toast.success('邀请链接已复制到剪贴板')
  }
}

const goToSettings = () => {
  Toast('设置页面开发中')
}

const showHelp = () => {
  Toast('帮助页面开发中')
}

const showAbout = () => {
  Toast('关于页面开发中')
}

// 生命周期
onMounted(() => {
  diagnosisStore.loadHistory()
  
  // 加载用户信息
  const savedUserInfo = localStorage.getItem('tcm-user-info')
  if (savedUserInfo) {
    userInfo.value = JSON.parse(savedUserInfo)
  }
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 60px;
}

.content-wrapper {
  padding: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  padding: 20px;
}

.user-avatar {
  position: relative;
  cursor: pointer;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 24px;
  height: 24px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
}

.user-details {
  flex: 1;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  cursor: pointer;
}

.user-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  color: #4CAF50;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.health-overview {
  margin-bottom: 16px;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.overview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.health-summary {
  display: flex;
  gap: 20px;
  align-items: center;
}

.main-constitution {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.constitution-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.constitution-name {
  font-size: 18px;
  font-weight: 600;
  color: #4CAF50;
}

.constitution-desc {
  font-size: 12px;
  color: #666;
}

.recent-trend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.trend-label {
  color: #666;
}

.trend-value {
  font-weight: 500;
}

.trend-up {
  color: #4CAF50;
}

.trend-down {
  color: #f56c6c;
}

.trend-stable {
  color: #666;
}

.feature-menu {
  margin-bottom: 16px;
}

.data-stats {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-card .stat-number {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.stat-card .stat-label {
  font-size: 12px;
  color: #666;
}

.achievements {
  margin-bottom: 16px;
}

.achievements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.achievement-item.unlocked {
  opacity: 1;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.achievement-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
}

.achievement-info {
  flex: 1;
}

.achievement-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.achievement-desc {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.achievement-date {
  font-size: 10px;
  opacity: 0.6;
}

.achievement-progress {
  width: 60px;
}

.settings-section {
  margin-bottom: 16px;
}

.user-edit-dialog {
  padding: 20px;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.edit-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.edit-actions .van-button {
  flex: 1;
}
</style>