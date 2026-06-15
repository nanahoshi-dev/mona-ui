import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GridColumnChooserComponent } from "./grid-column-chooser.component";

describe("GridColumnChooserComponent", () => {
    let component: GridColumnChooserComponent;
    let fixture: ComponentFixture<GridColumnChooserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridColumnChooserComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(GridColumnChooserComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
