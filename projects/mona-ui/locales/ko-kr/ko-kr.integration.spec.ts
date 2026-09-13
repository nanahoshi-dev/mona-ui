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
    getLocaleDateInputFormat,
    getLocaleFirstDayOfWeek,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_ZH_CN_LOCALE } from "../zh-cn/zh-cn.locale";
import { MONA_KO_KR_LOCALE } from "./ko-kr.locale";

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
    template: `<mona-calendar [value]="testDate" [firstDay]="firstDay()" />`,
    imports: [CalendarComponent]
})
class CalendarIntegrationHostComponent {
    public readonly firstDay = signal<FirstDayOfWeek | null>(null);
    public readonly testDate = new Date(2026, 8, 15);
}

@Component({
    template: `<mona-split-button [text]="'저장'" />`,
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
            <mona-grid-column field="name" title="이름" [width]="120" />
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
        <mona-chip [removable]="true">투영 내용</mona-chip>
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
        { id: 1, text: "프로젝트 1" },
        { id: 2, text: "프로젝트 2" }
    ];
}

describe("MONA_KO_KR_LOCALE Integration with MonaI18nService", () => {
    it("configures ko-KR locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("ko-KR");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_KO_KR_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");
        expect(pagerMessages().lastPageLabel).toBe("마지막 페이지");
        expect(pagerMessages().nextPageLabel).toBe("다음 페이지");
        expect(pagerMessages().previousPageLabel).toBe("이전 페이지");
        expect(pagerMessages().pageStatus(1, 10)).toBe("전체 10페이지 중 1페이지");
    });

    it("reactively switches between English and Korean via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Korean
        service.use(MONA_KO_KR_LOCALE);
        expect(service.localeId()).toBe("ko-KR");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");

        // Switch back to English default
        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Korean locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: ko-KR locale wins
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");
        expect(pagerMessages().nextPageLabel).toBe("다음 페이지");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "다음 페이지 (사용자 정의)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("다음 페이지 (사용자 정의)");
        // Non-overridden message still uses ko-KR locale
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");

        // Clear overrides: restores ko-KR locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("다음 페이지");
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");
    });

    it("integrates with locale-aware Korean number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("ko-KR");

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
        expect(monthFormatter.format(date)).toBe("9월");
    });

    it("ensures MONA_KO_KR_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_KO_KR_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_KO_KR_LOCALE));

        deepFreeze(MONA_KO_KR_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("ko-KR");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("첫 페이지");
        expect(pager().pageLabel(2)).toBe("2페이지");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_KO_KR_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "임시"
            }
        });
        expect(pager().nextPageLabel).toBe("임시");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("다음 페이지");

        expect(JSON.parse(JSON.stringify(MONA_KO_KR_LOCALE))).toEqual(snapshot);
        expect(MONA_KO_KR_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating ko-KR in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_KO_KR_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("ko-KR");
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

    it("renders real Mona Calendar component with Korean translations, Sunday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("오늘");
        expect(todayButton.getAttribute("aria-label")).toContain("오늘로 이동 (");

        const prevButton = hostEl.querySelector('button[aria-label="이전 달"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="다음 달"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Korean month/year header (2026년 9월) with no duplicated 년 or 월
        const viewButton = hostEl.querySelector('button[aria-label*="연도 보기로 전환"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("2026년 9월");
        expect(viewButton.textContent).not.toContain("년년");
        expect(viewButton.textContent).not.toContain("월월");

        // 3. Calendar container accessible label
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("2026년 9월 달력");

        // 4. Verify Sunday is the first day of the week in ko-KR Calendar view (일)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelectorAll("div")[0]?.textContent?.trim()).toBe("일");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("연도 보기, 2026년");

        const yearViewButton = hostEl.querySelector('button[aria-label*="10년 보기로 전환"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("10년 보기로 전환. 현재 2026년");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("10년 보기, 2020년~2029년");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020년~2029년"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("verifies explicit firstDay override precedence and restoration across locale switches", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const getFirstDayLabel = () => {
            const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
            return headerRow?.querySelectorAll("div")[0]?.textContent?.trim();
        };

        // 1. ko-KR default first day is Sunday (일)
        expect(getFirstDayLabel()).toBe("일");

        // 2. Set explicit firstDay = "thursday" -> Thursday (목)
        fixture.componentInstance.firstDay.set("thursday");
        fixture.detectChanges();
        expect(getFirstDayLabel()).toBe("목");

        // 3. Switch to zh-CN while override active -> still Thursday (周四)
        service.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        expect(getFirstDayLabel()).toBe("周四");

        // 4. Switch back to ko-KR while override active -> still Thursday (목)
        service.use(MONA_KO_KR_LOCALE);
        fixture.detectChanges();
        expect(getFirstDayLabel()).toBe("목");

        // 5. Clear explicit override -> Korean Sunday returns (일)
        fixture.componentInstance.firstDay.set(null);
        fixture.detectChanges();
        expect(getFirstDayLabel()).toBe("일");

        // 6. Switch to zh-CN with no override -> Chinese Monday returns (周一)
        service.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        expect(getFirstDayLabel()).toBe("周一");
    });

    it("renders SplitButton component with Korean accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='저장, 분할 버튼']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Korean transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='다른 목록으로 이동']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='다른 목록에서 가져오기']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='모두 다른 목록으로 이동']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='다른 목록에서 모두 가져오기']")).not.toBeNull();
    });

    it("renders Pager component with Korean status grammar", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("전체 1개 중 1~1");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("전체 50개 중 1~10");
    });

    it("renders ScrollView component with Korean pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='페이지 표시기 이전으로 스크롤']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='페이지 표시기 다음으로 스크롤']")).not.toBeNull();
    });

    it("provides Korean date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("같음");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("같지 않음");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("보다 이후");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("이후 또는 같음");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("보다 이전");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("이전 또는 같음");
    });

    it("renders ColorGradient component with Korean accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("채도 및 명도");
        expect(slider.getAttribute("aria-valuetext")).toContain("채도");
        expect(slider.getAttribute("aria-valuetext")).toContain("명도");
    });

    it("renders TimeSelector component with localized 12-hour day periods (오전/오후) and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Meridiem list accessible label is 오전/오후
        const meridiemList = hostEl.querySelector("ol[aria-label='오전/오후']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        // 2. Visible options are 오전 and 오후
        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "오전");
        const pmItem = listItems.find(li => li.textContent?.trim() === "오후");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();

        // 3. Info text displays day period matching the selector
        expect(hostEl.textContent).toContain("오전");

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("오후");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "설정");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("오전");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });

    it("renders DatePicker component with Korean defaults, yyyy. MM. dd. parsing, Sunday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Korean default numeric date format: yyyy. MM. dd. -> 2026. 09. 15.
        expect(input.value).toBe("2026. 09. 15.");

        // 2. Korean date input parsing: 2026. 12. 25.
        input.value = "2026. 12. 25.";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(11);
        expect(parsedDate?.getDate()).toBe(25);

        // 3. Sunday-first calendar popup in Korean
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelectorAll("div")[0]?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("일");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("thursday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("목");

        // 5. Explicit format override
        fixture.componentInstance.format.set("yyyy-MM-dd");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026-12-25");

        // 6. Runtime locale switching when format is null
        fixture.componentInstance.format.set(null);
        fixture.componentInstance.firstDay.set(null);
        service.use(MONA_DEFAULT_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("12/25/2026");

        service.use(MONA_KO_KR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026. 12. 25.");
    });

    it("renders TimePicker component with Korean 24h default, 12h 오전/오후, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
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

        // 2. 12h mode without seconds: 오후 09:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("오후 09:30");

        // 3. Open popup and verify meridiem list & localized options
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = document.querySelector("ol[aria-label='오전/오후']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        const amItem = Array.from(meridiemList.querySelectorAll("li")).find(li => li.textContent?.trim() === "오전");
        expect(amItem).toBeDefined();

        amItem?.click();
        fixture.detectChanges();

        const setButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            b => b.textContent?.trim() === "설정"
        );
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("오전 09:30");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // 4. 12h mode with seconds
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("오전 09:30:45");

        // 5. Test parsing of 12h with seconds
        input.value = "오전 08:15:00";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getHours()).toBe(8);
        expect(parsedDate?.getMinutes()).toBe(15);
        expect(parsedDate?.getSeconds()).toBe(0);

        // 6. Explicit format override
        fixture.componentInstance.format.set("hh:mm:ss");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("08:15:00");
    });

    it("renders DateTimePicker component with Korean datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 2026. 09. 15. 21:30
        expect(input.value).toBe("2026. 09. 15. 21:30");

        // 2. 12h mode without seconds: 2026. 09. 15. 오후 09:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026. 09. 15. 오후 09:30");

        // 3. 12h mode with seconds: 2026. 09. 15. 오후 09:30:45
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("2026. 09. 15. 오후 09:30:45");

        // 4. Korean datetime input parsing
        input.value = "2026. 12. 25. 오전 08:15:00";
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

        // 5. Open popup and verify Korean labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("날짜/시간 선택기");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("날짜");
        expect(tabButtons[1]?.textContent?.trim()).toBe("시간");

        // In date view, Sunday is first: 일
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelectorAll("div")[0]?.textContent?.trim()).toBe("일");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='오전/오후']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("설정");
        expect(footerButtons[1]?.textContent?.trim()).toBe("취소");

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

    it("renders Grid component with Korean row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='행 순서 변경']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='1행 순서 변경']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "Alt + 위쪽 화살표 또는 Alt + 아래쪽 화살표로 이동합니다."
        );
    });

    it("provides Korean messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);

        expect(gridMessages().rowReorder).toBe("행 순서 변경");
        expect(gridMessages().moveRow).toBe("행 이동");
        expect(gridMessages().reorderRow(3)).toBe("3행 순서 변경");
        expect(gridMessages().rowReorderDisabled).toBe("행 순서 변경을 사용할 수 없습니다.");
        expect(gridMessages().rowReorderDisabledEditing).toBe("편집을 완료한 후 행 순서를 변경하세요.");
        expect(gridMessages().rowReorderDisabledFiltered).toBe("필터를 지운 후 행 순서를 변경하세요.");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("그룹화를 해제한 후 행 순서를 변경하세요.");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("행 순서를 변경하려면 행이 두 개 이상 필요합니다.");
        expect(gridMessages().rowReorderDisabledSorted).toBe("정렬을 해제한 후 행 순서를 변경하세요.");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "가상 스크롤을 사용하는 동안에는 행 순서를 변경할 수 없습니다."
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("3행을 1번째 위치로 이동했습니다.");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "1행 순서 변경",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "1행 순서 변경. Alt + 위쪽 화살표 또는 Alt + 아래쪽 화살표로 이동합니다. 행 순서를 변경하려면 행이 두 개 이상 필요합니다."
        );
    });

    it("renders Chip component with Korean remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
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

        expect(labeledButton.getAttribute("aria-label")).toBe("Angular 삭제");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("항목 폐기");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("항목 폐기");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Angular 삭제");

        // 3. Projected content fallback
        expect(projectedButton.getAttribute("aria-label")).toBe("항목 삭제");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("항목 삭제");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_KO_KR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Angular 삭제");
    });

    it("renders TreeView component with Korean filter accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [TreeViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_KO_KR_LOCALE
                })
            ]
        }).compileComponents();

        const fixture = TestBed.createComponent(TreeViewIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const searchRegion = hostEl.querySelector("div[role='search']");
        expect(searchRegion).not.toBeNull();
        expect(searchRegion?.getAttribute("aria-label")).toBe("트리 뷰 필터");

        // Explicit tree label composition
        fixture.componentInstance.ariaLabel.set("프로젝트");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("필터: 프로젝트");

        // Compound and alphanumeric label composition
        fixture.componentInstance.ariaLabel.set("프로젝트 2026");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("필터: 프로젝트 2026");

        // Reactive runtime switching
        const service = TestBed.inject(MonaI18nService);
        service.use(MONA_DEFAULT_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("Filter 프로젝트 2026");

        fixture.componentInstance.ariaLabel.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("Filter tree");

        service.use(MONA_KO_KR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(searchRegion?.getAttribute("aria-label")).toBe("트리 뷰 필터");
    });

    it("reactively switches directly between ko-KR and zh-CN (Phase 7 direct cross-locale switching)", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        // 1. Starts at en-US
        expect(service.localeId()).toBe("en-US");
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        expect(gridMessages().columns).toBe("Columns");
        expect(gridMessages().save).toBe("Save");

        // 2. Switch to ko-KR
        service.use(MONA_KO_KR_LOCALE);
        expect(service.localeId()).toBe("ko-KR");
        expect(gridMessages().columns).toBe("열");
        expect(gridMessages().save).toBe("저장");
        expect(gridMessages().cancelRowEdit).toBe("행 편집 취소");
        expect(gridMessages().noData).toBe("데이터 없음");
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");
        expect(getLocaleFirstDayOfWeek("ko-KR")).toBe("sunday");
        expect(getLocaleDateInputFormat("ko-KR")).toBe("yyyy. MM. dd.");

        // 3. Switch directly to zh-CN
        service.use(MONA_ZH_CN_LOCALE);
        expect(service.localeId()).toBe("zh-CN");
        expect(gridMessages().columns).toBe("列");
        expect(gridMessages().save).toBe("保存");
        expect(gridMessages().cancelRowEdit).toBe("取消编辑行");
        expect(gridMessages().noData).toBe("没有数据");
        expect(pagerMessages().firstPageLabel).toBe("第一页");
        expect(getLocaleFirstDayOfWeek("zh-CN")).toBe("monday");
        expect(getLocaleDateInputFormat("zh-CN")).toBe("yyyy/MM/dd");

        // 4. Switch back directly to ko-KR
        service.use(MONA_KO_KR_LOCALE);
        expect(service.localeId()).toBe("ko-KR");
        expect(gridMessages().columns).toBe("열");
        expect(gridMessages().save).toBe("저장");
        expect(gridMessages().cancelRowEdit).toBe("행 편집 취소");
        expect(gridMessages().noData).toBe("데이터 없음");
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");
        expect(getLocaleFirstDayOfWeek("ko-KR")).toBe("sunday");
        expect(getLocaleDateInputFormat("ko-KR")).toBe("yyyy. MM. dd.");
    });
});
