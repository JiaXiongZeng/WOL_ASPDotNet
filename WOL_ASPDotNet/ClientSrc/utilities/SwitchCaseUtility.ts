//export const SwitchCaseObject =
//    <S extends string, T>({
//        cases,
//        defaultCase
//    }: {
//        cases: { [Property in S | (string & NonNullable<unknown>) ]: () => T }
//        defaultCase?: () => T
//    }) =>
//        (expression: S | (string & NonNullable<unknown>)): T =>
//            (cases[expression] || defaultCase)() as T

//export const SwitchCaseCallBack =
//    <S extends string, T>(callback: () => {
//        cases: { [Property in S | (string & NonNullable<unknown>)]: () => T }
//        defaultCase?: () => T
//    }) =>
//        (expression: S | (string & NonNullable<unknown>)): T => {
//            const { cases, defaultCase } = callback();
//            return (cases[expression] || defaultCase)() as T
//        }

export type conditionObj<S extends string, T> = {
    cases: { [Property in S | string]: () => T }
    defaultCase?: () => T
}

export const SwitchCase =
    <S extends string, T>(arg: conditionObj<S, T> | (() => conditionObj<S, T>)) =>
        (expression: S | string): T => {
            let conditions: conditionObj<S, T>;            

            if (typeof arg === 'function') {
                conditions = (arg as (() => conditionObj<S, T>))();
            } else {
                conditions = (arg as conditionObj<S, T>);
            }

            const { cases, defaultCase } = conditions;

            if (cases[expression]) {
                return cases[expression]();
            }

            if (defaultCase) {
                return defaultCase();
            }

            return undefined as T;
    }
            
