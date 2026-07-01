import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { PlaceholderComponent } from "./placeholder.component";

// =============================================================================
// Test Host Component
// =============================================================================

@Component({
    template: `
        <mona-placeholder [text]="text()" [class]="userClass()">
            {{ projectedContent() }}
        </mona-placeholder>
    `,
    imports: [PlaceholderComponent]
})
class TestPlaceholderHostComponent {
    text = signal("");
    userClass = signal("");
    projectedContent = signal("Projected Content");
}

// =============================================================================
// Helper Functions
// =============================================================================

function getHostElement(fixture: ComponentFixture<TestPlaceholderHostComponent>): HTMLElement {
    return fixture.debugElement.query(By.css("mona-placeholder")).nativeElement;
}

function getTextElement(fixture: ComponentFixture<TestPlaceholderHostComponent>): HTMLSpanElement | null {
    const debugEl = fixture.debugElement.query(By.css("span"));
    return debugEl ? debugEl.nativeElement : null;
}

// =============================================================================
// Test Suite
// =============================================================================

describe("PlaceholderComponent", () => {
    let fixture: ComponentFixture<TestPlaceholderHostComponent>;
    let component: TestPlaceholderHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestPlaceholderHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestPlaceholderHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        const host = getHostElement(fixture);
        expect(host).toBeTruthy();
    });

    // =========================================================================
    // Projected Content Mode
    // =========================================================================
    describe("projected content mode", () => {
        it("should render projected content when text is empty", () => {
            const host = getHostElement(fixture);
            expect(getTextElement(fixture)).toBeNull();
            expect(host.textContent?.trim()).toBe("Projected Content");
        });
    });

    // =========================================================================
    // Text Mode
    // =========================================================================
    describe("text mode", () => {
        it("should render a span with the text label", () => {
            component.text.set("No items");
            fixture.detectChanges();

            const textEl = getTextElement(fixture);
            expect(textEl).not.toBeNull();
            expect(textEl?.textContent?.trim()).toBe("No items");
        });

        it("should take precedence over projected content when both are provided", () => {
            component.text.set("No items");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.textContent?.trim()).toBe("No items");
            expect(host.textContent).not.toContain("Projected Content");
        });
    });

    // =========================================================================
    // Custom Classes
    // =========================================================================
    describe("custom classes", () => {
        it("should merge custom class onto the host element", () => {
            component.userClass.set("my-custom-placeholder");
            fixture.detectChanges();

            const host = getHostElement(fixture);
            expect(host.classList.contains("my-custom-placeholder")).toBe(true);
        });
    });
});
