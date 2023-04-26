import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { pipe } from 'fp-ts/function'
import { Field as numberField } from 'fp-ts/number'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export type Vec = RNEA.ReadonlyNonEmptyArray<number>

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const dot =
  (fb: Vec): ((fa: Vec) => number) =>
  fa =>
    pipe(RNEA.zipWith(fa, fb, numberField.mul), RNEA.reduce(0, numberField.add))

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

export const at = (i: number) => (v: Vec) => v[i]
