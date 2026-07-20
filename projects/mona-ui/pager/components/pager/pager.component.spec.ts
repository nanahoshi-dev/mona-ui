import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { DropdownListComponent } from "../../../dropdown-list/components/dropdown-list/dropdown-list.component";
import { NumericTextBoxComponent } from "../../../numeric-text-box/components/numeric-text-box/numeric-text-box.component";
import { PagerFocusableDirective } from "../../directives/pager-focusable.directive";
import { PagerInfoTemplateDirective } from "../../directives/pager-info-template.directive";
import { PagerNavigationButtonsTemplateDirective } from "../../directives/pager-navigation-buttons-template.directive";
import { PagerNumericButtonsTemplateDirective } from "../../directives/pager-numeric-buttons-template.directive";
import { PagerPageSizeTemplateDirective } from "../../directives/pager-page-size-template.directive";
import type { PageChangeEvent } from "../../models/PageChangeEvent";
import type { PageSizeChangeEvent } from "../../models/PageSizeChangeEvent";
import { pagerBaseThemeVariants, pagerInfoThemeVariants } from "../../styles/pager.styles";
import { PagerComponent } from "./pager.component";

class MockResizeObserver implements ResizeObserver {
    public static instances: MockResizeObserver[] = [];
    public readonly callback: ResizeObserverCallback;

    public constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        MockResizeObserver.instances.push(this);
    }

    public disconnect(): void {}

    public observe(): void {}

    public unobserve(): void {}
}

describe("PagerComponent", () => {
    let fixture: ComponentFixture<PagerComponent>;
    let originalResizeObserver: typeof ResizeObserver;

    beforeEach(() => {
        originalResizeObserver = globalThis.ResizeObserver;
        MockResizeObserver.instances = [];
        globalThis.ResizeObserver = MockResizeObserver;

        TestBed.configureTestingModule({
            imports: [PagerComponent],
            providers: []
        });
        fixture = TestBed.createComponent(PagerComponent);
    });

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver;
    });

    function setup(total: number, pageSize: number, skip: number = 0): void {
        fixture.componentRef.setInput("total", total);
        fixture.componentRef.setInput("pageSize", pageSize);
        fixture.componentRef.setInput("skip", skip);
        fixture.detectChanges();
    }

    function getButtons(): HTMLButtonElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll("button"));
    }

    function getButtonByLabel(label: string): HTMLButtonElement {
        const button = getButtons().find(button => button.getAttribute("aria-label") === label);
        if (!button) {
            throw new Error(`Expected button with aria-label "${label}" to exist.`);
        }
        return button;
    }

    function queryButtonByLabel(label: string): HTMLButtonElement | undefined {
        return getButtons().find(button => button.getAttribute("aria-label") === label);
    }

    function getActivePageButton(): HTMLButtonElement {
        const root: HTMLElement = fixture.nativeElement;
        const button = root.querySelector<HTMLButtonElement>("button[aria-current='page']");
        if (!button) {
            throw new Error("Expected an active page button to exist.");
        }
        return button;
    }

    function getRenderedPageLabels(): string[] {
        return getButtons()
            .map(button => button.getAttribute("aria-label"))
            .filter((label): label is string => label?.startsWith("Page ") === true);
    }

    function getInfoText(): string {
        return fixture.nativeElement.textContent.replace(/\s+/g, " ").trim();
    }

    function dispatchKeydown(element: Element, key: string, options: KeyboardEventInit = {}): KeyboardEvent {
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key,
            ...options
        });

        element.dispatchEvent(event);
        fixture.detectChanges();
        return event;
    }

    function getActiveElement(): Element {
        const activeElement = document.activeElement;
        if (!activeElement) {
            throw new Error("Expected an active element to exist.");
        }
        return activeElement;
    }

    function clickButton(label: string): void {
        getButtonByLabel(label).click();
        fixture.detectChanges();
    }

    function triggerPageSizeChange(value: number): void {
        const dropdown = fixture.debugElement.query(By.directive(DropdownListComponent));
        expect(dropdown).toBeTruthy();
        dropdown.triggerEventHandler("ngModelChange", value);
        fixture.detectChanges();
    }

    function triggerPageInputChange(value: number | null): void {
        const numericTextBox = fixture.debugElement.query(By.directive(NumericTextBoxComponent));
        expect(numericTextBox).toBeTruthy();
        numericTextBox.triggerEventHandler("ngModelChange", value);
        numericTextBox.triggerEventHandler("inputBlur", new FocusEvent("blur"));
        fixture.detectChanges();
    }

    function resizeHost(width: number): void {
        const hostElement: HTMLElement = fixture.nativeElement;
        const observer = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
        expect(observer).toBeTruthy();

        Object.defineProperty(hostElement, "clientWidth", { value: width, configurable: true });
        observer.callback([], observer);
        fixture.detectChanges();
    }

    it("should create", () => {
        fixture.detectChanges();

        expect(fixture.componentInstance).toBeTruthy();
    });

    describe("numeric page window", () => {
        it("should list every page when the total page count is 5 or fewer", () => {
            setup(50, 10);

            expect(getRenderedPageLabels()).toEqual(["Page 1", "Page 2", "Page 3", "Page 4", "Page 5"]);
            expect(queryButtonByLabel("Jump back 5 pages")).toBeUndefined();
            expect(queryButtonByLabel("Jump forward 5 pages")).toBeUndefined();
        });

        it("should show a next jumper but no previous jumper near the start", () => {
            setup(1000, 5, 0);

            expect(queryButtonByLabel("Jump back 5 pages")).toBeUndefined();
            expect(queryButtonByLabel("Jump forward 5 pages")).toBeTruthy();
        });

        it("should show both jumpers in the middle of a large page range", () => {
            setup(1000, 5, 500);

            expect(queryButtonByLabel("Jump back 5 pages")).toBeTruthy();
            expect(queryButtonByLabel("Jump forward 5 pages")).toBeTruthy();
        });

        it("should show a previous jumper but no next jumper near the end", () => {
            setup(1000, 5, 995);

            expect(queryButtonByLabel("Jump back 5 pages")).toBeTruthy();
            expect(queryButtonByLabel("Jump forward 5 pages")).toBeUndefined();
        });

        it("should always render first and last page buttons in a large page range", () => {
            setup(1000, 5, 500);

            expect(queryButtonByLabel("Page 1")).toBeTruthy();
            expect(queryButtonByLabel("Page 200")).toBeTruthy();
        });
    });

    describe("pageChange output", () => {
        it("should emit pageChange when navigating to the next page", () => {
            setup(100, 10, 0);
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            clickButton("Next page");

            expect(emitted[emitted.length - 1]).toEqual({ page: 2, skip: 10, take: 10 });
        });

        it("should emit pageChange when navigating to the previous page", () => {
            setup(100, 10, 10);
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            clickButton("Previous page");

            expect(emitted[emitted.length - 1]).toEqual({ page: 1, skip: 0, take: 10 });
        });

        it("should emit pageChange when jumping forward by visiblePages", () => {
            setup(1000, 5, 0);
            fixture.componentRef.setInput("visiblePages", 5);
            fixture.detectChanges();
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            clickButton("Jump forward 5 pages");

            expect(emitted[emitted.length - 1]).toEqual({ page: 6, skip: 25, take: 5 });
        });

        it("should emit pageChange when jumping backward by visiblePages", () => {
            setup(1000, 5, 50);
            fixture.componentRef.setInput("visiblePages", 5);
            fixture.detectChanges();
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            clickButton("Jump back 5 pages");

            expect(emitted[emitted.length - 1]).toEqual({ page: 6, skip: 25, take: 5 });
        });

        it("should emit pageChange when clicking a numeric page button", () => {
            setup(100, 10, 0);
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            clickButton("Page 5");

            expect(emitted[emitted.length - 1]).toEqual({ page: 5, skip: 40, take: 10 });
        });

        it("should not emit pageChange when clicking the already-active page", () => {
            setup(100, 10, 0);
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            clickButton("Page 1");

            expect(emitted.length).toBe(0);
        });

        it("should emit pageChange when the skip input changes programmatically", () => {
            setup(100, 10, 0);
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            fixture.componentRef.setInput("skip", 20);
            fixture.detectChanges();

            expect(emitted[emitted.length - 1]).toEqual({ page: 3, skip: 20, take: 10 });
        });
    });

    describe("page-size selection", () => {
        it("should update the page size and reset to page 1 when not prevented", () => {
            setup(100, 10, 40);

            triggerPageSizeChange(20);

            expect(getInfoText()).toContain("1 - 20 of 100 items");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 1");
        });

        it("should emit pageSizeChange with the old and new page size", () => {
            setup(100, 10, 0);
            const emitted: PageSizeChangeEvent[] = [];
            fixture.componentInstance.pageSizeChange.subscribe(event => emitted.push(event));

            triggerPageSizeChange(25);

            expect(emitted[0].oldPageSize).toBe(10);
            expect(emitted[0].newPageSize).toBe(25);
        });

        it("should keep the previous page size when the consumer calls preventDefault", () => {
            setup(100, 10, 0);
            const emitted: PageChangeEvent[] = [];
            fixture.componentInstance.pageSizeChange.subscribe(event => event.preventDefault());
            fixture.componentInstance.pageChange.subscribe(event => emitted.push(event));

            triggerPageSizeChange(25);
            clickButton("Next page");

            expect(emitted[emitted.length - 1]).toEqual({ page: 2, skip: 10, take: 10 });
        });

        it("should not emit pageSizeChange when the selected value equals the current page size", () => {
            setup(100, 10, 0);
            const emitted: PageSizeChangeEvent[] = [];
            fixture.componentInstance.pageSizeChange.subscribe(event => emitted.push(event));

            triggerPageSizeChange(10);

            expect(emitted.length).toBe(0);
        });
    });

    describe("page input", () => {
        beforeEach(() => {
            fixture.componentRef.setInput("pageInput", true);
            fixture.componentRef.setInput("pageSizeValues", false);
        });

        it("should clamp an input value below 1 up to page 1", () => {
            setup(100, 10, 20);

            triggerPageInputChange(-3);

            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 1");
        });

        it("should clamp an input value above the page count down to the last page", () => {
            setup(100, 10, 20);

            triggerPageInputChange(999);

            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 10");
        });

        it("should keep the current page when the input value is unchanged", () => {
            setup(100, 10, 20);

            triggerPageInputChange(3);

            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 3");
        });

        it("should reset the input to the current page when the input value is null", () => {
            setup(100, 10, 20);

            triggerPageInputChange(null);

            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 3");
        });
    });

    describe("responsive behavior", () => {
        it("should hide info, page-input, and numeric page buttons as the host narrows", async () => {
            fixture.componentRef.setInput("pageInput", true);
            setup(100, 10, 0);
            await fixture.whenStable();

            resizeHost(300);

            expect(getInfoText()).not.toContain("1 - 10 of 100 items");
            expect(queryButtonByLabel("Page 1")).toBeUndefined();
            expect(fixture.debugElement.query(By.directive(NumericTextBoxComponent))).toBeNull();
        });

        it("should show all sections when the host is wide enough", async () => {
            fixture.componentRef.setInput("pageInput", true);
            setup(100, 10, 0);
            await fixture.whenStable();

            resizeHost(900);

            expect(getInfoText()).toContain("1 - 10 of 100 items");
            expect(queryButtonByLabel("Page 1")).toBeTruthy();
            expect(fixture.debugElement.query(By.directive(NumericTextBoxComponent))).toBeTruthy();
        });

        it("should force all sections visible when responsive is set to false", async () => {
            fixture.componentRef.setInput("pageInput", true);
            setup(100, 10, 0);
            await fixture.whenStable();
            resizeHost(300);

            fixture.componentRef.setInput("responsive", false);
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(getInfoText()).toContain("1 - 10 of 100 items");
            expect(queryButtonByLabel("Page 1")).toBeTruthy();
            expect(fixture.debugElement.query(By.directive(NumericTextBoxComponent))).toBeTruthy();
        });
    });

    describe("navigation button disabled state", () => {
        it("should disable the previous and first page buttons on the first page", () => {
            setup(100, 10, 0);

            expect(getButtonByLabel("Previous page").disabled).toBe(true);
            expect(getButtonByLabel("First page").disabled).toBe(true);
            expect(getButtonByLabel("Previous page").classList.contains("disabled:bg-transparent")).toBe(true);
            expect(getButtonByLabel("First page").classList.contains("disabled:bg-transparent")).toBe(true);
            expect(getButtonByLabel("Next page").disabled).toBe(false);
            expect(getButtonByLabel("Last page").disabled).toBe(false);
        });

        it("should disable the next and last page buttons on the last page", () => {
            setup(100, 10, 90);

            expect(getButtonByLabel("Next page").disabled).toBe(true);
            expect(getButtonByLabel("Last page").disabled).toBe(true);
            expect(getButtonByLabel("Previous page").disabled).toBe(false);
            expect(getButtonByLabel("First page").disabled).toBe(false);
        });
    });

    describe("keyboard navigation", () => {
        it("should make the host focusable and remove inner controls from the page tab order by default", async () => {
            setup(100, 10, 0);
            await fixture.whenStable();

            const host: HTMLElement = fixture.nativeElement;

            expect(host.getAttribute("tabindex")).toBe("0");
            expect(getButtonByLabel("Page 1").getAttribute("tabindex")).toBe("-1");
        });

        it("should preserve native inner control tab order when navigable is false", () => {
            fixture.componentRef.setInput("navigable", false);
            setup(100, 10, 0);

            const host: HTMLElement = fixture.nativeElement;

            expect(host.getAttribute("tabindex")).toBeNull();
            expect(getButtonByLabel("Page 1").getAttribute("tabindex")).toBe("0");
        });

        it("should navigate to the first and last pages with Home and End from inside the pager", () => {
            setup(100, 10, 20);

            dispatchKeydown(getButtonByLabel("Page 3"), "End");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 10");

            dispatchKeydown(getButtonByLabel("Page 10"), "Home");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 1");
        });

        it("should navigate previous and next pages from the focused wrapper", () => {
            setup(100, 10, 20);
            const host: HTMLElement = fixture.nativeElement;

            dispatchKeydown(host, "ArrowLeft");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 2");

            dispatchKeydown(host, "PageDown");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 3");

            dispatchKeydown(host, "PageUp");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 2");

            dispatchKeydown(host, "ArrowRight");
            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 3");
        });

        it("should activate inner navigation with Enter and wrap focus with Tab", () => {
            fixture.componentRef.setInput("pageSizeValues", false);
            setup(100, 10, 0);
            const host: HTMLElement = fixture.nativeElement;

            dispatchKeydown(host, "Enter");
            expect(document.activeElement).toBe(getButtonByLabel("Page 1"));

            dispatchKeydown(getActiveElement(), "Tab", { shiftKey: true });
            expect(document.activeElement).toBe(getButtonByLabel("Last page"));

            dispatchKeydown(getActiveElement(), "Tab");
            expect(document.activeElement).toBe(getButtonByLabel("Page 1"));
        });

        it("should return focus to the wrapper with Escape and deactivate the focus loop", () => {
            setup(100, 10, 0);
            const host: HTMLElement = fixture.nativeElement;

            dispatchKeydown(host, "Enter");
            const focusedButton = getActiveElement();
            expect(focusedButton).toBe(getButtonByLabel("Page 1"));

            dispatchKeydown(focusedButton, "Escape");
            expect(document.activeElement).toBe(host);

            getButtonByLabel("Page 1").focus();
            const event = dispatchKeydown(getButtonByLabel("Page 1"), "Tab");
            expect(event.defaultPrevented).toBe(false);
        });
    });

    describe("accessibility", () => {
        it("should give every icon-only navigation button an accessible name", () => {
            setup(1000, 5, 50);
            fixture.componentRef.setInput("visiblePages", 5);
            fixture.detectChanges();

            expect(queryButtonByLabel("First page")).toBeTruthy();
            expect(queryButtonByLabel("Previous page")).toBeTruthy();
            expect(queryButtonByLabel("Next page")).toBeTruthy();
            expect(queryButtonByLabel("Last page")).toBeTruthy();
            expect(queryButtonByLabel("Jump back 5 pages")).toBeTruthy();
            expect(queryButtonByLabel("Jump forward 5 pages")).toBeTruthy();
        });

        it("should mark the active numeric page button with aria-current='page'", () => {
            setup(100, 10, 20);

            expect(getActivePageButton().getAttribute("aria-label")).toBe("Page 3");
            expect(getButtonByLabel("Page 1").getAttribute("aria-current")).toBeNull();
        });
    });
});

@Component({
    imports: [PagerComponent, PagerInfoTemplateDirective],
    template: `
        <mona-pager [total]="100" [pageSize]="10">
            <ng-template monaPagerInfoTemplate let-currentPage="currentPage" let-totalPages="totalPages">
                <span class="custom-info">{{ currentPage }} of {{ totalPages }}</span>
            </ng-template>
        </mona-pager>
    `
})
class PagerInfoTemplateHostComponent {}

describe("PagerComponent with info template", () => {
    let hostFixture: ComponentFixture<PagerInfoTemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PagerInfoTemplateHostComponent],
            providers: []
        });
        hostFixture = TestBed.createComponent(PagerInfoTemplateHostComponent);
        hostFixture.detectChanges();
    });

    it("should render the projected info template instead of the default summary", () => {
        const custom = hostFixture.nativeElement.querySelector(".custom-info");

        expect(custom?.textContent?.trim()).toBe("1 of 10");
    });
});

@Component({
    imports: [PagerComponent, PagerNavigationButtonsTemplateDirective],
    template: `
        <mona-pager [total]="100" [pageSize]="10">
            <ng-template monaPagerNavigationButtonsTemplate type="first" let-disabled="disabled">
                <button class="custom-first" [disabled]="disabled">Custom First</button>
            </ng-template>
        </mona-pager>
    `
})
class PagerNavigationTemplateHostComponent {}

describe("PagerComponent with navigation button template", () => {
    let hostFixture: ComponentFixture<PagerNavigationTemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PagerNavigationTemplateHostComponent],
            providers: []
        });
        hostFixture = TestBed.createComponent(PagerNavigationTemplateHostComponent);
        hostFixture.detectChanges();
    });

    it("should render the projected first-page button template instead of the default", () => {
        const custom = hostFixture.nativeElement.querySelector(".custom-first");

        expect(custom?.textContent?.trim()).toBe("Custom First");
    });
});

@Component({
    imports: [PagerComponent, PagerNumericButtonsTemplateDirective],
    template: `
        <mona-pager [total]="100" [pageSize]="10">
            <ng-template monaPagerNumericButtonsTemplate let-totalPages="totalPages">
                <span class="custom-numeric">{{ totalPages }} pages</span>
            </ng-template>
        </mona-pager>
    `
})
class PagerNumericTemplateHostComponent {}

describe("PagerComponent with numeric buttons template", () => {
    let hostFixture: ComponentFixture<PagerNumericTemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PagerNumericTemplateHostComponent],
            providers: []
        });
        hostFixture = TestBed.createComponent(PagerNumericTemplateHostComponent);
        hostFixture.detectChanges();
    });

    it("should render the projected numeric buttons template instead of the default page buttons", () => {
        const custom = hostFixture.nativeElement.querySelector(".custom-numeric");

        expect(custom?.textContent?.trim()).toBe("10 pages");
    });
});

@Component({
    imports: [PagerComponent, PagerFocusableDirective, PagerNumericButtonsTemplateDirective],
    template: `
        <mona-pager [total]="100" [pageSize]="10" [pageSizeValues]="false">
            <ng-template monaPagerNumericButtonsTemplate>
                <button class="hidden-marked" monaPagerFocusable hidden>Hidden marked</button>
                <button class="unmarked">Unmarked</button>
                <button class="marked" monaPagerFocusable>Marked</button>
            </ng-template>
        </mona-pager>
    `
})
class PagerFocusableTemplateHostComponent {}

describe("PagerComponent with focusable template markers", () => {
    let hostFixture: ComponentFixture<PagerFocusableTemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PagerFocusableTemplateHostComponent],
            providers: []
        });
        hostFixture = TestBed.createComponent(PagerFocusableTemplateHostComponent);
        hostFixture.detectChanges();
    });

    it("should include marked custom controls and skip hidden or unmarked controls", () => {
        const root: HTMLElement = hostFixture.nativeElement;
        const host = root.querySelector<HTMLElement>("mona-pager");
        if (!host) {
            throw new Error("Expected the pager host to exist.");
        }
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" });

        host.dispatchEvent(event);
        hostFixture.detectChanges();

        expect(document.activeElement).toBe(hostFixture.nativeElement.querySelector(".marked"));
        expect(document.activeElement).not.toBe(hostFixture.nativeElement.querySelector(".hidden-marked"));
        expect(document.activeElement).not.toBe(hostFixture.nativeElement.querySelector(".unmarked"));
    });
});

@Component({
    imports: [PagerComponent, PagerPageSizeTemplateDirective],
    template: `
        <mona-pager [total]="100" [pageSize]="10" [pageInput]="true">
            <ng-template monaPagerPageSizeTemplate let-values>
                <span class="custom-page-size">{{ values.length }} options</span>
            </ng-template>
        </mona-pager>
    `
})
class PagerPageSizeTemplateHostComponent {}

describe("PagerComponent with page-size template", () => {
    let hostFixture: ComponentFixture<PagerPageSizeTemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PagerPageSizeTemplateHostComponent],
            providers: []
        });
        hostFixture = TestBed.createComponent(PagerPageSizeTemplateHostComponent);
        hostFixture.detectChanges();
    });

    it("should render the projected page-size template instead of the default dropdown", () => {
        const custom = hostFixture.nativeElement.querySelector(".custom-page-size");

        expect(custom?.textContent?.trim()).toBe("5 options");
    });
});

describe("Pager visual contract", () => {
    it("uses a muted structural strip and neutral supporting text", () => {
        const baseClasses = pagerBaseThemeVariants({ rounded: "medium", size: "medium" }).split(/\s+/);
        const infoClasses = pagerInfoThemeVariants().split(/\s+/);

        expect(baseClasses).toContain("bg-(--mona-pager-background)");
        expect(baseClasses).toContain("border-border-subtle");
        expect(baseClasses).not.toContain("bg-primary");
        expect(infoClasses).toContain("text-muted-foreground");
    });
});
