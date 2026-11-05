import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MONA_DEFAULT_LOCALE, MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { PopupDataInjectionToken } from "@nanahoshi/mona-ui/popup";
import { WindowInjectorData } from "../../models/WindowInjectorData";
import { WindowReference } from "../../models/WindowReference";
import { createWindowInjectorData } from "../../utils/createWindowInjectorData";

import { WindowContentComponent } from "./window-content.component";

@Component({
    template: ` <div>Test</div> `
})
class WindowContentComponentTestComponent {}

describe("WindowContentComponent", () => {
    let component: WindowContentComponent;
    let fixture: ComponentFixture<WindowContentComponent>;
    let windowData: WindowInjectorData;

    beforeEach(() => {
        TestBed.resetTestingModule();
        const initialData = createWindowInjectorData({
            closable: true,
            content: WindowContentComponentTestComponent,
            draggable: true,
            maximizable: true,
            minimizable: true,
            resizable: true,
            title: "Test Window"
        });
        const windowReference = new WindowReference({}, document);
        windowData = { ...initialData, windowReference };

        TestBed.configureTestingModule({
            imports: [WindowContentComponent],
            providers: [{ provide: PopupDataInjectionToken, useValue: windowData }]
        });
        TestBed.inject(MonaI18nService).use(MONA_DEFAULT_LOCALE);
        fixture = TestBed.createComponent(WindowContentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("renders default English messages for header action buttons and drag handler", () => {
        const dragBar = fixture.nativeElement.querySelector("[monaWindowDragHandler]");
        expect(dragBar?.getAttribute("aria-label")).toBe(
            "Move or resize window. Use arrow keys to move, or Control and arrow keys to resize."
        );
        expect(dragBar?.getAttribute("role")).toBe("group");
        expect(dragBar?.getAttribute("tabindex")).toBe("0");

        const buttons = fixture.nativeElement.querySelectorAll("button[monaButton]");
        const minimizeBtn = buttons[0] as HTMLButtonElement;
        const maximizeBtn = buttons[1] as HTMLButtonElement;
        const closeBtn = buttons[2] as HTMLButtonElement;

        expect(minimizeBtn.getAttribute("aria-label")).toBe("Minimize");
        expect(minimizeBtn.getAttribute("title")).toBe("Minimize");

        expect(maximizeBtn.getAttribute("aria-label")).toBe("Maximize");
        expect(maximizeBtn.getAttribute("title")).toBe("Maximize");

        expect(closeBtn.getAttribute("aria-label")).toBe("Close window");
        expect(closeBtn.getAttribute("title")).toBe("Close");
    });

    it("keeps the resize handles out of the Tab order and the accessibility tree", () => {
        const resizers: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll("[monaWindowResizeHandler]"));
        expect(resizers.map(resizer => resizer.dataset["direction"])).toEqual([
            "north",
            "south",
            "east",
            "west",
            "northeast",
            "northwest",
            "southeast",
            "southwest"
        ]);
        for (const resizer of resizers) {
            expect(resizer.getAttribute("aria-hidden")).toBe("true");
            expect(resizer.hasAttribute("tabindex")).toBe(false);
            expect(resizer.hasAttribute("aria-label")).toBe(false);
        }
    });

    it("dynamically updates messages on MonaI18nService.use", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use({
            ...MONA_DEFAULT_LOCALE,
            messages: {
                window: {
                    close: "Kapat",
                    closeWindow: "Pencereyi kapat",
                    maximize: "Büyüt",
                    minimize: "Küçült",
                    moveOrResizeWindow: "Pencereyi taşı veya yeniden boyutlandır.",
                    moveWindow: "Pencereyi taşı.",
                    resizeBottom: "Alttan yeniden boyutlandır.",
                    resizeBottomLeft: "Sol alttan yeniden boyutlandır.",
                    resizeBottomRight: "Sağ alttan yeniden boyutlandır.",
                    resizeLeft: "Soldan yeniden boyutlandır.",
                    resizeRight: "Sağdan yeniden boyutlandır.",
                    resizeTop: "Üstten yeniden boyutlandır.",
                    resizeTopLeft: "Sol üstten yeniden boyutlandır.",
                    resizeTopRight: "Sağ üstten yeniden boyutlandır.",
                    resizeWindow: "Pencereyi yeniden boyutlandır.",
                    restore: "Geri yükle"
                }
            }
        });
        fixture.detectChanges();

        const closeBtn = fixture.nativeElement.querySelector("button[monaButton][title='Kapat']") as HTMLButtonElement;
        expect(closeBtn?.getAttribute("aria-label")).toBe("Pencereyi kapat");

        const dragBar = fixture.nativeElement.querySelector("[monaWindowDragHandler]");
        expect(dragBar?.getAttribute("aria-label")).toBe("Pencereyi taşı veya yeniden boyutlandır.");

        i18n.use(MONA_DEFAULT_LOCALE);
    });

    it("respects consumer message overrides", () => {
        TestBed.resetTestingModule();
        const initialData = createWindowInjectorData({
            closable: true,
            content: WindowContentComponentTestComponent,
            draggable: true,
            messages: {
                close: "Fermer",
                closeWindow: "Fermer la fenêtre",
                moveWindow: "Déplacer la fenêtre."
            },
            title: "Test Window"
        });
        const windowReference = new WindowReference({}, document);
        const overrideData = { ...initialData, windowReference };

        TestBed.configureTestingModule({
            imports: [WindowContentComponent],
            providers: [{ provide: PopupDataInjectionToken, useValue: overrideData }]
        });
        const overrideFixture = TestBed.createComponent(WindowContentComponent);
        overrideFixture.detectChanges();

        const closeBtn = overrideFixture.nativeElement.querySelector(
            "button[monaButton][title='Fermer']"
        ) as HTMLButtonElement;
        expect(closeBtn?.getAttribute("aria-label")).toBe("Fermer la fenêtre");

        const dragBar = overrideFixture.nativeElement.querySelector("[monaWindowDragHandler]");
        expect(dragBar?.getAttribute("aria-label")).toBe("Déplacer la fenêtre.");
    });
});
