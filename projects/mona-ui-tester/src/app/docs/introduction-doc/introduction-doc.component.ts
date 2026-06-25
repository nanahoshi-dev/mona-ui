import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { LucideArrowUp } from "@lucide/angular";
import { MarkdownDocComponent } from "../../layout/components/markdown-doc/markdown-doc.component";

@Component({
    selector: "app-introduction-doc",
    imports: [MarkdownDocComponent, LucideArrowUp, NgTemplateOutlet],
    templateUrl: "./introduction-doc.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IntroductionDocComponent {}
