import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { TextBoxComponent } from "./text-box.component";

describe("TextBoxComponent", () => {
    let component: TextBoxComponent;
    let fixture: ComponentFixture<TextBoxComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TextBoxComponent]
        });
        fixture = TestBed.createComponent(TextBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should use the shared input shell and semantic state precedence", () => {
        const element = fixture.nativeElement as HTMLElement;

        expect(
            element.classList.contains(
                "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
            )
        ).toBe(true);
        expect(element.classList.contains("border-input-border")).toBe(true);
        expect(element.classList.contains("shadow-(--shadow-control)")).toBe(true);
        expect(element.classList.contains("focus-within:border-focus-indicator")).toBe(true);
        expect(element.classList.contains("focus-within:ring-focus-indicator/35")).toBe(true);
        expect(element.classList.contains("data-[disabled='true']:bg-disabled-background")).toBe(true);
        expect(element.classList.contains("data-[invalid='true']:focus-within:ring-error/35")).toBe(true);
        expect(element.classList.contains("opacity-50")).toBe(false);
    });

    it("renders clear button with default English aria-label and updates dynamically on locale change", () => {
        const i18n = TestBed.inject(MonaI18nService);
        fixture.componentRef.setInput("clearButton", true);
        fixture.componentRef.setInput("value", "Hello");
        fixture.detectChanges();

        const host = fixture.nativeElement as HTMLElement;
        let button = host.querySelector("button");
        expect(button).toBeTruthy();
        expect(button?.getAttribute("aria-label")).toBe("Clear");

        i18n.use({
            id: "tr-TR",
            direction: "ltr",
            messages: {
                textBox: {
                    clear: "Temizle"
                }
            }
        });
        fixture.detectChanges();

        button = host.querySelector("button");
        expect(button?.getAttribute("aria-label")).toBe("Temizle");
    });
});

