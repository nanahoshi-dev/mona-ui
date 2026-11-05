import { Component, PLATFORM_ID, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChartComponent } from "../components/chart/chart.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { ChartInvalidationReason } from "../internal/context/chart-registration-context";
import { ChartDownloadHelper, DOWNLOAD_URL_LIFETIME_MS } from "../internal/export/chart-download-helper";
import { ChartPngExporter, PNG_DECODE_TIMEOUT_MS } from "../internal/export/chart-png-exporter";
import type { NormalizedChartExportRequest } from "../internal/export/chart-export-options";
import type { ChartExportSnapshot } from "../internal/export/chart-export-snapshot";
import type { FinalizedSvgOutput } from "../internal/export/chart-export-svg-finalizer";
import { ChartLayoutEngine } from "../internal/layout/chart-layout-engine";
import { ChartExportError } from "../models/chart-export.models";

@Component({
    imports: [ChartComponent, LineSeriesComponent],
    template: `
        @if (shown()) {
            <mona-chart
                [style.width.px]="600"
                [style.height.px]="400"
                [data]="data"
                xField="x"
                [attr.data-pass]="pass()">
                <mona-line-series name="Revenue" field="y" color="oklch(0.6 0.2 250)" />
            </mona-chart>
        }
    `
})
class ChartHostComponent {
    public readonly data = [
        { x: "A", y: 1 },
        { x: "B", y: 3 },
        { x: "C", y: 2 }
    ];
    public readonly pass = signal(0);
    public readonly shown = signal(true);
}

/** Counts the MutationObservers that are observing and haven't been disconnected. */
class TrackedMutationObserver extends MutationObserver {
    public static active = 0;
    #observing = false;

    public override disconnect(): void {
        if (this.#observing) {
            this.#observing = false;
            TrackedMutationObserver.active--;
        }
        super.disconnect();
    }

    public override observe(target: Node, options?: MutationObserverInit): void {
        if (!this.#observing) {
            this.#observing = true;
            TrackedMutationObserver.active++;
        }
        super.observe(target, options);
    }
}

/** Gives every element a 600 × 400 box, since jsdom has no layout. */
function giveElementsASize(): void {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 400));
}

function render(platform?: string): ComponentFixture<ChartHostComponent> {
    TestBed.configureTestingModule({
        imports: [ChartHostComponent],
        providers: platform ? [{ provide: PLATFORM_ID, useValue: platform }] : []
    });
    const fixture = TestBed.createComponent(ChartHostComponent);
    fixture.detectChanges();
    return fixture;
}

function chartOf(fixture: ComponentFixture<unknown>): ChartComponent {
    return fixture.debugElement.children[0].componentInstance as ChartComponent;
}

/** Lets the MutationObserver deliver and the chart's render frame run. */
/** Replaces a global for one test without touching the stubs from test-setup.ts, which vi.unstubAllGlobals() would. */
function replaceGlobal(name: string, value: unknown): () => void {
    const record = globalThis as unknown as Record<string, unknown>;
    const had = name in record;
    const original = record[name];
    record[name] = value;
    return () => {
        if (had) {
            record[name] = original;
        } else {
            delete record[name];
        }
    };
}

async function mutationsDelivered(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
    await new Promise(resolve => setTimeout(resolve, 50));
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
});

describe("Chart lifecycle and performance", () => {
    it("ignores page class and style changes that leave its styles alone, like a dialog's scroll block", async () => {
        giveElementsASize();
        const fixture = render();
        await fixture.whenStable();
        const prepare = vi.spyOn(ChartLayoutEngine, "prepareStructural");

        document.documentElement.classList.add("cdk-global-scrollblock");
        document.documentElement.style.top = "-120px";
        await mutationsDelivered();
        fixture.detectChanges();

        expect(prepare).not.toHaveBeenCalled();
        expect(chartOf(fixture).isAnimating()).toBe(false);
    });

    it("restyles without a morph when a style it reads changes", async () => {
        giveElementsASize();
        const fixture = render();
        await fixture.whenStable();
        const prepare = vi.spyOn(ChartLayoutEngine, "prepareStructural");

        const theme = document.createElement("style");
        theme.textContent = ".dark mona-chart { color: rgb(1, 2, 3); }";
        document.head.appendChild(theme);
        document.documentElement.classList.add("dark");
        await mutationsDelivered();
        fixture.detectChanges();
        theme.remove();

        expect(prepare).toHaveBeenCalled();
        expect(chartOf(fixture).isAnimating()).toBe(false);
    });

    it("keeps one pair of observers when recomputeScene() runs before the first render, and none once destroyed", () => {
        const restore = replaceGlobal("MutationObserver", TrackedMutationObserver);
        TrackedMutationObserver.active = 0;
        try {
            TestBed.configureTestingModule({ imports: [ChartHostComponent] });
            const fixture = TestBed.createComponent(ChartHostComponent);
            // Renders the view without running render hooks, so recomputeScene() comes before afterNextRender.
            fixture.changeDetectorRef.detectChanges();
            chartOf(fixture).recomputeScene(ChartInvalidationReason.Data);
            TestBed.tick();

            expect(TrackedMutationObserver.active).toBe(1);
            fixture.destroy();
            expect(TrackedMutationObserver.active).toBe(0);
        } finally {
            restore();
        }
    });

    it("runs no layout while it is destroyed", async () => {
        giveElementsASize();
        const fixture = render();
        await fixture.whenStable();
        const prepare = vi.spyOn(ChartLayoutEngine, "prepareStructural");

        fixture.componentInstance.shown.set(false);
        fixture.detectChanges();
        await mutationsDelivered();

        expect(prepare).not.toHaveBeenCalled();
    });

    it("repaints on pointer moves from the styles of the last layout, without reading or writing the DOM", () => {
        giveElementsASize();
        const fixture = render();
        const chart = chartOf(fixture);
        chart.recomputeScene(ChartInvalidationReason.Interaction);

        const getComputedStyle = vi.spyOn(window, "getComputedStyle");
        const appendChild = vi.spyOn(document.body, "appendChild");
        chart.recomputeScene(ChartInvalidationReason.Interaction);
        chart.recomputeScene(ChartInvalidationReason.Interaction);

        expect(getComputedStyle).not.toHaveBeenCalled();
        expect(appendChild).not.toHaveBeenCalled();
    });

    it("doesn't measure a hidden chart on every change-detection pass", () => {
        const fixture = render();
        TestBed.tick();
        const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect");

        for (let pass = 1; pass <= 5; pass++) {
            fixture.componentInstance.pass.set(pass);
            fixture.detectChanges();
        }

        expect(measure).not.toHaveBeenCalled();
    });

    it("renders its empty host on the server, with no layout", () => {
        const prepare = vi.spyOn(ChartLayoutEngine, "prepareStructural");
        const fixture = render("server");

        expect(prepare).not.toHaveBeenCalled();
        expect(chartOf(fixture).scene()).toBeNull();
    });

    it("resizes the canvas backing store when the device pixel ratio changes", () => {
        giveElementsASize();
        const listeners: (() => void)[] = [];
        const matchMedia = vi.fn(
            (query: string) =>
                ({
                    addEventListener: (_: string, listener: () => void) => listeners.push(listener),
                    matches: false,
                    media: query,
                    removeEventListener: () => undefined
                }) as unknown as MediaQueryList
        );
        const restore = replaceGlobal("matchMedia", matchMedia);
        try {
            const fixture = render();
            TestBed.tick();
            const canvas = (fixture.nativeElement as HTMLElement).querySelector("canvas") as HTMLCanvasElement;
            expect(matchMedia.mock.calls.map(call => call[0])).toContain("(resolution: 1dppx)");

            vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(2);
            listeners.at(-1)?.();

            expect(canvas.width).toBe(1200);
            expect(matchMedia.mock.calls.at(-1)?.[0]).toBe("(resolution: 2dppx)");
        } finally {
            restore();
        }
    });
});

describe("Chart export timing", () => {
    it("keeps the download URL valid long enough for the browser to read it", () => {
        vi.useFakeTimers();
        vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:chart");
        const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

        ChartDownloadHelper.download(new Blob(["x"]), "chart.png");
        vi.advanceTimersByTime(1000);
        expect(revoke).not.toHaveBeenCalled();
        vi.advanceTimersByTime(DOWNLOAD_URL_LIFETIME_MS);
        expect(revoke).toHaveBeenCalledWith("blob:chart");
    });

    it("fails the PNG export when the image never decodes", async () => {
        vi.useFakeTimers();
        const exported = ChartPngExporter.exportPng(
            { blob: new Blob(["<svg/>"], { type: "image/svg+xml" }) } as FinalizedSvgOutput,
            {} as ChartExportSnapshot,
            { height: 100, pixelRatio: 1, width: 100 } as NormalizedChartExportRequest
        );
        const outcome = exported.then(
            () => "resolved",
            (error: unknown) => error
        );

        await vi.advanceTimersByTimeAsync(PNG_DECODE_TIMEOUT_MS + 1);

        const error = await outcome;
        expect(error).toBeInstanceOf(ChartExportError);
        expect((error as ChartExportError).code).toBe("png-rasterization-failed");
    });
});
