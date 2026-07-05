import { TestBed } from "@angular/core/testing";
import { GridRowStylePipe } from "./grid-row-style.pipe";

describe("GridRowStylePipe", () => {
    it("create an instance", () => {
        TestBed.configureTestingModule({});
        const pipe = TestBed.runInInjectionContext(() => new GridRowStylePipe());
        expect(pipe).toBeTruthy();
    });
});
