# 🔍 Privacy Prism

**AI驱动的隐私风险分析平台** - 跨六个关键隐私维度评估内容

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg)](https://nodejs.org)

---

##  核心特性

```
 轻量级架构      5MB (vs 350MB) - 98.6% 包大小减少
 快速分析        8-15秒完成 - 比传统方案快 80%
免费部署        Vercel Hobby 计划完全够用
六维度分析      全面评估隐私风险
实时输出        SSE 流式显示结果
```

##  快速开始

### 本地开发

```bash
# 1. 克隆并安装
git clone https://github.com/your-username/privacy-prism.git
cd privacy-prism
npm install

# 2. 配置环境变量（创建 .env 文件）
OPENAI_API_KEY=sk-proj-your-key-here
MODEL=gpt-4o-mini
ANALYSIS_MODE=A

# 3. 启动服务器
npm start

# 4. 访问应用
# http://localhost:3000
```

### Vercel 一键部署

1. **推送到 GitHub**
```bash
git push origin main
```

2. **访问** [vercel.com/new](https://vercel.com/new) **导入仓库**

3. **配置环境变量**（⚠️ 关键步骤）
```
OPENAI_API_KEY = sk-proj-your-key-here
MODEL = gpt-4o-mini
ANALYSIS_MODE = A
```

4. **点击 Deploy** - 完成！

## 📖 使用方法

### 文本输入模式
1. 选择 "TEXT INPUT"
2. 粘贴要分析的内容
3. 点击 "INITIATE ANALYSIS"
4. 实时查看六维度分析结果

### URL 输入模式
1. 选择 "URL INPUT"
2. 输入网页 URL
3. 点击 "INITIATE ANALYSIS"
4. 自动爬取内容并分析

**支持的网站**: 新闻、博客、文档、Wikipedia、GitHub（85-90%的网站）  
**不支持**: 需要 JavaScript 渲染的单页应用

---

## 📚 完整文档

📖 **[查看完整指南 →](./COMPLETE_GUIDE.md)**

包含详细的：
- ✅ Vercel/Railway 部署步骤
- ✅ 环境变量配置说明
- ✅ 六维度分析详解
- ✅ 故障排查指南
- ✅ 性能优化建议
- ✅ 成本估算
- ✅ 常见问题 FAQ

---

## 🎯 六维度隐私分析

| 维度 | 说明 |
|------|------|
| 🔍 **Exposure** | 可识别的个人身份信息（姓名、地址、联系方式） |
| 🧠 **Inference** | 可推导的敏感信息（健康、信仰、位置） |
| 👥 **Audience & Consequences** | 内容传播范围和潜在影响 |
| 📱 **Platforms & Rules** | 平台政策风险和数据收集 |
| 📈 **Amplification** | 病毒式传播潜力 |
| 🎭 **Manipulability** | 被扭曲、伪造的风险 |

---

## 🏗️ 技术栈

```
前端:    HTML/CSS/JavaScript (原生)
后端:    Node.js + Express
部署:    Vercel Serverless Functions
AI引擎:  OpenAI GPT-4o/4o-mini
爬虫:    axios + cheerio (轻量级 5MB)
实时:    Server-Sent Events (SSE)
```

---

## 📁 项目结构

```
privacy-prism/
├── backend/
│   ├── api/              # Vercel Serverless Functions
│   │   ├── analyze.js    # 分析端点
│   │   └── health.js     # 健康检查
│   ├── config/           # 配置管理
│   ├── prompts/          # AI 提示词
│   ├── services/         # 核心服务
│   │   ├── analyzer.js   # OpenAI 集成
│   │   └── scraper.js    # 网页爬取
│   └── server.js         # Express 服务器（本地开发）
├── frontend/
│   ├── index.html        # 主页面
│   ├── css/style.css     # 样式
│   └── js/app.js         # 前端逻辑
├── vercel.json           # Vercel 配置
└── COMPLETE_GUIDE.md     # 完整指南
```

---

## 💰 成本估算

### Vercel 托管
```
✅ 免费 (Hobby 计划)
• 100 GB 带宽/月
• 100 GB-小时 执行时间/月
• 对个人使用完全够用
```

### OpenAI API
```
gpt-4o-mini (推荐):
• ~$0.001/次 (约1分钱)
• 100次分析 ≈ $0.30

gpt-4o:
• ~$0.02/次 (约2分钱)
• 50次分析 ≈ $1.00
```

---
