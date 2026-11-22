import { Component, signal, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PopupMenuComponent } from "../components/popup-menu/popup-menu.component";
import { PopupMenuItemComponent } from "../components/popup-menu-item/popup-menu-item.component";
import type { PopupMenuItemClickEvent } from "@nanahoshi/mona-ui/internal/popup-menu";

@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <button id="first-trigger" #first type="button">Actions</button>
        <button #second type="button">Second</button>
        <button #outside type="button">Outside</button>
        @if (shown()) {
            <mona-popup-menu
                [target]="useSecond() ? second : first"
                [aria-label]="ariaLabel()"
                (menuClick)="clicks.push($event)">
                <mona-popup-menu-item label="Alpha"></mona-popup-menu-item>
                <mona-popup-menu-item label="Parent">
                    <mona-popup-menu-item label="Child"></mona-popup-menu-item>
                </mona-popup-menu-item>
                <mona-popup-menu-item label="Other parent">
                    <mona-popup-menu-item label="Other child"></mona-popup-menu-item>
                </mona-popup-menu-item>
                @for (label of extraItems(); track label) {
                    <mona-popup-menu-item [label]="label"></mona-popup-menu-item>
                }
                <mona-popup-menu-item label="Omega"></mona-popup-menu-item>
            </mona-popup-menu>
        }
    `
})
class MenuHostComponent {
    public readonly ariaLabel = signal("");
    public readonly clicks: PopupMenuItemClickEvent[] = [];
    public readonly extraItems = signal<string[]>([]);
    public readonly menu = viewChild(PopupMenuComponent);
    public readonly shown = signal(true);
    public readonly useSecond = signal(false);
}

@Component({
    imports: [PopupMenuComponent, PopupMenuItemComponent],
    template: `
        <div #outer class="outer" tabindex="0">
            Outer
            <div #inner class="inner" tabindex="0">Inner</div>
        </div>
        <mona-popup-menu [target]="outer" trigger="contextmenu" [openAtPointer]="true">
            <mona-popup-menu-item label="Outer item"></mona-popup-menu-item>
        </mona-popup-menu>
        <mona-popup-menu [target]="inner" trigger="contextmenu" [openAtPointer]="true">
            <mona-popup-menu-item label="Inner item"></mona-popup-menu-item>
        </mona-popup-menu>
    `
})
class ContextHostComponent {}

function keydown(target: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key });
    target.dispatchEvent(event);
    return event;
}

function menus(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>("[role='menu']"));
}

function item(label: string): HTMLElement {
    const found = Array.from(document.querySelectorAll<HTMLElement>("[role='menuitem']")).find(
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

function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe("popup menu focus and lifecycle", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(element => element.remove());
    });

    describe("a menu on a button", () => {
        let fixture: ComponentFixture<MenuHostComponent>;
        let host: MenuHostComponent;
        let buttons: HTMLButtonElement[];

        async function settle(): Promise<void> {
            fixture.detectChanges();
            await fixture.whenStable();
            await wait(5);
            fixture.detectChanges();
        }

        async function clickOpen(index = 0): Promise<HTMLElement> {
            buttons[index].focus();
            buttons[index].click();
            await settle();
            return menus()[0];
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(MenuHostComponent);
            host = fixture.componentInstance;
            document.body.appendChild(fixture.nativeElement);
            await settle();
            buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
        });

        afterEach(() => {
            (fixture.nativeElement as HTMLElement).remove();
        });

        it("returns focus to the trigger after Escape in a menu opened by click", async () => {
            const menu = await clickOpen();
            expect(document.activeElement).toBe(menu);

            keydown(menu, "Escape");
            await settle();
            await wait(200);

            expect(menus().length).toBe(0);
            expect(document.activeElement).toBe(buttons[0]);
        });

        it("returns focus to the trigger after an item is chosen in a menu opened by click", async () => {
            await clickOpen();
            item("Alpha").click();
            await settle();
            await wait(200);

            expect(host.clicks.length).toBe(1);
            expect(document.activeElement).toBe(buttons[0]);
        });

        it("closes on Tab, with focus on the trigger and the key left to the browser", async () => {
            const menu = await clickOpen();
            const tab = keydown(menu, "Tab");

            expect(tab.defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(buttons[0]);
            await settle();
            await wait(200);
            expect(menus().length).toBe(0);
        });

        it("closes, without taking focus back, when focus moves out of the menus", async () => {
            const menu = await clickOpen();
            buttons[2].focus();
            menu.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: buttons[2] }));
            await settle();
            await wait(200);

            expect(menus().length).toBe(0);
            expect(document.activeElement).toBe(buttons[2]);
        });

        it("highlights the first item, or the last, when opened from the keyboard", async () => {
            buttons[0].focus();
            host.menu()!.openMenuViaKeyboard();
            await settle();
            expect(activeLabel(menus()[0])).toBe("Alpha");

            keydown(menus()[0], "Escape");
            await settle();
            await wait(200);

            host.menu()!.openMenuViaKeyboard(false, "last");
            await settle();
            expect(activeLabel(menus()[0])).toBe("Omega");
        });

        it("highlights nothing when opened by click", async () => {
            const menu = await clickOpen();
            expect(activeLabel(menu)).toBeNull();
        });

        it("closes its menu when it is destroyed", async () => {
            await clickOpen();
            expect(menus().length).toBe(1);

            host.shown.set(false);
            await settle();
            await wait(200);

            expect(menus().length).toBe(0);
        });

        it("follows a change of target", async () => {
            host.useSecond.set(true);
            await settle();

            buttons[0].click();
            await settle();
            expect(menus().length).toBe(0);

            await clickOpen(1);
            expect(menus().length).toBe(1);
        });

        it("toggles when the trigger is clicked again", async () => {
            await clickOpen();
            buttons[0].click();
            await settle();
            await wait(200);
            expect(menus().length).toBe(0);
        });

        it("is named by the trigger, or by ariaLabel", async () => {
            let menu = await clickOpen();
            expect(menu.getAttribute("aria-labelledby")).toBe("first-trigger");
            expect(menu.hasAttribute("aria-label")).toBe(false);

            keydown(menu, "Escape");
            await settle();
            await wait(200);

            host.ariaLabel.set("Row actions");
            await settle();
            menu = await clickOpen();
            expect(menu.getAttribute("aria-label")).toBe("Row actions");
            expect(menu.hasAttribute("aria-labelledby")).toBe(false);
        });

        it("links a parent item and its submenu while it is open", async () => {
            const menu = await clickOpen();
            expect(item("Alpha").hasAttribute("aria-expanded")).toBe(false);
            expect(item("Parent").getAttribute("aria-expanded")).toBe("false");

            keydown(menu, "ArrowDown");
            keydown(menu, "ArrowDown");
            keydown(menu, "ArrowRight");
            await settle();

            const submenu = menus()[1];
            expect(item("Parent").getAttribute("aria-expanded")).toBe("true");
            expect(item("Parent").getAttribute("aria-controls")).toBe(submenu.id);
            expect(submenu.getAttribute("aria-labelledby")).toBe(item("Parent").id);
            expect(document.activeElement).toBe(submenu);
            expect(activeLabel(submenu)).toBe("Child");

            keydown(submenu, "ArrowLeft");
            await settle();
            await wait(200);
            expect(menus().length).toBe(1);
            expect(document.activeElement).toBe(menu);
            expect(item("Parent").getAttribute("aria-expanded")).toBe("false");
            expect(item("Parent").hasAttribute("aria-controls")).toBe(false);
        });

        it("opens one submenu however often it is asked", async () => {
            const menu = await clickOpen();
            keydown(menu, "ArrowDown");
            keydown(menu, "ArrowDown");
            keydown(menu, "Enter");
            await settle();
            item("Parent").click();
            await settle();
            await wait(200);

            expect(menus().length).toBe(2);
        });

        it("shows items added while it is open, and keeps the highlight", async () => {
            const menu = await clickOpen();
            keydown(menu, "ArrowDown");
            await settle();
            expect(activeLabel(menu)).toBe("Alpha");

            host.extraItems.set(["Added"]);
            await settle();

            expect(Array.from(menu.querySelectorAll("[role='menuitem']")).map(e => e.textContent?.trim())).toContain(
                "Added"
            );
            expect(activeLabel(menu)).toBe("Alpha");
        });

        describe("the pointer", () => {
            function enter(element: HTMLElement, x = 0, y = 0): void {
                element.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false, clientX: x, clientY: y }));
            }

            function leave(element: HTMLElement): void {
                element.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }));
            }

            function move(element: HTMLElement, x: number, y: number): void {
                element.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: x, clientY: y }));
            }

            function place(element: HTMLElement, left: number, top: number, width: number, height: number): void {
                const rect = { bottom: top + height, height, left, right: left + width, top, width, x: left, y: top };
                vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ ...rect, toJSON: () => rect });
            }

            function expanded(label: string): string | null {
                return item(label).getAttribute("aria-expanded");
            }

            // Opens Parent's submenu beside the menu: the menu spans x 0 to 100, the submenu x 100 to 200, y 20 to 80.
            async function openParentSubmenu(): Promise<void> {
                await clickOpen();
                enter(item("Parent"), 50, 30);
                move(item("Parent"), 50, 30);
                await settle();
                place(menus()[0], 0, 0, 100, 100);
                place(menus()[1], 100, 20, 100, 60);
            }

            // Moves from Parent down and to the right, toward its submenu, crossing Other parent on the way.
            function aimAcrossOtherParent(): void {
                move(item("Parent"), 40, 25);
                move(item("Parent"), 50, 32);
                move(item("Parent"), 60, 38);
                enter(item("Other parent"), 70, 44);
                move(item("Other parent"), 70, 44);
                fixture.detectChanges();
            }

            afterEach(() => {
                vi.restoreAllMocks();
            });

            it("opens a submenu on hover without moving focus into it", async () => {
                const menu = await clickOpen();
                enter(item("Parent"));
                await settle();

                expect(menus().length).toBe(2);
                expect(document.activeElement).toBe(menu);
            });

            it("switches to the next item's submenu at once when it moves straight onto that item", async () => {
                await openParentSubmenu();
                move(item("Parent"), 50, 38);
                enter(item("Other parent"), 50, 44);
                fixture.detectChanges();

                expect(expanded("Parent")).toBe("false");
                expect(expanded("Other parent")).toBe("true");

                await settle();
                await wait(200);
                expect(menus().length).toBe(2);
                expect(menus()[1].textContent?.trim()).toBe("Other child");
            });

            it("closes the open submenu at once when it moves onto an item without one", async () => {
                await openParentSubmenu();
                move(item("Parent"), 50, 22);
                enter(item("Alpha"), 50, 16);
                fixture.detectChanges();

                expect(expanded("Parent")).toBe("false");

                await settle();
                await wait(200);
                expect(menus().length).toBe(1);
            });

            it("keeps the open submenu while it crosses another item on its way into it", async () => {
                await openParentSubmenu();
                aimAcrossOtherParent();

                expect(expanded("Parent")).toBe("true");
                expect(expanded("Other parent")).toBe("false");

                move(item("Other parent"), 80, 50);
                leave(menus()[0].parentElement!);
                enter(menus()[1].parentElement!, 100, 55);
                await wait(300);
                await settle();

                expect(menus().length).toBe(2);
                expect(menus()[1].textContent?.trim()).toBe("Child");
                expect(expanded("Parent")).toBe("true");
            });

            it("switches once it rests on the crossed item short of the submenu", async () => {
                await openParentSubmenu();
                aimAcrossOtherParent();
                await wait(150);
                fixture.detectChanges();

                expect(expanded("Parent")).toBe("false");
                expect(expanded("Other parent")).toBe("true");
            });

            it("switches at once when it turns away from the submenu", async () => {
                await openParentSubmenu();
                aimAcrossOtherParent();
                move(item("Other parent"), 66, 56);
                fixture.detectChanges();

                expect(expanded("Parent")).toBe("false");
                expect(expanded("Other parent")).toBe("true");
            });

            it("keeps the open submenu when it leaves the menu after crossing another item", async () => {
                await openParentSubmenu();
                aimAcrossOtherParent();
                leave(menus()[0].parentElement!);
                await wait(150);
                fixture.detectChanges();

                expect(expanded("Parent")).toBe("true");
                expect(expanded("Other parent")).toBe("false");
            });
        });
    });

    describe("context menus", () => {
        let fixture: ComponentFixture<ContextHostComponent>;

        async function settle(): Promise<void> {
            fixture.detectChanges();
            await fixture.whenStable();
            await wait(5);
            fixture.detectChanges();
        }

        function rightClick(element: Element, x: number): void {
            element.dispatchEvent(
                new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: 10, button: 2 })
            );
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(ContextHostComponent);
            await settle();
        });

        it("opens only the innermost target's menu", async () => {
            rightClick((fixture.nativeElement as HTMLElement).querySelector(".inner")!, 10);
            await settle();

            expect(menus().length).toBe(1);
            expect(menus()[0].textContent).toContain("Inner item");
        });

        it("opens again at the new point on a second right-click, even while the first is closing", async () => {
            const outer = (fixture.nativeElement as HTMLElement).querySelector(".outer")!;
            rightClick(outer, 10);
            await settle();
            rightClick(outer, 40);
            await settle();
            await wait(200);
            expect(menus().length).toBe(1);

            keydown(menus()[0], "Escape");
            rightClick(outer, 60);
            await settle();
            await wait(200);
            expect(menus().length).toBe(1);
        });
    });
});
