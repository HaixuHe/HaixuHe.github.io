# 个人学术主页

一个基于 GitHub Pages 的学术个人主页，支持可视化后台管理所有学术成果、PDF 文件托管、AI 角色扮演助手以及引用量自动更新。

## 📁 项目结构

```
HaixuHe.github.io/
├── index.html              # 主页入口
├── style.css               # 主页样式
├── script.js               # 主页脚本（动态加载 data.json）
├── ai-chat.js              # AI 聊天助手脚本
├── data.json               # 数据源（所有内容存储于此）
├── favicon.svg             # 网站图标
├── admin.html              # 数据管理后台
├── admin-style.css         # 管理后台样式
├── admin-script.js         # 管理后台脚本（GitHub API 集成）
├── update_citations.py     # 自动更新论文引用量脚本
├── README.md               # 项目文档
├── img/
│   └── avatar/             # 头像图片目录
├── pdfs/
│   ├── publications/       # 论文 PDF 托管目录
│   └── patents/            # 专利 PDF 托管目录
└── .github/workflows/
    └── update_citations.yml # GitHub Actions 工作流（每日自动更新引用量）
```

## ✨ 功能特性

### 主页功能
- 🎨 **现代化设计** — 响应式布局，完美适配桌面、平板、手机
- 📊 **动态数据加载** — 从 `data.json` 动态渲染所有内容，无需改动 HTML
- 🔍 **论文筛选** — 支持按类型（全部 / 期刊 / 会议）过滤展示
- 📄 **论文摘要** — 支持展开/收起查看摘要，附 DOI、PDF、代码链接
- 📈 **引用量显示** — 自动显示每篇论文的 OpenAlex 引用次数
- 🧮 **自动统计** — 论文、已授权专利、项目数量自动计算
- 👻 **智能隐藏** — 专利/项目数量为 0 时，导航栏和对应版块自动隐藏
- ✨ **动画效果** — 平滑滚动、淡入动画、数字滚动统计动画
- 🔗 **社交链接** — Google Scholar、GitHub 等社交链接支持
- 🤖 **AI 聊天助手** — 以站主身份与访客实时对话（详见 AI 助手章节）

### 管理后台功能（admin.html）
- 📝 **可视化编辑** — 无需手动改 JSON，图形化界面管理所有数据
- 🔐 **GitHub 集成** — 通过 GitHub API 直接在线保存，配置一次即可
- 🧪 **连接测试** — 一键验证 Token 与仓库权限配置
- 📤 **PDF 文件上传** — 直接从后台将 PDF 上传至仓库的 `pdfs/` 目录
- 🏷️ **已有 PDF 提示** — 若条目已有 PDF，选择框自动显示现有文件名
- 👁️ **数据预览** — JSON 格式预览并支持一键复制
- 💾 **一键保存** — 自动提交 `data.json` 到 GitHub 仓库
- 🔄 **引用量触发** — 手动触发 GitHub Actions 更新所有论文引用量
- 🌐 **站点信息** — 可配置网页标题和 SEO 描述（meta description）
- 🤖 **AI 助手配置** — 在后台配置 API Key、系统提示词和快捷提问词

### AI 聊天助手（ai-chat.js）
- 💬 **角色扮演** — 以站主第一人称与访客交流，严格基于 `data.json` 数据回答
- ⚡ **流式输出** — 实时逐字渲染，响应自然流畅
- 🧠 **模型** — 接入 [硅基流动](https://siliconflow.cn) `DeepSeek-V3.2` 大语言模型
- 💡 **快捷提问** — 每次回答后自动生成 3 条上下文相关的追问建议
- 🗑️ **清空对话** — 支持一键清空本次会话记录
- 🔑 **API Key 管理** — 在管理后台配置，存储于 `data.json`，无需修改代码

### 自动化功能
- 🤖 **每日自动更新** — GitHub Actions 每天 UTC 00:00 自动运行引用量更新
- 🔄 **手动触发** — 在管理后台一键触发，或在 GitHub Actions 页面手动运行
- 📊 **OpenAlex 集成** — 通过论文 DOI 查询 OpenAlex API 获取引用数据
- ✅ **增量提交** — 仅在数据有变化时才创建 Git commit，避免多余记录

## 🚀 快速开始

### 1. 部署到 GitHub Pages

```bash
# 1. 创建 GitHub 仓库
# 建议仓库名格式：用户名.github.io（如 HaixuHe.github.io）
# 仓库必须设为 Public 才能启用免费的 GitHub Pages

# 2. 克隆或上传项目文件
git clone https://github.com/用户名/用户名.github.io.git
cd 用户名.github.io

# 3. 提交所有文件
git add .
git commit -m "初始化个人主页"
git push origin main

# 4. 在仓库 Settings → Pages 中选择 main 分支作为来源
# 访问网站：https://用户名.github.io
```

### 2. 配置管理后台

#### 获取 GitHub Token
1. 访问 [GitHub Settings → Tokens (classic)](https://github.com/settings/tokens)
2. Developer settings → Personal access tokens → Tokens (classic)
3. 点击 "Generate new token (classic)"
4. **必须勾选 `repo`（完整仓库读写）和 `workflow`（触发 Actions）权限**
5. 生成并复制 Token（格式：`ghp_xxxxxxxxxxxx`）

> ⚠️ Token 仅显示一次，请立即复制保存。

#### 配置步骤
1. 打开 `admin.html`（本地或通过 `https://用户名.github.io/admin.html`）
2. 点击右上角 **"配置 GitHub Token"**
3. 填写：
   - **Token**：`ghp_xxxxxxxxxxxx`
   - **仓库名称**：`HaixuHe.github.io` 或 `用户名/仓库名`
   - **分支**：`main`（或 `master`）
4. 点击 **"测试连接"** 验证配置
5. 测试成功后点击 **"保存配置"**（配置存储在浏览器 localStorage，不上传）

### 3. 编辑内容

在管理后台左侧导航点击对应板块，编辑完成后点击右上角 **"保存到 GitHub"** 即可：

| 板块 | 说明 |
|------|------|
| 站点信息 | 网页标题、SEO 描述 |
| 个人信息 | 姓名、职称、简介、教育背景、研究方向、社交链接 |
| 论文发表 | 年份、类型、标题、作者、期刊、DOI、PDF、代码、摘要 |
| 专利成果 | 专利名、专利号、状态、发明人、PDF |
| 项目经历 | 时间、角色、描述、标签 |
| 统计数据 | 自动计算，仅供预览 |
| AI 助手 | 配置 API Key、系统提示词、快捷提问词 |

### 4. 上传 PDF 文件

在论文或专利卡片的 **"上传 PDF"** 区域：
1. 点击文件选择区域选择本地 PDF
2. 点击 **"上传到仓库"** 按钮，文件会自动上传到 `pdfs/publications/` 或 `pdfs/patents/` 目录
3. 上传成功后 PDF 链接会自动回填，但仍需点击右上角 **"保存到 GitHub"** 写入 `data.json`

> 若已有 PDF，选择区域会直接显示当前的文件名，方便确认。

### 5. 配置自动引用更新

`update_citations.yml` 已内置，Push 到仓库后即生效。系统每天 UTC 00:00 自动：
1. 运行 `update_citations.py` 脚本
2. 通过 OpenAlex API 按 DOI 查询每篇论文的引用量
3. 仅在数据变化时才提交更新后的 `data.json` 到仓库

**手动触发：**
- 方式 A：在管理后台 → 论文发表 → 点击 **"更新引用量"** 按钮
- 方式 B：在 GitHub 仓库 → Actions → Update Citations → Run workflow

### 6. 配置 AI 聊天助手

1. 前往 [硅基流动](https://siliconflow.cn) 注册并获取 API Key
2. 在管理后台 → AI 助手 板块填写：
   - **API Key**：硅基流动 API Key（`sk-xxxx`）
   - **系统提示词**（可选）：自定义 AI 角色设定；留空则使用默认模板（自动读取 `data.json` 内容）
   - **快捷提问词 1 / 2 / 3**：访客进入聊天后看到的快捷提问按钮
3. 保存后访客即可通过主页右下角头像按钮与 AI 助手对话

## 📊 数据结构

所有内容均存储在 `data.json`，管理后台会直接读写该文件。

```json
{
  "site": {
    "title": "贺海旭 | 遥感博士",
    "description": "遥感博士个人主页 - 研究领域、论文发表、专利与项目介绍"
  },
  "profile": {
    "name": "贺海旭",
    "nameEn": "Haixu He",
    "title": "职称 / 身份",
    "description": "一句话简介",
    "aboutIntro": "关于我版块的详细介绍段落",
    "email": "email@example.com",
    "address": "通讯地址",
    "university": "所在大学",
    "department": "院系",
    "lab": "实验室",
    "education": [
      {
        "degree": "博士",
        "major": "专业",
        "school": "学校",
        "year": "年份"
      }
    ],
    "researchInterests": ["研究方向1", "研究方向2"],
    "socialLinks": {
      "googleScholar": "https://scholar.google.com/...",
      "github": "https://github.com/..."
    }
  },
  "publications": [
    {
      "id": "pub001",
      "year": 2024,
      "type": "journal",
      "title": "论文标题",
      "authors": ["Author 1", "Author 2"],
      "journal": "期刊或会议名称",
      "doi": "https://doi.org/...",
      "pdf": "pdfs/publications/xxx.pdf",
      "code": "https://github.com/...",
      "abstract": "论文摘要",
      "citations": 10,
      "highlight": true
    }
  ],
  "patents": [
    {
      "id": "pat001",
      "title": "专利名称",
      "patentNumber": "CN202310XXXXXX.X",
      "pdf": "pdfs/patents/xxx.pdf",
      "status": "granted",
      "statusText": "已授权",
      "inventors": ["发明人1", "发明人2"],
      "year": 2023
    }
  ],
  "projects": [
    {
      "id": "proj001",
      "title": "项目名称",
      "subtitle": "项目副标题",
      "time": "2022 - 至今",
      "role": "项目负责人",
      "description": "项目描述",
      "tags": ["标签1", "标签2"]
    }
  ],
  "ai": {
    "apiKey": "sk-xxxx（硅基流动 API Key）",
    "systemPrompt": "自定义系统提示词，留空使用默认模板",
    "quickPrompts": [
      "快捷提问词1",
      "快捷提问词2",
      "快捷提问词3"
    ]
  }
}
```

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `publications[].type` | 是 | `"journal"` 或 `"conference"` |
| `publications[].highlight` | 否 | `true` 时在主页标记为重要论文 |
| `publications[].citations` | 否 | 由自动脚本填写，手动编辑无效 |
| `patents[].status` | 是 | `"granted"`（已授权）或 `"pending"`（审查中） |
| `patents[].statusText` | 否 | 显示文本，管理后台会自动同步 |
| `ai.apiKey` | AI功能必填 | 硅基流动 API Key |
| `ai.systemPrompt` | 否 | 留空则自动使用包含完整 data.json 的默认提示词 |

## 🎨 自定义样式

### 修改主题颜色

编辑 `style.css` 文件顶部的 CSS 变量：

```css
:root {
    --primary-color: #1a5f7a;      /* 主色调 */
    --primary-dark: #134b61;       /* 主色调深色 */
    --primary-light: #2d8eb0;      /* 主色调浅色 */
    --secondary-color: #57c5b6;    /* 辅助色 */
    --accent-color: #159895;       /* 强调色 */
}
```

### 替换头像

将头像图片放置在 `img/avatar/` 目录，并在 `index.html` 中将 `src="img/avatar/hhx.png"` 改为对应文件名。AI 聊天面板的头像同步使用该图片。

## 🔧 常见问题

**Q：保存到 GitHub 时提示 "权限不足"？**  
A：请确认 Token 已勾选 `repo` 权限（完整仓库读写）。

**Q：点击 "更新引用量" 提示 404？**  
A：确保 `.github/workflows/update_citations.yml` 已提交到仓库，且 Token 已勾选 `workflow` 权限。

**Q：AI 助手无响应？**  
A：请在管理后台 → AI 助手 板块填写有效的硅基流动 API Key，并通过 "保存到 GitHub" 写入 `data.json`。

**Q：上传 PDF 后主页链接没变？**  
A：PDF 上传仅将文件写入仓库，仍需点击 **"保存到 GitHub"** 将 PDF 路径写入 `data.json`。

**Q：专利 / 项目板块在主页不显示？**  
A：对应数量为 0 时，导航栏和版块会自动隐藏。添加至少一条记录并保存即可。

## 📄 技术栈

- **前端**：纯 HTML + CSS + JavaScript（无框架依赖）
- **数据**：JSON 文件（`data.json`）存储，GitHub API 读写
- **AI**：硅基流动 SiliconFlow API（DeepSeek-V3.2），SSE 流式输出
- **引用数据**：OpenAlex 开放学术 API
- **自动化**：GitHub Actions（每日定时 + 手动触发）
- **托管**：GitHub Pages（免费静态托管）


### 添加头像

1. 将头像图片放入项目文件夹（如 `avatar.jpg`）
2. 修改 `index.html` 第38-42行：

```html
<div class="hero-avatar">
    <img src="avatar.jpg" alt="头像" style="width: 160px; height: 160px; border-radius: 50%; object-fit: cover; box-shadow: 0 12px 48px rgba(0,0,0,0.15);">
</div>
```

## 🔧 开发指南

### 本地开发

```bash
# 方法1: 使用Python简易服务器
cd HaixuHe.github.io
python -m http.server 8000
# 访问 http://localhost:8000

# 方法2: 使用Node.js
npx serve .
# 或
npx http-server

# 方法3: 使用VS Code Live Server插件
# 右键 index.html → Open with Live Server
```

### 修改主页内容

主页内容从 `data.json` 动态加载，修改流程：

1. **方式一：使用管理后台**
   - 打开 `admin.html`
   - 编辑内容
   - 保存到GitHub

2. **方式二：直接编辑JSON**
   - 编辑 `data.json`
   - 提交到GitHub
   - 刷新主页

### 添加新功能

#### 添加新的页面板块

1. 在 `index.html` 添加HTML结构
2. 在 `data.json` 添加数据字段
3. 在 `script.js` 的 `populatePage()` 函数中添加渲染逻辑
4. 在 `admin.html` 和 `admin-script.js` 添加管理界面

#### 修改API调用

编辑 `admin-script.js` 中的 `saveToGitHub()` 函数：

```javascript
// GitHub API文档: https://docs.github.com/en/rest/repos/contents
const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/data.json`,
    {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: '更新数据',
            content: encodedContent,
            branch: branch,
            sha: sha  // 如果文件已存在
        })
    }
);
```

## 🐛 常见问题

### 1. 管理后台"测试连接"没反应

**解决方案**：
- 按 `Ctrl+F5` 强制刷新页面
- 检查浏览器控制台（F12）是否有错误
- 确认 `admin-script.js` 正确加载
- 尝试清除浏览器缓存

### 2. 保存失败：Not Found

**原因**：仓库名称格式错误

**解决方案**：
- 使用简化格式：`HaixuHe.github.io`（系统自动获取用户名）
- 或使用完整格式：`用户名/仓库名`
- 使用"测试连接"功能验证

### 3. 保存失败：权限不足

**原因**：Token权限不够

**解决方案**：
- 重新生成Token
- **必须勾选 `repo` 权限**（不是 `public_repo`）
- 确认Token没有过期

### 4. 主页数据不更新

**解决方案**：
- 强制刷新页面（`Ctrl+F5`）
- 清除浏览器缓存
- 检查 `data.json` 是否正确提交
- 在URL后添加 `?t=时间戳` 强制刷新

### 5. 跨域问题

**原因**：本地文件访问限制

**解决方案**：
- 使用本地服务器（不要直接打开HTML文件）
- 使用VS Code Live Server插件
- 使用Python: `python -m http.server 8000`

### 6. 引用量不更新或显示为0

**解决方案**：
- 检查论文是否有正确的DOI
- 确认DOI格式正确（如 `https://doi.org/10.xxxx/xxxxx`）
- 手动触发更新：在admin.html点击"更新引用量"
- 等待GitHub Actions自动运行（每天凌晨）
- 检查OpenAlex API是否包含该论文

### 7. 专利/项目板块不显示

**原因**：这是设计特性，当数量为0时自动隐藏

**解决方案**：
- 在管理后台添加专利或项目数据
- 保存后板块会自动显示

## 📚 相关链接

- [GitHub Pages](https://pages.github.com/)
- [GitHub API文档](https://docs.github.com/en/rest)
- [OpenAlex API](https://docs.openalex.org/)
- [Font Awesome图标](https://fontawesome.com/icons)

## 📝 更新日志

### 2024-03
- ✨ 新增论文引用量自动更新功能
- ✨ 新增论文摘要展开/收起功能
- ✨ 新增专利/项目数量为0时自动隐藏功能
- ✨ 新增手动触发引用更新按钮
- 🎨 优化页面样式和交互体验

---

**作者**: 贺海旭  
**邮箱**: 20161001925@cug.edu.cn  
**GitHub**: https://github.com/HaixuHe
