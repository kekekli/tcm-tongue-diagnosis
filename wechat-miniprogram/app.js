// app.js
App({
  globalData: {
    // API配置（微信小程序会自动选择合适的地址）
    apiBase: 'http://localhost:3002/api',  // 开发环境使用
    // 真机测试时需要手动修改为: 'http://192.168.0.51:3002/api'
    userInfo: null
  },

  onLaunch() {
    console.log('中医舌诊助手小程序启动')
    
    // 检查API服务状态
    this.checkApiStatus()
  },

  // 检查API服务状态
  checkApiStatus() {
    wx.request({
      url: `${this.globalData.apiBase}/health`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          console.log('API服务正常')
          this.globalData.apiOnline = true
        } else {
          console.error('API服务异常')
          this.globalData.apiOnline = false
        }
      },
      fail: (err) => {
        console.error('API服务连接失败:', err)
        this.globalData.apiOnline = false
        wx.showToast({
          title: 'API服务离线',
          icon: 'none'
        })
      }
    })
  },

  // 舌诊分析API
  analyzeImage(imageData, callback) {
    wx.showLoading({
      title: '分析中...'
    })

    wx.request({
      url: `${this.globalData.apiBase}/diagnosis/analyze`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        imageData: imageData,
        userId: 1
      },
      success: (res) => {
        wx.hideLoading()
        if (res.data && res.data.success) {
          callback(null, res.data.data)
        } else {
          callback(res.data.message || '分析失败', null)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('分析请求失败:', err)
        callback('网络请求失败', null)
      }
    })
  },

  // 获取热门产品
  getHotProducts(callback) {
    wx.request({
      url: `${this.globalData.apiBase}/products/hot`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.success) {
          callback(null, res.data.data)
        } else {
          callback('获取产品失败', null)
        }
      },
      fail: (err) => {
        console.error('获取产品失败:', err)
        callback('网络请求失败', null)
      }
    })
  }
})