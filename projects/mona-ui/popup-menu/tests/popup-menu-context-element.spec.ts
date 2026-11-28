import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { PopupMenuComponent } from "../components/popup-menu/popup-menu.component";
import { PopupMenuItemComponent } from "../components/popup-menu-item/popup-menu-item.component";
import type { PopupMenuTrigger } from "../models/PopupMenuTrigger";

/** A toolbar with one menu for its tool buttons, and a label that isn't one. */
@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <div #toolbar class="toolbar" tabindex="-1">
            <span class="caption" tabindex="0">Tools</span>
            <button type="button" class="tool cut"><span class="label">Cut</span></button>
            <button type="button" class="tool copy"><span class="label">Copy</span></button>
        </div>
        <div #frame class="frame"></div>
        <mona-popup-menu
            [anchor]="anchored() ? frame : undefined"
            [filter]="filter()"
            [openAtPointer]="true"
            [target]="toolbar"
            [trigger]="trigger()">
            <mona-popup-menu-item label="Customize"></mona-popup-menu-item>
        </mona-popup-menu>
    `
})
class ToolbarHostComponent {
    public readonly anchored = signal(false);
    public readonly filter = signal("");
    public readonly menu = viewChild.required(PopupMenuComponent);
    public readonly trigger = signal<PopupMenuTrigger>("contextmenu");
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * For the rest of the test, reads `MouseEvent.button` as Chromium does: the -1 a script makes an event with reads back
 * as 0. jsdom keeps it.
 */
function readButtonAsChromium(): void {
    const button = Object.getOwnPropertyDescriptor(MouseEvent.prototype, "button")!.get!;
    const spy = vi.spyOn(MouseEvent.prototype, "button", "get").mockImplementation(function (this: MouseEvent) {
        return Math.max(0, button.call(this) as number);
    });
    onTestFinished(() => spy.mockRestore());
}

describe("popup menu contextElement", () => {
    let fixture: ComponentFixture<ToolbarHostComponent>;
    let host: ToolbarHostComponent;
    let root: HTMLElement;
    let toolbar: HTMLElement;
    let cut: HTMLButtonElement;
    let copy: HTMLButtonElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    function dispatch(element: Element, type: string, button: number): MouseEvent {
        const event = new MouseEvent(type, { bubbles: true, button, cancelable: true, clientX: 10, clientY: 10 });
        element.dispatchEvent(event);
        return event;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(ToolbarHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
        toolbar = root.querySelector(".toolbar")!;
        cut = root.querySelector(".cut")!;
        copy = root.querySelector(".copy")!;
    });

    afterEach(() => {
        root.remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    describe("in Chromium, which reads the button of the keys' event back as 0", () => {
        it("is the focused element in the target when openMenu opens it for the keys", async () => {
            readButtonAsChromium();
            copy.focus();
            host.menu().openMenu(true);
            await settle();

            expect(host.menu().contextElement()).toBe(copy);
        });

        it("is the focused element in the target when openMenuViaKeyboard opens it for the keys", async () => {
            readButtonAsChromium();
            cut.focus();
            host.menu().openMenuViaKeyboard(true);
            await settle();

            expect(host.menu().contextElement()).toBe(cut);
        });

        it("opens at the anchor's center from the keys, with an anchor", async () => {
            readButtonAsChromium();
            host.anchored.set(true);
            await settle();
            const frame = root.querySelector(".frame")!;
            vi.spyOn(frame, "getBoundingClientRect").mockReturnValue(new DOMRect(100, 200, 60, 40));
            const create = vi.spyOn(TestBed.inject(PopupService), "create");
            onTestFinished(() => create.mockRestore());
            copy.focus();
            host.menu().openMenu(true);
            await settle();

            expect(create.mock.calls.map(([settings]) => settings.anchor)).toEqual([{ x: 130, y: 220 }]);
        });
    });

    describe("with a filter", () => {
        beforeEach(async () => {
            host.filter.set(".tool");
            await settle();
        });

        it("is the closest match around the element under the pointer", async () => {
            const event = dispatch(copy.querySelector(".label")!, "contextmenu", 2);
            await settle();

            expect(event.defaultPrevented).toBe(true);
            expect(host.menu().contextElement()).toBe(copy);
        });

        it("opens nothing on an element that doesn't match, nor on the target's own space", async () => {
            for (const element of [root.querySelector(".caption")!, toolbar]) {
                const event = dispatch(element, "contextmenu", 2);
                await settle();

                expect(event.defaultPrevented).toBe(false);
                expect(menus()).toEqual([]);
            }
            expect(host.menu().contextElement()).toBeNull();
        });

        it("opens for the keys only around a focused element that matches", async () => {
            readButtonAsChromium();
            const dispatched: Event[] = [];
            toolbar.addEventListener("contextmenu", event => dispatched.push(event));
            root.querySelector<HTMLElement>(".caption")!.focus();
            host.menu().openMenu(true);
            await settle();
            expect(dispatched).toEqual([]);
            expect(menus()).toEqual([]);

            cut.focus();
            host.menu().openMenu(true);
            await settle();
            expect(dispatched).toHaveLength(1);
            expect(host.menu().contextElement()).toBe(cut);
        });

        it("doesn't open from openMenu() without the keys, as the target isn't one of its elements", async () => {
            host.trigger.set("none");
            await settle();
            cut.focus();
            host.menu().openMenu();
            await settle();

            expect(menus()).toEqual([]);
        });

        it("opens on a click on a match, with the click trigger", async () => {
            host.trigger.set("click");
            await settle();
            const elsewhere = dispatch(root.querySelector(".caption")!, "click", 0);
            await settle();
            expect(elsewhere.defaultPrevented).toBe(false);
            expect(menus()).toEqual([]);

            const onTool = dispatch(cut.querySelector(".label")!, "click", 0);
            await settle();
            expect(onTool.defaultPrevented).toBe(true);
            expect(menus()).toHaveLength(1);
            expect(host.menu().contextElement()).toBe(cut);
        });
    });
});
