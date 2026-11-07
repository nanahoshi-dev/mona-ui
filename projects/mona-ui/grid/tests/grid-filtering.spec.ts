import { InteractivityChecker, LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, getDebugNode, Injectable, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { MONA_DEFAULT_LOCALE, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import type { CompositeFilterDescriptor, FilterDescriptor } from "@nanahoshi/mona-ui/query";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import type { FilterableOptions } from "../models/FilterableOptions";
import { GridService } from "../services/grid.service";

interface FilterRow {
    amount: number;
    id: number;
    name: string;
    shipped: Date;
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridFilterableDirective],
    template: `
        <mona-grid
            ariaLabel="Orders"
            [data]="rows"
            [rowKey]="'id'"
            [pageSize]="50"
            [pageSizeValues]="[]"
            [responsivePager]="false"
            [monaGridFilterable]="options()"
            [(filter)]="filter">
            <mona-grid-column field="id" title="Id" type="number" [width]="80"></mona-grid-column>
            <mona-grid-column field="name" title="Name" [width]="160"></mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [width]="140"></mona-grid-column>
            <mona-grid-column field="shipped" title="Shipped" type="date" [width]="160"></mona-grid-column>
            <mona-grid-column field="due" title="Due" type="date" format="yyyy-MM-dd" [width]="160"></mona-grid-column>
        </mona-grid>
    `
})
class HostComponent {
    public readonly filter = signal<CompositeFilterDescriptor[]>([]);
    public readonly options = signal<Partial<FilterableOptions>>({ type: "menu, row" });
    public readonly rows: FilterRow[] = [
        { amount: 10, id: 1, name: "Ann", shipped: new Date(2024, 0, 3) },
        { amount: 20, id: 2, name: "Bob", shipped: new Date(2024, 1, 3) },
        { amount: 30, id: 3, name: "Cid", shipped: new Date(2024, 2, 3) }
    ];
}

const TR_FILTER_LOCALE: MonaLocale = {
    direction: "ltr",
    id: "tr-TR",
    messages: { filter: { contains: "İçerir" } }
};

/** jsdom lays nothing out, so the CDK would find nothing visible to focus. */
@Injectable()
class LaidOutInteractivityChecker extends InteractivityChecker {
    public override isVisible(): boolean {
        return true;
    }
}

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

describe("grid filtering (batch 8)", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;
    let service: GridService;
    let filterChanges: CompositeFilterDescriptor[][];

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function filterRowCell(field: string): HTMLElement {
        const cells = Array.from(root.querySelectorAll<HTMLElement>("mona-grid-filter-row-cell"));
        const index = ["id", "name", "amount", "shipped", "due"].indexOf(field);
        const cell = cells[index];
        if (cell == null) {
            throw new Error(`No filter row cell for ${field}`);
        }
        return cell;
    }

    function menuButton(title: string): HTMLButtonElement {
        const button = Array.from(root.querySelectorAll<HTMLButtonElement>("mona-grid-filter-menu button")).find(b =>
            b.getAttribute("aria-label")?.startsWith(`Filter by ${title}`)
        );
        if (button == null) {
            throw new Error(`No filter menu button for ${title}`);
        }
        return button;
    }

    function dialog(): HTMLElement | null {
        return document.querySelector<HTMLElement>("mona-filter-menu[role='dialog']");
    }

    /** Types without waiting for the app to settle, which would also wait out the filter row's pause. */
    function type(input: HTMLInputElement, value: string): void {
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        fixture.detectChanges();
    }

    function operatorButton(field: string): HTMLButtonElement {
        const button = filterRowCell(field).querySelector<HTMLButtonElement>("button[aria-haspopup='menu']");
        if (button == null) {
            throw new Error(`No operator button for ${field}`);
        }
        return button;
    }

    async function chooseOperator(field: string, text: string): Promise<void> {
        operatorButton(field).click();
        await settle();
        const item = Array.from(document.querySelectorAll<HTMLElement>("[role^='menuitem']")).find(
            element => element.textContent?.trim() === text
        );
        if (item == null) {
            throw new Error(`No operator ${text}`);
        }
        item.click();
        await settle();
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: InteractivityChecker, useClass: LaidOutInteractivityChecker },
                { provide: LiveAnnouncer, useValue: { announce: vi.fn().mockResolvedValue(undefined) } }
            ]
        });
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        await settle();
        service = fixture.debugElement.children[0].injector.get(GridService);
        filterChanges = [];
        service.filterChange$.subscribe(filters => filterChanges.push(filters));
    });

    afterEach(() => {
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        document.querySelectorAll(".cdk-overlay-container").forEach(container => container.replaceChildren());
    });

    describe("filter menu", () => {
        it("opens a dialog named after the column, with focus inside, and returns focus on Escape", async () => {
            const button = menuButton("Name");
            expect(button.getAttribute("aria-haspopup")).toBe("dialog");
            button.click();
            await settle();
            await wait(0);

            const menu = dialog();
            expect(menu?.getAttribute("aria-label")).toBe("Filter by Name");
            expect(menu?.contains(document.activeElement)).toBe(true);

            document.activeElement?.dispatchEvent(
                new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" })
            );
            await settle();
            await wait(50);
            await settle();
            expect(document.activeElement).toBe(button);
        });

        it("applies on Enter and names its button as filtered, with more than colour", async () => {
            menuButton("Name").click();
            await settle();
            const input = dialog()?.querySelector<HTMLInputElement>("mona-text-box input");
            if (input == null) {
                throw new Error("No value input");
            }
            type(input, " ann ");
            input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }));
            await settle();

            expect(host.filter()).toEqual([
                expect.objectContaining({
                    filters: [expect.objectContaining({ field: "name", operator: "contains", value: "ann" })]
                })
            ]);
            const button = menuButton("Name");
            expect(button.getAttribute("aria-label")).toBe("Filter by Name, filtered");
            expect(button.querySelector("span[aria-hidden='true']")).not.toBeNull();
        });

        it("uses the column's format for its date input, or the locale's without one", async () => {
            const pickerFormat = (): string | null =>
                (
                    getDebugNode(dialog()?.querySelector("mona-date-picker"))?.componentInstance as DatePickerComponent
                ).format();

            menuButton("Due").click();
            await settle();
            expect(pickerFormat()).toBe("yyyy-MM-dd");
            document.querySelectorAll(".cdk-overlay-container").forEach(container => container.replaceChildren());

            menuButton("Shipped").click();
            await settle();
            expect(pickerFormat()).toBeNull();
        });
    });

    describe("filter row", () => {
        it("names its inputs, operator button and Clear button after the column", async () => {
            const name = filterRowCell("name");
            expect(name.querySelector("mona-text-box input")?.getAttribute("aria-label")).toBe("Filter by Name");
            expect(filterRowCell("shipped").querySelector("[aria-label='Filter by Shipped']")).not.toBeNull();

            const operator = operatorButton("name");
            expect(operator.getAttribute("aria-label")).toBe("Filter operator for Name: Contains");
            expect(operator.getAttribute("aria-expanded")).toBe("false");
            operator.click();
            await settle();
            expect(operator.getAttribute("aria-expanded")).toBe("true");
            expect(operator.id).not.toBe("");
            expect(document.querySelector("[role='menu']")?.getAttribute("aria-labelledby")).toBe(operator.id);

            document.body.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
            await settle();

            type(name.querySelector<HTMLInputElement>("mona-text-box input")!, "a");
            expect(name.querySelector("[aria-label='Clear filter for Name']")).not.toBeNull();
        });

        it("filters typed text after a pause, trimmed", async () => {
            type(filterRowCell("name").querySelector<HTMLInputElement>("mona-text-box input")!, "  ann ");
            expect(filterChanges).toHaveLength(0);
            await wait(350);
            await settle();

            expect(filterChanges).toHaveLength(1);
            const filter = host.filter()[0]?.filters[0] as FilterDescriptor;
            expect(filter).toEqual(expect.objectContaining({ field: "name", value: "ann" }));
        });

        it("Clear drops typing that has not filtered yet", async () => {
            const name = filterRowCell("name");
            type(name.querySelector<HTMLInputElement>("mona-text-box input")!, "ann");
            name.querySelector<HTMLButtonElement>("[aria-label='Clear filter for Name']")!.click();
            await settle();
            await wait(350);
            await settle();

            expect(host.filter()).toEqual([]);
            expect(filterChanges.some(change => change.length > 0)).toBe(false);
        });

        it("keeps a chosen operator without a value while other columns filter", async () => {
            await chooseOperator("name", "Starts with");
            expect(operatorButton("name").getAttribute("aria-label")).toBe("Filter operator for Name: Starts with");
            expect(filterChanges).toHaveLength(0);

            type(filterRowCell("amount").querySelector<HTMLInputElement>("input")!, "20");
            await wait(350);
            await settle();
            expect(host.filter()).toHaveLength(1);
            expect(operatorButton("name").getAttribute("aria-label")).toBe("Filter operator for Name: Starts with");
        });

        it("keeps a chosen operator once its filter applies", async () => {
            await chooseOperator("name", "Starts with");
            type(filterRowCell("name").querySelector<HTMLInputElement>("mona-text-box input")!, "an");
            await wait(350);
            await settle();

            expect(host.filter()[0]?.filters[0]).toEqual(expect.objectContaining({ operator: "startswith" }));
            expect(operatorButton("name").getAttribute("aria-label")).toBe("Filter operator for Name: Starts with");
        });

        it("keeps newer typing when its own earlier filter, or another column's, comes back", async () => {
            const input = filterRowCell("name").querySelector<HTMLInputElement>("mona-text-box input")!;
            type(input, "an");
            await wait(350);
            await settle();
            type(input, "ann");

            type(filterRowCell("amount").querySelector<HTMLInputElement>("input")!, "20");
            await wait(350);
            await settle();
            expect(input.value).toBe("ann");
        });

        it("follows a filter set from outside", async () => {
            host.filter.set([{ filters: [{ field: "name", operator: "endswith", value: "b" }], logic: "and" }]);
            await settle();
            const input = filterRowCell("name").querySelector<HTMLInputElement>("mona-text-box input")!;
            expect(input.value).toBe("b");
            expect(operatorButton("name").getAttribute("aria-label")).toBe("Filter operator for Name: Ends with");

            host.filter.set([]);
            await settle();
            expect(input.value).toBe("");
            expect(operatorButton("name").getAttribute("aria-label")).toBe("Filter operator for Name: Contains");
        });

        it("follows the locale in its operator names", async () => {
            TestBed.inject(MonaI18nService).use(TR_FILTER_LOCALE);
            await settle();
            expect(operatorButton("name").getAttribute("aria-label")).toBe("Filter operator for Name: İçerir");
        });
    });
});
