import { NgComponentOutlet } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Component, computed, inject, InjectionToken, input, resource, signal } from "@angular/core";
import { LucideCode, LucideExternalLink } from "@lucide/angular";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { firstValueFrom } from "rxjs";
import { CodeViewerComponent } from "../../../demo/components/code-viewer/code-viewer.component";
import { EXAMPLES } from "../../../examples/examples.generated";
import { createExampleProject } from "../../example-project";

type ExampleProjectOpener = (title: string, files: Record<string, string>, openFile: string) => Promise<void>;

/** Sends a project to StackBlitz. The SDK is only fetched when someone asks for it. */
export const EXAMPLE_PROJECT_OPENER = new InjectionToken<ExampleProjectOpener>("EXAMPLE_PROJECT_OPENER", {
    factory: () => async (title, files, openFile) => {
        const { default: sdk } = await import("@stackblitz/sdk");
        sdk.openProject({ files, template: "node", title }, { newWindow: true, openFile });
    }
});

/** One example on a page: running, with its source a click away and a way to take it to StackBlitz. */
@Component({
    selector: "app-example",
    imports: [ButtonDirective, CodeViewerComponent, LucideCode, LucideExternalLink, NgComponentOutlet],
    templateUrl: "./example.component.html",
    host: {
        class: "not-prose my-4 block overflow-hidden rounded-md border border-border-subtle"
    }
})
export class ExampleComponent {
    readonly #http = inject(HttpClient);
    readonly #openProject = inject(EXAMPLE_PROJECT_OPENER);
    readonly #sourcesWanted = signal(false);

    protected readonly activeFile = signal<string | null>(null);
    protected readonly code = computed(() => {
        const sources = this.sources.hasValue() ? this.sources.value() : null;
        return sources?.[this.shownFile() ?? ""] ?? null;
    });
    protected readonly component = resource({
        loader: ({ params }) => params.load(),
        params: () => this.entry()
    });
    protected readonly entry = computed(() => EXAMPLES[this.exampleId()]);
    protected readonly language = computed(() => (this.shownFile()?.endsWith(".ts") ? "typescript" : "html"));
    protected readonly openFailed = signal(false);
    protected readonly opening = signal(false);
    protected readonly showCode = signal(false);
    protected readonly shownFile = computed(() => this.activeFile() ?? this.entry()?.mainFile ?? null);
    protected readonly sources = resource({
        loader: ({ params }) => this.#readSources(params),
        params: () => (this.#sourcesWanted() ? this.exampleId() : undefined)
    });

    /** The example's id, `<page>/<name>`. */
    public readonly exampleId = input.required<string>();

    protected async openInStackBlitz(): Promise<void> {
        const entry = this.entry();
        this.opening.set(true);
        this.openFailed.set(false);
        try {
            const files = await this.#readSources(this.exampleId());
            const title = `Mona UI example: ${this.exampleId()}`;
            const project = createExampleProject({ files, mainFile: entry.mainFile, title });
            await this.#openProject(title, project, `src/app/${entry.mainFile}`);
        } catch {
            this.openFailed.set(true);
        } finally {
            this.opening.set(false);
        }
    }

    protected toggleCode(): void {
        this.#sourcesWanted.set(true);
        this.showCode.update(shown => !shown);
    }

    async #readSources(id: string): Promise<Record<string, string>> {
        const files = EXAMPLES[id].files;
        const contents = await Promise.all(
            files.map(file =>
                firstValueFrom(this.#http.get(`/assets/examples/${id}/${file}`, { responseType: "text" }))
            )
        );
        return Object.fromEntries(files.map((file, index) => [file, contents[index]]));
    }
}
