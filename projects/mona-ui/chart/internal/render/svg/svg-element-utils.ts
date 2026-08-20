export const SVG_NS = "http://www.w3.org/2000/svg";

export function createSvgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K];
export function createSvgElement<T extends SVGElement = SVGElement>(tag: string): T;
export function createSvgElement(tag: string): SVGElement {
    return document.createElementNS(SVG_NS, tag);
}
