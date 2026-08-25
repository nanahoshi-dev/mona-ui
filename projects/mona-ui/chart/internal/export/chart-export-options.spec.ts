import { describe, expect, it } from "vitest";
import { normalizeChartDownloadOptions, normalizeChartExportOptions, sanitizeFileName } from "./chart-export-options";
import { ChartExportError } from "../../models/chart-export.models";

describe("ChartExportOptions", () => {
    describe("normalizeChartExportOptions", () => {
        it("normalizes default SVG options with source dimensions", () => {
            const normalized = normalizeChartExportOptions({ format: "svg" }, 800, 500);
            expect(normalized.format).toBe("svg");
            expect(normalized.width).toBe(800);
            expect(normalized.height).toBe(500);
            expect(normalized.pixelRatio).toBe(1);
            expect(normalized.background).toBe("auto");
            expect(normalized.accessibility).toBe(true);
            expect(normalized.presentation).toEqual({
                brush: false,
                crosshair: false,
                selection: true
            });
        });

        it("respects explicit width, height, and background", () => {
            const normalized = normalizeChartExportOptions(
                {
                    background: "#123456",
                    format: "png",
                    height: 600,
                    pixelRatio: 3,
                    width: 1000
                },
                800,
                500
            );
            expect(normalized.width).toBe(1000);
            expect(normalized.height).toBe(600);
            expect(normalized.pixelRatio).toBe(3);
            expect(normalized.background === "#123456" || normalized.background === "rgb(18, 52, 86)").toBe(true);
        });

        it("accepts valid pixelRatio (0.25 to 8) and rejects out-of-bounds values (EXP-15)", () => {
            const low = normalizeChartExportOptions({ format: "png", pixelRatio: 0.5 }, 500, 300);
            expect(low.pixelRatio).toBe(0.5);

            const high = normalizeChartExportOptions({ format: "png", pixelRatio: 4 }, 500, 300);
            expect(high.pixelRatio).toBe(4);

            expect(() => normalizeChartExportOptions({ format: "png", pixelRatio: 0.1 }, 500, 300)).toThrow(
                ChartExportError
            );
            expect(() => normalizeChartExportOptions({ format: "png", pixelRatio: 12 }, 500, 300)).toThrow(
                ChartExportError
            );
        });

        it("normalizes PDF page size and margins", () => {
            const normalized = normalizeChartExportOptions(
                {
                    format: "pdf",
                    mode: "vector",
                    page: {
                        margin: 20,
                        orientation: "portrait",
                        size: "a4"
                    }
                },
                800,
                400
            );

            expect(normalized.format).toBe("pdf");
            expect(normalized.pdfMode).toBe("vector");
            expect(normalized.pdfPage.size).toBe("a4");
            expect(normalized.pdfPage.orientation).toBe("portrait");
            expect(normalized.pdfPage.margin).toEqual({
                bottom: 20,
                left: 20,
                right: 20,
                top: 20
            });
        });

        it("throws invalid-options for non-positive or invalid dimensions", () => {
            expect(() => normalizeChartExportOptions({ format: "svg", width: 0 }, 500, 300)).toThrow(ChartExportError);
            expect(() => normalizeChartExportOptions({ format: "svg", width: -100 }, 500, 300)).toThrow(
                ChartExportError
            );
            expect(() => normalizeChartExportOptions({ format: "svg", height: NaN }, 500, 300)).toThrow(
                ChartExportError
            );
            expect(() => normalizeChartExportOptions({ format: "svg", width: Infinity }, 500, 300)).toThrow(
                ChartExportError
            );
        });

        it("throws invalid-options when chart has zero source dimensions and no explicit size", () => {
            expect(() => normalizeChartExportOptions({ format: "svg" }, 0, 0)).toThrow(ChartExportError);
        });
    });

    describe("sanitizeFileName and normalizeChartDownloadOptions", () => {
        it("sanitizes forbidden characters in filename", () => {
            expect(sanitizeFileName("my/cool:chart*name?.png", "png")).toBe("my_cool_chart_name_.png");
            expect(sanitizeFileName("", "png")).toBe("chart.png");
            expect(sanitizeFileName("   ", "png")).toBe("chart.png");
        });

        it("appends correct extension according to export format", () => {
            const pngDownload = normalizeChartDownloadOptions({ fileName: "report_q3", format: "png" }, 500, 300);
            expect(pngDownload.fileName).toBe("report_q3.png");

            const svgDownload = normalizeChartDownloadOptions(
                { fileName: "vector_chart.svg", format: "svg" },
                500,
                300
            );
            expect(svgDownload.fileName).toBe("vector_chart.svg");

            const pdfDownload = normalizeChartDownloadOptions({ fileName: "summary", format: "pdf" }, 500, 300);
            expect(pdfDownload.fileName).toBe("summary.pdf");
        });

        it("falls back to chart title when filename is omitted", () => {
            const download = normalizeChartDownloadOptions({ format: "png" }, 500, 300, "Revenue Analysis 2026");
            expect(download.fileName).toBe("Revenue Analysis 2026.png");
        });
    });
});
