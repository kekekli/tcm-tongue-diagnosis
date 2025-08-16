#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 DeepSeek API 配置向导');
console.log('='.repeat(50));

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupDeepSeekAPI() {
  try {
    console.log('\n📋 说明：');
    console.log('1. 需要 DeepSeek API 密钥才能使用真实的AI分析功能');
    console.log('2. 如果不配置，系统将使用模拟数据');
    console.log('3. 获取API密钥：https://platform.deepseek.com/');
    
    const hasKey = await question('\n是否要配置 DeepSeek API 密钥？(y/n): ');
    
    if (hasKey.toLowerCase() === 'y' || hasKey.toLowerCase() === 'yes') {
      const apiKey = await question('请输入您的 DeepSeek API 密钥: ');
      
      if (apiKey && apiKey.length > 10) {
        // 更新 .env 文件
        const envPath = path.join(__dirname, '.env');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
        
        // 替换或添加 API 密钥
        if (envContent.includes('DEEPSEEK_API_KEY=')) {
          envContent = envContent.replace(
            /DEEPSEEK_API_KEY=.*/,
            `DEEPSEEK_API_KEY=${apiKey}`
          );
        } else {
          envContent += `\nDEEPSEEK_API_KEY=${apiKey}`;
        }
        
        fs.writeFileSync(envPath, envContent);
        
        console.log('\n✅ API 密钥配置成功！');
        console.log('📱 现在将使用真实的AI分析功能');
        
        // 测试 API 连接
        console.log('\n🧪 测试 API 连接...');
        await testAPI(apiKey);
        
      } else {
        console.log('\n❌ API 密钥格式不正确');
      }
    } else {
      console.log('\n📝 跳过API配置，将使用模拟数据');
      console.log('💡 提示：随时可以重新运行此脚本配置API密钥');
    }
    
    console.log('\n🚀 配置完成！请重启服务器以应用新配置');
    console.log('运行命令: npm restart 或 node server-complete.js');
    
  } catch (error) {
    console.error('\n❌ 配置过程中出现错误:', error.message);
  } finally {
    rl.close();
  }
}

async function testAPI(apiKey) {
  try {
    const { OpenAI } = require('openai');
    
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    
    // 简单测试请求
    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: "Hello, 请用中文回复"
        }
      ],
      max_tokens: 50
    });
    
    if (response.choices && response.choices[0]) {
      console.log('✅ API 连接测试成功！');
      console.log('📝 测试响应:', response.choices[0].message.content.substring(0, 50) + '...');
    } else {
      console.log('⚠️  API 响应格式异常');
    }
    
  } catch (error) {
    console.log('❌ API 连接测试失败:', error.message);
    console.log('💡 请检查API密钥是否正确，或稍后再试');
  }
}

// 运行配置向导
setupDeepSeekAPI();