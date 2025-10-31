export type StyleToken = "*" | Record<string, string | number> | Array<"*" | Record<string, string | number>>;

export interface AnimationOptions {
    delay?: number;
    duration?: number;
    element: Element;
    endStyles: StyleToken;
    startStyles: StyleToken;
    timingFunction?: string;
}
