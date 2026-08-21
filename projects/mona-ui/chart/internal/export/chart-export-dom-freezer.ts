export class ChartExportDomFreezer {
    /**
     * Deeply freezes a cloned DOM tree by copying all computed styles and runtime state
     * from the source tree, making it completely independent of subsequent live DOM or CSS changes.
     */
    public static freeze(sourceNode: HTMLElement, cloneNode: HTMLElement): void {
        if (!sourceNode || !cloneNode || typeof window === "undefined") {
            return;
        }

        const sourceElements = [sourceNode, ...Array.from(sourceNode.querySelectorAll<HTMLElement>("*"))];
        const cloneElements = [cloneNode, ...Array.from(cloneNode.querySelectorAll<HTMLElement>("*"))];

        for (let i = 0; i < sourceElements.length && i < cloneElements.length; i++) {
            const src = sourceElements[i];
            const dst = cloneElements[i];
            if (!src || !dst) continue;

            const tagName = dst.tagName.toLowerCase();
            if (tagName === "script") {
                dst.remove();
                continue;
            }

            try {
                const computed = window.getComputedStyle(src);

                // Enumerate and copy all resolved computed styles inline
                if (computed.length > 0) {
                    for (let j = 0; j < computed.length; j++) {
                        const prop = computed[j];
                        if (prop) {
                            const val = computed.getPropertyValue(prop);
                            if (val) {
                                dst.style.setProperty(prop, val);
                            }
                        }
                    }
                } else {
                    // Fallback for environments where computed style indexing is limited
                    dst.style.fontFamily = computed.fontFamily;
                    dst.style.fontSize = computed.fontSize;
                    dst.style.fontWeight = computed.fontWeight;
                    dst.style.fontStyle = computed.fontStyle;
                    dst.style.lineHeight = computed.lineHeight;
                    dst.style.letterSpacing = computed.letterSpacing;
                    dst.style.color = computed.color;
                    dst.style.textAlign = computed.textAlign;
                    dst.style.backgroundColor = computed.backgroundColor;
                    dst.style.backgroundImage = computed.backgroundImage;
                    dst.style.boxSizing = computed.boxSizing;
                    dst.style.padding = computed.padding;
                    dst.style.margin = computed.margin;
                    dst.style.border = computed.border;
                    dst.style.borderRadius = computed.borderRadius;
                    dst.style.boxShadow = computed.boxShadow;
                    dst.style.display = computed.display;
                    dst.style.opacity = computed.opacity;
                }

                // Explicit export overrides: disable transitions, animations, caret
                dst.style.setProperty("animation", "none", "important");
                dst.style.setProperty("transition", "none", "important");
                dst.style.caretColor = "transparent";

                // Animation suppression check (EXP-03 / R2-09):
                // ONLY honor explicit Mona suppression marker, never generic consumer opacity-0
                const isMonaSuppressed =
                    src.getAttribute("data-mona-chart-export-animation-suppression") === "opacity";

                if (isMonaSuppressed) {
                    dst.style.opacity = "1";
                    dst.removeAttribute("data-mona-chart-export-animation-suppression");
                } else {
                    dst.style.opacity = computed.opacity;
                }

                // Preserve runtime interactive & media DOM state
                if (src instanceof HTMLInputElement && dst instanceof HTMLInputElement) {
                    dst.value = src.value;
                    if (src.type === "checkbox" || src.type === "radio") {
                        dst.checked = src.checked;
                    }
                } else if (src instanceof HTMLTextAreaElement && dst instanceof HTMLTextAreaElement) {
                    dst.value = src.value;
                } else if (src instanceof HTMLSelectElement && dst instanceof HTMLSelectElement) {
                    dst.selectedIndex = src.selectedIndex;
                } else if (src instanceof HTMLDetailsElement && dst instanceof HTMLDetailsElement) {
                    dst.open = src.open;
                } else if (src instanceof HTMLImageElement && dst instanceof HTMLImageElement) {
                    dst.src = src.currentSrc || src.src;
                } else if (src instanceof HTMLCanvasElement && dst instanceof HTMLCanvasElement) {
                    try {
                        const ctx = dst.getContext("2d");
                        if (ctx && src.width > 0 && src.height > 0) {
                            dst.width = src.width;
                            dst.height = src.height;
                            ctx.drawImage(src, 0, 0);
                        }
                    } catch {
                        // Tainted canvas - preflight check in resource manager will handle
                    }
                }
            } catch {
                // Ignore per-element computed style exceptions
            }
        }
    }
}
