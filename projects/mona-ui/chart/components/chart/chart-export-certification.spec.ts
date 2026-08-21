import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { ChartComponent } from "./chart.component";
import { LineSeriesComponent } from "../line-series/line-series.component";
import { BarSeriesComponent } from "../bar-series/bar-series.component";
import { PieSeriesComponent } from "../pie-series/pie-series.component";
import { GaugeSeriesComponent } from "../gauge-series/gauge-series.component";
import { TreemapSeriesComponent } from "../treemap-series/treemap-series.component";
import { ChartXAxisComponent } from "../chart-x-axis/chart-x-axis.component";
import { ChartYAxisComponent } from "../chart-y-axis/chart-y-axis.component";
import { ChartExportError } from "../../models/chart-export.models";
import { ChartDownloadHelper } from "../../internal/export/chart-download-helper";

interface DataItem {
    category: string;
    value: number;
}

@Component({
    template: `
        <mona-chart
            [data]="data()"
            [title]="title()"
            [subtitle]="subtitle()"
            [renderer]="renderer()"
            [xField]="'category'"
            style="display: block; width: 600px; height: 400px;">
            <mona-chart-x-axis />
            <mona-chart-y-axis />
            <mona-line-series [field]="'value'" />
        </mona-chart>
    `,
    imports: [ChartComponent, ChartXAxisComponent, ChartYAxisComponent, LineSeriesComponent]
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
            [data]="data()"
            [title]="'Distribution'"
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
}

@Component({
    template: `
        <mona-chart
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

function mockHostLayout(fixture: ComponentFixture<any>, width: number = 600, height: number = 400): void {
    const hostEl = fixture.nativeElement.querySelector("mona-chart") as HTMLElement;
    if (hostEl) {
        hostEl.getBoundingClientRect = () =>
            ({
                bottom: height,
                height,
                left: 0,
                right: width,
                top: 0,
                width,
                x: 0,
                y: 0,
                toJSON: () => ({})
            }) as DOMRect;
    }
    const plotSurface = hostEl?.querySelector(".flex-1") as HTMLElement;
    if (plotSurface) {
        plotSurface.getBoundingClientRect = () =>
            ({
                bottom: height,
                height: height - 60,
                left: 40,
                right: width - 20,
                top: 40,
                width: width - 60,
                x: 40,
                y: 40,
                toJSON: () => ({})
            }) as DOMRect;
    }
}

describe("ChartExportCertification", () => {
    describe("Cartesian Chart Export (Canvas and SVG renderers)", () => {
        it("exports standalone SVG document with metadata, vector text, and graphics from Canvas renderer", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

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
            expect(text).toContain("<title>Sales Overview</title>");
            expect(text).toContain("<desc>Quarterly Trends</desc>");
            expect(text).toContain("<path");
            expect(text).toContain("#3b82f6");
        });

        it("exports SVG document identically when renderer is SVG", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.componentInstance.renderer.set("svg");
            fixture.detectChanges();
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
            const text = await result.blob.text();
            expect(text).toContain("<path");
            expect(text).toContain("#3b82f6");
        });

        it("exports raster PNG from cartesian chart", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

            const originalImage = window.Image;
            const originalToBlob = HTMLCanvasElement.prototype.toBlob;
            const originalGetContext = HTMLCanvasElement.prototype.getContext;

            class MockImage {
                public crossOrigin = "";
                public set src(_v: string) {
                    setTimeout(() => this.onload?.(new Event("load")), 0);
                }
                public onload: ((ev: Event) => void) | null = null;
                public onerror: ((ev: any) => void) | null = null;
            }

            (window as any).Image = MockImage;
            HTMLCanvasElement.prototype.getContext = function (type: string) {
                if (type === "2d") {
                    return {
                        drawImage: () => {},
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: "high"
                    } as any;
                }
                return null;
            } as any;
            HTMLCanvasElement.prototype.toBlob = function (callback: (blob: Blob | null) => void) {
                callback(new Blob(["mock-png-data"], { type: "image/png" }));
            };

            try {
                const result = await chartComponent.exportChart({
                    format: "png",
                    pixelRatio: 2
                });

                expect(result.format).toBe("png");
                expect(result.mimeType).toBe("image/png");
                expect(result.width).toBe(600);
                expect(result.height).toBe(400);
                expect(result.blob).toBeInstanceOf(Blob);
            } finally {
                (window as any).Image = originalImage;
                HTMLCanvasElement.prototype.toBlob = originalToBlob;
                HTMLCanvasElement.prototype.getContext = originalGetContext;
            }
        });

        it("exports PDF from cartesian chart", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

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
    });

    describe("Polar and Radial Family Export", () => {
        it("exports Polar Pie chart to SVG", async () => {
            const fixture = TestBed.createComponent(PolarPieTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 500, 500);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
            const text = await result.blob.text();
            expect(text).toContain("Distribution");
        });

        it("exports Gauge chart to SVG", async () => {
            const fixture = TestBed.createComponent(GaugeTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 400, 300);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });
    });

    describe("Hierarchical Family Export", () => {
        it("exports Treemap chart to SVG", async () => {
            const fixture = TestBed.createComponent(TreemapTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 500, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

            const result = await chartComponent.exportChart({ format: "svg" });
            expect(result.format).toBe("svg");
            expect(result.blob.size).toBeGreaterThan(0);
        });
    });

    describe("Download and Abort Lifecycle", () => {
        it("triggers downloadChart with sanitized filename", async () => {
            const fixture = TestBed.createComponent(CartesianTestHostComponent);
            fixture.detectChanges();
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

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
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            chartComponent.recomputeScene();

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
            mockHostLayout(fixture, 600, 400);

            const chartComponent = fixture.debugElement.children[0].componentInstance as ChartComponent;
            fixture.destroy();

            await expect(chartComponent.exportChart({ format: "svg" })).rejects.toThrow(ChartExportError);
        });
    });
});
