// Shared components — nav, footer, mobile menu
// Injected on every page to avoid HTML duplication

(function () {
  // Detect if we're in a subdirectory (e.g., posts/)
  const path = window.location.pathname;
  const inSubdir = path.includes('/posts/');
  const prefix = inSubdir ? '../' : '';

  // Determine which page is active. There is no Blog key in the bar:
  // the post is reached from its card on the home page, so the bar
  // carries only the home page's own sections.
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

    return `
    <nav class="navigator" id="navigator">
      <a href="${prefix}index.html" class="nav-brand">Kevin Xie</a>
      <div class="nav-section">
        <div class="nav-links">
          <a href="${prefix}index.html" class="nav-link${isHome ? ' active' : ''}" ${isHome ? 'data-section="about"' : ''}>
            <span class="nav-icon">⌂</span>
            <span>Home</span>
          </a>
          <a href="${prefix}index.html#publications" class="nav-link">
            <span class="nav-icon">§</span>
            <span>Publications</span>
          </a>
          <a href="${prefix}index.html#projects" class="nav-link">
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
    </nav>`;
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

    // The nav is a top bar at every width, so there is no drawer to toggle
    // and no overlay — the slide-out menu and its markup are retired.

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

    // The 3D tilt/parallax that followed the cursor belonged to the floating
    // sidebar. A fixed top bar does not tilt, so the mousemove listener is
    // gone rather than being neutralised in CSS.

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
