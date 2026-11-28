import { Component, computed, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/popup-menu";
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { ContextMenuComponent } from "../components/contextmenu/context-menu.component";
import { ContextMenuItemComponent } from "../components/contextmenu-item/context-menu-item.component";

/**
 * One menu for a sidebar's rows, which opens on the rows only: not on a group's heading, nor on the space below the
 * rows. A menu on the pane around the sidebar takes what the rows' menu leaves.
 */
@Component({
    imports: [ContextMenuComponent, ContextMenuItemComponent],
    template: `
        <div #pane class="pane">
            <div #sidebar class="sidebar" tabindex="-1">
                <div class="heading" tabindex="0">Favorites</div>
                @for (name of rows(); track name) {
                    <div class="row" tabindex="0" [attr.data-name]="name">
                        <svg aria-hidden="true" viewBox="0 0 1 1"><path d="M0 0h1v1z"></path></svg>
                        <span class="label">{{ name }}</span>
                    </div>
                }
                <div class="files" role="listbox" tabindex="0" aria-label="Files" aria-activedescendant="file-b">
                    <div id="file-a" class="row" role="option" aria-selected="false" data-name="a.txt">a.txt</div>
                    <div id="file-b" class="row" role="option" aria-selected="false" data-name="b.txt">b.txt</div>
                </div>
                <div class="space">Space below the rows</div>
            </div>
        </div>
        <mona-contextmenu
            #menu
            [target]="sidebar"
            [filter]="filter()"
            [aria-label]="label()"
            (menuClick)="clicks.push($event)"
            (menuSelect)="selections.push($event)">
            <mona-contextmenu-item label="Open" value="open"></mona-contextmenu-item>
        </mona-contextmenu>
        @if (paneMenuShown()) {
            <mona-contextmenu #paneMenu [target]="pane" aria-label="Pane">
                <mona-contextmenu-item label="Refresh" value="refresh"></mona-contextmenu-item>
            </mona-contextmenu>
        }
    `
})
class SidebarHostComponent {
    public readonly clicks: PopupMenuItemClickEvent[] = [];
    public readonly filter = signal(".row");
    public readonly label = computed(() => `Row ${this.menu().contextElement()?.getAttribute("data-name") ?? ""}`);
    public readonly menu = viewChild.required<ContextMenuComponent>("menu");
    public readonly paneMenu = viewChild<ContextMenuComponent>("paneMenu");
    public readonly paneMenuShown = signal(true);
    public readonly rows = signal(["Desktop", "Downloads"]);
    public readonly selections: PopupMenuItemClickEvent[] = [];
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** For the rest of the test, reads `MouseEvent.button` as Chromium does: the -1 of the keys' event reads back as 0. */
function readButtonAsChromium(): void {
    const button = Object.getOwnPropertyDescriptor(MouseEvent.prototype, "button")!.get!;
    const spy = vi.spyOn(MouseEvent.prototype, "button", "get").mockImplementation(function (this: MouseEvent) {
        return Math.max(0, button.call(this) as number);
    });
    onTestFinished(() => spy.mockRestore());
}

describe("context menu filter", () => {
    let fixture: ComponentFixture<SidebarHostComponent>;
    let host: SidebarHostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    /** Right-clicks an element, as the browser does: the closest focusable element takes the focus on the way. */
    async function rightClick(element: Element): Promise<MouseEvent> {
        element.closest<HTMLElement>("[tabindex]")?.focus();
        const event = new MouseEvent("contextmenu", {
            bubbles: true,
            button: 2,
            cancelable: true,
            clientX: 10,
            clientY: 10
        });
        element.dispatchEvent(event);
        await settle();
        return event;
    }

    function row(name: string): HTMLElement {
        return root.querySelector<HTMLElement>(`.row[data-name='${name}']`)!;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(SidebarHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        await settle();
    });

    afterEach(() => {
        root.remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("opens on the element that matches around the one under the pointer, which is the contextElement", async () => {
        const event = await rightClick(row("Downloads").querySelector(".label")!);

        expect(event.defaultPrevented).toBe(true);
        expect(host.menu().contextElement()).toBe(row("Downloads"));
        expect(menus().map(menu => menu.getAttribute("aria-label"))).toEqual(["Row Downloads"]);
    });

    it("opens on a match around an SVG graphic under the pointer", async () => {
        await rightClick(row("Desktop").querySelector("path")!);

        expect(host.menu().contextElement()).toBe(row("Desktop"));
    });

    it("opens nothing elsewhere in the target, and leaves the event alone", async () => {
        host.paneMenuShown.set(false);
        await settle();
        for (const element of [
            root.querySelector(".heading")!,
            root.querySelector(".space")!,
            root.querySelector(".sidebar")!
        ]) {
            const event = await rightClick(element);

            expect(event.defaultPrevented).toBe(false);
            expect(menus()).toEqual([]);
        }
        expect(host.menu().contextElement()).toBeNull();
    });

    it("lets a menu on an element around the target open where it opens nothing", async () => {
        const heading = root.querySelector(".heading")!;
        const event = await rightClick(heading);

        expect(event.defaultPrevented).toBe(true);
        expect(menus().map(menu => menu.getAttribute("aria-label"))).toEqual(["Pane"]);
        expect(host.paneMenu()!.contextElement()).toBe(heading);
        expect(host.menu().contextElement()).toBeNull();
    });

    it("opens on a match around the focused element from the keys", async () => {
        readButtonAsChromium();
        const downloads = row("Downloads");
        downloads.focus();
        const event = keydown(downloads, "F10", { shiftKey: true });
        await settle();

        expect(event.defaultPrevented).toBe(true);
        expect(host.menu().contextElement()).toBe(downloads);
        expect(menus().map(menu => menu.getAttribute("aria-label"))).toEqual(["Row Downloads"]);
    });

    it("opens on a match the focused element's aria-activedescendant names, from the keys", async () => {
        readButtonAsChromium();
        const files = root.querySelector<HTMLElement>(".files")!;
        files.focus();
        keydown(files, "ContextMenu");
        await settle();

        expect(host.menu().contextElement()?.id).toBe("file-b");
    });

    it("opens nothing from the keys on an element that doesn't match, and leaves the keys to the pane's menu", async () => {
        readButtonAsChromium();
        const heading = root.querySelector<HTMLElement>(".heading")!;
        const dispatched: Event[] = [];
        root.querySelector(".sidebar")!.addEventListener("contextmenu", event => dispatched.push(event));
        heading.focus();
        const event = keydown(heading, "ContextMenu");
        await settle();

        expect(host.menu().contextElement()).toBeNull();
        expect(dispatched).toEqual([]);
        // The pane's menu takes the keys, on the heading.
        expect(event.defaultPrevented).toBe(true);
        expect(menus().map(menu => menu.getAttribute("aria-label"))).toEqual(["Pane"]);
        expect(host.paneMenu()!.contextElement()).toBe(heading);
    });

    it("leaves the keys alone when no menu opens", async () => {
        host.paneMenuShown.set(false);
        await settle();
        const heading = root.querySelector<HTMLElement>(".heading")!;
        heading.focus();
        const event = keydown(heading, "F10", { shiftKey: true });
        await settle();

        expect(event.defaultPrevented).toBe(false);
        expect(menus()).toEqual([]);
    });

    it("matches elements added later", async () => {
        host.rows.update(rows => [...rows, "Music"]);
        await settle();
        await rightClick(row("Music").querySelector(".label")!);

        expect(host.menu().contextElement()).toBe(row("Music"));
    });

    it("carries the matching element with menuClick and menuSelect", async () => {
        await rightClick(row("Desktop").querySelector(".label")!);
        menus()[0].querySelector<HTMLElement>("[role='menuitem']")!.click();
        expect(host.clicks.map(event => event.contextElement)).toEqual([row("Desktop")]);

        await settle();
        await wait(200);
        await settle();
        expect(host.selections.map(event => event.contextElement)).toEqual([row("Desktop")]);
    });

    it("opens anywhere in the target without a filter, as before", async () => {
        host.filter.set("");
        await settle();
        const label = row("Desktop").querySelector(".label")!;
        await rightClick(label);
        expect(host.menu().contextElement()).toBe(label);

        const heading = root.querySelector(".heading")!;
        await rightClick(heading);
        expect(host.menu().contextElement()).toBe(heading);
        expect(menus().map(menu => menu.getAttribute("aria-label"))).toEqual(["Row "]);
    });
});
