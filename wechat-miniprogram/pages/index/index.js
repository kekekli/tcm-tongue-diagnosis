// pages/index/index.js
Page({
  data: {
    hotProducts: [],
    loading: false
  },

  onLoad() {
    console.log('首页加载完成')
    this.loadHotProducts()
  },

  onShow() {
    // 每次显示页面时刷新热门产品
    this.loadHotProducts()
  },

  // 加载热门产品
  loadHotProducts() {
    const app = getApp()
    app.getHotProducts((err, products) => {
      if (err) {
        console.error('获取热门产品失败:', err)
        wx.showToast({
          title: '获取产品失败',
          icon: 'none'
        })
        return
      }
      
      // 只显示前3个产品
      this.setData({
        hotProducts: products.slice(0, 3)
      })
    })
  },

  // 跳转到分析页面
  goToAnalysis() {
    console.log('点击了舌诊分析按钮')
    wx.navigateTo({
      url: '/pages/analysis/analysis'
    })
  },

  // 查看历史记录
  viewHistory() {
    try {
      const reports = wx.getStorageSync('tongueReports') || []
      if (reports.length === 0) {
        wx.showToast({
          title: '暂无历史记录',
          icon: 'none'
        })
        return
      }
      
      wx.showModal({
        title: '历史记录',
        content: `您有 ${reports.length} 条舌诊记录`,
        confirmText: '查看',
        success: (res) => {
          if (res.confirm) {
            // 这里可以跳转到历史记录页面
            wx.showToast({
              title: '功能开发中',
              icon: 'none'
            })
          }
        }
      })
    } catch (error) {
      wx.showToast({
        title: '获取记录失败',
        icon: 'none'
      })
    }
  },

  // 分享小程序
  shareApp() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    })
  },

  // 产品点击事件
  onProductTap(e) {
    const productId = e.currentTarget.dataset.id
    console.log('点击产品:', productId)
    
    wx.showModal({
      title: '产品详情',
      content: `产品ID: ${productId}\n\n是否要查看更多详情？`,
      confirmText: '查看详情',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        }
      }
    })
  }
})