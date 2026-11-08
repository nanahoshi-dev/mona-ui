import { type WindowRef } from "./WindowRef";

export interface WindowActionTemplateContext {
    /** The window's own `WindowRef`, exposed to a `monaWindowActionTemplate` via `let-windowRef`. */
    $implicit: WindowRef;
}
