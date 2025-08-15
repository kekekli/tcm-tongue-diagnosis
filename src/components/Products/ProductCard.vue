<template>
  <div class="product-card" @click="$emit('click')">
    <div class="product-image">
      <van-image
        :src="product.image"
        width="100%"
        height="120"
        fit="cover"
        :show-error="false"
        :show-loading="false"
      />
      <div v-if="showDiscount" class="discount-badge">
        {{ discountText }}
      </div>
    </div>
    
    <div class="product-info">
      <div class="product-name">{{ product.name }}</div>
      <div class="product-reason">{{ product.reason }}</div>
      
      <div class="product-meta">
        <div class="rating-sales">
          <van-rate
            v-model="product.rating"
            :size="12"
            color="#ff6034"
            void-color="#eee"
            readonly
          />
          <span class="sales-count">{{ product.salesCount }}</span>
        </div>
        
        <div class="shop-info">
          <van-icon name="shop-o" size="12" />
          <span>{{ product.shopName }}</span>
        </div>
      </div>
      
      <div class="product-tags">
        <van-tag
          v-for="tag in product.tags.slice(0, 3)"
          :key="tag"
          type="primary"
          size="mini"
          plain
        >
          {{ tag }}
        </van-tag>
      </div>
      
      <div class="product-price">
        <div class="price-current">¥{{ product.price }}</div>
        <div v-if="product.originalPrice" class="price-original">
          ¥{{ product.originalPrice }}
        </div>
      </div>
    </div>
    
    <div class="product-actions">
      <van-button
        type="primary"
        size="small"
        round
        @click.stop="buyNow"
      >
        立即购买
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
  showDiscount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDiscount: true
})

defineEmits<{
  click: []
}>()

const discountText = computed(() => {
  if (!props.product.originalPrice) return ''
  
  const current = parseFloat(props.product.price)
  const original = parseFloat(props.product.originalPrice)
  const discount = Math.round((1 - current / original) * 10)
  
  return `${discount}折`
})

const buyNow = () => {
  // 跳转到淘宝链接
  if (props.product.taobaoLink) {
    // 先尝试打开淘宝app
    const taobaoAppLink = props.product.taobaoLink.replace('https://', 'taobao://')
    
    // 创建一个隐藏的链接来尝试打开app
    const link = document.createElement('a')
    link.href = taobaoAppLink
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 延迟后打开网页版（如果app没有成功打开）
    setTimeout(() => {
      window.open(props.product.taobaoLink, '_blank')
    }, 1000)
    
    Toast.success('正在跳转到购买页面...')
  } else {
    Toast.fail('购买链接暂不可用')
  }
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.product-card:active {
  transform: translateY(0);
}

.product-image {
  position: relative;
  overflow: hidden;
}

.discount-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff6034;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-reason {
  font-size: 12px;
  color: #4CAF50;
  margin-bottom: 8px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  margin-bottom: 8px;
}

.rating-sales {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.sales-count {
  font-size: 11px;
  color: #999;
}

.shop-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
}

.product-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.product-tags .van-tag {
  flex-shrink: 0;
}

.product-price {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.price-current {
  font-size: 16px;
  font-weight: 600;
  color: #ff6034;
}

.price-original {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-actions {
  padding: 0 12px 12px;
}

.product-actions .van-button {
  width: 100%;
}
</style>