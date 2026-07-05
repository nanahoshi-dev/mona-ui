import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Subject } from "rxjs";
import { PopupCloseEvent } from "../../models/PopupCloseEvent";
import { PopupReferenceInjectionToken, PopupSettingsInjectionToken } from "../../models/PopupInjectionToken";
import { PopupSettings } from "../../models/PopupSettings";

import { PopupWrapperComponent } from "./popup-wrapper.component";

interface PopupWrapperComponentTestApi {
    onNativeLeaveComplete(event: AnimationEvent | TransitionEvent): void;
}

describe("PopupWrapperComponent", () => {
    let component: PopupWrapperComponent;
    let completeClose: ReturnType<typeof vi.fn>;
    let closeStart$: Subject<PopupCloseEvent>;
    let fixture: ComponentFixture<PopupWrapperComponent>;

    const setup = (popupSettings: PopupSettings = {} as PopupSettings) => {
        closeStart$ = new Subject<PopupCloseEvent>();
        completeClose = vi.fn();
        TestBed.configureTestingModule({
            imports: [PopupWrapperComponent],
            providers: [
                {
                    provide: PopupReferenceInjectionToken,
                    useValue: {
                        closeStart$,
                        completeClose
                    }
                },
                {
                    provide: PopupSettingsInjectionToken,
                    useValue: popupSettings
                }
            ]
        });
        fixture = TestBed.createComponent(PopupWrapperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    };

    beforeEach(() => {
        setup();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("should complete close when the animated wrapper finishes leaving", () => {
        const closeEvent = new PopupCloseEvent();
        const target = document.createElement("div");
        const animationEvent = { currentTarget: target, target } as unknown as AnimationEvent;

        closeStart$.next(closeEvent);
        (component as unknown as PopupWrapperComponentTestApi).onNativeLeaveComplete(animationEvent);

        expect(completeClose).toHaveBeenCalledOnce();
        expect(completeClose).toHaveBeenCalledWith(closeEvent);
    });

    it("should ignore animation events from popup content children", () => {
        const closeEvent = new PopupCloseEvent();
        const animationEvent = {
            currentTarget: document.createElement("div"),
            target: document.createElement("span")
        } as unknown as AnimationEvent;

        closeStart$.next(closeEvent);
        (component as unknown as PopupWrapperComponentTestApi).onNativeLeaveComplete(animationEvent);

        expect(completeClose).not.toHaveBeenCalled();
    });
});
