<template>
  <div class="products-page">
    <van-nav-bar
      title="产品推荐"
      left-arrow
      @click-left="$router.back()"
      fixed
      placeholder
    >
      <template #right>
        <van-icon name="search" @click="showSearch = true" />
      </template>
    </van-nav-bar>

    <div class="content">
      <!-- 顶部推荐横幅 -->
      <div class="banner-section">
        <div class="banner-card">
          <div class="banner-content">
            <div class="banner-text">
              <h3>个性化产品推荐</h3>
              <p>基于您的舌诊结果和体质类型，为您精选适合的中医养生产品</p>
            </div>
            <div class="banner-image">
              <van-icon name="shop-o" size="48" color="#4CAF50" />
            </div>
          </div>
          <div class="discount-info">
            <van-icon name="gift-o" color="#ff6034" />
            <span>{{ productData.discountInfo.description }}</span>
          </div>
        </div>
      </div>

      <!-- 分类导航 -->
      <div class="category-section">
        <van-tabs 
          v-model:active="activeCategory" 
          sticky
          offset-top="46"
          swipeable
          animated
        >
          <van-tab 
            v-for="category in categories" 
            :key="category.id" 
            :title="category.name"
            :name="category.id"
          >
            <div class="category-content">
              <!-- 热门推荐 -->
              <div v-if="category.id === 'all'" class="hot-products">
                <div class="section-title">
                  <van-icon name="fire-o" color="#ff6034" />
                  <span>热门推荐</span>
                </div>
                <div class="hot-list">
                  <ProductCard
                    v-for="product in hotProducts"
                    :key="product.id"
                    :product="product"
                    @click="viewProduct(product)"
                  />
                </div>
              </div>

              <!-- 体质推荐 -->
              <div v-if="category.id === 'all'" class="constitution-recommendations">
                <div class="section-title">
                  <van-icon name="user-o" color="#4CAF50" />
                  <span>基于您的体质推荐</span>
                </div>
                <div v-if="userConstitution" class="constitution-banner">
                  <div class="constitution-info">
                    <span class="constitution-name">{{ userConstitution.name }}</span>
                    <span class="constitution-desc">{{ userConstitution.description }}</span>
                  </div>
                  <van-button size="small" type="primary" plain @click="viewConstitutionProducts">
                    查看推荐
                  </van-button>
                </div>
                <div v-else class="no-constitution">
                  <p>完成体质测试，获得个性化产品推荐</p>
                  <van-button size="small" type="primary" @click="goToConstitutionTest">
                    立即测试
                  </van-button>
                </div>
              </div>

              <!-- 分类产品列表 -->
              <div class="products-grid">
                <ProductCard
                  v-for="product in getProductsByCategory(category.id)"
                  :key="product.id"
                  :product="product"
                  @click="viewProduct(product)"
                />
              </div>

              <!-- 空状态 -->
              <div v-if="getProductsByCategory(category.id).length === 0" class="empty-state">
                <van-empty description="暂无相关产品" />
              </div>
            </div>
          </van-tab>
        </van-tabs>
      </div>
    </div>

    <!-- 产品详情弹窗 -->
    <van-popup
      v-model:show="showProductDetail"
      position="right"
      :style="{ width: '100%', height: '100%' }"
    >
      <ProductDetail
        v-if="selectedProduct"
        :product="selectedProduct"
        :related-products="getRelatedProducts(selectedProduct)"
        @close="showProductDetail = false"
        @view-related="viewProduct"
      />
    </van-popup>

    <!-- 品牌展示 -->
    <div class="brands-section">
      <div class="section-title">
        <van-icon name="medal-o" color="#4CAF50" />
        <span>合作品牌</span>
      </div>
      <div class="brands-list">
        <div 
          v-for="brand in productData.brands" 
          :key="brand.id"
          class="brand-item"
        >
          <div class="brand-logo">
            <van-image
              :src="brand.logo"
              width="60"
              height="40"
              fit="contain"
              :show-error="false"
              :show-loading="false"
            />
          </div>
          <div class="brand-info">
            <div class="brand-name">{{ brand.name }}</div>
            <div class="brand-desc">{{ brand.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <van-popup v-model:show="showSearch" position="top">
      <div class="search-container">
        <van-search
          v-model="searchKeyword"
          placeholder="搜索产品名称或功效"
          @search="onSearch"
          @cancel="showSearch = false"
          show-action
        />
        <div v-if="searchResults.length > 0" class="search-results">
          <ProductCard
            v-for="product in searchResults"
            :key="product.id"
            :product="product"
            @click="viewProduct(product)"
          />
        </div>
        <div v-else-if="searchKeyword" class="no-results">
          <van-empty description="未找到相关产品" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Toast } from 'vant'
import ProductCard from '@/components/Products/ProductCard.vue'
import ProductDetail from '@/components/Products/ProductDetail.vue'
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

interface Constitution {
  name: string
  description: string
  type: string
}

const router = useRouter()

const activeCategory = ref('all')
const showProductDetail = ref(false)
const selectedProduct = ref<Product | null>(null)
const showSearch = ref(false)
const searchKeyword = ref('')
const userConstitution = ref<Constitution | null>(null)

const categories = computed(() => [
  { id: 'all', name: '全部' },
  ...productData.categories
])

const hotProducts = computed(() => productData.hotProducts)

const searchResults = computed(() => {
  if (!searchKeyword.value) return []
  
  const keyword = searchKeyword.value.toLowerCase()
  const allProducts = getAllProducts()
  
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(keyword) ||
    product.reason.toLowerCase().includes(keyword) ||
    product.description.toLowerCase().includes(keyword) ||
    product.tags.some(tag => tag.toLowerCase().includes(keyword))
  )
})

const getAllProducts = (): Product[] => {
  const products: Product[] = []
  
  // 添加热门产品
  products.push(...productData.hotProducts)
  
  // 添加各体质产品
  Object.values(productData.products).forEach(categoryProducts => {
    products.push(...categoryProducts)
  })
  
  // 去重
  const uniqueProducts = products.filter((product, index, self) => 
    index === self.findIndex(p => p.id === product.id)
  )
  
  return uniqueProducts
}

const getProductsByCategory = (categoryId: string): Product[] => {
  if (categoryId === 'all') {
    return getAllProducts()
  }
  
  const allProducts = getAllProducts()
  return allProducts.filter(product => product.category === categoryId)
}

const getRelatedProducts = (product: Product): Product[] => {
  const allProducts = getAllProducts()
  return allProducts
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 4)
}

const viewProduct = (product: Product) => {
  selectedProduct.value = product
  showProductDetail.value = true
  showSearch.value = false
}

const viewConstitutionProducts = () => {
  if (!userConstitution.value) return
  
  // 跳转到对应体质的产品页面
  const constitutionProducts = productData.products[userConstitution.value.type as keyof typeof productData.products] || []
  
  if (constitutionProducts.length > 0) {
    viewProduct(constitutionProducts[0])
  } else {
    Toast('暂无该体质的推荐产品')
  }
}

const goToConstitutionTest = () => {
  router.push('/constitution-test')
}

const onSearch = () => {
  if (!searchKeyword.value.trim()) {
    Toast('请输入搜索关键词')
    return
  }
  
  // 搜索逻辑已在 computed 中实现
  if (searchResults.value.length === 0) {
    Toast('未找到相关产品')
  }
}

const loadUserConstitution = () => {
  try {
    // 从体质测试结果中获取用户主要体质
    const savedTests = JSON.parse(
      localStorage.getItem('tcm-constitution-tests') || '[]'
    )
    
    if (savedTests.length > 0) {
      const latestTest = savedTests[0]
      const mainResult = latestTest.results[0]
      
      if (mainResult) {
        userConstitution.value = {
          name: mainResult.name,
          description: mainResult.description,
          type: mainResult.type
        }
      }
    }
  } catch (error) {
    console.error('加载用户体质信息失败:', error)
  }
}

onMounted(() => {
  loadUserConstitution()
})
</script>

<style scoped>
.products-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.content {
  padding-bottom: 20px;
}

.banner-section {
  padding: 16px;
}

.banner-card {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
  border-radius: 16px;
  padding: 20px;
  color: white;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.banner-text {
  flex: 1;
}

.banner-text h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
}

.banner-image {
  flex-shrink: 0;
  margin-left: 16px;
}

.discount-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 13px;
}

.category-section {
  background: white;
}

.category-content {
  padding: 16px;
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

.hot-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 32px;
}

.constitution-recommendations {
  margin-bottom: 32px;
}

.constitution-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(76, 175, 80, 0.1);
  border-radius: 12px;
  border-left: 4px solid #4CAF50;
  margin-bottom: 16px;
}

.constitution-info {
  flex: 1;
}

.constitution-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #4CAF50;
  margin-bottom: 4px;
}

.constitution-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.no-constitution {
  text-align: center;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 12px;
  margin-bottom: 16px;
}

.no-constitution p {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 14px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.brands-section {
  padding: 16px;
  background: white;
  margin-top: 8px;
}

.brands-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.brand-logo {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-info {
  flex: 1;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.brand-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.search-container {
  padding: 16px;
  max-height: 80vh;
  overflow-y: auto;
}

.search-results {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.no-results {
  padding: 40px 20px;
  text-align: center;
}
</style>