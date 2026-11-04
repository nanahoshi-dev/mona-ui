import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridService } from "../../services/grid.service";
import { GridCommandCellComponent } from "./grid-command-cell.component";

@Component({
    imports: [GridCommandCellComponent],
    providers: [GridService, GridNavigationService],
    template: `<mona-grid-command-cell [column]="column()" [row]="row()"></mona-grid-command-cell>`
})
class TestHostComponent {
    public readonly column = signal<Column>({
        aggregate: null,
        calculatedWidth: null,
        cellTemplate: null,
        columnSortDirection: null,
        commandTemplate: null,
        configuredHidden: false,
        dataType: "string",
        editable: false,
        editTemplate: null,
        field: "cmd",
        filterable: false,
        filtered: false,
        footerTemplate: null,
        format: null,
        groupFooterTemplate: null,
        groupSortDirection: null,
        headerTemplate: null,
        hidden: false,
        id: "cmd",
        index: 0,
        kind: "command",
        locked: false,
        lockedPosition: "left",
        maxWidth: null,
        minWidth: 40,
        removeConfirmation: false,
        sortable: true,
        sortIndex: null,
        stateKey: null,
        title: "",
        titleTemplate: null,
        width: 80
    });
    public readonly row = signal<Row | null>(new Row({ id: 1, name: "Item 1" }, "r1"));
}

describe("GridCommandCellComponent", () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let gridService: GridService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        gridService = fixture.debugElement.injector.get(GridService);
        fixture.detectChanges();
    });

    it("names command buttons after their row (GE9)", () => {
        gridService.setEditableOptions({ enabled: true, mode: "row" });
        fixture.detectChanges();

        const editButton = fixture.nativeElement.querySelector("button[aria-label='Edit row 1']") as HTMLButtonElement;
        const removeButton = fixture.nativeElement.querySelector("button[aria-label='Remove row 1']") as HTMLButtonElement;

        expect(editButton).not.toBeNull();
        expect(editButton.getAttribute("title")).toBe("Edit");
        expect(removeButton).not.toBeNull();
        expect(removeButton.getAttribute("title")).toBe("Remove");
    });

    it("updates command button labels dynamically when locale changes", () => {
        gridService.setEditableOptions({ enabled: true, mode: "row" });
        fixture.detectChanges();

        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            messages: {
                grid: {
                    edit: "Düzenle",
                    editRow: (rowNumber: number) => `${rowNumber}. satırı düzenle`,
                    remove: "Sil",
                    removeRow: (rowNumber: number) => `${rowNumber}. satırı sil`
                }
            }
        });
        fixture.detectChanges();

        const editButton = fixture.nativeElement.querySelector("button[aria-label='1. satırı düzenle']") as HTMLButtonElement;
        const removeButton = fixture.nativeElement.querySelector("button[aria-label='1. satırı sil']") as HTMLButtonElement;

        expect(editButton).not.toBeNull();
        expect(editButton.getAttribute("title")).toBe("Düzenle");
        expect(removeButton).not.toBeNull();
        expect(removeButton.getAttribute("title")).toBe("Sil");

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("takes button names from commandAriaLabel (GE9)", () => {
        gridService.setEditableOptions({
            mode: "row",
            commandAriaLabel: (command, rowData) => `${command} ${String(rowData["name"])}`
        });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector("button[aria-label='edit Item 1']")).not.toBeNull();
        expect(fixture.nativeElement.querySelector("button[aria-label='remove Item 1']")).not.toBeNull();
    });
});
