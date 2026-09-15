import { TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { MONA_DE_DE_LOCALE } from "@nanahoshi/mona-ui/locales";

import { FilterService } from "./filter.service";

describe("FilterService", () => {
    let service: FilterService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [FilterService]
        });
        service = TestBed.inject(FilterService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("provides default English date filter operator labels", () => {
        const items = service.dateFilterMenuItems;
        expect(items.find(i => i.value === "gte")?.text).toBe("Is after or equal to");
        expect(items.find(i => i.value === "lte")?.text).toBe("Is before or equal to");
        expect(items.find(i => i.value === "gt")?.text).toBe("Is after");
        expect(items.find(i => i.value === "lt")?.text).toBe("Is before");
        expect(items.find(i => i.value === "eq")?.text).toBe("Is equal to");
        expect(items.find(i => i.value === "neq")?.text).toBe("Is not equal to");
    });

    it("provides localized German date filter operator labels", () => {
        const i18n = TestBed.inject(MonaI18nService);
        i18n.use(MONA_DE_DE_LOCALE);

        const items = service.dateFilterMenuItems;
        expect(items.find(i => i.value === "gte")?.text).toBe("Ist am oder nach");
        expect(items.find(i => i.value === "lte")?.text).toBe("Ist am oder vor");
        expect(items.find(i => i.value === "gt")?.text).toBe("Ist nach");
        expect(items.find(i => i.value === "lt")?.text).toBe("Ist vor");
        expect(items.find(i => i.value === "eq")?.text).toBe("Ist gleich");
        expect(items.find(i => i.value === "neq")?.text).toBe("Ist ungleich");
    });
});
