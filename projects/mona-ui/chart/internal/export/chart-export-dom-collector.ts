import type {
    ChartExportBadgeSnapshot,
    ChartExportDomLayerSnapshot,
    ChartExportRasterIslandSnapshot,
    ChartExportVectorTextSnapshot
} from "./chart-export-snapshot";
import type { ChartRect } from "../../models/chart.models";
import { isFiniteNumber } from "../utils/number-utils";

function parseRotation(transformStr: string): { angle: number; cx?: number; cy?: number } | undefined {
    if (!transformStr || transformStr === "none") {
        return undefined;
    }
    const match = /rotate\(([-0-9.]+)deg\)/i.exec(transformStr);
    if (match) {
        const angle = parseFloat(match[1]);
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

export class ChartExportDomCollector {
    public static collect(
        chartHost: HTMLElement,
        plotSurface: HTMLElement | null,
        styleSnapshot?: ReadonlyMap<string, string>
    ): ChartExportDomLayerSnapshot {
        const vectorTexts: ChartExportVectorTextSnapshot[] = [];
        const badges: ChartExportBadgeSnapshot[] = [];
        const rasterIslands: ChartExportRasterIslandSnapshot[] = [];

        if (typeof window === "undefined" || !chartHost) {
            return { badges, rasterIslands, vectorTexts };
        }

        const hostRect = chartHost.getBoundingClientRect();
        if (hostRect.width <= 0 || hostRect.height <= 0) {
            return { badges, rasterIslands, vectorTexts };
        }

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

            const zOrder = zIndexCounter++;

            if (mode === "raster" || role === "legend" || role.endsWith("-template")) {
                rasterIslands.push({
                    bounds,
                    element: node,
                    role,
                    zOrder
                });
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
            const opacity = isFiniteNumber(parseFloat(computed.opacity)) ? parseFloat(computed.opacity) : 1;

            if (hasBackground || hasBorder) {
                const borderRadius = parseFloat(computed.borderRadius) || 0;
                badges.push({
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
                });
            } else {
                const rotation = parseRotation(node.style.transform || computed.transform);
                let textAlign: "left" | "center" | "right" = "center";
                if (computed.textAlign === "left" || computed.textAlign === "start") {
                    textAlign = "left";
                } else if (computed.textAlign === "right" || computed.textAlign === "end") {
                    textAlign = "right";
                }

                vectorTexts.push({
                    bounds,
                    color,
                    fontFamily,
                    fontSize,
                    fontStyle,
                    fontWeight,
                    letterSpacing,
                    opacity,
                    role,
                    rotation: rotation ? { angle: rotation.angle, cx: bounds.x + bounds.width / 2, cy: bounds.y + bounds.height / 2 } : undefined,
                    text,
                    textAlign,
                    zOrder
                });
            }
        }

        return {
            badges,
            rasterIslands,
            vectorTexts
        };
    }
}
