<template>
  <div class="product-detail">
    <van-nav-bar
      :title="product.name"
      left-arrow
      @click-left="$emit('close')"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="share-o" @click="shareProduct" />
      </template>
    </van-nav-bar>

    <div class="detail-content">
      <!-- 产品图片 -->
      <div class="product-gallery">
        <van-image
          :src="product.image"
          width="100%"
          height="300"
          fit="contain"
          @click="previewImage"
        />
        <div class="gallery-indicators">
          <div class="indicator active"></div>
        </div>
      </div>

      <!-- 产品信息 -->
      <div class="product-info card">
        <div class="product-header">
          <h1 class="product-title">{{ product.name }}</h1>
          <div class="product-reason">{{ product.reason }}</div>
        </div>
        
        <div class="product-meta">
          <div class="rating-section">
            <van-rate
              v-model="product.rating"
              :size="16"
              color="#ff6034"
              void-color="#eee"
              readonly
            />
            <span class="rating-text">{{ product.rating }}分</span>
            <span class="sales-count">{{ product.salesCount }}人购买</span>
          </div>
          
          <div class="shop-section">
            <van-icon name="shop-o" size="16" color="#4CAF50" />
            <span class="shop-name">{{ product.shopName }}</span>
            <van-tag type="success" size="mini">官方</van-tag>
          </div>
        </div>

        <div class="price-section">
          <div class="price-main">
            <span class="price-symbol">¥</span>
            <span class="price-number">{{ product.price }}</span>
          </div>
          <div v-if="product.originalPrice" class="price-original">
            原价：¥{{ product.originalPrice }}
          </div>
        </div>

        <div class="tags-section">
          <van-tag
            v-for="tag in product.tags"
            :key="tag"
            type="primary"
            size="medium"
            plain
          >
            {{ tag }}
          </van-tag>
        </div>
      </div>

      <!-- 产品详情 -->
      <div class="product-details card">
        <div class="section-title">产品详情</div>
        
        <div class="detail-item">
          <div class="detail-label">产品描述</div>
          <div class="detail-content-text">{{ product.description }}</div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">推荐理由</div>
          <div class="detail-content-text reason-text">
            <van-icon name="info-o" color="#4CAF50" />
            {{ product.reason }}
          </div>
        </div>
        
        <div class="detail-item">
          <div class="detail-label">产品规格</div>
          <div class="specifications">
            <div
              v-for="spec in product.specifications"
              :key="spec"
              class="spec-item"
            >
              <van-icon name="success" color="#4CAF50" size="14" />
              <span>{{ spec }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="usage-guide card">
        <div class="section-title">使用指南</div>
        <div class="guide-content">
          <div class="guide-item">
            <div class="guide-icon">
              <van-icon name="clock-o" size="20" color="#4CAF50" />
            </div>
            <div class="guide-text">
              <div class="guide-title">服用时间</div>
              <div class="guide-desc">建议饭前30分钟或饭后1小时服用</div>
            </div>
          </div>
          
          <div class="guide-item">
            <div class="guide-icon">
              <van-icon name="warning-o" size="20" color="#ff6034" />
            </div>
            <div class="guide-text">
              <div class="guide-title">注意事项</div>
              <div class="guide-desc">孕妇、哺乳期妇女及儿童请在医师指导下使用</div>
            </div>
          </div>
          
          <div class="guide-item">
            <div class="guide-icon">
              <van-icon name="logistics" size="20" color="#2196F3" />
            </div>
            <div class="guide-text">
              <div class="guide-title">保存方法</div>
              <div class="guide-desc">密封保存，置于阴凉干燥处，避免阳光直射</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 相关推荐 -->
      <div v-if="relatedProducts.length > 0" class="related-products card">
        <div class="section-title">相关推荐</div>
        <div class="related-list">
          <div
            v-for="related in relatedProducts"
            :key="related.id"
            class="related-item"
            @click="viewRelated(related)"
          >
            <van-image
              :src="related.image"
              width="60"
              height="60"
              fit="cover"
              round
            />
            <div class="related-info">
              <div class="related-name">{{ related.name }}</div>
              <div class="related-price">¥{{ related.price }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部购买栏 -->
    <div class="bottom-bar">
      <div class="price-info">
        <div class="price-label">价格</div>
        <div class="price-value">¥{{ product.price }}</div>
      </div>
      
      <div class="action-buttons">
        <van-button
          @click="addToCart"
          size="large"
          round
          plain
        >
          <van-icon name="shopping-cart-o" />
          加入购物车
        </van-button>
        
        <van-button
          type="primary"
          @click="buyNow"
          size="large"
          round
        >
          立即购买
        </van-button>
      </div>
    </div>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="showImagePreview"
      :images="[product.image]"
    />

    <!-- 购买确认弹窗 -->
    <van-dialog
      v-model:show="showBuyDialog"
      title="确认购买"
      :message="buyDialogMessage"
      show-cancel-button
      @confirm="confirmBuy"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Toast } from 'vant'

interface Product {
  id: string
  name: string
  category: string
  price: string
  originalPrice?: string
  reason: string
  description: string
  rating: number
  salesCount: string
  shopName: string
  taobaoLink: string
  image: string
  tags: string[]
  specifications: string[]
}

interface Props {
  product: Product
  relatedProducts?: Product[]
}

const props = withDefaults(defineProps<Props>(), {
  relatedProducts: () => []
})

defineEmits<{
  close: []
  viewRelated: [product: Product]
}>()

const showImagePreview = ref(false)
const showBuyDialog = ref(false)

const buyDialogMessage = computed(() => {
  return `确定要购买 ${props.product.name} 吗？\n价格：¥${props.product.price}\n将跳转到淘宝进行购买。`
})

const previewImage = () => {
  showImagePreview.value = true
}

const shareProduct = () => {
  const shareText = `推荐一个好产品：${props.product.name}\n${props.product.reason}\n价格：¥${props.product.price}\n${props.product.taobaoLink}`

  if (navigator.share) {
    navigator.share({
      title: props.product.name,
      text: shareText
    }).catch(() => {
      navigator.clipboard.writeText(shareText)
      Toast.success('产品信息已复制到剪贴板')
    })
  } else {
    navigator.clipboard.writeText(shareText)
    Toast.success('产品信息已复制到剪贴板')
  }
}

const addToCart = () => {
  // 模拟加入购物车
  Toast.success('已加入购物车')
}

const buyNow = () => {
  showBuyDialog.value = true
}

const confirmBuy = () => {
  showBuyDialog.value = false
  
  if (props.product.taobaoLink) {
    // 尝试打开淘宝app
    const taobaoAppLink = props.product.taobaoLink.replace('https://', 'taobao://')
    
    const link = document.createElement('a')
    link.href = taobaoAppLink
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 延迟后打开网页版
    setTimeout(() => {
      window.open(props.product.taobaoLink, '_blank')
    }, 1000)
    
    Toast.success('正在跳转到购买页面...')
  } else {
    Toast.fail('购买链接暂不可用')
  }
}

const viewRelated = (product: Product) => {
  // 触发查看相关产品事件
  console.log('查看相关产品:', product.name)
}
</script>

<style scoped>
.product-detail {
  height: 100vh;
  background: #f8f9fa;
  overflow-y: auto;
  padding-bottom: 80px;
}

.detail-content {
  padding: 16px;
}

.product-gallery {
  position: relative;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.gallery-indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.3s ease;
}

.indicator.active {
  background: white;
}

.product-info {
  margin-bottom: 16px;
}

.product-header {
  margin-bottom: 16px;
}

.product-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.product-reason {
  font-size: 14px;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  display: inline-block;
}

.product-meta {
  margin-bottom: 16px;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rating-text {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.sales-count {
  font-size: 12px;
  color: #999;
}

.shop-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shop-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.price-section {
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #ff6034, #ff7849);
  border-radius: 12px;
  color: white;
}

.price-main {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
}

.price-symbol {
  font-size: 18px;
  font-weight: 500;
}

.price-number {
  font-size: 28px;
  font-weight: 600;
}

.price-original {
  font-size: 14px;
  opacity: 0.8;
  text-decoration: line-through;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.product-details {
  margin-bottom: 16px;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.detail-content-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.reason-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

.specifications {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.usage-guide {
  margin-bottom: 16px;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide-item {
  display: flex;
  gap: 12px;
}

.guide-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: #f9f9f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-text {
  flex: 1;
}

.guide-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.guide-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.related-products {
  margin-bottom: 16px;
}

.related-list {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.related-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.related-item:hover {
  background: #f0f0f0;
}

.related-info {
  text-align: center;
}

.related-name {
  font-size: 12px;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 80px;
}

.related-price {
  font-size: 12px;
  color: #ff6034;
  font-weight: 600;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: white;
  border-top: 1px solid #eee;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.price-label {
  font-size: 12px;
  color: #999;
}

.price-value {
  font-size: 18px;
  font-weight: 600;
  color: #ff6034;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex: 1;
}

.action-buttons .van-button {
  flex: 1;
}
</style>