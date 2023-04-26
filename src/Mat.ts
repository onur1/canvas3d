import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import { apply, flow, pipe } from 'fp-ts/function'
import { Monoid, concatAll as concatAll_ } from 'fp-ts/lib/Monoid'
import { Semigroup } from 'fp-ts/lib/Semigroup'
import { Vec, at, dot } from './Vec'

const map = RNEA.Functor.map

const sin = (deg: number) => Math.sin((deg * Math.PI) / 180.0)

const cos = (deg: number) => Math.cos((deg * Math.PI) / 180.0)

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export type Mat = RNEA.ReadonlyNonEmptyArray<Vec>

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const transpose = (fa: Mat): Mat => pipe(RNEA.head(fa), RNEA.mapWithIndex(flow(row, apply(fa))))

export const translate = (v: Vec): Mat => [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [v[0], v[1], v[2], 1],
]

export const scale = (v: Vec): Mat => [
  [v[0], 0, 0, 0],
  [0, v[1], 0, 0],
  [0, 0, v[2], 0],
  [0, 0, 0, 1],
]

export const rotateX = (angle: number): Mat => [
  [1, 0, 0, 0],
  [0, cos(angle), sin(angle), 0],
  [0, -sin(angle), cos(angle), 0],
  [0, 0, 0, 1],
]

export const rotateY = (angle: number): Mat => [
  [cos(angle), 0, -sin(angle), 0],
  [0, 1, 0, 0],
  [sin(angle), 0, cos(angle), 0],
  [0, 0, 0, 1],
]

export const rotateZ = (angle: number): Mat => [
  [cos(angle), sin(angle), 0, 0],
  [-sin(angle), cos(angle), 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 1],
]

export const axonometric = (phi: number, theta: number): Mat => [
  [cos(phi), sin(phi) * sin(theta), -sin(phi) * cos(theta), 0],
  [0, cos(theta), sin(theta), 0],
  [sin(phi), -cos(phi) * sin(theta), cos(phi) * cos(theta), 0],
  [0, 0, 0, 1],
]

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const mul =
  (fb: Mat): ((fa: Mat) => Mat) =>
  fa =>
    semigroupMat.concat(fa, fb)

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

export const semigroupMat: Semigroup<Mat> = {
  concat: (x, y) => pipe(map(transpose(y), dot), fab => map(x, ar => map(fab, f => f(ar)))),
}

export const identity: Mat = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
]

export const monoidMat: Monoid<Mat> = {
  concat: semigroupMat.concat,
  empty: identity,
}

export const concatAll = concatAll_(monoidMat)

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

export const row: (n: number) => (as: Mat) => Vec = flow(at, RNEA.map)
