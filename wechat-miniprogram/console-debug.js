// 在微信开发者工具控制台中运行的调试脚本
// 复制粘贴到 Console 面板中运行

// 1. 全局调试状态检查
function checkAll() {
  console.log('🚀 开始系统状态检查...');
  console.log('=' * 40);
  
  // 检查app实例
  const app = getApp();
  console.log('📱 App实例:', app ? '✅ 正常' : '❌ 异常');
  console.log('🌐 API地址:', app?.globalData?.apiBase || '未配置');
  
  // 检查当前页面
  const pages = getCurrentPages();
  console.log('📄 当前页面:', pages[pages.length - 1]?.route || '未知');
  console.log('📚 页面栈深度:', pages.length);
  
  // 检查本地存储
  try {
    const reports = wx.getStorageSync('tongueReports');
    console.log('💾 历史记录:', reports ? `${reports.length}条` : '0条');
  } catch (error) {
    console.log('💾 存储访问:', '❌ 失败');
  }
  
  console.log('🏁 检查完成');
  console.log('');
}

// 2. 测试API连接
function testAPI() {
  console.log('🌐 测试API连接...');
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

// 3. 模拟分析请求
function testAnalysis() {
  console.log('🧪 测试分析功能...');
  const app = getApp();
  const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';
  
  app.analyzeImage(testImage, (err, result) => {
    if (err) {
      console.error('❌ 分析失败:', err);
    } else {
      console.log('✅ 分析成功:', result.constitution.primary);
    }
  });
}

// 4. 清理数据
function clearData() {
  try {
    wx.removeStorageSync('tongueReports');
    console.log('🧹 数据已清理');
  } catch (error) {
    console.error('❌ 清理失败:', error);
  }
}

// 5. 测试页面跳转
function testNavigation() {
  console.log('🔄 测试页面跳转...');
  
  wx.navigateTo({
    url: '/pages/analysis/analysis',
    success: () => {
      console.log('✅ 跳转成功');
      setTimeout(() => {
        wx.navigateBack();
        console.log('↩️ 已返回');
      }, 2000);
    },
    fail: (err) => {
      console.error('❌ 跳转失败:', err);
    }
  });
}

// 6. 网络监控
function startNetworkMonitor() {
  const originalRequest = wx.request;
  wx.request = function(options) {
    console.log(`🌐 请求: ${options.method || 'GET'} ${options.url}`);
    
    const originalSuccess = options.success;
    const originalFail = options.fail;
    
    options.success = function(res) {
      console.log(`✅ 响应: ${res.statusCode} ${options.url}`);
      if (originalSuccess) originalSuccess(res);
    };
    
    options.fail = function(err) {
      console.log(`❌ 失败: ${err.errMsg} ${options.url}`);
      if (originalFail) originalFail(err);
    };
    
    return originalRequest(options);
  };
  
  console.log('📊 网络监控已启动');
}

// 导出调试函数
console.log('🔧 调试工具已加载！');
console.log('可用命令:');
console.log('- checkAll() - 完整系统检查');
console.log('- testAPI() - 测试API连接');
console.log('- testAnalysis() - 测试分析功能');
console.log('- testNavigation() - 测试页面跳转');
console.log('- clearData() - 清理本地数据');
console.log('- startNetworkMonitor() - 启动网络监控');
console.log('');

// 自动运行初始检查
checkAll();