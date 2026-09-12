import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { ListBoxComponent } from "@nanahoshi/mona-ui/list-box";
import { PagerComponent, PAGER_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/pager";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";
import { SplitButtonComponent } from "@nanahoshi/mona-ui/split-button";
import { TimeSelectorComponent } from "@nanahoshi/mona-ui/time-selector";
import {
    formatNumber,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_ES_ES_LOCALE } from "./es-es.locale";

@Component({
    template: `<mona-time-selector [(value)]="testTime" [hourFormat]="'12'" />`,
    imports: [TimeSelectorComponent]
})
class TimeSelectorIntegrationHostComponent {
    public readonly testTime = signal<Date | null>(new Date(2026, 8, 15, 9, 30));
}

@Component({
    template: `<mona-calendar [value]="testDate" />`,
    imports: [CalendarComponent]
})
class CalendarIntegrationHostComponent {
    public readonly testDate = new Date(2026, 8, 15);
}

@Component({
    template: `<mona-split-button [text]="'Guardar'" />`,
    imports: [SplitButtonComponent]
})
class SplitButtonIntegrationHostComponent {}

interface Item {
    id: number;
    text: string;
}

@Component({
    template: `
        <mona-list-box
            #first
            [items]="firstItems"
            [textField]="'text'"
            [selectBy]="'id'"
            [toolbar]="{ actions: ['transferTo', 'transferFrom', 'transferAllTo', 'transferAllFrom'] }"
            [connectedList]="second"
        />
        <mona-list-box
            #second
            [items]="secondItems"
            [textField]="'text'"
            [selectBy]="'id'"
        />
    `,
    imports: [ListBoxComponent]
})
class ListBoxIntegrationHostComponent {
    public readonly firstItems: Item[] = [{ id: 1, text: "A" }];
    public readonly secondItems: Item[] = [{ id: 2, text: "B" }];
}

@Component({
    template: `<mona-pager [total]="total()" [pageSize]="10" />`,
    imports: [PagerComponent]
})
class PagerIntegrationHostComponent {
    public readonly total = signal(1);
}

@Component({
    template: `<mona-scroll-view [data]="items" [pageable]="true" [width]="300" [height]="200" />`,
    imports: [ScrollViewComponent]
})
class ScrollViewIntegrationHostComponent {
    public readonly items = ["Item 1", "Item 2"];
    public readonly scrollView = viewChild.required(ScrollViewComponent);
}

describe("MONA_ES_ES_LOCALE Integration with MonaI18nService", () => {
    it("configures es-ES locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("es-ES");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_ES_ES_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Primera página");
        expect(pagerMessages().lastPageLabel).toBe("Última página");
        expect(pagerMessages().nextPageLabel).toBe("Página siguiente");
        expect(pagerMessages().previousPageLabel).toBe("Página anterior");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Página 1 de 10");
    });

    it("reactively switches between English and Spanish via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Spanish
        service.use(MONA_ES_ES_LOCALE);
        expect(service.localeId()).toBe("es-ES");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Primera página");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Spanish locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Spanish locale wins
        expect(pagerMessages().firstPageLabel).toBe("Primera página");
        expect(pagerMessages().nextPageLabel).toBe("Página siguiente");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Avanzar página (personalizado)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Avanzar página (personalizado)");
        // Non-overridden message still uses Spanish locale
        expect(pagerMessages().firstPageLabel).toBe("Primera página");

        // Clear overrides: restores Spanish locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Página siguiente");
        expect(pagerMessages().firstPageLabel).toBe("Primera página");
    });

    it("integrates with locale-aware number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("es-ES");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe(".");

        const formatted = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formatted).toContain(",");
        expect(formatted).toBe("1234,50");

        const formattedGrouped = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("12.345,67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date).toLowerCase()).toBe("septiembre");
    });

    it("ensures MONA_ES_ES_LOCALE is immutable and unmutated across service usage cycles", () => {
        const deepFreeze = <T>(obj: T): T => {
            Object.freeze(obj);
            for (const key of Object.getOwnPropertyNames(obj as object)) {
                const val = (obj as Record<string, unknown>)[key];
                if (val && (typeof val === "object" || typeof val === "function") && !Object.isFrozen(val)) {
                    deepFreeze(val);
                }
            }
            return obj;
        };

        const pageLabelRef = MONA_ES_ES_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_ES_ES_LOCALE));

        deepFreeze(MONA_ES_ES_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("es-ES");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("Primera página");
        expect(pager().pageLabel(2)).toBe("Página 2");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_ES_ES_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Temporal"
            }
        });
        expect(pager().nextPageLabel).toBe("Temporal");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Página siguiente");

        expect(JSON.parse(JSON.stringify(MONA_ES_ES_LOCALE))).toEqual(snapshot);
        expect(MONA_ES_ES_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Spanish in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_ES_ES_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("es-ES");
            expect(service.direction()).toBe("ltr");
            // Activation must not mutate pre-existing semantic DOM direction
            expect(document.documentElement.getAttribute("dir")).toBe("rtl");

            // Switching back to default locale also preserves semantic DOM direction
            service.use(MONA_DEFAULT_LOCALE);
            expect(service.localeId()).toBe("en-US");
            expect(document.documentElement.getAttribute("dir")).toBe("rtl");
        } finally {
            if (originalDir !== null) {
                document.documentElement.setAttribute("dir", originalDir);
            } else {
                document.documentElement.removeAttribute("dir");
            }
        }
    });

    it("renders real Mona Calendar component with Spanish translations and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Hoy");

        const prevButton = hostEl.querySelector('button[aria-label="Mes anterior"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Mes siguiente"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Spanish month/year header
        const viewButton = hostEl.querySelector('button[aria-label*="vista anual"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent?.toLowerCase()).toContain("septiembre");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in Spanish
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent?.toLowerCase()).toContain("calendario, septiembre");
    });

    it("renders SplitButton component with Spanish accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Guardar, botón dividido']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Spanish transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='Transferir a la otra lista']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Transferir desde la otra lista']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Transferir todo a la otra lista']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Transferir todo desde la otra lista']")).not.toBeNull();
    });

    it("renders Pager component with singular and plural count-aware status in Spanish", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1 - 1 de 1 elemento");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1 - 10 de 50 elementos");
    });

    it("renders ScrollView component with Spanish pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ScrollViewIntegrationHostComponent);
        fixture.detectChanges();

        const comp = fixture.componentInstance.scrollView() as unknown as {
            pagerArrowVisible: { set: (v: boolean) => void };
        };
        comp.pagerArrowVisible.set(true);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='Desplazar la paginación hacia atrás']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Desplazar la paginación hacia delante']")).not.toBeNull();
    });

    it("renders TimeSelector component with localized Spanish 12-hour day periods and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ES_ES_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Meridiem list accessible label is Spanish: a. m./p. m.
        const meridiemList = hostEl.querySelector("ol[aria-label='a. m./p. m.']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        expect(hostEl.querySelector("ol[aria-label='AM/PM']")).toBeNull();

        // 2. Visible AM/PM options are localized to a. m. and p. m.
        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "a. m.");
        const pmItem = listItems.find(li => li.textContent?.trim() === "p. m.");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();
        expect(listItems.some(li => li.textContent?.trim() === "AM")).toBe(false);
        expect(listItems.some(li => li.textContent?.trim() === "PM")).toBe(false);

        // 3. Info text displays Spanish day period matching the selector
        expect(hostEl.textContent).toContain("9:30 a. m.");

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9:30 p. m.");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "Establecer");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9:30 a. m.");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });
});
