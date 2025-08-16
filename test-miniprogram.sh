#!/bin/bash

echo "🚀 中医舌诊助手 - 微信小程序测试启动器"
echo "================================="

# 检查后端服务状态
echo "📡 检查后端API服务状态..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health)

if [ "$API_STATUS" = "200" ]; then
    echo "✅ 后端API服务正常运行 (端口: 3002)"
else
    echo "❌ 后端API服务未运行，正在启动..."
    cd tcm-backend
    echo "📦 启动后端服务..."
    node server-complete.js &
    BACKEND_PID=$!
    echo "⏳ 等待服务启动..."
    sleep 3
    
    # 再次检查
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/health)
    if [ "$API_STATUS" = "200" ]; then
        echo "✅ 后端服务启动成功"
    else
        echo "❌ 后端服务启动失败"
        exit 1
    fi
    cd ..
fi

echo ""
echo "📱 微信小程序测试准备完成！"
echo ""
echo "📋 下一步操作："
echo "1. 打开微信开发者工具"
echo "2. 导入项目路径: $(pwd)/wechat-miniprogram"
echo "3. 选择测试号或输入AppID"
echo "4. 在详情→本地设置中关闭域名校验"
echo "5. 点击编译开始测试"
echo ""
echo "🔗 相关链接："
echo "• 后端API: http://localhost:3002"
echo "• API健康检查: http://localhost:3002/api/health"
echo "• 测试指南: $(pwd)/wechat-miniprogram/测试指南.md"
echo ""
echo "🎯 测试要点："
echo "• 首页API状态应显示在线"
echo "• 可以选择图片进行分析"
echo "• 分析结果完整显示"
echo "• 产品推荐功能正常"
echo ""

# 检测是否安装了微信开发者工具
if command -v "/Applications/wechatwebdevtools.app/Contents/MacOS/cli" &> /dev/null; then
    echo "🔧 检测到微信开发者工具，是否自动打开项目？(y/n)"
    read -p "请选择: " choice
    if [ "$choice" = "y" ] || [ "$choice" = "Y" ]; then
        echo "🚀 正在打开微信开发者工具..."
        "/Applications/wechatwebdevtools.app/Contents/MacOS/cli" --project $(pwd)/wechat-miniprogram
    fi
else
    echo "💡 请手动打开微信开发者工具并导入项目"
fi

echo ""
echo "✨ 准备完成，开始测试吧！"