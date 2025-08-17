// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// 引入认证相关模块
const authRoutes = require('./routes/auth');
const { authenticateToken, optionalAuth, apiLimiter, requireAdmin } = require('./middleware/auth');

// 引入数据库模型
const {
  sequelize,
  testConnection,
  syncDatabase,
  User,
  TongueAnalysis,
  Product
} = require('./models');

const app = express();
const PORT = process.env.PORT || 3002;

console.log('🚀 启动中医舌诊助手服务器...');

// 配置multer用于图片上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名：时间戳 + 随机数 + 原扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'tongue-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API频率限制
app.use('/api', apiLimiter);

// 认证路由
app.use('/api/auth', authRoutes);

// ========== 数据库初始化 ==========
async function initializeDatabase() {
  console.log('📚 正在初始化数据库...');
  
  try {
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }
    
    // 同步表结构
    const synced = await syncDatabase();
    if (!synced) {
      throw new Error('数据库表同步失败');
    }
    
    // 初始化基础数据
    await initializeDefaultData();
    
    console.log('✅ 数据库初始化完成！');
    return true;
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    return false;
  }
}

// 初始化基础数据
async function initializeDefaultData() {
  try {
    // 检查产品表是否为空
    const productCount = await Product.count();
    
    if (productCount === 0) {
      console.log('📦 初始化产品数据...');
      
      await Product.bulkCreate([
        {
          name: '九种体质调理茶包',
          description: '针对不同体质，个性化调理',
          category: '体质调理',
          price: 88.00,
          original_price: 128.00,
          rating: 4.9,
          sales_count: 18000,
          constitution_match: '湿热质,气虚质,阳虚质',
          recommendation_reason: '补气健脾，调理体质',
          priority: 1,
          taobao_url: 'https://s.taobao.com/search?q=体质调理茶'
        },
        {
          name: '舌诊养生套装',
          description: '舌诊指导下的养生产品组合',
          category: '养生套装',
          price: 168.00,
          original_price: 228.00,
          rating: 4.8,
          sales_count: 5600,
          constitution_match: '平和质,阴虚质',
          recommendation_reason: '全方位调理，养生保健',
          priority: 2,
          taobao_url: 'https://s.taobao.com/search?q=养生套装'
        },
        {
          name: '黄芪片',
          description: '补气健脾，提升免疫力',
          category: '中药材',
          price: 28.80,
          original_price: 36.00,
          rating: 4.8,
          sales_count: 12000,
          constitution_match: '气虚质',
          recommendation_reason: '补气健脾，提升免疫力',
          priority: 3,
          taobao_url: 'https://s.taobao.com/search?q=黄芪片'
        }
      ]);
      
      console.log('✅ 产品数据初始化完成');
    }
    
  } catch (error) {
    console.error('❌ 初始化基础数据失败:', error);
  }
}

// ========== API路由 ==========

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查（包含数据库状态）- 仅管理员可访问
app.get('/api/health', requireAdmin, async (req, res) => {
  try {
    // 检查数据库连接
    await sequelize.authenticate();
    
    // 获取数据统计
    const stats = await Promise.all([
      User.count(),
      TongueAnalysis.count(),
      Product.count()
    ]);
    
    res.json({
      success: true,
      message: 'API服务正常运行',
      status: 'healthy',
      database: 'connected',
      stats: {
        users: stats[0],
        analyses: stats[1],
        products: stats[2]
      },
      port: PORT,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API服务异常',
      database: 'disconnected',
      error: error.message
    });
  }
});

// 舌诊分析API（连接数据库版本）- 支持可选认证
app.post('/api/analysis/analyze', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📸 收到舌诊分析请求...');
    
    const { imageData } = req.body;
    const userId = req.user?.id || null; // 从认证中间件获取用户ID
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供图片数据'
      });
    }
    
    // 模拟AI分析过程
    console.log('🔍 正在分析舌象...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟分析结果
    const analysisResults = [
      {
        tongueColor: '舌质偏红',
        coatingType: '苔薄黄',
        constitution: '湿热质',
        symptoms: ['口干舌燥', '烦躁易怒', '小便黄赤'],
        suggestions: ['饮食清淡，避免辛辣', '多喝温水', '保持心情舒畅'],
        confidence: 0.85
      },
      {
        tongueColor: '舌质淡白',
        coatingType: '苔白厚腻',
        constitution: '气虚质',
        symptoms: ['神疲乏力', '食欲不振', '怕冷'],
        suggestions: ['适当运动', '温补饮食', '规律作息'],
        confidence: 0.78
      }
    ];
    
    const result = analysisResults[Math.floor(Math.random() * analysisResults.length)];
    
    // 获取推荐产品
    const recommendedProducts = await Product.findAll({
      where: {
        constitution_match: {
          [require('sequelize').Op.like]: `%${result.constitution}%`
        },
        status: 1
      },
      limit: 3,
      order: [['priority', 'ASC']]
    });
    
    // 保存分析记录到数据库
    const analysisRecord = await TongueAnalysis.create({
      user_id: userId || null,
      image_url: '/uploads/temp_image.jpg', // 临时URL
      analysis_result: result,
      tongue_color: result.tongueColor,
      coating_type: result.coatingType,
      constitution_type: result.constitution,
      confidence_score: result.confidence,
      suggestions: result.suggestions,
      recommended_products: recommendedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        reason: p.recommendation_reason,
        url: p.taobao_url
      })),
      analysis_duration: Date.now() - startTime,
      ip_address: req.ip || '127.0.0.1'
    });
    
    // 如果有用户ID，更新用户分析次数
    if (userId) {
      await User.increment('total_analysis_count', { 
        where: { id: userId } 
      });
    }
    
    console.log('✅ 分析完成并保存到数据库，记录ID:', analysisRecord.id);
    
    res.json({
      success: true,
      message: '分析完成',
      data: {
        analysis: {
          ...result,
          recommendations: recommendedProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: `¥${p.price}`,
            reason: p.recommendation_reason,
            url: p.taobao_url
          }))
        },
        analysisId: analysisRecord.id,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
    res.status(500).json({
      success: false,
      message: '分析失败，请重试',
      error: error.message
    });
  }
});

// 获取产品列表
app.get('/api/products', async (req, res) => {
  try {
    const { category, constitution } = req.query;
    
    let whereCondition = { status: 1 };
    
    if (category) {
      whereCondition.category = category;
    }
    
    if (constitution) {
      whereCondition.constitution_match = {
        [require('sequelize').Op.like]: `%${constitution}%`
      };
    }
    
    const products = await Product.findAll({
      where: whereCondition,
      order: [['priority', 'ASC'], ['sales_count', 'DESC']]
    });
    
    res.json({
      success: true,
      data: products,
      total: products.length
    });
    
  } catch (error) {
    console.error('获取产品失败:', error);
    res.status(500).json({
      success: false,
      message: '获取产品失败'
    });
  }
});

// 图片上传API
app.post('/api/upload/image', upload.single('tongueImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要上传的图片'
      });
    }

    console.log('📷 图片上传成功:', req.file.filename);

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/images/${req.file.filename}`
      }
    });

  } catch (error) {
    console.error('图片上传失败:', error);
    res.status(500).json({
      success: false,
      message: '图片上传失败',
      error: error.message
    });
  }
});

// 基于图片文件的舌诊分析API - 支持可选认证
app.post('/api/analysis/analyze-file', optionalAuth, upload.single('tongueImage'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📸 收到基于文件的舌诊分析请求...');
    
    const userId = req.user?.id || null; // 从认证中间件获取用户ID
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传舌诊图片'
      });
    }

    console.log('🔍 正在分析舌象文件:', req.file.filename);
    
    // 模拟AI分析过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟分析结果
    const analysisResults = [
      {
        tongueColor: '舌质偏红',
        coatingType: '苔薄黄',
        constitution: '湿热质',
        symptoms: ['口干舌燥', '烦躁易怒', '小便黄赤'],
        suggestions: ['饮食清淡，避免辛辣', '多喝温水', '保持心情舒畅'],
        confidence: 0.85
      },
      {
        tongueColor: '舌质淡白',
        coatingType: '苔白厚腻',
        constitution: '气虚质',
        symptoms: ['神疲乏力', '食欲不振', '怕冷'],
        suggestions: ['适当运动', '温补饮食', '规律作息'],
        confidence: 0.78
      }
    ];
    
    const result = analysisResults[Math.floor(Math.random() * analysisResults.length)];
    
    // 获取推荐产品
    const recommendedProducts = await Product.findAll({
      where: {
        constitution_match: {
          [require('sequelize').Op.like]: `%${result.constitution}%`
        },
        status: 1
      },
      limit: 3,
      order: [['priority', 'ASC']]
    });
    
    // 保存分析记录到数据库
    const analysisRecord = await TongueAnalysis.create({
      user_id: userId || null,
      image_url: `/uploads/images/${req.file.filename}`, // 真实图片URL
      analysis_result: result,
      tongue_color: result.tongueColor,
      coating_type: result.coatingType,
      constitution_type: result.constitution,
      confidence_score: result.confidence,
      suggestions: result.suggestions,
      recommended_products: recommendedProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        reason: p.recommendation_reason,
        url: p.taobao_url
      })),
      analysis_duration: Date.now() - startTime,
      ip_address: req.ip || '127.0.0.1'
    });
    
    // 如果有用户ID，更新用户分析次数
    if (userId) {
      await User.increment('total_analysis_count', { 
        where: { id: userId } 
      });
    }
    
    console.log('✅ 文件分析完成并保存到数据库，记录ID:', analysisRecord.id);
    
    res.json({
      success: true,
      message: '分析完成',
      data: {
        analysis: {
          ...result,
          imageUrl: `/uploads/images/${req.file.filename}`,
          recommendations: recommendedProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: `¥${p.price}`,
            reason: p.recommendation_reason,
            url: p.taobao_url
          }))
        },
        analysisId: analysisRecord.id,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 文件分析失败:', error);
    res.status(500).json({
      success: false,
      message: '分析失败，请重试',
      error: error.message
    });
  }
});

// 获取用户分析历史 - 需要认证
app.get('/api/analysis/history/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    
    // 验证用户只能查看自己的分析历史
    if (parseInt(userId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '只能查看自己的分析历史',
        code: 'ACCESS_DENIED'
      });
    }
    
    console.log(`📊 获取用户${userId}的分析历史...`);
    
    const analyses = await TongueAnalysis.findAll({
      where: {
        user_id: userId
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: [
        'id',
        'tongue_color',
        'coating_type', 
        'constitution_type',
        'confidence_score',
        'created_at'
      ]
    });
    
    const total = await TongueAnalysis.count({
      where: { user_id: userId }
    });
    
    res.json({
      success: true,
      data: analyses,
      total: total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('获取分析历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分析历史失败'
    });
  }
});

// 获取分析详情
app.get('/api/analysis/:analysisId', async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    const analysis = await TongueAnalysis.findByPk(analysisId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nickname', 'phone']
        }
      ]
    });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: '分析记录不存在'
      });
    }
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('获取分析详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分析详情失败'
    });
  }
});

// 启动服务器
async function startServer() {
  console.log('🔄 正在启动服务器...');
  
  try {
    // 初始化数据库
    const dbInitialized = await initializeDatabase();
    
    if (!dbInitialized) {
      console.error('❌ 数据库初始化失败，服务器启动中止');
      process.exit(1);
    }
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log('\n🎉 ========== 中医舌诊助手启动成功 ==========');
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`💾 数据库: SQLite (database.sqlite)`);
      console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
      console.log(`📱 前端页面: http://localhost:${PORT}`);
      console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
      console.log('==========================================\n');
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('📴 收到关闭信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 收到中断信号，正在关闭服务器...');
  await sequelize.close();
  process.exit(0);
});

// 启动服务器
startServer();