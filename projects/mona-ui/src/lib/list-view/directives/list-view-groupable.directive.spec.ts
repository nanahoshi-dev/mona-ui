import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListService } from "@mirei/mona-ui/list";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewGroupableDirective } from "./list-view-groupable.directive";

@Component({
    imports: [ListViewGroupableDirective, ListViewComponent],
    providers: [ListService],
    template: `
        <mona-list-view
            [items]="data"
            textField="name"
            [monaListViewGroupable]="{ enabled: true, headerOrder: 'desc' }"
            groupBy="category"></mona-list-view>
    `
})
class TestComponent {
    protected readonly data = [
        { name: "one", category: "a" },
        { name: "two", category: "b" }
    ];
}

describe("ListViewGroupableDirective", () => {
    let fixture: ComponentFixture<TestComponent>;
    let component: TestComponent;
    let listService: ListService<unknown>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TestComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        listService = fixture.debugElement.children[0].injector.get(ListService);
        fixture.detectChanges();
    });

    it("should create an instance", () => {
        expect(component).toBeTruthy();
    });

    it("should push the groupable options and groupBy field into the list service", () => {
        expect(listService.groupableOptions()).toEqual(expect.objectContaining({ enabled: true, headerOrder: "desc" }));
        expect(listService.groupBy()).toBe("category");
    });
});
