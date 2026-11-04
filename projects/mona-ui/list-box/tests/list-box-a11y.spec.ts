import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListBoxComponent } from "../components/list-box/list-box.component";
import { ListBoxItemTemplateDirective } from "../directives/list-box-item-template.directive";
import type { ListBoxActionEvent } from "../models/ListBoxActionClickEvent";
import type { ToolbarOptions } from "../models/ToolbarOptions";

interface Food {
    readonly id: number;
    readonly locked?: boolean;
    readonly name: string;
}

const FOODS: Food[] = [
    { id: 1, name: "Apple" },
    { id: 2, name: "Bread" },
    { id: 3, name: "Cheese" },
    { id: 4, name: "Dates" }
];

type Side = "first" | "second";

function moveItems(items: readonly Food[], indices: readonly number[], up: boolean): Food[] {
    const result = [...items];
    for (const index of up ? indices : [...indices].reverse()) {
        const other = up ? index - 1 : index + 1;
        [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
}

@Component({
    imports: [ListBoxComponent, ListBoxItemTemplateDirective],
    template: `
        <div [attr.dir]="dir()">
            <mona-list-box
                aria-label="Available foods"
                [items]="first()"
                textField="name"
                selectBy="id"
                disabledBy="locked"
                [selectionMode]="mode()"
                [toolbar]="toolbar()"
                [toolbarAriaLabel]="toolbarName()"
                [connectedList]="second"
                (actionClick)="onAction($event, 'first')">
                <ng-template monaListBoxItemTemplate [monaListBoxItemTemplateOf]="first()" let-food>
                    <span class="food">{{ food.name }}</span>
                </ng-template>
            </mona-list-box>
            <mona-list-box
                #second
                aria-label="Chosen foods"
                [items]="secondItems()"
                textField="name"
                selectBy="id"
                [toolbar]="false"
                (actionClick)="onAction($event, 'second')"></mona-list-box>
        </div>
    `
})
class PairHostComponent {
    public readonly dir = signal<"ltr" | "rtl">("ltr");
    public readonly first = signal<Food[]>(FOODS);
    public readonly mode = signal<"multiple" | "single">("single");
    public readonly secondItems = signal<Food[]>([{ id: 9, name: "Xigua" }]);
    public readonly toolbar = signal<boolean | Partial<ToolbarOptions>>(true);
    public readonly toolbarName = signal("");

    public onAction(event: ListBoxActionEvent<Food>, side: Side): void {
        const own = side === "first" ? this.first : this.secondItems;
        const ids = new Set(event.selectedItems.map(item => item.id));
        switch (event.action) {
            case "transferTo":
            case "transferAllTo":
                this.secondItems.update(items => [...items, ...event.selectedItems]);
                this.first.update(items => items.filter(item => !ids.has(item.id)));
                break;
            case "transferFrom":
            case "transferAllFrom":
                this.first.update(items => [...items, ...event.selectedItems]);
                this.secondItems.update(items => items.filter(item => !ids.has(item.id)));
                break;
            case "moveUp":
            case "moveDown":
                own.update(items => moveItems(items, event.selectedIndices, event.action === "moveUp"));
                break;
            case "remove":
                own.update(items => items.filter(item => !ids.has(item.id)));
                break;
        }
    }
}

@Component({
    imports: [ListBoxComponent],
    template: `
        <mona-list-box
            aria-label="Steps"
            [items]="items"
            textField="name"
            selectBy="id"
            toolbar
            singleSelectionToggleable="false"></mona-list-box>
    `
})
class StandaloneHostComponent {
    public readonly items = FOODS;
}

const AXE_OPTIONS: axe.RunOptions = {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
};

async function violations(root: HTMLElement): Promise<string[]> {
    const results = await axe.run(root, AXE_OPTIONS);
    // Rules that passed show the run reached the list boxes; an empty run would also have no violations.
    expect(results.passes.some(rule => rule.id.startsWith("aria-"))).toBe(true);
    return results.violations.map(
        violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`
    );
}

function keydown(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    target.dispatchEvent(event);
    return event;
}

describe("list box accessibility", () => {
    let announce: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        announce = vi.fn(() => Promise.resolve());
        TestBed.configureTestingModule({ providers: [{ provide: LiveAnnouncer, useValue: { announce } }] });
    });

    describe("a connected pair", () => {
        let fixture: ComponentFixture<PairHostComponent>;
        let host: PairHostComponent;
        let root: HTMLElement;

        async function settle(): Promise<void> {
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
        }

        function listbox(name: string): HTMLElement {
            return root.querySelector(`ul[role='listbox'][aria-label='${name}']`) as HTMLElement;
        }

        function option(name: string, text: string): HTMLElement {
            const found = Array.from(listbox(name).querySelectorAll<HTMLElement>("li[role='option']")).find(
                item => item.textContent?.trim() === text
            );
            if (!found) {
                throw new Error(`No option "${text}" in "${name}"`);
            }
            return found;
        }

        function names(name: string): string[] {
            return Array.from(listbox(name).querySelectorAll("li[role='option']")).map(
                item => item.textContent?.trim() ?? ""
            );
        }

        function toolbar(): HTMLElement {
            return root.querySelector("[role='toolbar']") as HTMLElement;
        }

        function button(label: string): HTMLButtonElement {
            const found = toolbar().querySelector<HTMLButtonElement>(`button[aria-label='${label}']`);
            if (!found) {
                throw new Error(`No button "${label}"`);
            }
            return found;
        }

        async function select(name: string, text: string): Promise<void> {
            option(name, text).click();
            await settle();
        }

        async function press(label: string): Promise<void> {
            const target = button(label);
            target.focus();
            target.click();
            await settle();
        }

        beforeEach(async () => {
            fixture = TestBed.createComponent(PairHostComponent);
            host = fixture.componentInstance;
            root = fixture.nativeElement as HTMLElement;
            document.body.appendChild(root);
            await settle();
        });

        afterEach(() => root.remove());

        it("names both listboxes and has no axe violations", async () => {
            await select("Available foods", "Bread");
            expect(listbox("Available foods")).not.toBeNull();
            expect(listbox("Chosen foods")).not.toBeNull();
            expect(root.querySelector("mona-list-box")?.hasAttribute("aria-label")).toBe(false);
            expect(await violations(root)).toEqual([]);
        });

        it("keeps an empty list box's named listbox, described by No data", async () => {
            host.secondItems.set([]);
            await settle();

            const empty = listbox("Chosen foods");
            expect(empty).not.toBeNull();
            expect(empty.getAttribute("tabindex")).toBe("0");
            expect(root.querySelector(`#${empty.getAttribute("aria-describedby")}`)?.textContent?.trim()).toBe(
                "No data"
            );
            expect(await violations(root)).toEqual([]);
        });

        describe("toolbar", () => {
            it("is a named vertical toolbar whose transfer buttons name the other list box", () => {
                expect(toolbar().getAttribute("aria-label")).toBe("Available foods actions");
                expect(toolbar().getAttribute("aria-orientation")).toBe("vertical");
                expect(button("Transfer to Chosen foods")).toBeTruthy();
                expect(button("Transfer all from Chosen foods")).toBeTruthy();
            });

            it("takes its name from toolbarAriaLabel when set", async () => {
                host.toolbarName.set("Food actions");
                await settle();
                expect(toolbar().getAttribute("aria-label")).toBe("Food actions");
            });

            it("is one Tab stop, and the arrow keys move between its enabled buttons", async () => {
                await select("Available foods", "Bread");
                const tabStops = () =>
                    Array.from(toolbar().querySelectorAll<HTMLButtonElement>("button[tabindex='0']")).map(element =>
                        element.getAttribute("aria-label")
                    );
                expect(tabStops()).toEqual(["Move Up"]);

                button("Move Up").focus();
                keydown(button("Move Up"), "ArrowDown");
                await settle();
                expect(document.activeElement?.getAttribute("aria-label")).toBe("Move Down");
                expect(tabStops()).toEqual(["Move Down"]);

                // Transfer From is disabled (nothing is selected in Chosen foods), so it is skipped.
                keydown(document.activeElement as Element, "ArrowDown");
                await settle();
                expect(document.activeElement?.getAttribute("aria-label")).toBe("Transfer to Chosen foods");

                keydown(document.activeElement as Element, "End");
                await settle();
                expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove");

                keydown(document.activeElement as Element, "ArrowDown");
                await settle();
                expect(document.activeElement?.getAttribute("aria-label")).toBe("Move Up");
            });

            it("lines its buttons up, and uses Left and Right, above the list", async () => {
                host.toolbar.set({ position: "top" });
                await settle();
                expect(toolbar().getAttribute("aria-orientation")).toBe("horizontal");

                const first = toolbar().querySelector<HTMLButtonElement>("button[tabindex='0']") as HTMLButtonElement;
                first.focus();
                expect(keydown(first, "ArrowRight").defaultPrevented).toBe(true);
            });
        });

        describe("focus after actions", () => {
            it("follows transferred items into the other list box, where they stay selected", async () => {
                await select("Available foods", "Bread");
                await press("Transfer to Chosen foods");

                expect(names("Chosen foods")).toEqual(["Xigua", "Bread"]);
                const bread = option("Chosen foods", "Bread");
                expect(bread.getAttribute("aria-selected")).toBe("true");
                expect(document.activeElement).toBe(bread);
                expect(announce).toHaveBeenCalledWith("1 item moved to Chosen foods", "polite");
            });

            it("moves to the neighbour of removed items", async () => {
                await select("Available foods", "Bread");
                await press("Remove");

                expect(names("Available foods")).toEqual(["Apple", "Cheese", "Dates"]);
                expect(document.activeElement).toBe(option("Available foods", "Cheese"));
                expect(announce).toHaveBeenCalledWith("1 item removed", "polite");
            });

            it("moves to the moved item when Move Up is disabled at the top", async () => {
                await select("Available foods", "Bread");
                await press("Move Up");

                expect(names("Available foods")).toEqual(["Bread", "Apple", "Cheese", "Dates"]);
                expect(button("Move Up").disabled).toBe(true);
                expect(document.activeElement).toBe(option("Available foods", "Bread"));
                expect(announce).toHaveBeenCalledWith("Moved to position 1 of 4", "polite");
            });

            it("stays on a button that is still enabled", async () => {
                await select("Available foods", "Cheese");
                await press("Move Up");

                expect(names("Available foods")).toEqual(["Apple", "Cheese", "Bread", "Dates"]);
                expect(document.activeElement).toBe(button("Move Up"));
            });

            it("moves to the list box after Clear Selection", async () => {
                await select("Available foods", "Cheese");
                await press("Clear Selection");

                expect(document.activeElement).toBe(option("Available foods", "Cheese"));
                expect(announce).toHaveBeenCalledWith("Selection cleared", "polite");
            });
        });

        describe("shortcuts", () => {
            it("moves the selection with Alt+ArrowUp and Alt+ArrowDown, keeping focus on the option", async () => {
                await select("Available foods", "Bread");
                const bread = option("Available foods", "Bread");
                bread.focus();

                expect(keydown(bread, "ArrowDown", { altKey: true }).defaultPrevented).toBe(true);
                await settle();

                expect(names("Available foods")).toEqual(["Apple", "Cheese", "Bread", "Dates"]);
                expect(document.activeElement).toBe(option("Available foods", "Bread"));
                expect(option("Available foods", "Bread").getAttribute("aria-selected")).toBe("true");
            });

            it("removes the selection with Delete", async () => {
                await select("Available foods", "Bread");
                const bread = option("Available foods", "Bread");
                bread.focus();

                keydown(bread, "Delete");
                await settle();

                expect(names("Available foods")).toEqual(["Apple", "Cheese", "Dates"]);
                expect(document.activeElement).toBe(option("Available foods", "Cheese"));
            });

            it("transfers with Alt+ArrowRight, and back from the other list box with Alt+ArrowLeft", async () => {
                await select("Available foods", "Bread");
                option("Available foods", "Bread").focus();
                keydown(option("Available foods", "Bread"), "ArrowRight", { altKey: true });
                await settle();

                expect(names("Chosen foods")).toEqual(["Xigua", "Bread"]);
                const bread = option("Chosen foods", "Bread");
                expect(document.activeElement).toBe(bread);

                keydown(bread, "ArrowLeft", { altKey: true });
                await settle();
                expect(names("Chosen foods")).toEqual(["Xigua"]);
                expect(names("Available foods")).toContain("Bread");
            });

            it("mirrors the transfer keys in RTL", async () => {
                host.dir.set("rtl");
                await settle();
                await select("Available foods", "Bread");
                const bread = option("Available foods", "Bread");
                bread.focus();

                expect(keydown(bread, "ArrowRight", { altKey: true }).defaultPrevented).toBe(false);
                keydown(bread, "ArrowLeft", { altKey: true });
                await settle();
                expect(names("Chosen foods")).toEqual(["Xigua", "Bread"]);
            });

            it("only runs the actions the toolbar offers", async () => {
                host.toolbar.set({ actions: ["moveUp", "moveDown"] });
                await settle();
                await select("Available foods", "Bread");
                const bread = option("Available foods", "Bread");
                bread.focus();

                expect(keydown(bread, "Delete").defaultPrevented).toBe(false);
                expect(keydown(bread, "ArrowRight", { altKey: true }).defaultPrevented).toBe(false);
                await settle();
                expect(names("Available foods")).toContain("Bread");
            });
        });

        it("keeps disabled items out of the selection and the All transfers", async () => {
            host.first.set(FOODS.map(food => (food.id === 3 ? { ...food, locked: true } : food)));
            await settle();

            const cheese = option("Available foods", "Cheese");
            expect(cheese.getAttribute("aria-disabled")).toBe("true");
            cheese.click();
            await settle();
            expect(cheese.getAttribute("aria-selected")).toBe("false");

            await press("Transfer all to Chosen foods");
            expect(names("Available foods")).toEqual(["Cheese"]);
            expect(names("Chosen foods")).toEqual(["Xigua", "Apple", "Bread", "Dates"]);
        });

        it("moves focus, not the selection, with typeahead in multiple mode", async () => {
            host.mode.set("multiple");
            await settle();
            const apple = option("Available foods", "Apple");
            apple.focus();
            keydown(apple, "a", { ctrlKey: true });
            await settle();
            expect(listbox("Available foods").querySelectorAll("[aria-selected='true']").length).toBe(4);

            keydown(apple, "c");
            await new Promise(resolve => setTimeout(resolve, 250));
            await settle();

            expect(listbox("Available foods").querySelectorAll("[aria-selected='true']").length).toBe(4);
            expect(document.activeElement).toBe(option("Available foods", "Cheese"));
        });

        it("types the item template's context from monaListBoxItemTemplateOf", () => {
            expect(Array.from(root.querySelectorAll(".food")).map(element => element.textContent)).toEqual(
                FOODS.map(food => food.name)
            );
        });
    });

    describe("a list box of its own", () => {
        let fixture: ComponentFixture<StandaloneHostComponent>;
        let root: HTMLElement;

        beforeEach(async () => {
            fixture = TestBed.createComponent(StandaloneHostComponent);
            root = fixture.nativeElement as HTMLElement;
            fixture.detectChanges();
            await fixture.whenStable();
            fixture.detectChanges();
        });

        it("shows the move, clear and remove actions from the bare toolbar attribute", async () => {
            const labels = Array.from(root.querySelectorAll("[role='toolbar'] button")).map(element =>
                element.getAttribute("aria-label")
            );
            expect(labels).toEqual(["Move Up", "Move Down", "Clear Selection", "Remove"]);
            expect(await violations(root)).toEqual([]);
        });

        it("takes singleSelectionToggleable as an attribute", async () => {
            const apple = root.querySelector("li[role='option']") as HTMLElement;
            apple.click();
            fixture.detectChanges();
            apple.click();
            fixture.detectChanges();
            await fixture.whenStable();
            expect(apple.getAttribute("aria-selected")).toBe("true");
        });
    });
});
