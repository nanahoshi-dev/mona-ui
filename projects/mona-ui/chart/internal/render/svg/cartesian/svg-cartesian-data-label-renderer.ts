import type { SceneDefaultDataLabel } from "../../../scene/cartesian-data-label-scene";
import { setSvgAttribute } from "../svg-attribute-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

export class SvgCartesianDataLabelRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneDefaultDataLabel, SVGTextElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneDefaultDataLabel, SVGTextElement>(container);
    }

    public render(labels: readonly SceneDefaultDataLabel[], plotClipUrl?: string): void {
        if (labels.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        this.#keyedGroup.reconcile(labels, {
            key: label => `${label.seriesId}:${label.markId}`,
            tag: "text",
            update: (element, label) => {
                const cx = label.bounds.x + label.bounds.width / 2;
                const cy = label.bounds.y + label.bounds.height / 2;

                element.textContent = label.text;
                setSvgAttribute(element, "x", cx);
                setSvgAttribute(element, "y", cy);
                setSvgAttribute(element, "text-anchor", "middle");
                setSvgAttribute(element, "dominant-baseline", "middle");
                setSvgAttribute(element, "fill", label.color);

                if (label.font) {
                    element.style.font = label.font;
                }

                if (label.haloWidth && label.haloWidth > 0 && label.haloColor) {
                    setSvgAttribute(element, "paint-order", "stroke fill");
                    setSvgAttribute(element, "stroke", label.haloColor);
                    setSvgAttribute(element, "stroke-width", label.haloWidth * 2);
                    setSvgAttribute(element, "stroke-linejoin", "round");
                } else {
                    element.removeAttribute("paint-order");
                    element.removeAttribute("stroke");
                    element.removeAttribute("stroke-width");
                    element.removeAttribute("stroke-linejoin");
                }

                if (plotClipUrl) {
                    setSvgAttribute(element, "clip-path", plotClipUrl);
                } else {
                    element.removeAttribute("clip-path");
                }
            }
        });
    }

    public clear(): void {
        this.#keyedGroup.clear();
    }

    public destroy(): void {
        this.#keyedGroup.destroy();
    }
}
