import { Component, signal, viewChild } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { BreadcrumbComponent, BreadcrumbItemComponent } from "@nanahoshi/mona-ui/breadcrumb";
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
import { MONA_ID_ID_LOCALE } from "./id-id.locale";

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
    template: `
        <mona-breadcrumb [aria-label]="ariaLabel()">
            <mona-breadcrumb-item>Beranda</mona-breadcrumb-item>
            <mona-breadcrumb-item>Kategori</mona-breadcrumb-item>
        </mona-breadcrumb>
    `,
    imports: [BreadcrumbComponent, BreadcrumbItemComponent]
})
class BreadcrumbIntegrationHostComponent {
    public readonly ariaLabel = signal("");
}

@Component({
    template: `<mona-split-button [text]="text()" [aria-label]="ariaLabel()" />`,
    imports: [SplitButtonComponent]
})
class SplitButtonIntegrationHostComponent {
    public readonly ariaLabel = signal("");
    public readonly text = signal("Simpan");
}

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
            <mona-grid-column field="name" title="Nama" [width]="120" />
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
        <mona-chip [removable]="true">Konten terproyeksi</mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipIntegrationHostComponent {
    public readonly label = signal("");
    public readonly removeLabel = signal<string | undefined>(undefined);
}

describe("MONA_ID_ID_LOCALE Integration with MonaI18nService", () => {
    it("configures id-ID locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("id-ID");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_ID_ID_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Halaman pertama");
        expect(pagerMessages().lastPageLabel).toBe("Halaman terakhir");
        expect(pagerMessages().nextPageLabel).toBe("Halaman berikutnya");
        expect(pagerMessages().previousPageLabel).toBe("Halaman sebelumnya");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Halaman 1 dari 10");
    });

    it("reactively switches between English and Indonesian via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Indonesian
        service.use(MONA_ID_ID_LOCALE);
        expect(service.localeId()).toBe("id-ID");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Halaman pertama");

        // Switch back to English default
        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Indonesian locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Indonesian locale wins
        expect(pagerMessages().firstPageLabel).toBe("Halaman pertama");
        expect(pagerMessages().nextPageLabel).toBe("Halaman berikutnya");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Halaman berikutnya (Kustom)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Halaman berikutnya (Kustom)");
        // Non-overridden message still uses Indonesian locale
        expect(pagerMessages().firstPageLabel).toBe("Halaman pertama");

        // Clear overrides: restores Indonesian locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Halaman berikutnya");
        expect(pagerMessages().firstPageLabel).toBe("Halaman pertama");
    });

    it("integrates with locale-aware Indonesian number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("id-ID");

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
        expect(monthFormatter.format(date)).toBe("September");
    });

    it("ensures MONA_ID_ID_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_ID_ID_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_ID_ID_LOCALE));

        deepFreeze(MONA_ID_ID_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("id-ID");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("Halaman pertama");
        expect(pager().pageLabel(2)).toBe("Halaman 2");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_ID_ID_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Sementara"
            }
        });
        expect(pager().nextPageLabel).toBe("Sementara");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Halaman berikutnya");

        expect(JSON.parse(JSON.stringify(MONA_ID_ID_LOCALE))).toEqual(snapshot);
        expect(MONA_ID_ID_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Indonesian in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_ID_ID_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("id-ID");
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

    it("renders real Mona Calendar component with Indonesian translations, Sunday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Hari ini");
        expect(todayButton.getAttribute("aria-label")).toContain("Ke hari ini, ");

        const prevButton = hostEl.querySelector('button[aria-label="Bulan sebelumnya"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Bulan berikutnya"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Indonesian month/year header (e.g. September 2026)
        const viewButton = hostEl.querySelector(
            'button[aria-label*="Beralih ke tampilan tahun"]'
        ) as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("September");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in Indonesian
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("Kalender, ");
        expect(liveRegion.textContent).toContain("September");

        // 4. Verify Sunday is the first day of the week in Calendar view (Min)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("Min");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Tampilan tahun, 2026");

        const yearViewButton = hostEl.querySelector('button[aria-label*="Beralih ke tampilan dekade"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("Beralih ke tampilan dekade, saat ini 2026");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Tampilan dekade, 2020 - 2029");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020 - 2029"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("renders Breadcrumb component with Indonesian navigation landmark and supports explicit aria-label override", () => {
        TestBed.configureTestingModule({
            imports: [BreadcrumbIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(BreadcrumbIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const breadcrumb = hostEl.querySelector("mona-breadcrumb");

        expect(breadcrumb).not.toBeNull();
        expect(breadcrumb?.getAttribute("role")).toBe("navigation");
        expect(breadcrumb?.getAttribute("aria-label")).toBe("Navigasi remah roti");

        // Explicit application aria-label override takes precedence
        fixture.componentInstance.ariaLabel.set("Navigasi khusus");
        fixture.detectChanges();
        expect(breadcrumb?.getAttribute("aria-label")).toBe("Navigasi khusus");

        // Clearing override restores localized Indonesian default
        fixture.componentInstance.ariaLabel.set("");
        fixture.detectChanges();
        expect(breadcrumb?.getAttribute("aria-label")).toBe("Navigasi remah roti");
    });

    it("renders SplitButton component with Indonesian accessible name and distinct menu toggle semantics", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Simpan, tombol pisah']");
        expect(mainBtn).not.toBeNull();

        const menuBtn = hostEl.querySelector("button[aria-label='Tampilkan opsi menu']");
        expect(menuBtn).not.toBeNull();

        // Dynamic text update
        fixture.componentInstance.text.set("Bagikan");
        fixture.detectChanges();
        const updatedMainBtn = hostEl.querySelector("button[aria-label='Bagikan, tombol pisah']");
        expect(updatedMainBtn).not.toBeNull();

        // Explicit application aria-label override takes precedence
        fixture.componentInstance.ariaLabel.set("Tindakan pisah khusus");
        fixture.detectChanges();
        const overrideMainBtn = hostEl.querySelector("button[aria-label='Tindakan pisah khusus']");
        expect(overrideMainBtn).not.toBeNull();

        // Clearing override restores localized Indonesian default with updated text
        fixture.componentInstance.ariaLabel.set("");
        fixture.detectChanges();
        expect(hostEl.querySelector("button[aria-label='Bagikan, tombol pisah']")).not.toBeNull();

        // Empty text fallback
        fixture.componentInstance.text.set("");
        fixture.detectChanges();

        const emptyMainBtn = hostEl.querySelector("button[aria-label='Tombol pisah']");
        expect(emptyMainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Indonesian transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label=\"Pindahkan ke daftar lain\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Pindahkan dari daftar lain\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Pindahkan semua ke daftar lain\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Pindahkan semua dari daftar lain\"]")).not.toBeNull();
    });

    it("renders Pager component with singular count-aware status in Indonesian", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1 - 1 dari 1 item");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1 - 10 dari 50 item");
    });

    it("renders ScrollView component with Indonesian role descriptions and pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ScrollViewIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const scrollView = hostEl.querySelector("mona-scroll-view");
        expect(scrollView?.getAttribute("aria-roledescription")).toBe("karusel");

        const slide = hostEl.querySelector("li[role='group']");
        expect(slide?.getAttribute("aria-roledescription")).toBe("slide");

        const comp = fixture.componentInstance.scrollView() as unknown as {
            pagerArrowVisible: { set: (v: boolean) => void };
        };
        comp.pagerArrowVisible.set(true);
        fixture.detectChanges();

        expect(hostEl.querySelector("button[aria-label='Gulir opsi halaman ke belakang']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Gulir opsi halaman ke depan']")).not.toBeNull();
    });

    it("provides Indonesian date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("Sama dengan");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("Tidak sama dengan");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("Setelah");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("Pada atau setelah");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("Sebelum");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("Pada atau sebelum");
        expect(dateItems.find(i => i.value === "isnull")?.text).toBe("Null");
        expect(dateItems.find(i => i.value === "isnotnull")?.text).toBe("Bukan null");
    });

    it("provides Indonesian numeric operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const numItems = filterService.numericFilterMenuItems;

        expect(numItems.find(i => i.value === "eq")?.text).toBe("Sama dengan");
        expect(numItems.find(i => i.value === "neq")?.text).toBe("Tidak sama dengan");
        expect(numItems.find(i => i.value === "gt")?.text).toBe("Lebih besar dari");
        expect(numItems.find(i => i.value === "gte")?.text).toBe("Lebih besar dari atau sama dengan");
        expect(numItems.find(i => i.value === "lt")?.text).toBe("Lebih kecil dari");
        expect(numItems.find(i => i.value === "lte")?.text).toBe("Lebih kecil dari atau sama dengan");
    });

    it("provides Indonesian string operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const strItems = filterService.stringFilterMenuItems;

        expect(strItems.find(i => i.value === "contains")?.text).toBe("Berisi");
        expect(strItems.find(i => i.value === "doesnotcontain")?.text).toBe("Tidak berisi");
        expect(strItems.find(i => i.value === "startswith")?.text).toBe("Diawali dengan");
        expect(strItems.find(i => i.value === "endswith")?.text).toBe("Diakhiri dengan");
        expect(strItems.find(i => i.value === "isempty")?.text).toBe("Kosong");
        expect(strItems.find(i => i.value === "isnotempty")?.text).toBe("Tidak kosong");
    });

    it("renders ColorGradient component with Indonesian accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("Saturasi dan nilai warna");
        expect(slider.getAttribute("aria-valuetext")).toContain("Saturasi ");
        expect(slider.getAttribute("aria-valuetext")).toContain("nilai ");
    });

    it("renders TimeSelector component with localized 12-hour day periods and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimeSelectorIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Meridiem list accessible label is AM/PM
        const meridiemList = hostEl.querySelector("ol[aria-label='AM/PM']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        // 2. Visible options are AM and PM
        const listItems = Array.from(meridiemList.querySelectorAll("li"));
        const amItem = listItems.find(li => li.textContent?.trim() === "AM");
        const pmItem = listItems.find(li => li.textContent?.trim() === "PM");
        expect(amItem).toBeDefined();
        expect(pmItem).toBeDefined();

        // 3. Info text displays day period matching the selector
        expect(hostEl.textContent).toContain("9.30 AM");

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9.30 PM");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "Atur");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9.30 AM");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });

    it("renders DatePicker component with Indonesian defaults, dd/MM/yyyy parsing, Sunday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Indonesian default numeric date format: dd/MM/yyyy -> 15/09/2026
        expect(input.value).toBe("15/09/2026");

        // 2. Indonesian date input parsing: 20/11/2026
        input.value = "20/11/2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(10);
        expect(parsedDate?.getDate()).toBe(20);

        // 3. Sunday-first calendar popup in Indonesian (Min)
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("Min");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("Sen");

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

        service.use(MONA_ID_ID_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("20/11/2026");
    });

    it("renders TimePicker component with Indonesian 24h dot-separated default, 12h suffix AM/PM, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(TimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 21.30
        expect(input.value).toBe("21.30");

        // 2. 12h mode without seconds: 09.30 PM
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09.30 PM");

        // 3. Open popup and verify meridiem list & localized options
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = document.querySelector("ol[aria-label='AM/PM']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();
        const amItem = Array.from(meridiemList.querySelectorAll("li")).find(li => li.textContent?.trim() === "AM");
        expect(amItem).toBeDefined();

        amItem?.click();
        fixture.detectChanges();

        const setButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
            b => b.textContent?.trim() === "Atur"
        );
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("09.30 AM");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // 4. 12h mode with seconds: 09.30.45 PM
        fixture.componentInstance.value.set(new Date(2026, 8, 15, 21, 30, 45));
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09.30.45 PM");

        // 5. Explicit format override
        fixture.componentInstance.format.set("hh:mm:ss");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45");
    });

    it("renders DateTimePicker component with Indonesian datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 15/09/2026, 21.30
        expect(input.value).toBe("15/09/2026, 21.30");

        // 2. 12h mode without seconds: 15/09/2026, 09.30 PM
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15/09/2026, 09.30 PM");

        // 3. 12h mode with seconds: 15/09/2026, 09.30.45 PM
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15/09/2026, 09.30.45 PM");

        // 4. Indonesian datetime input parsing: 25/12/2026, 08.15.00 AM
        input.value = "25/12/2026, 08.15.00 AM";
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

        // 5. Open popup and verify Indonesian labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("Pemilih tanggal dan waktu");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("Tanggal");
        expect(tabButtons[1]?.textContent?.trim()).toBe("Waktu");

        // In date view, Sunday is first: Min
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("Min");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='AM/PM']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("Atur");
        expect(footerButtons[1]?.textContent?.trim()).toBe("Batal");

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

    it("renders Grid component with Indonesian row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='Susun ulang baris']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='Susun ulang baris 1']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris."
        );
    });

    it("provides Indonesian messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);
        expect(gridMessages().moveAsPrevious).toBe("Pindahkan sebelumnya");
        expect(gridMessages().moveAsNext).toBe("Pindahkan setelahnya");
        expect(gridMessages().rowReorder).toBe("Susun ulang baris");
        expect(gridMessages().moveRow).toBe("Pindahkan baris");
        expect(gridMessages().reorderRow(3)).toBe("Susun ulang baris 3");
        expect(gridMessages().rowReorderDisabled).toBe("Penyusunan ulang baris dinonaktifkan.");
        expect(gridMessages().rowReorderDisabledEditing).toBe(
            "Selesaikan pengeditan sebelum menyusun ulang baris."
        );
        expect(gridMessages().rowReorderDisabledFiltered).toBe("Hapus filter sebelum menyusun ulang baris.");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("Hapus pengelompokan sebelum menyusun ulang baris.");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("Diperlukan setidaknya dua baris untuk menyusun ulang.");
        expect(gridMessages().rowReorderDisabledSorted).toBe("Hapus pengurutan sebelum menyusun ulang baris.");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "Baris tidak dapat disusun ulang saat pengguliran virtual aktif."
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("Baris 3 dipindahkan ke posisi 1.");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "Baris 1",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "Baris 1. Gunakan Alt + Panah Atas atau Alt + Panah Bawah untuk memindahkan baris. Diperlukan setidaknya dua baris untuk menyusun ulang."
        );
    });

    it("renders Chip component with Indonesian remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_ID_ID_LOCALE
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

        expect(labeledButton.getAttribute("aria-label")).toBe("Hapus Angular");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("Hapus tag");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Hapus tag");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Hapus Angular");

        // 3. Projected content fallback (unlabelled via public template projection)
        expect(projectedButton.getAttribute("aria-label")).toBe("Hapus item");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Hapus item");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_ID_ID_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Hapus Angular");
    });
});
