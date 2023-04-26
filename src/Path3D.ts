import * as NEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as RA from 'fp-ts/ReadonlyArray'
import { pipe } from 'fp-ts/lib/function'
import { Vec } from './Vec'

const isPointFinite = (point: Vec): boolean => isFinite(point[0]) && isFinite(point[1]) && isFinite(point[2])

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export type Path3D = ReadonlyArray<ReadonlyArray<Vec>>

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

export const moveTo =
  (point: Vec) =>
  (path: Path3D): Path3D =>
    isPointFinite(point)
      ? // create a new subpath with the specified point
        RA.snoc(path, [point])
      : path

export const lineTo =
  (point: Vec) =>
  (path: Path3D): Path3D =>
    isPointFinite(point)
      ? RA.isNonEmpty(path)
        ? // connect the last point in the subpath to the given point
          pipe(
            path,
            NEA.modifyLast(cur => RA.append(point)(cur))
          )
        : // if path has no subpaths, ensure there is a subpath
          moveTo(point)(path)
      : path

export const closePath = (path: Path3D): Path3D => {
  // do nothing if path has no subpaths
  if (!RA.isNonEmpty(path)) {
    return path
  }

  const cur = NEA.last(path)

  // do nothing if the last path contains a single point
  if (!(RA.isNonEmpty(cur) && cur.length > 1)) {
    return path
  }

  const end = NEA.last(cur)
  const start = cur[0]

  // do nothing if both ends are the same point
  if (end[0] === start[0] && end[1] === start[1] && end[2] === start[2]) {
    return path
  }

  // mark the last path as closed adding a new subpath whose first point
  // is the same as the previous subpath's first point
  return NEA.snoc(NEA.updateLast(RA.snoc(cur, start) as ReadonlyArray<Vec>)(path), [start])
}
