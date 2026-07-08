import { Component, signal } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideAnimations } from "@angular/platform-browser/animations";
import { DisableOptions } from "../../tree/public-api";
import { TreeService } from "../../tree/public-api";
import { TreeViewComponent } from "../components/tree-view/tree-view.component";
import { TreeViewDisableDirective } from "./tree-view-disable.directive";

interface TestItem {
    id: string;
    text: string;
}

@Component({
    imports: [TreeViewComponent, TreeViewDisableDirective],
    template: `
        <mona-tree-view
            [data]="data()"
            children="children"
            textField="text"
            monaTreeViewDisable
            [monaTreeViewDisable]="options()"
            [disabledKeys]="disabledKeys()"></mona-tree-view>
    `
})
class HostComponent {
    public readonly data = signal<TestItem[]>([{ id: "1", text: "Node 1" }]);
    public readonly disabledKeys = signal<TestItem[]>([]);
    public readonly options = signal<Partial<DisableOptions> | "">("");
}

describe("TreeViewDisableDirective", () => {
    let directive: TreeViewDisableDirective<any>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TreeService]
        });
        directive = TestBed.runInInjectionContext(() => new TreeViewDisableDirective());
    });
    it("should create an instance", () => {
        expect(directive).toBeTruthy();
    });
});

describe("TreeViewDisableDirective wiring to TreeService", () => {
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

    it("enables disabling with disableChildren on by default when applied bare", () => {
        expect(treeService.disableOptions()).toEqual({ disableChildren: true, enabled: true });
    });

    it("marks the configured node as disabled", async () => {
        const node = treeService.nodeSet().first(n => n.data.id === "1");
        fixture.componentInstance.disabledKeys.set([node.data]);
        fixture.detectChanges();
        await fixture.whenStable();

        expect(treeService.isDisabled(node)).toBe(true);
    });
});
