import { ElementRef, type OutputEmitterRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DropdownService } from "../services/dropdown.service";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
import { DROPDOWN_POPUP_INPUT_TOKEN } from "../models/DropdownPopupInput";
import { DropdownListPopupHandlerDirective } from "./dropdown-list-popup-handler.directive";

describe("DropdownListPopupHandlerDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [
                DropdownService,
                ListService,
                { provide: ElementRef, useValue: new ElementRef(document.createElement("div")) },
                {
                    provide: DROPDOWN_POPUP_INPUT_TOKEN,
                    useValue: {
                        close: { emit: () => {} } as unknown as OutputEmitterRef<PopupCloseEvent>,
                        closed: { emit: () => {} } as unknown as OutputEmitterRef<void>,
                        disabled: signal(false),
                        open: { emit: () => {} } as unknown as OutputEmitterRef<PreventableEvent>,
                        opened: { emit: () => {} } as unknown as OutputEmitterRef<void>,
                        readonly: signal(false),
                        popupHeight: signal(undefined),
                        popupWidth: signal(undefined)
                    }
                }
            ]
        });
        const directive = TestBed.runInInjectionContext(() => new DropdownListPopupHandlerDirective());
        expect(directive).toBeTruthy();
    });
});
