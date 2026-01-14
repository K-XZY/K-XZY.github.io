// Shared navigation history system for all pages
// This handles the back/forward arrow buttons using custom history stacks

let backStack = [];
let forwardStack = [];

// Load navigation history from sessionStorage
function loadNavigationHistory() {
  const savedBack = sessionStorage.getItem('nav-back');
  const savedForward = sessionStorage.getItem('nav-forward');

  if (savedBack) backStack = JSON.parse(savedBack);
  if (savedForward) forwardStack = JSON.parse(savedForward);
}

// Save navigation history to sessionStorage
function saveNavigationHistory() {
  sessionStorage.setItem('nav-back', JSON.stringify(backStack));
  sessionStorage.setItem('nav-forward', JSON.stringify(forwardStack));
}

// Navigate to a page and update history
function navigateToPage(url) {
  // Push current page to back stack before navigating
  const currentPage = window.location.pathname;
  backStack.push(currentPage);
  forwardStack = []; // Clear forward stack on new navigation
  saveNavigationHistory();
  window.location.href = url;
}

// Setup post navigation with history stacks
function setupPostNavigation() {
  const prevBtn = document.getElementById('prev-post');
  const nextBtn = document.getElementById('next-post');

  if (!prevBtn || !nextBtn) return;

  // Update button states
  updateNavigationButtons();

  // Previous button - go back in history
  prevBtn.addEventListener('click', () => {
    if (backStack.length > 0) {
      const previousPage = backStack.pop();
      forwardStack.push(window.location.pathname);
      saveNavigationHistory();
      window.location.href = previousPage;
    }
  });

  // Next button - go forward in history
  nextBtn.addEventListener('click', () => {
    if (forwardStack.length > 0) {
      const nextPage = forwardStack.pop();
      backStack.push(window.location.pathname);
      saveNavigationHistory();
      window.location.href = nextPage;
    }
  });
}

// Update navigation button states
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prev-post');
  const nextBtn = document.getElementById('next-post');

  if (prevBtn) {
    if (backStack.length === 0) {
      prevBtn.disabled = true;
      prevBtn.style.opacity = '0.3';
      prevBtn.style.cursor = 'not-allowed';
    } else {
      prevBtn.disabled = false;
      prevBtn.style.opacity = '1';
      prevBtn.style.cursor = 'pointer';
    }
  }

  if (nextBtn) {
    if (forwardStack.length === 0) {
      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.3';
      nextBtn.style.cursor = 'not-allowed';
    } else {
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      nextBtn.style.cursor = 'pointer';
    }
  }
}

// Intercept internal site links to track navigation
function interceptSiteLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    // Only intercept relative links (internal site links)
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      e.preventDefault();
      navigateToPage(href);
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadNavigationHistory();
  setupPostNavigation();
  interceptSiteLinks();
});
