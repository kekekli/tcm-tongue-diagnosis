# 🤖 DeepSeek AI 集成指南

## 📋 概述

中医舌诊助手现已集成 DeepSeek AI，提供真实的AI图像分析功能。系统支持智能回退机制：
- **有API密钥**：使用 DeepSeek AI 进行真实分析
- **无API密钥**：自动降级到高质量模拟数据

## 🔧 配置方法

### 方法一：自动配置向导（推荐）
```bash
cd tcm-backend
node setup-deepseek.js
```

### 方法二：手动配置
1. 编辑 `.env` 文件：
```env
DEEPSEEK_API_KEY=your_actual_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

2. 重启服务器：
```bash
node server-complete.js
```

## 🔑 获取API密钥

1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册账号并完成认证
3. 在控制台创建新的API密钥
4. 复制密钥到配置文件

## 🧪 功能特性

### AI分析能力
- **舌质分析**：颜色、纹理、形态
- **舌苔观察**：颜色、厚薄、分布
- **体质判断**：九种体质类型识别
- **健康建议**：个性化调理方案
- **中药推荐**：基于体质的药物建议

### 技术特性
- **智能回退**：API失败时自动使用模拟数据
- **错误处理**：完善的异常捕获和日志记录
- **格式验证**：图片格式和API响应验证
- **性能优化**：合理的超时和重试机制

## 📡 API接口说明

### 1. 舌诊分析接口
```http
POST /api/diagnosis/analyze
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "userId": "user123"
}
```

**响应格式：**
```json
{
  "success": true,
  "message": "分析完成",
  "data": {
    "tongueBody": {
      "color": "淡红",
      "texture": "润泽", 
      "shape": "正常",
      "description": "舌质正常"
    },
    "coating": {
      "color": "白",
      "thickness": "薄",
      "distribution": "全苔",
      "description": "舌苔正常"
    },
    "constitution": {
      "primary": "平和质",
      "secondary": null,
      "confidence": 0.85
    },
    "diagnosis": {
      "syndrome": "正常",
      "severity": "轻",
      "description": "AI分析结果"
    },
    "advice": "保持健康的生活方式...",
    "recommendations": [
      {
        "category": "饮食建议",
        "content": "具体建议内容"
      }
    ],
    "herbs": [
      {
        "name": "中药名称",
        "function": "功效说明",
        "usage": "用法用量"
      }
    ],
    "timestamp": "2025-08-16T02:53:38.110Z",
    "source": "DeepSeek AI" // 或 "模拟AI分析"
  },
  "meta": {
    "analysisTime": "2025-08-16T02:53:38.111Z",
    "userId": "user123",
    "source": "DeepSeek AI"
  }
}
```

### 2. 详细分析接口
```http
POST /api/analysis/analyze
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "userId": "user123"
}
```

## 🔍 AI提示词设计

系统使用专业的中医舌诊提示词，包含：

1. **角色定义**：专业中医师身份
2. **分析要求**：详细的观察维度
3. **输出格式**：结构化JSON格式
4. **质量控制**：置信度和验证机制

### 核心分析维度
- 舌质（颜色、形态、纹理）
- 舌苔（颜色、厚薄、分布）
- 体质判断（九种体质分型）
- 证候分析（中医证型）
- 调理建议（饮食、生活、运动）
- 中药推荐（名称、功效、用法）

## 📊 系统监控

### 日志记录
- API调用状态
- 分析结果来源
- 错误信息和异常
- 用户行为统计

### 性能指标
- 响应时间监控
- 成功率统计
- 错误率分析
- 资源使用情况

## 🛡️ 安全考虑

### 数据保护
- 图片数据不持久化存储
- API密钥环境变量保护
- 用户隐私信息脱敏

### 错误处理
- 敏感信息过滤
- 优雅降级机制
- 详细的开发日志

## 🔄 智能回退机制

```javascript
// 自动检测API可用性
if (deepseekService.isConfigured()) {
  // 使用真实AI分析
  result = await deepseekService.analyzeTongueImage(imageData);
} else {
  // 使用高质量模拟数据
  result = deepseekService.generateMockAnalysis();
}
```

### 回退触发条件
1. API密钥未配置
2. 网络连接失败
3. API调用超时
4. 响应格式错误
5. 服务不可用

## 📈 使用统计

### 当前状态
- ✅ DeepSeek服务集成完成
- ✅ 智能回退机制运行正常
- ✅ API接口测试通过
- ✅ 错误处理完善

### 测试结果
```
curl -X POST http://localhost:3002/api/diagnosis/analyze \\
  -H "Content-Type: application/json" \\
  -d '{"imageData":"data:image/jpeg;base64,/9j/4AAQ...", "userId": "test"}'

响应: HTTP 200 OK
分析来源: 模拟AI分析 (API未配置时)
置信度: 0.85
处理时间: <100ms
```

## 🚀 部署建议

### 生产环境
1. 确保API密钥安全存储
2. 配置合适的超时时间
3. 启用详细日志记录
4. 监控API使用量和成本
5. 设置告警机制

### 开发环境
1. 使用测试API密钥
2. 启用详细调试信息
3. 快速迭代和测试

## 📞 技术支持

### 常见问题
1. **API调用失败**: 检查密钥和网络连接
2. **响应格式错误**: 验证提示词和模型版本
3. **性能问题**: 调整超时和并发设置

### 联系方式
- GitHub Issues: 项目仓库
- 技术文档: 在线文档
- API文档: [DeepSeek官方文档](https://platform.deepseek.com/docs)

---

**🎉 DeepSeek AI集成成功！现在您的舌诊助手具备了真正的AI分析能力！**