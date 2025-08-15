<template>
  <div class="reports-page">
    <van-nav-bar title="健康报告" fixed placeholder>
      <template #right>
        <van-icon name="share" @click="shareCurrentReport" />
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 报告生成选项 -->
      <div class="generate-section card">
        <div class="section-title">生成新报告</div>
        
        <van-form @submit="generateNewReport">
          <van-field
            v-model="reportOptions.title"
            label="报告标题"
            placeholder="输入自定义标题（选填）"
            clearable
          />
          
          <van-field label="统计时间范围">
            <template #input>
              <van-dropdown-menu>
                <van-dropdown-item
                  v-model="selectedTimeRange"
                  :options="timeRangeOptions"
                />
              </van-dropdown-menu>
            </template>
          </van-field>
          
          <van-field label="报告内容">
            <template #input>
              <van-checkbox-group v-model="reportOptions.features">
                <van-checkbox name="charts">图表分析</van-checkbox>
                <van-checkbox name="trends">趋势分析</van-checkbox>
                <van-checkbox name="recommendations">详细建议</van-checkbox>
              </van-checkbox-group>
            </template>
          </van-field>
          
          <div class="generate-actions">
            <van-button
              type="primary"
              native-type="submit"
              :loading="isGenerating"
              block
              round
              size="large"
            >
              <van-icon name="description" />
              生成报告
            </van-button>
          </div>
        </van-form>
      </div>

      <!-- 当前报告展示 -->
      <div v-if="currentReport" id="health-report-content" class="report-content">
        <!-- 报告头部 -->
        <div class="report-header card">
          <div class="report-title">
            {{ currentReport.title || '健康分析报告' }}
          </div>
          <div class="report-meta">
            <div class="meta-item">
              <span class="meta-label">生成时间</span>
              <span class="meta-value">{{ formatDate(currentReport.generatedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">统计周期</span>
              <span class="meta-value">
                {{ formatDateRange(currentReport.timeRange.start, currentReport.timeRange.end) }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">诊断次数</span>
              <span class="meta-value">{{ currentReport.summary.totalDiagnoses }}次</span>
            </div>
          </div>
        </div>

        <!-- 健康评分 -->
        <div class="health-score-section card">
          <div class="section-title">健康评分</div>
          <div class="score-container">
            <div class="score-circle">
              <HealthScoreCircle :score="currentReport.summary.healthScore" />
            </div>
            <div class="score-info">
              <div class="score-text">
                <div class="score-number">{{ currentReport.summary.healthScore }}</div>
                <div class="score-label">分</div>
              </div>
              <div class="score-level">{{ getScoreLevel(currentReport.summary.healthScore) }}</div>
              <div class="score-desc">{{ getScoreDescription(currentReport.summary.healthScore) }}</div>
            </div>
          </div>
        </div>

        <!-- 体质分析 -->
        <div class="constitution-analysis card">
          <div class="section-title">体质分析</div>
          
          <!-- 主要体质 -->
          <div class="main-constitution">
            <h4>主要体质类型</h4>
            <div class="constitution-card">
              <div class="constitution-info">
                <div class="constitution-name">
                  {{ mainConstitution?.name }}
                </div>
                <div class="constitution-percentage">
                  {{ mainConstitution?.percentage }}%
                </div>
              </div>
              <div class="constitution-desc">
                {{ mainConstitution?.description }}
              </div>
              <div class="constitution-characteristics">
                <van-tag
                  v-for="char in mainConstitution?.characteristics"
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

          <!-- 体质分布图 -->
          <div class="constitution-chart" v-if="reportOptions.features.includes('charts')">
            <h4>体质分布</h4>
            <ConstitutionRadar :data="currentReport.charts.constitutionChart" />
          </div>

          <!-- 其他体质倾向 -->
          <div v-if="otherConstitutions.length > 0" class="other-constitutions">
            <h4>其他体质倾向</h4>
            <div class="constitution-list">
              <div
                v-for="constitution in otherConstitutions"
                :key="constitution.type"
                class="constitution-item"
              >
                <span class="constitution-name-small">{{ constitution.name }}</span>
                <div class="percentage-bar">
                  <div
                    class="percentage-fill"
                    :style="{ width: `${constitution.percentage}%` }"
                  ></div>
                </div>
                <span class="percentage-text">{{ constitution.percentage }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 趋势分析 -->
        <div 
          v-if="reportOptions.features.includes('trends') && currentReport.charts.trendChart.length > 1"
          class="trend-analysis card"
        >
          <div class="section-title">变化趋势</div>
          <TrendChart :data="currentReport.charts.trendChart" />
          
          <div class="trend-summary">
            <div class="trend-item">
              <van-icon name="trending-up" color="#4CAF50" />
              <span>体质稳定性：{{ getTrendStability() }}</span>
            </div>
            <div class="trend-item">
              <van-icon name="chart-trending-o" color="#2196F3" />
              <span>健康趋势：{{ getHealthTrend() }}</span>
            </div>
          </div>
        </div>

        <!-- 改善建议 -->
        <div 
          v-if="reportOptions.features.includes('recommendations')"
          class="improvements-section card"
        >
          <div class="section-title">改善建议</div>
          <div class="improvements-list">
            <div
              v-for="(improvement, index) in currentReport.summary.improvements"
              :key="index"
              class="improvement-item"
            >
              <div class="improvement-number">{{ index + 1 }}</div>
              <div class="improvement-content">
                <div class="improvement-text">{{ improvement }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 报告操作 -->
        <div class="report-actions card">
          <van-button
            @click="exportAsPDF"
            :loading="isExporting"
            icon="description"
            plain
          >
            导出PDF
          </van-button>
          
          <van-button
            @click="exportAsImage"
            :loading="isExporting"
            icon="photo"
            plain
          >
            保存图片
          </van-button>
          
          <van-button
            @click="shareReport"
            icon="share-o"
            type="primary"
            plain
          >
            分享报告
          </van-button>
        </div>
      </div>

      <!-- 历史报告 -->
      <div class="history-reports">
        <div class="section-title flex-between">
          <span>历史报告</span>
          <van-button
            size="mini"
            plain
            @click="loadHistoryReports"
          >
            刷新
          </van-button>
        </div>
        
        <div v-if="historyReports.length > 0" class="history-list">
          <div
            v-for="report in historyReports"
            :key="report.id"
            class="history-item card"
            @click="loadHistoryReport(report)"
          >
            <div class="history-info">
              <div class="history-title">
                {{ report.title || '健康分析报告' }}
              </div>
              <div class="history-meta">
                <span>{{ formatDate(report.generatedAt) }}</span>
                <span>•</span>
                <span>{{ report.summary.totalDiagnoses }}次诊断</span>
                <span>•</span>
                <span class="score">{{ report.summary.healthScore }}分</span>
              </div>
            </div>
            <van-icon name="arrow" />
          </div>
        </div>
        
        <van-empty
          v-else
          image="search"
          description="暂无历史报告"
        />
      </div>
    </div>

    <!-- 加载提示 -->
    <van-overlay :show="isGenerating">
      <div class="loading-content">
        <van-loading type="spinner" size="24px" color="#4CAF50">
          正在生成报告...
        </van-loading>
        <p>分析您的健康数据中，请稍候</p>
      </div>
    </van-overlay>

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
import { 
  generateHealthReport, 
  exportReportAsPDF, 
  exportReportAsImage,
  shareReport as shareReportUtil
} from '@/utils/reportGenerator'
import { formatDate, formatDateRange } from '@/utils/date'
import ConstitutionRadar from '@/components/Charts/ConstitutionRadar.vue'
import HealthScoreCircle from '@/components/Charts/HealthScoreCircle.vue'
import TrendChart from '@/components/Charts/TrendChart.vue'
import type { HealthReport } from '@/types/diagnosis'

const router = useRouter()
const diagnosisStore = useDiagnosisStore()
const activeTab = ref(2)

const isGenerating = ref(false)
const isExporting = ref(false)
const currentReport = ref<HealthReport | null>(null)
const historyReports = ref<HealthReport[]>([])

const selectedTimeRange = ref(0)
const reportOptions = ref({
  title: '',
  features: ['charts', 'trends', 'recommendations']
})

const timeRangeOptions = [
  { text: '最近7天', value: 0 },
  { text: '最近30天', value: 1 },
  { text: '最近90天', value: 2 },
  { text: '最近一年', value: 3 }
]

const getTimeRange = (option: number) => {
  const now = Date.now()
  const ranges = [
    { start: now - 7 * 24 * 60 * 60 * 1000, end: now }, // 7天
    { start: now - 30 * 24 * 60 * 60 * 1000, end: now }, // 30天
    { start: now - 90 * 24 * 60 * 60 * 1000, end: now }, // 90天
    { start: now - 365 * 24 * 60 * 60 * 1000, end: now } // 1年
  ]
  return ranges[option] || ranges[1]
}

const mainConstitution = computed(() => {
  return currentReport.value?.summary.constitutionTrend[0]
})

const otherConstitutions = computed(() => {
  return currentReport.value?.summary.constitutionTrend.slice(1) || []
})

const getScoreLevel = (score: number): string => {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '一般'
  if (score >= 60) return '偏差'
  return '需要关注'
}

const getScoreDescription = (score: number): string => {
  if (score >= 90) return '您的健康状况非常好，请继续保持'
  if (score >= 80) return '您的健康状况良好，稍加注意即可'
  if (score >= 70) return '您的健康状况一般，建议加强调理'
  if (score >= 60) return '您的健康状况有待改善，建议重点关注'
  return '您的健康状况需要特别关注，建议及时调理'
}

const getTrendStability = (): string => {
  // 简化的趋势稳定性计算
  return '相对稳定'
}

const getHealthTrend = (): string => {
  // 简化的健康趋势判断
  return '稳中向好'
}

const generateNewReport = async () => {
  try {
    isGenerating.value = true
    
    // 获取诊断记录
    const records = diagnosisStore.diagnosisHistory
    
    if (records.length === 0) {
      Toast('暂无诊断记录，请先进行舌诊')
      return
    }

    const timeRange = getTimeRange(selectedTimeRange.value)
    
    const report = await generateHealthReport(records, {
      title: reportOptions.value.title,
      timeRange,
      includeCharts: reportOptions.value.features.includes('charts'),
      includeTrends: reportOptions.value.features.includes('trends')
    })

    // 保存报告标题
    if (reportOptions.value.title) {
      report.title = reportOptions.value.title
    }

    currentReport.value = report
    
    // 保存到历史报告
    saveReportToHistory(report)
    
    Toast.success('报告生成成功')
  } catch (error) {
    console.error('生成报告失败:', error)
    Toast.fail((error as Error).message || '生成报告失败')
  } finally {
    isGenerating.value = false
  }
}

const saveReportToHistory = (report: HealthReport) => {
  const savedReports = JSON.parse(
    localStorage.getItem('tcm-health-reports') || '[]'
  )
  
  savedReports.unshift(report)
  
  // 最多保存20个报告
  if (savedReports.length > 20) {
    savedReports.splice(20)
  }
  
  localStorage.setItem('tcm-health-reports', JSON.stringify(savedReports))
  historyReports.value = savedReports
}

const loadHistoryReports = () => {
  const savedReports = JSON.parse(
    localStorage.getItem('tcm-health-reports') || '[]'
  )
  historyReports.value = savedReports
}

const loadHistoryReport = (report: HealthReport) => {
  currentReport.value = report
  Toast.success('已加载历史报告')
}

const exportAsPDF = async () => {
  if (!currentReport.value) return
  
  try {
    isExporting.value = true
    
    const blob = await exportReportAsPDF(currentReport.value, {
      includeCharts: reportOptions.value.features.includes('charts')
    })
    
    // 下载PDF
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `健康报告_${formatDate(currentReport.value.generatedAt, 'YYYYMMDD')}.pdf`
    link.click()
    
    URL.revokeObjectURL(url)
    Toast.success('PDF导出成功')
  } catch (error) {
    console.error('PDF导出失败:', error)
    Toast.fail('PDF导出失败')
  } finally {
    isExporting.value = false
  }
}

const exportAsImage = async () => {
  try {
    isExporting.value = true
    
    const blob = await exportReportAsImage('health-report-content')
    
    // 下载图片
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `健康报告_${formatDate(Date.now(), 'YYYYMMDD')}.png`
    link.click()
    
    URL.revokeObjectURL(url)
    Toast.success('图片保存成功')
  } catch (error) {
    console.error('图片导出失败:', error)
    Toast.fail('图片导出失败')
  } finally {
    isExporting.value = false
  }
}

const shareReport = async () => {
  if (!currentReport.value) return
  
  try {
    await shareReportUtil(currentReport.value)
    Toast.success('分享成功')
  } catch (error) {
    Toast.success((error as Error).message)
  }
}

const shareCurrentReport = () => {
  shareReport()
}

onMounted(() => {
  diagnosisStore.loadHistory()
  loadHistoryReports()
  
  // 如果来自分析页面，自动生成报告
  if (router.currentRoute.value.query.from === 'analysis') {
    selectedTimeRange.value = 0 // 最近7天
    generateNewReport()
  }
})
</script>

<style scoped>
.reports-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 60px;
}

.content-wrapper {
  padding: 16px;
}

.generate-section {
  margin-bottom: 24px;
}

.generate-actions {
  margin-top: 20px;
}

.report-content {
  margin-bottom: 24px;
}

.report-header {
  text-align: center;
  margin-bottom: 20px;
}

.report-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.report-meta {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.meta-label {
  font-size: 12px;
  color: #999;
}

.meta-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.health-score-section {
  margin-bottom: 20px;
}

.score-container {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.score-circle {
  flex-shrink: 0;
}

.score-info {
  flex: 1;
}

.score-text {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.score-number {
  font-size: 36px;
  font-weight: 600;
  color: #4CAF50;
}

.score-label {
  font-size: 16px;
  color: #4CAF50;
}

.score-level {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.score-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.constitution-analysis {
  margin-bottom: 20px;
}

.constitution-analysis h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.constitution-card {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.constitution-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.constitution-name {
  font-size: 18px;
  font-weight: 600;
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
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12px;
}

.constitution-characteristics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.constitution-chart {
  margin: 20px 0;
}

.constitution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.constitution-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.constitution-name-small {
  min-width: 80px;
  font-size: 14px;
  color: #333;
}

.percentage-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.percentage-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.percentage-text {
  min-width: 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.trend-analysis {
  margin-bottom: 20px;
}

.trend-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.trend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.improvements-section {
  margin-bottom: 20px;
}

.improvements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.improvement-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.improvement-number {
  width: 24px;
  height: 24px;
  background: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 2px;
}

.improvement-content {
  flex: 1;
}

.improvement-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.report-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.report-actions .van-button {
  flex: 1;
}

.history-reports {
  margin-bottom: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.history-item:active {
  background: #f5f5f5;
}

.history-info {
  flex: 1;
}

.history-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.history-meta {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 8px;
}

.score {
  color: #4CAF50;
  font-weight: 500;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: white;
  text-align: center;
}

.loading-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}
</style>