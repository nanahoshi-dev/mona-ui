import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { FilterService } from "@nanahoshi/mona-ui/filter";
import { ListBoxComponent } from "@nanahoshi/mona-ui/list-box";
import { PagerComponent, PAGER_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/pager";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";
import { SplitButtonComponent } from "@nanahoshi/mona-ui/split-button";
import {
    formatNumber,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "./de-de.locale";

@Component({
    template: `<mona-calendar [value]="testDate" />`,
    imports: [CalendarComponent]
})
class CalendarIntegrationHostComponent {
    public readonly testDate = new Date(2026, 8, 15);
}

@Component({
    template: `<mona-split-button [text]="'Speichern'" />`,
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

describe("MONA_DE_DE_LOCALE Integration with MonaI18nService", () => {
    it("configures de-DE locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("de-DE");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_DE_DE_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Erste Seite");
        expect(pagerMessages().lastPageLabel).toBe("Letzte Seite");
        expect(pagerMessages().nextPageLabel).toBe("Nächste Seite");
        expect(pagerMessages().previousPageLabel).toBe("Vorherige Seite");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Seite 1 von 10");
    });

    it("reactively switches between English and German via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to German
        service.use(MONA_DE_DE_LOCALE);
        expect(service.localeId()).toBe("de-DE");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Erste Seite");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over German locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: German locale wins
        expect(pagerMessages().firstPageLabel).toBe("Erste Seite");
        expect(pagerMessages().nextPageLabel).toBe("Nächste Seite");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Nächste Seite (benutzerdefiniert)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Nächste Seite (benutzerdefiniert)");
        // Non-overridden message still uses German locale
        expect(pagerMessages().firstPageLabel).toBe("Erste Seite");

        // Clear overrides: restores German locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Nächste Seite");
        expect(pagerMessages().firstPageLabel).toBe("Erste Seite");
    });

    it("integrates with locale-aware number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("de-DE");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe(".");

        const formattedUngrouped = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false
        });
        expect(formattedUngrouped).toBe("1234,50");

        const formatted = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formatted).toContain(",");
        expect(formatted).toBe("1.234,50");

        const formattedGrouped = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("12.345,67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date).toLowerCase()).toBe("september");
    });

    it("ensures MONA_DE_DE_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_DE_DE_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_DE_DE_LOCALE));

        deepFreeze(MONA_DE_DE_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("de-DE");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("Erste Seite");
        expect(pager().pageLabel(2)).toBe("Seite 2");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_DE_DE_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Temporär"
            }
        });
        expect(pager().nextPageLabel).toBe("Temporär");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Nächste Seite");

        expect(JSON.parse(JSON.stringify(MONA_DE_DE_LOCALE))).toEqual(snapshot);
        expect(MONA_DE_DE_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating German in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_DE_DE_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("de-DE");
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

    it("renders real Mona Calendar component with German translations and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Heute");
        expect(todayButton.getAttribute("aria-label")).toContain("Zum heutigen Datum wechseln");

        const prevButton = hostEl.querySelector('button[aria-label="Vorheriger Monat"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Nächster Monat"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted German month/year header
        const viewButton = hostEl.querySelector('button[aria-label*="Jahresansicht"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent?.toLowerCase()).toContain("september");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in German
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent?.toLowerCase()).toContain("kalender, september");
    });

    it("renders SplitButton component with German accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Speichern, geteilte Schaltfläche']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained German transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='In die andere Liste übertragen']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Aus der anderen Liste übertragen']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Alle in die andere Liste übertragen']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Alle aus der anderen Liste übertragen']")).not.toBeNull();
    });

    it("renders Pager component with singular and plural count-aware status in German", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1–1 von 1 Element");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1–10 von 50 Elementen");
    });

    it("renders ScrollView component with German pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='Seitennavigation rückwärts scrollen']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Seitennavigation vorwärts scrollen']")).not.toBeNull();
    });

    it("provides German date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("Ist gleich");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("Ist ungleich");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("Ist nach");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("Ist am oder nach");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("Ist vor");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("Ist am oder vor");
    });

    it("renders ColorGradient component with German accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_DE_DE_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("Sättigung und Helligkeit");
        expect(slider.getAttribute("aria-valuetext")).toContain("Sättigung");
        expect(slider.getAttribute("aria-valuetext")).toContain("Helligkeit");
    });
});
