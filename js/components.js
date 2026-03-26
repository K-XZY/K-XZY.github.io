// Shared components — nav, footer, mobile menu
// Injected on every page to avoid HTML duplication

(function () {
  // Detect if we're in a subdirectory (e.g., posts/)
  const path = window.location.pathname;
  const inSubdir = path.includes('/posts/');
  const prefix = inSubdir ? '../' : '';

  // Determine which page is active
  const isBlog = path.includes('/blog.html') || path.includes('/posts/');
  const isHome = !inSubdir && !isBlog;

  // --- Nav Sidebar ---
  function createNav(options = {}) {
    // Language switcher only appears on post pages that declare page-languages
    const langMeta = document.querySelector('meta[name="page-languages"]');
    const hasLangSwitcher = !!langMeta;

    let langSection = '';
    if (hasLangSwitcher) {
      const langConfig = JSON.parse(langMeta.content);
      const savedLang = localStorage.getItem('post-lang') || langConfig[0].key;
      const langButtons = langConfig
        .map(
          (l) =>
            `<button class="lang-btn${l.key === savedLang ? ' active' : ''}" data-lang="${l.key}">${l.label}</button>`
        )
        .join('\n          ');
      langSection = `
      <div class="nav-section">
        <div class="nav-lang" id="lang-switcher">
          ${langButtons}
        </div>
      </div>`;
    }

    const isProjects = isHome; // Projects link points to homepage projects section

    return `
    <nav class="navigator" id="navigator">
      <div class="nav-section">
        <div class="nav-links">
          <a href="${prefix}index.html" class="nav-link${isHome ? ' active' : ''}" ${isHome ? 'data-section="about"' : ''}>
            <span class="nav-icon">⌂</span>
            <span>Home</span>
          </a>
          <a href="${prefix}index.html#projects" class="nav-link${isProjects ? '' : ''}">
            <span class="nav-icon">✎</span>
            <span>Projects</span>
          </a>
        </div>
      </div>
      ${langSection}
      <div class="nav-section">
        <div class="nav-history">
          <button class="history-btn" id="prev-post" title="Previous post">←</button>
          <button class="history-btn" id="next-post" title="Next post">→</button>
        </div>
      </div>
    </nav>

    <button class="menu-toggle" id="menu-toggle" aria-label="Toggle menu">
      <span class="menu-icon"></span>
    </button>

    <div class="nav-overlay" id="nav-overlay"></div>`;
  }

  // --- Footer ---
  function createFooter() {
    const year = new Date().getFullYear();
    return `<footer class="footer">&copy; ${year}</footer>`;
  }

  // --- Inject into page ---
  document.addEventListener('DOMContentLoaded', () => {
    // Inject nav before <main> (or into #nav-root if present)
    const navRoot = document.getElementById('nav-root');
    if (navRoot) {
      navRoot.outerHTML = createNav();
    }

    // Inject footer (or into #footer-root if present)
    const footerRoot = document.getElementById('footer-root');
    if (footerRoot) {
      footerRoot.outerHTML = createFooter();
    }

    // --- Setup mobile menu ---
    const toggle = document.getElementById('menu-toggle');
    const navigator = document.getElementById('navigator');
    const overlay = document.getElementById('nav-overlay');

    if (toggle && navigator && overlay) {
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

      navigator.querySelectorAll('.nav-link').forEach((link) => {
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

    // --- Setup language button tooltips (post pages with language switcher) ---
    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
      const langLabels = {
        original: 'Original',
        en: 'English',
        zh: '中文',
        ja: '日本語',
        ko: '한국어',
        mixed: 'Mixed',
      };
      switcher.querySelectorAll('.lang-btn').forEach((btn) => {
        const lang = btn.dataset.lang;
        if (lang && langLabels[lang] && !btn.querySelector('.lang-tooltip')) {
          const tooltip = document.createElement('span');
          tooltip.className = 'lang-tooltip';
          tooltip.textContent = langLabels[lang];
          btn.appendChild(tooltip);
        }
      });
    }

    // --- Setup 3D parallax for navigator ---
    if (navigator) {
      const baseRotateY = 8;
      const mediaQuery = window.matchMedia('(min-width: 1001px)');

      function handleMouseMove(e) {
        if (!mediaQuery.matches) return;
        const rect = navigator.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / window.innerWidth;
        const dy = (e.clientY - cy) / window.innerHeight;
        const rx = dy * -2;
        const ry = baseRotateY + dx * 3;
        navigator.style.transform = `translateY(-50%) perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.25)`;
      }

      function resetTransform() {
        if (mediaQuery.matches) {
          navigator.style.transform = `translateY(-50%) perspective(800px) rotateY(${baseRotateY}deg) scale(1.25)`;
        }
      }

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseleave', resetTransform);

      mediaQuery.addEventListener('change', (e) => {
        if (!e.matches) navigator.style.transform = '';
        else resetTransform();
      });
    }

    // --- Post-page language switching (body class-based) ---
    if (inSubdir && switcher) {
      const savedLang = localStorage.getItem('post-lang');
      if (savedLang) {
        document.body.className = 'lang-' + savedLang;
        switcher.querySelectorAll('.lang-btn').forEach((btn) => {
          btn.classList.toggle('active', btn.dataset.lang === savedLang);
        });
      }

      switcher.addEventListener('click', (e) => {
        if (e.target.classList.contains('lang-btn')) {
          const lang = e.target.dataset.lang;
          document.body.className = 'lang-' + lang;
          switcher.querySelectorAll('.lang-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
          });
          localStorage.setItem('post-lang', lang);
        }
      });
    }

    // --- Reference tooltips (post pages) ---
    document.querySelectorAll('.ref').forEach((ref) => {
      const tooltip = ref.querySelector('.tooltip');
      if (!tooltip) return;
      ref.addEventListener('mouseenter', () => {
        const rect = ref.getBoundingClientRect();
        tooltip.style.left = rect.left + rect.width / 2 + 'px';
        tooltip.style.top = rect.top - 8 + 'px';
        tooltip.style.transform = 'translate(-50%, -100%)';
      });
    });
  });
})();
