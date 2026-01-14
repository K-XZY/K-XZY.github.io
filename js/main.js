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
    if (config.links.email) {
      links.push(`<a href="#" class="email-link" data-email="${config.links.email}">Email</a>`);
    }
    if (config.links.google_scholar) links.push(`<a href="${config.links.google_scholar}" target="_blank">Scholar</a>`);
    linksEl.innerHTML = links.join(' · ');

    // Setup email click-to-copy
    setupEmailCopy();
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

  // Completely replace static HTML with dynamic version
  container.innerHTML = filtered.map(post => {
    const version = getPostVersion(post);
    // Use direct HTML link from version.file (HTML-only workflow)
    const href = version.file || `posts/${post.slug}.html`;

    return `
      <a href="${href}" class="post">
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

// Setup search with tag autocomplete
function setupSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  let timer;
  let selectedTags = [];
  let tagSuggestionIndex = -1;
  let filteredTags = [];

  // Create dropdown element
  const dropdown = document.createElement('div');
  dropdown.className = 'tag-dropdown';
  dropdown.style.display = 'none';
  input.parentElement.style.position = 'relative';
  input.parentElement.appendChild(dropdown);

  // Alternating placeholder animation with typing effect
  let placeholderIndex = 0;
  const placeholders = ['Search posts...', 'Press # for tags'];
  const placeholdersWithTags = ['Search posts...', 'Press # for more tags...'];
  let typingInterval;
  let currentChar = 0;

  function typewriterEffect(text) {
    currentChar = 0;
    clearInterval(typingInterval);

    typingInterval = setInterval(() => {
      if (currentChar <= text.length) {
        input.placeholder = text.substring(0, currentChar);
        currentChar++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50); // 50ms per character
  }

  function updatePlaceholder() {
    // Don't update when user is typing
    if (document.activeElement === input && input.value.length > 0) return;

    const messages = selectedTags.length > 0 ? placeholdersWithTags : placeholders;
    const text = messages[placeholderIndex % messages.length];
    typewriterEffect(text);
  }

  // Alternate placeholder every 4 seconds
  setInterval(() => {
    placeholderIndex++;
    updatePlaceholder();
  }, 4000);

  // Parse search query for tags
  function parseSearchQuery(value) {
    const parts = value.split(/\s+/);
    const tags = [];
    const textParts = [];

    parts.forEach(part => {
      if (part.startsWith('#') && part.length > 1) {
        tags.push(part.substring(1));
      } else if (part !== '') {
        textParts.push(part);
      }
    });

    return { tags, text: textParts.join(' ') };
  }

  // Show tag suggestions
  function showTagSuggestions(prefix) {
    const search = prefix.toLowerCase();
    filteredTags = allTags.filter(tag =>
      tag.toLowerCase().includes(search) && !selectedTags.includes(tag)
    );

    if (filteredTags.length === 0) {
      dropdown.style.display = 'none';
      return;
    }

    dropdown.innerHTML = filteredTags.map((tag, index) =>
      `<div class="tag-suggestion ${index === tagSuggestionIndex ? 'selected' : ''}" data-tag="${tag}">
        #${tag}
      </div>`
    ).join('');

    dropdown.style.display = 'block';
    tagSuggestionIndex = -1;
  }

  // Hide dropdown
  function hideDropdown() {
    dropdown.style.display = 'none';
    tagSuggestionIndex = -1;
  }

  // Insert tag into input
  function insertTag(tag) {
    const value = input.value;
    const lastHashIndex = value.lastIndexOf('#');

    if (lastHashIndex !== -1) {
      // Replace partial tag with complete tag
      const before = value.substring(0, lastHashIndex);
      input.value = (before + '#' + tag + ' ').trim() + ' ';
    } else {
      input.value = (value + '#' + tag + ' ').trim() + ' ';
    }

    selectedTags.push(tag);
    hideDropdown();
    updatePlaceholder();
    performSearch();
  }

  // Perform search with tags
  function performSearch() {
    const value = input.value;
    const { tags, text } = parseSearchQuery(value);

    selectedTags = tags;
    searchQuery = text;

    // Filter posts by selected tags and search text
    renderFilteredPosts();
  }

  // Render posts with tag filtering
  function renderFilteredPosts() {
    const container = document.getElementById('posts-list');
    if (!container) return;

    let filtered = postsData;

    // Filter by active tag (from tag buttons)
    if (activeTag) {
      filtered = filtered.filter(post => post.tags?.includes(activeTag));
    }

    // Filter by selected tags from search
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        selectedTags.every(tag => post.tags?.includes(tag))
      );
    }

    // Filter by search text
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
      const href = version.file || `posts/${post.slug}.html`;

      return `
        <a href="${href}" class="post">
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

  // Input event handler
  input.addEventListener('input', (e) => {
    clearTimeout(timer);
    const value = e.target.value;
    const lastChar = value[value.length - 1];
    const lastHashIndex = value.lastIndexOf('#');

    // Check if typing after #
    if (lastHashIndex !== -1 && lastHashIndex === value.length - 1) {
      // Just typed #, show all tags
      showTagSuggestions('');
    } else if (lastHashIndex !== -1 && lastHashIndex < value.length - 1) {
      // Typing after #, filter suggestions
      const afterHash = value.substring(lastHashIndex + 1);
      if (!/\s/.test(afterHash)) {
        showTagSuggestions(afterHash);
      } else {
        hideDropdown();
      }
    } else {
      hideDropdown();
    }

    timer = setTimeout(() => {
      performSearch();
    }, 200);
  });

  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    if (dropdown.style.display === 'none') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      tagSuggestionIndex = Math.min(tagSuggestionIndex + 1, filteredTags.length - 1);
      updateDropdownSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      tagSuggestionIndex = Math.max(tagSuggestionIndex - 1, -1);
      updateDropdownSelection();
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (tagSuggestionIndex >= 0) {
        e.preventDefault();
        insertTag(filteredTags[tagSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  // Update dropdown selection visual
  function updateDropdownSelection() {
    const suggestions = dropdown.querySelectorAll('.tag-suggestion');
    suggestions.forEach((el, index) => {
      el.classList.toggle('selected', index === tagSuggestionIndex);
    });

    // Scroll selected into view
    if (tagSuggestionIndex >= 0) {
      suggestions[tagSuggestionIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }

  // Click on suggestion
  dropdown.addEventListener('click', (e) => {
    const suggestion = e.target.closest('.tag-suggestion');
    if (suggestion) {
      const tag = suggestion.dataset.tag;
      insertTag(tag);
      input.focus();
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  updatePlaceholder();
}

// Setup language switcher
function setupLanguageSwitcher() {
  const switcher = document.getElementById('lang-switcher');
  if (!switcher) return;

  // Inject tooltips into language buttons if not already present
  const langLabels = {
    'original': 'Original',
    'en': 'English',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'mixed': 'Mixed'
  };

  switcher.querySelectorAll('.lang-btn').forEach(btn => {
    const lang = btn.dataset.lang;
    if (lang && langLabels[lang] && !btn.querySelector('.lang-tooltip')) {
      const tooltip = document.createElement('span');
      tooltip.className = 'lang-tooltip';
      tooltip.textContent = langLabels[lang];
      btn.appendChild(tooltip);
    }
  });

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

// Setup email click-to-copy
function setupEmailCopy() {
  const emailLinks = document.querySelectorAll('.email-link');

  emailLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      // Decode email from obfuscated format
      const obfuscated = link.dataset.email;
      const email = obfuscated
        .replace(/\(dot\)/g, '.')
        .replace(/\(at\)/g, '@');

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(email);

        // Show animation
        const originalText = link.textContent;
        link.textContent = 'Copied!';
        link.style.color = 'var(--accent)';

        // Reset after animation
        setTimeout(() => {
          link.textContent = originalText;
          link.style.color = '';
        }, 1500);
      } catch (err) {
        console.error('Failed to copy email:', err);
        // Fallback: show the email
        alert(`Email: ${email}`);
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
