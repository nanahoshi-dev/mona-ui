import { Component, signal } from "@angular/core";
import { ChipComponent } from "@nanahoshi/mona-ui/chip";
import { TextBoxDirective } from "@nanahoshi/mona-ui/text-box";

@Component({
    selector: "app-chip-removable-example",
    imports: [ChipComponent, TextBoxDirective],
    templateUrl: "./removable-example.component.html"
})
export class ChipRemovableExampleComponent {
    protected readonly tags = signal(["Angular", "Signals", "Accessibility"]);

    protected addTag(tagInput: HTMLInputElement): void {
        const tag = tagInput.value.trim();
        if (tag && !this.tags().includes(tag)) {
            this.tags.update(tags => [...tags, tag]);
        }
        tagInput.value = "";
    }

    protected removeTag(tag: string, tagInput: HTMLInputElement): void {
        this.tags.update(tags => tags.filter(item => item !== tag));
        tagInput.focus();
    }
}
