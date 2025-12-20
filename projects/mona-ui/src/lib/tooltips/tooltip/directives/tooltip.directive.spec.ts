import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TooltipDirective } from "./tooltip.directive";
import { Component } from "@angular/core";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
@Component({
    template: `
        <button monaTooltip title="Tooltip">Button</button>
    `,
    imports: [TooltipDirective]
})
class TestHostComponent {
}

describe("TooltipDirective", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent, TooltipDirective],
            providers: [provideNoopAnimations()]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });
});
