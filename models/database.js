// models/database.js
const { Sequelize } = require('sequelize');
const path = require('path');

console.log('🔧 正在初始化数据库连接...');

// 创建SQLite数据库连接
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'), // 数据库文件位置
  logging: console.log, // 显示SQL语句（开发环境）
  define: {
    freezeTableName: true, // 禁用表名复数化
    underscored: true,     // 使用下划线命名
    timestamps: true       // 自动添加创建时间和更新时间
  }
});

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    return false;
  }
}

// 同步数据库表
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ 数据库表同步完成！');
    return true;
  } catch (error) {
    console.error('❌ 数据库表同步失败:', error);
    return false;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};