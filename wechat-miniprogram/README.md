# 中医舌诊助手 - 微信小程序版

## 📱 项目介绍

这是中医舌诊助手的微信小程序版本，保持了与Web版本完全相同的功能：
- AI智能舌诊分析
- 个性化健康建议  
- 体质类型判断
- 产品推荐功能

## 🏗️ 项目结构

```
wechat-miniprogram/
├── app.js              # 小程序逻辑
├── app.json            # 小程序配置  
├── app.wxss            # 全局样式
├── sitemap.json        # 站点地图
├── project.config.json # 项目配置
├── pages/              # 页面目录
│   ├── index/          # 首页
│   │   ├── index.wxml  # 页面结构
│   │   ├── index.js    # 页面逻辑
│   │   └── index.wxss  # 页面样式
│   ├── analysis/       # 分析页面
│   │   ├── analysis.wxml
│   │   ├── analysis.js
│   │   └── analysis.wxss
│   └── result/         # 结果页面
│       ├── result.wxml
│       ├── result.js
│       └── result.wxss
└── images/             # 图片资源
```

## 🚀 使用方法

### 1. 导入微信开发者工具
1. 下载并安装微信开发者工具
2. 创建新的小程序项目
3. 将此目录中的所有文件复制到项目中

### 2. 配置AppID
在 `project.config.json` 中将 `"your-app-id-here"` 替换为你的小程序AppID

### 3. 启动后端服务
确保后端API服务正在运行：
```bash
# 在tcm-backend目录下
node server-complete.js
```

### 4. 配置API地址
在 `app.js` 中修改 `apiBase` 地址：
```javascript
globalData: {
  apiBase: 'https://your-domain.com/api',  // 生产环境地址
  // apiBase: 'http://localhost:3002/api',  // 开发环境地址
}
```

## 📋 功能特性

### ✅ 完整功能支持
- 📸 拍照上传 (相机/相册)
- 🔍 AI智能分析
- 📊 详细分析报告
- 💊 个性化产品推荐
- 💾 报告保存功能
- 📤 报告分享功能

### 🎨 UI特性  
- 响应式设计适配各种屏幕
- 原生小程序组件和交互
- 渐变背景和卡片设计
- 流畅的动画效果

### 🔧 技术特性
- 微信小程序原生框架
- Promise异步处理
- 本地存储管理
- 错误处理机制

## 🔄 与Web版本的区别

| 特性 | Web版本 | 小程序版本 |
|------|---------|-----------|  
| 图片上传 | 拖拽+选择 | 拍照+相册 |
| 外部链接 | 直接跳转 | 复制到剪贴板 |
| 本地存储 | localStorage | wx.getStorageSync |
| 网络请求 | fetch | wx.request |
| UI框架 | HTML/CSS | WXML/WXSS |

## 📱 小程序发布

### 1. 开发调试
在微信开发者工具中预览和调试

### 2. 真机测试  
使用开发者工具的真机调试功能

### 3. 提交审核
1. 上传代码到微信后台
2. 填写版本信息和功能说明
3. 提交审核
4. 审核通过后发布

## 🔐 权限说明

小程序需要以下权限：
- `scope.camera` - 拍摄舌诊照片
- `chooseImage` - 选择相册图片

## 🌐 API要求

后端API需要支持HTTPS和跨域访问，生产环境建议：
1. 配置SSL证书
2. 域名备案
3. 在小程序后台配置服务器域名

## 🎯 使用流程

1. **打开小程序** - 查看API状态和功能介绍
2. **开始分析** - 点击进入分析页面
3. **拍摄照片** - 选择拍照或从相册选择
4. **等待分析** - AI处理需要3-5秒
5. **查看结果** - 详细的舌诊分析报告
6. **保存分享** - 保存报告或分享给朋友

## 📞 技术支持

如有问题请联系开发团队或查看项目文档。