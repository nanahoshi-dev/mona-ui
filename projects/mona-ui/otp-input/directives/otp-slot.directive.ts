import { computed, Directive, input } from "@angular/core";
import { OtpInputVariantProps } from "@nanahoshi/mona-ui/otp-input";
import { twMerge } from "tailwind-merge";
import { otpInputSlotThemeVariants } from "../styles/otp-input.styles";
import { getSlotRoundedClasses } from "../utils/otp-input.utils";

@Directive({
    selector: "span[monaOtpSlot]",
    host: {
        "[class]": "baseClass()"
    }
})
export class OtpSlotDirective {
    protected readonly baseClass = computed(() => {
        const firstSlot = this.firstSlot();
        const groupSize = this.groupSize();
        const lastSlot = this.lastSlot();
        const rounded = this.rounded();
        const size = this.size();
        const slotClass = this.slotClass();
        const spacing = this.spacing();
        const baseClasses = otpInputSlotThemeVariants({
            rounded: spacing ? rounded : "none",
            size
        });

        let extraRounding = "";
        if (!spacing) {
            extraRounding = getSlotRoundedClasses(rounded, firstSlot, lastSlot, groupSize);
        }
        return twMerge(baseClasses, extraRounding, slotClass);
    });
    public readonly firstSlot = input.required<boolean>();
    public readonly groupSize = input.required<number>();
    public readonly lastSlot = input.required<boolean>();
    public readonly rounded = input.required<OtpInputVariantProps["rounded"]>();
    public readonly size = input.required<OtpInputVariantProps["size"]>();
    public readonly slotClass = input.required<string | string[]>();
    public readonly spacing = input.required<boolean>();
}
