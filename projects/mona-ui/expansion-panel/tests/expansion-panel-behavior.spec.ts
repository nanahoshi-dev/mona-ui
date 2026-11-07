import { Component, signal, viewChild, viewChildren } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccordionComponent } from "../components/accordion/accordion.component";
import { ExpansionPanelComponent } from "../components/expansion-panel/expansion-panel.component";
import { ExpansionPanelActionsTemplateDirective } from "../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelIconTemplateDirective } from "../directives/expansion-panel-icon-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../directives/expansion-panel-title-template.directive";
import {
    expansionPanelContentThemeVariants,
    expansionPanelTriggerThemeVariants
} from "../styles/expansion-panel.styles";

@Component({
    template: `
        <mona-expansion-panel title="Reports" [disabled]="disabled()" [headingLevel]="level()" [(expanded)]="expanded">
            <ng-template monaExpansionPanelActionsTemplate>
                <button type="button" class="action" (click)="actionClicks = actionClicks + 1">Action</button>
            </ng-template>
            <p>Body</p>
        </mona-expansion-panel>
    `,
    imports: [ExpansionPanelActionsTemplateDirective, ExpansionPanelComponent]
})
class PanelHostComponent {
    public readonly disabled = signal(false);
    public readonly expanded = signal(false);
    public readonly level = signal<unknown>(3);
    public readonly panel = viewChild.required(ExpansionPanelComponent);
    public actionClicks = 0;
}

@Component({
    template: `
        <mona-expansion-panel class="extra">
            <ng-template monaExpansionPanelTitleTemplate><img src="a.png" alt="Chart" /></ng-template>
            <ng-template monaExpansionPanelIconTemplate><span class="icon">I</span></ng-template>
        </mona-expansion-panel>
    `,
    imports: [ExpansionPanelComponent, ExpansionPanelIconTemplateDirective, ExpansionPanelTitleTemplateDirective]
})
class TemplateHostComponent {}

@Component({
    template: `
        <mona-accordion [multiple]="multiple()">
            @for (panel of panels(); track panel.title) {
                <mona-expansion-panel
                    [disabled]="!!panel.disabled"
                    [(expanded)]="expandedFlags()[$index].value"
                    [title]="panel.title">
                    @if (panel.nested) {
                        <mona-accordion>
                            <mona-expansion-panel title="Inner one" />
                            <mona-expansion-panel title="Inner two" />
                        </mona-accordion>
                    }
                    <input aria-label="Field" />
                </mona-expansion-panel>
            }
        </mona-accordion>
    `,
    imports: [AccordionComponent, ExpansionPanelComponent]
})
class AccordionHostComponent {
    public readonly expandedFlags = signal<{ value: boolean }[]>([]);
    public readonly multiple = signal(false);
    public readonly panelComponents = viewChildren(ExpansionPanelComponent);
    public readonly panels = signal<readonly { disabled?: boolean; nested?: boolean; title: string }[]>([]);
}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(element: Element, key: string, options: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
    return event;
}

describe("mona-expansion-panel behavior", () => {
    let fixture: ComponentFixture<PanelHostComponent>;
    let host: PanelHostComponent;

    function trigger(): HTMLButtonElement {
        return fixture.nativeElement.querySelector("button[aria-controls]");
    }

    function action(): HTMLButtonElement {
        return fixture.nativeElement.querySelector(".action");
    }

    beforeEach(async () => {
        TestBed.configureTestingModule({ imports: [PanelHostComponent, TemplateHostComponent] });
        fixture = TestBed.createComponent(PanelHostComponent);
        host = fixture.componentInstance;
        await settle(fixture);
    });

    afterEach(() => vi.restoreAllMocks());

    describe("header", () => {
        it("makes the toggle a native button", () => {
            expect(trigger().tagName).toBe("BUTTON");
            expect(trigger().type).toBe("button");
            expect(trigger().textContent).toContain("Reports");
            expect(fixture.nativeElement.querySelector("[role='button']")).toBeNull();
        });

        it("keeps the actions out of the button", () => {
            expect(action().closest("button[aria-controls]")).toBeNull();
            expect(trigger().contains(action())).toBe(false);
        });

        it("doesn't toggle when an action is clicked", () => {
            action().click();
            expect(host.actionClicks).toBe(1);
            expect(host.expanded()).toBe(false);
        });

        it("leaves Enter and Space on an action to the action", () => {
            expect(press(action(), "Enter").defaultPrevented).toBe(false);
            expect(press(action(), " ").defaultPrevented).toBe(false);
            expect(host.expanded()).toBe(false);
        });

        it("toggles on a click of the button", () => {
            trigger().click();
            expect(host.expanded()).toBe(true);
        });

        it("disables the button when disabled", async () => {
            host.disabled.set(true);
            await settle(fixture);
            expect(trigger().disabled).toBe(true);
            trigger().click();
            expect(host.expanded()).toBe(false);
            expect(trigger().className).toContain("bg-disabled-background");
            expect(trigger().className).not.toContain("hover:bg-hover");
        });

        it("makes the actions inert with it", async () => {
            const actions = (): Element => action().parentElement!;
            expect(actions().hasAttribute("inert")).toBe(false);
            host.disabled.set(true);
            await settle(fixture);
            expect(actions().hasAttribute("inert")).toBe(true);
        });

        it("renders no actions element without actions", async () => {
            const plain = TestBed.createComponent(ExpansionPanelComponent);
            plain.componentRef.setInput("title", "Plain");
            await settle(plain);
            expect((plain.nativeElement as HTMLElement).querySelector("[inert]:not([role='region'])")).toBeNull();
            expect((plain.nativeElement as HTMLElement).querySelector(".col-start-2")).toBeNull();
        });

        it("puts the button across the whole row, with the actions in the middle above it", () => {
            expect(trigger().className).toContain("col-span-full");
            expect(trigger().className).toContain("grid-cols-subgrid");
            expect(action().parentElement!.className).toContain("col-start-2");
            expect(action().parentElement!.className).toContain("z-10");
        });

        it("focus() goes to the button", () => {
            host.panel().focus();
            expect(document.activeElement).toBe(trigger());
        });

        it("has a solid focus outline", () => {
            const classes = expansionPanelTriggerThemeVariants({ disabled: false });
            expect(classes).toContain("focus-visible:outline-2");
            expect(classes).not.toContain("outline-none");
            expect(classes).not.toContain("ring-focus-indicator/35");
        });
    });

    describe("heading", () => {
        function heading(): Element | null {
            return fixture.nativeElement.querySelector("[role='heading']");
        }

        it("wraps the button in a heading, level 3 by default", () => {
            expect(heading()?.getAttribute("aria-level")).toBe("3");
            expect(heading()?.contains(trigger())).toBe(true);
            expect(heading()?.contains(action())).toBe(false);
        });

        it.each([
            [2, "2"],
            ["4", "4"],
            [0, "3"],
            [7, "3"],
            [1.5, "3"],
            ["big", "3"],
            [undefined, "3"]
        ])("reads headingLevel %s as %s", async (level, expected) => {
            host.level.set(level);
            await settle(fixture);
            expect(heading()?.getAttribute("aria-level")).toBe(expected);
        });

        it("has no heading with null", async () => {
            host.level.set(null);
            await settle(fixture);
            expect(heading()).toBeNull();
            expect(fixture.nativeElement.querySelector("[aria-level]")).toBeNull();
        });
    });

    describe("region", () => {
        function region(): Element {
            return fixture.nativeElement.querySelector(`[id="${trigger().getAttribute("aria-controls")}"]`);
        }

        it("is named by the button", () => {
            expect(region().getAttribute("role")).toBe("region");
            expect(region().getAttribute("aria-labelledby")).toBe(trigger().id);
            expect(trigger().id).toBeTruthy();
        });

        it("is inert while collapsed", async () => {
            expect(region().hasAttribute("inert")).toBe(true);
            host.expanded.set(true);
            await settle(fixture);
            expect(region().hasAttribute("inert")).toBe(false);
        });
    });

    describe("host", () => {
        it("doesn't keep a plain title as a tooltip", async () => {
            @Component({
                template: ` <mona-expansion-panel title="One" /> `,
                imports: [ExpansionPanelComponent]
            })
            class StaticTitleComponent {}
            const statics = TestBed.createComponent(StaticTitleComponent);
            await settle(statics);
            const panel = statics.nativeElement.querySelector("mona-expansion-panel") as HTMLElement;
            expect(panel.hasAttribute("title")).toBe(false);
            expect(panel.textContent).toContain("One");
        });

        it("merges class onto the host", async () => {
            const templates = TestBed.createComponent(TemplateHostComponent);
            await settle(templates);
            expect(templates.nativeElement.querySelector("mona-expansion-panel").classList).toContain("extra");
        });

        it("doesn't animate for someone who asked for less motion", () => {
            expect(expansionPanelContentThemeVariants({ expanded: true })).toContain("motion-reduce:transition-none");
        });
    });

    describe("a panel with no name", () => {
        it("warns", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            const plain = TestBed.createComponent(ExpansionPanelComponent);
            await settle(plain);
            expect(warn).toHaveBeenCalledWith(expect.stringContaining("needs a title"));
        });

        it("doesn't warn with a title", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            const plain = TestBed.createComponent(ExpansionPanelComponent);
            plain.componentRef.setInput("title", "Named");
            await settle(plain);
            expect(warn).not.toHaveBeenCalled();
        });

        it("doesn't warn when a template names it", async () => {
            const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
            const templates = TestBed.createComponent(TemplateHostComponent);
            await settle(templates);
            expect(warn.mock.calls.filter(call => String(call[0]).includes("needs a title"))).toEqual([]);
        });
    });

    describe("axe", () => {
        it("passes collapsed, with actions", async () => {
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });

        it("passes expanded", async () => {
            host.expanded.set(true);
            await settle(fixture);
            expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        });
    });
});

describe("mona-accordion", () => {
    let fixture: ComponentFixture<AccordionHostComponent>;
    let host: AccordionHostComponent;

    const THREE = [{ title: "One" }, { title: "Two" }, { title: "Three" }];

    async function setup(
        panels: readonly { disabled?: boolean; nested?: boolean; title: string }[] = THREE,
        open: readonly number[] = []
    ): Promise<void> {
        fixture = TestBed.createComponent(AccordionHostComponent);
        host = fixture.componentInstance;
        host.panels.set(panels);
        host.expandedFlags.set(panels.map((_, index) => ({ value: open.includes(index) })));
        await settle(fixture);
    }

    function triggers(): HTMLButtonElement[] {
        return Array.from(fixture.nativeElement.querySelectorAll("button[aria-controls]"));
    }

    function openTitles(): string[] {
        return host
            .panelComponents()
            .filter(panel => panel.expanded())
            .map(panel => panel.title());
    }

    beforeEach(() => TestBed.configureTestingModule({ imports: [AccordionHostComponent] }));

    describe("one open at a time", () => {
        it("closes the open panel when another opens", async () => {
            await setup();
            triggers()[0].click();
            await settle(fixture);
            triggers()[1].click();
            await settle(fixture);
            expect(openTitles()).toEqual(["Two"]);
        });

        it("lets the open panel be closed", async () => {
            await setup();
            triggers()[0].click();
            await settle(fixture);
            triggers()[0].click();
            await settle(fixture);
            expect(openTitles()).toEqual([]);
        });

        it("holds for a panel opened by code", async () => {
            await setup(THREE, [0]);
            host.panelComponents()[2].expand();
            await settle(fixture);
            expect(openTitles()).toEqual(["Three"]);
        });

        it("reports the close through the panel's expanded", async () => {
            await setup();
            triggers()[0].click();
            await settle(fixture);
            triggers()[1].click();
            await settle(fixture);
            expect(host.expandedFlags()[0].value).toBe(false);
        });

        it("keeps the last one when several start open", async () => {
            await setup(THREE, [0, 2]);
            expect(openTitles()).toEqual(["Three"]);
        });

        it("closes a disabled panel too, so only one is ever open", async () => {
            await setup([{ title: "One", disabled: true }, { title: "Two" }], [0]);
            triggers()[1].click();
            await settle(fixture);
            expect(openTitles()).toEqual(["Two"]);
        });

        it("lets a panel open with multiple", async () => {
            await setup();
            host.multiple.set(true);
            await settle(fixture);
            triggers()[0].click();
            await settle(fixture);
            triggers()[1].click();
            await settle(fixture);
            expect(openTitles()).toEqual(["One", "Two"]);
        });

        it("closes all but one when multiple is turned off", async () => {
            await setup();
            host.multiple.set(true);
            await settle(fixture);
            triggers()[0].click();
            await settle(fixture);
            triggers()[1].click();
            await settle(fixture);

            host.multiple.set(false);
            await settle(fixture);
            expect(openTitles().length).toBe(1);
        });

        it("doesn't touch a panel outside it", async () => {
            await setup([{ title: "One", nested: true }, { title: "Two" }], [0]);
            const innerTriggers = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
                "mona-accordion mona-accordion button[aria-controls]"
            );
            innerTriggers[0].click();
            await settle(fixture);
            expect(openTitles()).toEqual(["One", "Inner one"]);
        });
    });

    describe("keys", () => {
        it("moves between headers without toggling", async () => {
            await setup();
            const [one, two, three] = triggers();
            one.focus();
            expect(press(one, "ArrowDown").defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(two);
            press(two, "ArrowDown");
            expect(document.activeElement).toBe(three);
            press(three, "ArrowUp");
            expect(document.activeElement).toBe(two);
            expect(openTitles()).toEqual([]);
        });

        it("wraps around at both ends", async () => {
            await setup();
            const [one, , three] = triggers();
            one.focus();
            press(one, "ArrowUp");
            expect(document.activeElement).toBe(three);
            press(three, "ArrowDown");
            expect(document.activeElement).toBe(one);
        });

        it("goes to the ends with Home and End", async () => {
            await setup();
            const [one, two, three] = triggers();
            two.focus();
            press(two, "End");
            expect(document.activeElement).toBe(three);
            press(three, "Home");
            expect(document.activeElement).toBe(one);
        });

        it("skips disabled panels", async () => {
            await setup([{ title: "One" }, { title: "Two", disabled: true }, { title: "Three" }]);
            const [one, , three] = triggers();
            one.focus();
            press(one, "ArrowDown");
            expect(document.activeElement).toBe(three);
        });

        it("leaves other keys alone", async () => {
            await setup();
            expect(press(triggers()[0], "a").defaultPrevented).toBe(false);
        });

        it.each(["altKey", "ctrlKey", "metaKey", "shiftKey"])("leaves %s with an arrow alone", async modifier => {
            await setup();
            const [one] = triggers();
            one.focus();
            expect(press(one, "ArrowDown", { [modifier]: true }).defaultPrevented).toBe(false);
            expect(document.activeElement).toBe(one);
        });

        it("leaves keys in a panel's content alone", async () => {
            await setup(THREE, [0]);
            const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
            expect(press(input, "ArrowDown").defaultPrevented).toBe(false);
            expect(press(input, "Home").defaultPrevented).toBe(false);
        });

        it("keeps a nested accordion's keys to itself", async () => {
            await setup([{ title: "One", nested: true }, { title: "Two" }], [0]);
            const inner = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
                "mona-accordion mona-accordion button[aria-controls]"
            );
            inner[0].focus();
            press(inner[0], "End");
            expect(document.activeElement).toBe(inner[1]);
        });
    });

    it("works with panels wrapped in another element", async () => {
        @Component({
            template: `
                <mona-accordion>
                    <div>
                        <mona-expansion-panel title="One" [expanded]="true" />
                        <mona-expansion-panel title="Two" [expanded]="true" />
                    </div>
                </mona-accordion>
            `,
            imports: [AccordionComponent, ExpansionPanelComponent]
        })
        class WrappedComponent {
            public readonly panels = viewChildren(ExpansionPanelComponent);
        }
        const wrapped = TestBed.createComponent(WrappedComponent);
        await settle(wrapped);
        expect(wrapped.componentInstance.panels().filter(panel => panel.expanded()).length).toBe(1);
    });

    it("adds no role of its own, and passes axe", async () => {
        await setup(THREE, [1]);
        expect(fixture.nativeElement.querySelector("mona-accordion").hasAttribute("role")).toBe(false);
        expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
    });
});
