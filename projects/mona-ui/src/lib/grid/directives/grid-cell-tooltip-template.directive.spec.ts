import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { GridComponent } from "../components/grid/grid.component";

@Component({
    template: `
        <mona-grid>
            <ng-template monaGridCellTooltipTemplate></ng-template>
        </mona-grid>
    `,
    standalone: true,
    imports: [GridComponent]
})
class TestHostComponent {
}

describe("GridCellTooltipTemplateDirective", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });
});
