import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type {
    ChartGaugeSeriesScene,
    ChartRadialBarSeriesScene,
    ChartRoseSeriesScene,
    PolarArcChartScene
} from "../../../scene/polar-arc-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildArcPath } from "../../geometry/arc-path-builder";
import { createPolarGradientSpec } from "../../series/polar-gradient";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";

export class SvgPolarArcRenderer {
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
        scene: PolarArcChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { arcMode, center, innerRadius, outerRadius, series } = scene;
        if (outerRadius <= 0) {
            this.clear();
            return;
        }

        const isRose = arcMode === "rose";
        let roseStartAngleRad = 0;
        let roseEndAngleRad = Math.PI * 2;

        if (isRose && series.length > 0 && series[0].type === "rose") {
            const roseScene = series[0] as ChartRoseSeriesScene;
            if (roseScene.angularCategories.length > 0) {
                roseStartAngleRad = roseScene.angularCategories[0].startAngle;
                roseEndAngleRad = roseScene.angularCategories[roseScene.angularCategories.length - 1].endAngle;
            }
        }

        // 1. Background Grid for Rose
        this.#renderRoseBackground(scene, roseStartAngleRad, roseEndAngleRad, styleResolver);

        // 2. Series (RadialBar, Rose, Gauge)
        while (this.#seriesGroup.firstChild) {
            this.#seriesGroup.firstChild.remove();
        }

        for (const s of series) {
            if (s.type === "radialBar") {
                this.#renderRadialBarSeries(s, center, interactionState, styleResolver, defs);
            } else if (s.type === "rose") {
                this.#renderRoseSeries(s, center, interactionState, styleResolver, defs);
            } else if (s.type === "gauge") {
                this.#renderGaugeSeries(s, center, interactionState, styleResolver, defs);
            }
        }

        // 3. Foreground Axis for Rose
        this.#renderRoseForeground(scene, roseStartAngleRad, roseEndAngleRad, styleResolver);

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

    #renderRoseBackground(
        scene: PolarArcChartScene,
        startAngleRad: number,
        endAngleRad: number,
        styleResolver: ChartStyleResolver
    ): void {
        while (this.#backgroundGroup.firstChild) this.#backgroundGroup.firstChild.remove();
        if (scene.arcMode !== "rose" || (!scene.radialAxis && !scene.angularAxis)) {
            return;
        }

        const { angularAxis, center, innerRadius, outerRadius, radialAxis } = scene;
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.2)";

        // Radial Grid Rings
        if (radialAxis && radialAxis.visible && radialAxis.gridLines) {
            for (const tick of radialAxis.ticks) {
                if (tick.radius <= 0) continue;
                const d = buildArcPath({
                    cornerRadius: 0,
                    endAngle: endAngleRad,
                    innerRadius: tick.radius,
                    outerRadius: tick.radius,
                    padAngle: 0,
                    startAngle: startAngleRad
                });
                if (d) {
                    const ringPath = createSvgElement("path");
                    setSvgAttribute(ringPath, "d", d);
                    setSvgAttribute(ringPath, "transform", `translate(${center.x}, ${center.y})`);
                    setSvgAttribute(ringPath, "fill", "none");
                    setSvgAttribute(ringPath, "stroke", gridColor);
                    setSvgAttribute(ringPath, "stroke-width", 1);
                    this.#backgroundGroup.appendChild(ringPath);
                }
            }
        }

        // Angular Spokes
        if (angularAxis && angularAxis.visible && angularAxis.gridLines) {
            for (const tick of angularAxis.ticks) {
                const startX = center.x + Math.sin(tick.angle) * innerRadius;
                const startY = center.y - Math.cos(tick.angle) * innerRadius;
                const endX = center.x + Math.sin(tick.angle) * outerRadius;
                const endY = center.y - Math.cos(tick.angle) * outerRadius;

                const spoke = createSvgElement("line");
                setSvgAttribute(spoke, "x1", startX);
                setSvgAttribute(spoke, "y1", startY);
                setSvgAttribute(spoke, "x2", endX);
                setSvgAttribute(spoke, "y2", endY);
                setSvgAttribute(spoke, "stroke", gridColor);
                setSvgAttribute(spoke, "stroke-width", 1);
                this.#backgroundGroup.appendChild(spoke);
            }
        }
    }

    #renderRoseForeground(
        scene: PolarArcChartScene,
        startAngleRad: number,
        endAngleRad: number,
        styleResolver: ChartStyleResolver
    ): void {
        while (this.#foregroundGroup.firstChild) this.#foregroundGroup.firstChild.remove();
        if (scene.arcMode !== "rose" || (!scene.radialAxis && !scene.angularAxis)) {
            return;
        }

        const { angularAxis, center, innerRadius, outerRadius, radialAxis } = scene;
        const axisLineColor =
            styleResolver.resolveCssVariable("--mona-chart-axis-line-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.5)";

        // Outer Boundary Arc
        if (angularAxis && angularAxis.visible && angularAxis.axisLine) {
            const d = buildArcPath({
                cornerRadius: 0,
                endAngle: endAngleRad,
                innerRadius: outerRadius,
                outerRadius,
                padAngle: 0,
                startAngle: startAngleRad
            });
            if (d) {
                const outerArc = createSvgElement("path");
                setSvgAttribute(outerArc, "d", d);
                setSvgAttribute(outerArc, "transform", `translate(${center.x}, ${center.y})`);
                setSvgAttribute(outerArc, "fill", "none");
                setSvgAttribute(outerArc, "stroke", axisLineColor);
                setSvgAttribute(outerArc, "stroke-width", 1);
                this.#foregroundGroup.appendChild(outerArc);
            }
        }
    }

    #renderRadialBarSeries(
        series: ChartRadialBarSeriesScene,
        center: { x: number; y: number },
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const seriesContainer = createSvgElement("g");
        seriesContainer.setAttribute("data-series-id", series.id);
        setSvgAttribute(seriesContainer, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(seriesContainer, "opacity", series.renderOpacity ?? 1);

        // 1. Background Tracks
        for (const track of series.tracks) {
            const d = buildArcPath({
                cornerRadius: 0,
                endAngle: track.endAngle,
                innerRadius: track.innerRadius,
                outerRadius: track.outerRadius,
                padAngle: 0,
                startAngle: track.startAngle
            });
            if (d) {
                const trackPath = createSvgElement("path");
                setSvgAttribute(trackPath, "d", d);
                setSvgAttribute(trackPath, "fill", track.color);
                setSvgAttribute(trackPath, "fill-opacity", track.opacity);
                seriesContainer.appendChild(trackPath);
            }
        }

        // 2. Value Arcs
        for (const arcData of series.marks) {
            if (!arcData.visible || arcData.endAngle <= arcData.startAngle) {
                continue;
            }
            const d = buildArcPath({
                cornerRadius: arcData.cornerRadius,
                endAngle: arcData.endAngle,
                innerRadius: arcData.innerRadius,
                outerRadius: arcData.outerRadius,
                padAngle: arcData.padAngle,
                startAngle: arcData.startAngle
            });
            if (d) {
                const arcPath = createSvgElement("path");
                setSvgAttribute(arcPath, "d", d);

                if (series.fillMode === "gradient") {
                    const spec = createPolarGradientSpec(
                        arcData.innerRadius,
                        arcData.outerRadius,
                        arcData.color,
                        series.style.fillOpacity
                    );
                    const gradUrl = defs.useRadialGradient(`radial-bar-grad-${series.id}-${arcData.itemId}`, {
                        cx: 0,
                        cy: 0,
                        gradientUnits: "userSpaceOnUse",
                        r: spec.outerRadius,
                        stops: spec.stops
                    });
                    setSvgAttribute(arcPath, "fill", gradUrl);
                } else {
                    setSvgAttribute(arcPath, "fill", arcData.color);
                    setSvgAttribute(arcPath, "fill-opacity", series.style.fillOpacity);
                }

                const strokeColor = series.style.strokeSource === "explicit" ? series.style.strokeColor : arcData.color;
                if (series.style.strokeWidth > 0 && strokeColor && strokeColor !== "none") {
                    setSvgAttribute(arcPath, "stroke", strokeColor);
                    setSvgAttribute(arcPath, "stroke-width", series.style.strokeWidth);
                } else {
                    setSvgAttribute(arcPath, "stroke", "none");
                    setSvgAttribute(arcPath, "stroke-width", 0);
                }

                setSvgAttribute(arcPath, "opacity", arcData.renderOpacity ?? 1);
                seriesContainer.appendChild(arcPath);
            }
        }

        this.#seriesGroup.appendChild(seriesContainer);
    }

    #renderRoseSeries(
        series: ChartRoseSeriesScene,
        center: { x: number; y: number },
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const seriesContainer = createSvgElement("g");
        seriesContainer.setAttribute("data-series-id", series.id);
        setSvgAttribute(seriesContainer, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(seriesContainer, "opacity", series.renderOpacity ?? 1);

        for (const petal of series.marks) {
            if (!petal.visible || petal.endAngle <= petal.startAngle) {
                continue;
            }
            const d = buildArcPath({
                cornerRadius: petal.cornerRadius,
                endAngle: petal.endAngle,
                innerRadius: petal.innerRadius,
                outerRadius: petal.outerRadius,
                padAngle: petal.padAngle,
                startAngle: petal.startAngle
            });
            if (d) {
                const petalPath = createSvgElement("path");
                setSvgAttribute(petalPath, "d", d);

                if (series.fillMode === "gradient") {
                    const spec = createPolarGradientSpec(
                        petal.innerRadius,
                        petal.outerRadius,
                        petal.color,
                        series.style.fillOpacity
                    );
                    const gradUrl = defs.useRadialGradient(`rose-grad-${series.id}-${petal.itemId}`, {
                        cx: 0,
                        cy: 0,
                        gradientUnits: "userSpaceOnUse",
                        r: spec.outerRadius,
                        stops: spec.stops
                    });
                    setSvgAttribute(petalPath, "fill", gradUrl);
                } else {
                    setSvgAttribute(petalPath, "fill", petal.color);
                    setSvgAttribute(petalPath, "fill-opacity", series.style.fillOpacity);
                }

                const strokeColor = series.style.strokeSource === "explicit" ? series.style.strokeColor : petal.color;
                if (series.style.strokeWidth > 0 && strokeColor && strokeColor !== "none") {
                    setSvgAttribute(petalPath, "stroke", strokeColor);
                    setSvgAttribute(petalPath, "stroke-width", series.style.strokeWidth);
                } else {
                    setSvgAttribute(petalPath, "stroke", "none");
                    setSvgAttribute(petalPath, "stroke-width", 0);
                }

                setSvgAttribute(petalPath, "opacity", petal.renderOpacity ?? 1);
                seriesContainer.appendChild(petalPath);
            }
        }

        this.#seriesGroup.appendChild(seriesContainer);
    }

    #renderGaugeSeries(
        series: ChartGaugeSeriesScene,
        center: { x: number; y: number },
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { fillMode, indicator, needle, style, track, value } = series;
        const seriesOpacity = series.renderOpacity ?? 1;

        const seriesContainer = createSvgElement("g");
        seriesContainer.setAttribute("data-series-id", series.id);
        setSvgAttribute(seriesContainer, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(seriesContainer, "opacity", seriesOpacity);

        // 1. Background Track
        if (track) {
            const d = buildArcPath({
                cornerRadius: 0,
                endAngle: track.endAngle,
                innerRadius: track.innerRadius,
                outerRadius: track.outerRadius,
                padAngle: 0,
                startAngle: track.startAngle
            });
            if (d) {
                const trackPath = createSvgElement("path");
                setSvgAttribute(trackPath, "d", d);
                setSvgAttribute(trackPath, "fill", track.color);
                setSvgAttribute(trackPath, "fill-opacity", track.opacity);
                seriesContainer.appendChild(trackPath);
            }
        }

        // 2. Value Arc
        if ((indicator === "arc" || indicator === "both") && value && value.endAngle > value.startAngle) {
            const valOpacity = value.renderOpacity ?? 1;
            const d = buildArcPath({
                cornerRadius: value.cornerRadius,
                endAngle: value.endAngle,
                innerRadius: value.innerRadius,
                outerRadius: value.outerRadius,
                padAngle: 0,
                startAngle: value.startAngle
            });
            if (d) {
                const valuePath = createSvgElement("path");
                setSvgAttribute(valuePath, "d", d);

                if (fillMode === "gradient") {
                    const spec = createPolarGradientSpec(
                        value.innerRadius,
                        value.outerRadius,
                        style.color,
                        style.fillOpacity
                    );
                    const gradUrl = defs.useRadialGradient(`gauge-grad-${series.id}`, {
                        cx: 0,
                        cy: 0,
                        gradientUnits: "userSpaceOnUse",
                        r: spec.outerRadius,
                        stops: spec.stops
                    });
                    setSvgAttribute(valuePath, "fill", gradUrl);
                } else {
                    setSvgAttribute(valuePath, "fill", style.color);
                    setSvgAttribute(valuePath, "fill-opacity", style.fillOpacity);
                }

                setSvgAttribute(valuePath, "opacity", valOpacity);
                seriesContainer.appendChild(valuePath);
            }
        }

        // 3. Needle & Hub
        if ((indicator === "needle" || indicator === "both") && needle) {
            const needleGroup = createSvgElement("g");
            setSvgAttribute(needleGroup, "transform", `rotate(${(needle.angle * 180) / Math.PI})`);

            const needlePath = createSvgElement("path");
            const dNeedle = `M ${-needle.width / 2} 0 L 0 ${-needle.length} L ${needle.width / 2} 0 Z`;
            setSvgAttribute(needlePath, "d", dNeedle);
            setSvgAttribute(needlePath, "fill", needle.color);
            needleGroup.appendChild(needlePath);

            const hubCircle = createSvgElement("circle");
            setSvgAttribute(hubCircle, "cx", 0);
            setSvgAttribute(hubCircle, "cy", 0);
            setSvgAttribute(hubCircle, "r", needle.hubRadius);
            setSvgAttribute(hubCircle, "fill", needle.hubColor);
            needleGroup.appendChild(hubCircle);

            seriesContainer.appendChild(needleGroup);
        }

        this.#seriesGroup.appendChild(seriesContainer);
    }

    #renderHighlight(
        scene: PolarArcChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        while (this.#highlightGroup.firstChild) {
            this.#highlightGroup.firstChild.remove();
        }
        if (!interactionState?.activeHitTarget) {
            return;
        }

        const activeHit = interactionState.activeHitTarget;
        const targetSeries = scene.series.find(s => s.id === activeHit.seriesId);
        if (!targetSeries) {
            return;
        }

        const center = scene.center;
        let arcGeometry: { cornerRadius?: number; endAngle: number; innerRadius: number; outerRadius: number; padAngle?: number; startAngle: number } | null = null;

        if (activeHit.arc) {
            arcGeometry = activeHit.arc;
        } else if (targetSeries.type === "radialBar" || targetSeries.type === "rose") {
            const mark = (targetSeries as ChartRadialBarSeriesScene | ChartRoseSeriesScene).marks.find(
                m => m.itemId === activeHit.itemId || m.dataIndex === activeHit.index
            );
            if (mark) {
                arcGeometry = mark;
            }
        }

        if (!arcGeometry) {
            return;
        }

        const d = buildArcPath({
            cornerRadius: arcGeometry.cornerRadius ?? 0,
            endAngle: arcGeometry.endAngle,
            innerRadius: arcGeometry.innerRadius,
            outerRadius: arcGeometry.outerRadius,
            padAngle: arcGeometry.padAngle ?? 0,
            startAngle: arcGeometry.startAngle
        });

        if (d) {
            const highlightPath = createSvgElement("path");
            setSvgAttribute(highlightPath, "d", d);
            setSvgAttribute(highlightPath, "transform", `translate(${center.x}, ${center.y})`);

            if (interactionState.source === "keyboard") {
                const focusIndicatorColor =
                    styleResolver.resolveCssVariable("--color-focus-indicator") ||
                    styleResolver.resolveCssVariable("--color-primary") ||
                    "#3b82f6";
                setSvgAttribute(highlightPath, "fill", "rgba(255, 255, 255, 0.15)");
                setSvgAttribute(highlightPath, "stroke", focusIndicatorColor);
                setSvgAttribute(highlightPath, "stroke-width", 3);
            } else {
                setSvgAttribute(highlightPath, "fill", "rgba(255, 255, 255, 0.2)");
                setSvgAttribute(highlightPath, "stroke", "none");
                setSvgAttribute(highlightPath, "stroke-width", 0);
            }

            this.#highlightGroup.appendChild(highlightPath);
        }
    }
}
