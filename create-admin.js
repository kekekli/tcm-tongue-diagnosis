// create-admin.js - 创建管理员用户的脚本
const { User } = require('./models');
const { hashPassword } = require('./utils/auth');

async function createAdmin() {
  try {
    console.log('🔧 开始创建管理员用户...');
    
    // 检查是否已存在管理员
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('✅ 管理员用户已存在:', existingAdmin.phone);
      return;
    }
    
    // 创建管理员用户
    const hashedPassword = await hashPassword('admin123');
    
    const admin = await User.create({
      phone: '13800138000',
      password: hashedPassword,
      nickname: '系统管理员',
      email: 'admin@tcm-tongue.com',
      gender: 1,
      constitution_type: '平和质',
      total_analysis_count: 0,
      last_login_at: new Date(),
      status: 1,
      role: 'admin'
    });
    
    console.log('✅ 管理员用户创建成功!');
    console.log('📱 手机号: 13800138000');
    console.log('🔑 密码: admin123');
    console.log('👤 用户ID:', admin.id);
    
  } catch (error) {
    console.error('❌ 创建管理员失败:', error);
  } finally {
    process.exit(0);
  }
}

// 运行脚本
createAdmin();