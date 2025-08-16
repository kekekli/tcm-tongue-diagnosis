// models/TongueAnalysis.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

console.log('📸 创建舌诊分析数据模型...');

const TongueAnalysis = sequelize.define('tongue_analysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '分析记录ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    comment: '用户ID（可为空，支持游客使用）'
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '舌诊图片URL'
  },
  analysis_result: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '完整分析结果JSON'
  },
  tongue_color: {
    type: DataTypes.STRING(50),
    comment: '舌质颜色：舌红、舌淡、正常等'
  },
  coating_type: {
    type: DataTypes.STRING(50),
    comment: '舌苔类型：苔厚、苔薄、苔腻等'
  },
  constitution_type: {
    type: DataTypes.STRING(50),
    comment: '体质类型：湿热质、气虚质等'
  },
  confidence_score: {
    type: DataTypes.DECIMAL(3, 2),
    comment: '置信度分数 0-1'
  },
  suggestions: {
    type: DataTypes.JSON,
    comment: '健康建议列表'
  },
  recommended_products: {
    type: DataTypes.JSON,
    comment: '推荐产品列表'
  },
  analysis_duration: {
    type: DataTypes.INTEGER,
    comment: '分析耗时(毫秒)'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    comment: '用户IP地址'
  }
}, {
  tableName: 'tongue_analysis',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

console.log('✅ 舌诊分析模型创建完成');

module.exports = TongueAnalysis;