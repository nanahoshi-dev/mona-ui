import type { ElementRef } from "@angular/core";
import type { SpinnerAppearance } from "./SpinnerAppearance";
import type { SpinnerSize } from "./SpinnerSize";

export interface SpinnerCancelOptions {
    onCancel?: () => void;
    text?: string;
}

export interface SpinnerOptions {
    appearance?: SpinnerAppearance;
    cancellable?: boolean | SpinnerCancelOptions;
    delay?: number;
    id?: string;
    minimumVisibleDuration?: number;
    size?: SpinnerSize;
    target?: HTMLElement | ElementRef<HTMLElement> | readonly (HTMLElement | ElementRef<HTMLElement>)[];
    text?: string;
    zIndex?: number;
}
