import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { PolarSectorChartScene } from "../../../scene/chart-scene";
import type { ChartSectorSeriesScene, SceneSectorSlice } from "../../../scene/polar-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildArcPath } from "../../geometry/arc-path-builder";
import { createPolarGradientSpec } from "../../series/polar-gradient";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

export class SvgPolarSectorSeriesRenderer {
    readonly #container: SVGGElement;
    readonly #highlightGroup: SVGGElement;
    readonly #linesGroup: SVGGElement;
    readonly #sliceKeyedGroup: SvgKeyedGroup<SceneSectorSlice, SVGPathElement>;
    readonly #slicesGroup: SVGGElement;
    #highlightPath: SVGPathElement | null = null;
    #linePath: SVGPathElement | null = null;
    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#slicesGroup = createSvgElement("g");
        this.#slicesGroup.setAttribute("data-polar-layer", "slices");
        this.#container.appendChild(this.#slicesGroup);

        this.#linesGroup = createSvgElement("g");
        this.#linesGroup.setAttribute("data-polar-layer", "label-lines");
        this.#container.appendChild(this.#linesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-polar-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);

        this.#sliceKeyedGroup = new SvgKeyedGroup<SceneSectorSlice, SVGPathElement>(this.#slicesGroup);
    }

    public clear(): void {
        this.#sliceKeyedGroup.clear();
        if (this.#linePath) {
            this.#linePath.remove();
            this.#linePath = null;
        }
        if (this.#highlightPath) {
            this.#highlightPath.remove();
            this.#highlightPath = null;
        }
    }

    public destroy(): void {
        this.clear();
        this.#sliceKeyedGroup.destroy();
        this.#slicesGroup.remove();
        this.#linesGroup.remove();
        this.#highlightGroup.remove();
        this.#container.remove();
    }

    public render(
        series: ChartSectorSeriesScene,
        sceneCenter: { readonly x: number; readonly y: number } | undefined,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { fillMode, slices, style } = series;
        const center = series.center ?? sceneCenter ?? { x: 0, y: 0 };
        if (!slices || slices.length === 0) {
            this.clear();
            return;
        }

        // 1. Slices
        const visibleSlices = slices.filter(s => s.visible);
        this.#sliceKeyedGroup.reconcile(visibleSlices, {
            key: s => s.sliceId,
            tag: "path",
            update: (element, slice) => {
                const d =
                    buildArcPath({
                        cornerRadius: slice.cornerRadius,
                        endAngle: slice.endAngle,
                        innerRadius: slice.innerRadius,
                        outerRadius: slice.outerRadius,
                        padAngle: slice.padAngle,
                        startAngle: slice.startAngle
                    }) ?? "";

                const opacity = (series.renderOpacity ?? 1) * (slice.renderOpacity ?? 1);
                setSvgAttribute(element, "d", d);
                setSvgAttribute(element, "transform", `translate(${center.x}, ${center.y})`);

                if (fillMode === "gradient") {
                    const spec = createPolarGradientSpec(
                        slice.innerRadius,
                        slice.outerRadius,
                        slice.color,
                        style.fillOpacity
                    );
                    const gradUrl = defs.useRadialGradient(`polar-slice-grad-${series.id}-${slice.sliceId}`, {
                        cx: 0,
                        cy: 0,
                        gradientUnits: "userSpaceOnUse",
                        r: spec.outerRadius,
                        stops: spec.stops
                    });
                    setSvgAttribute(element, "fill", gradUrl);
                    element.removeAttribute("fill-opacity");
                } else {
                    setSvgAttribute(element, "fill", slice.color);
                    setSvgAttribute(element, "fill-opacity", style.fillOpacity);
                }

                const strokeColor = style.strokeSource === "explicit" ? style.strokeColor : slice.color;
                if (style.strokeWidth > 0 && strokeColor) {
                    setSvgAttribute(element, "stroke", strokeColor);
                    setSvgAttribute(element, "stroke-width", style.strokeWidth);
                } else {
                    setSvgAttribute(element, "stroke", "none");
                    setSvgAttribute(element, "stroke-width", 0);
                }

                setSvgAttribute(element, "opacity", opacity <= 0 ? 0 : opacity);
            }
        });

        // 2. Leader Lines
        if (series.showLabels && series.labelPosition === "outside") {
            const lineColor =
                styleResolver.resolveCssVariable("--mona-chart-label-line-color") ||
                styleResolver.resolveCssVariable("--color-muted-foreground") ||
                "rgba(148, 163, 184, 0.6)";

            const pathSegments: string[] = [];
            for (const slice of slices) {
                if (!slice.visible || !slice.label || !slice.label.visible) {
                    continue;
                }
                const { arcAnchor, elbow, lineEnd } = slice.label;
                pathSegments.push(
                    `M ${arcAnchor.x} ${arcAnchor.y} L ${elbow.x} ${elbow.y} L ${lineEnd.x} ${lineEnd.y}`
                );
            }

            if (pathSegments.length > 0) {
                if (!this.#linePath) {
                    this.#linePath = createSvgElement("path");
                    this.#linesGroup.appendChild(this.#linePath);
                }
                setSvgAttribute(this.#linePath, "d", pathSegments.join(" "));
                setSvgAttribute(this.#linePath, "fill", "none");
                setSvgAttribute(this.#linePath, "stroke", lineColor);
                setSvgAttribute(this.#linePath, "stroke-width", 1);
            } else if (this.#linePath) {
                this.#linePath.remove();
                this.#linePath = null;
            }
        } else if (this.#linePath) {
            this.#linePath.remove();
            this.#linePath = null;
        }

        // 3. Highlight
        const activeHit = interactionState?.activeHitTarget;
        if (activeHit && activeHit.seriesId === series.id) {
            const activeSlice = slices.find(s => s.sliceId === activeHit.sliceId || s.dataIndex === activeHit.index);
            if (activeSlice && activeSlice.visible) {
                const d =
                    buildArcPath({
                        cornerRadius: activeSlice.cornerRadius,
                        endAngle: activeSlice.endAngle,
                        innerRadius: activeSlice.innerRadius,
                        outerRadius: activeSlice.outerRadius,
                        padAngle: activeSlice.padAngle,
                        startAngle: activeSlice.startAngle
                    }) ?? "";

                if (!this.#highlightPath) {
                    this.#highlightPath = createSvgElement("path");
                    this.#highlightGroup.appendChild(this.#highlightPath);
                }
                setSvgAttribute(this.#highlightPath, "d", d);
                setSvgAttribute(this.#highlightPath, "transform", `translate(${center.x}, ${center.y})`);

                if (interactionState?.source === "keyboard") {
                    const focusIndicatorColor =
                        styleResolver.resolveCssVariable("--color-focus-indicator") ||
                        styleResolver.resolveCssVariable("--color-primary") ||
                        "#3b82f6";
                    setSvgAttribute(this.#highlightPath, "fill", "rgba(255, 255, 255, 0.15)");
                    setSvgAttribute(this.#highlightPath, "stroke", focusIndicatorColor);
                    setSvgAttribute(this.#highlightPath, "stroke-width", 3);
                } else {
                    const hoverOverlayColor =
                        styleResolver.resolveCssVariable("--mona-chart-slice-hover-overlay") ||
                        "rgba(255, 255, 255, 0.22)";
                    setSvgAttribute(this.#highlightPath, "fill", hoverOverlayColor);
                    setSvgAttribute(this.#highlightPath, "stroke", "none");
                    setSvgAttribute(this.#highlightPath, "stroke-width", 0);
                }
            } else if (this.#highlightPath) {
                this.#highlightPath.remove();
                this.#highlightPath = null;
            }
        } else if (this.#highlightPath) {
            this.#highlightPath.remove();
            this.#highlightPath = null;
        }
    }
}

interface SvgPolarSectorSeriesEntry {
    readonly container: SVGGElement;
    readonly renderer: SvgPolarSectorSeriesRenderer;
}

export class SvgPolarSectorRenderer {
    readonly #container: SVGGElement;
    readonly #seriesRenderers = new Map<string, SvgPolarSectorSeriesEntry>();

    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public clear(): void {
        for (const entry of this.#seriesRenderers.values()) {
            entry.renderer.clear();
        }
    }

    public destroy(): void {
        for (const entry of this.#seriesRenderers.values()) {
            entry.renderer.destroy();
            entry.container.remove();
        }
        this.#seriesRenderers.clear();
    }

    public render(
        scene: PolarSectorChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const activeIds = new Set<string>();

        for (let i = 0; i < scene.series.length; i++) {
            const s = scene.series[i];
            activeIds.add(s.id);

            let entry = this.#seriesRenderers.get(s.id);
            if (!entry) {
                const container = createSvgElement("g");
                container.setAttribute("data-series-id", s.id);
                this.#container.appendChild(container);
                const renderer = new SvgPolarSectorSeriesRenderer(container);
                entry = { container, renderer };
                this.#seriesRenderers.set(s.id, entry);
            }

            // Ensure DOM ordering
            const currentNthChild = this.#container.children[i];
            if (currentNthChild !== entry.container) {
                this.#container.insertBefore(entry.container, currentNthChild ?? null);
            }

            entry.renderer.render(s, scene.center, interactionState, styleResolver, defs);
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
}
