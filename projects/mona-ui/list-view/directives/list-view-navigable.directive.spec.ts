import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListService } from "@nanahoshi/mona-ui/internal/list";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewNavigableDirective } from "./list-view-navigable.directive";

@Component({
    imports: [ListViewNavigableDirective, ListViewComponent],
    providers: [ListService],
    template: `
        <mona-list-view
            [items]="data"
            textField="name"
            [monaListViewNavigable]="{ mode: 'highlight', wrap: true }"></mona-list-view>
    `
})
class TestComponent {
    protected readonly data = [{ name: "one" }, { name: "two" }];
}

describe("ListViewNavigableDirective", () => {
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

    it("should push the navigable options into the list service", () => {
        expect(listService.navigableOptions()).toEqual({ enabled: true, mode: "highlight", wrap: true });
    });
});
