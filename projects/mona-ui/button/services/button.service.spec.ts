import { signal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ButtonDirective } from "../directives/button.directive";
import { ButtonService } from "./button.service";

describe("ButtonService", () => {
    let service: ButtonService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ButtonService]
        });
        service = TestBed.inject(ButtonService);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    it("should have no members until a group sets them", () => {
        expect(service.members()).toEqual([]);
    });

    it("should follow the members source set by the group", () => {
        const first = {} as ButtonDirective;
        const second = {} as ButtonDirective;
        const source = signal<readonly ButtonDirective[]>([first]);
        service.setMembers(source);
        expect(service.members()).toEqual([first]);

        source.set([first, second]);
        expect(service.members()).toEqual([first, second]);
    });
});
