import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridNavigationService } from "../../services/grid-navigation.service";
import { GridRowFlattenerService } from "../../services/grid-row-flattener.service";
import { GridService } from "../../services/grid.service";

import { GridListComponent } from "./grid-list.component";

describe("GridListComponent", () => {
    let component: GridListComponent;
    let fixture: ComponentFixture<GridListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridListComponent],
            providers: [GridService, GridNavigationService, GridRowFlattenerService]
        }).compileComponents();
        fixture = TestBed.createComponent(GridListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
