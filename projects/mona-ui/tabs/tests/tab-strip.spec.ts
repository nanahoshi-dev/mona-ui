import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, computed, signal, viewChildren } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import { moveItem } from "@nanahoshi/mona-ui/sortable";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TabStripComponent } from "../components/tab-strip/tab-strip.component";
import { TabComponent } from "../components/tab/tab.component";
import { TabTitleTemplateDirective } from "../directives/tab-title-template.directive";
import type { TabCloseEvent } from "../models/TabCloseEvent";
import type { TabReorderEvent } from "../models/TabReorderEvent";
import type { TabSelectEvent } from "../models/TabSelectEvent";
import type { TabsLook } from "../models/TabsLook";

interface Place {
    readonly closable?: boolean;
    readonly disabled?: boolean;
    readonly key: string;
    readonly title: string;
}

/** A titlebar: the strip, a new-tab button right after it, and the one panel the selected tab shows, elsewhere. */
@Component({
    template: `
        <div class="flex" data-titlebar>
            <mona-tab-strip
                aria-label="Open locations"
                [class]="stripClass()"
                [closable]="closable()"
                [disabled]="disabled()"
                [look]="look()"
                [sortable]="sortable()"
                [(selectedIndex)]="index"
                (tabClose)="onClose($event)"
                (tabReorder)="onReorder($event)"
                (tabSelect)="onSelect($event)">
                @for (place of places(); track place.key) {
                    <mona-tab
                        [closable]="!!place.closable"
                        [disabled]="!!place.disabled"
                        [panelId]="panelId()"
                        [tabId]="namedIds() ? place.key + '-tab' : ''"
                        [title]="place.title">
                        <ng-template monaTabTitleTemplate>
                            <svg aria-hidden="true" data-icon></svg>
                            <span>{{ place.title }}</span>
                        </ng-template>
                    </mona-tab>
                }
            </mona-tab-strip>
            <button type="button" aria-label="New tab" data-new-tab>+</button>
        </div>
        <div id="location-view" role="tabpanel" tabindex="0" [attr.aria-labelledby]="selectedTabId()">
            <p>Files in {{ places()[index()]?.title }}</p>
        </div>
    `,
    imports: [TabComponent, TabStripComponent, TabTitleTemplateDirective]
})
class TitlebarHostComponent {
    public readonly closable = signal(false);
    public readonly closeEvents: TabCloseEvent[] = [];
    public readonly disabled = signal(false);
    public readonly index = signal(0);
    public readonly look = signal<TabsLook>("pill");
    public readonly namedIds = signal(true);
    public readonly panelId = signal("location-view");
    public readonly places = signal<readonly Place[]>([
        { key: "pc", title: "This PC" },
        { key: "docs", title: "Documents" },
        { key: "music", title: "Music" }
    ]);
    public readonly reorders: TabReorderEvent[] = [];
    public readonly selectEvents: TabSelectEvent[] = [];
    /** The panel is labelled by the selected tab, whose id the consumer reads back from the tab. */
    public readonly selectedTabId = computed(() => this.tabComponents()[this.index()]?.tabId() ?? null);
    public readonly sortable = signal(false);
    public readonly stripClass = signal("");
    public readonly tabComponents = viewChildren(TabComponent);
    public veto: readonly number[] = [];

    public onClose(event: TabCloseEvent): void {
        this.closeEvents.push(event);
    }

    public onReorder(event: TabReorderEvent): void {
        this.reorders.push(event);
        this.places.update(places => moveItem(places, event.previousIndex, event.currentIndex));
    }

    public onSelect(event: TabSelectEvent): void {
        this.selectEvents.push(event);
        if (this.veto.includes(event.index)) {
            event.preventDefault();
        }
    }
}

describe("mona-tab-strip", () => {
    let fixture: ComponentFixture<TitlebarHostComponent>;
    let host: TitlebarHostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function tabs(): HTMLElement[] {
        return Array.from(root.querySelectorAll<HTMLElement>("[role='tab']"));
    }

    function tab(title: string): HTMLElement {
        const element = tabs().find(candidate => candidate.textContent?.trim() === title);
        if (!element) {
            throw new Error(`No tab named ${title}`);
        }
        return element;
    }

    function item(title: string): HTMLElement {
        return tab(title).closest("li") as HTMLElement;
    }

    function selectedTitle(): string | undefined {
        return tabs()
            .find(element => element.getAttribute("aria-selected") === "true")
            ?.textContent?.trim();
    }

    function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
        target.dispatchEvent(event);
        return event;
    }

    function mouse(target: Element, type: "auxclick" | "mousedown", button: number): MouseEvent {
        const event = new MouseEvent(type, { bubbles: true, cancelable: true, button });
        target.dispatchEvent(event);
        return event;
    }

    function panel(): HTMLElement {
        return root.querySelector("#location-view") as HTMLElement;
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [{ provide: LiveAnnouncer, useValue: { announce: vi.fn().mockResolvedValue(undefined) } }]
        });
        fixture = TestBed.createComponent(TitlebarHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
    });

    describe("pairing with a panel rendered elsewhere", () => {
        it("renders the tab list and no panel of its own", () => {
            const strip = root.querySelector("mona-tab-strip") as HTMLElement;
            expect(strip.querySelector("[role='tablist']")?.getAttribute("aria-label")).toBe("Open locations");
            expect(strip.querySelectorAll("[role='tabpanel']").length).toBe(0);
            expect(root.querySelectorAll("[role='tabpanel']").length).toBe(1);
            expect(tabs().map(element => element.textContent?.trim())).toEqual(["This PC", "Documents", "Music"]);
        });

        it("gives each tab the id it's given and points it at the named panel", () => {
            expect(tabs().map(element => element.id)).toEqual(["pc-tab", "docs-tab", "music-tab"]);
            for (const element of tabs()) {
                expect(element.getAttribute("aria-controls")).toBe("location-view");
            }
        });

        it("lets the panel be labelled by the selected tab as the selection moves", async () => {
            expect(panel().getAttribute("aria-labelledby")).toBe("pc-tab");

            tab("Music").click();
            await settle();

            expect(host.index()).toBe(2);
            expect(panel().getAttribute("aria-labelledby")).toBe("music-tab");
            expect(panel().textContent).toContain("Files in Music");
        });

        it("generates a unique id for a tab bound to an empty one", async () => {
            host.namedIds.set(false);
            await settle();

            const ids = tabs().map(element => element.id);
            expect(new Set(ids).size).toBe(3);
            for (const id of ids) {
                expect(id).toMatch(/^mona-[0-9a-f]+-tab$/);
            }
        });

        it("reads a generated id back from tabId when none is bound", async () => {
            @Component({
                template: `
                    <mona-tab-strip aria-label="Places">
                        <mona-tab title="Home"></mona-tab>
                    </mona-tab-strip>
                `,
                imports: [TabComponent, TabStripComponent]
            })
            class UnnamedHostComponent {
                public readonly tabComponents = viewChildren(TabComponent);
            }
            const unnamed = TestBed.createComponent(UnnamedHostComponent);
            unnamed.detectChanges();
            await unnamed.whenStable();
            unnamed.detectChanges();

            const element = (unnamed.nativeElement as HTMLElement).querySelector("[role='tab']") as HTMLElement;
            expect(element.id).toMatch(/^mona-[0-9a-f]+-tab$/);
            expect(unnamed.componentInstance.tabComponents()[0].tabId()).toBe(element.id);
            unnamed.destroy();
        });

        it("names no panel when the tab doesn't name one", async () => {
            host.panelId.set("");
            await settle();
            for (const element of tabs()) {
                expect(element.hasAttribute("aria-controls")).toBe(false);
            }
        });

        it.each<TabsLook>(["line", "pill"])("passes axe with the %s look", async look => {
            host.look.set(look);
            host.closable.set(true);
            await settle();
            const results = await axe.run(root, { rules: { region: { enabled: false } } });
            expect(results.violations.map(violation => violation.id)).toEqual([]);
        });
    });

    describe("selectedIndex", () => {
        it("selects the tab a written index names, without a tabSelect", async () => {
            host.index.set(1);
            await settle();
            expect(selectedTitle()).toBe("Documents");
            expect(host.selectEvents).toEqual([]);
        });

        it("reports a click, and lets tabSelect veto it", async () => {
            host.veto = [1];
            tab("Documents").click();
            await settle();
            expect(selectedTitle()).toBe("This PC");
            expect(host.index()).toBe(0);

            tab("Music").click();
            await settle();
            expect(host.selectEvents.map(event => event.index)).toEqual([1, 2]);
            expect(host.index()).toBe(2);
        });

        it("moves to the neighbor when the selected tab goes away", async () => {
            host.index.set(1);
            await settle();
            host.places.update(places => places.filter(place => place.key !== "docs"));
            await settle();
            expect(selectedTitle()).toBe("Music");
            expect(host.index()).toBe(1);
            expect(panel().getAttribute("aria-labelledby")).toBe("music-tab");
        });
    });

    describe("keyboard", () => {
        it("moves focus and the selection with the arrows, Home and End, keeping one tab stop", async () => {
            tab("This PC").focus();

            press(tab("This PC"), "ArrowRight");
            await settle();
            expect(document.activeElement).toBe(tab("Documents"));
            expect(selectedTitle()).toBe("Documents");

            press(tab("Documents"), "End");
            await settle();
            expect(document.activeElement).toBe(tab("Music"));

            press(tab("Music"), "ArrowRight");
            await settle();
            expect(document.activeElement).toBe(tab("This PC"));

            press(tab("This PC"), "ArrowLeft");
            await settle();
            press(tab("Music"), "Home");
            await settle();
            expect(selectedTitle()).toBe("This PC");
            expect(host.index()).toBe(0);
            expect(tabs().map(element => element.tabIndex)).toEqual([0, -1, -1]);
        });

        it("leaves Tab to the browser, so focus goes on to what follows the strip", async () => {
            tab("This PC").focus();
            const event = press(tab("This PC"), "Tab");
            expect(event.defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(tab("This PC"));
        });

        it("closes the focused tab with Delete when it can close", async () => {
            host.closable.set(true);
            await settle();
            tab("Documents").focus();
            const event = press(tab("Documents"), "Delete");
            expect(event.defaultPrevented).toBe(true);
            expect(host.closeEvents.map(close => close.index)).toEqual([1]);
        });
    });

    describe("middle-click", () => {
        it("requests the close of a closable tab, without selecting it", async () => {
            host.closable.set(true);
            await settle();

            const event = mouse(item("Music"), "auxclick", 1);
            await settle();

            expect(event.defaultPrevented).toBe(true);
            expect(host.closeEvents.length).toBe(1);
            expect(host.closeEvents[0].index).toBe(2);
            expect(host.closeEvents[0].selected).toBe(false);
            expect(host.closeEvents[0].originalEvent).toBe(event);
            expect(selectedTitle()).toBe("This PC");
            expect(host.selectEvents).toEqual([]);
        });

        it("reports when the tab closed is the selected one", async () => {
            host.closable.set(true);
            await settle();
            mouse(tab("This PC"), "auxclick", 1);
            expect(host.closeEvents.map(close => [close.index, close.selected])).toEqual([[0, true]]);
        });

        it("closes a tab whose own closable is on", async () => {
            host.places.update(places => places.map(place => ({ ...place, closable: place.key === "docs" })));
            await settle();

            mouse(tab("This PC"), "auxclick", 1);
            mouse(tab("Documents"), "auxclick", 1);

            expect(host.closeEvents.map(close => close.index)).toEqual([1]);
        });

        it("keeps the middle button from starting to autoscroll over a tab it closes", async () => {
            expect(mouse(item("Documents"), "mousedown", 1).defaultPrevented).toBe(false);
            host.closable.set(true);
            await settle();
            expect(mouse(item("Documents"), "mousedown", 1).defaultPrevented).toBe(true);
            expect(mouse(item("Documents"), "mousedown", 0).defaultPrevented).toBe(false);
        });

        it("does nothing on a tab that can't close, a disabled tab, or for another button", async () => {
            mouse(item("Documents"), "auxclick", 1);
            host.closable.set(true);
            host.places.update(places => places.map(place => ({ ...place, disabled: place.key === "music" })));
            await settle();
            mouse(item("Music"), "auxclick", 1);
            mouse(item("Documents"), "auxclick", 2);

            expect(host.closeEvents).toEqual([]);

            host.disabled.set(true);
            await settle();
            mouse(item("Documents"), "auxclick", 1);
            expect(host.closeEvents).toEqual([]);
        });
    });

    describe("reordering", () => {
        it("emits tabReorder for Control+Shift and the arrows, Home and End, and keeps the moved tab selected", async () => {
            host.sortable.set(true);
            await settle();
            tab("This PC").focus();

            press(tab("This PC"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(tabs().map(element => element.textContent?.trim())).toEqual(["Documents", "This PC", "Music"]);
            expect(selectedTitle()).toBe("This PC");
            expect(host.index()).toBe(1);
            expect(document.activeElement).toBe(tab("This PC"));

            press(tab("This PC"), "End", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(tabs().map(element => element.textContent?.trim())).toEqual(["Documents", "Music", "This PC"]);

            press(tab("This PC"), "Home", { ctrlKey: true, shiftKey: true });
            await settle();

            expect(host.reorders.map(event => [event.previousIndex, event.currentIndex])).toEqual([
                [0, 1],
                [1, 2],
                [2, 0]
            ]);
            expect(tabs().map(element => element.textContent?.trim())).toEqual(["This PC", "Documents", "Music"]);
            expect(host.index()).toBe(0);
            expect(panel().getAttribute("aria-labelledby")).toBe("pc-tab");
        });

        it("doesn't reorder when sortable is off", async () => {
            tab("This PC").focus();
            press(tab("This PC"), "ArrowRight", { ctrlKey: true, shiftKey: true });
            await settle();
            expect(host.reorders).toEqual([]);
        });
    });

    describe("title template", () => {
        it("renders the icon and the label inside the tab", () => {
            const element = tab("Documents");
            expect(element.querySelector("svg[data-icon]")).not.toBeNull();
            expect(element.querySelector("span")?.textContent).toBe("Documents");
        });
    });

    describe("the pill look", () => {
        it("raises the selected tab on the pill background and leaves the others to hover", () => {
            const selected = item("This PC").className.split(/\s+/);
            const other = item("Documents").className.split(/\s+/);

            expect(selected).toContain("rounded-md");
            expect(selected).toContain(
                "[background-color:var(--mona-tab-pill-background,var(--color-surface-raised))]"
            );
            expect(selected).toContain("shadow-(--shadow-raised)");
            expect(other).toContain("rounded-md");
            expect(other).toContain("hover:bg-hover");
            expect(other).not.toContain("shadow-(--shadow-raised)");
        });

        it("draws no indicator line and no rule under the strip", () => {
            const selected = item("This PC").className;
            expect(selected).not.toContain("after:h-[2px]");
            expect(selected).not.toContain("after:bg-[var(--mona-indicator-color");
            expect(root.querySelector("mona-tab-list")?.className).not.toContain("border-b");
        });

        it("keeps one weight, so selecting a tab doesn't shift the strip", () => {
            for (const element of [item("This PC"), item("Documents")]) {
                expect(element.className.split(/\s+/)).toContain("font-medium");
                expect(element.className).not.toContain("font-semibold");
            }
        });

        it("rings the selected tab in forced colors, and in the text color for more contrast", () => {
            const selected = item("This PC").className.split(/\s+/);
            expect(selected).toContain("forced-colors:after:border-2");
            expect(selected).toContain("forced-colors:after:border-[Highlight]");
            expect(selected).toContain("after:forced-color-adjust-none");
            expect(selected).toContain("contrast-more:after:border-2");
            expect(selected).toContain("after:border-current");
            expect(item("Documents").className).not.toContain("forced-colors:after:border-2");
        });

        it("rounds the focus outline with the pill", () => {
            expect(tab("This PC").className.split(/\s+/)).toContain("rounded-md");
            expect(tab("This PC").className.split(/\s+/)).toContain("focus-visible:outline-2");
        });

        it("goes back to the line look's indicator and rule", async () => {
            host.look.set("line");
            await settle();
            expect(item("This PC").className).toContain("after:h-[2px]");
            expect(item("This PC").className).not.toContain("shadow-(--shadow-raised)");
            expect(root.querySelector("mona-tab-list")?.className).toContain("border-b");
        });
    });

    describe("in a flex row", () => {
        it("can shrink below its tabs' width and takes classes for the row", async () => {
            host.stripClass.set("shrink");
            await settle();
            const strip = root.querySelector("mona-tab-strip") as HTMLElement;
            expect(strip.className.split(/\s+/)).toEqual(expect.arrayContaining(["flex", "min-w-0", "shrink"]));
            expect(strip.hasAttribute("aria-label")).toBe(false);
            expect(strip.nextElementSibling?.hasAttribute("data-new-tab")).toBe(true);
        });

        it("shows the pointer's scroll buttons when the tabs overflow", async () => {
            const list = root.querySelector("[role='tablist']") as HTMLElement;
            Object.defineProperty(list, "scrollWidth", { configurable: true, value: 400 });
            Object.defineProperty(list, "clientWidth", { configurable: true, value: 120 });
            host.places.update(places => [...places, { key: "pics", title: "Pictures" }]);
            await settle();
            await new Promise(resolve => setTimeout(resolve));
            await settle();

            const buttons = root.querySelectorAll("mona-tab-strip button[aria-hidden='true']:not([data-tab-close])");
            expect(buttons.length).toBe(2);
            for (const button of Array.from(buttons)) {
                expect(button.getAttribute("tabindex")).toBe("-1");
            }
        });
    });
});
