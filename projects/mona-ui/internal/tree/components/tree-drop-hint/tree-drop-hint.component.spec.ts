import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { vi } from "vitest";
import { TreeService } from "../../services/tree.service";

import { TreeDropHintComponent } from "./tree-drop-hint.component";

describe("TreeDropHintComponent", () => {
    let component: TreeDropHintComponent<unknown>;
    let fixture: ComponentFixture<TreeDropHintComponent<unknown>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TreeDropHintComponent],
            providers: [TreeService]
        }).compileComponents();

        fixture = TestBed.createComponent(TreeDropHintComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("computes left style for LTR and RTL directions", () => {
        const i18n = TestBed.inject(MonaI18nService);
        const treeService = TestBed.inject(TreeService);
        treeService.setDataStructure("hierarchical");
        treeService.setChildrenSelector("children");
        treeService.setTextField("text");
        treeService.setData([{ id: "1", text: "Root" }]);
        const node = treeService.nodeSet().first();

        const parentDiv = document.createElement("div");
        const nodeDiv = document.createElement("div");
        nodeDiv.setAttribute("data-uid", node.uid);
        const childDiv = document.createElement("div");
        vi.spyOn(childDiv, "getBoundingClientRect").mockReturnValue({
            bottom: 30,
            height: 20,
            left: 50,
            right: 150,
            top: 10,
            width: 100,
            x: 50,
            y: 10,
            toJSON: () => {}
        });
        nodeDiv.appendChild(childDiv);
        parentDiv.appendChild(nodeDiv);
        parentDiv.appendChild(fixture.nativeElement);

        treeService.dropPositionChange$.next({
            position: "before",
            targetNode: node
        });
        fixture.detectChanges();
        const internals = component as unknown as { dropHintStyles: () => Partial<CSSStyleDeclaration> };
        expect(internals.dropHintStyles().left).toBe("50px");

        i18n.use({
            direction: "rtl",
            id: "ar",
            messages: {}
        });
        fixture.detectChanges();
        expect(internals.dropHintStyles().left).toBe("110px");
    });
});
