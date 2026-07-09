import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Observable, Subject } from "rxjs";
import { PopupCloseEvent, PopupService } from "@nanahoshi/mona-ui/popup";
import { PopoverFooterTemplateDirective } from "../../directives/popover-footer-template.directive";
import { PopoverTitleTemplateDirective } from "../../directives/popover-title-template.directive";
import { PopoverHideEvent } from "../../models/PopoverHideEvent";
import { PopoverShowEvent } from "../../models/PopoverShowEvent";
import { PopoverTrigger } from "../../models/PopoverTrigger";

import { PopoverComponent } from "./popover.component";

// =============================================================================
// Test Host Components
// =============================================================================

@Component({
    template: ` <button #target>Popover Anchor</button>
        <mona-popover [target]="target" [trigger]="trigger()" [title]="title()">Content</mona-popover>`,
    imports: [PopoverComponent]
})
class PopoverComponentTestComponent {
    public trigger = signal<PopoverTrigger>("click");
    public title = signal("");
}

@Component({
    template: ` <button #target>Popover Anchor</button>
        <mona-popover
            [target]="target"
            [trigger]="trigger()"
            (show)="onShow($event)"
            (hide)="onHide($event)"
            (shown)="onShown($event)"
            (hidden)="onHidden($event)">
            Content
        </mona-popover>`,
    imports: [PopoverComponent]
})
class PopoverEventsTestComponent {
    public trigger = signal<PopoverTrigger>("click");
    public readonly onShow = vi.fn();
    public readonly onHide = vi.fn();
    public readonly onShown = vi.fn();
    public readonly onHidden = vi.fn();
}

@Component({
    template: ` <button #target>Popover Anchor</button>
        <mona-popover [target]="target">
            <ng-template monaPopoverTitleTemplate>Custom Title</ng-template>
            <ng-template monaPopoverFooterTemplate>Custom Footer</ng-template>
        </mona-popover>`,
    imports: [PopoverComponent, PopoverTitleTemplateDirective, PopoverFooterTemplateDirective]
})
class PopoverTemplatesTestComponent {}

// =============================================================================
// Helper Functions
// =============================================================================

async function waitForStable(fixture: ComponentFixture<unknown>): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
}

function getAnchorButton(fixture: ComponentFixture<unknown>): HTMLElement {
    return fixture.debugElement.query(By.css("button")).nativeElement as HTMLElement;
}

function getPopoverComponent(fixture: ComponentFixture<unknown>): PopoverComponent {
    return fixture.debugElement.query(By.directive(PopoverComponent)).componentInstance as PopoverComponent;
}

function dispatchClick(element: HTMLElement): void {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

function dispatchPointerEnter(element: HTMLElement): void {
    element.dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
}

// =============================================================================
// Mock Setup
// =============================================================================

let mockClosedSubject: Subject<PopupCloseEvent>;
let mockPopupRef: {
    close: ReturnType<typeof vi.fn>;
    closed: Observable<PopupCloseEvent>;
    beforeClose: Observable<PopupCloseEvent>;
};
let mockPopupService: { create: ReturnType<typeof vi.fn> };

/**
 * Mirrors PopupReference.close(): emits on beforeClose first, and only
 * proceeds to closed if that event was not canceled.
 */
function createFreshMockPopupRef(): typeof mockPopupRef {
    const closedSubject = new Subject<PopupCloseEvent>();
    const beforeCloseSubject = new Subject<PopupCloseEvent>();
    const ref = {
        close: vi.fn(() => {
            const event = new PopupCloseEvent();
            beforeCloseSubject.next(event);
            if (event.isDefaultPrevented()) {
                return;
            }
            closedSubject.next(event);
            closedSubject.complete();
        }),
        closed: closedSubject.asObservable(),
        beforeClose: beforeCloseSubject.asObservable()
    };
    mockClosedSubject = closedSubject;
    return ref;
}

// =============================================================================
// Test Suites
// =============================================================================

describe("PopoverComponent", () => {
    describe("basic creation", () => {
        let hostFixture: ComponentFixture<PopoverComponentTestComponent>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverComponentTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverComponentTestComponent);
            await waitForStable(hostFixture);
        });

        it("should create", () => {
            expect(hostFixture.componentInstance).toBeTruthy();
        });
    });

    describe("click trigger", () => {
        let hostFixture: ComponentFixture<PopoverComponentTestComponent>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverComponentTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverComponentTestComponent);
            await waitForStable(hostFixture);
        });

        it("should open the popover on click", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should close the popover on a second click", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);

            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(mockPopupRef.close).toHaveBeenCalledTimes(1);
        });
    });

    describe("hover trigger", () => {
        let hostFixture: ComponentFixture<PopoverComponentTestComponent>;
        let component: PopoverComponentTestComponent;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverComponentTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverComponentTestComponent);
            component = hostFixture.componentInstance;
            component.trigger.set("hover");
            await waitForStable(hostFixture);
        });

        it("should open the popover on pointerenter", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchPointerEnter(button);
            await waitForStable(hostFixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });

        it("should request closeOnMouseLeave from the popup service", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchPointerEnter(button);
            await waitForStable(hostFixture);
            const createArgs = mockPopupService.create.mock.calls[0][0];
            expect(createArgs.closeOnMouseLeave).toBe(true);
        });
    });

    describe("none trigger", () => {
        let hostFixture: ComponentFixture<PopoverComponentTestComponent>;
        let component: PopoverComponentTestComponent;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverComponentTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverComponentTestComponent);
            component = hostFixture.componentInstance;
            component.trigger.set("none");
            await waitForStable(hostFixture);
        });

        it("should not open the popover on click", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should still open via the public open() method", async () => {
            getPopoverComponent(hostFixture).open();
            await waitForStable(hostFixture);
            expect(mockPopupService.create).toHaveBeenCalledTimes(1);
        });
    });

    describe("show/hide events", () => {
        let hostFixture: ComponentFixture<PopoverEventsTestComponent>;
        let component: PopoverEventsTestComponent;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverEventsTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverEventsTestComponent);
            component = hostFixture.componentInstance;
            await waitForStable(hostFixture);
        });

        it("should emit show and shown when opened", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(component.onShow).toHaveBeenCalledTimes(1);
            expect(component.onShown).toHaveBeenCalledTimes(1);
        });

        it("should not open when show is prevented", async () => {
            component.onShow.mockImplementation((event: PopoverShowEvent) => event.preventDefault());
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(mockPopupService.create).not.toHaveBeenCalled();
        });

        it("should emit hide and hidden when closed", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);

            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(component.onHide).toHaveBeenCalledTimes(1);
            expect(component.onHidden).toHaveBeenCalledTimes(1);
        });

        it("should not close when hide is prevented", async () => {
            component.onHide.mockImplementation((event: PopoverHideEvent) => event.preventDefault());
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);

            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(component.onHidden).not.toHaveBeenCalled();
            expect(button.getAttribute("aria-expanded")).toBe("true");
        });

        it("should emit hide exactly once on a trigger-driven toggle-close", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);

            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(component.onHide).toHaveBeenCalledTimes(1);
        });

        it("should keep the popover open and internally tracked when a hide from close() is canceled", async () => {
            const popover = getPopoverComponent(hostFixture);
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);

            component.onHide.mockImplementation((event: PopoverHideEvent) => event.preventDefault());
            popover.close();
            await waitForStable(hostFixture);

            expect(component.onHide).toHaveBeenCalledTimes(1);
            expect(component.onHidden).not.toHaveBeenCalled();
            expect((popover as unknown as { popupRef: unknown }).popupRef).toBe(mockPopupRef);
            expect(button.getAttribute("aria-expanded")).toBe("true");
        });
    });

    describe("ARIA attributes", () => {
        let hostFixture: ComponentFixture<PopoverComponentTestComponent>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverComponentTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverComponentTestComponent);
            await waitForStable(hostFixture);
        });

        it("should not have aria-expanded before the popover is opened", () => {
            const button = getAnchorButton(hostFixture);
            expect(button.hasAttribute("aria-expanded")).toBe(false);
        });

        it("should set aria-haspopup, aria-controls and aria-expanded when opened", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(button.getAttribute("aria-haspopup")).toBe("dialog");
            expect(button.getAttribute("aria-expanded")).toBe("true");
            expect(button.getAttribute("aria-controls")).toBeTruthy();
        });

        it("should set aria-expanded to false when closed", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);

            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(button.getAttribute("aria-expanded")).toBe("false");
        });

        it("should set aria-expanded to false when the popup closes externally", async () => {
            const button = getAnchorButton(hostFixture);
            dispatchClick(button);
            await waitForStable(hostFixture);
            expect(button.getAttribute("aria-expanded")).toBe("true");

            mockClosedSubject.next(new PopupCloseEvent());
            mockClosedSubject.complete();
            await waitForStable(hostFixture);
            expect(button.getAttribute("aria-expanded")).toBe("false");
        });
    });

    describe("template projection", () => {
        let hostFixture: ComponentFixture<PopoverTemplatesTestComponent>;

        beforeEach(async () => {
            mockPopupRef = createFreshMockPopupRef();
            mockPopupService = { create: vi.fn().mockReturnValue(mockPopupRef) };

            await TestBed.configureTestingModule({
                imports: [PopoverTemplatesTestComponent],
                providers: [{ provide: PopupService, useValue: mockPopupService }]
            }).compileComponents();

            hostFixture = TestBed.createComponent(PopoverTemplatesTestComponent);
            await waitForStable(hostFixture);
        });

        it("should resolve a projected title template", () => {
            const popover = getPopoverComponent(hostFixture) as unknown as {
                titleTemplateRef: () => unknown;
            };
            expect(popover.titleTemplateRef()).toBeTruthy();
        });

        it("should resolve a projected footer template", () => {
            const popover = getPopoverComponent(hostFixture) as unknown as {
                footerTemplateRef: () => unknown;
            };
            expect(popover.footerTemplateRef()).toBeTruthy();
        });
    });
});
