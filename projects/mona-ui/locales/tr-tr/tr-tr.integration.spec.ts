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
import { MONA_TR_TR_LOCALE } from "./tr-tr.locale";

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
    template: `<mona-split-button [text]="'Kaydet'" />`,
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
            <mona-grid-column field="name" title="Ad" [width]="120" />
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
        <mona-chip [removable]="true">Yansıtılan içerik</mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipIntegrationHostComponent {
    public readonly label = signal("");
    public readonly removeLabel = signal<string | undefined>(undefined);
}

describe("MONA_TR_TR_LOCALE Integration with MonaI18nService", () => {
    it("configures tr-TR locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("tr-TR");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_TR_TR_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("İlk sayfa");
        expect(pagerMessages().lastPageLabel).toBe("Son sayfa");
        expect(pagerMessages().nextPageLabel).toBe("Sonraki sayfa");
        expect(pagerMessages().previousPageLabel).toBe("Önceki sayfa");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Sayfa 1 / 10");
    });

    it("reactively switches between English and Turkish via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Turkish
        service.use(MONA_TR_TR_LOCALE);
        expect(service.localeId()).toBe("tr-TR");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("İlk sayfa");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Turkish locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Turkish locale wins
        expect(pagerMessages().firstPageLabel).toBe("İlk sayfa");
        expect(pagerMessages().nextPageLabel).toBe("Sonraki sayfa");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Sonraki sayfa (Özel)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Sonraki sayfa (Özel)");
        // Non-overridden message still uses Turkish locale
        expect(pagerMessages().firstPageLabel).toBe("İlk sayfa");

        // Clear overrides: restores Turkish locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Sonraki sayfa");
        expect(pagerMessages().firstPageLabel).toBe("İlk sayfa");
    });

    it("integrates with locale-aware Turkish number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("tr-TR");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe(".");

        const formattedUngrouped = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false
        });
        expect(formattedUngrouped).toBe("1234,50");

        const formattedGrouped = formatNumber(1234567.89, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("1.234.567,89");

        const formattedThousand = formatNumber(1000, localeId);
        expect(formattedThousand).toBe("1.000");

        const formattedTenThousand = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedTenThousand).toBe("12.345,67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date)).toBe("Eylül");

        // Verify Turkish casing invariants in runtime environment
        expect("Iİ".toLocaleLowerCase(localeId)).toBe("ıi");
        expect("ıi".toLocaleUpperCase(localeId)).toBe("Iİ");
    });

    it("ensures MONA_TR_TR_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_TR_TR_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_TR_TR_LOCALE));

        deepFreeze(MONA_TR_TR_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("tr-TR");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("İlk sayfa");
        expect(pager().pageLabel(2)).toBe("2. sayfa");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_TR_TR_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Geçici"
            }
        });
        expect(pager().nextPageLabel).toBe("Geçici");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Sonraki sayfa");

        expect(JSON.parse(JSON.stringify(MONA_TR_TR_LOCALE))).toEqual(snapshot);
        expect(MONA_TR_TR_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Turkish in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_TR_TR_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("tr-TR");
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

    it("renders real Mona Calendar component with Turkish translations, Monday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Bugün");
        expect(todayButton.getAttribute("aria-label")).toContain("Bugüne git, ");

        const prevButton = hostEl.querySelector('button[aria-label="Önceki ay"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Sonraki ay"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Turkish month/year header (e.g. Eylül 2026)
        const viewButton = hostEl.querySelector(
            'button[aria-label*="Yıl görünümüne geç"]'
        ) as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("Eylül");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in Turkish
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("Takvim, ");
        expect(liveRegion.textContent).toContain("Eylül");

        // 4. Verify Monday is the first day of the week in Calendar view (Pzt)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("Pzt");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Yıl görünümü, 2026");

        const yearViewButton = hostEl.querySelector('button[aria-label*="On yıllık görünüme geç"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("On yıllık görünüme geç, şu anda 2026");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("On yıllık görünüm, 2020 - 2029");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020 - 2029"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("renders SplitButton component with Turkish accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Kaydet, menülü düğme']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Turkish transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label=\"Diğer listeye taşı\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Diğer listeden taşı\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Tümünü diğer listeye taşı\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Tümünü diğer listeden taşı\"]")).not.toBeNull();
    });

    it("renders Pager component with singular count-aware status in Turkish", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1 - 1 / 1 öğe");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1 - 10 / 50 öğe");
    });

    it("renders ScrollView component with Turkish role descriptions and pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ScrollViewIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const scrollView = hostEl.querySelector("mona-scroll-view");
        expect(scrollView?.getAttribute("aria-roledescription")).toBe("atlıkarınca");

        const slide = hostEl.querySelector("li[role='group']");
        expect(slide?.getAttribute("aria-roledescription")).toBe("slayt");

        const comp = fixture.componentInstance.scrollView() as unknown as {
            pagerArrowVisible: { set: (v: boolean) => void };
        };
        comp.pagerArrowVisible.set(true);
        fixture.detectChanges();

        expect(hostEl.querySelector("button[aria-label='Sayfalama seçeneklerini geri kaydır']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Sayfalama seçeneklerini ileri kaydır']")).not.toBeNull();
    });

    it("provides Turkish date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("Eşittir");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("Eşit değildir");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("Daha sonra");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("Eşit veya daha sonra");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("Daha önce");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("Eşit veya daha önce");
    });

    it("renders ColorGradient component with Turkish accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("Renk doygunluğu ve değeri");
        expect(slider.getAttribute("aria-valuetext")).toContain("Doygunluk %");
        expect(slider.getAttribute("aria-valuetext")).toContain("değer %");
    });

    it("renders TimeSelector component with localized 12-hour day periods and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Meridiem list accessible label is ÖÖ/ÖS
        const meridiemList = hostEl.querySelector("ol[aria-label='ÖÖ/ÖS']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        // 2. Visible options are ÖÖ and ÖS
        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "ÖÖ");
        const pmItem = listItems.find(li => li.textContent?.trim() === "ÖS");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();

        // 3. Info text displays day period matching the selector
        expect(hostEl.textContent).toContain("ÖÖ 9:30");

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("ÖS 9:30");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "Ayarla");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("ÖÖ 9:30");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });

    it("renders DatePicker component with Turkish defaults, dd.MM.yyyy parsing, Monday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Turkish default numeric date format: dd.MM.yyyy -> 15.09.2026
        expect(input.value).toBe("15.09.2026");

        // 2. Turkish date input parsing: 20.11.2026
        input.value = "20.11.2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(10);
        expect(parsedDate?.getDate()).toBe(20);

        // 3. Monday-first calendar popup in Turkish (Pzt)
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("Pzt");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("sunday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("Paz");

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

        service.use(MONA_TR_TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("20.11.2026");
    });

    it("renders TimePicker component with Turkish 24h default, 12h ÖÖ/ÖS, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
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

        // 2. 12h mode without seconds: ÖS 09:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("ÖS 09:30");

        // 3. Open popup and verify meridiem list & localized options
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = document.querySelector("ol[aria-label='ÖÖ/ÖS']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        const amItem = Array.from(meridiemList.querySelectorAll("li")).find(li => li.textContent?.trim() === "ÖÖ");
        expect(amItem).toBeDefined();

        amItem?.click();
        fixture.detectChanges();

        const setButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            b => b.textContent?.trim() === "Ayarla"
        );
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("ÖÖ 09:30");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // 4. 12h mode with seconds: ÖS 09:30:45
        fixture.componentInstance.value.set(new Date(2026, 8, 15, 21, 30, 45));
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("ÖS 09:30:45");

        // 5. Explicit format override
        fixture.componentInstance.format.set("hh:mm:ss");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45");
    });

    it("renders DateTimePicker component with Turkish datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 15.09.2026 21:30
        expect(input.value).toBe("15.09.2026 21:30");

        // 2. 12h mode without seconds: 15.09.2026 ÖS 09:30
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15.09.2026 ÖS 09:30");

        // 3. 12h mode with seconds: 15.09.2026 ÖS 09:30:45
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15.09.2026 ÖS 09:30:45");

        // 4. Turkish datetime input parsing: 25.12.2026 ÖÖ 08:15:00
        input.value = "25.12.2026 ÖÖ 08:15:00";
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

        // 5. Open popup and verify Turkish labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("Tarih ve saat seçici");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("Tarih");
        expect(tabButtons[1]?.textContent?.trim()).toBe("Saat");

        // In date view, Monday is first: Pzt
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("Pzt");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='ÖÖ/ÖS']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("Ayarla");
        expect(footerButtons[1]?.textContent?.trim()).toBe("İptal");

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

    it("renders Grid component with Turkish row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='Satırları yeniden sırala']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='1. satırı yeniden sırala']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın."
        );
    });

    it("provides Turkish messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);
        expect(gridMessages().moveAsPrevious).toBe("Öncesine taşı");
        expect(gridMessages().moveAsNext).toBe("Sonrasına taşı");
        expect(gridMessages().rowReorder).toBe("Satırları yeniden sırala");
        expect(gridMessages().moveRow).toBe("Satırı taşı");
        expect(gridMessages().reorderRow(3)).toBe("3. satırı yeniden sırala");
        expect(gridMessages().rowReorderDisabled).toBe("Satırları yeniden sıralama devre dışı.");
        expect(gridMessages().rowReorderDisabledEditing).toBe(
            "Satırları yeniden sıralamadan önce düzenlemeyi tamamlayın."
        );
        expect(gridMessages().rowReorderDisabledFiltered).toBe("Satırları yeniden sıralamadan önce filtreleri kaldırın.");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("Satırları yeniden sıralamadan önce gruplamayı kaldırın.");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("Yeniden sıralamak için en az iki satır gerekir.");
        expect(gridMessages().rowReorderDisabledSorted).toBe("Satırları yeniden sıralamadan önce sıralamayı kaldırın.");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "Sanal kaydırma etkinken satırlar yeniden sıralanamaz."
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("3. satır 1. konuma taşındı.");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "1. satır",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "1. satır. Satırı taşımak için Alt + Yukarı Ok veya Alt + Aşağı Ok tuşlarını kullanın. Yeniden sıralamak için en az iki satır gerekir."
        );
    });

    it("renders Chip component with Turkish remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_TR_TR_LOCALE
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

        expect(labeledButton.getAttribute("aria-label")).toBe("Angular öğesini kaldır");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("Etiketi sil");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Etiketi sil");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Angular öğesini kaldır");

        // 3. Projected content fallback (unlabelled via public template projection)
        expect(projectedButton.getAttribute("aria-label")).toBe("Öğeyi kaldır");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Öğeyi kaldır");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_TR_TR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Angular öğesini kaldır");
    });
});
