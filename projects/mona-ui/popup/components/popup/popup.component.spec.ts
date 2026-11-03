import { Component, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import type { PopupRef } from "../../models/PopupRef";
import { PopupService } from "../../services/popup.service";

import { PopupComponent } from "./popup.component";

@Component({
    template: `
        <button #target>Test</button>
        <mona-popup [anchor]="target" [trigger]="trigger">
            <ng-template>
                <div>Test</div>
            </ng-template>
        </mona-popup>
    `,
    imports: [PopupComponent]
})
class PopupComponentTestComponent {
    public popupComponent = viewChild.required(PopupComponent);
    public trigger: string = "click";
}

/** `popupRef` is protected; the specs read it to see whether a popup is open. */
function popupRefOf(component: PopupComponent): PopupRef | null {
    return (component as unknown as { popupRef: PopupRef | null }).popupRef;
}

describe("PopupComponent", () => {
    let hostComponent: PopupComponentTestComponent;
    let hostFixture: ComponentFixture<PopupComponentTestComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PopupComponent, PopupComponentTestComponent]
        });
        hostFixture = TestBed.createComponent(PopupComponentTestComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });

    it("should open a popup when the trigger fires", () => {
        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        const popupComponent = hostComponent.popupComponent();
        expect(popupRefOf(popupComponent)).not.toBeNull();
        popupRefOf(popupComponent)?.close(undefined, 0);
    });

    it("should close and not reopen when the trigger fires a second time while the popup is open", async () => {
        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        const popupComponent = hostComponent.popupComponent();
        const firstRef = popupRefOf(popupComponent);
        expect(firstRef).not.toBeNull();

        const closedPromise = new Promise<void>(resolve => firstRef?.closed.subscribe(() => resolve()));

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        await closedPromise;

        expect(popupRefOf(popupComponent)).toBeNull();
    });

    it("should forward closeOnScroll to PopupService.create", () => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");

        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        expect(createSpy).toHaveBeenCalledOnce();
        const settings = createSpy.mock.calls[0][0];
        expect(settings.closeOnScroll).toBe(false);

        popupRefOf(hostComponent.popupComponent())?.close(undefined, 0);
    });

    it("should forward restoreFocus to PopupService.create", () => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");

        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        expect(createSpy).toHaveBeenCalledOnce();
        const settings = createSpy.mock.calls[0][0];
        expect(settings.restoreFocus).toBe("auto");

        popupRefOf(hostComponent.popupComponent())?.close(undefined, 0);
    });

    it("accepts the bare attribute form of its boolean inputs", () => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");

        @Component({
            template: `
                <button #target>Test</button>
                <mona-popup
                    [anchor]="target"
                    closeOnMouseLeave
                    closeOnScroll
                    hasBackdrop
                    restoreFocus
                    withPush="false"
                    withScrollTracking="false">
                    <ng-template><div>Test</div></ng-template>
                </mona-popup>
            `,
            imports: [PopupComponent]
        })
        class BareAttributesTestComponent {}

        const fixture = TestBed.createComponent(BareAttributesTestComponent);
        fixture.detectChanges();
        (fixture.nativeElement.querySelector("button") as HTMLButtonElement).dispatchEvent(
            new PointerEvent("click", { bubbles: true })
        );

        const settings = createSpy.mock.calls.at(-1)![0];
        expect(settings.closeOnMouseLeave).toBe(true);
        expect(settings.closeOnScroll).toBe(true);
        expect(settings.hasBackdrop).toBe(true);
        expect(settings.restoreFocus).toBe(true);
        expect(settings.withPush).toBe(false);
        expect(settings.withScrollTracking).toBe(false);

        fixture.destroy();
    });

    it("measures the default width when the popup opens", () => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");
        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        vi.spyOn(anchor, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 240, 32));

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));

        expect(createSpy.mock.calls.at(-1)![0].width).toBe(240);
        popupRefOf(hostComponent.popupComponent())?.close(undefined, 0);
    });

    it("listens for the trigger only once", () => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");
        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));

        expect(createSpy).toHaveBeenCalledOnce();
        popupRefOf(hostComponent.popupComponent())?.close(undefined, 0);
    });

    it("should forward custom positions array to PopupService.create", () => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");
        const customPositions = [
            {
                originX: "start" as const,
                originY: "top" as const,
                overlayX: "end" as const,
                overlayY: "bottom" as const
            }
        ];

        const fixture = TestBed.createComponent(
            (() => {
                @Component({
                    template: `
                        <button #target>Test</button>
                        <mona-popup [anchor]="target" [positions]="positions">
                            <ng-template><div>Test</div></ng-template>
                        </mona-popup>
                    `,
                    imports: [PopupComponent]
                })
                class PositionsTestComponent {
                    positions = customPositions;
                }
                return PositionsTestComponent;
            })()
        );
        fixture.detectChanges();

        const anchor = fixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        fixture.detectChanges();

        expect(createSpy).toHaveBeenCalled();
        const settings = createSpy.mock.calls.at(-1)![0];
        expect(settings.positions).toEqual(customPositions);

        fixture.destroy();
    });
});
