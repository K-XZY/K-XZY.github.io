// Main JavaScript for Portfolio Website

let postsData = [];
let allTags = [];
let config = {};
let currentLang = 'original';
let activeTag = null;
let searchQuery = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadConfig(), loadPosts()]);
  initLanguage();
  renderAbout();
  renderTags();
  renderPosts();
  setupSearch();
  setupLanguageSwitcher();
  setupMobileMenu();
  setupNavigatorParallax();
  setupSmoothScroll();
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

// Load posts
async function loadPosts() {
  try {
    const response = await fetch('posts.json');
    const data = await response.json();
    postsData = data.posts || [];
    allTags = data.tags || [];
  } catch (error) {
    console.error('Failed to load posts:', error);
    postsData = [];
    allTags = [];
  }
}

// Initialize language
function initLanguage() {
  const saved = localStorage.getItem('lang');
  const defaultLang = config.site?.default_lang || 'original';
  currentLang = saved || defaultLang;
}

// Get localized text with fallback
function t(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj['original'] || obj['en'] || Object.values(obj)[0] || '';
}

// Render about section
function renderAbout() {
  // Avatar
  const avatarEl = document.getElementById('avatar');
  if (avatarEl && config.profile) {
    if (config.profile.photo) {
      avatarEl.innerHTML = `<img src="${config.profile.photo}" alt="${t(config.profile.name)}">`;
    } else {
      const name = t(config.profile.name);
      avatarEl.textContent = name.charAt(0).toUpperCase();
    }
  }

  // Name
  const nameEl = document.getElementById('profile-name');
  if (nameEl && config.profile?.name) {
    nameEl.textContent = t(config.profile.name);
  }

  // Tagline
  const taglineEl = document.getElementById('profile-tagline');
  if (taglineEl && config.profile?.tagline) {
    taglineEl.textContent = t(config.profile.tagline);
  }

  // Bio
  const bioEl = document.getElementById('profile-bio');
  if (bioEl && config.profile?.bio) {
    const bio = t(config.profile.bio);
    if (bio) bioEl.textContent = bio;
  }

  // Links
  const linksEl = document.getElementById('social-links');
  if (linksEl && config.links) {
    const links = [];
    if (config.links.github) links.push(`<a href="${config.links.github}" target="_blank">GitHub</a>`);
    if (config.links.linkedin) links.push(`<a href="${config.links.linkedin}" target="_blank">LinkedIn</a>`);
    if (config.links.email) links.push(`<a href="mailto:${config.links.email}">Email</a>`);
    if (config.links.google_scholar) links.push(`<a href="${config.links.google_scholar}" target="_blank">Scholar</a>`);
    linksEl.innerHTML = links.join(' · ');
  }

  // Update document title
  if (config.site?.title) {
    document.title = t(config.site.title);
  }
}

// Render tags
function renderTags() {
  const container = document.getElementById('tags-container');
  if (!container) return;

  if (allTags.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = `<span class="tag ${activeTag === null ? 'active' : ''}" data-tag="">all</span>`;
  allTags.forEach(tag => {
    html += `<span class="tag ${activeTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</span>`;
  });

  container.innerHTML = html;

  container.querySelectorAll('.tag').forEach(tagEl => {
    tagEl.addEventListener('click', () => {
      activeTag = tagEl.dataset.tag === '' ? null : tagEl.dataset.tag;
      renderTags();
      renderPosts();
    });
  });
}

// Get best version for current language
function getPostVersion(post) {
  return post.versions?.[currentLang] || post.versions?.['original'] || post.versions?.['en'] || Object.values(post.versions || {})[0] || { title: post.title || '', summary: post.summary || '' };
}

// Render posts
function renderPosts() {
  const container = document.getElementById('posts-list');
  if (!container) return;

  let filtered = postsData;

  if (activeTag) {
    filtered = filtered.filter(post => post.tags?.includes(activeTag));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(post => {
      const version = getPostVersion(post);
      return version.title?.toLowerCase().includes(query) ||
             version.summary?.toLowerCase().includes(query) ||
             post.tags?.some(t => t.toLowerCase().includes(query));
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No posts found.</div>';
    return;
  }

  container.innerHTML = filtered.map(post => {
    const version = getPostVersion(post);

    return `
      <a href="post.html?slug=${post.slug}&lang=${currentLang}" class="post">
        <div class="post-title">${escapeHtml(version.title)}</div>
        <div class="post-meta">${formatDate(post.date)}</div>
        ${version.summary ? `<p class="post-summary">${escapeHtml(version.summary)}</p>` : ''}
        <div class="post-tags">
          ${(post.tags || []).map(tag => `<span class="post-tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      </a>
    `;
  }).join('');
}

// Setup search
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  let timer;
  input.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderPosts();
    }, 200);
  });
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
  renderAbout();
  renderPosts();
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

  // Close menu when clicking a nav link on mobile
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

  const baseRotateY = 8; // Base tilt toward content

  // Only apply parallax on larger screens
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

  // Handle resize
  mediaQuery.addEventListener('change', (e) => {
    if (!e.matches) {
      nav.style.transform = '';
    } else {
      resetTransform();
    }
  });
}

// Setup smooth scrolling for navigation links
function setupSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link[data-section]');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      const section = document.getElementById(sectionId);

      if (section) {
        // For 'about' section, scroll to very top; otherwise use offset
        if (sectionId === 'about') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const offset = 40; // offset for other sections
          const top = section.offsetTop - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }

        // Update active state
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  // Update active nav link on scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === current) {
        link.classList.add('active');
      }
    });
  });
}

// Utilities
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
