import { ComponentFixture, TestBed } from "@angular/core/testing";

import { StepperComponent } from "./stepper.component";

describe("StepperComponent", () => {
    let component: StepperComponent;
    let fixture: ComponentFixture<StepperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StepperComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(StepperComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput("steps", [
            { label: "Step 1" },
            { label: "Step 2" },
            { label: "Step 3" }
        ]);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
