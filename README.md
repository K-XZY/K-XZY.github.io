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

| 技术          | 选择                         | 理由                    |
| ------------- | ---------------------------- | ----------------------- |
| 前端          | HTML + CSS + JavaScript      | 纯静态，简单可控        |
| 内容格式      | Markdown + YAML front matter | 易于编写和维护          |
| 数学公式      | KaTeX                        | 比 MathJax 更快         |
| Markdown 渲染 | marked.js (浏览器端)         | 无需构建步骤            |
| 索引生成      | Python 脚本                  | 扫描文章生成 posts.json |
| 部署          | GitHub Pages                 | 免费、简单              |

---

## 文件结构

```
website/
├── index.html          # 首页
├── post.html           # 文章阅读页
├── cv.html             # CV 页面（可选）
│
├── design-proposals.html  # 设计预览（开发用）
│
├── config.yaml         # 个人信息配置
├── config.json         # build.py 生成
│
├── posts/              # Markdown 博客文章
│   └── *.md
├── posts.json          # 自动生成的文章索引
│
├── css/style.css       # 主样式
├── js/main.js          # 首页逻辑
├── js/post.js          # 文章页逻辑
│
├── photos/             # 头像
├── assets/images/      # 文章图片
│
├── build.py            # 索引生成脚本
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

### 多语言支持

有两种方式实现多语言：

#### 方式一：多文件（Markdown 文章）

适用于简单的 Markdown 文章，通过 `post.js` 渲染。

| 文件名         | 语言   |
| -------------- | ------ |
| `{slug}.md`    | 原版   |
| `{slug}.en.md` | 英文版 |
| `{slug}.zh.md` | 中文版 |

#### 方式二：内嵌切换（HTML 文章）

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

### Front Matter

```yaml
---
title: How to Read a Paper
date: 2025-01-05
tags: [research, methodology]
summary: A personal guide on reading academic papers.
---
```

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


## !!! Issue
存在两个定义tag的方式
HTML和MD同时会定义build里面的tag,导致我可以在我的HtML里面有一个组tag。然后我最后的build出来的实际展现出来的tag又是来自于MD的。
