import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { Column } from "../../models/Column";
import type { ColumnGroup } from "../../models/ColumnGroup";
import { GridService } from "../../services/grid.service";

import { GridColumnChooserComponent } from "./grid-column-chooser.component";

function createColumn(field: string, title: string, groups: readonly ColumnGroup[] = []): Column {
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
        groups,
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
        sortable: true,
        stateKey: null,
        title,
        titleTemplate: null,
        width: 80
    };
}

describe("GridColumnChooserComponent", () => {
    let component: GridColumnChooserComponent;
    let fixture: ComponentFixture<GridColumnChooserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridColumnChooserComponent],
            providers: [GridService]
        }).compileComponents();

        fixture = TestBed.createComponent(GridColumnChooserComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("lists a column in a group with the group's titles first, and finds it by them", () => {
        const contact: ColumnGroup = { id: "contact", title: "Contact" };
        const address: ColumnGroup = { id: "address", title: "Address" };
        TestBed.inject(GridService).setColumnDefinitions([
            createColumn("id", "Id"),
            createColumn("city", "City", [contact, address]),
            createColumn("email", "Email", [contact])
        ]);

        const titles = (): string[] =>
            component["columnListSource"]()
                .select(item => item.title)
                .toArray();
        expect(titles()).toEqual(["Id", "Contact / Address / City", "Contact / Email"]);

        component["filterText"].set("address");
        expect(titles()).toEqual(["Contact / Address / City"]);
    });
});
