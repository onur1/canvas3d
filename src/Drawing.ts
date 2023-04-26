import * as O from 'fp-ts/Option'
import * as IO from 'fp-ts/IO'
import * as RA from 'fp-ts/ReadonlyArray'
import { flow, pipe } from 'fp-ts/lib/function'
import * as RIO from 'fp-ts/ReaderIO'
import * as M from 'fp-ts/Monoid'
import { first } from 'fp-ts/lib/Semigroup'
import * as RNEA from 'fp-ts/ReadonlyNonEmptyArray'
import * as Mat from './Mat'
import * as V from './Vec'
import * as C from './Canvas'
import { Color, toCss } from './Color'
import { Angle, Shape, angle } from './Shape'
import { Path3D, closePath, lineTo, moveTo } from './Path3D'

const traverseReaderIO = RA.Traversable.traverse(RIO.Applicative)

export type Transform3D = Mat.Mat

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

export interface Translate {
  readonly _tag: 'Translate'
  readonly translateX: number
  readonly translateY: number
  readonly translateZ: number
  readonly drawing: Drawing
}

export const translate: (
  translateX: number,
  translateY: number,
  translateZ: number,
  drawing: Drawing
) => Drawing = (translateX, translateY, translateZ, drawing) => ({
  _tag: 'Translate',
  translateX,
  translateY,
  translateZ,
  drawing,
})

export interface Rotate {
  readonly _tag: 'Rotate'
  readonly rotateX: Angle
  readonly rotateY: Angle
  readonly rotateZ: Angle
  readonly drawing: Drawing
}

export const rotate: (rotateX: Angle, rotateY: Angle, rotateZ: Angle, drawing: Drawing) => Drawing = (
  rotateX,
  rotateY,
  rotateZ,
  drawing
) => ({
  _tag: 'Rotate',
  rotateX,
  rotateY,
  rotateZ,
  drawing,
})

export interface Scale {
  readonly _tag: 'Scale'
  readonly scaleX: number
  readonly scaleY: number
  readonly scaleZ: number
  readonly drawing: Drawing
}

export const scale: (scaleX: number, scaleY: number, scaleZ: number, drawing: Drawing) => Drawing = (
  scaleX,
  scaleY,
  scaleZ,
  drawing
) => ({
  _tag: 'Scale',
  scaleX,
  scaleY,
  scaleZ,
  drawing,
})

export interface Many {
  readonly _tag: 'Many'
  readonly drawings: ReadonlyArray<Drawing>
}

export const many: (drawings: ReadonlyArray<Drawing>) => Drawing = drawings => ({
  _tag: 'Many',
  drawings,
})

export interface Fill {
  readonly _tag: 'Fill'
  readonly shape: Shape
  readonly style: FillStyle
}

export interface FillStyle {
  readonly color: O.Option<Color>
}

export interface OutlineStyle {
  readonly color: O.Option<Color>
  readonly lineWidth: O.Option<number>
}

export interface Outline {
  readonly _tag: 'Outline'
  readonly shape: Shape
  readonly style: OutlineStyle
}

export const outlineColor: (color: Color) => OutlineStyle = c => ({
  color: O.some(c),
  lineWidth: O.none,
})

export const lineWidth: (lineWidth: number) => OutlineStyle = w => ({
  color: O.none,
  lineWidth: O.some(w),
})

export const fill: (shape: Shape, style: FillStyle) => Drawing = (shape, style) => ({
  _tag: 'Fill',
  shape,
  style,
})

export const fillStyle: (color: Color) => FillStyle = c => ({ color: O.some(c) })

export const outline: (shape: Shape, style: OutlineStyle) => Drawing = (shape, style) => ({
  _tag: 'Outline',
  shape,
  style,
})

export type Drawing = Outline | Fill | Many | Translate | Rotate | Scale

// -------------------------------------------------------------------------------------
// instances
// -------------------------------------------------------------------------------------

const readonlyArrayMonoidDrawing = RA.getMonoid<Drawing>()
const getFirstMonoidColor = O.getMonoid<Color>(first())
const getFirstMonoidNumber = O.getMonoid<number>(first())

export const monoidFillStyle = M.struct<FillStyle>({
  color: getFirstMonoidColor,
})

export const monoidOutlineStyle = M.struct<OutlineStyle>({
  color: getFirstMonoidColor,
  lineWidth: getFirstMonoidNumber,
})

export const monoidDrawing: M.Monoid<Drawing> = {
  concat: (x, y) =>
    x._tag === 'Many' && y._tag === 'Many'
      ? many(M.concatAll(readonlyArrayMonoidDrawing)([x.drawings, y.drawings]))
      : x._tag === 'Many'
      ? many(M.concatAll(readonlyArrayMonoidDrawing)([x.drawings, [y]]))
      : y._tag === 'Many'
      ? many(M.concatAll(readonlyArrayMonoidDrawing)([[x], y.drawings]))
      : many([x, y]),
  empty: many(readonlyArrayMonoidDrawing.empty),
}

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

export const renderShape: (shape: Shape) => Path3D = shape => {
  switch (shape._tag) {
    case 'Composite':
      return RA.Foldable.reduce(shape.shapes, [] as Path3D, (b, a) => b.concat(renderShape(a)))
    case 'Path':
      return pipe(
        shape.points,
        RA.foldLeft(
          () => RA.empty,
          (head, tail) =>
            pipe(
              tail,
              RA.map(lineTo),
              RA.reduce(moveTo(head)([]), (a, f) => f(a)),
              path => (shape.closed ? closePath(path).slice(0, -1) : path)
            )
        )
      )
  }
}

const applyStyle: <A>(
  fa: O.Option<A>,
  f: (a: A) => C.Render<CanvasRenderingContext2D>
) => C.Render<CanvasRenderingContext2D> = (fa, f) =>
  pipe(
    fa,
    O.fold(() => IO.of, f)
  )

// Hardcoded parallel projection matrix
const VT: Mat.Mat = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 1],
]

export const renderSubPath: (subPath: ReadonlyArray<V.Vec>) => C.Render<CanvasRenderingContext2D> = pipe(
  RA.foldLeft(
    () => IO.of,
    (head, tail) =>
      pipe(
        C.moveTo(head),
        RIO.chain(() => traverseReaderIO(tail, C.lineTo)),
        RIO.chain(() => IO.of)
      )
  )
)

const toCoords = (shape: Shape, transform: Transform3D): ReadonlyArray<Transform3D> =>
  pipe(
    renderShape(shape),
    RA.map(RNEA.fromReadonlyArray),
    RA.compact,
    RA.map(RNEA.map(RA.append(1))),
    RA.map(Mat.mul(transform)),
    RA.map(Mat.mul(VT))
  )

export const render: (drawing: Drawing) => C.Render<CanvasRenderingContext2D> = drawing => {
  const go: (transform: Transform3D) => (drawing: Drawing) => C.Render<CanvasRenderingContext2D> = t => d => {
    switch (d._tag) {
      case 'Many':
        return pipe(
          traverseReaderIO(d.drawings, go(t)),
          RIO.chain(() => RIO.ask())
        )
      case 'Scale':
        return go(Mat.mul(Mat.scale([d.scaleX, d.scaleY, d.scaleZ]))(t))(d.drawing)
      case 'Rotate':
        return go(
          Mat.semigroupMat.concat(
            Mat.mul(Mat.rotateX(angle(d.rotateX)))(Mat.rotateY(angle(d.rotateY))),
            Mat.mul(Mat.rotateZ(angle(d.rotateZ)))(t)
          )
        )(d.drawing)
      case 'Translate':
        return go(Mat.mul(Mat.translate([d.translateX, d.translateY, d.translateZ]))(t))(d.drawing)
      case 'Outline':
        return C.withContext(
          pipe(
            applyStyle(d.style.color, flow(toCss, C.setStrokeStyle)),
            RIO.chain(() => applyStyle(d.style.lineWidth, C.setLineWidth)),
            RIO.chain(() =>
              pipe(
                C.beginPath,
                RIO.chain(() => traverseReaderIO(toCoords(d.shape, t), renderSubPath)),
                RIO.chainFirst(() => C.stroke())
              )
            ),
            RIO.chain(() => RIO.ask())
          )
        )
      case 'Fill':
        return C.withContext(
          pipe(
            applyStyle(d.style.color, flow(toCss, C.setFillStyle)),
            RIO.chain(() =>
              pipe(
                C.beginPath,
                RIO.chain(() => traverseReaderIO(toCoords(d.shape, t), renderSubPath)),
                RIO.chainFirst(() => C.fill())
              )
            ),
            RIO.chain(() => RIO.ask())
          )
        )
    }
  }
  return go(Mat.identity)(drawing)
}
