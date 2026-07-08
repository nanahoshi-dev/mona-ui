import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";
import { DOCUMENT } from "@angular/core";

import { ContextMenuComponent } from "./context-menu.component";
import { ContextMenuItemComponent } from "../contextmenu-item/context-menu-item.component";

describe("ContextMenuComponent", () => {
    let component: ContextMenuComponent;
    let fixture: ComponentFixture<ContextMenuComponent>;
    let document: Document;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContextMenuComponent],
            providers: [provideAnimations()]
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

    it("should set aria-haspopup and aria-controls on the target element after render", async () => {
        await fixture.whenStable();

        const target = document.documentElement;
        expect(target.getAttribute("aria-haspopup")).toBe("menu");
        expect(target.getAttribute("aria-controls")).toBeTruthy();
        expect(target.getAttribute("aria-expanded")).toBe("false");
    });
});

@Component({
    selector: "mona-test-contextmenu-host",
    imports: [ContextMenuComponent, ContextMenuItemComponent],
    template: `
        <button #target type="button">Target</button>
        <mona-contextmenu [target]="target" (menuClick)="onMenuClick($event)">
            <mona-contextmenu-item label="Copy" (menuClick)="onItemClick($event)"></mona-contextmenu-item>
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
            providers: [provideAnimations()]
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
});
