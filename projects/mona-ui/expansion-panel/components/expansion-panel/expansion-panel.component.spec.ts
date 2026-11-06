import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ExpansionPanelComponent } from "./expansion-panel.component";
import { ExpansionPanelActionsTemplateDirective } from "../../directives/expansion-panel-actions-template.directive";
import { ExpansionPanelIconTemplateDirective } from "../../directives/expansion-panel-icon-template.directive";
import { ExpansionPanelTitleTemplateDirective } from "../../directives/expansion-panel-title-template.directive";

describe("ExpansionPanelComponent", () => {
    let component: ExpansionPanelComponent;
    let fixture: ComponentFixture<ExpansionPanelComponent>;

    const getHeader = (): HTMLButtonElement => fixture.nativeElement.querySelector("button[aria-controls]");
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

    it("uses quiet disclosure surfaces and neutral interaction states", () => {
        const host = fixture.nativeElement as HTMLElement;
        const header = getHeader();

        expect(host.classList.contains("bg-surface")).toBe(true);
        expect(header.parentElement?.parentElement?.classList.contains("bg-surface-muted")).toBe(true);
        expect(header.classList.contains("hover:bg-hover")).toBe(true);
        expect(header.classList.contains("active:bg-active")).toBe(true);
        expect(header.classList.contains("focus-visible:outline-focus-indicator")).toBe(true);
        expect(header.classList.contains("ring-primary/40")).toBe(false);
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

    it("should leave Enter and Space to the native button, which turns them into a click", () => {
        const enter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
        const space = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
        getHeader().dispatchEvent(enter);
        getHeader().dispatchEvent(space);
        expect(enter.defaultPrevented).toBe(false);
        expect(space.defaultPrevented).toBe(false);
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

    it("should disable the native button when disabled", () => {
        fixture.componentRef.setInput("disabled", true);
        fixture.detectChanges();
        const header = getHeader();
        expect(header.disabled).toBe(true);
        expect(header.classList.contains("bg-disabled-background")).toBe(true);
        expect(header.classList.contains("text-disabled-foreground")).toBe(true);
        expect(header.classList.contains("opacity-50")).toBe(false);
    });

    it("should leave aria-disabled and tabindex unset when not disabled", () => {
        const header = getHeader();
        expect(header.hasAttribute("aria-disabled")).toBe(false);
        expect(header.hasAttribute("tabindex")).toBe(false);
    });

    it("should merge class onto the host element", () => {
        fixture.componentRef.setInput("class", "custom-test-class");
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
        const titleEl: HTMLElement = fixture.nativeElement.querySelector("button[aria-controls]");
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
