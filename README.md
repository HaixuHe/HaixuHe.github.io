# 个人学术主页

一个基于GitHub Pages的遥感博士生个人学术主页，支持在线管理论文、专利、项目等学术成果，并自动更新论文引用量。

## 📁 项目结构

```
HaixuHe.github.io/
├── index.html              # 主页入口
├── style.css               # 主页样式
├── script.js               # 主页脚本（动态加载数据）
├── data.json               # JSON数据库（存储所有内容）
├── admin.html              # 数据管理后台
├── admin-style.css         # 管理后台样式
├── admin-script.js         # 管理后台脚本（GitHub API集成）
├── update_citations.py     # 自动更新论文引用量脚本
├── README.md               # 项目文档
└── .github/workflows/
    └── update_citations.yml # GitHub Actions工作流（每日自动更新引用量）
```

## ✨ 功能特性

### 主页功能
- 🎨 **现代化设计** - 遥感主题配色，响应式布局
- 📊 **动态数据加载** - 从JSON文件动态加载所有内容
- 🔍 **论文筛选** - 支持按类型（期刊/会议）筛选论文
- 📄 **论文摘要** - 支持展开/收起查看论文摘要
- 📈 **引用量显示** - 自动显示每篇论文的引用次数
- 🧮 **自动统计** - 论文、专利、项目数量自动计算
- 👻 **智能隐藏** - 专利/项目数量为0时自动隐藏对应板块
- 📱 **响应式设计** - 完美适配桌面、平板、手机
- ✨ **动画效果** - 平滑滚动、淡入动画、数字统计动画
- 🔗 **社交链接** - Google Scholar、ResearchGate、GitHub、LinkedIn、ORCID

### 管理后台功能
- 📝 **可视化编辑** - 图形化界面编辑所有数据
- 🔐 **GitHub集成** - 使用GitHub API在线保存数据
- 🧪 **连接测试** - 验证Token和仓库配置
- 👁️ **数据预览** - JSON格式预览和复制
- 💾 **一键保存** - 自动提交到GitHub仓库
- 🔄 **引用更新** - 手动触发GitHub Actions更新论文引用量

### 自动化功能
- 🤖 **每日自动更新** - GitHub Actions每天自动查询OpenAlex API更新论文引用量
- 🔄 **手动触发更新** - 在管理后台可手动触发引用量更新
- 📊 **OpenAlex集成** - 通过DOI自动获取论文引用数据

## 🚀 快速开始

### 1. 部署到GitHub Pages

```bash
# 1. 创建GitHub仓库
# 仓库名格式：用户名.github.io（如 HaixuHe.github.io）

# 2. 克隆或上传项目文件
git clone https://github.com/用户名/用户名.github.io.git
cd 用户名.github.io

# 3. 提交所有文件
git add .
git commit -m "初始化个人主页"
git push origin main

# 4. 访问网站
# https://用户名.github.io
```

### 2. 配置管理后台

#### 获取GitHub Token
1. 访问 [GitHub Settings](https://github.com/settings/tokens)
2. Developer settings → Personal access tokens → Tokens (classic)
3. 点击 "Generate new token (classic)"
4. **必须勾选 `repo` 权限**（完整仓库访问权限）
5. 生成并复制Token（格式：`ghp_xxxxxxxxxxxx`）

#### 配置步骤
1. 打开 `admin.html`
2. 点击右上角 "配置GitHub Token"
3. 输入：
   - **Token**: `ghp_xxxxxxxxxxxx`
   - **仓库名称**: `HaixuHe.github.io` 或 `用户名/仓库名`
   - **分支**: `main` 或 `master`
4. 点击 "测试连接" 验证配置
5. 测试成功后点击 "保存配置"

### 3. 编辑内容

1. 在管理后台左侧菜单选择板块
2. 编辑表单内容
3. 点击右上角 "保存到GitHub"
4. 刷新主页查看效果

### 4. 配置自动引用更新

自动引用更新功能已内置，无需额外配置。系统会：
- 每天凌晨自动运行 `update_citations.py` 脚本
- 通过OpenAlex API查询每篇论文的DOI获取引用量
- 自动更新 `data.json` 并提交到GitHub

**手动触发更新**：
1. 打开 `admin.html`
2. 进入"论文发表"板块
3. 点击"更新引用量"按钮
4. 等待几分钟，系统会自动更新所有论文的引用量

## 📊 数据结构

### data.json 结构

```json
{
  "profile": {
    "name": "姓名",
    "nameEn": "English Name",
    "title": "职称/身份",
    "description": "个人简介",
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
      "researchGate": "https://www.researchgate.net/...",
      "github": "https://github.com/...",
      "linkedin": "https://www.linkedin.com/...",
      "orcid": "https://orcid.org/..."
    }
  },
  "stats": {
    "citations": 500
  },
  "publications": [
    {
      "id": "pub001",
      "year": 2024,
      "type": "journal",
      "title": "论文标题",
      "authors": ["Author1", "Author2"],
      "journal": "期刊名",
      "doi": "https://doi.org/...",
      "pdf": "https://...",
      "code": "https://github.com/...",
      "abstract": "论文摘要内容",
      "citations": 10,
      "highlight": true
    }
  ],
  "patents": [
    {
      "id": "pat001",
      "title": "专利名称",
      "patentNumber": "CN202310XXXXXX.X",
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
  ]
}
```

## 🎨 自定义样式

### 修改主题颜色

编辑 `style.css` 文件顶部的CSS变量：

```css
:root {
    --primary-color: #1a5f7a;      /* 主色调 */
    --primary-dark: #134b61;       /* 主色调深色 */
    --primary-light: #2d8eb0;      /* 主色调浅色 */
    --secondary-color: #57c5b6;    /* 辅助色 */
    --accent-color: #159895;       /* 强调色 */
}
```

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
