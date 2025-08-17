// routes/auth.js
const express = require('express');
const { User } = require('../models');
const { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  createTokenPayload,
  validatePassword,
  validatePhone,
  validateEmail
} = require('../utils/auth');
const { loginLimiter, registerLimiter } = require('../middleware/auth');

const router = express.Router();

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { phone, password, nickname, email, gender } = req.body;
    
    // 输入验证
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: '手机号和密码不能为空',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    // 验证手机号格式
    if (!validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: '手机号格式不正确',
        code: 'INVALID_PHONE_FORMAT'
      });
    }
    
    // 验证邮箱格式（如果提供）
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    // 验证密码强度
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
        code: 'INVALID_PASSWORD'
      });
    }
    
    // 检查手机号是否已存在
    const existingUserByPhone = await User.findOne({ where: { phone } });
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: '该手机号已被注册',
        code: 'PHONE_ALREADY_EXISTS'
      });
    }
    
    // 检查邮箱是否已存在（如果提供）
    if (email) {
      const existingUserByEmail = await User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(409).json({
          success: false,
          message: '该邮箱已被注册',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }
    
    // 加密密码
    const hashedPassword = await hashPassword(password);
    
    // 创建用户
    const user = await User.create({
      phone,
      password: hashedPassword,
      nickname: nickname || `用户${phone.substring(7)}`,
      email: email || null,
      gender: gender || null,
      constitution_type: null,
      total_analysis_count: 0,
      last_login_at: new Date(),
      status: 1
    });
    
    // 生成token
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);
    
    console.log(`✅ 用户注册成功: ${phone}`);
    
    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          email: user.email,
          gender: user.gender,
          constitution_type: user.constitution_type,
          total_analysis_count: user.total_analysis_count,
          role: user.role,
          created_at: user.created_at
        },
        token,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
      code: 'REGISTER_ERROR'
    });
  }
});

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier可以是手机号或邮箱
    
    // 输入验证
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入手机号/邮箱和密码',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // 根据输入判断是手机号还是邮箱
    const isPhone = validatePhone(identifier);
    const isEmail = validateEmail(identifier);
    
    if (!isPhone && !isEmail) {
      return res.status(400).json({
        success: false,
        message: '请输入正确的手机号或邮箱',
        code: 'INVALID_IDENTIFIER'
      });
    }
    
    // 查找用户
    const whereCondition = isPhone ? { phone: identifier } : { email: identifier };
    const user = await User.findOne({ where: whereCondition });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 检查用户状态
    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '账户已被禁用，请联系管理员',
        code: 'ACCOUNT_DISABLED'
      });
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '密码错误',
        code: 'INVALID_PASSWORD'
      });
    }
    
    // 更新最后登录时间
    await user.update({ last_login_at: new Date() });
    
    // 生成token
    const tokenPayload = createTokenPayload(user);
    const token = generateToken(tokenPayload);
    
    console.log(`✅ 用户登录成功: ${identifier}`);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          email: user.email,
          gender: user.gender,
          constitution_type: user.constitution_type,
          total_analysis_count: user.total_analysis_count,
          role: user.role,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        },
        token,
        expiresIn: '7d'
      }
    });
    
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', async (req, res) => {
  try {
    // 这个路由需要在server.js中应用authenticateToken中间件
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    const user = await User.findByPk(userId, {
      attributes: [
        'id', 'phone', 'email', 'nickname', 'avatar', 'gender',
        'constitution_type', 'total_analysis_count', 'last_login_at',
        'status', 'created_at', 'updated_at'
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: {
        user
      }
    });
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * 修改密码
 * PUT /api/auth/password
 */
router.put('/password', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请输入当前密码和新密码',
        code: 'MISSING_PASSWORDS'
      });
    }
    
    // 验证新密码强度
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
        code: 'INVALID_NEW_PASSWORD'
      });
    }
    
    // 获取用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 验证当前密码
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // 检查新密码是否与当前密码相同
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: '新密码不能与当前密码相同',
        code: 'SAME_PASSWORD'
      });
    }
    
    // 加密新密码
    const hashedNewPassword = await hashPassword(newPassword);
    
    // 更新密码
    await user.update({ password: hashedNewPassword });
    
    console.log(`✅ 用户修改密码成功: ${user.phone}`);
    
    res.json({
      success: true,
      message: '密码修改成功',
      data: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败，请稍后重试',
      code: 'UPDATE_PASSWORD_ERROR'
    });
  }
});

/**
 * 更新用户资料
 * PUT /api/auth/profile
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { nickname, email, gender, constitution_type } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '请先登录',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    // 验证邮箱格式（如果提供）
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '邮箱格式不正确',
        code: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    // 获取用户
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 检查邮箱是否已被其他用户使用
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: userId } // 排除当前用户
        } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '该邮箱已被其他用户使用',
          code: 'EMAIL_ALREADY_EXISTS'
        });
      }
    }
    
    // 准备更新数据
    const updateData = {};
    if (nickname !== undefined) updateData.nickname = nickname;
    if (email !== undefined) updateData.email = email;
    if (gender !== undefined) updateData.gender = gender;
    if (constitution_type !== undefined) updateData.constitution_type = constitution_type;
    
    // 更新用户资料
    await user.update(updateData);
    
    console.log(`✅ 用户更新资料成功: ${user.phone}`);
    
    res.json({
      success: true,
      message: '资料更新成功',
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          email: user.email,
          gender: user.gender,
          constitution_type: user.constitution_type,
          updated_at: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('更新用户资料失败:', error);
    res.status(500).json({
      success: false,
      message: '更新资料失败，请稍后重试',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

module.exports = router;