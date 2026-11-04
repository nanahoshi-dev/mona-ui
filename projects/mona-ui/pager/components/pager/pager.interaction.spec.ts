import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import axe from "axe-core";
import { DropdownListComponent } from "../../../dropdown-list/components/dropdown-list/dropdown-list.component";
import { PagerNavigationButtonsTemplateDirective } from "../../directives/pager-navigation-buttons-template.directive";
import { PagerNumericButtonsTemplateDirective } from "../../directives/pager-numeric-buttons-template.directive";
import { PagerPageSizeTemplateDirective } from "../../directives/pager-page-size-template.directive";
import type { PageChangeEvent } from "../../models/PageChangeEvent";
import type { PageSizeChangeEvent } from "../../models/PageSizeChangeEvent";
import { PagerComponent } from "./pager.component";

class MockResizeObserver implements ResizeObserver {
    public readonly callback: ResizeObserverCallback;
    public static instances: MockResizeObserver[] = [];

    public constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
        MockResizeObserver.instances.push(this);
    }

    public disconnect(): void {}

    public observe(): void {}

    public unobserve(): void {}
}

@Component({
    imports: [PagerComponent],
    template: `<mona-pager [total]="total()" [pageSize]="10" [responsive]="false" [(skip)]="skip"></mona-pager>`
})
class TwoWayHostComponent {
    public readonly skip = signal(0);
    public readonly total = signal(100);
}

@Component({
    imports: [PagerComponent],
    template: `
        <mona-pager
            [total]="100"
            [responsive]="false"
            [(pageSize)]="pageSize"
            [(skip)]="skip"
            (pageSizeChange)="sizes.push($event)"
            (pageSizeSelect)="onSelect($event)"></mona-pager>
    `
})
class TwoWayPageSizeHostComponent {
    public readonly pageSize = signal(10);
    public readonly sizes: number[] = [];
    public readonly skip = signal(40);
    public cancel = false;

    public onSelect(event: PageSizeChangeEvent): void {
        if (this.cancel) {
            event.preventDefault();
        }
    }
}

@Component({
    imports: [
        PagerComponent,
        PagerNavigationButtonsTemplateDirective,
        PagerNumericButtonsTemplateDirective,
        PagerPageSizeTemplateDirective
    ],
    template: `
        <mona-pager [total]="100" [pageSize]="10" [responsive]="false" (pageChange)="events.push($event)">
            <ng-template monaPagerNumericButtonsTemplate let-pages="pages" let-goToPage="goToPage" let-currentPage="currentPage">
                @for (page of pages; track page) {
                    <li>
                        <button class="custom-page" [class.current]="page === currentPage" (click)="goToPage(page)">
                            {{ page }}
                        </button>
                    </li>
                }
            </ng-template>
            <ng-template monaPagerNavigationButtonsTemplate type="next" let-navigate="navigate" let-target="targetPage">
                <button class="custom-next" [attr.data-target]="target" (click)="navigate()">Next</button>
            </ng-template>
            <ng-template monaPagerPageSizeTemplate let-setPageSize="setPageSize" let-pageSize="pageSize">
                <button class="custom-size" [attr.data-size]="pageSize" (click)="setPageSize(25)">25</button>
            </ng-template>
        </mona-pager>
    `
})
class TemplateHostComponent {
    public readonly events: PageChangeEvent[] = [];
}

describe("PagerComponent interactions", () => {
    let fixture: ComponentFixture<PagerComponent>;
    let events: PageChangeEvent[];
    let originalResizeObserver: typeof ResizeObserver;

    beforeEach(() => {
        originalResizeObserver = globalThis.ResizeObserver;
        MockResizeObserver.instances = [];
        globalThis.ResizeObserver = MockResizeObserver;
        TestBed.configureTestingModule({ imports: [PagerComponent] });
        fixture = TestBed.createComponent(PagerComponent);
        events = [];
        fixture.componentInstance.pageChange.subscribe(event => events.push(event));
    });

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver;
    });

    function setup(inputs: Record<string, unknown>): void {
        fixture.componentRef.setInput("responsive", false);
        for (const [name, value] of Object.entries(inputs)) {
            fixture.componentRef.setInput(name, value);
        }
        fixture.detectChanges();
        fixture.detectChanges();
    }

    function host(): HTMLElement {
        return fixture.nativeElement as HTMLElement;
    }

    function buttons(): HTMLButtonElement[] {
        return Array.from(host().querySelectorAll("button"));
    }

    function button(label: string): HTMLButtonElement {
        const found = buttons().find(b => b.getAttribute("aria-label") === label);
        if (!found) {
            throw new Error(`No button "${label}" in ${JSON.stringify(labels())}`);
        }
        return found;
    }

    function labels(): string[] {
        return buttons().map(b => b.getAttribute("aria-label") ?? "");
    }

    function pageLabels(): string[] {
        return labels().filter(label => /^Page [\d,]+$/.test(label));
    }

    function current(): string | null {
        return host().querySelector("button[aria-current='page']")?.getAttribute("aria-label") ?? null;
    }

    function text(): string {
        return (host().textContent ?? "").replace(/\s+/g, " ").trim();
    }

    function click(label: string): void {
        button(label).click();
        fixture.detectChanges();
    }

    describe("page window", () => {
        it("never repeats a page, never shows page 0, and always shows the first and last page", () => {
            for (let total = 1; total <= 16; total++) {
                for (let visiblePages = 1; visiblePages <= 7; visiblePages++) {
                    for (let page = 1; page <= total; page++) {
                        setup({ pageSize: 1, skip: page - 1, total, visiblePages });
                        const pages = pageLabels();
                        const context = `total ${total}, visiblePages ${visiblePages}, page ${page}: ${pages.join(", ")}`;

                        expect(new Set(pages).size, context).toBe(pages.length);
                        expect(pages, context).not.toContain("Page 0");
                        expect(pages[0], context).toBe("Page 1");
                        expect(pages[pages.length - 1], context).toBe(`Page ${total}`);
                        expect(pages, context).toContain(`Page ${page}`);
                        expect(pages.length, context).toBeLessThanOrEqual(visiblePages + 4);
                    }
                }
            }
        }, 30000);

        it("shows six pages once each on page 5 of 6", () => {
            setup({ pageSize: 10, skip: 40, total: 60 });

            expect(pageLabels()).toEqual(["Page 1", "Page 2", "Page 3", "Page 4", "Page 5", "Page 6"]);
            expect(current()).toBe("Page 5");
        });

        it("shows a single skipped page instead of a jump button", () => {
            setup({ pageSize: 10, skip: 40, total: 200 });

            expect(pageLabels()).toEqual(["Page 1", "Page 2", "Page 3", "Page 4", "Page 5", "Page 6", "Page 7", "Page 20"]);
            expect(labels()).toContain("Jump forward 5 pages");
            expect(labels()).not.toContain("Jump back 5 pages");
        });
    });

    describe("paging state", () => {
        it("moves a skip past the end to the last page and reports it once", () => {
            setup({ pageSize: 10, skip: 40, total: 5 });

            expect(text()).toContain("1 - 5 of 5 items");
            expect(current()).toBe("Page 1");
            expect(button("Previous page").disabled).toBe(true);
            expect(events).toEqual([{ page: 1, skip: 0, take: 10 }]);
        });

        it("moves to the last page when the total shrinks", () => {
            setup({ pageSize: 10, skip: 90, total: 100 });
            fixture.componentRef.setInput("total", 45);
            fixture.detectChanges();

            expect(current()).toBe("Page 5");
            expect(text()).toContain("41 - 45 of 45 items");
            expect(events).toEqual([{ page: 5, skip: 40, take: 10 }]);
        });

        it("realigns skip when the host changes the page size", () => {
            setup({ pageSize: 10, skip: 20, total: 200 });
            fixture.componentRef.setInput("pageSize", 50);
            fixture.detectChanges();

            expect(text()).toContain("1 - 50 of 200 items");
            expect(current()).toBe("Page 1");
            expect(button("Previous page").disabled).toBe(true);
            expect(events).toEqual([{ page: 1, skip: 0, take: 50 }]);
        });

        it("doesn't emit on creation or for a valid skip set from code", () => {
            setup({ pageSize: 10, skip: 0, total: 100 });
            fixture.componentRef.setInput("skip", 30);
            fixture.detectChanges();

            expect(events).toEqual([]);
            expect(current()).toBe("Page 4");
        });

        it("emits synchronously on a click", () => {
            setup({ pageSize: 10, total: 100 });

            button("Next page").click();

            expect(events).toEqual([{ page: 2, skip: 10, take: 10 }]);
        });

        it("emits pageChange with the new take when the page size changes on page 1", () => {
            setup({ pageSize: 10, total: 100 });
            const dropdown = fixture.debugElement.query(By.directive(DropdownListComponent));

            dropdown.triggerEventHandler("valueChange", 20);
            fixture.detectChanges();

            expect(events).toEqual([{ page: 1, skip: 0, take: 20 }]);
        });

        it("ignores invalid page sizes, skips and window sizes", () => {
            setup({ pageSize: 0, skip: -10, total: 3, visiblePages: 0 });

            expect(text()).not.toContain("NaN");
            expect(text()).toContain("1 - 1 of 3 items");
            expect(labels().some(label => label.includes(" 0 "))).toBe(false);
        });

        it("supports two-way binding of skip, so the host can reset it", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ imports: [TwoWayHostComponent] });
            const hostFixture = TestBed.createComponent(TwoWayHostComponent);
            hostFixture.detectChanges();
            const next = (hostFixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
                "button[aria-label='Next page']"
            );

            next?.click();
            hostFixture.detectChanges();
            expect(hostFixture.componentInstance.skip()).toBe(10);

            hostFixture.componentInstance.skip.set(0);
            hostFixture.detectChanges();
            const active = (hostFixture.nativeElement as HTMLElement).querySelector("button[aria-current='page']");
            expect(active?.getAttribute("aria-label")).toBe("Page 1");
        });

        it("supports two-way binding of pageSize, after pageSizeSelect allows it", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ imports: [TwoWayPageSizeHostComponent] });
            const hostFixture = TestBed.createComponent(TwoWayPageSizeHostComponent);
            hostFixture.detectChanges();
            const { sizes } = hostFixture.componentInstance;
            const pager = hostFixture.debugElement.query(By.directive(PagerComponent));
            const dropdown = pager.query(By.directive(DropdownListComponent));

            hostFixture.componentInstance.cancel = true;
            dropdown.triggerEventHandler("valueChange", 50);
            hostFixture.detectChanges();
            expect(sizes).toEqual([]);
            expect(hostFixture.componentInstance.pageSize()).toBe(10);

            hostFixture.componentInstance.cancel = false;
            dropdown.triggerEventHandler("valueChange", 20);
            hostFixture.detectChanges();
            expect(sizes).toEqual([20]);
            expect(hostFixture.componentInstance.pageSize()).toBe(20);
            expect(hostFixture.componentInstance.skip()).toBe(40);

            hostFixture.componentInstance.pageSize.set(10);
            hostFixture.detectChanges();
            const active = (hostFixture.nativeElement as HTMLElement).querySelector("button[aria-current='page']");
            expect(active?.getAttribute("aria-label")).toBe("Page 5");
        });
    });

    describe("page input", () => {
        function pageInput(): HTMLInputElement {
            const input = host().querySelector<HTMLInputElement>("mona-numeric-text-box input");
            if (!input) {
                throw new Error("No page input");
            }
            return input;
        }

        function type(value: string): void {
            const input = pageInput();
            input.focus();
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            fixture.detectChanges();
        }

        it("commits the typed page on Enter", () => {
            setup({ pageInput: true, pageSize: 10, total: 100 });

            type("7");
            pageInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
            fixture.detectChanges();

            expect(current()).toBe("Page 7");
            expect(events).toEqual([{ page: 7, skip: 60, take: 10 }]);
        });

        it("doesn't commit on Enter while an IME is composing", () => {
            setup({ pageInput: true, pageSize: 10, total: 100 });

            type("7");
            pageInput().dispatchEvent(
                new KeyboardEvent("keydown", { bubbles: true, cancelable: true, isComposing: true, key: "Enter" })
            );
            fixture.detectChanges();

            expect(current()).toBe("Page 1");
        });

        it("leaves Home and End inside the input alone", () => {
            setup({ pageInput: true, pageSize: 10, skip: 30, total: 100 });

            pageInput().dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "End" }));
            fixture.detectChanges();

            expect(current()).toBe("Page 4");
        });
    });

    describe("accessibility", () => {
        it("is a navigation landmark named Pagination, with no tab stop of its own", () => {
            setup({ pageSize: 10, total: 100 });

            expect(host().getAttribute("role")).toBe("navigation");
            expect(host().getAttribute("aria-label")).toBe("Pagination");
            expect(host().hasAttribute("tabindex")).toBe(false);
        });

        it("takes a name from aria-label or aria-labelledby", () => {
            setup({ "aria-label": "Orders pages", pageSize: 10, total: 100 });
            expect(host().getAttribute("aria-label")).toBe("Orders pages");

            fixture.componentRef.setInput("aria-labelledby", "orders-title");
            fixture.detectChanges();
            expect(host().getAttribute("aria-label")).toBeNull();
            expect(host().getAttribute("aria-labelledby")).toBe("orders-title");
        });

        it("names the page-size dropdown with a fixed label", () => {
            setup({ pageSize: 10, total: 100 });
            const dropdown = fixture.debugElement.query(By.directive(DropdownListComponent));

            expect(dropdown.componentInstance.ariaLabel()).toBe("Items per page");
        });

        it("keeps focus in the pager when the focused button is disabled", async () => {
            setup({ pageSize: 10, skip: 80, total: 100 });
            const next = button("Next page");
            next.focus();

            next.click();
            fixture.detectChanges();
            await fixture.whenStable();

            expect(next.disabled).toBe(true);
            expect(document.activeElement?.getAttribute("aria-label")).toBe("Page 10");
        });

        it("keeps focus on a page button when the window moves", () => {
            setup({ pageSize: 10, skip: 40, total: 200 });
            const pageSeven = button("Page 7");
            pageSeven.focus();

            pageSeven.click();
            fixture.detectChanges();

            expect(document.activeElement).toBe(pageSeven);
            expect(pageSeven.getAttribute("aria-label")).toBe("Page 7");
            expect(pageSeven.getAttribute("aria-current")).toBe("page");
        });

        it("announces the range after a user change only", () => {
            setup({ pageSize: 10, total: 100 });
            const status = host().querySelector("[role='status']");
            expect(status?.textContent?.trim()).toBe("");

            fixture.componentRef.setInput("skip", 50);
            fixture.detectChanges();
            expect(status?.textContent?.trim()).toBe("");

            click("Next page");
            expect(status?.textContent?.trim()).toBe("61 - 70 of 100 items");
        });

        it("passes axe", async () => {
            setup({ pageInput: true, pageSize: 10, skip: 40, total: 200 });

            const results = await axe.run(host());

            expect(results.violations.map(v => v.id)).toEqual([]);
        });
    });

    describe("i18n", () => {
        it("uses the singular for one item and groups large page numbers", () => {
            setup({ pageSize: 1, total: 1 });
            expect(text()).toContain("1 - 1 of 1 item");

            setup({ pageSize: 1, skip: 12344, total: 12345 });
            expect(pageLabels()).toContain("Page 12,345");
            expect(button("Page 12,345").textContent?.trim()).toBe("12,345");
        });

        it("applies the size variant to the host", () => {
            setup({ pageSize: 10, size: "small", total: 100 });

            expect(host().className).toContain("text-xs");
        });
    });

    describe("narrow pagers", () => {
        it("keeps the info and the page size when narrow", async () => {
            fixture.componentRef.setInput("total", 100);
            fixture.componentRef.setInput("pageSize", 10);
            fixture.detectChanges();
            await fixture.whenStable();
            const observer = MockResizeObserver.instances[MockResizeObserver.instances.length - 1];
            Object.defineProperty(host(), "clientWidth", { configurable: true, value: 600 });
            observer.callback([], observer);
            fixture.detectChanges();

            expect(text()).toContain("1 - 10 of 100 items");
            expect(pageLabels().length).toBeGreaterThan(0);
            expect(fixture.debugElement.query(By.directive(DropdownListComponent))).toBeTruthy();
        });
    });
});

describe("PagerComponent template contexts", () => {
    let fixture: ComponentFixture<TemplateHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [TemplateHostComponent] });
        fixture = TestBed.createComponent(TemplateHostComponent);
        fixture.detectChanges();
    });

    function query<T extends HTMLElement>(selector: string): T {
        const element = (fixture.nativeElement as HTMLElement).querySelector<T>(selector);
        if (!element) {
            throw new Error(`No ${selector}`);
        }
        return element;
    }

    it("lets a numeric template change the page", () => {
        const pages = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(".custom-page"));
        pages[2].click();
        fixture.detectChanges();

        expect(fixture.componentInstance.events).toEqual([{ page: 3, skip: 20, take: 10 }]);
        expect(query(".custom-page.current").textContent?.trim()).toBe("3");
    });

    it("lets a navigation template navigate", () => {
        expect(query(".custom-next").getAttribute("data-target")).toBe("2");

        query<HTMLButtonElement>(".custom-next").click();
        fixture.detectChanges();

        expect(fixture.componentInstance.events).toEqual([{ page: 2, skip: 10, take: 10 }]);
        expect(query(".custom-next").getAttribute("data-target")).toBe("3");
    });

    it("lets a page-size template change the page size", () => {
        query<HTMLButtonElement>(".custom-size").click();
        fixture.detectChanges();

        expect(fixture.componentInstance.events).toEqual([{ page: 1, skip: 0, take: 25 }]);
        expect(query(".custom-size").getAttribute("data-size")).toBe("25");
    });
});
