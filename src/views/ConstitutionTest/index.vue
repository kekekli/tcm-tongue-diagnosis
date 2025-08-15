<template>
  <div class="constitution-test-page">
    <van-nav-bar
      :title="currentStep === 'intro' ? '体质测试' : `第${currentQuestionIndex + 1}题`"
      left-arrow
      @click-left="goBack"
      fixed
      placeholder
    >
      <template #right v-if="currentStep === 'test'">
        {{ currentQuestionIndex + 1 }}/{{ totalQuestions }}
      </template>
    </van-nav-bar>

    <div class="content-wrapper">
      <!-- 测试介绍 -->
      <div v-if="currentStep === 'intro'" class="intro-section">
        <div class="intro-card card">
          <div class="intro-header">
            <van-icon name="medal" size="48" color="#4CAF50" />
            <h2>{{ testData.testInfo.title }}</h2>
            <p>{{ testData.testInfo.description }}</p>
          </div>
          
          <div class="test-info">
            <div class="info-item">
              <van-icon name="question-o" color="#4CAF50" />
              <span>共{{ testData.testInfo.totalQuestions }}道题目</span>
            </div>
            <div class="info-item">
              <van-icon name="clock-o" color="#4CAF50" />
              <span>{{ testData.testInfo.timeEstimate }}</span>
            </div>
          </div>
          
          <div class="instructions">
            <h3>测试说明</h3>
            <p>{{ testData.testInfo.instruction }}</p>
          </div>
          
          <div class="constitution-types">
            <h3>九种体质类型</h3>
            <div class="types-grid">
              <div
                v-for="(type, key) in testData.constitutionTypes"
                :key="key"
                class="type-item"
                :style="{ borderColor: type.color }"
              >
                <div class="type-name" :style="{ color: type.color }">
                  {{ type.name }}
                </div>
                <div class="type-desc">{{ type.description }}</div>
              </div>
            </div>
          </div>
          
          <van-button
            type="primary"
            size="large"
            round
            block
            @click="startTest"
            class="start-btn"
          >
            开始测试
          </van-button>
        </div>
      </div>

      <!-- 测试进行中 -->
      <div v-if="currentStep === 'test'" class="test-section">
        <!-- 进度条 -->
        <div class="progress-section">
          <van-progress
            :percentage="progressPercentage"
            stroke-width="6"
            color="#4CAF50"
            track-color="#f0f0f0"
          />
          <div class="progress-text">
            {{ Math.round(progressPercentage) }}% 完成
          </div>
        </div>

        <!-- 问题卡片 -->
        <div class="question-card card">
          <div class="question-header">
            <div class="question-category">
              {{ getCategoryName(currentQuestion.category) }}
            </div>
            <div class="question-number">
              问题 {{ currentQuestionIndex + 1 }}
            </div>
          </div>
          
          <div class="question-text">
            {{ currentQuestion.question }}
          </div>
          
          <div class="options-list">
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              class="option-item"
              :class="{ selected: selectedAnswer === index }"
              @click="selectAnswer(index)"
            >
              <div class="option-radio">
                <van-icon 
                  v-if="selectedAnswer === index"
                  name="checked"
                  color="#4CAF50"
                />
              </div>
              <div class="option-text">{{ option.text }}</div>
            </div>
          </div>
        </div>

        <!-- 导航按钮 -->
        <div class="nav-buttons">
          <van-button
            v-if="currentQuestionIndex > 0"
            @click="previousQuestion"
            size="large"
            round
          >
            上一题
          </van-button>
          
          <van-button
            v-if="currentQuestionIndex < totalQuestions - 1"
            type="primary"
            @click="nextQuestion"
            :disabled="selectedAnswer === null"
            size="large"
            round
          >
            下一题
          </van-button>
          
          <van-button
            v-if="currentQuestionIndex === totalQuestions - 1"
            type="primary"
            @click="finishTest"
            :disabled="selectedAnswer === null"
            size="large"
            round
          >
            完成测试
          </van-button>
        </div>
      </div>

      <!-- 测试结果 -->
      <div v-if="currentStep === 'result'" class="result-section">
        <div class="result-header card">
          <div class="result-title">
            <van-icon name="success" size="48" color="#4CAF50" />
            <h2>测试完成！</h2>
            <p>根据您的回答，为您生成了专业的体质分析报告</p>
          </div>
        </div>

        <!-- 主要体质 -->
        <div class="main-result card">
          <div class="result-type-title">您的主要体质类型</div>
          <div class="main-constitution">
            <div class="constitution-badge" :style="{ backgroundColor: mainResult.color }">
              {{ mainResult.name }}
            </div>
            <div class="constitution-percentage">
              {{ mainResult.percentage }}%
            </div>
          </div>
          <div class="constitution-description">
            {{ mainResult.description }}
          </div>
          <div class="constitution-characteristics">
            <div class="characteristics-title">主要特征</div>
            <div class="characteristics-tags">
              <van-tag
                v-for="char in mainResult.characteristics"
                :key="char"
                :color="mainResult.color"
                plain
                size="medium"
              >
                {{ char }}
              </van-tag>
            </div>
          </div>
        </div>

        <!-- 体质分布 -->
        <div class="constitution-distribution card">
          <div class="section-title">体质分布详情</div>
          <div class="distribution-chart">
            <ConstitutionRadar :data="chartData" />
          </div>
          
          <div class="distribution-list">
            <div
              v-for="result in testResults"
              :key="result.type"
              class="distribution-item"
              :class="{ primary: result === mainResult }"
            >
              <div class="item-info">
                <span class="item-name" :style="{ color: result.color }">
                  {{ result.name }}
                </span>
                <div class="item-bar">
                  <div
                    class="item-fill"
                    :style="{
                      width: `${result.percentage}%`,
                      backgroundColor: result.color
                    }"
                  ></div>
                </div>
              </div>
              <span class="item-percentage">{{ result.percentage }}%</span>
            </div>
          </div>
        </div>

        <!-- 调理建议 -->
        <div class="recommendations card">
          <div class="section-title">个性化调理建议</div>
          <div class="recommendation-tabs">
            <van-tabs v-model:active="activeRecommendation">
              <van-tab title="饮食调理" name="diet">
                <div class="recommendation-content">
                  <div
                    v-for="item in recommendations.diet"
                    :key="item"
                    class="recommendation-item"
                  >
                    <van-icon name="success" color="#4CAF50" />
                    <span>{{ item }}</span>
                  </div>
                </div>
              </van-tab>
              
              <van-tab title="生活调理" name="lifestyle">
                <div class="recommendation-content">
                  <div
                    v-for="item in recommendations.lifestyle"
                    :key="item"
                    class="recommendation-item"
                  >
                    <van-icon name="success" color="#4CAF50" />
                    <span>{{ item }}</span>
                  </div>
                </div>
              </van-tab>
              
              <van-tab title="运动调理" name="exercise">
                <div class="recommendation-content">
                  <div
                    v-for="item in recommendations.exercise"
                    :key="item"
                    class="recommendation-item"
                  >
                    <van-icon name="success" color="#4CAF50" />
                    <span>{{ item }}</span>
                  </div>
                </div>
              </van-tab>
            </van-tabs>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="result-actions">
          <van-button @click="saveResult" :loading="isSaving" round>
            <van-icon name="star-o" />
            保存结果
          </van-button>
          
          <van-button type="primary" @click="shareResult" round>
            <van-icon name="share-o" />
            分享结果
          </van-button>
          
          <van-button @click="retakeTest" round>
            <van-icon name="replay" />
            重新测试
          </van-button>
        </div>
      </div>
    </div>

    <!-- 退出确认弹窗 -->
    <van-dialog
      v-model:show="showExitDialog"
      title="确认退出"
      message="测试尚未完成，确定要退出吗？退出后当前进度将丢失。"
      show-cancel-button
      @confirm="confirmExit"
    />

    <!-- 加载提示 -->
    <van-overlay :show="isAnalyzing">
      <div class="loading-content">
        <van-loading type="spinner" size="24px" color="#4CAF50">
          正在分析您的体质...
        </van-loading>
        <p>请稍候，这可能需要几秒钟</p>
      </div>
    </van-overlay>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import testData from '@/data/constitutionTest.json'
import ConstitutionRadar from '@/components/Charts/ConstitutionRadar.vue'

const router = useRouter()

const currentStep = ref<'intro' | 'test' | 'result'>('intro')
const currentQuestionIndex = ref(0)
const selectedAnswer = ref<number | null>(null)
const answers = ref<number[]>([])
const testResults = ref<any[]>([])
const showExitDialog = ref(false)
const isAnalyzing = ref(false)
const isSaving = ref(false)
const activeRecommendation = ref('diet')

const totalQuestions = computed(() => testData.questions.length)

const currentQuestion = computed(() => testData.questions[currentQuestionIndex.value])

const progressPercentage = computed(() => {
  return ((currentQuestionIndex.value) / totalQuestions.value) * 100
})

const mainResult = computed(() => {
  return testResults.value[0] || null
})

const chartData = computed(() => {
  return testResults.value.map(result => ({
    label: result.name,
    value: result.percentage
  }))
})

const recommendations = computed(() => {
  if (!mainResult.value) return { diet: [], lifestyle: [], exercise: [] }
  
  return getRecommendationsByType(mainResult.value.type)
})

const getCategoryName = (category: string): string => {
  const names = {
    qi_xu: '气虚质',
    yang_xu: '阳虚质',
    yin_xu: '阴虚质',
    tan_shi: '痰湿质',
    shi_re: '湿热质',
    xue_yu: '血瘀质',
    qi_yu: '气郁质',
    te_bing: '特禀质'
  }
  return names[category as keyof typeof names] || '体质测试'
}

const startTest = () => {
  currentStep.value = 'test'
  answers.value = new Array(totalQuestions.value).fill(null)
}

const selectAnswer = (answerIndex: number) => {
  selectedAnswer.value = answerIndex
}

const nextQuestion = () => {
  if (selectedAnswer.value === null) return
  
  // 保存答案
  answers.value[currentQuestionIndex.value] = selectedAnswer.value
  
  // 下一题
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
    // 加载已选答案
    selectedAnswer.value = answers.value[currentQuestionIndex.value]
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    // 保存当前答案
    if (selectedAnswer.value !== null) {
      answers.value[currentQuestionIndex.value] = selectedAnswer.value
    }
    
    currentQuestionIndex.value--
    // 加载已选答案
    selectedAnswer.value = answers.value[currentQuestionIndex.value]
  }
}

const finishTest = async () => {
  if (selectedAnswer.value === null) return
  
  // 保存最后一题答案
  answers.value[currentQuestionIndex.value] = selectedAnswer.value
  
  try {
    isAnalyzing.value = true
    
    // 分析结果
    await analyzeResults()
    
    currentStep.value = 'result'
    Toast.success('体质分析完成！')
  } catch (error) {
    console.error('分析失败:', error)
    Toast.fail('分析失败，请重试')
  } finally {
    isAnalyzing.value = false
  }
}

const analyzeResults = async (): Promise<void> => {
  // 模拟分析延迟
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 计算各体质得分
  const scores: Record<string, number> = {}
  const questionCounts: Record<string, number> = {}
  
  // 初始化
  Object.keys(testData.constitutionTypes).forEach(type => {
    scores[type] = 0
    questionCounts[type] = 0
  })
  
  // 计算得分
  testData.questions.forEach((question, index) => {
    const answerIndex = answers.value[index]
    if (answerIndex !== null) {
      const score = question.options[answerIndex].score
      scores[question.category] += score
      questionCounts[question.category]++
    }
  })
  
  // 计算平均分和转换为体质倾向度
  const constitutionResults: any[] = []
  
  Object.entries(testData.constitutionTypes).forEach(([type, info]) => {
    const avgScore = questionCounts[type] > 0 
      ? scores[type] / questionCounts[type] 
      : 1
    
    // 将1-5分转换为0-100%的倾向度
    const percentage = Math.round(((avgScore - 1) / 4) * 100)
    
    constitutionResults.push({
      type,
      name: info.name,
      description: info.description,
      characteristics: info.characteristics,
      color: info.color,
      percentage: Math.max(0, Math.min(100, percentage)),
      avgScore
    })
  })
  
  // 排序并添加平和质特殊处理
  constitutionResults.sort((a, b) => b.percentage - a.percentage)
  
  // 如果所有体质倾向都不高，可能是平和质
  const maxPercentage = constitutionResults[0].percentage
  if (maxPercentage < 30) {
    // 添加平和质
    const pingHeInfo = testData.constitutionTypes.ping_he
    constitutionResults.unshift({
      type: 'ping_he',
      name: pingHeInfo.name,
      description: pingHeInfo.description,
      characteristics: pingHeInfo.characteristics,
      color: pingHeInfo.color,
      percentage: 100 - maxPercentage,
      avgScore: 1
    })
  }
  
  testResults.value = constitutionResults.filter(r => r.percentage > 0)
}

const getRecommendationsByType = (type: string) => {
  const recommendations = {
    ping_he: {
      diet: ['保持饮食均衡', '按时进餐', '适量饮水', '少食生冷'],
      lifestyle: ['规律作息', '劳逸结合', '保持心情舒畅', '适度运动'],
      exercise: ['散步', '太极拳', '八段锦', '游泳']
    },
    qi_xu: {
      diet: ['多食补气食物如山药、大枣', '少食生冷寒凉', '规律饮食'],
      lifestyle: ['早睡早起', '避免过度劳累', '保持心情舒畅'],
      exercise: ['太极拳', '八段锦', '散步', '气功']
    },
    yang_xu: {
      diet: ['温热食物', '羊肉、韭菜', '生姜、肉桂'],
      lifestyle: ['注意保暖', '避免贪凉', '适当晒太阳'],
      exercise: ['慢跑', '游泳', '瑜伽', '太极拳']
    },
    yin_xu: {
      diet: ['滋阴食物', '枸杞、银耳', '蜂蜜、梨'],
      lifestyle: ['避免熬夜', '保持环境湿润', '静心养神'],
      exercise: ['太极拳', '瑜伽', '冥想', '八段锦']
    },
    tan_shi: {
      diet: ['清淡饮食', '少油腻', '多蔬菜水果'],
      lifestyle: ['控制体重', '保持室内干燥', '勤洗澡'],
      exercise: ['有氧运动', '游泳', '快走', '慢跑']
    },
    shi_re: {
      diet: ['清热利湿', '绿豆、薏米', '少辛辣油腻'],
      lifestyle: ['保持清洁', '避免湿热环境', '早睡早起'],
      exercise: ['游泳', '太极', '瑜伽', '有氧运动']
    },
    xue_yu: {
      diet: ['活血化瘀食物', '山楂、黑豆', '少食肥甘厚味'],
      lifestyle: ['保持心情舒畅', '避免久坐', '适当按摩'],
      exercise: ['慢跑', '太极拳', '舞蹈', '瑜伽']
    },
    qi_yu: {
      diet: ['疏肝理气食物', '玫瑰花茶', '柑橘类水果'],
      lifestyle: ['调节情志', '多与人交流', '培养爱好'],
      exercise: ['户外运动', '太极拳', '瑜伽', '登山']
    },
    te_bing: {
      diet: ['避免致敏食物', '增强免疫力', '均衡营养'],
      lifestyle: ['避免致敏环境', '增强体质', '定期体检'],
      exercise: ['适合的温和运动', '避免剧烈运动', '太极拳']
    }
  }
  
  return recommendations[type as keyof typeof recommendations] || recommendations.ping_he
}

const saveResult = async () => {
  try {
    isSaving.value = true
    
    const testResult = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      results: testResults.value,
      answers: answers.value,
      recommendations: recommendations.value
    }
    
    // 保存到本地存储
    const savedTests = JSON.parse(
      localStorage.getItem('tcm-constitution-tests') || '[]'
    )
    savedTests.unshift(testResult)
    
    // 最多保存10次测试结果
    if (savedTests.length > 10) {
      savedTests.splice(10)
    }
    
    localStorage.setItem('tcm-constitution-tests', JSON.stringify(savedTests))
    
    Toast.success('测试结果已保存')
  } catch (error) {
    Toast.fail('保存失败')
  } finally {
    isSaving.value = false
  }
}

const shareResult = () => {
  if (!mainResult.value) return
  
  const shareText = `我的体质测试结果：
主要体质：${mainResult.value.name} (${mainResult.value.percentage}%)
${mainResult.value.description}

快来测试你的体质类型吧！`

  if (navigator.share) {
    navigator.share({
      title: '我的体质测试结果',
      text: shareText
    }).catch(() => {
      navigator.clipboard.writeText(shareText)
      Toast.success('结果已复制到剪贴板')
    })
  } else {
    navigator.clipboard.writeText(shareText)
    Toast.success('结果已复制到剪贴板')
  }
}

const retakeTest = () => {
  currentStep.value = 'intro'
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  answers.value = []
  testResults.value = []
}

const goBack = () => {
  if (currentStep.value === 'test' && answers.value.some(a => a !== null)) {
    showExitDialog.value = true
  } else {
    router.back()
  }
}

const confirmExit = () => {
  showExitDialog.value = false
  router.back()
}

onMounted(() => {
  // 可以在这里加载之前的测试结果
})
</script>

<style scoped>
.constitution-test-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.content-wrapper {
  padding: 16px;
  padding-bottom: 20px;
}

/* 介绍页面 */
.intro-card {
  text-align: center;
}

.intro-header {
  margin-bottom: 24px;
}

.intro-header h2 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  color: #333;
}

.intro-header p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.test-info {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.instructions {
  text-align: left;
  margin-bottom: 24px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
}

.instructions h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.instructions p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.constitution-types {
  text-align: left;
  margin-bottom: 32px;
}

.constitution-types h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.type-item {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.type-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.type-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.start-btn {
  margin-top: 16px;
}

/* 测试页面 */
.progress-section {
  margin-bottom: 24px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

.question-card {
  margin-bottom: 24px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.question-category {
  background: #4CAF50;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.question-number {
  font-size: 14px;
  color: #666;
}

.question-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  line-height: 1.6;
  margin-bottom: 24px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.option-item:hover {
  border-color: #4CAF50;
}

.option-item.selected {
  border-color: #4CAF50;
  background: rgba(76, 175, 80, 0.05);
}

.option-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.option-item.selected .option-radio {
  border-color: #4CAF50;
}

.option-text {
  flex: 1;
  font-size: 16px;
  color: #333;
  line-height: 1.5;
}

.nav-buttons {
  display: flex;
  gap: 12px;
}

.nav-buttons .van-button {
  flex: 1;
}

/* 结果页面 */
.result-header {
  text-align: center;
  margin-bottom: 24px;
}

.result-title h2 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  color: #333;
}

.result-title p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.main-result {
  margin-bottom: 24px;
  text-align: center;
}

.result-type-title {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
}

.main-constitution {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.constitution-badge {
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 20px;
  font-weight: 600;
}

.constitution-percentage {
  font-size: 32px;
  font-weight: 600;
  color: #333;
}

.constitution-description {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.characteristics-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 12px;
}

.characteristics-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.constitution-distribution {
  margin-bottom: 24px;
}

.distribution-chart {
  margin: 20px 0;
}

.distribution-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.distribution-item.primary {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-name {
  font-weight: 500;
}

.item-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.item-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.item-percentage {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  min-width: 40px;
  text-align: right;
}

.recommendations {
  margin-bottom: 24px;
}

.recommendation-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 0;
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.result-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.result-actions .van-button {
  flex: 1;
  min-width: 100px;
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