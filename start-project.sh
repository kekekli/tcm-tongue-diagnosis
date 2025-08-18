#!/bin/bash

echo "🚀 中医舌诊项目启动脚本 (v1.5-stable)"
echo "========================================="

# 检查是否在正确目录
if [ ! -f "server.js" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未安装Node.js"
    exit 1
fi

echo "📋 当前稳定版本信息："
echo "✅ 后端服务器: 端口3005"
echo "✅ 小程序API: http://192.168.110.20:3005"
echo "✅ 功能状态: 图片上传、舌诊分析、产品推荐正常"
echo ""

echo "启动选项："
echo "1. 启动后端服务器"
echo "2. 查看版本信息"
echo "3. 打开小程序开发工具"
echo "4. 打开H5版本"

read -p "请选择 (1-4): " choice

case $choice in
    1)
        echo "📡 启动后端服务器..."
        echo "🌐 API地址: http://192.168.110.20:3005"
        echo "📱 小程序项目: wechat-miniprogram/"
        echo ""
        echo "按 Ctrl+C 停止服务器"
        echo "========================================="
        PORT=3005 node server.js
        ;;
    2)
        echo "📊 版本信息："
        echo "Git标签: $(git describe --tags --exact-match HEAD 2>/dev/null || echo 'v1.5-stable')"
        echo "Commit: $(git rev-parse --short HEAD)"
        echo "分支: $(git branch --show-current)"
        echo "最后提交: $(git log -1 --format='%cd' --date=short)"
        ;;
    3)
        echo "🔧 打开微信开发者工具..."
        open -a "wechatwebdevtools" "$(pwd)/wechat-miniprogram"
        echo "✅ 微信开发者工具已启动"
        ;;
    4)
        echo "🌐 打开H5版本..."
        echo "📱 基础版: http://192.168.110.20:3005/tongue-h5.html"
        echo "📷 相机版: http://192.168.110.20:3005/tongue-camera.html"
        echo "🏠 导航页: http://192.168.110.20:3005/h5-index.html"
        open "http://192.168.110.20:3005/h5-index.html"
        echo "✅ H5版本已在浏览器中打开"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac