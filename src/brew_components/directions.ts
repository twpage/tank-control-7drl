import * as Brew from "../brew"

export const UP = new Brew.Coordinate(0, -1)
export const DOWN = new Brew.Coordinate(0, 1)
export const LEFT = new Brew.Coordinate(-1, 0)
export const RIGHT = new Brew.Coordinate(1, 0)

export const UP_LEFT = new Brew.Coordinate(-1, -1)
export const DOWN_LEFT = new Brew.Coordinate(-1, 1)
export const UP_RIGHT = new Brew.Coordinate(1, -1)
export const DOWN_RIGHT = new Brew.Coordinate(1, 1)
// export const N = Brew.Directions.UP
// export const S = Brew.Directions.DOWN
// export const E = Brew.Directions.RIGHT
// export const W = Brew.Directions.LEFT
// export const NE = Brew.Directions.UP_RIGHT
// export const NW = Brew.Directions.UP_LEFT
// export const SE = Brew.Directions.DOWN_RIGHT
// export const SW = Brew.Directions.DOWN_LEFT
