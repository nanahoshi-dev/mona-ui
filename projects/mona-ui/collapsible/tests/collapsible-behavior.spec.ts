import { Component, signal } from "@angular/core";
import type { ComponentFixture } from "@angular/core/testing";
import { TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollapsibleContentDirective } from "../directives/collapsible-content.directive";
import { CollapsibleTriggerDirective } from "../directives/collapsible-trigger.directive";
import { CollapsibleDirective } from "../directives/collapsible.directive";

const IMPORTS = [CollapsibleDirective, CollapsibleTriggerDirective, CollapsibleContentDirective];

@Component({
    template: `
        <div monaCollapsible [animate]="animate()" [(expanded)]="expanded">
            <div monaCollapsibleTrigger class="trigger">
                Toggle
                <button type="button" class="nested">Nested</button>
                <input aria-label="Nested field" class="field" />
                <span class="plain">Text</span>
            </div>
            <div monaCollapsibleContent class="content">Content</div>
        </div>
    `,
    imports: IMPORTS
})
class GenericTriggerHostComponent {
    public readonly animate = signal(false);
    public readonly expanded = signal(false);
}

@Component({
    template: `
        <div monaCollapsible [disabled]="disabled()" [animate]="false" [(expanded)]="expanded">
            <a monaCollapsibleTrigger href="#target" class="trigger">Toggle</a>
            <div monaCollapsibleContent class="content">Content</div>
        </div>
    `,
    imports: IMPORTS
})
class AnchorTriggerHostComponent {
    public readonly disabled = signal(false);
    public readonly expanded = signal(false);
}

@Component({
    template: `
        <div monaCollapsible [animate]="false">
            <button monaCollapsibleTrigger class="trigger">Toggle</button>
            <div monaCollapsibleContent class="content" [id]="id()">Content</div>
        </div>
    `,
    imports: IMPORTS
})
class CustomIdHostComponent {
    public readonly id = signal<string | null>("mine");
}

@Component({
    template: `
        <div monaCollapsible disabled animate [expanded]="false">
            <button monaCollapsibleTrigger class="trigger">Toggle</button>
            <div monaCollapsibleContent class="content">Content</div>
        </div>
    `,
    imports: IMPORTS
})
class AttributeHostComponent {}

async function settle<T>(fixture: ComponentFixture<T>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function press(element: Element, key: string): KeyboardEvent {
    const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return event;
}

describe("monaCollapsible behavior", () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    describe("a trigger with controls inside", () => {
        let fixture: ComponentFixture<GenericTriggerHostComponent>;

        const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);

        beforeEach(async () => {
            fixture = TestBed.createComponent(GenericTriggerHostComponent);
            await settle(fixture);
        });

        it("leaves their clicks to them", () => {
            query(".nested").click();
            expect(fixture.componentInstance.expanded()).toBe(false);
            query(".field").click();
            expect(fixture.componentInstance.expanded()).toBe(false);
        });

        it("leaves their Enter and Space to them", () => {
            const enter = press(query(".nested"), "Enter");
            const space = press(query(".field"), " ");
            expect(enter.defaultPrevented).toBe(false);
            expect(space.defaultPrevented).toBe(false);
            expect(fixture.componentInstance.expanded()).toBe(false);
        });

        it("still toggles for a click on anything else in it", () => {
            query(".plain").click();
            expect(fixture.componentInstance.expanded()).toBe(true);
        });

        it("still toggles for its own Enter and Space", () => {
            expect(press(query(".trigger"), "Enter").defaultPrevented).toBe(true);
            expect(fixture.componentInstance.expanded()).toBe(true);
            expect(press(query(".trigger"), " ").defaultPrevented).toBe(true);
            expect(fixture.componentInstance.expanded()).toBe(false);
        });
    });

    describe("a disabled anchor as the trigger", () => {
        let fixture: ComponentFixture<AnchorTriggerHostComponent>;

        const anchor = (): HTMLAnchorElement => fixture.nativeElement.querySelector(".trigger");

        beforeEach(async () => {
            fixture = TestBed.createComponent(AnchorTriggerHostComponent);
            fixture.componentInstance.disabled.set(true);
            await settle(fixture);
        });

        it("leaves the tab order", () => {
            expect(anchor().getAttribute("tabindex")).toBe("-1");
        });

        it("doesn't follow its href or toggle", () => {
            const click = new MouseEvent("click", { bubbles: true, cancelable: true });
            anchor().dispatchEvent(click);
            expect(click.defaultPrevented).toBe(true);
            expect(fixture.componentInstance.expanded()).toBe(false);
        });

        it("goes back to normal when enabled", async () => {
            fixture.componentInstance.disabled.set(false);
            await settle(fixture);
            expect(anchor().hasAttribute("tabindex")).toBe(false);
            const click = new MouseEvent("click", { bubbles: true, cancelable: true });
            anchor().dispatchEvent(click);
            expect(click.defaultPrevented).toBe(false);
            expect(fixture.componentInstance.expanded()).toBe(true);
        });
    });

    describe("the content's id", () => {
        it("keeps one given to it, and the trigger points at it", async () => {
            const fixture = TestBed.createComponent(CustomIdHostComponent);
            await settle(fixture);
            expect(fixture.nativeElement.querySelector(".content").id).toBe("mine");
            expect(fixture.nativeElement.querySelector(".trigger").getAttribute("aria-controls")).toBe("mine");
        });

        it("goes back to a generated one when it's cleared", async () => {
            const fixture = TestBed.createComponent(CustomIdHostComponent);
            await settle(fixture);
            fixture.componentInstance.id.set(null);
            await settle(fixture);
            const id = fixture.nativeElement.querySelector(".content").id;
            expect(id).toMatch(/^mona-/);
            expect(fixture.nativeElement.querySelector(".trigger").getAttribute("aria-controls")).toBe(id);
        });
    });

    describe("resting state", () => {
        it("is collapsed in the first pass, before anything that only runs after a render", () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            // Change detection alone, as on the server, where after-render callbacks don't run.
            fixture.changeDetectorRef.detectChanges();
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            expect(content.style.height).toBe("0px");
            expect(content.style.overflow).toBe("hidden");
        });

        it("takes its padding and border away while closed, and gives them back when open", async () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            await settle(fixture);
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            const box = [
                "padding-block-start",
                "padding-block-end",
                "border-block-start-width",
                "border-block-end-width"
            ];
            expect(box.map(property => content.style.getPropertyValue(property))).toEqual(["0px", "0px", "0px", "0px"]);

            fixture.componentInstance.expanded.set(true);
            await settle(fixture);
            expect(box.map(property => content.style.getPropertyValue(property))).toEqual(["", "", "", ""]);
        });

        it("counts its border in the height it publishes, measured with the box back", async () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            await settle(fixture);
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            // What a real padded box reports: closed, the padding isn't there to count.
            Object.defineProperty(content, "scrollHeight", {
                configurable: true,
                get: () => (content.style.getPropertyValue("padding-block-start") === "0px" ? 60 : 84)
            });
            const real = globalThis.getComputedStyle;
            vi.spyOn(globalThis, "getComputedStyle").mockImplementation((element, pseudo) => {
                const style = real(element, pseudo);
                if (element !== content) {
                    return style;
                }
                return new Proxy(style, {
                    get: (target, name) =>
                        name === "getPropertyValue"
                            ? (property: string) => (property === "border-block-start-width" ? "1px" : "")
                            : Reflect.get(target, name)
                });
            });

            fixture.componentInstance.expanded.set(true);
            fixture.detectChanges();
            fixture.componentInstance.expanded.set(false);
            fixture.detectChanges();
            expect(content.style.getPropertyValue("--mona-collapsible-content-height")).toBe("85px");
        });

        it("renders where there's no getComputedStyle, as on a server", () => {
            vi.stubGlobal("getComputedStyle", undefined);
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            fixture.changeDetectorRef.detectChanges();
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            expect(content.style.height).toBe("0px");
            expect(content.style.getPropertyValue("--mona-collapsible-content-height")).toBe("0px");
        });

        it("isn't clipped when it starts open", () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            fixture.componentInstance.expanded.set(true);
            fixture.changeDetectorRef.detectChanges();
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            expect(content.style.height).toBe("");
            expect(content.style.overflow).toBe("");
        });
    });

    describe("animation", () => {
        it("carries on from the current height when toggled mid-animation", async () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            fixture.componentInstance.animate.set(true);
            await settle(fixture);
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            const heights: string[] = [];
            Object.defineProperty(content, "offsetHeight", {
                configurable: true,
                get: () => {
                    heights.push(content.style.height);
                    return 40;
                }
            });
            Object.defineProperty(content, "scrollHeight", { configurable: true, value: 100 });

            fixture.componentInstance.expanded.set(true);
            fixture.detectChanges();

            // The reflow that gives the browser its start value reads the height it started from.
            expect(heights.at(-1)).toBe("40px");
            expect(content.style.height).toBe("100px");
        });

        it("starts the box from where it is, and takes it to the other end", async () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            fixture.componentInstance.animate.set(true);
            fixture.componentInstance.expanded.set(true);
            await settle(fixture);
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            const padding: string[] = [];
            Object.defineProperty(content, "offsetHeight", {
                configurable: true,
                get: () => {
                    padding.push(content.style.getPropertyValue("padding-block-start"));
                    return 40;
                }
            });
            const real = globalThis.getComputedStyle;
            vi.spyOn(globalThis, "getComputedStyle").mockImplementation((element, pseudo) => {
                const style = real(element, pseudo);
                if (element !== content) {
                    return style;
                }
                return new Proxy(style, {
                    get: (target, name) =>
                        name === "getPropertyValue"
                            ? (property: string) => (property === "padding-block-start" ? "7px" : "")
                            : Reflect.get(target, name)
                });
            });

            fixture.componentInstance.expanded.set(false);
            fixture.detectChanges();

            expect(padding.at(-1)).toBe("7px");
            expect(content.style.getPropertyValue("padding-block-start")).toBe("0px");
            expect(content.style.height).toBe("0px");
        });

        it("cancels what's running when it settles, rather than leaving it to finish", async () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            fixture.componentInstance.animate.set(true);
            await settle(fixture);
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;
            const flushed: string[] = [];
            Object.defineProperty(content, "offsetHeight", {
                configurable: true,
                get: () => {
                    flushed.push(content.style.transitionProperty);
                    return 0;
                }
            });

            fixture.componentInstance.expanded.set(true);
            fixture.detectChanges();
            flushed.length = 0;
            content.dispatchEvent(Object.assign(new Event("transitionend"), { propertyName: "height" }));

            expect(flushed).toEqual(["none"]);
            expect(content.style.transitionProperty).toBe("");
        });

        it("settles quickly where the duration can't be resolved, rather than waiting minutes", async () => {
            const fixture = TestBed.createComponent(GenericTriggerHostComponent);
            fixture.componentInstance.animate.set(true);
            await settle(fixture);
            const content = fixture.nativeElement.querySelector(".content") as HTMLElement;

            fixture.componentInstance.expanded.set(true);
            fixture.detectChanges();
            expect(content.style.transitionProperty.split(", ")).toEqual([
                "height",
                "padding-block-start",
                "padding-block-end",
                "border-block-start-width",
                "border-block-end-width"
            ]);

            await new Promise(resolve => setTimeout(resolve, 120));
            expect(content.style.transitionProperty).toBe("");
        });
    });

    it("takes plain attributes for its boolean inputs", async () => {
        const fixture = TestBed.createComponent(AttributeHostComponent);
        await settle(fixture);
        const trigger = fixture.nativeElement.querySelector(".trigger") as HTMLButtonElement;
        expect(trigger.disabled).toBe(true);
    });

    it("passes axe with an anchor, disabled and enabled", async () => {
        const fixture = TestBed.createComponent(AnchorTriggerHostComponent);
        await settle(fixture);
        expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
        fixture.componentInstance.disabled.set(true);
        await settle(fixture);
        expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
    });
});
