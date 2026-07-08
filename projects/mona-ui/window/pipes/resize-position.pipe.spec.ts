import { TestBed } from "@angular/core/testing";
import { ResizePositionPipe } from "./resize-position.pipe";

describe("ResizePositionPipe", () => {
    it("create an instance", () => {
        TestBed.configureTestingModule({});
        const pipe = TestBed.runInInjectionContext(() => new ResizePositionPipe());
        expect(pipe).toBeTruthy();
    });
});
