// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { isolateFragmentIds } from "./chart-export-fragment-isolator";
import { ChartExportError } from "../../models/chart-export.models";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(localName: string): SVGElement {
    return document.createElementNS(SVG_NS, localName);
}

describe("chart-export-fragment-isolator", () => {
    it("returns false when the island declares no IDs", () => {
        const root = document.createElement("div");
        root.innerHTML = "<span>plain</span>";

        expect(isolateFragmentIds(root, "mona-export-prim-1")).toBe(false);
    });

    it("namespaces all declared IDs and rewrites owned url(...) references consistently", () => {
        const root = document.createElement("div");
        const svg = svgElement("svg");
        const defs = svgElement("defs");
        const gradient = svgElement("linearGradient");
        gradient.setAttribute("id", "grad-1");
        defs.appendChild(gradient);
        svg.appendChild(defs);

        const rect = svgElement("rect");
        rect.setAttribute("fill", "url(#grad-1)");
        svg.appendChild(rect);
        root.appendChild(svg);

        expect(isolateFragmentIds(root, "mona-export-prim-4")).toBe(true);

        expect(gradient.getAttribute("id")).toBe("mona-export-prim-4--grad-1");
        expect(rect.getAttribute("fill")).toBe("url(#mona-export-prim-4--grad-1)");
    });

    it("rewrites quoted and differently-cased url token forms", () => {
        const root = document.createElement("div");
        const clip = svgElement("clipPath");
        clip.setAttribute("id", "clip");
        root.appendChild(clip);

        const rect = svgElement("rect");
        rect.setAttribute("clip-path", "url( '#clip' )");
        root.appendChild(rect);

        isolateFragmentIds(root, "prim");

        expect(clip.getAttribute("id")).toBe("prim--clip");
        expect(rect.getAttribute("clip-path")).toBe("url( '#prim--clip' )");
    });

    it("rewrites href and xlink:href local fragments", () => {
        const root = document.createElement("div");
        const symbol = svgElement("symbol");
        symbol.setAttribute("id", "icon");
        root.appendChild(symbol);

        const useA = svgElement("use");
        useA.setAttribute("href", "#icon");
        const useB = svgElement("use");
        useB.setAttribute("xlink:href", "#icon");
        root.appendChild(useA);
        root.appendChild(useB);

        isolateFragmentIds(root, "prim-2");

        expect(useA.getAttribute("href")).toBe("#prim-2--icon");
        expect(useB.getAttribute("xlink:href")).toBe("#prim-2--icon");
    });

    it("leaves color hashes, text content, and non-reference attributes untouched", () => {
        const root = document.createElement("div");
        const rect = svgElement("rect");
        rect.setAttribute("fill", "#ff0000");
        rect.setAttribute("stroke", "#123456");
        root.appendChild(rect);

        isolateFragmentIds(root, "prim-3");

        expect(rect.getAttribute("fill")).toBe("#ff0000");
        expect(rect.getAttribute("stroke")).toBe("#123456");
    });

    it("keeps multiple references to the same target consistent", () => {
        const root = document.createElement("div");
        const marker = svgElement("marker");
        marker.setAttribute("id", "arrow");
        root.appendChild(marker);

        const pathA = svgElement("path");
        pathA.setAttribute("marker-end", "url(#arrow)");
        const pathB = svgElement("path");
        pathB.setAttribute("marker-start", "url(#arrow)");
        root.appendChild(pathA);
        root.appendChild(pathB);

        isolateFragmentIds(root, "prim-5");

        expect(marker.getAttribute("id")).toBe("prim-5--arrow");
        expect(pathA.getAttribute("marker-end")).toBe("url(#prim-5--arrow)");
        expect(pathB.getAttribute("marker-start")).toBe("url(#prim-5--arrow)");
    });

    it("produces disjoint namespaces across islands with identical original IDs", () => {
        const islandA = document.createElement("div");
        const gradA = svgElement("linearGradient");
        gradA.setAttribute("id", "shared");
        islandA.appendChild(gradA);

        const islandB = document.createElement("div");
        const gradB = svgElement("linearGradient");
        gradB.setAttribute("id", "shared");
        islandB.appendChild(gradB);

        isolateFragmentIds(islandA, "mona-export-prim-1");
        isolateFragmentIds(islandB, "mona-export-prim-2");

        expect(gradA.getAttribute("id")).toBe("mona-export-prim-1--shared");
        expect(gradB.getAttribute("id")).toBe("mona-export-prim-2--shared");
        expect(gradA.getAttribute("id")).not.toBe(gradB.getAttribute("id"));
    });

    it("never mutates the live document namespace", () => {
        const liveGradient = svgElement("linearGradient");
        liveGradient.setAttribute("id", "outside-shared");
        const liveHost = document.createElement("div");
        liveHost.appendChild(liveGradient);
        document.body.appendChild(liveHost);

        try {
            const island = document.createElement("div");
            const insideGradient = svgElement("linearGradient");
            insideGradient.setAttribute("id", "outside-shared");
            island.appendChild(insideGradient);

            isolateFragmentIds(island, "prim-9");

            expect(liveGradient.getAttribute("id")).toBe("outside-shared");
            expect(insideGradient.getAttribute("id")).toBe("prim-9--outside-shared");
        } finally {
            liveHost.remove();
        }
    });

    it("handles punctuation-heavy IDs without loss", () => {
        const root = document.createElement("div");
        const gradient = svgElement("linearGradient");
        const weirdId = "my/weird:id.with~punctuation+plus";
        gradient.setAttribute("id", weirdId);
        root.appendChild(gradient);

        const rect = svgElement("rect");
        rect.setAttribute("fill", `url(#${weirdId})`);
        root.appendChild(rect);

        const use = svgElement("use");
        use.setAttribute("href", `#${weirdId}`);
        root.appendChild(use);

        isolateFragmentIds(root, "prim-11");

        expect(gradient.getAttribute("id")).toBe(`prim-11--${weirdId}`);
        expect(rect.getAttribute("fill")).toBe(`url(#prim-11--${weirdId})`);
        expect(use.getAttribute("href")).toBe(`#prim-11--${weirdId}`);
    });

    it("fails closed on url() fragments containing characters that cannot form a valid CSS url token", () => {
        const root = document.createElement("div");
        const gradient = svgElement("linearGradient");
        gradient.setAttribute("id", "paren(id)");
        root.appendChild(gradient);

        const rect = svgElement("rect");
        rect.setAttribute("fill", "url(#paren(id))");
        root.appendChild(rect);

        expect(() => isolateFragmentIds(root, "prim-14")).toThrowError(/not certified/);
    });

    it("rejects duplicate IDs within one island", () => {
        const root = document.createElement("div");
        const a = svgElement("linearGradient");
        a.setAttribute("id", "dup");
        const b = svgElement("radialGradient");
        b.setAttribute("id", "dup");
        root.appendChild(a);
        root.appendChild(b);

        expect(() => isolateFragmentIds(root, "prim-12")).toThrowError(ChartExportError);
    });

    it("fails closed when a local reference was not certified as an island-owned fragment", () => {
        const root = document.createElement("div");
        const rect = svgElement("rect");
        rect.setAttribute("fill", "url(#missing-target)");
        root.appendChild(rect);

        expect(() => isolateFragmentIds(root, "prim-13")).toThrowError(/not certified/);
    });
});
