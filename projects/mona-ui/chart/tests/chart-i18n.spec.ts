import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideMonaI18n, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { ChartComponent } from "../components/chart/chart.component";
import { ChartLegendComponent } from "../components/chart-legend/chart-legend.component";
import { ChartTooltipComponent } from "../components/chart-tooltip/chart-tooltip.component";
import { CHART_DEFAULT_MESSAGES } from "../i18n/chart.default-messages";

@Component({
    imports: [ChartComponent, ChartLegendComponent, ChartTooltipComponent],
    template: '<mona-chart><mona-chart-legend /><mona-chart-tooltip /></mona-chart>'
})
class TestHostComponent {}

describe("Chart i18n", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let i18nService: MonaI18nService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [provideMonaI18n()]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        i18nService = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
    });

    it("renders default empty state text", () => {
        const noDataEl = fixture.nativeElement.querySelector('[data-mona-chart-export-role="no-data"]');
        expect(noDataEl).toBeTruthy();
        expect(noDataEl.textContent?.trim()).toBe(CHART_DEFAULT_MESSAGES.noData);
    });

    it("renders custom empty state text when patched via i18n service", () => {
        i18nService.patchMessages({
            chart: {
                noData: "Keine Daten verfügbar"
            }
        });
        fixture.detectChanges();

        const noDataEl = fixture.nativeElement.querySelector('[data-mona-chart-export-role="no-data"]');
        expect(noDataEl?.textContent?.trim()).toBe("Keine Daten verfügbar");
    });

    it("reflects localized chart aria-label on host element", () => {
        const chartEl = fixture.nativeElement.querySelector("mona-chart");
        expect(chartEl.getAttribute("aria-label")).toBe(CHART_DEFAULT_MESSAGES.chart);

        i18nService.patchMessages({
            chart: {
                chart: "Diagramm"
            }
        });
        fixture.detectChanges();

        expect(chartEl.getAttribute("aria-label")).toBe("Diagramm");
    });

    it("exposes default messages in CHART_DEFAULT_MESSAGES", () => {
        expect(CHART_DEFAULT_MESSAGES.value).toBe("Value");
        expect(CHART_DEFAULT_MESSAGES.range).toBe("Range");
        expect(CHART_DEFAULT_MESSAGES.conversion).toBe("Conversion");
        expect(CHART_DEFAULT_MESSAGES.dropOff).toBe("Drop-off");
        expect(CHART_DEFAULT_MESSAGES.runningTotal).toBe("Running Total");
        expect(CHART_DEFAULT_MESSAGES.openAbbreviation).toBe("O");
        expect(CHART_DEFAULT_MESSAGES.closeAbbreviation).toBe("C");
        expect(CHART_DEFAULT_MESSAGES.rising).toBe("rising");
        expect(CHART_DEFAULT_MESSAGES.falling).toBe("falling");
    });
});
