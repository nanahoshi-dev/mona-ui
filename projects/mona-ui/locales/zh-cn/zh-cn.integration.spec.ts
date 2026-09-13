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
import { TreeViewComponent, TreeViewFilterableDirective } from "@nanahoshi/mona-ui/tree-view";
import {
    formatNumber,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_ZH_TW_LOCALE } from "../zh-tw/zh-tw.locale";
import { MONA_ZH_CN_LOCALE } from "./zh-cn.locale";

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
            <mona-grid-column field="name" title="名称" [width]="120" />
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
        <mona-chip [removable]="true">投影内容</mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipIntegrationHostComponent {
    public readonly label = signal("");
    public readonly removeLabel = signal<string | undefined>(undefined);
}

interface TreeItem {
    id: number;
    text: string;
}

@Component({
    template: `
        <mona-tree-view
            [data]="data"
            textField="text"
            [ariaLabel]="ariaLabel()"
            monaTreeViewFilterable
        />
    `,
    imports: [TreeViewComponent, TreeViewFilterableDirective]
})
class TreeViewIntegrationHostComponent {
    public readonly ariaLabel = signal<string>("");
    public readonly data: TreeItem[] = [
        { id: 1, text: "项目 1" },
        { id: 2, text: "项目 2" }
    ];
}

describe("MONA_ZH_CN_LOCALE Integration with MonaI18nService", () => {
    it("configures zh-CN locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("zh-CN");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_ZH_CN_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("第一页");
        expect(pagerMessages().lastPageLabel).toBe("最后一页");
        expect(pagerMessages().nextPageLabel).toBe("下一页");
        expect(pagerMessages().previousPageLabel).toBe("上一页");
        expect(pagerMessages().pageStatus(1, 10)).toBe("第 1 页，共 10 页");
    });

    it("reactively switches between English and Simplified Chinese via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Simplified Chinese
        service.use(MONA_ZH_CN_LOCALE);
        expect(service.localeId()).toBe("zh-CN");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("第一页");

        // Switch back to English default
        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Simplified Chinese locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: zh-CN locale wins
        expect(pagerMessages().firstPageLabel).toBe("第一页");
        expect(pagerMessages().nextPageLabel).toBe("下一页");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "下一页（自定义）"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("下一页（自定义）");
        // Non-overridden message still uses zh-CN locale
        expect(pagerMessages().firstPageLabel).toBe("第一页");

        // Clear overrides: restores zh-CN locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("下一页");
        expect(pagerMessages().firstPageLabel).toBe("第一页");
    });

    it("integrates with locale-aware Chinese number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("zh-CN");

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
        expect(monthFormatter.format(date)).toBe("九月");
    });

    it("ensures MONA_ZH_CN_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_ZH_CN_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_ZH_CN_LOCALE));

        deepFreeze(MONA_ZH_CN_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("zh-CN");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("第一页");
        expect(pager().pageLabel(2)).toBe("第 2 页");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_ZH_CN_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "临时"
            }
        });
        expect(pager().nextPageLabel).toBe("临时");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("下一页");

        expect(JSON.parse(JSON.stringify(MONA_ZH_CN_LOCALE))).toEqual(snapshot);
        expect(MONA_ZH_CN_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating zh-CN in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_ZH_CN_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("zh-CN");
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

    it("renders real Mona Calendar component with Chinese translations, Monday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("今天");
        expect(todayButton.getAttribute("aria-label")).toContain("转到今天（");

        const prevButton = hostEl.querySelector('button[aria-label="上个月"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="下个月"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Chinese month/year header (2026年9月) with no duplicated 年 or 月
        const viewButton = hostEl.querySelector('button[aria-label*="切换到年视图"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("2026年9月");
        expect(viewButton.textContent).not.toContain("年年");
        expect(viewButton.textContent).not.toContain("月月");

        // 3. Calendar container accessible label
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("2026年9月日历");

        // 4. Verify Monday is the first day of the week in zh-CN Calendar view (周一)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelectorAll("div")[0]?.textContent?.trim()).toBe("周一");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("年视图，2026年");

        const yearViewButton = hostEl.querySelector('button[aria-label*="切换到十年视图"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("切换到十年视图，当前为2026年");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("十年视图，2020年至2029年");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020年至2029年"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("renders SplitButton component with Chinese accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='保存，拆分按钮']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Chinese transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='移至另一列表']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='从另一列表移入']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='全部移至另一列表']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='从另一列表全部移入']")).not.toBeNull();
    });

    it("renders Pager component with singular and multi-item status in Chinese", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("第 1 - 1 项，共 1 项");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("第 1 - 10 项，共 50 项");
    });

    it("renders ScrollView component with Chinese pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='向前滚动分页器']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='向后滚动分页器']")).not.toBeNull();
    });

    it("provides Chinese date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("等于");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("不等于");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("晚于");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("晚于或等于");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("早于");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("早于或等于");
    });

    it("renders ColorGradient component with Chinese accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("饱和度与明度");
        expect(slider.getAttribute("aria-valuetext")).toContain("饱和度");
        expect(slider.getAttribute("aria-valuetext")).toContain("明度");
    });

    it("renders TimeSelector component with localized 12-hour day periods (上午/下午) and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
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

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "设置");
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

    it("renders DatePicker component with Chinese defaults, yyyy/MM/dd parsing, Monday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Chinese default numeric date format: yyyy/MM/dd -> 2026/09/15
        expect(input.value).toBe("2026/09/15");

        // 2. Chinese date input parsing: 2026/11/20
        input.value = "2026/11/20";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(10);
        expect(parsedDate?.getDate()).toBe(20);

        // 3. Monday-first calendar popup in Simplified Chinese
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelectorAll("div")[0]?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("周一");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("sunday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("周日");

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

        service.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026/11/20");
    });

    it("renders TimePicker component with Chinese 24h default, 12h 上午/下午, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
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
            b => b.textContent?.trim() === "设置"
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

    it("renders DateTimePicker component with Chinese datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
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

        // 5. Open popup and verify Chinese labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("日期时间选择器");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("日期");
        expect(tabButtons[1]?.textContent?.trim()).toBe("时间");

        // In date view, Monday is first: 周一
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelectorAll("div")[0]?.textContent?.trim()).toBe("周一");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='上午/下午']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("设置");
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

    it("renders Grid component with Chinese row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='行重新排序']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='重新排列第 1 行']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "使用 Alt + 向上键或 Alt + 向下键移动。"
        );
    });

    it("provides Chinese messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);

        expect(gridMessages().rowReorder).toBe("行重新排序");
        expect(gridMessages().moveRow).toBe("移动行");
        expect(gridMessages().reorderRow(3)).toBe("重新排列第 3 行");
        expect(gridMessages().rowReorderDisabled).toBe("行重新排序已禁用。");
        expect(gridMessages().rowReorderDisabledEditing).toBe("请完成编辑后再重新排列行。");
        expect(gridMessages().rowReorderDisabledFiltered).toBe("请清除筛选后再重新排列行。");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("请清除分组后再重新排列行。");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("至少需要两行才能重新排列。");
        expect(gridMessages().rowReorderDisabledSorted).toBe("请清除排序后再重新排列行。");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "启用虚拟滚动时无法重新排列行。"
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("已将第 3 行移动到位置 1。");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "重新排列第 1 行",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "重新排列第 1 行。使用 Alt + 向上键或 Alt + 向下键移动。 至少需要两行才能重新排列。"
        );
    });

    it("renders Chip component with Chinese remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
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

        expect(labeledButton.getAttribute("aria-label")).toBe("删除Angular");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("丢弃标签");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("丢弃标签");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("删除Angular");

        // 3. Projected content fallback
        expect(projectedButton.getAttribute("aria-label")).toBe("删除项目");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("删除项目");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("删除Angular");
    });

    it("renders TreeView component with Chinese filter accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [TreeViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ZH_CN_LOCALE
                })
            ]
        }).compileComponents();

        const fixture = TestBed.createComponent(TreeViewIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const searchRegion = hostEl.querySelector("div[role='search']");
        expect(searchRegion).not.toBeNull();
        expect(searchRegion?.getAttribute("aria-label")).toBe("筛选树");

        // Explicit tree label composition
        fixture.componentInstance.ariaLabel.set("项目");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("筛选 项目");

        // Compound and alphanumeric label composition
        fixture.componentInstance.ariaLabel.set("项目 2026");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("筛选 项目 2026");

        // Reactive runtime switching
        const service = TestBed.inject(MonaI18nService);
        service.use(MONA_DEFAULT_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("Filter 项目 2026");

        fixture.componentInstance.ariaLabel.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("Filter tree");

        service.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("筛选树");
    });

    it("reactively switches directly between zh-CN and zh-TW (Phase 9 direct cross-locale switching)", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        // 1. Starts at en-US
        expect(service.localeId()).toBe("en-US");
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        expect(gridMessages().columns).toBe("Columns");
        expect(gridMessages().save).toBe("Save");

        // 2. Switch to zh-CN
        service.use(MONA_ZH_CN_LOCALE);
        expect(service.localeId()).toBe("zh-CN");
        expect(gridMessages().columns).toBe("列");
        expect(gridMessages().save).toBe("保存");
        expect(gridMessages().cancelRowEdit).toBe("取消编辑行");
        expect(gridMessages().noData).toBe("没有数据");
        expect(pagerMessages().firstPageLabel).toBe("第一页");

        // 3. Switch directly to zh-TW
        service.use(MONA_ZH_TW_LOCALE);
        expect(service.localeId()).toBe("zh-TW");
        expect(gridMessages().columns).toBe("欄");
        expect(gridMessages().save).toBe("儲存");
        expect(gridMessages().cancelRowEdit).toBe("取消編輯資料列");
        expect(gridMessages().noData).toBe("沒有資料");
        expect(pagerMessages().firstPageLabel).toBe("第一頁");

        // 4. Switch back directly to zh-CN
        service.use(MONA_ZH_CN_LOCALE);
        expect(service.localeId()).toBe("zh-CN");
        expect(gridMessages().columns).toBe("列");
        expect(gridMessages().save).toBe("保存");
        expect(gridMessages().cancelRowEdit).toBe("取消编辑行");
        expect(gridMessages().noData).toBe("没有数据");
        expect(pagerMessages().firstPageLabel).toBe("第一页");
    });
});
