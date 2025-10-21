type Listener = () => void;

const listeners = new Set<Listener>();

export function onUnauthorized(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to handle unauthorized event", error);
    }
  });
}
