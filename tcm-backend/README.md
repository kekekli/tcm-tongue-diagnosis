# 中医舌诊MVP后端API

🎯 **为极简MVP前端提供核心数据支持**

## 🚀 快速开始

### 1. 安装依赖
```bash
cd tcm-backend
npm install
```

### 2. 配置数据库
```bash
# 复制环境配置文件
cp .env.example .env

# 编辑.env文件，修改数据库密码
# DB_PASSWORD=your_mysql_password
```

### 3. 初始化数据库
```bash
# 确保MySQL服务已启动
npm run init-db
```

### 4. 启动开发服务
```bash
npm run dev
```

服务将在 `http://localhost:3001` 启动

## 📋 API接口文档

### 产品相关

#### 获取推荐产品
```
GET /api/products/recommendations?constitution_type=qi_xu&limit=8
```

#### 获取热门产品  
```
GET /api/products/hot
```

#### 产品详情
```
GET /api/products/:id
```

#### 产品点击统计
```
POST /api/products/:id/click
{
  "userId": 1,
  "clickFrom": "analysis"
}
```

### 舌诊分析

#### 舌象分析
```
POST /api/diagnosis/analyze
{
  "imageData": "base64_image_data",
  "userId": 1
}
```

## 📊 数据库表结构

- **products** - 产品信息表
- **users** - 用户信息表  
- **diagnosis_records** - 舌诊记录表
- **product_clicks** - 产品点击统计表
- **recommendation_rules** - 推荐规则配置表

## 🔧 开发工具

### 查看数据库
```bash
mysql -u root -p
USE tcm_tongue_db;
SHOW TABLES;
SELECT * FROM products;
```

### 重置数据库
```bash
npm run init-db
```

## 🚀 部署建议

### 生产环境
1. 使用PM2管理进程
2. 配置Nginx反向代理
3. 使用云数据库服务
4. 添加日志监控

### 云服务推荐
- **阿里云ECS + RDS**
- **腾讯云CVM + MySQL**
- **华为云ECS + 云数据库**

## 📱 与前端对接

前端需要在 `.env` 中配置：
```
VITE_API_BASE_URL=http://localhost:3001
```

然后在前端中使用：
```typescript
import { getHotProducts, analyzeTongueImage } from '@/api'

// 获取热门产品
const { data: products } = await getHotProducts()

// 舌诊分析
const { data: result } = await analyzeTongueImage({
  imageData: 'base64...',
  userId: 1
})
```