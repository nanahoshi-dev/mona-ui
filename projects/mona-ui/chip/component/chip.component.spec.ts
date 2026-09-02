import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, RouterLink } from "@angular/router";
import { twMerge } from "tailwind-merge";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChipPrefixTemplateDirective } from "../directives/chip-prefix-template.directive";
import { ChipVariantProps } from "../styles/chip.styles";
import { ChipComponent } from "./chip.component";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `
        <mona-chip
            [aria-label]="ariaLabel() ?? ''"
            [disabled]="disabled()"
            [label]="label()"
            [look]="look()"
            [removable]="removable()"
            [removeLabel]="removeLabel()"
            [rounded]="rounded()"
            [selected]="selected()"
            [size]="size()"
            [tabindex]="tabindex()"
            [toggleable]="toggleable()"
            [class]="userClass()"
            [value]="value()"
            (contentClick)="onContentClick()"
            (remove)="onRemove($event)"
            (selectedChange)="onSelectedChange($event)">
            {{ content() }}
        </mona-chip>
    `,
    imports: [ChipComponent]
})
class TestChipHostComponent {
    ariaLabel = signal<string | undefined>(undefined);
    chipComponent = viewChild.required(ChipComponent);
    content = signal("Chip Content");
    disabled = signal(false);
    label = signal("");
    look = signal<ChipVariantProps["look"]>("default");
    onContentClick = vi.fn();
    onRemove = vi.fn();
    onSelectedChange = vi.fn();
    removable = signal(false);
    removeLabel = signal<string | undefined>(undefined);
    rounded = signal<ChipVariantProps["rounded"]>("full");
    selected = signal(false);
    size = signal<ChipVariantProps["size"]>("medium");
    tabindex = signal<number | string | undefined>(undefined);
    toggleable = signal(false);
    userClass = signal("");
    value = signal<unknown>(undefined);
}

@Component({
    template: `
        <mona-chip [label]="label()">
            <ng-template monaChipPrefixTemplate>
                <span data-testid="prefix-content">Prefix</span>
            </ng-template>
        </mona-chip>
    `,
    imports: [ChipComponent, ChipPrefixTemplateDirective]
})
class TestChipWithPrefixHostComponent {
    label = signal("Chip Label");
}

@Component({
    template: `
        <mona-chip
            [routerLink]="linkUrl()"
            [disabled]="disabled()"
            [removable]="removable()"
            [class]="userClass()"
            (remove)="onRemove($event)">
            Link Chip
        </mona-chip>
    `,
    imports: [ChipComponent, RouterLink]
})
class TestChipWithRouterLinkHostComponent {
    disabled = signal(false);
    linkUrl = signal("/test-path");
    onRemove = vi.fn();
    removable = signal(false);
    userClass = signal("");
}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

// =============================================================================
// Test Suite
// =============================================================================

describe("ChipComponent", () => {
    let fixture: ComponentFixture<TestChipHostComponent>;
    let component: TestChipHostComponent;
    let chipElement: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestChipHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestChipHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        chipElement = fixture.debugElement.query(By.css("mona-chip")).nativeElement;
    });

    // =========================================================================
    // Initialization Tests
    // =========================================================================
    describe("initialization", () => {
        it("should create the component", () => {
            expect(component.chipComponent()).toBeTruthy();
        });

        it("should have default tabindex of -1 when not interactive", () => {
            // By default toggleable=false, removable=false, so tabindex is -1
            expect(chipElement.getAttribute("tabindex")).toBe("-1");
        });

        it("should apply default variant classes", () => {
            expect(chipElement.classList.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Label Input Tests
    // =========================================================================
    describe("label input", () => {
        it("should display label when provided", () => {
            component.label.set("Test Label");
            fixture.detectChanges();
            expect(chipElement.textContent).toContain("Test Label");
        });

        it("should use ng-content when label is empty", () => {
            component.label.set("");
            component.content.set("Content Text");
            fixture.detectChanges();
            expect(chipElement.textContent).toContain("Content Text");
        });

        it("should update display when label changes", () => {
            component.label.set("Initial");
            fixture.detectChanges();
            expect(chipElement.textContent).toContain("Initial");

            component.label.set("Updated");
            fixture.detectChanges();
            expect(chipElement.textContent).toContain("Updated");
        });
    });

    // =========================================================================
    // Disabled Input Tests
    // =========================================================================
    describe("disabled input", () => {
        it("should set aria-disabled='true' when disabled", () => {
            component.disabled.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-disabled")).toBe("true");
        });

        it("should NOT set aria-disabled when enabled", () => {
            component.disabled.set(false);
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-disabled")).toBeNull();
        });

        it("should set tabindex=-1 when disabled", () => {
            component.tabindex.set(0);
            component.disabled.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("-1");
        });

        it("should NOT emit contentClick when disabled and clicked", async () => {
            component.disabled.set(true);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should NOT toggle selected when disabled", async () => {
            component.toggleable.set(true);
            component.selected.set(false);
            component.disabled.set(true);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Removable Input Tests
    // =========================================================================
    describe("removable input", () => {
        it("should NOT show remove button when removable=false", () => {
            component.removable.set(false);
            fixture.detectChanges();
            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton).toBeNull();
        });

        it("should show remove button when removable=true", () => {
            component.removable.set(true);
            fixture.detectChanges();
            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton).toBeTruthy();
        });

        it("should emit remove event when remove button clicked", async () => {
            component.removable.set(true);
            await waitForStable(fixture);

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            removeButton.triggerEventHandler("click", new MouseEvent("click"));
            await waitForStable(fixture);

            expect(component.onRemove).toHaveBeenCalled();
        });

        it("should have accessible aria-label on remove button", () => {
            component.removable.set(true);
            component.label.set("My Chip");
            fixture.detectChanges();

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton.nativeElement.getAttribute("aria-label")).toBe("Remove, My Chip");
        });

        it("should have default aria-label when no label provided", () => {
            component.removable.set(true);
            component.label.set("");
            fixture.detectChanges();

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton.nativeElement.getAttribute("aria-label")).toBe("Remove, item");
        });

        it("should use removeLabel input when provided", () => {
            component.removable.set(true);
            component.label.set("My Chip");
            component.removeLabel.set("Remove tag: My Chip");
            fixture.detectChanges();

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton.nativeElement.getAttribute("aria-label")).toBe("Remove tag: My Chip");
        });

        it("should NOT emit contentClick when remove button clicked", async () => {
            component.removable.set(true);
            await waitForStable(fixture);

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            removeButton.nativeElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should keep host tabindex=-1 when removable", () => {
            component.removable.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("-1");
        });

        it("should NOT emit remove when disabled", async () => {
            component.removable.set(true);
            component.disabled.set(true);
            await waitForStable(fixture);

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            removeButton.triggerEventHandler("click", new MouseEvent("click"));
            await waitForStable(fixture);

            expect(component.onRemove).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Toggleable & Selected Tests
    // =========================================================================
    describe("toggleable and selected", () => {
        it("should set role='checkbox' when toggleable=true", () => {
            component.toggleable.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("role")).toBe("checkbox");
        });

        it("should NOT set role when toggleable=false", () => {
            component.toggleable.set(false);
            fixture.detectChanges();
            expect(chipElement.getAttribute("role")).toBeNull();
        });

        it("should set aria-checked='false' when selected=false", () => {
            component.toggleable.set(true);
            component.selected.set(false);
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-checked")).toBe("false");
        });

        it("should set aria-checked='true' when selected=true", () => {
            component.toggleable.set(true);
            component.selected.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-checked")).toBe("true");
        });

        it("should toggle selected on click when toggleable", async () => {
            component.toggleable.set(true);
            component.selected.set(false);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).toHaveBeenCalledWith(true);
        });

        it("should toggle from true to false on click", async () => {
            component.toggleable.set(true);
            component.selected.set(true);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).toHaveBeenCalledWith(false);
        });

        it("should toggle selected on Enter key when toggleable", async () => {
            component.toggleable.set(true);
            component.selected.set(false);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onSelectedChange).toHaveBeenCalledWith(true);
        });

        it("should toggle selected on Space key when toggleable", async () => {
            component.toggleable.set(true);
            component.selected.set(false);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onSelectedChange).toHaveBeenCalledWith(true);
        });

        it("should emit contentClick when toggled", async () => {
            component.toggleable.set(true);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).toHaveBeenCalled();
        });

        it("should set tabindex=0 when toggleable", () => {
            component.toggleable.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("0");
        });
    });

    // =========================================================================
    // Size Input Tests
    // =========================================================================
    describe("size input", () => {
        it("should apply small size styles", () => {
            component.size.set("small");
            fixture.detectChanges();
            expect(chipElement.classList.length).toBeGreaterThan(0);
        });

        it("should apply medium size styles (default)", () => {
            component.size.set("medium");
            fixture.detectChanges();
            expect(chipElement.classList.length).toBeGreaterThan(0);
        });

        it("should apply large size styles", () => {
            component.size.set("large");
            fixture.detectChanges();
            expect(chipElement.classList.length).toBeGreaterThan(0);
        });
    });

    // =========================================================================
    // Look Input Tests
    // =========================================================================
    describe("look input", () => {
        it("should apply default look with a raised neutral surface and no passive hover", () => {
            component.look.set("default");
            fixture.detectChanges();
            expect(
                chipElement.classList.contains(
                    "[background-color:var(--mona-effect-raised-background-color,var(--color-surface-raised))]"
                )
            ).toBe(true);
            expect(chipElement.classList.contains("text-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-hover")).toBe(false);
            expect(chipElement.classList.contains("cursor-pointer")).toBe(false);
        });

        it("should apply primary look with bg-primary and text-primary-foreground", () => {
            component.look.set("primary");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-primary")).toBe(true);
            expect(chipElement.classList.contains("text-primary-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-primary-hover")).toBe(false);
        });

        it("should apply success look with bg-success and text-success-foreground", () => {
            component.look.set("success");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-success")).toBe(true);
            expect(chipElement.classList.contains("text-success-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-success-hover")).toBe(false);
        });

        it("should apply error look with bg-error and text-error-foreground", () => {
            component.look.set("error");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-error")).toBe(true);
            expect(chipElement.classList.contains("text-error-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-error-hover")).toBe(false);
        });

        it("should apply warning look with bg-warning and text-warning-foreground", () => {
            component.look.set("warning");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-warning")).toBe(true);
            expect(chipElement.classList.contains("text-warning-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-warning-hover")).toBe(false);
        });

        it("should apply info look with bg-info and text-info-foreground", () => {
            component.look.set("info");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-info")).toBe(true);
            expect(chipElement.classList.contains("text-info-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-info-hover")).toBe(false);
        });

        it("should apply outline look with a control boundary and no passive hover", () => {
            component.look.set("outline");
            fixture.detectChanges();
            expect(chipElement.classList.contains("border-input-border")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-hover")).toBe(false);
        });

        it("should apply secondary look with bg-secondary and text-secondary-foreground", () => {
            component.look.set("secondary");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-secondary")).toBe(true);
            expect(chipElement.classList.contains("text-secondary-foreground")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-secondary-hover")).toBe(false);
        });

        it("should apply ghost look with no passive hover", () => {
            component.look.set("ghost");
            fixture.detectChanges();
            expect(chipElement.classList.contains("bg-transparent")).toBe(true);
            expect(chipElement.classList.contains("hover:bg-hover")).toBe(false);
        });

        it.each(["default", "outline", "ghost"] as const)("uses neutral selection for the %s look", look => {
            component.look.set(look);
            component.selected.set(true);
            fixture.detectChanges();

            expect(chipElement.classList.contains("bg-(--color-selected)")).toBe(true);
            expect(chipElement.classList.contains("text-(--color-selected-foreground)")).toBe(true);
            expect(chipElement.classList.contains("bg-primary-selected")).toBe(false);
        });

        it("keeps primary selection for the explicit primary look", () => {
            component.look.set("primary");
            component.selected.set(true);
            fixture.detectChanges();

            expect(chipElement.classList.contains("bg-primary-selected")).toBe(true);
            expect(chipElement.classList.contains("text-primary-foreground")).toBe(true);
        });

        it.each([
            "default",
            "primary",
            "secondary",
            "success",
            "error",
            "warning",
            "info",
            "outline",
            "ghost"
        ] as const)("does NOT apply pointer cursor or hover classes for %s look when passive", look => {
            component.look.set(look);
            component.toggleable.set(false);
            fixture.detectChanges();

            expect(chipElement.classList.contains("cursor-pointer")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-hover")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-primary-hover")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-secondary-hover")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-success-hover")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-error-hover")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-warning-hover")).toBe(false);
            expect(chipElement.classList.contains("hover:bg-info-hover")).toBe(false);
        });

        it.each([
            "default",
            "primary",
            "secondary",
            "success",
            "error",
            "warning",
            "info",
            "outline",
            "ghost"
        ] as const)("applies cursor-pointer and focus-visible classes for %s look when toggleable", look => {
            component.look.set(look);
            component.toggleable.set(true);
            fixture.detectChanges();

            expect(chipElement.classList.contains("cursor-pointer")).toBe(true);
            expect(chipElement.classList.contains("focus-visible:ring-2")).toBe(true);
        });
    });

    // =========================================================================
    // Rounded Input Tests
    // =========================================================================
    describe("rounded input", () => {
        it("should apply full rounded (default)", () => {
            component.rounded.set("full");
            fixture.detectChanges();
            expect(chipElement.classList.contains("rounded-full")).toBe(true);
        });

        it("should apply medium rounded", () => {
            component.rounded.set("medium");
            fixture.detectChanges();
            expect(chipElement.classList.contains("rounded-md")).toBe(true);
        });

        it("should apply small rounded", () => {
            component.rounded.set("small");
            fixture.detectChanges();
            expect(chipElement.classList.contains("rounded-sm")).toBe(true);
        });

        it("should apply large rounded", () => {
            component.rounded.set("large");
            fixture.detectChanges();
            expect(chipElement.classList.contains("rounded-lg")).toBe(true);
        });

        it("should apply none rounded", () => {
            component.rounded.set("none");
            fixture.detectChanges();
            expect(chipElement.classList.contains("rounded-none")).toBe(true);
        });
    });

    // =========================================================================
    // Tabindex Input Tests
    // =========================================================================
    describe("tabindex input", () => {
        it("should use explicit tabindex when provided", () => {
            component.tabindex.set(5);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("5");
        });

        it("should accept string tabindex", () => {
            component.tabindex.set("3");
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("3");
        });

        it("should return -1 when disabled regardless of explicit value", () => {
            component.tabindex.set(5);
            component.disabled.set(true);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("-1");
        });

        it("should return 0 when toggleable and no explicit value", () => {
            component.toggleable.set(true);
            component.tabindex.set(undefined);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("0");
        });

        it("should return -1 when removable and no explicit value", () => {
            component.removable.set(true);
            component.tabindex.set(undefined);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("-1");
        });

        it("should return -1 when not interactive and no explicit value", () => {
            // When toggleable=false, removable=false, and no explicit tabindex, returns -1
            component.toggleable.set(false);
            component.removable.set(false);
            component.tabindex.set(undefined);
            fixture.detectChanges();
            expect(chipElement.getAttribute("tabindex")).toBe("-1");
        });
    });

    // =========================================================================
    // ARIA Attribute Tests
    // =========================================================================
    describe("aria attributes", () => {
        it("should use ariaLabel input when provided", () => {
            component.ariaLabel.set("Custom Aria Label");
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-label")).toBe("Custom Aria Label");
        });

        it("should fall back to label for aria-label", () => {
            component.ariaLabel.set(undefined);
            component.label.set("Chip Label");
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-label")).toBe("Chip Label");
        });

        it("should have no aria-label when neither provided", () => {
            component.ariaLabel.set(undefined);
            component.label.set("");
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-label")).toBeNull();
        });

        it("should prefer ariaLabel over label", () => {
            component.ariaLabel.set("Aria Label");
            component.label.set("Label");
            fixture.detectChanges();
            expect(chipElement.getAttribute("aria-label")).toBe("Aria Label");
        });
    });

    // =========================================================================
    // User Class Input Tests
    // =========================================================================
    describe("userClass input", () => {
        it("should merge user classes with variant classes", () => {
            component.userClass.set("my-custom-class");
            fixture.detectChanges();
            expect(chipElement.classList.contains("my-custom-class")).toBe(true);
        });

        it("should support multiple user classes", () => {
            component.userClass.set("class-a class-b");
            fixture.detectChanges();
            expect(chipElement.classList.contains("class-a")).toBe(true);
            expect(chipElement.classList.contains("class-b")).toBe(true);
        });

        it("should override horizontal padding with px-*", () => {
            component.size.set("medium");
            component.userClass.set("px-6");
            fixture.detectChanges();

            expect(chipElement.classList.contains("px-6")).toBe(true);
            expect(chipElement.classList.contains("px-1.5")).toBe(false);
            expect(chipElement.classList.contains("py-1")).toBe(true);
        });

        it("should override vertical padding with py-*", () => {
            component.size.set("medium");
            component.userClass.set("py-4");
            fixture.detectChanges();

            expect(chipElement.classList.contains("py-4")).toBe(true);
            expect(chipElement.classList.contains("py-1")).toBe(false);
            expect(chipElement.classList.contains("px-1.5")).toBe(true);
        });

        it("should override all padding with p-*", () => {
            component.size.set("medium");
            component.userClass.set("p-4");
            fixture.detectChanges();

            expect(chipElement.classList.contains("p-4")).toBe(true);
            expect(chipElement.classList.contains("px-1.5")).toBe(false);
            expect(chipElement.classList.contains("py-1")).toBe(false);
        });

        it("should support targeted logical side customization with ps-* and pe-*", () => {
            component.size.set("medium");
            component.userClass.set("ps-4 pe-0");
            fixture.detectChanges();

            expect(chipElement.classList.contains("ps-4")).toBe(true);
            expect(chipElement.classList.contains("pe-0")).toBe(true);
        });

        it("should update classes dynamically when class signal changes", () => {
            component.userClass.set("px-2");
            fixture.detectChanges();
            expect(chipElement.classList.contains("px-2")).toBe(true);

            component.userClass.set("px-8");
            fixture.detectChanges();
            expect(chipElement.classList.contains("px-8")).toBe(true);
            expect(chipElement.classList.contains("px-2")).toBe(false);
        });

        it("should preserve user class override after dynamic size change", () => {
            component.size.set("small");
            component.userClass.set("px-8");
            fixture.detectChanges();
            expect(chipElement.classList.contains("px-8")).toBe(true);
            expect(chipElement.classList.contains("px-1")).toBe(false);

            component.size.set("large");
            fixture.detectChanges();
            expect(chipElement.classList.contains("px-8")).toBe(true);
            expect(chipElement.classList.contains("px-2")).toBe(false);
        });

        it("should support multiple utility category overrides", () => {
            component.userClass.set("px-5 py-2 rounded-full shadow-none");
            fixture.detectChanges();

            expect(chipElement.classList.contains("px-5")).toBe(true);
            expect(chipElement.classList.contains("py-2")).toBe(true);
            expect(chipElement.classList.contains("rounded-full")).toBe(true);
            expect(chipElement.classList.contains("shadow-none")).toBe(true);
        });

        it("validates tailwind-merge padding resolution contract directly", () => {
            expect(twMerge("px-1.5 py-1", "px-6")).toBe("py-1 px-6");
            expect(twMerge("px-1.5 py-1", "py-4")).toBe("px-1.5 py-4");
            expect(twMerge("px-1.5 py-1", "p-4")).toBe("p-4");
            expect(twMerge("px-1.5 py-1", "ps-4")).toBe("px-1.5 py-1 ps-4");
            expect(twMerge("px-1.5 py-1", "pe-4")).toBe("px-1.5 py-1 pe-4");
        });
    });

    // =========================================================================
    // Value Input Tests
    // =========================================================================
    describe("value input", () => {
        it("should accept and store value", () => {
            const testValue = { id: 1, name: "test" };
            component.value.set(testValue);
            fixture.detectChanges();
            expect(component.chipComponent().value()).toBe(testValue);
        });

        it("should accept primitive values", () => {
            component.value.set("string-value");
            fixture.detectChanges();
            expect(component.chipComponent().value()).toBe("string-value");
        });
    });

    // =========================================================================
    // Remove Label Input Tests
    // =========================================================================
    describe("removeLabel input", () => {
        it("should override the remove button aria-label when removeLabel is set", () => {
            component.removable.set(true);
            component.label.set("My Chip");
            component.removeLabel.set("Remove tag: My Chip");
            fixture.detectChanges();

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton.nativeElement.getAttribute("aria-label")).toBe("Remove tag: My Chip");
        });

        it("should fall back to computed label when removeLabel is not set", () => {
            component.removable.set(true);
            component.label.set("Fallback");
            component.removeLabel.set(undefined);
            fixture.detectChanges();

            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
            expect(removeButton.nativeElement.getAttribute("aria-label")).toBe("Remove, Fallback");
        });
    });

    // =========================================================================
    // Keyboard Interaction Tests
    // =========================================================================
    describe("keyboard interaction", () => {
        it("should prevent default on Space key", async () => {
            component.toggleable.set(true);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
            const preventDefaultSpy = vi.spyOn(event, "preventDefault");
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it("should prevent default on Enter key", async () => {
            component.toggleable.set(true);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
            const preventDefaultSpy = vi.spyOn(event, "preventDefault");
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it("should emit contentClick on Enter key", async () => {
            component.toggleable.set(true);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onContentClick).toHaveBeenCalled();
        });

        it("should emit contentClick on Space key", async () => {
            component.toggleable.set(true);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onContentClick).toHaveBeenCalled();
        });

        it("should NOT activate when disabled and keydown", async () => {
            component.toggleable.set(true);
            component.disabled.set(true);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should NOT emit contentClick when Enter is pressed while remove button has focus", async () => {
            component.removable.set(true);
            await waitForStable(fixture);

            // Dispatch from the remove button so event.target is the button when it bubbles to chip
            const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]")).nativeElement as HTMLElement;
            const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            removeButton.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should NOT emit contentClick on Enter key for non-toggleable chip even with explicit tabindex", async () => {
            component.toggleable.set(false);
            component.tabindex.set(0);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should NOT emit contentClick on Space key for non-toggleable chip", async () => {
            component.toggleable.set(false);
            await waitForStable(fixture);

            const event = new KeyboardEvent("keydown", { key: " ", bubbles: true });
            chipElement.dispatchEvent(event);
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Click Interaction Tests
    // =========================================================================
    describe("click interaction", () => {
        it("should emit contentClick on click when toggleable", async () => {
            component.toggleable.set(true);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).toHaveBeenCalled();
        });

        it("should NOT emit contentClick when passive chip is clicked", async () => {
            component.toggleable.set(false);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should NOT emit contentClick when removable-only chip host is clicked", async () => {
            component.removable.set(true);
            component.toggleable.set(false);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });

        it("should NOT emit contentClick when disabled", async () => {
            component.toggleable.set(true);
            component.disabled.set(true);
            await waitForStable(fixture);

            chipElement.click();
            await waitForStable(fixture);

            expect(component.onContentClick).not.toHaveBeenCalled();
        });
    });
});

// =============================================================================
// Prefix Template Tests
// =============================================================================

describe("ChipComponent with Prefix Template", () => {
    let fixture: ComponentFixture<TestChipWithPrefixHostComponent>;
    let chipElement: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestChipWithPrefixHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestChipWithPrefixHostComponent);
        fixture.detectChanges();
        chipElement = fixture.debugElement.query(By.css("mona-chip")).nativeElement;
    });

    it("should render prefix template when provided", () => {
        const prefixContent = fixture.debugElement.query(By.css("[data-testid='prefix-content']"));
        expect(prefixContent).toBeTruthy();
        expect(prefixContent.nativeElement.textContent).toBe("Prefix");
    });

    it("should render both prefix and label", () => {
        const prefixContent = fixture.debugElement.query(By.css("[data-testid='prefix-content']"));
        expect(prefixContent).toBeTruthy();
        expect(chipElement.textContent).toContain("Chip Label");
    });
});

// =============================================================================
// RouterLink Tests
// =============================================================================

describe("ChipComponent with RouterLink", () => {
    let fixture: ComponentFixture<TestChipWithRouterLinkHostComponent>;
    let component: TestChipWithRouterLinkHostComponent;
    let chipElement: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestChipWithRouterLinkHostComponent],
            providers: [provideRouter([])]
        }).compileComponents();

        fixture = TestBed.createComponent(TestChipWithRouterLinkHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        chipElement = fixture.debugElement.query(By.css("mona-chip")).nativeElement;
    });

    it("should apply interactive affordances when functioning as a link", () => {
        expect(chipElement.classList.contains("cursor-pointer")).toBe(true);
        expect(chipElement.classList.contains("focus-visible:ring-2")).toBe(true);
    });

    it("should set tabindex=0 for link chip when enabled", () => {
        expect(chipElement.getAttribute("tabindex")).toBe("0");
    });

    it("should remove interactive affordances and set tabindex=-1 when link chip is disabled", () => {
        component.disabled.set(true);
        fixture.detectChanges();

        expect(chipElement.getAttribute("tabindex")).toBe("-1");
        expect(chipElement.getAttribute("aria-disabled")).toBe("true");
        expect(chipElement.classList.contains("cursor-pointer")).toBe(false);
        expect(chipElement.classList.contains("pointer-events-none")).toBe(true);
    });

    it("should support class overrides on link chips", () => {
        component.userClass.set("px-6 py-3");
        fixture.detectChanges();

        expect(chipElement.classList.contains("px-6")).toBe(true);
        expect(chipElement.classList.contains("py-3")).toBe(true);
        expect(chipElement.classList.contains("px-1.5")).toBe(false);
        expect(chipElement.classList.contains("py-1")).toBe(false);
    });

    it("should keep remove button independently interactive on a link chip", async () => {
        component.removable.set(true);
        await waitForStable(fixture);

        const removeButton = fixture.debugElement.query(By.css("[data-chip-remove]"));
        expect(removeButton).toBeTruthy();
        expect(removeButton.nativeElement.getAttribute("tabindex")).toBe("0");

        removeButton.triggerEventHandler("click", new MouseEvent("click"));
        await waitForStable(fixture);

        expect(component.onRemove).toHaveBeenCalled();
    });
});
