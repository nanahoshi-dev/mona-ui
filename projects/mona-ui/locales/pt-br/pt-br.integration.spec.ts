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
import { MONA_PT_BR_LOCALE } from "./pt-br.locale";

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
    template: `<mona-split-button [text]="'Salvar'" />`,
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
            <mona-grid-column field="name" title="Nome" [width]="120" />
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
        <mona-chip [removable]="true">Conteúdo projetado</mona-chip>
    `,
    imports: [ChipComponent]
})
class ChipIntegrationHostComponent {
    public readonly label = signal("");
    public readonly removeLabel = signal<string | undefined>(undefined);
}

describe("MONA_PT_BR_LOCALE Integration with MonaI18nService", () => {
    it("configures pt-BR locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("pt-BR");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_PT_BR_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Primeira página");
        expect(pagerMessages().lastPageLabel).toBe("Última página");
        expect(pagerMessages().nextPageLabel).toBe("Próxima página");
        expect(pagerMessages().previousPageLabel).toBe("Página anterior");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Página 1 de 10");
    });

    it("reactively switches between English and Portuguese via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("en-US");
        expect(service.direction()).toBe("ltr");

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("First page");

        // Switch to Portuguese
        service.use(MONA_PT_BR_LOCALE);
        expect(service.localeId()).toBe("pt-BR");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Primeira página");

        // Switch back to English default
        service.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over Portuguese locale", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        // Before override: Portuguese locale wins
        expect(pagerMessages().firstPageLabel).toBe("Primeira página");
        expect(pagerMessages().nextPageLabel).toBe("Próxima página");

        // Apply specific override
        service.patchMessages({
            pager: {
                nextPageLabel: "Próxima página (Personalizada)"
            }
        });

        // Overridden message wins
        expect(pagerMessages().nextPageLabel).toBe("Próxima página (Personalizada)");
        // Non-overridden message still uses Portuguese locale
        expect(pagerMessages().firstPageLabel).toBe("Primeira página");

        // Clear overrides: restores Portuguese locale
        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Próxima página");
        expect(pagerMessages().firstPageLabel).toBe("Primeira página");
    });

    it("integrates with locale-aware Brazilian number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const localeId = service.localeId();
        expect(localeId).toBe("pt-BR");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe(".");

        const formattedUngrouped = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: false
        });
        expect(formattedUngrouped).toBe("1234,50");

        const formatted = formatNumber(1234.5, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formatted).toBe("1.234,50");

        const formattedGrouped = formatNumber(12345.67, localeId, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        expect(formattedGrouped).toBe("12.345,67");

        // Test date formatting using standard Intl with active locale ID
        const date = new Date(2026, 8, 15);
        const monthFormatter = new Intl.DateTimeFormat(localeId, { month: "long" });
        expect(monthFormatter.format(date)).toBe("setembro");
    });

    it("ensures MONA_PT_BR_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_PT_BR_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_PT_BR_LOCALE));

        deepFreeze(MONA_PT_BR_LOCALE);

        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        expect(service.localeId()).toBe("pt-BR");
        expect(service.direction()).toBe("ltr");

        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().firstPageLabel).toBe("Primeira página");
        expect(pager().pageLabel(2)).toBe("Página 2");

        formatNumber(12345.67, service.localeId());

        service.use(MONA_PT_BR_LOCALE);
        service.patchMessages({
            pager: {
                nextPageLabel: "Temporário"
            }
        });
        expect(pager().nextPageLabel).toBe("Temporário");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Próxima página");

        expect(JSON.parse(JSON.stringify(MONA_PT_BR_LOCALE))).toEqual(snapshot);
        expect(MONA_PT_BR_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Portuguese in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [
                    provideMonaI18n({
                        locale: MONA_PT_BR_LOCALE
                    })
                ]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.localeId()).toBe("pt-BR");
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

    it("renders real Mona Calendar component with Portuguese translations, Sunday-first week, and date formatting", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Mona-owned UI button translations
        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Hoje");
        expect(todayButton.getAttribute("aria-label")).toContain("Ir para hoje, ");

        const prevButton = hostEl.querySelector('button[aria-label="Mês anterior"]') as HTMLButtonElement;
        const nextButton = hostEl.querySelector('button[aria-label="Próximo mês"]') as HTMLButtonElement;
        expect(prevButton).not.toBeNull();
        expect(nextButton).not.toBeNull();

        // 2. Locale-formatted Brazilian Portuguese month/year header (e.g. setembro de 2026)
        const viewButton = hostEl.querySelector('button[aria-label*="Alternar para a visualização de ano"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent?.toLowerCase()).toContain("setembro");
        expect(viewButton.textContent).toContain("2026");

        // 3. Calendar container accessible label in Portuguese
        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion).not.toBeNull();
        expect(liveRegion.textContent).toContain("Calendário, ");
        expect(liveRegion.textContent?.toLowerCase()).toContain("setembro");

        // 4. Verify Sunday is the first day of the week in Calendar view (dom.)
        const headerRow = hostEl.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("dom.");

        // 5. Year view navigation and accessibility labels
        viewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Visualização de ano, 2026");

        const yearViewButton = hostEl.querySelector('button[aria-label*="Alternar para a visualização de década"]') as HTMLButtonElement;
        expect(yearViewButton).not.toBeNull();
        expect(yearViewButton.getAttribute("aria-label")).toContain("Alternar para a visualização de década, atualmente 2026");

        // 6. Decade view navigation and accessibility labels
        yearViewButton.click();
        fixture.detectChanges();

        expect(liveRegion.textContent).toContain("Visualização de década, 2020 - 2029");

        const decadeViewButton = hostEl.querySelector('button[aria-label*="2020 a 2029"]') as HTMLButtonElement;
        expect(decadeViewButton).not.toBeNull();
    });

    it("renders SplitButton component with Portuguese accessible name", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        const mainBtn = hostEl.querySelector("button[aria-label='Salvar, botão com menu']");
        expect(mainBtn).not.toBeNull();
    });

    it("renders connected ListBox components with self-contained Portuguese transfer accessible names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='Mover para a outra lista']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Mover da outra lista']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Mover todos para a outra lista']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Mover todos da outra lista']")).not.toBeNull();
    });

    it("renders Pager component with singular and plural count-aware status in Portuguese", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1 - 1 de 1 item");

        fixture.componentInstance.total.set(50);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1 - 10 de 50 itens");
    });

    it("renders ScrollView component with Portuguese pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
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
        expect(hostEl.querySelector("button[aria-label='Rolar opções do paginador para trás']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Rolar opções do paginador para a frente']")).not.toBeNull();
    });

    it("provides Portuguese date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                }),
                FilterService
            ]
        });

        const filterService = TestBed.inject(FilterService);
        const dateItems = filterService.dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("É igual a");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("É diferente de");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("É posterior a");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("É posterior ou igual a");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("É anterior a");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("É anterior ou igual a");
    });

    it("renders ColorGradient component with Portuguese accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = fixture.nativeElement.querySelector("[role='slider']") as HTMLElement;
        expect(slider).not.toBeNull();
        expect(slider.getAttribute("aria-label")).toBe("Saturação e valor da cor");
        expect(slider.getAttribute("aria-valuetext")).toContain("Saturação");
        expect(slider.getAttribute("aria-valuetext")).toContain("valor");
    });

    it("renders TimeSelector component with localized 12-hour day periods and accessible labels", () => {
        TestBed.configureTestingModule({
            imports: [TimeSelectorIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
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

        // 4. Switching meridiem updates display time and internal model
        pmItem?.click();
        fixture.detectChanges();

        expect(hostEl.textContent).toContain("9:30 PM");

        const setButton = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "Definir");
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

    it("renders DatePicker component with Brazilian defaults, dd/MM/yyyy parsing, Sunday-first calendar, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DatePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DatePickerIntegrationHostComponent);
        const service = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. Brazilian default numeric date format: dd/MM/yyyy -> 15/09/2026
        expect(input.value).toBe("15/09/2026");

        // 2. Brazilian date input parsing: 20/11/2026
        input.value = "20/11/2026";
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        fixture.detectChanges();
        await fixture.whenStable();

        const parsedDate = fixture.componentInstance.value();
        expect(parsedDate?.getFullYear()).toBe(2026);
        expect(parsedDate?.getMonth()).toBe(10);
        expect(parsedDate?.getDate()).toBe(20);

        // 3. Sunday-first calendar popup in Brazilian Portuguese
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const getFirstWeekday = () => {
            const headerRow = document.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
            return headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim();
        };
        expect(getFirstWeekday()).toBe("dom.");

        // 4. Explicit firstDay override
        fixture.componentInstance.firstDay.set("monday");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(getFirstWeekday()).toBe("seg.");

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

        service.use(MONA_PT_BR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("20/11/2026");
    });

    it("renders TimePicker component with Brazilian 24h default, 12h AM/PM, seconds, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [TimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
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
            b => b.textContent?.trim() === "Definir"
        );
        setButton?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        expect(input.value).toBe("09:30 AM");
        expect(fixture.componentInstance.value()?.getHours()).toBe(9);

        // 4. 12h mode with seconds
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45 AM");

        // 5. Explicit format override
        fixture.componentInstance.format.set("hh:mm:ss");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("09:30:45");
    });

    it("renders DateTimePicker component with Brazilian datetime defaults, day period, popup consistency, and overrides", async () => {
        TestBed.configureTestingModule({
            imports: [DateTimePickerIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const fixture = TestBed.createComponent(DateTimePickerIntegrationHostComponent);
        fixture.detectChanges();
        await fixture.whenStable();

        const hostEl = fixture.nativeElement as HTMLElement;
        const input = hostEl.querySelector("input") as HTMLInputElement;

        // 1. 24h default without seconds: 15/09/2026, 21:30
        expect(input.value).toBe("15/09/2026, 21:30");

        // 2. 12h mode without seconds: 15/09/2026, 09:30 PM
        fixture.componentInstance.hourFormat.set("12");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15/09/2026, 09:30 PM");

        // 3. 12h mode with seconds: 15/09/2026, 09:30:45 PM
        fixture.componentInstance.showSeconds.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(input.value).toBe("15/09/2026, 09:30:45 PM");

        // 4. Brazilian datetime input parsing: 25/12/2026, 08:15:00 AM
        input.value = "25/12/2026, 08:15:00 AM";
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

        // 5. Open popup and verify Portuguese labels and consistency
        const toggleBtn = hostEl.querySelector("button[monaButton]") as HTMLButtonElement;
        toggleBtn.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const popup = document.querySelector("div[role='dialog']") as HTMLElement;
        expect(popup?.getAttribute("aria-label")).toBe("Seletor de data e hora");

        const tabButtons = Array.from(popup.querySelectorAll<HTMLButtonElement>("button[role='tab']"));
        expect(tabButtons[0]?.textContent?.trim()).toBe("Data");
        expect(tabButtons[1]?.textContent?.trim()).toBe("Hora");

        // In date view, Sunday is first: dom.
        const headerRow = popup.querySelector("div[style*='grid-template-columns']") as HTMLElement;
        expect(headerRow?.querySelector("span[aria-hidden='true']")?.textContent?.trim()).toBe("dom.");

        // Switch to time view
        tabButtons[1]?.click();
        fixture.detectChanges();
        await fixture.whenStable();

        const meridiemList = popup.querySelector("ol[aria-label='AM/PM']") as HTMLOListElement;
        expect(meridiemList).not.toBeNull();

        const footerButtons = popup.querySelectorAll("div.border-t button");
        expect(footerButtons[0]?.textContent?.trim()).toBe("Definir");
        expect(footerButtons[1]?.textContent?.trim()).toBe("Cancelar");

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

    it("renders Grid component with Brazilian Portuguese row-reorder accessibility labels", async () => {
        await TestBed.configureTestingModule({
            imports: [GridIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
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
        const reorderHeader = hostEl.querySelector("th[aria-label='Reordenar linhas']");
        expect(reorderHeader).not.toBeNull();

        const reorderButton = hostEl.querySelector("button[aria-label*='Reordenar linha 1']");
        expect(reorderButton).not.toBeNull();
        expect(reorderButton?.getAttribute("aria-label")).toContain(
            "Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover."
        );
    });

    it("provides Brazilian Portuguese messages for Grid row reordering accessibility and live announcements", () => {
        TestBed.configureTestingModule({
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
                })
            ]
        });

        const service = TestBed.inject(MonaI18nService);
        const gridMessages = service.componentMessages("grid", GRID_DEFAULT_MESSAGES);

        expect(gridMessages().rowReorder).toBe("Reordenar linhas");
        expect(gridMessages().moveRow).toBe("Mover linha");
        expect(gridMessages().reorderRow(3)).toBe("Reordenar linha 3");
        expect(gridMessages().rowReorderDisabled).toBe("A reordenação de linhas está desabilitada.");
        expect(gridMessages().rowReorderDisabledEditing).toBe("Conclua a edição antes de reordenar as linhas.");
        expect(gridMessages().rowReorderDisabledFiltered).toBe("Remova os filtros antes de reordenar as linhas.");
        expect(gridMessages().rowReorderDisabledGrouped).toBe("Remova o agrupamento antes de reordenar as linhas.");
        expect(gridMessages().rowReorderDisabledSingleRow).toBe("São necessárias pelo menos duas linhas para reordenar.");
        expect(gridMessages().rowReorderDisabledSorted).toBe("Remova a ordenação antes de reordenar as linhas.");
        expect(gridMessages().rowReorderDisabledVirtualScroll).toBe(
            "A reordenação de linhas não está disponível com a rolagem virtual ativada."
        );
        expect(gridMessages().rowReorderMoved(3, 1)).toBe("Linha 3 movida para a posição 1.");
        expect(
            gridMessages().rowReorderHandleAriaLabel(
                "Reordenar linha 1",
                gridMessages().rowReorderKeyboardHint,
                gridMessages().rowReorderDisabledSingleRow
            )
        ).toBe(
            "Reordenar linha 1. Use Alt mais Seta para cima ou Alt mais Seta para baixo para mover. São necessárias pelo menos duas linhas para reordenar."
        );
    });

    it("renders Chip component with Brazilian Portuguese remove accessibility label", async () => {
        await TestBed.configureTestingModule({
            imports: [ChipIntegrationHostComponent],
            providers: [
                provideMonaI18n({
                    locale: MONA_PT_BR_LOCALE
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

        expect(labeledButton.getAttribute("aria-label")).toBe("Remover Angular");
        expect(labeledButton.getAttribute("aria-label")).not.toBe("Remover, Angular");

        // 2. Custom removeLabel input override
        fixture.componentInstance.removeLabel.set("Descartar tag");
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Descartar tag");

        // Reset custom override
        fixture.componentInstance.removeLabel.set(undefined);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(labeledButton.getAttribute("aria-label")).toBe("Remover Angular");

        // 3. Projected content fallback (unlabelled via public template projection)
        expect(projectedButton.getAttribute("aria-label")).toBe("Remover item");
        expect(projectedButton.getAttribute("aria-label")).not.toBe("Remover, item");

        // 4. Empty string label fallback
        fixture.componentInstance.label.set("");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remover item");
        expect(labeledButton.getAttribute("aria-label")).not.toBe("Remover, item");

        // 5. Reactive runtime locale switching
        service.use(MONA_DEFAULT_LOCALE);
        fixture.componentInstance.label.set("Angular");
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remove, Angular");

        service.use(MONA_PT_BR_LOCALE);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(labeledButton.getAttribute("aria-label")).toBe("Remover Angular");
    });
});
