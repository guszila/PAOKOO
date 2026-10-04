type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Triggers the falling coins celebratory animation across the screen.
 */
export function triggerCoinShower() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error triggering coin shower:', e);
    }
  });
}

/**
 * Subscribes to coin shower events.
 */
export function subscribeCoinShower(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
