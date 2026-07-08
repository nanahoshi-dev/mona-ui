import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TreeService } from "@mirei/mona-ui/tree";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewExpandableDirective } from "./tree-view-expandable.directive";

interface TestItem {
    id: string;
    text: string;
    children?: TestItem[];
}

@Component({
    imports: [TreeViewComponent, TreeViewExpandableDirective],
    template: `
        <mona-tree-view
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewExpandable
            [expandedKeys]="expandedKeys()"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<TestItem[]>([
        { id: "1", text: "Node 1", children: [{ id: "1.1", text: "Node 1.1" }] }
    ]);
    public readonly expandedKeys = signal<TestItem[]>([]);
}

describe("TreeViewExpandableDirective", () => {
    let directive: TreeViewExpandableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService]
        });
        directive = TestBed.runInInjectionContext(() => new TreeViewExpandableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

describe("TreeViewExpandableDirective wiring to TreeService", () => {
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

    it("enables expanding by default when applied bare", () => {
        expect(treeService.expandableOptions()).toEqual({ enabled: true });
    });

    it("expands the node whose key is present in expandedKeys", async () => {
        const node = treeService.nodeSet().first(n => n.data.id === "1");
        expect(treeService.isExpanded(node)).toBe(false);

        fixture.componentInstance.expandedKeys.set([node.data]);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(treeService.isExpanded(node)).toBe(true);
    });
});
