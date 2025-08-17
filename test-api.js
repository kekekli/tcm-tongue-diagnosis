// test-api.js
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

async function testAPI() {
  try {
    console.log('🧪 开始测试火山引擎AI API...');
    console.log('📍 API地址:', process.env.AI_API_URL);
    console.log('🤖 模型名称:', process.env.AI_MODEL_NAME);
    console.log('🔑 API密钥:', process.env.AI_API_KEY ? '已配置' : '未配置');
    
    const response = await axios.post(process.env.AI_API_URL, {
      model: process.env.AI_MODEL_NAME,
      messages: [{
        role: "user",
        content: "你好，请介绍一下你自己"
      }],
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API测试成功!');
    console.log('📝 AI回复:', response.data.choices[0].message.content);
    console.log('📊 使用统计:', response.data.usage);
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
  }
}

async function testImageAnalysis() {
  console.log('\n🖼️ 开始测试图像分析功能...');
  
  // 创建一个简单的测试图像数据 (1x1像素的JPEG)
  const testImageBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  
  try {
    const response = await axios.post(process.env.AI_API_URL, {
      model: process.env.AI_MODEL_NAME,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: "请分析这张图片，描述你看到了什么。"
          },
          {
            type: "image_url",
            image_url: {
              url: testImageBase64
            }
          }
        ]
      }],
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ 图像分析测试成功!');
    console.log('📝 AI分析结果:', response.data.choices[0].message.content);
    
  } catch (error) {
    console.error('❌ 图像分析测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
async function runAllTests() {
  await testAPI();
  await testImageAnalysis();
  
  console.log('\n🎉 API测试完成!');
}

runAllTests();