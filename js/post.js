// Post page JavaScript - Markdown rendering with KaTeX support

let currentLang = 'original';
let config = {};
let currentPost = null;
let currentSlug = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  initLanguage();
  setupLanguageSwitcher();
  setupMobileMenu();
  setupNavigatorParallax();

  currentSlug = getParam('slug');
  if (!currentSlug) {
    showError('No post specified.');
    return;
  }
  await loadAndRenderPost(currentSlug);
});

// Load config
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    config = await response.json();
  } catch (error) {
    console.error('Failed to load config:', error);
    config = {};
  }
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function initLanguage() {
  const urlLang = getParam('lang');
  const saved = localStorage.getItem('lang');
  currentLang = urlLang || saved || 'original';
}

// Get localized text with fallback
function t(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj['original'] || obj['en'] || Object.values(obj)[0] || '';
}

// Setup language switcher
function setupLanguageSwitcher() {
  const switcher = document.getElementById('lang-switcher');
  if (!switcher) return;

  switcher.addEventListener('click', (e) => {
    if (e.target.classList.contains('lang-btn')) {
      setLanguage(e.target.dataset.lang);
    }
  });
  updateLangButtons();
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  updateLangButtons();

  // Reload post with new language
  if (currentSlug && currentPost) {
    const version = getPostVersion(currentPost);
    if (version) {
      // Update URL without reload
      const url = new URL(window.location);
      url.searchParams.set('lang', lang);
      window.history.replaceState({}, '', url);

      // Reload content
      loadAndRenderPost(currentSlug);
    }
  }
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

// Setup mobile menu
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const navigator = document.getElementById('navigator');
  const overlay = document.getElementById('nav-overlay');

  if (!toggle || !navigator || !overlay) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navigator.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = navigator.classList.contains('active') ? 'hidden' : '';
  });

  overlay.addEventListener('click', () => {
    toggle.classList.remove('active');
    navigator.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  });

  navigator.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1000) {
        toggle.classList.remove('active');
        navigator.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

// Setup 3D parallax effect for navigator
function setupNavigatorParallax() {
  const nav = document.getElementById('navigator');
  if (!nav) return;

  const baseRotateY = 8;
  const mediaQuery = window.matchMedia('(min-width: 1001px)');

  function handleMouseMove(e) {
    if (!mediaQuery.matches) return;

    const rect = nav.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (e.clientX - cx) / window.innerWidth;
    const dy = (e.clientY - cy) / window.innerHeight;

    const rx = dy * -2;
    const ry = baseRotateY + dx * 3;

    nav.style.transform = `translateY(-50%) perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.25)`;
  }

  function resetTransform() {
    if (mediaQuery.matches) {
      nav.style.transform = `translateY(-50%) perspective(800px) rotateY(${baseRotateY}deg) scale(1.25)`;
    }
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseleave', resetTransform);

  mediaQuery.addEventListener('change', (e) => {
    if (!e.matches) {
      nav.style.transform = '';
    } else {
      resetTransform();
    }
  });
}

// Get best version for current language
function getPostVersion(post) {
  return post.versions?.[currentLang] || post.versions?.['original'] || post.versions?.['en'] || Object.values(post.versions || {})[0];
}

async function loadAndRenderPost(slug) {
  try {
    const response = await fetch('posts.json');
    const data = await response.json();
    const post = data.posts.find(p => p.slug === slug);

    if (!post) {
      showError('Post not found.');
      return;
    }

    currentPost = post;
    const version = getPostVersion(post);
    if (!version) {
      showError('No version available.');
      return;
    }

    // Load markdown
    const mdResponse = await fetch(version.file);
    if (!mdResponse.ok) {
      showError('Failed to load post content.');
      return;
    }

    const markdown = await mdResponse.text();
    const { content } = parseFrontMatter(markdown);

    // Update page
    document.title = version.title + ' | ' + t(config.site?.title || 'Portfolio');
    document.getElementById('post-title').textContent = version.title;
    document.getElementById('post-meta').textContent = formatDate(post.date);

    // Render tags
    const tagsContainer = document.getElementById('post-tags');
    if (post.tags?.length > 0) {
      tagsContainer.innerHTML = post.tags.map(tag => `<span class="post-tag">${escapeHtml(tag)}</span>`).join('');
    }

    // Render language switcher for available versions
    const langSwitcher = document.getElementById('post-lang-switcher');
    if (langSwitcher && post.versions) {
      const langs = Object.keys(post.versions);
      if (langs.length > 1) {
        langSwitcher.innerHTML = langs.map(lang => {
          const label = lang === 'original' ? '原' : lang.toUpperCase();
          const isActive = lang === currentLang || (currentLang === 'original' && lang === 'original');
          return `<a href="?slug=${slug}&lang=${lang}" class="lang-link ${isActive ? 'active' : ''}">${label}</a>`;
        }).join('');
      }
    }

    // Render content
    document.getElementById('post-content').innerHTML = renderMarkdown(content);
    renderMath();

  } catch (error) {
    console.error('Error loading post:', error);
    showError('Failed to load post.');
  }
}

function parseFrontMatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  return match ? { frontMatter: match[1], content: markdown.slice(match[0].length) } : { frontMatter: '', content: markdown };
}

function renderMarkdown(markdown) {
  marked.setOptions({ breaks: true, gfm: true });
  return marked.parse(markdown);
}

function renderMath() {
  const content = document.getElementById('post-content');

  // Display math: $$ ... $$
  content.innerHTML = content.innerHTML.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch (e) { return match; }
  });

  // Inline math: $ ... $
  content.innerHTML = content.innerHTML.replace(/(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)/g, (match, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch (e) { return match; }
  });
}

function showError(message) {
  document.getElementById('post-title').textContent = 'Error';
  document.getElementById('post-content').innerHTML = `<p class="empty-state">${message}</p>`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
