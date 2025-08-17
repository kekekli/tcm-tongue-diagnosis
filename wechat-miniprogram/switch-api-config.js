// switch-api-config.js - 切换API配置工具
const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');

// 读取当前配置
let appJsContent = fs.readFileSync(appJsPath, 'utf8');

// 检查当前使用的是哪种配置
const isLocalhost = appJsContent.includes('http://localhost:3005');

if (isLocalhost) {
  // 切换为真机调试配置
  appJsContent = appJsContent.replace(
    'apiBase: \'http://localhost:3005/api\'',
    'apiBase: \'http://192.168.0.51:3005/api\''
  );
  appJsContent = appJsContent.replace(
    '// 真机测试时需要手动修改为: \'http://192.168.0.51:3005/api\'',
    '// 开发环境使用: \'http://localhost:3005/api\''
  );
  console.log('✅ 已切换为真机调试配置: http://192.168.0.51:3005/api');
} else {
  // 切换为本地开发配置
  appJsContent = appJsContent.replace(
    'apiBase: \'http://192.168.0.51:3005/api\'',
    'apiBase: \'http://localhost:3005/api\''
  );
  appJsContent = appJsContent.replace(
    '// 开发环境使用: \'http://localhost:3005/api\'',
    '// 真机测试时需要手动修改为: \'http://192.168.0.51:3005/api\''
  );
  console.log('✅ 已切换为本地开发配置: http://localhost:3005/api');
}

// 写回文件
fs.writeFileSync(appJsPath, appJsContent);
console.log('🔄 配置已更新，请重新编译小程序');