// utils/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT配置
const JWT_SECRET = process.env.JWT_SECRET || 'tcm-tongue-diagnosis-secret-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT token
 * @param {Object} payload - token载荷
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'tcm-tongue-diagnosis'
  });
}

/**
 * 验证JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} 解码后的载荷或null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token验证失败:', error.message);
    return null;
  }
}

/**
 * 加密密码
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 加密后的密码
 */
async function hashPassword(password) {
  try {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error('密码加密失败:', error);
    throw new Error('密码加密失败');
  }
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyPassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('密码验证失败:', error);
    return false;
  }
}

/**
 * 从Authorization header中提取token
 * @param {string} authHeader - Authorization header值
 * @returns {string|null} token或null
 */
function extractToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // 移除'Bearer '前缀
}

/**
 * 生成用户token载荷
 * @param {Object} user - 用户对象
 * @returns {Object} token载荷
 */
function createTokenPayload(user) {
  return {
    userId: user.id,
    phone: user.phone,
    email: user.email,
    nickname: user.nickname,
    iat: Math.floor(Date.now() / 1000) // 签发时间
  };
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @returns {Object} {valid: boolean, message: string}
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: '密码不能为空' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: '密码长度不能少于6位' };
  }
  
  if (password.length > 20) {
    return { valid: false, message: '密码长度不能超过20位' };
  }
  
  // 检查是否包含至少一个数字和一个字母
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  
  if (!hasNumber || !hasLetter) {
    return { valid: false, message: '密码必须包含至少一个字母和一个数字' };
  }
  
  return { valid: true, message: '密码强度符合要求' };
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  extractToken,
  createTokenPayload,
  validatePassword,
  validatePhone,
  validateEmail,
  JWT_SECRET,
  JWT_EXPIRES_IN
};