import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CalendarComponent, type FirstDayOfWeek } from "@nanahoshi/mona-ui/calendar";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import { ColorGradientComponent } from "@nanahoshi/mona-ui/color-gradient";
import { DatePickerComponent } from "@nanahoshi/mona-ui/date-picker";
import { DateTimePickerComponent } from "@nanahoshi/mona-ui/datetime-picker";
import { FilterService } from "@nanahoshi/mona-ui/filter";
import {
    GridColumnComponent,
    GridComponent,
    GridRowReorderableDirective,
    GRID_DEFAULT_MESSAGES
} from "@nanahoshi/mona-ui/grid";
import { ListBoxComponent } from "@nanahoshi/mona-ui/list-box";
import { PagerComponent, PAGER_DEFAULT_MESSAGES } from "@nanahoshi/mona-ui/pager";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";
import { SplitButtonComponent } from "@nanahoshi/mona-ui/split-button";
import { TimePickerComponent } from "@nanahoshi/mona-ui/time-picker";
import { TimeSelectorComponent } from "@nanahoshi/mona-ui/time-selector";
import {
    formatNumber,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_ZH_CN_LOCALE } from "../zh-cn/zh-cn.locale";
import { MONA_ZH_TW_LOCALE } from "./zh-tw.locale";

@Component({
    template: `
        <mona-date-picker
            [(value)]="value"
            [format]="format()"
            [firstDay]="firstDay()" />
    `,
    imports: [DatePickerComponent]
})
class DatePickerIntegrationHostComponent {
    public readonly firstDay = signal<FirstDayOfWeek | null>(null);
    public readonly format = signal<string | null>(null);
    public readonly value = signal<Date | null>(new Date(2026, 8, 15));
}

@Component({
    template: `
        <mona-time-picker
            [(value)]="value"
            [format]="format()"
            [hourFormat]="hourFormat()"
            [showSeconds]="showSeconds()" />
    `,
    imports: [TimePickerComponent]
})
class TimePickerIntegrationHostComponent {
    public readonly format = signal<string | null>(null);
    public readonly hourFormat = signal<"12" | "24">("24");
    public readonly showSeconds = signal(false);
    public readonly value = signal<Date | null>(new Date(2026, 8, 15, 21, 30, 45));
}

@Component({
    template: `
        <mona-datetime-picker
            [(value)]="value"
            [format]="format()"
            [firstDay]="firstDay()"
            [hourFormat]="hourFormat()"
            [showSeconds]="showSeconds()" />
    `,
    imports: [DateTimePickerComponent]
})
class DateTimePickerIntegrationHostComponent {
    public readonly firstDay = signal<FirstDayOfWeek | null>(null);
    public readonly format = signal<string | null>(null);
    public readonly hourFormat = signal<"12" | "24">("24");
    public readonly showSeconds = signal(false);
    public readonly value = signal<Date | null>(new Date(2026, 8, 15, 21, 30, 45));
}

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
    template: `<mona-split-button [text]="'儲存'" />`,
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

@Component({
    template: `
        <mona-grid
            [data]="rows"
            [rowKey]="'id'"
            [resizeMethod]="120"
            [responsivePager]="false"
            monaGridRowReorderable>
            <mona-grid-column field="name" title="名稱" [width]="120" />
        </mona-grid>
    `,
    imports: [GridComponent, GridColumnComponent, GridRowReorderableDirective]
})
class GridIntegrationHostComponent {
    public readonly rows = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" }
    ];
}

@Component({
    template: `
        <mona-chip [removable]="true" [label]="label()" [removeLabel]="removeLabel()" />
        <mona-chip [removable]="true">投影內容</mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipIntegrationHostComponent {
    public readonly label = signal("");
    public readonly removeLabel = signal<string | undefined>(undefined);
}

describe("MONA_ZH_TW_LOCALE Integration with MonaI18nService", () => {
    it("configures zh-TW locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("zh-TW");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_ZH_TW_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("第一頁");
        expect(pagerMessages().lastPageLabel).toBe("最後一頁");
        expect(pagerMessages().nextPageLabel).toBe("下一頁");
        expect(pagerMessages().previousPageLabel).toBe("上一頁");
        expect(pagerMessages().pageStatus(1, 10)).toBe("第 1 頁，共 10 頁");
    });

    it("reactively switches between English and Traditional Chinese via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Traditional Chinese
        service.use(MONA_ZH_TW_LOCALE);
        expect(service.localeId()).toBe("zh-TW");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("第一頁");

        // Switch back to English default
        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Traditional Chinese locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: zh-TW locale wins
        expect(pagerMessages().firstPageLabel).toBe("第一頁");
        expect(pagerMessages().nextPageLabel).toBe("下一頁");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "下一頁（自訂）"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("下一頁（自訂）");
        // Non-overridden message still uses zh-TW locale
        expect(pagerMessages().firstPageLabel).toBe("第一頁");

        // Clear overrides: restores zh-TW locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("下一頁");
        expect(pagerMessages().firstPageLabel).toBe("第一頁");
    });

    it("integrates with locale-aware Chinese number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("zh-TW");

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
        expect(formatted).toBe("1,234.50");

        const formattedGrouped = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("12,345.67");

        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date)).toBe("9月");
    });

    it("ensures MONA_ZH_TW_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_ZH_TW_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_ZH_TW_LOCALE));

        deepFreeze(MONA_ZH_TW_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("zh-TW");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("第一頁");
        expect(pager().pageLabel(2)).toBe("第 2 頁");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_ZH_TW_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "臨時"
            }
        });
        expect(pager().nextPageLabel).toBe("臨時");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("下一頁");

        expect(JSON.parse(JSON.stringify(MONA_ZH_TW_LOCALE))).toEqual(snapshot);
        expect(MONA_ZH_TW_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating zh-TW in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_ZH_TW_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("zh-TW");
            expect(service.direction()).toBe("ltr");
            expect(document.documentElement.getAttribute("dir")).toBe("rtl");

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

    it("renders real Mona Calendar component with Taiwan translations, Sunday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations in Taiwan Traditional Chinese
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("今天");
        expect(todayButton.getAttribute("aria-label")).toContain("移至今天（");

        const prevButton = hostEl.querySelector('button[aria-label="上個月"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="下個月"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Chinese month/year header (2026年9月) with no duplicated 年 or 月
        const viewButton = hostEl.querySelector('button[aria-label*="切換至年份檢視"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("2026年9月");
        expect(viewButton.textContent).not.toContain("年年");
        expect(viewButton.textContent).not.toContain("月月");

        // 3. Calendar container accessible label in Taiwan Traditional Chinese
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("2026年9月行事曆");

        // 4. Verify Sunday is the first day of the week in zh-TW Calendar view (週日)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelectorAll("div")[0]?.textContent?.trim()).toBe("週日");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("年份檢視，2026年");

        const yearViewButton = hostEl.querySelector('button[aria-label*="切換至十年檢視"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("切換至十年檢視，目前為2026年");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("2020年至2029年十年檢視");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020年至2029年"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("renders SplitButton component with Traditional Chinese accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='儲存，分割按鈕']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Taiwan transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='移至另一清單']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='從另一清單移入']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='全部移至另一清單']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='從另一清單全部移入']")).not.toBeNull();
    });

    it("renders Pager component with singular and multi-item status in Traditional Chinese", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("第 1 - 1 項，共 1 項");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("第 1 - 10 項，共 50 項");
    });

    it("renders ScrollView component with Taiwan pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='向前捲動分頁器']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='向後捲動分頁器']")).not.toBeNull();
    });

    it("provides Taiwan date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("等於");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("不等於");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("晚於");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("晚於或等於");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("早於");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("早於或等於");
    });

    it("renders ColorGradient component with Taiwan accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("飽和度與明度");
        expect(slider.getAttribute("aria-valuetext")).toContain("飽和度");
        expect(slider.getAttribute("aria-valuetext")).toContain("明度");
    });

    it("renders TimeSelector component with localized 12-hour day periods (上午/下午) and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Meridiem list accessible label is 上午/下午
        const meridiemList = hostEl.querySelector("ol[aria-label='上午/下午']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        // 2. Visible options are 上午 and 下午
        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "上午");
        const pmItem = listItems.find(li => li.textContent?.trim() === "下午");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();

        // 3. Info text displays day period matching the selector
        expect(hostEl.textContent).toContain("上午9:30");

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("下午9:30");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "設定");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("上午9:30");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });

    it("renders DatePicker component with Taiwan defaults, yyyy/MM/dd parsing, Sunday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Taiwan default numeric date format: yyyy/MM/dd -> 2026/09/15
        expect(input.value).toBe("2026/09/15");

        // 2. Taiwan date input parsing: 2026/11/20
        input.value = "2026/11/20";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(10);
        expect(parsedDate?.getDate()).toBe(20);

        // 3. Sunday-first calendar popup in Taiwan Traditional Chinese
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelectorAll("div")[0]?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("週日");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("週一");

        // 5. Explicit format override
        fixture.componentInstance.format.set("yyyy-MM-dd");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026-11-20");

        // 6. Runtime locale switching when format is null
        fixture.componentInstance.format.set(null);
        fixture.componentInstance.firstDay.set(null);
        service.use(MONA_DEFAULT_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("11/20/2026");

        service.use(MONA_ZH_TW_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/11/20");
    });

    it("renders TimePicker component with Taiwan 24h default, 12h 上午/下午, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 21:30
        expect(input.value).toBe("21:30");

        // 2. 12h mode without seconds: 下午09:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("下午09:30");

        // 3. Open popup and verify meridiem list & localized options
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = document.querySelector("ol[aria-label='上午/下午']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        const amItem = Array.from(meridiemList.querySelectorAll("li")).find(li => li.textContent?.trim() === "上午");
        expect(amItem).toBeDefined();

        amItem?.click();
        fixture.detectChanges();

        const setButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            b => b.textContent?.trim() === "設定"
        );
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("上午09:30");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // 4. 12h mode with seconds
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("上午09:30:45");

        // 5. Explicit format override
        fixture.componentInstance.format.set("hh:mm:ss");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45");
    });

    it("renders DateTimePicker component with Taiwan datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 2026/09/15 21:30
        expect(input.value).toBe("2026/09/15 21:30");

        // 2. 12h mode without seconds: 2026/09/15 下午09:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/09/15 下午09:30");

        // 3. 12h mode with seconds: 2026/09/15 下午09:30:45
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/09/15 下午09:30:45");

        // 4. Chinese datetime input parsing
        input.value = "2026/12/25 上午08:15:00";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(11);
        expect(parsedDate?.getDate()).toBe(25);
        expect(parsedDate?.getHours()).toBe(8);
        expect(parsedDate?.getMinutes()).toBe(15);
        expect(parsedDate?.getSeconds()).toBe(0);

        // 5. Open popup and verify Taiwan labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("日期時間選取器");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("日期");
        expect(tabButtons[1]?.textContent?.trim()).toBe("時間");

        // In date view, Sunday is first: 週日
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelectorAll("div")[0]?.textContent?.trim()).toBe("週日");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='上午/下午']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("設定");
        expect(footerButtons[1]?.textContent?.trim()).toBe("取消");

        // Close popup
        (footerButtons[1] as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();

        // 6. Explicit format override
        fixture.componentInstance.format.set("yyyy-MM-dd HH:mm");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026-12-25 08:15");
    });

    it("renders Grid component with Taiwan row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        }).compileComponents();

        const fixture = TestBed.createComponent(GridIntegrationHostComponent);
        for (let cycle = 0; cycle < 3; cycle++) {
            fixture.detectChanges();
            await fixture.whenStable();
        }
        await fixture.whenRenderingDone();
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const reorderHeader = hostEl.querySelector("th[aria-label='資料列重新排序']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='重新排列第 1 列']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "使用 Alt + 向上鍵或 Alt + 向下鍵移動。"
        );
    });

    it("provides Taiwan messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);

        expect(gridMessages().rowReorder).toBe("資料列重新排序");
        expect(gridMessages().moveRow).toBe("移動資料列");
        expect(gridMessages().reorderRow(3)).toBe("重新排列第 3 列");
        expect(gridMessages().rowReorderDisabled).toBe("資料列重新排序已停用。");
        expect(gridMessages().rowReorderDisabledEditing).toBe("請完成編輯後再重新排列資料列。");
        expect(gridMessages().rowReorderDisabledFiltered).toBe("請清除篩選後再重新排列資料列。");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("請清除群組後再重新排列資料列。");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("至少需要兩列才能重新排序。");
        expect(gridMessages().rowReorderDisabledSorted).toBe("請清除排序後再重新排列資料列。");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "啟用虛擬捲動時無法重新排列資料列。"
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("已將第 3 列移至位置 1。");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "重新排列第 1 列",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "重新排列第 1 列。使用 Alt + 向上鍵或 Alt + 向下鍵移動。 至少需要兩列才能重新排序。"
        );
    });

    it("renders Chip component with Taiwan remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_TW_LOCALE
                })
            ]
        }).compileComponents();

        const fixture = TestBed.createComponent(ChipIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);

        // 1. Labeled removable Chip
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const removeButtons = hostEl.querySelectorAll<HTMLButtonElement>("button[data-chip-remove]");
        expect(removeButtons.length).toBe(2);
        const [labeledButton, projectedButton] = Array.from(removeButtons);

        expect(labeledButton.getAttribute("aria-label")).toBe("移除Angular");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("丟棄標籤");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("丟棄標籤");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("移除Angular");

        // 3. Projected content fallback
        expect(projectedButton.getAttribute("aria-label")).toBe("移除項目");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("移除項目");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_ZH_TW_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("移除Angular");
    });

    it("reactively switches directly between zh-TW and zh-CN (Phase 9 direct cross-locale switching)", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        // 1. Starts at en-US
        expect(service.localeId()).toBe("en-US");
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        expect(gridMessages().columns).toBe("Columns");
        expect(gridMessages().save).toBe("Save");

        // 2. Switch to zh-TW
        service.use(MONA_ZH_TW_LOCALE);
        expect(service.localeId()).toBe("zh-TW");
        expect(gridMessages().columns).toBe("欄");
        expect(gridMessages().save).toBe("儲存");
        expect(gridMessages().cancelRowEdit).toBe("取消編輯資料列");
        expect(gridMessages().noData).toBe("沒有資料");
        expect(pagerMessages().firstPageLabel).toBe("第一頁");

        // 3. Switch directly to zh-CN
        service.use(MONA_ZH_CN_LOCALE);
        expect(service.localeId()).toBe("zh-CN");
        expect(gridMessages().columns).toBe("列");
        expect(gridMessages().save).toBe("保存");
        expect(gridMessages().cancelRowEdit).toBe("取消编辑行");
        expect(gridMessages().noData).toBe("没有数据");
        expect(pagerMessages().firstPageLabel).toBe("第一页");

        // 4. Switch back directly to zh-TW
        service.use(MONA_ZH_TW_LOCALE);
        expect(service.localeId()).toBe("zh-TW");
        expect(gridMessages().columns).toBe("欄");
        expect(gridMessages().save).toBe("儲存");
        expect(gridMessages().cancelRowEdit).toBe("取消編輯資料列");
        expect(gridMessages().noData).toBe("沒有資料");
        expect(pagerMessages().firstPageLabel).toBe("第一頁");
    });
});
