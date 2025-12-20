import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { ButtonDirective } from "../../../buttons/button/directives/button.directive";
import { PagerComponent } from "./pager.component";

describe("PagerComponent", () => {
    let component: PagerComponent;
    let fixture: ComponentFixture<PagerComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [PagerComponent, ButtonDirective],
            providers: [provideAnimations()]
        });
        fixture = TestBed.createComponent(PagerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });























});

function setupPager(fixture: ComponentFixture<PagerComponent>, skip: number = 10) {
    fixture.componentRef.setInput("total", 100);
    fixture.componentRef.setInput("pageSize", 10);
    fixture.componentRef.setInput("skip", skip);
    fixture.detectChanges();
}

function setupBigPager(fixture: ComponentFixture<PagerComponent>, skip: number = 0) {
    fixture.componentRef.setInput("total", 1000);
    fixture.componentRef.setInput("pageSize", 5);
    fixture.componentRef.setInput("skip", skip);
    fixture.detectChanges();
}

function getDropdownList(): HTMLUListElement {
    return document.querySelector("mona-contextmenu-content ul") as HTMLUListElement;
}
