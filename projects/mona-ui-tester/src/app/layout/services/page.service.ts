import { Injectable, signal } from "@angular/core";
import { EnumerableSet, ImmutableSet } from "@mirei/ts-collections";
import { SectionComponent } from "../components/section/section.component";

@Injectable()
export class PageService {
    readonly #sections = signal(ImmutableSet.create<SectionComponent>());
    public readonly sections = this.#sections.asReadonly();

    public setSections(sections: Iterable<SectionComponent>, clear: boolean = false): void {
        this.#sections.update(set => (clear ? set.clear().addAll(sections) : set.addAll(sections)));
    }

    public removeSection(section: SectionComponent): void {
        this.#sections.update(set => {
            if (set.contains(section)) {
                return set.remove(section);
            }
            return set;
        });
    }
}
