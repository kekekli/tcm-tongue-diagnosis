// components/debug-panel/debug-panel.js
Component({
  data: {
    showDebug: false,
    apiStatus: { text: '检测中...', color: 'warning' },
    apiBase: '',
    currentPage: '',
    pageStack: 0,
    storageInfo: { reports: 0 },
    logs: []
  },

  lifetimes: {
    attached() {
      // 总是初始化调试功能（微信小程序中没有process.env）
      this.initDebugInfo();
      this.startDebugMonitor();
    }
  },

  methods: {
    // 显示调试面板
    showDebug() {
      this.setData({ showDebug: true });
      this.updateDebugInfo();
    },

    // 隐藏调试面板
    hideDebug() {
      this.setData({ showDebug: false });
    },

    // 初始化调试信息
    initDebugInfo() {
      const app = getApp();
      this.setData({
        apiBase: app.globalData.apiBase
      });
      this.updatePageInfo();
      this.updateStorageInfo();
      this.testAPIStatus();
    },

    // 更新调试信息
    updateDebugInfo() {
      this.updatePageInfo();
      this.updateStorageInfo();
      this.testAPIStatus();
    },

    // 更新页面信息
    updatePageInfo() {
      const pages = getCurrentPages();
      this.setData({
        currentPage: pages[pages.length - 1].route,
        pageStack: pages.length
      });
    },

    // 更新存储信息
    updateStorageInfo() {
      try {
        const reports = wx.getStorageSync('tongueReports') || [];
        this.setData({
          'storageInfo.reports': reports.length
        });
      } catch (error) {
        this.addLog('error', '读取存储失败: ' + error.message);
      }
    },

    // 测试API状态
    testAPIStatus() {
      const app = getApp();
      wx.request({
        url: `${app.globalData.apiBase}/health`,
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          if (res.statusCode === 200 && res.data.success) {
            this.setData({
              apiStatus: { text: '在线', color: 'success' }
            });
            this.addLog('info', 'API连接正常');
          } else {
            this.setData({
              apiStatus: { text: '异常', color: 'error' }
            });
            this.addLog('error', 'API响应异常');
          }
        },
        fail: (err) => {
          this.setData({
            apiStatus: { text: '离线', color: 'error' }
          });
          this.addLog('error', 'API连接失败: ' + err.errMsg);
        }
      });
    },

    // 测试API连接
    testAPI() {
      this.addLog('info', '开始测试API连接...');
      this.testAPIStatus();
    },

    // 清理存储
    clearStorage() {
      try {
        wx.removeStorageSync('tongueReports');
        this.updateStorageInfo();
        this.addLog('success', '存储数据已清理');
        wx.showToast({
          title: '数据已清理',
          icon: 'success'
        });
      } catch (error) {
        this.addLog('error', '清理失败: ' + error.message);
      }
    },

    // 模拟分析
    simulateAnalysis() {
      this.addLog('info', '开始模拟分析...');
      const app = getApp();
      const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
      
      app.analyzeImage(testImageData, (err, result) => {
        if (err) {
          this.addLog('error', '模拟分析失败: ' + err);
        } else {
          this.addLog('success', '模拟分析成功，体质: ' + result.constitution.primary);
        }
      });
    },

    // 显示日志
    showLogs() {
      // 获取控制台日志（如果可能）
      this.addLog('info', '当前显示调试日志');
    },

    // 导出日志
    exportLogs() {
      const logText = this.data.logs.map(log => 
        `[${log.time}] ${log.level.toUpperCase()}: ${log.message}`
      ).join('\n');
      
      wx.setClipboardData({
        data: logText,
        success: () => {
          wx.showToast({
            title: '日志已复制',
            icon: 'success'
          });
        }
      });
    },

    // 快速测试
    quickTest() {
      this.addLog('info', '开始快速测试...');
      this.testAPIStatus();
      
      // 测试页面跳转
      try {
        wx.navigateTo({
          url: '/pages/analysis/analysis',
          success: () => {
            this.addLog('success', '页面跳转测试成功');
            // 立即返回
            setTimeout(() => {
              wx.navigateBack();
            }, 1000);
          },
          fail: (err) => {
            this.addLog('error', '页面跳转失败: ' + err.errMsg);
          }
        });
      } catch (error) {
        this.addLog('error', '跳转测试异常: ' + error.message);
      }
    },

    // 重新加载页面
    reloadPage() {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    },

    // 清理日志
    clearLogs() {
      this.setData({ logs: [] });
    },

    // 添加日志
    addLog(level, message) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const logs = this.data.logs.slice();
      logs.unshift({
        level,
        message,
        time,
        timestamp: Date.now()
      });
      
      // 只保留最近50条日志
      if (logs.length > 50) {
        logs.splice(50);
      }
      
      this.setData({ logs });
      
      // 同时输出到控制台
      console.log(`[DEBUG] ${level.toUpperCase()}: ${message}`);
    },

    // 启动调试监控
    startDebugMonitor() {
      // 监控网络请求
      const originalRequest = wx.request;
      const self = this;
      
      wx.request = function(options) {
        const url = options.url;
        const method = options.method || 'GET';
        
        self.addLog('info', `${method} ${url}`);
        
        const originalSuccess = options.success;
        const originalFail = options.fail;
        
        options.success = function(res) {
          self.addLog('success', `${method} ${url} -> ${res.statusCode}`);
          if (originalSuccess) originalSuccess(res);
        };
        
        options.fail = function(err) {
          self.addLog('error', `${method} ${url} -> ${err.errMsg}`);
          if (originalFail) originalFail(err);
        };
        
        return originalRequest(options);
      };
      
      this.addLog('info', '调试监控已启动');
    }
  }
});