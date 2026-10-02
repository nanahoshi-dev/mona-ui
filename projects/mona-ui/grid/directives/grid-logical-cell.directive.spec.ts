import { Component, ElementRef, signal, TemplateRef, ViewContainerRef, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { GridNavigationService } from "../services/grid-navigation.service";
import { GridService } from "../services/grid.service";
import { GridLogicalCellDirective } from "./grid-logical-cell.directive";

@Component({
    imports: [GridLogicalCellDirective],
    providers: [GridService, GridNavigationService],
    template: `<ng-container #outlet />
        <ng-template #cell let-row>
            <table>
                <tr>
                    <td
                        monaGridLogicalCell
                        [colIndex]="0"
                        [rowIndex]="0"
                        [rowUid]="row"
                        [groupHeader]="grouped()"
                        [groupKey]="grouped() ? 'team:A' : undefined"
                        columnId="name"
                        [firstInRow]="true"
                        [lastInRow]="true">
                        {{ row }}
                    </td>
                </tr>
            </table>
        </ng-template>`
})
class RecycledCellHostComponent {
    public readonly cell = viewChild.required<TemplateRef<{ $implicit: string }>>("cell");
    public readonly grouped = signal(false);
    public readonly outlet = viewChild.required("outlet", { read: ViewContainerRef });
}

describe("logical cell view recycling", () => {
    it.each([false, true])("settles when cached and new views share identity (grouped=%s)", async grouped => {
        TestBed.configureTestingModule({ imports: [RecycledCellHostComponent] });
        const fixture = TestBed.createComponent(RecycledCellHostComponent);
        fixture.componentInstance.grouped.set(grouped);
        fixture.detectChanges();
        await fixture.whenStable();
        const host = fixture.componentInstance;
        host.outlet().createEmbeddedView(host.cell(), { $implicit: "row-1" });
        fixture.detectChanges();
        await fixture.whenStable();
        const cached = host.outlet().detach(0);
        try {
            const current = host.outlet().createEmbeddedView(host.cell(), { $implicit: "row-1" });
            fixture.detectChanges();
            await fixture.whenStable();
            const root: HTMLElement = fixture.nativeElement;
            const activeCell = root.querySelector("td");
            if (!activeCell) {
                throw new Error("Expected the current logical cell.");
            }
            const navigation = fixture.debugElement.injector.get(GridNavigationService);
            navigation.focusActiveCellOrFirstHeader();
            expect(document.activeElement).toBe(activeCell);
            cached?.destroy();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(navigation.focusActiveCellOrFirstHeader()).toBe(true);
            expect(document.activeElement).toBe(activeCell);
            current.context.$implicit = "row-2";
            current.markForCheck();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(activeCell.textContent).toContain("row-2");
            expect(navigation.focusActiveCellOrFirstHeader()).toBe(true);
            expect(document.activeElement).toBe(activeCell);
        } finally {
            cached?.destroy();
        }
    });
});

describe("GridLogicalCellDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [
                GridService,
                GridNavigationService,
                { provide: ElementRef, useValue: new ElementRef(document.createElement("td")) }
            ]
        });
        const directive = TestBed.runInInjectionContext(() => new GridLogicalCellDirective());
        expect(directive).toBeTruthy();
    });
});
