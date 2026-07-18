import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ThemeService } from "@nanahoshi/mona-ui/theme";
import { TextAreaDirective } from "./text-area.directive";

@Component({
    template: `<textarea monaTextArea [invalid]="invalid()" [touched]="true" class="custom-class"></textarea>`,
    imports: [TextAreaDirective]
})
class TestHostComponent {
    public readonly invalid = signal(false);
}

describe("TextAreaDirective", () => {
    let directive: TextAreaDirective;
    let fixture: ComponentFixture<TestHostComponent>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [ThemeService]
        });
        directive = TestBed.runInInjectionContext(() => new TextAreaDirective());
        fixture = TestBed.createComponent(TestHostComponent);
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });

    it("should reflect the invalid state on the host element", () => {
        fixture.componentInstance.invalid.set(true);
        fixture.detectChanges();

        const textArea = fixture.nativeElement.querySelector("textarea") as HTMLTextAreaElement;
        expect(textArea.getAttribute("data-invalid")).toBe("true");
        expect(textArea.getAttribute("aria-invalid")).toBe("true");
        expect(textArea.className).toContain("data-[invalid='true']:border-error");
        expect(textArea.className).toContain("custom-class");
    });

    it("should use the shared input shell and keep invalid focus semantic", () => {
        fixture.detectChanges();
        const textArea = fixture.nativeElement.querySelector("textarea") as HTMLTextAreaElement;

        expect(textArea.classList.contains("bg-input-background")).toBe(true);
        expect(textArea.classList.contains("border-input-border")).toBe(true);
        expect(textArea.classList.contains("shadow-(--shadow-control)")).toBe(true);
        expect(textArea.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
        expect(textArea.classList.contains("disabled:bg-disabled-background")).toBe(true);
        expect(textArea.classList.contains("data-[invalid='true']:focus-visible:ring-error/35")).toBe(true);
        expect(textArea.classList.contains("opacity-50")).toBe(false);
    });
});
