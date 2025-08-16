#!/bin/bash

echo "🚀 中医舌诊MVP项目启动脚本"
echo "=================================="

# 检查是否在正确目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

echo "📋 启动选项："
echo "1. 只启动前端 (端口3000)"
echo "2. 只启动后端 (端口3001)" 
echo "3. 同时启动前后端"
echo "4. 初始化后端数据库"

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "🎨 启动前端开发服务器..."
        npm run dev
        ;;
    2)
        echo "🔧 启动后端API服务器..."
        cd tcm-backend
        if [ ! -d "node_modules" ]; then
            echo "📦 安装后端依赖..."
            npm install
        fi
        npm run dev
        ;;
    3)
        echo "🚀 同时启动前后端服务..."
        
        # 启动后端
        cd tcm-backend
        if [ ! -d "node_modules" ]; then
            echo "📦 安装后端依赖..."
            npm install
        fi
        npm run dev &
        BACKEND_PID=$!
        
        # 等待后端启动
        sleep 3
        
        # 启动前端
        cd ..
        npm run dev &
        FRONTEND_PID=$!
        
        echo "✅ 前后端服务已启动"
        echo "📱 前端地址: http://localhost:3000"
        echo "🔗 后端地址: http://localhost:3001"
        echo "📱 手机访问: http://192.168.0.51:3000"
        echo ""
        echo "按 Ctrl+C 停止所有服务"
        
        # 等待用户中断
        trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
        wait
        ;;
    4)
        echo "🗄️  初始化数据库..."
        cd tcm-backend
        if [ ! -d "node_modules" ]; then
            echo "📦 安装后端依赖..."
            npm install
        fi
        
        echo "⚠️  请确保MySQL服务已启动，并在 tcm-backend/.env 中配置了正确的数据库密码"
        read -p "按回车键继续，或 Ctrl+C 取消..."
        
        npm run init-db
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac