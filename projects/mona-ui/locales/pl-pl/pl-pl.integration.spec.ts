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
import {
    formatNumber,
    getNumberSymbols,
    MONA_DEFAULT_LOCALE,
    MonaI18nService,
    provideMonaI18n
} from "@nanahoshi/mona-ui/i18n";
import { MONA_PL_PL_LOCALE } from "./pl-pl.locale";

@Component({
    template: `<mona-calendar [value]="testDate" />`,
    imports: [CalendarComponent]
})
class CalendarIntegrationHostComponent {
    public readonly testDate = new Date(2026, 8, 15);
}

@Component({
    template: `<mona-split-button [text]="'Zapisz'" />`,
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
    public readonly items = ["Element 1", "Element 2"];
    public readonly scrollView = viewChild.required(ScrollViewComponent);
}

describe("MONA_PL_PL_LOCALE Integration with MonaI18nService", () => {
    it("configures pl-PL locale at startup via provideMonaI18n", () => {
        TestBed.configureTestingModule({
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const service = TestBed.inject(MonaI18nService);

        expect(service.localeId()).toBe("pl-PL");
        expect(service.direction()).toBe("ltr");
        expect(service.locale()).toBe(MONA_PL_PL_LOCALE);

        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pagerMessages().firstPageLabel).toBe("Pierwsza strona");
        expect(pagerMessages().lastPageLabel).toBe("Ostatnia strona");
        expect(pagerMessages().nextPageLabel).toBe("Następna strona");
        expect(pagerMessages().previousPageLabel).toBe("Poprzednia strona");
        expect(pagerMessages().pageStatus(1, 10)).toBe("Strona 1 z 10");
    });

    it("reactively switches between English and Polish via use()", () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");

        service.use(MONA_PL_PL_LOCALE);
        expect(service.localeId()).toBe("pl-PL");
        expect(service.direction()).toBe("ltr");
        expect(pagerMessages().firstPageLabel).toBe("Pierwsza strona");

        service.use(MONA_DEFAULT_LOCALE);
        expect(service.localeId()).toBe("en-US");
        expect(pagerMessages().firstPageLabel).toBe("First page");
    });

    it("respects application override precedence over the Polish locale", () => {
        TestBed.configureTestingModule({
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const service = TestBed.inject(MonaI18nService);
        const pagerMessages = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);

        expect(pagerMessages().nextPageLabel).toBe("Następna strona");

        service.patchMessages({ pager: { nextPageLabel: "Dalej" } });
        expect(pagerMessages().nextPageLabel).toBe("Dalej");
        expect(pagerMessages().firstPageLabel).toBe("Pierwsza strona");

        service.clearMessages();
        expect(pagerMessages().nextPageLabel).toBe("Następna strona");
    });

    it("integrates with Polish number and date formatting", () => {
        TestBed.configureTestingModule({
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const localeId = TestBed.inject(MonaI18nService).localeId();
        expect(localeId).toBe("pl-PL");

        const symbols = getNumberSymbols(localeId);
        expect(symbols.decimal).toBe(",");
        expect(symbols.group).toBe(" ");

        const twoDecimals = { maximumFractionDigits: 2, minimumFractionDigits: 2 };
        // Polish groups only from five digits
        expect(formatNumber(1234.5, localeId, twoDecimals)).toBe("1234,50");
        expect(formatNumber(12345.67, localeId, twoDecimals)).toBe("12 345,67");

        const month = new Intl.DateTimeFormat(localeId, { month: "long" }).format(new Date(2026, 8, 15));
        expect(month).toBe("wrzesień");
    });

    it("ensures MONA_PL_PL_LOCALE is immutable and unmutated across service usage cycles", () => {
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

        const pageLabelRef = MONA_PL_PL_LOCALE.messages.pager.pageLabel;
        const snapshot = JSON.parse(JSON.stringify(MONA_PL_PL_LOCALE));

        deepFreeze(MONA_PL_PL_LOCALE);

        TestBed.configureTestingModule({
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const service = TestBed.inject(MonaI18nService);
        const pager = service.componentMessages("pager", PAGER_DEFAULT_MESSAGES);
        expect(pager().pageLabel(2)).toBe("Strona 2");

        service.patchMessages({ pager: { nextPageLabel: "Tymczasowa" } });
        expect(pager().nextPageLabel).toBe("Tymczasowa");
        service.clearMessages();
        expect(pager().nextPageLabel).toBe("Następna strona");

        expect(JSON.parse(JSON.stringify(MONA_PL_PL_LOCALE))).toEqual(snapshot);
        expect(MONA_PL_PL_LOCALE.messages.pager.pageLabel).toBe(pageLabelRef);
    });

    it("preserves semantic direction decoupling when activating Polish in an RTL document", () => {
        const originalDir = document.documentElement.getAttribute("dir");
        try {
            document.documentElement.setAttribute("dir", "rtl");
            TestBed.configureTestingModule({
                providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
            });

            const service = TestBed.inject(MonaI18nService);
            expect(service.direction()).toBe("ltr");
            expect(document.documentElement.getAttribute("dir")).toBe("rtl");

            service.use(MONA_DEFAULT_LOCALE);
            expect(document.documentElement.getAttribute("dir")).toBe("rtl");
        } finally {
            if (originalDir !== null) {
                document.documentElement.setAttribute("dir", originalDir);
            } else {
                document.documentElement.removeAttribute("dir");
            }
        }
    });

    it("renders the Calendar in Polish with a Monday-first row of narrow weekday headers", () => {
        TestBed.configureTestingModule({
            imports: [CalendarIntegrationHostComponent],
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const fixture = TestBed.createComponent(CalendarIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        const todayButton = hostEl.querySelector("button:first-child") as HTMLButtonElement;
        expect(todayButton.textContent?.trim()).toBe("Dzisiaj");
        expect(todayButton.getAttribute("aria-label")).toContain("Przejdź do dzisiejszej daty");

        expect(hostEl.querySelector('button[aria-label="Poprzedni miesiąc"]')).not.toBeNull();
        expect(hostEl.querySelector('button[aria-label="Następny miesiąc"]')).not.toBeNull();

        const viewButton = hostEl.querySelector('button[aria-label*="widok roku"]') as HTMLButtonElement;
        expect(viewButton).not.toBeNull();
        expect(viewButton.textContent).toContain("wrzesień");
        expect(viewButton.textContent).toContain("2026");

        const liveRegion = hostEl.querySelector('[aria-live="polite"]') as HTMLElement;
        expect(liveRegion.textContent?.toLowerCase()).toContain("kalendarz, wrzesień");

        const headerRow = hostEl.querySelectorAll("div[style*='grid-template-columns']")[0] as HTMLElement;
        const visible = Array.from(headerRow.querySelectorAll("span[aria-hidden='true']")).map(el =>
            el.textContent?.trim()
        );
        const spoken = Array.from(headerRow.querySelectorAll("span.sr-only")).map(el => el.textContent?.trim());
        expect(visible).toEqual(["P", "W", "Ś", "C", "P", "S", "N"]);
        expect(spoken).toEqual(["poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota", "niedziela"]);
    });

    it("renders SplitButton with a Polish name for the menu toggle", () => {
        TestBed.configureTestingModule({
            imports: [SplitButtonIntegrationHostComponent],
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const fixture = TestBed.createComponent(SplitButtonIntegrationHostComponent);
        fixture.detectChanges();

        const [mainBtn, menuBtn] = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("button"));
        expect(mainBtn.textContent?.trim()).toBe("Zapisz");
        expect(mainBtn.hasAttribute("aria-label")).toBe(false);
        expect(menuBtn.getAttribute("aria-label")).toBe("Więcej opcji: Zapisz");
    });

    it("renders connected ListBox components with Polish transfer names", () => {
        TestBed.configureTestingModule({
            imports: [ListBoxIntegrationHostComponent],
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const fixture = TestBed.createComponent(ListBoxIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='Przenieś do drugiej listy']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Przenieś z drugiej listy']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Przenieś wszystkie do drugiej listy']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Przenieś wszystkie z drugiej listy']")).not.toBeNull();
    });

    it("renders the Pager range with the total in the genitive", () => {
        TestBed.configureTestingModule({
            imports: [PagerIntegrationHostComponent],
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const fixture = TestBed.createComponent(PagerIntegrationHostComponent);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.textContent).toContain("1–1 z 1 elementu");

        fixture.componentInstance.total.set(22);
        fixture.detectChanges();
        expect(hostEl.textContent).toContain("1–10 z 22 elementów");
    });

    it("renders ScrollView with Polish pager overflow buttons", () => {
        TestBed.configureTestingModule({
            imports: [ScrollViewIntegrationHostComponent],
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const fixture = TestBed.createComponent(ScrollViewIntegrationHostComponent);
        fixture.detectChanges();

        const comp = fixture.componentInstance.scrollView() as unknown as {
            pagerArrowVisible: { set: (v: boolean) => void };
        };
        comp.pagerArrowVisible.set(true);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;
        expect(hostEl.querySelector("button[aria-label='Przewiń listę stron do tyłu']")).not.toBeNull();
        expect(hostEl.querySelector("button[aria-label='Przewiń listę stron do przodu']")).not.toBeNull();
    });

    it("provides Polish date operator labels in FilterService", () => {
        TestBed.configureTestingModule({
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE }), FilterService]
        });

        const dateItems = TestBed.inject(FilterService).dateFilterMenuItems;

        expect(dateItems.find(i => i.value === "eq")?.text).toBe("Jest równe");
        expect(dateItems.find(i => i.value === "neq")?.text).toBe("Nie jest równe");
        expect(dateItems.find(i => i.value === "gt")?.text).toBe("Po");
        expect(dateItems.find(i => i.value === "gte")?.text).toBe("Nie wcześniej niż");
        expect(dateItems.find(i => i.value === "lt")?.text).toBe("Przed");
        expect(dateItems.find(i => i.value === "lte")?.text).toBe("Nie później niż");
    });

    it("renders ColorGradient with Polish accessibility labels and value text", () => {
        TestBed.configureTestingModule({
            imports: [ColorGradientComponent],
            providers: [provideMonaI18n({ locale: MONA_PL_PL_LOCALE })]
        });

        const fixture = TestBed.createComponent(ColorGradientComponent);
        fixture.detectChanges();

        const slider = (fixture.nativeElement as HTMLElement).querySelector("[role='slider']") as HTMLElement;
        expect(slider.getAttribute("aria-label")).toBe("Nasycenie i jasność koloru");
        expect(slider.getAttribute("aria-valuetext")).toContain("Nasycenie");
        expect(slider.getAttribute("aria-valuetext")).toContain("jasność");
    });
});
