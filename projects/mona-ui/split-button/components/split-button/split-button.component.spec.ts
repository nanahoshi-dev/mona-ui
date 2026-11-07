import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { beforeEach, describe, expect, it } from "vitest";
import { SplitButtonComponent } from "./split-button.component";

describe("SplitButtonComponent", () => {
    let component: SplitButtonComponent;
    let fixture: ComponentFixture<SplitButtonComponent>;

    function buttons(): HTMLButtonElement[] {
        return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
    }

    beforeEach(() => {
        fixture = TestBed.createComponent(SplitButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should use the input border for an outline split divider", () => {
        fixture.componentRef.setInput("look", "outline");
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.classList.contains("[&>button:not(:last-child)]:border-input-border")).toBe(true);
        expect(element.classList.contains("[&>button:not(:last-child)]:border-e")).toBe(true);
    });

    it("applies logical border radiuses and border reset to inner buttons", () => {
        expect(buttons()[0].classList.contains("rounded-e-none")).toBe(true);
        expect(buttons()[1].classList.contains("rounded-s-none")).toBe(true);
        expect(buttons()[1].classList.contains("border-s-0")).toBe(true);
    });

    describe("i18n", () => {
        it("names the arrow after the main action, and leaves the main button to its text", () => {
            fixture.componentRef.setInput("text", "Save");
            fixture.detectChanges();

            expect(buttons()[0].hasAttribute("aria-label")).toBe(false);
            expect(buttons()[1].getAttribute("aria-label")).toBe("More Save options");
        });

        it("falls back to a general arrow name when the main button has no text", () => {
            expect(buttons()[1].getAttribute("aria-label")).toBe("Show menu options");
        });

        it("allows consumer inputs to override default aria labels", () => {
            fixture.componentRef.setInput("text", "Save");
            fixture.componentRef.setInput("aria-label", "Custom action");
            fixture.componentRef.setInput("menuButtonAriaLabel", "Custom menu");
            fixture.detectChanges();

            expect(buttons()[0].getAttribute("aria-label")).toBe("Custom action");
            expect(buttons()[1].getAttribute("aria-label")).toBe("Custom menu");
        });

        it("updates aria labels dynamically when locale changes", () => {
            fixture.componentRef.setInput("text", "Kaydet");
            fixture.detectChanges();

            const i18n = TestBed.inject(MonaI18nService);
            i18n.use({
                direction: "ltr",
                id: "tr-TR",
                messages: {
                    splitButton: {
                        menuButtonAriaLabel: "Menü seçeneklerini göster",
                        menuButtonWithText: (text: string) => `Diğer ${text} seçenekleri`,
                        splitButton: (text: string) => `${text} ayrık düğme`
                    }
                }
            });
            fixture.detectChanges();

            expect(buttons()[0].hasAttribute("aria-label")).toBe(false);
            expect(buttons()[1].getAttribute("aria-label")).toBe("Diğer Kaydet seçenekleri");
        });
    });
});
