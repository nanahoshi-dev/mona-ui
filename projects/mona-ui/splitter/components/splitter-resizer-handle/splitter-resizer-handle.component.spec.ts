import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SplitterResizerHandleComponent } from "./splitter-resizer-handle.component";

describe("SplitterResizerHandleComponent", () => {
    let component: SplitterResizerHandleComponent;
    let fixture: ComponentFixture<SplitterResizerHandleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SplitterResizerHandleComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SplitterResizerHandleComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("nextControlsVisible", false);
        fixture.componentRef.setInput("orientation", "horizontal");
        fixture.componentRef.setInput("previousControlsVisible", false);
        fixture.componentRef.setInput("resizable", true);
        await fixture.whenStable();
    });

    afterEach(() => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        TestBed.resetTestingModule();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("i18n and RTL", () => {
        it("renders default English aria-labels in horizontal orientation", async () => {
            fixture.componentRef.setInput("previousControlsVisible", true);
            fixture.componentRef.setInput("nextControlsVisible", true);
            fixture.detectChanges();
            await fixture.whenStable();

            const buttons = fixture.debugElement.queryAll(By.css("button"));
            expect(buttons.length).toBe(2);
            expect(buttons[0].nativeElement.getAttribute("aria-label")).toBe("Collapse previous pane");
            expect(buttons[1].nativeElement.getAttribute("aria-label")).toBe("Collapse next pane");
        });

        it("includes rtl:rotate-180 class on chevron SVGs in horizontal orientation", async () => {
            fixture.componentRef.setInput("previousControlsVisible", true);
            fixture.componentRef.setInput("nextControlsVisible", true);
            fixture.detectChanges();
            await fixture.whenStable();

            const svgs = fixture.debugElement.queryAll(By.css("button svg"));
            expect(svgs.length).toBe(2);
            expect(svgs[0].nativeElement.classList.contains("rtl:rotate-180")).toBe(true);
            expect(svgs[1].nativeElement.classList.contains("rtl:rotate-180")).toBe(true);
        });

        it("renders default English aria-labels in vertical orientation", async () => {
            fixture.componentRef.setInput("orientation", "vertical");
            fixture.componentRef.setInput("previousControlsVisible", true);
            fixture.componentRef.setInput("nextControlsVisible", true);
            fixture.detectChanges();
            await fixture.whenStable();

            const buttons = fixture.debugElement.queryAll(By.css("button"));
            expect(buttons.length).toBe(2);
            expect(buttons[0].nativeElement.getAttribute("aria-label")).toBe("Collapse pane above");
            expect(buttons[1].nativeElement.getAttribute("aria-label")).toBe("Collapse pane below");
        });

        it("updates button aria-labels dynamically when MonaI18nService locale changes", async () => {
            fixture.componentRef.setInput("previousControlsVisible", true);
            fixture.componentRef.setInput("nextControlsVisible", true);
            fixture.detectChanges();

            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "rtl",
                id: "ar-EG",
                messages: {
                    splitter: {
                        collapseDown: "طي اللوحة السفلية",
                        collapseNext: "طي اللوحة التالية",
                        collapsePrevious: "طي اللوحة السابقة",
                        collapseUp: "طي اللوحة العلوية",
                        resizer: "فاصل"
                    }
                }
            });
            fixture.detectChanges();
            await fixture.whenStable();

            const buttons = fixture.debugElement.queryAll(By.css("button"));
            expect(buttons[0].nativeElement.getAttribute("aria-label")).toBe("طي اللوحة السابقة");
            expect(buttons[1].nativeElement.getAttribute("aria-label")).toBe("طي اللوحة التالية");
        });
    });
});
