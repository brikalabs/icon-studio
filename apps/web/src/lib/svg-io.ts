/** Encodes a standalone SVG document as a data URI usable in an <img>. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadSvg(svg: string, fileName: string): void {
  triggerDownload(new Blob([svg], { type: "image/svg+xml" }), fileName);
}

/** Rasterizes a standalone SVG document to a PNG Blob at `size`x`size` pixels. */
export async function svgToPngBlob(svg: string, size: number): Promise<Blob> {
  // Wait for our web fonts so monogram icons rasterize with the right glyphs.
  if ("fonts" in document) {
    await document.fonts.ready;
  }
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("could not load the SVG for rasterization"));
    image.src = svgToDataUri(svg);
  });

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("canvas 2D context is unavailable");
  }
  context.drawImage(image, 0, 0, size, size);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("PNG encoding failed"));
      }
    }, "image/png");
  });
}

export async function downloadPng(svg: string, size: number, fileName: string): Promise<void> {
  triggerDownload(await svgToPngBlob(svg, size), fileName);
}

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

/**
 * Copies a PNG of the icon to the clipboard. The blob is wrapped in a Promise
 * inside ClipboardItem so the rasterization stays within the user gesture.
 */
export async function copyPngToClipboard(svg: string, size: number): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": svgToPngBlob(svg, size) })]);
}
