import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import type { Column } from "../../models/Column";
import { Row } from "../../models/Row";
import { GridService } from "../../services/grid.service";
import { GridCommandCellComponent } from "./grid-command-cell.component";

@Component({
    imports: [GridCommandCellComponent],
    providers: [GridService],
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

    it("renders default english accessible labels for command buttons", () => {
        gridService.setEditableOptions({ enabled: true, mode: "row" });
        fixture.detectChanges();

        const editButton = fixture.nativeElement.querySelector("button[aria-label='Edit row']") as HTMLButtonElement;
        const removeButton = fixture.nativeElement.querySelector("button[aria-label='Remove row']") as HTMLButtonElement;

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
                    editRow: "Satırı düzenle",
                    remove: "Sil",
                    removeRow: "Satırı sil"
                }
            }
        });
        fixture.detectChanges();

        const editButton = fixture.nativeElement.querySelector("button[aria-label='Satırı düzenle']") as HTMLButtonElement;
        const removeButton = fixture.nativeElement.querySelector("button[aria-label='Satırı sil']") as HTMLButtonElement;

        expect(editButton).not.toBeNull();
        expect(editButton.getAttribute("title")).toBe("Düzenle");
        expect(removeButton).not.toBeNull();
        expect(removeButton.getAttribute("title")).toBe("Sil");

        i18n.use(MONA_DEFAULT_LOCALE);
    });
});
