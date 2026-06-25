import { Injectable, signal } from "@angular/core";
import { ImmutableSet } from "@mirei/ts-collections";
import type { SectionItem } from "../models/SectionItem";

@Injectable()
export class PageService {
    readonly #sections = signal(ImmutableSet.create<SectionItem>());
    public readonly sections = this.#sections.asReadonly();

    public removeSection(section: SectionItem): void {
        this.#sections.update(set => {
            if (set.contains(section)) {
                return set.remove(section);
            }
            return set;
        });
    }

    public setSections(sections: Iterable<SectionItem>, clear: boolean = false): void {
        this.#sections.update(set => (clear ? set.clear().addAll(sections) : set.addAll(sections)));
    }
}
