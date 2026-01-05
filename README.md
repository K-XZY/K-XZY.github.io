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

| 原则 | 体现 |
|------|------|
| **Thinking Outside the Box** | 头像突破卡片边界，体现科研人员的创新精神 |
| **三维纵深感** | 导航栏 3D 倾斜朝向内容，建立空间层次 |
| **方正** | 极小圆角 (3px)，接近直角但不尖锐，传达精确与力量 |
| **呼吸感** | 重复元素（文章列表）无边框，避免视觉沉重 |
| **交互反馈** | 悬浮时绿色下划线亮起，从墨绿渐变到荧光绿 |

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

| 技术 | 选择 | 理由 |
|------|------|------|
| 前端 | HTML + CSS + JavaScript | 纯静态，简单可控 |
| 内容格式 | Markdown + YAML front matter | 易于编写和维护 |
| 数学公式 | KaTeX | 比 MathJax 更快 |
| Markdown 渲染 | marked.js (浏览器端) | 无需构建步骤 |
| 索引生成 | Python 脚本 | 扫描文章生成 posts.json |
| 部署 | GitHub Pages | 免费、简单 |

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

| 文件名 | 语言 |
|--------|------|
| `{slug}.md` | 原版 |
| `{slug}.en.md` | 英文版 |
| `{slug}.zh.md` | 中文版 |

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

```bash
# 发布新文章
python build.py
git add . && git commit -m "Add new post" && git push

# 本地预览
python -m http.server 8000
```

---

## 开发计划

### Phase 1: MVP ⬅️ 当前

- [x] 设计理念确定
- [ ] 实现 JadeRegent 配色 CSS
- [ ] 文章列表、Tag 过滤、搜索
- [ ] Markdown 渲染 + KaTeX
- [ ] 部署到 GitHub Pages

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
