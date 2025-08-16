// 调试助手脚本 - 在微信开发者工具控制台中运行

// 1. 检查全局配置
function checkGlobalConfig() {
  console.log('🔧 检查全局配置:');
  const app = getApp();
  console.log('API Base URL:', app.globalData.apiBase);
  console.log('API在线状态:', app.globalData.apiOnline);
  console.log('用户信息:', app.globalData.userInfo);
  console.log('上次分析结果:', app.globalData.lastAnalysisResult ? '存在' : '无');
}

// 2. 测试API连接
function testAPIConnection() {
  console.log('🌐 测试API连接:');
  const app = getApp();
  
  wx.request({
    url: `${app.globalData.apiBase}/health`,
    method: 'GET',
    success: (res) => {
      console.log('✅ API连接成功:', res.data);
    },
    fail: (err) => {
      console.error('❌ API连接失败:', err);
    }
  });
}

// 3. 检查本地存储
function checkLocalStorage() {
  console.log('💾 检查本地存储:');
  try {
    const reports = wx.getStorageSync('tongueReports');
    console.log('历史记录数量:', reports ? reports.length : 0);
    if (reports && reports.length > 0) {
      console.log('最新记录:', reports[0]);
    }
  } catch (error) {
    console.error('存储读取失败:', error);
  }
}

// 4. 模拟分析请求
function simulateAnalysis() {
  console.log('🧪 模拟分析请求:');
  const app = getApp();
  const testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
  
  app.analyzeImage(testImageData, (err, result) => {
    if (err) {
      console.error('❌ 分析失败:', err);
    } else {
      console.log('✅ 分析成功:', result);
    }
  });
}

// 5. 检查页面路由
function checkPageRoutes() {
  console.log('📱 检查页面路由:');
  const pages = getCurrentPages();
  console.log('当前页面栈:', pages.map(p => p.route));
  console.log('当前页面:', pages[pages.length - 1].route);
}

// 6. 检查权限
function checkPermissions() {
  console.log('🔐 检查权限:');
  
  // 检查相机权限
  wx.getSetting({
    success: (res) => {
      console.log('权限设置:', res.authSetting);
      if (res.authSetting['scope.camera'] === false) {
        console.warn('⚠️ 相机权限被拒绝');
      } else if (res.authSetting['scope.camera'] === true) {
        console.log('✅ 相机权限已授权');
      } else {
        console.log('📋 相机权限未请求');
      }
    }
  });
}

// 7. 完整调试检查
function debugAll() {
  console.log('🚀 开始完整调试检查...');
  console.log('=' * 50);
  
  checkGlobalConfig();
  console.log('');
  
  checkPageRoutes();
  console.log('');
  
  checkLocalStorage();
  console.log('');
  
  checkPermissions();
  console.log('');
  
  testAPIConnection();
  console.log('');
  
  console.log('🏁 调试检查完成！');
}

// 8. 清理数据
function clearAllData() {
  console.log('🧹 清理所有本地数据...');
  try {
    wx.removeStorageSync('tongueReports');
    console.log('✅ 历史记录已清理');
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 9. 性能监控
function startPerformanceMonitor() {
  console.log('📊 启动性能监控...');
  
  const startTime = Date.now();
  let requestCount = 0;
  
  // 监控网络请求
  const originalRequest = wx.request;
  wx.request = function(options) {
    requestCount++;
    const reqStart = Date.now();
    console.log(`🌐 请求 #${requestCount}:`, options.url);
    
    const originalSuccess = options.success;
    const originalFail = options.fail;
    
    options.success = function(res) {
      const duration = Date.now() - reqStart;
      console.log(`✅ 请求 #${requestCount} 成功 (${duration}ms):`, res.statusCode);
      if (originalSuccess) originalSuccess(res);
    };
    
    options.fail = function(err) {
      const duration = Date.now() - reqStart;
      console.log(`❌ 请求 #${requestCount} 失败 (${duration}ms):`, err);
      if (originalFail) originalFail(err);
    };
    
    return originalRequest(options);
  };
  
  console.log('📈 性能监控已启动');
}

// 10. 导出调试函数到全局
if (typeof globalThis !== 'undefined') {
  globalThis.debugHelper = {
    checkConfig: checkGlobalConfig,
    testAPI: testAPIConnection,
    checkStorage: checkLocalStorage,
    simulate: simulateAnalysis,
    checkRoutes: checkPageRoutes,
    checkPerms: checkPermissions,
    debugAll: debugAll,
    clear: clearAllData,
    monitor: startPerformanceMonitor
  };
  
  console.log('🔧 调试助手已加载！');
  console.log('可用命令:');
  console.log('- debugHelper.debugAll() - 完整检查');
  console.log('- debugHelper.testAPI() - 测试API');
  console.log('- debugHelper.simulate() - 模拟分析');
  console.log('- debugHelper.clear() - 清理数据');
  console.log('- debugHelper.monitor() - 性能监控');
}

// 自动运行初始检查
debugAll();