import * as R from 'fp-ts/ReaderIO'
import * as IO from 'fp-ts/IO'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import { sequenceS } from 'fp-ts/Apply'
import { flow } from 'fp-ts/function'
import { pipe } from 'fp-ts/function'
import { Vec } from './Vec'

// -------------------------------------------------------------------------------------
// model
// -------------------------------------------------------------------------------------

/**
 * Represents the management of a `CanvasGradient` as *reading* from the `CanvasGradient` and
 * returning a type `A` wrapped in an `IO`. In other words, we can say that when we are managing
 * a `CanvasGradient` we are yielding an `Gradient` effect.
 *
 * @category model
 * @since 0.0.1
 */
export interface Gradient<A> extends R.ReaderIO<CanvasGradient, A> {}

/**
 * Represents the management of an `HTMLCanvasElement` as *reading* from the `HTMLCanvasElement`
 * and returning a type `A` wrapped in an `IO`. In other words, we can say that when we are
 * managing an `HTMLCanvasElement` we are yielding an `Html` effect.
 *
 * @category model
 * @since 0.0.1
 */
export interface Html<A> extends R.ReaderIO<HTMLCanvasElement, A> {}

/**
 * Represents the management of a `CanvasRenderingContext2D` as *reading* from the
 * `CanvasRenderingContext2D` and returning a type `A` wrapped in an `IO`. In other words, we can
 * say that when we are managing a `CanvasRenderingContext2D` we are yielding an `Render` effect.
 *
 * @category model
 * @since 0.0.1
 */
export interface Render<A> extends R.ReaderIO<CanvasRenderingContext2D, A> {}

/**
 * Represents the dimensions of the HTML canvas.
 *
 * @category model
 * @since 0.0.1
 */
export interface CanvasDimensions {
  /**
   * The width of the canvas in CSS pixels.
   */
  readonly width: number

  /**
   * The height of the canvas in CSS pixels.
   */
  readonly height: number
}

/**
 * The algorithm by which to determine if a point is inside or outside the filling region.
 *
 * @see [MDN Web Docs](https://mzl.la/2zaDdNu)
 *
 * @category model
 * @since 0.0.1
 */
export type FillRule = 'evenodd' | 'nonzero'

/**
 * The type of compositing operation to apply when drawing new shapes. Defaults to `source-over`.
 *
 * @see [MDN Web Docs](https://mzl.la/36gbsz7)
 *
 * @category model
 * @since 0.0.1
 */
export type GlobalCompositeOperation =
  | 'color'
  | 'color-burn'
  | 'color-dodge'
  | 'copy'
  | 'darken'
  | 'destination-atop'
  | 'destination-in'
  | 'destination-out'
  | 'destination-over'
  | 'difference'
  | 'exclusion'
  | 'hard-light'
  | 'hue'
  | 'lighten'
  | 'lighter'
  | 'luminosity'
  | 'multiply'
  | 'overlay'
  | 'saturation'
  | 'screen'
  | 'soft-light'
  | 'source-atop'
  | 'source-in'
  | 'source-out'
  | 'source-over'
  | 'xor'

/**
 * The shape used to draw the end points of lines.
 *
 * @see [MDN Web Docs](https://mzl.la/2zOVZtS)
 *
 * @category model
 * @since 0.0.1
 */
export type LineCap = 'butt' | 'round' | 'square'

/**
 * The shape used to draw two line segments where they meet.
 *
 * @see [MDN Web Docs](https://mzl.la/3cMHqFU)
 *
 * @category model
 * @since 0.0.1
 */
export type LineJoin = 'bevel' | 'miter' | 'round'

// -------------------------------------------------------------------------------------
// constructors
// -------------------------------------------------------------------------------------

/**
 * **[UNSAFE]** Gets a canvas element by id.
 *
 * @category constructors
 * @since 0.0.1
 */
export const unsafeGetCanvasElementById: (id: string) => HTMLCanvasElement = id =>
  document.getElementById(id) as HTMLCanvasElement

/**
 * **[UNSAFE]** Gets the 2D graphics context for a canvas element.
 *
 * @category constructors
 * @since 0.0.1
 */
export const unsafeGetContext2D: (canvas: HTMLCanvasElement) => CanvasRenderingContext2D = c =>
  c.getContext('2d') as CanvasRenderingContext2D

/**
 * Gets an canvas element by id, or `None` if the element does not exist or is not an
 * instance of `HTMLCanvasElement`.
 *
 * @category constructors
 * @since 0.0.1
 */
export const getCanvasElementById: (id: string) => IO.IO<O.Option<HTMLCanvasElement>> = id => () => {
  const canvas = unsafeGetCanvasElementById(id)
  return canvas instanceof HTMLCanvasElement ? O.some(canvas) : O.none
}

// -------------------------------------------------------------------------------------
// combinators
// -------------------------------------------------------------------------------------

/**
 * Gets the 2D graphics context for a canvas element.
 *
 * @category combinators
 * @since 0.0.1
 */
export const getContext2D: Html<CanvasRenderingContext2D> = c => IO.of(unsafeGetContext2D(c))

/**
 * Gets the canvas width in pixels.
 *
 * @category combinators
 * @since 0.0.1
 */
export const getWidth: Html<number> = c => () => c.width

/**
 * Sets the width of the canvas in pixels.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setWidth: (width: number) => Html<HTMLCanvasElement> = w => c => () => {
  c.width = w
  return c
}

/**
 * Gets the canvas height in pixels.
 *
 *  @category combinators
 * @since 0.0.1
 */
export const getHeight: Html<number> = c => () => c.height

/**
 * Sets the height of the canvas in pixels.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setHeight: (height: number) => Html<HTMLCanvasElement> = h => c => () => {
  c.height = h
  return c
}

/**
 * Gets the dimensions of the canvas in pixels.
 *
 * @category combinators
 * @since 0.0.1
 */
export const getDimensions: Html<CanvasDimensions> = c =>
  sequenceS(IO.Apply)({ height: getHeight(c), width: getWidth(c) })

/**
 * Sets the dimensions of the canvas in pixels.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setDimensions: (dimensions: CanvasDimensions) => Html<HTMLCanvasElement> = d =>
  pipe(
    setWidth(d.width),
    R.chain(() => setHeight(d.height))
  )

/**
 * Create a data URL for the canvas.
 *
 * @category combinators
 * @since 0.0.1
 */
export const toDataURL: Html<string> = c => () => c.toDataURL()

/**
 * Sets the current fill style for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setFillStyle: (
  style: string | CanvasGradient | CanvasPattern
) => Render<CanvasRenderingContext2D> = s => ctx => () => {
  ctx.fillStyle = s
  return ctx
}

/**
 * Sets the current global alpha for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setGlobalAlpha: (alpha: number) => Render<CanvasRenderingContext2D> = a => ctx => () => {
  ctx.globalAlpha = a
  return ctx
}

/**
 * Sets the current global composite operation type for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setGlobalCompositeOperation: (
  compositeOperation: GlobalCompositeOperation
) => Render<CanvasRenderingContext2D> = gco => ctx => () => {
  ctx.globalCompositeOperation = gco
  return ctx
}

/**
 * Sets the current line cap type for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setLineCap: (cap: LineCap) => Render<CanvasRenderingContext2D> = c => ctx => () => {
  ctx.lineCap = c
  return ctx
}

/**
 * Sets the current line dash offset, or "phase", for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setLineDashOffset: (offset: number) => Render<CanvasRenderingContext2D> = o => ctx => () => {
  ctx.lineDashOffset = o
  return ctx
}

/**
 * Sets the current line join type for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setLineJoin: (join: LineJoin) => Render<CanvasRenderingContext2D> = j => ctx => () => {
  ctx.lineJoin = j
  return ctx
}

/**
 * Sets the current line width for the canvas context in pixels.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setLineWidth: (width: number) => Render<CanvasRenderingContext2D> = w => ctx => () => {
  ctx.lineWidth = w
  return ctx
}

/**
 * Sets the current miter limit for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setMiterLimit: (limit: number) => Render<CanvasRenderingContext2D> = l => ctx => () => {
  ctx.miterLimit = l
  return ctx
}

/**
 * Sets the current stroke style for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setStrokeStyle: (style: string) => Render<CanvasRenderingContext2D> = s => ctx => () => {
  ctx.strokeStyle = s
  return ctx
}

/**
 * Begin a path on the canvas.
 *
 * @category combinators
 * @since 0.0.1
 */
export const beginPath: Render<CanvasRenderingContext2D> = ctx => () => {
  ctx.beginPath()
  return ctx
}

/**
 * Closes the current canvas path.
 *
 * @category combinators
 * @since 0.0.1
 */
export const closePath: Render<CanvasRenderingContext2D> = ctx => () => {
  ctx.closePath()
  return ctx
}

/**
 * Creates a linear `CanvasGradient` object.
 *
 * @category combinators
 * @since 0.0.1
 */
export const createLinearGradient: (
  x0: number,
  y0: number,
  x1: number,
  y1: number
) => Render<CanvasGradient> = (x0, y0, x1, y1) => ctx => () => ctx.createLinearGradient(x0, y0, x1, y1)

/**
 * Creates a radial `CanvasGradient` object.
 *
 * @category combinators
 * @since 0.0.1
 */
export const createRadialGradient: (
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number
) => Render<CanvasGradient> = (x0, y0, r0, x1, y1, r1) => ctx => () =>
  ctx.createRadialGradient(x0, y0, r0, x1, y1, r1)

/**
 * Draws a focus ring around the current or given path, if the specified element is focused.
 *
 * @category combinators
 * @since 0.0.1
 */
export const drawFocusIfNeeded: (element: HTMLElement, path?: Path2D) => Render<CanvasRenderingContext2D> =
  (el, p) => ctx => () => {
    if (typeof p !== 'undefined') {
      ctx.drawFocusIfNeeded(p, el)
    } else {
      ctx.drawFocusIfNeeded(el)
    }
    return ctx
  }

/**
 * Fill the current path on the canvas.
 *
 * @category combinators
 * @since 0.0.1
 */
export const fill: (fillRule?: FillRule, path?: Path2D) => Render<CanvasRenderingContext2D> =
  (f, p) => ctx => () => {
    if (typeof p !== 'undefined') {
      ctx.fill(p, f)
    } else if (typeof f !== 'undefined') {
      ctx.fill(f)
    } else {
      ctx.fill()
    }
    return ctx
  }

/**
 * Gets the current line dash pattern for the canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const getLineDash: Render<ReadonlyArray<number>> = ctx => () => RA.fromArray(ctx.getLineDash())

/**
 * Move the canvas path to the specified point while drawing a line segment.
 *
 * @category combinators
 * @since 0.0.1
 */
export const lineTo: (point: Vec) => Render<CanvasRenderingContext2D> = p => ctx => () => {
  ctx.lineTo(p[0], p[1])
  return ctx
}

/**
 * Move the canvas path to the specified point without drawing a line segment.
 *
 * @category combinators
 * @since 0.0.1
 */
export const moveTo: (point: Vec) => Render<CanvasRenderingContext2D> = p => ctx => () => {
  ctx.moveTo(p[0], p[1])
  return ctx
}

/**
 * Restore the previous canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const restore: Render<CanvasRenderingContext2D> = ctx => () => {
  ctx.restore()
  return ctx
}

/**
 * Apply rotation to the current canvas context transform.
 *
 * @category combinators
 * @since 0.0.1
 */
export const rotate: (angle: number) => Render<CanvasRenderingContext2D> = a => ctx => () => {
  ctx.rotate(a)
  return ctx
}

/**
 * Save the current canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const save: Render<CanvasRenderingContext2D> = ctx => () => {
  ctx.save()
  return ctx
}

/**
 * Sets the current line dash pattern used when stroking lines.
 *
 * @category combinators
 * @since 0.0.1
 */
export const setLineDash: (segments: ReadonlyArray<number>) => Render<CanvasRenderingContext2D> =
  ss => ctx => () => {
    ctx.setLineDash(RA.toArray(ss))
    return ctx
  }

/**
 * Stroke the current path on the canvas.
 *
 * @category combinators
 * @since 0.0.1
 */
export const stroke: (path?: Path2D) => Render<CanvasRenderingContext2D> = p => ctx => () => {
  if (typeof p !== 'undefined') {
    ctx.stroke(p)
  } else {
    ctx.stroke()
  }
  return ctx
}

/**
 * Add a single color stop to a `CanvasGradient` object.
 *
 * @category combinators
 * @since 0.0.1
 */
export const addColorStop: (offset: number, color: string) => Gradient<CanvasGradient> =
  (o, c) => g => () => {
    g.addColorStop(o, c)
    return g
  }

/**
 * Convenience function for drawing a filled path.
 *
 * @category combinators
 * @since 0.0.1
 */
export const fillPath: <A>(f: Render<A>) => Render<A> = f =>
  pipe(
    beginPath,
    R.chain(() => f),
    R.chainFirst(() => fill())
  )

/**
 * Convenience function for drawing a stroked path.
 *
 * @category combinators
 * @since 0.0.1
 */
export const strokePath: <A>(f: Render<A>) => Render<A> = f =>
  pipe(
    beginPath,
    R.chain(() => f),
    R.chainFirst(() => stroke())
  )

/**
 * A convenience function which allows for running an action while preserving the existing
 * canvas context.
 *
 * @category combinators
 * @since 0.0.1
 */
export const withContext: <A>(f: Render<A>) => Render<A> = f =>
  pipe(
    save,
    R.chain(() => f),
    R.chainFirst(() => restore)
  )

// -------------------------------------------------------------------------------------
// utils
// -------------------------------------------------------------------------------------

/**
 * Executes a `Render` effect for a canvas with the specified `canvasId`, or `onCanvasNotFound()` if a canvas with
 * the specified `canvasId` does not exist.
 *
 * @since 0.0.1
 */
export const renderTo =
  (canvasId: string, onCanvasNotFound: () => IO.IO<void>) =>
  <A>(r: Render<A>): IO.IO<void> =>
    pipe(getCanvasElementById(canvasId), IO.chain(O.fold(onCanvasNotFound, flow(getContext2D, IO.chain(r)))))
