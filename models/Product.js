// models/Product.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

console.log('🛒 创建产品数据模型...');

const Product = sequelize.define('products', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '产品ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '产品名称'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '产品描述'
  },
  category: {
    type: DataTypes.STRING(50),
    comment: '产品分类：体质调理、养生茶、中药材'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '现价'
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '原价'
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 4.5,
    comment: '评分 1-5'
  },
  sales_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '销量'
  },
  image_url: {
    type: DataTypes.STRING(500),
    comment: '产品图片URL'
  },
  taobao_url: {
    type: DataTypes.STRING(1000),
    comment: '淘宝链接'
  },
  constitution_match: {
    type: DataTypes.STRING(200),
    comment: '适合的体质类型，逗号分隔'
  },
  recommendation_reason: {
    type: DataTypes.STRING(200),
    comment: '推荐理由'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '推荐优先级 1-10'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-上架，0-下架'
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

console.log('✅ 产品模型创建完成');

module.exports = Product;