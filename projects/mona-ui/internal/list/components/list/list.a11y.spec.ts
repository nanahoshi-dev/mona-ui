import { Component, inject } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { ListService } from "../../services/list.service";
import { ListComponent } from "./list.component";

interface City {
    readonly country: string;
    readonly name: string;
}

@Component({
    selector: "mona-list-a11y-test",
    imports: [ListComponent],
    providers: [ListService],
    template: `<mona-list [data]="data" textField="name" ariaLabel="Cities"></mona-list>`
})
class ListA11yTestComponent {
    protected readonly data: readonly City[] = [
        { name: "Berlin", country: "Germany" },
        { name: "Hamburg", country: "Germany" },
        { name: "Lyon", country: "France" },
        { name: "Paris", country: "France" }
    ];
    public readonly listService = inject<ListService<City>>(ListService);
}

const runAxe = async (element: HTMLElement): Promise<axe.Result[]> => {
    const results = await axe.run(element, { rules: { "color-contrast": { enabled: false } } });
    return results.violations;
};

const describeViolations = (violations: axe.Result[]): string =>
    violations.map(v => `${v.id}: ${v.nodes.map(n => n.failureSummary).join(" | ")}`).join("\n");

describe("ListComponent accessibility", () => {
    let fixture: ComponentFixture<ListA11yTestComponent>;
    let listService: ListService<City>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [ListA11yTestComponent] }).compileComponents();
        fixture = TestBed.createComponent(ListA11yTestComponent);
        listService = fixture.componentInstance.listService;
        listService.setNavigableOptions({ enabled: true, mode: "highlight" });
        listService.setSelectableOptions({ enabled: true, mode: "multiple" });
    });

    const render = async (): Promise<HTMLElement> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
        return fixture.nativeElement as HTMLElement;
    };

    it("has no axe violations as a flat list", async () => {
        const violations = await runAxe(await render());
        expect(violations, describeViolations(violations)).toEqual([]);
    });

    it("has no axe violations with group headers", async () => {
        listService.setGroupBy("country");
        listService.setGroupableOptions({ enabled: true, headerOrder: "asc" });
        const violations = await runAxe(await render());
        expect(violations, describeViolations(violations)).toEqual([]);
    });

    it("has no axe violations with checkboxes", async () => {
        listService.setSelectableOptions({ enabled: true, mode: "multiple", checkboxes: true });
        listService.setSelectedKeys([fixture.componentInstance["data"][0]]);
        const violations = await runAxe(await render());
        expect(violations, describeViolations(violations)).toEqual([]);
    });

    it("has no axe violations with a filter input", async () => {
        listService.setFilterableOptions({ enabled: true });
        const violations = await runAxe(await render());
        expect(violations, describeViolations(violations)).toEqual([]);
    });

    it("keeps focus in the filter input and exposes the active option", async () => {
        listService.setFilterableOptions({ enabled: true });
        const element = await render();
        const input = element.querySelector("mona-filter-input input") as HTMLInputElement;
        const listbox = element.querySelector("[role=listbox]") as HTMLElement;
        input.focus();
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
        fixture.detectChanges();
        expect(document.activeElement).toBe(input);
        expect(input.getAttribute("role")).toBe("combobox");
        expect(input.getAttribute("aria-controls")).toBe(listbox.id);
        const activeId = input.getAttribute("aria-activedescendant");
        expect(activeId).toBeTruthy();
        expect(listbox.querySelector(`[id="${activeId}"]`)?.getAttribute("role")).toBe("option");
    });

    it("toggles the highlighted option with Space and selects all with Ctrl+A", async () => {
        const element = await render();
        const listbox = element.querySelector("mona-list") as HTMLElement;
        listService.highlightedItem.set(listService.viewItems().first());
        listbox.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
        expect(listService.selectedListItems().size()).toBe(1);
        listbox.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true }));
        expect(listService.selectedListItems().size()).toBe(4);
    });

    it("does not use aria-current for the highlighted option", async () => {
        const element = await render();
        listService.highlightedItem.set(listService.viewItems().first());
        fixture.detectChanges();
        expect(element.querySelector("[aria-current]")).toBeNull();
    });
});
