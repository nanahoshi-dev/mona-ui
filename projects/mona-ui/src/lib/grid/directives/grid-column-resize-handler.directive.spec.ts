import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImmutableList } from "@mirei/ts-collections";
import type { Column } from "../models/Column";
import type { ColumnResizeEvent } from "../models/ColumnResizeEvent";
import { GridService } from "../services/grid.service";
import { GridColumnResizeHandlerDirective } from "./grid-column-resize-handler.directive";

// jsdom does not implement the Pointer Events capture methods used by the drag path.
if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    Element.prototype.hasPointerCapture = vi.fn(() => true);
}

function createColumn(overrides: Partial<Column> & Pick<Column, "field">): Column {
    return {
        aggregate: null,
        calculatedWidth: null,
        cellTemplate: null,
        columnSortDirection: null,
        commandTemplate: null,
        configuredHidden: false,
        dataType: "string",
        editTemplate: null,
        editable: false,
        filtered: false,
        format: null,
        footerTemplate: null,
        groupFooterTemplate: null,
        headerTemplate: null,
        groupSortDirection: null,
        hidden: false,
        id: overrides.field,
        index: 0,
        kind: "data",
        locked: false,
        lockedPosition: "left",
        maxWidth: null,
        minWidth: 40,
        removeConfirmation: false,
        sortIndex: null,
        stateKey: null,
        title: overrides.field,
        titleTemplate: null,
        width: 80,
        ...overrides
    };
}

@Component({
    template: ` <div
        monaGridColumnResizeHandler
        [column]="column"
        (resizeStart)="onResizeStart()"
        (resizeEnd)="onResizeEnd($event)"></div>`,
    imports: [GridColumnResizeHandlerDirective]
})
class HostComponent {
    public column: Column = createColumn({ field: "name", calculatedWidth: 100, minWidth: 50, maxWidth: 200 });
    public onResizeEnd = vi.fn();
    public onResizeStart = vi.fn();
}

describe("GridColumnResizeHandlerDirective", () => {
    let fixture: ComponentFixture<HostComponent>;
    let gridService: GridService;
    let element: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [GridService]
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        gridService = fixture.debugElement.injector.get(GridService);
        gridService.columns.set(ImmutableList.create([fixture.componentInstance.column]));
        fixture.detectChanges();
        await fixture.whenStable();
        element = fixture.nativeElement.querySelector("div") as HTMLElement;
    });

    it("should create an instance", () => {
        expect(element).toBeTruthy();
    });

    describe("pointer drag", () => {
        it("increases the column width by the pointer delta", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: 30, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: 30, pointerId: 1, bubbles: true }));

            expect(fixture.componentInstance.onResizeStart).toHaveBeenCalledTimes(1);
            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.oldWidth).toBe(100);
            expect(event.newWidth).toBe(130);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(130);
        });

        it("does not apply a resize past minWidth", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: -100, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: -100, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(100);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(100);
        });

        it("does not apply a resize past maxWidth", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: 500, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: 500, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(100);
        });
    });
});
