import { CdkFixedSizeVirtualScroll } from "@angular/cdk/scrolling";
import { Component, signal } from "@angular/core";
import { DeferBlockState, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { GridComponent } from "../components/grid/grid.component";
import { GridColumnComponent } from "../components/grid-column/grid-column.component";
import { GridService } from "../services/grid.service";
import { GridVirtualScrollDirective } from "./grid-virtual-scroll.directive";

@Component({
    imports: [GridComponent, GridColumnComponent, GridVirtualScrollDirective],
    template: `<mona-grid [monaGridVirtualScroll]="options()" [data]="rows" [resizeMethod]="100">
        <mona-grid-column field="id" title="ID" [width]="100" />
    </mona-grid>`
})
class HostComponent {
    public readonly options = signal<{ enabled: boolean; height?: number }>({ enabled: true });
    public readonly rows = [{ id: 1 }, { id: 2 }];
}

describe("GridVirtualScrollDirective", () => {
    let directive: GridVirtualScrollDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [GridService]
        });
        directive = TestBed.runInInjectionContext(() => new GridVirtualScrollDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it.each([36, 48])("uses %spx for both CDK item size and rendered row sizing", async height => {
        const fixture = TestBed.createComponent(HostComponent);
        if (height !== 36) {
            fixture.componentInstance.options.set({ enabled: true, height });
        }
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
        const viewport = fixture.debugElement.query(By.directive(CdkFixedSizeVirtualScroll));
        expect(viewport.injector.get(CdkFixedSizeVirtualScroll).itemSize).toBe(height);
        const list: HTMLElement = fixture.nativeElement.querySelector("mona-grid-virtual-list");
        expect(list.style.getPropertyValue("--mona-grid-row-height")).toBe(`${height}px`);
    });

    it.each([0, -1, NaN, Infinity])("rejects invalid virtual height %s", height => {
        const service = TestBed.inject(GridService);
        expect(() => service.setVirtualScrollOptions({ enabled: true, height })).toThrow("height must be");
    });
});
