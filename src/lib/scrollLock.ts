/**
 * Reference-counted body scroll lock so nested BottomSheets and CenterModals
 * do not unlock background scrolling prematurely when an inner overlay closes.
 */
let activeLocks = 0;

export function acquireScrollLock(): void {
  if (typeof document === 'undefined') return;
  if (activeLocks === 0) {
    document.body.style.overflow = 'hidden';
  }
  activeLocks += 1;
}

export function releaseScrollLock(): void {
  if (typeof document === 'undefined') return;
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    document.body.style.overflow = '';
  }
}
