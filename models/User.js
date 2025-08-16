// models/User.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

console.log('📋 创建用户数据模型...');

const User = sequelize.define('users', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  phone: {
    type: DataTypes.STRING(11),
    allowNull: false,
    unique: true,
    comment: '手机号'
  },
  nickname: {
    type: DataTypes.STRING(50),
    comment: '昵称'
  },
  avatar: {
    type: DataTypes.STRING(255),
    comment: '头像URL'
  },
  gender: {
    type: DataTypes.TINYINT,
    comment: '性别：1-男，2-女'
  },
  constitution_type: {
    type: DataTypes.STRING(50),
    comment: '主要体质类型'
  },
  total_analysis_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总分析次数'
  },
  last_login_at: {
    type: DataTypes.DATE,
    comment: '最后登录时间'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-正常，0-禁用'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

console.log('✅ 用户模型创建完成');

module.exports = User;