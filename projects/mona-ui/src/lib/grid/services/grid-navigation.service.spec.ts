import { TestBed } from "@angular/core/testing";

import { GridNavigationService } from "./grid-navigation.service";

describe("GridNavigationService", () => {
    let service: GridNavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GridNavigationService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
