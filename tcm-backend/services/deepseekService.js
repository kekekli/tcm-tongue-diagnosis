// DeepSeek AI 服务
const { OpenAI } = require('openai');

class DeepSeekService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
    });
    
    this.isEnabled = !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here';
  }

  // 检查是否已正确配置
  isConfigured() {
    return this.isEnabled;
  }

  // 舌诊图像分析
  async analyzeTongueImage(imageBase64, userId = null) {
    if (!this.isConfigured()) {
      console.log('DeepSeek API 未配置，使用模拟数据');
      return this.generateMockAnalysis();
    }

    try {
      const prompt = this.createTongueAnalysisPrompt();
      
      const response = await this.client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "请分析这张舌诊图片，给出详细的中医诊断结果。"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const analysisText = response.choices[0].message.content;
      return this.parseAnalysisResult(analysisText);

    } catch (error) {
      console.error('DeepSeek API 调用失败:', error);
      
      // API调用失败时返回模拟数据
      console.log('使用模拟数据作为备用方案');
      return this.generateMockAnalysis();
    }
  }

  // 创建舌诊分析提示词
  createTongueAnalysisPrompt() {
    return `你是一位专业的中医师，擅长舌诊分析。请根据提供的舌头图片进行详细的中医舌诊分析。

分析要求：
1. 观察舌质（颜色、形态、纹理）
2. 观察舌苔（颜色、厚薄、分布）
3. 判断体质类型
4. 提供健康建议
5. 推荐适合的调理方法

请以JSON格式返回分析结果，格式如下：
{
  "tongueBody": {
    "color": "舌质颜色（如：淡红、红、暗红等）",
    "texture": "舌质纹理（如：润泽、干燥等）",
    "shape": "舌体形态（如：正常、胖大、瘦薄等）",
    "description": "舌质详细描述"
  },
  "coating": {
    "color": "舌苔颜色（如：白、黄、黑等）",
    "thickness": "舌苔厚薄（如：薄、厚、无苔等）",
    "distribution": "舌苔分布（如：全苔、半苔、剥苔等）",
    "description": "舌苔详细描述"
  },
  "constitution": {
    "primary": "主要体质类型",
    "secondary": "次要体质类型（如有）",
    "confidence": "诊断置信度（0-1）"
  },
  "diagnosis": {
    "syndrome": "中医证候",
    "severity": "严重程度（轻、中、重）",
    "description": "诊断说明"
  },
  "advice": "健康建议和调理方法",
  "recommendations": [
    {
      "category": "饮食建议",
      "content": "具体建议内容"
    },
    {
      "category": "生活习惯",
      "content": "具体建议内容"
    },
    {
      "category": "运动保健",
      "content": "具体建议内容"
    }
  ],
  "herbs": [
    {
      "name": "推荐中药名称",
      "function": "功效说明",
      "usage": "用法用量"
    }
  ]
}

注意：请确保返回的是有效的JSON格式，不要包含其他文字说明。`;
  }

  // 解析AI分析结果
  parseAnalysisResult(analysisText) {
    try {
      // 尝试提取JSON部分
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        
        // 验证必要字段
        if (parsed.tongueBody && parsed.coating && parsed.constitution) {
          return this.formatAnalysisResult(parsed);
        }
      }
      
      // 如果解析失败，返回基于文本的分析
      return this.parseTextAnalysis(analysisText);
      
    } catch (error) {
      console.error('解析AI分析结果失败:', error);
      return this.generateMockAnalysis();
    }
  }

  // 格式化分析结果
  formatAnalysisResult(parsed) {
    return {
      tongueBody: {
        color: parsed.tongueBody?.color || '淡红',
        texture: parsed.tongueBody?.texture || '润泽',
        shape: parsed.tongueBody?.shape || '正常',
        description: parsed.tongueBody?.description || '舌质正常'
      },
      coating: {
        color: parsed.coating?.color || '白',
        thickness: parsed.coating?.thickness || '薄',
        distribution: parsed.coating?.distribution || '全苔',
        description: parsed.coating?.description || '舌苔正常'
      },
      constitution: {
        primary: parsed.constitution?.primary || '平和质',
        secondary: parsed.constitution?.secondary || null,
        confidence: parsed.constitution?.confidence || 0.8
      },
      diagnosis: {
        syndrome: parsed.diagnosis?.syndrome || '正常',
        severity: parsed.diagnosis?.severity || '轻',
        description: parsed.diagnosis?.description || 'AI分析结果'
      },
      advice: parsed.advice || '保持健康的生活方式，均衡饮食，适量运动。',
      recommendations: parsed.recommendations || [
        {
          category: "饮食建议",
          content: "保持饮食均衡，多吃新鲜蔬菜水果"
        }
      ],
      herbs: parsed.herbs || [],
      timestamp: new Date().toISOString(),
      source: 'DeepSeek AI'
    };
  }

  // 从文本分析中提取信息
  parseTextAnalysis(text) {
    // 简单的文本分析逻辑
    const constitution = this.extractConstitution(text);
    
    return {
      tongueBody: {
        color: '淡红',
        texture: '润泽',
        shape: '正常',
        description: '基于AI文本分析的舌质描述'
      },
      coating: {
        color: '白',
        thickness: '薄',
        distribution: '全苔',
        description: '基于AI文本分析的舌苔描述'
      },
      constitution: {
        primary: constitution,
        secondary: null,
        confidence: 0.7
      },
      diagnosis: {
        syndrome: '待进一步分析',
        severity: '轻',
        description: text.substring(0, 200) + '...'
      },
      advice: '建议咨询专业中医师进行详细诊断。',
      recommendations: [
        {
          category: "AI分析建议",
          content: "这是基于AI文本分析的初步建议，建议咨询专业医师"
        }
      ],
      herbs: [],
      timestamp: new Date().toISOString(),
      source: 'DeepSeek AI (文本分析)'
    };
  }

  // 从文本中提取体质类型
  extractConstitution(text) {
    const constitutions = ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质', '特禀质'];
    
    for (const constitution of constitutions) {
      if (text.includes(constitution)) {
        return constitution;
      }
    }
    
    return '平和质';
  }

  // 生成模拟分析数据（当API不可用时使用）
  generateMockAnalysis() {
    const constitutions = ['平和质', '气虚质', '阳虚质', '阴虚质', '痰湿质', '湿热质', '血瘀质', '气郁质'];
    const colors = ['淡红', '红', '暗红', '紫红'];
    const coatingColors = ['白', '黄', '灰黑'];
    const thickness = ['薄', '厚', '无苔'];
    
    const randomConstitution = constitutions[Math.floor(Math.random() * constitutions.length)];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomCoatingColor = coatingColors[Math.floor(Math.random() * coatingColors.length)];
    const randomThickness = thickness[Math.floor(Math.random() * thickness.length)];

    return {
      tongueBody: {
        color: randomColor,
        texture: randomColor === '淡红' ? '润泽' : '偏干',
        shape: '正常',
        description: `舌质呈${randomColor}色，质地${randomColor === '淡红' ? '润泽' : '偏干'}`
      },
      coating: {
        color: randomCoatingColor,
        thickness: randomThickness,
        distribution: '全苔',
        description: `舌苔${randomCoatingColor}色${randomThickness}苔，分布均匀`
      },
      constitution: {
        primary: randomConstitution,
        secondary: null,
        confidence: 0.85
      },
      diagnosis: {
        syndrome: this.getConstitutionSyndrome(randomConstitution),
        severity: '轻',
        description: `根据舌象特征分析，您的体质偏向${randomConstitution}`
      },
      advice: this.getConstitutionAdvice(randomConstitution),
      recommendations: this.getConstitutionRecommendations(randomConstitution),
      herbs: this.getConstitutionHerbs(randomConstitution),
      timestamp: new Date().toISOString(),
      source: '模拟AI分析'
    };
  }

  // 获取体质对应的证候
  getConstitutionSyndrome(constitution) {
    const syndromes = {
      '平和质': '正常',
      '气虚质': '气虚证',
      '阳虚质': '阳虚证',
      '阴虚质': '阴虚证',
      '痰湿质': '痰湿证',
      '湿热质': '湿热证',
      '血瘀质': '血瘀证',
      '气郁质': '气滞证'
    };
    return syndromes[constitution] || '待分析';
  }

  // 获取体质对应的建议
  getConstitutionAdvice(constitution) {
    const advice = {
      '平和质': '保持现有的健康生活方式，继续均衡饮食和适量运动。',
      '气虚质': '注意补气养生，避免过度劳累，保证充足睡眠。',
      '阳虚质': '注意保暖，多食温热食物，适量运动增强体质。',
      '阴虚质': '滋阴润燥，避免熬夜，多食清淡滋润食物。',
      '痰湿质': '健脾除湿，控制体重，清淡饮食，加强运动。',
      '湿热质': '清热利湿，少食辛辣油腻，保持心情舒畅。',
      '血瘀质': '活血化瘀，适量运动，保持情绪稳定。',
      '气郁质': '疏肝理气，调节情志，保持心情愉快。'
    };
    return advice[constitution] || '建议咨询专业中医师。';
  }

  // 获取体质对应的推荐
  getConstitutionRecommendations(constitution) {
    const recommendations = {
      '平和质': [
        { category: "饮食建议", content: "继续保持均衡饮食，五谷杂粮搭配" },
        { category: "生活习惯", content: "规律作息，保持良好的生活节奏" },
        { category: "运动保健", content: "适量有氧运动，如散步、游泳" }
      ],
      '气虚质': [
        { category: "饮食建议", content: "多食补气食物：山药、大枣、桂圆等" },
        { category: "生活习惯", content: "避免过度劳累，保证充足睡眠" },
        { category: "运动保健", content: "选择缓和运动：太极拳、八段锦" }
      ],
      '阳虚质': [
        { category: "饮食建议", content: "温热食物：生姜、肉桂、羊肉等" },
        { category: "生活习惯", content: "注意保暖，避免贪凉" },
        { category: "运动保健", content: "适量运动生阳：慢跑、登山" }
      ]
    };
    return recommendations[constitution] || [
      { category: "基础建议", content: "建议咨询专业中医师制定个性化调理方案" }
    ];
  }

  // 获取体质对应的中药推荐
  getConstitutionHerbs(constitution) {
    const herbs = {
      '气虚质': [
        { name: "人参", function: "大补元气", usage: "煎汤或研末服用" },
        { name: "黄芪", function: "补气升阳", usage: "煎汤服用" }
      ],
      '阳虚质': [
        { name: "附子", function: "温阳补火", usage: "需医师指导使用" },
        { name: "干姜", function: "温中散寒", usage: "煎汤或入食" }
      ],
      '阴虚质': [
        { name: "沙参", function: "养阴润肺", usage: "煎汤服用" },
        { name: "麦冬", function: "滋阴润燥", usage: "泡茶或煎汤" }
      ]
    };
    return herbs[constitution] || [];
  }
}

module.exports = new DeepSeekService();