import { NgOptimizedImage } from "@angular/common";
import { provideHttpClient, withXhr } from "@angular/common/http";
import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { provideRouter } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
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
        importProvidersFrom(FontAwesomeModule, FormsModule, NgOptimizedImage),
        provideHttpClient(withXhr()),
        provideRouter(routes),
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
