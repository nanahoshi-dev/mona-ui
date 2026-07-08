import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ThemeService } from "@mirei/mona-ui/theme";
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
});
