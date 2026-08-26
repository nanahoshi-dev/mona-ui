import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewPageableDirective } from "./list-view-pageable.directive";

@Component({
    imports: [ListViewPageableDirective, ListViewComponent],
    providers: [ListService],
    template: ` <mona-list-view [items]="data" textField="name" monaListViewPageable></mona-list-view> `
})
class TestComponent {
    protected readonly data: any[] = [
        {
            id: 1,
            name: "name"
        },
        {
            id: 2,
            name: "name"
        }
    ];
}

describe("ListViewPageableDirective", () => {
    let fixture: ComponentFixture<TestComponent>;
    let component: TestComponent;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestComponent],
            providers: [ListService]
        }).compileComponents();
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it("should create an instance", () => {
        expect(component).toBeTruthy();
    });

    it("should default the page size to 10", () => {
        const listService = fixture.debugElement.query(By.directive(ListViewComponent)).injector.get(ListService);
        expect(listService.pageState().take).toBe(10);
        expect(listService.pageableOptions().pageSize).toBe(10);
    });
});

@Component({
    imports: [ListViewPageableDirective, ListViewComponent],
    providers: [ListService],
    template: ` <mona-list-view [items]="data" textField="name" [monaListViewPageable]="{ pageSize: 25 }"></mona-list-view> `
})
class CustomPageSizeTestComponent {
    protected readonly data: any[] = [
        {
            id: 1,
            name: "name"
        },
        {
            id: 2,
            name: "name"
        }
    ];
}

describe("ListViewPageableDirective with custom pageSize", () => {
    let fixture: ComponentFixture<CustomPageSizeTestComponent>;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CustomPageSizeTestComponent],
            providers: [ListService]
        }).compileComponents();
        fixture = TestBed.createComponent(CustomPageSizeTestComponent);
        fixture.detectChanges();
    });

    it("should apply the configured page size to the page state", () => {
        const listService = fixture.debugElement.query(By.directive(ListViewComponent)).injector.get(ListService);
        expect(listService.pageState().take).toBe(25);
        expect(listService.pageableOptions().pageSize).toBe(25);
    });
});

@Component({
    imports: [ListViewPageableDirective, ListViewComponent],
    providers: [ListService],
    template: ` <mona-list-view
        [items]="data"
        textField="name"
        [monaListViewPageable]="{ pageSize: 1 }"
        [(page)]="page"></mona-list-view> `
})
class PageBindingTestComponent {
    protected readonly data: any[] = [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 3, name: "c" }
    ];
    public readonly page = signal(1);
}

describe("ListViewPageableDirective page binding", () => {
    let fixture: ComponentFixture<PageBindingTestComponent>;
    let component: PageBindingTestComponent;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PageBindingTestComponent],
            providers: [ListService]
        }).compileComponents();
        fixture = TestBed.createComponent(PageBindingTestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should navigate to the page set through the two-way binding", () => {
        const listService = fixture.debugElement.query(By.directive(ListViewComponent)).injector.get(ListService);

        component.page.set(2);
        fixture.detectChanges();

        expect(listService.pageState()).toEqual(expect.objectContaining({ page: 2, skip: 1 }));
    });

    it("should reflect pager-driven navigation back into the bound page signal", () => {
        const listService = fixture.debugElement.query(By.directive(ListViewComponent)).injector.get(ListService);

        listService.pageState.update(s => ({ ...s, page: 3, skip: 2 }));
        fixture.detectChanges();

        expect(component.page()).toBe(3);
    });
});
