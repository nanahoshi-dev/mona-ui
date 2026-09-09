import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupDataInjectionToken } from "../../../popup/models/PopupInjectionToken";
import { DialogReference } from "../../models/DialogReference";
import { createDialogInjectorData } from "../../utils/createDialogInjectorData";

import { DialogContentComponent } from "./dialog-content.component";

describe("DialogContentComponent", () => {
    let component: DialogContentComponent;
    let fixture: ComponentFixture<DialogContentComponent>;

    beforeEach(() => {
        TestBed.resetTestingModule();
        const dialogData = createDialogInjectorData({ closable: true, title: "Test", type: "confirm" });
        const dialogReference = new DialogReference({}, dialogData);
        dialogData.dialogReference = dialogReference;

        TestBed.configureTestingModule({
            imports: [DialogContentComponent],
            providers: [{ provide: PopupDataInjectionToken, useValue: dialogData }]
        });
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        fixture = TestBed.createComponent(DialogContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("renders default English messages for close button and actions", () => {
        const closeBtn = fixture.nativeElement.querySelector("button[monaButton][aria-label]") as HTMLButtonElement;
        expect(closeBtn.getAttribute("aria-label")).toBe("Close dialog");

        const actionBtns = fixture.nativeElement.querySelectorAll("button[monaButton]") as NodeListOf<HTMLButtonElement>;
        // Action buttons are in footer; close button is in header
        const footerBtns = Array.from(actionBtns).filter(b => b !== closeBtn);
        expect(footerBtns.length).toBe(2);
        expect(footerBtns[0].textContent?.trim()).toBe("OK");
        expect(footerBtns[1].textContent?.trim()).toBe("Cancel");
    });

    it("dynamically updates messages on MonaI18nService.use", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            messages: {
                dialog: {
                    cancel: "İptal",
                    closeDialog: "Kapat",
                    ok: "Tamam"
                }
            }
        });
        fixture.detectChanges();

        const closeBtn = fixture.nativeElement.querySelector("button[monaButton][aria-label]") as HTMLButtonElement;
        expect(closeBtn.getAttribute("aria-label")).toBe("Kapat");

        const actionBtns = fixture.nativeElement.querySelectorAll("button[monaButton]") as NodeListOf<HTMLButtonElement>;
        const footerBtns = Array.from(actionBtns).filter(b => b !== closeBtn);
        expect(footerBtns[0].textContent?.trim()).toBe("Tamam");
        expect(footerBtns[1].textContent?.trim()).toBe("İptal");

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("respects consumer message overrides", () => {
        TestBed.resetTestingModule();
        const dialogData = createDialogInjectorData({
            closable: true,
            messages: {
                closeDialog: "Fermer le dialogue",
                ok: "Valider"
            },
            title: "Test",
            type: "confirm"
        });
        const dialogReference = new DialogReference({}, dialogData);
        dialogData.dialogReference = dialogReference;

        TestBed.configureTestingModule({
            imports: [DialogContentComponent],
            providers: [{ provide: PopupDataInjectionToken, useValue: dialogData }]
        });
        const overrideFixture = TestBed.createComponent(DialogContentComponent);
        overrideFixture.detectChanges();

        const closeBtn = overrideFixture.nativeElement.querySelector("button[monaButton][aria-label]") as HTMLButtonElement;
        expect(closeBtn.getAttribute("aria-label")).toBe("Fermer le dialogue");

        const actionBtns = overrideFixture.nativeElement.querySelectorAll("button[monaButton]") as NodeListOf<HTMLButtonElement>;
        const footerBtns = Array.from(actionBtns).filter(b => b !== closeBtn);
        expect(footerBtns[0].textContent?.trim()).toBe("Valider");
        expect(footerBtns[1].textContent?.trim()).toBe("Cancel");
    });
});
