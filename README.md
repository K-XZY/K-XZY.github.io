# Personal Portfolio Website

> 个人学术 Portfolio / 数字化 CV — JadeRegent 主题

## 项目目标

建立一个静态个人网站，用于：
1. **自我展示**：作为申请 PhD 或科研工作的数字名片
2. **博客发布**：分享研究笔记、论文阅读心得、学习总结
3. **研究方向展示**：展示当前的研究兴趣和项目

---

## 设计理念

### JadeRegent — 严谨、纯洁、价值

设计灵感来自古老的皇家气质，重新诠释为现代语境下的严谨与纯粹。像 Apple 设计那样：克制、每个元素都有其存在的意义。

**五大设计原则**：

| 原则                         | 体现                                             |
| ---------------------------- | ------------------------------------------------ |
| **Thinking Outside the Box** | 头像突破卡片边界，体现科研人员的创新精神         |
| **三维纵深感**               | 导航栏 3D 倾斜朝向内容，建立空间层次             |
| **方正**                     | 极小圆角 (3px)，接近直角但不尖锐，传达精确与力量 |
| **呼吸感**                   | 重复元素（文章列表）无边框，避免视觉沉重         |
| **交互反馈**                 | 悬浮时绿色下划线亮起，从墨绿渐变到荧光绿         |

### 空间布局

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────┐                      ┌─────────────────────────┐   │
│   │         │ ←── 3D 倾斜          │ ┌───┐                   │   │
│   │ 导航栏   │     朝向内容 →       │ │头像│← 突破边界        │   │
│   │         │                      │ └───┘ About 卡片        │   │
│   │  (向导)  │                      │   ════════════════      │   │
│   │         │                      │   墨绿下划线 ↑          │   │
│   └─────────┘                      └─────────────────────────┘   │
│       ↑                                                          │
│   放大 1.25x                        ┌─────────────────────────┐   │
│   右移 10%                          │  Search / Tags          │   │
│   Y轴旋转 8°                        └─────────────────────────┘   │
│                                                                  │
│                                     ┌─────────────────────────┐   │
│                                     │  Post 1                 │   │
│                                     │  ─────────────────────  │   │
│                                     │  Post 2      悬浮时     │   │
│                                     │  ═════════════════════  │   │
│                                     │       底线变荧光绿 ↑    │   │
│                                     └─────────────────────────┘   │
│                                                                  │
│         ← 导航栏区域 →              ← 内容区（偏右 10%）→         │
└──────────────────────────────────────────────────────────────────┘
```

### 配色方案

```css
:root {
  /* 背景层级 */
  --void: #080a08;      /* 页面背景 */
  --surface: #0b0d0b;   /* 卡片背景 */
  --elevated: #0e100e;  /* 头像背景 */

  /* 边框 */
  --line: rgba(255, 255, 255, 0.06);

  /* 墨绿层级 — 核心视觉元素 */
  --jade: #1a2e1a;        /* 深墨绿 */
  --jade-light: #243824;  /* 默认下划线 */
  --jade-bright: #39ff14; /* 悬浮时荧光绿（外星人绿） */

  /* 暗金 — 点睛之笔 */
  --accent: #a08c5b;      /* 名字、文章标题悬浮 */

  /* 文字层级 */
  --text-primary: #f5f5f5;
  --text-secondary: #999;
  --text-tertiary: #666;
  --text-quaternary: #444;

  /* 圆角 */
  --radius: 3px;
}
```

### 交互设计

**导航栏**（向导）：
- 固定左侧，放大 1.25 倍，右移 10%
- 基础 Y 轴旋转 8°，朝向内容方向倾斜（球会滚向内容）
- 鼠标移动时有轻微 3D 视差响应
- 像一个可靠的机器人，引导用户浏览

**绿色下划线**（重点标记）：
- 位置：头像底部、About 卡片底部、文章分隔线
- 默认：墨绿 `#243824`
- 悬浮：0.3s 渐变到荧光绿 `#39ff14`

**头像**（Thinking Outside the Box）：
- 140×140px 正方形，突破 About 卡片边界
- 左上角外延 40px，体现创新精神
- 底部有墨绿下划线

**文章列表**（呼吸感）：
- 无边框，只有水平分隔线
- 悬浮时：标题变金色，底线变荧光绿

---

## 技术选型

| 技术       | 选择                    | 理由                      |
| ---------- | ----------------------- | ------------------------- |
| 前端       | HTML + CSS + JavaScript | 纯静态，简单可控          |
| 内容格式   | **HTML**                | 直接控制，支持复杂交互    |
| 数学公式   | KaTeX                   | 比 MathJax 更快           |
| 图表可视化 | Chart.js / D3.js        | 交互式数据可视化          |
| 索引生成   | Python 脚本 (build.py)  | 扫描 HTML 生成 posts.json |
| 部署       | GitHub Pages            | 免费、简单                |

---

## 文件结构

```
website/
├── index.html          # 首页
├── post.html           # 文章阅读页（已弃用，现在直接用 HTML）
├── cv.html             # CV 页面（可选）
│
├── design-proposals.html  # 设计预览（开发用）
│
├── config.yaml         # 个人信息配置
├── config.json         # build.py 生成
│
├── posts/              # ✅ HTML 博客文章（唯一发布源）
│   ├── *.html          # 会被索引并发布
│   ├── images/         # 文章图片资源
│   └── data/           # 文章数据文件
│
├── drafts/             # ❌ Markdown 草稿（不会被发布）
│   └── *.md            # 仅作为参考/模板
│
├── posts.json          # 自动生成的文章索引
│
├── css/style.css       # 主样式
├── js/
│   ├── main.js         # 首页逻辑
│   ├── post.js         # Markdown 渲染（已弃用）
│   └── diagrams.js     # D3 图表工具
│
├── photos/             # 头像
│
├── build.py            # 索引生成脚本（仅扫描 HTML）
└── README.md
```

---

## 个人信息配置 (config.yaml)

支持多语言，`build.py` 转换为 `config.json` 供前端使用。

```yaml
site:
  default_lang: "original"
  languages: ["original", "en", "zh", "ja"]

profile:
  name:
    original: "Kevin (子阳) Xie"
    en: "Kevin (Ziyang) Xie"
    zh: "谢子阳"
  photo: "photos/Kevin Xie.jpeg"
  tagline:
    original: "MEng Student @ UCL | AI & Robotics"
  bio:
    original: |
      I'm interested in building intelligent systems...

links:
  email: "your@email.com"
  github: "https://github.com/username"
  linkedin: "https://linkedin.com/in/username"

education:
  - institution: { en: "University College London" }
    degree: { en: "MEng Robotics and AI" }
    year: "2023 - 2027"

research_interests:
  - original: "Self-Supervised Learning"
  - original: "Continual Learning"
```

---

## 文章格式

### HTML-Only Workflow ⭐

**所有博客文章都应该是 HTML 文件**，放在 `posts/` 目录下。

工作流程：
1. **草稿阶段**: 在 `drafts/` 目录写 Markdown 文件（`.md`）
2. **发布阶段**: 将 Markdown 转换为 HTML，放到 `posts/` 目录
3. **构建索引**: 运行 `python build.py`，只扫描 `posts/*.html`
4. **提交发布**: Git commit & push

关键点：
- ✅ `posts/*.html` 是唯一发布源，会被索引
- ❌ `drafts/*.md` 仅作为参考/模板，不会被索引或发布
- ✅ 网站内容与 HTML 源文件完全一致

### HTML 文章结构

每个 HTML 文章必须包含以下元数据结构：

```html
<header class="post-page-header">
  <h1 class="post-page-title">Your Post Title</h1>
  <div class="post-page-meta">January 13, 2026</div>
  <div class="post-page-tags">
    <span class="post-tag">tag1</span>
    <span class="post-tag">tag2</span>
  </div>
</header>

<div class="post-content">
  <blockquote>
    A brief summary of the post (optional)
  </blockquote>

  <!-- Your content here -->
</div>
```

`build.py` 会自动提取：
- **Title**: `<h1 class="post-page-title">` 的内容
- **Date**: `<div class="post-page-meta">` 的内容（支持格式：`January 13, 2026` 或 `2026-01-13`）
- **Tags**: 所有 `<span class="post-tag">` 的内容
- **Summary**: 第一个 `<blockquote>` 的内容（可选）

### 多语言支持（HTML 内嵌切换）

适用于包含图表、D3 可视化等复杂交互的 HTML 文章。语言切换在单个文件内完成。

**1. Navigator 添加语言按钮**

```html
<div class="nav-section">
  <div class="nav-lang" id="lang-switcher">
    <button class="lang-btn" data-lang="mixed">X</button>
    <button class="lang-btn active" data-lang="en">EN</button>
  </div>
</div>
```

**2. Body 设置默认语言**

```html
<body class="lang-en">
```

**3. CSS 控制显示/隐藏**

```css
/* 只隐藏 .post-content 内的多语言元素，不影响按钮 */
.post-content [data-lang] { display: none !important; }

/* English mode */
body.lang-en .post-content [data-lang="en"] { display: block !important; }
body.lang-en .post-content p[data-lang="en"] { display: block !important; }
body.lang-en .post-content li[data-lang="en"] { display: list-item !important; }
body.lang-en .post-content span[data-lang="en"] { display: inline !important; }

/* Mixed mode (中英混合) */
body.lang-mixed .post-content [data-lang="mixed"] { display: block !important; }
body.lang-mixed .post-content p[data-lang="mixed"] { display: block !important; }
body.lang-mixed .post-content li[data-lang="mixed"] { display: list-item !important; }
body.lang-mixed .post-content span[data-lang="mixed"] { display: inline !important; }
```

**4. 内容标记语言版本**

```html
<p data-lang="en">English content here.</p>
<p data-lang="mixed">中英混合 content here。</p>

<li data-lang="en">English list item</li>
<li data-lang="mixed">中英混合 list item</li>
```

**5. JavaScript 切换逻辑**

```javascript
const langSwitcher = document.getElementById('lang-switcher');
langSwitcher?.addEventListener('click', (e) => {
  if (e.target.classList.contains('lang-btn')) {
    const lang = e.target.dataset.lang;
    document.body.className = 'lang-' + lang;
    langSwitcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    localStorage.setItem('post-lang', lang);
  }
});

// Restore saved language
const savedLang = localStorage.getItem('post-lang');
if (savedLang) {
  document.body.className = 'lang-' + savedLang;
  langSwitcher?.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === savedLang);
  });
}
```

**注意**：CSS 选择器必须限制在 `.post-content` 内，否则会隐藏导航栏的语言按钮。

---

## 工作流程

### Git 仓库

本网站有两个 remote，实现开发与发布分离：

```bash
origin:  git@github.com:K-XZY/kevinxie-website.git   # 私有开发仓库
publish: git@github.com:K-XZY/K-XZY.github.io.git    # 公开发布仓库 → https://k-xzy.github.io
```

### 发布流程

```bash
# 1. 生成文章索引
python build.py

# 2. 本地预览
python -m http.server 8000

# 3. 提交更改
git add . && git commit -m "Your message"

# 4. 推送到开发仓库（私有，不影响线上）
git push origin main

# 5. 准备好后，发布到线上
git push publish main
```

**注意**：不要 push 到父目录的 research-notes repo

---

## 开发计划

### Phase 1: MVP ⬅️ 当前

- [x] 设计理念确定
- [ ] 实现 JadeRegent 配色 CSS
- [ ] 文章列表、Tag 过滤、搜索
- [ ] Markdown 渲染 + KaTeX
- [x] 部署到 GitHub Pages

### Phase 2: 内容迁移

- [ ] 迁移 Learning 笔记
- [ ] 完善自我介绍

### Phase 3: 完善

- [ ] CV 页面
- [ ] 响应式设计
- [ ] SEO 优化

---

## 注意事项

1. **保持简单**：纯静态，不需要框架
2. **内容为王**：设计服务于内容展示
3. **可维护性**：代码结构清晰
4. **克制**：每个元素都有其存在的意义


## Build Script

`build.py` 现在只扫描 HTML 文件：

```bash
python build.py
```

功能：
1. 扫描 `posts/*.html` 文件
2. 提取 HTML 中的元数据（title, date, tags, summary）
3. 生成 `posts.json` 索引供前端使用
4. 转换 `config.yaml` → `config.json`

**注意**：
- ✅ 只有 `.html` 文件会被索引
- ✅ `.md` 文件会被忽略（可用作个人草稿）
- ✅ 网站内容完全来自 HTML 文件


---

## SEO Optimization

### Implemented
- [x] Google Site Verification meta tag
- [x] Meta descriptions for all pages
- [x] Optimized page titles with branding
- [x] Open Graph and Twitter Card tags
- [x] Sitemap.xml
- [x] robots.txt

### Quick Wins (To Implement)
2. **Structured data**: Implement Schema.org JSON-LD for Article and Person types to enable rich snippets.

### Content SEO
- Add alt text to all images for accessibility and image search
- Implement internal linking between related posts
- Consider adding canonical URLs to prevent duplicate content issues

### Monitoring
- Frequently update and check with Google Search Console
- Monitor indexing status and search performance
- Track click-through rates and adjust meta descriptions accordingly