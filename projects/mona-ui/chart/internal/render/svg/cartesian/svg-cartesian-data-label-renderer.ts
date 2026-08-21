import type { SceneDefaultDataLabel } from "../../../scene/cartesian-data-label-scene";
import { setSvgAttribute } from "../svg-attribute-utils";
import { createSvgElement } from "../svg-element-utils";
import { SvgKeyedGroup } from "../svg-keyed-group";

function parseFontShorthand(fontStr?: string): {
    readonly fontFamily: string;
    readonly fontSize: number;
    readonly fontStyle: string;
    readonly fontWeight: string;
} {
    if (!fontStr) {
        return {
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 11,
            fontStyle: "normal",
            fontWeight: "500"
        };
    }
    const sizeMatch = /(\d+(?:\.\d+)?)px/.exec(fontStr);
    const fontSize = sizeMatch ? parseFloat(sizeMatch[1]) : 11;
    const isItalic = fontStr.includes("italic");
    const isBold = /\b(bold|[6-9]00)\b/.test(fontStr);
    const fontWeight = isBold ? "bold" : (/\b500\b/.test(fontStr) ? "500" : "normal");
    const fontStyle = isItalic ? "italic" : "normal";

    let rawFamily = "Helvetica, Arial, sans-serif";
    if (sizeMatch) {
        const familyPart = fontStr.slice(sizeMatch.index + sizeMatch[0].length).trim();
        if (familyPart) {
            rawFamily = familyPart;
        }
    }
    const fontFamily = `${rawFamily}, Helvetica, Arial, sans-serif`;

    return { fontFamily, fontSize, fontStyle, fontWeight };
}

export class SvgCartesianDataLabelRenderer {
    readonly #keyedGroup: SvgKeyedGroup<SceneDefaultDataLabel, SVGGElement>;

    public constructor(container: SVGGElement) {
        this.#keyedGroup = new SvgKeyedGroup<SceneDefaultDataLabel, SVGGElement>(container);
    }

    public render(labels: readonly SceneDefaultDataLabel[], plotClipUrl?: string): void {
        if (labels.length === 0) {
            this.#keyedGroup.clear();
            return;
        }

        this.#keyedGroup.reconcile(labels, {
            key: label => `${label.seriesId}:${label.markId}`,
            tag: "g",
            update: (group, label) => {
                const cx = label.bounds.x + label.bounds.width / 2;
                const cy = label.bounds.y + label.bounds.height / 2;
                const parsedFont = parseFontShorthand(label.font);

                let haloText = group.firstElementChild as SVGTextElement | null;
                let mainText = haloText?.nextElementSibling as SVGTextElement | null;

                if (!haloText) {
                    haloText = createSvgElement("text");
                    group.appendChild(haloText);
                }
                if (!mainText) {
                    mainText = createSvgElement("text");
                    group.appendChild(mainText);
                }

                if (label.haloWidth && label.haloWidth > 0 && label.haloColor) {
                    haloText.textContent = label.text;
                    setSvgAttribute(haloText, "x", cx);
                    setSvgAttribute(haloText, "y", cy);
                    setSvgAttribute(haloText, "text-anchor", "middle");
                    setSvgAttribute(haloText, "dominant-baseline", "middle");
                    setSvgAttribute(haloText, "fill", "none");
                    setSvgAttribute(haloText, "stroke", label.haloColor);
                    setSvgAttribute(haloText, "stroke-width", label.haloWidth * 2);
                    setSvgAttribute(haloText, "stroke-linejoin", "round");
                    setSvgAttribute(haloText, "font-family", parsedFont.fontFamily);
                    setSvgAttribute(haloText, "font-size", `${parsedFont.fontSize}px`);
                    setSvgAttribute(haloText, "font-weight", parsedFont.fontWeight);
                    if (parsedFont.fontStyle !== "normal") {
                        setSvgAttribute(haloText, "font-style", parsedFont.fontStyle);
                    }
                    haloText.style.display = "";
                } else {
                    haloText.style.display = "none";
                }
                haloText.style.font = label.font ?? "";

                mainText.textContent = label.text;
                setSvgAttribute(mainText, "x", cx);
                setSvgAttribute(mainText, "y", cy);
                setSvgAttribute(mainText, "text-anchor", "middle");
                setSvgAttribute(mainText, "dominant-baseline", "middle");
                setSvgAttribute(mainText, "fill", label.color);
                setSvgAttribute(mainText, "stroke", "none");
                setSvgAttribute(mainText, "font-family", parsedFont.fontFamily);
                setSvgAttribute(mainText, "font-size", `${parsedFont.fontSize}px`);
                setSvgAttribute(mainText, "font-weight", parsedFont.fontWeight);
                if (parsedFont.fontStyle !== "normal") {
                    setSvgAttribute(mainText, "font-style", parsedFont.fontStyle);
                }
                mainText.style.font = label.font ?? "";

                if (plotClipUrl) {
                    setSvgAttribute(group, "clip-path", plotClipUrl);
                } else {
                    group.removeAttribute("clip-path");
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
