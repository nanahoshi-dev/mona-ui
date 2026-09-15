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
import { MONA_RU_RU_LOCALE } from "./ru-ru.locale";

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
            <mona-breadcrumb-item>Главная</mona-breadcrumb-item>
            <mona-breadcrumb-item>Категория</mona-breadcrumb-item>
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
    public readonly text = signal("Сохранить");
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
            <mona-grid-column field="name" title="Имя" [width]="120" />
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
        <mona-chip [removable]="true">Проецируемое содержимое</mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipIntegrationHostComponent {
    public readonly label = signal("");
    public readonly removeLabel = signal<string | undefined>(undefined);
}

describe("MONA_RU_RU_LOCALE Integration with MonaI18nService", () => {
    it("configures ru-RU locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("ru-RU");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_RU_RU_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Первая страница");
        expect(pagerMessages().lastPageLabel).toBe("Последняя страница");
        expect(pagerMessages().nextPageLabel).toBe("Следующая страница");
        expect(pagerMessages().previousPageLabel).toBe("Предыдущая страница");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Страница 1 из 10");
    });

    it("reactively switches between English and Russian via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Russian
        service.use(MONA_RU_RU_LOCALE);
        expect(service.localeId()).toBe("ru-RU");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Первая страница");

        // Switch back to English default
        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Russian locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Russian locale wins
        expect(pagerMessages().firstPageLabel).toBe("Первая страница");
        expect(pagerMessages().nextPageLabel).toBe("Следующая страница");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Следующая страница (пользовательская)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Следующая страница (пользовательская)");
        // Non-overridden message still uses Russian locale
        expect(pagerMessages().firstPageLabel).toBe("Первая страница");

        // Clear overrides: restores Russian locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Следующая страница");
        expect(pagerMessages().firstPageLabel).toBe("Первая страница");
    });

    it("integrates with locale-aware Russian number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("ru-RU");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe("\u00A0");

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
        expect(formattedGrouped).toBe("1\u00A0234\u00A0567,89");

        const formattedThousand = formatNumber(1000, localeId);
        expect(formattedThousand).toBe("1\u00A0000");

        const formattedTenThousand = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedTenThousand).toBe("12\u00A0345,67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date)).toBe("сентябрь");
    });

    it("ensures MONA_RU_RU_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_RU_RU_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_RU_RU_LOCALE));

        deepFreeze(MONA_RU_RU_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("ru-RU");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("Первая страница");
        expect(pager().pageLabel(2)).toBe("Страница 2");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_RU_RU_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Временно"
            }
        });
        expect(pager().nextPageLabel).toBe("Временно");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Следующая страница");

        expect(JSON.parse(JSON.stringify(MONA_RU_RU_LOCALE))).toEqual(snapshot);
        expect(MONA_RU_RU_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Russian in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_RU_RU_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("ru-RU");
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

    it("renders real Mona Calendar component with Russian translations, Monday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Сегодня");
        expect(todayButton.getAttribute("aria-label")).toContain("Перейти к сегодняшней дате, ");

        const prevButton = hostEl.querySelector('button[aria-label="Предыдущий месяц"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Следующий месяц"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Russian month/year header (сентябрь 2026 г.)
        const viewButton = hostEl.querySelector(
            'button[aria-label*="Перейти к просмотру года"]'
        ) as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("сентябрь");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in Russian
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("Календарь, ");
        expect(liveRegion.textContent).toContain("сентябрь");

        // 4. Verify Monday is the first day of the week in Calendar view (пн)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("пн");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Просмотр года, 2026");

        const yearViewButton = hostEl.querySelector('button[aria-label*="Перейти к просмотру десятилетия"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("Перейти к просмотру десятилетия, текущий год: 2026");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Просмотр десятилетия, 2020–2029");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020–2029"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("renders Breadcrumb component with Russian navigation landmark and supports explicit aria-label override", () => {
        TestBed.configureTestingModule({
            imports: [BreadcrumbIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(BreadcrumbIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const breadcrumb = hostEl.querySelector("mona-breadcrumb");

        expect(breadcrumb).not.toBeNull();
        expect(breadcrumb?.getAttribute("role")).toBe("navigation");
        expect(breadcrumb?.getAttribute("aria-label")).toBe("Навигационная цепочка");

        // Explicit application aria-label override takes precedence
        fixture.componentInstance.ariaLabel.set("Специальная навигация");
        fixture.detectChanges();
        expect(breadcrumb?.getAttribute("aria-label")).toBe("Специальная навигация");

        // Clearing override restores localized Russian default
        fixture.componentInstance.ariaLabel.set("");
        fixture.detectChanges();
        expect(breadcrumb?.getAttribute("aria-label")).toBe("Навигационная цепочка");
    });

    it("renders SplitButton component with Russian accessible name and distinct menu toggle semantics", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Сохранить, разделённая кнопка']");
        expect(mainBtn).not.toBeNull();

        const menuBtn = hostEl.querySelector("button[aria-label='Показать параметры меню']");
        expect(menuBtn).not.toBeNull();

        // Dynamic text update
        fixture.componentInstance.text.set("Поделиться");
        fixture.detectChanges();
        const updatedMainBtn = hostEl.querySelector("button[aria-label='Поделиться, разделённая кнопка']");
        expect(updatedMainBtn).not.toBeNull();

        // Explicit application aria-label override takes precedence
        fixture.componentInstance.ariaLabel.set("Пользовательское действие");
        fixture.detectChanges();
        const overrideMainBtn = hostEl.querySelector("button[aria-label='Пользовательское действие']");
        expect(overrideMainBtn).not.toBeNull();

        // Clearing override restores localized Russian default with updated text
        fixture.componentInstance.ariaLabel.set("");
        fixture.detectChanges();
        expect(hostEl.querySelector("button[aria-label='Поделиться, разделённая кнопка']")).not.toBeNull();

        // Empty text fallback
        fixture.componentInstance.text.set("");
        fixture.detectChanges();

        const emptyMainBtn = hostEl.querySelector("button[aria-label='Разделённая кнопка']");
        expect(emptyMainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with Russian transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label=\"Перенести в другой список\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Перенести из другого списка\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Перенести всё в другой список\"]")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label=\"Перенести всё из другого списка\"]")).not.toBeNull();
    });

    it("renders Pager component with status and navigation buttons in Russian", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1–1 из 1");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1–10 из 50");

        expect(hostEl.querySelector("button[aria-label='Первая страница']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Следующая страница']")).not.toBeNull();
    });

    it("renders ScrollView component with Russian role descriptions and pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ScrollViewIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const scrollView = hostEl.querySelector("mona-scroll-view");
        expect(scrollView?.getAttribute("aria-roledescription")).toBe("карусель");

        const slide = hostEl.querySelector("li[role='group']");
        expect(slide?.getAttribute("aria-roledescription")).toBe("слайд");

        const comp = fixture.componentInstance.scrollView() as unknown as {
            pagerArrowVisible: { set: (v: boolean) => void };
        };
        comp.pagerArrowVisible.set(true);
        fixture.detectChanges();

        expect(hostEl.querySelector("button[aria-label='Прокрутить список страниц назад']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Прокрутить список страниц вперёд']")).not.toBeNull();
    });

    it("provides Russian date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("Равно");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("Не равно");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("После");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("Не ранее");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("До");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("Не позднее");
        expect(dateItems.find(i => i.value === "isnull")?.text).toBe("Значение отсутствует");
        expect(dateItems.find(i => i.value === "isnotnull")?.text).toBe("Значение задано");
    });

    it("provides Russian numeric operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const numItems = filterService.numericFilterMenuItems;

        expect(numItems.find(i => i.value === "eq")?.text).toBe("Равно");
        expect(numItems.find(i => i.value === "neq")?.text).toBe("Не равно");
        expect(numItems.find(i => i.value === "gt")?.text).toBe("Больше");
        expect(numItems.find(i => i.value === "gte")?.text).toBe("Больше или равно");
        expect(numItems.find(i => i.value === "lt")?.text).toBe("Меньше");
        expect(numItems.find(i => i.value === "lte")?.text).toBe("Меньше или равно");
    });

    it("provides Russian string operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const strItems = filterService.stringFilterMenuItems;

        expect(strItems.find(i => i.value === "contains")?.text).toBe("Содержит");
        expect(strItems.find(i => i.value === "doesnotcontain")?.text).toBe("Не содержит");
        expect(strItems.find(i => i.value === "startswith")?.text).toBe("Начинается с");
        expect(strItems.find(i => i.value === "endswith")?.text).toBe("Заканчивается на");
        expect(strItems.find(i => i.value === "isempty")?.text).toBe("Пусто");
        expect(strItems.find(i => i.value === "isnotempty")?.text).toBe("Не пусто");
    });

    it("renders ColorGradient component with Russian accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("Насыщенность и значение");
        expect(slider.getAttribute("aria-valuetext")).toContain("Насыщенность ");
        expect(slider.getAttribute("aria-valuetext")).toContain("значение ");
    });

    it("renders TimeSelector component with 12-hour day periods and Russian labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
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
        expect(hostEl.textContent).toContain("9:30 AM");

        // 4. Russian headers and buttons
        expect(hostEl.querySelector("ol[aria-label='Часы']")).not.toBeNull();
        expect(hostEl.querySelector("ol[aria-label='Минуты']")).not.toBeNull();
        expect(hostEl.textContent).toContain("ч");
        expect(hostEl.textContent).toContain("мин");
        expect(hostEl.textContent).toContain("Сейчас");

        // 5. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9:30 PM");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "Установить");
        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(21);

        amItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9:30 AM");

        setButton?.click();
        fixture.detectChanges();
        expect(fixture.componentInstance.testTime()?.getHours()).toBe(9);
    });

    it("renders DatePicker component with Russian defaults, dd.MM.yyyy parsing, Monday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Russian default numeric date format: dd.MM.yyyy -> 15.09.2026
        expect(input.value).toBe("15.09.2026");

        // 2. Russian date input parsing: 20.11.2026
        input.value = "20.11.2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(10);
        expect(parsedDate?.getDate()).toBe(20);

        // 3. Monday-first calendar popup in Russian (пн)
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("пн");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("sunday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("вс");

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

        service.use(MONA_RU_RU_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("20.11.2026");
    });

    it("renders TimePicker component with Russian 24h default, 12h suffix AM/PM, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
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

        // 2. 12h mode without seconds: 09:30 PM
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30 PM");

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
            b => b.textContent?.trim() === "Установить"
        );
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("09:30 AM");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // 4. 12h mode with seconds: 09:30:45 PM
        fixture.componentInstance.value.set(new Date(2026, 8, 15, 21, 30, 45));
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45 PM");

        // 5. Explicit format override
        fixture.componentInstance.format.set("hh:mm:ss");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45");
    });

    it("renders DateTimePicker component with Russian datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 15.09.2026, 21:30
        expect(input.value).toBe("15.09.2026, 21:30");

        // 2. 12h mode without seconds: 15.09.2026, 09:30 PM
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15.09.2026, 09:30 PM");

        // 3. 12h mode with seconds: 15.09.2026, 09:30:45 PM
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15.09.2026, 09:30:45 PM");

        // 4. Russian datetime input parsing: 25.12.2026, 08:15:00 AM
        input.value = "25.12.2026, 08:15:00 AM";
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

        // 5. Open popup and verify Russian labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("Выбор даты и времени");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("Дата");
        expect(tabButtons[1]?.textContent?.trim()).toBe("Время");

        // In date view, Monday is first: пн
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("пн");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='AM/PM']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("Установить");
        expect(footerButtons[1]?.textContent?.trim()).toBe("Отмена");

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

    it("renders Grid component with Russian row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='Изменение порядка строк']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='Изменить порядок строки 1']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку."
        );
    });

    it("provides Russian messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);
        expect(gridMessages().moveAsPrevious).toBe("Переместить перед");
        expect(gridMessages().moveAsNext).toBe("Переместить после");
        expect(gridMessages().rowReorder).toBe("Изменение порядка строк");
        expect(gridMessages().moveRow).toBe("Переместить строку");
        expect(gridMessages().reorderRow(3)).toBe("Изменить порядок строки 3");
        expect(gridMessages().rowReorderDisabled).toBe("Изменение порядка строк недоступно.");
        expect(gridMessages().rowReorderDisabledEditing).toBe(
            "Завершите редактирование перед изменением порядка строк."
        );
        expect(gridMessages().rowReorderDisabledFiltered).toBe("Очистите фильтры перед изменением порядка строк.");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("Отмените группировку перед изменением порядка строк.");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("Для изменения порядка нужны как минимум две строки.");
        expect(gridMessages().rowReorderDisabledSorted).toBe("Сбросьте сортировку перед изменением порядка строк.");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "Нельзя изменять порядок строк при включённой виртуальной прокрутке."
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("Строка 3 перемещена в позицию 1.");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "Строка 1",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "Строка 1. Используйте Alt + Стрелка вверх или Alt + Стрелка вниз, чтобы переместить строку. Для изменения порядка нужны как минимум две строки."
        );
    });

    it("renders Chip component with Russian remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_RU_RU_LOCALE
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

        expect(labeledButton.getAttribute("aria-label")).toBe("Удалить Angular");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("Удалить тег");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Удалить тег");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Удалить Angular");

        // 3. Projected content fallback (unlabelled via public template projection)
        expect(projectedButton.getAttribute("aria-label")).toBe("Удалить элемент");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Удалить элемент");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_RU_RU_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Удалить Angular");
    });
});
