import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";

import { GridVirtualListComponent } from "./grid-virtual-list.component";

describe("GridVirtualListComponent", () => {
    let component: GridVirtualListComponent;
    let fixture: ComponentFixture<GridVirtualListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridVirtualListComponent],
            providers: [GridService, GridNavigationService, GridRowFlattenerService]
        }).compileComponents();

        fixture = TestBed.createComponent(GridVirtualListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
