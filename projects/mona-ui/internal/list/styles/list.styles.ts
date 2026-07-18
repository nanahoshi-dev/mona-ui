import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    listGroupHeaderTextVariants as annaListGroupHeaderTextVariants,
    listGroupHeaderVariants as annaListGroupHeaderVariants,
    listInnerListVariants as annaListInnerListVariants,
    listItemBaseVariants as annaListItemBaseVariants,
    listItemContentVariants as annaListItemContentVariants,
    listVariants as annaListVariants
} from "./list.anna.styles";
import {
    listGroupHeaderTextVariants as monaListGroupHeaderTextVariants,
    listGroupHeaderVariants as monaListGroupHeaderVariants,
    listInnerListVariants as monaListInnerListVariants,
    listItemBaseVariants as monaListItemBaseVariants,
    listItemContentVariants as monaListItemContentVariants,
    listVariants as monaListVariants
} from "./list.mona.styles";

export const listThemeVariants = createThemeStrategy({ anna: annaListVariants, mona: monaListVariants });
export const listInnerListThemeVariants = createThemeStrategy({
    anna: annaListInnerListVariants,
    mona: monaListInnerListVariants
});
export const listGroupHeaderThemeVariants = createThemeStrategy({
    anna: annaListGroupHeaderVariants,
    mona: monaListGroupHeaderVariants
});
export const listGroupHeaderTextThemeVariants = createThemeStrategy({
    anna: annaListGroupHeaderTextVariants,
    mona: monaListGroupHeaderTextVariants
});
export const listItemBaseThemeVariants = createThemeStrategy({
    anna: annaListItemBaseVariants,
    mona: monaListItemBaseVariants
});
export const listItemContentThemeVariants = createThemeStrategy({
    anna: annaListItemContentVariants,
    mona: monaListItemContentVariants
});
