import type { ChartBrushLineStyle } from "../../../../models/chart-brush.models";
import type { ChartRect } from "../../../../models/chart.models";
import type { ChartBrushRegistration } from "../../../context/chart-registration-context";
import { resolveBrushDashArray, setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";

export class SvgCartesianBrushRenderer {
    readonly #container: SVGGElement;
    #rectElement: SVGRectElement | null = null;

    public constructor(container: SVGGElement) {
        this.#container = container;
    }

    public clear(): void {
        if (this.#rectElement) {
            this.#rectElement.remove();
            this.#rectElement = null;
        }
    }

    public destroy(): void {
        this.clear();
    }

    public render(
        brushRect: ChartRect | null,
        registration: ChartBrushRegistration | null,
        plotClipUrl?: string,
        resolvedStyle?: {
            readonly borderColor: string;
            readonly borderWidth: number;
            readonly fillColor: string;
            readonly fillOpacity: number;
            readonly lineStyle: ChartBrushLineStyle;
        }
    ): void {
        if (!brushRect || (!registration && !resolvedStyle)) {
            this.clear();
            return;
        }

        const fillColor = resolvedStyle?.fillColor ?? registration?.fillColor?.() ?? "#3b82f6";
        const fillOpacity = resolvedStyle?.fillOpacity ?? registration?.fillOpacity?.() ?? 0.15;
        const borderColor = resolvedStyle?.borderColor ?? registration?.borderColor?.() ?? "#3b82f6";
        const borderWidth = resolvedStyle?.borderWidth ?? registration?.borderWidth?.() ?? 1;
        const lineStyle = resolvedStyle?.lineStyle ?? registration?.lineStyle?.() ?? "solid";

        if (!this.#rectElement) {
            this.#rectElement = createSvgElement("rect");
            this.#container.appendChild(this.#rectElement);
        }

        setSvgAttribute(this.#rectElement, "x", brushRect.x);
        setSvgAttribute(this.#rectElement, "y", brushRect.y);
        setSvgAttribute(this.#rectElement, "width", brushRect.width);
        setSvgAttribute(this.#rectElement, "height", brushRect.height);
        setSvgAttribute(this.#rectElement, "fill", fillColor);
        setSvgAttribute(this.#rectElement, "fill-opacity", fillOpacity);
        setSvgAttribute(this.#rectElement, "stroke", borderWidth > 0 ? borderColor : "none");
        setSvgAttribute(this.#rectElement, "stroke-width", borderWidth);
        setSvgAttribute(this.#rectElement, "stroke-dasharray", resolveBrushDashArray(lineStyle));

        if (plotClipUrl) {
            setSvgAttribute(this.#rectElement, "clip-path", plotClipUrl);
        } else {
            this.#rectElement.removeAttribute("clip-path");
        }
    }
}
