import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListService } from "../../list/public-api";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewVirtualScrollDirective } from "./list-view-virtual-scroll.directive";

@Component({
    imports: [ListViewVirtualScrollDirective, ListViewComponent],
    providers: [ListService],
    template: `
        <mona-list-view
            [items]="data"
            textField="name"
            [monaListViewVirtualScroll]="{ enabled: true, height: 40 }"></mona-list-view>
    `
})
class TestComponent {
    protected readonly data = [{ name: "one" }, { name: "two" }];
}

describe("ListViewVirtualScrollDirective", () => {
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

    it("should push the virtual scroll options into the list service", () => {
        expect(listService.virtualScrollOptions()).toEqual({ enabled: true, height: 40 });
    });
});
