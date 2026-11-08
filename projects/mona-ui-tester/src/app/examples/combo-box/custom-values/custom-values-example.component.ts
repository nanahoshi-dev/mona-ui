import { Component, signal } from "@angular/core";
import { ComboBoxComponent } from "@nanahoshi/mona-ui/combo-box";
import { LabelDirective } from "@nanahoshi/mona-ui/label";

interface Tag {
    id: number;
    name: string;
}

@Component({
    selector: "app-combo-box-custom-values-example",
    imports: [ComboBoxComponent, LabelDirective],
    templateUrl: "./custom-values-example.component.html"
})
export class ComboBoxCustomValuesExampleComponent {
    protected readonly tag = signal<Tag | null>(null);
    protected readonly tags = signal<Tag[]>([
        { id: 1, name: "Bug" },
        { id: 2, name: "Documentation" },
        { id: 3, name: "Feature" }
    ]);

    protected addTag(name: string): void {
        const tag: Tag = { id: this.tags().length + 1, name };
        this.tags.update(tags => [...tags, tag]);
        this.tag.set(tag);
    }
}
