import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ContextMenuItemComponent } from "../../contextmenu/components/contextmenu-item/context-menu-item.component";
import { DropdownButtonComponent } from "../components/dropdown-button/dropdown-button.component";
import { DropdownButtonItemComponent } from "../components/dropdown-button-item/dropdown-button-item.component";
import { DropdownButtonSeparatorComponent } from "../components/dropdown-button-separator/dropdown-button-separator.component";
import { DropdownButtonMenuItemIconTemplateDirective } from "../directives/dropdown-button-menu-item-icon-template.directive";
import { DropdownButtonMenuItemShortcutTemplateDirective } from "../directives/dropdown-button-menu-item-shortcut-template.directive";
import { DropdownButtonTextTemplateDirective } from "../directives/dropdown-button-text-template.directive";

@Component({
    imports: [DropdownButtonComponent, DropdownButtonItemComponent, DropdownButtonTextTemplateDirective],
    template: `
        <mona-dropdown-button
            [aria-label]="ariaLabel()"
            [disabled]="disabled()"
            [iconOnly]="iconOnly()"
            [loading]="loading()"
            [showArrow]="showArrow()"
            [text]="text()">
            @if (useTemplate()) {
                <ng-template monaDropdownButtonTextTemplate>Export</ng-template>
            }
            <mona-dropdown-button-item label="First"></mona-dropdown-button-item>
            <mona-dropdown-button-item label="Middle"></mona-dropdown-button-item>
            <mona-dropdown-button-item label="Last"></mona-dropdown-button-item>
        </mona-dropdown-button>
    `
})
class DropdownHostComponent {
    public readonly ariaLabel = signal("");
    public readonly disabled = signal(false);
    public readonly iconOnly = signal(false);
    public readonly loading = signal(false);
    public readonly showArrow = signal(true);
    public readonly text = signal("Actions");
    public readonly useTemplate = signal(false);
}

@Component({
    imports: [DropdownButtonComponent, ContextMenuItemComponent],
    template: `
        <mona-dropdown-button text="Actions">
            <mona-contextmenu-item label="Foreign"></mona-contextmenu-item>
        </mona-dropdown-button>
    `
})
class ForeignItemHostComponent {}

// A file manager's New and See more buttons: items with icon and shortcut templates, a separator, repeated items, and
// an icon-only button.
@Component({
    imports: [
        DropdownButtonComponent,
        DropdownButtonItemComponent,
        DropdownButtonMenuItemIconTemplateDirective,
        DropdownButtonMenuItemShortcutTemplateDirective,
        DropdownButtonSeparatorComponent,
        DropdownButtonTextTemplateDirective
    ],
    template: `
        <mona-dropdown-button text="New">
            <mona-dropdown-button-item label="Folder">
                <ng-template monaDropdownButtonMenuItemIconTemplate><span class="icon">F</span></ng-template>
                <ng-template monaDropdownButtonMenuItemShortcutTemplate><kbd>Ctrl+Shift+N</kbd></ng-template>
            </mona-dropdown-button-item>
            <mona-dropdown-button-separator />
            @for (kind of kinds(); track kind) {
                <mona-dropdown-button-item [label]="kind">
                    <ng-template monaDropdownButtonMenuItemIconTemplate><span class="icon">D</span></ng-template>
                </mona-dropdown-button-item>
            }
        </mona-dropdown-button>
        <mona-dropdown-button aria-label="See more" [iconOnly]="true">
            <ng-template monaDropdownButtonTextTemplate>...</ng-template>
            <mona-dropdown-button-item label="Select all">
                <ng-template monaDropdownButtonMenuItemShortcutTemplate><kbd>Ctrl+A</kbd></ng-template>
            </mona-dropdown-button-item>
            <mona-dropdown-button-item label="Select none" />
            <mona-dropdown-button-item label="Invert selection" />
        </mona-dropdown-button>
    `
})
class TemplatedHostComponent {
    public readonly kinds = signal(["Text document", "Image", "Shortcut"]);
}

function keydown(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
    target.dispatchEvent(event);
    return event;
}

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function activeLabel(menu: HTMLElement): string | null {
    const id = menu.getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
}

describe("dropdown button menu", () => {
    let fixture: ComponentFixture<DropdownHostComponent>;
    let host: DropdownHostComponent;
    let button: HTMLButtonElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(DropdownHostComponent);
        host = fixture.componentInstance;
        document.body.appendChild(fixture.nativeElement);
        await settle();
        button = (fixture.nativeElement as HTMLElement).querySelector("button")!;
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("tells assistive technology it opens a menu, and which one while it's open", async () => {
        expect(button.getAttribute("aria-haspopup")).toBe("menu");
        expect(button.getAttribute("aria-expanded")).toBe("false");
        expect(button.hasAttribute("aria-controls")).toBe(false);

        button.focus();
        keydown(button, "ArrowDown");
        await settle();

        expect(button.getAttribute("aria-expanded")).toBe("true");
        expect(button.getAttribute("aria-controls")).toBe(menus()[0].id);
    });

    it("names its menu with the button", async () => {
        button.click();
        await settle();

        expect(button.id).not.toBe("");
        expect(menus()[0].getAttribute("aria-labelledby")).toBe(button.id);
    });

    it("is named by its content unless aria-label is given", async () => {
        expect(button.hasAttribute("aria-label")).toBe(false);
        expect(button.textContent?.trim()).toBe("Actions");

        host.text.set("");
        host.useTemplate.set(true);
        await settle();
        expect(button.hasAttribute("aria-label")).toBe(false);
        expect(button.textContent?.trim()).toBe("Export");

        host.ariaLabel.set("More actions");
        await settle();
        expect(button.getAttribute("aria-label")).toBe("More actions");
        expect(
            (fixture.nativeElement as HTMLElement).querySelector("mona-dropdown-button")!.hasAttribute("aria-label")
        ).toBe(false);
    });

    it("highlights the first item on ArrowDown and the last on ArrowUp", async () => {
        button.focus();
        keydown(button, "ArrowDown");
        await settle();
        expect(activeLabel(menus()[0])).toBe("First");

        keydown(menus()[0], "Escape");
        await settle();
        await wait(200);
        expect(document.activeElement).toBe(button);

        keydown(button, "ArrowUp");
        await settle();
        expect(activeLabel(menus()[0])).toBe("Last");
    });

    it("closes its menu when it becomes disabled or starts loading", async () => {
        button.focus();
        keydown(button, "Enter");
        await settle();
        expect(menus().length).toBe(1);

        host.disabled.set(true);
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);

        host.disabled.set(false);
        await settle();
        button.focus();
        keydown(button, "Enter");
        await settle();
        expect(menus().length).toBe(1);

        host.loading.set(true);
        await settle();
        await wait(200);
        expect(menus().length).toBe(0);
    });

    it("ignores the keyboard while disabled or loading", async () => {
        host.loading.set(true);
        await settle();
        keydown(button, "Enter");
        await settle();
        expect(menus().length).toBe(0);

        host.loading.set(false);
        host.disabled.set(true);
        await settle();
        keydown(button, "ArrowDown");
        await settle();
        expect(menus().length).toBe(0);
    });

    it("shows an arrow unless it is icon-only or showArrow is false", async () => {
        expect(button.querySelector("svg.lucide")).not.toBeNull();
        expect(button.querySelector("svg.lucide")!.getAttribute("aria-hidden")).toBe("true");

        host.showArrow.set(false);
        await settle();
        expect(button.querySelector("svg.lucide")).toBeNull();

        host.showArrow.set(true);
        host.iconOnly.set(true);
        await settle();
        expect(button.querySelector("svg.lucide")).toBeNull();
    });

    it("rejects items from another menu family", () => {
        const foreign = TestBed.createComponent(ForeignItemHostComponent);
        expect(() => foreign.detectChanges()).toThrow(/mona-dropdown-button-item/);
    });
});

describe("dropdown button menu from the keys", () => {
    let fixture: ComponentFixture<TemplatedHostComponent>;
    let newButton: HTMLButtonElement;
    let moreButton: HTMLButtonElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        await wait(5);
        fixture.detectChanges();
    }

    function menuItems(): HTMLElement[] {
        return Array.from(menus()[0].querySelectorAll<HTMLElement>("[role^='menuitem']"));
    }

    function activeIndex(): number {
        const id = menus()[0].getAttribute("aria-activedescendant");
        return menuItems().findIndex(item => item.id === id);
    }

    async function open(button: HTMLButtonElement, key: string): Promise<void> {
        button.focus();
        keydown(button, key);
        await settle();
    }

    async function close(): Promise<void> {
        keydown(menus()[0], "Escape");
        await settle();
        await wait(200);
    }

    // The menu opens under a pointer that isn't moving: the browser reports the item there as entered, and no move.
    async function pointerRestsOn(item: HTMLElement): Promise<void> {
        item.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false, clientX: 40, clientY: 40 }));
        await settle();
    }

    // Chooses an item with the pointer, which leaves it where the item was, and the focus back on the button.
    async function chooseWithPointer(button: HTMLButtonElement, index: number): Promise<void> {
        button.focus();
        button.click();
        await settle();
        menuItems()[index].click();
        await settle();
        await wait(200);
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(TemplatedHostComponent);
        document.body.appendChild(fixture.nativeElement);
        await settle();
        [newButton, moreButton] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
    });

    afterEach(() => {
        (fixture.nativeElement as HTMLElement).remove();
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    it("highlights the first item from Enter, Space and ArrowDown, and the last from ArrowUp, whatever the templates", async () => {
        for (const button of [newButton, moreButton]) {
            for (const key of ["Enter", " ", "ArrowDown"]) {
                await open(button, key);
                expect(document.activeElement).toBe(menus()[0]);
                expect(activeIndex()).toBe(0);
                await close();
                expect(document.activeElement).toBe(button);
            }
            await open(button, "ArrowUp");
            expect(activeIndex()).toBe(menuItems().length - 1);
            await close();
        }
    });

    it("highlights the first item of repeated items that change", async () => {
        fixture.componentInstance.kinds.set(["Spreadsheet", "Text document"]);
        await settle();

        await open(newButton, "ArrowUp");
        expect(menuItems().length).toBe(3);
        expect(menuItems()[2].textContent).toContain("Text document");
        expect(activeIndex()).toBe(2);
        await close();
        await open(newButton, "Enter");
        expect(activeIndex()).toBe(0);
    });

    it("highlights the first item from the keys under the pointer at rest after a pointer choice", async () => {
        for (const button of [moreButton, newButton]) {
            await chooseWithPointer(button, 1);
            expect(menus().length).toBe(0);
            expect(document.activeElement).toBe(button);

            keydown(button, "Enter");
            await settle();
            await pointerRestsOn(menuItems()[1]);
            expect(activeIndex()).toBe(0);

            keydown(menus()[0], "Enter");
            await settle();
            await wait(200);
            expect(menus().length).toBe(0);
            expect(document.activeElement).toBe(button);

            keydown(button, "ArrowUp");
            await settle();
            await pointerRestsOn(menuItems()[1]);
            expect(activeIndex()).toBe(menuItems().length - 1);
            await close();
        }
    });

    it("hands the highlight to the pointer once it moves", async () => {
        await open(moreButton, "Enter");
        await pointerRestsOn(menuItems()[1]);
        expect(activeIndex()).toBe(0);

        menuItems()[1].dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 41, clientY: 40 }));
        await settle();
        // As when the pointer moves onto an item without a submenu: the pointer shows where it is, not the highlight.
        expect(activeIndex()).toBe(-1);
    });
});
