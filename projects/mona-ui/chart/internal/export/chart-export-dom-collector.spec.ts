import { describe, expect, it } from "vitest";
import { ChartExportDomCollector } from "./chart-export-dom-collector";

describe("ChartExportDomCollector", () => {
    function createMockHost(): HTMLElement {
        const host = document.createElement("div");
        Object.defineProperty(host, "getBoundingClientRect", {
            value: () => ({ bottom: 400, height: 400, left: 100, right: 700, top: 50, width: 600, x: 100, y: 50 })
        });
        return host;
    }

    it("collects badges, vector texts, and raster islands with correct bounds and styles", () => {
        const host = createMockHost();

        // 1. Vector text element
        const titleEl = document.createElement("div");
        titleEl.setAttribute("data-mona-chart-export-role", "title");
        titleEl.textContent = "Sales Performance";
        titleEl.style.color = "rgb(51, 51, 51)";
        titleEl.style.fontSize = "16px";
        titleEl.style.fontFamily = "Arial";
        Object.defineProperty(titleEl, "getBoundingClientRect", {
            value: () => ({ bottom: 80, height: 20, left: 120, right: 300, top: 60, width: 180, x: 120, y: 60 })
        });
        host.appendChild(titleEl);

        // 2. Badge element
        const badgeEl = document.createElement("span");
        badgeEl.setAttribute("data-mona-chart-export-role", "badge");
        badgeEl.textContent = "High";
        badgeEl.style.backgroundColor = "rgb(255, 0, 0)";
        badgeEl.style.borderColor = "rgb(0, 0, 0)";
        badgeEl.style.borderWidth = "1px";
        badgeEl.style.color = "rgb(255, 255, 255)";
        Object.defineProperty(badgeEl, "getBoundingClientRect", {
            value: () => ({ bottom: 150, height: 25, left: 200, right: 260, top: 125, width: 60, x: 200, y: 125 })
        });
        host.appendChild(badgeEl);

        // 3. Raster island element
        const islandEl = document.createElement("div");
        islandEl.setAttribute("data-mona-chart-export-role", "custom-template");
        islandEl.setAttribute("data-mona-chart-export-mode", "raster");
        islandEl.innerHTML = '<span class="custom">Custom Template</span>';
        Object.defineProperty(islandEl, "getBoundingClientRect", {
            value: () => ({ bottom: 300, height: 80, left: 250, right: 400, top: 220, width: 150, x: 250, y: 220 })
        });
        host.appendChild(islandEl);

        const layers = ChartExportDomCollector.collect(host, host);

        expect(layers.vectorTexts.length).toBe(1);
        expect(layers.vectorTexts[0].text).toBe("Sales Performance");
        expect(layers.vectorTexts[0].bounds.x).toBe(20);
        expect(layers.vectorTexts[0].bounds.y).toBe(10);

        expect(layers.badges.length).toBe(1);
        expect(layers.badges[0].text).toBe("High");
        expect(layers.badges[0].bounds.x).toBe(100);
        expect(layers.badges[0].bounds.y).toBe(75);

        expect(layers.rasterIslands.length).toBe(1);
        expect(layers.rasterIslands[0].role).toBe("custom-template");
        expect(layers.rasterIslands[0].bounds.x).toBe(150);
        expect(layers.rasterIslands[0].bounds.y).toBe(170);
        expect(layers.rasterIslands[0].frozenRoot).toBeInstanceOf(HTMLElement);
        expect(layers.rasterIslands[0].frozenRoot).not.toBe(islandEl); // Must be a clone

        expect(layers.primitives.length).toBe(3);
    });

    it("recovers opacity for elements with animation suppression attribute (EXP-03)", () => {
        const host = createMockHost();

        const animatingLabel = document.createElement("div");
        animatingLabel.setAttribute("data-mona-chart-export-role", "sector-label");
        animatingLabel.setAttribute("data-mona-chart-export-animation-suppression", "opacity");
        animatingLabel.classList.add("opacity-0");
        animatingLabel.textContent = "Sector 1";
        animatingLabel.style.opacity = "0";
        Object.defineProperty(animatingLabel, "getBoundingClientRect", {
            value: () => ({ bottom: 100, height: 20, left: 150, right: 250, top: 80, width: 100, x: 150, y: 80 })
        });
        host.appendChild(animatingLabel);

        const layers = ChartExportDomCollector.collect(host, host);

        expect(layers.vectorTexts.length).toBe(1);
        expect(layers.vectorTexts[0].text).toBe("Sector 1");
        expect(layers.vectorTexts[0].opacity).toBe(1); // Restored to 1
    });

    it("computes clipRect for plot-local raster islands (EXP-14)", () => {
        const host = createMockHost();

        const plotSurface = document.createElement("div");
        Object.defineProperty(plotSurface, "getBoundingClientRect", {
            value: () => ({ bottom: 350, height: 300, left: 150, right: 650, top: 100, width: 500, x: 150, y: 100 })
        });
        host.appendChild(plotSurface);

        const templateIsland = document.createElement("div");
        templateIsland.setAttribute("data-mona-chart-export-role", "data-label-template");
        templateIsland.setAttribute("data-mona-chart-export-mode", "raster");
        Object.defineProperty(templateIsland, "getBoundingClientRect", {
            value: () => ({ bottom: 200, height: 50, left: 200, right: 300, top: 150, width: 100, x: 200, y: 150 })
        });
        plotSurface.appendChild(templateIsland);

        const layers = ChartExportDomCollector.collect(host, plotSurface);

        expect(layers.rasterIslands.length).toBe(1);
        expect(layers.rasterIslands[0].clipRect).toEqual({
            height: 300,
            width: 500,
            x: 50,
            y: 50
        });
    });

    it("classifies pure translation as vector text and complex rotation/matrix as raster island (R2-02)", () => {
        const host = createMockHost();

        // 1. Pure translation (e.g. matrix(1, 0, 0, 1, -50, 0))
        const translatedText = document.createElement("div");
        translatedText.setAttribute("data-mona-chart-export-role", "axis-label");
        translatedText.textContent = "Pure Translate";
        translatedText.style.transform = "matrix(1, 0, 0, 1, -50, 0)";
        Object.defineProperty(translatedText, "getBoundingClientRect", {
            value: () => ({ bottom: 90, height: 20, left: 120, right: 220, top: 70, width: 100, x: 120, y: 70 })
        });
        host.appendChild(translatedText);

        // 2. Rotated text (e.g. rotate(-45deg))
        const rotatedText = document.createElement("div");
        rotatedText.setAttribute("data-mona-chart-export-role", "rotated-axis-label");
        rotatedText.textContent = "Rotated Label";
        rotatedText.style.transform = "rotate(-45deg)";
        Object.defineProperty(rotatedText, "getBoundingClientRect", {
            value: () => ({ bottom: 200, height: 30, left: 150, right: 250, top: 170, width: 100, x: 150, y: 170 })
        });
        host.appendChild(rotatedText);

        const layers = ChartExportDomCollector.collect(host, host);

        // Pure translate stays vector text
        const vectorItem = layers.vectorTexts.find(t => t.text === "Pure Translate");
        expect(vectorItem).toBeDefined();

        // Rotated text is safely rasterized as a raster island
        const rasterItem = layers.rasterIslands.find(r => r.role === "rotated-axis-label");
        expect(rasterItem).toBeDefined();
        expect(rasterItem?.frozenRoot.textContent).toContain("Rotated Label");
    });

    it("preserves opacity 0 for consumer elements without explicit Mona suppression marker (R2-09)", () => {
        const host = createMockHost();

        const consumerHiddenEl = document.createElement("div");
        consumerHiddenEl.setAttribute("data-mona-chart-export-role", "consumer-label");
        consumerHiddenEl.classList.add("opacity-0");
        consumerHiddenEl.textContent = "Hidden Label";
        consumerHiddenEl.style.opacity = "0";
        Object.defineProperty(consumerHiddenEl, "getBoundingClientRect", {
            value: () => ({ bottom: 100, height: 20, left: 150, right: 250, top: 80, width: 100, x: 150, y: 80 })
        });
        host.appendChild(consumerHiddenEl);

        const layers = ChartExportDomCollector.collect(host, host);
        expect(layers.vectorTexts.length).toBe(1);
        expect(layers.vectorTexts[0].opacity).toBe(0); // Kept as 0 because no Mona suppression marker
    });
});
