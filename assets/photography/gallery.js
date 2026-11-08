import PhotoSwipeLightbox from './vendor/photoswipe/photoswipe-lightbox.esm.min.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lightbox = new PhotoSwipeLightbox({
  gallery: '#photo-gallery',
  children: 'a.photo-link',
  pswpModule: () => import('./vendor/photoswipe/photoswipe.esm.min.js'),
  bgOpacity: 1,
  loop: false,
  padding: { top: 64, bottom: 112, left: 16, right: 16 },
  showHideAnimationType: reducedMotion ? 'none' : 'fade',
  zoomAnimationDuration: reducedMotion ? 0 : 333,
  // Keep photos and controls visible on a single tap; double-tap still zooms.
  tapAction: 'zoom',
  imageClickAction: 'zoom',
  clickToCloseNonZoomable: false,
  closeTitle: 'Close photograph (Esc)',
  zoomTitle: 'Zoom photograph',
  arrowPrevTitle: 'Previous photograph',
  arrowNextTitle: 'Next photograph',
  errorMsg: 'This photograph could not be loaded. Close the viewer and try its image link again.'
});

lightbox.on('afterInit', () => {
  lightbox.pswp.element.setAttribute('aria-label', 'Photograph viewer');
  lightbox.pswp.element.setAttribute('aria-modal', 'true');
});

// Use plain text and keep captions in the page for non-JavaScript readers.
lightbox.on('uiRegister', () => {
  lightbox.pswp.ui.registerElement({
    name: 'photo-caption',
    order: 9,
    isButton: false,
    appendTo: 'root',
    onInit: (element, pswp) => {
      element.setAttribute('role', 'status');
      element.setAttribute('aria-live', 'polite');
      element.setAttribute('aria-atomic', 'true');
      element.tabIndex = 0;
      pswp.on('change', () => {
        const link = pswp.currSlide.data.element;
        const caption = link?.closest('figure')?.querySelector('.photo-caption')?.textContent;
        element.textContent = caption || link?.querySelector('img')?.alt || '';
        element.hidden = !element.textContent;
      });
    }
  });
});

lightbox.init();
