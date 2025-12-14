import { Clipboard } from "@angular/cdk/clipboard";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import HighlightJS from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import html from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import { Copy, LucideAngularModule } from "lucide-angular";

HighlightJS.registerLanguage("typescript", typescript);
HighlightJS.registerLanguage("html", html);
HighlightJS.registerLanguage("json", json);

@Component({
    selector: "app-code-viewer",
    templateUrl: "./code-viewer.component.html",
    imports: [LucideAngularModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        "[class]": "'mona-code-viewer block relative overflow-auto'"
    }
})
export class CodeViewerComponent {
    readonly #clipboard = inject(Clipboard);
    protected readonly copyIcon = Copy;
    protected readonly highlightedCode = computed(() => {
        const codeValue = this.processedCode();
        const lang = this.language();
        const highlighted = HighlightJS.highlight(codeValue, {
            language: lang,
            ignoreIllegals: true
        });

        return highlighted.value;
    });
    protected readonly lineNumbers = computed(() => {
        const codeValue = this.processedCode() || "";
        if (codeValue.length === 0) {
            return [];
        }
        const lineCount = codeValue.split("\n").length;
        return Array.from({ length: lineCount }, (_, i) => i + 1);
    });
    protected readonly processedCode = computed(() => {
        const rawCode = this.code();
        let lines = rawCode.split("\n");

        if (lines[0]?.trim() === "") {
            lines.shift();
        }
        if (lines.length > 0 && lines[lines.length - 1].trim() === "") {
            lines.pop();
        }
        if (lines.length === 0) return "";

        const minIndent = lines.reduce((min, line) => {
            if (line.trim().length === 0) return min; // Ignore empty lines
            const indent = line.match(/^\s*/)?.[0].length ?? 0;
            return Math.min(min, indent);
        }, Infinity);

        if (minIndent === Infinity) {
            return lines.join("\n");
        }
        return lines.map(line => line.substring(minIndent)).join("\n");
    });
    public readonly code = input.required<string>();
    public readonly language = input<string>("plaintext");
    protected copyToClipboard(): void {
        const code = this.processedCode();
        this.#clipboard.copy(code);
    }
}
