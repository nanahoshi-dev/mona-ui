import {
    ChangeDetectionStrategy,
    Component,
    contentChildren,
    DestroyRef,
    effect,
    inject,
    input,
    signal,
    untracked
} from "@angular/core";
import { HeaderType } from "../../models/HeaderType";
import { PageService } from "../../services/page.service";

@Component({
    selector: "app-section",
    imports: [],
    templateUrl: "./section.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        class: "[&_p]:font-medium [&_p]:text-sm"
    }
})
export class SectionComponent {
    readonly #pageService = inject(PageService);
    public readonly depth = signal(0);
    public readonly header = input("Header");
    public readonly headerType = input.required<HeaderType>();
    public readonly id = input.required<string>();
    public readonly parentId = signal<string | null>(null);
    public readonly nestedSections = contentChildren(SectionComponent);

    public constructor() {
        effect(() => {
            const nestedSections = this.nestedSections();
            const id = this.id();
            untracked(() => {
                nestedSections.forEach(ns => {
                    ns.parentId.set(id);
                    ns.depth.set(this.depth() + 1);
                });
                this.#pageService.setSections([this], this.parentId() == null);
            });
        });
        inject(DestroyRef).onDestroy(() => {
            this.#pageService.removeSection(this);
        });
    }
}
