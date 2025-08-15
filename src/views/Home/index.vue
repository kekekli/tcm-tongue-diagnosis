<template>
  <div class="home-page">
    <van-nav-bar title="舌诊助手" fixed placeholder />

    <div class="content-wrapper">
      <!-- 主标题区域 -->
      <div class="hero-section">
        <div class="app-logo">
          <van-icon name="photo-o" size="60" color="#4CAF50" />
        </div>
        <h1 class="app-title">AI舌诊助手</h1>
        <p class="app-subtitle">拍张照片，了解你的体质</p>
      </div>

      <!-- 核心功能按钮 -->
      <div class="main-action">
        <van-button
          type="primary"
          size="large"
          round
          block
          @click="startDiagnosis"
          class="start-btn"
        >
          <van-icon name="camera-o" size="24" />
          开始舌诊
        </van-button>
      </div>

      <!-- 简单说明 -->
      <div class="features">
        <div class="feature-item">
          <van-icon name="camera-o" color="#4CAF50" />
          <span>拍摄舌头照片</span>
        </div>
        <div class="feature-item">
          <van-icon name="search" color="#2196F3" />
          <span>AI智能分析</span>
        </div>
        <div class="feature-item">
          <van-icon name="shop-o" color="#ff6034" />
          <span>个性化推荐</span>
        </div>
      </div>

      <!-- 底部产品推荐入口 -->
      <div class="bottom-action">
        <van-button
          plain
          round
          @click="viewProducts"
          class="products-btn"
        >
          查看推荐产品
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const startDiagnosis = () => {
  router.push('/camera')
}

const viewProducts = () => {
  router.push('/products')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.content-wrapper {
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 46px);
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
}

.app-logo {
  margin-bottom: 20px;
}

.app-title {
  font-size: 32px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.app-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.main-action {
  margin-bottom: 40px;
}

.start-btn {
  height: 60px;
  font-size: 20px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.features {
  display: flex;
  justify-content: space-around;
  margin-bottom: 60px;
  padding: 0 20px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.bottom-action {
  margin-top: auto;
  text-align: center;
}

.products-btn {
  color: #4CAF50;
  border-color: #4CAF50;
}
</style>