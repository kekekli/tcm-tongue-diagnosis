#!/bin/bash
echo "🎯 ========== 中医舌诊系统增强调试报告 =========="
echo "📅 生成时间: $(date)"
echo "🖥️  系统: $(uname -s) $(uname -r)"
echo "📂 工作目录: $(pwd)"
echo ""

echo "🔧 1. 服务器状态详细检查"
echo "检查端口3005服务状态..."
if lsof -ti:3005 > /dev/null 2>&1; then
  echo "✅ 服务器进程运行中 (PID: $(lsof -ti:3005))"
  echo "API健康检查:"
  curl -s http://localhost:3005/api/health | jq . 2>/dev/null || curl -s http://localhost:3005/api/health
else
  echo "❌ 端口3005无服务运行"
fi
echo ""

echo "💾 2. 数据库详细状态检查"
if [ -f "database.sqlite" ]; then
  echo "✅ 数据库文件存在 (大小: $(ls -lh database.sqlite | awk '{print $5}'))"
  echo "数据统计:"
  sqlite3 database.sqlite "
  SELECT '📊 ' || name || ': ' || 
    CASE name 
      WHEN 'users' THEN (SELECT COUNT(*) FROM users)
      WHEN 'tongue_analysis' THEN (SELECT COUNT(*) FROM tongue_analysis) 
      WHEN 'products' THEN (SELECT COUNT(*) FROM products)
    END || '条记录'
  FROM sqlite_master 
  WHERE type='table' AND name IN ('users', 'tongue_analysis', 'products')
  ORDER BY name;
  "
  
  echo ""
  echo "数据库完整性检查:"
  sqlite3 database.sqlite "PRAGMA integrity_check;" | head -1
else
  echo "❌ 数据库文件不存在"
fi
echo ""

echo "🌐 3. API接口全面测试"
echo "健康检查接口:"
curl -s -w "响应时间: %{time_total}s\n" http://localhost:3005/api/health | grep -E '"(success|status|database)"' || echo "❌ 健康检查失败"

echo ""
echo "产品查询接口:"
curl -s -w "响应时间: %{time_total}s\n" http://localhost:3005/api/products | grep -E '"(success|total)"' || echo "❌ 产品接口失败"

echo ""
echo "舌诊分析接口测试:"
curl -s -X POST http://localhost:3005/api/analysis/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageData": "test", "userId": null}' \
  -w "响应时间: %{time_total}s\n" | grep -E '"(success|message)"' || echo "❌ 分析接口失败"

echo ""
echo "📊 4. 数据分析报告"
sqlite3 database.sqlite "
.mode table
.headers on
SELECT 
  '统计项目' as item,
  '数值' as value,
  '说明' as description
UNION ALL
SELECT 
  '总用户数',
  CAST((SELECT COUNT(*) FROM users) as TEXT),
  '注册用户数量'
UNION ALL
SELECT 
  '总分析数', 
  CAST((SELECT COUNT(*) FROM tongue_analysis) as TEXT),
  '包含游客和用户分析'
UNION ALL
SELECT 
  '用户分析数',
  CAST((SELECT COUNT(*) FROM tongue_analysis WHERE user_id IS NOT NULL) as TEXT),
  '注册用户的分析记录'
UNION ALL
SELECT 
  '游客分析数',
  CAST((SELECT COUNT(*) FROM tongue_analysis WHERE user_id IS NULL) as TEXT), 
  '游客的分析记录'
UNION ALL
SELECT 
  '气虚质比例',
  CAST(ROUND((SELECT COUNT(*) * 100.0 FROM tongue_analysis WHERE constitution_type = '气虚质') / 
    (SELECT COUNT(*) FROM tongue_analysis), 1) as TEXT) || '%',
  '气虚质分析占比'
UNION ALL
SELECT 
  '湿热质比例',
  CAST(ROUND((SELECT COUNT(*) * 100.0 FROM tongue_analysis WHERE constitution_type = '湿热质') / 
    (SELECT COUNT(*) FROM tongue_analysis), 1) as TEXT) || '%',
  '湿热质分析占比';
" 2>/dev/null || echo "数据分析失败"

echo ""
echo "📈 5. 系统性能指标"
echo "数据库页面信息:"
sqlite3 database.sqlite "SELECT 'DB大小: ' || (page_count * page_size / 1024) || ' KB, 页数: ' || page_count FROM pragma_page_count(), pragma_page_size();" 2>/dev/null

echo ""
echo "最近活动:"
sqlite3 database.sqlite "
SELECT '🕐 ' || datetime(created_at, 'localtime') || ' - ' || constitution_type || ' (' || 
  CASE WHEN user_id IS NULL THEN '游客' ELSE '用户' || user_id END || ')'
FROM tongue_analysis 
ORDER BY created_at DESC 
LIMIT 5;
" 2>/dev/null || echo "暂无分析记录"

echo ""
echo "🎉 ========== 调试报告生成完成 =========="
echo "💡 建议: 定期运行此脚本监控系统状态"
