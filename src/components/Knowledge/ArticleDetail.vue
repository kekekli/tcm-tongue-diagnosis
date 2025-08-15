<template>
  <div class="article-detail">
    <van-nav-bar
      :title="article.title"
      left-arrow
      @click-left="$emit('close')"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="star-o" @click="$emit('collect', article)" />
      </template>
    </van-nav-bar>

    <div class="detail-content">
      <!-- 文章头部信息 -->
      <div class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        
        <div class="article-meta">
          <van-tag 
            :type="getCategoryTagType(article.category)" 
            size="small"
          >
            {{ getCategoryName(article.category) }}
          </van-tag>
          
          <div class="meta-info">
            <span class="publish-date">
              <van-icon name="clock-o" size="12" />
              {{ formatDate(article.createTime) }}
            </span>
            <span class="read-count">
              <van-icon name="eye-o" size="12" />
              {{ getRandomReadCount() }}次阅读
            </span>
          </div>
        </div>
        
        <!-- 文章标签 -->
        <div class="article-tags" v-if="article.tags && article.tags.length > 0">
          <van-tag
            v-for="tag in article.tags"
            :key="tag"
            type="primary"
            plain
            size="mini"
          >
            {{ tag }}
          </van-tag>
        </div>
      </div>

      <!-- 文章内容 -->
      <div class="article-body">
        <!-- 图片展示 -->
        <div 
          v-if="article.images && article.images.length > 0" 
          class="article-images"
        >
          <van-image
            v-for="(image, index) in article.images"
            :key="index"
            :src="image"
            width="100%"
            fit="contain"
            @click="previewImages(index)"
            class="content-image"
          />
        </div>

        <!-- 正文内容 -->
        <div class="content-text">
          <div 
            v-for="paragraph in formattedContent"
            :key="paragraph.id"
            :class="paragraph.type"
          >
            <component 
              :is="paragraph.component"
              v-if="paragraph.component"
              :content="paragraph.content"
            />
            <template v-else>
              {{ paragraph.content }}
            </template>
          </div>
        </div>

        <!-- 相关推荐 -->
        <div class="related-articles" v-if="relatedArticles.length > 0">
          <div class="related-title">相关文章推荐</div>
          <div class="related-list">
            <div
              v-for="relatedArticle in relatedArticles"
              :key="relatedArticle.id"
              class="related-item"
              @click="viewRelatedArticle(relatedArticle)"
            >
              <div class="related-info">
                <div class="related-name">{{ relatedArticle.title }}</div>
                <div class="related-desc">{{ getContentPreview(relatedArticle) }}</div>
              </div>
              <van-icon name="arrow" />
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="article-actions">
        <van-button 
          @click="shareArticle" 
          icon="share-o"
          plain
          round
        >
          分享
        </van-button>
        
        <van-button 
          @click="$emit('collect', article)"
          icon="star-o" 
          type="primary"
          plain
          round
        >
          收藏
        </van-button>
        
        <van-button 
          @click="provideFeedback"
          icon="comment-o"
          plain
          round
        >
          反馈
        </van-button>
      </div>
    </div>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showImagePreview"
      :images="article.images || []"
      :start-position="previewIndex"
      @close="showImagePreview = false"
    />

    <!-- 分享弹窗 -->
    <van-share-sheet
      v-model:show="showShareSheet"
      title="分享到"
      :options="shareOptions"
      @select="handleShare"
    />

    <!-- 反馈弹窗 -->
    <van-popup
      v-model:show="showFeedbackDialog"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <div class="feedback-container">
        <div class="feedback-header">
          <h3>意见反馈</h3>
          <van-icon name="cross" @click="showFeedbackDialog = false" />
        </div>
        
        <van-form @submit="submitFeedback">
          <van-field
            v-model="feedback.content"
            type="textarea"
            placeholder="请输入您的建议或意见"
            rows="6"
            required
          />
          
          <van-field
            v-model="feedback.contact"
            placeholder="联系方式（选填）"
          />
          
          <div class="feedback-actions">
            <van-button 
              type="primary" 
              native-type="submit"
              :loading="submittingFeedback"
              block
              round
            >
              提交反馈
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Toast } from 'vant'
import { formatDate } from '@/utils/date'
import type { KnowledgeItem } from '@/types/diagnosis'
import knowledgeData from '@/data/knowledge.json'

interface Props {
  article: KnowledgeItem
}

const props = defineProps<Props>()

defineEmits<{
  close: []
  collect: [article: KnowledgeItem]
}>()

const showImagePreview = ref(false)
const previewIndex = ref(0)
const showShareSheet = ref(false)
const showFeedbackDialog = ref(false)
const submittingFeedback = ref(false)

const feedback = ref({
  content: '',
  contact: ''
})

const categories = {
  basic: '基础理论',
  'tongue-quality': '舌质分析',
  'tongue-coating': '舌苔分析',
  constitution: '体质辨识',
  cases: '病例分析'
}

const shareOptions = [
  { name: '微信', icon: 'wechat' },
  { name: '微博', icon: 'weibo' },
  { name: '复制链接', icon: 'link' },
  { name: '更多', icon: 'more-o' }
]

const formattedContent = computed(() => {
  const content = props.article.content
  const paragraphs = content.split('\n\n')
  
  return paragraphs.map((paragraph, index) => {
    const trimmed = paragraph.trim()
    
    if (trimmed.startsWith('##')) {
      // 二级标题
      return {
        id: index,
        type: 'subtitle',
        content: trimmed.replace(/^##\s*/, ''),
        component: null
      }
    } else if (trimmed.match(/^\d+\./)) {
      // 数字列表
      return {
        id: index,
        type: 'list-item',
        content: trimmed,
        component: null
      }
    } else if (trimmed.startsWith('-')) {
      // 无序列表
      return {
        id: index,
        type: 'bullet-item',
        content: trimmed.replace(/^-\s*/, ''),
        component: null
      }
    } else if (trimmed) {
      // 普通段落
      return {
        id: index,
        type: 'paragraph',
        content: trimmed,
        component: null
      }
    }
    
    return null
  }).filter(Boolean)
})

const relatedArticles = computed(() => {
  // 查找相关文章（同分类或有相同标签）
  const articles = knowledgeData.articles.filter(
    article => article.id !== props.article.id
  )
  
  const related = articles.filter(article => 
    article.category === props.article.category ||
    article.tags?.some(tag => props.article.tags?.includes(tag))
  )
  
  return related.slice(0, 3)
})

const getCategoryName = (categoryId: string): string => {
  return categories[categoryId as keyof typeof categories] || '其他'
}

const getCategoryTagType = (categoryId: string): string => {
  const tagTypes = {
    basic: 'primary',
    'tongue-quality': 'success',
    'tongue-coating': 'warning',
    constitution: 'danger',
    cases: 'default'
  }
  
  return tagTypes[categoryId as keyof typeof tagTypes] || 'default'
}

const getRandomReadCount = (): number => {
  return Math.floor(Math.random() * 1000) + 500
}

const getContentPreview = (article: any): string => {
  const content = article.content
  const preview = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  return preview.length > 60 ? preview.substring(0, 60) + '...' : preview
}

const previewImages = (index: number) => {
  previewIndex.value = index
  showImagePreview.value = true
}

const shareArticle = () => {
  showShareSheet.value = true
}

const handleShare = (option: any) => {
  showShareSheet.value = false
  
  if (option.name === '复制链接') {
    // 复制文章链接
    const url = `${window.location.origin}/knowledge/${props.article.id}`
    navigator.clipboard.writeText(url).then(() => {
      Toast.success('链接已复制到剪贴板')
    })
  } else if (option.name === '微信') {
    // 微信分享逻辑
    Toast('请在微信中打开分享')
  } else if (option.name === '微博') {
    // 微博分享逻辑
    const text = `推荐一篇中医舌诊知识：${props.article.title}`
    const url = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  } else {
    // 更多分享方式
    if (navigator.share) {
      navigator.share({
        title: props.article.title,
        text: getContentPreview(props.article),
        url: window.location.href
      })
    }
  }
}

const provideFeedback = () => {
  showFeedbackDialog.value = true
}

const submitFeedback = async () => {
  if (!feedback.value.content.trim()) {
    Toast('请输入反馈内容')
    return
  }
  
  try {
    submittingFeedback.value = true
    
    // 这里可以调用反馈API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    Toast.success('反馈提交成功，感谢您的建议！')
    showFeedbackDialog.value = false
    
    // 清空表单
    feedback.value = {
      content: '',
      contact: ''
    }
  } catch (error) {
    Toast.fail('提交失败，请重试')
  } finally {
    submittingFeedback.value = false
  }
}

const viewRelatedArticle = (article: any) => {
  // 这里可以emit事件通知父组件切换文章
  console.log('查看相关文章:', article.title)
}

onMounted(() => {
  // 记录阅读
  console.log('阅读文章:', props.article.title)
})
</script>

<style scoped>
.article-detail {
  height: 100vh;
  background: white;
  overflow-y: auto;
}

.detail-content {
  padding: 16px;
  padding-bottom: 80px;
}

.article-header {
  margin-bottom: 24px;
}

.article-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin: 0 0 16px 0;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.meta-info {
  display: flex;
  gap: 16px;
  align-items: center;
}

.publish-date,
.read-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.article-body {
  line-height: 1.6;
}

.article-images {
  margin-bottom: 20px;
}

.content-image {
  margin-bottom: 12px;
  border-radius: 8px;
  cursor: pointer;
}

.content-text {
  margin-bottom: 32px;
}

.paragraph {
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
  line-height: 1.8;
}

.subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #4CAF50;
}

.list-item,
.bullet-item {
  margin-bottom: 8px;
  color: #333;
  font-size: 16px;
  line-height: 1.6;
  padding-left: 16px;
}

.bullet-item::before {
  content: '•';
  color: #4CAF50;
  margin-right: 8px;
  margin-left: -16px;
}

.related-articles {
  border-top: 1px solid #eee;
  padding-top: 20px;
  margin-top: 32px;
}

.related-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.related-item:hover {
  background: #f0f0f0;
}

.related-info {
  flex: 1;
}

.related-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.related-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.article-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
}

.article-actions .van-button {
  flex: 1;
}

.feedback-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.feedback-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.feedback-actions {
  margin-top: 20px;
}
</style>