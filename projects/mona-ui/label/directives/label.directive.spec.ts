import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import type { LabelFocusable, LabelTarget } from "../models/LabelTarget";

import { LabelDirective } from "./label.directive";

@Component({
    template: `<label monaLabel [for]="for()" [class]="userClass()">{{ text() }}</label>`,
    imports: [LabelDirective]
})
class LabelDirectiveHostComponent {
    public readonly for = signal<LabelTarget>(undefined);
    public readonly text = signal("Email");
    public readonly userClass = signal("");
}

describe("LabelDirective", () => {
    let directive: LabelDirective;
    let fixture: ComponentFixture<LabelDirectiveHostComponent>;

    beforeEach(() => {
        directive = TestBed.runInInjectionContext(() => new LabelDirective());
        fixture = TestBed.createComponent(LabelDirectiveHostComponent);
        fixture.detectChanges();
    });

    function getLabel(): HTMLLabelElement {
        return fixture.nativeElement.querySelector("label");
    }

    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should apply default theme classes", () => {
        expect(getLabel().className).toContain("text-foreground");
    });

    it("should merge the native label's consumer classes", () => {
        fixture.componentInstance.userClass.set("text-red-500");
        fixture.detectChanges();

        expect(getLabel().className).toContain("text-red-500");
    });

    it("should reflect a string for value", () => {
        fixture.componentInstance.for.set("email");
        fixture.detectChanges();

        expect(getLabel().getAttribute("for")).toBe("email");
    });

    it("should invoke focus for an object target", () => {
        const target: LabelFocusable = { focus: () => {} };
        const focusSpy = vi.spyOn(target, "focus");
        fixture.componentInstance.for.set(target);
        fixture.detectChanges();

        getLabel().dispatchEvent(new MouseEvent("click"));

        expect(focusSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle missing targets safely", () => {
        expect(() => getLabel().dispatchEvent(new MouseEvent("click"))).not.toThrow();
    });

    it("should not prevent native label behavior", () => {
        const event = new MouseEvent("click", { cancelable: true });
        getLabel().dispatchEvent(event);

        expect(event.defaultPrevented).toBe(false);
    });

    it("should not insert or alter label text", () => {
        expect(getLabel().textContent?.trim()).toBe("Email");
    });

    it("should have no AXE violations with a native input association", async () => {
        const results = await axe.run(fixture.nativeElement as HTMLElement, {
            rules: { "color-contrast": { enabled: false } }
        });

        expect(results.violations).toEqual([]);
    });
});

@Component({
    template: `
        <label monaLabel>Decorated</label>
        <label>Plain</label>
    `,
    imports: [LabelDirective]
})
class LabelDirectiveSelectorHostComponent {}

describe("LabelDirective selector scoping", () => {
    it("should apply only to label[monaLabel]", () => {
        TestBed.configureTestingModule({ imports: [LabelDirectiveSelectorHostComponent] });
        const fixture = TestBed.createComponent(LabelDirectiveSelectorHostComponent);
        fixture.detectChanges();

        const labels: NodeListOf<HTMLLabelElement> = fixture.nativeElement.querySelectorAll("label");
        const decorated = Array.from(labels).find(label => label.textContent?.trim() === "Decorated");
        const plain = Array.from(labels).find(label => label.textContent?.trim() === "Plain");

        expect(decorated?.className).toContain("text-foreground");
        expect(plain?.className ?? "").not.toContain("text-foreground");
    });
});

@Component({
    template: `
        <label monaLabel for="username">Username</label>
        <input id="username" />
    `,
    imports: [LabelDirective]
})
class LabelDirectiveForIdHostComponent {}

describe("LabelDirective with native for/id association", () => {
    it("should reflect the for attribute matching the target input's id", () => {
        TestBed.configureTestingModule({ imports: [LabelDirectiveForIdHostComponent] });
        const fixture = TestBed.createComponent(LabelDirectiveForIdHostComponent);
        fixture.detectChanges();

        const label: HTMLLabelElement = fixture.nativeElement.querySelector("label");
        const input: HTMLInputElement = fixture.nativeElement.querySelector("input");

        expect(label.getAttribute("for")).toBe(input.id);
    });
});

@Component({
    template: `<label monaLabel [for]="focusable()">Name</label>`,
    imports: [LabelDirective]
})
class LabelDirectiveFocusableHostComponent {
    public readonly focusable = signal<LabelFocusable | undefined>(undefined);
}

describe("LabelDirective with a focusable component-reference target", () => {
    it("should focus the target when the label is clicked", () => {
        TestBed.configureTestingModule({ imports: [LabelDirectiveFocusableHostComponent] });
        const fixture = TestBed.createComponent(LabelDirectiveFocusableHostComponent);
        const target: LabelFocusable = { focus: () => {} };
        const focusSpy = vi.spyOn(target, "focus");
        fixture.componentInstance.focusable.set(target);
        fixture.detectChanges();

        const label: HTMLLabelElement = fixture.nativeElement.querySelector("label");
        label.dispatchEvent(new MouseEvent("click"));

        expect(focusSpy).toHaveBeenCalledTimes(1);
    });
});
