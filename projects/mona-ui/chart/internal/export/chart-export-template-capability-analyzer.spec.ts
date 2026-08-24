// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { ChartExportTemplateCapabilityAnalyzer } from "./chart-export-template-capability-analyzer";
import { ChartExportError } from "../../models/chart-export.models";

const SVG_NS = "http://www.w3.org/2000/svg";

function createTemplate(): HTMLElement {
    const el = document.createElement("div");
    el.setAttribute("data-mona-chart-export-role", "data-label-template");
    document.body.appendChild(el);
    return el;
}

describe("ChartExportTemplateCapabilityAnalyzer active content policy", () => {
    it("allows static inline SVG shapes", () => {
        const el = createTemplate();
        const svg = document.createElementNS(SVG_NS, "svg");
        const circle = document.createElementNS(SVG_NS, "circle");
        circle.setAttribute("cx", "10");
        circle.setAttribute("cy", "10");
        circle.setAttribute("r", "5");
        svg.appendChild(circle);
        el.appendChild(svg);

        expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).not.toThrow();
    });

    it.each(["animate", "animateTransform", "animateMotion", "set", "mpath"])(
        "rejects SMIL timing element <%s>",
        localName => {
            const el = createTemplate();
            const svg = document.createElementNS(SVG_NS, "svg");
            const circle = document.createElementNS(SVG_NS, "circle");
            const timing = document.createElementNS(SVG_NS, localName);
            circle.appendChild(timing);
            svg.appendChild(circle);
            el.appendChild(svg);

            try {
                expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(ChartExportError);
                try {
                    ChartExportTemplateCapabilityAnalyzer.assertSupported(el);
                } catch (err) {
                    expect((err as ChartExportError).message).toMatch(new RegExp(localName, "i"));
                }
            } finally {
                el.remove();
            }
        }
    );

    it("rejects <script> elements in custom raster templates", () => {
        const el = createTemplate();
        const script = document.createElement("script");
        script.textContent = "void 0;";
        el.appendChild(script);

        try {
            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(ChartExportError);
        } finally {
            el.remove();
        }
    });

    it("rejects uppercase or namespaced timing element spellings case-insensitively", () => {
        const el = createTemplate();
        const svg = document.createElementNS(SVG_NS, "svg");
        const animate = document.createElementNS(SVG_NS, "ANIMATE");
        svg.appendChild(animate);
        el.appendChild(svg);

        try {
            expect(() => ChartExportTemplateCapabilityAnalyzer.assertSupported(el)).toThrowError(/timing|animate/i);
        } finally {
            el.remove();
        }
    });
});
