export function burstStars(layer) {
  if (!layer) {
    return;
  }
  const rect = layer.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  for (let i = 0; i < 12; i += 1) {
    const star = document.createElement('div');
    star.className = 'star';
    const angle = (Math.PI * 2 * i) / 12;
    const distance = 120 + Math.random() * 60;
    star.style.left = `${centerX}px`;
    star.style.top = `${centerY}px`;
    star.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    star.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    layer.appendChild(star);
    star.addEventListener('animationend', () => star.remove());
  }
}
