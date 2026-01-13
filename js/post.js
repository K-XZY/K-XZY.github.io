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
    let html = renderMarkdown(content);
    html = processChartPlaceholders(html);
    document.getElementById('post-content').innerHTML = html;
    renderMath();
    renderCharts();

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

// Chart rendering from CSV data - multi-chart groups
async function renderCharts() {
  const content = document.getElementById('post-content');
  const chartGroups = content.querySelectorAll('.chart-group');
  console.log('Found chart groups:', chartGroups.length);

  for (const group of chartGroups) {
    const chartsData = JSON.parse(group.dataset.charts || '[]');
    if (chartsData.length === 0) continue;

    try {
      // Get group title from data attribute
      const groupTitle = group.dataset.title || 'Charts';

      // Create main container with border
      const container = document.createElement('div');
      container.className = 'charts-container';
      container.style.cssText = 'position:relative;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:1rem;padding-top:0;background:rgba(0,0,0,0.2);margin:1.5rem 0;';

      // Create header with title and toggle
      const header = document.createElement('div');
      header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:1rem;';

      // Group title
      const title = document.createElement('span');
      title.textContent = groupTitle;
      title.style.cssText = 'font-size:14px;font-weight:500;color:#ccc;font-family:monospace;';

      // Toggle switch
      const toggle = document.createElement('div');
      toggle.className = 'chart-scale-toggle';
      toggle.style.cssText = 'display:flex;gap:2px;background:#0b0d0b;border:1px solid rgba(255,255,255,0.1);border-radius:3px;padding:3px;';

      const logBtn = document.createElement('span');
      logBtn.className = 'toggle-option active';
      logBtn.dataset.scale = 'log';
      logBtn.textContent = 'Log';
      logBtn.style.cssText = 'padding:4px 10px;font-size:11px;font-family:monospace;color:#f5f5f5;cursor:pointer;background:rgba(255,255,255,0.1);border:none;border-radius:2px;';

      const linearBtn = document.createElement('span');
      linearBtn.className = 'toggle-option';
      linearBtn.dataset.scale = 'linear';
      linearBtn.textContent = 'Linear';
      linearBtn.style.cssText = 'padding:4px 10px;font-size:11px;font-family:monospace;color:#666;cursor:pointer;background:transparent;border:none;border-radius:2px;';

      toggle.appendChild(logBtn);
      toggle.appendChild(linearBtn);
      header.appendChild(title);
      header.appendChild(toggle);
      container.appendChild(header);

      // Create grid for charts
      const grid = document.createElement('div');
      grid.className = 'charts-grid';
      container.appendChild(grid);

      let isLog = true;
      const charts = [];

      // Load and create each chart
      for (const chartInfo of chartsData) {
        const response = await fetch(chartInfo.src);
        const csvText = await response.text();
        const { labels, values } = parseCSV(csvText);

        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper';

        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);
        grid.appendChild(chartWrapper);

        const chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels: labels.map(Number),
            datasets: [{
              label: chartInfo.title,
              data: values,
              borderColor: chartInfo.color,
              backgroundColor: chartInfo.color + '20',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: true, position: 'top' }
            },
            scales: {
              x: {
                type: 'logarithmic',
                title: { display: true, text: 'Step' },
                ticks: { maxTicksLimit: 6 }
              },
              y: {
                type: 'logarithmic',
                title: { display: true, text: chartInfo.title }
              }
            }
          }
        });
        charts.push(chart);
      }

      group.appendChild(container);

      // Toggle handler - updates all charts
      toggle.addEventListener('click', (e) => {
        const option = e.target.closest('.toggle-option');
        if (!option) return;

        const scale = option.dataset.scale;
        if ((scale === 'log' && isLog) || (scale === 'linear' && !isLog)) return;

        isLog = !isLog;

        // Update button styles
        if (isLog) {
          logBtn.style.color = '#f5f5f5';
          logBtn.style.background = 'rgba(255,255,255,0.08)';
          linearBtn.style.color = '#444';
          linearBtn.style.background = 'transparent';
        } else {
          linearBtn.style.color = '#f5f5f5';
          linearBtn.style.background = 'rgba(255,255,255,0.08)';
          logBtn.style.color = '#444';
          logBtn.style.background = 'transparent';
        }

        charts.forEach(chart => {
          chart.options.scales.x.type = isLog ? 'logarithmic' : 'linear';
          chart.options.scales.y.type = isLog ? 'logarithmic' : 'linear';
          chart.update();
        });
      });

    } catch (e) {
      console.error('Chart group error:', e);
      group.innerHTML = `<p class="chart-error">Failed to load charts</p>`;
    }
  }
}

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const labels = [];
  const values = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(s => s.replace(/"/g, '').trim());
    if (cols.length >= 2) {
      labels.push(cols[0]);
      values.push(parseFloat(cols[1]));
    }
  }
  return { labels, values };
}

// Process chart placeholders in markdown
function processChartPlaceholders(html) {
  // Syntax: ```charts (first line: title="Group Title", then src="path" title="Title" color="#hex" per line) ```
  return html.replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/g, (match, inner) => {
    // Decode HTML entities first (marked.js escapes quotes)
    const decoded = inner.replace(/&quot;/g, '"').replace(/&amp;/g, '&');

    // Check if this looks like a chart block
    if (!decoded.includes('src="') || !decoded.includes('.csv"')) {
      return match; // Not a chart, return unchanged
    }

    // Parse multiple chart definitions (one per line)
    const lines = decoded.trim().split('\n');
    const charts = [];
    let groupTitle = 'Charts';

    for (const line of lines) {
      // Check for group title (line without src=)
      if (!line.includes('src="')) {
        const titleMatch = line.match(/title="([^"]+)"/);
        if (titleMatch) {
          groupTitle = titleMatch[1];
        }
        continue;
      }

      const srcMatch = line.match(/src="([^"]+)"/);
      const titleMatch = line.match(/title="([^"]+)"/);
      const colorMatch = line.match(/color="([^"]+)"/);

      if (srcMatch) {
        charts.push({
          src: srcMatch[1],
          title: titleMatch ? titleMatch[1] : 'Chart',
          color: colorMatch ? colorMatch[1] : '#4a9eff'
        });
      }
    }

    if (charts.length === 0) return match;

    // Return a single chart-group div with all chart data as JSON
    return `<div class="chart-group" data-title="${groupTitle}" data-charts='${JSON.stringify(charts)}'></div>`;
  });
}
