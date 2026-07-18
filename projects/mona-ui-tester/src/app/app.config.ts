import { NgOptimizedImage } from "@angular/common";
import { provideHttpClient, withXhr } from "@angular/common/http";
import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideRouter } from "@angular/router";
import { provideThemeColors } from "@nanahoshi/mona-ui/theme";
import HighlightJS from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import plaintext from "highlight.js/lib/languages/plaintext";
import { markedHighlight } from "marked-highlight";
import { MARKED_EXTENSIONS, provideMarkdown } from "ngx-markdown";
import { routes } from "./routes";

HighlightJS.registerLanguage("bash", bash);
HighlightJS.registerLanguage("html", xml);
HighlightJS.registerLanguage("json", json);
HighlightJS.registerLanguage("typescript", typescript);
HighlightJS.registerLanguage("plaintext", plaintext);

export const appConfig: ApplicationConfig = {
    providers: [
        importProvidersFrom(FormsModule, NgOptimizedImage),
        provideHttpClient(withXhr()),
        provideRouter(routes),
        provideThemeColors({
            theme: "mona",
            colors: {
                light: {
                    "--color-page-background": "oklch(98.5% 0 0)",
                    "--color-demo-background": "oklch(100% 0 0)"
                },
                dark: {
                    "--color-page-background": "oklch(14.1% 0.005 285.823)",
                    "--color-demo-background": "oklch(18% 0.006 285.885)"
                }
            }
        }),
        provideThemeColors({
            theme: "anna",
            colors: {
                dark: {
                    "--color-page-background": "#202123",
                    "--color-demo-background": "#1D1E20"
                }
            }
        }),
        provideMarkdown({
            markedExtensions: [
                {
                    provide: MARKED_EXTENSIONS,
                    multi: true,
                    useValue: markedHighlight({
                        highlight(code: string, lang: string): string {
                            const language = HighlightJS.getLanguage(lang) ? lang : "plaintext";
                            return HighlightJS.highlight(code, { language }).value;
                        }
                    })
                }
            ]
        })
    ]
};
