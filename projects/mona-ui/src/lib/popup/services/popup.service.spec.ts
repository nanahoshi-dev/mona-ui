import { TestBed } from "@angular/core/testing";
import { provideAnimations } from "@angular/platform-browser/animations";

import { PopupService } from "./popup.service";

describe("PopupService", () => {
    let service: PopupService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideAnimations()]
        });
        service = TestBed.inject(PopupService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });
});
