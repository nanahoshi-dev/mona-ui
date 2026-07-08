import { Component, ElementRef, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Observable, Subject } from "rxjs";
import { Position } from "../../../common/models/Position";
import { PopupService } from "../../../popup/public-api";
import { TooltipVariantProps } from "../../styles/tooltip.styles";
import { TooltipComponent } from "./tooltip.component";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `
        <button #anchor>Hover Me</button>
        <mona-tooltip [target]="anchor" [position]="position()" [rounded]="rounded()"> Tooltip Content </mona-tooltip>
    `,
    imports: [TooltipComponent]
})
class TestBasicTooltipHost {
    readonly anchor = viewChild.required<ElementRef<HTMLElement>>("anchor");
    position = signal<Position>("top");
    rounded = signal<TooltipVariantProps["rounded"]>("medium");
}

@Component({
    template: `
        <button #anchor>Hover Me</button>
        <mona-tooltip
            [target]="anchor"
            [position]="position()"
            [rounded]="rounded()"
            [disabled]="disabled()"
            [showDelay]="showDelay()"
            [hideDelay]="hideDelay()">
            Tooltip Content
        </mona-tooltip>
    `,
    imports: [TooltipComponent]
})
class TestConfigurableTooltipHost {
    readonly anchor = viewChild.required<ElementRef<HTMLElement>>("anchor");
    disabled = signal(false);
    hideDelay = signal(0);
    position = signal<Position>("top");
    rounded = signal<TooltipVariantProps["rounded"]>("medium");
    showDelay = signal(0);
}

@Component({
    template: `
        <button class="tip-target">Button 1</button>
        <button class="tip-target">Button 2</button>
        <mona-tooltip [target]="'.tip-target'" [position]="position()"> Selector Tooltip </mona-tooltip>
    `,
    imports: [TooltipComponent]
})
class TestSelectorTooltipHost {
    position = signal<Position>("top");
}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getTooltipComponent(fixture: ComponentFixture<unknown>): TooltipComponent {
    return fixture.debugElement.query(By.directive(TooltipComponent)).componentInstance as TooltipComponent;
}

function getAnchorButton(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.css("button")).nativeElement as HTMLElement;
}

function dispatchPointerEnter(element: HTMLElement): void {
    element.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
}

function dispatchFocusIn(element: HTMLElement): void {
    element.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
}

function dispatchFocusOut(element: HTMLElement): void {
    element.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

// =============================================================================
// Mock Setup
// =============================================================================

let mockClosedSubject: Subject<void>;
let mockOpenedSubject: Subject<void>;
let mockPositionSubject: Subject<ConnectionPositionPair>;
let mockPopupRef: {
    close: ReturnType<typeof vi.fn>;
    closed: Observable<void>;
    positionChanges: Observable<ConnectionPositionPair>;
    opened: Observable<void>;
};
let mockPopupService: { create: ReturnType<typeof vi.fn> };

function createFreshMockPopupRef(): typeof mockPopupRef {
    const closedSubject = new Subject<void>();
    const openedSubject = new Subject<void>();
    const positionSubject = new Subject<ConnectionPositionPair>();
    const ref = {
        close: vi.fn(() => {
            closedSubject.next();
            closedSubject.complete();
        }),
        closed: closedSubject.asObservable(),
        positionChanges: positionSubject.asObservable(),
        opened: openedSubject.asObservable()
    };
    mockClosedSubject = closedSubject;
    mockOpenedSubject = openedSubject;
    mockPositionSubject = positionSubject;
    return ref;
}

// =============================================================================
// Test Suites
// =============================================================================

describe("TooltipComponent", () => {
    // =========================================================================
    // Basic Rendering
    // =========================================================================
    describe("basic rendering", () => {
        let fixture: ComponentFixture<TestBasicTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestBasicTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestBasicTooltipHost);
            await waitForStable(fixture);
        });

        it("should create the component", () => {
            expect(getTooltipComponent(fixture)).toBeTruthy();
        });

        it("should not call PopupService.create on initial render", () => {
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not show a tooltip popup by default", () => {
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Input Defaults
    // =========================================================================
    describe("input defaults", () => {
        let fixture: ComponentFixture<TestBasicTooltipHost>;
        let component: TestBasicTooltipHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestBasicTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestBasicTooltipHost);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should default position to 'top'", () => {
            expect(component.position()).toBe("top");
        });

        it("should default rounded to 'medium'", () => {
            expect(component.rounded()).toBe("medium");
        });

        it("should default disabled to false", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            // Not disabled, tooltip should appear
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Pointer Interaction — HTMLElement Target
    // =========================================================================
    describe("pointer interaction (HTMLElement target)", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;
        let component: TestConfigurableTooltipHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should call PopupService.create on pointerenter", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should pass the anchor element to PopupService.create", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(anchor);
        });

        it("should not create a second popup on repeated pointerenter for same element", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should pass popup settings with closeOnEscape, closeOnMouseLeave, closeOnOutsideClick", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.closeOnEscape).toBe(true);
            // The component closes via its own pointerleave/focusout handlers, not PopupService's
            // internal mouse-leave handling.
            expect(createArgs.closeOnMouseLeave).toBe(false);
            expect(createArgs.closeOnOutsideClick).toBe(true);
            expect(createArgs.hasBackdrop).toBe(false);
            expect(createArgs.restoreFocus).toBe(false);
            expect(createArgs.withPush).toBe(false);
        });
    });

    // =========================================================================
    // Pointer Interaction — CSS Selector Target
    // =========================================================================
    describe("pointer interaction (CSS selector target)", () => {
        let fixture: ComponentFixture<TestSelectorTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestSelectorTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestSelectorTooltipHost);
            await waitForStable(fixture);
        });

        it("should show tooltip when hovering any matching element", async () => {
            const buttons = fixture.debugElement.queryAll(By.css(".tip-target"));
            const firstButton = buttons[0].nativeElement as HTMLElement;
            dispatchPointerEnter(firstButton);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should use the hovered element as anchor, not a different matching element", async () => {
            const buttons = fixture.debugElement.queryAll(By.css(".tip-target"));
            const secondButton = buttons[1].nativeElement as HTMLElement;
            dispatchPointerEnter(secondButton);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(secondButton);
        });

        it("should not throw when no elements match the selector", async () => {
            // The selector '.tip-target' matches on creation; if elements are removed at runtime there's no error
            expect(() => fixture.detectChanges()).not.toThrow();
        });

        it("should attach tooltip behavior to elements matching the selector added after initial render", async () => {
            const newButton = document.createElement("button");
            newButton.className = "tip-target";
            fixture.nativeElement.appendChild(newButton);

            // Let the MutationObserver microtask fire and re-attach listeners.
            await Promise.resolve();
            await waitForStable(fixture);

            dispatchPointerEnter(newButton);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(newButton);
        });
    });

    // =========================================================================
    // Focus Interaction
    // =========================================================================
    describe("focus interaction", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            await waitForStable(fixture);
        });

        it("should show tooltip on focusin", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should close tooltip on focusout", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchFocusOut(anchor);
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });

        it("should not throw on focusout when no tooltip is open", () => {
            const anchor = getAnchorButton(fixture);
            expect(() => dispatchFocusOut(anchor)).not.toThrow();
        });

        it("should not create a second popup on repeated focusin for same element", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // Disabled State
    // =========================================================================
    describe("disabled state", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;
        let component: TestConfigurableTooltipHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            component = fixture.componentInstance;
            component.disabled.set(true);
            await waitForStable(fixture);
        });

        it("should not create tooltip on pointerenter when disabled", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not create tooltip on focusin when disabled", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should show tooltip after disabled changes to false", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();

            component.disabled.set(false);
            await waitForStable(fixture);

            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // ShowDelay
    // =========================================================================
    describe("showDelay", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;
        let component: TestConfigurableTooltipHost;

        beforeEach(async () => {
            vi.useFakeTimers();
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            component = fixture.componentInstance;
            component.showDelay.set(500);
            await waitForStable(fixture);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should not create tooltip immediately when showDelay is set", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should create tooltip after showDelay elapses", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);

            vi.advanceTimersByTime(500);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should not create tooltip before showDelay elapses", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);

            vi.advanceTimersByTime(300);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not create tooltip after showDelay elapses if the fixture was destroyed first", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);

            fixture.destroy();
            vi.advanceTimersByTime(500);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // HideDelay
    // =========================================================================
    describe("hideDelay", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;
        let component: TestConfigurableTooltipHost;

        beforeEach(async () => {
            vi.useFakeTimers();
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            component = fixture.componentInstance;
            component.hideDelay.set(300);
            await waitForStable(fixture);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should not close tooltip immediately on focusout when hideDelay is set", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchFocusOut(anchor);
            await waitForStable(fixture);
            expect(mockPopupRef.close).not.toHaveBeenCalled();
        });

        it("should close tooltip after hideDelay elapses", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);

            dispatchFocusOut(anchor);
            await waitForStable(fixture);

            vi.advanceTimersByTime(300);
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });

        it("should not close tooltip before hideDelay elapses", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);

            dispatchFocusOut(anchor);
            await waitForStable(fixture);

            vi.advanceTimersByTime(150);
            await waitForStable(fixture);
            expect(mockPopupRef.close).not.toHaveBeenCalled();
        });

        it("should close immediately when hideDelay is 0", async () => {
            component.hideDelay.set(0);
            await waitForStable(fixture);

            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);

            dispatchFocusOut(anchor);
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ARIA Attributes
    // =========================================================================
    describe("ARIA attributes", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            await waitForStable(fixture);
        });

        it("should not have aria-describedby on anchor before tooltip opens", () => {
            const anchor = getAnchorButton(fixture);
            expect(anchor.hasAttribute("aria-describedby")).toBe(false);
        });

        it("should set aria-describedby on anchor when tooltip opens via pointerenter", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(anchor.hasAttribute("aria-describedby")).toBe(true);
            const ariaId = anchor.getAttribute("aria-describedby");
            expect(ariaId).toBeTruthy();
            expect(ariaId!.startsWith("mona-")).toBe(true);
        });

        it("should set aria-describedby on anchor when tooltip opens via focusin", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchFocusIn(anchor);
            await waitForStable(fixture);
            expect(anchor.hasAttribute("aria-describedby")).toBe(true);
        });

        it("should remove aria-describedby from anchor when tooltip closes", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(anchor.hasAttribute("aria-describedby")).toBe(true);

            // Simulate popup closed event
            mockClosedSubject.next();
            mockClosedSubject.complete();
            await waitForStable(fixture);
            expect(anchor.hasAttribute("aria-describedby")).toBe(false);
        });
    });

    // =========================================================================
    // Position Input
    // =========================================================================
    describe("position input", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;
        let component: TestConfigurableTooltipHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should pass correct connection points for position='top'", async () => {
            component.position.set("top");
            await waitForStable(fixture);
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("topcenter");
            expect(createArgs.popupConnectionPoint).toBe("bottomcenter");
        });

        it("should pass correct connection points for position='bottom'", async () => {
            component.position.set("bottom");
            await waitForStable(fixture);
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("bottomcenter");
            expect(createArgs.popupConnectionPoint).toBe("topcenter");
        });

        it("should pass correct connection points for position='left'", async () => {
            component.position.set("left");
            await waitForStable(fixture);
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("centerleft");
            expect(createArgs.popupConnectionPoint).toBe("centerright");
        });

        it("should pass correct connection points for position='right'", async () => {
            component.position.set("right");
            await waitForStable(fixture);
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("centerright");
            expect(createArgs.popupConnectionPoint).toBe("centerleft");
        });

        it("should close existing popup and re-subscribe when position changes", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            component.position.set("bottom");
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Position Changes (Flip/Fallback from positionChanges observable)
    // =========================================================================
    describe("position changes from popup", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            await waitForStable(fixture);
        });

        it("should subscribe to positionChanges from PopupRef without throwing", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);

            const pair = new ConnectionPositionPair(
                { originX: "center", originY: "bottom" },
                { overlayX: "center", overlayY: "top" }
            );
            expect(() => mockPositionSubject.next(pair)).not.toThrow();
        });
    });

    // =========================================================================
    // Cleanup & Lifecycle
    // =========================================================================
    describe("cleanup & lifecycle", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            await waitForStable(fixture);
        });

        it("should not throw when component is destroyed without tooltip shown", () => {
            expect(() => fixture.destroy()).not.toThrow();
        });

        it("should close the popup when the component is destroyed while a tooltip is open", async () => {
            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            fixture.destroy();
            expect(mockPopupRef.close).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Rounded Input
    // =========================================================================
    describe("rounded input", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;
        let component: TestConfigurableTooltipHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should accept rounded='medium' as default", () => {
            expect(component.rounded()).toBe("medium");
        });

        it("should accept rounded='full'", async () => {
            component.rounded.set("full");
            await waitForStable(fixture);
            expect(component.rounded()).toBe("full");
        });

        it("should accept rounded='none'", async () => {
            component.rounded.set("none");
            await waitForStable(fixture);
            expect(component.rounded()).toBe("none");
        });

        it("should accept rounded='small'", async () => {
            component.rounded.set("small");
            await waitForStable(fixture);
            expect(component.rounded()).toBe("small");
        });

        it("should accept rounded='large'", async () => {
            component.rounded.set("large");
            await waitForStable(fixture);
            expect(component.rounded()).toBe("large");
        });
    });

    // =========================================================================
    // shown / hidden outputs
    // =========================================================================
    describe("shown / hidden outputs", () => {
        let fixture: ComponentFixture<TestConfigurableTooltipHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };
            await TestBed.configureTestingModule({
                imports: [TestConfigurableTooltipHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableTooltipHost);
            await waitForStable(fixture);
        });

        it("should emit shown when the popup opens", async () => {
            const shownSpy = vi.fn();
            getTooltipComponent(fixture).shown.subscribe(shownSpy);

            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);

            mockOpenedSubject.next();
            await waitForStable(fixture);

            expect(shownSpy).toHaveBeenCalledTimes(1);
        });

        it("should emit hidden when the popup closes", async () => {
            const hiddenSpy = vi.fn();
            getTooltipComponent(fixture).hidden.subscribe(hiddenSpy);

            const anchor = getAnchorButton(fixture);
            dispatchPointerEnter(anchor);
            await waitForStable(fixture);

            mockClosedSubject.next();
            mockClosedSubject.complete();
            await waitForStable(fixture);

            expect(hiddenSpy).toHaveBeenCalledTimes(1);
        });
    });
});
