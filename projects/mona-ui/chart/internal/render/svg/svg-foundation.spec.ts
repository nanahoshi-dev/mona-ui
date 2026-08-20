import { describe, expect, it } from "vitest";
import { SvgIdNamespace } from "./svg-id-namespace";
import { SvgDefinitionRegistry } from "./svg-definition-registry";
import { SvgRootLayers } from "./svg-root-layers";
import { SvgKeyedGroup } from "./svg-keyed-group";
import { createSvgElement } from "./svg-element-utils";

describe("SVG Foundation Infrastructure", () => {
    it("SvgIdNamespace creates unique namespaced IDs and url references", () => {
        const ns1 = new SvgIdNamespace(1);
        const ns2 = new SvgIdNamespace(2);
        expect(ns1.id("plot-clip")).toBe("mona-chart-svg-1-plot-clip");
        expect(ns2.id("plot-clip")).toBe("mona-chart-svg-2-plot-clip");
        expect(ns1.url("plot-clip")).toBe("url(#mona-chart-svg-1-plot-clip)");
    });

    it("SvgDefinitionRegistry manages linear and radial gradients and clipPaths", () => {
        const defs = createSvgElement("defs");
        const ns = new SvgIdNamespace(1);
        const registry = new SvgDefinitionRegistry(defs, ns);

        registry.beginFrame();
        const clipUrl = registry.useClipRect("plot-clip", 0, 0, 500, 300);
        expect(clipUrl).toContain("url(#mona-chart-svg-1-plot-clip)");

        const gradUrl = registry.useLinearGradient("test-grad", {
            endX: 0,
            endY: 1,
            startX: 0,
            startY: 0,
            stops: [
                { color: "red", offset: 0 },
                { color: "blue", offset: 1 }
            ]
        });
        expect(gradUrl).toContain("url(#mona-chart-svg-1-test-grad)");
        registry.endFrame();

        expect(defs.childNodes.length).toBe(2);

        // Pruning on next frame if not reused
        registry.beginFrame();
        registry.endFrame();
        expect(defs.childNodes.length).toBe(0);
    });

    it("SvgRootLayers maintains exact 9 DOM layers in strict authoritative order", () => {
        const svg = createSvgElement("svg");
        const rootLayers = new SvgRootLayers(svg);

        const expectedLayers = [
            "grid",
            "static-underlay",
            "series",
            "selection",
            "data-labels",
            "static-overlay",
            "axes",
            "transient",
            "brush"
        ];

        const childGroups = Array.from(svg.querySelectorAll("g[data-layer]"));
        const layerNames = childGroups.map(g => g.getAttribute("data-layer"));
        expect(layerNames).toEqual(expectedLayers);

        rootLayers.clearLayers();
        expect(childGroups.length).toBe(9);
        rootLayers.destroy();
    });

    it("SvgKeyedGroup reconciles elements based on keys efficiently", () => {
        const parent = createSvgElement("g");
        const keyedGroup = new SvgKeyedGroup<{ id: string; val: number }, SVGCircleElement>(parent);

        keyedGroup.reconcile(
            [
                { id: "a", val: 10 },
                { id: "b", val: 20 }
            ],
            {
                key: d => d.id,
                tag: "circle",
                update: (el, d) => el.setAttribute("r", String(d.val))
            }
        );

        expect(parent.children.length).toBe(2);
        expect(parent.children[0].getAttribute("r")).toBe("10");
        expect(parent.children[1].getAttribute("r")).toBe("20");

        // Reconcile with reorder and deletion
        keyedGroup.reconcile(
            [{ id: "b", val: 30 }],
            {
                key: d => d.id,
                tag: "circle",
                update: (el, d) => el.setAttribute("r", String(d.val))
            }
        );

        expect(parent.children.length).toBe(1);
        expect(parent.children[0].getAttribute("r")).toBe("30");
    });
});
