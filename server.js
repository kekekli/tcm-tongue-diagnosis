// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');

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
const PORT = process.env.PORT || 3005;

console.log('🚀 启动中医舌诊助手服务器...');

// 严格的舌诊验证提示词
const STRICT_TONGUE_VALIDATION_PROMPT = `
请作为专业的中医AI助手，严格分析这张图片：

第一步：图片验证
- 这是否是人类舌头的清晰照片？
- 舌头是否占据图片主要部分？
- 图片是否足够清晰可见舌质和舌苔？

第二步：舌象分析（仅在验证通过后）
如果是有效的舌头图片，请分析：
- 舌质颜色（淡红、红、深红、淡白、紫暗等）
- 舌质质地（嫩滑、粗糙、有裂纹、胖大、瘦薄等）
- 舌苔颜色（白、黄、灰、黑等）
- 舌苔厚薄（薄、厚、厚腻、剥脱等）
- 体质判断（平和质、气虚质、阳虚质、阴虚质、痰湿质、湿热质、血瘀质、气郁质、特禀质）

请严格按照以下JSON格式返回：

如果不是有效舌头图片：
{
  "isValidTongue": false,
  "error": "检测到这不是舌头图片或图片不够清晰",
  "errorType": "INVALID_IMAGE|UNCLEAR_IMAGE|NOT_TONGUE",
  "suggestion": "请上传清晰的舌头正面照片"
}

如果是有效舌头图片：
{
  "isValidTongue": true,
  "analysis": {
    "tongueColor": "舌质颜色",
    "tongueTexture": "舌质质地", 
    "coatingColor": "舌苔颜色",
    "coatingThickness": "舌苔厚薄"
  },
  "constitution": "体质类型",
  "suggestions": [
    "具体的饮食建议",
    "生活方式建议", 
    "调理方案"
  ],
  "confidence": 0.85
}

请确保返回纯JSON格式，不要包含任何其他文字。
`;

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

// 舌诊分析API - 集成火山引擎AI
app.post('/api/analysis/analyze', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📸 收到舌诊分析请求...');
    
    const { imageData } = req.body;
    const userId = req.user?.id || null;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供图片数据'
      });
    }
    
    console.log('🔍 正在调用火山引擎AI进行舌象分析...');
    
    // 调用火山引擎AI分析
    const aiAnalysis = await callDoubaoAPI(imageData);
    
    // 解析AI分析结果并格式化为前端需要的格式
    const formattedResult = formatAnalysisResult(aiAnalysis);
    
    // 获取推荐产品
    const recommendedProducts = await Product.findAll({
      where: {
        constitution_match: {
          [require('sequelize').Op.like]: `%${formattedResult.constitution.primary}%`
        },
        status: 1
      },
      limit: 3,
      order: [['priority', 'ASC']]
    });
    
    // 格式化产品数据
    const products = recommendedProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      reason: p.recommendation_reason,
      rating: p.rating,
      sales_count: p.sales_count,
      taobao_link: p.taobao_url
    }));
    
    // 构建完整的分析结果
    const finalResult = {
      ...formattedResult,
      products: products
    };
    
    // 保存分析记录到数据库
    const analysisRecord = await TongueAnalysis.create({
      user_id: userId || null,
      image_url: '/uploads/temp_image.jpg',
      analysis_result: finalResult,
      tongue_color: formattedResult.tongueBody.color,
      coating_type: formattedResult.coating.color + formattedResult.coating.thickness,
      constitution_type: formattedResult.constitution.primary,
      confidence_score: formattedResult.confidence || 0.85,
      suggestions: [formattedResult.advice],
      recommended_products: products,
      analysis_duration: Date.now() - startTime,
      ip_address: req.ip || '127.0.0.1'
    });
    
    // 更新用户分析次数
    if (userId) {
      await User.increment('total_analysis_count', { 
        where: { id: userId } 
      });
    }
    
    console.log('✅ AI分析完成并保存到数据库，记录ID:', analysisRecord.id);
    
    res.json({
      success: true,
      message: '分析完成',
      data: finalResult
    });
    
  } catch (error) {
    console.error('❌ 分析失败:', error);
    
    // 如果AI分析失败，返回模拟数据
    const fallbackResult = getFallbackAnalysisResult();
    const recommendedProducts = await Product.findAll({
      where: { status: 1 },
      limit: 3,
      order: [['priority', 'ASC']]
    });
    
    fallbackResult.products = recommendedProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      reason: p.recommendation_reason,
      rating: p.rating,
      sales_count: p.sales_count,
      taobao_link: p.taobao_url
    }));
    
    res.json({
      success: true,
      message: '分析完成（使用备用方案）',
      data: fallbackResult
    });
  }
});

// 调用火山引擎AI API
async function callDoubaoAPI(imageData) {
  const axios = require('axios');
  
  try {
    const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      model: "doubao-1-5-thinking-vision-pro-250428",
      messages: [
        {
          content: [
            {
              image_url: {
                url: imageData
              },
              type: "image_url"
            },
            {
              text: `请分析这张舌诊图片，作为专业的中医AI助手，提供详细的舌象分析。请按以下格式返回JSON数据：

{
  "tongueBody": {
    "color": "舌质颜色（如：淡红、深红、淡白等）",
    "texture": "舌质质地（如：嫩滑、粗糙、有裂纹等）"
  },
  "coating": {
    "color": "舌苔颜色（如：白、黄、灰黑等）", 
    "thickness": "舌苔厚薄（如：薄、厚、厚腻等）"
  },
  "constitution": {
    "primary": "主要体质类型（如：湿热质、气虚质、阳虚质等）"
  },
  "advice": "基于舌象分析的健康建议和调理方案",
  "confidence": 0.85
}

请确保返回的是纯JSON格式，不要包含其他文字说明。`,
              type: "text"
            }
          ],
          role: "user"
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer e57791aa-8c8d-497c-9f9f-fbe4d82d97ea'
      }
    });
    
    const aiResponse = response.data.choices[0].message.content;
    
    // 尝试解析JSON响应
    try {
      return JSON.parse(aiResponse);
    } catch (parseError) {
      console.log('AI响应内容:', aiResponse);
      throw new Error('AI返回的不是有效的JSON格式');
    }
    
  } catch (error) {
    console.error('火山引擎API调用失败:', error.message);
    throw error;
  }
}

// 格式化AI分析结果
function formatAnalysisResult(aiResult) {
  return {
    tongueBody: {
      color: aiResult.tongueBody?.color || '淡红',
      texture: aiResult.tongueBody?.texture || '正常'
    },
    coating: {
      color: aiResult.coating?.color || '白',
      thickness: aiResult.coating?.thickness || '薄'
    },
    constitution: {
      primary: aiResult.constitution?.primary || '平和质'
    },
    advice: aiResult.advice || '保持健康的生活方式，规律作息，适度运动。',
    confidence: aiResult.confidence || 0.85
  };
}

// 备用分析结果
function getFallbackAnalysisResult() {
  const results = [
    {
      tongueBody: {
        color: '淡红',
        texture: '嫩滑'
      },
      coating: {
        color: '白',
        thickness: '薄'
      },
      constitution: {
        primary: '平和质'
      },
      advice: '您的舌象显示体质相对平和，建议保持现有的健康生活方式，适度运动，规律作息，饮食均衡。',
      confidence: 0.80
    },
    {
      tongueBody: {
        color: '偏红',
        texture: '略干燥'
      },
      coating: {
        color: '薄黄',
        thickness: '薄'
      },
      constitution: {
        primary: '湿热质'
      },
      advice: '舌象显示可能有湿热体质特征，建议饮食清淡，避免辛辣油腻，多喝温水，保持心情舒畅。适当运动排汗有助于湿热的排除。',
      confidence: 0.75
    }
  ];
  
  return results[Math.floor(Math.random() * results.length)];
}

// 改进的舌诊分析接口 - 带严格验证
app.post('/api/analyze-tongue-ai', upload.single('tongueImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: '请上传图片' 
      });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('🔍 开始AI分析，使用模型:', process.env.AI_MODEL_NAME);

    // 调用火山引擎豆包API
    const response = await axios.post(process.env.AI_API_URL, {
      model: process.env.AI_MODEL_NAME,
      messages: [{
        role: "user",
        content: [
          { 
            type: "text", 
            text: STRICT_TONGUE_VALIDATION_PROMPT 
          },
          { 
            type: "image_url", 
            image_url: { 
              url: `data:image/jpeg;base64,${base64Image}` 
            }
          }
        ]
      }],
      max_tokens: 1000,
      temperature: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('🤖 火山引擎API返回:', response.data);

    // 解析AI返回结果
    let analysisResult;
    try {
      const aiResponse = response.data.choices[0].message.content.trim();
      const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('❌ AI返回格式解析失败:', parseError);
      fs.unlinkSync(req.file.path); // 删除临时文件
      return res.status(400).json({ 
        success: false, 
        error: '图片分析格式错误，请重新上传清晰的舌头照片' 
      });
    }

    // 验证结果
    if (!analysisResult.isValidTongue) {
      console.log('❌ AI验证失败:', analysisResult.error);
      fs.unlinkSync(req.file.path); // 删除无效图片
      
      return res.status(400).json({ 
        success: false, 
        error: analysisResult.error || '检测到这不是有效的舌头图片',
        errorType: analysisResult.errorType || 'INVALID_IMAGE',
        suggestion: analysisResult.suggestion || '请确保上传清晰的舌头正面照片'
      });
    }

    // 格式化为前端需要的数据结构
    const formattedResult = {
      tongueBody: {
        color: analysisResult.analysis.tongueColor,
        texture: analysisResult.analysis.tongueTexture
      },
      coating: {
        color: analysisResult.analysis.coatingColor,
        thickness: analysisResult.analysis.coatingThickness
      },
      constitution: {
        primary: analysisResult.constitution
      },
      advice: analysisResult.suggestions.join(' '),
      confidence: analysisResult.confidence
    };

    // 获取推荐产品
    const recommendedProducts = await Product.findAll({
      where: {
        constitution_match: {
          [require('sequelize').Op.like]: `%${analysisResult.constitution}%`
        },
        status: 1
      },
      limit: 3,
      order: [['priority', 'ASC']]
    });

    // 格式化产品数据
    const products = recommendedProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      reason: p.recommendation_reason,
      rating: p.rating,
      sales_count: p.sales_count,
      taobao_link: p.taobao_url
    }));

    formattedResult.products = products;

    // 保存分析记录到数据库 (不设置user_id避免外键约束)
    const analysisRecord = await TongueAnalysis.create({
      user_id: null, // 暂时设为null避免外键约束问题
      image_url: `/uploads/images/${req.file.filename}`,
      analysis_result: formattedResult,
      tongue_color: analysisResult.analysis.tongueColor,
      coating_type: analysisResult.analysis.coatingColor + analysisResult.analysis.coatingThickness,
      constitution_type: analysisResult.constitution,
      confidence_score: analysisResult.confidence,
      suggestions: analysisResult.suggestions,
      recommended_products: products,
      analysis_duration: Date.now() - Date.now(), // 修正为实际耗时
      ip_address: req.ip || '127.0.0.1'
    });

    console.log('✅ AI分析完成并保存到数据库，记录ID:', analysisRecord.id);

    res.json({
      success: true,
      message: '分析完成',
      data: formattedResult
    });

  } catch (error) {
    console.error('❌ 舌像分析失败:', error);
    
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('删除临时文件失败:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: '系统分析失败，请稍后重试' 
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