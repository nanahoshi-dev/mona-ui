import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { vi } from "vitest";

import { ExpansionPanelComponent } from "./expansion-panel.component";
import { ExpansionPanelActionsTemplateDirective } from "../../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelIconTemplateDirective } from "../../directives/expansion-panel-icon-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../../directives/expansion-panel-title-template.directive";

describe("ExpansionPanelComponent", () => {
    let component: ExpansionPanelComponent;
    let fixture: ComponentFixture<ExpansionPanelComponent>;

    const getHeader = (): HTMLElement => fixture.nativeElement.querySelector('[role="button"]');
    const getContent = (): HTMLElement => {
        const header = getHeader();
        const contentId = header.getAttribute("aria-controls")!;
        return fixture.nativeElement.querySelector(`[id="${contentId}"]`);
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ExpansionPanelComponent]
        });
        fixture = TestBed.createComponent(ExpansionPanelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should toggle expanded on header click", () => {
        expect(component.expanded()).toBe(false);
        getHeader().click();
        expect(component.expanded()).toBe(true);
        getHeader().click();
        expect(component.expanded()).toBe(false);
    });

    it("should not toggle on click when disabled", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();
        getHeader().click();
        expect(component.expanded()).toBe(false);
    });

    it("should toggle expanded and prevent default on Enter keydown", () => {
        const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");
        getHeader().dispatchEvent(event);
        fixture.detectChanges();
        expect(component.expanded()).toBe(true);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should toggle expanded and prevent default on Space keydown", () => {
        const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");
        getHeader().dispatchEvent(event);
        fixture.detectChanges();
        expect(component.expanded()).toBe(true);
        expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should not toggle on keydown when disabled", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();
        const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        getHeader().dispatchEvent(event);
        expect(component.expanded()).toBe(false);
    });

    it("should reflect expanded state via aria-expanded, aria-hidden and inert", () => {
        const header = getHeader();
        const content = getContent();
        expect(header.getAttribute("aria-expanded")).toBe("false");
        expect(content.getAttribute("aria-hidden")).toBe("true");
        expect(content.hasAttribute("inert")).toBe(true);

        fixture.componentRef.setInput("expanded", true);
        fixture.detectChanges();

        expect(header.getAttribute("aria-expanded")).toBe("true");
        expect(content.getAttribute("aria-hidden")).toBe("false");
        expect(content.hasAttribute("inert")).toBe(false);
    });

    it("should set aria-disabled and tabindex -1 when disabled", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();
        const header = getHeader();
        expect(header.getAttribute("aria-disabled")).toBe("true");
        expect(header.getAttribute("tabindex")).toBe("-1");
    });

    it("should leave aria-disabled unset and tabindex 0 when not disabled", () => {
        const header = getHeader();
        expect(header.hasAttribute("aria-disabled")).toBe(false);
        expect(header.getAttribute("tabindex")).toBe("0");
    });

    it("should merge userClass onto the host element", () => {
        fixture.componentRef.setInput("userClass", "custom-test-class");
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).classList.contains("custom-test-class")).toBe(true);
    });

    it.each([
        ["none", "rounded-none"],
        ["small", "rounded-sm"],
        ["medium", "rounded-md"],
        ["large", "rounded-lg"]
    ] as const)("should apply the %s rounded class", (rounded, expectedClass) => {
        fixture.componentRef.setInput("rounded", rounded);
        fixture.detectChanges();
        expect((fixture.nativeElement as HTMLElement).classList.contains(expectedClass)).toBe(true);
    });
});

@Component({
    template: `
        <mona-expansion-panel title="Default title">
            <ng-template monaExpansionPanelTitleTemplate>Custom title</ng-template>
            <ng-template monaExpansionPanelActionsTemplate>
                <button type="button" class="test-action">Action</button>
            </ng-template>
            <ng-template monaExpansionPanelIconTemplate let-expanded>
                <span class="test-icon">{{ expanded ? "open" : "closed" }}</span>
            </ng-template>
            <p>Panel content</p>
        </mona-expansion-panel>
    `,
    imports: [
        ExpansionPanelComponent,
        ExpansionPanelTitleTemplateDirective,
        ExpansionPanelActionsTemplateDirective,
        ExpansionPanelIconTemplateDirective
    ]
})
class ExpansionPanelTemplatesHostComponent {
    public readonly panel = viewChild.required(ExpansionPanelComponent);
}

describe("ExpansionPanelComponent templates", () => {
    let fixture: ComponentFixture<ExpansionPanelTemplatesHostComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ExpansionPanelTemplatesHostComponent]
        });
        fixture = TestBed.createComponent(ExpansionPanelTemplatesHostComponent);
        fixture.detectChanges();
    });

    it("should render the title template instead of the string title", () => {
        const titleEl: HTMLElement = fixture.nativeElement.querySelector('[role="button"]');
        expect(titleEl.textContent).toContain("Custom title");
        expect(titleEl.textContent).not.toContain("Default title");
    });

    it("should render the actions template inside the header", () => {
        const actionEl: HTMLElement = fixture.nativeElement.querySelector(".test-action");
        expect(actionEl).toBeTruthy();
        expect(actionEl.textContent).toContain("Action");
    });

    it("should pass the current expanded state as $implicit to the icon template", () => {
        const iconEl: HTMLElement = fixture.nativeElement.querySelector(".test-icon");
        expect(iconEl.textContent).toContain("closed");

        fixture.componentInstance.panel().expanded.set(true);
        fixture.detectChanges();

        expect(iconEl.textContent).toContain("open");
    });
});
