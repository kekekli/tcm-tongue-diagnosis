import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: { title: '首页', keepAlive: true }
  },
  {
    path: '/camera',
    name: 'Camera',
    component: () => import('@/views/Camera/index.vue'),
    meta: { title: '舌象拍照', keepAlive: false }
  },
  {
    path: '/analysis/:id?',
    name: 'Analysis',
    component: () => import('@/views/Analysis/index.vue'),
    meta: { title: '分析结果', keepAlive: false }
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/Knowledge/index.vue'),
    meta: { title: '舌诊知识库', keepAlive: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@/views/Reports/index.vue'),
    meta: { title: '健康报告', keepAlive: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History/index.vue'),
    meta: { title: '历史记录', keepAlive: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: { title: '个人中心', keepAlive: true }
  },
  {
    path: '/constitution-test',
    name: 'ConstitutionTest',
    component: () => import('@/views/ConstitutionTest/index.vue'),
    meta: { title: '体质测试', keepAlive: false }
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('@/views/Products/index.vue'),
    meta: { title: '产品推荐', keepAlive: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta?.title) {
    document.title = `${to.meta.title} - 中医舌诊助手`
  }
  next()
})

export default router