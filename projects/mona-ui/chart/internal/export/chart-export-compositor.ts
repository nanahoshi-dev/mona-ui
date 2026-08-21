import type { ChartExportSnapshot } from "./chart-export-snapshot";
import type { NormalizedChartExportRequest } from "./chart-export-options";
import type { RenderedRasterIsland } from "./chart-export-raster-island-renderer";
import { SvgChartRenderBackend } from "../render/svg-chart-render-backend";
import { ChartStyleResolver } from "../style/chart-style-resolver";
import { setSvgAttribute } from "../render/svg/svg-attribute-utils";
import { createSvgElement } from "../render/svg/svg-element-utils";
import { ChartExportError } from "../../models/chart-export.models";

export class ChartExportCompositor {
    public static compose(
        snapshot: ChartExportSnapshot,
        request: NormalizedChartExportRequest,
        renderedIslands: readonly RenderedRasterIsland[] = []
    ): SVGSVGElement {
        if (typeof document === "undefined") {
            throw new ChartExportError(
                "unsupported-environment",
                "Cannot compose SVG in a non-browser environment."
            );
        }

        const rootSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        rootSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        rootSvg.setAttribute("width", String(request.width));
        rootSvg.setAttribute("height", String(request.height));
        rootSvg.setAttribute("viewBox", `0 0 ${snapshot.sourceWidth} ${snapshot.sourceHeight}`);
        rootSvg.setAttribute("preserveAspectRatio", "xMidYMid meet");

        if (request.accessibility) {
            rootSvg.setAttribute("role", "img");
        }

        // Defs root container
        const defsContainer = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        rootSvg.appendChild(defsContainer);

        // Render Vector Graphics via detached SvgChartRenderBackend if scene is present
        if (snapshot.scene && snapshot.scene.hasRenderableData) {
            const detachedSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const backend = new SvgChartRenderBackend(detachedSvg);
            const styleResolver = new ChartStyleResolver(null, snapshot.styleSnapshot);

            backend.resize({
                devicePixelRatio: 1,
                height: snapshot.plotSurfaceRect.height,
                width: snapshot.plotSurfaceRect.width
            });

            backend.render({
                presentation: snapshot.presentation,
                scene: snapshot.scene,
                styleResolver
            });

            // Move defs from detached backend to composed root defs
            const detachedDefs = detachedSvg.querySelector("defs");
            if (detachedDefs) {
                while (detachedDefs.firstChild) {
                    defsContainer.appendChild(detachedDefs.firstChild);
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
                    graphicsGroup.appendChild(child);
                }
            }

            rootSvg.appendChild(graphicsGroup);
        }

        // Vector text & badge layers
        const domVectorGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        domVectorGroup.setAttribute("data-export-layer", "dom-vector");

        // Render Badges
        for (const badge of snapshot.domLayers.badges) {
            const badgeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            badgeGroup.setAttribute("data-export-role", badge.role);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            setSvgAttribute(rect, "x", badge.bounds.x);
            setSvgAttribute(rect, "y", badge.bounds.y);
            setSvgAttribute(rect, "width", badge.bounds.width);
            setSvgAttribute(rect, "height", badge.bounds.height);
            if (badge.borderRadius) {
                setSvgAttribute(rect, "rx", badge.borderRadius);
            }
            rect.setAttribute("fill", badge.backgroundColor);
            if (badge.borderColor && badge.borderWidth) {
                rect.setAttribute("stroke", badge.borderColor);
                setSvgAttribute(rect, "stroke-width", badge.borderWidth);
            }
            if (badge.opacity < 1) {
                setSvgAttribute(rect, "opacity", badge.opacity);
            }
            badgeGroup.appendChild(rect);

            if (badge.text) {
                const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
                setSvgAttribute(textEl, "x", badge.bounds.x + badge.bounds.width / 2);
                setSvgAttribute(textEl, "y", badge.bounds.y + badge.bounds.height / 2);
                textEl.setAttribute("dominant-baseline", "central");
                textEl.setAttribute("text-anchor", "middle");
                textEl.setAttribute("fill", badge.textColor);
                textEl.setAttribute("font-family", badge.fontFamily);
                setSvgAttribute(textEl, "font-size", `${badge.fontSize}px`);
                textEl.setAttribute("font-weight", badge.fontWeight);
                if (badge.fontStyle && badge.fontStyle !== "normal") {
                    textEl.setAttribute("font-style", badge.fontStyle);
                }
                textEl.textContent = badge.text;
                badgeGroup.appendChild(textEl);
            }

            domVectorGroup.appendChild(badgeGroup);
        }

        // Render Vector Texts
        for (const vt of snapshot.domLayers.vectorTexts) {
            if (!vt.text) {
                continue;
            }
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.setAttribute("data-export-role", vt.role);

            let anchorX = vt.bounds.x + vt.bounds.width / 2;
            let textAnchor = "middle";

            if (vt.textAlign === "left") {
                anchorX = vt.bounds.x;
                textAnchor = "start";
            } else if (vt.textAlign === "right") {
                anchorX = vt.bounds.x + vt.bounds.width;
                textAnchor = "end";
            }

            const anchorY = vt.bounds.y + vt.bounds.height / 2;

            setSvgAttribute(textEl, "x", anchorX);
            setSvgAttribute(textEl, "y", anchorY);
            textEl.setAttribute("dominant-baseline", "central");
            textEl.setAttribute("text-anchor", textAnchor);
            textEl.setAttribute("fill", vt.color);
            textEl.setAttribute("font-family", vt.fontFamily);
            setSvgAttribute(textEl, "font-size", `${vt.fontSize}px`);
            textEl.setAttribute("font-weight", vt.fontWeight);
            if (vt.fontStyle && vt.fontStyle !== "normal") {
                textEl.setAttribute("font-style", vt.fontStyle);
            }
            if (vt.letterSpacing) {
                setSvgAttribute(textEl, "letter-spacing", `${vt.letterSpacing}px`);
            }
            if (vt.opacity < 1) {
                setSvgAttribute(textEl, "opacity", vt.opacity);
            }
            if (vt.rotation) {
                textEl.setAttribute(
                    "transform",
                    `rotate(${vt.rotation.angle} ${vt.rotation.cx} ${vt.rotation.cy})`
                );
            }

            textEl.textContent = vt.text;
            domVectorGroup.appendChild(textEl);
        }

        rootSvg.appendChild(domVectorGroup);

        // Render Raster Islands
        if (renderedIslands.length > 0) {
            const domRasterGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
            domRasterGroup.setAttribute("data-export-layer", "dom-raster");

            for (const island of renderedIslands) {
                const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                setSvgAttribute(img, "x", island.x);
                setSvgAttribute(img, "y", island.y);
                setSvgAttribute(img, "width", island.width);
                setSvgAttribute(img, "height", island.height);
                img.setAttribute("href", island.dataUrl);
                domRasterGroup.appendChild(img);
            }

            rootSvg.appendChild(domRasterGroup);
        }

        return rootSvg;
    }
}
