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
import { TimeSelectorComponent } from "@nanahoshi/mona-ui/time-selector";
import {
    formatNumber,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_JA_JP_LOCALE } from "./ja-jp.locale";

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
    template: `<mona-split-button [text]="'保存'" />`,
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
    public readonly items = ["項目 1", "項目 2"];
    public readonly scrollView = viewChild.required(ScrollViewComponent);
}

describe("MONA_JA_JP_LOCALE Integration with MonaI18nService", () => {
    it("configures ja-JP locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("ja-JP");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_JA_JP_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("最初のページ");
        expect(pagerMessages().lastPageLabel).toBe("最後のページ");
        expect(pagerMessages().nextPageLabel).toBe("次のページ");
        expect(pagerMessages().previousPageLabel).toBe("前のページ");
        expect(pagerMessages().pageStatus(1, 10)).toBe("10ページ中1ページ");
    });

    it("reactively switches between English and Japanese via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Japanese
        service.use(MONA_JA_JP_LOCALE);
        expect(service.localeId()).toBe("ja-JP");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("最初のページ");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Japanese locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Japanese locale wins
        expect(pagerMessages().firstPageLabel).toBe("最初のページ");
        expect(pagerMessages().nextPageLabel).toBe("次のページ");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "次のページ（カスタム）"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("次のページ（カスタム）");
        // Non-overridden message still uses Japanese locale
        expect(pagerMessages().firstPageLabel).toBe("最初のページ");

        // Clear overrides: restores Japanese locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("次のページ");
        expect(pagerMessages().firstPageLabel).toBe("最初のページ");
    });

    it("integrates with locale-aware number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("ja-JP");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(".");
        expect(symbols.group).toBe(",");

        const formattedUngrouped = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false
        });
        expect(formattedUngrouped).toBe("1234.50");

        const formatted = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formatted).toContain(".");
        expect(formatted).toBe("1,234.50");

        const formattedGrouped = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("12,345.67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date)).toBe("9月");
    });

    it("ensures MONA_JA_JP_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_JA_JP_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_JA_JP_LOCALE));

        deepFreeze(MONA_JA_JP_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("ja-JP");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("最初のページ");
        expect(pager().pageLabel(2)).toBe("2ページ");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_JA_JP_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "一時的"
            }
        });
        expect(pager().nextPageLabel).toBe("一時的");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("次のページ");

        expect(JSON.parse(JSON.stringify(MONA_JA_JP_LOCALE))).toEqual(snapshot);
        expect(MONA_JA_JP_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Japanese in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_JA_JP_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("ja-JP");
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

    it("renders real Mona Calendar component with Japanese translations and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("今日");
        expect(todayButton.getAttribute("aria-label")).toContain("今日（");

        const prevButton = hostEl.querySelector('button[aria-label="前の月"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="次の月"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Japanese month/year header
        const viewButton = hostEl.querySelector('button[aria-label*="年表示"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("9月");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in Japanese
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("カレンダー");
        expect(liveRegion.textContent).toContain("9月");

        // 4. Year view navigation and accessibility labels (no duplicate 年)
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("年表示");
        expect(liveRegion.textContent).toContain("2026年");
        expect(liveRegion.textContent).not.toContain("年年");

        const yearViewButton = hostEl.querySelector('button[aria-label*="10年表示"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("10年表示に切り替える。現在は2026年");
        expect(yearViewButton.getAttribute("aria-label")).not.toContain("年年");

        // 5. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("10年表示");
        expect(liveRegion.textContent).toContain("2020年");
        expect(liveRegion.textContent).toContain("2029年");
        expect(liveRegion.textContent).not.toContain("年年");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020年～2029年"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
        expect(decadeViewButton.getAttribute("aria-label")).not.toContain("年年");
    });

    it("renders SplitButton component with Japanese accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='保存、分割ボタン']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Japanese transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='もう一方のリストへ移動']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='もう一方のリストから移動']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='すべてをもう一方のリストへ移動']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='すべてをもう一方のリストから移動']")).not.toBeNull();
    });

    it("renders Pager component with Japanese counter-aware range status", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("全1件中1～1件");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("全50件中1～10件");
    });

    it("renders ScrollView component with Japanese pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='ページャーを前へスクロール']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='ページャーを次へスクロール']")).not.toBeNull();
    });

    it("provides Japanese date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("等しい");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("等しくない");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("より後");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("以降");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("より前");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("以前");
    });

    it("renders ColorGradient component with Japanese accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("彩度と明度");
        expect(slider.getAttribute("aria-valuetext")).toContain("彩度");
        expect(slider.getAttribute("aria-valuetext")).toContain("明度");
    });

    it("renders TimeSelector component with localized 12-hour day periods and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_JA_JP_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Meridiem list accessible label is Japanese
        const meridiemList = hostEl.querySelector("ol[aria-label='午前/午後']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        expect(hostEl.querySelector("ol[aria-label='AM/PM']")).toBeNull();

        // 2. Visible AM/PM options are localized to 午前 and 午後
        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "午前");
        const pmItem = listItems.find(li => li.textContent?.trim() === "午後");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();
        expect(listItems.some(li => li.textContent?.trim() === "AM")).toBe(false);
        expect(listItems.some(li => li.textContent?.trim() === "PM")).toBe(false);

        // 3. Info text displays Japanese day period matching the selector
        expect(hostEl.textContent).toContain("午前9:30");

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("午後9:30");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "設定");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("午前9:30");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });
});
