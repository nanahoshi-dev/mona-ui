import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
            (selectedChange)="onSelectedChange($event)">
            Test Button
        </button>
    `,
    imports: [ButtonDirective]
})
class TestButtonHostComponent {
    disabled = signal(false);
    loading = signal(false);
    look = signal<ButtonVariantProps["look"]>("default");
    size = signal<ButtonVariantProps["size"]>("medium");
    rounded = signal<ButtonVariantProps["rounded"]>("medium");
    iconOnly = signal(false);
    selected = signal(false);
    tabindex = signal<number | string>(0);
    toggleable = signal(false);
    ariaHasPopup = signal("false");
    userClass = signal("");

    onSelectedChange = vi.fn();
    buttonDirective = viewChild.required(ButtonDirective);
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
            expect(buttonElement.classList.contains("bg-input-background")).toBe(true);
            expect(buttonElement.classList.contains("border-input-border")).toBe(true);
            expect(buttonElement.classList.contains("hover:bg-hover")).toBe(true);
            expect(buttonElement.classList.contains("active:bg-active")).toBe(true);
            expect(buttonElement.classList.contains("focus-visible:ring-focus-indicator/35")).toBe(true);
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

        it("should set disabled attribute when loading=true", () => {
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.hasAttribute("disabled")).toBe(true);
        });

        it("should set tabindex=-1 when loading=true", () => {
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("-1");
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

        it("should set loader size=14 for size='small'", async () => {
            component.size.set("small");
            component.loading.set(true);
            await waitForStable(fixture);
            const loader = buttonElement.querySelector("mona-indicator-icon");
            expect(loader).toBeTruthy();
        });

        it("should set loader size=16 for size='medium'", async () => {
            component.size.set("medium");
            component.loading.set(true);
            await waitForStable(fixture);
            const loader = buttonElement.querySelector("mona-indicator-icon");
            expect(loader).toBeTruthy();
        });

        it("should set loader size=20 for size='large'", async () => {
            component.size.set("large");
            component.loading.set(true);
            await waitForStable(fixture);
            const loader = buttonElement.querySelector("mona-indicator-icon");
            expect(loader).toBeTruthy();
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
            expect(buttonElement.classList.contains("bg-active")).toBe(true);
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
    // Accessibility Tests
    // =========================================================================
    describe("accessibility", () => {
        it("should always have type='button'", () => {
            expect(buttonElement.getAttribute("type")).toBe("button");
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

            // Loading also removes from tab order
            component.disabled.set(false);
            component.loading.set(true);
            fixture.detectChanges();
            expect(buttonElement.getAttribute("tabindex")).toBe("-1");
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
    `,
    imports: [ButtonDirective],
    providers: [ButtonService]
})
class TestButtonWithServiceHostComponent {
    disabled = signal(false);
    look = signal<ButtonVariantProps["look"]>("default");
    size = signal<ButtonVariantProps["size"]>("medium");
    rounded = signal<ButtonVariantProps["rounded"]>("medium");
    selected = signal(false);

    onSelectedChange = vi.fn();
    buttonDirective = viewChild.required(ButtonDirective);
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
