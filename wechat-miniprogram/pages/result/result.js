// pages/result/result.js
Page({
  data: {
    result: null,
    loading: false
  },

  onLoad() {
    this.loadAnalysisResult()
  },

  onShow() {
    // 每次显示页面时重新加载结果
    this.loadAnalysisResult()
  },

  // 加载分析结果
  loadAnalysisResult() {
    const app = getApp()
    const result = app.globalData.lastAnalysisResult
    
    if (result) {
      this.setData({
        result: result
      })
      console.log('加载分析结果:', result)
    } else {
      console.log('暂无分析结果')
      this.setData({
        result: null
      })
    }
  },

  // 产品点击事件
  onProductTap(e) {
    const product = e.currentTarget.dataset.product
    console.log('点击产品:', product)
    
    wx.showModal({
      title: product.name,
      content: `价格: ¥${product.price}\n推荐理由: ${product.reason}\n\n是否要打开购买链接？`,
      confirmText: '打开链接',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 在小程序中不能直接打开外部链接，可以复制到剪贴板
          if (product.taobao_link) {
            wx.setClipboardData({
              data: product.taobao_link,
              success: () => {
                wx.showToast({
                  title: '链接已复制',
                  icon: 'success'
                })
              }
            })
          } else {
            wx.showToast({
              title: '暂无购买链接',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  // 保存报告
  saveReport() {
    if (!this.data.result) {
      wx.showToast({
        title: '暂无报告可保存',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...'
    })

    // 模拟保存到本地存储
    try {
      const reportData = {
        result: this.data.result,
        timestamp: new Date().toISOString(),
        id: Date.now()
      }
      
      // 获取现有报告
      const existingReports = wx.getStorageSync('tongueReports') || []
      existingReports.unshift(reportData)
      
      // 最多保存10个报告
      if (existingReports.length > 10) {
        existingReports.splice(10)
      }
      
      wx.setStorageSync('tongueReports', existingReports)
      
      wx.hideLoading()
      wx.showToast({
        title: '报告已保存',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('保存报告失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 分享报告
  shareReport() {
    if (!this.data.result) {
      wx.showToast({
        title: '暂无报告可分享',
        icon: 'none'
      })
      return
    }

    const result = this.data.result
    const shareText = `📋 我的舌诊分析报告\n\n🔍 舌象特征:\n• 舌质: ${result.tongueBody.color}\n• 舌苔: ${result.coating.color}${result.coating.thickness}\n\n🏥 体质类型: ${result.constitution.primary}\n\n💡 健康建议:\n${result.advice}\n\n来自中医舌诊助手 🌿`

    // 复制到剪贴板
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showModal({
          title: '分享成功',
          content: '报告内容已复制到剪贴板，您可以粘贴到微信或其他应用分享',
          showCancel: false
        })
      }
    })
  },

  // 重新分析
  newAnalysis() {
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },

  // 跳转到分析页面
  goToAnalysis() {
    wx.switchTab({
      url: '/pages/analysis/analysis'
    })
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '中医舌诊助手 - AI智能分析体质',
      path: '/pages/index/index'
    }
  }
})