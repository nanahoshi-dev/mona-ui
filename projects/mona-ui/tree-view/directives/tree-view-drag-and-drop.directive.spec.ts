import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { DraggableOptions } from "../../tree/public-api";
import { TreeService } from "../../tree/public-api";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewDragAndDropDirective } from "./tree-view-drag-and-drop.directive";

interface TestItem {
    id: string;
    text: string;
}

@Component({
    imports: [TreeViewComponent, TreeViewDragAndDropDirective],
    template: `
        <mona-tree-view
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewDragAndDrop
            [monaTreeViewDragAndDrop]="options()"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<TestItem[]>([{ id: "1", text: "Node 1" }]);
    public readonly options = signal<Partial<DraggableOptions> | "">("");
}

describe("TreeViewDragAndDropDirective", () => {
    let directive: TreeViewDragAndDropDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService, { provide: TreeViewComponent, useValue: {} }]
        });
        directive = TestBed.runInInjectionContext(() => new TreeViewDragAndDropDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

describe("TreeViewDragAndDropDirective wiring to TreeService", () => {
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

    it("enables dragging by default when applied bare", () => {
        expect(treeService.draggableOptions()).toEqual({ enabled: true });
    });

    it("disables dragging when configured to do so", async () => {
        fixture.componentInstance.options.set({ enabled: false });
        fixture.detectChanges();
        await fixture.whenStable();

        expect(treeService.draggableOptions()).toEqual({ enabled: false });
    });
});
