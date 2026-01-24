export function setupHud(hudElement) {
  let hideTimeout;

  function showHud() {
    hudElement.classList.add('is-visible');
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
    hideTimeout = setTimeout(() => {
      hudElement.classList.remove('is-visible');
    }, 3000);
  }

  function keepVisible() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }
  }

  return { showHud, keepVisible };
}
