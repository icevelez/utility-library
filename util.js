/**
 * an async/await version of setTimeout
 *
 * @param {number} miliseconds
 * @returns {Promise<void>}
 */
export async function delay(miliseconds = 0) {
    return new Promise((resolve) => setTimeout(resolve, miliseconds))
}

/**
 * Compress an input iamge to `.webp`
 * @param {Blob} blobImage
 * @param {number} qualityPercent default at 40% quality
 */
export async function compressImage(blobImage, qualityPercent = 40) {
    if (!qualityPercent || isNaN(qualityPercent)) throw 'Error! qualityPercent is not a number';
    if (qualityPercent > 100) qualityPercent = 100;
    if (qualityPercent <= 0) qualityPercent = 40;

    try {
        const bitmap = await createImageBitmap(blobImage);
        const imageType = "image/webp";
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const max_size = 1000;

        const ratio = (bitmap.width / bitmap.height);
        const isLarge = bitmap.height > max_size || bitmap.width > max_size;

        const height = isLarge ? max_size : bitmap.height;
        const width = isLarge ? (max_size * ratio) : bitmap.width;

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(bitmap, 0, 0, width, height);

        /**
         * @type {Blob}
         */
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, imageType, qualityPercent / 100));

        return {
            blob,
            string: canvas.toDataURL(imageType, qualityPercent / 100),
        };
    } catch (error) {
        throw new Error(error);
    }
}

/**
 * print an HTML Element using iframes
 *
 * By default printing an HTML element will not have any styles; to combat this,
 * this function copies the `<styles>` and `<link rel="stylesheet">` from the header
 *
 * BUT I cannot guarantee that it will work for all cases
 *
 * @param {HTMLElement} elemment
 */
export function print(elemment) {
    if (!(elemment instanceof HTMLElement)) throw new Error("input is not an HTML element");

    let html_src = elemment.outerHTML;

    Array.from(document.head.children).forEach((child) => {
        if (child instanceof HTMLLinkElement && child.rel === "stylesheet") html_src += child.outerHTML;
        if (child instanceof HTMLStyleElement) html_src += child.outerHTML;
    });

    const iframContainer = document.createElement("div");
    iframContainer.style.display = "none";

    const iframe = document.createElement("iframe");
    iframe.src = html_src;
    iframe.onload = function () {
        if (!iframe.contentWindow) throw new Error("iframe.contentWindow does not exists, could not print HTML")
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframContainer), 500);
    }

    iframContainer.append(iframe);
    document.body.append(iframContainer);
}
