import { gsap } from 'gsap';

// Guard reduced-motion (T-23): semua helper diam bila user menolak animasi.
function skipMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Bubble pesan baru: pop kecil.
export function popMessage(el: HTMLElement): void {
  if (skipMotion()) return;
  gsap.from(el, { scale: 0.92, y: 8, duration: 0.18, ease: 'back.out(2)' });
}

// Toast notifikasi: pantul masuk.
export function bounceToast(el: HTMLElement): void {
  if (skipMotion()) return;
  gsap.from(el, { y: -16, opacity: 0, duration: 0.3, ease: 'bounce.out' });
}

// Kode room salah: goyang.
export function wiggleCode(el: HTMLElement): void {
  if (skipMotion()) return;
  gsap.fromTo(
    el,
    { x: 0 },
    { x: -7, duration: 0.06, repeat: 5, yoyo: true, clearProps: 'x' },
  );
}

// Drawer sidebar mobile: geser (T-24).
export function slideDrawer(el: HTMLElement, open: boolean): void {
  el.dataset.open = open ? 'true' : 'false';
  if (skipMotion()) return;
  gsap.to(el, { x: open ? 0 : '-105%', duration: 0.25, ease: 'power2.out' });
}
