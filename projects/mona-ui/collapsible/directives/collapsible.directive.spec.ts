import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";

import { CollapsibleContentDirective } from "./collapsible-content.directive";
import { CollapsibleTriggerDirective } from "./collapsible-trigger.directive";
import { CollapsibleDirective } from "./collapsible.directive";

@Component({
    template: `
        <div monaCollapsible [(expanded)]="expanded" [disabled]="disabled()" [animate]="false">
            <button monaCollapsibleTrigger class="trigger">Toggle</button>
            <ul monaCollapsibleContent class="content">
                <li><a href="#">Item</a></li>
            </ul>
        </div>
    `,
    imports: [CollapsibleDirective, CollapsibleTriggerDirective, CollapsibleContentDirective]
})
class CollapsibleHostComponent {
    public readonly collapsible = viewChild.required(CollapsibleDirective);
    public readonly disabled = signal(false);
    public readonly expanded = signal(false);
}

@Component({
    template: `
        <section monaCollapsible [animate]="false">
            <div monaCollapsibleTrigger class="trigger">Toggle</div>
            <div monaCollapsibleContent class="content">Content</div>
        </section>
    `,
    imports: [CollapsibleDirective, CollapsibleTriggerDirective, CollapsibleContentDirective]
})
class CollapsibleGenericHostComponent {
    public readonly collapsible = viewChild.required(CollapsibleDirective);
}

describe("CollapsibleDirective", () => {
    let fixture: ComponentFixture<CollapsibleHostComponent>;
    let component: CollapsibleHostComponent;

    const getContent = (): HTMLElement => fixture.nativeElement.querySelector(".content");
    const getRoot = (): HTMLElement => fixture.nativeElement.querySelector("[monaCollapsible]");
    const getTrigger = (): HTMLElement => fixture.nativeElement.querySelector(".trigger");

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [CollapsibleHostComponent] });
        fixture = TestBed.createComponent(CollapsibleHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component.collapsible()).toBeTruthy();
    });

    it("should point the trigger at the content through aria-controls", () => {
        const contentId = getContent().getAttribute("id");
        expect(contentId).toBeTruthy();
        expect(getTrigger().getAttribute("aria-controls")).toBe(contentId);
    });

    it("should toggle on trigger click", () => {
        expect(component.expanded()).toBe(false);
        getTrigger().click();
        expect(component.expanded()).toBe(true);
        getTrigger().click();
        expect(component.expanded()).toBe(false);
    });

    it("should reflect state through aria-expanded, inert and data-state", () => {
        expect(getTrigger().getAttribute("aria-expanded")).toBe("false");
        expect(getContent().hasAttribute("inert")).toBe(true);
        expect(getRoot().getAttribute("data-state")).toBe("closed");
        expect(getContent().getAttribute("data-state")).toBe("closed");

        component.expanded.set(true);
        fixture.detectChanges();

        expect(getTrigger().getAttribute("aria-expanded")).toBe("true");
        expect(getContent().hasAttribute("inert")).toBe(false);
        expect(getRoot().getAttribute("data-state")).toBe("open");
        expect(getContent().getAttribute("data-state")).toBe("open");
    });

    it("should not add redundant role or tabindex to a native button trigger", () => {
        const trigger = getTrigger();
        expect(trigger.hasAttribute("role")).toBe(false);
        expect(trigger.hasAttribute("tabindex")).toBe(false);
        expect(trigger.getAttribute("type")).toBe("button");
    });

    it("should not toggle from a native button keydown, since the browser synthesises a click", () => {
        const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        getTrigger().dispatchEvent(event);
        fixture.detectChanges();
        expect(component.expanded()).toBe(false);
    });

    it("should block trigger interaction when disabled", () => {
        component.disabled.set(true);
        fixture.detectChanges();

        expect(getTrigger().getAttribute("aria-disabled")).toBe("true");
        expect(getTrigger().hasAttribute("disabled")).toBe(true);

        getTrigger().click();
        expect(component.expanded()).toBe(false);
    });

    it("should clip the content box while collapsed", () => {
        const content = getContent();
        // `min-height` matters: the content is often a flex item, whose default `min-height: auto`
        // would otherwise hold it open at its content height despite `height: 0`.
        expect(content.style.height).toBe("0px");
        expect(content.style.minHeight).toBe("0px");
        expect(content.style.overflow).toBe("hidden");
    });

    it("should release the content box once expanded", () => {
        component.expanded.set(true);
        fixture.detectChanges();

        const content = getContent();
        expect(content.style.height).toBe("");
        expect(content.style.minHeight).toBe("");
        expect(content.style.overflow).toBe("");
    });

    it("should re-clip the content box when collapsed again", () => {
        component.expanded.set(true);
        fixture.detectChanges();
        component.expanded.set(false);
        fixture.detectChanges();

        const content = getContent();
        expect(content.style.height).toBe("0px");
        expect(content.style.minHeight).toBe("0px");
        expect(content.style.overflow).toBe("hidden");
    });

    it("should publish the measured content height as a custom property", () => {
        expect(getContent().style.getPropertyValue("--mona-collapsible-content-height")).toMatch(/^\d+px$/);
    });

    it("should still expand and collapse programmatically when disabled", () => {
        component.disabled.set(true);
        fixture.detectChanges();

        component.collapsible().expand();
        expect(component.expanded()).toBe(true);

        component.collapsible().collapse();
        expect(component.expanded()).toBe(false);
    });
});

describe("CollapsibleDirective on non-interactive hosts", () => {
    let fixture: ComponentFixture<CollapsibleGenericHostComponent>;

    const getTrigger = (): HTMLElement => fixture.nativeElement.querySelector(".trigger");

    beforeEach(() => {
        TestBed.configureTestingModule({ imports: [CollapsibleGenericHostComponent] });
        fixture = TestBed.createComponent(CollapsibleGenericHostComponent);
        fixture.detectChanges();
    });

    it("should promote the trigger to a button", () => {
        const trigger = getTrigger();
        expect(trigger.getAttribute("role")).toBe("button");
        expect(trigger.getAttribute("tabindex")).toBe("0");
        expect(trigger.hasAttribute("type")).toBe(false);
    });

    it.each([["Enter"], [" "]])("should toggle and prevent default on %s keydown", key => {
        const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");

        getTrigger().dispatchEvent(event);
        fixture.detectChanges();

        expect(fixture.componentInstance.collapsible().expanded()).toBe(true);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });
});
