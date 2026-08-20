import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type {
    ChartGaugeSeriesScene,
    ChartRadialBarSeriesScene,
    ChartRoseSeriesScene,
    PolarArcChartScene,
    SceneRadialArcMark,
    SceneRadialTrack
} from "../../../scene/polar-arc-scene";
import type { ChartAngularAxisTick, ChartRadialAxisTick } from "../../../scene/polar-axis-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildArcPath } from "../../geometry/arc-path-builder";
import { createPolarGradientSpec } from "../../series/polar-gradient";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

class SvgRadialBarSeriesRenderer {
    readonly #container: SVGGElement;
    readonly #tracksGroup: SVGGElement;
    readonly #marksGroup: SVGGElement;
    readonly #trackKeyedGroup: SvgKeyedGroup<SceneRadialTrack, SVGPathElement>;
    readonly #markKeyedGroup: SvgKeyedGroup<SceneRadialArcMark, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#tracksGroup = createSvgElement("g");
        this.#tracksGroup.setAttribute("data-radial-layer", "tracks");
        this.#container.appendChild(this.#tracksGroup);

        this.#marksGroup = createSvgElement("g");
        this.#marksGroup.setAttribute("data-radial-layer", "marks");
        this.#container.appendChild(this.#marksGroup);

        this.#trackKeyedGroup = new SvgKeyedGroup<SceneRadialTrack, SVGPathElement>(this.#tracksGroup);
        this.#markKeyedGroup = new SvgKeyedGroup<SceneRadialArcMark, SVGPathElement>(this.#marksGroup);
    }

    public render(
        series: ChartRadialBarSeriesScene,
        center: { x: number; y: number },
        defs: SvgDefinitionRegistry
    ): void {
        setSvgAttribute(this.#container, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(this.#container, "opacity", series.renderOpacity ?? 1);

        // 1. Tracks
        this.#trackKeyedGroup.reconcile(series.tracks, {
            key: (track, i) => track.animationKey ?? track.itemId ?? String(i),
            tag: "path",
            update: (element, track) => {
                const d = buildArcPath({
                    cornerRadius: 0,
                    endAngle: track.endAngle,
                    innerRadius: track.innerRadius,
                    outerRadius: track.outerRadius,
                    padAngle: 0,
                    startAngle: track.startAngle
                }) ?? "";
                setSvgAttribute(element, "d", d);
                setSvgAttribute(element, "fill", track.color);
                setSvgAttribute(element, "fill-opacity", track.opacity);
            }
        });

        // 2. Marks
        const activeMarks = series.marks.filter(m => m.visible && m.endAngle > m.startAngle);
        this.#markKeyedGroup.reconcile(activeMarks, {
            key: (mark, i) => mark.itemId || String(mark.dataIndex),
            tag: "path",
            update: (element, arcData) => {
                const d = buildArcPath({
                    cornerRadius: arcData.cornerRadius,
                    endAngle: arcData.endAngle,
                    innerRadius: arcData.innerRadius,
                    outerRadius: arcData.outerRadius,
                    padAngle: arcData.padAngle,
                    startAngle: arcData.startAngle
                }) ?? "";
                setSvgAttribute(element, "d", d);

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
                    setSvgAttribute(element, "fill", gradUrl);
                    element.removeAttribute("fill-opacity");
                } else {
                    setSvgAttribute(element, "fill", arcData.color);
                    setSvgAttribute(element, "fill-opacity", series.style.fillOpacity);
                }

                const strokeColor = series.style.strokeSource === "explicit" ? series.style.strokeColor : arcData.color;
                if (series.style.strokeWidth > 0 && strokeColor && strokeColor !== "none") {
                    setSvgAttribute(element, "stroke", strokeColor);
                    setSvgAttribute(element, "stroke-width", series.style.strokeWidth);
                } else {
                    setSvgAttribute(element, "stroke", "none");
                    setSvgAttribute(element, "stroke-width", 0);
                }

                setSvgAttribute(element, "opacity", arcData.renderOpacity ?? 1);
            }
        });
    }

    public clear(): void {
        this.#trackKeyedGroup.clear();
        this.#markKeyedGroup.clear();
    }

    public destroy(): void {
        this.clear();
        this.#trackKeyedGroup.destroy();
        this.#markKeyedGroup.destroy();
        this.#tracksGroup.remove();
        this.#marksGroup.remove();
        this.#container.remove();
    }
}

class SvgRoseSeriesRenderer {
    readonly #container: SVGGElement;
    readonly #marksKeyedGroup: SvgKeyedGroup<SceneRadialArcMark, SVGPathElement>;

    public constructor(container: SVGGElement) {
        this.#container = container;
        this.#marksKeyedGroup = new SvgKeyedGroup<SceneRadialArcMark, SVGPathElement>(this.#container);
    }

    public render(
        series: ChartRoseSeriesScene,
        center: { x: number; y: number },
        defs: SvgDefinitionRegistry
    ): void {
        setSvgAttribute(this.#container, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(this.#container, "opacity", series.renderOpacity ?? 1);

        const activeMarks = series.marks.filter(m => m.visible && m.endAngle > m.startAngle);
        this.#marksKeyedGroup.reconcile(activeMarks, {
            key: (mark, i) => mark.itemId || String(mark.dataIndex),
            tag: "path",
            update: (element, petal) => {
                const d = buildArcPath({
                    cornerRadius: petal.cornerRadius,
                    endAngle: petal.endAngle,
                    innerRadius: petal.innerRadius,
                    outerRadius: petal.outerRadius,
                    padAngle: petal.padAngle,
                    startAngle: petal.startAngle
                }) ?? "";
                setSvgAttribute(element, "d", d);

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
                    setSvgAttribute(element, "fill", gradUrl);
                    element.removeAttribute("fill-opacity");
                } else {
                    setSvgAttribute(element, "fill", petal.color);
                    setSvgAttribute(element, "fill-opacity", series.style.fillOpacity);
                }

                const strokeColor = series.style.strokeSource === "explicit" ? series.style.strokeColor : petal.color;
                if (series.style.strokeWidth > 0 && strokeColor && strokeColor !== "none") {
                    setSvgAttribute(element, "stroke", strokeColor);
                    setSvgAttribute(element, "stroke-width", series.style.strokeWidth);
                } else {
                    setSvgAttribute(element, "stroke", "none");
                    setSvgAttribute(element, "stroke-width", 0);
                }

                setSvgAttribute(element, "opacity", petal.renderOpacity ?? 1);
            }
        });
    }

    public clear(): void {
        this.#marksKeyedGroup.clear();
    }

    public destroy(): void {
        this.clear();
        this.#marksKeyedGroup.destroy();
        this.#container.remove();
    }
}

class SvgGaugeSeriesRenderer {
    readonly #container: SVGGElement;
    #trackPath: SVGPathElement | null = null;
    #valuePath: SVGPathElement | null = null;
    #needleGroup: SVGGElement | null = null;
    #needlePath: SVGPathElement | null = null;
    #hubCircle: SVGCircleElement | null = null;

    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public render(
        series: ChartGaugeSeriesScene,
        center: { x: number; y: number },
        defs: SvgDefinitionRegistry
    ): void {
        const { fillMode, indicator, needle, style, track, value } = series;
        const seriesOpacity = series.renderOpacity ?? 1;

        setSvgAttribute(this.#container, "transform", `translate(${center.x}, ${center.y})`);
        setSvgAttribute(this.#container, "opacity", seriesOpacity);

        // 1. Background Track
        if (track) {
            const d = buildArcPath({
                cornerRadius: 0,
                endAngle: track.endAngle,
                innerRadius: track.innerRadius,
                outerRadius: track.outerRadius,
                padAngle: 0,
                startAngle: track.startAngle
            }) ?? "";
            if (d) {
                if (!this.#trackPath) {
                    this.#trackPath = createSvgElement("path");
                    this.#container.insertBefore(this.#trackPath, this.#valuePath ?? this.#needleGroup);
                }
                setSvgAttribute(this.#trackPath, "d", d);
                setSvgAttribute(this.#trackPath, "fill", track.color);
                setSvgAttribute(this.#trackPath, "fill-opacity", track.opacity);
            } else if (this.#trackPath) {
                this.#trackPath.remove();
                this.#trackPath = null;
            }
        } else if (this.#trackPath) {
            this.#trackPath.remove();
            this.#trackPath = null;
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
            }) ?? "";
            if (d) {
                if (!this.#valuePath) {
                    this.#valuePath = createSvgElement("path");
                    this.#container.insertBefore(this.#valuePath, this.#needleGroup);
                }
                setSvgAttribute(this.#valuePath, "d", d);

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
                    setSvgAttribute(this.#valuePath, "fill", gradUrl);
                    this.#valuePath.removeAttribute("fill-opacity");
                } else {
                    setSvgAttribute(this.#valuePath, "fill", style.color);
                    setSvgAttribute(this.#valuePath, "fill-opacity", style.fillOpacity);
                }

                setSvgAttribute(this.#valuePath, "opacity", valOpacity);
            } else if (this.#valuePath) {
                this.#valuePath.remove();
                this.#valuePath = null;
            }
        } else if (this.#valuePath) {
            this.#valuePath.remove();
            this.#valuePath = null;
        }

        // 3. Needle & Hub
        if ((indicator === "needle" || indicator === "both") && needle) {
            if (!this.#needleGroup) {
                this.#needleGroup = createSvgElement("g");
                this.#needlePath = createSvgElement("path");
                this.#hubCircle = createSvgElement("circle");
                this.#needleGroup.appendChild(this.#needlePath);
                this.#needleGroup.appendChild(this.#hubCircle);
                this.#container.appendChild(this.#needleGroup);
            }
            setSvgAttribute(this.#needleGroup, "transform", `rotate(${(needle.angle * 180) / Math.PI})`);

            const dNeedle = `M ${-needle.width / 2} 0 L 0 ${-needle.length} L ${needle.width / 2} 0 Z`;
            setSvgAttribute(this.#needlePath!, "d", dNeedle);
            setSvgAttribute(this.#needlePath!, "fill", needle.color);

            setSvgAttribute(this.#hubCircle!, "cx", 0);
            setSvgAttribute(this.#hubCircle!, "cy", 0);
            setSvgAttribute(this.#hubCircle!, "r", needle.hubRadius);
            setSvgAttribute(this.#hubCircle!, "fill", needle.hubColor);
        } else if (this.#needleGroup) {
            this.#needleGroup.remove();
            this.#needleGroup = null;
            this.#needlePath = null;
            this.#hubCircle = null;
        }
    }

    public clear(): void {
        if (this.#trackPath) {
            this.#trackPath.remove();
            this.#trackPath = null;
        }
        if (this.#valuePath) {
            this.#valuePath.remove();
            this.#valuePath = null;
        }
        if (this.#needleGroup) {
            this.#needleGroup.remove();
            this.#needleGroup = null;
            this.#needlePath = null;
            this.#hubCircle = null;
        }
    }

    public destroy(): void {
        this.clear();
        this.#container.remove();
    }
}

interface PolarArcSeriesEntry {
    readonly container: SVGGElement;
    readonly renderer: SvgRadialBarSeriesRenderer | SvgRoseSeriesRenderer | SvgGaugeSeriesRenderer;
    readonly type: string;
}

export class SvgPolarArcRenderer {
    readonly #container: SVGGElement;
    readonly #backgroundGroup: SVGGElement;
    readonly #seriesGroup: SVGGElement;
    readonly #foregroundGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    readonly #roseGridRingsKeyedGroup: SvgKeyedGroup<{ d: string; radius: number; tick: ChartRadialAxisTick }, SVGPathElement>;
    readonly #roseGridSpokesKeyedGroup: SvgKeyedGroup<{ tick: ChartAngularAxisTick; x1: number; y1: number; x2: number; y2: number }, SVGLineElement>;
    #roseForegroundArcPath: SVGPathElement | null = null;

    readonly #seriesEntries = new Map<string, PolarArcSeriesEntry>();

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

        this.#roseGridRingsKeyedGroup = new SvgKeyedGroup<{ d: string; radius: number; tick: ChartRadialAxisTick }, SVGPathElement>(this.#backgroundGroup);
        this.#roseGridSpokesKeyedGroup = new SvgKeyedGroup<{ tick: ChartAngularAxisTick; x1: number; y1: number; x2: number; y2: number }, SVGLineElement>(this.#backgroundGroup);
    }

    public render(
        scene: PolarArcChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { arcMode, center, outerRadius, series } = scene;
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
        const activeIds = new Set<string>();

        for (let i = 0; i < series.length; i++) {
            const s = series[i];
            activeIds.add(s.id);

            let entry = this.#seriesEntries.get(s.id);
            if (entry && entry.type !== s.type) {
                entry.renderer.destroy();
                entry.container.remove();
                this.#seriesEntries.delete(s.id);
                entry = undefined;
            }

            if (!entry) {
                const container = createSvgElement("g");
                container.setAttribute("data-series-id", s.id);
                this.#seriesGroup.appendChild(container);
                let renderer: SvgRadialBarSeriesRenderer | SvgRoseSeriesRenderer | SvgGaugeSeriesRenderer;
                if (s.type === "radialBar") {
                    renderer = new SvgRadialBarSeriesRenderer(container);
                } else if (s.type === "rose") {
                    renderer = new SvgRoseSeriesRenderer(container);
                } else {
                    renderer = new SvgGaugeSeriesRenderer(container);
                }
                entry = { container, renderer, type: s.type };
                this.#seriesEntries.set(s.id, entry);
            }

            // Ensure DOM ordering
            const currentNthChild = this.#seriesGroup.children[i];
            if (currentNthChild !== entry.container) {
                this.#seriesGroup.insertBefore(entry.container, currentNthChild ?? null);
            }

            if (s.type === "radialBar") {
                (entry.renderer as SvgRadialBarSeriesRenderer).render(s, center, defs);
            } else if (s.type === "rose") {
                (entry.renderer as SvgRoseSeriesRenderer).render(s, center, defs);
            } else if (s.type === "gauge") {
                (entry.renderer as SvgGaugeSeriesRenderer).render(s, center, defs);
            }
        }

        // Cleanup stale series
        for (const [id, entry] of this.#seriesEntries.entries()) {
            if (!activeIds.has(id)) {
                entry.renderer.destroy();
                entry.container.remove();
                this.#seriesEntries.delete(id);
            }
        }

        // 3. Foreground Axis for Rose
        this.#renderRoseForeground(scene, roseStartAngleRad, roseEndAngleRad, styleResolver);

        // 4. Interaction Highlight
        this.#renderHighlight(scene, interactionState, styleResolver);
    }

    public clear(): void {
        this.#roseGridRingsKeyedGroup.clear();
        this.#roseGridSpokesKeyedGroup.clear();
        for (const entry of this.#seriesEntries.values()) {
            entry.renderer.clear();
        }
        if (this.#roseForegroundArcPath) {
            this.#roseForegroundArcPath.remove();
            this.#roseForegroundArcPath = null;
        }
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#roseGridRingsKeyedGroup.destroy();
        this.#roseGridSpokesKeyedGroup.destroy();
        for (const entry of this.#seriesEntries.values()) {
            entry.renderer.destroy();
            entry.container.remove();
        }
        this.#seriesEntries.clear();
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
        if (scene.arcMode !== "rose" || (!scene.radialAxis && !scene.angularAxis)) {
            this.#roseGridRingsKeyedGroup.clear();
            this.#roseGridSpokesKeyedGroup.clear();
            return;
        }

        const { angularAxis, center, innerRadius, outerRadius, radialAxis } = scene;
        const gridColor =
            styleResolver.resolveCssVariable("--mona-chart-grid-color") ||
            styleResolver.resolveCssVariable("--color-border-control") ||
            "rgba(150, 150, 150, 0.2)";

        // Radial Grid Rings
        if (radialAxis && radialAxis.visible && radialAxis.gridLines) {
            const validTicks = radialAxis.ticks
                .filter(t => t.radius > 0)
                .map(tick => {
                    const d = buildArcPath({
                        cornerRadius: 0,
                        endAngle: endAngleRad,
                        innerRadius: tick.radius,
                        outerRadius: tick.radius,
                        padAngle: 0,
                        startAngle: startAngleRad
                    }) ?? "";
                    return { d, radius: tick.radius, tick };
                })
                .filter(item => Boolean(item.d));

            this.#roseGridRingsKeyedGroup.reconcile(validTicks, {
                key: (item, i) => item.tick.tickKey ?? (item.tick.index !== undefined ? String(item.tick.index) : (item.tick.formattedValue ?? String(item.tick.value))),
                tag: "path",
                update: (ringPath, item) => {
                    setSvgAttribute(ringPath, "d", item.d);
                    setSvgAttribute(ringPath, "transform", `translate(${center.x}, ${center.y})`);
                    setSvgAttribute(ringPath, "fill", "none");
                    setSvgAttribute(ringPath, "stroke", gridColor);
                    setSvgAttribute(ringPath, "stroke-width", 1);
                }
            });
        } else {
            this.#roseGridRingsKeyedGroup.clear();
        }

        // Angular Spokes
        if (angularAxis && angularAxis.visible && angularAxis.gridLines) {
            const spokeItems = angularAxis.ticks.map(tick => ({
                tick,
                x1: center.x + Math.sin(tick.angle) * innerRadius,
                x2: center.x + Math.sin(tick.angle) * outerRadius,
                y1: center.y - Math.cos(tick.angle) * innerRadius,
                y2: center.y - Math.cos(tick.angle) * outerRadius
            }));

            this.#roseGridSpokesKeyedGroup.reconcile(spokeItems, {
                key: (item, i) => item.tick.tickKey ?? (item.tick.index !== undefined ? String(item.tick.index) : String(item.tick.angle)),
                tag: "line",
                update: (spoke, item) => {
                    setSvgAttribute(spoke, "x1", item.x1);
                    setSvgAttribute(spoke, "y1", item.y1);
                    setSvgAttribute(spoke, "x2", item.x2);
                    setSvgAttribute(spoke, "y2", item.y2);
                    setSvgAttribute(spoke, "stroke", gridColor);
                    setSvgAttribute(spoke, "stroke-width", 1);
                }
            });
        } else {
            this.#roseGridSpokesKeyedGroup.clear();
        }
    }

    #renderRoseForeground(
        scene: PolarArcChartScene,
        startAngleRad: number,
        endAngleRad: number,
        styleResolver: ChartStyleResolver
    ): void {
        if (scene.arcMode !== "rose" || (!scene.radialAxis && !scene.angularAxis)) {
            if (this.#roseForegroundArcPath) {
                this.#roseForegroundArcPath.remove();
                this.#roseForegroundArcPath = null;
            }
            return;
        }

        const { angularAxis, center, outerRadius } = scene;
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
            }) ?? "";
            if (d) {
                if (!this.#roseForegroundArcPath) {
                    this.#roseForegroundArcPath = createSvgElement("path");
                    this.#foregroundGroup.appendChild(this.#roseForegroundArcPath);
                }
                setSvgAttribute(this.#roseForegroundArcPath, "d", d);
                setSvgAttribute(this.#roseForegroundArcPath, "transform", `translate(${center.x}, ${center.y})`);
                setSvgAttribute(this.#roseForegroundArcPath, "fill", "none");
                setSvgAttribute(this.#roseForegroundArcPath, "stroke", axisLineColor);
                setSvgAttribute(this.#roseForegroundArcPath, "stroke-width", 1);
            } else if (this.#roseForegroundArcPath) {
                this.#roseForegroundArcPath.remove();
                this.#roseForegroundArcPath = null;
            }
        } else if (this.#roseForegroundArcPath) {
            this.#roseForegroundArcPath.remove();
            this.#roseForegroundArcPath = null;
        }
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

        // Gauge needle special parity:
        if (targetSeries.type === "gauge") {
            const gauge = targetSeries as ChartGaugeSeriesScene;
            const indicator = gauge.indicator ?? "both";
            if (indicator === "needle") {
                if (interactionState.source === "keyboard" && gauge.needle) {
                    const needle = gauge.needle;
                    const focusIndicatorColor =
                        styleResolver.resolveCssVariable("--color-focus-indicator") ||
                        styleResolver.resolveCssVariable("--color-primary") ||
                        "#3b82f6";

                    const group = createSvgElement("g");
                    const angleDeg = (needle.angle * 180) / Math.PI;
                    setSvgAttribute(group, "transform", `translate(${center.x}, ${center.y}) rotate(${angleDeg})`);

                    // Needle outline
                    const needlePath = createSvgElement("path");
                    const d = `M ${-(needle.width / 2 + 3)} 0 L 0 ${-(needle.length + 3)} L ${needle.width / 2 + 3} 0 Z`;
                    setSvgAttribute(needlePath, "d", d);
                    setSvgAttribute(needlePath, "fill", "none");
                    setSvgAttribute(needlePath, "stroke", focusIndicatorColor);
                    setSvgAttribute(needlePath, "stroke-width", 2.5);
                    group.appendChild(needlePath);

                    // Hub focus ring
                    const hubRing = createSvgElement("circle");
                    setSvgAttribute(hubRing, "cx", 0);
                    setSvgAttribute(hubRing, "cy", 0);
                    setSvgAttribute(hubRing, "r", needle.hubRadius + 3);
                    setSvgAttribute(hubRing, "fill", "none");
                    setSvgAttribute(hubRing, "stroke", focusIndicatorColor);
                    setSvgAttribute(hubRing, "stroke-width", 2.5);
                    group.appendChild(hubRing);

                    this.#highlightGroup.appendChild(group);
                }
                return;
            }
        }

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
                const hoverOverlayColor =
                    styleResolver.resolveCssVariable("--mona-chart-slice-hover-overlay") || "rgba(255, 255, 255, 0.22)";
                setSvgAttribute(highlightPath, "fill", hoverOverlayColor);
                setSvgAttribute(highlightPath, "stroke", "none");
                setSvgAttribute(highlightPath, "stroke-width", 0);
            }

            this.#highlightGroup.appendChild(highlightPath);
        }
    }
}
