import {
    ApplicationRef,
    Component,
    forwardRef,
    input,
    output,
    signal,
    type TemplateRef,
    viewChild
} from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import type { PreventableEvent } from "@nanahoshi/mona-ui/common";
import type { ListSizeInputType } from "@nanahoshi/mona-ui/internal/list";
import type { PopupCloseEvent } from "@nanahoshi/mona-ui/popup";
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

/** A host with real outputs, which warn when they emit after the host is destroyed. */
@Component({
    template: `<ng-template #popup><p>Popup</p></ng-template>`,
    hostDirectives: [DropdownPopupHandlerDirective],
    providers: [
        DropdownService,
        { provide: DROPDOWN_POPUP_INPUT_TOKEN, useExisting: forwardRef(() => TestOutputsHostComponent) }
    ]
})
class TestOutputsHostComponent implements DropdownPopupInput {
    // eslint-disable-next-line @angular-eslint/no-output-native
    public readonly close = output<PopupCloseEvent>();
    public readonly closed = output();
    public readonly disabled = signal(false);
    public readonly open = output<PreventableEvent>();
    public readonly opened = output();
    public readonly popupHeight = input<ListSizeInputType>();
    public readonly popupTemplate = viewChild.required<TemplateRef<unknown>>("popup");
    public readonly popupWidth = input<ListSizeInputType>();
    public readonly readonly = signal(false);
    public readonly touch = output();
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

describe("DropdownPopupHandlerDirective when its host is destroyed", () => {
    afterEach(() => {
        document.querySelectorAll(".cdk-overlay-container").forEach(node => node.replaceChildren());
    });

    async function createOpen(): Promise<ComponentFixture<TestOutputsHostComponent>> {
        TestBed.configureTestingModule({ imports: [TestOutputsHostComponent] });
        const fixture = TestBed.createComponent(TestOutputsHostComponent);
        document.body.append(fixture.nativeElement as HTMLElement);
        fixture.detectChanges();
        await fixture.whenStable();
        const dropdownService = fixture.debugElement.injector.get(DropdownService);
        dropdownService.popupTemplate.set(fixture.componentInstance.popupTemplate());
        dropdownService.triggerPopupOpen$.next({});
        await TestBed.inject(ApplicationRef).tick();
        return fixture;
    }

    it("closes the popup without emitting through the destroyed host", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const fixture = await createOpen();
            await new Promise(resolve => setTimeout(resolve, 0));
            const emitted: string[] = [];
            fixture.componentInstance.close.subscribe(() => emitted.push("close"));
            fixture.componentInstance.closed.subscribe(() => emitted.push("closed"));
            expect(document.querySelector(".cdk-overlay-pane p")?.textContent).toBe("Popup");

            fixture.destroy();
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(document.querySelector(".cdk-overlay-pane p")).toBeNull();
            expect(emitted).toEqual([]);
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });

    it("does not report the popup as opened when the host is destroyed first", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        try {
            const fixture = await createOpen();
            const opened: string[] = [];
            fixture.componentInstance.opened.subscribe(() => opened.push("opened"));

            fixture.destroy();
            await new Promise(resolve => setTimeout(resolve, 300));

            expect(opened).toEqual([]);
            expect(warn).not.toHaveBeenCalled();
        } finally {
            warn.mockRestore();
        }
    });
});
