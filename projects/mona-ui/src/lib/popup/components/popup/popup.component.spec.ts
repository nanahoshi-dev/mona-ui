import { Component, viewChild } from "@angular/core";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
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
    public trigger: string = "click";
    public popupComponent = viewChild.required(PopupComponent);
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

    it("should open a popup when the trigger fires", fakeAsync(() => {
        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        const popupComponent = hostComponent.popupComponent();
        expect((popupComponent as any).popupRef).not.toBeNull();
        (popupComponent as any).popupRef?.close(undefined, 0);
    }));

    it("should close and not reopen when the trigger fires a second time while the popup is open", fakeAsync(() => {
        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        const popupComponent = hostComponent.popupComponent();
        const firstRef = (popupComponent as any).popupRef;
        expect(firstRef).not.toBeNull();

        let closed = false;
        firstRef.closed.subscribe(() => (closed = true));

        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        expect(closed).toBe(true);
        expect((popupComponent as any).popupRef).toBeNull();
    }));

    it("should forward closeOnScroll to PopupService.create", fakeAsync(() => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");

        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        expect(createSpy).toHaveBeenCalledOnce();
        const settings = createSpy.mock.calls[0][0];
        expect(settings.closeOnScroll).toBe(false);

        (hostComponent.popupComponent() as any).popupRef?.close(undefined, 0);
    }));

    it("should forward restoreFocus to PopupService.create", fakeAsync(() => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");

        const anchor = hostFixture.nativeElement.querySelector("button") as HTMLButtonElement;
        anchor.dispatchEvent(new PointerEvent("click", { bubbles: true }));
        hostFixture.detectChanges();

        expect(createSpy).toHaveBeenCalledOnce();
        const settings = createSpy.mock.calls[0][0];
        expect(settings.restoreFocus).toBe("auto");

        (hostComponent.popupComponent() as any).popupRef?.close(undefined, 0);
    }));

    it("should forward custom positions array to PopupService.create", fakeAsync(() => {
        const service = TestBed.inject(PopupService);
        const createSpy = vi.spyOn(service, "create");
        const customPositions = [{ originX: "start" as const, originY: "top" as const, overlayX: "end" as const, overlayY: "bottom" as const }];

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
    }));
});
