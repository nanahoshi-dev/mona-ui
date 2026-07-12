import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { textBoxVariants as monaTextBoxVariants, inputVariants as monaInputVariants } from "./textbox.mona.styles";

export const reinaTextBoxVariants = createInheritedVariants(monaTextBoxVariants);

export const reinaInputVariants = createInheritedVariants(monaInputVariants);
