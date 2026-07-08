import { Component, createComponent, EnvironmentInjector, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Observable, Subject } from "rxjs";
import { Position } from "../../common/models/Position";
import { PopupService } from "@mirei/mona-ui/popup";
import { TooltipVariantProps } from "../styles/tooltip.styles";
import { TooltipDirective } from "./tooltip.directive";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: `<button monaTooltip title="Hello Tooltip">Hover Me</button>`,
    imports: [TooltipDirective]
})
class TestHostModeComponent {}

@Component({
    template: `
        <button
            monaTooltip
            [title]="title()"
            [position]="position()"
            [tooltipRounded]="rounded()"
            [mode]="mode()"
            [disabled]="disabled()"
            [showDelay]="showDelay()"
            [hideDelay]="hideDelay()">
            Hover Me
        </button>
    `,
    imports: [TooltipDirective]
})
class TestConfigurableHost {
    title = signal("Configurable Tooltip");
    position = signal<Position>("top");
    rounded = signal<TooltipVariantProps["rounded"]>("medium");
    mode = signal<"host" | "content">("host");
    disabled = signal(false);
    showDelay = signal(0);
    hideDelay = signal(0);
}

@Component({
    template: `
        <div monaTooltip [mode]="'content'" [filter]="filter()">
            <span title="Tip A" class="item-a">Item A</span>
            <span title="Tip B" class="item-b">Item B</span>
            <span class="no-tip">No Tooltip</span>
        </div>
    `,
    imports: [TooltipDirective]
})
class TestContentModeHost {
    filter = signal("[title]");
}

@Component({
    template: `<button monaTooltip>No Title</button>`,
    imports: [TooltipDirective]
})
class TestNoTitleHost {}

@Component({
    template: ``
})
class ProbeComponent {}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getHostButton(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.directive(TooltipDirective)).nativeElement as HTMLElement;
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
    // Store references so tests can use them
    mockClosedSubject = closedSubject;
    mockOpenedSubject = openedSubject;
    mockPositionSubject = positionSubject;
    return ref;
}

// =============================================================================
// Test Suites
// =============================================================================

describe("TooltipDirective", () => {
    // =========================================================================
    // Basic Rendering & Creation (TestHostModeComponent)
    // =========================================================================
    describe("basic rendering & creation", () => {
        let fixture: ComponentFixture<TestHostModeComponent>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestHostModeComponent],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestHostModeComponent);
            await waitForStable(fixture);
        });

        it("should create the directive", () => {
            const directiveDebug = fixture.debugElement.query(By.directive(TooltipDirective));
            expect(directiveDebug).toBeTruthy();
        });

        it("should not show a tooltip by default", () => {
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not have role='tooltip' on the host element", () => {
            const button = getHostButton(fixture);
            expect(button.getAttribute("role")).toBeNull();
        });
    });

    // =========================================================================
    // Host Bindings
    // =========================================================================
    describe("host bindings", () => {
        let fixture: ComponentFixture<TestHostModeComponent>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestHostModeComponent],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestHostModeComponent);
            await waitForStable(fixture);
        });

        it("should have data-mona-title attribute on host", () => {
            const button = getHostButton(fixture);
            // originalTitle starts as "", so attribute may be present but empty
            expect(button.hasAttribute("data-mona-title")).toBe(true);
        });

        it("should update data-mona-title after pointerenter sets originalTitle", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(button.getAttribute("data-mona-title")).toBe("Hello Tooltip");
        });

        it("should not have role attribute on the host element", () => {
            const button = getHostButton(fixture);
            expect(button.getAttribute("role")).toBeNull();
        });
    });

    // =========================================================================
    // Host Mode - Pointer Interaction (TestConfigurableHost)
    // =========================================================================
    describe("host mode - pointer interaction", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;
        let component: TestConfigurableHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should call PopupService.create on pointerenter", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should pass the host element as anchor to PopupService.create", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(button);
        });

        it("should remove title attribute from element on pointerenter", async () => {
            const button = getHostButton(fixture);
            expect(button.hasAttribute("title")).toBe(true);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(button.hasAttribute("title")).toBe(false);
        });

        it("should not create a second tooltip on repeated pointerenter for same element", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            // Second pointer enter on same element should not create another
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should pass correct connection points for position 'top'", async () => {
            component.position.set("top");
            await waitForStable(fixture);
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("topcenter");
            expect(createArgs.popupConnectionPoint).toBe("bottomcenter");
        });

        it("should pass correct connection points for position 'bottom'", async () => {
            component.position.set("bottom");
            await waitForStable(fixture);
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("bottomcenter");
            expect(createArgs.popupConnectionPoint).toBe("topcenter");
        });

        it("should pass correct connection points for position 'left'", async () => {
            component.position.set("left");
            await waitForStable(fixture);
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("centerleft");
            expect(createArgs.popupConnectionPoint).toBe("centerright");
        });

        it("should pass correct connection points for position 'right'", async () => {
            component.position.set("right");
            await waitForStable(fixture);
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchorConnectionPoint).toBe("centerright");
            expect(createArgs.popupConnectionPoint).toBe("centerleft");
        });

        it("should pass popup settings with closeOnEscape, closeOnMouseLeave, closeOnOutsideClick", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.closeOnEscape).toBe(true);
            // The directive closes via its own pointerleave/focusout handlers, not PopupService's
            // internal mouse-leave handling.
            expect(createArgs.closeOnMouseLeave).toBe(false);
            expect(createArgs.closeOnOutsideClick).toBe(true);
            expect(createArgs.hasBackdrop).toBe(false);
            expect(createArgs.restoreFocus).toBe(false);
            expect(createArgs.withPush).toBe(false);
        });
    });

    // =========================================================================
    // Host Mode - Focus Interaction
    // =========================================================================
    describe("host mode - focus interaction", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should show tooltip on focusin", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should hide tooltip on focusout", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchFocusOut(button);
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Content Mode
    // =========================================================================
    describe("content mode", () => {
        let fixture: ComponentFixture<TestContentModeHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = {
                create: vi.fn().mockImplementation(() => {
                    return createFreshMockPopupRef();
                })
            };

            await TestBed.configureTestingModule({
                imports: [TestContentModeHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestContentModeHost);
            await waitForStable(fixture);
        });

        it("should create tooltip for child element with title attribute", async () => {
            const itemA = fixture.debugElement.query(By.css(".item-a")).nativeElement as HTMLElement;
            dispatchPointerEnter(itemA);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should pass the child element as anchor, not the container", async () => {
            const itemA = fixture.debugElement.query(By.css(".item-a")).nativeElement as HTMLElement;
            dispatchPointerEnter(itemA);
            await waitForStable(fixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(itemA);
        });

        it("should create tooltip for second matching child element", async () => {
            const itemB = fixture.debugElement.query(By.css(".item-b")).nativeElement as HTMLElement;
            dispatchPointerEnter(itemB);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(itemB);
        });

        it("should not create tooltip for child element without title", async () => {
            const noTip = fixture.debugElement.query(By.css(".no-tip")).nativeElement as HTMLElement;
            dispatchPointerEnter(noTip);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should respond to focusin on child elements with title", async () => {
            const itemA = fixture.debugElement.query(By.css(".item-a")).nativeElement as HTMLElement;
            dispatchFocusIn(itemA);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should attach tooltip behavior to elements added to the host after initial render", async () => {
            const container = fixture.debugElement.query(By.directive(TooltipDirective)).nativeElement as HTMLElement;
            const itemC = document.createElement("span");
            itemC.setAttribute("title", "Tip C");
            itemC.className = "item-c";
            container.appendChild(itemC);

            // Let the MutationObserver microtask fire and re-attach listeners.
            await Promise.resolve();
            await waitForStable(fixture);

            dispatchPointerEnter(itemC);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.anchor).toBe(itemC);
        });
    });

    // =========================================================================
    // Disabled State
    // =========================================================================
    describe("disabled state", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;
        let component: TestConfigurableHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            component = fixture.componentInstance;
            component.disabled.set(true);
            await waitForStable(fixture);
        });

        it("should not create tooltip on pointerenter when disabled", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not create tooltip on focusin when disabled", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should create tooltip when disabled changes from true to false", async () => {
            const button = getHostButton(fixture);

            // Still disabled, no tooltip
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();

            // Enable
            component.disabled.set(false);
            await waitForStable(fixture);

            // The title was removed by the first handleShow even though disabled,
            // so we need to set it again. But actually the directive returns early
            // before removing the title when disabled. Let's verify:
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // ShowDelay
    // =========================================================================
    describe("showDelay", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;
        let component: TestConfigurableHost;

        beforeEach(async () => {
            vi.useFakeTimers();
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            component = fixture.componentInstance;
            component.showDelay.set(500);
            await waitForStable(fixture);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should not create tooltip immediately when showDelay is set", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should create tooltip after showDelay elapses", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            vi.advanceTimersByTime(500);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should not create tooltip before showDelay elapses", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            vi.advanceTimersByTime(300);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not create tooltip after showDelay elapses if the fixture was destroyed first", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
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
        let fixture: ComponentFixture<TestConfigurableHost>;
        let component: TestConfigurableHost;

        beforeEach(async () => {
            vi.useFakeTimers();
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            component = fixture.componentInstance;
            component.hideDelay.set(300);
            await waitForStable(fixture);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should not close tooltip immediately when hideDelay is set", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchFocusOut(button);
            await waitForStable(fixture);

            // close should not have been called yet
            expect(mockPopupRef.close).not.toHaveBeenCalled();
        });

        it("should close tooltip after hideDelay elapses", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);

            dispatchFocusOut(button);
            await waitForStable(fixture);

            vi.advanceTimersByTime(300);
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });

        it("should not close tooltip before hideDelay elapses", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);

            dispatchFocusOut(button);
            await waitForStable(fixture);

            vi.advanceTimersByTime(100);
            await waitForStable(fixture);
            expect(mockPopupRef.close).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Title Attribute Management
    // =========================================================================
    describe("title attribute management", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should remove title attribute when tooltip is shown", async () => {
            const button = getHostButton(fixture);
            expect(button.getAttribute("title")).toBe("Configurable Tooltip");

            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(button.hasAttribute("title")).toBe(false);
        });

        it("should restore title attribute when tooltip is closed", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(button.hasAttribute("title")).toBe(false);

            // Simulate popup closing
            mockClosedSubject.next();
            mockClosedSubject.complete();
            await waitForStable(fixture);
            expect(button.getAttribute("title")).toBe("Configurable Tooltip");
        });
    });

    // =========================================================================
    // ARIA Attributes
    // =========================================================================
    describe("ARIA attributes", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should not have aria-describedby before tooltip is shown", () => {
            const button = getHostButton(fixture);
            expect(button.hasAttribute("aria-describedby")).toBe(false);
        });

        it("should set aria-describedby on anchor when tooltip opens", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(button.hasAttribute("aria-describedby")).toBe(true);
            const ariaId = button.getAttribute("aria-describedby");
            expect(ariaId).toBeTruthy();
            expect(ariaId!.startsWith("mona-")).toBe(true);
        });

        it("should remove aria-describedby when tooltip closes", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(button.hasAttribute("aria-describedby")).toBe(true);

            // Simulate popup closing
            mockClosedSubject.next();
            mockClosedSubject.complete();
            await waitForStable(fixture);
            expect(button.hasAttribute("aria-describedby")).toBe(false);
        });
    });

    // =========================================================================
    // Empty Title
    // =========================================================================
    describe("empty title", () => {
        let fixture: ComponentFixture<TestNoTitleHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestNoTitleHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestNoTitleHost);
            await waitForStable(fixture);
        });

        it("should not create tooltip if title is empty", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should not create tooltip on focusin if title is empty", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Empty Title (via configurable host with empty string)
    // =========================================================================
    describe("empty title via configurable host", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;
        let component: TestConfigurableHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            component = fixture.componentInstance;
            component.title.set("");
            await waitForStable(fixture);
        });

        it("should not create tooltip if title is explicitly empty", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Position Changes
    // =========================================================================
    describe("position changes", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should subscribe to positionChanges from PopupRef", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            // Emit a position change and verify it doesn't throw
            const pair = new ConnectionPositionPair(
                { originX: "center", originY: "top" },
                { overlayX: "center", overlayY: "bottom" }
            );
            expect(() => mockPositionSubject.next(pair)).not.toThrow();
        });
    });

    // =========================================================================
    // Cleanup on Destroy
    // =========================================================================
    describe("cleanup", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should close popup when fixture is destroyed", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            fixture.destroy();
            expect(mockPopupRef.close).toHaveBeenCalled();
        });

        it("should not throw when destroying without tooltip shown", () => {
            expect(() => fixture.destroy()).not.toThrow();
        });
    });

    // =========================================================================
    // Dynamically created tooltip template component cleanup
    // =========================================================================
    describe("component cleanup", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;
        let destroySpy: ReturnType<typeof vi.spyOn>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            // Probe a real ComponentRef instance to find the runtime prototype that
            // every dynamically created component's ComponentRef shares, so calls to
            // `destroy()` on the directive's internally-created component can be observed.
            const environmentInjector = TestBed.inject(EnvironmentInjector);
            const probe = createComponent(ProbeComponent, { environmentInjector });
            destroySpy = vi.spyOn(Object.getPrototypeOf(probe), "destroy");
            probe.destroy();
            destroySpy.mockClear();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        afterEach(() => {
            destroySpy.mockRestore();
        });

        it("should destroy the dynamically created tooltip template component when the popup closes", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            const callsBeforeClose = destroySpy.mock.calls.length;

            mockClosedSubject.next();
            mockClosedSubject.complete();
            await waitForStable(fixture);

            expect(destroySpy.mock.calls.length).toBeGreaterThan(callsBeforeClose);
        });

        it("should destroy the dynamically created tooltip template component when the directive is destroyed", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            const callsBeforeDestroy = destroySpy.mock.calls.length;

            fixture.destroy();
            // The closed$ subscription created in #createTooltip is not tied to the
            // directive's DestroyRef, so it still fires once popupRef.close() resolves.
            mockClosedSubject.next();
            mockClosedSubject.complete();

            expect(destroySpy.mock.calls.length).toBeGreaterThan(callsBeforeDestroy);
        });
    });

    // =========================================================================
    // Mode Switching
    // =========================================================================
    describe("mode switching", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;
        let component: TestConfigurableHost;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            component = fixture.componentInstance;
            await waitForStable(fixture);
        });

        it("should close existing popup when mode changes", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            // Switching mode should trigger afterRenderEffect which closes popup
            component.mode.set("content");
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });

        it("should close existing popup when position changes", async () => {
            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            component.position.set("bottom");
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // focusout with no popup (handleHide early return)
    // =========================================================================
    describe("focusout without active popup", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should not throw when focusout fires without an active tooltip", async () => {
            const button = getHostButton(fixture);
            expect(() => dispatchFocusOut(button)).not.toThrow();
            await waitForStable(fixture);
            expect(mockPopupRef.close).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // HideDelay with zero (immediate close)
    // =========================================================================
    describe("hideDelay with zero", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            // hideDelay defaults to 0
            await waitForStable(fixture);
        });

        it("should close tooltip immediately on focusout when hideDelay is 0", async () => {
            const button = getHostButton(fixture);
            dispatchFocusIn(button);
            await waitForStable(fixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);

            dispatchFocusOut(button);
            await waitForStable(fixture);
            expect(mockPopupRef.close).toHaveBeenCalled();
        });
    });

    // =========================================================================
    // shown / hidden outputs
    // =========================================================================
    describe("shown / hidden outputs", () => {
        let fixture: ComponentFixture<TestConfigurableHost>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [TestConfigurableHost],
                providers: [provideNoopAnimations(), { provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            fixture = TestBed.createComponent(TestConfigurableHost);
            await waitForStable(fixture);
        });

        it("should emit shown when the popup opens", async () => {
            const directiveDebug = fixture.debugElement.query(By.directive(TooltipDirective));
            const shownSpy = vi.fn();
            directiveDebug.injector.get(TooltipDirective).shown.subscribe(shownSpy);

            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            mockOpenedSubject.next();
            await waitForStable(fixture);

            expect(shownSpy).toHaveBeenCalledTimes(1);
        });

        it("should emit hidden when the popup closes", async () => {
            const directiveDebug = fixture.debugElement.query(By.directive(TooltipDirective));
            const hiddenSpy = vi.fn();
            directiveDebug.injector.get(TooltipDirective).hidden.subscribe(hiddenSpy);

            const button = getHostButton(fixture);
            dispatchPointerEnter(button);
            await waitForStable(fixture);

            mockClosedSubject.next();
            mockClosedSubject.complete();
            await waitForStable(fixture);

            expect(hiddenSpy).toHaveBeenCalledTimes(1);
        });
    });
});
