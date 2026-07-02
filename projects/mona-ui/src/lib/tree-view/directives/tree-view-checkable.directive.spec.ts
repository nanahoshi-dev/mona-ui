import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { CheckableOptions } from "../../common/tree/models/CheckableOptions";
import { TreeService } from "../../common/tree/services/tree.service";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewCheckableDirective } from "./tree-view-checkable.directive";

interface TestItem {
    id: string;
    text: string;
}

@Component({
    imports: [TreeViewComponent, TreeViewCheckableDirective],
    template: `
        <mona-tree-view
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewCheckable
            [monaTreeViewCheckable]="options()"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<TestItem[]>([{ id: "1", text: "Node 1" }]);
    public readonly options = signal<Partial<CheckableOptions> | "">("");
}

describe("TreeViewCheckableDirective", () => {
    let directive: TreeViewCheckableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService]
        });
        directive = TestBed.runInInjectionContext(() => new TreeViewCheckableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

describe("TreeViewCheckableDirective wiring to TreeService", () => {
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

    it("enables checkboxes with the multiple/checkChildren/checkParents defaults when applied bare", () => {
        expect(treeService.checkableOptions()).toEqual({
            checkChildren: true,
            checkDisabledChildren: false,
            childrenOnly: false,
            checkParents: true,
            enabled: true,
            mode: "multiple"
        });
    });

    it("merges custom options over the defaults", async () => {
        fixture.componentInstance.options.set({ checkChildren: false });
        fixture.detectChanges();
        await fixture.whenStable();

        expect(treeService.checkableOptions()).toEqual({
            checkChildren: false,
            checkDisabledChildren: false,
            childrenOnly: false,
            checkParents: true,
            enabled: true,
            mode: "multiple"
        });
    });
});
