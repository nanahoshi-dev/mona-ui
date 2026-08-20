import { curveCatmullRom, curveCatmullRomClosed, curveLinear, curveLinearClosed, lineRadial } from "d3-shape";
import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { PolarAxisChartScene } from "../../../scene/chart-scene";
import type { ChartRadarSeriesScene, ChartContinuousPolarSeriesScene, SceneRadialPoint } from "../../../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { withAlpha } from "../../series/area-gradient";
import { createRadialSeriesGradientSpec } from "../../series/radial-series-gradient";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";

export class SvgPolarAxisRenderer {
    readonly #container: SVGGElement;
    readonly #backgroundGroup: SVGGElement;
    readonly #seriesGroup: SVGGElement;
    readonly #foregroundGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

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
        while (this.#backgroundGroup.firstChild) this.#backgroundGroup.firstChild.remove();
        while (this.#seriesGroup.firstChild) this.#seriesGroup.firstChild.remove();
        while (this.#foregroundGroup.firstChild) this.#foregroundGroup.firstChild.remove();
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#backgroundGroup.remove();
        this.#seriesGroup.remove();
        this.#foregroundGroup.remove();
        this.#highlightGroup.remove();
    }

    #renderBackground(scene: PolarAxisChartScene, styleResolver: ChartStyleResolver): void {
        while (this.#backgroundGroup.firstChild) this.#backgroundGroup.firstChild.remove();
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
            for (const tick of radialAxis.ticks) {
                if (tick.radius <= 0) continue;

                if (radialAxis.gridShape === "polygon" && angularAxis.ticks.length >= 3) {
                    const segments: string[] = [];
                    for (let i = 0; i < angularAxis.ticks.length; i++) {
                        const spoke = angularAxis.ticks[i];
                        const x = center.x + Math.sin(spoke.angle) * tick.radius;
                        const y = center.y - Math.cos(spoke.angle) * tick.radius;
                        segments.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
                    }
                    segments.push("Z");

                    const polyPath = createSvgElement("path");
                    setSvgAttribute(polyPath, "d", segments.join(" "));
                    setSvgAttribute(polyPath, "fill", "none");
                    setSvgAttribute(polyPath, "stroke", tick.isZero ? zeroLineColor : gridColor);
                    setSvgAttribute(polyPath, "stroke-width", tick.isZero ? 1.5 : 1);
                    this.#backgroundGroup.appendChild(polyPath);
                } else {
                    const circle = createSvgElement("circle");
                    setSvgAttribute(circle, "cx", center.x);
                    setSvgAttribute(circle, "cy", center.y);
                    setSvgAttribute(circle, "r", tick.radius);
                    setSvgAttribute(circle, "fill", "none");
                    setSvgAttribute(circle, "stroke", tick.isZero ? zeroLineColor : gridColor);
                    setSvgAttribute(circle, "stroke-width", tick.isZero ? 1.5 : 1);
                    this.#backgroundGroup.appendChild(circle);
                }
            }
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
                const spokes = createSvgElement("path");
                setSvgAttribute(spokes, "d", spokeSegments.join(" "));
                setSvgAttribute(spokes, "fill", "none");
                setSvgAttribute(spokes, "stroke", gridColor);
                setSvgAttribute(spokes, "stroke-width", 1);
                this.#backgroundGroup.appendChild(spokes);
            }
        }
    }

    #renderSeries(
        seriesList: readonly (ChartRadarSeriesScene | ChartContinuousPolarSeriesScene)[],
        center: { x: number; y: number },
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        while (this.#seriesGroup.firstChild) this.#seriesGroup.firstChild.remove();

        const surfaceColor =
            styleResolver.resolveCssVariable("--color-surface") ||
            styleResolver.resolveCssVariable("--color-card") ||
            "#ffffff";

        for (const s of seriesList) {
            const seriesContainer = createSvgElement("g");
            seriesContainer.setAttribute("data-series-id", s.id);
            setSvgAttribute(seriesContainer, "transform", `translate(${center.x}, ${center.y})`);
            setSvgAttribute(seriesContainer, "opacity", s.renderOpacity ?? 1);

            const definedPoints = s.points.filter(p => p.defined);
            if (definedPoints.length === 0) {
                continue;
            }

            const allDefined = s.points.length > 0 && s.points.every(p => p.defined);
            const isClosed = s.connectNulls || allDefined;
            const canFill = isClosed && (s.connectNulls ? definedPoints.length >= 3 : allDefined && s.points.length >= 3);
            const renderPoints = s.connectNulls ? definedPoints : s.points;

            const isSmooth = s.curve === "smooth" && (s.connectNulls ? definedPoints.length >= 3 : s.points.length >= 3);

            // Fill
            if (s.fillMode !== "none" && canFill) {
                const fillCurve = isSmooth ? curveCatmullRomClosed : curveLinearClosed;
                const fillGen = lineRadial<SceneRadialPoint>()
                    .angle(d => d.angle)
                    .radius(d => d.radius)
                    .curve(fillCurve)
                    .defined(d => d.defined);

                const fillD = fillGen(renderPoints as SceneRadialPoint[]) ?? "";
                if (fillD) {
                    const fillPath = createSvgElement("path");
                    setSvgAttribute(fillPath, "d", fillD);

                    if (s.fillMode === "gradient") {
                        const spec = createRadialSeriesGradientSpec(s.maxRenderedRadius, s.color, s.fillOpacity);
                        const gradUrl = defs.useRadialGradient(`polar-axis-grad-${s.id}`, {
                            cx: center.x,
                            cy: center.y,
                            gradientUnits: "userSpaceOnUse",
                            r: spec.outerRadius,
                            stops: spec.stops
                        });
                        setSvgAttribute(fillPath, "fill", gradUrl);
                    } else {
                        setSvgAttribute(fillPath, "fill", withAlpha(s.color, s.fillOpacity));
                    }
                    seriesContainer.appendChild(fillPath);
                }
            }

            // Stroke
            if (s.strokeWidth > 0 && definedPoints.length >= 2) {
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
                    const strokePath = createSvgElement("path");
                    setSvgAttribute(strokePath, "d", strokeD);
                    setSvgAttribute(strokePath, "fill", "none");
                    setSvgAttribute(strokePath, "stroke", s.color);
                    setSvgAttribute(strokePath, "stroke-width", s.strokeWidth);
                    seriesContainer.appendChild(strokePath);
                }
            }

            // Points
            if (s.showPoints && s.pointRadius > 0 && definedPoints.length >= 1) {
                for (const pt of definedPoints) {
                    const pointAlpha = pt.renderOpacity ?? 1;
                    if (pointAlpha <= 0) continue;

                    const circle = createSvgElement("circle");
                    setSvgAttribute(circle, "cx", pt.point.x);
                    setSvgAttribute(circle, "cy", pt.point.y);
                    setSvgAttribute(circle, "r", s.pointRadius);
                    setSvgAttribute(circle, "fill", s.color);
                    setSvgAttribute(circle, "stroke", surfaceColor);
                    setSvgAttribute(circle, "stroke-width", 2);
                    setSvgAttribute(circle, "opacity", pointAlpha);
                    seriesContainer.appendChild(circle);
                }
            }

            this.#seriesGroup.appendChild(seriesContainer);
        }
    }

    #renderForeground(scene: PolarAxisChartScene, styleResolver: ChartStyleResolver): void {
        while (this.#foregroundGroup.firstChild) this.#foregroundGroup.firstChild.remove();
        const { angularAxis, center, outerRadius, radialAxis } = scene;

        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.5)";

        // Outer Boundary Circle / Polygon
        if (angularAxis.visible && angularAxis.axisLine) {
            if (radialAxis.gridShape === "polygon" && angularAxis.ticks.length >= 3) {
                const segments: string[] = [];
                for (let i = 0; i < angularAxis.ticks.length; i++) {
                    const spoke = angularAxis.ticks[i];
                    const x = center.x + Math.sin(spoke.angle) * outerRadius;
                    const y = center.y - Math.cos(spoke.angle) * outerRadius;
                    segments.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
                }
                segments.push("Z");

                const polyPath = createSvgElement("path");
                setSvgAttribute(polyPath, "d", segments.join(" "));
                setSvgAttribute(polyPath, "fill", "none");
                setSvgAttribute(polyPath, "stroke", axisLineColor);
                setSvgAttribute(polyPath, "stroke-width", 1);
                this.#foregroundGroup.appendChild(polyPath);
            } else {
                const circle = createSvgElement("circle");
                setSvgAttribute(circle, "cx", center.x);
                setSvgAttribute(circle, "cy", center.y);
                setSvgAttribute(circle, "r", outerRadius);
                setSvgAttribute(circle, "fill", "none");
                setSvgAttribute(circle, "stroke", axisLineColor);
                setSvgAttribute(circle, "stroke-width", 1);
                this.#foregroundGroup.appendChild(circle);
            }
        }

        // Radial Reference Spoke
        if (radialAxis.visible && radialAxis.axisLine) {
            const angle = radialAxis.labelAngle;
            const endX = center.x + Math.sin(angle) * outerRadius;
            const endY = center.y - Math.cos(angle) * outerRadius;

            const spokeLine = createSvgElement("line");
            setSvgAttribute(spokeLine, "x1", center.x);
            setSvgAttribute(spokeLine, "y1", center.y);
            setSvgAttribute(spokeLine, "x2", endX);
            setSvgAttribute(spokeLine, "y2", endY);
            setSvgAttribute(spokeLine, "stroke", axisLineColor);
            setSvgAttribute(spokeLine, "stroke-width", 1.5);
            this.#foregroundGroup.appendChild(spokeLine);
        }
    }

    #renderHighlight(
        scene: PolarAxisChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
        if (!interactionState?.activeHitTarget) {
            return;
        }

        const activeHit = interactionState.activeHitTarget;
        if (!activeHit.point) {
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

        const circle = createSvgElement("circle");
        setSvgAttribute(circle, "cx", activeHit.point.x);
        setSvgAttribute(circle, "cy", activeHit.point.y);
        setSvgAttribute(circle, "r", 6);
        setSvgAttribute(circle, "fill", isKeyboard ? focusIndicatorColor : seriesColor);
        setSvgAttribute(circle, "stroke", surfaceColor);
        setSvgAttribute(circle, "stroke-width", 2);

        this.#highlightGroup.appendChild(circle);
    }
}
