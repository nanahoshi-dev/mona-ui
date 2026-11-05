import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PopupMenuComponent } from "../components/popup-menu/popup-menu.component";
import { PopupMenuCheckboxItemComponent } from "../components/popup-menu-checkbox-item/popup-menu-checkbox-item.component";
import { PopupMenuGroupComponent } from "../components/popup-menu-group/popup-menu-group.component";
import { PopupMenuItemComponent } from "../components/popup-menu-item/popup-menu-item.component";
import { PopupMenuRadioGroupComponent } from "../components/popup-menu-radio-group/popup-menu-radio-group.component";
import { PopupMenuRadioItemComponent } from "../components/popup-menu-radio-item/popup-menu-radio-item.component";
import type { MenuItem } from "../models/PopupMenuItem";
import type { PopupMenuItemClickEvent } from "../models/PopupMenuItemClickEvent";

@Component({
    imports: [
        PopupMenuComponent,
        PopupMenuItemComponent,
        PopupMenuCheckboxItemComponent,
        PopupMenuGroupComponent,
        PopupMenuRadioGroupComponent,
        PopupMenuRadioItemComponent
    ],
    template: `
        <button #trigger type="button">Open</button>
        <mona-popup-menu [target]="trigger" (menuClick)="onMenuClick($event)">
            <mona-popup-menu-item label="Alpha" value="alpha"></mona-popup-menu-item>
            <mona-popup-menu-item label="Beta" [disabled]="true"></mona-popup-menu-item>
            <mona-popup-menu-item label="Parent">
                <mona-popup-menu-item label="Child"></mona-popup-menu-item>
            </mona-popup-menu-item>
            <mona-popup-menu-checkbox-item
                label="Bold"
                value="bold"
                (checkedChange)="checkedChanges.push($event)"
                (menuClick)="onCheckboxClick($event)"></mona-popup-menu-checkbox-item>
            <mona-popup-menu-radio-group title="Sort by" [(value)]="sort">
                <mona-popup-menu-radio-item
                    label="Name"
                    value="name"
                    (menuClick)="onRadioClick($event)"></mona-popup-menu-radio-item>
                <mona-popup-menu-radio-item label="Size" value="size"></mona-popup-menu-radio-item>
            </mona-popup-menu-radio-group>
            <mona-popup-menu-group title="View options">
                <mona-popup-menu-item label="Zoom"></mona-popup-menu-item>
            </mona-popup-menu-group>
        </mona-popup-menu>
    `
})
class ComponentItemsHostComponent {
    public readonly checkedChanges: boolean[] = [];
    public readonly clicks: PopupMenuItemClickEvent[] = [];
    public readonly radioClicks: string[] = [];
    public readonly sort = signal("size");
    public preventCheckbox = false;
    public preventRadio = false;

    public onCheckboxClick(event: PopupMenuItemClickEvent): void {
        if (this.preventCheckbox) {
            event.preventDefault();
        }
    }

    public onMenuClick(event: PopupMenuItemClickEvent): void {
        this.clicks.push(event);
    }

    public onRadioClick(event: PopupMenuItemClickEvent): void {
        this.radioClicks.push(`${event.label}:${this.sort()}`);
        if (this.preventRadio) {
            event.preventDefault();
        }
    }
}

@Component({
    imports: [PopupMenuComponent],
    template: `
        <button #trigger type="button">Open</button>
        <mona-popup-menu [target]="trigger" [items]="items" (menuClick)="clicks.push($event)"></mona-popup-menu>
    `
})
class InputItemsHostComponent {
    public readonly clicks: PopupMenuItemClickEvent[] = [];
    public readonly items: MenuItem[] = [
        { label: "Cut", value: "cut" },
        { label: "Bold", group: "Format", value: "bold" },
        { label: "Italic", group: "Format" },
        { label: "Paste" },
        { label: "Wrap", checkable: true, value: "wrap" }
    ];
}

const AXE_OPTIONS: axe.RunOptions = {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
};

function keydown(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
    target.dispatchEvent(event);
    return event;
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function item(label: string): HTMLElement {
    const found = Array.from(document.querySelectorAll<HTMLElement>("[role^='menuitem']")).find(
        element => element.textContent?.trim() === label
    );
    if (!found) {
        throw new Error(`No menu item "${label}"`);
    }
    return found;
}

function activeLabel(menu: HTMLElement): string | null {
    const id = menu.getAttribute("aria-activedescendant");
    return id ? (document.getElementById(id)?.textContent?.trim() ?? null) : null;
}

describe("popup menu items", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    describe("projected item components", () => {
        let fixture: ComponentFixture<ComponentItemsHostComponent>;
        let host: ComponentItemsHostComponent;

        async function settle(): Promise<void> {
            fixture.detectChanges();
            await fixture.whenStable();
            await new Promise(resolve => setTimeout(resolve, 5));
            fixture.detectChanges();
        }

        async function open(): Promise<HTMLElement> {
            (fixture.nativeElement as HTMLElement).querySelector("button")!.click();
            await settle();
            return menus()[0];
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(ComponentItemsHostComponent);
            host = fixture.componentInstance;
            await settle();
        });

        it("activates the highlighted item with Space as well as Enter", async () => {
            let menu = await open();
            keydown(menu, "ArrowDown");
            await settle();
            expect(activeLabel(menu)).toBe("Alpha");

            const space = keydown(menu, " ");
            await settle();

            expect(space.defaultPrevented).toBe(true);
            expect(host.clicks.map(event => event.label)).toEqual(["Alpha"]);
            expect(menus().length).toBe(0);

            menu = await open();
            keydown(menu, "ArrowDown");
            keydown(menu, "Enter");
            await settle();
            expect(host.clicks.map(event => event.label)).toEqual(["Alpha", "Alpha"]);
        });

        it("carries the item's value on the click event", async () => {
            await open();
            item("Alpha").click();
            await settle();

            expect(host.clicks[0].value).toBe("alpha");
            expect(host.clicks[0].checked).toBeUndefined();
        });

        it("keeps disabled items in the arrow order without activating them", async () => {
            const menu = await open();
            keydown(menu, "ArrowDown");
            keydown(menu, "ArrowDown");
            await settle();

            expect(activeLabel(menu)).toBe("Beta");
            expect(item("Beta").getAttribute("aria-disabled")).toBe("true");

            keydown(menu, "Enter");
            keydown(menu, " ");
            item("Beta").click();
            await settle();

            expect(host.clicks.length).toBe(0);
            expect(menus().length).toBe(1);
        });

        it("keeps the highlight when typeahead matches nothing", async () => {
            const menu = await open();
            keydown(menu, "ArrowDown");
            await settle();
            keydown(menu, "q");
            await new Promise(resolve => setTimeout(resolve, 600));
            await settle();

            expect(activeLabel(menu)).toBe("Alpha");
        });

        it("opens the submenu when an item with children is clicked, without activating it", async () => {
            await open();
            item("Parent").click();
            await settle();

            expect(host.clicks.length).toBe(0);
            expect(menus().length).toBe(2);
            expect(menus()[1].textContent).toContain("Child");

            item("Child").click();
            await settle();
            expect(host.clicks.map(event => event.label)).toEqual(["Child"]);
        });

        it("exposes checkbox and radio items with their roles and state", async () => {
            await open();

            expect(item("Bold").getAttribute("role")).toBe("menuitemcheckbox");
            expect(item("Bold").getAttribute("aria-checked")).toBe("false");
            expect(item("Name").getAttribute("role")).toBe("menuitemradio");
            expect(item("Name").getAttribute("aria-checked")).toBe("false");
            expect(item("Size").getAttribute("aria-checked")).toBe("true");
            expect(item("Alpha").getAttribute("role")).toBe("menuitem");
            expect(item("Alpha").hasAttribute("aria-checked")).toBe(false);
        });

        it("toggles an unbound checkbox item and reports the new state", async () => {
            await open();
            item("Bold").click();
            await settle();

            expect(host.checkedChanges).toEqual([true]);
            expect(host.clicks[0].checked).toBe(true);
            expect(host.clicks[0].value).toBe("bold");

            await open();
            expect(item("Bold").getAttribute("aria-checked")).toBe("true");
        });

        it("leaves a checkbox item unchanged when its menuClick is prevented", async () => {
            host.preventCheckbox = true;
            await open();
            item("Bold").click();
            await settle();

            expect(host.checkedChanges).toEqual([]);
            expect(host.clicks.length).toBe(0);
            expect(item("Bold").getAttribute("aria-checked")).toBe("false");
        });

        it("runs a radio item's menuClick before the group selects it", async () => {
            await open();
            item("Name").click();
            await settle();

            expect(host.radioClicks).toEqual(["Name:size"]);
            expect(host.sort()).toBe("name");
            expect(host.clicks[0].checked).toBe(true);
        });

        it("keeps the radio group's value when the radio item's menuClick is prevented", async () => {
            host.preventRadio = true;
            await open();
            item("Name").click();
            await settle();

            expect(host.radioClicks).toEqual(["Name:size"]);
            expect(host.sort()).toBe("size");
            expect(host.clicks.length).toBe(0);
        });

        it("wraps each titled group's items in a group named by its title", async () => {
            await open();
            const groups = Array.from(document.querySelectorAll<HTMLElement>("[role='menu'] [role='group']"));

            expect(groups.length).toBe(2);
            const names = groups.map(group => {
                const ids = group.getAttribute("aria-labelledby")!.split(" ");
                expect(ids.length).toBe(1);
                return document.getElementById(ids[0])?.textContent?.trim();
            });
            expect(names).toEqual(["Sort by", "View options"]);
            expect(
                Array.from(groups[0].querySelectorAll("[role='menuitemradio']")).map(e => e.textContent?.trim())
            ).toEqual(["Name", "Size"]);
            expect(groups[1].querySelector("[role='menuitem']")?.textContent?.trim()).toBe("Zoom");
        });

        it("has no axe violations while open", async () => {
            await open();
            const container = document.querySelector<HTMLElement>(".cdk-overlay-container")!;
            const results = await axe.run(container, AXE_OPTIONS);

            expect(results.passes.some(rule => rule.id.startsWith("aria-"))).toBe(true);
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("the items input", () => {
        let fixture: ComponentFixture<InputItemsHostComponent>;
        let host: InputItemsHostComponent;

        async function settle(): Promise<void> {
            fixture.detectChanges();
            await fixture.whenStable();
            await new Promise(resolve => setTimeout(resolve, 5));
            fixture.detectChanges();
        }

        async function open(): Promise<void> {
            (fixture.nativeElement as HTMLElement).querySelector("button")!.click();
            await settle();
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(InputItemsHostComponent);
            host = fixture.componentInstance;
            await settle();
        });

        it("keeps the items' order and groups only consecutive items", async () => {
            await open();
            const labels = Array.from(document.querySelectorAll("[role^='menuitem']")).map(e => e.textContent?.trim());
            const groups = document.querySelectorAll("[role='menu'] [role='group']");

            expect(labels).toEqual(["Cut", "Bold", "Italic", "Paste", "Wrap"]);
            expect(groups.length).toBe(1);
            expect(Array.from(groups[0].querySelectorAll("[role='menuitem']")).map(e => e.textContent?.trim())).toEqual(
                ["Bold", "Italic"]
            );
        });

        it("toggles a checkable entry and carries values", async () => {
            await open();
            item("Wrap").click();
            await settle();

            expect(host.clicks[0].checked).toBe(true);
            expect(host.clicks[0].value).toBe("wrap");

            await open();
            expect(item("Wrap").getAttribute("aria-checked")).toBe("true");
            item("Cut").click();
            await settle();
            expect(host.clicks[1].value).toBe("cut");
        });
    });
});
