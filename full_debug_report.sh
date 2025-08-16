#!/bin/bash
echo "🎯 ========== 中医舌诊系统完整调试报告 =========="
echo "📅 生成时间: $(date)"
echo ""

echo "🔧 1. 服务器状态检查"
curl -s http://localhost:3005/api/health | grep -o '"success":[^,]*' || echo "❌ 服务器无响应"
echo ""

echo "💾 2. 数据库状态检查"
if [ -f "database.sqlite" ]; then
  echo "✅ 数据库文件存在"
  sqlite3 database.sqlite "SELECT '用户数: ' || COUNT(*) FROM users;"
  sqlite3 database.sqlite "SELECT '分析记录数: ' || COUNT(*) FROM tongue_analysis;"
  sqlite3 database.sqlite "SELECT '产品数: ' || COUNT(*) FROM products;"
else
  echo "❌ 数据库文件不存在"
fi
echo ""

echo "🌐 3. API接口测试"
echo "产品接口测试:"
curl -s http://localhost:3005/api/products | grep -o '"success":[^,]*' || echo "❌ 产品接口失败"
echo ""

echo "📊 4. 最新数据记录"
sqlite3 database.sqlite "
SELECT 
  '最新分析: ' || tongue_color || ' - ' || constitution_type || ' (' || datetime(created_at, 'localtime') || ')' 
FROM tongue_analysis 
ORDER BY created_at DESC 
LIMIT 3;
" 2>/dev/null || echo "暂无分析记录"

echo ""
echo "🎉 调试报告生成完成!"
