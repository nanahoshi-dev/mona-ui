import { Component, signal, viewChild } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TabComponent } from "../components/tab/tab.component";
import { TabsComponent } from "../components/tabs/tabs.component";
import { TabContentTemplateDirective } from "../directives/tab-content-template.directive";
import { TabTitleTemplateDirective } from "../directives/tab-title-template.directive";
import type { TabCloseEvent } from "../models/TabCloseEvent";
import type { TabSelectEvent } from "../models/TabSelectEvent";
import {
    tabListCloseButtonThemeVariants,
    tabListListItemThemeVariants,
    tabListTabThemeVariants
} from "../styles/tabs.styles";

interface TabSpec {
    readonly closable?: boolean;
    readonly disabled?: boolean;
    readonly id: string;
    readonly selected?: boolean;
    readonly title?: string;
}

@Component({
    template: `
        <button type="button" id="outside">Outside</button>
        <mona-tabs
            [aria-label]="label()"
            [aria-labelledby]="labelledBy()"
            [closable]="closable()"
            [disabled]="disabled()"
            [(selectedIndex)]="index"
            (tabClose)="onClose($event)"
            (tabSelect)="onSelect($event)">
            @for (tab of tabs(); track tab.id) {
                <mona-tab
                    [closable]="!!tab.closable"
                    [disabled]="!!tab.disabled"
                    [selected]="!!tab.selected"
                    (selectedChange)="onSelectedChange(tab.id, $event)"
                    [title]="tab.title ?? tab.id">
                    <ng-template monaTabContentTemplate>
                        <input [attr.aria-label]="tab.id + ' field'" [attr.data-field]="tab.id" />
                    </ng-template>
                </mona-tab>
            }
        </mona-tabs>
    `,
    imports: [TabComponent, TabContentTemplateDirective, TabsComponent]
})
class HostComponent {
    public readonly closable = signal(false);
    public readonly closeEvents: TabCloseEvent[] = [];
    public readonly disabled = signal(false);
    public readonly index = signal(0);
    public readonly label = signal("");
    public readonly labelledBy = signal("");
    public readonly selectEvents: TabSelectEvent[] = [];
    public readonly selectedChanges: [string, boolean][] = [];
    public readonly tabs = signal<readonly TabSpec[]>([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }]);
    public veto: readonly number[] = [];

    public onClose(event: TabCloseEvent): void {
        this.closeEvents.push(event);
    }

    public onSelect(event: TabSelectEvent): void {
        this.selectEvents.push(event);
        if (this.veto.includes(event.index)) {
            event.preventDefault();
        }
    }

    public onSelectedChange(id: string, selected: boolean): void {
        this.selectedChanges.push([id, selected]);
    }
}

@Component({
    template: `
        <mona-tabs aria-label="Reports" aria-labelledby="heading">
            <mona-tab title="First"><ng-template monaTabContentTemplate>One</ng-template></mona-tab>
        </mona-tabs>
    `,
    imports: [TabComponent, TabContentTemplateDirective, TabsComponent]
})
class StaticNameHostComponent {}

@Component({
    template: `
        <mona-tabs>
            <mona-tab [(selected)]="firstSelected" title="First">
                <ng-template monaTabTitleTemplate><b>First</b></ng-template>
                <ng-template monaTabContentTemplate>One</ng-template>
            </mona-tab>
            <mona-tab [(selected)]="secondSelected" title="Second">
                <ng-template monaTabContentTemplate>Two</ng-template>
            </mona-tab>
        </mona-tabs>
    `,
    imports: [TabComponent, TabContentTemplateDirective, TabTitleTemplateDirective, TabsComponent]
})
class TwoWayHostComponent {
    public readonly firstSelected = signal(false);
    public readonly secondSelected = signal(true);
    public readonly tabsComponent = viewChild.required(TabsComponent);
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function tabElements<T>(fixture: ComponentFixture<T>): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll("[role='tab']"));
}

function selectedTitle<T>(fixture: ComponentFixture<T>): string | undefined {
    return tabElements(fixture)
        .find(tab => tab.getAttribute("aria-selected") === "true")
        ?.textContent?.trim();
}

function tabNamed<T>(fixture: ComponentFixture<T>, title: string): HTMLElement {
    const tab = tabElements(fixture).find(element => element.textContent?.trim() === title);
    if (!tab) {
        throw new Error(`No tab named ${title}`);
    }
    return tab;
}

function press(element: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
    element.dispatchEvent(event);
    return event;
}

describe("mona-tabs behavior", () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    async function setup(tabs?: readonly TabSpec[], index?: number): Promise<void> {
        fixture = TestBed.createComponent(HostComponent);
        host = fixture.componentInstance;
        if (tabs) {
            host.tabs.set(tabs);
        }
        if (index !== undefined) {
            host.index.set(index);
        }
        await settle(fixture);
    }

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [HostComponent, TwoWayHostComponent] });
    });

    describe("panel identity", () => {
        it("keeps the panel and what's typed in it when only the title changes", async () => {
            await setup();
            const input = fixture.nativeElement.querySelector("[data-field='a']") as HTMLInputElement;
            input.value = "typed";
            input.focus();

            host.tabs.update(tabs => tabs.map(tab => (tab.id === "a" ? { ...tab, title: "a *" } : tab)));
            await settle(fixture);

            expect(fixture.nativeElement.querySelector("[data-field='a']")).toBe(input);
            expect(input.value).toBe("typed");
            expect(document.activeElement).toBe(input);
            expect(tabNamed(fixture, "a *")).toBeTruthy();
        });

        it("keeps the panel and its tab element when disabled or closable changes", async () => {
            await setup();
            const input = fixture.nativeElement.querySelector("[data-field='b']") as HTMLInputElement;
            const tab = tabNamed(fixture, "b");

            host.tabs.update(tabs => tabs.map(item => (item.id === "b" ? { ...item, disabled: true } : item)));
            await settle(fixture);
            host.tabs.update(tabs => tabs.map(item => (item.id === "b" ? { ...item, closable: true } : item)));
            await settle(fixture);

            expect(fixture.nativeElement.querySelector("[data-field='b']")).toBe(input);
            expect(tabNamed(fixture, "b")).toBe(tab);
        });
    });

    describe("selectedIndex", () => {
        it("selects the tab it's bound to on the first render", async () => {
            await setup(undefined, 2);
            expect(selectedTitle(fixture)).toBe("c");
            expect(host.index()).toBe(2);
        });

        it("follows a written index, without a tabSelect", async () => {
            await setup();
            host.index.set(3);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("d");
            expect(host.selectEvents).toEqual([]);
        });

        it("reports a click", async () => {
            await setup();
            tabNamed(fixture, "b").click();
            await settle(fixture);
            expect(host.index()).toBe(1);
        });

        it("goes back to the selected tab when written out of range", async () => {
            await setup(undefined, 1);
            host.index.set(99);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("b");
            expect(host.index()).toBe(1);
        });

        it("goes back to the selected tab when written with a disabled tab's index", async () => {
            await setup([{ id: "a" }, { id: "b", disabled: true }, { id: "c" }]);
            host.index.set(1);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
            expect(host.index()).toBe(0);
        });

        it("follows the selected tab when a tab before it goes away", async () => {
            await setup(undefined, 2);
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "a"));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("c");
            expect(host.index()).toBe(1);
        });

        it("waits for tabs that arrive after the index", async () => {
            await setup([], 2);
            expect(host.index()).toBe(2);
            host.tabs.set([{ id: "a" }, { id: "b" }, { id: "c" }]);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("c");
            expect(host.index()).toBe(2);
        });
    });

    describe("selected on a tab", () => {
        it("selects the tab flagged on the first render", async () => {
            await setup([{ id: "a" }, { id: "b" }, { id: "c", selected: true }]);
            expect(selectedTitle(fixture)).toBe("c");
            expect(host.index()).toBe(2);
        });

        it("lets the first of two flagged tabs win", async () => {
            await setup([{ id: "a" }, { id: "b", selected: true }, { id: "c", selected: true }]);
            expect(selectedTitle(fixture)).toBe("b");
        });

        it("ignores a flag on a disabled tab", async () => {
            await setup([{ id: "a" }, { id: "b", disabled: true, selected: true }]);
            expect(selectedTitle(fixture)).toBe("a");
        });

        it("selects a tab flagged later", async () => {
            await setup();
            host.tabs.update(tabs => tabs.map(tab => (tab.id === "c" ? { ...tab, selected: true } : tab)));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("c");
            expect(host.index()).toBe(2);
        });

        it("stays in step both ways with [(selected)]", async () => {
            const twoWay = TestBed.createComponent(TwoWayHostComponent);
            await settle(twoWay);
            expect(selectedTitle(twoWay)).toBe("Second");
            expect(twoWay.componentInstance.firstSelected()).toBe(false);

            tabNamed(twoWay, "First").click();
            await settle(twoWay);
            expect(twoWay.componentInstance.firstSelected()).toBe(true);
            expect(twoWay.componentInstance.secondSelected()).toBe(false);

            twoWay.componentInstance.secondSelected.set(true);
            await settle(twoWay);
            expect(selectedTitle(twoWay)).toBe("Second");
            expect(twoWay.componentInstance.firstSelected()).toBe(false);
        });

        it("doesn't let a flag it has already dealt with take the selection back", async () => {
            await setup([{ id: "a", selected: true }, { id: "b" }, { id: "c" }]);
            tabNamed(fixture, "b").click();
            host.tabs.update(tabs => [...tabs, { id: "d" }]);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("b");
        });

        it("keeps a tab selected when its flag is turned off", async () => {
            await setup([{ id: "a", selected: true }, { id: "b" }]);
            host.tabs.update(tabs => tabs.map(tab => (tab.id === "a" ? { ...tab, selected: false } : tab)));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
            expect(host.selectedChanges.at(-1)).toEqual(["a", true]);
        });
    });

    describe("removing the selected tab", () => {
        it("selects the next tab and reports it, without a tabSelect", async () => {
            await setup(undefined, 2);
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "c"));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("d");
            expect(host.index()).toBe(2);
            expect(host.selectEvents).toEqual([]);
        });

        it("selects the previous tab when the last one goes", async () => {
            await setup(undefined, 3);
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "d"));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("c");
            expect(host.index()).toBe(2);
        });

        it("skips disabled neighbors", async () => {
            await setup([{ id: "a" }, { id: "b", disabled: true }, { id: "c" }, { id: "d", disabled: true }], 2);
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "c"));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
        });

        it("moves focus to the new tab when focus was on the removed one", async () => {
            await setup(undefined, 2);
            tabNamed(fixture, "c").focus();
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "c"));
            await settle(fixture);
            expect(document.activeElement).toBe(tabNamed(fixture, "d"));
        });

        it("moves focus to the new tab when the arrows had just moved focus to the removed one", async () => {
            await setup();
            const first = tabNamed(fixture, "a");
            first.focus();
            press(first, "End");
            await Promise.resolve();
            await settle(fixture);
            expect(document.activeElement).toBe(tabNamed(fixture, "d"));

            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "d"));
            await settle(fixture);

            expect(selectedTitle(fixture)).toBe("c");
            expect(document.activeElement).toBe(tabNamed(fixture, "c"));
        });

        it("leaves focus alone when it's elsewhere on the page", async () => {
            await setup(undefined, 2);
            const outside = fixture.nativeElement.querySelector("#outside") as HTMLButtonElement;
            tabNamed(fixture, "c").focus();
            outside.focus();
            await Promise.resolve();
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "c"));
            await settle(fixture);
            expect(document.activeElement).toBe(outside);
        });

        it("doesn't take focus when it left the strip for nowhere", async () => {
            await setup(undefined, 2);
            const tab = tabNamed(fixture, "c");
            tab.focus();
            tab.blur();
            await Promise.resolve();
            host.tabs.update(tabs => tabs.filter(item => item.id !== "c"));
            await settle(fixture);
            expect(document.activeElement).toBe(document.body);
        });

        it("moves focus to the new tab when the browser fires focusout while removing the tab", async () => {
            await setup(undefined, 2);
            const tab = tabNamed(fixture, "c");
            tab.focus();
            // jsdom runs a microtask as soon as the listener returns. A browser waits until the removal has finished.
            const microtasks: VoidFunction[] = [];
            const queue = vi.spyOn(globalThis, "queueMicrotask").mockImplementation(task => void microtasks.push(task));
            tab.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
            queue.mockRestore();
            tab.remove();
            microtasks.forEach(task => task());
            host.tabs.update(tabs => tabs.filter(item => item.id !== "c"));
            await settle(fixture);
            expect(document.activeElement).toBe(tabNamed(fixture, "d"));
        });

        it("leaves focus alone when something else took it as the tab went", async () => {
            await setup(undefined, 2);
            const outside = fixture.nativeElement.querySelector("#outside") as HTMLButtonElement;
            const tab = tabNamed(fixture, "c");
            tab.focus();
            tab.remove();
            outside.focus();
            await Promise.resolve();
            host.tabs.update(tabs => tabs.filter(item => item.id !== "c"));
            await settle(fixture);
            expect(document.activeElement).toBe(outside);
        });

        it("doesn't take focus when an unselected tab goes while focus is on another tab", async () => {
            await setup(undefined, 2);
            const tab = tabNamed(fixture, "c");
            tab.focus();
            host.tabs.update(tabs => tabs.filter(item => item.id !== "a"));
            await settle(fixture);
            expect(document.activeElement).toBe(tab);
        });

        it("selects nothing when every remaining tab is disabled, and recovers when one is enabled", async () => {
            await setup([{ id: "a" }, { id: "b", disabled: true }]);
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "a"));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBeUndefined();

            host.tabs.set([{ id: "b" }]);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("b");
        });
    });

    describe("disabled tabs", () => {
        it("starts on the first enabled tab", async () => {
            await setup([{ id: "a", disabled: true }, { id: "b" }, { id: "c" }]);
            expect(selectedTitle(fixture)).toBe("b");
            expect(host.index()).toBe(1);
        });

        it("doesn't select one on a click from code", async () => {
            await setup([{ id: "a" }, { id: "b", disabled: true }]);
            tabNamed(fixture, "b").click();
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
            expect(host.selectEvents).toEqual([]);
        });

        it("doesn't select any tab on a click when the whole list is disabled", async () => {
            await setup();
            host.disabled.set(true);
            await settle(fixture);
            tabNamed(fixture, "b").click();
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
            expect(host.selectEvents).toEqual([]);
        });

        it("moves from a selected tab that became disabled by its own position", async () => {
            await setup([{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }], 1);
            host.tabs.update(tabs => tabs.map(tab => (tab.id === "b" ? { ...tab, disabled: true } : tab)));
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("b");

            press(tabNamed(fixture, "b"), "ArrowRight");
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("c");
        });
    });

    describe("a vetoed tab", () => {
        it("moves focus past it while the selection stays", async () => {
            await setup();
            host.veto = [1];
            const first = tabNamed(fixture, "a");
            first.focus();

            press(first, "ArrowRight");
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
            expect(document.activeElement).toBe(tabNamed(fixture, "b"));

            press(tabNamed(fixture, "b"), "ArrowRight");
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("c");
            expect(document.activeElement).toBe(tabNamed(fixture, "c"));
        });

        it("closes the tab focus is on, not the selected one", async () => {
            await setup([
                { id: "a", closable: true },
                { id: "b", closable: true }
            ]);
            host.veto = [1];
            press(tabNamed(fixture, "a"), "ArrowRight");
            await settle(fixture);

            press(tabNamed(fixture, "b"), "Delete");
            expect(host.closeEvents.map(event => [event.index, event.selected])).toEqual([[1, false]]);
        });

        it("doesn't select or report the tab focus is already on", async () => {
            await setup();
            const first = tabNamed(fixture, "a");
            press(first, "Home");
            await settle(fixture);
            expect(host.selectEvents).toEqual([]);
        });
    });

    describe("closable tabs", () => {
        const closable = [
            { id: "a", closable: true },
            { id: "b", closable: true }
        ];

        it("passes axe", async () => {
            await setup(closable);
            const results = await axe.run(fixture.nativeElement);
            expect(results.violations).toEqual([]);
        });

        it("keeps the pointer's close button out of the tab and hidden from assistive technology", async () => {
            await setup(closable);
            const visible = fixture.nativeElement.querySelector("button[data-tab-close]") as HTMLElement;
            expect(visible.closest("[role='tab']")).toBeNull();
            expect(visible.closest("[role='tablist']")).not.toBeNull();
            expect(visible.getAttribute("aria-hidden")).toBe("true");
            expect(visible.tabIndex).toBe(-1);
        });

        it("offers assistive technology a named close button outside the tablist", async () => {
            await setup(closable);
            const button = fixture.nativeElement.querySelector(".sr-only button") as HTMLButtonElement;
            const tab = tabNamed(fixture, "a");
            expect(button.closest("[role='tablist']")).toBeNull();
            expect(button.getAttribute("aria-labelledby")).toBe(`${button.id} ${tab.id}`);
            expect(button.getAttribute("aria-label")).toBe("Close tab");
            expect(button.tabIndex).toBe(-1);

            button.click();
            expect(host.closeEvents.map(event => event.index)).toEqual([0]);
        });

        it("renders no hidden buttons when nothing can close", async () => {
            await setup();
            expect(fixture.nativeElement.querySelector(".sr-only")).toBeNull();
        });

        it("renders them for the list-wide closable too", async () => {
            await setup();
            host.closable.set(true);
            await settle(fixture);
            expect(fixture.nativeElement.querySelectorAll(".sr-only button").length).toBe(4);
        });

        it("disables both buttons on a disabled tab", async () => {
            await setup([{ id: "a" }, { id: "b", closable: true, disabled: true }]);
            const buttons = Array.from<HTMLButtonElement>(
                fixture.nativeElement.querySelectorAll("button[data-tab-close], .sr-only button")
            );
            expect(buttons.length).toBe(2);
            expect(buttons.every(button => button.disabled)).toBe(true);
        });

        it("announces Delete on a tab that can close, and only there", async () => {
            await setup([{ id: "a", closable: true }, { id: "b" }, { id: "c", closable: true, disabled: true }]);
            expect(tabNamed(fixture, "a").getAttribute("aria-keyshortcuts")).toBe("Delete Backspace");
            expect(tabNamed(fixture, "b").getAttribute("aria-keyshortcuts")).toBeNull();
            expect(tabNamed(fixture, "c").getAttribute("aria-keyshortcuts")).toBeNull();
        });

        it("doesn't select the tab when its close button is clicked", async () => {
            await setup(closable);
            const buttons = fixture.nativeElement.querySelectorAll("button[data-tab-close]");
            (buttons[1] as HTMLButtonElement).click();
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
            expect(host.closeEvents.map(event => [event.index, event.selected])).toEqual([[1, false]]);
        });

        it("moves focus to the selected tab after closing with the hidden button", async () => {
            await setup(closable);
            const button = fixture.nativeElement.querySelector(".sr-only button") as HTMLButtonElement;
            button.focus();
            host.tabs.update(tabs => tabs.filter(tab => tab.id !== "a"));
            await settle(fixture);
            expect(document.activeElement).toBe(tabNamed(fixture, "b"));
        });

        it("leaves keys on a close button alone", async () => {
            await setup(closable);
            const button = fixture.nativeElement.querySelector(".sr-only button") as HTMLButtonElement;
            expect(press(button, "End").defaultPrevented).toBe(false);
            await settle(fixture);
            expect(selectedTitle(fixture)).toBe("a");
        });
    });

    describe("naming the tab list", () => {
        it("puts aria-label on the list, not the host", async () => {
            await setup();
            host.label.set("Reports");
            await settle(fixture);
            const list = fixture.nativeElement.querySelector("[role='tablist']") as HTMLElement;
            const tabs = fixture.nativeElement.querySelector("mona-tabs") as HTMLElement;
            expect(list.getAttribute("aria-label")).toBe("Reports");
            expect(tabs.hasAttribute("aria-label")).toBe(false);
        });

        it("puts aria-labelledby on the list, not the host", async () => {
            await setup();
            host.labelledBy.set("heading");
            await settle(fixture);
            const list = fixture.nativeElement.querySelector("[role='tablist']") as HTMLElement;
            const tabs = fixture.nativeElement.querySelector("mona-tabs") as HTMLElement;
            expect(list.getAttribute("aria-labelledby")).toBe("heading");
            expect(tabs.hasAttribute("aria-labelledby")).toBe(false);
        });

        it("doesn't leave a static name on the host", async () => {
            const named = TestBed.createComponent(StaticNameHostComponent);
            await settle(named);
            const list = named.nativeElement.querySelector("[role='tablist']") as HTMLElement;
            const tabs = named.nativeElement.querySelector("mona-tabs") as HTMLElement;
            expect(list.getAttribute("aria-label")).toBe("Reports");
            expect(list.getAttribute("aria-labelledby")).toBe("heading");
            expect(tabs.hasAttribute("aria-label")).toBe(false);
            expect(tabs.hasAttribute("aria-labelledby")).toBe(false);
        });

        it("sets neither when nothing is given", async () => {
            await setup();
            const list = fixture.nativeElement.querySelector("[role='tablist']") as HTMLElement;
            expect(list.hasAttribute("aria-label")).toBe(false);
            expect(list.hasAttribute("aria-labelledby")).toBe(false);
        });
    });

    describe("keys", () => {
        it.each(["Home", "End"])("prevents the page scrolling on %s", async key => {
            await setup(undefined, 1);
            expect(press(tabNamed(fixture, "b"), key).defaultPrevented).toBe(true);
        });

        it.each(["Delete", "Backspace"])("prevents the default of %s when it closes a tab", async key => {
            await setup([{ id: "a", closable: true }]);
            expect(press(tabNamed(fixture, "a"), key).defaultPrevented).toBe(true);
            expect(host.closeEvents.length).toBe(1);
        });

        it.each(["Delete", "Backspace"])("leaves %s alone when the tab can't close", async key => {
            await setup([{ id: "a" }]);
            expect(press(tabNamed(fixture, "a"), key).defaultPrevented).toBe(false);
        });

        it.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }])(
            "leaves a modified arrow to the browser: %o",
            async modifier => {
                await setup();
                expect(press(tabNamed(fixture, "a"), "ArrowRight", modifier).defaultPrevented).toBe(false);
                await settle(fixture);
                expect(selectedTitle(fixture)).toBe("a");
            }
        );

        it("leaves Alt+Tab and Ctrl+Tab to the browser", async () => {
            await setup();
            expect(press(tabNamed(fixture, "a"), "Tab", { ctrlKey: true }).defaultPrevented).toBe(false);
        });

        it("moves Tab into the selected panel, whichever tab has focus", async () => {
            await setup();
            host.veto = [1];
            press(tabNamed(fixture, "a"), "ArrowRight");
            await settle(fixture);

            expect(press(tabNamed(fixture, "b"), "Tab").defaultPrevented).toBe(true);
            expect((document.activeElement as HTMLElement).id).toBe(
                `${tabNamed(fixture, "a").id.replace(/-tab$/, "")}-panel`
            );
        });

        it("finds the panel inside a shadow root", async () => {
            await setup();
            const shadowHost = document.createElement("div");
            document.body.appendChild(shadowHost);
            const root = shadowHost.attachShadow({ mode: "open" });
            root.appendChild(fixture.nativeElement);
            await settle(fixture);
            const lookup = vi.spyOn(document, "getElementById");

            press(tabNamed(fixture, "a"), "Tab");

            expect(lookup).not.toHaveBeenCalled();
            expect((root.activeElement as HTMLElement | null)?.getAttribute("role")).toBe("tabpanel");
            lookup.mockRestore();
            shadowHost.remove();
        });
    });

    describe("scrolling the strip", () => {
        function stubGeometry(list: HTMLElement, tab: HTMLElement): void {
            list.getBoundingClientRect = () => ({ left: 0, right: 100, top: 0, bottom: 40 }) as DOMRect;
            tab.getBoundingClientRect = () => ({ left: 250, right: 300, top: 0, bottom: 40 }) as DOMRect;
        }

        it("scrolls only the strip to a tab selected by code", async () => {
            await setup();
            const list = fixture.nativeElement.querySelector("[role='tablist']") as HTMLElement;
            const scrollBy = vi.fn();
            const scrollIntoView = vi.fn();
            Object.defineProperty(list, "scrollBy", { configurable: true, value: scrollBy });
            const tab = tabNamed(fixture, "d");
            tab.scrollIntoView = scrollIntoView;
            stubGeometry(list, tab);

            host.index.set(3);
            await settle(fixture);

            expect(scrollBy).toHaveBeenCalledWith({ left: 200 });
            expect(scrollIntoView).not.toHaveBeenCalled();
        });

        it("doesn't scroll when the selected tab is in view", async () => {
            await setup();
            const list = fixture.nativeElement.querySelector("[role='tablist']") as HTMLElement;
            const scrollBy = vi.fn();
            Object.defineProperty(list, "scrollBy", { configurable: true, value: scrollBy });
            host.index.set(1);
            await settle(fixture);
            expect(scrollBy).not.toHaveBeenCalled();
        });

        it("skips the smooth animation for reduced motion", async () => {
            const matchMedia = vi.fn().mockReturnValue({ matches: true });
            vi.stubGlobal("matchMedia", matchMedia);
            try {
                await setup();
                const list = fixture.nativeElement.querySelector("[role='tablist']") as HTMLElement;
                const scrollBy = vi.fn();
                Object.defineProperty(list, "scrollBy", { configurable: true, value: scrollBy });
                Object.defineProperty(list, "scrollWidth", { configurable: true, value: 200 });
                Object.defineProperty(list, "clientWidth", { configurable: true, value: 100 });
                host.tabs.update(tabs => [...tabs]);
                host.tabs.update(tabs => [...tabs, { id: "e" }]);
                await settle(fixture);
                await new Promise(resolve => setTimeout(resolve));
                await settle(fixture);
                const next = fixture.nativeElement.querySelectorAll(
                    "button[aria-hidden='true']:not([data-tab-close])"
                )[1];
                (next as HTMLButtonElement).click();
                await vi.waitFor(() => expect(scrollBy).toHaveBeenCalledWith({ left: 100, behavior: "auto" }));
            } finally {
                vi.unstubAllGlobals();
            }
        });
    });

    describe("axe", () => {
        it("passes with plain tabs", async () => {
            await setup();
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });

        it("passes with a name and a disabled tab", async () => {
            await setup([{ id: "a" }, { id: "b", disabled: true }]);
            host.label.set("Reports");
            await settle(fixture);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });
    });

    describe("styles", () => {
        it("uses a solid inset outline on the tab and no ring", () => {
            const classes = tabListTabThemeVariants({ position: "top", size: "medium" }).split(/\s+/);
            expect(classes).toContain("focus-visible:outline-2");
            expect(classes).toContain("focus-visible:-outline-offset-2");
            expect(classes).toContain("focus-visible:outline-focus-indicator");
            expect(classes).not.toContain("outline-none");
            expect(classes.some(name => name.includes("ring"))).toBe(false);
        });

        it("keeps the selected indicator in forced colors", () => {
            const classes = tabListListItemThemeVariants({
                active: true,
                disabled: false,
                position: "top",
                size: "medium"
            }).split(/\s+/);
            expect(classes).toContain("forced-colors:after:bg-[Highlight]");
            expect(classes).toContain("after:forced-color-adjust-none");
        });

        it("gives the close button a 24 pixel target", () => {
            expect(tabListCloseButtonThemeVariants().split(/\s+/)).toContain("before:-inset-1");
        });

        it("doesn't cancel the panel's focus outline", async () => {
            await setup();
            const panel = fixture.nativeElement.querySelector("[role='tabpanel']") as HTMLElement;
            expect(panel.classList.contains("outline-none")).toBe(false);
            expect(panel.classList.contains("focus-visible:outline-2")).toBe(true);
        });
    });
});
