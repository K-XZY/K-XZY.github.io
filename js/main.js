// Homepage JavaScript — avatar rendering, email copy

document.addEventListener('DOMContentLoaded', () => {
  renderAvatar();
  setupEmailCopy();
  holdStillIfAsked();
});

// --- Reduced motion ---
// Thumbnail clips autoplay, and CSS cannot stop a playing video, so honour
// prefers-reduced-motion here. The poster frame stays visible.
function holdStillIfAsked() {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.post-thumb video').forEach((video) => {
    video.autoplay = false;
    video.removeAttribute('autoplay');
    video.pause();
  });
}

// --- Avatar ---

function renderAvatar() {
  const avatarEl = document.getElementById('avatar');
  if (avatarEl) {
    const photoSrc = avatarEl.dataset.photo;
    if (photoSrc) {
      avatarEl.innerHTML = `<img src="${photoSrc}" alt="Kevin Xie">`;
    }
  }
}

// --- Email click-to-copy ---

function setupEmailCopy() {
  document.querySelectorAll('.email-link').forEach((link) => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = link.dataset.email.replace(/\(dot\)/g, '.').replace(/\(at\)/g, '@');
      try {
        await navigator.clipboard.writeText(email);
        const originalText = link.textContent;
        link.textContent = 'Copied!';
        link.style.color = 'var(--accent)';
        setTimeout(() => {
          link.textContent = originalText;
          link.style.color = '';
        }, 1500);
      } catch (err) {
        alert(`Email: ${email}`);
      }
    });
  });
}
