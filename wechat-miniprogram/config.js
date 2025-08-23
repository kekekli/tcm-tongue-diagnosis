// config.js - 开发配置文件
const config = {
  development: {
    // 本地网络IP - 用于微信开发者工具调试
    apiBase: 'http://192.168.0.51:3005/api',
  },
  localhost: {
    // 本地回环地址 - 用于浏览器调试
    apiBase: 'http://localhost:3005/api',
  },
  production: {
    // 生产环境地址（根据实际部署修改）
    apiBase: 'https://your-domain.com/api',
  }
}

// 当前使用的环境
const currentEnv = 'development'

module.exports = config[currentEnv]