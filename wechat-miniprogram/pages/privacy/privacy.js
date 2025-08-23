// pages/privacy/privacy.js
Page({
  data: {
    
  },

  onLoad(options) {
    console.log('隐私协议页面加载')
  },

  // 同意隐私协议
  agreePrivacy() {
    wx.setStorageSync('hasAgreedPrivacy', true)
    wx.setStorageSync('privacyAgreedTime', new Date().toISOString())
    
    wx.showToast({
      title: '授权成功',
      icon: 'success'
    })
    
    // 返回上一页或首页
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }
    })
  },

  // 拒绝授权
  declinePrivacy() {
    wx.showModal({
      title: '提示',
      content: '拒绝授权将无法使用小程序的核心功能，是否确定拒绝？',
      confirmText: '确定拒绝',
      cancelText: '重新考虑',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已取消授权',
            icon: 'none'
          })
          
          // 返回首页
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }
    })
  }
})