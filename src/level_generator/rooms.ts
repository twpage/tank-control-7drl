import * as ROT from 'rot-js'

// let _id = Math.floor(ROT.RNG.getUniform()*9999)
// function idGenerator() : number {
//     _id += 1
//     return _id
// }
import { generateID, xyToKey, keyToXY, isCoordinateInListOfCoordinates } from '../brew_components/utils'
import { Coordinate } from '../brew_components/coordinate'

export class Rectangle {
    id: number
    constructor(public x: number, public y: number, public width: number, public height : number) {
        this.id = generateID()
    }

    right() : number {
        return this.x + this.width - 1
    }

    bottom(): number {
        return this.y + this.height - 1
    }

    left(): number { return this.x }
    top(): number { return this.y }
    
    area(): number { return this.width * this.height }

    isPointInside(xy: Coordinate) : boolean {
        return ((xy.x > this.x) && (xy.x < this.right()) && (xy.y > this.y) && (xy.y < this.bottom()))
    }

    // isPointInside(xy: Coordinate) : boolean {
    //     return ((xy.x >= this.x) && (xy.x <= this.right()) && (xy.y >= this.y) && (xy.y <= this.bottom()))
    // }

    checkIntersection_Strict(other_rect: Rectangle) : boolean {
        if (
            (this.right() < other_rect.left()) ||
            (other_rect.right() < this.left()) ||
            (this.bottom() < other_rect.top()) ||
            (other_rect.bottom() < this.top())
        ) {
            return false
        } else {
            return true
        }
    }

    checkIntersection_AllowPerimeter(other_rect: Rectangle) : boolean {
        if (
            (this.right() <= other_rect.left()) ||
            (other_rect.right() <= this.left()) ||
            (this.bottom() <= other_rect.top()) ||
            (other_rect.bottom() <= this.top())
        ) {
            return false
        } else {
            return true
        }
    }

    // checkOverlap(other_rect : Rectangle) : boolean {
    //     return this.getCorners().some((xy) => {
    //         return other_rect.isPointInside(xy)
    //     })
    // }
    
    contains(other_rect: Rectangle) : boolean {
        return other_rect.getCorners().every((xy) => {
            return this.isPointInside(xy)
        })
    }

    getPerimeter() : Array<Coordinate> {
        let walls : Array<Coordinate> = []
        for (let x = 0; x < this.width; x++) {
            walls.push(new Coordinate(x + this.x, this.y))
            walls.push(new Coordinate(x + this.x, this.bottom()))
        }

        for (let y = 1; y < this.height - 1; y++) {
            walls.push(new Coordinate(this.x, y + this.y))
            walls.push(new Coordinate(this.right(), y + this.y))
        }

        return walls
    }

    getInterior() : Array<Coordinate> {
        let floors : Array<Coordinate> = []
        for (let x = this.x + 1; x < this.right(); x++) {
            for (let y = this.y + 1; y < this.bottom(); y++) {
                floors.push(new Coordinate(x, y))
            }
        }
        return floors
    }

    getCorners() : Array<Coordinate> {
        return [
            new Coordinate(this.x, this.y),
            new Coordinate(this.x, this.bottom()),
            new Coordinate(this.right(), this.y),
            new Coordinate(this.right(), this.bottom()),
        ]
    }

    isCorner(xy: Coordinate) : boolean {
        let corners = this.getCorners()
        return corners.some((corner_xy) => {
            return (corner_xy.compare(xy))
        })
    }

    getPerimeter_NoCorners() : Array<Coordinate> {
        return this.getPerimeter().filter((xy) => {
            return (!(this.isCorner(xy)))
        })
    }
}

export interface IDoor {
    from_area_id: number,
    to_area_id: number,
    xy: Coordinate,
}

export class Room {
    id: number
    doors: Array<IDoor>
    constructor(public bounding_rectangle: Rectangle) {
            this.id = generateID()           
            this.doors = []
    }

    addDoor(door: IDoor) {
        this.doors.push(door)
    }

    getFloors () : Array<Coordinate> {
        throw new Error("does not implement getFloors")
    }

    getWalls () : Array<Coordinate> {
        throw new Error("does not implement getFloors")
    }

    getCorners () : Array<Coordinate> {
        throw new Error("does not implement getFloors")
    }
    
    isCorner (xy: Coordinate) : boolean {
        let corners = this.getCorners()
        return corners.some((corner_xy) => {
            return (corner_xy.compare(xy))
        })
    }
    
    getWallsOnly () : Array<Coordinate> {
        return this.getWalls().filter((xy) => {
            return (!(this.isCorner(xy)))
        })
    }
}

export class RectangleRoom extends Room {
    getFloors () : Array<Coordinate> {
        return this.bounding_rectangle.getInterior()
    }

    getWalls () : Array<Coordinate> {
        return this.bounding_rectangle.getPerimeter()
    }

    getCorners () : Array<Coordinate> {
        return this.bounding_rectangle.getCorners()
    }

    isCorner (xy: Coordinate): boolean {
        return this.bounding_rectangle.isCorner(xy)
    }

}

export class CrossRoom extends Room {
    constructor(public bounding_rectangle: Rectangle, public rect_tall : Rectangle, public rect_wide : Rectangle) {
        super(bounding_rectangle)

    }
    getFloors () : Array<Coordinate> {
        let floor_keys = this.rect_wide.getInterior().map((xy) => {
            return xyToKey(xy)
        })

        let tall_keys = this.rect_tall.getInterior().map((xy) => {
            return xyToKey(xy)
        })

        
        for (let tall_key of tall_keys) {
            if (floor_keys.indexOf(tall_key) == -1) {
                floor_keys.push(tall_key)
            }
        }

        return floor_keys.map((key) => { return keyToXY(key)})
    }

    getWalls () : Array<Coordinate> {
        let walls : Array<Coordinate> = []
        let wide_walls = this.rect_wide.getPerimeter()
        let tall_walls = this.rect_tall.getPerimeter()

        for (let xy of wide_walls) {
            if (!(this.rect_tall.isPointInside(xy))) {
                walls.push(xy)
            }
        }

        let wall_keys = walls.map((xy) => { return xyToKey(xy) })

        for (let xy of tall_walls) {
            if ((!(this.rect_wide.isPointInside(xy))) && (wall_keys.indexOf(xyToKey(xy)) == -1)) {
                walls.push(xy)
            }
        }

        return walls
        // return wide_walls.concat(tall_walls)
    }

    getCorners () : Array<Coordinate> {
        let corners : Array<Coordinate> = []
        corners = corners.concat(this.rect_tall.getCorners()).concat(this.rect_wide.getCorners())
        return corners
    }

}

// export class CircleRoom extends Room {
//     radius: number
//     center_x: number
//     center_y: number
//     private walls: Array<Coordinate>

//     constructor(public bounding_rectangle: Rectangle) {
//         super(bounding_rectangle)
//         let r = Math.floor(Math.min(bounding_rectangle.height, bounding_rectangle.width) / 2)
//         this.radius = r
//         this.center_x = bounding_rectangle.x + r
//         this.center_y = bounding_rectangle.y + r
//         this.walls = []
//     }

//     getCorners() : Array<Coordinate> { return [] }
//     getWalls() : Array<Coordinate> {
//         if (this.walls.length == 0) {
//             this.walls = getBresenhamCirclePoints(this.center_x, this.center_y, this.radius)
//         }
//         return this.walls
//     }

//     // getFloors() : Array<Coordinate> {

//     // }
// }

// function getBresenhamCirclePoints (x0, y0, radius) : Array<Coordinate> {
//     // return an array of [x, y] integer coordinate pairs that describe an ellipse
//     // http://en.wikipedia.org/wiki/Midpoint_circle_algorithm

//     let x = radius
//     let y = 0
//     let radiusError = 1 - x

//     let points : Array<Coordinate> = []

//     while (x >= y) {
//         points.push(new Coordinate(x + x0, y + y0))
//         points.push(new Coordinate(y + x0, x + y0))
//         points.push(new Coordinate(-x + x0, y + y0))
//         points.push(new Coordinate(-y + x0, x + y0))
//         points.push(new Coordinate(-x + x0, -y + y0))
//         points.push(new Coordinate(-y + x0, -x + y0))
//         points.push(new Coordinate(x + x0, -y + y0))
//         points.push(new Coordinate(y + x0, -x + y0))
//         y += 1

//         if (radiusError < 0) {
//             radiusError += 2 * y + 1

//         } else {
//             x--
//             radiusError += 2 * (y - x + 1)
//         }
//     }

//     return points
// }


export class OvalRoom extends Room {
    radius_a: number
    radius_b: number
    center_x: number
    center_y: number
    private walls: Array<Coordinate>
    private floors: Array<Coordinate>

    constructor(public bounding_rectangle: Rectangle) {
        super(bounding_rectangle)
        this.radius_a = Math.floor((bounding_rectangle.width / 2.0) - 0.5)
        this.radius_b = Math.floor((bounding_rectangle.height / 2.0) - 0.5)
        this.center_x = bounding_rectangle.left() + this.radius_a
        this.center_y = bounding_rectangle.top() + this.radius_b
        this.walls = []
        this.floors = []
    }

    getCorners() : Array<Coordinate> { return [] }
    getWalls() : Array<Coordinate> {
        if (this.walls.length == 0) {
            this.walls = getMcIlroyEllipsePoints(this.center_x, this.center_y, this.radius_a, this.radius_b)
        }
        return this.walls
    }

    getFloors() : Array<Coordinate> {
        if (this.floors.length == 0) {
            this.floors = floodFillFloors(new Coordinate(this.center_x, this.center_y), this.getWalls())
        } 
        return this.floors
    }
}

function floodFillFloors(start_xy: Coordinate, walls: Array<Coordinate>) : Array<Coordinate> {
    let floors : Array<Coordinate> = []
    // let floor_keys : Array<number> = []
    // let wall_keys : Array<number> = walls.map((xy) => { return xyToKey(xy) })
    // let 
    
    let flood_fn = (xy: Coordinate) => {
        // stop condition: already visited
        if (isCoordinateInListOfCoordinates(xy, floors)) {
            return
        }

        // stop condition: wall
        if (isCoordinateInListOfCoordinates(xy, walls)) {
            return
        }

        // otherwise, record it
        floors.push(xy)

        // move on
        for (let neighbor_xy of xy.getAdjacent()) {
            flood_fn(neighbor_xy)
        }
    }

    flood_fn(start_xy)
    return floors
}

function getMcIlroyEllipsePoints (xc: number , yc: number, a: number, b: number) : Array<Coordinate> {
    // return an array of [x, y] integer coordinate pairs that describe an ellipse
    // http://enchantia.com/graphapp/doc/tech/ellipses.html

    let x = 0
    let y = b
    let a2 = a*a
    let b2 = b*b
    let crit1 = -(a2/4 + a%2 + b2)
    let crit2 = -(b2/4 + b%2 + a2)
    let crit3 = -(b2/4 + b%2)
    let t = -a2*y
    let dxt = 2*b2*x
    let dyt = -2*a2*y
    let d2xt = 2*b2
    let d2yt = 2*a2

    let points : Array<Coordinate> = []

    while ((y >= 0) && (x <= a)) {
        points.push(new Coordinate(xc+x, yc+y))
        
        if ((x != 0) || (y != 0)) {
            points.push(new Coordinate(xc-x, yc-y))
        }
        if ((x != 0) && (y != 0)) {
            points.push(new Coordinate(xc+x, yc-y))
            points.push(new Coordinate(xc-x, yc+y))
        }

        if ((t + b2*x <= crit1) || (t + a2*y <= crit3)) {
            // incx()
            x += 1
            dxt += d2xt
            t += dxt

        } else if (t - a2*y > crit2) {
            // incy()
            y -= 1
            dyt += d2yt
            t += dyt

        } else {
            // incx()
            x += 1
            dxt += d2xt
            t += dxt

            // incy()
            y -= 1
            dyt += d2yt
            t += dyt
        }
    }

    return points
}

export class CorridorRoom extends Room {
    // private blocks: Array<Coordinate>
    private floors: Array<Coordinate>

    constructor(public bounding_rectangle: Rectangle, private openings_xy_list: Array<Coordinate>) {
        super(bounding_rectangle)
        // this.blocks = []
        this.floors = []
        this.initCorridors()
    }

    getCorners() : Array<Coordinate> { return [] }
    getWalls() : Array<Coordinate> {
        return this.bounding_rectangle.getPerimeter()
    }

    getFloors() : Array<Coordinate> {
        return this.floors
    }

    initCorridors() {
        let fn_passable = (x: number, y: number) : boolean => {
            // if (ROT.RNG.getUniform() < 0.125) {
            //     return false
            // }
            let xy = new Coordinate(x, y)
            if (isCoordinateInListOfCoordinates(xy, this.openings_xy_list)) {
                return true
            }

            if ((x <= this.bounding_rectangle.x) || (y <= this.bounding_rectangle.y) || (x >= this.bounding_rectangle.right()) || (y >= this.bounding_rectangle.bottom())) {
                return false
            }
            // let xy = new Coordinate(x, y)
            return true
        }
        let all_paths : Array<Coordinate> = []
        let local_path : Array<Coordinate> 

        let fn_update_path = (x: number, y: number) : void => {
            let xy = new Coordinate(x, y)
            if (!(isCoordinateInListOfCoordinates(xy, local_path))) {
                local_path.push(xy)
            }
        }

        for (let from_xy of this.openings_xy_list) {
            let other_openings = this.openings_xy_list.filter((xy) => { return (!(xy.compare(from_xy))) })

            for (let to_xy of other_openings) {
                let fwd_path : Array<Coordinate> = []
                let is_valid = false
                while (!(is_valid)) {
                    is_valid = true

                    let random_x = Math.floor(ROT.RNG.getUniform()*this.bounding_rectangle.right()) + this.bounding_rectangle.x
                    let random_y = Math.floor(ROT.RNG.getUniform()*this.bounding_rectangle.bottom()) + this.bounding_rectangle.y
                    // let random_xy = new Coordinate(random_x, random_y)

                    local_path = []
                    let astar = new ROT.Path.AStar(from_xy.x, from_xy.y, fn_passable, { topology: 4})
                    astar.compute(random_x, random_y, fn_update_path)

                    if (local_path.length == 0) {
                        is_valid = false
                        continue
                    }

                    fwd_path = [].concat(local_path)

                    local_path = []
                    astar = new ROT.Path.AStar(random_x, random_y, fn_passable, { topology: 4})
                    astar.compute(to_xy.x, to_xy.y, fn_update_path)

                    if (local_path.length == 0) {
                        is_valid = false
                        continue
                    }
                    
                    all_paths = all_paths.concat(local_path).concat(fwd_path)
                }
                

                
            }
        }

        this.floors = all_paths
    }
}
