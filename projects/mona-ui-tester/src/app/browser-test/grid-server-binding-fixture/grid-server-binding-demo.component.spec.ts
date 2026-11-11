import { DeferBlockState, TestBed, type ComponentFixture } from "@angular/core/testing";
import { GridServerBindingDemoComponent } from "./grid-server-binding-demo.component";

describe("Grid server binding demo", () => {
    async function settle(fixture: ComponentFixture<GridServerBindingDemoComponent>): Promise<void> {
        fixture.detectChanges();
        await fixture.whenStable();
        for (const block of await fixture.getDeferBlocks()) {
            await block.render(DeferBlockState.Complete);
        }
        fixture.detectChanges();
        await fixture.whenStable();
    }

    it("loads a nonzero server offset and fetches the next page through the pager", async () => {
        const fixture = TestBed.createComponent(GridServerBindingDemoComponent);
        await settle(fixture);
        const root = fixture.nativeElement as HTMLElement;
        const firstRow = () => root.querySelector("tbody tr[monaGridRow]");
        expect(firstRow()?.textContent).toContain("User 041");
        expect(root.querySelectorAll("tbody tr[monaGridRow]")).toHaveLength(10);
        expect(root.querySelector("[data-request-count]")?.textContent).toContain("Requests: 1");
        root.querySelector<HTMLButtonElement>("button[aria-label='Next page']")!.click();
        await settle(fixture);
        expect(firstRow()?.textContent).toContain("User 051");
        expect(root.querySelector("[data-request-count]")?.textContent).toContain("Requests: 2");
        expect(root.querySelector("mona-grid")?.getAttribute("aria-busy")).toBeNull();
    });

    it("sorts the full mock dataset before returning its first page", async () => {
        const fixture = TestBed.createComponent(GridServerBindingDemoComponent);
        await settle(fixture);
        const root = fixture.nativeElement as HTMLElement;
        root.querySelector<HTMLElement>("th [title='User']")!.click();
        await settle(fixture);
        expect(root.querySelector("tbody tr[monaGridRow]")?.textContent).toContain("User 001");
        expect(root.querySelector("[data-request-count]")?.textContent).toContain("Requests: 2");
        expect(root.querySelector("[data-request-state]")?.textContent).toContain('"skip": 0');
    });
});
