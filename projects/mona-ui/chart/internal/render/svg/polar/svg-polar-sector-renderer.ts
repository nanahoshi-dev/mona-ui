import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { ChartSectorSeriesScene, SceneSectorSlice } from "../../../scene/polar-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { buildArcPath } from "../../geometry/arc-path-builder";
import { createPolarGradientSpec } from "../../series/polar-gradient";
import { setSvgAttribute } from "../svg-attribute-utils";
import type { SvgDefinitionRegistry } from "../svg-definition-registry";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

export class SvgPolarSectorRenderer {
    readonly #container: SVGGElement;
    readonly #slicesGroup: SVGGElement;
    readonly #linesGroup: SVGGElement;
    readonly #highlightGroup: SVGGElement;

    readonly #sliceKeyedGroup: SvgKeyedGroup<SceneSectorSlice, SVGPathElement>;

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

    public render(
        series: ChartSectorSeriesScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver,
        defs: SvgDefinitionRegistry
    ): void {
        const { center, fillMode, slices, style } = series;
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
                const d = buildArcPath({
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
        while (this.#linesGroup.firstChild) {
            this.#linesGroup.firstChild.remove();
        }

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
                pathSegments.push(`M ${arcAnchor.x} ${arcAnchor.y} L ${elbow.x} ${elbow.y} L ${lineEnd.x} ${lineEnd.y}`);
            }

            if (pathSegments.length > 0) {
                const linePath = createSvgElement("path");
                setSvgAttribute(linePath, "d", pathSegments.join(" "));
                setSvgAttribute(linePath, "fill", "none");
                setSvgAttribute(linePath, "stroke", lineColor);
                setSvgAttribute(linePath, "stroke-width", 1);
                this.#linesGroup.appendChild(linePath);
            }
        }

        // 3. Highlight
        while (this.#highlightGroup.firstChild) {
            this.#highlightGroup.firstChild.remove();
        }

        const activeHit = interactionState?.activeHitTarget;
        if (activeHit && activeHit.seriesId === series.id) {
            const activeSlice = slices.find(s => s.sliceId === activeHit.sliceId || s.dataIndex === activeHit.index);
            if (activeSlice && activeSlice.visible) {
                const d = buildArcPath({
                    cornerRadius: activeSlice.cornerRadius,
                    endAngle: activeSlice.endAngle,
                    innerRadius: activeSlice.innerRadius,
                    outerRadius: activeSlice.outerRadius,
                    padAngle: activeSlice.padAngle,
                    startAngle: activeSlice.startAngle
                }) ?? "";

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

    public clear(): void {
        this.#sliceKeyedGroup.clear();
        while (this.#linesGroup.firstChild) {
            this.#linesGroup.firstChild.remove();
        }
        while (this.#highlightGroup.firstChild) {
            this.#highlightGroup.firstChild.remove();
        }
    }

    public destroy(): void {
        this.clear();
        this.#sliceKeyedGroup.destroy();
        this.#slicesGroup.remove();
        this.#linesGroup.remove();
        this.#highlightGroup.remove();
    }
}
