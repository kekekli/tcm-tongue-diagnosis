<template>
  <div class="history-page">
    <van-nav-bar title="诊断历史" fixed placeholder>
      <template #right>
        <van-dropdown-menu>
          <van-dropdown-item
            v-model="sortType"
            :options="sortOptions"
            @change="handleSortChange"
          />
        </van-dropdown-menu>
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 统计概览 -->
      <div class="stats-section card">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ totalRecords }}</div>
            <div class="stat-label">总诊断</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ thisMonthRecords }}</div>
            <div class="stat-label">本月诊断</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ averageScore }}</div>
            <div class="stat-label">平均分数</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ mainConstitutionType }}</div>
            <div class="stat-label">主要体质</div>
          </div>
        </div>
      </div>

      <!-- 筛选选项 -->
      <div class="filter-section">
        <van-tabs v-model:active="activeFilter" sticky>
          <van-tab title="全部" name="all"></van-tab>
          <van-tab title="本周" name="week"></van-tab>
          <van-tab title="本月" name="month"></van-tab>
          <van-tab title="最近3个月" name="quarter"></van-tab>
        </van-tabs>
      </div>

      <!-- 历史记录列表 -->
      <div class="records-section">
        <div v-if="filteredRecords.length > 0" class="records-list">
          <div
            v-for="record in paginatedRecords"
            :key="record.id"
            class="record-item card"
            @click="viewRecord(record)"
          >
            <div class="record-image">
              <van-image
                :src="record.imageUrl"
                width="80"
                height="80"
                fit="cover"
                round
              />
            </div>
            
            <div class="record-content">
              <div class="record-header">
                <div class="record-date">
                  {{ formatDate(record.timestamp) }}
                </div>
                <div class="record-actions">
                  <van-icon name="more-o" @click.stop="showRecordActions(record)" />
                </div>
              </div>
              
              <div class="record-info">
                <div class="constitution-info">
                  <span class="constitution-name">
                    {{ getMainConstitution(record) }}
                  </span>
                  <span class="constitution-percentage">
                    {{ getMainConstitutionPercentage(record) }}%
                  </span>
                </div>
                
                <div class="health-score">
                  <van-icon name="chart-trending-o" size="14" />
                  <span>健康评分：{{ getHealthScore(record) }}分</span>
                </div>
              </div>
              
              <div class="record-features">
                <div class="tongue-features">
                  <van-tag size="mini" type="primary">
                    {{ record.analysis.tongueAnalysis.tongueQuality.color }}质
                  </van-tag>
                  <van-tag size="mini" type="success">
                    {{ record.analysis.tongueAnalysis.tongueCoating.color }}苔
                  </van-tag>
                  <van-tag
                    v-if="hasAbnormalFeatures(record)"
                    size="mini"
                    type="warning"
                  >
                    异常特征
                  </van-tag>
                </div>
              </div>
              
              <div v-if="record.notes" class="record-notes">
                <van-icon name="comment-o" size="12" />
                <span>{{ record.notes }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <van-empty
          v-else
          image="search"
          :description="getEmptyDescription()"
        >
          <van-button
            type="primary"
            size="small"
            @click="$router.push('/camera')"
          >
            开始第一次诊断
          </van-button>
        </van-empty>

        <!-- 加载更多 -->
        <div 
          v-if="filteredRecords.length > paginatedRecords.length"
          class="load-more"
        >
          <van-button
            @click="loadMore"
            :loading="isLoadingMore"
            plain
            block
          >
            加载更多记录
          </van-button>
        </div>
      </div>

      <!-- 体质趋势图表 -->
      <div v-if="filteredRecords.length > 1" class="trend-section card">
        <div class="section-title">体质变化趋势</div>
        <ConstitutionTrendChart :records="filteredRecords" />
      </div>

      <!-- 月度统计 -->
      <div v-if="totalRecords > 0" class="monthly-stats card">
        <div class="section-title">月度统计</div>
        <MonthlyStatsChart :records="allRecords" />
      </div>
    </div>

    <!-- 记录详情弹窗 -->
    <van-popup
      v-model:show="showRecordDetail"
      position="right"
      :style="{ width: '100%', height: '100%' }"
    >
      <RecordDetail
        v-if="selectedRecord"
        :record="selectedRecord"
        @close="closeRecordDetail"
        @delete="deleteRecord"
        @add-note="addNoteToRecord"
      />
    </van-popup>

    <!-- 记录操作菜单 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="recordActions"
      @select="handleRecordAction"
      cancel-text="取消"
    />

    <!-- 添加备注弹窗 -->
    <van-popup
      v-model:show="showNoteDialog"
      position="center"
      round
      :style="{ width: '90%' }"
    >
      <div class="note-dialog">
        <div class="note-header">
          <h3>添加备注</h3>
          <van-icon name="cross" @click="showNoteDialog = false" />
        </div>
        
        <van-form @submit="saveNote">
          <van-field
            v-model="noteInput"
            type="textarea"
            placeholder="输入您的备注信息"
            rows="4"
            maxlength="200"
            show-word-limit
          />
          
          <div class="note-actions">
            <van-button @click="showNoteDialog = false">取消</van-button>
            <van-button type="primary" native-type="submit">保存</van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

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
import { Dialog, Toast } from 'vant'
import { useDiagnosisStore } from '@/stores/diagnosis'
import { formatDate, isToday, isThisWeek, isThisMonth } from '@/utils/date'
import ConstitutionTrendChart from '@/components/Charts/ConstitutionTrendChart.vue'
import MonthlyStatsChart from '@/components/Charts/MonthlyStatsChart.vue'
import RecordDetail from '@/components/History/RecordDetail.vue'
import type { DiagnosisRecord } from '@/types/diagnosis'

const router = useRouter()
const diagnosisStore = useDiagnosisStore()
const activeTab = ref(2)

const sortType = ref(0)
const activeFilter = ref('all')
const showRecordDetail = ref(false)
const showActionSheet = ref(false)
const showNoteDialog = ref(false)
const selectedRecord = ref<DiagnosisRecord | null>(null)
const noteInput = ref('')
const currentPage = ref(1)
const pageSize = 10
const isLoadingMore = ref(false)

const sortOptions = [
  { text: '按时间排序', value: 0 },
  { text: '按评分排序', value: 1 },
  { text: '按体质类型', value: 2 }
]

const recordActions = [
  { name: '查看详情', icon: 'eye-o' },
  { name: '添加备注', icon: 'comment-o' },
  { name: '生成报告', icon: 'description' },
  { name: '分享结果', icon: 'share-o' },
  { name: '删除记录', icon: 'delete-o', color: '#f56c6c' }
]

const allRecords = computed(() => diagnosisStore.diagnosisHistory)

const totalRecords = computed(() => allRecords.value.length)

const thisMonthRecords = computed(() => {
  return allRecords.value.filter(record => isThisMonth(record.timestamp)).length
})

const averageScore = computed(() => {
  if (allRecords.value.length === 0) return 0
  
  const totalScore = allRecords.value.reduce((sum, record) => {
    return sum + getHealthScore(record)
  }, 0)
  
  return Math.round(totalScore / allRecords.value.length)
})

const mainConstitutionType = computed(() => {
  if (allRecords.value.length === 0) return '暂无'
  
  const constitutionCount = new Map<string, number>()
  
  allRecords.value.forEach(record => {
    const mainConstitution = record.analysis.constitution[0]
    if (mainConstitution) {
      constitutionCount.set(
        mainConstitution.name,
        (constitutionCount.get(mainConstitution.name) || 0) + 1
      )
    }
  })
  
  let mostCommon = ''
  let maxCount = 0
  
  constitutionCount.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count
      mostCommon = name
    }
  })
  
  return mostCommon || '暂无'
})

const filteredRecords = computed(() => {
  let filtered = allRecords.value
  
  // 按时间范围筛选
  switch (activeFilter.value) {
    case 'week':
      filtered = filtered.filter(record => isThisWeek(record.timestamp))
      break
    case 'month':
      filtered = filtered.filter(record => isThisMonth(record.timestamp))
      break
    case 'quarter':
      const threeMonthsAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
      filtered = filtered.filter(record => record.timestamp >= threeMonthsAgo)
      break
  }
  
  // 按排序类型排序
  switch (sortType.value) {
    case 0: // 按时间
      filtered = [...filtered].sort((a, b) => b.timestamp - a.timestamp)
      break
    case 1: // 按评分
      filtered = [...filtered].sort((a, b) => getHealthScore(b) - getHealthScore(a))
      break
    case 2: // 按体质类型
      filtered = [...filtered].sort((a, b) => {
        const aType = getMainConstitution(a)
        const bType = getMainConstitution(b)
        return aType.localeCompare(bType)
      })
      break
  }
  
  return filtered
})

const paginatedRecords = computed(() => {
  return filteredRecords.value.slice(0, currentPage.value * pageSize)
})

const getMainConstitution = (record: DiagnosisRecord): string => {
  return record.analysis.constitution[0]?.name || '未知'
}

const getMainConstitutionPercentage = (record: DiagnosisRecord): number => {
  return record.analysis.constitution[0]?.percentage || 0
}

const getHealthScore = (record: DiagnosisRecord): number => {
  // 简化的健康评分计算
  const mainConstitution = record.analysis.constitution[0]
  let score = 70 // 基础分
  
  if (mainConstitution?.type === 'ping_he') {
    score += 20
  } else if (mainConstitution?.percentage > 80) {
    score -= 10
  }
  
  // 根据健康风险调整
  score -= record.analysis.healthRisks.length * 5
  
  // 根据异常特征调整
  if (hasAbnormalFeatures(record)) {
    score -= 10
  }
  
  return Math.max(0, Math.min(100, score))
}

const hasAbnormalFeatures = (record: DiagnosisRecord): boolean => {
  const shape = record.analysis.tongueAnalysis.tongueShape
  return shape.cracks || shape.teethMarks || shape.spots
}

const getEmptyDescription = (): string => {
  switch (activeFilter.value) {
    case 'week':
      return '本周还没有诊断记录'
    case 'month':
      return '本月还没有诊断记录'
    case 'quarter':
      return '最近3个月没有诊断记录'
    default:
      return '暂无诊断记录'
  }
}

const handleSortChange = () => {
  currentPage.value = 1 // 重置分页
}

const viewRecord = (record: DiagnosisRecord) => {
  selectedRecord.value = record
  showRecordDetail.value = true
}

const closeRecordDetail = () => {
  showRecordDetail.value = false
  selectedRecord.value = null
}

const showRecordActions = (record: DiagnosisRecord) => {
  selectedRecord.value = record
  showActionSheet.value = true
}

const handleRecordAction = (action: any) => {
  showActionSheet.value = false
  
  if (!selectedRecord.value) return
  
  switch (action.name) {
    case '查看详情':
      viewRecord(selectedRecord.value)
      break
    case '添加备注':
      noteInput.value = selectedRecord.value.notes || ''
      showNoteDialog.value = true
      break
    case '生成报告':
      router.push({
        name: 'Reports',
        query: { recordId: selectedRecord.value.id }
      })
      break
    case '分享结果':
      shareRecord(selectedRecord.value)
      break
    case '删除记录':
      confirmDeleteRecord(selectedRecord.value)
      break
  }
}

const saveNote = () => {
  if (!selectedRecord.value) return
  
  addNoteToRecord(selectedRecord.value.id, noteInput.value)
  showNoteDialog.value = false
  noteInput.value = ''
}

const addNoteToRecord = (recordId: string, note: string) => {
  const records = diagnosisStore.diagnosisHistory
  const recordIndex = records.findIndex(r => r.id === recordId)
  
  if (recordIndex !== -1) {
    records[recordIndex].notes = note
    diagnosisStore.saveHistory()
    Toast.success('备注已保存')
  }
}

const confirmDeleteRecord = (record: DiagnosisRecord) => {
  Dialog.confirm({
    title: '确认删除',
    message: '删除后无法恢复，确定要删除这条诊断记录吗？',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    confirmButtonColor: '#f56c6c'
  }).then(() => {
    deleteRecord(record.id)
  })
}

const deleteRecord = (recordId: string) => {
  diagnosisStore.deleteDiagnosisRecord(recordId)
  Toast.success('记录已删除')
  
  if (showRecordDetail.value) {
    closeRecordDetail()
  }
}

const shareRecord = (record: DiagnosisRecord) => {
  const shareText = `我的舌诊结果：
主要体质：${getMainConstitution(record)}
健康评分：${getHealthScore(record)}分
诊断时间：${formatDate(record.timestamp)}
#中医舌诊 #健康管理`

  if (navigator.share) {
    navigator.share({
      title: '舌诊结果分享',
      text: shareText
    }).catch(() => {
      // 分享失败，复制到剪贴板
      navigator.clipboard.writeText(shareText)
      Toast.success('内容已复制到剪贴板')
    })
  } else {
    navigator.clipboard.writeText(shareText)
    Toast.success('内容已复制到剪贴板')
  }
}

const loadMore = () => {
  isLoadingMore.value = true
  
  setTimeout(() => {
    currentPage.value++
    isLoadingMore.value = false
  }, 500)
}

onMounted(() => {
  diagnosisStore.loadHistory()
})
</script>

<style scoped>
.history-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 60px;
}

.content-wrapper {
  padding: 16px;
}

.stats-section {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 16px 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.filter-section {
  margin-bottom: 16px;
}

.records-section {
  margin-bottom: 24px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  display: flex;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.record-item:active {
  transform: scale(0.98);
}

.record-image {
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-date {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.record-actions {
  padding: 4px;
  cursor: pointer;
}

.record-info {
  margin-bottom: 8px;
}

.constitution-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.constitution-name {
  font-size: 16px;
  font-weight: 500;
  color: #4CAF50;
}

.constitution-percentage {
  font-size: 14px;
  color: #666;
}

.health-score {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.record-features {
  margin-bottom: 8px;
}

.tongue-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.record-notes {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.load-more {
  margin-top: 20px;
}

.trend-section,
.monthly-stats {
  margin-bottom: 20px;
}

.note-dialog {
  padding: 20px;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.note-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.note-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.note-actions .van-button {
  flex: 1;
}
</style>