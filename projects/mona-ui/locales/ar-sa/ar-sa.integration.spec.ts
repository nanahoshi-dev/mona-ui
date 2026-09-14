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
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_KO_KR_LOCALE } from "../ko-kr/ko-kr.locale";
import { MONA_ZH_CN_LOCALE } from "../zh-cn/zh-cn.locale";
import { MONA_AR_SA_LOCALE } from "./ar-sa.locale";
import { AR_SA_MESSAGES } from "./ar-sa.messages";

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
    template: `<mona-split-button [text]="'حفظ'" />`,
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
    public readonly firstItems: Item[] = [{ id: 1, text: "أ" }];
    public readonly secondItems: Item[] = [{ id: 2, text: "ب" }];
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
    public readonly items = ["عنصر 1", "عنصر 2"];
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
            <mona-grid-column field="name" title="الاسم" [width]="120" />
        </mona-grid>
    `,
    imports: [GridComponent, GridColumnComponent, GridRowReorderableDirective]
})
class GridIntegrationHostComponent {
    public readonly rows = [
        { id: 1, name: "عنصر 1" },
        { id: 2, name: "عنصر 2" }
    ];
}

@Component({
    template: `
        <mona-chip [removable]="true" [label]="label()" [removeLabel]="removeLabel()" />
        <mona-chip [removable]="true">محتوى مخصص</mona-chip>
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
        { id: 1, text: "المشروع 1" },
        { id: 2, text: "المشروع 2" }
    ];
}

@Component({
    template: `<mona-color-gradient [value]="value()" />`,
    imports: [ColorGradientComponent]
})
class ColorGradientIntegrationHostComponent {
    public readonly value = signal<string | null | undefined>("#801a1a");
}

describe("MONA_AR_SA_LOCALE Integration with MonaI18nService", () => {
    it("configures ar-SA locale at startup via provideMonaI18n without mutating document.dir", () => {
        const initialDocDir = document.documentElement.dir;
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("ar-SA");
        expect(service.direction()).toBe("rtl");
        expect(service.locale()).toBe(MONA_AR_SA_LOCALE);
        expect(document.documentElement.dir).toBe(initialDocDir);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("الصفحة الأولى");
        expect(pagerMessages().lastPageLabel).toBe("الصفحة الأخيرة");
        expect(pagerMessages().nextPageLabel).toBe("الصفحة التالية");
        expect(pagerMessages().previousPageLabel).toBe("الصفحة السابقة");
        expect(pagerMessages().pageStatus(1, 10)).toBe("الصفحة ١ من ١٠");
    });

    it("reactively switches through en-US -> ar-SA -> ko-KR -> ar-SA -> en-US matrix", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // 1. Switch to ar-SA
        service.use(MONA_AR_SA_LOCALE);
        expect(service.localeId()).toBe("ar-SA");
        expect(service.direction()).toBe("rtl");
        expect(pagerMessages().firstPageLabel).toBe("الصفحة الأولى");

        // 2. Switch to ko-KR
        service.use(MONA_KO_KR_LOCALE);
        expect(service.localeId()).toBe("ko-KR");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("첫 페이지");

        // 3. Switch back to ar-SA
        service.use(MONA_AR_SA_LOCALE);
        expect(service.localeId()).toBe("ar-SA");
        expect(service.direction()).toBe("rtl");
        expect(pagerMessages().firstPageLabel).toBe("الصفحة الأولى");

        // 4. Switch back to en-US default
        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Arabic locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: ar-SA locale wins
        expect(pagerMessages().firstPageLabel).toBe("الصفحة الأولى");
        expect(pagerMessages().nextPageLabel).toBe("الصفحة التالية");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "التالي (مخصص)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("التالي (مخصص)");
        // Non-overridden message still uses ar-SA locale
        expect(pagerMessages().firstPageLabel).toBe("الصفحة الأولى");

        // Clear overrides: restores ar-SA locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("الصفحة التالية");
        expect(pagerMessages().firstPageLabel).toBe("الصفحة الأولى");
    });

    it("ensures MONA_AR_SA_LOCALE and AR_SA_MESSAGES are immutable", () => {
        const frozenLocale = Object.freeze({ ...MONA_AR_SA_LOCALE });
        const frozenMessages = Object.freeze({ ...AR_SA_MESSAGES });

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: frozenLocale
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("ar-SA");

        // Runtime patch and clear does not mutate base objects
        service.patchMessages({ pager: { firstPageLabel: "تجربة" } });
        expect(frozenMessages.pager.firstPageLabel).toBe("الصفحة الأولى");
        service.clearMessages();
        expect(frozenMessages.pager.firstPageLabel).toBe("الصفحة الأولى");
    });

    it("integrates with locale-aware Arabic number formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const symbols = getNumberSymbols("ar-SA");
        expect(symbols.decimal).toBe("٫");
        expect(symbols.group).toBe("٬");

        const formatted = formatNumber(1234.5, "ar-SA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formatted).toBe("١٬٢٣٤٫٥٠");
    });

    it("integrates with DatePicker for input format, parsing, and popup calendar", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("input") as HTMLInputElement;

        // Auto-derived ar-SA date format is dd/MM/yyyy without bidi controls
        expect(getLocaleDateInputFormat("ar-SA")).toBe("dd/MM/yyyy");
        expect(input.value).toBe("١٥/٠٩/٢٠٢٦");

        // Button open calendar label
        const toggleBtn = root.querySelector("button") as HTMLButtonElement;
        expect(toggleBtn.getAttribute("aria-label")).toBe("فتح التقويم");

        // Open calendar popup
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
        const firstWeekday = headerRow?.querySelectorAll(":scope > div")[0];
        expect(firstWeekday?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("ح");
        expect(firstWeekday?.querySelector("span[aria-hidden='true']")?.getAttribute("aria-hidden")).toBe("true");
        expect(firstWeekday?.querySelector("span.sr-only")?.textContent?.trim()).toBe("الأحد");
        expect(firstWeekday?.getAttribute("aria-label")).toBeNull();

        // Close popup by toggling
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        // Parse Arabic-Indic date input: ٢٥/١٢/٢٠٢٦
        input.value = "٢٥/١٢/٢٠٢٦";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        let parsed = fixture.componentInstance.value();
        expect(parsed?.getFullYear()).toBe(2026);
        expect(parsed?.getMonth()).toBe(11);
        expect(parsed?.getDate()).toBe(25);

        // Parse ASCII date input: 25/12/2026
        input.value = "25/12/2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        parsed = fixture.componentInstance.value();
        expect(parsed?.getFullYear()).toBe(2026);
        expect(parsed?.getMonth()).toBe(11);
        expect(parsed?.getDate()).toBe(25);

        // Parse date input with native-Intl-style bidi controls
        input.value = "٢٥\u200F/١٢\u200F/٢٠٢٦";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        parsed = fixture.componentInstance.value();
        expect(parsed?.getFullYear()).toBe(2026);
        expect(parsed?.getMonth()).toBe(11);
        expect(parsed?.getDate()).toBe(25);

        // Format override precedence
        fixture.componentInstance.format.set("yyyy-MM-dd");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("٢٠٢٦-١٢-٢٥");

        // Clear format override: restores locale-derived format
        fixture.componentInstance.format.set(null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("٢٥/١٢/٢٠٢٦");
    });

    it("integrates with TimePicker for 24h, 12h, and seconds formats with parsing and popup interaction", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("input") as HTMLInputElement;

        // 24h without seconds: HH:mm
        expect(input.value).toBe("٢١:٣٠");

        // 24h with seconds: HH:mm:ss
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("٢١:٣٠:٤٥");

        // 12h with seconds: hh:mm:ss a
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("٠٩:٣٠:٤٥ م");

        // 12h without seconds: hh:mm a
        fixture.componentInstance.showSeconds.set(false);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("٠٩:٣٠ م");

        // Open time picker button label & popup
        const toggleBtn = root.querySelector("button") as HTMLButtonElement;
        expect(toggleBtn.getAttribute("aria-label")).toBe("فتح منتقي الوقت");

        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = document.querySelector("ol[aria-label='ص/م']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        const amItem = Array.from(meridiemList.querySelectorAll("li")).find(li => li.textContent?.trim() === "ص");
        expect(amItem).toBeDefined();

        amItem?.click();
        fixture.detectChanges();

        const setButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            b => b.textContent?.trim() === "تعيين"
        );
        expect(setButton).toBeDefined();
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("٠٩:٣٠ ص");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // Test parsing 12h with seconds in Arabic-Indic digits
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();

        input.value = "٠٨:١٥:٠٠ ص";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        let parsedTime = fixture.componentInstance.value();
        expect(parsedTime?.getHours()).toBe(8);
        expect(parsedTime?.getMinutes()).toBe(15);
        expect(parsedTime?.getSeconds()).toBe(0);

        // Test parsing 12h with seconds in ASCII digits
        input.value = "08:15:00 ص";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        parsedTime = fixture.componentInstance.value();
        expect(parsedTime?.getHours()).toBe(8);
        expect(parsedTime?.getMinutes()).toBe(15);
        expect(parsedTime?.getSeconds()).toBe(0);
    });

    it("integrates with DateTimePicker for 24h, 12h, popup tabs, and parsing", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("input") as HTMLInputElement;

        // 24h datetime includes Arabic comma
        expect(input.value).toBe("١٥/٠٩/٢٠٢٦، ٢١:٣٠");
        expect(input.value).toContain("،");
        expect(input.value).not.toContain(",");

        // 12h datetime includes Arabic comma and day period
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("١٥/٠٩/٢٠٢٦، ٠٩:٣٠ م");

        // 12h with seconds
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("١٥/٠٩/٢٠٢٦، ٠٩:٣٠:٤٥ م");

        // Open datetime picker popup
        const toggleBtn = root.querySelector("button") as HTMLButtonElement;
        expect(toggleBtn.getAttribute("aria-label")).toBe("فتح منتقي التاريخ والوقت");

        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("منتقي التاريخ والوقت");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("التاريخ");
        expect(tabButtons[1]?.textContent?.trim()).toBe("الوقت");

        // In date view, Sunday is first: ح
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("ح");

        // Switch to time view tab
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='ص/م']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("تعيين");
        expect(footerButtons[1]?.textContent?.trim()).toBe("إلغاء");

        // Close popup
        (footerButtons[1] as HTMLButtonElement).click();
        fixture.detectChanges();
        await fixture.whenStable();

        // Test datetime parsing in Arabic-Indic digits
        input.value = "٢٥/١٢/٢٠٢٦، ٠٨:١٥:٠٠ ص";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        let parsedDateTime = fixture.componentInstance.value();
        expect(parsedDateTime?.getFullYear()).toBe(2026);
        expect(parsedDateTime?.getMonth()).toBe(11);
        expect(parsedDateTime?.getDate()).toBe(25);
        expect(parsedDateTime?.getHours()).toBe(8);
        expect(parsedDateTime?.getMinutes()).toBe(15);
        expect(parsedDateTime?.getSeconds()).toBe(0);

        // Test datetime parsing in ASCII digits
        input.value = "25/12/2026، 08:15:00 ص";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        parsedDateTime = fixture.componentInstance.value();
        expect(parsedDateTime?.getFullYear()).toBe(2026);
        expect(parsedDateTime?.getMonth()).toBe(11);
        expect(parsedDateTime?.getDate()).toBe(25);
        expect(parsedDateTime?.getHours()).toBe(8);
        expect(parsedDateTime?.getMinutes()).toBe(15);
        expect(parsedDateTime?.getSeconds()).toBe(0);
    });

    it("integrates with TimeSelector for AM/PM toggling with Arabic labels", async () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const meridiemList = hostEl.querySelector("ol[aria-label='ص/م']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        expect(hostEl.querySelector("ol[aria-label='AM/PM']")).toBeNull();

        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "ص");
        const pmItem = listItems.find(li => li.textContent?.trim() === "م");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();
        expect(listItems.some(li => li.textContent?.trim() === "AM")).toBe(false);
        expect(listItems.some(li => li.textContent?.trim() === "PM")).toBe(false);

        // AM -> PM -> AM toggling with model updates
        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "تعيين");
        expect(setButton).toBeDefined();

        pmItem?.click();
        fixture.detectChanges();
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });

    it("integrates with Calendar for Sunday-first headers, month/year, and views", async () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;

        // Header buttons
        const todayBtn = root.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayBtn.textContent?.trim()).toBe("اليوم");
        expect(todayBtn.getAttribute("aria-label")).toContain("الانتقال إلى اليوم (");

        const prevBtn = root.querySelector("button[aria-label='الشهر السابق']") as HTMLButtonElement;
        const nextBtn = root.querySelector("button[aria-label='الشهر التالي']") as HTMLButtonElement;
        expect(prevBtn).not.toBeNull();
        expect(nextBtn).not.toBeNull();

        // Month heading: سبتمبر ٢٠٢٦
        const viewButton = root.querySelector("button[aria-label*='التبديل إلى عرض السنة']") as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("سبتمبر ٢٠٢٦");

        // Live region
        const liveRegion = root.querySelector("[aria-live='polite']") as HTMLElement;
        expect(liveRegion.textContent).toContain("تقويم سبتمبر ٢٠٢٦");

        const focusedDay = root.querySelector("[monaMonthDay][tabindex='0']") as HTMLElement;
        expect(focusedDay?.textContent?.trim()).toBe("١٥");

        // Sunday-first weekday headers: ح ن ث ر خ ج س
        const headerRow = root.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
        const headerDivs = Array.from(headerRow.querySelectorAll(":scope > div"));
        const visibleHeaders = headerDivs.map(el => el.querySelector("span[aria-hidden='true']"));
        const accessibleLabels = headerDivs.map(el => el.querySelector("span.sr-only"));

        expect(visibleHeaders.map(el => el?.textContent?.trim())).toEqual(["ح", "ن", "ث", "ر", "خ", "ج", "س"]);
        visibleHeaders.forEach(el => expect(el?.getAttribute("aria-hidden")).toBe("true"));
        expect(accessibleLabels.map(el => el?.textContent?.trim())).toEqual(["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]);
        headerDivs.forEach(el => expect(el.getAttribute("aria-label")).toBeNull());

        // 1. Click to switch to Year View
        viewButton.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(liveRegion.textContent).toContain("عرض السنة، ٢٠٢٦");
        expect(root.querySelector("button[aria-label='السنة السابقة']")).not.toBeNull();
        expect(root.querySelector("button[aria-label='السنة التالية']")).not.toBeNull();

        const yearViewButton = root.querySelector("button[aria-label*='التبديل إلى عرض العقد']") as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("التبديل إلى عرض العقد. السنة الحالية ٢٠٢٦");

        // 2. Click to switch to Decade View
        yearViewButton.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(liveRegion.textContent).toContain("عرض العقد، من ٢٠٢٠ إلى ٢٠٢٩");
        expect(root.querySelector("button[aria-label='العقد السابق']")).not.toBeNull();
        expect(root.querySelector("button[aria-label='العقد التالي']")).not.toBeNull();
        expect(root.querySelector("button span[id$='-heading']")?.textContent?.trim()).toBe("٢٠٢٠ - ٢٠٢٩");

        const decadeCells = Array.from(root.querySelectorAll("[monaDecadeYear] span")).map(el => el.textContent?.trim());
        expect(decadeCells).toContain("٢٠٢٠");
        expect(decadeCells).toContain("٢٠٢٩");
    });

    it("respects explicit firstDay override precedence in Calendar", async () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstHeader = () => {
            const row = fixture.nativeElement.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return row.querySelector("span[aria-hidden='true']")?.textContent?.trim();
        };

        // 1. ar-SA default -> Sunday (ح)
        expect(getFirstHeader()).toBe("ح");

        // 2. Explicit Thursday override -> Thursday (خ)
        fixture.componentInstance.firstDay.set("thursday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstHeader()).toBe("خ");

        // 3. Switch to zh-CN while override active -> Thursday (周四)
        i18n.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstHeader()).toBe("周四");

        // 4. Switch back to ar-SA while override active -> Thursday (خ)
        i18n.use(MONA_AR_SA_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstHeader()).toBe("خ");

        // 5. Clear override -> restores Arabic Sunday (ح)
        fixture.componentInstance.firstDay.set(null);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstHeader()).toBe("ح");

        // 6. Switch to zh-CN without override -> Chinese Monday (周一)
        i18n.use(MONA_ZH_CN_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstHeader()).toBe("周一");
    });

    it("integrates with SplitButton with Arabic label and aria-label", async () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const buttons = root.querySelectorAll("button");
        expect(buttons.length).toBe(2);

        const mainBtn = buttons[0];
        expect(mainBtn.textContent?.trim()).toBe("حفظ");
        expect(mainBtn.getAttribute("aria-label")).toBe("حفظ، زر تقسيم");

        const menuBtn = buttons[1];
        expect(menuBtn.getAttribute("aria-label")).toBe("عرض خيارات القائمة");
    });

    it("integrates with ListBox for transfer toolbar accessible names", async () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const transferToBtn = root.querySelector("button[aria-label='نقل إلى القائمة الأخرى']");
        const transferFromBtn = root.querySelector("button[aria-label='نقل من القائمة الأخرى']");
        const transferAllToBtn = root.querySelector("button[aria-label='نقل الكل إلى القائمة الأخرى']");
        const transferAllFromBtn = root.querySelector("button[aria-label='نقل الكل من القائمة الأخرى']");

        expect(transferToBtn).not.toBeNull();
        expect(transferFromBtn).not.toBeNull();
        expect(transferAllToBtn).not.toBeNull();
        expect(transferAllFromBtn).not.toBeNull();
    });

    it("integrates with Pager for Arabic labels and page status", async () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.componentInstance.total.set(100);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const firstBtn = root.querySelector("button[aria-label='الصفحة الأولى']");
        const prevBtn = root.querySelector("button[aria-label='الصفحة السابقة']");
        const nextBtn = root.querySelector("button[aria-label='الصفحة التالية']");
        const lastBtn = root.querySelector("button[aria-label='الصفحة الأخيرة']");

        expect(firstBtn).not.toBeNull();
        expect(prevBtn).not.toBeNull();
        expect(nextBtn).not.toBeNull();
        expect(lastBtn).not.toBeNull();

        const pageButtons = Array.from(root.querySelectorAll("ol > li > button")).map(b => b.textContent?.trim());
        expect(pageButtons).toContain("١");
        expect(pageButtons).toContain("١٠");

        i18n.use(MONA_DEFAULT_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        const enPageButtons = Array.from(root.querySelectorAll("ol > li > button")).map(b => b.textContent?.trim());
        expect(enPageButtons).toContain("1");
        expect(enPageButtons).toContain("10");
    });

    it("integrates with ScrollView for Arabic navigation and pager controls", async () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ScrollViewIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const prevBtn = root.querySelector("button[aria-label='الصفحة السابقة']");
        const nextBtn = root.querySelector("button[aria-label='الصفحة التالية']");

        expect(prevBtn).not.toBeNull();
        expect(nextBtn).not.toBeNull();
    });

    it("renders Grid component with Arabic row reordering accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='إعادة ترتيب الصفوف']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='إعادة ترتيب الصف ١']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك."
        );
    });

    it("provides Arabic messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);

        expect(gridMessages().rowReorder).toBe("إعادة ترتيب الصفوف");
        expect(gridMessages().moveRow).toBe("نقل الصف");
        expect(gridMessages().reorderRow(3)).toBe("إعادة ترتيب الصف ٣");
        expect(gridMessages().rowReorderDisabled).toBe("إعادة ترتيب الصفوف غير متاح.");
        expect(gridMessages().rowReorderDisabledEditing).toBe("أكمل التحرير قبل إعادة ترتيب الصفوف.");
        expect(gridMessages().rowReorderDisabledFiltered).toBe("امسح التصفية قبل إعادة ترتيب الصفوف.");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("ألغِ التجميع قبل إعادة ترتيب الصفوف.");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("يلزم صفّان على الأقل لإعادة ترتيب الصفوف.");
        expect(gridMessages().rowReorderDisabledSorted).toBe("ألغِ الفرز قبل إعادة ترتيب الصفوف.");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "لا يمكن إعادة ترتيب الصفوف أثناء استخدام التمرير الافتراضي."
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("تم نقل الصف ٣ إلى الموضع ١.");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "إعادة ترتيب الصف ١",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "إعادة ترتيب الصف ١. استخدم Alt + سهم لأعلى أو Alt + سهم لأسفل للتحريك. يلزم صفّان على الأقل لإعادة ترتيب الصفوف."
        );
    });

    it("integrates with Chip for arbitrary labels, fallbacks, and remove buttons", async () => {
        TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ChipIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const chips = root.querySelectorAll("mona-chip");

        // 1. Projected content fallback
        const projectedRemove = chips[1].querySelector("button");
        expect(projectedRemove?.getAttribute("aria-label")).toBe("حذف العنصر");

        // 2. Explicit Arabic label
        fixture.componentInstance.label.set("المشروع");
        fixture.detectChanges();
        await fixture.whenStable();
        const arabicRemove = chips[0].querySelector("button");
        expect(arabicRemove?.getAttribute("aria-label")).toBe("حذف المشروع");

        // 3. Explicit Latin label
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(chips[0].querySelector("button")?.getAttribute("aria-label")).toBe("حذف Angular");

        // 4. Custom removeLabel override
        fixture.componentInstance.removeLabel.set("إزالة مخصصة");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(chips[0].querySelector("button")?.getAttribute("aria-label")).toBe("إزالة مخصصة");
    });

    it("integrates with TreeView for filterable search aria-labels", async () => {
        TestBed.configureTestingModule({
            imports: [TreeViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TreeViewIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const root = fixture.nativeElement as HTMLElement;
        const searchRegion = root.querySelector("div[role='search']");
        expect(searchRegion).not.toBeNull();

        // Default tree filter label without ariaLabel
        expect(searchRegion?.getAttribute("aria-label")).toBe("تصفية طريقة عرض الشجرة");

        // With custom tree ariaLabel: تصفية: المشاريع
        fixture.componentInstance.ariaLabel.set("المشاريع");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(searchRegion?.getAttribute("aria-label")).toBe("تصفية: المشاريع");
    });

    it("integrates with FilterService for Arabic operator names including null-or-empty logic", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);

        const stringOperators = filterService.stringFilterMenuItems;
        expect(stringOperators.find(o => o.value === "contains")?.text).toBe("يحتوي على");
        expect(stringOperators.find(o => o.value === "doesnotcontain")?.text).toBe("لا يحتوي على");
        expect(stringOperators.find(o => o.value === "startswith")?.text).toBe("يبدأ بـ");
        expect(stringOperators.find(o => o.value === "endswith")?.text).toBe("ينتهي بـ");
        expect(stringOperators.find(o => o.value === "isnullorempty")?.text).toBe("القيمة خالية أو فارغة");
        expect(stringOperators.find(o => o.value === "isnotnullorempty")?.text).toBe("القيمة غير خالية وغير فارغة");

        const numberOperators = filterService.numericFilterMenuItems;
        expect(numberOperators.find(o => o.value === "gt")?.text).toBe("أكبر من");
        expect(numberOperators.find(o => o.value === "lt")?.text).toBe("أقل من");

        const dateOperators = filterService.dateFilterMenuItems;
        expect(dateOperators.find(o => o.value === "gt")?.text).toBe("بعد");
        expect(dateOperators.find(o => o.value === "lt")?.text).toBe("قبل");

        const booleanOperators = filterService.booleanFilterMenuItems;
        expect(booleanOperators.find(o => o.value === "istrue")?.text).toBe("صحيح");
        expect(booleanOperators.find(o => o.value === "isfalse")?.text).toBe("خطأ");
    });

    it("integrates with ColorGradient for Arabic accessible labels and percentages", async () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientIntegrationHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const root = fixture.nativeElement as HTMLElement;
        const slider = root.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("التشبع والقيمة");
        expect(slider.getAttribute("aria-valuetext")).toBe("التشبع ٨٠٪، القيمة ٥٠٪");

        // Switch to en-US and verify reactive binding updates
        i18n.use(MONA_DEFAULT_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(slider.getAttribute("aria-label")).toBe("Color saturation and value");
        expect(slider.getAttribute("aria-valuetext")).toBe("Saturation 80%, Value 50%");

        // Switch back to ar-SA
        i18n.use(MONA_AR_SA_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(slider.getAttribute("aria-label")).toBe("التشبع والقيمة");
        expect(slider.getAttribute("aria-valuetext")).toBe("التشبع ٨٠٪، القيمة ٥٠٪");
    });

    it("demonstrates complete decoupling between locale metadata and DOM layout direction", async () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_AR_SA_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        const i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const calendarEl = fixture.nativeElement.querySelector("mona-calendar") as HTMLElement;

        // 1. ar-SA locale + DOM dir="rtl"
        calendarEl.setAttribute("dir", "rtl");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(i18n.localeId()).toBe("ar-SA");
        expect(i18n.direction()).toBe("rtl");
        expect(calendarEl.getAttribute("dir")).toBe("rtl");

        // 2. ar-SA locale + DOM dir="ltr"
        calendarEl.setAttribute("dir", "ltr");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(i18n.localeId()).toBe("ar-SA");
        expect(i18n.direction()).toBe("rtl");
        expect(calendarEl.getAttribute("dir")).toBe("ltr");
        // Messages are still in Arabic
        const todayBtn = calendarEl.querySelector("button:first-child");
        expect(todayBtn?.textContent?.trim()).toBe("اليوم");

        // 3. en-US locale + DOM dir="rtl"
        i18n.use(MONA_DEFAULT_LOCALE);
        calendarEl.setAttribute("dir", "rtl");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(i18n.localeId()).toBe("en-US");
        expect(i18n.direction()).toBe("ltr");
        expect(calendarEl.getAttribute("dir")).toBe("rtl");
        // Messages are in English while host layout is RTL
        expect(todayBtn?.textContent?.trim()).toBe("Today");
    });
});
