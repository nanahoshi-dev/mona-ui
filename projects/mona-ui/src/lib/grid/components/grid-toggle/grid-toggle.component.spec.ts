import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GridToggleComponent } from "./grid-toggle.component";

describe("GridToggleComponent", () => {
    let component: GridToggleComponent;
    let fixture: ComponentFixture<GridToggleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridToggleComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(GridToggleComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
