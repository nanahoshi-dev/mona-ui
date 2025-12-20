import { Component, ElementRef } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { SelectionMode } from "../../../../models/SelectionMode";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { ButtonGroupComponent } from "./button-group.component";
import { ButtonGroupItemComponent } from "../button-group-item/button-group-item.component";

@Component({
    template: `
        <mona-button-group [disabled]="disabled" [selection]="selectionMode">
            <mona-button-group-item monaButton [selected]="selectedIndex === 0">Button 1</mona-button-group-item>
            <mona-button-group-item monaButton [selected]="selectedIndex === 1">Button 2</mona-button-group-item>
            <mona-button-group-item monaButton [selected]="selectedIndex === 2">Button 3</mona-button-group-item>
        </mona-button-group>
    `,
    imports: [ButtonGroupComponent, ButtonGroupItemComponent]
})
class ButtonGroupComponentSpecHostComponent {
    public disabled: boolean = false;
    public selectionMode: SelectionMode = "single";
    public selectedIndex: number = -1;
}

describe("ButtonGroupComponent", () => {
    let component: ButtonGroupComponent;
    let hostComponent: ButtonGroupComponentSpecHostComponent;
    let fixture: ComponentFixture<ButtonGroupComponent>;
    let hostFixture: ComponentFixture<ButtonGroupComponentSpecHostComponent>;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [ButtonGroupComponent, ButtonGroupComponentSpecHostComponent, ButtonDirective]
        });
        fixture = TestBed.createComponent(ButtonGroupComponent);
        hostFixture = TestBed.createComponent(ButtonGroupComponentSpecHostComponent);
        component = fixture.componentInstance;
        hostComponent = hostFixture.componentInstance;
        fixture.detectChanges();
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });









    const getButtonElementTuple = (hostFixture: ComponentFixture<ButtonGroupComponentSpecHostComponent>) => {
        return hostFixture.debugElement
            .queryAll(By.directive(ButtonDirective))
            .map(button => [button.injector.get(ButtonDirective), button.injector.get(ElementRef)]) as [
                ButtonDirective,
                ElementRef
            ][];
    };
});
