// pages/analysis/analysis.js
Page({
  data: {
    selectedImage: null,
    analyzing: false,
    progress: 0,
    errorMessage: '',
    analysisComplete: false,
    analysisResult: null
  },

  onLoad() {
    console.log('分析页面加载成功')
  },

  // 选择图片（通用方法）
  chooseImage() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.takePhoto()
        } else if (res.tapIndex === 1) {
          this.chooseFromAlbum()
        }
      },
      fail: (err) => {
        // 用户取消选择，不显示错误
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('用户取消选择操作')
          return
        }
        console.error('显示选择菜单失败:', err)
      }
    })
  },

  // 拍照
  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: (res) => {
        const imagePath = res.tempFiles[0].tempFilePath
        this.setData({
          selectedImage: imagePath,
          errorMessage: '',
          analysisComplete: false
        })
        
        wx.showToast({
          title: '照片选择成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        // 用户取消不显示错误提示
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('用户取消拍照')
          return
        }
        console.error('拍照失败:', err)
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        })
      }
    })
  },

  // 从相册选择
  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const imagePath = res.tempFiles[0].tempFilePath
        this.setData({
          selectedImage: imagePath,
          errorMessage: '',
          analysisComplete: false
        })
        
        wx.showToast({
          title: '图片选择成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        // 用户取消不显示错误提示
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('用户取消选择图片')
          return
        }
        console.error('选择图片失败:', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // 重新选择
  reselect() {
    this.setData({
      selectedImage: null,
      errorMessage: '',
      analysisComplete: false,
      analysisResult: null
    })
  },

  // 开始分析
  startAnalysis() {
    if (!this.data.selectedImage) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    this.setData({
      analyzing: true,
      progress: 0,
      errorMessage: '',
      analysisComplete: false
    })

    // 模拟进度条
    this.simulateProgress()

    // 直接使用图片路径进行AI分析
    const app = getApp()
    app.analyzeImage(this.data.selectedImage, (err, result) => {
      this.setData({
        analyzing: false,
        progress: 100
      })

      if (err) {
        this.setData({
          errorMessage: err,
          analysisComplete: false
        })
        return
      }

      // 分析成功
      this.setData({
        analysisResult: result,
        analysisComplete: true
      })

      // 保存结果到全局数据
      app.globalData.lastAnalysisResult = result
      
      // 自动跳转到结果页面
      wx.showToast({
        title: 'AI分析完成',
        icon: 'success',
        duration: 2000
      })
      
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/result/result'
        })
      }, 2000)
    })
  },

  // 模拟进度条
  simulateProgress() {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 15
      if (progress >= 95) {
        progress = 95
        clearInterval(interval)
      }
      
      this.setData({
        progress: Math.floor(progress)
      })
    }, 200)

    // 保存interval引用以便在页面卸载时清除
    this.progressInterval = interval
  },

  // 查看结果
  viewResult() {
    if (!this.data.analysisResult) {
      wx.showToast({
        title: '分析结果不存在',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: '/pages/result/result'
    })
  },

  // 重新分析
  analyzeAgain() {
    this.setData({
      selectedImage: null,
      analyzing: false,
      progress: 0,
      errorMessage: '',
      analysisComplete: false,
      analysisResult: null
    })
  },

  // 重试
  retry() {
    this.setData({
      errorMessage: ''
    })
  },

  // 页面卸载时清理定时器
  onUnload() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval)
    }
  }
})