import type { MonaCardMessages } from "../message-types/card.messages";
import type { MonaChipMessages } from "../message-types/chip.messages";
import type { MonaNumericTextBoxMessages } from "../message-types/numeric-text-box.messages";
import type { MonaOtpInputMessages } from "../message-types/otp-input.messages";
import type { MonaPagerMessages } from "../message-types/pager.messages";
import type { MonaRatingMessages } from "../message-types/rating.messages";
import type { MonaSliderMessages } from "../message-types/slider.messages";
import type { MonaSpinnerMessages } from "../message-types/spinner.messages";
import type { MonaTextBoxMessages } from "../message-types/text-box.messages";

export interface MonaLocaleMessages extends Record<string, object> {
    card: MonaCardMessages;
    chip: MonaChipMessages;
    numericTextBox: MonaNumericTextBoxMessages;
    otpInput: MonaOtpInputMessages;
    pager: MonaPagerMessages;
    rating: MonaRatingMessages;
    slider: MonaSliderMessages;
    spinner: MonaSpinnerMessages;
    textBox: MonaTextBoxMessages;
}




