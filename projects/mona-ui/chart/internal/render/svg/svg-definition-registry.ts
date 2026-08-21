import { formatRgb, parse } from "culori";
import { createSvgElement } from "./svg-element-utils";
import { formatSvgNumber, setSvgAttribute } from "./svg-attribute-utils";
import type { SvgIdNamespace } from "./svg-id-namespace";

export interface LinearGradientDefinition {
    readonly endX?: number;
    readonly endY?: number;
    readonly gradientUnits?: "userSpaceOnUse" | "objectBoundingBox";
    readonly startX?: number;
    readonly startY?: number;
    readonly stops: readonly { readonly color: string; readonly offset: number }[];
}

export interface RadialGradientDefinition {
    readonly cx?: number;
    readonly cy?: number;
    readonly fx?: number;
    readonly fy?: number;
    readonly gradientUnits?: "userSpaceOnUse" | "objectBoundingBox";
    readonly r?: number;
    readonly stops: readonly { readonly color: string; readonly offset: number }[];
}

export class SvgDefinitionRegistry {
    #defsElement: SVGDefsElement | null;
    readonly #namespace: SvgIdNamespace;
    readonly #prefix: string;
    readonly #usedIds: Set<string>;
    readonly #elementsById: Map<string, SVGElement>;

    public constructor(
        defsElement: SVGDefsElement,
        namespace: SvgIdNamespace,
        prefix = "",
        elementsById?: Map<string, SVGElement>,
        usedIds?: Set<string>
    ) {
        this.#defsElement = defsElement;
        this.#namespace = namespace;
        this.#prefix = prefix;
        this.#elementsById = elementsById ?? new Map<string, SVGElement>();
        this.#usedIds = usedIds ?? new Set<string>();
    }

    public withScope(prefix: string): SvgDefinitionRegistry {
        const fullPrefix = this.#prefix ? `${this.#prefix}-${prefix}` : prefix;
        return new SvgDefinitionRegistry(
            this.#defsElement as SVGDefsElement,
            this.#namespace,
            fullPrefix,
            this.#elementsById,
            this.#usedIds
        );
    }

    public beginFrame(): void {
        this.#usedIds.clear();
    }

    public useClipRect(idSuffix: string, x: number, y: number, width: number, height: number): string {
        const scopedSuffix = this.#prefix ? `${this.#prefix}-${idSuffix}` : idSuffix;
        const fullId = this.#namespace.id(scopedSuffix);
        this.#usedIds.add(fullId);

        let clipPath = this.#elementsById.get(fullId) as SVGClipPathElement | undefined;
        let rect: SVGRectElement;

        if (!clipPath || !clipPath.parentElement) {
            clipPath = createSvgElement("clipPath");
            clipPath.id = fullId;
            rect = createSvgElement("rect");
            clipPath.appendChild(rect);
            this.#defsElement?.appendChild(clipPath);
            this.#elementsById.set(fullId, clipPath);
        } else {
            rect = clipPath.firstElementChild as SVGRectElement;
            if (!rect) {
                rect = createSvgElement("rect");
                clipPath.appendChild(rect);
            }
        }

        setSvgAttribute(rect, "x", x);
        setSvgAttribute(rect, "y", y);
        setSvgAttribute(rect, "width", Math.max(0, width));
        setSvgAttribute(rect, "height", Math.max(0, height));

        return `url(#${fullId})`;
    }

    public useLinearGradient(idSuffix: string, def: LinearGradientDefinition): string {
        const scopedSuffix = this.#prefix ? `${this.#prefix}-${idSuffix}` : idSuffix;
        const fullId = this.#namespace.id(scopedSuffix);
        this.#usedIds.add(fullId);

        let grad = this.#elementsById.get(fullId) as SVGLinearGradientElement | undefined;
        if (!grad || !grad.parentElement) {
            grad = createSvgElement("linearGradient");
            grad.id = fullId;
            this.#defsElement?.appendChild(grad);
            this.#elementsById.set(fullId, grad);
        }

        setSvgAttribute(grad, "gradientUnits", def.gradientUnits ?? "userSpaceOnUse");
        setSvgAttribute(grad, "x1", def.startX ?? 0);
        setSvgAttribute(grad, "y1", def.startY ?? 0);
        setSvgAttribute(grad, "x2", def.endX ?? 0);
        setSvgAttribute(grad, "y2", def.endY ?? 0);

        this.#syncStops(grad, def.stops);

        return `url(#${fullId})`;
    }

    public useRadialGradient(idSuffix: string, def: RadialGradientDefinition): string {
        const scopedSuffix = this.#prefix ? `${this.#prefix}-${idSuffix}` : idSuffix;
        const fullId = this.#namespace.id(scopedSuffix);
        this.#usedIds.add(fullId);

        let grad = this.#elementsById.get(fullId) as SVGRadialGradientElement | undefined;
        if (!grad || !grad.parentElement) {
            grad = createSvgElement("radialGradient");
            grad.id = fullId;
            this.#defsElement?.appendChild(grad);
            this.#elementsById.set(fullId, grad);
        }

        setSvgAttribute(grad, "gradientUnits", def.gradientUnits ?? "userSpaceOnUse");
        setSvgAttribute(grad, "cx", def.cx ?? 0);
        setSvgAttribute(grad, "cy", def.cy ?? 0);
        setSvgAttribute(grad, "r", def.r ?? 0);
        if (def.fx !== undefined) {
            setSvgAttribute(grad, "fx", def.fx);
        } else {
            grad.removeAttribute("fx");
        }
        if (def.fy !== undefined) {
            setSvgAttribute(grad, "fy", def.fy);
        } else {
            grad.removeAttribute("fy");
        }

        this.#syncStops(grad, def.stops);

        return `url(#${fullId})`;
    }

    public endFrame(): void {
        for (const [id, element] of this.#elementsById.entries()) {
            if (!this.#usedIds.has(id)) {
                element.remove();
                this.#elementsById.delete(id);
            }
        }
    }

    public clear(): void {
        for (const element of this.#elementsById.values()) {
            element.remove();
        }
        this.#elementsById.clear();
        this.#usedIds.clear();
    }

    public destroy(): void {
        this.clear();
        this.#defsElement = null;
    }

    #syncStops(gradient: SVGGradientElement, stops: readonly { readonly color: string; readonly offset: number }[]): void {
        const existingStops = Array.from(gradient.children) as SVGStopElement[];
        while (existingStops.length > stops.length) {
            existingStops.pop()?.remove();
        }
        for (let i = 0; i < stops.length; i++) {
            let stop = existingStops[i];
            if (!stop) {
                stop = createSvgElement("stop");
                gradient.appendChild(stop);
            }
            setSvgAttribute(stop, "offset", `${formatSvgNumber(stops[i].offset * 100)}%`);

            const rawColor = stops[i].color;
            const parsed = parse(rawColor);
            if (parsed) {
                const rgbOnly = formatRgb({ ...parsed, alpha: undefined });
                setSvgAttribute(stop, "stop-color", rgbOnly || rawColor);
                if (parsed.alpha !== undefined) {
                    setSvgAttribute(stop, "stop-opacity", formatSvgNumber(parsed.alpha));
                } else {
                    setSvgAttribute(stop, "stop-opacity", "1");
                }
            } else {
                setSvgAttribute(stop, "stop-color", rawColor);
                setSvgAttribute(stop, "stop-opacity", "1");
            }
        }
    }
}
