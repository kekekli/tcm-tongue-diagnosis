<template>
  <div class="article-card" @click="$emit('click')">
    <div class="article-header">
      <h3 class="article-title">{{ highlightText(article.title) }}</h3>
      <div class="article-meta">
        <van-tag 
          :type="getCategoryTagType(article.category)" 
          size="mini"
        >
          {{ getCategoryName(article.category) }}
        </van-tag>
        <span class="article-date">{{ formatDate(article.createTime) }}</span>
      </div>
    </div>
    
    <div class="article-content">
      <p class="content-preview">{{ highlightText(getContentPreview()) }}</p>
      
      <div class="article-image" v-if="article.images && article.images.length > 0">
        <van-image
          :src="article.images[0]"
          width="60"
          height="60"
          fit="cover"
          radius="8"
          :show-error="false"
          :show-loading="false"
        />
      </div>
    </div>
    
    <div class="article-footer">
      <div class="article-tags">
        <van-tag
          v-for="tag in article.tags.slice(0, 3)"
          :key="tag"
          type="primary"
          plain
          size="mini"
          class="tag-item"
        >
          {{ tag }}
        </van-tag>
      </div>
      
      <div class="article-actions">
        <van-icon name="eye-o" size="14" />
        <span class="read-count">{{ getRandomReadCount() }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDate } from '@/utils/date'
import type { KnowledgeItem } from '@/types/diagnosis'

interface Props {
  article: KnowledgeItem
  highlight?: string
}

const props = defineProps<Props>()

defineEmits<{
  click: []
}>()

const categories = {
  basic: '基础理论',
  'tongue-quality': '舌质分析',
  'tongue-coating': '舌苔分析',
  constitution: '体质辨识',
  cases: '病例分析'
}

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

const getContentPreview = (): string => {
  const content = props.article.content
  // 移除换行符和多余空格，截取前120个字符
  const preview = content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
  return preview.length > 120 ? preview.substring(0, 120) + '...' : preview
}

const highlightText = (text: string): string => {
  if (!props.highlight) return text
  
  const regex = new RegExp(`(${props.highlight})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const getRandomReadCount = (): number => {
  // 模拟阅读量，实际项目中应该从后端获取
  return Math.floor(Math.random() * 1000) + 100
}
</script>

<style scoped>
.article-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.article-card:active {
  transform: translateY(0);
}

.article-header {
  margin-bottom: 12px;
}

.article-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
}

.article-title :deep(mark) {
  background-color: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.article-date {
  font-size: 12px;
  color: #999;
}

.article-content {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.content-preview {
  flex: 1;
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.content-preview :deep(mark) {
  background-color: #fff3cd;
  color: #856404;
  padding: 0 2px;
  border-radius: 2px;
}

.article-image {
  flex-shrink: 0;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-item {
  font-size: 11px;
}

.article-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.read-count {
  font-size: 12px;
  color: #999;
}
</style>