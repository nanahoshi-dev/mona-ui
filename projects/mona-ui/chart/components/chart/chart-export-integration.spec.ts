import { Component, signal } from "@angular/core";
import {  TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "./chart.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { AreaSeriesComponent } from "../area-series/area-series.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { PieSeriesComponent } from "../pie-series/pie-series.component";
import { DonutSeriesComponent } from "../donut-series/donut-series.component";
import { GaugeSeriesComponent } from "../gauge-series/gauge-series.component";
import { TreemapSeriesComponent } from "../treemap-series/treemap-series.component";
import { FunnelSeriesComponent } from "../funnel-series/funnel-series.component";
import { WaterfallSeriesComponent } from "../waterfall-series/waterfall-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartLegendComponent } from "../chart-legend/chart-legend.component";
import { ChartExportError } from "../../models/chart-export.models";
import { ChartDownloadHelper } from "../../internal/export/chart-download-helper";
import { setPdfExportInstrumentation } from "../../internal/export/chart-pdf-exporter";
import { ChartInvalidationReason } from "../../internal/context/chart-registration-context";

interface DataItem {
    category: string;
    value: number;
}

const VALID_1X1_PNG_BYTES = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21,
    196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69,
    78, 68, 174, 66, 96, 130
]);

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [title]="title()"
            [subtitle]="subtitle()"
            [renderer]="renderer()"
            [xField]="'category'"
            style="display: block; width: 600px; height: 400px;">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-line-series [name]="'Revenue'" [field]="'value'" />
            <mona-chart-legend />
        </mona-chart>
    `,
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent, ChartLegendComponent]
})
class CartesianTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Jan", value: 10 },
        { category: "Feb", value: 25 },
        { category: "Mar", value: 40 }
    ]);
    public readonly renderer = signal<"canvas" | "svg">("canvas");
    public readonly subtitle = signal("Quarterly Trends");
    public readonly title = signal("Sales Overview");
}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            style="display: block; width: 600px; height: 400px;">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-bar-series [name]="'Units'" [field]="'value'" />
            <mona-area-series [name]="'Trend'" [field]="'value'" />
        </mona-chart>
    `,
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, BarSeriesComponent, AreaSeriesComponent]
})
class BarAndAreaTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Q1", value: 100 },
        { category: "Q2", value: 150 },
        { category: "Q3", value: 200 }
    ]);
}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [title]="title()"
            style="display: block; width: 500px; height: 500px;">
            <mona-pie-series [categoryField]="'category'" [field]="'value'" />
        </mona-chart>
    `,
    imports: [ChartComponent, PieSeriesComponent]
})
class PolarPieTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Desktop", value: 60 },
        { category: "Mobile", value: 30 },
        { category: "Tablet", value: 10 }
    ]);
    public readonly title = signal("Distribution");
}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            style="display: block; width: 500px; height: 500px;">
            <mona-donut-series [categoryField]="'category'" [field]="'value'" />
        </mona-chart>
    `,
    imports: [ChartComponent, DonutSeriesComponent]
})
class PolarDonutTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Chrome", value: 70 },
        { category: "Firefox", value: 20 },
        { category: "Safari", value: 10 }
    ]);
}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            style="display: block; width: 400px; height: 300px;">
            <mona-gauge-series [value]="75" />
        </mona-chart>
    `,
    imports: [ChartComponent, GaugeSeriesComponent]
})
class GaugeTestHostComponent {}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            style="display: block; width: 500px; height: 400px;">
            <mona-treemap-series [field]="'value'" [labelField]="'category'" />
        </mona-chart>
    `,
    imports: [ChartComponent, TreemapSeriesComponent]
})
class TreemapTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Alpha", value: 100 },
        { category: "Beta", value: 80 },
        { category: "Gamma", value: 50 }
    ]);
}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            style="display: block; width: 500px; height: 400px;">
            <mona-funnel-series [categoryField]="'category'" [field]="'value'" />
        </mona-chart>
    `,
    imports: [ChartComponent, FunnelSeriesComponent]
})
class FunnelTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Impressions", value: 1000 },
        { category: "Clicks", value: 300 },
        { category: "Purchases", value: 50 }
    ]);
}

@Component({
    template: `
        <mona-chart
            [animation]="false"
            [data]="data()"
            [xField]="'category'"
            style="display: block; width: 500px; height: 400px;">
            <mona-waterfall-series [field]="'value'" />
        </mona-chart>
    `,
    imports: [ChartComponent, WaterfallSeriesComponent]
})
class WaterfallTestHostComponent {
    public readonly data = signal<DataItem[]>([
        { category: "Starting", value: 100 },
        { category: "Gain", value: 30 },
        { category: "Loss", value: -20 }
    ]);
}

describe("Chart Export Integration Coverage", () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalImage = window.Image;

    beforeEach(() => {
        vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
            bottom: 400,
            height: 400,
            left: 0,
            right: 600,
            top: 0,
            width: 600,
            x: 0,
            y: 0,
            toJSON: () => ({})
        } as DOMRect);

        if (!(SVGElement.prototype as any).getBBox) {
            (SVGElement.prototype as any).getBBox = function () {
                return {
                    bottom: 16,
                    height: 16,
                    left: 0,
                    right: 50,
                    top: 0,
                    width: 50,
                    x: 0,
                    y: 0,
                    toJSON: () => ({})
                } as DOMRect;
            };
        }
        if (typeof SVGGraphicsElement !== "undefined" && !(SVGGraphicsElement.prototype as any).getBBox) {
            (SVGGraphicsElement.prototype as any).getBBox = (SVGElement.prototype as any).getBBox;
        }

        HTMLCanvasElement.prototype.getContext = function (type: string) {
            if (type === "2d") {
                return {
                    arc: () => {},
                    beginPath: () => {},
                    clearRect: () => {},
                    clip: () => {},
                    closePath: () => {},
                    createLinearGradient: () => ({ addColorStop: () => {} }),
                    createPattern: () => null,
                    createRadialGradient: () => ({ addColorStop: () => {} }),
                    drawImage: () => {},
                    fill: () => {},
                    fillRect: () => {},
                    fillText: () => {},
                    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: "high",
                    lineTo: () => {},
                    measureText: () => ({ width: 50 }),
                    moveTo: () => {},
                    putImageData: () => {},
                    quadraticCurveTo: () => {},
                    rect: () => {},
                    restore: () => {},
                    save: () => {},
                    scale: () => {},
                    setLineDash: () => {},
                    setTransform: () => {},
                    stroke: () => {},
                    strokeRect: () => {},
                    strokeText: () => {},
                    transform: () => {},
                    translate: () => {}
                } as any;
            }
            return null;
        } as any;

        HTMLCanvasElement.prototype.toBlob = function (callback: (blob: Blob | null) => void) {
            callback(new Blob([VALID_1X1_PNG_BYTES], { type: "image/png" }));
        };

        HTMLCanvasElement.prototype.toDataURL = function () {
            return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        };

        class MockImage {
            public crossOrigin = "";
            public set src(_v: string) {
                setTimeout(() => this.onload?.(new Event("load")), 0);
            }

            public onerror: ((ev: any) => void) | null = null;
            public onload: ((ev: Event) => void) | null = null;
        }

        (window as any).Image = MockImage;
    });

    afterEach(() => {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
        (window as any).Image = originalImage;
        setPdfExportInstrumentation(null);
    });

    describe("Cartesian Chart Export (Canvas and SVG renderers)", () => {
        it("exports standalone SVG document with metadata, vector text, and graphics from Canvas renderer", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({
                format: "svg",
                presentation: { selection: true }
            });

            expect(result.format).toBe("svg");
            expect(result.mimeType).toBe("image/svg+xml");
            expect(result.width).toBe(600);
            expect(result.height).toBe(400);
            expect(result.blob).toBeInstanceOf(Blob);
            expect(result.blob.size).toBeGreaterThan(0);

            const text = await result.blob.text();
            expect(text.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
            expect(text).toContain("<title id=\"mona-chart-export-title\">Sales Overview</title>");
            expect(text).toContain("<desc id=\"mona-chart-export-desc\">Quarterly Trends</desc>");
            expect(text).toContain("<path");
            expect(text).toContain("#3b82f6");
            expect(text).toContain("Revenue");
        });

        it("exports SVG document identically when renderer is SVG", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.componentInstance.renderer.set("svg");
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
            const text = await result.blob.text();
            expect(text).toContain("<path");
            expect(text).toContain("#3b82f6");
        });

        it("exports raster PNG from cartesian chart with valid PNG binary header", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({
                format: "png",
                pixelRatio: 2
            });

            expect(result.format).toBe("png");
            expect(result.mimeType).toBe("image/png");
            expect(result.width).toBe(600);
            expect(result.height).toBe(400);
            expect(result.blob).toBeInstanceOf(Blob);

            const buffer = await result.blob.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            expect(bytes[0]).toBe(0x89);
            expect(bytes[1]).toBe(0x50);
            expect(bytes[2]).toBe(0x4E);
            expect(bytes[3]).toBe(0x47);
        });

        it("exports PDF from cartesian chart", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({
                format: "pdf",
                mode: "vector",
                page: {
                    size: "chart"
                }
            });

            expect(result.format).toBe("pdf");
            expect(result.mimeType).toBe("application/pdf");
            expect(result.blob).toBeInstanceOf(Blob);
            expect(result.blob.size).toBeGreaterThan(0);
        });

        it("exports Bar and Area combined series chart", async () => {
            const fixture = TestBed.createComponent(BarAndAreaTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });

        it("scales and centers chart when output dimensions have mismatched aspect ratio", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            // Export with 1000 x 400 (aspect ratio differs from source 600 x 400)
            const result = await chartComponent.exportChart({
                background: "#f8fafc",
                format: "svg",
                height: 400,
                width: 1000
            });

            const text = await result.blob.text();
            expect(text).toContain('viewBox="0 0 1000 400"');
            expect(text).toContain('width="1000"');
            expect(text).toContain('height="400"');
            // Background covers full output rect 1000 x 400
            expect(text).toMatch(/<rect x="0" y="0" width="1000" height="400" fill="(?:#f8fafc|rgb\(248, 250, 252\))"/);
            // Content group is translated and centered
            expect(text).toContain('transform="translate(200, 0) scale(1)"');
        });

        it("rejects invalid pixelRatio values", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;

            await expect(
                chartComponent.exportChart({
                    format: "png",
                    pixelRatio: 0
                })
            ).rejects.toThrow(ChartExportError);

            await expect(
                chartComponent.exportChart({
                    format: "png",
                    pixelRatio: 10 // > 8
                })
            ).rejects.toThrow(ChartExportError);
        });

        it("validates PDF custom paper margins", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;

            await expect(
                chartComponent.exportChart({
                    format: "pdf",
                    page: {
                        margin: { bottom: 200, left: 150, right: 150, top: 200 },
                        size: { height: 300, width: 200 } // Total margins exceed dimensions
                    }
                })
            ).rejects.toThrow(ChartExportError);
        });

        it("falls back to raster PDF when SVG contains CJK characters in auto mode", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.componentInstance.title.set("売上データ 2026"); // CJK text
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            let didRasterize = false;
            setPdfExportInstrumentation({
                onFullRasterize: () => {
                    didRasterize = true;
                }
            });

            const result = await chartComponent.exportChart({
                format: "pdf",
                mode: "auto"
            });

            expect(result.format).toBe("pdf");
            expect(didRasterize).toBe(true);
        });
    });

    describe("Polar and Radial Family Export", () => {
        it("exports Polar Pie chart to SVG", async () => {
            const fixture = TestBed.createComponent(PolarPieTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
            const text = await result.blob.text();
            expect(text).toContain("Distribution");
        });

        it("exports Polar Donut chart to SVG", async () => {
            const fixture = TestBed.createComponent(PolarDonutTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });

        it("exports Gauge chart to SVG", async () => {
            const fixture = TestBed.createComponent(GaugeTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });
    });

    describe("Hierarchical and Specialized Family Export", () => {
        it("exports Treemap chart to SVG", async () => {
            const fixture = TestBed.createComponent(TreemapTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });

        it("exports Funnel chart to SVG", async () => {
            const fixture = TestBed.createComponent(FunnelTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });

        it("exports Waterfall chart to SVG", async () => {
            const fixture = TestBed.createComponent(WaterfallTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });
    });

    describe("Concurrency and Post-Snapshot Mutation Isolation", () => {
        it("supports concurrent exports of SVG, PNG, and PDF simultaneously", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const [svgRes, pngRes, pdfRes] = await Promise.all([
                chartComponent.exportChart({ format: "svg" }),
                chartComponent.exportChart({ format: "png", pixelRatio: 2 }),
                chartComponent.exportChart({ format: "pdf", mode: "auto" })
            ]);

            expect(svgRes.format).toBe("svg");
            expect(pngRes.format).toBe("png");
            expect(pdfRes.format).toBe("pdf");
            expect(svgRes.blob.size).toBeGreaterThan(0);
            expect(pngRes.blob.size).toBeGreaterThan(0);
            expect(pdfRes.blob.size).toBeGreaterThan(0);
        });

        it("isolates exported artifact from post-snapshot component data mutations", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const exportPromise = chartComponent.exportChart({ format: "svg" });

            // Mutate title immediately after export starts
            fixture.componentInstance.title.set("Mutated Title Post Snapshot");
            fixture.detectChanges();

            const result = await exportPromise;
            const text = await result.blob.text();

            // Export must retain the invocation state "Sales Overview"
            expect(text).toContain("Sales Overview");
            expect(text).not.toContain("Mutated Title Post Snapshot");
        });
    });

    describe("Download and Abort Lifecycle", () => {
        it("triggers downloadChart with sanitized filename", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            let downloadedBlob: Blob | null = null;
            let downloadedFileName: string | null = null;

            const originalDownload = ChartDownloadHelper.download;
            ChartDownloadHelper.download = (b, name) => {
                downloadedBlob = b;
                downloadedFileName = name;
            };

            try {
                const result = await chartComponent.downloadChart({
                    fileName: "my:chart*report",
                    format: "svg"
                });

                expect(downloadedFileName).toBe("my_chart_report.svg");
                expect(downloadedBlob).toBe(result.blob);
            } finally {
                ChartDownloadHelper.download = originalDownload;
            }
        });

        it("cancels export when AbortSignal is aborted", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene(ChartInvalidationReason.Data);

            const controller = new AbortController();
            controller.abort();

            await expect(
                chartComponent.exportChart({
                    format: "svg",
                    signal: controller.signal
                })
            ).rejects.toThrow();
        });

        it("throws not-ready when exporting a destroyed chart component", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            fixture.destroy();

            await expect(chartComponent.exportChart({ format: "svg" })).rejects.toThrow(ChartExportError);
        });
    });
});
