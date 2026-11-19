import { LiveAnnouncer } from "@angular/cdk/a11y";
import { Component, signal } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { moveItem } from "@nanahoshi/mona-ui/sortable";
import axe from "axe-core";
import { TabComponent } from "../components/tab/tab.component";
import { TabsComponent } from "../components/tabs/tabs.component";
import type { TabReorderEvent } from "../models/TabReorderEvent";
import type { TabsPosition } from "../models/TabsPosition";

@Component({
    imports: [TabComponent, TabsComponent],
    template: `
        <mona-tabs
            aria-label="Documents"
            [closable]="closable()"
            [position]="position()"
            [sortable]="sortable()"
            [(selectedIndex)]="selectedIndex"
            (tabReorder)="onReorder($event)">
            @for (title of titles(); track title) {
                <mona-tab [title]="title" [disabled]="title === disabledTitle()">{{ title }} content</mona-tab>
            }
        </mona-tabs>
    `
})
class SortableTabsHostComponent {
    public readonly closable = signal(false);
    public readonly disabledTitle = signal<string | null>(null);
    public readonly position = signal<TabsPosition>("top");
    public readonly reorders: TabReorderEvent[] = [];
    public readonly selectedIndex = signal(0);
    public readonly sortable = signal(true);
    public readonly titles = signal(["Notes", "Plan", "Budget"]);

    public onReorder(event: TabReorderEvent): void {
        this.reorders.push(event);
        this.titles.update(titles => moveItem(titles, event.previousIndex, event.currentIndex));
    }
}

describe("TabsComponent sortable", () => {
    let announce: ReturnType<typeof vi.fn>;
    let fixture: ComponentFixture<SortableTabsHostComponent>;
    let host: SortableTabsHostComponent;
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
        return tabs().find(element => element.textContent?.trim() === title)!;
    }

    async function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}): Promise<KeyboardEvent> {
        const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...init });
        target.dispatchEvent(event);
        await settle();
        return event;
    }

    beforeEach(async () => {
        announce = vi.fn().mockResolvedValue(undefined);
        TestBed.configureTestingModule({ providers: [{ provide: LiveAnnouncer, useValue: { announce } }] });
        fixture = TestBed.createComponent(SortableTabsHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        document.body.append(root);
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
        root.remove();
    });

    it("emits tabReorder for Control+Shift+ArrowRight, and keeps the moved tab selected and focused", async () => {
        tab("Notes").focus();

        await press(tab("Notes"), "ArrowRight", { ctrlKey: true, shiftKey: true });

        expect(host.reorders.map(event => [event.previousIndex, event.currentIndex])).toEqual([[0, 1]]);
        expect(host.reorders[0].originalEvent).toBeInstanceOf(KeyboardEvent);
        expect(tabs().map(element => element.textContent?.trim())).toEqual(["Plan", "Notes", "Budget"]);
        expect(tab("Notes").getAttribute("aria-selected")).toBe("true");
        expect(host.selectedIndex()).toBe(1);
        expect(document.activeElement).toBe(tab("Notes"));
        expect(announce).toHaveBeenCalledWith("Notes moved to position 2 of 3");
    });

    it("moves to the end with End and mirrors the arrows from right to left", async () => {
        tab("Notes").focus();
        await press(tab("Notes"), "End", { ctrlKey: true, shiftKey: true });
        expect(tabs().map(element => element.textContent?.trim())).toEqual(["Plan", "Budget", "Notes"]);

        root.querySelector("mona-tabs")!.setAttribute("dir", "rtl");
        await settle();
        await press(tab("Notes"), "ArrowLeft", { ctrlKey: true, shiftKey: true });
        expect(tabs().map(element => element.textContent?.trim())).toEqual(["Plan", "Budget", "Notes"]);
        await press(tab("Notes"), "ArrowRight", { ctrlKey: true, shiftKey: true });
        expect(tabs().map(element => element.textContent?.trim())).toEqual(["Plan", "Notes", "Budget"]);
    });

    it("sorts vertical tabs with ArrowUp and ArrowDown", async () => {
        host.position.set("left");
        await settle();
        tab("Budget").focus();

        await press(tab("Budget"), "ArrowUp", { ctrlKey: true, shiftKey: true });

        expect(tabs().map(element => element.textContent?.trim())).toEqual(["Notes", "Budget", "Plan"]);
    });

    it("still moves between tabs with the arrow keys alone", async () => {
        tab("Notes").focus();

        await press(tab("Notes"), "ArrowRight");

        expect(host.reorders).toEqual([]);
        expect(document.activeElement).toBe(tab("Plan"));
        expect(tab("Plan").getAttribute("aria-selected")).toBe("true");
    });

    it("names the move shortcuts on each tab, after Delete and Backspace when it closes", async () => {
        expect(tab("Plan").getAttribute("aria-keyshortcuts")).toBe(
            "Control+Shift+ArrowLeft Control+Shift+ArrowRight Control+Shift+Home Control+Shift+End"
        );
        host.closable.set(true);
        await settle();
        expect(tab("Plan").getAttribute("aria-keyshortcuts")).toBe(
            "Delete Backspace Control+Shift+ArrowLeft Control+Shift+ArrowRight Control+Shift+Home Control+Shift+End"
        );
        expect(root.querySelector("li")!.hasAttribute("aria-keyshortcuts")).toBe(false);
    });

    it("doesn't move a disabled tab, or any tab when sortable is off", async () => {
        host.disabledTitle.set("Plan");
        await settle();
        tab("Plan").focus();
        await press(tab("Plan"), "ArrowRight", { ctrlKey: true, shiftKey: true });
        expect(tab("Plan").hasAttribute("aria-keyshortcuts")).toBe(false);

        host.disabledTitle.set(null);
        host.sortable.set(false);
        await settle();
        tab("Notes").focus();
        await press(tab("Notes"), "ArrowRight", { ctrlKey: true, shiftKey: true });

        expect(host.reorders).toEqual([]);
        expect(tab("Notes").hasAttribute("aria-keyshortcuts")).toBe(false);
    });

    it("passes axe", async () => {
        host.closable.set(true);
        await settle();

        const results = await axe.run(root, {
            rules: { "color-contrast": { enabled: false }, region: { enabled: false } }
        });

        expect(results.violations.map(violation => violation.id)).toEqual([]);
    });
});
