import { HKT, Kind, Kind2, Kind3, URIS, URIS2, URIS3 } from 'fp-ts/lib/HKT'
import { Foldable, Foldable1, Foldable2, Foldable3 } from 'fp-ts/lib/Foldable'
import * as RA from 'fp-ts/lib/ReadonlyArray'
import * as M from 'fp-ts/lib/Monoid'
import { MonoidAny } from 'fp-ts/lib/boolean'
import { Vec } from './Vec'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface Degrees {
  readonly _tag: 'Degrees'
  readonly degrees: number
}

export interface Radians {
  readonly _tag: 'Radians'
  readonly radians: number
}

export type Angle = Degrees | Radians

type Point = Vec

export interface Composite {
  readonly _tag: 'Composite'
  readonly shapes: ReadonlyArray<Shape>
}

export interface Path {
  readonly _tag: 'Path'
  readonly closed: boolean
  readonly points: ReadonlyArray<Vec>
}

export type Shape = Composite | Path

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const degrees = (degrees: number): Degrees => ({ _tag: 'Degrees', degrees })

export const radians = (radians: number): Radians => ({ _tag: 'Radians', radians })

export const point = (x: number, y: number, z: number): Point => [x, y, z]

export const angle = (angle: Angle): number => {
  switch (angle._tag) {
    case 'Radians':
      return angle.radians * (180 / Math.PI)
    case 'Degrees':
      return angle.degrees
  }
}

export const composite = (shapes: ReadonlyArray<Shape>): Composite => ({
  _tag: 'Composite',
  shapes,
})

export function closed<F extends URIS3>(foldable: Foldable3<F>): <E, A>(fa: Kind3<F, E, A, Point>) => Path
export function closed<F extends URIS2>(foldable: Foldable2<F>): <A>(fa: Kind2<F, A, Point>) => Path
export function closed<F extends URIS>(foldable: Foldable1<F>): (fa: Kind<F, Point>) => Path
export function closed<F>(F: Foldable<F>): (fa: HKT<F, Point>) => Path
export function closed<F>(F: Foldable<F>): (fa: HKT<F, Point>) => Path {
  return fa =>
    F.reduce(fa, monoidPath.empty, (b, a) => ({
      _tag: 'Path',
      closed: true,
      points: RA.append(a)(b.points),
    }))
}

export function path<F extends URIS3>(foldable: Foldable3<F>): <E, A>(fa: Kind3<F, E, A, Point>) => Path
export function path<F extends URIS2>(foldable: Foldable2<F>): <A>(fa: Kind2<F, A, Point>) => Path
export function path<F extends URIS>(foldable: Foldable1<F>): (fa: Kind<F, Point>) => Path
export function path<F>(F: Foldable<F>): (fa: HKT<F, Point>) => Path
export function path<F>(F: Foldable<F>): (fa: HKT<F, Point>) => Path {
  return fa =>
    F.reduce(fa, monoidPath.empty, (b, a) => ({
      _tag: 'Path',
      closed: false,
      points: RA.append(a)(b.points),
    }))
}

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

export const monoidPath: M.Monoid<Path> = M.struct({
  _tag: { concat: () => 'Path', empty: 'Path' },
  closed: MonoidAny,
  points: RA.getMonoid<Point>(),
})
