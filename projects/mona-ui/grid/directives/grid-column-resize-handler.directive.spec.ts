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
        filterable: true,
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
        sortable: true,
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

        it("stops a drag past minWidth at minWidth (GV4)", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: -100, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: -100, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(50);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(50);
        });

        it("stops a drag past maxWidth at maxWidth (GV4)", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: 500, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: 500, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(200);
        });

        it("puts the width back when Escape is pressed during a drag (GV4)", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: 40, pointerId: 1, bubbles: true }));
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(100);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(100);
            expect(gridService.columnResizeActive()).toBe(false);
        });

        it("doesn't change document.onselectstart (GV4)", () => {
            const handler = (): boolean => true;
            document.onselectstart = handler;
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            expect(document.onselectstart).toBe(handler);
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: 0, pointerId: 1, bubbles: true }));
            document.onselectstart = null;
        });

        it("decreases column width when dragged to the left in LTR", () => {
            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: -20, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: -20, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.oldWidth).toBe(100);
            expect(event.newWidth).toBe(80);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(80);
        });

        it("increases column width when dragged to the left in RTL", async () => {
            element.setAttribute("dir", "rtl");
            fixture.detectChanges();
            await fixture.whenStable();

            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: -30, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: -30, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.oldWidth).toBe(100);
            expect(event.newWidth).toBe(130);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(130);
        });

        it("decreases column width when dragged to the right in RTL", async () => {
            element.setAttribute("dir", "rtl");
            fixture.detectChanges();
            await fixture.whenStable();

            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: 20, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: 20, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.oldWidth).toBe(100);
            expect(event.newWidth).toBe(80);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(80);
        });

        it("stops a drag past minWidth at minWidth in RTL", async () => {
            element.setAttribute("dir", "rtl");
            fixture.detectChanges();
            await fixture.whenStable();

            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: 100, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(50);
            expect(gridService.getColumnWidth(gridService.columns().firstOrDefault()!)).toBe(50);
        });

        it("stops a drag past maxWidth at maxWidth in RTL", async () => {
            element.setAttribute("dir", "rtl");
            fixture.detectChanges();
            await fixture.whenStable();

            element.dispatchEvent(new PointerEvent("pointerdown", { clientX: 0, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointermove", { clientX: -500, pointerId: 1, bubbles: true }));
            element.dispatchEvent(new PointerEvent("pointerup", { clientX: -500, pointerId: 1, bubbles: true }));

            const event = fixture.componentInstance.onResizeEnd.mock.calls[0][0] as ColumnResizeEvent;
            expect(event.newWidth).toBe(200);
        });
    });

    describe("keyboard (GV3)", () => {
        function press(key: string): KeyboardEvent {
            const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
            element.dispatchEvent(event);
            fixture.detectChanges();
            return event;
        }

        function width(): number {
            return gridService.getColumnWidth(gridService.columns().firstOrDefault()!);
        }

        it("is a focusable separator named after its column, with its width as the value", () => {
            expect(element.getAttribute("role")).toBe("separator");
            expect(element.getAttribute("tabindex")).toBe("-1");
            expect(element.getAttribute("aria-orientation")).toBe("vertical");
            expect(element.getAttribute("aria-label")).toBe("Resize name");
            expect(element.getAttribute("aria-valuenow")).toBe("100");
            expect(element.getAttribute("aria-valuemin")).toBe("50");
            expect(element.getAttribute("aria-valuemax")).toBe("200");
        });

        it("resizes by 10px with the arrows and to the limits with Home and End", () => {
            expect(press("ArrowRight").defaultPrevented).toBe(true);
            expect(width()).toBe(110);
            press("ArrowLeft");
            press("ArrowLeft");
            expect(width()).toBe(90);
            press("Home");
            expect(width()).toBe(50);
            press("End");
            expect(width()).toBe(200);
            const events = fixture.componentInstance.onResizeEnd.mock.calls.map(call => call[0] as ColumnResizeEvent);
            expect(events.at(-1)).toEqual(expect.objectContaining({ oldWidth: 50, newWidth: 200 }));
        });

        it("widens with ArrowLeft in RTL", async () => {
            element.setAttribute("dir", "rtl");
            fixture.detectChanges();
            await fixture.whenStable();
            press("ArrowLeft");
            expect(width()).toBe(110);
        });
    });
});
