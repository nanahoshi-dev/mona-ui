import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, provideMonaI18n } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales/de-de";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BarSeriesComponent } from "../components/bar-series/bar-series.component";
import { ChartComponent } from "../components/chart/chart.component";
import { LineSeriesComponent } from "../components/line-series/line-series.component";
import { WaterfallSeriesComponent } from "../components/waterfall-series/waterfall-series.component";
import { CHART_DEFAULT_MESSAGES } from "../i18n/chart.default-messages";
import { resolveSeriesDisplayName } from "../internal/data/chart-value-resolver";
import { formatFunnelPercentage } from "../internal/data/funnel-data";
import { formatPolarPercentage } from "../internal/data/polar-data";
import type { CartesianSceneBase } from "../internal/scene/chart-scene";
import { formatPercentagePoint, formatTimeRange } from "../internal/utils/chart-formatter";
import { setChartLocale } from "../internal/utils/chart-locale";
import { formatCompactNumber } from "../internal/utils/number-utils";

const DAY_MS = 86_400_000;

@Component({
    imports: [ChartComponent, BarSeriesComponent, LineSeriesComponent, WaterfallSeriesComponent],
    template: `
        <mona-chart
            [animation]="false"
            [style.width.px]="600"
            [style.height.px]="400"
            [data]="data"
            xField="x"
            [attr.data-pass]="pass()">
            @if (kind() === "bar") {
                <mona-bar-series name="Revenue" field="y" />
            } @else if (kind() === "line") {
                <mona-line-series name="Revenue" field="y" />
            } @else {
                <mona-waterfall-series name="Cash" field="y" />
            }
        </mona-chart>
    `
})
class ChartHostComponent {
    public readonly data = [
        { x: "A", y: 1_500_000 },
        { x: "B", y: 2_500_000 },
        { x: "C", y: 1.5 }
    ];
    public readonly kind = signal<"bar" | "line" | "waterfall">("bar");
    public readonly pass = signal(0);
}

function render(
    kind: "bar" | "line" | "waterfall",
    locale?: typeof MONA_DE_DE_LOCALE
): ComponentFixture<ChartHostComponent> {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 600, 400));
    TestBed.configureTestingModule({
        imports: [ChartHostComponent],
        providers: [provideMonaI18n(locale ? { locale } : {})]
    });
    const fixture = TestBed.createComponent(ChartHostComponent);
    fixture.componentInstance.kind.set(kind);
    fixture.detectChanges();
    TestBed.tick();
    return fixture;
}

function chartOf(fixture: ComponentFixture<unknown>): ChartComponent {
    return fixture.debugElement.children[0].componentInstance as ChartComponent;
}

function valueTicks(fixture: ComponentFixture<unknown>): string[] {
    const scene = chartOf(fixture).scene() as CartesianSceneBase | null;
    const axis = scene?.axes.find(a => a.axis === "y");
    return axis?.ticks.map(t => t.formattedValue) ?? [];
}

function announceFirstPoint(fixture: ComponentFixture<unknown>): string {
    const root = (fixture.nativeElement as HTMLElement).querySelector('[tabindex="0"]') as HTMLElement;
    root.focus();
    root.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    fixture.detectChanges();
    const live = (fixture.nativeElement as HTMLElement).querySelector('[aria-live="polite"]') as HTMLElement;
    return live.textContent?.trim() ?? "";
}

afterEach(() => {
    setChartLocale("en-US", CHART_DEFAULT_MESSAGES);
    vi.restoreAllMocks();
});

describe("Chart number and date formats", () => {
    it("formats compact values past millions, and small values without float noise", () => {
        expect(formatCompactNumber(2e14)).toBe("200T");
        expect(formatCompactNumber(1_234_567)).toBe("1.2M");
        expect(formatCompactNumber(999_950)).toBe("1M");
        expect(formatCompactNumber(1500)).toBe("1.5K");
        expect(formatCompactNumber(-1500)).toBe("-1.5K");
        expect(formatCompactNumber(0.1 + 0.2)).toBe("0.3");
        expect(formatCompactNumber(1.5e-8)).toBe("0.000000015");
        expect(formatCompactNumber(Number.NaN)).toBe("");
    });

    it("follows the chart locale for ticks, percentages and dates", () => {
        setChartLocale("de-DE", CHART_DEFAULT_MESSAGES);
        const date = new Date(Date.UTC(2026, 0, 15));

        expect(formatCompactNumber(1.5)).toBe("1,5");
        expect(formatCompactNumber(1_500_000)).toBe(
            new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, notation: "compact" }).format(1_500_000)
        );
        expect(formatPolarPercentage(0.125)).toBe(
            new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1, style: "percent" }).format(0.125)
        );
        expect(formatPolarPercentage(0.125)).toContain("12,5");
        expect(formatFunnelPercentage(0.5)).toContain("50");
        expect(formatFunnelPercentage(0.5)).not.toBe("50%");
        expect(formatPercentagePoint(42.5)).toContain("42,5");
        expect(formatTimeRange(date, 365 * DAY_MS, true)).toBe(
            new Intl.DateTimeFormat("de-DE", { month: "short", timeZone: "UTC", year: "numeric" }).format(date)
        );
        expect(formatTimeRange(date, 365 * DAY_MS, true)).not.toBe(
            new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC", year: "numeric" }).format(date)
        );
    });

    it("names an unnamed series from the messages", () => {
        setChartLocale("de-DE", MONA_DE_DE_LOCALE.messages.chart);
        expect(resolveSeriesDisplayName({}, 1)).toBe("Reihe 2");
    });
});

describe("Chart locale", () => {
    it("formats axis ticks for the library locale", () => {
        const fixture = render("bar", MONA_DE_DE_LOCALE);
        const ticks = valueTicks(fixture);

        expect(ticks.length).toBeGreaterThan(1);
        expect(ticks.some(t => t.includes("Mio."))).toBe(true);
        expect(ticks.some(t => /\dM$/.test(t))).toBe(false);
    });

    it("reformats when the locale changes at runtime", async () => {
        const fixture = render("bar");
        expect(valueTicks(fixture).some(t => /\dM$/.test(t))).toBe(true);

        TestBed.inject(MonaI18nService).use(MONA_DE_DE_LOCALE);
        fixture.componentInstance.pass.set(1);
        fixture.detectChanges();
        await new Promise(resolve => setTimeout(resolve, 50));
        fixture.detectChanges();

        expect(valueTicks(fixture).some(t => t.includes("Mio."))).toBe(true);
    });

    it("announces points with the locale's messages and numbers", () => {
        const fixture = render("line", MONA_DE_DE_LOCALE);
        const text = announceFirstPoint(fixture);

        expect(text.startsWith("Revenue: A, ")).toBe(true);
        expect(text).toContain("Mio.");
    });

    it("names waterfall legend kinds and announces steps from the messages", () => {
        const fixture = render("waterfall", MONA_DE_DE_LOCALE);
        const legendNames = chartOf(fixture)
            .legendItems()
            .map(item => item.name);
        const text = announceFirstPoint(fixture);

        expect(legendNames).toContain("Zunahme");
        expect(legendNames).not.toContain("Increase");
        expect(text).toContain("Schritt 1 von 3");
        expect(text).toContain("Zunahme");
        expect(text).toContain("laufende Summe");
    });
});
