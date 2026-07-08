import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { AvatarComponent } from "./avatar.component";

// =============================================================================
// Test Host Component
// =============================================================================

@Component({
    template: `
        <mona-avatar
            [alt]="alt()"
            [aria-label]="ariaLabel()"
            [backgroundColor]="backgroundColor()"
            [borderColor]="borderColor()"
            [borderRadius]="borderRadius()"
            [borderWidth]="borderWidth()"
            [customStyles]="customStyles()"
            [height]="height()"
            [image]="image()"
            [label]="label()"
            [labelColor]="labelColor()"
            [labelFontSize]="labelFontSize()"
            [labelFontWeight]="labelFontWeight()"
            [width]="width()"
            [class]="userClass()">
            {{ projectedContent() }}
        </mona-avatar>
    `,
    imports: [AvatarComponent]
})
class TestAvatarHostComponent {
    alt = signal("");
    ariaLabel = signal("");
    backgroundColor = signal("var(--color-primary)");
    borderColor = signal("var(--color-border)");
    borderRadius = signal<string | number>("0");
    borderWidth = signal<string | number>("1px");
    customStyles = signal<Partial<CSSStyleDeclaration>>({});
    height = signal<string | number>("64px");
    image = signal("");
    label = signal("");
    labelColor = signal("var(--color-foreground)");
    labelFontSize = signal("1rem");
    labelFontWeight = signal("700");
    width = signal<string | number>("64px");
    userClass = signal("");
    projectedContent = signal("Projected Content");
}

// =============================================================================
// Helper Functions
// =============================================================================

function getHostElement(fixture: ComponentFixture<TestAvatarHostComponent>): HTMLElement {
    return fixture.debugElement.query(By.css("mona-avatar")).nativeElement;
}

function getImgElement(fixture: ComponentFixture<TestAvatarHostComponent>): HTMLImageElement | null {
    const debugEl = fixture.debugElement.query(By.css("img"));
    return debugEl ? debugEl.nativeElement : null;
}

function getLabelElement(fixture: ComponentFixture<TestAvatarHostComponent>): HTMLDivElement | null {
    const debugEl = fixture.debugElement.query(By.css("div"));
    return debugEl ? debugEl.nativeElement : null;
}

// =============================================================================
// Test Suite
// =============================================================================

describe("AvatarComponent", () => {
    let fixture: ComponentFixture<TestAvatarHostComponent>;
    let component: TestAvatarHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestAvatarHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestAvatarHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    // =========================================================================
    // Creation & Defaults
    // =========================================================================
    describe("creation and default rendering", () => {
        it("should create", () => {
            const host = getHostElement(fixture);
            expect(host).toBeTruthy();
        });

        it("should render default styles", () => {
            const host = getHostElement(fixture);
            expect(host.style.width).toBe("64px");
            expect(host.style.height).toBe("64px");
            expect(host.style.borderColor).toBe("var(--color-border)");
            expect(host.style.borderWidth).toBe("1px");
            expect(host.style.borderStyle).toBe("solid");
            expect(host.style.borderRadius).toBe("0px");
            expect(host.style.backgroundColor).toBe("var(--color-primary)");
            expect(host.style.display).toBe("inline-block");
        });

        it("should fallback to projected content by default", () => {
            const host = getHostElement(fixture);
            expect(getImgElement(fixture)).toBeNull();
            expect(getLabelElement(fixture)).toBeNull();
            expect(host.textContent?.trim()).toBe("Projected Content");
        });
    });

    // =========================================================================
    // Image Mode
    // =========================================================================
    describe("image mode", () => {
        beforeEach(() => {
            component.image.set("http://example.com/avatar.png");
            fixture.detectChanges();
        });

        it("should render <img> with correct src and alt attributes", () => {
            const img = getImgElement(fixture);
            expect(img).not.toBeNull();
            expect(img?.src).toBe("http://example.com/avatar.png");

            component.alt.set("User Avatar");
            fixture.detectChanges();
            expect(img?.alt).toBe("User Avatar");
        });

        it("should apply border-radius to the <img> element", () => {
            component.borderRadius.set("50%");
            fixture.detectChanges();
            const img = getImgElement(fixture);
            expect(img?.style.borderRadius).toBe("50%");
        });

        it("should make host background color transparent", () => {
            const host = getHostElement(fixture);
            expect(host.style.backgroundColor).toBe("transparent");
        });

        it("should not render label or projected content", () => {
            expect(getLabelElement(fixture)).toBeNull();
            const host = getHostElement(fixture);
            expect(host.textContent?.trim()).toBe("");
        });
    });

    // =========================================================================
    // Label Mode
    // =========================================================================
    describe("label mode", () => {
        beforeEach(() => {
            component.label.set("JD");
            fixture.detectChanges();
        });

        it("should render label div with correct text", () => {
            const labelEl = getLabelElement(fixture);
            expect(labelEl).not.toBeNull();
            expect(labelEl?.textContent?.trim()).toBe("JD");
        });

        it("should apply correct label styles including overrides", () => {
            const labelEl = getLabelElement(fixture);
            expect(labelEl?.style.alignItems).toBe("center");
            expect(labelEl?.style.display).toBe("flex");
            expect(labelEl?.style.justifyContent).toBe("center");
            expect(labelEl?.style.height).toBe("100%");
            expect(labelEl?.style.width).toBe("100%");

            // Check default typography
            expect(labelEl?.style.color).toBe("var(--color-foreground)");
            expect(labelEl?.style.fontSize).toBe("1rem");
            expect(labelEl?.style.fontWeight).toBe("700");

            // Override typography
            component.labelColor.set("blue");
            component.labelFontSize.set("2rem");
            component.labelFontWeight.set("400");
            fixture.detectChanges();

            expect(labelEl?.style.color).toBe("blue");
            expect(labelEl?.style.fontSize).toBe("2rem");
            expect(labelEl?.style.fontWeight).toBe("400");
        });

        it("should not render image or projected content", () => {
            expect(getImgElement(fixture)).toBeNull();
            const host = getHostElement(fixture);
            expect(host.textContent?.trim()).toBe("JD");
        });
    });

    // =========================================================================
    // Transforms
    // =========================================================================
    describe("transforms", () => {
        it("should handle numeric inputs and convert them to pixels", () => {
            component.width.set(100);
            component.height.set(200);
            component.borderWidth.set(5);
            component.borderRadius.set(10);
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.style.width).toBe("100px");
            expect(host.style.height).toBe("200px");
            expect(host.style.borderWidth).toBe("5px");
            expect(host.style.borderRadius).toBe("10px");
        });

        it("should handle string inputs and preserve them as-is", () => {
            component.width.set("50%");
            component.height.set("10rem");
            component.borderWidth.set("3px");
            component.borderRadius.set("25px");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.style.width).toBe("50%");
            expect(host.style.height).toBe("10rem");
            expect(host.style.borderWidth).toBe("3px");
            expect(host.style.borderRadius).toBe("25px");
        });
    });

    // =========================================================================
    // Custom Styles and Classes
    // =========================================================================
    describe("custom styles and classes", () => {
        it("should merge custom styles into host style", () => {
            component.customStyles.set({
                opacity: "0.8",
                display: "flex",
                color: "green"
            });
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.style.opacity).toBe("0.8");
            expect(host.style.display).toBe("flex");
            expect(host.style.color).toBe("green");
        });

        it("should apply custom class to host", () => {
            component.userClass.set("my-custom-avatar");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.classList.contains("my-custom-avatar")).toBe(true);
        });
    });

    // =========================================================================
    // Accessibility (ARIA)
    // =========================================================================
    describe("accessibility", () => {
        it("should set aria-label and role='img' in label or projection mode", () => {
            component.ariaLabel.set("User Profile Picture");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.getAttribute("aria-label")).toBe("User Profile Picture");
            expect(host.getAttribute("role")).toBe("img");
        });

        it("should set aria-label but NOT role='img' in image mode", () => {
            component.image.set("http://example.com/avatar.png");
            component.ariaLabel.set("User Profile Picture");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.getAttribute("aria-label")).toBe("User Profile Picture");
            expect(host.getAttribute("role")).toBeNull();
        });

        it("should have null aria-label and role when ariaLabel is empty", () => {
            component.ariaLabel.set("");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.getAttribute("aria-label")).toBeNull();
            expect(host.getAttribute("role")).toBeNull();
        });
    });
});
