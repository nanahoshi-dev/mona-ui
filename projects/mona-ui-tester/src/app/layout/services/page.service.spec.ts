import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { PageService } from "./page.service";

describe("PageService", () => {
    let service: PageService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [PageService]
        });
        service = TestBed.inject(PageService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
