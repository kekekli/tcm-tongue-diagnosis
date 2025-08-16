// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

// API响应接口
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message: string
}

// 产品接口
export interface Product {
  id: number
  name: string
  description: string
  price: string
  original_price?: string
  rating: number
  sales_count: string
  shop_name: string
  image_url: string
  taobao_link: string
  category: string
  tags: string[]
  specifications: string[]
  reason: string
}

// 舌诊分析结果接口
export interface AnalysisResult {
  tongueBody: {
    color: string
    texture: string
  }
  coating: {
    color: string
    thickness: string
  }
  constitution: {
    primary: string
  }
  advice: string
  products: Product[]
}

// 通用请求函数
async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('API请求失败:', error)
    throw error
  }
}

// =================== 产品相关API ===================

// 获取推荐产品
export async function getRecommendedProducts(params?: {
  constitution_type?: string
  limit?: number
}): Promise<ApiResponse<Product[]>> {
  const searchParams = new URLSearchParams()
  
  if (params?.constitution_type) {
    searchParams.append('constitution_type', params.constitution_type)
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString())
  }

  const url = `/api/products/recommendations${searchParams.toString() ? '?' + searchParams.toString() : ''}`
  return request<Product[]>(url)
}

// 获取热门产品
export async function getHotProducts(): Promise<ApiResponse<Product[]>> {
  return request<Product[]>('/api/products/hot')
}

// 获取产品详情
export async function getProductDetail(id: number): Promise<ApiResponse<Product>> {
  return request<Product>(`/api/products/${id}`)
}

// 产品点击统计
export async function trackProductClick(productId: number, params?: {
  userId?: number
  clickFrom?: 'analysis' | 'products_page'
}): Promise<ApiResponse> {
  return request(`/api/products/${productId}/click`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  })
}

// =================== 舌诊分析API ===================

// 舌诊分析
export async function analyzeTongueImage(params: {
  imageData: string
  userId?: number
}): Promise<ApiResponse<AnalysisResult>> {
  return request<AnalysisResult>('/api/diagnosis/analyze', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// =================== 用户相关API (可选) ===================

// 手机验证码登录 (暂时模拟)
export async function loginWithPhone(phone: string, code: string): Promise<ApiResponse<{
  token: string
  user: any
}>> {
  // 模拟登录成功
  return {
    success: true,
    data: {
      token: 'mock_token_' + Date.now(),
      user: {
        id: 1,
        phone,
        nickname: '用户' + phone.slice(-4)
      }
    },
    message: '登录成功'
  }
}

// 发送验证码 (暂时模拟)
export async function sendVerifyCode(phone: string): Promise<ApiResponse> {
  // 模拟发送成功
  console.log('模拟发送验证码到:', phone)
  return {
    success: true,
    message: '验证码发送成功'
  }
}