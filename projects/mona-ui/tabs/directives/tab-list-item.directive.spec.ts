import { TestBed } from "@angular/core/testing";
import { TabListItemDirective } from "./tab-list-item.directive";

describe("TabListItemDirective", () => {
    let directive: TabListItemDirective;
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TabListItemDirective]
        });
        directive = TestBed.runInInjectionContext(() => new TabListItemDirective());
    })
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});
