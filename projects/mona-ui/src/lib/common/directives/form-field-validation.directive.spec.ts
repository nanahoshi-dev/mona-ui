import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule, Validators } from "@angular/forms";
import { FormFieldValidationDirective } from "./form-field-validation.directive";

@Component({
    template: `<input [formControl]="control" monaFormFieldValidation />`,
    imports: [ReactiveFormsModule, FormFieldValidationDirective]
})
class TestHostComponent {
    control = new FormControl("", Validators.required);
}

describe("FormFieldValidationDirective", () => {
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        fixture.detectChanges();
    });

    it("should create", () => {
        const inputElement = fixture.nativeElement.querySelector("input");
        expect(inputElement).toBeTruthy();
    });
});
