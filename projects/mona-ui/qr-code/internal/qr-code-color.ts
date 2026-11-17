import { parseColor } from "@nanahoshi/mona-ui/internal";
import type { QrCodeColor } from "./qr-code-export";

export const BLACK: QrCodeColor = { a: 255, b: 0, g: 0, r: 0 };
export const WHITE: QrCodeColor = { a: 255, b: 255, g: 255, r: 255 };

/**
 * The color a CSS value paints inside an element, so `var()`, `currentColor` and every color syntax the browser knows
 * become channels an export can write. A value the browser rejects gets the fallback.
 */
export function resolveQrCodeColor(host: HTMLElement, value: string, fallback: QrCodeColor): QrCodeColor {
    const document = host.ownerDocument;
    const probe = document.createElement("span");
    probe.style.display = "none";
    probe.style.color = value;
    if (!probe.style.color) {
        return fallback;
    }
    host.appendChild(probe);
    const computed = document.defaultView?.getComputedStyle(probe).color || probe.style.color;
    probe.remove();
    const color = parseColor(computed, document);
    if (!color || color.r === null || color.g === null || color.b === null) {
        return fallback;
    }
    return { a: color.a ?? 255, b: color.b, g: color.g, r: color.r };
}
