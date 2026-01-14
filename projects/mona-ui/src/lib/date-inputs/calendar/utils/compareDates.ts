export type DateComparisonOperator = "==" | "!=" | "<" | "<=" | ">" | ">=";

export const compareDates = (
    date1: Date | null | undefined,
    date2: Date | null | undefined,
    operator: DateComparisonOperator
): boolean => {
    if (!date1 || !date2) {
        return false;
    }

    const valueDateParts = [date1.getFullYear(), date1.getMonth(), date1.getDate()];
    const otherDateParts = [date2.getFullYear(), date2.getMonth(), date2.getDate()];

    for (let i = 0; i < 3; i++) {
        switch (operator) {
            case "==":
                if (valueDateParts[i] !== otherDateParts[i]) return false;
                break;
            case "!=":
                if (valueDateParts[i] !== otherDateParts[i]) return true;
                break;
            case "<":
            case "<=":
                if (valueDateParts[i] < otherDateParts[i]) return true;
                if (valueDateParts[i] > otherDateParts[i]) return false;
                if (operator === "<=" && i === 2 && valueDateParts[i] === otherDateParts[i]) return true;
                break;
            case ">":
            case ">=":
                if (valueDateParts[i] > otherDateParts[i]) return true;
                if (valueDateParts[i] < otherDateParts[i]) return false;
                if (operator === ">=" && i === 2 && valueDateParts[i] === otherDateParts[i]) return true;
                break;
            default:
                return false;
        }
    }
    return operator === "==";
};
