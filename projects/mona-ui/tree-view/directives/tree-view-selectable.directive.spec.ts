import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { TreeService } from "../../tree/public-api";
import { TreeSelectableOptions } from "../../tree/public-api";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewSelectableDirective } from "./tree-view-selectable.directive";

interface TestItem {
    id: string;
    text: string;
}

@Component({
    imports: [TreeViewComponent, TreeViewSelectableDirective],
    template: `
        <mona-tree-view
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewSelectable
            [monaTreeViewSelectable]="options()"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<TestItem[]>([{ id: "1", text: "Node 1" }]);
    public readonly options = signal<Partial<TreeSelectableOptions> | "">("");
}

describe("TreeViewSelectableDirective", () => {
    let directive: TreeViewSelectableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService]
        });
        directive = TestBed.runInInjectionContext(() => new TreeViewSelectableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

describe("TreeViewSelectableDirective wiring to TreeService", () => {
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

    it("enables selection with the default single mode when applied bare", () => {
        expect(treeService.selectableOptions()).toEqual({
            childrenOnly: false,
            enabled: true,
            mode: "single",
            toggleable: false
        });
    });

    it("merges custom options over the defaults", async () => {
        fixture.componentInstance.options.set({ mode: "multiple" });
        fixture.detectChanges();
        await fixture.whenStable();

        expect(treeService.selectableOptions()).toEqual({
            childrenOnly: false,
            enabled: true,
            mode: "multiple",
            toggleable: false
        });
    });
});
