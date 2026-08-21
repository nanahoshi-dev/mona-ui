import type {
    ChartExportBadgeSnapshot,
    ChartExportDomLayerSnapshot,
    ChartExportDomPlane,
    ChartExportDomPrimitive,
    ChartExportRasterIslandSnapshot,
    ChartExportVectorTextSnapshot
} from "./chart-export-snapshot";
import type { ChartRect } from "../../models/chart.models";
import { isFiniteNumber } from "../utils/number-utils";
import { ChartExportDomFreezer } from "./chart-export-dom-freezer";

function isComplexTransform(node: HTMLElement, computed: CSSStyleDeclaration): boolean {
    const transformStr = (node.style.transform || computed.transform || "").trim();
    if (!transformStr || transformStr === "none") {
        return false;
    }
    // Check matrix(a, b, c, d, tx, ty)
    const matMatch = /^matrix\(([-0-9.eE+]+),\s*([-0-9.eE+]+),\s*([-0-9.eE+]+),\s*([-0-9.eE+]+),\s*([-0-9.eE+]+),\s*([-0-9.eE+]+)\)$/i.exec(
        transformStr
    );
    if (matMatch) {
        const a = parseFloat(matMatch[1]);
        const b = parseFloat(matMatch[2]);
        const c = parseFloat(matMatch[3]);
        const d = parseFloat(matMatch[4]);
        // Pure translation: a ≈ 1, b ≈ 0, c ≈ 0, d ≈ 1
        if (Math.abs(a - 1) < 1e-3 && Math.abs(b) < 1e-3 && Math.abs(c) < 1e-3 && Math.abs(d - 1) < 1e-3) {
            return false;
        }
        return true;
    }
    // Check if contains rotate, skew, or scale
    if (/rotate|skew|scale/i.test(transformStr)) {
        const rotMatch = /rotate\(([-0-9.]+)deg\)/i.exec(transformStr);
        if (rotMatch) {
            const angle = parseFloat(rotMatch[1]);
            if (Math.abs(angle) < 1e-3) return false;
        }
        return true;
    }
    return false;
}

function normalizeFontFamily(rawFontFamily?: string): string {
    const trimmed = rawFontFamily?.trim();
    if (!trimmed || trimmed === "depends on user agent") {
        return "Helvetica, Arial, sans-serif";
    }
    return trimmed;
}

function resolvePlane(role: string, isPlotLocal: boolean): ChartExportDomPlane {
    if (isPlotLocal) {
        if (role.includes("label") || role === "data-label-template" || role.startsWith("polar-label")) {
            return "plot-labels";
        }
        return "plot-overlays";
    }
    return "host-chrome";
}

const PLANE_ORDER: Record<ChartExportDomPlane, number> = {
    "plot-labels": 1,
    "plot-overlays": 2,
    "host-chrome": 3
};

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
        let primitiveCounter = 0;
        let documentOrder = 0;

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
            const id = `mona-export-prim-${++primitiveCounter}`;
            const docOrder = ++documentOrder;
            const plane = resolvePlane(role, isPlotLocal);

            const hasComplexTransform = isComplexTransform(node, computed);

            if (mode === "raster" || role.endsWith("-template") || role === "legend-color-scale" || hasComplexTransform) {
                // Synchronously clone and freeze raster island DOM (EXP-01, EXP-06, R2-02, R2-03)
                const frozenRoot = node.cloneNode(true) as HTMLElement;
                ChartExportDomFreezer.freeze(node, frozenRoot);

                const layoutWidth = node.offsetWidth || parseFloat(computed.width) || bounds.width;
                const layoutHeight = node.offsetHeight || parseFloat(computed.height) || bounds.height;
                const transform = computed.transform || node.style.transform || "none";
                const transformOrigin = computed.transformOrigin || node.style.transformOrigin || "50% 50%";

                if (!hasComplexTransform) {
                    // Enforce strict bounding dimensions on the non-transformed frozen root
                    frozenRoot.style.boxSizing = "border-box";
                    frozenRoot.style.width = `${bounds.width}px`;
                    frozenRoot.style.height = `${bounds.height}px`;
                    frozenRoot.style.minWidth = `${bounds.width}px`;
                    frozenRoot.style.maxWidth = `${bounds.width}px`;
                    frozenRoot.style.minHeight = `${bounds.height}px`;
                    frozenRoot.style.maxHeight = `${bounds.height}px`;
                }

                const rasterSnapshot: ChartExportRasterIslandSnapshot = {
                    bounds,
                    clipRect,
                    documentOrder: docOrder,
                    frozenRoot,
                    hasComplexTransform,
                    id,
                    layoutHeight,
                    layoutWidth,
                    plane,
                    role,
                    transform,
                    transformOrigin,
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

            // Animation suppression check (EXP-03 / R2-09): Only explicit Mona suppression marker
            const isAnimationSuppressed =
                node.getAttribute("data-mona-chart-export-animation-suppression") === "opacity";

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
                    documentOrder: docOrder,
                    fontFamily,
                    fontSize,
                    fontStyle,
                    fontWeight,
                    id,
                    opacity,
                    plane,
                    role,
                    text,
                    textColor: color,
                    zOrder
                };
                badges.push(badgeSnapshot);
                primitives.push({ kind: "badge", ...badgeSnapshot });
            } else {
                let textAlign: "left" | "center" | "right" = "center";
                if (computed.textAlign === "left" || computed.textAlign === "start") {
                    textAlign = "left";
                } else if (computed.textAlign === "right" || computed.textAlign === "end") {
                    textAlign = "right";
                }

                const vectorSnapshot: ChartExportVectorTextSnapshot = {
                    bounds,
                    color,
                    documentOrder: docOrder,
                    fontFamily,
                    fontSize,
                    fontStyle,
                    fontWeight,
                    id,
                    letterSpacing,
                    opacity,
                    plane,
                    role,
                    text,
                    textAlign,
                    zOrder
                };
                vectorTexts.push(vectorSnapshot);
                primitives.push({ kind: "text", ...vectorSnapshot });
            }
        }

        // Sort primitives strictly by plane order and document order (EXP-05 / R2-04)
        primitives.sort((a, b) => {
            const planeDiff = PLANE_ORDER[a.plane] - PLANE_ORDER[b.plane];
            if (planeDiff !== 0) return planeDiff;
            return a.documentOrder - b.documentOrder;
        });

        return {
            badges,
            primitives,
            rasterIslands,
            vectorTexts
        };
    }
}
