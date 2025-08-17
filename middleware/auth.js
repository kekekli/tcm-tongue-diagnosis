// middleware/auth.js
const rateLimit = require('express-rate-limit');
const { verifyToken, extractToken } = require('../utils/auth');
const { User } = require('../models');

/**
 * 认证中间件 - 验证JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，需要提供有效的token',
        code: 'NO_TOKEN'
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Token无效或已过期',
        code: 'INVALID_TOKEN'
      });
    }
    
    // 验证用户是否仍然存在且状态正常
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (user.status !== 1) {
      return res.status(403).json({
        success: false,
        message: '用户账户已被禁用',
        code: 'ACCOUNT_DISABLED'
      });
    }
    
    // 将用户信息添加到请求对象
    req.user = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      nickname: user.nickname,
      constitution_type: user.constitution_type
    };
    
    next();
    
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      success: false,
      message: '认证过程中发生错误',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * 可选认证中间件 - 如果有token则验证，没有则跳过
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = verifyToken(token);
    
    if (decoded) {
      const user = await User.findByPk(decoded.userId);
      if (user && user.status === 1) {
        req.user = {
          id: user.id,
          phone: user.phone,
          email: user.email,
          nickname: user.nickname,
          constitution_type: user.constitution_type
        };
      } else {
        req.user = null;
      }
    } else {
      req.user = null;
    }
    
    next();
    
  } catch (error) {
    console.error('可选认证中间件错误:', error);
    req.user = null;
    next();
  }
};

/**
 * 登录频率限制
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP在15分钟内最多尝试5次登录
  message: {
    success: false,
    message: '登录尝试过于频繁，请15分钟后再试',
    code: 'TOO_MANY_LOGIN_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功的请求不计入限制
});

/**
 * 注册频率限制
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 3, // 限制每个IP在1小时内最多注册3次
  message: {
    success: false,
    message: '注册过于频繁，请1小时后再试',
    code: 'TOO_MANY_REGISTER_ATTEMPTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API请求频率限制
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在15分钟内最多100次API请求
  message: {
    success: false,
    message: 'API请求过于频繁，请稍后再试',
    code: 'TOO_MANY_REQUESTS'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 验证用户权限中间件
 * @param {string|Array} roles - 允许的角色
 */
const requireRole = (roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要先登录',
        code: 'LOGIN_REQUIRED'
      });
    }
    
    // 获取完整用户信息包括角色
    const { User } = require('../models');
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // 检查角色权限
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    // 将角色信息添加到req.user
    req.user.role = user.role;
    next();
  };
};

/**
 * 管理员权限中间件
 */
const requireAdmin = requireRole('admin');

module.exports = {
  authenticateToken,
  optionalAuth,
  loginLimiter,
  registerLimiter,
  apiLimiter,
  requireRole,
  requireAdmin
};