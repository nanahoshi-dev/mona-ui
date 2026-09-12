import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { generatePseudoLocale, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE, MONA_ES_ES_LOCALE, MONA_FR_FR_LOCALE } from "@nanahoshi/mona-ui/locales";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";

@Component({
    selector: "mona-test-multi-i18n",
    template: `
        <div [attr.dir]="direction()">
            <mona-pager [total]="100" [pageSize]="10" />
            <mona-calendar />
            <mona-numeric-text-box [value]="1234.5" [decimals]="2" />
            <mona-progress-bar [value]="50" />
            <mona-scroll-view [data]="items" [width]="300" [height]="200" />
        </div>
    `,
    imports: [
        PagerComponent,
        CalendarComponent,
        NumericTextBoxComponent,
        ProgressBarComponent,
        ScrollViewComponent
    ]
})
class TestMultiComponentHost {
    public readonly direction = signal<"ltr" | "rtl">("ltr");
    public readonly items = ["Item 1", "Item 2"];
}

describe("Multi-Component i18n & RTL Integration Suite", () => {
    let fixture: ComponentFixture<TestMultiComponentHost>;
    let host: TestMultiComponentHost;
    let i18n: MonaI18nService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestMultiComponentHost]
        }).compileComponents();

        fixture = TestBed.createComponent(TestMultiComponentHost);
        host = fixture.componentInstance;
        i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
    });

    it("renders zero-config English defaults across all components", () => {
        const root = fixture.nativeElement as HTMLElement;

        // Pager English ARIA
        const pager = root.querySelector("mona-pager");
        expect(pager).not.toBeNull();
        const firstBtn = pager?.querySelector("button[aria-label='First page']");
        expect(firstBtn).not.toBeNull();

        // NumericTextBox English decimal separator (.)
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;
        expect(input).not.toBeNull();
        expect(input.value).toBe("1234.50");

        // ScrollView English ARIA
        const scrollView = root.querySelector("mona-scroll-view");
        expect(scrollView).not.toBeNull();
        const prevBtn = scrollView?.querySelector("button[aria-label='Previous page']");
        expect(prevBtn).not.toBeNull();

        // ProgressBar
        const progressBar = root.querySelector("mona-progress-bar");
        expect(progressBar).not.toBeNull();
        expect(progressBar?.textContent).toContain("50");
    });

    it("reactively switches through en-US -> tr-TR -> de-DE -> en-US without recreating application", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Switch to Turkish (tr-TR)
        const trLocale: MonaLocale = {
            direction: "ltr",
            id: "tr-TR",
            messages: {
                pager: {
                    firstPageLabel: "İlk sayfa",
                    nextPageLabel: "Sonraki sayfa"
                },
                scrollView: {
                    nextPage: "Sonraki sayfa",
                    previousPage: "Önceki sayfa"
                }
            }
        };
        i18n.use(trLocale);
        await fixture.whenStable();
        fixture.detectChanges();

        const trPager = root.querySelector("mona-pager");
        expect(trPager?.querySelector("button[aria-label='İlk sayfa']")).not.toBeNull();
        const trScroll = root.querySelector("mona-scroll-view");
        expect(trScroll?.querySelector("button[aria-label='Önceki sayfa']")).not.toBeNull();
        // In Turkish, decimal separator is comma: "1234,50"
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 2. Switch to German (de-DE)
        i18n.use(MONA_DE_DE_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        const dePager = root.querySelector("mona-pager");
        expect(dePager?.querySelector("button[aria-label='Erste Seite']")).not.toBeNull();
        const deScroll = root.querySelector("mona-scroll-view");
        expect(deScroll?.querySelector("button[aria-label='Vorherige Seite']")).not.toBeNull();
        // German also uses comma decimal: "1234,50"
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 3. Switch back to English (en-US)
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        const enPager = root.querySelector("mona-pager");
        expect(enPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        const enScroll = root.querySelector("mona-scroll-view");
        expect(enScroll?.querySelector("button[aria-label='Previous page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official Spanish (es-ES) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Spanish (Spain) locale
        i18n.use(MONA_ES_ES_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("es-ES");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in Spanish: "Primera página"
        const esPager = root.querySelector("mona-pager");
        expect(esPager?.querySelector("button[aria-label='Primera página']")).not.toBeNull();

        // ScrollView previousPage in Spanish: "Página anterior"
        const esScroll = root.querySelector("mona-scroll-view");
        expect(esScroll?.querySelector("button[aria-label='Página anterior']")).not.toBeNull();

        // Calendar translated UI controls and live region in Spanish
        const esCalendar = root.querySelector("mona-calendar");
        expect(esCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("Hoy");
        expect(esCalendar?.querySelector("button[aria-label='Mes anterior']")).not.toBeNull();
        expect(esCalendar?.querySelector("button[aria-label='Mes siguiente']")).not.toBeNull();
        expect(esCalendar?.querySelector("[aria-live='polite']")?.textContent?.toLowerCase()).toContain("calendario");

        // NumericTextBox formatting with Spanish comma separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 2. Test application override precedence over Spanish locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "Inicio de página"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(esPager?.querySelector("button[aria-label='Inicio de página']")).not.toBeNull();

        // 3. Clear overrides: Spanish locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(esPager?.querySelector("button[aria-label='Primera página']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(esPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official German (de-DE) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official German (Germany) locale
        i18n.use(MONA_DE_DE_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("de-DE");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in German: "Erste Seite"
        const dePager = root.querySelector("mona-pager");
        expect(dePager?.querySelector("button[aria-label='Erste Seite']")).not.toBeNull();

        // ScrollView previousPage in German: "Vorherige Seite"
        const deScroll = root.querySelector("mona-scroll-view");
        expect(deScroll?.querySelector("button[aria-label='Vorherige Seite']")).not.toBeNull();

        // Calendar translated UI controls and live region in German
        const deCalendar = root.querySelector("mona-calendar");
        expect(deCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("Heute");
        expect(deCalendar?.querySelector("button[aria-label='Vorheriger Monat']")).not.toBeNull();
        expect(deCalendar?.querySelector("button[aria-label='Nächster Monat']")).not.toBeNull();
        expect(deCalendar?.querySelector("[aria-live='polite']")?.textContent?.toLowerCase()).toContain("kalender");

        // NumericTextBox formatting with German comma separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 2. Test application override precedence over German locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "Startseite"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(dePager?.querySelector("button[aria-label='Startseite']")).not.toBeNull();

        // 3. Clear overrides: German locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(dePager?.querySelector("button[aria-label='Erste Seite']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(dePager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official French (fr-FR) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official French (France) locale
        i18n.use(MONA_FR_FR_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("fr-FR");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in French: "Première page"
        const frPager = root.querySelector("mona-pager");
        expect(frPager?.querySelector("button[aria-label='Première page']")).not.toBeNull();

        // ScrollView previousPage in French: "Page précédente"
        const frScroll = root.querySelector("mona-scroll-view");
        expect(frScroll?.querySelector("button[aria-label='Page précédente']")).not.toBeNull();

        // Calendar translated UI controls and live region in French
        const frCalendar = root.querySelector("mona-calendar");
        expect(frCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("Aujourd’hui");
        expect(frCalendar?.querySelector("button[aria-label='Mois précédent']")).not.toBeNull();
        expect(frCalendar?.querySelector("button[aria-label='Mois suivant']")).not.toBeNull();
        expect(frCalendar?.querySelector("[aria-live='polite']")?.textContent?.toLowerCase()).toContain("calendrier");

        // NumericTextBox formatting with French comma separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 2. Test application override precedence over French locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "Début de page"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(frPager?.querySelector("button[aria-label='Début de page']")).not.toBeNull();

        // 3. Clear overrides: French locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(frPager?.querySelector("button[aria-label='Première page']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(frPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("applies pseudo-localization (en-XA) across multiple components reactively", () => {
        const root = fixture.nativeElement as HTMLElement;

        const pseudoLocale = generatePseudoLocale(
            {
                pager: {
                    firstPageLabel: "First page",
                    nextPageLabel: "Next page"
                },
                scrollView: {
                    nextPage: "Next page",
                    previousPage: "Previous page"
                }
            },
            {
                id: "en-XA",
                pseudoOptions: { expand: false }
            }
        );

        i18n.use(pseudoLocale);
        fixture.detectChanges();

        // Pager firstPageLabel is pseudo-localized "[!! Ƒįřśţ ρåĝë !!]"
        const pager = root.querySelector("mona-pager");
        const firstBtn = pager?.querySelector("ol > li button");
        expect(firstBtn?.getAttribute("aria-label")).toContain("Ƒ");
        expect(firstBtn?.getAttribute("aria-label")).toContain("[!! ");

        // ScrollView previousPage is pseudo-localized
        const scrollView = root.querySelector("mona-scroll-view");
        const prevArrow = scrollView?.querySelector("button[data-navigate-prev]");
        expect(prevArrow?.getAttribute("aria-label")).toContain("Þ");
        expect(prevArrow?.getAttribute("aria-label")).toContain("[!! ");
    });

    it("verifies RTL DOM subtree behavior is decoupled from Mona locale", async () => {
        // 1. English default (LTR) with RTL DOM subtree
        expect(i18n.localeId()).toBe("en-US");
        expect(i18n.direction()).toBe("ltr");

        // Set DOM subtree to dir="rtl"
        host.direction.set("rtl");
        fixture.detectChanges();

        const root = fixture.nativeElement as HTMLElement;
        const container = root.querySelector("div[dir='rtl']") as HTMLElement;
        expect(container).not.toBeNull();
        expect(container.getAttribute("dir")).toBe("rtl");

        // ScrollView chevron icons mirror via rtl:rotate-180 class
        const scrollView = root.querySelector("mona-scroll-view");
        const prevArrowIcon = scrollView?.querySelector("button[data-navigate-prev] svg");
        expect(prevArrowIcon?.getAttribute("class")).toContain("rtl:rotate-180");

        // English messages remain active in RTL DOM
        const pager = root.querySelector("mona-pager");
        expect(pager?.querySelector("button[aria-label='First page']")).not.toBeNull();

        // 2. Activate Spanish locale (metadata: LTR) in the RTL DOM subtree
        i18n.use(MONA_ES_ES_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        // Translation locale metadata is LTR, but semantic DOM direction remains RTL
        expect(i18n.localeId()).toBe("es-ES");
        expect(i18n.direction()).toBe("ltr");
        expect(container.getAttribute("dir")).toBe("rtl");

        // Direction-sensitive component layout still follows DOM RTL (chevrons mirrored)
        expect(prevArrowIcon?.getAttribute("class")).toContain("rtl:rotate-180");

        // Components render translated Spanish UI
        expect(pager?.querySelector("button[aria-label='Primera página']")).not.toBeNull();
        const calendar = root.querySelector("mona-calendar");
        expect(calendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("Hoy");
    });
});

