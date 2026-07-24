import { TestBed } from "@angular/core/testing";

import { CardService } from "./card.service";

describe("CardService", () => {
    let service: CardService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [CardService] });
        service = TestBed.inject(CardService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("defaults every slot to empty/null", () => {
        expect(service.actionTemplate()).toEqual([]);
        expect(service.descriptionId()).toBeNull();
        expect(service.descriptionTemplate()).toBeNull();
        expect(service.footerClass()).toBeUndefined();
        expect(service.footerTemplate()).toBeNull();
        expect(service.headerClass()).toBeUndefined();
        expect(service.headerTemplate()).toBeNull();
        expect(service.titleId()).toBeNull();
        expect(service.titleTemplate()).toBeNull();
    });
});
