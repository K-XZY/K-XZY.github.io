/* Video links open in place rather than navigating away.
 *
 * Any link in a card's foot that points at a video file is intercepted: the
 * file plays in an overlay over the page, and closing it returns the reader to
 * exactly where they were. Following the href would hand them to the browser's
 * bare video viewer, with the site — and their place in it — gone.
 *
 * The href is left intact and the interception is scripted, so with JavaScript
 * off, or if this file fails to load, the link still works the old way.
 */
(function () {
  'use strict';

  var VIDEO = /\.(mp4|webm|mov)(\?|#|$)/i;

  var overlay = null;
  var lastFocused = null;

  function close() {
    if (!overlay) return;
    var video = overlay.querySelector('video');
    if (video) {
      video.pause();
      /* Drop the source so a large file stops downloading the moment it is
         closed, rather than continuing to buffer out of sight. */
      video.removeAttribute('src');
      video.load();
    }
    document.removeEventListener('keydown', onKeydown, true);
    overlay.remove();
    overlay = null;
    var scroller = document.querySelector('.layout') || document.body;
    scroller.style.removeProperty('overflow');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
    lastFocused = null;
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    /* Keep Tab inside the overlay: the page behind it is inert, so letting
       focus walk into it would leave a keyboard reader stranded. */
    if (e.key === 'Tab' && overlay) {
      var focusable = overlay.querySelectorAll('button, video');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function open(src, label) {
    close();
    lastFocused = document.activeElement;

    overlay = document.createElement('div');
    overlay.className = 'video-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', label || 'Video');

    var frame = document.createElement('div');
    frame.className = 'video-overlay-frame';

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-overlay-close';
    button.setAttribute('aria-label', 'Close video');
    button.textContent = '×';
    button.addEventListener('click', close);

    var video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');

    frame.appendChild(video);
    frame.appendChild(button);
    overlay.appendChild(frame);

    /* Only the backdrop closes; a click that lands on the frame is a click on
       the video's own controls. */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
    /* The page scrolls inside .layout, not the document, so the lock that
       stops the page moving behind the overlay goes on that element. */
    (document.querySelector('.layout') || document.body).style.overflow = 'hidden';
    document.addEventListener('keydown', onKeydown, true);
    button.focus();
  }

  /* Capture phase, and the event is stopped rather than only defaulted:
     navigation.js also listens for clicks on document and sends every
     relative href to window.location, which preventDefault does not undo.
     Running first and stopping the event is what keeps it out of that path. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    if (!VIDEO.test(link.getAttribute('href'))) return;
    /* Leave the modified clicks alone: a reader asking for a new tab, a
       download or a copied address should get what they asked for. */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();
    open(link.href, link.textContent.trim());
  }, true);
})();
