import { ConnectionPositionPair } from "@angular/cdk/overlay";
import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PopupService } from "@nanahoshi/mona-ui/popup";
import { Observable, Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TooltipDirective } from "./tooltip.directive";

@Component({
    template: `
        <div monaTooltip mode="content">
            <button class="static-target" title="Always here">Static</button>
            <button class="dynamic-target" [attr.title]="dynamicTitle()">Dynamic</button>
        </div>
    `,
    imports: [TooltipDirective]
})
class TooltipContentHostComponent {
    public readonly dynamicTitle = signal<string | null>(null);
}

describe("TooltipDirective content mode", () => {
    let fixture: ComponentFixture<TooltipContentHostComponent>;
    let component: TooltipContentHostComponent;
    let closedSubject: Subject<void>;
    let popupService: { create: ReturnType<typeof vi.fn> };

    const query = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);
    const hover = (element: HTMLElement): void => {
        element.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
    };
    /** The real popup closes through a fade, so tests drive the close signal directly. */
    const closePopup = async (): Promise<void> => {
        closedSubject.next();
        await settle();
    };
    const settle = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        // Let the MutationObserver microtask land before assertions.
        await Promise.resolve();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        closedSubject = new Subject<void>();
        const popupRef = {
            close: vi.fn(() => closedSubject.next()),
            closed: closedSubject.asObservable(),
            opened: new Subject<void>().asObservable(),
            positionChanges: new Subject<ConnectionPositionPair>().asObservable() as Observable<ConnectionPositionPair>
        };
        popupService = { create: vi.fn().mockReturnValue(popupRef) };

        await TestBed.configureTestingModule({
            imports: [TooltipContentHostComponent],
            providers: [{ provide: PopupService, useValue: popupService }]
        }).compileComponents();

        fixture = TestBed.createComponent(TooltipContentHostComponent);
        component = fixture.componentInstance;
        await settle();
    });

    it("should pick up a title that was present from the start", () => {
        hover(query(".static-target"));
        expect(popupService.create).toHaveBeenCalledTimes(1);
    });

    it("should pick up a title added after initialisation", async () => {
        const target = query(".dynamic-target");
        hover(target);
        expect(popupService.create).not.toHaveBeenCalled();

        component.dynamicTitle.set("Added later");
        await settle();

        hover(target);
        expect(popupService.create).toHaveBeenCalledTimes(1);
        expect(popupService.create.mock.calls[0][0].anchor).toBe(target);
    });

    it("should stop producing a tooltip once the title is removed again", async () => {
        const target = query(".dynamic-target");
        component.dynamicTitle.set("Added later");
        await settle();

        component.dynamicTitle.set(null);
        await settle();

        hover(target);
        expect(popupService.create).not.toHaveBeenCalled();
    });

    it("should restore the original title once the tooltip closes", async () => {
        const target = query(".static-target");
        hover(target);
        expect(target.hasAttribute("title")).toBe(false);

        await closePopup();

        expect(target.getAttribute("title")).toBe("Always here");
    });

    it("should survive repeated hover cycles without losing the title", async () => {
        const target = query(".static-target");
        for (let cycle = 0; cycle < 3; cycle++) {
            hover(target);
            expect(target.hasAttribute("title")).toBe(false);
            await closePopup();
            expect(target.getAttribute("title")).toBe("Always here");
        }
        expect(popupService.create).toHaveBeenCalledTimes(3);
    });

    it("should keep other targets working after one of them has been hovered", async () => {
        // A self inflicted refresh mid-interaction would drop the listeners on the untouched target.
        component.dynamicTitle.set("Added later");
        await settle();

        hover(query(".static-target"));
        await closePopup();

        hover(query(".dynamic-target"));
        expect(popupService.create).toHaveBeenCalledTimes(2);
        expect(popupService.create.mock.calls[1][0].anchor).toBe(query(".dynamic-target"));
    });
});
