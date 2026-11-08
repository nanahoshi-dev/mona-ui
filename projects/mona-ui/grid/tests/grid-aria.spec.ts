import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, DeferBlockState, TestBed } from "@angular/core/testing";
import type { EditableOptions } from "../models/EditableOptions";
import type { GroupDescriptor } from "../models/GroupDescriptor";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridComponent } from "../components/grid/grid.component";
import { GridDetailTemplateDirective } from "../directives/grid-detail-template.directive";
import { GridEditableDirective } from "../directives/grid-editable.directive";
import { GridFilterableDirective } from "../directives/grid-filterable.directive";
import { GridGroupableDirective } from "../directives/grid-groupable.directive";
import { GridReorderableDirective } from "../directives/grid-reorderable.directive";
import { GridSelectableDirective } from "../directives/grid-selectable.directive";
import { GridSortableDirective } from "../directives/grid-sortable.directive";
import { GridVirtualScrollDirective } from "../directives/grid-virtual-scroll.directive";
import { GridService } from "../services/grid.service";

@Component({
    imports: [
        GridColumnComponent,
        GridComponent,
        GridDetailTemplateDirective,
        GridEditableDirective,
        GridFilterableDirective,
        GridGroupableDirective,
        GridReorderableDirective,
        GridSelectableDirective,
        GridSortableDirective
    ],
    template: `
        <mona-grid
            aria-label="Orders"
            [data]="rows"
            [rowKey]="'id'"
            [pageSize]="50"
            [pageSizeValues]="[]"
            [resizeMethod]="120"
            [responsivePager]="false"
            [monaGridEditable]="editable()"
            [monaGridFilterable]="{ enabled: true, type: 'menu, row' }"
            monaGridGroupable
            [group]="group()"
            [monaGridReorderable]="{ enabled: true }"
            [monaGridSelectable]="{ enabled: true, mode: 'multiple' }"
            [monaGridSortable]="{ enabled: true, mode: 'multiple', showIndices: true }"
            [(sort)]="sort">
            <mona-grid-column field="name" title="Name" [width]="120" [editable]="true"></mona-grid-column>
            <mona-grid-column field="team" title="Team" [width]="120" [editable]="false"></mona-grid-column>
            <mona-grid-column field="amount" title="Amount" type="number" [width]="100" aggregate="sum">
            </mona-grid-column>
            <ng-template monaGridDetailTemplate let-item>Detail {{ item.name }}</ng-template>
        </mona-grid>
    `
})
class HostComponent {
    public readonly editable = signal<EditableOptions>({ enabled: false, mode: "row" });
    public readonly group = signal<GroupDescriptor[]>([]);
    public readonly rows = [
        { amount: 10, id: 1, name: "Jane", team: "A" },
        { amount: 20, id: 2, name: "John", team: "B" },
        { amount: 30, id: 3, name: "Mary", team: "A" }
    ];
    public sort: { dir: "asc" | "desc"; field: string }[] = [];
}

@Component({
    imports: [GridColumnComponent, GridComponent, GridDetailTemplateDirective, GridVirtualScrollDirective],
    template: `
        <mona-grid [data]="rows" [monaGridVirtualScroll]="{ height: 32 }" [resizeMethod]="120">
            <mona-grid-column field="name" title="Name" [width]="120"></mona-grid-column>
            <ng-template monaGridDetailTemplate let-item>Detail {{ item.name }}</ng-template>
        </mona-grid>
    `
})
class VirtualHostComponent {
    public readonly rows = [{ name: "Jane" }, { name: "John" }];
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

describe("grid ARIA and drag (batch 6)", () => {
    let fixture: ComponentFixture<HostComponent>;
    let root: HTMLElement;
    let service: GridService;
    let announce: ReturnType<typeof vi.fn>;

    async function settle(target: ComponentFixture<unknown> = fixture): Promise<void> {
        target.detectChanges();
        await target.whenStable();
        for (const block of await target.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        target.detectChanges();
        await target.whenStable();
    }

    function grid(): HTMLElement {
        return root.querySelector("[role='grid'], [role='treegrid']") as HTMLElement;
    }

    function header(title: string): HTMLTableCellElement {
        const cell = Array.from(root.querySelectorAll<HTMLTableCellElement>("th[data-column-id]")).find(th =>
            th.textContent?.includes(title)
        );
        if (cell == null) {
            throw new Error(`No header ${title}`);
        }
        return cell;
    }

    function accessibleNameOf(element: Element): string {
        const ids = element.getAttribute("aria-labelledby");
        if (ids != null) {
            return ids
                .split(" ")
                .map(id => root.ownerDocument.getElementById(id)?.textContent?.trim() ?? "")
                .join(" ");
        }
        return element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "";
    }

    function visibleOrder(): string[] {
        return Array.from(root.querySelectorAll("th[data-column-id]")).map(th => th.textContent?.trim() ?? "");
    }

    beforeEach(async () => {
        announce = vi.fn().mockResolvedValue(undefined);
        await TestBed.configureTestingModule({
            imports: [HostComponent, VirtualHostComponent],
            providers: [{ provide: LiveAnnouncer, useValue: { announce } }]
        }).compileComponents();
        fixture = TestBed.createComponent(HostComponent);
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
        service = fixture.debugElement.children[0].injector.get(GridService);
    });

    afterEach(() => root.remove());

    it("names the grid element, not the host (GR1)", () => {
        const host = root.querySelector("mona-grid") as HTMLElement;
        expect(host.hasAttribute("role")).toBe(false);
        expect(host.hasAttribute("aria-label")).toBe(false);
        expect(grid().getAttribute("role")).toBe("grid");
        expect(grid().getAttribute("aria-label")).toBe("Orders");
    });

    it("counts every row once, from the header rows to the footer (GR2)", async () => {
        const headerRows = root.querySelectorAll("thead tr[role='row']");
        expect(headerRows[0].getAttribute("aria-rowindex")).toBe("1");
        expect(headerRows[1].getAttribute("aria-rowindex")).toBe("2");
        const bodyRows = Array.from(root.querySelectorAll("tbody tr[monagridrow]"));
        expect(bodyRows.map(row => row.getAttribute("aria-rowindex"))).toEqual(["3", "4", "5"]);
        // Two header rows, three rows and the footer.
        expect(grid().getAttribute("aria-rowcount")).toBe("6");
        expect(root.querySelector("tfoot tr")?.getAttribute("aria-rowindex")).toBe("6");
        expect(grid().getAttribute("aria-colcount")).toBe(String(service.layout().length));

        service.setRowExpanded(service.viewRows().toArray()[0], true);
        await settle();
        expect(root.querySelector("tr[monagriddetailrow]")?.getAttribute("aria-rowindex")).toBe("4");
        expect(root.querySelectorAll("tbody tr[monagridrow]")[1].getAttribute("aria-rowindex")).toBe("5");
        expect(grid().getAttribute("aria-rowcount")).toBe("7");
    });

    it("states multiple selection and read-only cells (GR3)", async () => {
        expect(grid().getAttribute("aria-multiselectable")).toBe("true");
        expect(grid().getAttribute("aria-readonly")).toBe("true");
        expect(root.querySelector("tbody td[aria-readonly]")).toBeNull();

        fixture.componentInstance.editable.set({ enabled: true, mode: "row" });
        await settle();
        expect(grid().hasAttribute("aria-readonly")).toBe(false);
        const nameCell = root.querySelector("tbody [data-field='name']")?.closest("td");
        const teamCell = root.querySelector("tbody [data-field='team']")?.closest("td");
        expect(nameCell?.getAttribute("aria-readonly")).toBe("false");
        expect(teamCell?.getAttribute("aria-readonly")).toBe("true");
    });

    it("makes the detail toggle a named button with its state (GR4)", async () => {
        const toggle = root.querySelector("tbody mona-grid-toggle button") as HTMLButtonElement;
        expect(toggle.getAttribute("aria-label")).toBe("Expand details of row 1");
        expect(toggle.getAttribute("aria-expanded")).toBe("false");
        toggle.click();
        await settle();
        const expanded = root.querySelector("tbody mona-grid-toggle button") as HTMLButtonElement;
        expect(expanded.getAttribute("aria-expanded")).toBe("true");
        expect(expanded.getAttribute("aria-label")).toBe("Collapse details of row 1");
    });

    it("is a treegrid only while grouped, with levels and the arrows on group rows (GR5)", async () => {
        fixture.componentInstance.group.set([{ field: "team" }]);
        await settle();
        expect(grid().getAttribute("role")).toBe("treegrid");
        expect(root.querySelector("tbody tr[monagridrow]")?.getAttribute("aria-level")).toBe("2");
        const groupCell = root.querySelector("tr[monagridgrouprow] td[monagridlogicalcell]") as HTMLElement;
        const groupRow = groupCell.closest("tr") as HTMLElement;
        // The title cell is the first cell of a top-level group row, whatever the number of group levels.
        expect(groupCell.getAttribute("aria-colindex")).toBe("1");

        groupCell.focus();
        press(groupCell, "ArrowLeft");
        await settle();
        expect(groupRow.getAttribute("aria-expanded")).toBe("false");
        press(groupCell, "ArrowRight");
        await settle();
        expect(groupRow.getAttribute("aria-expanded")).toBe("true");

        fixture.componentInstance.group.set([]);
        await settle();
        expect(grid().getAttribute("role")).toBe("grid");
    });

    it("names headers by their title, and gives aria-sort to the primary sort only (GR6)", async () => {
        expect(accessibleNameOf(header("Name"))).toBe("Name");
        service.loadSorts([
            { dir: "asc", field: "name" },
            { dir: "desc", field: "team" }
        ]);
        await settle();
        expect(header("Name").getAttribute("aria-sort")).toBe("ascending");
        expect(header("Team").hasAttribute("aria-sort")).toBe(false);
        const description = header("Team").getAttribute("aria-describedby") ?? "";
        expect(root.ownerDocument.getElementById(description)?.textContent?.trim()).toBe("Sort order 2");
        expect(header("Team").querySelector(".tabular-nums")?.getAttribute("aria-hidden")).toBe("true");
    });

    it("gives structural cells roles and names, and footer cells keyboard focus (GR7)", () => {
        const detailHeader = root.querySelector("thead tr:first-child th:not([data-column-id]) .sr-only");
        expect(detailHeader?.textContent?.trim()).toBe("Details");
        for (const cell of root.querySelectorAll("thead tr:nth-child(2) th")) {
            expect(cell.getAttribute("role")).toBe("gridcell");
        }
        const footerCell = root.querySelector("tfoot td[monagridlogicalcell]") as HTMLElement;
        expect(footerCell).not.toBeNull();
        expect(footerCell.hasAttribute("tabindex")).toBe(true);
    });

    describe("keyboard column moves and grouping (GV2)", () => {
        it("moves the focused header's column with Ctrl+Shift+Arrow and announces it", async () => {
            const name = header("Name");
            expect(name.getAttribute("aria-keyshortcuts")).toContain("Control+Shift+ArrowRight");
            name.focus();
            press(name, "ArrowRight", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(visibleOrder()).toEqual(["Team", "Name", "Amount"]);
            expect(announce).toHaveBeenCalledWith("Name moved to position 2");
            expect(document.activeElement).toBe(header("Name"));

            press(header("Name"), "ArrowLeft", { metaKey: true, shiftKey: true });
            await settle();
            expect(visibleOrder()).toEqual(["Name", "Team", "Amount"]);
        });

        it("groups by the focused header with Ctrl+Shift+G, and Delete on its chip removes the group", async () => {
            const team = header("Team");
            team.focus();
            press(team, "G", { code: "KeyG", ctrlKey: true, shiftKey: true });
            await settle();
            expect(service.groupColumns().length).toBe(1);
            expect(announce).toHaveBeenCalledWith("Grouped by Team");

            const chip = root.querySelector("mona-chip") as HTMLElement;
            press(chip, "Delete");
            await settle();
            expect(service.groupColumns().length).toBe(0);
        });
    });

    describe("group chip menu", () => {
        function groupButton(title: string): HTMLButtonElement {
            const button = root.querySelector<HTMLButtonElement>(`button[aria-label='Group options for ${title}']`);
            if (!button) {
                throw new Error(`No group options button for ${title}`);
            }
            return button;
        }

        function chipTitles(): (string | null)[] {
            return Array.from(root.querySelectorAll("mona-chip")).map(chip => chip.getAttribute("aria-label"));
        }

        beforeEach(async () => {
            fixture.componentInstance.group.set([{ field: "team" }, { field: "name" }]);
            await settle();
        });

        afterEach(() => {
            document.querySelectorAll(".cdk-overlay-container").forEach(overlay => overlay.remove());
        });

        it("opens from a named button that the keyboard can reach", async () => {
            const button = groupButton("Team");
            expect(button.tabIndex).toBe(0);
            expect(button.getAttribute("aria-haspopup")).toBe("menu");
            expect(button.getAttribute("aria-expanded")).toBe("false");
            expect(button.hasAttribute("aria-controls")).toBe(false);

            button.click();
            await settle();

            const menu = document.querySelector("[role='menu']") as HTMLElement;
            expect(menu.getAttribute("aria-labelledby")).toBe(button.id);
            expect(button.getAttribute("aria-expanded")).toBe("true");
            expect(button.getAttribute("aria-controls")).toBe(menu.id);
        });

        it("doesn't sort the group when the button is clicked", async () => {
            const direction = service.groupColumns().first().groupSortDirection;
            groupButton("Team").click();
            await settle();
            expect(service.groupColumns().first().groupSortDirection).toBe(direction);
        });

        it("moves the group, announces it, and keeps focus with the moved column", async () => {
            const button = groupButton("Team");
            button.focus();
            button.click();
            await settle();

            const item = Array.from(document.querySelectorAll<HTMLElement>("[role='menuitem']")).find(
                element => element.textContent?.trim() === "Move as next"
            );
            item?.click();
            await settle();
            await new Promise(resolve => setTimeout(resolve, 250));
            await settle();

            expect(chipTitles()).toEqual(["Name", "Team"]);
            expect(announce).toHaveBeenCalledWith("Team moved to position 2");
            expect(document.activeElement).toBe(groupButton("Team"));
            expect(groupButton("Team").getAttribute("aria-expanded")).toBe("false");
        });
    });

    describe("dropping columns (GV4)", () => {
        type DragApi = {
            dropAfter: { set(value: boolean): void };
            dropColumn: { set(value: unknown): void };
            onColumnDragStart(event: unknown): void;
            onColumnDrop(): void;
        };

        function gridComponent(): DragApi {
            return fixture.debugElement.children[0].componentInstance as DragApi;
        }

        function dragStart(field: string): void {
            const column = service.columns().firstOrDefault(candidate => candidate.field === field);
            gridComponent().onColumnDragStart({ source: { data: column } });
        }

        it("drops a column after the last column", () => {
            dragStart("name");
            gridComponent().dropColumn.set(service.columns().firstOrDefault(column => column.field === "amount"));
            gridComponent().dropAfter.set(true);
            gridComponent().onColumnDrop();
            expect(
                service
                    .columns()
                    .select(column => column.field)
                    .toArray()
            ).toEqual(["team", "amount", "name"]);
        });

        it("cancels the drop when Escape is pressed during the drag", () => {
            dragStart("name");
            gridComponent().dropColumn.set(service.columns().firstOrDefault(column => column.field === "amount"));
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            gridComponent().onColumnDrop();
            expect(
                service
                    .columns()
                    .select(column => column.field)
                    .toArray()
            ).toEqual(["name", "team", "amount"]);
        });
    });

    it("doesn't show detail rows with virtual scrolling, and says why in dev mode (GV1)", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const virtual = TestBed.createComponent(VirtualHostComponent);
        await settle(virtual);
        const virtualService = virtual.debugElement.children[0].injector.get(GridService);
        expect(virtualService.masterDetailTemplate()).toBeNull();
        expect(virtualService.layout().some(column => column.kind === "detail")).toBe(false);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("virtual scrolling"));
        warn.mockRestore();
    });
});
