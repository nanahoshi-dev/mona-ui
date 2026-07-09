import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { PopupDataInjectionToken } from "@mirei/mona-ui/popup";
import { WindowInjectorData } from "../../models/WindowInjectorData";

import { WindowContentComponent } from "./window-content.component";

@Component({
    template: ` <div>Test</div> `,
    standalone: false
})
class WindowContentComponentTestComponent {}

const POPUP_TOKEN = [
    {
        provide: PopupDataInjectionToken,
        useValue: {
            content: WindowContentComponentTestComponent
        } as WindowInjectorData
    }
];

describe("WindowContentComponent", () => {
    let component: WindowContentComponent;
    let fixture: ComponentFixture<WindowContentComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [WindowContentComponent, ButtonDirective],
            providers: [POPUP_TOKEN]
        });
        fixture = TestBed.createComponent(WindowContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });
});
