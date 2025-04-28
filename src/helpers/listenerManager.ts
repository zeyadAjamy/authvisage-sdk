type Callback<T> = (value: T) => void;

export class ListenerManager<T> {
  private listeners = new Set<Callback<T>>();

  subscribe(callback: Callback<T>): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(value: T): void {
    this.listeners.forEach((cb) => cb(value));
  }
}
