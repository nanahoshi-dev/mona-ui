import { Component, signal, viewChild } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService, type MonaLocale } from "@nanahoshi/mona-ui/i18n";
import type { CompositeFilterDescriptor, FilterDescriptor } from "@nanahoshi/mona-ui/query";
import { describe, expect, it } from "vitest";
import { FilterService } from "../../services/filter.service";
import { FilterMenuComponent } from "./filter-menu.component";

@Component({
    template: `
        <mona-filter-menu
            [type]="type()"
            [field]="field()"
            (apply)="appliedFilter.set($event)"></mona-filter-menu>
    `,
    imports: [FilterMenuComponent],
    providers: [FilterService]
})
class FilterMenuTestHostComponent {
    public readonly appliedFilter = signal<CompositeFilterDescriptor | null>(null);
    public readonly field = signal("name");
    public readonly menu = viewChild.required(FilterMenuComponent);
    public readonly type = signal<"string" | "number" | "date" | "boolean">("string");
}

const TR_LOCALE: MonaLocale = {
    id: "tr-TR",
    direction: "ltr",
    messages: {
        filter: {
            and: "VE",
            apply: "Uygula",
            clear: "Temizle",
            contains: "İçerir",
            doesNotContain: "İçermez",
            endsWith: "İle biter",
            isAfter: "Sonrasıdır",
            isAfterOrEqualTo: "Eşit veya sonrasıdır",
            isBefore: "Öncesidir",
            isBeforeOrEqualTo: "Eşit veya öncesidir",
            isEmpty: "Boştur",
            isEqualTo: "Eşittir",
            isFalse: "Yanlıştır",
            isGreaterThan: "Büyüktür",
            isGreaterThanOrEqualTo: "Büyük veya eşittir",
            isLessThan: "Küçüktür",
            isLessThanOrEqualTo: "Küçük veya eşittir",
            isNotEmpty: "Boş değildir",
            isNotEqualTo: "Eşit değildir",
            isNotNull: "Null değildir",
            isNotNullOrEmpty: "Null veya boş değildir",
            isNull: "Nulldur",
            isNullOrEmpty: "Null veya boştur",
            isTrue: "Doğrudur",
            or: "VEYA",
            startsWith: "İle başlar"
        }
    }
};

describe("FilterMenuComponent i18n", () => {
    it("updates apply, clear, connectors, and operator labels reactively without altering query descriptor values", async () => {
        TestBed.configureTestingModule({
            providers: [FilterService]
        });
        const fixture: ComponentFixture<FilterMenuTestHostComponent> =
            TestBed.createComponent(FilterMenuTestHostComponent);
        const i18nService = TestBed.inject(MonaI18nService);
        fixture.detectChanges();

        const hostEl = fixture.nativeElement as HTMLElement;

        // 1. Check default English action buttons
        const buttons = () => Array.from(hostEl.querySelectorAll("button")).map(b => b.textContent?.trim());
        expect(buttons()).toContain("Apply");
        expect(buttons()).toContain("Clear");

        // Verify string operator items in English
        const menuInstance = fixture.componentInstance.menu();
        const filterService = TestBed.inject(FilterService);
        const stringItems = filterService.stringFilterMenuItems;
        const containsItem = stringItems.find(i => i.value === "contains");
        expect(containsItem?.text).toBe("Contains");

        // Set value to make first filter valid and show connector buttons
        menuInstance.value.set({
            operator1: "contains",
            value1: "test",
            logic: "and",
            operator2: "endswith",
            value2: "ing"
        });
        fixture.detectChanges();

        expect(buttons()).toContain("AND");
        expect(buttons()).toContain("OR");

        // 2. Switch to Turkish (tr-TR)
        i18nService.use(TR_LOCALE);
        fixture.detectChanges();

        // Action buttons should now be localized
        expect(buttons()).toContain("Uygula");
        expect(buttons()).toContain("Temizle");

        // Connectors should be localized
        expect(buttons()).toContain("VE");
        expect(buttons()).toContain("VEYA");

        // Operator items should have localized text while keeping stable values
        const trStringItems = filterService.stringFilterMenuItems;
        const trContainsItem = trStringItems.find(i => i.value === "contains");
        expect(trContainsItem?.text).toBe("İçerir");

        // Apply filter and verify semantic values remain ASCII tokens
        const applyBtn = Array.from(hostEl.querySelectorAll("button")).find(b => b.textContent?.trim() === "Uygula");
        expect(applyBtn).toBeDefined();
        applyBtn?.click();
        fixture.detectChanges();

        const applied = fixture.componentInstance.appliedFilter();
        expect(applied).not.toBeNull();
        expect(applied?.logic).toBe("and");
        expect(applied?.filters.length).toBe(2);
        expect((applied?.filters[0] as FilterDescriptor).operator).toBe("contains");
        expect((applied?.filters[1] as FilterDescriptor).operator).toBe("endswith");
    });
});
