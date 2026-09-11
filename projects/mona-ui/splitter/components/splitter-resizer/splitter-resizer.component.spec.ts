import { Component, signal, viewChildren } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SplitterPaneComponent } from "../splitter-pane/splitter-pane.component";
import { SplitterComponent } from "../splitter/splitter.component";

@Component({
    template: `
        <mona-splitter [orientation]="orientation()">
            <mona-splitter-pane [collapsible]="collapsible()" [size]="'200px'"> Pane 1</mona-splitter-pane>
            <mona-splitter-pane [collapsible]="collapsible()" [size]="'200px'"> Pane 2</mona-splitter-pane>
        </mona-splitter>
    `,
    imports: [SplitterComponent, SplitterPaneComponent]
})
class TestHostComponent {
    collapsible = signal(true);
    orientation = signal<"horizontal" | "vertical">("horizontal");
    panes = viewChildren(SplitterPaneComponent);
}

describe("SplitterResizerComponent", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SplitterComponent, SplitterPaneComponent, TestHostComponent]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
        await hostFixture.whenStable();
    });

    afterEach(() => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        TestBed.resetTestingModule();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });

    it("uses a quiet neutral separator with a semantic keyboard focus indicator", () => {
        const resizer = hostFixture.nativeElement.querySelector("mona-splitter-resizer") as HTMLElement;

        expect(resizer.classList.contains("bg-border-subtle")).toBe(true);
        expect(resizer.classList.contains("hover:bg-border-control")).toBe(true);
        expect(resizer.classList.contains("active:bg-border-control-hover")).toBe(true);
        expect(resizer.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(resizer.classList.contains("bg-accent")).toBe(false);
        expect(resizer.classList.contains("focus-visible:bg-primary")).toBe(false);
    });

    describe("i18n and RTL", () => {
        it("renders default English aria-label on separator", () => {
            const resizer = hostFixture.nativeElement.querySelector("mona-splitter-resizer") as HTMLElement;
            expect(resizer.getAttribute("aria-label")).toBe("Resizer");
        });

        it("updates separator aria-label dynamically when MonaI18nService locale changes", () => {
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
                        resizer: "فاصل المقسم"
                    }
                }
            });
            hostFixture.detectChanges();

            const resizer = hostFixture.nativeElement.querySelector("mona-splitter-resizer") as HTMLElement;
            expect(resizer.getAttribute("aria-label")).toBe("فاصل المقسم");
        });

        it("inverts horizontal arrow keyboard nudge in RTL mode", async () => {
            const i18n = TestBed.inject(MonaI18nService);
            const resizer = hostFixture.nativeElement.querySelector("mona-splitter-resizer") as HTMLElement;
            const prevElement = resizer.previousElementSibling as HTMLElement;
            const nextElement = resizer.nextElementSibling as HTMLElement;

            vi.spyOn(prevElement, "getBoundingClientRect").mockReturnValue({
                bottom: 500,
                height: 500,
                left: 200,
                right: 400,
                top: 0,
                width: 200,
                x: 200,
                y: 0,
                toJSON: () => {}
            });
            vi.spyOn(nextElement, "getBoundingClientRect").mockReturnValue({
                bottom: 500,
                height: 500,
                left: 0,
                right: 200,
                top: 0,
                width: 200,
                x: 0,
                y: 0,
                toJSON: () => {}
            });

            // Set RTL locale
            i18n.use({
                direction: "rtl",
                id: "ar-EG",
                messages: {}
            });
            hostFixture.detectChanges();

            // Case 2: RTL locale + LTR DOM -> ArrowLeft nudges splitter leftwards, shrinking prev pane in LTR
            resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
            hostFixture.detectChanges();
            const prevPane = hostComponent.panes()[0];
            expect(prevPane.size()).toBe("190px");

            // Case 4: RTL locale + RTL DOM -> ArrowLeft nudges splitter leftwards, expanding prev pane in RTL
            hostFixture.nativeElement.setAttribute("dir", "rtl");
            await hostFixture.whenStable();
            hostFixture.detectChanges();
            resizer.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
            hostFixture.detectChanges();
            expect(prevPane.size()).toBe("210px");
        });

        it("inverts horizontal Alt+Arrow collapse keys in RTL mode", async () => {
            const i18n = TestBed.inject(MonaI18nService);
            const resizer = hostFixture.nativeElement.querySelector("mona-splitter-resizer") as HTMLElement;
            const prevElement = resizer.previousElementSibling as HTMLElement;
            const nextElement = resizer.nextElementSibling as HTMLElement;

            vi.spyOn(prevElement, "getBoundingClientRect").mockReturnValue({
                bottom: 500,
                height: 500,
                left: 200,
                right: 400,
                top: 0,
                width: 200,
                x: 200,
                y: 0,
                toJSON: () => {}
            });
            vi.spyOn(nextElement, "getBoundingClientRect").mockReturnValue({
                bottom: 500,
                height: 500,
                left: 0,
                right: 200,
                top: 0,
                width: 200,
                x: 0,
                y: 0,
                toJSON: () => {}
            });

            const prevPane = hostComponent.panes()[0];
            const nextPane = hostComponent.panes()[1];

            // Set RTL locale and DOM
            i18n.use({
                direction: "rtl",
                id: "ar-EG",
                messages: {}
            });
            hostFixture.nativeElement.setAttribute("dir", "rtl");
            hostFixture.detectChanges();
            await hostFixture.whenStable();

            // In RTL, Alt+ArrowLeft collapses "next" pane (to the left)
            resizer.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, bubbles: true, cancelable: true })
            );
            hostFixture.detectChanges();
            await hostFixture.whenStable();

            expect(nextPane.collapsed()).toBe(true);
            expect(prevPane.collapsed()).toBe(false);
        });
    });
});
