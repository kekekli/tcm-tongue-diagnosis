<template>
  <div class="knowledge-page">
    <van-nav-bar title="舌诊知识库" fixed placeholder>
      <template #right>
        <van-icon name="search" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <!-- 搜索栏 -->
    <van-search
      v-model="searchQuery"
      v-show="showSearch"
      placeholder="搜索知识内容"
      @search="performSearch"
      @cancel="showSearch = false"
      @clear="clearSearch"
      autofocus
    />

    <div class="content-wrapper">
      <!-- 分类导航 -->
      <div v-if="!showSearchResults" class="categories-section">
        <div class="section-title">知识分类</div>
        <van-grid :column-num="2" :gutter="16">
          <van-grid-item
            v-for="category in categories"
            :key="category.id"
            @click="selectCategory(category)"
            class="category-item"
          >
            <div class="category-content">
              <van-icon :name="category.icon" size="32" :color="category.color" />
              <span class="category-name">{{ category.name }}</span>
              <span class="article-count">
                {{ getCategoryArticleCount(category.id) }}篇
              </span>
            </div>
          </van-grid-item>
        </van-grid>
      </div>

      <!-- 热门文章 -->
      <div v-if="!showSearchResults && !selectedCategory" class="popular-section">
        <div class="section-title">热门文章</div>
        <div class="article-list">
          <ArticleCard
            v-for="article in popularArticles"
            :key="article.id"
            :article="article"
            @click="viewArticle(article)"
          />
        </div>
      </div>

      <!-- 最新文章 -->
      <div v-if="!showSearchResults && !selectedCategory" class="latest-section">
        <div class="section-title">最新发布</div>
        <div class="article-list">
          <ArticleCard
            v-for="article in latestArticles"
            :key="article.id"
            :article="article"
            @click="viewArticle(article)"
          />
        </div>
      </div>

      <!-- 分类文章列表 -->
      <div v-if="selectedCategory && !showSearchResults" class="category-articles">
        <div class="category-header">
          <van-icon
            name="arrow-left"
            @click="selectedCategory = null"
            class="back-icon"
          />
          <span class="category-title">{{ selectedCategory.name }}</span>
        </div>
        
        <div class="article-list">
          <ArticleCard
            v-for="article in categoryArticles"
            :key="article.id"
            :article="article"
            @click="viewArticle(article)"
          />
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="showSearchResults" class="search-results">
        <div class="search-header">
          <span class="search-title">搜索结果</span>
          <span class="result-count">共{{ searchResults.length }}条结果</span>
        </div>
        
        <div v-if="searchResults.length > 0" class="article-list">
          <ArticleCard
            v-for="article in searchResults"
            :key="article.id"
            :article="article"
            :highlight="searchQuery"
            @click="viewArticle(article)"
          />
        </div>
        
        <van-empty
          v-else
          image="search"
          description="没有找到相关内容"
        />
      </div>

      <!-- 推荐标签 -->
      <div v-if="!showSearchResults" class="tags-section">
        <div class="section-title">热门标签</div>
        <div class="tags-container">
          <van-tag
            v-for="tag in popularTags"
            :key="tag"
            type="primary"
            plain
            size="medium"
            @click="searchByTag(tag)"
            class="tag-item"
          >
            {{ tag }}
          </van-tag>
        </div>
      </div>
    </div>

    <!-- 文章详情弹窗 -->
    <van-popup
      v-model:show="showArticleDetail"
      position="right"
      :style="{ width: '100%', height: '100%' }"
    >
      <ArticleDetail
        v-if="selectedArticle"
        :article="selectedArticle"
        @close="closeArticleDetail"
        @collect="collectArticle"
      />
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
import { Toast } from 'vant'
import knowledgeData from '@/data/knowledge.json'
import ArticleCard from '@/components/Knowledge/ArticleCard.vue'
import ArticleDetail from '@/components/Knowledge/ArticleDetail.vue'
import type { KnowledgeItem } from '@/types/diagnosis'

const activeTab = ref(1)
const showSearch = ref(false)
const searchQuery = ref('')
const showSearchResults = ref(false)
const searchResults = ref<KnowledgeItem[]>([])
const selectedCategory = ref<any>(null)
const showArticleDetail = ref(false)
const selectedArticle = ref<KnowledgeItem | null>(null)

const categories = ref(knowledgeData.categories)
const articles = ref(knowledgeData.articles.map(article => ({
  ...article,
  category: article.category,
  tags: article.tags || []
})))

// 热门文章（模拟点击量排序）
const popularArticles = computed(() => {
  return articles.value.slice(0, 3)
})

// 最新文章
const latestArticles = computed(() => {
  return [...articles.value]
    .sort((a, b) => b.createTime - a.createTime)
    .slice(0, 4)
})

// 分类文章
const categoryArticles = computed(() => {
  if (!selectedCategory.value) return []
  return articles.value.filter(
    article => article.category === selectedCategory.value.id
  )
})

// 热门标签
const popularTags = computed(() => {
  const tagCount = new Map()
  
  articles.value.forEach(article => {
    article.tags.forEach(tag => {
      tagCount.set(tag, (tagCount.get(tag) || 0) + 1)
    })
  })
  
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(item => item[0])
})

const getCategoryArticleCount = (categoryId: string): number => {
  return articles.value.filter(article => article.category === categoryId).length
}

const selectCategory = (category: any) => {
  selectedCategory.value = category
  showSearchResults.value = false
}

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    Toast('请输入搜索关键词')
    return
  }
  
  const query = searchQuery.value.toLowerCase()
  searchResults.value = articles.value.filter(article => 
    article.title.toLowerCase().includes(query) ||
    article.content.toLowerCase().includes(query) ||
    article.tags.some(tag => tag.toLowerCase().includes(query))
  )
  
  showSearchResults.value = true
  selectedCategory.value = null
}

const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

const searchByTag = (tag: string) => {
  searchQuery.value = tag
  performSearch()
  showSearch.value = true
}

const viewArticle = (article: KnowledgeItem) => {
  selectedArticle.value = article
  showArticleDetail.value = true
}

const closeArticleDetail = () => {
  showArticleDetail.value = false
  selectedArticle.value = null
}

const collectArticle = (article: KnowledgeItem) => {
  // 收藏文章逻辑
  const collections = JSON.parse(
    localStorage.getItem('tcm-knowledge-collections') || '[]'
  )
  
  const exists = collections.find((item: any) => item.id === article.id)
  
  if (exists) {
    Toast('已经收藏过了')
    return
  }
  
  collections.push({
    id: article.id,
    title: article.title,
    collectTime: Date.now()
  })
  
  localStorage.setItem(
    'tcm-knowledge-collections',
    JSON.stringify(collections)
  )
  
  Toast.success('收藏成功')
}

onMounted(() => {
  // 可以在这里加载收藏状态等
})
</script>

<style scoped>
.knowledge-page {
  min-height: 100vh;
  background: #f8f9fa;
  padding-bottom: 60px;
}

.content-wrapper {
  padding: 16px;
}

.categories-section,
.popular-section,
.latest-section,
.tags-section {
  margin-bottom: 24px;
}

.category-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.category-item:active {
  transform: scale(0.95);
}

.category-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  text-align: center;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.article-count {
  font-size: 12px;
  color: #666;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-articles {
  margin-bottom: 24px;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 0;
}

.back-icon {
  font-size: 20px;
  color: #666;
  cursor: pointer;
}

.category-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.search-results {
  margin-bottom: 24px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
}

.search-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.result-count {
  font-size: 14px;
  color: #666;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-item:hover {
  background-color: #4CAF50;
  color: white;
}
</style>