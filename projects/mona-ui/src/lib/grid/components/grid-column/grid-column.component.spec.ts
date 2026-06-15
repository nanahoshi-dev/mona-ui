import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridHeaderTemplateDirective } from "../../directives/grid-header-template.directive";

import { GridColumnComponent } from "./grid-column.component";

@Component({
    template: `
        <mona-grid-column [format]="format">
            <ng-template monaGridHeaderTemplate>Header</ng-template>
        </mona-grid-column>
    `,
    imports: [GridColumnComponent, GridHeaderTemplateDirective],
    changeDetection: ChangeDetectionStrategy.OnPush
})
class GridColumnComponentTest {
    public readonly format = "yyyy-MM-dd";
}

describe("GridColumnComponent", () => {
    let component: GridColumnComponent;
    let fixture: ComponentFixture<GridColumnComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GridColumnComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(GridColumnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("adds format and header template to the column definition", () => {
        const hostFixture = TestBed.createComponent(GridColumnComponentTest);
        hostFixture.detectChanges();
        const columnComponent = hostFixture.debugElement.query(By.directive(GridColumnComponent))
            .componentInstance as GridColumnComponent;
        const column = columnComponent.getColumn();

        expect(column.format).toBe("yyyy-MM-dd");
        expect(column.headerTemplate).not.toBeNull();
    });
});
