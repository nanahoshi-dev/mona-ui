import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { CustomDirectionalityService } from "./custom-directionality.service";

describe("CustomDirectionalityService", () => {
    let service: CustomDirectionalityService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CustomDirectionalityService]
        });
        service = TestBed.inject(CustomDirectionalityService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
