import { ElementRef, OutputEmitterRef, signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { DropdownService } from "../services/dropdown.service";
import { ListService } from "@mirei/mona-ui/internal/list";
import { DropdownPopupInputToken } from "../models/DropdownPopupInput";
import { DropdownListPopupHandlerDirective } from "./dropdown-list-popup-handler.directive";

describe("DropdownListPopupHandlerDirective", () => {
    it("should create an instance", () => {
        TestBed.configureTestingModule({
            providers: [
                DropdownService,
                ListService,
                { provide: ElementRef, useValue: new ElementRef(document.createElement("div")) },
                {
                    provide: DropdownPopupInputToken,
                    useValue: {
                        close: { emit: () => {} } as unknown as OutputEmitterRef<any>,
                        closed: { emit: () => {} } as unknown as OutputEmitterRef<void>,
                        disabled: signal(false),
                        open: { emit: () => {} } as unknown as OutputEmitterRef<any>,
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
