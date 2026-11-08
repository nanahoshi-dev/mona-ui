import type { TemplateRef } from "@angular/core";
import { Component, inject, signal, viewChild } from "@angular/core";
import { ButtonDirective } from "@nanahoshi/mona-ui/button";
import { LabelComponent } from "@nanahoshi/mona-ui/label";
import { TextBoxComponent } from "@nanahoshi/mona-ui/text-box";
import { WindowService } from "@nanahoshi/mona-ui/window";

@Component({
    selector: "app-window-service-example",
    imports: [ButtonDirective, LabelComponent, TextBoxComponent],
    templateUrl: "./service-example.component.html"
})
export class WindowServiceExampleComponent {
    readonly #windowService = inject(WindowService);
    protected readonly draft = signal("");
    protected readonly fileName = signal("report.pdf");
    protected readonly renameTemplate = viewChild.required<TemplateRef<unknown>>("rename");

    protected openRename(): void {
        this.draft.set(this.fileName());
        const windowRef = this.#windowService.open<string>({
            content: this.renameTemplate(),
            title: "Rename file",
            width: 320
        });
        // closed$ completes once the window has closed, so there's nothing to unsubscribe.
        windowRef.closed$.subscribe(({ value }) => {
            if (value) {
                this.fileName.set(value);
            }
        });
    }
}
