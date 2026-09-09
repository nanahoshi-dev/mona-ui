import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MonaI18nService } from "@nanahoshi/mona-ui/i18n";
import { TreeService } from "../../services/tree.service";

import { SubTreeComponent } from "./sub-tree.component";

describe("SubTreeComponent", () => {
    let component: SubTreeComponent<unknown>;
    let fixture: ComponentFixture<SubTreeComponent<unknown>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SubTreeComponent],
            providers: [TreeService]
        }).compileComponents();

        fixture = TestBed.createComponent(SubTreeComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput("depth", 0);
        fixture.componentRef.setInput("nodes", []);
        fixture.componentRef.setInput("parent", null);

        fixture.detectChanges();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("renders expander button with localized aria-label and flips on locale change", () => {
        const i18n = TestBed.inject(MonaI18nService);
        const treeService = TestBed.inject(TreeService);
        treeService.setDataStructure("hierarchical");
        treeService.setChildrenSelector("children");
        treeService.setTextField("text");
        treeService.setData([
            { id: "1", text: "Root", children: [{ id: "1.1", text: "Child" }] }
        ]);
        treeService.setExpandableOptions({ enabled: true });
        fixture.componentRef.setInput("nodes", treeService.nodeSet());
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector("button") as HTMLButtonElement;
        expect(button).not.toBeNull();
        expect(button.getAttribute("aria-label")).toBe("Expand Root");

        button.click();
        fixture.detectChanges();
        expect(button.getAttribute("aria-label")).toBe("Collapse Root");

        i18n.use({
            direction: "rtl",
            id: "ar",
            messages: {
                treeView: {
                    collapse: "طي",
                    expand: "توسيع",
                    filter: "تصفية",
                    filterTree: "تصفية الشجرة"
                }
            }
        });
        fixture.detectChanges();
        expect(button.getAttribute("aria-label")).toBe("طي Root");
    });
});
