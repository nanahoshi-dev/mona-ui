import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { DropdownPopupInputToken } from "../models/DropdownPopupInput";
import { DropdownService } from "../services/dropdown.service";
import { DropdownPopupHandlerDirective } from "./dropdown-popup-handler.directive";

@Component({
    template: "<div></div>",
    hostDirectives: [DropdownPopupHandlerDirective]
})
class TestHostComponent {}

describe("DropdownPopupHandlerDirective", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [
                DropdownService,
                {
                    provide: DropdownPopupInputToken,
                    useValue: () => {}
                },
                provideNoopAnimations()
            ]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });
});
