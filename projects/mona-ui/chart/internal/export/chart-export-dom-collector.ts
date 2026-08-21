import type {
    ChartExportBadgeSnapshot,
    ChartExportDomLayerSnapshot,
    ChartExportDomPrimitive,
    ChartExportRasterIslandSnapshot,
    ChartExportVectorTextSnapshot
} from "./chart-export-snapshot";
import type { ChartRect } from "../../models/chart.models";
import { isFiniteNumber } from "../utils/number-utils";

function parseTransform(
    transformStr: string
): {
    angle?: number;
    matrix?: readonly [number, number, number, number, number, number];
} | undefined {
    if (!transformStr || transformStr === "none") {
        return undefined;
    }
    const matMatch = /^matrix\(([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+),\s*([-0-9.]+)\)$/i.exec(
        transformStr
    );
    if (matMatch) {
        const a = parseFloat(matMatch[1]);
        const b = parseFloat(matMatch[2]);
        const c = parseFloat(matMatch[3]);
        const d = parseFloat(matMatch[4]);
        const tx = parseFloat(matMatch[5]);
        const ty = parseFloat(matMatch[6]);
        const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI) * 100) / 100;
        return {
            angle: angle !== 0 ? angle : undefined,
            matrix: [a, b, c, d, tx, ty]
        };
    }
    const rotMatch = /rotate\(([-0-9.]+)deg\)/i.exec(transformStr);
    if (rotMatch) {
        const angle = parseFloat(rotMatch[1]);
        if (isFiniteNumber(angle) && angle !== 0) {
            return { angle };
        }
    }
    return undefined;
}

function normalizeFontFamily(rawFontFamily?: string): string {
    if (!rawFontFamily) {
        return "Helvetica, Arial, sans-serif";
    }
    const lower = rawFontFamily.toLowerCase();
    if (
        lower.includes("sans-serif") ||
        lower.includes("inter") ||
        lower.includes("roboto") ||
        lower.includes("system-ui") ||
        lower.includes("segoe ui") ||
        lower.includes("arial") ||
        lower.includes("helvetica")
    ) {
        return `${rawFontFamily}, Helvetica, Arial, sans-serif`;
    }
    if (lower.includes("mono") || lower.includes("courier") || lower.includes("consolas")) {
        return `${rawFontFamily}, Courier, monospace`;
    }
    if (lower.includes("serif") || lower.includes("times") || lower.includes("georgia")) {
        return `${rawFontFamily}, Times, serif`;
    }
    return `${rawFontFamily}, Helvetica, Arial, sans-serif`;
}

function freezeElementTree(sourceNode: HTMLElement, cloneNode: HTMLElement): void {
    const sourceElements = [sourceNode, ...Array.from(sourceNode.querySelectorAll<HTMLElement>("*"))];
    const cloneElements = [cloneNode, ...Array.from(cloneNode.querySelectorAll<HTMLElement>("*"))];

    for (let i = 0; i < sourceElements.length && i < cloneElements.length; i++) {
        const src = sourceElements[i];
        const dst = cloneElements[i];
        if (!src || !dst) continue;

        if (dst.tagName.toLowerCase() === "script") {
            dst.remove();
            continue;
        }

        try {
            const computed = window.getComputedStyle(src);

            // Copy typography & layout styles
            dst.style.fontFamily = computed.fontFamily;
            dst.style.fontSize = computed.fontSize;
            dst.style.fontWeight = computed.fontWeight;
            dst.style.fontStyle = computed.fontStyle;
            dst.style.lineHeight = computed.lineHeight;
            dst.style.letterSpacing = computed.letterSpacing;
            dst.style.color = computed.color;
            dst.style.textAlign = computed.textAlign;
            dst.style.textTransform = computed.textTransform;
            dst.style.textDecoration = computed.textDecoration;
            dst.style.whiteSpace = computed.whiteSpace;
            dst.style.wordBreak = computed.wordBreak;

            // Box model & colors
            dst.style.backgroundColor = computed.backgroundColor;
            dst.style.backgroundImage = computed.backgroundImage;
            dst.style.backgroundPosition = computed.backgroundPosition;
            dst.style.backgroundSize = computed.backgroundSize;
            dst.style.backgroundRepeat = computed.backgroundRepeat;
            dst.style.boxSizing = computed.boxSizing;
            dst.style.padding = computed.padding;
            dst.style.margin = computed.margin;
            dst.style.border = computed.border;
            dst.style.borderRadius = computed.borderRadius;
            dst.style.boxShadow = computed.boxShadow;

            // Layout
            dst.style.display = computed.display;
            dst.style.flexDirection = computed.flexDirection;
            dst.style.flexWrap = computed.flexWrap;
            dst.style.justifyContent = computed.justifyContent;
            dst.style.alignItems = computed.alignItems;
            dst.style.gap = computed.gap;

            // Animation suppression override (EXP-03)
            const isSuppressed =
                src.getAttribute("data-mona-chart-export-animation-suppression") === "opacity" ||
                src.classList.contains("opacity-0");

            if (isSuppressed) {
                dst.style.opacity = "1";
                dst.classList.remove("opacity-0");
            } else {
                dst.style.opacity = computed.opacity;
            }

            // Media & input state capture
            if (src instanceof HTMLInputElement && dst instanceof HTMLInputElement) {
                dst.value = src.value;
                if (src.type === "checkbox" || src.type === "radio") {
                    dst.checked = src.checked;
                }
            } else if (src instanceof HTMLTextAreaElement && dst instanceof HTMLTextAreaElement) {
                dst.value = src.value;
            } else if (src instanceof HTMLSelectElement && dst instanceof HTMLSelectElement) {
                dst.selectedIndex = src.selectedIndex;
            } else if (src instanceof HTMLImageElement && dst instanceof HTMLImageElement) {
                dst.src = src.currentSrc || src.src;
            } else if (src instanceof HTMLCanvasElement && dst instanceof HTMLCanvasElement) {
                try {
                    const ctx = dst.getContext("2d");
                    if (ctx) {
                        dst.width = src.width;
                        dst.height = src.height;
                        ctx.drawImage(src, 0, 0);
                    }
                } catch {
                    // Tainted canvas - preflight check will handle
                }
            }
        } catch {
            // Ignore per-element computed style exceptions
        }
    }
}

export class ChartExportDomCollector {
    public static collect(
        chartHost: HTMLElement,
        plotSurface: HTMLElement | null,
        _styleSnapshot?: ReadonlyMap<string, string>
    ): ChartExportDomLayerSnapshot {
        const vectorTexts: ChartExportVectorTextSnapshot[] = [];
        const badges: ChartExportBadgeSnapshot[] = [];
        const rasterIslands: ChartExportRasterIslandSnapshot[] = [];
        const primitives: ChartExportDomPrimitive[] = [];

        if (typeof window === "undefined" || !chartHost) {
            return { badges, primitives, rasterIslands, vectorTexts };
        }

        const hostRect = chartHost.getBoundingClientRect();
        if (hostRect.width <= 0 || hostRect.height <= 0) {
            return { badges, primitives, rasterIslands, vectorTexts };
        }

        const plotRect = plotSurface ? plotSurface.getBoundingClientRect() : hostRect;
        const plotSurfaceClipRect: ChartRect = {
            height: Math.round(plotRect.height * 100) / 100,
            width: Math.round(plotRect.width * 100) / 100,
            x: Math.round((plotRect.left - hostRect.left) * 100) / 100,
            y: Math.round((plotRect.top - hostRect.top) * 100) / 100
        };

        const exportNodes = chartHost.querySelectorAll<HTMLElement>("[data-mona-chart-export-role]");

        let zIndexCounter = 10;

        for (let i = 0; i < exportNodes.length; i++) {
            const node = exportNodes[i];
            if (!node || node.classList.contains("sr-only")) {
                continue;
            }

            // If a container node contains more specific child export nodes, skip the container
            if (node.querySelector("[data-mona-chart-export-role]")) {
                continue;
            }

            const role = node.getAttribute("data-mona-chart-export-role") || "unknown";
            const mode = node.getAttribute("data-mona-chart-export-mode") || "auto";

            const nodeRect = node.getBoundingClientRect();
            if (nodeRect.width <= 0 && nodeRect.height <= 0) {
                continue;
            }

            const bounds: ChartRect = {
                height: Math.round(nodeRect.height * 100) / 100,
                width: Math.round(nodeRect.width * 100) / 100,
                x: Math.round((nodeRect.left - hostRect.left) * 100) / 100,
                y: Math.round((nodeRect.top - hostRect.top) * 100) / 100
            };

            const computed = window.getComputedStyle(node);
            if (computed.display === "none" || computed.visibility === "hidden") {
                continue;
            }

            const zIndexParsed = parseInt(computed.zIndex, 10);
            const zOrder = Number.isFinite(zIndexParsed) ? zIndexParsed : zIndexCounter++;

            // Plot-local clipping check (EXP-14)
            const isPlotLocal =
                (plotSurface !== null && plotSurface.contains(node)) ||
                role.startsWith("sector-") ||
                role.startsWith("treemap-") ||
                role.startsWith("funnel-") ||
                role.startsWith("waterfall-") ||
                role === "data-label-template" ||
                role.startsWith("overlay:");

            const clipRect = isPlotLocal ? plotSurfaceClipRect : undefined;

            if (mode === "raster" || role.endsWith("-template") || role === "legend-color-scale") {
                // Synchronously clone and freeze raster island DOM (EXP-01)
                const frozenRoot = node.cloneNode(true) as HTMLElement;
                freezeElementTree(node, frozenRoot);

                // Enforce strict bounding dimensions on the frozen root so it measures identically in staging DOM
                frozenRoot.style.boxSizing = "border-box";
                frozenRoot.style.width = `${bounds.width}px`;
                frozenRoot.style.height = `${bounds.height}px`;
                frozenRoot.style.minWidth = `${bounds.width}px`;
                frozenRoot.style.maxWidth = `${bounds.width}px`;
                frozenRoot.style.minHeight = `${bounds.height}px`;
                frozenRoot.style.maxHeight = `${bounds.height}px`;
                frozenRoot.style.overflow = "hidden";

                const rasterSnapshot: ChartExportRasterIslandSnapshot = {
                    bounds,
                    clipRect,
                    frozenRoot,
                    role,
                    zOrder
                };
                rasterIslands.push(rasterSnapshot);
                primitives.push({ kind: "raster", ...rasterSnapshot });
                continue;
            }

            // Check if simple text or badge
            const bg = computed.backgroundColor;
            const hasBackground = bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)";
            const borderW = parseFloat(computed.borderWidth) || 0;
            const hasBorder = borderW > 0 && computed.borderColor && computed.borderColor !== "transparent";

            const text = (node.textContent || "").trim();
            if (!text && !hasBackground) {
                continue;
            }

            const fontSize = parseFloat(computed.fontSize) || 12;
            const fontFamily = normalizeFontFamily(computed.fontFamily);
            const fontWeight = computed.fontWeight || "400";
            const fontStyle = computed.fontStyle || "normal";
            const letterSpacing = parseFloat(computed.letterSpacing) || 0;
            const color = computed.color || "#000000";

            // Animation suppression check (EXP-03)
            const isAnimationSuppressed =
                node.getAttribute("data-mona-chart-export-animation-suppression") === "opacity" ||
                node.classList.contains("opacity-0");

            let opacity = 1;
            if (!isAnimationSuppressed) {
                const parsedOpacity = parseFloat(computed.opacity);
                opacity = isFiniteNumber(parsedOpacity) ? parsedOpacity : 1;
            }

            if (hasBackground || hasBorder) {
                const borderRadius = parseFloat(computed.borderRadius) || 0;
                const badgeSnapshot: ChartExportBadgeSnapshot = {
                    backgroundColor: bg,
                    borderColor: hasBorder ? computed.borderColor : undefined,
                    borderRadius,
                    borderWidth: hasBorder ? borderW : undefined,
                    bounds,
                    fontFamily,
                    fontSize,
                    fontStyle,
                    fontWeight,
                    opacity,
                    role,
                    text,
                    textColor: color,
                    zOrder
                };
                badges.push(badgeSnapshot);
                primitives.push({ kind: "badge", ...badgeSnapshot });
            } else {
                const parsedTransform = parseTransform(node.style.transform || computed.transform);
                let textAlign: "left" | "center" | "right" = "center";
                if (computed.textAlign === "left" || computed.textAlign === "start") {
                    textAlign = "left";
                } else if (computed.textAlign === "right" || computed.textAlign === "end") {
                    textAlign = "right";
                }

                const vectorSnapshot: ChartExportVectorTextSnapshot = {
                    bounds,
                    color,
                    fontFamily,
                    fontSize,
                    fontStyle,
                    fontWeight,
                    letterSpacing,
                    opacity,
                    role,
                    rotation:
                        parsedTransform?.angle !== undefined
                            ? {
                                  angle: parsedTransform.angle,
                                  cx: bounds.x + bounds.width / 2,
                                  cy: bounds.y + bounds.height / 2
                              }
                            : undefined,
                    text,
                    textAlign,
                    transformMatrix: parsedTransform?.matrix,
                    zOrder
                };
                vectorTexts.push(vectorSnapshot);
                primitives.push({ kind: "text", ...vectorSnapshot });
            }
        }

        // Sort primitives strictly by z-order / document order (EXP-05)
        primitives.sort((a, b) => a.zOrder - b.zOrder);

        return {
            badges,
            primitives,
            rasterIslands,
            vectorTexts
        };
    }
}
