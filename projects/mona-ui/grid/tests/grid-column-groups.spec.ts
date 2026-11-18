import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { GridColumnGroupComponent } from "../components/grid-column-group/grid-column-group.component";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridReorderableDirective } from "../directives/grid-reorderable.directive";
import { GridService } from "../services/grid.service";

@Component({
    imports: [
        GridColumnComponent,
        GridColumnGroupComponent,
        GridComponent,
        GridFilterableDirective,
        GridReorderableDirective
    ],
    template: `
        <mona-grid
            aria-label="People"
            [data]="rows"
            [pageSize]="50"
            [pageSizeValues]="[]"
            [resizeMethod]="100"
            [responsivePager]="false"
            [monaGridFilterable]="{ enabled: filterRow(), type: 'row' }"
            [monaGridReorderable]="{ enabled: true }">
            <mona-grid-column field="id" title="Id" type="number" [width]="60" />
            <mona-grid-column-group title="Contact">
                <mona-grid-column field="email" title="Email" [width]="160" [locked]="emailLocked()" />
                <mona-grid-column-group title="Address">
                    <mona-grid-column field="city" title="City" [width]="100" [hidden]="cityHidden()" />
                    <mona-grid-column field="country" title="Country" [width]="100" />
                </mona-grid-column-group>
            </mona-grid-column-group>
            <mona-grid-column-group title="Stats">
                <mona-grid-column field="age" title="Age" type="number" [width]="60" />
            </mona-grid-column-group>
        </mona-grid>
    `
})
class HostComponent {
    public readonly cityHidden = signal(false);
    public readonly emailLocked = signal(false);
    public readonly filterRow = signal(false);
    public readonly rows = [
        { age: 34, city: "Oslo", country: "Norway", email: "ann@example.com", id: 1 },
        { age: 41, city: "Lima", country: "Peru", email: "bob@example.com", id: 2 }
    ];
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

describe("grid column groups", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;
    let root: HTMLElement;
    let service: GridService;
    let announce: ReturnType<typeof vi.fn>;

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

    function headerRows(): HTMLTableRowElement[] {
        return Array.from(root.querySelectorAll<HTMLTableRowElement>("thead > tr"));
    }

    function groupHeader(title: string, index = 0): HTMLTableCellElement {
        const cell = Array.from(root.querySelectorAll<HTMLTableCellElement>("th[data-column-group-id]")).filter(
            th => th.textContent?.trim() === title
        )[index];
        if (cell == null) {
            throw new Error(`No group header ${title}`);
        }
        return cell;
    }

    function columnHeader(title: string): HTMLTableCellElement {
        const cell = Array.from(root.querySelectorAll<HTMLTableCellElement>("th[data-column-id]")).find(
            th => th.textContent?.trim() === title
        );
        if (cell == null) {
            throw new Error(`No column header ${title}`);
        }
        return cell;
    }

    /** The group titles of a header row, with `·` for the space over a column outside a group there. */
    function rowTitles(row: HTMLTableRowElement): string[] {
        return Array.from(row.querySelectorAll("th")).map(th =>
            th.hasAttribute("data-column-group-id") ? (th.textContent?.trim() ?? "") : "·"
        );
    }

    function columnOrder(): string[] {
        return Array.from(root.querySelectorAll("th[data-column-id]")).map(th => th.textContent?.trim() ?? "");
    }

    beforeEach(async () => {
        announce = vi.fn().mockResolvedValue(undefined);
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [{ provide: LiveAnnouncer, useValue: { announce } }]
        }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
        service = fixture.debugElement.children[0].injector.get(GridService);
    });

    afterEach(() => root.remove());

    describe("header rows", () => {
        it("draws a row per group level above the column headers, spanning each group's columns", () => {
            const rows = headerRows();

            expect(rows.map(row => row.getAttribute("aria-rowindex"))).toEqual(["1", "2", "3"]);
            expect(rowTitles(rows[0])).toEqual(["·", "Contact", "Stats"]);
            expect(rowTitles(rows[1])).toEqual(["·", "·", "Address", "·"]);
            expect(columnOrder()).toEqual(["Id", "Email", "City", "Country", "Age"]);

            const contact = groupHeader("Contact");
            expect(contact.getAttribute("role")).toBe("columnheader");
            expect(contact.getAttribute("aria-colindex")).toBe("2");
            expect(contact.getAttribute("aria-colspan")).toBe("3");
            expect(contact.style.width).toBe("360px");
            expect(groupHeader("Address").getAttribute("aria-colindex")).toBe("3");
            expect(groupHeader("Address").getAttribute("aria-colspan")).toBe("2");
            for (const spacer of root.querySelectorAll("thead th:not([data-column-group-id]):not([data-column-id])")) {
                expect(spacer.getAttribute("aria-hidden")).toBe("true");
            }
        });

        it("counts the group rows in the rows' indices", async () => {
            host.filterRow.set(true);
            await settle();

            const rows = headerRows();
            expect(rows.map(row => row.getAttribute("aria-rowindex"))).toEqual(["1", "2", "3", "4"]);
            expect(root.querySelector("tbody tr[aria-rowindex]")?.getAttribute("aria-rowindex")).toBe("5");
            expect(root.querySelector("[role='grid']")?.getAttribute("aria-rowcount")).toBe("6");
        });

        it("narrows a group when one of its columns is hidden, and drops a level with no column left in it", async () => {
            host.cityHidden.set(true);
            await settle();
            expect(groupHeader("Address").getAttribute("aria-colspan")).toBe("1");
            expect(groupHeader("Contact").style.width).toBe("260px");

            service.setColumnHidden(service.columns().first(column => column.field === "country").id, true);
            await settle();
            expect(headerRows()).toHaveLength(2);
            expect(rowTitles(headerRows()[0])).toEqual(["·", "Contact", "Stats"]);
            expect(groupHeader("Contact").getAttribute("aria-colspan")).toBe("1");
        });

        it("splits a group around a locked column, and pins the locked part", async () => {
            host.emailLocked.set(true);
            await settle();

            expect(columnOrder()).toEqual(["Email", "Id", "City", "Country", "Age"]);
            expect(rowTitles(headerRows()[0])).toEqual(["Contact", "·", "Contact", "Stats"]);
            expect(groupHeader("Contact", 0).style.position).toBe("sticky");
            expect(groupHeader("Contact", 1).style.position).toBe("");
        });

        it("keeps a scrolling group's title clear of the pinned columns", async () => {
            const title = (cell: HTMLTableCellElement): HTMLElement => cell.querySelector("span") as HTMLElement;
            expect(title(groupHeader("Contact")).style.insetInlineStart).toBe("0px");

            host.emailLocked.set(true);
            await settle();

            // The pinned part never scrolls; the other part's title stops beside Email.
            expect(title(groupHeader("Contact", 0)).style.insetInlineStart).toBe("");
            expect(title(groupHeader("Contact", 1)).style.insetInlineStart).toBe("160px");
            expect(title(groupHeader("Address")).style.insetInlineStart).toBe("160px");
        });

        it("passes axe", async () => {
            // jsdom computes no colors, so contrast is left to the browser tests.
            const results = await axe.run(root, {
                rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
            });

            expect(results.passes.some(rule => rule.id.startsWith("aria-"))).toBe(true);
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("keyboard", () => {
        it("goes up through the groups over a column and back down to it", async () => {
            const country = columnHeader("Country");
            country.focus();

            press(country, "ArrowUp");
            expect(document.activeElement).toBe(groupHeader("Address"));
            press(groupHeader("Address"), "ArrowUp");
            expect(document.activeElement).toBe(groupHeader("Contact"));
            press(groupHeader("Contact"), "ArrowDown");
            expect(document.activeElement).toBe(groupHeader("Address"));
            press(groupHeader("Address"), "ArrowDown");
            expect(document.activeElement).toBe(columnHeader("Country"));
        });

        it("skips the space over a column outside a group, and stays on a column with nothing above it", () => {
            const email = columnHeader("Email");
            email.focus();
            press(email, "ArrowUp");
            expect(document.activeElement).toBe(groupHeader("Contact"));

            const id = columnHeader("Id");
            id.focus();
            press(id, "ArrowUp");
            expect(document.activeElement).toBe(id);
        });

        it("moves between the group titles of a row", () => {
            const contact = groupHeader("Contact");
            contact.focus();
            press(contact, "ArrowRight");
            expect(document.activeElement).toBe(groupHeader("Stats"));
            press(groupHeader("Stats"), "ArrowDown");
            expect(document.activeElement).toBe(columnHeader("Age"));
        });

        it("moves a column only among the columns and nested groups of its own group", async () => {
            press(columnHeader("City"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(columnOrder()).toEqual(["Id", "Email", "Country", "City", "Age"]);
            expect(announce).toHaveBeenCalledWith("City moved to position 4");

            // City is last in Address, and Email moves past the whole of Address.
            press(columnHeader("City"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            press(columnHeader("Email"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(columnOrder()).toEqual(["Id", "Country", "City", "Email", "Age"]);

            // Id moves past the whole of Contact.
            press(columnHeader("Id"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(columnOrder()).toEqual(["Country", "City", "Email", "Id", "Age"]);
        });
    });

    describe("order", () => {
        it("refuses to move a column into a group it isn't in", () => {
            const id = service.columns().first(column => column.field === "id");

            expect(service.reorderColumn(id, 2)).toBe(false);
            expect(service.reorderColumn(id, 4)).toBe(true);
            expect(
                service
                    .columns()
                    .select(column => column.field)
                    .toArray()
            ).toEqual(["email", "city", "country", "id", "age"]);
        });

        it("keeps a group's columns together when an order splits them", async () => {
            const idOf = (field: string): string => service.columns().first(column => column.field === field).id;
            service.setColumnOrder(["city", "id", "email", "age", "country"].map(idOf));
            await settle();

            expect(columnOrder()).toEqual(["City", "Country", "Email", "Id", "Age"]);
            expect(rowTitles(headerRows()[0])).toEqual(["Contact", "·", "Stats"]);
        });
    });
});
