const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' })); // 增加请求体大小限制
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

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
    specifications: ['规格：9种茶包各10袋', '成分：根据体质特点精心配制', '用法：根据体质选择相应茶包饮用'],
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
    specifications: ['套装内容：体质茶+调理丸+养生粉', '适用：各种体质人群', '用法：按说明书配合使用'],
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
    specifications: ['规格：0.4g×100片', '用法：口服，一次4-6片，一日2次', '贮藏：密封，置干燥处'],
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
    specifications: ['规格：5g×30包', '成分：红枣、枸杞子、茯苓', '用法：开水冲泡5-8分钟即可饮用'],
    reason: '益气补血，滋养身体'
  }
];

// =================== 核心API路由 ===================

// 1. 获取推荐产品
app.get('/api/products/recommendations', async (req, res) => {
  try {
    const { constitution_type, limit = 8 } = req.query;
    
    let products = [...mockProducts];
    
    // 简单模拟体质筛选
    if (constitution_type) {
      // 这里可以根据实际需求添加筛选逻辑
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

// 2. 获取热门产品
app.get('/api/products/hot', async (req, res) => {
  try {
    // 返回前4个产品作为热门产品
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

// 3. 舌诊分析API
app.post('/api/diagnosis/analyze', async (req, res) => {
  try {
    const { imageData, userId = null } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: '请提供舌象图片'
      });
    }
    
    // 模拟AI分析结果
    const analysisResult = await simulateAnalysis();
    
    // 获取相关推荐产品
    const recommendedProducts = getRecommendedProducts(analysisResult.constitution.primary);
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

// 5. 获取产品详情
app.get('/api/products/:id', async (req, res) => {
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

// =================== 辅助函数 ===================

// 模拟AI舌诊分析
async function simulateAnalysis() {
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
    advice: '建议保持规律作息，适当运动，饮食清淡。根据体质特点进行个性化调理。'
  };
  
  return result;
}

// 获取推荐产品
function getRecommendedProducts(constitutionType) {
  // 简单模拟：返回前3个产品作为推荐
  return mockProducts.slice(0, 3).map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    original_price: product.original_price,
    image_url: product.image_url,
    taobao_link: product.taobao_link,
    category: product.category,
    reason: product.reason,
    rating: product.rating,
    sales_count: product.sales_count
  }));
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
  console.log('🚀 TCM舌诊后端服务启动成功! (模拟数据版本)');
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
  console.log('');
  console.log('📝 注意: 当前使用模拟数据，无需数据库连接');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  process.exit(0);
});