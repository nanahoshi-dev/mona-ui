import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { CartesianXYChartScene } from "../../../scene/chart-scene";
import type { SceneHitTarget } from "../../../scene/scene-geometry";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildBarPath, buildRoundedRectPath } from "../../geometry/rounded-rect-path-builder";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

export class SvgCartesianInteractionRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneHitTarget, SVGGElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneHitTarget, SVGGElement>(container);
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }

    public render(
        scene: CartesianXYChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        plotClipUrl?: string
    ): void {
        if (
            !interactionState ||
            (!interactionState.activeHitTarget && (!interactionState.activeHits || interactionState.activeHits.length === 0))
        ) {
            this.#keyedGroup.clear();
            return;
        }

        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0) {
            this.#keyedGroup.clear();
            return;
        }

        const hits =
            interactionState.activeHits && interactionState.activeHits.length > 0
                ? interactionState.activeHits
                : interactionState.activeHitTarget
                  ? [interactionState.activeHitTarget]
                  : [];

        if (hits.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        const markerStrokeColor =
            styleResolver.resolveCssVariable("--mona-chart-marker-stroke-color") ||
            styleResolver.resolveCssVariable("--color-surface") ||
            "#ffffff";
        const barHighlightColor =
            styleResolver.resolveCssVariable("--mona-chart-bar-highlight-color") ||
            "rgba(255, 255, 255, 0.25)";
        const focusIndicatorColor =
            styleResolver.resolveCssVariable("--color-focus-indicator") ||
            styleResolver.resolveCssVariable("--color-ring") ||
            "#3b82f6";
        const isKeyboardSource = interactionState.source === "keyboard";

        this.#keyedGroup.reconcile(hits, {
            key: (hit, index) => `${hit.seriesId}:${hit.animationKey ?? hit.index ?? index}`,
            tag: "g",
            update: (group, hit) => {
                while (group.firstChild) {
                    group.firstChild.remove();
                }

                if (plotClipUrl) {
                    setSvgAttribute(group, "clip-path", plotClipUrl);
                }

                if (hit.seriesType === "rangeArea" && (hit.rangeBand || (hit.highPoint && hit.lowPoint))) {
                    const matchingSeries = series.find(s => s.id === hit.seriesId);
                    const color = isKeyboardSource
                        ? focusIndicatorColor
                        : (matchingSeries?.style.color ?? "#3b82f6");
                    const fromP = hit.rangeBand?.fromPoint ?? hit.highPoint!;
                    const toP = hit.rangeBand?.toPoint ?? hit.lowPoint!;

                    const connector = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    setSvgAttribute(connector, "x1", fromP.x);
                    setSvgAttribute(connector, "y1", fromP.y);
                    setSvgAttribute(connector, "x2", toP.x);
                    setSvgAttribute(connector, "y2", toP.y);
                    setSvgAttribute(connector, "stroke", color);
                    setSvgAttribute(connector, "stroke-width", isKeyboardSource ? 2 : 1.5);
                    group.appendChild(connector);

                    const circleFrom = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    setSvgAttribute(circleFrom, "cx", fromP.x);
                    setSvgAttribute(circleFrom, "cy", fromP.y);
                    setSvgAttribute(circleFrom, "r", 5);
                    setSvgAttribute(circleFrom, "fill", color);
                    setSvgAttribute(circleFrom, "stroke", markerStrokeColor);
                    setSvgAttribute(circleFrom, "stroke-width", 2);
                    group.appendChild(circleFrom);

                    if (fromP.y !== toP.y || fromP.x !== toP.x) {
                        const circleTo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(circleTo, "cx", toP.x);
                        setSvgAttribute(circleTo, "cy", toP.y);
                        setSvgAttribute(circleTo, "r", 5);
                        setSvgAttribute(circleTo, "fill", color);
                        setSvgAttribute(circleTo, "stroke", markerStrokeColor);
                        setSvgAttribute(circleTo, "stroke-width", 2);
                        group.appendChild(circleTo);
                    }
                } else if (hit.point) {
                    const isMarkerSeries = hit.seriesType === "scatter" || hit.seriesType === "bubble";
                    if (isMarkerSeries) {
                        const matchingSeries = series.find(s => s.id === hit.seriesId);
                        const seriesColor = matchingSeries?.style.color ?? hit.color ?? "#3b82f6";
                        const activeRadius = (hit.visualRadius ?? hit.radius ?? 5) + 3;

                        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(circle, "cx", hit.point.x);
                        setSvgAttribute(circle, "cy", hit.point.y);
                        setSvgAttribute(circle, "r", activeRadius);
                        setSvgAttribute(circle, "fill", "none");
                        setSvgAttribute(circle, "stroke", isKeyboardSource ? focusIndicatorColor : seriesColor);
                        setSvgAttribute(circle, "stroke-width", isKeyboardSource ? 2.5 : 2);
                        group.appendChild(circle);
                    } else {
                        const matchingSeries = series.find(s => s.id === hit.seriesId);
                        const color = isKeyboardSource
                            ? focusIndicatorColor
                            : (matchingSeries?.style.color ?? "#3b82f6");

                        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                        setSvgAttribute(circle, "cx", hit.point.x);
                        setSvgAttribute(circle, "cy", hit.point.y);
                        setSvgAttribute(circle, "r", 5);
                        setSvgAttribute(circle, "fill", color);
                        setSvgAttribute(circle, "stroke", markerStrokeColor);
                        setSvgAttribute(circle, "stroke-width", 2);
                        group.appendChild(circle);
                    }
                } else if (hit.bounds || hit.visualBounds) {
                    const barRect = hit.visualBounds ?? hit.bounds;
                    if (barRect) {
                        const isHorizontalBar = hit.barOrientation === "horizontal" || scene.orientation === "horizontal";
                        const isZeroExtent = isHorizontalBar ? barRect.width <= 0.001 : barRect.height <= 0.001;

                        if (isZeroExtent) {
                            const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
                            if (isHorizontalBar) {
                                const x = Math.round(barRect.x);
                                setSvgAttribute(lineEl, "x1", x);
                                setSvgAttribute(lineEl, "y1", barRect.y);
                                setSvgAttribute(lineEl, "x2", x);
                                setSvgAttribute(lineEl, "y2", barRect.y + barRect.height);
                            } else {
                                const y = Math.round(barRect.y);
                                setSvgAttribute(lineEl, "x1", barRect.x);
                                setSvgAttribute(lineEl, "y1", y);
                                setSvgAttribute(lineEl, "x2", barRect.x + barRect.width);
                                setSvgAttribute(lineEl, "y2", y);
                            }
                            setSvgAttribute(lineEl, "stroke", isKeyboardSource ? focusIndicatorColor : barHighlightColor);
                            setSvgAttribute(lineEl, "stroke-width", isKeyboardSource ? 2.5 : 2);
                            setSvgAttribute(lineEl, "shape-rendering", "crispEdges");
                            group.appendChild(lineEl);
                        } else {
                            const radius = hit.borderRadius ?? 4;
                            const cornerRadii = hit.cornerRadii ?? (hit.seriesType === "rangeBar" && radius > 0 ? {
                                bottomLeft: radius,
                                bottomRight: radius,
                                topLeft: radius,
                                topRight: radius
                            } : undefined);
                            const isPos = hit.isPositive ?? true;

                            const d = cornerRadii
                                ? buildRoundedRectPath(barRect.x, barRect.y, barRect.width, barRect.height, cornerRadii)
                                : buildBarPath({
                                    height: barRect.height,
                                    isPositive: isPos,
                                    orientation: isHorizontalBar ? "horizontal" : "vertical",
                                    radius,
                                    width: barRect.width,
                                    x: barRect.x,
                                    y: barRect.y
                                });

                            const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
                            setSvgAttribute(pathEl, "d", d);

                            if (isKeyboardSource) {
                                setSvgAttribute(pathEl, "fill", "none");
                                setSvgAttribute(pathEl, "stroke", focusIndicatorColor);
                                setSvgAttribute(pathEl, "stroke-width", 2);
                            } else {
                                setSvgAttribute(pathEl, "fill", barHighlightColor);
                                setSvgAttribute(pathEl, "stroke", "none");
                                setSvgAttribute(pathEl, "stroke-width", 0);
                            }
                            group.appendChild(pathEl);
                        }
                    }
                }
            }
        });
    }
}
