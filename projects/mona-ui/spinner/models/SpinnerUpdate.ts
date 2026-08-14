import type { SpinnerAppearance } from "./SpinnerAppearance";
import type { SpinnerSize } from "./SpinnerSize";

export interface SpinnerUpdate {
    appearance?: SpinnerAppearance;
    size?: SpinnerSize;
    text?: string;
}
