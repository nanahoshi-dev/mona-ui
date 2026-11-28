import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { PopupMenuComponent } from "../components/popup-menu/popup-menu.component";
import { PopupMenuItemComponent } from "../components/popup-menu-item/popup-menu-item.component";

/** A toolbar with one menu for its tool buttons. */
@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <div #toolbar class="toolbar" tabindex="-1">
            <button type="button" class="tool cut"><span class="label">Cut</span></button>
            <button type="button" class="tool copy"><span class="label">Copy</span></button>
        </div>
        <div #frame class="frame"></div>
        <mona-popup-menu
            trigger="contextmenu"
            [anchor]="anchored() ? frame : undefined"
            [openAtPointer]="true"
            [target]="toolbar">
            <mona-popup-menu-item label="Customize"></mona-popup-menu-item>
        </mona-popup-menu>
    `
})
class ToolbarHostComponent {
    public readonly anchored = signal(false);
    public readonly menu = viewChild.required(PopupMenuComponent);
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
    let cut: HTMLButtonElement;
    let copy: HTMLButtonElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(ToolbarHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
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
});
