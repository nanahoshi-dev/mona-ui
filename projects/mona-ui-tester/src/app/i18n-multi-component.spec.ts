import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { CalendarComponent } from "@nanahoshi/mona-ui/calendar";
import { generatePseudoLocale, MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import { NumericTextBoxComponent } from "@nanahoshi/mona-ui/numeric-text-box";
import { PagerComponent } from "@nanahoshi/mona-ui/pager";
import { ProgressBarComponent } from "@nanahoshi/mona-ui/progress-bar";
import { ScrollViewComponent } from "@nanahoshi/mona-ui/scroll-view";

@Component({
    selector: "mona-test-multi-i18n",
    template: `
        <div [attr.dir]="direction()">
            <mona-pager [total]="100" [pageSize]="10" />
            <mona-calendar />
            <mona-numeric-text-box [value]="1234.5" [decimals]="2" />
            <mona-progress-bar [value]="50" />
            <mona-scroll-view [data]="items" [width]="300" [height]="200" />
        </div>
    `,
    imports: [
        PagerComponent,
        CalendarComponent,
        NumericTextBoxComponent,
        ProgressBarComponent,
        ScrollViewComponent
    ]
})
class TestMultiComponentHost {
    public readonly direction = signal<"ltr" | "rtl">("ltr");
    public readonly items = ["Item 1", "Item 2"];
}

describe("Multi-Component i18n & RTL Integration Suite", () => {
    let fixture: ComponentFixture<TestMultiComponentHost>;
    let host: TestMultiComponentHost;
    let i18n: MonaI18nService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestMultiComponentHost]
        }).compileComponents();

        fixture = TestBed.createComponent(TestMultiComponentHost);
        host = fixture.componentInstance;
        i18n = TestBed.inject(MonaI18nService);
        fixture.detectChanges();
    });

    it("renders zero-config English defaults across all components", () => {
        const root = fixture.nativeElement as HTMLElement;

        // Pager English ARIA
        const pager = root.querySelector("mona-pager");
        expect(pager).not.toBeNull();
        const firstBtn = pager?.querySelector("button[aria-label='First page']");
        expect(firstBtn).not.toBeNull();

        // NumericTextBox English decimal separator (.)
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;
        expect(input).not.toBeNull();
        expect(input.value).toBe("1234.50");

        // ScrollView English ARIA
        const scrollView = root.querySelector("mona-scroll-view");
        expect(scrollView).not.toBeNull();
        const prevBtn = scrollView?.querySelector("button[aria-label='Previous page']");
        expect(prevBtn).not.toBeNull();

        // ProgressBar
        const progressBar = root.querySelector("mona-progress-bar");
        expect(progressBar).not.toBeNull();
        expect(progressBar?.textContent).toContain("50");
    });

    it("reactively switches through en-US -> tr-TR -> de-DE -> en-US without recreating application", async () => {
        const root = fixture.nativeElement as HTMLElement;
        const input = root.querySelector("mona-numeric-text-box input") as HTMLInputElement;

        // 1. Switch to Turkish (tr-TR)
        const trLocale: MonaLocale = {
            direction: "ltr",
            id: "tr-TR",
            messages: {
                pager: {
                    firstPageLabel: "İlk sayfa",
                    nextPageLabel: "Sonraki sayfa"
                },
                scrollView: {
                    nextPage: "Sonraki sayfa",
                    previousPage: "Önceki sayfa"
                }
            }
        };
        i18n.use(trLocale);
        await fixture.whenStable();
        fixture.detectChanges();

        const trPager = root.querySelector("mona-pager");
        expect(trPager?.querySelector("button[aria-label='İlk sayfa']")).not.toBeNull();
        const trScroll = root.querySelector("mona-scroll-view");
        expect(trScroll?.querySelector("button[aria-label='Önceki sayfa']")).not.toBeNull();
        // In Turkish, decimal separator is comma: "1234,50"
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 2. Switch to German (de-DE)
        const deLocale: MonaLocale = {
            direction: "ltr",
            id: "de-DE",
            messages: {
                pager: {
                    firstPageLabel: "Erste Seite",
                    nextPageLabel: "Nächste Seite"
                },
                scrollView: {
                    nextPage: "Nächste Seite",
                    previousPage: "Vorherige Seite"
                }
            }
        };
        i18n.use(deLocale);
        await fixture.whenStable();
        fixture.detectChanges();

        const dePager = root.querySelector("mona-pager");
        expect(dePager?.querySelector("button[aria-label='Erste Seite']")).not.toBeNull();
        const deScroll = root.querySelector("mona-scroll-view");
        expect(deScroll?.querySelector("button[aria-label='Vorherige Seite']")).not.toBeNull();
        // German also uses comma decimal: "1234,50"
        expect(input.getAttribute("aria-valuetext")).toBe("1234,50");

        // 3. Switch back to English (en-US)
        i18n.use({
            direction: "ltr",
            id: "en-US",
            messages: {}
        });
        await fixture.whenStable();
        fixture.detectChanges();

        const enPager = root.querySelector("mona-pager");
        expect(enPager?.querySelector("button[aria-label='First page']")).not.toBeNull();
        const enScroll = root.querySelector("mona-scroll-view");
        expect(enScroll?.querySelector("button[aria-label='Previous page']")).not.toBeNull();
        expect(input.getAttribute("aria-valuetext")).toBe("1234.50");
    });

    it("applies pseudo-localization (en-XA) across multiple components reactively", () => {
        const root = fixture.nativeElement as HTMLElement;

        const pseudoLocale = generatePseudoLocale(
            {
                pager: {
                    firstPageLabel: "First page",
                    nextPageLabel: "Next page"
                },
                scrollView: {
                    nextPage: "Next page",
                    previousPage: "Previous page"
                }
            },
            {
                id: "en-XA",
                pseudoOptions: { expand: false }
            }
        );

        i18n.use(pseudoLocale);
        fixture.detectChanges();

        // Pager firstPageLabel is pseudo-localized "[!! Ƒįřśţ ρåĝë !!]"
        const pager = root.querySelector("mona-pager");
        const firstBtn = pager?.querySelector("ol > li button");
        expect(firstBtn?.getAttribute("aria-label")).toContain("Ƒ");
        expect(firstBtn?.getAttribute("aria-label")).toContain("[!! ");

        // ScrollView previousPage is pseudo-localized
        const scrollView = root.querySelector("mona-scroll-view");
        const prevArrow = scrollView?.querySelector("button[data-navigate-prev]");
        expect(prevArrow?.getAttribute("aria-label")).toContain("Þ");
        expect(prevArrow?.getAttribute("aria-label")).toContain("[!! ");
    });

    it("verifies RTL DOM subtree behavior is decoupled from Mona locale", () => {
        // Active locale remains en-US (LTR)
        expect(i18n.localeId()).toBe("en-US");
        expect(i18n.direction()).toBe("ltr");

        // Set DOM subtree to dir="rtl"
        host.direction.set("rtl");
        fixture.detectChanges();

        const root = fixture.nativeElement as HTMLElement;
        const container = root.querySelector("div[dir='rtl']") as HTMLElement;
        expect(container).not.toBeNull();
        expect(container.getAttribute("dir")).toBe("rtl");

        // ScrollView chevron icons mirror via rtl:rotate-180 class
        const scrollView = root.querySelector("mona-scroll-view");
        const prevArrowIcon = scrollView?.querySelector("button[data-navigate-prev] svg");
        expect(prevArrowIcon?.getAttribute("class")).toContain("rtl:rotate-180");

        // English messages remain active in RTL DOM
        const pager = root.querySelector("mona-pager");
        expect(pager?.querySelector("button[aria-label='First page']")).not.toBeNull();
    });
});
