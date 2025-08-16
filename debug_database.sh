#!/bin/bash
echo "🔍 开始数据库调试..."

echo "📊 数据库统计信息："
sqlite3 database.sqlite "
SELECT 
  '用户总数: ' || COUNT(*) as info FROM users
UNION ALL
SELECT 
  '分析记录数: ' || COUNT(*) as info FROM tongue_analysis
UNION ALL  
SELECT 
  '产品总数: ' || COUNT(*) as info FROM products;
"

echo ""
echo "📝 最近5条分析记录："
sqlite3 database.sqlite "
SELECT 
  id,
  tongue_color,
  constitution_type,
  datetime(created_at, 'localtime') as created_time
FROM tongue_analysis 
ORDER BY created_at DESC 
LIMIT 5;
"

echo ""
echo "🛒 可用产品列表："
sqlite3 database.sqlite "
SELECT 
  id,
  name,
  '¥' || price as price,
  constitution_match
FROM products 
WHERE status = 1;
"
