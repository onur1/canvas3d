import * as assert from 'assert'
import * as _ from '../src/Path3D'

const deepStrictEqual = <A>(actual: A, expected: A) => {
  assert.deepStrictEqual(actual, expected)
}

describe('Path3D', () => {
  it('moveTo', () => {
    deepStrictEqual(_.moveTo([4, 55, 330])([]), [[[4, 55, 330]]])
    deepStrictEqual(_.moveTo([4, 55, 330])([[[4, 55, 330]]]), [[[4, 55, 330]], [[4, 55, 330]]])
  })
  it('lineTo', () => {
    deepStrictEqual(_.lineTo([4, 55, 330])([]), [[[4, 55, 330]]])
    deepStrictEqual(_.lineTo([3, 5, 10])([[[4, 55, 330]]]), [
      [
        [4, 55, 330],
        [3, 5, 10],
      ],
    ])
  })
  it('closePath', () => {
    let p1: _.Path3D = [
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
    ]
    p1 = _.lineTo([7, 8, 9])(p1)
    p1 = _.closePath(p1)
    deepStrictEqual(p1, [
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [1, 2, 3],
      ],
      [[1, 2, 3]],
    ])
    deepStrictEqual(_.closePath([]), [])
    deepStrictEqual(_.closePath([[[1, 2, 3]]]), [[[1, 2, 3]]])
    deepStrictEqual(
      _.closePath([
        [
          [1, 2, 3],
          [1, 2, 3],
        ],
      ]),
      [
        [
          [1, 2, 3],
          [1, 2, 3],
        ],
      ]
    )
  })
})
