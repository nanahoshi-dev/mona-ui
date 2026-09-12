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
import { MONA_FR_FR_LOCALE } from "./fr-fr.locale";

@Component({
    template: `<mona-calendar [value]="testDate" />`,
    imports: [CalendarComponent]
})
class CalendarIntegrationHostComponent {
    public readonly testDate = new Date(2026, 8, 15);
}

@Component({
    template: `<mona-split-button [text]="'Enregistrer'" />`,
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

describe("MONA_FR_FR_LOCALE Integration with MonaI18nService", () => {
    it("configures fr-FR locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("fr-FR");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_FR_FR_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Première page");
        expect(pagerMessages().lastPageLabel).toBe("Dernière page");
        expect(pagerMessages().nextPageLabel).toBe("Page suivante");
        expect(pagerMessages().previousPageLabel).toBe("Page précédente");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Page 1 sur 10");
    });

    it("reactively switches between English and French via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to French
        service.use(MONA_FR_FR_LOCALE);
        expect(service.localeId()).toBe("fr-FR");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Première page");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over French locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: French locale wins
        expect(pagerMessages().firstPageLabel).toBe("Première page");
        expect(pagerMessages().nextPageLabel).toBe("Page suivante");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Page suivante (personnalisée)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Page suivante (personnalisée)");
        // Non-overridden message still uses French locale
        expect(pagerMessages().firstPageLabel).toBe("Première page");

        // Clear overrides: restores French locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Page suivante");
        expect(pagerMessages().firstPageLabel).toBe("Première page");
    });

    it("integrates with locale-aware number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("fr-FR");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe("\u202F");

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
        expect(formatted).toBe("1\u202F234,50");

        const formattedGrouped = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("12\u202F345,67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date).toLowerCase()).toBe("septembre");
    });

    it("ensures MONA_FR_FR_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_FR_FR_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_FR_FR_LOCALE));

        deepFreeze(MONA_FR_FR_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("fr-FR");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("Première page");
        expect(pager().pageLabel(2)).toBe("Page 2");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_FR_FR_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Temporaire"
            }
        });
        expect(pager().nextPageLabel).toBe("Temporaire");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Page suivante");

        expect(JSON.parse(JSON.stringify(MONA_FR_FR_LOCALE))).toEqual(snapshot);
        expect(MONA_FR_FR_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating French in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_FR_FR_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("fr-FR");
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

    it("renders real Mona Calendar component with French translations and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Aujourd’hui");
        expect(todayButton.getAttribute("aria-label")).toContain("Aller à la date d’aujourd’hui");

        const prevButton = hostEl.querySelector('button[aria-label="Mois précédent"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Mois suivant"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted French month/year header
        const viewButton = hostEl.querySelector('button[aria-label*="annuelle"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent?.toLowerCase()).toContain("septembre");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in French
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent?.toLowerCase()).toContain("calendrier, septembre");
    });

    it("renders SplitButton component with French accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Enregistrer, bouton fractionné']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained French transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='Transférer vers l’autre liste']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Transférer depuis l’autre liste']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Tout transférer vers l’autre liste']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Tout transférer depuis l’autre liste']")).not.toBeNull();
    });

    it("renders Pager component with singular and plural count-aware status in French", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1–1 sur 1 élément");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1–10 sur 50 éléments");
    });

    it("renders ScrollView component with French pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='Faire défiler la pagination vers l’arrière']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Faire défiler la pagination vers l’avant']")).not.toBeNull();
    });

    it("provides French date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("Est égal à");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("N’est pas égal à");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("Est postérieure à");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("Est postérieure ou égale à");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("Est antérieure à");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("Est antérieure ou égale à");
    });

    it("renders ColorGradient component with French accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_FR_FR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("Saturation et luminosité");
        expect(slider.getAttribute("aria-valuetext")).toContain("Saturation");
        expect(slider.getAttribute("aria-valuetext")).toContain("luminosité");
    });
});
