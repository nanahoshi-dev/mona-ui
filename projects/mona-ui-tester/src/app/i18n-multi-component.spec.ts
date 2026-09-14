import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { generatePseudoLocale, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import {
    MONA_AR_SA_LOCALE,
    MONA_DE_DE_LOCALE,
    MONA_ES_ES_LOCALE,
    MONA_FR_FR_LOCALE,
    MONA_JA_JP_LOCALE,
    MONA_KO_KR_LOCALE,
    MONA_PT_BR_LOCALE,
    MONA_ZH_CN_LOCALE,
    MONA_ZH_TW_LOCALE
} from "@nanahoshi/mona-ui/locales";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";

@Component({
    selector: "app-test-multi-i18n",
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

    it("integrates official Japanese (ja-JP) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Japanese (Japan) locale
        i18n.use(MONA_JA_JP_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("ja-JP");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in Japanese: "最初のページ"
        const jaPager = root.querySelector("mona-pager");
        expect(jaPager?.querySelector("button[aria-label='最初のページ']")).not.toBeNull();

        // ScrollView previousPage in Japanese: "前のページ"
        const jaScroll = root.querySelector("mona-scroll-view");
        expect(jaScroll?.querySelector("button[aria-label='前のページ']")).not.toBeNull();

        // Calendar translated UI controls and live region in Japanese
        const jaCalendar = root.querySelector("mona-calendar");
        expect(jaCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("今日");
        expect(jaCalendar?.querySelector("button[aria-label='前の月']")).not.toBeNull();
        expect(jaCalendar?.querySelector("button[aria-label='次の月']")).not.toBeNull();
        expect(jaCalendar?.querySelector("[aria-live='polite']")?.textContent).toContain("カレンダー");

        // NumericTextBox formatting with Japanese dot separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");

        // 2. Test application override precedence over Japanese locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "先頭ページ"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(jaPager?.querySelector("button[aria-label='先頭ページ']")).not.toBeNull();

        // 3. Clear overrides: Japanese locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(jaPager?.querySelector("button[aria-label='最初のページ']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(jaPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official Brazilian Portuguese (pt-BR) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Brazilian Portuguese locale
        i18n.use(MONA_PT_BR_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("pt-BR");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in Portuguese: "Primeira página"
        const ptPager = root.querySelector("mona-pager");
        expect(ptPager?.querySelector("button[aria-label='Primeira página']")).not.toBeNull();

        // ScrollView previousPage in Portuguese: "Página anterior"
        const ptScroll = root.querySelector("mona-scroll-view");
        expect(ptScroll?.querySelector("button[aria-label='Página anterior']")).not.toBeNull();

        // Calendar translated UI controls, Sunday-first header, and live region in Portuguese
        const ptCalendar = root.querySelector("mona-calendar");
        expect(ptCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("Hoje");
        expect(ptCalendar?.querySelector("button[aria-label='Mês anterior']")).not.toBeNull();
        expect(ptCalendar?.querySelector("button[aria-label='Próximo mês']")).not.toBeNull();
        expect(ptCalendar?.querySelector("[aria-live='polite']")?.textContent?.toLowerCase()).toContain("calendário");

        const headerRow = ptCalendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("dom.");

        // NumericTextBox formatting with Brazilian comma separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 2. Test application override precedence over Portuguese locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "Início da página"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(ptPager?.querySelector("button[aria-label='Início da página']")).not.toBeNull();

        // 3. Clear overrides: Portuguese locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(ptPager?.querySelector("button[aria-label='Primeira página']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(ptPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official Simplified Chinese (zh-CN) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Simplified Chinese locale
        i18n.use(MONA_ZH_CN_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("zh-CN");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in zh-CN: "第一页"
        const cnPager = root.querySelector("mona-pager");
        expect(cnPager?.querySelector("button[aria-label='第一页']")).not.toBeNull();

        // ScrollView previousPage in zh-CN: "上一页"
        const cnScroll = root.querySelector("mona-scroll-view");
        expect(cnScroll?.querySelector("button[aria-label='上一页']")).not.toBeNull();

        // Calendar translated UI controls, Monday-first header, and live region in zh-CN
        const cnCalendar = root.querySelector("mona-calendar");
        expect(cnCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("今天");
        expect(cnCalendar?.querySelector("button[aria-label='上个月']")).not.toBeNull();
        expect(cnCalendar?.querySelector("button[aria-label='下个月']")).not.toBeNull();
        expect(cnCalendar?.querySelector("[aria-live='polite']")?.textContent).toContain("日历");

        const headerRow = cnCalendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("周一");

        // NumericTextBox formatting with dot decimal separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");

        // 2. Test application override precedence over Simplified Chinese locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "首页"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(cnPager?.querySelector("button[aria-label='首页']")).not.toBeNull();

        // 3. Clear overrides: Simplified Chinese locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(cnPager?.querySelector("button[aria-label='第一页']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(cnPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official Traditional Chinese (zh-TW) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Traditional Chinese locale
        i18n.use(MONA_ZH_TW_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("zh-TW");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in zh-TW: "第一頁"
        const twPager = root.querySelector("mona-pager");
        expect(twPager?.querySelector("button[aria-label='第一頁']")).not.toBeNull();

        // ScrollView previousPage in zh-TW: "上一頁"
        const twScroll = root.querySelector("mona-scroll-view");
        expect(twScroll?.querySelector("button[aria-label='上一頁']")).not.toBeNull();

        // Calendar translated UI controls, Sunday-first header, and live region in zh-TW
        const twCalendar = root.querySelector("mona-calendar");
        expect(twCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("今天");
        expect(twCalendar?.querySelector("button[aria-label='上個月']")).not.toBeNull();
        expect(twCalendar?.querySelector("button[aria-label='下個月']")).not.toBeNull();
        expect(twCalendar?.querySelector("[aria-live='polite']")?.textContent).toContain("行事曆");

        const headerRow = twCalendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("週日");

        // NumericTextBox formatting with dot decimal separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");

        // 2. Test application override precedence over Traditional Chinese locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "首頁"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(twPager?.querySelector("button[aria-label='首頁']")).not.toBeNull();

        // 3. Clear overrides: Traditional Chinese locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(twPager?.querySelector("button[aria-label='第一頁']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(twPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official Korean (ko-KR) locale reactively with runtime overrides and formatting", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Korean locale
        i18n.use(MONA_KO_KR_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("ko-KR");
        expect(i18n.direction()).toBe("ltr");

        // Pager firstPageLabel in ko-KR: "첫 페이지"
        const koPager = root.querySelector("mona-pager");
        expect(koPager?.querySelector("button[aria-label='첫 페이지']")).not.toBeNull();

        // ScrollView previousPage in ko-KR: "이전 페이지"
        const koScroll = root.querySelector("mona-scroll-view");
        expect(koScroll?.querySelector("button[aria-label='이전 페이지']")).not.toBeNull();

        // Calendar translated UI controls, Sunday-first header, and live region in ko-KR
        const koCalendar = root.querySelector("mona-calendar");
        expect(koCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("오늘");
        expect(koCalendar?.querySelector("button[aria-label='이전 달']")).not.toBeNull();
        expect(koCalendar?.querySelector("button[aria-label='다음 달']")).not.toBeNull();
        expect(koCalendar?.querySelector("[aria-live='polite']")?.textContent).toContain("달력");

        const headerRow = koCalendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("일");

        // NumericTextBox formatting with dot decimal separator
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");

        // 2. Test application override precedence over Korean locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "맨 앞 페이지"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(koPager?.querySelector("button[aria-label='맨 앞 페이지']")).not.toBeNull();

        // 3. Clear overrides: Korean locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(koPager?.querySelector("button[aria-label='첫 페이지']")).not.toBeNull();

        // 4. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(koPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("integrates official Arabic (ar-SA) locale reactively with runtime overrides, Arabic-Indic numbers, and direction decoupling", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Activate official Arabic (Saudi Arabia) locale
        i18n.use(MONA_AR_SA_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("ar-SA");
        expect(i18n.direction()).toBe("rtl");

        // Pager firstPageLabel in Arabic: "الصفحة الأولى"
        const arPager = root.querySelector("mona-pager");
        expect(arPager?.querySelector("button[aria-label='الصفحة الأولى']")).not.toBeNull();
        expect(arPager?.querySelector("button[aria-current='page']")?.textContent?.trim()).toBe("١");

        // ScrollView previousPage in Arabic: "الصفحة السابقة"
        const arScroll = root.querySelector("mona-scroll-view");
        expect(arScroll?.querySelector("button[aria-label='الصفحة السابقة']")).not.toBeNull();

        // Calendar translated UI controls, Sunday-first narrow fallback, and live region in Arabic
        const arCalendar = root.querySelector("mona-calendar");
        expect(arCalendar?.querySelector("button:first-child")?.textContent?.trim()).toBe("اليوم");
        expect(arCalendar?.querySelector("button[aria-label='الشهر السابق']")).not.toBeNull();
        expect(arCalendar?.querySelector("button[aria-label='الشهر التالي']")).not.toBeNull();
        expect(arCalendar?.querySelector("[aria-live='polite']")?.textContent).toContain("تقويم");

        const headerRow = arCalendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        const firstDayHeader = headerRow?.querySelectorAll(":scope > div")[0];
        expect(firstDayHeader?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("ح");
        expect(firstDayHeader?.querySelector("span[aria-hidden='true']")?.getAttribute("aria-hidden")).toBe("true");
        expect(firstDayHeader?.querySelector("span.sr-only")?.textContent?.trim()).toBe("الأحد");
        expect(firstDayHeader?.getAttribute("aria-label")).toBeNull();

        // NumericTextBox formatting with Arabic-Indic numerals and Arabic decimal separator
        expect(input.getAttribute("aria-valuetext")).toBe("١٢٣٤٫٥٠");

        // 2. Test application override precedence over Arabic locale
        i18n.patchMessages({
            pager: {
                firstPageLabel: "البداية"
            }
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(arPager?.querySelector("button[aria-label='البداية']")).not.toBeNull();

        // 3. Clear overrides: Arabic locale value returns
        i18n.clearMessages();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(arPager?.querySelector("button[aria-label='الصفحة الأولى']")).not.toBeNull();

        // 4. Direction decoupling check: host direction toggle doesn't affect locale direction, and vice versa
        expect(host.direction()).toBe("ltr");
        host.direction.set("rtl");
        fixture.detectChanges();
        expect(i18n.direction()).toBe("rtl");

        host.direction.set("ltr");
        fixture.detectChanges();
        expect(i18n.direction()).toBe("rtl");

        // 5. Switch back to English default
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("en-US");
        expect(i18n.direction()).toBe("ltr");
        expect(arPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("switches directly between Simplified Chinese (zh-CN) and Traditional Chinese (zh-TW)", async () => {
        const root = fixture.nativeElement as HTMLElement;

        // 1. Activate zh-CN
        i18n.use(MONA_ZH_CN_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("zh-CN");
        const pager = root.querySelector("mona-pager");
        expect(pager?.querySelector("button[aria-label='第一页']")).not.toBeNull();
        const calendar = root.querySelector("mona-calendar");
        expect(calendar?.querySelector("[aria-live='polite']")?.textContent).toContain("日历");
        let headerRow = calendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("周一");

        // 2. Switch directly to zh-TW
        i18n.use(MONA_ZH_TW_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("zh-TW");
        expect(pager?.querySelector("button[aria-label='第一頁']")).not.toBeNull();
        expect(calendar?.querySelector("[aria-live='polite']")?.textContent).toContain("行事曆");
        headerRow = calendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("週日");

        // 3. Switch directly back to zh-CN
        i18n.use(MONA_ZH_CN_LOCALE);
        await fixture.whenStable();
        fixture.detectChanges();

        expect(i18n.localeId()).toBe("zh-CN");
        expect(pager?.querySelector("button[aria-label='第一页']")).not.toBeNull();
        expect(calendar?.querySelector("[aria-live='polite']")?.textContent).toContain("日历");
        headerRow = calendar?.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("周一");
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

