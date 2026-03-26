// Homepage JavaScript — avatar rendering, email copy

document.addEventListener('DOMContentLoaded', () => {
  renderAvatar();
  setupEmailCopy();
});

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
