export async function loadImage(url) {
  const img = new Image();
  img.decoding = "async";
  img.src = url;

  if (img.decode) {
    try {
      await img.decode();
      return img;
    } catch {
      // Fall back to onload for browsers that fail decode() for some images.
    }
  }

  await new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
  });
  return img;
}

export async function loadWallTextures(baseUrl, mapping) {
  const entries = await Promise.all(
    Object.entries(mapping).map(async ([tile, filename]) => {
      const url = new URL(filename, baseUrl).toString();
      const img = await loadImage(url);
      return [tile | 0, img];
    }),
  );

  return Object.fromEntries(entries);
}

