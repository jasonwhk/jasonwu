const STORAGE_KEY = 'phonics-progress-v1';

export class ProgressTracker {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  recordAttempt(id) {
    this.ensure(id);
    this.data[id].attempts += 1;
    this.data[id].lastPracticed = Date.now();
    this.save();
  }

  recordSuccess(id) {
    this.ensure(id);
    this.data[id].successes += 1;
    this.data[id].lastPracticed = Date.now();
    this.save();
  }

  getAll() {
    return this.data;
  }

  getTotalSuccesses() {
    return Object.values(this.data).reduce((sum, item) => sum + (item.successes || 0), 0);
  }

  ensure(id) {
    if (!this.data[id]) {
      this.data[id] = { attempts: 0, successes: 0, lastPracticed: null };
    }
  }

  reset() {
    this.data = {};
    this.save();
  }
}
