import { ApplicationRef, Component, inject, signal, viewChild, viewChildren } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ButtonAriaHasPopup } from "../models/ButtonAriaHasPopup";
import { ButtonService } from "../services/button.service";
import { ButtonVariantProps } from "../styles/button.styles";
import { ButtonDirective } from "./button.directive";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `
        <button
            monaButton
            [disabled]="disabled()"
            [loading]="loading()"
            [look]="look()"
            [size]="size()"
            [rounded]="rounded()"
            [iconOnly]="iconOnly()"
            [selected]="selected()"
            [tabindex]="tabindex()"
            [toggleable]="toggleable()"
            [aria-haspopup]="ariaHasPopup()"
            [class]="userClass()"
            [type]="type()"
            (selectedChange)="onSelectedChange($event)">
            Test Button
        </button>
    `,
    imports: [ButtonDirective]
})
class TestButtonHostComponent {
    ariaHasPopup = signal<ButtonAriaHasPopup>("false");
    buttonDirective = viewChild.required(ButtonDirective);
    disabled = signal(false);
    iconOnly = signal(false);
    loading = signal(false);
    look = signal<ButtonVariantProps["look"]>("default");
    onSelectedChange = vi.fn();
    rounded = signal<ButtonVariantProps["rounded"]>("medium");
    selected = signal(false);
    size = signal<ButtonVariantProps["size"]>("medium");
    tabindex = signal<number | string>(0);
    toggleable = signal(false);
    type = signal<"button" | "reset" | "submit">("button");
    userClass = signal("");
}

// =============================================================================
// Helper Functions
// =============================================================================

function loaderSvg(button: HTMLButtonElement): SVGElement | null {
    return button.querySelector("mona-indicator-icon svg");
}

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

// =============================================================================
// Test Suite
// =============================================================================

describe("ButtonDirective", () => {
    let fixture: ComponentFixture<TestButtonHostComponent>;
    let component: TestButtonHostComponent;
    let buttonElement: HTMLButtonElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestButtonHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestButtonHostComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        buttonElement = fixture.debugElement.query(By.css("button")).nativeElement;
    });

    // =========================================================================
    // Initialization Tests
    // =========================================================================
    describe("initialization", () => {
        it("should create the directive", () => {
            expect(component.buttonDirective()).toBeTruthy();
        });

        it("should set type='button' attribute", () => {
            expect(buttonElement.getAttribute("type")).toBe("button");
        });

        it("should apply default variant classes", () => {
            expect(buttonElement.classList.length).toBeGreaterThan(0);
            expect(buttonElement.getAttribute("data-look")).toBe("default");
            expect(buttonElement.getAttribute("data-size")).toBe("medium");
            expect(
                buttonElement.classList.contains(
                    "[background-color:var(--mona-effect-control-background-color,var(--color-input-background))]"
                )
            ).toBe(true);
            expect(buttonElement.classList.contains("border-border")).toBe(true);
            expect(buttonElement.classList.contains("hover:bg-hover")).toBe(true);
            expect(buttonElement.classList.contains("active:bg-active")).toBe(true);
            expect(buttonElement.classList.contains("focus-visible:outline-focus-indicator")).toBe(true);
            expect(buttonElement.classList.contains("bg-accent")).toBe(false);
            expect(buttonElement.classList.contains("shadow-(--shadow-control)")).toBe(false);
        });
    });

    // =========================================================================
    // Disabled Input Tests
    // =========================================================================
    describe("disabled input", () => {
        it("should NOT set disabled attribute when disabled=false", () => {
            component.disabled.set(false);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(false);
        });

        it("should set disabled attribute when disabled=true", () => {
            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(true);
        });

        it("should set aria-disabled when disabled=true", () => {
            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-disabled")).toBe("true");
        });

        it("should set tabindex=-1 when disabled=true", () => {
            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("-1");
        });

        it("should NOT set aria-disabled when disabled=false", () => {
            component.disabled.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-disabled")).toBeNull();
        });

        it("should keep disabled ghost buttons transparent", () => {
            component.look.set("ghost");
            component.disabled.set(true);
            fixture.detectChanges();

            expect(buttonElement.classList.contains("disabled:bg-transparent")).toBe(true);
            expect(buttonElement.classList.contains("disabled:bg-disabled-background")).toBe(false);
            expect(buttonElement.classList.contains("disabled:text-disabled-foreground")).toBe(true);
        });
    });

    // =========================================================================
    // Loading Input Tests
    // =========================================================================
    describe("loading input", () => {
        it("should NOT set aria-busy when loading=false", () => {
            component.loading.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-busy")).toBeNull();
        });

        it("should set aria-busy='true' when loading=true", () => {
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-busy")).toBe("true");
        });

        it("should set aria-disabled when loading=true", () => {
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-disabled")).toBe("true");
        });

        it("should keep the button focusable when loading=true", () => {
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(false);
            expect(buttonElement.getAttribute("tabindex")).toBe("0");
        });

        it("should block clicks while loading", () => {
            const onClick = vi.fn();
            buttonElement.addEventListener("click", onClick);
            component.toggleable.set(true);
            component.loading.set(true);
            fixture.detectChanges();

            const event = new MouseEvent("click", { bubbles: true, cancelable: true });
            buttonElement.dispatchEvent(event);
            fixture.detectChanges();

            expect(event.defaultPrevented).toBe(true);
            expect(onClick).not.toHaveBeenCalled();
            expect(component.onSelectedChange).not.toHaveBeenCalled();
        });

        it("should accept clicks again when loading ends", () => {
            const onClick = vi.fn();
            buttonElement.addEventListener("click", onClick);
            component.loading.set(true);
            fixture.detectChanges();
            component.loading.set(false);
            fixture.detectChanges();

            buttonElement.click();
            expect(onClick).toHaveBeenCalledTimes(1);
        });

        it("should create loading indicator element when loading=true", async () => {
            component.loading.set(true);
            await waitForStable(fixture);
            const loader = buttonElement.querySelector("mona-indicator-icon");
            expect(loader).toBeTruthy();
        });

        it("should remove loading indicator when loading changes from true to false", async () => {
            component.loading.set(true);
            await waitForStable(fixture);
            expect(buttonElement.querySelector("mona-indicator-icon")).toBeTruthy();

            component.loading.set(false);
            await waitForStable(fixture);
            expect(buttonElement.querySelector("mona-indicator-icon")).toBeNull();
        });

        it("should set loader size=12 for size='small'", async () => {
            component.size.set("small");
            component.loading.set(true);
            await waitForStable(fixture);
            expect(loaderSvg(buttonElement)?.getAttribute("width")).toBe("12");
        });

        it("should set loader size=14 for size='medium'", async () => {
            component.size.set("medium");
            component.loading.set(true);
            await waitForStable(fixture);
            expect(loaderSvg(buttonElement)?.getAttribute("width")).toBe("14");
        });

        it("should set loader size=16 for size='large'", async () => {
            component.size.set("large");
            component.loading.set(true);
            await waitForStable(fixture);
            expect(loaderSvg(buttonElement)?.getAttribute("width")).toBe("16");
        });

        it("should resize the loader when size changes while loading", async () => {
            component.size.set("small");
            component.loading.set(true);
            await waitForStable(fixture);
            component.size.set("large");
            await waitForStable(fixture);
            expect(buttonElement.querySelectorAll("mona-indicator-icon").length).toBe(1);
            expect(loaderSvg(buttonElement)?.getAttribute("width")).toBe("16");
        });
    });

    // =========================================================================
    // Look Input Tests
    // =========================================================================
    describe("look input", () => {
        it("should set data-look attribute to 'default' by default", () => {
            expect(buttonElement.getAttribute("data-look")).toBe("default");
        });

        it("should update data-look when look changes to 'primary'", () => {
            component.look.set("primary");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("primary");
            expect(buttonElement.classList.contains("bg-primary")).toBe(true);
            expect(buttonElement.classList.contains("hover:bg-primary-hover")).toBe(true);
        });

        it("should update data-look when look changes to 'success'", () => {
            component.look.set("success");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("success");
        });

        it("should update data-look when look changes to 'error'", () => {
            component.look.set("error");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("error");
        });

        it("should update data-look when look changes to 'warning'", () => {
            component.look.set("warning");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("warning");
        });

        it("should update data-look when look changes to 'outline'", () => {
            component.look.set("outline");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("outline");
        });

        it("should update data-look when look changes to 'ghost'", () => {
            component.look.set("ghost");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("ghost");
        });

        it("should update data-look when look changes to 'link'", () => {
            component.look.set("link");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("link");
        });
    });

    // =========================================================================
    // Size Input Tests
    // =========================================================================
    describe("size input", () => {
        it("should set data-size attribute to 'medium' by default", () => {
            expect(buttonElement.getAttribute("data-size")).toBe("medium");
        });

        it("should update data-size when size changes to 'small'", () => {
            component.size.set("small");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-size")).toBe("small");
        });

        it("should update data-size when size changes to 'large'", () => {
            component.size.set("large");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-size")).toBe("large");
        });
    });

    // =========================================================================
    // ariaHasPopup Input Tests
    // =========================================================================
    describe("ariaHasPopup input", () => {
        it("should omit aria-haspopup by default", () => {
            expect(buttonElement.getAttribute("aria-haspopup")).toBeNull();
        });

        it("should set aria-haspopup to provided value", () => {
            component.ariaHasPopup.set("menu");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-haspopup")).toBe("menu");
        });

        it("should set aria-haspopup to 'listbox'", () => {
            component.ariaHasPopup.set("listbox");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-haspopup")).toBe("listbox");
        });

        it("should set aria-haspopup to 'true'", () => {
            component.ariaHasPopup.set("true");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-haspopup")).toBe("true");
        });
    });

    // =========================================================================
    // Tabindex Input Tests
    // =========================================================================
    describe("tabindex input", () => {
        it("should set tabindex=0 by default", () => {
            expect(buttonElement.getAttribute("tabindex")).toBe("0");
        });

        it("should accept numeric tabindex and set attribute", () => {
            component.tabindex.set(5);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("5");
        });

        it("should accept string tabindex and convert to number", () => {
            component.tabindex.set("3");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("3");
        });

        it("should override tabindex to -1 when disabled", () => {
            component.tabindex.set(5);
            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("-1");
        });
    });

    // =========================================================================
    // userClass Input Tests
    // =========================================================================
    describe("userClass input", () => {
        it("should merge user-provided classes with variant classes", () => {
            component.userClass.set("my-custom-class");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("my-custom-class")).toBe(true);
        });

        it("should support multiple user classes", () => {
            component.userClass.set("class-a class-b");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("class-a")).toBe(true);
            expect(buttonElement.classList.contains("class-b")).toBe(true);
        });
    });

    // =========================================================================
    // Rounded Input Tests
    // =========================================================================
    describe("rounded input", () => {
        it("should apply rounded-md class by default (medium)", () => {
            expect(buttonElement.classList.contains("rounded-md")).toBe(true);
        });

        it("should apply rounded-full class when rounded='full'", () => {
            component.rounded.set("full");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("rounded-full")).toBe(true);
        });

        it("should apply rounded-lg class when rounded='large'", () => {
            component.rounded.set("large");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("rounded-lg")).toBe(true);
        });

        it("should apply rounded-sm class when rounded='small'", () => {
            component.rounded.set("small");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("rounded-sm")).toBe(true);
        });

        it("should apply rounded-none class when rounded='none'", () => {
            component.rounded.set("none");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("rounded-none")).toBe(true);
        });
    });

    // =========================================================================
    // IconOnly Input Tests
    // =========================================================================
    describe("iconOnly input", () => {
        it("should apply aspect-auto class when iconOnly=false", () => {
            component.iconOnly.set(false);
            fixture.detectChanges();
            expect(buttonElement.classList.contains("aspect-auto")).toBe(true);
        });

        it("should apply aspect-square class when iconOnly=true", () => {
            component.iconOnly.set(true);
            fixture.detectChanges();
            expect(buttonElement.classList.contains("aspect-square")).toBe(true);
        });

        it("should keep the square size and show only the loader while loading", () => {
            component.iconOnly.set(true);
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.classList).toContain("w-9");
            expect(buttonElement.classList).toContain("p-0");
            expect(buttonElement.classList).toContain("[&>:not(mona-indicator-icon)]:hidden");
        });
    });

    // =========================================================================
    // Toggleable Behavior Tests
    // =========================================================================
    describe("toggleable behavior", () => {
        it("should NOT set aria-pressed when toggleable=false", () => {
            component.toggleable.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-pressed")).toBeNull();
        });

        it("should set aria-pressed='false' when toggleable=true and selected=false", () => {
            component.toggleable.set(true);
            component.selected.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-pressed")).toBe("false");
        });

        it("should set aria-pressed='true' when toggleable=true and selected=true", () => {
            component.toggleable.set(true);
            component.selected.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-pressed")).toBe("true");
        });

        it("should toggle selected on click when toggleable=true", async () => {
            component.toggleable.set(true);
            component.selected.set(false);
            await waitForStable(fixture);

            buttonElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).toHaveBeenCalledWith(true);
        });

        it("should toggle from true to false on click when toggleable=true", async () => {
            component.toggleable.set(true);
            component.selected.set(true);
            await waitForStable(fixture);

            buttonElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).toHaveBeenCalledWith(false);
        });

        it("should NOT toggle when disabled", async () => {
            component.toggleable.set(true);
            component.selected.set(false);
            component.disabled.set(true);
            await waitForStable(fixture);

            buttonElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).not.toHaveBeenCalled();
        });

        it("should NOT toggle when toggleable=false", async () => {
            component.toggleable.set(false);
            component.selected.set(false);
            await waitForStable(fixture);

            buttonElement.click();
            await waitForStable(fixture);

            expect(component.onSelectedChange).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Selected Input Tests
    // =========================================================================
    describe("selected input", () => {
        it("should apply selected styles when selected=true", () => {
            component.selected.set(true);
            fixture.detectChanges();
            expect(buttonElement.classList.contains("bg-(--color-selected)")).toBe(true);
            expect(buttonElement.classList.contains("text-(--color-selected-foreground)")).toBe(true);
            expect(buttonElement.classList.contains("bg-primary-selected")).toBe(false);
        });

        it.each([
            ["primary", "bg-primary-selected"],
            ["secondary", "bg-secondary-selected"],
            ["success", "bg-success-selected"],
            ["error", "bg-error-selected"],
            ["warning", "bg-warning-selected"],
            ["info", "bg-info-selected"]
        ] as const)("should preserve the %s selected fill through hover", (look, selectedClass) => {
            component.look.set(look);
            component.selected.set(true);
            fixture.detectChanges();

            expect(buttonElement.classList.contains(selectedClass)).toBe(true);
            expect(buttonElement.classList.contains(`hover:${selectedClass}`)).toBe(true);
        });
    });

    // =========================================================================
    // Type Input Tests
    // =========================================================================
    describe("type input", () => {
        it("should set type='button' by default", () => {
            expect(buttonElement.getAttribute("type")).toBe("button");
        });

        it("should set type='submit' when type='submit'", () => {
            component.type.set("submit");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("type")).toBe("submit");
        });

        it("should set type='reset' when type='reset'", () => {
            component.type.set("reset");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("type")).toBe("reset");
        });
    });

    // =========================================================================
    // Accessibility Tests
    // =========================================================================
    describe("accessibility", () => {
        it("should default to type='button' for accidental-submit safety", () => {
            expect(buttonElement.getAttribute("type")).toBe("button");
        });

        it("should draw focus as a full-opacity outline for every look", () => {
            const looks: ButtonVariantProps["look"][] = [
                "default",
                "primary",
                "secondary",
                "success",
                "error",
                "warning",
                "info",
                "outline",
                "ghost",
                "link",
                "clear"
            ];
            for (const look of looks) {
                component.look.set(look);
                fixture.detectChanges();
                expect(buttonElement.classList).toContain("focus-visible:outline-2");
                expect(buttonElement.classList).toContain("focus-visible:outline-focus-indicator");
                expect(buttonElement.className).not.toMatch(/ring-|outline-none/);
            }
        });

        it("should have correct aria-busy state when loading", () => {
            component.loading.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-busy")).toBeNull();

            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-busy")).toBe("true");
        });

        it("should have correct aria-disabled state", () => {
            component.disabled.set(false);
            component.loading.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-disabled")).toBeNull();

            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-disabled")).toBe("true");

            component.disabled.set(false);
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-disabled")).toBe("true");
        });

        it("should have correct aria-pressed state for toggleable buttons", () => {
            // Non-toggleable should not have aria-pressed
            component.toggleable.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-pressed")).toBeNull();

            // Toggleable and not selected
            component.toggleable.set(true);
            component.selected.set(false);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-pressed")).toBe("false");

            // Toggleable and selected
            component.selected.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-pressed")).toBe("true");
        });

        it("should have correct tabindex for keyboard navigation", () => {
            // Default tabindex
            expect(buttonElement.getAttribute("tabindex")).toBe("0");

            // Disabled removes from tab order
            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("-1");

            // Loading keeps the button in the tab order so focus isn't lost
            component.disabled.set(false);
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("0");
        });

        it("should have aria-haspopup for popup triggers", () => {
            component.ariaHasPopup.set("menu");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("aria-haspopup")).toBe("menu");
        });
    });
});

// =============================================================================
// ButtonService Integration Tests
// =============================================================================

@Component({
    selector: "mona-test-nested-button",
    template: `<button monaButton id="nested">Nested</button>`,
    imports: [ButtonDirective]
})
class TestNestedButtonComponent {}

@Component({
    template: `
        <button
            monaButton
            [disabled]="disabled()"
            [look]="look()"
            [size]="size()"
            [rounded]="rounded()"
            [selected]="selected()"
            (selectedChange)="onSelectedChange($event)">
            Test Button
        </button>
        <button monaButton id="action" [toggleable]="false">Action</button>
        <mona-test-nested-button />
    `,
    imports: [ButtonDirective, TestNestedButtonComponent],
    providers: [ButtonService]
})
class TestButtonWithServiceHostComponent {
    readonly buttons = viewChildren(ButtonDirective);
    buttonDirective = viewChild.required(ButtonDirective);
    disabled = signal(false);
    look = signal<ButtonVariantProps["look"]>("default");
    onSelectedChange = vi.fn();
    rounded = signal<ButtonVariantProps["rounded"]>("medium");
    selected = signal(false);
    size = signal<ButtonVariantProps["size"]>("medium");

    public constructor() {
        inject(ButtonService).setMembers(this.buttons);
    }
}

describe("ButtonDirective with ButtonService", () => {
    let fixture: ComponentFixture<TestButtonWithServiceHostComponent>;
    let component: TestButtonWithServiceHostComponent;
    let buttonElement: HTMLButtonElement;
    let buttonService: ButtonService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestButtonWithServiceHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestButtonWithServiceHostComponent);
        component = fixture.componentInstance;
        buttonService = fixture.debugElement.injector.get(ButtonService);
        fixture.detectChanges();
        buttonElement = fixture.debugElement.query(By.css("button")).nativeElement;
    });

    // =========================================================================
    // Button Group Context Detection Tests
    // =========================================================================
    describe("button group context", () => {
        it("should behave as toggleable when ButtonService is available", () => {
            // When in a button group context, the button should have aria-pressed
            expect(buttonElement.getAttribute("aria-pressed")).not.toBeNull();
        });

        it("should inherit group look from ButtonService", () => {
            buttonService.groupLook.set("warning");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("warning");
        });
    });

    // =========================================================================
    // effectiveLook Computed Tests
    // =========================================================================
    describe("effectiveLook", () => {
        it("should use own look when group look is undefined", () => {
            component.look.set("primary");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("primary");
        });

        it("should use group look when set in ButtonService", () => {
            component.look.set("default");
            buttonService.groupLook.set("success");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("success");
        });

        it("should update when group look changes", () => {
            buttonService.groupLook.set("primary");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("primary");

            buttonService.groupLook.set("error");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-look")).toBe("error");
        });
    });

    // =========================================================================
    // effectiveSize Computed Tests
    // =========================================================================
    describe("effectiveSize", () => {
        it("should use own size when group size is undefined", () => {
            component.size.set("large");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-size")).toBe("large");
        });

        it("should use group size when set in ButtonService", () => {
            component.size.set("medium");
            buttonService.groupSize.set("small");
            fixture.detectChanges();
            expect(buttonElement.getAttribute("data-size")).toBe("small");
        });
    });

    // =========================================================================
    // effectiveRounded Computed Tests
    // =========================================================================
    describe("effectiveRounded", () => {
        it("should use own rounded when group rounded is undefined", () => {
            component.rounded.set("full");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("rounded-full")).toBe(true);
        });

        it("should use group rounded when set in ButtonService", () => {
            component.rounded.set("medium");
            buttonService.groupRounded.set("none");
            fixture.detectChanges();
            expect(buttonElement.classList.contains("rounded-none")).toBe(true);
        });
    });

    // =========================================================================
    // effectiveDisabled Computed Tests
    // =========================================================================
    describe("effectiveDisabled", () => {
        it("should be disabled when own disabled is true", () => {
            component.disabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(true);
        });

        it("should be disabled when group disabled is true", () => {
            component.disabled.set(false);
            buttonService.groupDisabled.set(true);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(true);
            expect(buttonElement.getAttribute("aria-disabled")).toBe("true");
        });

        it("should NOT be disabled when both group and own disabled are false", () => {
            component.disabled.set(false);
            buttonService.groupDisabled.set(false);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(false);
        });
    });

    // =========================================================================
    // effectiveToggleable Behavior Tests
    // =========================================================================
    describe("effectiveToggleable", () => {
        it("should behave as toggleable when inside a button group", async () => {
            component.selected.set(false);
            await waitForStable(fixture);
            expect(buttonElement.getAttribute("aria-pressed")).toBe("false");
        });

        it("should toggle selected via ButtonService on click", async () => {
            component.selected.set(false);
            await waitForStable(fixture);

            // When button is clicked in a group context, it should emit to buttonClick$
            let clickedButton: ButtonDirective | null = null;
            buttonService.buttonClick$.subscribe(([btn]) => {
                clickedButton = btn;
            });

            buttonElement.click();
            await waitForStable(fixture);

            expect(clickedButton).toBe(component.buttonDirective());
        });

        it("should NOT toggle when disabled via group", async () => {
            component.selected.set(false);
            buttonService.groupDisabled.set(true);
            await waitForStable(fixture);

            let clickedButton: ButtonDirective | null = null;
            buttonService.buttonClick$.subscribe(([btn]) => {
                clickedButton = btn;
            });

            buttonElement.click();
            await waitForStable(fixture);

            expect(clickedButton).toBeNull();
        });
    });

    // =========================================================================
    // ButtonService buttonSelect$ Subscription Tests
    // =========================================================================
    describe("buttonSelect$ subscription", () => {
        it("should update selected state when buttonSelect$ emits", async () => {
            component.selected.set(false);
            await waitForStable(fixture);

            buttonService.buttonSelect$.next([component.buttonDirective(), true]);
            await waitForStable(fixture);

            expect(component.buttonDirective().selected()).toBe(true);
        });

        it("should NOT update selected when buttonSelect$ emits for different button", async () => {
            component.selected.set(false);
            await waitForStable(fixture);

            // Create a mock button that isn't our button
            const mockButton = {} as ButtonDirective;
            buttonService.buttonSelect$.next([mockButton, true]);
            await waitForStable(fixture);

            expect(component.buttonDirective().selected()).toBe(false);
        });
    });
});

// =============================================================================
// Bare Attribute Tests
// =============================================================================

@Component({
    template: `
        <button monaButton disabled id="disabled">Disabled</button>
        <button monaButton loading id="loading">Loading</button>
        <button monaButton iconOnly aria-label="Icon" id="icon-only">I</button>
        <button monaButton toggleable id="toggleable">Toggle</button>
        <button monaButton toggleable="false" id="not-toggleable">Plain</button>
        <button monaButton tabindex="abc" id="bad-tabindex">Tab</button>
    `,
    imports: [ButtonDirective]
})
class TestBareAttributesHostComponent {}

describe("ButtonDirective bare attributes", () => {
    let fixture: ComponentFixture<TestBareAttributesHostComponent>;
    const button = (id: string): HTMLButtonElement => fixture.nativeElement.querySelector(`#${id}`);

    beforeEach(async () => {
        fixture = TestBed.createComponent(TestBareAttributesHostComponent);
        await waitForStable(fixture);
    });

    it("should keep a bare disabled button disabled", () => {
        const onClick = vi.fn();
        button("disabled").addEventListener("click", onClick);
        button("disabled").click();
        expect(button("disabled").disabled).toBe(true);
        expect(button("disabled").getAttribute("aria-disabled")).toBe("true");
        expect(onClick).not.toHaveBeenCalled();
    });

    it("should show the loader for a bare loading attribute", () => {
        expect(button("loading").getAttribute("aria-busy")).toBe("true");
        expect(button("loading").querySelector("mona-indicator-icon")).toBeTruthy();
    });

    it("should apply icon-only styles for a bare iconOnly attribute", () => {
        expect(button("icon-only").classList).toContain("aspect-square");
    });

    it("should toggle with a bare toggleable attribute", async () => {
        expect(button("toggleable").getAttribute("aria-pressed")).toBe("false");
        button("toggleable").click();
        await waitForStable(fixture);
        expect(button("toggleable").getAttribute("aria-pressed")).toBe("true");
    });

    it("should treat a toggleable attribute of false as not toggleable", () => {
        expect(button("not-toggleable").hasAttribute("aria-pressed")).toBe(false);
    });

    it("should fall back to tabindex 0 for a non-numeric tabindex", () => {
        expect(button("bad-tabindex").getAttribute("tabindex")).toBe("0");
    });
});

// =============================================================================
// Loader Lifecycle Tests
// =============================================================================

@Component({
    template: `
        @if (shown()) {
            <button monaButton [loading]="loading()">Save</button>
        }
    `,
    imports: [ButtonDirective]
})
class TestLoaderLifecycleHostComponent {
    loading = signal(true);
    shown = signal(true);
}

describe("ButtonDirective loader lifecycle", () => {
    it("should detach the loader when a loading button is destroyed", async () => {
        const appRef = TestBed.inject(ApplicationRef);
        const fixture = TestBed.createComponent(TestLoaderLifecycleHostComponent);
        await waitForStable(fixture);
        const viewCount = appRef.viewCount;
        expect(fixture.nativeElement.querySelector("mona-indicator-icon")).toBeTruthy();

        fixture.componentInstance.shown.set(false);
        await waitForStable(fixture);
        expect(appRef.viewCount).toBe(viewCount - 1);

        fixture.componentInstance.shown.set(true);
        await waitForStable(fixture);
        fixture.componentInstance.shown.set(false);
        await waitForStable(fixture);
        expect(appRef.viewCount).toBe(viewCount - 1);
    });
});

// =============================================================================
// Group Membership Tests
// =============================================================================

describe("ButtonDirective group membership", () => {
    let fixture: ComponentFixture<TestButtonWithServiceHostComponent>;
    let buttonService: ButtonService;
    const button = (id: string): HTMLButtonElement => fixture.nativeElement.querySelector(`#${id}`);

    beforeEach(async () => {
        fixture = TestBed.createComponent(TestButtonWithServiceHostComponent);
        buttonService = fixture.debugElement.injector.get(ButtonService);
        await waitForStable(fixture);
    });

    it("should not announce a member with toggleable=false as a toggle", async () => {
        const clicks = vi.fn();
        buttonService.buttonClick$.subscribe(clicks);
        expect(button("action").hasAttribute("aria-pressed")).toBe(false);
        button("action").click();
        await waitForStable(fixture);
        expect(clicks).not.toHaveBeenCalled();
    });

    it("should leave buttons inside a nested component out of the group", async () => {
        const clicks = vi.fn();
        buttonService.buttonClick$.subscribe(clicks);
        buttonService.groupLook.set("warning");
        buttonService.groupDisabled.set(true);
        await waitForStable(fixture);

        expect(button("nested").hasAttribute("aria-pressed")).toBe(false);
        expect(button("nested").getAttribute("data-look")).toBe("default");
        expect(button("nested").disabled).toBe(false);
        button("nested").click();
        await waitForStable(fixture);
        expect(clicks).not.toHaveBeenCalled();
        expect(button("action").getAttribute("data-look")).toBe("warning");
    });
});

// =============================================================================
// Icon-Only Accessible Name Warning Tests
// =============================================================================

@Component({
    template: `
        @switch (variant()) {
            @case ("unnamed") {
                <button monaButton iconOnly><svg aria-hidden="true"></svg></button>
            }
            @case ("labelled") {
                <button monaButton iconOnly aria-label="Close"><svg aria-hidden="true"></svg></button>
            }
            @case ("text") {
                <button monaButton iconOnly><span class="sr-only">Close</span></button>
            }
        }
    `,
    imports: [ButtonDirective]
})
class TestIconOnlyNameHostComponent {
    variant = signal<"labelled" | "text" | "unnamed">("unnamed");
}

describe("ButtonDirective icon-only accessible name warning", () => {
    async function render(variant: "labelled" | "text" | "unnamed"): Promise<ReturnType<typeof vi.spyOn>> {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const fixture = TestBed.createComponent(TestIconOnlyNameHostComponent);
        fixture.componentInstance.variant.set(variant);
        await waitForStable(fixture);
        await waitForStable(fixture);
        return warn;
    }

    it("should warn once for an icon-only button without a name", async () => {
        const warn = await render("unnamed");
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toContain("[Mona Button]");
        warn.mockRestore();
    });

    it("should not warn when the button has an aria-label", async () => {
        const warn = await render("labelled");
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });

    it("should not warn when the button has text content", async () => {
        const warn = await render("text");
        expect(warn).not.toHaveBeenCalled();
        warn.mockRestore();
    });
});
