const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'your_password', // 请修改为您的MySQL密码
  charset: 'utf8mb4'
};

// 创建数据库和表的SQL
const createDatabaseSQL = `CREATE DATABASE IF NOT EXISTS tcm_tongue_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

const createTablesSQL = [
  // 产品表 - 对应前端界面中的推荐商品
  `CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '产品名称',
    description TEXT COMMENT '产品描述',
    price DECIMAL(10,2) NOT NULL COMMENT '现价',
    original_price DECIMAL(10,2) COMMENT '原价',
    rating DECIMAL(2,1) DEFAULT 4.9 COMMENT '评分',
    sales_count VARCHAR(20) DEFAULT '0+' COMMENT '销量显示',
    shop_name VARCHAR(100) COMMENT '店铺名称',
    image_url VARCHAR(255) COMMENT '产品图片URL',
    taobao_link VARCHAR(500) COMMENT '淘宝链接',
    category ENUM('herbs', 'health_food', 'tea', 'supplements') DEFAULT 'herbs' COMMENT '产品分类',
    constitution_types JSON COMMENT '适合的体质类型',
    tags JSON COMMENT '产品标签',
    specifications JSON COMMENT '产品规格',
    reason VARCHAR(255) COMMENT '推荐理由',
    status TINYINT DEFAULT 1 COMMENT '状态: 1-上架, 0-下架',
    sort_order INT DEFAULT 0 COMMENT '排序权重',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_sort (sort_order)
  ) COMMENT='产品信息表';`,

  // 用户表
  `CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(11) UNIQUE NOT NULL COMMENT '手机号',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
  ) COMMENT='用户信息表';`,

  // 舌诊记录表
  `CREATE TABLE IF NOT EXISTS diagnosis_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT COMMENT '用户ID，NULL表示游客',
    image_url VARCHAR(255) NOT NULL COMMENT '舌象图片URL',
    tongue_color VARCHAR(50) COMMENT '舌质颜色',
    tongue_texture VARCHAR(50) COMMENT '舌质质地',
    coating_color VARCHAR(50) COMMENT '舌苔颜色', 
    coating_thickness VARCHAR(50) COMMENT '舌苔厚薄',
    constitution_type VARCHAR(50) COMMENT '体质类型',
    advice TEXT COMMENT '健康建议',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) COMMENT='舌诊记录表';`,

  // 产品点击统计表
  `CREATE TABLE IF NOT EXISTS product_clicks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT COMMENT '用户ID，NULL表示游客',
    click_from ENUM('analysis', 'products_page') DEFAULT 'analysis' COMMENT '点击来源',
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_id (product_id),
    INDEX idx_clicked_at (clicked_at),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) COMMENT='产品点击统计表';`,

  // 推荐规则表  
  `CREATE TABLE IF NOT EXISTS recommendation_rules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tongue_condition JSON NOT NULL COMMENT '舌象条件(舌质+舌苔)',
    constitution_type VARCHAR(50) NOT NULL COMMENT '对应体质类型',
    product_ids JSON NOT NULL COMMENT '推荐产品ID列表',
    priority INT DEFAULT 0 COMMENT '优先级',
    is_active TINYINT DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_constitution (constitution_type),
    INDEX idx_priority (priority)
  ) COMMENT='推荐规则配置表';`
];

// 初始化产品数据
const initProductsData = `INSERT INTO products (name, description, price, original_price, rating, sales_count, shop_name, image_url, taobao_link, category, constitution_types, tags, specifications, reason, sort_order) VALUES
('九种体质调理茶包', '根据中医体质理论配制的复方茶包', 88.00, 128.00, 4.9, '1.8万+', '中医养生专营店', '/images/jiuzhong-tea.jpg', 'https://s.taobao.com/search?q=九种体质调理茶', 'tea', '["qi_xu", "yang_xu", "yin_xu", "tan_shi", "shi_re", "xue_yu", "qi_yu", "te_bing", "ping_he"]', '["体质调理", "个性化", "复方"]', '["规格：9种茶包各10袋", "成分：根据体质特点精心配制", "用法：根据体质选择相应茶包饮用"]', '针对不同体质，个性化调理', 100),

('舌诊养生套装', '包含多种体质调理产品', 168.00, 228.00, 4.8, '5600+', '中医体质调理专营', '/images/yangsheng-set.jpg', 'https://s.taobao.com/search?q=舌诊养生套装', 'health_food', '["qi_xu", "yang_xu", "yin_xu"]', '["舌诊", "养生", "套装"]', '["套装内容：体质茶+调理丸+养生粉", "适用：各种体质人群", "用法：按说明书配合使用"]', '舌诊指导下的养生产品组合', 90),

('黄芪片', '选用优质黄芪，传统工艺制作，适合气虚体质调理', 28.80, 36.00, 4.8, '1.2万+', '同仁堂官方旗舰店', '/images/huangqi.jpg', 'https://s.taobao.com/search?q=黄芪片+同仁堂', 'herbs', '["qi_xu"]', '["补气", "健脾", "免疫力"]', '["规格：0.4g×100片", "用法：口服，一次4-6片，一日2次", "贮藏：密封，置干燥处"]', '补气健脾，提升免疫力', 80),

('红枣枸杞茶', '精选新疆大枣和宁夏枸杞，天然无添加', 45.00, 58.00, 4.9, '8600+', '养生堂官方店', '/images/jujube-tea.jpg', 'https://s.taobao.com/search?q=红枣枸杞茶+养生堂', 'tea', '["qi_xu", "yin_xu"]', '["益气", "补血", "养颜"]', '["规格：5g×30包", "成分：红枣、枸杞子、茯苓", "用法：开水冲泡5-8分钟即可饮用"]', '益气补血，滋养身体', 70);`;

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔄 开始初始化数据库...');
    
    // 连接MySQL服务器
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 连接MySQL服务器成功');
    
    // 创建数据库
    await connection.execute(createDatabaseSQL);
    console.log('✅ 创建数据库成功');
    
    // 切换到目标数据库
    await connection.execute('USE tcm_tongue_db');
    console.log('✅ 切换到tcm_tongue_db数据库');
    
    // 创建表
    for (let i = 0; i < createTablesSQL.length; i++) {
      await connection.execute(createTablesSQL[i]);
      console.log(`✅ 创建表 ${i + 1}/${createTablesSQL.length} 成功`);
    }
    
    // 检查是否已有产品数据
    const [existingProducts] = await connection.execute('SELECT COUNT(*) as count FROM products');
    
    if (existingProducts[0].count === 0) {
      // 插入初始产品数据
      await connection.execute(initProductsData);
      console.log('✅ 初始化产品数据成功');
    } else {
      console.log('ℹ️  产品数据已存在，跳过初始化');
    }
    
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('📋 创建的表：');
    console.log('  - products (产品信息表)');
    console.log('  - users (用户信息表)');  
    console.log('  - diagnosis_records (舌诊记录表)');
    console.log('  - product_clicks (产品点击统计表)');
    console.log('  - recommendation_rules (推荐规则配置表)');
    console.log('');
    console.log('🔗 下一步：');
    console.log('  1. 修改 scripts/initDatabase.js 中的数据库密码');
    console.log('  2. 运行: npm run init-db');
    console.log('  3. 启动API服务: npm run dev');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.log('');
    console.log('🔧 解决方案：');
    console.log('  1. 确保MySQL服务已启动');
    console.log('  2. 检查数据库连接配置');
    console.log('  3. 确认用户名密码正确');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;