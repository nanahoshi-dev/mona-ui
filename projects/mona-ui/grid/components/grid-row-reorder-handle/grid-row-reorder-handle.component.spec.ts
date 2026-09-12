import { LiveAnnouncer } from "@angular/cdk/a11y";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableDictionary, KeyValuePair } from "@mirei/ts-collections";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Column } from "../../models/Column";
import type { ColumnFilterState } from "../../models/ColumnFilterState";
import type { ColumnSortState } from "../../models/ColumnSortState";
import { GridService } from "../../services/grid.service";
import { GridRowReorderHandleComponent } from "./grid-row-reorder-handle.component";

function createColumn(field: string): Column {
    return {
        aggregate: null,
        calculatedWidth: null,
        cellTemplate: null,
        columnSortDirection: null,
        commandTemplate: null,
        configuredHidden: false,
        dataType: "string",
        editTemplate: null,
        editable: false,
        field,
        filterable: true,
        filtered: false,
        footerTemplate: null,
        format: null,
        groupFooterTemplate: null,
        groupSortDirection: null,
        headerTemplate: null,
        hidden: false,
        id: field,
        index: 0,
        kind: "data",
        locked: false,
        lockedPosition: "left",
        maxWidth: null,
        minWidth: 40,
        removeConfirmation: false,
        sortIndex: null,
        stateKey: null,
        title: field,
        titleTemplate: null,
        width: 80
    };
}

describe("GridRowReorderHandleComponent", () => {
    let fixture: ComponentFixture<GridRowReorderHandleComponent>;
    let gridService: GridService;
    let i18nService: MonaI18nService;
    let liveAnnouncerMock: { announce: ReturnType<typeof vi.fn> };

    function getButton(): HTMLButtonElement {
        const button = fixture.nativeElement.querySelector("button");
        if (button == null) {
            throw new Error("Expected button element in GridRowReorderHandleComponent");
        }
        return button;
    }

    beforeEach(async () => {
        liveAnnouncerMock = {
            announce: vi.fn()
        };

        await TestBed.configureTestingModule({
            imports: [GridRowReorderHandleComponent],
            providers: [
                GridService,
                { provide: LiveAnnouncer, useValue: liveAnnouncerMock }
            ]
        }).compileComponents();

        gridService = TestBed.inject(GridService);
        i18nService = TestBed.inject(MonaI18nService);
        i18nService.use(MONA_DEFAULT_LOCALE);

        gridService.setRows([{ id: 1 }, { id: 2 }, { id: 3 }]);
        gridService.setRowReorderableOptions({ enabled: true });

        fixture = TestBed.createComponent(GridRowReorderHandleComponent);
        const firstRow = gridService.rows().firstOrDefault();
        if (firstRow == null) {
            throw new Error("Expected rows to be present");
        }
        fixture.componentRef.setInput("row", firstRow);
        fixture.componentRef.setInput("pageIndex", 0);
        fixture.detectChanges();
    });

    afterEach(() => {
        i18nService.use(MONA_DEFAULT_LOCALE);
    });

    describe("English default locale", () => {
        it("renders accessible label with keyboard hint when reordering is enabled", () => {
            const button = getButton();
            expect(button.disabled).toBe(false);
            expect(button.getAttribute("aria-label")).toBe(
                "Reorder row 1. Use Alt plus Up Arrow or Alt plus Down Arrow to move."
            );
            expect(button.getAttribute("title")).toBeNull();
        });

        it("reflects disabled state and includes disabled reason suffix", () => {
            gridService.setRowReorderableOptions({ enabled: false });
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe("Row reordering is disabled.");
            expect(button.getAttribute("aria-label")).toBe(
                "Reorder row 1. Use Alt plus Up Arrow or Alt plus Down Arrow to move. Row reordering is disabled."
            );
        });

        it("includes editing reason when row edit is active", () => {
            const column = createColumn("id");
            gridService.columns.set(gridService.columns().add(column));
            gridService.setEditableOptions({ enabled: true, mode: "cell" });
            const row = gridService.rows().firstOrDefault()!;
            gridService.startCellEdit(`${row.uid}_id`, row, column);
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe("Finish editing to reorder rows.");
            expect(button.getAttribute("aria-label")).toContain("Finish editing to reorder rows.");
        });

        it("includes single-row reason when fewer than two rows exist", () => {
            gridService.setRows([{ id: 1 }]);
            fixture.componentRef.setInput("row", gridService.rows().firstOrDefault()!);
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe("At least two rows are needed to reorder.");
            expect(button.getAttribute("aria-label")).toContain("At least two rows are needed to reorder.");
        });

        it("includes virtual-scroll reason when virtual scrolling is enabled", () => {
            gridService.setVirtualScrollOptions({ enabled: true });
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe(
                "Row reordering isn't available while virtual scrolling is enabled."
            );
            expect(button.getAttribute("aria-label")).toContain(
                "Row reordering isn't available while virtual scrolling is enabled."
            );
        });

        it("includes sorted reason when a sort is active", () => {
            const sortState: ColumnSortState = { sort: { field: "id", dir: "asc" } };
            gridService.appliedSorts.set(
                ImmutableDictionary.create<string, ColumnSortState>([
                    new KeyValuePair("id", sortState)
                ])
            );
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe("Clear sorting to reorder rows.");
            expect(button.getAttribute("aria-label")).toContain("Clear sorting to reorder rows.");
        });

        it("includes filtered reason when a filter is active", () => {
            const filterState: ColumnFilterState = {
                filter: {
                    filters: [{ field: "id", operator: "neq", value: 999 }],
                    logic: "and"
                }
            };
            gridService.appliedFilters.set(
                ImmutableDictionary.create<string, ColumnFilterState>([
                    new KeyValuePair("id", filterState)
                ])
            );
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe("Clear filters to reorder rows.");
            expect(button.getAttribute("aria-label")).toContain("Clear filters to reorder rows.");
        });

        it("includes grouped reason when grouping is active", () => {
            const column = createColumn("id");
            gridService.columns.set(gridService.columns().add(column));
            gridService.addGroupColumn(column);
            fixture.detectChanges();

            const button = getButton();
            expect(button.disabled).toBe(true);
            expect(button.getAttribute("title")).toBe("Clear grouping to reorder rows.");
            expect(button.getAttribute("aria-label")).toContain("Clear grouping to reorder rows.");
        });

        it("announces moved row position on Alt+ArrowDown", () => {
            const button = getButton();
            button.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true })
            );

            expect(liveAnnouncerMock.announce).toHaveBeenCalledTimes(1);
            expect(liveAnnouncerMock.announce).toHaveBeenCalledWith("Moved row 1 to position 2.");
        });

        it("announces moved row position on Alt+ArrowUp", () => {
            const thirdRow = gridService.rows().get(2);
            fixture.componentRef.setInput("row", thirdRow);
            fixture.componentRef.setInput("pageIndex", 2);
            fixture.detectChanges();

            const button = getButton();
            button.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true, cancelable: true })
            );

            expect(liveAnnouncerMock.announce).toHaveBeenCalledTimes(1);
            expect(liveAnnouncerMock.announce).toHaveBeenCalledWith("Moved row 3 to position 2.");
        });
    });

    describe("German (de-DE) locale", () => {
        beforeEach(() => {
            i18nService.use(MONA_DE_DE_LOCALE);
            fixture.detectChanges();
        });

        it("renders German accessible label and keyboard hint", () => {
            const button = getButton();
            expect(button.getAttribute("aria-label")).toBe(
                "Zeile 1 neu anordnen. Alt + Pfeil nach oben oder Alt + Pfeil nach unten zum Verschieben verwenden."
            );
        });

        it("translates disabled reason suffix to German", () => {
            gridService.setRowReorderableOptions({ enabled: false });
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe("Das Neuanordnen von Zeilen ist deaktiviert.");
            expect(button.getAttribute("aria-label")).toBe(
                "Zeile 1 neu anordnen. Alt + Pfeil nach oben oder Alt + Pfeil nach unten zum Verschieben verwenden. Das Neuanordnen von Zeilen ist deaktiviert."
            );
        });

        it("translates editing reason to German", () => {
            const column = createColumn("id");
            gridService.columns.set(gridService.columns().add(column));
            gridService.setEditableOptions({ enabled: true, mode: "cell" });
            const row = gridService.rows().firstOrDefault()!;
            gridService.startCellEdit(`${row.uid}_id`, row, column);
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe("Bearbeitung abschließen, um Zeilen neu anzuordnen.");
            expect(button.getAttribute("aria-label")).toContain("Bearbeitung abschließen, um Zeilen neu anzuordnen.");
        });

        it("translates single-row reason to German", () => {
            gridService.setRows([{ id: 1 }]);
            fixture.componentRef.setInput("row", gridService.rows().firstOrDefault()!);
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe("Zum Neuanordnen sind mindestens zwei Zeilen erforderlich.");
            expect(button.getAttribute("aria-label")).toContain(
                "Zum Neuanordnen sind mindestens zwei Zeilen erforderlich."
            );
        });

        it("translates virtual-scroll reason to German", () => {
            gridService.setVirtualScrollOptions({ enabled: true });
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe(
                "Bei aktiviertem virtuellem Scrollen können Zeilen nicht neu angeordnet werden."
            );
            expect(button.getAttribute("aria-label")).toContain(
                "Bei aktiviertem virtuellem Scrollen können Zeilen nicht neu angeordnet werden."
            );
        });

        it("translates sorted reason to German", () => {
            const sortState: ColumnSortState = { sort: { field: "id", dir: "asc" } };
            gridService.appliedSorts.set(
                ImmutableDictionary.create<string, ColumnSortState>([
                    new KeyValuePair("id", sortState)
                ])
            );
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe("Sortierung aufheben, um Zeilen neu anzuordnen.");
            expect(button.getAttribute("aria-label")).toContain("Sortierung aufheben, um Zeilen neu anzuordnen.");
        });

        it("translates filtered reason to German", () => {
            const filterState: ColumnFilterState = {
                filter: {
                    filters: [{ field: "id", operator: "neq", value: 999 }],
                    logic: "and"
                }
            };
            gridService.appliedFilters.set(
                ImmutableDictionary.create<string, ColumnFilterState>([
                    new KeyValuePair("id", filterState)
                ])
            );
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe("Filter aufheben, um Zeilen neu anzuordnen.");
            expect(button.getAttribute("aria-label")).toContain("Filter aufheben, um Zeilen neu anzuordnen.");
        });

        it("translates grouped reason to German", () => {
            const column = createColumn("id");
            gridService.columns.set(gridService.columns().add(column));
            gridService.addGroupColumn(column);
            fixture.detectChanges();

            const button = getButton();
            expect(button.getAttribute("title")).toBe("Gruppierung aufheben, um Zeilen neu anzuordnen.");
            expect(button.getAttribute("aria-label")).toContain("Gruppierung aufheben, um Zeilen neu anzuordnen.");
        });

        it("announces moved row position with German text", () => {
            const thirdRow = gridService.rows().get(2);
            fixture.componentRef.setInput("row", thirdRow);
            fixture.componentRef.setInput("pageIndex", 2);
            fixture.detectChanges();

            const button = getButton();
            button.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true, cancelable: true })
            );

            expect(liveAnnouncerMock.announce).toHaveBeenCalledTimes(1);
            expect(liveAnnouncerMock.announce).toHaveBeenCalledWith("Zeile 3 an Position 2 verschoben.");
        });
    });

    describe("Runtime locale switching", () => {
        it("dynamically updates aria-label and live announcement between English and German", () => {
            const button = getButton();
            expect(button.getAttribute("aria-label")).toContain("Reorder row 1.");

            i18nService.use(MONA_DE_DE_LOCALE);
            fixture.detectChanges();
            expect(button.getAttribute("aria-label")).toContain("Zeile 1 neu anordnen.");

            button.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true })
            );
            expect(liveAnnouncerMock.announce).toHaveBeenCalledWith("Zeile 1 an Position 2 verschoben.");

            i18nService.use(MONA_DEFAULT_LOCALE);
            fixture.detectChanges();
            expect(button.getAttribute("aria-label")).toContain("Reorder row 1.");
        });
    });
});
