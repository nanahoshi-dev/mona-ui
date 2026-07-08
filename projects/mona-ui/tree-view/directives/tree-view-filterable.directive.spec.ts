import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TreeService } from "../../tree/public-api";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewFilterableDirective } from "./tree-view-filterable.directive";

interface TestItem {
    id: string;
    text: string;
}

@Component({
    imports: [TreeViewComponent, TreeViewFilterableDirective],
    template: `
        <mona-tree-view
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewFilterable
            [filter]="filter()"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<TestItem[]>([
        { id: "1", text: "Apple" },
        { id: "2", text: "Banana" }
    ]);
    public readonly filter = signal("");
}

describe("TreeViewFilterableDirective", () => {
    let directive: TreeViewFilterableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService]
        });
        directive = TestBed.runInInjectionContext(() => new TreeViewFilterableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

describe("TreeViewFilterableDirective wiring to TreeService", () => {
    let fixture: ComponentFixture<HostComponent>;
    let treeService: TreeService<TestItem>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostComponent],
            providers: [provideAnimations()]
        }).compileComponents();

        fixture = TestBed.createComponent(HostComponent);
        treeService = fixture.debugElement.query(By.directive(TreeViewComponent)).injector.get(TreeService);
        fixture.detectChanges();
        await fixture.whenStable();
    });

    function flushDebounce(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    it("narrows visible nodes to matches when a filter is applied", async () => {
        fixture.componentInstance.filter.set("ban");
        fixture.detectChanges();
        await flushDebounce();

        const visible = treeService.viewNodeSet();
        expect(visible.count()).toBe(1);
        expect(visible.first().data.text).toBe("Banana");
    });

    it("restores the full node set when the filter is cleared", async () => {
        fixture.componentInstance.filter.set("ban");
        fixture.detectChanges();
        await flushDebounce();

        fixture.componentInstance.filter.set("");
        fixture.detectChanges();
        await flushDebounce();

        expect(treeService.viewNodeSet().count()).toBe(2);
    });
});
