export interface MonaFilterMessages {
    readonly and: string;
    readonly apply: string;
    readonly clear: string;
    readonly contains: string;
    readonly doesNotContain: string;
    readonly endsWith: string;
    readonly isAfter: string;
    readonly isAfterOrEqualTo: string;
    readonly isBefore: string;
    readonly isBeforeOrEqualTo: string;
    readonly isEmpty: string;
    readonly isEqualTo: string;
    readonly isFalse: string;
    readonly isGreaterThan: string;
    readonly isGreaterThanOrEqualTo: string;
    readonly isLessThan: string;
    readonly isLessThanOrEqualTo: string;
    readonly isNotEmpty: string;
    readonly isNotEqualTo: string;
    readonly isNotNull: string;
    readonly isNotNullOrEmpty: string;
    readonly isNull: string;
    readonly isNullOrEmpty: string;
    readonly isTrue: string;
    readonly logic: string;
    readonly operator: string;
    readonly or: string;
    readonly secondOperator: string;
    readonly secondValue: string;
    readonly startsWith: string;
    readonly value: string;
}

export type FilterMessages = MonaFilterMessages;
