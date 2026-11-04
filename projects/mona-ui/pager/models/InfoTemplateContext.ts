import type { PagerContext } from "./PagerContext";

export interface InfoTemplateContext extends PagerContext {
    readonly $implicit: PagerContext;
}
