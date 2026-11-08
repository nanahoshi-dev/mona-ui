import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXAMPLE_PROJECT_OPENER, ExampleComponent } from "./example.component";

const TS_FILE = "looks-example.component.ts";
const HTML_FILE = "looks-example.component.html";
const TS_SOURCE =
    '@Component({ selector: "app-button-looks-example" })\nexport class ButtonLooksExampleComponent {}';

describe("ExampleComponent", () => {
    let fixture: ComponentFixture<ExampleComponent>;
    let http: HttpTestingController;
    let openProject: ReturnType<typeof vi.fn>;

    const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll("button"));
    const button = (text: string): HTMLButtonElement =>
        buttons().find(candidate => candidate.textContent?.includes(text)) as HTMLButtonElement;

    async function render(id = "button/looks"): Promise<void> {
        fixture.componentRef.setInput("exampleId", id);
        fixture.autoDetectChanges();
        await fixture.whenStable();
    }

    function answerSources(): void {
        http.expectOne(`/assets/examples/button/looks/${TS_FILE}`).flush(TS_SOURCE);
        http.expectOne(`/assets/examples/button/looks/${HTML_FILE}`).flush("<button>Hi</button>");
    }

    /** The source requests happen after a microtask and a render, and the test has to answer them for the app to settle. */
    async function afterRequests(): Promise<void> {
        await new Promise(resolve => setTimeout(resolve));
        TestBed.tick();
        answerSources();
        // Opening a project continues on plain promises, which the application doesn't wait for.
        await new Promise(resolve => setTimeout(resolve));
        await fixture.whenStable();
    }

    beforeEach(async () => {
        openProject = vi.fn().mockResolvedValue(undefined);
        await TestBed.configureTestingModule({
            imports: [ExampleComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: EXAMPLE_PROJECT_OPENER, useValue: openProject }
            ]
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(ExampleComponent);
    });

    afterEach(() => http.verify());

    it("runs the example, without fetching its source", async () => {
        await render();

        expect(fixture.nativeElement.querySelector("app-button-looks-example")).not.toBeNull();
    });

    it("says so when the id is wrong", async () => {
        await render("button/nope");

        expect(fixture.nativeElement.textContent).toContain("no example called button/nope");
    });

    it("shows the source on request, one file at a time", async () => {
        await render();

        button("Show code").click();
        await afterRequests();

        expect(button("Hide code").getAttribute("aria-expanded")).toBe("true");
        expect(fixture.nativeElement.querySelector("app-code-viewer").textContent).toContain("ButtonLooksExampleComponent");
        expect(button(TS_FILE).getAttribute("aria-pressed")).toBe("true");

        button(HTML_FILE).click();
        await fixture.whenStable();

        expect(button(HTML_FILE).getAttribute("aria-pressed")).toBe("true");
        expect(fixture.nativeElement.querySelector("app-code-viewer").textContent).toContain("Hi");
    });

    it("says so when the source can't be loaded", async () => {
        await render();

        button("Show code").click();
        await new Promise(resolve => setTimeout(resolve));
        TestBed.tick();
        http.expectOne(`/assets/examples/button/looks/${TS_FILE}`).flush("", { status: 404, statusText: "Not found" });
        http.expectOne(`/assets/examples/button/looks/${HTML_FILE}`).flush("");
        await fixture.whenStable();

        expect(fixture.nativeElement.textContent).toContain("Couldn't load the source");
    });

    it("sends a whole project to StackBlitz, opened on the example", async () => {
        await render();

        button("Open in StackBlitz").click();
        await afterRequests();

        const [title, files, openFile] = openProject.mock.calls[0];
        expect(title).toBe("Mona UI example: button/looks");
        expect(openFile).toBe(`src/app/${TS_FILE}`);
        expect(files[`src/app/${TS_FILE}`]).toBe(TS_SOURCE);
        expect(files["src/main.ts"]).toContain("bootstrapApplication(ButtonLooksExampleComponent)");
    });

    it("says so when the project can't be opened", async () => {
        openProject.mockRejectedValue(new Error("Blocked"));
        await render();

        button("Open in StackBlitz").click();
        await afterRequests();

        expect(fixture.nativeElement.textContent).toContain("Couldn't open the project");
        expect(button("Open in StackBlitz").disabled).toBe(false);
    });

    it("passes axe, with the source showing", async () => {
        await render();
        button("Show code").click();
        await afterRequests();

        const results = await axe.run(fixture.nativeElement, { rules: { "color-contrast": { enabled: false } } });

        expect(results.violations).toEqual([]);
    });
});
