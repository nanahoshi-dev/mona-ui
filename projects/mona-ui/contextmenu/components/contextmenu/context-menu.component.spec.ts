import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DOCUMENT } from "@angular/core";

import { ContextMenuComponent } from "./context-menu.component";
import { ContextMenuItemComponent } from "../contextmenu-item/context-menu-item.component";
import { ContextMenuShortcutTemplateDirective } from "../../directives/context-menu-shortcut-template.directive";

describe("ContextMenuComponent", () => {
    let component: ContextMenuComponent;
    let fixture: ComponentFixture<ContextMenuComponent>;
    let document: Document;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuComponent],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuComponent);
        component = fixture.componentInstance;
        document = TestBed.inject(DOCUMENT);
        fixture.componentRef.setInput("target", document.documentElement);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("leaves the popup attributes off a target whose role doesn't allow them", async () => {
        await fixture.whenStable();

        const target = document.documentElement;
        expect(target.hasAttribute("aria-haspopup")).toBe(false);
        expect(target.hasAttribute("aria-controls")).toBe(false);
        expect(target.hasAttribute("aria-expanded")).toBe(false);
    });
});

@Component({
    selector: "mona-test-contextmenu-host",
    imports: [ContextMenuComponent, ContextMenuItemComponent, ContextMenuShortcutTemplateDirective],
    template: `
        <button #target type="button">Target</button>
        <mona-contextmenu [target]="target" (menuClick)="onMenuClick($event)">
            <mona-contextmenu-item label="Copy" (menuClick)="onItemClick($event)">
                <ng-template monaContextMenuShortcutTemplate><span>Ctrl+C</span></ng-template>
            </mona-contextmenu-item>
        </mona-contextmenu>
    `
})
class ContextMenuHostComponent {
    public readonly contextMenu = viewChild.required(ContextMenuComponent);
    public lastItemClickEvent: unknown = null;
    public lastMenuClickEvent: unknown = null;

    protected onItemClick(event: unknown): void {
        this.lastItemClickEvent = event;
    }

    protected onMenuClick(event: unknown): void {
        this.lastMenuClickEvent = event;
    }
}

describe("ContextMenuComponent keyboard trigger and menu click", () => {
    let fixture: ComponentFixture<ContextMenuHostComponent>;
    let host: ContextMenuHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuHostComponent],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(ContextMenuHostComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(el => el.remove());
    });

    it("opens the menu via the ContextMenu keyboard key and sets aria-expanded on the target", async () => {
        const targetButton: HTMLButtonElement = fixture.nativeElement.querySelector("button");

        targetButton.dispatchEvent(new KeyboardEvent("keydown", { key: "ContextMenu", bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(targetButton.getAttribute("aria-expanded")).toBe("true");
        expect(document.querySelector('[role="menu"]')).not.toBeNull();
    });

    it("emits menuClick when a projected menu item is activated", async () => {
        const targetButton: HTMLButtonElement = fixture.nativeElement.querySelector("button");

        targetButton.dispatchEvent(new KeyboardEvent("keydown", { key: "ContextMenu", bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const menuItem = document.querySelector('[role="menuitem"]') as HTMLElement;
        expect(menuItem).not.toBeNull();
        menuItem.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        expect(host.lastMenuClickEvent).not.toBeNull();
        expect(host.lastItemClickEvent).not.toBeNull();
    });

    it("names an item with a shortcut by what it shows, its label and then the shortcut", async () => {
        const targetButton: HTMLButtonElement = fixture.nativeElement.querySelector("button");

        targetButton.dispatchEvent(new KeyboardEvent("keydown", { key: "ContextMenu", bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const menuItem = document.querySelector('[role="menuitem"]') as HTMLElement;
        expect(menuItem.hasAttribute("aria-label")).toBe(false);
        expect(menuItem.textContent?.replace(/\s+/g, " ").trim()).toBe("Copy Ctrl+C");
    });
});

@Component({
    selector: "mona-test-contextmenu-list-host",
    imports: [ContextMenuComponent, ContextMenuItemComponent],
    template: `
        <div #target class="list-host">
            <div role="listbox" tabindex="0" aria-label="Files" [attr.aria-activedescendant]="activeId">
                <div role="option" id="file-1" aria-selected="false">One</div>
                <div role="option" id="file-2" aria-selected="true">Two</div>
            </div>
            <button type="button" class="outside">Outside the list</button>
        </div>
        <mona-contextmenu [target]="target">
            <mona-contextmenu-item label="Open"></mona-contextmenu-item>
        </mona-contextmenu>
    `
})
class ContextMenuListHostComponent {
    public activeId: string | null = "file-2";
}

describe("ContextMenuComponent opened from the keyboard", () => {
    let fixture: ComponentFixture<ContextMenuListHostComponent>;
    let root: HTMLElement;

    function rect(left: number, top: number, width: number, height: number): DOMRect {
        return new DOMRect(left, top, width, height);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [ContextMenuListHostComponent] }).compileComponents();
        fixture = TestBed.createComponent(ContextMenuListHostComponent);
        root = fixture.nativeElement as HTMLElement;
        document.body.appendChild(root);
        fixture.detectChanges();
        await fixture.whenStable();
        // jsdom has no layout: the target, the list, its second item and the button have boxes of their own.
        const boxes = new Map<Element, DOMRect>([
            [root.querySelector(".list-host")!, rect(0, 0, 400, 300)],
            [root.querySelector("[role='listbox']")!, rect(0, 0, 400, 200)],
            [root.querySelector("#file-2")!, rect(100, 120, 80, 40)],
            [root.querySelector(".outside")!, rect(0, 260, 100, 40)]
        ]);
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function (this: Element) {
            return boxes.get(this) ?? rect(0, 0, 0, 0);
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        root.remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(el => el.remove());
    });

    /** Presses a key on an element and returns where the menu opens, from the event it dispatches on the target. */
    async function openFrom(element: HTMLElement, init: KeyboardEventInit): Promise<{ x: number; y: number }> {
        const opened: MouseEvent[] = [];
        root.querySelector(".list-host")!.addEventListener("contextmenu", event => opened.push(event as MouseEvent));
        element.focus();
        element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(document.querySelector('[role="menu"]')).not.toBeNull();
        expect(opened).toHaveLength(1);
        return { x: opened[0].clientX, y: opened[0].clientY };
    }

    it("opens at the focused list's active item, not at the target's center", async () => {
        const at = await openFrom(root.querySelector<HTMLElement>("[role='listbox']")!, { key: "ContextMenu" });

        // The middle of the active item: 100 + 80 / 2 across, 120 + 40 / 2 down.
        expect(at).toEqual({ x: 140, y: 140 });
    });

    it("opens at the focused element with Shift+F10 when it names no active item", async () => {
        const at = await openFrom(root.querySelector<HTMLElement>(".outside")!, { key: "F10", shiftKey: true });

        expect(at).toEqual({ x: 50, y: 280 });
    });

    it("opens at the target's center when the focus is outside it", async () => {
        const outsider = document.createElement("button");
        document.body.appendChild(outsider);
        outsider.focus();
        const opened: MouseEvent[] = [];
        const target = root.querySelector<HTMLElement>(".list-host")!;
        target.addEventListener("contextmenu", event => opened.push(event as MouseEvent));

        target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ContextMenu" }));
        fixture.detectChanges();
        await fixture.whenStable();
        outsider.remove();

        expect(opened.map(event => ({ x: event.clientX, y: event.clientY }))).toEqual([{ x: 200, y: 150 }]);
    });
});
