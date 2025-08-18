// app.js
App({
  globalData: {
    // API配置（微信小程序会自动选择合适的地址）
    apiBase: 'http://192.168.110.20:3005/api',  // 开发环境使用
    // 开发环境使用: 'http://localhost:3005/api'
    userInfo: null
  },

  onLaunch() {
    console.log('中医舌诊助手小程序启动')
    
    // 检查API服务状态
    this.checkApiStatus()
  },

  // 检查API服务状态
  checkApiStatus() {
    // 使用产品API检查服务状态（不需要管理员权限）
    wx.request({
      url: `${this.globalData.apiBase}/products`,
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

  // 舌诊分析API - 使用新的AI接口
  analyzeImage(imagePath, callback) {
    wx.showLoading({
      title: 'AI分析中...'
    })

    wx.uploadFile({
      url: `${this.globalData.apiBase}/analyze-tongue-ai`,
      filePath: imagePath,
      name: 'tongueImage',
      formData: {
        userId: 1
      },
      success: (res) => {
        wx.hideLoading()
        try {
          const data = JSON.parse(res.data)
          if (data.success) {
            callback(null, data.data)
          } else {
            // 显示AI验证错误信息
            const errorMsg = data.error || '分析失败'
            const suggestion = data.suggestion || '请重新上传'
            
            wx.showModal({
              title: '图片验证失败',
              content: `${errorMsg}\n\n建议：${suggestion}`,
              showCancel: false,
              confirmText: '重新选择'
            })
            
            callback(errorMsg, null)
          }
        } catch (parseError) {
          console.error('解析响应失败:', parseError)
          callback('响应格式错误', null)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败:', err)
        callback('网络请求失败', null)
      }
    })
  },

  // 获取热门产品
  getHotProducts(callback) {
    wx.request({
      url: `${this.globalData.apiBase}/products`,
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