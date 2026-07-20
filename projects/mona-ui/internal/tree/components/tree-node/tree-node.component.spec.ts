import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TreeNode } from "../../models/TreeNode";
import { TreeService } from "../../services/tree.service";

import { TreeNodeComponent } from "./tree-node.component";

describe("TreeNodeComponent", () => {
    let component: TreeNodeComponent<any>;
    let fixture: ComponentFixture<TreeNodeComponent<any>>;
    let treeService: TreeService<any>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TreeNodeComponent],
            providers: [TreeService]
        }).compileComponents();

        fixture = TestBed.createComponent(TreeNodeComponent);
        component = fixture.componentInstance;
        treeService = fixture.debugElement.injector.get(TreeService);
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("uses neutral selection with a focus indicator for the navigated node", () => {
        const node = new TreeNode({ id: "1" });
        fixture.componentRef.setInput("node", node);
        treeService.setSelectableOptions({ enabled: true, mode: "single", childrenOnly: false });
        treeService.setNodeSelect(node, true);
        fixture.detectChanges();

        const row = fixture.nativeElement.querySelector("div") as HTMLElement;
        expect(row.classList.contains("bg-active")).toBe(true);
        expect(row.classList.contains("text-foreground")).toBe(true);
        expect(row.classList.contains("inset-ring-focus-indicator/35")).toBe(true);
        expect(row.classList.contains("bg-primary")).toBe(false);
    });

    describe("onNodeClick", () => {
        it("sets the navigated node even when selection is disabled", () => {
            const node = new TreeNode({ id: "1" });
            fixture.componentRef.setInput("node", node);
            treeService.setSelectableOptions({ enabled: false, mode: "single", childrenOnly: false });
            fixture.detectChanges();

            component.onNodeClick(new MouseEvent("click"));

            expect(treeService.navigatedNode()).toBe(node);
        });

        it("does not change the navigated node when the node is disabled", () => {
            const node = new TreeNode({ id: "1" });
            fixture.componentRef.setInput("node", node);
            treeService.setDisableOptions({ enabled: true, disableChildren: true });
            treeService.setDisabledKeys([node.data]);
            fixture.detectChanges();

            component.onNodeClick(new MouseEvent("click"));

            expect(treeService.navigatedNode()).toBeNull();
        });
    });
});
