import { createSvgElement } from "./svg-element-utils";

export type SvgLayerName =
    | "defs"
    | "grid"
    | "static-underlay"
    | "series"
    | "selection"
    | "data-labels"
    | "static-overlay"
    | "axes"
    | "transient"
    | "brush";

export const SVG_LAYER_ORDER: readonly SvgLayerName[] = [
    "defs",
    "grid",
    "static-underlay",
    "series",
    "selection",
    "data-labels",
    "static-overlay",
    "axes",
    "transient",
    "brush"
] as const;

export class SvgRootLayers {
    readonly #defs: SVGDefsElement;
    readonly #layers: ReadonlyMap<SvgLayerName, SVGGElement>;

    public constructor(root: SVGSVGElement) {
        let defs = root.querySelector("defs");
        if (!defs) {
            defs = createSvgElement("defs");
            root.appendChild(defs);
        }
        this.#defs = defs;

        const layerMap = new Map<SvgLayerName, SVGGElement>();
        for (const layerName of SVG_LAYER_ORDER) {
            if (layerName === "defs") {
                continue;
            }
            let group = root.querySelector(`:scope > g[data-layer="${layerName}"]`) as SVGGElement | null;
            if (!group) {
                group = createSvgElement("g");
                group.setAttribute("data-layer", layerName);
                root.appendChild(group);
            }
            layerMap.set(layerName, group);
        }
        this.#layers = layerMap;
    }

    public get defs(): SVGDefsElement {
        return this.#defs;
    }

    public get grid(): SVGGElement {
        return this.#layers.get("grid")!;
    }

    public get staticUnderlay(): SVGGElement {
        return this.#layers.get("static-underlay")!;
    }

    public get series(): SVGGElement {
        return this.#layers.get("series")!;
    }

    public get selection(): SVGGElement {
        return this.#layers.get("selection")!;
    }

    public get dataLabels(): SVGGElement {
        return this.#layers.get("data-labels")!;
    }

    public get staticOverlay(): SVGGElement {
        return this.#layers.get("static-overlay")!;
    }

    public get axes(): SVGGElement {
        return this.#layers.get("axes")!;
    }

    public get transient(): SVGGElement {
        return this.#layers.get("transient")!;
    }

    public get brush(): SVGGElement {
        return this.#layers.get("brush")!;
    }

    public clearLayers(): void {
        for (const group of this.#layers.values()) {
            while (group.firstChild) {
                group.firstChild.remove();
            }
        }
    }

    public destroy(): void {
        this.clearLayers();
    }

    public getLayer(name: SvgLayerName): SVGGElement | SVGDefsElement {
        if (name === "defs") {
            return this.#defs;
        }
        return this.#layers.get(name)!;
    }

    public resetRootAttributes(): void {
        for (const group of this.#layers.values()) {
            group.removeAttribute("clip-path");
            group.removeAttribute("transform");
            group.removeAttribute("opacity");
            group.removeAttribute("filter");
            group.removeAttribute("mask");
        }
    }
}
