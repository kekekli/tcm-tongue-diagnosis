<template>
  <div class="products-page">
    <van-nav-bar
      title="精选推荐"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    />

    <div class="content">
      <!-- 推荐说明 -->
      <div class="intro-section">
        <div class="intro-card">
          <h3>为您精心挑选</h3>
          <p>基于舌诊分析结果，推荐适合您体质的优质产品</p>
          <div class="discount-tag">
            <van-icon name="gift-o" />
            <span>限时优惠 8-9折</span>
          </div>
        </div>
      </div>

      <!-- 精选产品列表 -->
      <div class="products-section">
        <div class="section-title">
          <van-icon name="fire-o" color="#ff6034" />
          <span>热门推荐</span>
        </div>
        
        <div class="products-list">
          <div
            v-for="product in featuredProducts"
            :key="product.id"
            class="product-item"
            @click="viewProduct(product)"
          >
            <van-image
              :src="product.image"
              width="80"
              height="80"
              fit="cover"
              round
              class="product-image"
            />
            
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <p class="product-reason">{{ product.reason }}</p>
              
              <div class="product-meta">
                <div class="rating">
                  <van-rate
                    v-model="product.rating"
                    :size="12"
                    color="#ff6034"
                    void-color="#eee"
                    readonly
                  />
                  <span class="rating-text">{{ product.rating }}</span>
                </div>
                <div class="sales">{{ product.salesCount }}人购买</div>
              </div>
              
              <div class="price-section">
                <span class="price-current">¥{{ product.price }}</span>
                <span v-if="product.originalPrice" class="price-original">
                  ¥{{ product.originalPrice }}
                </span>
              </div>
            </div>
            
            <van-button
              type="primary"
              size="small"
              round
              @click.stop="buyNow(product)"
            >
              立即购买
            </van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 产品详情弹窗 -->
    <van-popup
      v-model:show="showProductDetail"
      position="bottom"
      :style="{ height: '80%' }"
      round
    >
      <div v-if="selectedProduct" class="product-detail">
        <div class="detail-header">
          <h3>{{ selectedProduct.name }}</h3>
          <van-icon name="cross" @click="showProductDetail = false" />
        </div>
        
        <div class="detail-content">
          <van-image
            :src="selectedProduct.image"
            width="100%"
            height="200"
            fit="contain"
            class="detail-image"
          />
          
          <div class="detail-info">
            <p class="product-desc">{{ selectedProduct.description }}</p>
            
            <div class="specs">
              <h4>产品规格</h4>
              <div
                v-for="spec in selectedProduct.specifications"
                :key="spec"
                class="spec-item"
              >
                <van-icon name="success" color="#4CAF50" size="14" />
                <span>{{ spec }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-actions">
            <div class="price-info">
              <span class="price">¥{{ selectedProduct.price }}</span>
            </div>
            <van-button
              type="primary"
              size="large"
              round
              @click="buyNow(selectedProduct)"
            >
              立即购买
            </van-button>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Toast } from 'vant'
import productData from '@/data/products.json'

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

const showProductDetail = ref(false)
const selectedProduct = ref<Product | null>(null)

// 精选推荐产品（热门+各体质精选）
const featuredProducts = computed(() => {
  const products: Product[] = []
  
  // 添加热门产品
  products.push(...productData.hotProducts)
  
  // 从各体质产品中选择排名前2的
  Object.values(productData.products).forEach(categoryProducts => {
    products.push(...categoryProducts.slice(0, 2))
  })
  
  // 去重并限制数量
  const uniqueProducts = products.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  )
  
  return uniqueProducts.slice(0, 8) // 限制显示8个产品
})

const viewProduct = (product: Product) => {
  selectedProduct.value = product
  showProductDetail.value = true
}

const buyNow = (product: Product) => {
  if (product.taobaoLink) {
    // 尝试打开淘宝app
    const taobaoAppLink = product.taobaoLink.replace('https://', 'taobao://')
    
    const link = document.createElement('a')
    link.href = taobaoAppLink
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 延迟后打开网页版
    setTimeout(() => {
      window.open(product.taobaoLink, '_blank')
    }, 1000)
    
    Toast.success('正在跳转到购买页面...')
  } else {
    Toast.fail('购买链接暂不可用')
  }
}
</script>

<style scoped>
.products-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.content {
  padding: 16px;
}

.intro-section {
  margin-bottom: 20px;
}

.intro-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
}

.intro-card h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.intro-card p {
  margin: 0 0 16px 0;
  font-size: 14px;
  opacity: 0.9;
}

.discount-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.product-item:active {
  transform: scale(0.98);
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-reason {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #4CAF50;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-text {
  font-size: 12px;
  color: #333;
}

.sales {
  font-size: 11px;
  color: #999;
}

.price-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-current {
  font-size: 18px;
  font-weight: 600;
  color: #ff6034;
}

.price-original {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.detail-image {
  margin-bottom: 20px;
  border-radius: 8px;
}

.product-desc {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.specs h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.spec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
}

.detail-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  background: white;
}

.price {
  font-size: 24px;
  font-weight: 600;
  color: #ff6034;
}

.detail-actions .van-button {
  flex: 1;
  margin-left: 16px;
}
</style>