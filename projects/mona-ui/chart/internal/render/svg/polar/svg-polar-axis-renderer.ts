import { curveCatmullRom, curveCatmullRomClosed, curveLinear, curveLinearClosed, lineRadial } from "d3-shape";
import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { PolarAxisChartScene } from "../../../scene/chart-scene";
import type { ChartRadarSeriesScene, ChartContinuousPolarSeriesScene, ChartRadialAxisTick, SceneRadialPoint } from "../../../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { withAlpha } from "../../series/area-gradient";
import { createRadialSeriesGradientSpec } from "../../series/radial-series-gradient";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

class SvgPolarAxisSeriesRenderer {
    readonly #container: SVGGElement;
    #fillPath: SVGPathElement | null = null;
    #strokePath: SVGPathElement | null = null;
    readonly #pointsGroup: SVGGElement;
    readonly #pointsKeyedGroup: SvgKeyedGroup<SceneRadialPoint, SVGCircleElement>;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#pointsGroup = createSvgElement("g");
        this.#pointsGroup.setAttribute("data-series-layer", "points");
        this.#container.appendChild(this.#pointsGroup);

        this.#pointsKeyedGroup = new SvgKeyedGroup<SceneRadialPoint, SVGCircleElement>(this.#pointsGroup);
    }

    public render(
        series: ChartRadarSeriesScene | ChartContinuousPolarSeriesScene,
        center: { x: number; y: number },
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        setSvgAttribute(this.#container, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(this.#container, "opacity", series.renderOpacity ?? 1);

        const surfaceColor =
            styleResolver.resolveCssVariable("--color-surface") ||
            styleResolver.resolveCssVariable("--color-card") ||
            "#ffffff";

        const definedPoints = series.points.filter(p => p.defined);
        if (definedPoints.length === 0) {
            this.clear();
            return;
        }

        const allDefined = series.points.length > 0 && series.points.every(p => p.defined);
        const isClosed = series.connectNulls || allDefined;
        const canFill = isClosed && (series.connectNulls ? definedPoints.length >= 3 : allDefined && series.points.length >= 3);
        const renderPoints = series.connectNulls ? definedPoints : series.points;
        const isSmooth = series.curve === "smooth" && (series.connectNulls ? definedPoints.length >= 3 : series.points.length >= 3);

        // 1. Fill
        if (series.fillMode !== "none" && canFill) {
            const fillCurve = isSmooth ? curveCatmullRomClosed : curveLinearClosed;
            const fillGen = lineRadial<SceneRadialPoint>()
                .angle(d => d.angle)
                .radius(d => d.radius)
                .curve(fillCurve)
                .defined(d => d.defined);

            const fillD = fillGen(renderPoints as SceneRadialPoint[]) ?? "";
            if (fillD) {
                if (!this.#fillPath) {
                    this.#fillPath = createSvgElement("path");
                    this.#container.insertBefore(this.#fillPath, this.#strokePath ?? this.#pointsGroup);
                }
                setSvgAttribute(this.#fillPath, "d", fillD);

                if (series.fillMode === "gradient") {
                    const spec = createRadialSeriesGradientSpec(series.maxRenderedRadius, series.color, series.fillOpacity);
                    const gradUrl = defs.useRadialGradient(`polar-axis-grad-${series.id}`, {
                        cx: 0,
                        cy: 0,
                        gradientUnits: "userSpaceOnUse",
                        r: spec.outerRadius,
                        stops: spec.stops
                    });
                    setSvgAttribute(this.#fillPath, "fill", gradUrl);
                    this.#fillPath.removeAttribute("fill-opacity");
                } else {
                    setSvgAttribute(this.#fillPath, "fill", withAlpha(series.color, series.fillOpacity));
                    this.#fillPath.removeAttribute("fill-opacity");
                }
            } else if (this.#fillPath) {
                this.#fillPath.remove();
                this.#fillPath = null;
            }
        } else if (this.#fillPath) {
            this.#fillPath.remove();
            this.#fillPath = null;
        }

        // 2. Stroke
        if (series.strokeWidth > 0 && definedPoints.length >= 2) {
            const lineCurve = isClosed
                ? (isSmooth ? curveCatmullRomClosed : curveLinearClosed)
                : (isSmooth ? curveCatmullRom : curveLinear);

            const lineGen = lineRadial<SceneRadialPoint>()
                .angle(d => d.angle)
                .radius(d => d.radius)
                .curve(lineCurve)
                .defined(d => d.defined);

            const strokeD = lineGen(renderPoints as SceneRadialPoint[]) ?? "";
            if (strokeD) {
                if (!this.#strokePath) {
                    this.#strokePath = createSvgElement("path");
                    this.#container.insertBefore(this.#strokePath, this.#pointsGroup);
                }
                setSvgAttribute(this.#strokePath, "d", strokeD);
                setSvgAttribute(this.#strokePath, "fill", "none");
                setSvgAttribute(this.#strokePath, "stroke", series.color);
                setSvgAttribute(this.#strokePath, "stroke-width", series.strokeWidth);
            } else if (this.#strokePath) {
                this.#strokePath.remove();
                this.#strokePath = null;
            }
        } else if (this.#strokePath) {
            this.#strokePath.remove();
            this.#strokePath = null;
        }

        // 3. Points
        if (series.showPoints && series.pointRadius > 0 && definedPoints.length >= 1) {
            const activePoints = definedPoints.filter(pt => (pt.renderOpacity ?? 1) > 0);
            this.#pointsKeyedGroup.reconcile(activePoints, {
                key: (pt, i) => pt.animationKey ?? pt.categoryKey ?? String(pt.dataIndex ?? i),
                tag: "circle",
                update: (circle, pt) => {
                    const pointAlpha = pt.renderOpacity ?? 1;
                    setSvgAttribute(circle, "cx", Math.sin(pt.angle) * pt.radius);
                    setSvgAttribute(circle, "cy", -Math.cos(pt.angle) * pt.radius);
                    setSvgAttribute(circle, "r", series.pointRadius);
                    setSvgAttribute(circle, "fill", series.color);
                    setSvgAttribute(circle, "stroke", surfaceColor);
                    setSvgAttribute(circle, "stroke-width", 2);
                    setSvgAttribute(circle, "opacity", pointAlpha);
                }
            });
        } else {
            this.#pointsKeyedGroup.clear();
        }
    }

    public clear(): void {
        if (this.#fillPath) {
            this.#fillPath.remove();
            this.#fillPath = null;
        }
        if (this.#strokePath) {
            this.#strokePath.remove();
            this.#strokePath = null;
        }
        this.#pointsKeyedGroup.clear();
    }

    public destroy(): void {
        this.clear();
        this.#pointsKeyedGroup.destroy();
        this.#pointsGroup.remove();
        this.#container.remove();
    }
}

interface SvgPolarAxisSeriesEntry {
    readonly container: SVGGElement;
    readonly renderer: SvgPolarAxisSeriesRenderer;
}

export class SvgPolarAxisRenderer {
    readonly #container: SVGGElement;
    readonly #backgroundGroup: SVGGElement;
    readonly #seriesGroup: SVGGElement;
    readonly #foregroundGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    readonly #radialGridKeyedGroup: SvgKeyedGroup<ChartRadialAxisTick, SVGElement>;
    #angularSpokesPath: SVGPathElement | null = null;
    #outerBoundaryElement: SVGElement | null = null;
    #radialRefSpokeLine: SVGLineElement | null = null;
    #highlightCircle: SVGCircleElement | null = null;

    readonly #seriesRenderers = new Map<string, SvgPolarAxisSeriesEntry>();

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#backgroundGroup = createSvgElement("g");
        this.#backgroundGroup.setAttribute("data-polar-layer", "background");
        this.#container.appendChild(this.#backgroundGroup);

        this.#seriesGroup = createSvgElement("g");
        this.#seriesGroup.setAttribute("data-polar-layer", "series");
        this.#container.appendChild(this.#seriesGroup);

        this.#foregroundGroup = createSvgElement("g");
        this.#foregroundGroup.setAttribute("data-polar-layer", "foreground");
        this.#container.appendChild(this.#foregroundGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-polar-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);

        this.#radialGridKeyedGroup = new SvgKeyedGroup<ChartRadialAxisTick, SVGElement>(this.#backgroundGroup);
    }

    public render(
        scene: PolarAxisChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { angularAxis, center, outerRadius, radialAxis, series } = scene;
        if (outerRadius <= 0) {
            this.clear();
            return;
        }

        // 1. Background Grid & Spokes
        this.#renderBackground(scene, styleResolver);

        // 2. Series
        this.#renderSeries(series, center, styleResolver, defs);

        // 3. Foreground Axes
        this.#renderForeground(scene, styleResolver);

        // 4. Interaction Highlight
        this.#renderHighlight(scene, interactionState, styleResolver);
    }

    public clear(): void {
        this.#radialGridKeyedGroup.clear();
        if (this.#angularSpokesPath) {
            this.#angularSpokesPath.remove();
            this.#angularSpokesPath = null;
        }
        for (const entry of this.#seriesRenderers.values()) {
            entry.renderer.clear();
        }
        if (this.#outerBoundaryElement) {
            this.#outerBoundaryElement.remove();
            this.#outerBoundaryElement = null;
        }
        if (this.#radialRefSpokeLine) {
            this.#radialRefSpokeLine.remove();
            this.#radialRefSpokeLine = null;
        }
        if (this.#highlightCircle) {
            this.#highlightCircle.remove();
            this.#highlightCircle = null;
        }
    }

    public destroy(): void {
        this.clear();
        this.#radialGridKeyedGroup.destroy();
        for (const entry of this.#seriesRenderers.values()) {
            entry.renderer.destroy();
            entry.container.remove();
        }
        this.#seriesRenderers.clear();
        this.#backgroundGroup.remove();
        this.#seriesGroup.remove();
        this.#foregroundGroup.remove();
        this.#highlightGroup.remove();
    }

    #renderBackground(scene: PolarAxisChartScene, styleResolver: ChartStyleResolver): void {
        const { angularAxis, center, outerRadius, radialAxis } = scene;

        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.2)";

        const zeroLineColor =
            styleResolver.resolveCssVariable("--mona-chart-zero-line-color") ||
            styleResolver.resolveCssVariable("--color-muted-foreground") ||
            "rgba(100, 100, 100, 0.6)";

        // Radial Grid Rings / Polygons
        if (radialAxis.visible && radialAxis.gridLines) {
            const validTicks = radialAxis.ticks.filter(t => t.radius > 0);
            const isPolygon = radialAxis.gridShape === "polygon" && angularAxis.ticks.length >= 3;

            this.#radialGridKeyedGroup.reconcile(validTicks, {
                key: (tick, i) => tick.tickKey ?? (tick.index !== undefined ? String(tick.index) : (tick.formattedValue ?? String(tick.value))),
                tag: isPolygon ? "path" : "circle",
                update: (element, tick) => {
                    if (isPolygon) {
                        const segments: string[] = [];
                        for (let i = 0; i < angularAxis.ticks.length; i++) {
                            const spoke = angularAxis.ticks[i];
                            const x = center.x + Math.sin(spoke.angle) * tick.radius;
                            const y = center.y - Math.cos(spoke.angle) * tick.radius;
                            segments.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
                        }
                        segments.push("Z");
                        setSvgAttribute(element, "d", segments.join(" "));
                        setSvgAttribute(element, "fill", "none");
                        setSvgAttribute(element, "stroke", tick.isZero ? zeroLineColor : gridColor);
                        setSvgAttribute(element, "stroke-width", tick.isZero ? 1.5 : 1);
                    } else {
                        setSvgAttribute(element, "cx", center.x);
                        setSvgAttribute(element, "cy", center.y);
                        setSvgAttribute(element, "r", tick.radius);
                        setSvgAttribute(element, "fill", "none");
                        setSvgAttribute(element, "stroke", tick.isZero ? zeroLineColor : gridColor);
                        setSvgAttribute(element, "stroke-width", tick.isZero ? 1.5 : 1);
                    }
                }
            });
        } else {
            this.#radialGridKeyedGroup.clear();
        }

        // Angular Spokes
        if (angularAxis.visible && angularAxis.gridLines) {
            const spokeSegments: string[] = [];
            for (const tick of angularAxis.ticks) {
                const endX = center.x + Math.sin(tick.angle) * outerRadius;
                const endY = center.y - Math.cos(tick.angle) * outerRadius;
                spokeSegments.push(`M ${center.x} ${center.y} L ${endX} ${endY}`);
            }
            if (spokeSegments.length > 0) {
                if (!this.#angularSpokesPath) {
                    this.#angularSpokesPath = createSvgElement("path");
                    this.#backgroundGroup.appendChild(this.#angularSpokesPath);
                }
                setSvgAttribute(this.#angularSpokesPath, "d", spokeSegments.join(" "));
                setSvgAttribute(this.#angularSpokesPath, "fill", "none");
                setSvgAttribute(this.#angularSpokesPath, "stroke", gridColor);
                setSvgAttribute(this.#angularSpokesPath, "stroke-width", 1);
            } else if (this.#angularSpokesPath) {
                this.#angularSpokesPath.remove();
                this.#angularSpokesPath = null;
            }
        } else if (this.#angularSpokesPath) {
            this.#angularSpokesPath.remove();
            this.#angularSpokesPath = null;
        }
    }

    #renderSeries(
        seriesList: readonly (ChartRadarSeriesScene | ChartContinuousPolarSeriesScene)[],
        center: { x: number; y: number },
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const activeIds = new Set<string>();

        for (let i = 0; i < seriesList.length; i++) {
            const s = seriesList[i];
            activeIds.add(s.id);

            let entry = this.#seriesRenderers.get(s.id);
            if (!entry) {
                const container = createSvgElement("g");
                container.setAttribute("data-series-id", s.id);
                this.#seriesGroup.appendChild(container);
                const renderer = new SvgPolarAxisSeriesRenderer(container);
                entry = { container, renderer };
                this.#seriesRenderers.set(s.id, entry);
            }

            // Ensure DOM ordering
            const currentNthChild = this.#seriesGroup.children[i];
            if (currentNthChild !== entry.container) {
                this.#seriesGroup.insertBefore(entry.container, currentNthChild ?? null);
            }

            entry.renderer.render(s, center, styleResolver, defs);
        }

        // Cleanup stale series
        for (const [id, entry] of this.#seriesRenderers.entries()) {
            if (!activeIds.has(id)) {
                entry.renderer.destroy();
                entry.container.remove();
                this.#seriesRenderers.delete(id);
            }
        }
    }

    #renderForeground(scene: PolarAxisChartScene, styleResolver: ChartStyleResolver): void {
        const { angularAxis, center, outerRadius, radialAxis } = scene;

        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.5)";

        // Outer Boundary Circle / Polygon
        if (angularAxis.visible && angularAxis.axisLine) {
            const isPolygon = radialAxis.gridShape === "polygon" && angularAxis.ticks.length >= 3;
            const requestedTag = isPolygon ? "path" : "circle";

            if (this.#outerBoundaryElement && this.#outerBoundaryElement.localName.toLowerCase() !== requestedTag) {
                this.#outerBoundaryElement.remove();
                this.#outerBoundaryElement = null;
            }

            if (!this.#outerBoundaryElement) {
                this.#outerBoundaryElement = createSvgElement(requestedTag as keyof SVGElementTagNameMap);
                this.#foregroundGroup.appendChild(this.#outerBoundaryElement);
            }

            if (isPolygon) {
                const segments: string[] = [];
                for (let i = 0; i < angularAxis.ticks.length; i++) {
                    const spoke = angularAxis.ticks[i];
                    const x = center.x + Math.sin(spoke.angle) * outerRadius;
                    const y = center.y - Math.cos(spoke.angle) * outerRadius;
                    segments.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
                }
                segments.push("Z");
                setSvgAttribute(this.#outerBoundaryElement, "d", segments.join(" "));
                setSvgAttribute(this.#outerBoundaryElement, "fill", "none");
                setSvgAttribute(this.#outerBoundaryElement, "stroke", axisLineColor);
                setSvgAttribute(this.#outerBoundaryElement, "stroke-width", 1);
            } else {
                setSvgAttribute(this.#outerBoundaryElement, "cx", center.x);
                setSvgAttribute(this.#outerBoundaryElement, "cy", center.y);
                setSvgAttribute(this.#outerBoundaryElement, "r", outerRadius);
                setSvgAttribute(this.#outerBoundaryElement, "fill", "none");
                setSvgAttribute(this.#outerBoundaryElement, "stroke", axisLineColor);
                setSvgAttribute(this.#outerBoundaryElement, "stroke-width", 1);
            }
        } else if (this.#outerBoundaryElement) {
            this.#outerBoundaryElement.remove();
            this.#outerBoundaryElement = null;
        }

        // Radial Reference Spoke
        if (radialAxis.visible && radialAxis.axisLine) {
            const angle = radialAxis.labelAngle;
            const endX = center.x + Math.sin(angle) * outerRadius;
            const endY = center.y - Math.cos(angle) * outerRadius;

            if (!this.#radialRefSpokeLine) {
                this.#radialRefSpokeLine = createSvgElement("line");
                this.#foregroundGroup.appendChild(this.#radialRefSpokeLine);
            }
            setSvgAttribute(this.#radialRefSpokeLine, "x1", center.x);
            setSvgAttribute(this.#radialRefSpokeLine, "y1", center.y);
            setSvgAttribute(this.#radialRefSpokeLine, "x2", endX);
            setSvgAttribute(this.#radialRefSpokeLine, "y2", endY);
            setSvgAttribute(this.#radialRefSpokeLine, "stroke", axisLineColor);
            setSvgAttribute(this.#radialRefSpokeLine, "stroke-width", 1.5);
        } else if (this.#radialRefSpokeLine) {
            this.#radialRefSpokeLine.remove();
            this.#radialRefSpokeLine = null;
        }
    }

    #renderHighlight(
        scene: PolarAxisChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const activeHit = interactionState?.activeHitTarget;
        if (!activeHit || !activeHit.point) {
            if (this.#highlightCircle) {
                this.#highlightCircle.remove();
                this.#highlightCircle = null;
            }
            return;
        }

        const focusIndicatorColor =
            styleResolver.resolveCssVariable("--color-focus-indicator") ||
            styleResolver.resolveCssVariable("--color-primary") ||
            "#3b82f6";

        const surfaceColor =
            styleResolver.resolveCssVariable("--color-surface") ||
            styleResolver.resolveCssVariable("--color-card") ||
            "#ffffff";

        const matchingSeries = scene.series.find(s => s.id === activeHit.seriesId);
        const seriesColor = matchingSeries?.color ?? "#3b82f6";
        const isKeyboard = interactionState.source === "keyboard";

        if (!this.#highlightCircle) {
            this.#highlightCircle = createSvgElement("circle");
            this.#highlightGroup.appendChild(this.#highlightCircle);
        }

        setSvgAttribute(this.#highlightCircle, "cx", activeHit.point.x);
        setSvgAttribute(this.#highlightCircle, "cy", activeHit.point.y);
        setSvgAttribute(this.#highlightCircle, "r", 6);
        setSvgAttribute(this.#highlightCircle, "fill", isKeyboard ? focusIndicatorColor : seriesColor);
        setSvgAttribute(this.#highlightCircle, "stroke", surfaceColor);
        setSvgAttribute(this.#highlightCircle, "stroke-width", 2);
    }
}
