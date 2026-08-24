import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { RenderedRasterIsland } from "./chart-export-raster-island-renderer";
import type { ChartRenderPresentationState } from "../render/chart-render-presentation-state";
import { SvgChartRenderBackend } from "../render/svg-chart-render-backend";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { setSvgAttribute } from "../render/svg/svg-attribute-utils";
import { ChartExportError } from "../../models/chart-export.models";

import { resolveChartExportContainTransform } from "./chart-export-geometry";

export class ChartExportCompositor {
    public static compose(
        snapshot: ChartExportSnapshot,
        request: NormalizedChartExportRequest,
        renderedIslands: readonly RenderedRasterIsland[] = []
    ): SVGSVGElement {
        if (typeof document === "undefined") {
            throw new ChartExportError("unsupported-environment", "Cannot compose SVG in a non-browser environment.");
        }

        // Local clip ID counter to guarantee deterministic output across export transactions (R5-14)
        let clipIdCounter = 0;

        const outW = request.width;
        const outH = request.height;
        const srcW = snapshot.sourceWidth;
        const srcH = snapshot.sourceHeight;

        const rootSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        rootSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        rootSvg.setAttribute("width", String(outW));
        rootSvg.setAttribute("height", String(outH));
        rootSvg.setAttribute("viewBox", `0 0 ${outW} ${outH}`);
        rootSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        if (request.accessibility) {
            rootSvg.setAttribute("role", "img");
        }

        // Defs root container
        const defsContainer = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        rootSvg.appendChild(defsContainer);

        // Compute contain scaling and centering for mismatched aspect ratios (EXP-09)
        const contain = resolveChartExportContainTransform(srcW, srcH, outW, outH);

        const chartRootGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        chartRootGroup.setAttribute("data-export-layer", "chart-root");
        if (contain.offsetX !== 0 || contain.offsetY !== 0 || contain.scale !== 1) {
            chartRootGroup.setAttribute(
                "transform",
                `translate(${contain.offsetX}, ${contain.offsetY}) scale(${contain.scale})`
            );
        }
        rootSvg.appendChild(chartRootGroup);

        // 1. Render Vector Graphics via detached SvgChartRenderBackend if scene is present
        if (snapshot.scene && snapshot.scene.hasRenderableData) {
            const detachedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const backend = new SvgChartRenderBackend(detachedSvg);
            const styleResolver = new ChartStyleResolver(null, snapshot.styleSnapshot);

            try {
                backend.resize({
                    devicePixelRatio: 1,
                    height: snapshot.plotSurfaceRect.height,
                    width: snapshot.plotSurfaceRect.width
                });

                // Pass frozen presentation snapshot (EXP-02)
                const presentationState: ChartRenderPresentationState = {
                    activeBrushBounds: snapshot.presentation.activeBrushBounds,
                    annotationBadgeAnchors: snapshot.presentation.annotationBadgeAnchors,
                    brushRegistration: null,
                    brushSnapshot: snapshot.presentation.brush,
                    cartesianDataLabels: snapshot.presentation.cartesianDataLabels,
                    cartesianOverlay: snapshot.presentation.cartesianOverlay,
                    crosshair: snapshot.presentation.crosshair,
                    crosshairRegistration: null,
                    crosshairSnapshot: snapshot.presentation.crosshairStyle,
                    interaction: null,
                    selectionOptions: snapshot.presentation.selectionOptions,
                    selectionScene: snapshot.presentation.selectionScene
                };

                backend.render({
                    presentation: presentationState,
                    scene: snapshot.scene,
                    styleResolver
                });

                // Move defs from detached backend to composed root defs (clone so backend.destroy does not delete)
                const detachedDefs = detachedSvg.querySelector("defs");
                if (detachedDefs) {
                    for (const child of Array.from(detachedDefs.childNodes)) {
                        defsContainer.appendChild(child.cloneNode(true));
                    }
                }

                // Create graphics container group translated by plot surface offset
                const graphicsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                graphicsGroup.setAttribute("data-export-layer", "graphics");
                if (snapshot.plotSurfaceRect.x !== 0 || snapshot.plotSurfaceRect.y !== 0) {
                    graphicsGroup.setAttribute(
                        "transform",
                        `translate(${snapshot.plotSurfaceRect.x}, ${snapshot.plotSurfaceRect.y})`
                    );
                }

                // Clone layers from detached SVG (except defs)
                const children = Array.from(detachedSvg.childNodes);
                for (const child of children) {
                    if (child.nodeName.toLowerCase() !== "defs") {
                        graphicsGroup.appendChild(child.cloneNode(true));
                    }
                }

                chartRootGroup.appendChild(graphicsGroup);
            } finally {
                backend.destroy();
            }
        }

        // 2. Render DOM Overlays in unified document stacking order (EXP-05)
        const domOverlayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        domOverlayGroup.setAttribute("data-export-layer", "dom-overlay");

        const islandMap = new Map<string, RenderedRasterIsland>();
        for (const island of renderedIslands) {
            if (islandMap.has(island.id)) {
                throw new ChartExportError(
                    "svg-composition-failed",
                    `Duplicate rendered raster island ID detected: '${island.id}'.`
                );
            }
            islandMap.set(island.id, island);
        }

        for (const prim of snapshot.domLayers.primitives) {
            if (prim.kind === "badge") {
                const badgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
                badgeGroup.setAttribute("data-export-role", prim.role);

                const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                setSvgAttribute(rect, "x", prim.bounds.x);
                setSvgAttribute(rect, "y", prim.bounds.y);
                setSvgAttribute(rect, "width", prim.bounds.width);
                setSvgAttribute(rect, "height", prim.bounds.height);
                if (prim.borderRadius) {
                    setSvgAttribute(rect, "rx", prim.borderRadius);
                }
                rect.setAttribute("fill", prim.backgroundColor);
                if (prim.borderColor && prim.borderWidth) {
                    rect.setAttribute("stroke", prim.borderColor);
                    setSvgAttribute(rect, "stroke-width", prim.borderWidth);
                }
                if (prim.opacity < 1) {
                    setSvgAttribute(rect, "opacity", prim.opacity);
                }
                badgeGroup.appendChild(rect);

                if (prim.text) {
                    const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                    setSvgAttribute(textEl, "x", prim.bounds.x + prim.bounds.width / 2);
                    setSvgAttribute(textEl, "y", prim.bounds.y + prim.bounds.height / 2);
                    textEl.setAttribute("dominant-baseline", "central");
                    textEl.setAttribute("text-anchor", "middle");
                    textEl.setAttribute("fill", prim.textColor);
                    textEl.setAttribute("font-family", prim.fontFamily);
                    setSvgAttribute(textEl, "font-size", `${prim.fontSize}px`);
                    textEl.setAttribute("font-weight", prim.fontWeight);
                    if (prim.fontStyle && prim.fontStyle !== "normal") {
                        textEl.setAttribute("font-style", prim.fontStyle);
                    }
                    textEl.textContent = prim.text;
                    badgeGroup.appendChild(textEl);
                }

                domOverlayGroup.appendChild(badgeGroup);
            } else if (prim.kind === "text") {
                if (!prim.text) {
                    continue;
                }
                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                textEl.setAttribute("data-export-role", prim.role);

                let anchorX = prim.bounds.x + prim.bounds.width / 2;
                let textAnchor = "middle";

                if (prim.textAlign === "left") {
                    anchorX = prim.bounds.x;
                    textAnchor = "start";
                } else if (prim.textAlign === "right") {
                    anchorX = prim.bounds.x + prim.bounds.width;
                    textAnchor = "end";
                }

                const anchorY = prim.bounds.y + prim.bounds.height / 2;

                setSvgAttribute(textEl, "x", anchorX);
                setSvgAttribute(textEl, "y", anchorY);
                textEl.setAttribute("dominant-baseline", "central");
                textEl.setAttribute("text-anchor", textAnchor);
                textEl.setAttribute("fill", prim.color);
                textEl.setAttribute("font-family", prim.fontFamily);
                setSvgAttribute(textEl, "font-size", `${prim.fontSize}px`);
                textEl.setAttribute("font-weight", prim.fontWeight);
                if (prim.fontStyle && prim.fontStyle !== "normal") {
                    textEl.setAttribute("font-style", prim.fontStyle);
                }
                if (prim.letterSpacing) {
                    setSvgAttribute(textEl, "letter-spacing", `${prim.letterSpacing}px`);
                }
                if (prim.opacity < 1) {
                    setSvgAttribute(textEl, "opacity", prim.opacity);
                }

                textEl.textContent = prim.text;
                domOverlayGroup.appendChild(textEl);
            } else if (prim.kind === "raster") {
                const island = islandMap.get(prim.id);
                if (!island) {
                    throw new ChartExportError(
                        "svg-composition-failed",
                        `Missing rendered raster island result for primitive ID '${prim.id}'.`
                    );
                }

                const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                img.setAttribute("data-export-role", prim.role);
                setSvgAttribute(img, "x", island.x);
                setSvgAttribute(img, "y", island.y);
                setSvgAttribute(img, "width", island.width);
                setSvgAttribute(img, "height", island.height);
                img.setAttribute("href", island.dataUrl);

                // Plot-local clipping if clipRect is present (EXP-14)
                if (island.clipRect) {
                    const clipId = `mona-export-clip-${++clipIdCounter}`;
                    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
                    clipPath.setAttribute("id", clipId);
                    const clipRectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    setSvgAttribute(clipRectEl, "x", island.clipRect.x);
                    setSvgAttribute(clipRectEl, "y", island.clipRect.y);
                    setSvgAttribute(clipRectEl, "width", island.clipRect.width);
                    setSvgAttribute(clipRectEl, "height", island.clipRect.height);
                    clipPath.appendChild(clipRectEl);
                    defsContainer.appendChild(clipPath);
                    img.setAttribute("clip-path", `url(#${clipId})`);
                }

                domOverlayGroup.appendChild(img);
            }
        }

        chartRootGroup.appendChild(domOverlayGroup);

        return rootSvg;
    }
}
