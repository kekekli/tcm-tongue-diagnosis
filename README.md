# 中医舌诊H5应用

一个基于Vue 3 + TypeScript + Vant的移动端中医舌诊智能分析应用。

## 功能特性

- 📸 **舌象拍照/上传** - 支持摄像头拍照和相册选择，带拍照引导和图片处理
- 🔍 **舌诊分析** - AI智能分析舌质、舌苔、舌形等特征，生成体质报告
- 📚 **知识库** - 丰富的中医舌诊知识库，包含基础理论、图谱对照等
- 📊 **健康报告** - 生成详细的健康分析报告，支持PDF导出和图片分享
- 📝 **历史记录** - 完整的诊断历史管理，支持趋势分析和数据统计
- 👤 **个人中心** - 用户信息管理和个性化设置
- 🎯 **体质辨识** - 基于中医九种体质理论的精准辨识
- 🛒 **产品推荐** - 根据体质类型推荐相关养生产品

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI组件库**: Vant 4 (移动端)
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **图表库**: 自定义Canvas图表
- **工具库**: dayjs, jspdf, html2canvas
- **CSS预处理**: PostCSS + Autoprefixer

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── Camera/         # 相机组件
│   ├── ImageUpload/    # 图片上传
│   ├── Charts/         # 图表组件
│   ├── Knowledge/      # 知识库组件
│   └── History/        # 历史记录组件
├── views/              # 页面组件
│   ├── Home/           # 首页
│   ├── Camera/         # 拍照页面
│   ├── Analysis/       # 分析结果页
│   ├── Knowledge/      # 知识库
│   ├── Reports/        # 报告页面
│   ├── History/        # 历史记录
│   └── Profile/        # 个人中心
├── utils/              # 工具函数
│   ├── analysis.ts     # 分析算法
│   ├── imageProcess.ts # 图片处理
│   ├── reportGenerator.ts # 报告生成
│   └── date.ts         # 日期处理
├── stores/             # 状态管理
│   ├── app.ts          # 应用状态
│   └── diagnosis.ts    # 诊断数据
├── data/               # 静态数据
│   └── knowledge.json  # 知识库数据
├── types/              # 类型定义
│   └── diagnosis.ts    # 诊断相关类型
└── styles/             # 样式文件
    └── global.css      # 全局样式
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
cd tcm-tongue-diagnosis
npm install
```

### 开发环境启动

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 主要功能模块

### 1. 舌象拍照模块
- 支持前后摄像头切换
- 实时拍照引导和提示
- 图片预处理和质量优化
- 相册选择和图片编辑

### 2. 智能分析引擎
- 舌质分析（颜色、厚薄、润燥等）
- 舌苔分析（颜色、厚薄、分布等）
- 舌形分析（大小、裂纹、齿痕等）
- 体质类型判断和百分比评估

### 3. 知识库系统
- 分类浏览（基础理论、舌质、舌苔等）
- 全文搜索和标签筛选
- 文章收藏和笔记功能
- 图文并茂的详细说明

### 4. 健康报告
- 体质分布雷达图
- 健康评分和趋势分析
- 个性化调理建议
- PDF导出和图片分享

### 5. 历史记录
- 时间轴展示和筛选
- 体质变化趋势图
- 月度统计分析
- 记录备注和管理

## 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 Vue 3 Composition API 规范
- 使用 ESLint + Prettier 格式化代码

### 组件规范
- 单文件组件（SFC）
- Props 类型声明
- 响应式数据管理
- 样式作用域隔离

### 目录命名
- 组件目录使用 PascalCase
- 工具函数使用 camelCase
- 常量使用 SCREAMING_SNAKE_CASE

## 浏览器支持

- iOS Safari >= 12
- Android Chrome >= 70
- 微信内置浏览器
- 支持现代浏览器特性

## 部署说明

### 静态部署
构建后的 `dist` 目录可直接部署到任何静态服务器

### 移动端优化
- 响应式设计适配各种屏幕尺寸
- 触摸操作优化
- 性能优化和资源压缩

## 许可证

MIT License

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 完整的舌诊分析功能
- 移动端适配和优化

## 联系我们

如有问题或建议，请联系：
- 邮箱：support@tcm-diagnosis.com
- 项目地址：https://github.com/your-username/tcm-tongue-diagnosis

---

**注意**: 本应用仅供中医学习和参考使用，不能替代专业医疗诊断，如有健康问题请及时就医。