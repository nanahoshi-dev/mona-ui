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
import { ChartExportTemplateCapabilityAnalyzer } from "./chart-export-template-capability-analyzer";
import { classifyTransform } from "./chart-export-transform";

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

/**
 * Prefers the fractional computed layout size over integer offset dimensions (R4-04 9.5),
 * since percentage transforms and fractional CSS layout can depend on subpixel values.
 */
function resolveFractionalLayoutSize(computedSize: string): number | null {
    if (!computedSize) {
        return null;
    }
    const match = /^([-+0-9.eE]+)px$/.exec(computedSize.trim());
    if (!match) {
        return null;
    }
    const value = parseFloat(match[1]);
    return Number.isFinite(value) && value > 0 ? value : null;
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

            // Fail-closed transform classification (R4-04): only provably identity/pure-2D-translation
            // transforms are vector eligible; everything else routes through the transformed raster path.
            const hasComplexTransform = classifyTransform(computed.transform || node.style.transform) === "complex";

            if (mode === "raster" || role.endsWith("-template") || role === "legend-color-scale" || hasComplexTransform) {
                // Bounded template capability contract: unsupported visual features fail
                // explicitly at the snapshot boundary instead of exporting incomplete artifacts (R4-06)
                ChartExportTemplateCapabilityAnalyzer.assertSupported(node);

                // Synchronously clone and freeze raster island DOM (EXP-01, EXP-06, R2-02, R2-03)
                const frozenRoot = node.cloneNode(true) as HTMLElement;
                ChartExportDomFreezer.freeze(node, frozenRoot);

                const layoutWidth =
                    resolveFractionalLayoutSize(computed.width) || node.offsetWidth || bounds.width;
                const layoutHeight =
                    resolveFractionalLayoutSize(computed.height) || node.offsetHeight || bounds.height;
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
