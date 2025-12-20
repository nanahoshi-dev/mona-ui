import { StepperIndicatorDirective } from "./stepper-indicator.directive";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { StepperComponent } from "../components/stepper/stepper.component";

@Component({
    template: `
        <mona-stepper [steps]="steps"></mona-stepper>
    `,
    imports: [StepperComponent]
})
class TestHostComponent {
    public steps: any[] = [
        { label: "Step 1" },
        { label: "Step 2" },
        { label: "Step 3" }
    ];
}

describe("StepperIndicatorDirective", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, StepperComponent]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });
});
