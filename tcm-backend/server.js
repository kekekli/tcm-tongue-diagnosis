const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // 静态文件服务

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'your_password',
  database: process.env.DB_NAME || 'tcm_tongue_db',
  charset: 'utf8mb4'
};

// 数据库连接池
const pool = mysql.createPool(dbConfig);

// =================== 核心API路由 ===================

// 1. 获取推荐产品 (对应前端产品推荐页面)
app.get('/api/products/recommendations', async (req, res) => {
  try {
    const { constitution_type, limit = 8 } = req.query;
    
    let query = `
      SELECT 
        id, name, description, price, original_price, rating, 
        sales_count, shop_name, image_url, taobao_link, 
        category, tags, specifications, reason
      FROM products 
      WHERE status = 1
    `;
    
    const params = [];
    
    // 如果指定了体质类型，优先返回相关产品
    if (constitution_type) {
      query += ` AND JSON_CONTAINS(constitution_types, ?)`;
      params.push(JSON.stringify(constitution_type));
    }
    
    query += ` ORDER BY sort_order DESC, rating DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [products] = await pool.execute(query, params);
    
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

// 2. 获取热门产品 (对应前端首页推荐)
app.get('/api/products/hot', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, name, description, price, original_price, rating,
        sales_count, shop_name, image_url, taobao_link,
        category, tags, reason
      FROM products 
      WHERE status = 1 
      ORDER BY sort_order DESC, CAST(REPLACE(sales_count, '+', '') AS UNSIGNED) DESC 
      LIMIT 4
    `;
    
    const [products] = await pool.execute(query);
    
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

// 3. 舌诊分析API (对应前端分析功能)
app.post('/api/diagnosis/analyze', async (req, res) => {
  try {
    const { imageData, userId = null } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供舌象图片'
      });
    }
    
    // 模拟AI分析（实际项目中这里会调用AI服务）
    const analysisResult = await simulateAnalysis();
    
    // 保存诊断记录
    const insertQuery = `
      INSERT INTO diagnosis_records 
      (user_id, image_url, tongue_color, tongue_texture, coating_color, coating_thickness, constitution_type, advice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.execute(insertQuery, [
      userId,
      'temp_image_url', // 实际项目中需要保存图片并返回URL
      analysisResult.tongueBody.color,
      analysisResult.tongueBody.texture,
      analysisResult.coating.color,
      analysisResult.coating.thickness,
      analysisResult.constitution.primary,
      analysisResult.advice
    ]);
    
    // 获取相关推荐产品
    const recommendedProducts = await getRecommendedProducts(analysisResult.constitution.primary);
    analysisResult.products = recommendedProducts;
    
    res.json({
      success: true,
      data: analysisResult,
      message: '分析完成'
    });
    
  } catch (error) {
    console.error('舌诊分析失败:', error);
    res.status(500).json({
      success: false,
      message: '分析失败，请重试'
    });
  }
});

// 4. 产品点击统计API
app.post('/api/products/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId = null, clickFrom = 'analysis' } = req.body;
    
    const insertQuery = `
      INSERT INTO product_clicks (product_id, user_id, click_from)
      VALUES (?, ?, ?)
    `;
    
    await pool.execute(insertQuery, [id, userId, clickFrom]);
    
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

// 5. 获取产品详情
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM products WHERE id = ? AND status = 1
    `;
    
    const [products] = await pool.execute(query, [id]);
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: '产品不存在'
      });
    }
    
    res.json({
      success: true,
      data: products[0],
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

// =================== 辅助函数 ===================

// 模拟AI舌诊分析
async function simulateAnalysis() {
  // 随机生成分析结果（实际项目中会调用AI模型）
  const tongueColors = ['淡红', '红', '深红', '淡白'];
  const tongueTextures = ['正常', '胖大', '瘦薄', '有齿痕'];
  const coatingColors = ['白', '黄', '厚白', '薄白'];
  const coatingThickness = ['薄', '厚', '适中', '无苔'];
  const constitutions = ['气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质', '平和质'];
  
  const result = {
    tongueBody: {
      color: tongueColors[Math.floor(Math.random() * tongueColors.length)],
      texture: tongueTextures[Math.floor(Math.random() * tongueTextures.length)]
    },
    coating: {
      color: coatingColors[Math.floor(Math.random() * coatingColors.length)],
      thickness: coatingThickness[Math.floor(Math.random() * coatingThickness.length)]
    },
    constitution: {
      primary: constitutions[Math.floor(Math.random() * constitutions.length)]
    },
    advice: '建议保持规律作息，适当运动，饮食清淡。'
  };
  
  return result;
}

// 获取推荐产品
async function getRecommendedProducts(constitutionType) {
  try {
    // 体质类型映射
    const constitutionMap = {
      '气虚质': 'qi_xu',
      '阳虚质': 'yang_xu', 
      '阴虚质': 'yin_xu',
      '痰湿质': 'tan_shi',
      '湿热质': 'shi_re',
      '血瘀质': 'xue_yu',
      '气郁质': 'qi_yu',
      '特禀质': 'te_bing',
      '平和质': 'ping_he'
    };
    
    const constitutionKey = constitutionMap[constitutionType] || 'ping_he';
    
    const query = `
      SELECT 
        id, name, price, original_price, image_url, taobao_link,
        category, reason, rating, sales_count
      FROM products 
      WHERE status = 1 
        AND JSON_CONTAINS(constitution_types, ?)
      ORDER BY sort_order DESC, rating DESC 
      LIMIT 3
    `;
    
    const [products] = await pool.execute(query, [JSON.stringify(constitutionKey)]);
    
    return products;
    
  } catch (error) {
    console.error('获取推荐产品失败:', error);
    return [];
  }
}

// =================== 错误处理 ===================

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API接口不存在'
  });
});

// 全局错误处理
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// =================== 启动服务器 ===================

app.listen(PORT, () => {
  console.log('🚀 TCM舌诊后端服务启动成功!');
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 可用API接口:');
  console.log(`   GET  /api/products/recommendations - 获取推荐产品`);
  console.log(`   GET  /api/products/hot - 获取热门产品`);
  console.log(`   POST /api/diagnosis/analyze - 舌诊分析`);
  console.log(`   POST /api/products/:id/click - 产品点击统计`);
  console.log(`   GET  /api/products/:id - 获取产品详情`);
  console.log('');
  console.log('🔗 前端API调用示例:');
  console.log(`   fetch('http://localhost:${PORT}/api/products/hot')`);
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭服务器...');
  await pool.end();
  process.exit(0);
});