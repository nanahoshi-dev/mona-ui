import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TabComponent } from "../components/tab/tab.component";
import { TabsComponent } from "../components/tabs/tabs.component";
import { TabContentTemplateDirective } from "../directives/tab-content-template.directive";
import type { TabCloseEvent } from "../models/TabCloseEvent";
import type { TabsLook } from "../models/TabsLook";

@Component({
    template: `
        <mona-tabs aria-label="Settings" [closable]="closable()" [look]="look()" (tabClose)="onClose($event)">
            <mona-tab title="General" [tabId]="tabId()" [panelId]="panelId()">
                <ng-template monaTabContentTemplate><p>General settings</p></ng-template>
            </mona-tab>
            <mona-tab title="Privacy">
                <ng-template monaTabContentTemplate><p>Privacy settings</p></ng-template>
            </mona-tab>
        </mona-tabs>
    `,
    imports: [TabComponent, TabContentTemplateDirective, TabsComponent]
})
class NamedTabsHostComponent {
    public readonly closable = signal(false);
    public readonly closeEvents: TabCloseEvent[] = [];
    public readonly look = signal<TabsLook>("line");
    public readonly panelId = signal("general-panel");
    public readonly tabId = signal("general-tab");

    public onClose(event: TabCloseEvent): void {
        this.closeEvents.push(event);
    }
}

describe("mona-tabs ids, look and middle-click", () => {
    let fixture: ComponentFixture<NamedTabsHostComponent>;
    let host: NamedTabsHostComponent;
    let root: HTMLElement;

    async function settle(): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    function tab(title: string): HTMLElement {
        return Array.from(root.querySelectorAll<HTMLElement>("[role='tab']")).find(
            element => element.textContent?.trim() === title
        ) as HTMLElement;
    }

    function panelOf(tabElement: HTMLElement): HTMLElement {
        return root.querySelector(`#${tabElement.getAttribute("aria-controls")}`) as HTMLElement;
    }

    beforeEach(async () => {
        fixture = TestBed.createComponent(NamedTabsHostComponent);
        host = fixture.componentInstance;
        root = fixture.nativeElement as HTMLElement;
        await settle();
    });

    afterEach(() => {
        fixture.destroy();
    });

    describe("ids the consumer sets", () => {
        it("renders the tab and its panel with them, still paired both ways", () => {
            const general = tab("General");
            expect(general.id).toBe("general-tab");
            expect(general.getAttribute("aria-controls")).toBe("general-panel");
            const panel = root.querySelector("#general-panel") as HTMLElement;
            expect(panel.getAttribute("role")).toBe("tabpanel");
            expect(panel.getAttribute("aria-labelledby")).toBe("general-tab");
        });

        it("generates both for a tab that sets neither, still paired", () => {
            const privacy = tab("Privacy");
            const panel = panelOf(privacy);
            expect(privacy.id).toMatch(/^mona-[0-9a-f]+-tab$/);
            expect(panel.getAttribute("role")).toBe("tabpanel");
            expect(panel.getAttribute("aria-labelledby")).toBe(privacy.id);
        });

        it("generates a panel id when the one given is empty", async () => {
            host.panelId.set("");
            await settle();
            const panel = panelOf(tab("General"));
            expect(panel.id).toMatch(/^mona-[0-9a-f]+-panel$/);
            expect(panel.getAttribute("aria-labelledby")).toBe("general-tab");
        });

        it("follows a changed id", async () => {
            host.tabId.set("first-tab");
            await settle();
            expect(tab("General").id).toBe("first-tab");
            expect((root.querySelector("#general-panel") as HTMLElement).getAttribute("aria-labelledby")).toBe(
                "first-tab"
            );
        });

        it("moves Tab into the named panel", () => {
            tab("General").focus();
            const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" });
            tab("General").dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
            expect(document.activeElement?.id).toBe("general-panel");
        });

        it("passes axe", async () => {
            expect((await axe.run(root)).violations).toEqual([]);
        });
    });

    describe("the pill look", () => {
        it("raises the selected tab and drops the indicator and the rule", async () => {
            host.look.set("pill");
            await settle();
            const selected = (tab("General").closest("li") as HTMLElement).className.split(/\s+/);
            expect(selected).toContain("shadow-(--shadow-raised)");
            expect(selected).toContain("forced-colors:after:border-[Highlight]");
            expect(selected).not.toContain("after:h-[2px]");
            expect(root.querySelector("mona-tab-list")?.className).not.toContain("border-b");
        });

        it("passes axe", async () => {
            host.look.set("pill");
            host.closable.set(true);
            await settle();
            expect((await axe.run(root)).violations).toEqual([]);
        });
    });

    describe("middle-click", () => {
        it("requests the close of a closable tab", async () => {
            host.closable.set(true);
            await settle();
            const event = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
            tab("Privacy").dispatchEvent(event);
            expect(host.closeEvents.map(close => [close.index, close.selected])).toEqual([[1, false]]);
            expect(host.closeEvents[0].originalEvent).toBe(event);
        });

        it("leaves a tab that can't close alone", () => {
            const event = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
            tab("Privacy").dispatchEvent(event);
            expect(event.defaultPrevented).toBe(false);
            expect(host.closeEvents).toEqual([]);
        });
    });
});
