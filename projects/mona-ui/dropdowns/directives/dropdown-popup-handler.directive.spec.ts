import { ApplicationRef, Component, signal, type TemplateRef, viewChild } from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { DROPDOWN_POPUP_INPUT_TOKEN, type DropdownPopupInput } from "../models/DropdownPopupInput";
import { DropdownService } from "../services/dropdown.service";
import { DropdownPopupHandlerDirective } from "./dropdown-popup-handler.directive";

@Component({
    template: "<div></div>",
    hostDirectives: [DropdownPopupHandlerDirective]
})
class TestHostComponent {}

@Component({
    template: `<ng-template #popup><input aria-label="Popup field" /></ng-template>`,
    hostDirectives: [DropdownPopupHandlerDirective],
    host: { tabindex: "0" }
})
class TestFocusHostComponent {
    public readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popup");
}

function createPopupInput(): DropdownPopupInput {
    const emitter = { emit: () => undefined };
    return {
        close: emitter,
        closed: emitter,
        disabled: signal(false),
        open: emitter,
        opened: emitter,
        popupHeight: signal(0),
        popupWidth: signal(0),
        readonly: signal(false),
        touch: emitter
    } as unknown as DropdownPopupInput;
}

describe("DropdownPopupHandlerDirective", () => {
    let hostComponent: TestHostComponent;
    let hostFixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestHostComponent],
            providers: [
                DropdownService,
                {
                    provide: DROPDOWN_POPUP_INPUT_TOKEN,
                    useValue: () => {}
                }
            ]
        }).compileComponents();

        hostFixture = TestBed.createComponent(TestHostComponent);
        hostComponent = hostFixture.componentInstance;
        hostFixture.detectChanges();
    });

    it("should create", () => {
        expect(hostComponent).toBeTruthy();
    });
});

describe("DropdownPopupHandlerDirective focus", () => {
    let dropdownService: DropdownService;
    let fixture: ComponentFixture<TestFocusHostComponent>;
    let host: HTMLElement;
    let otherField: HTMLInputElement;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [TestFocusHostComponent],
            providers: [DropdownService, { provide: DROPDOWN_POPUP_INPUT_TOKEN, useFactory: createPopupInput }]
        });
        fixture = TestBed.createComponent(TestFocusHostComponent);
        host = fixture.nativeElement;
        document.body.append(host);
        otherField = document.createElement("input");
        otherField.setAttribute("aria-label", "Other field");
        document.body.append(otherField);
        dropdownService = TestBed.inject(DropdownService);
        fixture.detectChanges();
        dropdownService.popupTemplate.set(fixture.componentInstance.popupTemplate());
        await fixture.whenStable();
    });

    afterEach(() => {
        dropdownService.popupRef()?.close(undefined, 0);
        host.remove();
        otherField.remove();
    });

    async function openAndClose(moveFocus: () => void): Promise<void> {
        host.focus();
        dropdownService.triggerPopupOpen$.next({});
        await TestBed.inject(ApplicationRef).tick();
        expect(dropdownService.popupRef()).not.toBeNull();
        moveFocus();
        dropdownService.popupRef()?.close();
        await new Promise(resolve => setTimeout(resolve, 50));
        await TestBed.inject(ApplicationRef).tick();
    }

    it("lets focus return when it stayed on the dropdown", async () => {
        await openAndClose(() => undefined);

        expect(dropdownService.popupRef()).toBeNull();
        expect(dropdownService.focusCanReturn()).toBe(true);
    });

    it("lets focus return when it is inside the popup", async () => {
        await openAndClose(() => document.querySelector<HTMLInputElement>("[aria-label='Popup field']")?.focus());

        expect(dropdownService.focusCanReturn()).toBe(true);
    });

    it("keeps focus in a field the user moved it to", async () => {
        await openAndClose(() => otherField.focus());

        expect(dropdownService.popupRef()).toBeNull();
        expect(dropdownService.focusCanReturn()).toBe(false);
        expect(document.activeElement).toBe(otherField);
    });
});
