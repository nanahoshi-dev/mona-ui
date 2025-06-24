import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChipDemoComponent } from "./chip-demo.component";

describe("ChipDemoComponent", () => {
    let component: ChipDemoComponent;
    let fixture: ComponentFixture<ChipDemoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ChipDemoComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ChipDemoComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
