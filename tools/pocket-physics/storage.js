const KEY = 'pocket-physics-settings-v1';
const defaults = { mode: 'sandbox', quality: 'high', overlay: false, calibration: {x:0,y:0}, bestStability: 0 };
export function loadSettings() { try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...defaults }; } }
export function saveSettings(next) { localStorage.setItem(KEY, JSON.stringify(next)); }
export { defaults };
