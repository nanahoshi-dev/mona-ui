import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ListService } from "@mirei/mona-ui/internal/list";
import { ListViewComponent } from "../components/list-view/list-view.component";
import { ListViewSelectableDirective } from "./list-view-selectable.directive";

@Component({
    imports: [ListViewSelectableDirective, ListViewComponent],
    providers: [ListService],
    template: `
        <mona-list-view
            [items]="data"
            textField="name"
            [monaListViewSelectable]="{ mode: 'single', checkboxes: true }"
            selectBy="value"
            [selectedKeys]="selectedKeys"
            (selectedKeysChange)="onSelectedKeysChange($event)"></mona-list-view>
    `
})
class TestComponent {
    protected readonly data = [
        { name: "one", value: 1 },
        { name: "two", value: 2 }
    ];
    protected readonly selectedKeys = [2];
    protected lastEmittedKeys: number[] | null = null;

    protected onSelectedKeysChange(keys: number[]): void {
        this.lastEmittedKeys = keys;
    }
}

describe("ListViewSelectableDirective", () => {
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

    it("should push the selectable options and selectBy field into the list service", () => {
        expect(listService.selectableOptions()).toEqual(
            expect.objectContaining({ mode: "single", checkboxes: true, enabled: true, toggleable: false })
        );
        expect(listService.valueField()).toBe("value");
    });

    it("should push the initial selectedKeys into the list service", () => {
        expect(listService.selectedKeys().toArray()).toEqual([2]);
    });

    it("should emit selectedKeysChange when the list service reports a selection change", () => {
        listService.selectedKeysChange$.next([1]);
        expect((component as any).lastEmittedKeys).toEqual([1]);
    });
});
