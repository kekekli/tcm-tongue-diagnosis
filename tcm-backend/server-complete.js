require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const deepseekService = require('./services/deepseekService');

const app = express();
const PORT = 3002;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 根路由 - 提供前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API信息路由
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    message: '中医舌诊助手 API 服务',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      analysis: 'POST /api/diagnosis/analyze',
      upload: 'POST /api/upload',
      products_hot: 'GET /api/products/hot',
      products_recommendations: 'GET /api/products/recommendations'
    },
    status: 'running',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API服务正常运行',
    status: 'healthy',
    port: PORT,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 模拟舌诊分析算法
function analyzeTongueImage() {
  const analysisResults = [
    {
      tongueBody: { color: '舌质偏红', texture: '正常' },
      coating: { color: '薄黄', thickness: '薄' },
      constitution: { primary: '湿热质' },
      advice: '饮食清淡，避免辛辣油腻，多喝温水，保持心情舒畅',
      symptoms: ['口干', '烦躁', '小便黄', '大便干结'],
      suggestions: [
        '饮食清淡，避免辛辣油腻',
        '多喝温水，促进新陈代谢', 
        '保持心情舒畅',
        '适当运动，避免熬夜'
      ],
      confidence: 0.85,
      products: [
        {
          id: 1,
          name: '清热祛湿茶',
          price: '58.00',
          original_price: '78.00',
          reason: '清热利湿，适合湿热体质',
          rating: 4.8,
          sales_count: '3200+',
          image_url: '/images/qingre-tea.jpg',
          taobao_link: 'https://s.taobao.com/search?q=清热祛湿茶',
          category: 'tea'
        },
        {
          id: 2,
          name: '金银花颗粒',
          price: '35.00',
          original_price: '45.00', 
          reason: '清热解毒，降火去燥',
          rating: 4.9,
          sales_count: '5600+',
          image_url: '/images/jinyinhua.jpg',
          taobao_link: 'https://s.taobao.com/search?q=金银花颗粒',
          category: 'herbs'
        }
      ]
    },
    {
      tongueBody: { color: '舌质淡白', texture: '胖大' },
      coating: { color: '白厚', thickness: '厚' },
      constitution: { primary: '气虚质' },
      advice: '适当运动增强体质，温补饮食，规律作息，保证睡眠',
      symptoms: ['乏力', '食欲不振', '怕冷', '容易疲劳'],
      suggestions: [
        '适当运动，增强体质',
        '温补饮食，避免生冷',
        '规律作息，保证睡眠',
        '可适当进补'
      ],
      confidence: 0.78,
      products: [
        {
          id: 3,
          name: '人参黄芪茶',
          price: '88.00',
          original_price: '128.00',
          reason: '补气健脾，提升免疫力',
          rating: 4.9,
          sales_count: '8900+',
          image_url: '/images/renshen-tea.jpg',
          taobao_link: 'https://s.taobao.com/search?q=人参黄芪茶',
          category: 'tea'
        },
        {
          id: 4,
          name: '党参蜂蜜',
          price: '68.00',
          original_price: '88.00',
          reason: '益气生津，滋补身体',
          rating: 4.7,
          sales_count: '4500+',
          image_url: '/images/dangshen-honey.jpg',
          taobao_link: 'https://s.taobao.com/search?q=党参蜂蜜',
          category: 'health_food'
        }
      ]
    },
    {
      tongueBody: { color: '舌质正常', texture: '正常' },
      coating: { color: '薄白', thickness: '薄' },
      constitution: { primary: '平和质' },
      advice: '保持现有健康的生活方式，适度运动，定期体检，注意劳逸结合',
      symptoms: ['身体状态良好', '精神饱满'],
      suggestions: [
        '保持现有健康的生活方式',
        '适度运动，增强体质',
        '定期体检，预防疾病',
        '注意劳逸结合'
      ],
      confidence: 0.92,
      products: [
        {
          id: 5,
          name: '养生茶组合',
          price: '78.00',
          original_price: '98.00',
          reason: '维持身体平衡，日常保健',
          rating: 4.8,
          sales_count: '2800+',
          image_url: '/images/yangsheng-combo.jpg',
          taobao_link: 'https://s.taobao.com/search?q=养生茶组合',
          category: 'tea'
        }
      ]
    }
  ];
  
  // 随机返回一个分析结果
  const randomIndex = Math.floor(Math.random() * analysisResults.length);
  return analysisResults[randomIndex];
}

// 图片分析接口 - 兼容原有API格式
app.post('/api/diagnosis/analyze', async (req, res) => {
  try {
    console.log('收到图片分析请求...');
    
    const { imageData, userId } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供舌象图片'
      });
    }

    // 验证图片格式
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: '图片格式不正确'
      });
    }
    
    // 使用DeepSeek AI进行分析
    console.log(`开始AI分析 - 用户ID: ${userId || 'anonymous'}`);
    console.log(`DeepSeek API状态: ${deepseekService.isConfigured() ? '已配置' : '未配置，使用模拟数据'}`);
    
    const analysisResult = await deepseekService.analyzeTongueImage(imageData, userId);
    
    console.log('分析完成:', analysisResult.constitution.primary);
    console.log('分析来源:', analysisResult.source);
    
    res.json({
      success: true,
      message: '分析完成',
      data: analysisResult,
      meta: {
        analysisTime: new Date().toISOString(),
        userId: userId || null,
        source: analysisResult.source
      }
    });
    
  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({
      success: false,
      message: '分析失败，请重试',
      error: error.message
    });
  }
});

// 新的分析接口（更详细的格式）
app.post('/api/analysis/analyze', async (req, res) => {
  try {
    console.log('收到详细分析请求...');
    
    const { imageData, userId } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供舌象图片'
      });
    }
    
    // 使用DeepSeek AI进行详细分析
    const analysisResult = await deepseekService.analyzeTongueImage(imageData, userId);
    
    console.log('详细分析完成:', analysisResult.constitution.primary);
    
    res.json({
      success: true,
      message: '详细分析完成',
      data: {
        analysis: {
          tongueColor: analysisResult.tongueBody.color,
          coating: analysisResult.coating.color + analysisResult.coating.thickness,
          constitution: analysisResult.constitution.primary,
          diagnosis: analysisResult.diagnosis,
          recommendations: analysisResult.recommendations,
          herbs: analysisResult.herbs,
          confidence: analysisResult.constitution.confidence
        },
        fullResult: analysisResult,
        analysisId: `analysis_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: analysisResult.source
      }
    });
    
  } catch (error) {
    console.error('详细分析失败:', error);
    res.status(500).json({
      success: false,
      message: '分析失败，请重试',
      error: error.message
    });
  }
});

// 模拟产品数据
const mockProducts = [
  {
    id: 1,
    name: '九种体质调理茶包',
    description: '根据中医体质理论配制的复方茶包',
    price: '88.00',
    original_price: '128.00',
    rating: 4.9,
    sales_count: '1.8万+',
    shop_name: '中医养生专营店',
    image_url: '/images/jiuzhong-tea.jpg',
    taobao_link: 'https://s.taobao.com/search?q=九种体质调理茶',
    category: 'tea',
    tags: ['体质调理', '个性化', '复方'],
    specifications: ['规格：9种茶包各10袋', '成分：根据体质特点精心配制'],
    reason: '针对不同体质，个性化调理'
  },
  {
    id: 2,
    name: '舌诊养生套装',
    description: '包含多种体质调理产品',
    price: '168.00',
    original_price: '228.00',
    rating: 4.8,
    sales_count: '5600+',
    shop_name: '中医体质调理专营',
    image_url: '/images/yangsheng-set.jpg',
    taobao_link: 'https://s.taobao.com/search?q=舌诊养生套装',
    category: 'health_food',
    tags: ['舌诊', '养生', '套装'],
    specifications: ['套装内容：体质茶+调理丸+养生粉'],
    reason: '舌诊指导下的养生产品组合'
  },
  {
    id: 3,
    name: '黄芪片',
    description: '选用优质黄芪，传统工艺制作，适合气虚体质调理',
    price: '28.80',
    original_price: '36.00',
    rating: 4.8,
    sales_count: '1.2万+',
    shop_name: '同仁堂官方旗舰店',
    image_url: '/images/huangqi.jpg',
    taobao_link: 'https://s.taobao.com/search?q=黄芪片+同仁堂',
    category: 'herbs',
    tags: ['补气', '健脾', '免疫力'],
    specifications: ['规格：0.4g×100片'],
    reason: '补气健脾，提升免疫力'
  },
  {
    id: 4,
    name: '红枣枸杞茶',
    description: '精选新疆大枣和宁夏枸杞，天然无添加',
    price: '45.00',
    original_price: '58.00',
    rating: 4.9,
    sales_count: '8600+',
    shop_name: '养生堂官方店',
    image_url: '/images/jujube-tea.jpg',
    taobao_link: 'https://s.taobao.com/search?q=红枣枸杞茶+养生堂',
    category: 'tea',
    tags: ['益气', '补血', '养颜'],
    specifications: ['规格：5g×30包'],
    reason: '益气补血，滋养身体'
  }
];

// 获取热门产品
app.get('/api/products/hot', (req, res) => {
  try {
    const products = mockProducts.slice(0, 4);
    
    res.json({
      success: true,
      data: products,
      message: '获取热门产品成功'
    });
    
  } catch (error) {
    console.error('获取热门产品失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取推荐产品接口
app.get('/api/products/recommendations', (req, res) => {
  try {
    const { constitution_type, limit = 8 } = req.query;
    
    let products = [...mockProducts];
    
    // 简单模拟体质筛选
    if (constitution_type) {
      console.log(`根据体质类型筛选: ${constitution_type}`);
    }
    
    // 限制返回数量
    products = products.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: products,
      message: '获取推荐产品成功'
    });
    
  } catch (error) {
    console.error('获取推荐产品失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 获取产品详情
app.get('/api/products/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const product = mockProducts.find(p => p.id === parseInt(id));
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    res.json({
      success: true,
      data: product,
      message: '获取产品详情成功'
    });
    
  } catch (error) {
    console.error('获取产品详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
});

// 产品点击统计
app.post('/api/products/:id/click', (req, res) => {
  try {
    const { id } = req.params;
    const { userId = null, clickFrom = 'analysis' } = req.body;
    
    console.log(`产品点击统计: 产品${id}, 用户${userId}, 来源${clickFrom}`);
    
    res.json({
      success: true,
      message: '统计成功'
    });
    
  } catch (error) {
    console.error('点击统计失败:', error);
    res.status(500).json({
      success: false,
      message: '统计失败'
    });
  }
});

// 简单的图片上传接口
app.post('/api/upload', (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供图片数据'
      });
    }
    
    const filename = `tongue_${Date.now()}.jpg`;
    
    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        filename: filename,
        url: `/uploads/${filename}`
      }
    });
    
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({
      success: false,
      message: '上传失败，请重试'
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API接口不存在: ${req.originalUrl}`,
    availableEndpoints: [
      'GET /',
      'GET /api/health', 
      'POST /api/diagnosis/analyze',
      'POST /api/analysis/analyze',
      'POST /api/upload',
      'GET /api/products/hot',
      'GET /api/products/recommendations',
      'GET /api/products/:id',
      'POST /api/products/:id/click'
    ]
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '未知错误'
  });
});

// 启动服务器 - 监听所有网络接口以支持真机测试
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 中医舌诊助手后端服务启动成功!`);
  console.log(`📍 本地访问: http://localhost:${PORT}`);
  console.log(`📱 真机测试: http://192.168.0.51:${PORT}`);
  console.log(`🔗 API文档: http://localhost:${PORT}/api/health`);
  console.log(`📁 上传目录: ${uploadsDir}`);
  console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
  console.log('');
  console.log('📋 可用API接口:');
  console.log(`   GET  / - 服务器信息`);
  console.log(`   GET  /api/health - 健康检查`);
  console.log(`   POST /api/diagnosis/analyze - 舌诊分析`);
  console.log(`   POST /api/analysis/analyze - 详细分析`);
  console.log(`   GET  /api/products/hot - 获取热门产品`);
  console.log(`   GET  /api/products/recommendations - 获取推荐产品`);
  console.log(`   POST /api/upload - 图片上传`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});