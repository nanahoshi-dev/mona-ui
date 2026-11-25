import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DragPreviewTemplateDirective } from "../directives/drag-preview-template.directive";
import { DraggableDirective } from "../directives/draggable.directive";
import { DropTargetDirective } from "../directives/drop-target.directive";
import type { DragEndEvent } from "../models/DragEndEvent";
import type { DragInfo } from "../models/DragInfo";
import type { DragStartEvent } from "../models/DragStartEvent";
import type { DropEffect } from "../models/DropEffect";
import type { DropTargetEvent } from "../models/DropTargetEvent";
import { DRAG_SCROLL_EDGE } from "../services/drag-drop.service";

@Component({
    imports: [DragPreviewTemplateDirective, DraggableDirective, DropTargetDirective],
    template: `
        <main>
            <div
                id="source"
                [monaDraggable]="items()"
                [dragDisabled]="disabled()"
                [dragPreview]="usePreview() ? preview : null"
                (click)="onClick()"
                (dragEnd)="ends.push($event)"
                (dragStart)="onStart($event)">
                Source
            </div>
            <section
                id="outer"
                monaDropTarget="Outer"
                dropEffect="copy"
                (dropTargetDrop)="drops.push($event)"
                (dropTargetEnter)="enters.push($event)"
                (dropTargetLeave)="leaves.push($event)">
                <div
                    id="inner"
                    monaDropTarget="Inner"
                    [dropDisabled]="innerDisabled()"
                    [dropEffect]="effectFor"
                    (dropTargetDrop)="drops.push($event)"
                    (dropTargetEnter)="enters.push($event)"
                    (dropTargetLeave)="leaves.push($event)">
                    Inner
                </div>
            </section>
            <div id="scroller" style="overflow-y: auto; height: 100px">
                <div id="scrolled" [monaDropTarget]="'Scrolled'">Scrolled</div>
            </div>
            <input id="field" aria-label="Field" [monaDraggable]="items()" (dragStart)="onStart($event)" />
            <ng-template #preview monaDragPreview let-data let-effect="effect" let-target="target">
                <span id="custom-preview">{{ effect }} {{ data.length }} to {{ target }}</span>
            </ng-template>
        </main>
    `
})
class HostComponent {
    public readonly disabled = signal(false);
    public readonly drags: DragInfo[] = [];
    public readonly drops: DropTargetEvent[] = [];
    public readonly ends: DragEndEvent<string[]>[] = [];
    public readonly enters: DropTargetEvent[] = [];
    public readonly innerDisabled = signal(false);
    public readonly items = signal(["a.txt", "b.txt"]);
    public readonly leaves: DropTargetEvent[] = [];
    public readonly starts: DragStartEvent<string[]>[] = [];
    public readonly usePreview = signal(false);
    public readonly verdict = signal<DropEffect | null>(null);
    public clicks = 0;
    public refuse = false;

    /** Ctrl copies, as in a file explorer; otherwise a move, unless the test says what. */
    public readonly effectFor = (drag: DragInfo): DropEffect => {
        this.drags.push(drag);
        return this.verdict() ?? (drag.ctrlKey ? "copy" : "move");
    };

    public onClick(): void {
        this.clicks++;
    }

    public onStart(event: DragStartEvent<string[]>): void {
        this.starts.push(event);
        if (this.refuse) {
            event.preventDefault();
        }
    }
}

/** Where things are, by x: the source, the inner target, the outer target around it, then nothing. */
function elementAt(x: number, y: number): Element | null {
    if (y >= 500) {
        return document.getElementById("scrolled");
    }
    if (x < 100) {
        return document.getElementById("source");
    }
    if (x < 200) {
        return document.getElementById("inner");
    }
    if (x < 300) {
        return document.getElementById("outer");
    }
    return document.body;
}

function pointer(type: string, x: number, y: number, init: PointerEventInit = {}): PointerEvent {
    return new PointerEvent(type, {
        bubbles: true,
        button: type === "pointerdown" ? 0 : -1,
        buttons: type === "pointerup" ? 0 : 1,
        cancelable: true,
        clientX: x,
        clientY: y,
        isPrimary: true,
        pointerId: 1,
        pointerType: "mouse",
        ...init
    });
}

function key(type: "keydown" | "keyup", name: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, key: name, ...init });
    window.dispatchEvent(event);
    return event;
}

function preview(): HTMLElement | null {
    return document.querySelector("mona-drag-preview");
}

describe("drag and drop", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    const element = (id: string): HTMLElement => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
    const settle = (): void => {
        TestBed.tick();
    };
    const press = (id: string, init: PointerEventInit = {}): void => {
        element(id).dispatchEvent(pointer("pointerdown", 10, 10, init));
    };
    const move = (x: number, y = 10, init: PointerEventInit = {}): void => {
        window.dispatchEvent(pointer("pointermove", x, y, init));
        settle();
    };
    const release = (x: number, y = 10, init: PointerEventInit = {}): void => {
        window.dispatchEvent(pointer("pointerup", x, y, init));
        settle();
    };

    beforeEach(() => {
        Object.assign(document, { elementFromPoint: elementAt });
        TestBed.configureTestingModule({ imports: [HostComponent] });
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        // Ends a drag a test left going, so the next one starts clean.
        key("keydown", "Escape");
        delete (document as Partial<Document>).elementFromPoint;
    });

    it("starts once the pointer moves 4 pixels with the button held, with what the source gives", () => {
        press("source");
        move(13, 13);

        expect(preview()).toBeNull();
        expect(host.starts).toEqual([]);

        move(14, 10);

        expect(preview()).not.toBeNull();
        expect(host.starts.map(start => start.data)).toEqual([["a.txt", "b.txt"]]);
        expect(preview()?.getAttribute("aria-hidden")).toBe("true");
    });

    it("drops on the target under the pointer, with what the drop does", () => {
        press("source");
        move(50);
        move(150);

        expect(host.enters).toEqual([expect.objectContaining({ effect: "move", target: "Inner" })]);
        expect(element("inner").hasAttribute("data-drop-target")).toBe(true);

        release(150);

        expect(host.drops).toEqual([
            {
                drag: { altKey: false, ctrlKey: false, data: ["a.txt", "b.txt"], metaKey: false, shiftKey: false },
                effect: "move",
                target: "Inner"
            }
        ]);
        expect(host.leaves).toEqual([]);
        expect(host.ends).toEqual([{ data: ["a.txt", "b.txt"], effect: "move" }]);
        expect(element("inner").hasAttribute("data-drop-target")).toBe(false);
        expect(preview()).toBeNull();
    });

    it("asks the target again as keys are pressed, and drops with the keys held then", () => {
        press("source");
        move(150);

        key("keydown", "Control", { ctrlKey: true });
        settle();

        expect(host.drags.at(-1)?.ctrlKey).toBe(true);
        expect(document.documentElement.classList).toContain("**:cursor-copy!");

        release(150, 10, { ctrlKey: true });

        expect(host.drops.map(drop => drop.effect)).toEqual(["copy"]);
        expect(host.ends.map(end => end.effect)).toEqual(["copy"]);
    });

    it("tells a target the drag left it, and the one it went to", () => {
        press("source");
        move(150);
        move(250);

        expect(host.leaves).toEqual([expect.objectContaining({ effect: "move", target: "Inner" })]);
        expect(host.enters.map(enter => enter.target)).toEqual(["Inner", "Outer"]);

        release(250);

        expect(host.drops).toEqual([expect.objectContaining({ effect: "copy", target: "Outer" })]);
    });

    it("goes to the target around one that is disabled", () => {
        host.innerDisabled.set(true);
        settle();
        press("source");
        move(150);

        expect(element("inner").hasAttribute("data-drop-target")).toBe(false);
        expect(element("outer").hasAttribute("data-drop-target")).toBe(true);

        release(150);

        expect(host.drops.map(drop => drop.target)).toEqual(["Outer"]);
    });

    it("refuses a drop where the target says none", () => {
        host.verdict.set("none");
        press("source");
        move(150);

        expect(host.enters).toEqual([expect.objectContaining({ effect: "none", target: "Inner" })]);
        expect(element("inner").hasAttribute("data-drop-target")).toBe(false);
        expect(document.documentElement.classList).toContain("**:cursor-no-drop!");

        release(150);

        expect(host.drops).toEqual([]);
        expect(host.leaves.map(leave => leave.target)).toEqual(["Inner"]);
        expect(host.ends.map(end => end.effect)).toEqual(["none"]);
    });

    it("follows a target whose answer changes while the drag is over it", () => {
        host.verdict.set("none");
        press("source");
        move(150);

        host.verdict.set("link");
        settle();

        expect(element("inner").hasAttribute("data-drop-target")).toBe(true);
        expect(document.documentElement.classList).toContain("**:cursor-alias!");
    });

    it("ends without a drop away from every target", () => {
        press("source");
        move(350);

        expect(host.enters).toEqual([]);

        release(350);

        expect(host.drops).toEqual([]);
        expect(host.ends.map(end => end.effect)).toEqual(["none"]);
        expect(document.documentElement.className).not.toContain("cursor");
    });

    it("cancels with Escape, which doesn't reach the page, and the button's release clicks nothing", () => {
        const seen: string[] = [];
        const listener = (event: KeyboardEvent): void => {
            seen.push(event.key);
        };
        document.addEventListener("keydown", listener);
        press("source");
        move(150);

        const escape = key("keydown", "Escape");
        settle();

        expect(escape.defaultPrevented).toBe(true);
        expect(seen).toEqual([]);
        expect(preview()).toBeNull();
        expect(host.leaves.map(leave => leave.target)).toEqual(["Inner"]);
        expect(host.ends.map(end => end.effect)).toEqual(["none"]);

        release(150);
        element("source").click();

        expect(host.drops).toEqual([]);
        expect(host.clicks).toBe(0);
        document.removeEventListener("keydown", listener);
    });

    it("drops the click that follows a drop, but not a later one", async () => {
        press("source");
        move(150);
        release(150);
        element("source").click();

        expect(host.clicks).toBe(0);

        await new Promise(resolve => setTimeout(resolve));
        element("source").click();

        expect(host.clicks).toBe(1);
    });

    it("ends without a drop when the button was let go where the page couldn't see it", () => {
        press("source");
        move(150);
        move(160, 10, { buttons: 0 });

        expect(preview()).toBeNull();
        expect(host.drops).toEqual([]);
        expect(host.ends.map(end => end.effect)).toEqual(["none"]);
    });

    it("drags nothing when the drag start is prevented, or the source is disabled", () => {
        host.refuse = true;
        press("source");
        move(150);

        expect(host.starts).toHaveLength(1);
        expect(preview()).toBeNull();

        release(150);
        host.refuse = false;
        host.disabled.set(true);
        settle();
        press("source");
        move(150);

        expect(host.starts).toHaveLength(1);
        expect(preview()).toBeNull();
    });

    it("doesn't start from a touch, another button, or a text field", () => {
        press("source", { pointerType: "touch" });
        move(150);
        release(150);
        press("source", { button: 2, buttons: 2 });
        move(150, 10, { buttons: 2 });
        release(150);
        press("field");
        move(150);

        expect(host.starts).toEqual([]);
        expect(preview()).toBeNull();
    });

    it("shows what a drop would do and how many items, without a template", () => {
        press("source");
        move(150);

        expect(preview()?.querySelector("[lucideArrowRight]")).not.toBeNull();
        expect(preview()?.textContent?.trim()).toBe("2");

        host.verdict.set("none");
        settle();

        expect(preview()?.querySelector("[lucideBan]")).not.toBeNull();
    });

    it("shows the template with what is dragged, the effect and the target", () => {
        host.usePreview.set(true);
        settle();
        press("source");
        move(350);

        expect(preview()?.querySelector("#custom-preview")?.textContent?.trim()).toBe("none 2 to");

        move(150);

        expect(preview()?.querySelector("#custom-preview")?.textContent?.trim()).toBe("move 2 to Inner");
    });

    it("follows the pointer", () => {
        press("source");
        move(150, 40);

        expect(preview()?.style.transform).toBe("translate(162px, 56px)");
    });

    it("scrolls what it comes near the edge of", async () => {
        const scroller = element("scroller");
        Object.defineProperties(scroller, {
            clientHeight: { configurable: true, value: 100 },
            scrollHeight: { configurable: true, value: 1000 }
        });
        scroller.getBoundingClientRect = (): DOMRect => new DOMRect(0, 500, 400, 100);
        press("source");
        move(150, 500 + 100 - DRAG_SCROLL_EDGE / 2);

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        expect(scroller.scrollTop).toBeGreaterThan(0);

        move(150, 550);
        const top = scroller.scrollTop;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        expect(scroller.scrollTop).toBe(top);
    });

    it("has no accessibility violations with a drag over a target", async () => {
        press("source");
        move(150);

        const results = await axe.run(document.body);

        expect(results.violations).toEqual([]);
    });
});
