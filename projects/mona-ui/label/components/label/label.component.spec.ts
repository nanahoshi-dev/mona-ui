import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import type { LabelFocusable } from "../../models/LabelTarget";

import { LabelComponent } from "./label.component";

describe("LabelComponent", () => {
    let component: LabelComponent;
    let fixture: ComponentFixture<LabelComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [LabelComponent]
        });
        fixture = TestBed.createComponent(LabelComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function getLabel(targetFixture: ComponentFixture<unknown>): HTMLLabelElement {
        return targetFixture.nativeElement.querySelector("label");
    }

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("rendering", () => {
        it("should render exactly one native <label>", () => {
            expect(fixture.nativeElement.querySelectorAll("label").length).toBe(1);
        });

        it("should render the text caption", () => {
            fixture.componentRef.setInput("text", "Email address");
            fixture.detectChanges();

            expect(getLabel(fixture).textContent?.trim()).toBe("Email address");
        });

        it("should not render a caption wrapper when text and optional are both absent", () => {
            expect(getLabel(fixture).querySelector("span")).toBeNull();
        });

        it("should project the control inside the native label", () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ imports: [LabelWrappingHostComponent] });
            const hostFixture = TestBed.createComponent(LabelWrappingHostComponent);
            hostFixture.detectChanges();

            const input = getLabel(hostFixture).querySelector("input");
            expect(input).not.toBeNull();
        });
    });

    describe("optional state", () => {
        it("should not render optional text by default", () => {
            fixture.componentRef.setInput("text", "Email");
            fixture.detectChanges();

            expect(getLabel(fixture).textContent).not.toContain("Optional");
        });

        it("should render 'Optional' when optional is true", () => {
            fixture.componentRef.setInput("optional", true);
            fixture.detectChanges();

            expect(getLabel(fixture).textContent?.trim()).toBe("Optional");
        });

        it("should render custom optionalText", () => {
            fixture.componentRef.setInput("optional", true);
            fixture.componentRef.setInput("optionalText", "(optional)");
            fixture.detectChanges();

            expect(getLabel(fixture).textContent?.trim()).toBe("(optional)");
        });

        it("should add data-optional when optional is true", () => {
            fixture.componentRef.setInput("optional", true);
            fixture.detectChanges();

            expect(getLabel(fixture).hasAttribute("data-optional")).toBe(true);
        });

        it("should not add data-optional by default", () => {
            expect(getLabel(fixture).hasAttribute("data-optional")).toBe(false);
        });
    });

    describe("native ID association", () => {
        it("should reflect a string for value onto the native label", () => {
            fixture.componentRef.setInput("for", "email");
            fixture.detectChanges();

            expect(getLabel(fixture).getAttribute("for")).toBe("email");
        });

        it("should update the native attribute when the input changes", () => {
            fixture.componentRef.setInput("for", "email");
            fixture.detectChanges();
            fixture.componentRef.setInput("for", "username");
            fixture.detectChanges();

            expect(getLabel(fixture).getAttribute("for")).toBe("username");
        });

        it("should remove the attribute for null", () => {
            fixture.componentRef.setInput("for", "email");
            fixture.detectChanges();
            fixture.componentRef.setInput("for", null);
            fixture.detectChanges();

            expect(getLabel(fixture).hasAttribute("for")).toBe(false);
        });

        it("should remove the attribute for undefined", () => {
            expect(getLabel(fixture).hasAttribute("for")).toBe(false);
        });

        it("should not call focus on a string target when the label is clicked", () => {
            const target: LabelFocusable = { focus: () => {} };
            const focusSpy = vi.spyOn(target, "focus");
            fixture.componentRef.setInput("for", "email");
            fixture.detectChanges();

            getLabel(fixture).dispatchEvent(new MouseEvent("click"));

            expect(focusSpy).not.toHaveBeenCalled();
        });
    });

    describe("component-reference association", () => {
        it("should call focus exactly once when the label is clicked", () => {
            const target: LabelFocusable = { focus: () => {} };
            const focusSpy = vi.spyOn(target, "focus");
            fixture.componentRef.setInput("for", target);
            fixture.detectChanges();

            getLabel(fixture).dispatchEvent(new MouseEvent("click"));

            expect(focusSpy).toHaveBeenCalledTimes(1);
        });

        it("should not throw when the target is null", () => {
            fixture.componentRef.setInput("for", null);
            fixture.detectChanges();

            expect(() => getLabel(fixture).dispatchEvent(new MouseEvent("click"))).not.toThrow();
        });

        it("should not throw when the target is undefined", () => {
            expect(() => getLabel(fixture).dispatchEvent(new MouseEvent("click"))).not.toThrow();
        });

        it("should not call preventDefault", () => {
            const target: LabelFocusable = { focus: () => {} };
            fixture.componentRef.setInput("for", target);
            fixture.detectChanges();

            const event = new MouseEvent("click", { cancelable: true });
            getLabel(fixture).dispatchEvent(event);

            expect(event.defaultPrevented).toBe(false);
        });

        it("should do nothing when the click has already been prevented", () => {
            const target: LabelFocusable = { focus: () => {} };
            const focusSpy = vi.spyOn(target, "focus");
            fixture.componentRef.setInput("for", target);
            fixture.detectChanges();

            const event = new MouseEvent("click", { cancelable: true });
            event.preventDefault();
            getLabel(fixture).dispatchEvent(event);

            expect(focusSpy).not.toHaveBeenCalled();
        });

        it("should support a native element reference structurally through its focus method", () => {
            const inputEl = document.createElement("input");
            const focusSpy = vi.spyOn(inputEl, "focus");
            fixture.componentRef.setInput("for", inputEl);
            fixture.detectChanges();

            getLabel(fixture).dispatchEvent(new MouseEvent("click"));

            expect(focusSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("classes", () => {
        it("should apply default theme classes", () => {
            expect(getLabel(fixture).className).toContain("text-foreground");
        });

        it("should merge a consumer class", () => {
            fixture.componentRef.setInput("class", "text-red-500");
            fixture.detectChanges();

            expect(getLabel(fixture).className).toContain("text-red-500");
        });

        it("should allow consumer classes to override conflicting defaults", () => {
            fixture.componentRef.setInput("class", "text-lg");
            fixture.detectChanges();

            expect(getLabel(fixture).className).toContain("text-lg");
            expect(getLabel(fixture).className).not.toContain("text-sm");
        });
    });

    describe("accessibility", () => {
        it("should render a native <label> with no redundant role", () => {
            expect(getLabel(fixture).hasAttribute("role")).toBe(false);
        });

        it("should not add aria-required to the label", () => {
            expect(getLabel(fixture).hasAttribute("aria-required")).toBe(false);
        });

        it("should keep optional text visible and available to assistive technology", () => {
            fixture.componentRef.setInput("text", "Email");
            fixture.componentRef.setInput("optional", true);
            fixture.detectChanges();

            expect(getLabel(fixture).hasAttribute("aria-hidden")).toBe(false);
            expect(getLabel(fixture).textContent).toContain("Optional");
        });

        it("should have no AXE violations when wrapping a control", async () => {
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({ imports: [LabelWrappingHostComponent] });
            const hostFixture = TestBed.createComponent(LabelWrappingHostComponent);
            hostFixture.detectChanges();

            const results = await axe.run(hostFixture.nativeElement as HTMLElement, {
                rules: { "color-contrast": { enabled: false } }
            });

            expect(results.violations).toEqual([]);
        });
    });
});

@Component({
    imports: [LabelComponent],
    template: `
        <mona-label text="Name">
            <input aria-label="Name" />
        </mona-label>
    `
})
class LabelWrappingHostComponent {}
