export interface CardTemplateContext {
    /** An id for the element in the template, if something needs to refer to it. The card doesn't need it for its name. */
    readonly $implicit: string;
}
