import type { ChartInteractionState } from "../../../interaction/chart-interaction-state";
import type { CartesianFunnelChartScene, SceneFunnelStage } from "../../../scene/funnel-scene";
import type { ChartStyleResolver } from "../../../style/chart-style-resolver";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

interface FunnelRenderStageItem {
    readonly alpha: number;
    readonly fillOpacity: number;
    readonly key: string;
    readonly stage: SceneFunnelStage;
    readonly strokeColor?: string;
    readonly strokeWidth: number;
}

export class SvgFunnelRenderer {
    readonly #container: SVGGElement;
    readonly #highlightGroup: SVGGElement;
    readonly #stageKeyedGroup: SvgKeyedGroup<FunnelRenderStageItem, SVGPathElement>;
    readonly #stagesGroup: SVGGElement;
    public constructor(container: SVGGElement) {
        this.#container = container;

        this.#stagesGroup = createSvgElement("g");
        this.#stagesGroup.setAttribute("data-funnel-layer", "stages");
        this.#container.appendChild(this.#stagesGroup);

        this.#highlightGroup = createSvgElement("g");
        this.#highlightGroup.setAttribute("data-funnel-layer", "highlight");
        this.#container.appendChild(this.#highlightGroup);

        this.#stageKeyedGroup = new SvgKeyedGroup<FunnelRenderStageItem, SVGPathElement>(this.#stagesGroup);
    }

    public clear(): void {
        this.#stageKeyedGroup.clear();
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
    }

    public destroy(): void {
        this.clear();
        this.#stageKeyedGroup.destroy();
        this.#stagesGroup.remove();
        this.#highlightGroup.remove();
    }

    public render(
        scene: CartesianFunnelChartScene,
        interactionState: ChartInteractionState | null,
        styleResolver: ChartStyleResolver
    ): void {
        const { plotRect, series } = scene;
        if (plotRect.width <= 0 || plotRect.height <= 0 || series.length === 0) {
            this.clear();
            return;
        }

        // 1. Stages
        const renderItems: FunnelRenderStageItem[] = [];

        for (const s of series) {
            const { renderOpacity = 1, stages, style } = s;
            if (stages.length === 0 || renderOpacity <= 0) continue;

            const strokeWidth = style?.strokeWidth ?? 1;
            const strokeColor = style?.strokeColor;
            const fillOpacity = style?.fillOpacity ?? 1;

            for (const stage of stages) {
                const stageOpacity = stage.renderOpacity ?? 1;
                if (stageOpacity <= 0 || (stage.bounds && (stage.bounds.width <= 0 || stage.bounds.height <= 0))) continue;

                renderItems.push({
                    alpha: renderOpacity * stageOpacity,
                    fillOpacity,
                    key: `${s.id}:${stage.animationKey || stage.stageId || stage.dataIndex}`,
                    stage,
                    strokeColor,
                    strokeWidth
                });
            }
        }

        this.#stageKeyedGroup.reconcile(renderItems, {
            key: item => item.key,
            tag: "path",
            update: (pathEl, item) => {
                const [p0, p1, p2, p3] = item.stage.polygon;
                const d = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;

                setSvgAttribute(pathEl, "d", d);
                setSvgAttribute(pathEl, "fill", item.stage.fillColor);
                setSvgAttribute(pathEl, "fill-opacity", item.fillOpacity);
                setSvgAttribute(pathEl, "opacity", item.alpha);

                if (item.strokeWidth > 0 && item.strokeColor) {
                    setSvgAttribute(pathEl, "stroke", item.strokeColor);
                    setSvgAttribute(pathEl, "stroke-width", item.strokeWidth);
                } else {
                    setSvgAttribute(pathEl, "stroke", "none");
                    setSvgAttribute(pathEl, "stroke-width", 0);
                }
            }
        });

        // 2. Highlight
        while (this.#highlightGroup.firstChild) this.#highlightGroup.firstChild.remove();
        if (interactionState) {
            const isKeyboard = interactionState.source === "keyboard";
            const hit = interactionState.activeHitTarget ?? interactionState.activeHits[0];
            if (hit && hit.seriesType === "funnel") {
                const targetSeries = series.find(s => s.id === hit.seriesId) ?? series[0];
                const stage = targetSeries?.stages.find(
                    st => st.animationKey === hit.animationKey || st.stageId === hit.itemId || st.dataIndex === hit.dataIndex
                );

                if (stage && stage.polygon) {
                    const [p0, p1, p2, p3] = stage.polygon;
                    const d = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`;

                    const highlightPath = createSvgElement("path");
                    setSvgAttribute(highlightPath, "d", d);
                    setSvgAttribute(highlightPath, "fill", "none");

                    if (isKeyboard) {
                        const focusColor =
                            styleResolver.resolveCssVariable("--color-ring") ||
                            styleResolver.resolveCssVariable("--color-focus-indicator") ||
                            styleResolver.resolveCssVariable("--color-primary") ||
                            "#3b82f6";
                        setSvgAttribute(highlightPath, "stroke", focusColor);
                        setSvgAttribute(highlightPath, "stroke-width", 2.5);
                    } else {
                        const hoverColor =
                            styleResolver.resolveCssVariable("--mona-chart-funnel-hover-outline-color") ||
                            styleResolver.resolveCssVariable("--color-border-control") ||
                            "rgba(255, 255, 255, 0.85)";
                        setSvgAttribute(highlightPath, "stroke", hoverColor);
                        setSvgAttribute(highlightPath, "stroke-width", 1.5);
                    }

                    this.#highlightGroup.appendChild(highlightPath);
                }
            }
        }
    }
}
