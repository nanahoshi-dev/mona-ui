import { Component, viewChild, ViewChild } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ButtonGroupComponent } from "../../button-group/components/button-group/button-group.component";
import { ButtonDirective } from "./button.directive";
import { vi } from "vitest";

@Component({
    template: ` <button
        monaButton
        [selected]="selected"
        [tabindex]="tabIndex"
        [toggleable]="toggleable"
        (selectedChange)="selectedChange($event)">
        TEST BUTTON
    </button>`,
    imports: [ButtonDirective]
})
class TestButtonDirectiveComponent {
    public selected: boolean = false;
    public tabIndex: number = 0;
    public toggleable: boolean = false;

    public buttonDirective = viewChild.required(ButtonDirective);

    public selectedChange(selected: boolean): void {
        this.selected = selected;
    }
}

@Component({
    template: `
        <mona-button-group selection="single">
            <button monaButton [toggleable]="true">A</button>
            <button monaButton [toggleable]="true">B</button>
            <button monaButton [toggleable]="true">C</button>
        </mona-button-group>
    `,
    imports: [ButtonDirective, ButtonGroupComponent]
})
class TestButtonGroupButtonComponent {}

describe("ButtonDirective", () => {
    let buttonHostComponent: TestButtonDirectiveComponent;
    let buttonGroupHostComponent: TestButtonGroupButtonComponent;
    let buttonHostFixture: ComponentFixture<TestButtonDirectiveComponent>;
    let buttonGroupHostFixture: ComponentFixture<TestButtonGroupButtonComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestButtonDirectiveComponent]
        });
        buttonHostFixture = TestBed.createComponent(TestButtonDirectiveComponent);
        buttonGroupHostFixture = TestBed.createComponent(TestButtonGroupButtonComponent);
        buttonHostComponent = buttonHostFixture.componentInstance;
        buttonGroupHostComponent = buttonGroupHostFixture.componentInstance;
        buttonHostFixture.detectChanges();
        buttonGroupHostFixture.detectChanges();
    });

    it("should create", () => {
        expect(buttonHostComponent).toBeTruthy();
    });
});
