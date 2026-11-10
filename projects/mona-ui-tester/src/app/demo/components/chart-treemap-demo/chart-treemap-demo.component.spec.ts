import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ChartComponent } from "@nanahoshi/mona-ui/chart";
import { of } from "rxjs";
import { beforeEach, describe, expect, it } from "vitest";
import metadata from "../../../../assets/component-metadata.json";
import { DemoService } from "../../services/demo.service";
import { PartsDemoContainerComponent } from "../parts-demo-container/parts-demo-container.component";
import { ChartTreemapDemoComponent } from "./chart-treemap-demo.component";

describe("ChartTreemapDemoComponent", () => {
    let fixture: ComponentFixture<ChartTreemapDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChartTreemapDemoComponent],
            providers: [{ provide: DemoService, useValue: { metadata$: of(metadata) } }]
        }).compileComponents();

        fixture = TestBed.createComponent(ChartTreemapDemoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    const container = (): PartsDemoContainerComponent =>
        fixture.debugElement.query(By.directive(PartsDemoContainerComponent)).componentInstance;

    it("renders a chart with a panel for the chart and its parts", () => {
        expect(fixture.debugElement.query(By.directive(ChartComponent))).toBeTruthy();
        const parts = container().parts();
        expect(parts[0]?.id).toBe("chart");
        expect(parts.length).toBeGreaterThan(1);
        for (const part of parts) {
            expect(Object.keys(part.config.inputs).length).toBeGreaterThan(0);
        }
    });

    it("keeps rendering through every series type and data set", async () => {
        const options = fixture.debugElement.queryAll(By.css("mona-segmented input"));
        for (const option of options) {
            (option.nativeElement as HTMLInputElement).click();
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.directive(ChartComponent))).toBeTruthy();
        }
    });
});
