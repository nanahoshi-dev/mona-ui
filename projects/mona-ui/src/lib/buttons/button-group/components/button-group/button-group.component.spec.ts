import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it } from "vitest";
import { SelectionMode } from "../../../../models/SelectionMode";
import { ButtonDirective } from "../../../button/directives/button.directive";
import { ButtonService } from "../../../services/button.service";
import { ButtonGroupVariantProps } from "../../styles/button-group.styles";
import { ButtonGroupComponent } from "./button-group.component";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `
        <mona-button-group
            [disabled]="disabled()"
            [look]="look()"
            [rounded]="rounded()"
            [size]="size()"
            [selection]="selection()"
            [class]="userClass()">
            <button monaButton>Button 1</button>
            <button monaButton>Button 2</button>
            <button monaButton>Button 3</button>
        </mona-button-group>
    `,
    imports: [ButtonGroupComponent, ButtonDirective]
})
class TestButtonGroupHostComponent {
    disabled = signal(false);
    look = signal<ButtonGroupVariantProps["look"]>("outline");
    rounded = signal<ButtonGroupVariantProps["rounded"]>("medium");
    size = signal<ButtonGroupVariantProps["size"]>("medium");
    selection = signal<SelectionMode>("multiple");
    userClass = signal("");

    buttonGroup = viewChild.required(ButtonGroupComponent);
}

@Component({
    template: `
        <mona-button-group [selection]="selection()">
            <button monaButton [selected]="selectedIndices().includes(0)">Button 1</button>
            <button monaButton [selected]="selectedIndices().includes(1)">Button 2</button>
            <button monaButton [selected]="selectedIndices().includes(2)">Button 3</button>
        </mona-button-group>
    `,
    imports: [ButtonGroupComponent, ButtonDirective]
})
class TestButtonGroupSelectionHostComponent {
    selection = signal<SelectionMode>("single");
    selectedIndices = signal<number[]>([]);

    buttonGroup = viewChild.required(ButtonGroupComponent);
}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getButtons(fixture: ComponentFixture<unknown>): ButtonDirective[] {
    return fixture.debugElement.queryAll(By.directive(ButtonDirective)).map(de => de.injector.get(ButtonDirective));
}

function getButtonElements(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
    return fixture.debugElement
        .queryAll(By.directive(ButtonDirective))
        .map(de => de.nativeElement as HTMLButtonElement);
}

// =============================================================================
// Test Suite
// =============================================================================

describe("ButtonGroupComponent", () => {
    // =========================================================================
    // Basic Functionality Tests
    // =========================================================================
    describe("basic functionality", () => {
        let fixture: ComponentFixture<TestButtonGroupHostComponent>;
        let component: TestButtonGroupHostComponent;
        let groupElement: HTMLElement;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestButtonGroupHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestButtonGroupHostComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            groupElement = fixture.debugElement.query(By.directive(ButtonGroupComponent)).nativeElement;
        });

        // =========================================================================
        // Initialization Tests
        // =========================================================================
        describe("initialization", () => {
            it("should create the component", () => {
                expect(component.buttonGroup()).toBeTruthy();
            });

            it("should render projected button content", () => {
                const buttons = getButtonElements(fixture);
                expect(buttons.length).toBe(3);
                expect(buttons[0].textContent).toContain("Button 1");
                expect(buttons[1].textContent).toContain("Button 2");
                expect(buttons[2].textContent).toContain("Button 3");
            });

            it("should apply variant classes to host element", () => {
                expect(groupElement.classList.length).toBeGreaterThan(0);
            });
        });

        // =========================================================================
        // Default Values Tests
        // =========================================================================
        describe("default values", () => {
            it("should have disabled set to false by default", () => {
                expect(component.buttonGroup().disabled()).toBe(false);
            });

            it("should have look set to 'outline' by default", () => {
                expect(component.buttonGroup().look()).toBe("outline");
            });

            it("should have rounded set to 'medium' by default", () => {
                expect(component.buttonGroup().rounded()).toBe("medium");
            });

            it("should have size set to 'medium' by default", () => {
                expect(component.buttonGroup().size()).toBe("medium");
            });

            it("should have selection set to 'multiple' by default", () => {
                expect(component.buttonGroup().selection()).toBe("multiple");
            });
        });

        // =========================================================================
        // Disabled Input Tests
        // =========================================================================
        describe("disabled input", () => {
            it("should NOT disable child buttons when disabled=false", async () => {
                component.disabled.set(false);
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.hasAttribute("disabled")).toBe(false);
                });
            });

            it("should disable all child buttons when disabled=true", async () => {
                component.disabled.set(true);
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.hasAttribute("disabled")).toBe(true);
                    expect(btn.getAttribute("aria-disabled")).toBe("true");
                });
            });

            it("should propagate disabled state changes dynamically", async () => {
                component.disabled.set(false);
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                expect(buttonElements[0].hasAttribute("disabled")).toBe(false);

                component.disabled.set(true);
                await waitForStable(fixture);
                expect(buttonElements[0].hasAttribute("disabled")).toBe(true);

                component.disabled.set(false);
                await waitForStable(fixture);
                expect(buttonElements[0].hasAttribute("disabled")).toBe(false);
            });
        });

        // =========================================================================
        // Look Input Tests
        // =========================================================================
        describe("look input", () => {
            it("should propagate 'outline' look to child buttons by default", async () => {
                await waitForStable(fixture);
                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-look")).toBe("outline");
                });
            });

            it("should propagate 'primary' look to child buttons", async () => {
                component.look.set("primary");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-look")).toBe("primary");
                });
            });

            it("should propagate 'success' look to child buttons", async () => {
                component.look.set("success");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-look")).toBe("success");
                });
            });

            it("should propagate 'error' look to child buttons", async () => {
                component.look.set("error");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-look")).toBe("error");
                });
            });

            it("should propagate 'warning' look to child buttons", async () => {
                component.look.set("warning");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-look")).toBe("warning");
                });
            });
        });

        // =========================================================================
        // Size Input Tests
        // =========================================================================
        describe("size input", () => {
            it("should propagate 'medium' size to child buttons by default", async () => {
                await waitForStable(fixture);
                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-size")).toBe("medium");
                });
            });

            it("should propagate 'small' size to child buttons", async () => {
                component.size.set("small");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-size")).toBe("small");
                });
            });

            it("should propagate 'large' size to child buttons", async () => {
                component.size.set("large");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("data-size")).toBe("large");
                });
            });
        });

        // =========================================================================
        // Rounded Input Tests
        // =========================================================================
        describe("rounded input", () => {
            it("should propagate 'medium' rounded to child buttons by default", async () => {
                await waitForStable(fixture);
                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.classList.contains("rounded-md")).toBe(true);
                });
            });

            it("should propagate 'small' rounded to child buttons", async () => {
                component.rounded.set("small");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.classList.contains("rounded-sm")).toBe(true);
                });
            });

            it("should propagate 'large' rounded to child buttons", async () => {
                component.rounded.set("large");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.classList.contains("rounded-lg")).toBe(true);
                });
            });

            it("should propagate 'full' rounded to child buttons", async () => {
                component.rounded.set("full");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.classList.contains("rounded-full")).toBe(true);
                });
            });

            it("should propagate 'none' rounded to child buttons", async () => {
                component.rounded.set("none");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.classList.contains("rounded-none")).toBe(true);
                });
            });
        });

        // =========================================================================
        // userClass Input Tests
        // =========================================================================
        describe("userClass input", () => {
            it("should merge user-provided class with variant classes", () => {
                component.userClass.set("my-custom-class");
                fixture.detectChanges();
                expect(groupElement.classList.contains("my-custom-class")).toBe(true);
            });

            it("should support multiple user classes", () => {
                component.userClass.set("class-a class-b");
                fixture.detectChanges();
                expect(groupElement.classList.contains("class-a")).toBe(true);
                expect(groupElement.classList.contains("class-b")).toBe(true);
            });
        });

        // =========================================================================
        // Child Buttons Toggleable State Tests
        // =========================================================================
        describe("child buttons toggleable state", () => {
            it("should set all child buttons as toggleable (aria-pressed attribute present)", async () => {
                await waitForStable(fixture);
                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("aria-pressed")).not.toBeNull();
                });
            });
        });

        // =========================================================================
        // Accessibility Tests
        // =========================================================================
        describe("accessibility", () => {
            it("should have aria-pressed attribute on all child buttons", async () => {
                await waitForStable(fixture);
                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("aria-pressed")).not.toBeNull();
                });
            });

            it("should set aria-disabled on all buttons when group is disabled", async () => {
                component.disabled.set(true);
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("aria-disabled")).toBe("true");
                });
            });
        });
    });

    // =========================================================================
    // Selection Mode Tests
    // =========================================================================
    describe("selection modes", () => {
        let fixture: ComponentFixture<TestButtonGroupSelectionHostComponent>;
        let component: TestButtonGroupSelectionHostComponent;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestButtonGroupSelectionHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestButtonGroupSelectionHostComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        // =========================================================================
        // Single Selection Mode Tests
        // =========================================================================
        describe("single selection mode", () => {
            beforeEach(async () => {
                component.selection.set("single");
                await waitForStable(fixture);
            });

            it("should select a button when clicked", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                buttonElements[0].click();
                await waitForStable(fixture);

                expect(buttons[0].selected()).toBe(true);
                expect(buttonElements[0].getAttribute("aria-pressed")).toBe("true");
            });

            it("should deselect other buttons when a new button is selected", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                // Click first button
                buttonElements[0].click();
                await waitForStable(fixture);
                expect(buttons[0].selected()).toBe(true);

                // Click second button
                buttonElements[1].click();
                await waitForStable(fixture);

                expect(buttons[0].selected()).toBe(false);
                expect(buttons[1].selected()).toBe(true);
                expect(buttonElements[0].getAttribute("aria-pressed")).toBe("false");
                expect(buttonElements[1].getAttribute("aria-pressed")).toBe("true");
            });

            it("should deselect the button when clicking an already selected button", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                // Click first button to select
                buttonElements[0].click();
                await waitForStable(fixture);
                expect(buttons[0].selected()).toBe(true);

                // Click first button again to deselect
                buttonElements[0].click();
                await waitForStable(fixture);
                expect(buttons[0].selected()).toBe(false);
                expect(buttonElements[0].getAttribute("aria-pressed")).toBe("false");
            });

            it("should not allow multiple buttons to be selected", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                buttonElements[0].click();
                await waitForStable(fixture);

                buttonElements[1].click();
                await waitForStable(fixture);

                buttonElements[2].click();
                await waitForStable(fixture);

                const selectedCount = buttons.filter(b => b.selected()).length;
                expect(selectedCount).toBe(1);
                expect(buttons[2].selected()).toBe(true);
            });

            it("should update aria-pressed correctly when buttons are selected", async () => {
                const buttonElements = getButtonElements(fixture);

                // All should be not pressed initially
                buttonElements.forEach(btn => {
                    expect(btn.getAttribute("aria-pressed")).toBe("false");
                });

                // Click first button
                buttonElements[0].click();
                await waitForStable(fixture);

                expect(buttonElements[0].getAttribute("aria-pressed")).toBe("true");
                expect(buttonElements[1].getAttribute("aria-pressed")).toBe("false");
                expect(buttonElements[2].getAttribute("aria-pressed")).toBe("false");
            });
        });

        // =========================================================================
        // Multiple Selection Mode Tests
        // =========================================================================
        describe("multiple selection mode", () => {
            beforeEach(async () => {
                component.selection.set("multiple");
                await waitForStable(fixture);
            });

            it("should toggle button selection on click", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                // Click to select
                buttonElements[0].click();
                await waitForStable(fixture);
                expect(buttons[0].selected()).toBe(true);

                // Click to deselect
                buttonElements[0].click();
                await waitForStable(fixture);
                expect(buttons[0].selected()).toBe(false);
            });

            it("should allow multiple buttons to be selected simultaneously", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                buttonElements[0].click();
                await waitForStable(fixture);

                buttonElements[1].click();
                await waitForStable(fixture);

                buttonElements[2].click();
                await waitForStable(fixture);

                expect(buttons[0].selected()).toBe(true);
                expect(buttons[1].selected()).toBe(true);
                expect(buttons[2].selected()).toBe(true);
            });

            it("should deselect individual buttons independently", async () => {
                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                // Select all buttons
                buttonElements[0].click();
                await waitForStable(fixture);
                buttonElements[1].click();
                await waitForStable(fixture);
                buttonElements[2].click();
                await waitForStable(fixture);

                // Deselect middle button
                buttonElements[1].click();
                await waitForStable(fixture);

                expect(buttons[0].selected()).toBe(true);
                expect(buttons[1].selected()).toBe(false);
                expect(buttons[2].selected()).toBe(true);
            });
        });

        // =========================================================================
        // Selection Mode Change Tests
        // =========================================================================
        describe("selection mode changes", () => {
            it("should switch behavior when selection mode changes from single to multiple", async () => {
                component.selection.set("single");
                await waitForStable(fixture);

                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                // In single mode, only one can be selected
                buttonElements[0].click();
                await waitForStable(fixture);
                buttonElements[1].click();
                await waitForStable(fixture);
                expect(buttons[0].selected()).toBe(false);
                expect(buttons[1].selected()).toBe(true);

                // Switch to multiple mode
                component.selection.set("multiple");
                await waitForStable(fixture);

                // Now multiple can be selected
                buttonElements[0].click();
                await waitForStable(fixture);
                buttonElements[2].click();
                await waitForStable(fixture);

                expect(buttons[0].selected()).toBe(true);
                expect(buttons[1].selected()).toBe(true);
                expect(buttons[2].selected()).toBe(true);
            });
        });
    });

    // =========================================================================
    // ButtonService Integration Tests
    // =========================================================================
    describe("ButtonService integration", () => {
        let fixture: ComponentFixture<TestButtonGroupHostComponent>;
        let component: TestButtonGroupHostComponent;
        let buttonService: ButtonService;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [TestButtonGroupHostComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(TestButtonGroupHostComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // Get the ButtonService from the ButtonGroupComponent
            const buttonGroupDebugEl = fixture.debugElement.query(By.directive(ButtonGroupComponent));
            buttonService = buttonGroupDebugEl.injector.get(ButtonService);
        });

        // =========================================================================
        // Signal Propagation Tests
        // =========================================================================
        describe("signal propagation to ButtonService", () => {
            it("should propagate disabled to ButtonService.groupDisabled", async () => {
                component.disabled.set(false);
                await waitForStable(fixture);
                expect(buttonService.groupDisabled()).toBe(false);

                component.disabled.set(true);
                await waitForStable(fixture);
                expect(buttonService.groupDisabled()).toBe(true);
            });

            it("should propagate look to ButtonService.groupLook", async () => {
                component.look.set("outline");
                await waitForStable(fixture);
                expect(buttonService.groupLook()).toBe("outline");

                component.look.set("primary");
                await waitForStable(fixture);
                expect(buttonService.groupLook()).toBe("primary");
            });

            it("should propagate rounded to ButtonService.groupRounded", async () => {
                component.rounded.set("medium");
                await waitForStable(fixture);
                expect(buttonService.groupRounded()).toBe("medium");

                component.rounded.set("full");
                await waitForStable(fixture);
                expect(buttonService.groupRounded()).toBe("full");
            });

            it("should propagate size to ButtonService.groupSize", async () => {
                component.size.set("medium");
                await waitForStable(fixture);
                expect(buttonService.groupSize()).toBe("medium");

                component.size.set("large");
                await waitForStable(fixture);
                expect(buttonService.groupSize()).toBe("large");
            });
        });

        // =========================================================================
        // ButtonService Streams Tests
        // =========================================================================
        describe("buttonClick$ stream", () => {
            it("should receive button click events from child buttons", async () => {
                await waitForStable(fixture);

                let clickedButton: ButtonDirective | null = null;
                buttonService.buttonClick$.subscribe(btn => {
                    clickedButton = btn;
                });

                const buttonElements = getButtonElements(fixture);
                const buttons = getButtons(fixture);

                buttonElements[1].click();
                await waitForStable(fixture);

                expect(clickedButton).toBe(buttons[1]);
            });
        });

        describe("buttonSelect$ stream", () => {
            it("should emit selection changes to child buttons", async () => {
                await waitForStable(fixture);

                const emittedSelections: [ButtonDirective, boolean][] = [];

                buttonService.buttonSelect$.subscribe(result => {
                    emittedSelections.push(result);
                });

                const buttonElements = getButtonElements(fixture);
                buttonElements[0].click();
                await waitForStable(fixture);

                expect(emittedSelections.length).toBeGreaterThan(0);
            });
        });
    });
});
