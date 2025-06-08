import * as ROT from 'rot-js'
import * as Brew from '../brew'
import { Coordinate } from '../brew_components/coordinate'

let init_id = Math.floor(ROT.RNG.getUniform() * 999) + 1
export function generateID() : number {
    init_id += 1
    return init_id
}

export interface Dict<T> {
    [key: number]: T
}


// let MAX_GRID_SIZE = Brew.Config.MAX_GRID_SIZE

export function xyToKey(xy: Coordinate) : number {
    return (xy.y * Brew.Config.MAX_GRID_SIZE) + xy.x
} 

export function keyToXY(key: number) : Coordinate {
    return new Coordinate(key % Brew.Config.MAX_GRID_SIZE, Math.floor(key / Brew.Config.MAX_GRID_SIZE))
}

export function x_and_yToKey(x : number, y: number) : number {
    return (y * Brew.Config.MAX_GRID_SIZE) + x
} 

export function adjacentKeys(key: number) : number[] {
    // returns keys of 4 adjacent xy coords
    // TODO: cache this
    return keyToXY(key).getAdjacent().map((xy:Brew.Coordinate, index, array) => { return xyToKey(xy) })
}

export function randomOf(some_array: Array<any>, useROT : boolean = true) : any {
    if (!(some_array.length)) { return null }
    if (useROT) {
        return some_array[Math.floor(ROT.RNG.getUniform() * some_array.length)]
    } else {
        return some_array[Math.floor(Math.random() * some_array.length)]
    }
}

export function randomize(some_array: Array<any>, useROT : boolean = true) : Array<any> {
    let result = []
    while (some_array.length) {
        let index = some_array.indexOf(randomOf(some_array, useROT))
        result.push(some_array.splice(index, 1)[0])
    }
    
    return result
}

export function remove(arr: Array<any>, element: any) : void {
    let index = arr.indexOf(element)
    if (index > -1) {
        arr.splice(index, 1)
    }
}

export function mod(m: number, n: number) : number {
    return ((m % n) + n) % n
}

export function clone(obj) {
    // https://stackoverflow.com/questions/728360/most-elegant-way-to-clone-a-javascript-object
    var copy;

    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // handle coords
    if (obj instanceof Brew.Coordinate) {
        return obj.clone()
    }
    
    // Handle Date
    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}



export function getElementsOfEnum(enum_thing: any) : number[] {
    let enum_numbers : number[] = []
    for (let enum_item in enum_thing) {
        if (!(isNaN(Number(enum_item)))) {
            let enum_number : number = Number(enum_item)
            enum_numbers.push(enum_number)
        }
    }
    return enum_numbers
}

export function getRandomInt(a: number, b: number) : number {
    // return random integer [A, B]
    return Math.floor(ROT.RNG.getUniform() * (b - a + 1)) + a
}

// enum DiffOrUnion {
//     Diff,
//     Union
// }

// function runDiffAndUnion(which: DiffOrUnion, list_a: Array<Brew.Coordinate>, list_b: Array<Brew.Coordinate>) : Array<Brew.Coordinate> {
//     let key_fn = (value, index, array) : number => { return xyToKey(value) }
//     let keys_a : Array<number> = list_a.map(key_fn)
//     let keys_b : Array<number> = list_b.map(key_fn)
    
//     let keys_diff : Array<number> = []
//     let keys_union : Array<number> = []
    
//     keys_a.forEach((value, index, array) => {
//         if (keys_b.indexOf(value) > -1) {
//             keys_union.push(value)
//         } else {
//             keys_diff.push(value)
//         }
//     })
//     // console.log(`{0} new keys`, keys_diff.length)
    
//     keys_b.forEach((value, index, array) => {
//         if (keys_union.indexOf(value) > -1) {
//             // skip
//             ;
//         } else {
//             keys_diff.push(value)
//         }
//     })
//     // console.log(`{0} new keys`, keys_diff.length)
    
//     if (which == DiffOrUnion.Diff) {
//         let xy_diff : Array<Brew.Coordinate> = keys_diff.map((value, index, array) : Brew.Coordinate => {
//             return keyToXY(value)
//         })

//         return xy_diff
        
//     } else {
//         let xy_union : Array<Brew.Coordinate> = keys_union.map((value, index, array) : Brew.Coordinate => {
//             return keyToXY(value)
//         })

//         return xy_union
//     }
    
// }

// export function diffOfCoordinateArrays(list_a: Array<Brew.Coordinate>, list_b: Array<Brew.Coordinate>) : Array<Brew.Coordinate> {
//     // return elements of A not in B and B not in A
//     return runDiffAndUnion(DiffOrUnion.Diff, list_a, list_b)
// }

// export function unionOfCoordinateArrays(list_a: Array<Brew.Coordinate>, list_b: Array<Brew.Coordinate>) : Array<Brew.Coordinate> {
//     // return elements of A + B
//     return runDiffAndUnion(DiffOrUnion.Union, list_a, list_b)
// }

export function getDirectionFromKeycode(keycode: number): Brew.Coordinate {
    let direction_xy: Brew.Coordinate
    
    if (Brew.KeyMap.MoveForward.indexOf(keycode) > -1) {
        direction_xy = Brew.Directions.UP
    } else if (Brew.KeyMap.MoveBackward.indexOf(keycode) > -1) {
        direction_xy = Brew.Directions.DOWN
    } else if (Brew.KeyMap.RotateBodyCW.indexOf(keycode) > -1) {
        direction_xy = Brew.Directions.RIGHT
    } else if (Brew.KeyMap.RotateBodyCCW.indexOf(keycode) > -1) {
        direction_xy = Brew.Directions.LEFT
    } else {
        return null
    }
            
    return direction_xy
}

export function dist2d(from_xy: Coordinate, to_xy: Coordinate) : number {
    let xdiff = (from_xy.x - to_xy.x)
    let ydiff = (from_xy.y - to_xy.y)
    
    return Math.sqrt(xdiff*xdiff + ydiff*ydiff)
}

function isInteger (value: number) : boolean {
    return typeof value === 'number' && 
        isFinite(value) && 
        Math.floor(value) === value
}

export function getLineBetweenPoints (start_xy: Brew.Coordinate, end_xy: Brew.Coordinate) : Array<Brew.Coordinate> { 
    // uses bresenham's line algorithm

    if ((!(start_xy)) || (!(end_xy))) {
        console.error("invalid coords passed to getLineBetweenPoints")
    }

    let non_integer = [start_xy.x, start_xy.y, end_xy.x, end_xy.y].some((coord_value: number) => {
        return (!(isInteger(coord_value)))
    })

    if (non_integer) {
        console.error("non-integer coordinates passed in")
    }
        
    // Bresenham's line algorithm
    let x0 : number = start_xy.x
    let y0 : number = start_xy.y
    let x1 : number = end_xy.x
    let y1 : number = end_xy.y

    let dy = y1 - y0
    let dx = x1 - x0
    let t = 0.5
    let points_lst = [new Brew.Coordinate(x0, y0)]
    let m : number
    
    if (start_xy.compare(end_xy)) {
        return points_lst
    }
    
    if (Math.abs(dx) > Math.abs(dy)) {
        m = dy / (1.0 * dx)
        t += y0
        if (dx < 0) {
            dx = -1
        } else {
            dx = 1
        }
        
        m *= dx

        while (x0 != x1) {
            x0 += dx
            t += m
            // points_lst.push({x: x0, y: Math.floor(t)}) # Coordinates(x0, int(t)))
            points_lst.push(new Brew.Coordinate(x0, Math.floor(t)))
        }
    } else {
        m = dx / (1.0 * dy)
        t += x0
        
        // dy = if (dy < 0) then -1 else 1
        if (dy < 0) {
            dy = -1 
        } else {
            dy = 1
        }
        
        m *= dy
        
        while (y0 != y1) {
            y0 += dy
            t += m
            // points_lst.push({x: Math.floor(t), y: y0}) # Coordinates(int(t), y0))
            points_lst.push(new Brew.Coordinate(Math.floor(t), y0))
        }
    }
    
    return points_lst
}

export function getSquarePoints (center_xy: Coordinate, size: number): Array<Coordinate> {
    let points : Array<Coordinate> = []

    if (size <= 0) {
        points.push(center_xy)
    } else {
        let top_y = center_xy.y - size
        let bottom_y = center_xy.y + size
        let left_x = center_xy.x - size
        let right_x = center_xy.x + size
        
        // top and bottom (include corners)
        for (let x = left_x; x <= right_x; x++) {
            points.push(new Coordinate(x, top_y))
            points.push(new Coordinate(x, bottom_y))
        }

        // left and right sides (exclude corners)
        for (let y = top_y + 1; y < bottom_y; y++) {
            points.push(new Coordinate(left_x, y))
            points.push(new Coordinate(right_x, y))
        }
    }

    return points
}

export function getCirclePoints (center_xy : Coordinate, radius : number) : Coordinate[] {
    // Returns the points that make up the radius of a circle
    // http://en.wikipedia.org/wiki/Midpoint_circle_algorithm
    let x0 = center_xy.x
    let y0 = center_xy.y
    
    let point_lst = []
    
    let f = 1 - radius
    let ddF_x = 1
    let ddF_y = -2 * radius
    let x = 0
    let y = radius
    
    point_lst.push([x0, y0 + radius])
    point_lst.push([x0, y0 - radius])
    point_lst.push([x0 + radius, y0])
    point_lst.push([x0 - radius, y0])
    
    while (x < y) {
        if (f >= 0) {
            y -= 1
            ddF_y += 2
            f += ddF_y
        }
            
        x += 1
        ddF_x += 2
        f += ddF_x
        point_lst.push([x0 + x, y0 + y])
        point_lst.push([x0 - x, y0 + y])
        point_lst.push([x0 + x, y0 - y])
        point_lst.push([x0 - x, y0 - y])
        point_lst.push([x0 + y, y0 + x])
        point_lst.push([x0 - y, y0 + x])
        point_lst.push([x0 + y, y0 - x])
        point_lst.push([x0 - y, y0 - x])
    }
        
    let point_xy_lst = []
    point_lst.forEach((xy_arr, index, array) => {
        point_xy_lst.push(new Coordinate(xy_arr[0], xy_arr[1]))
    })

    return point_xy_lst
}

export function safe_color(rgb_val: number[]) {
    return rgb_val.map((c: number, index: number) => {
        return Math.floor(Math.max(0, Math.min(255, c)))
    })
}

export function getMonstersWithinRadius(level: Brew.Level, center_xy: Coordinate, radius: number) : Array<Brew.GridThings.Monster> {
    let dist : number
    return level.monsters.getAllThings().filter((mob: Brew.GridThings.Monster, index: number) => {
        dist = dist2d(mob.location, center_xy)
        return dist <= radius
    })
}

export function getBlastArea(level: Brew.Level, center_xy, radius: number) : Brew.CoordinateArea {
    // constrains an area based on radius and blocking walls

    let xy : Coordinate
    let terrain_at : Brew.GridThings.Terrain

    let fn_passable = (x: number, y: number) => {
        xy = new Coordinate(x, y)

        if (!(level.isValid(xy))) {
            return false
        }

        if (xy.compare(center_xy)) {
            return true
        }

        terrain_at = level.terrain.getAt(xy)
        return (!(terrain_at.blocks_flying))
    }

    let affected_list : Array<Coordinate> = []

    let fn_update = (x: number, y: number, r: number, intensity: number) => {
        if (r <= radius) {
            xy = new Coordinate(x, y)
            affected_list.push(xy)
        }
        return true
    }

    let rot_fov = new ROT.FOV.RecursiveShadowcasting(fn_passable, {})
    rot_fov.compute(center_xy.x, center_xy.y, radius, fn_update) 

    let blast_area = new Brew.CoordinateArea(affected_list)
    return blast_area
}

export function getMonstersWithinCoordinateArea(level: Brew.Level, coord_area: Brew.CoordinateArea) : Array<Brew.GridThings.Monster> {
    let affected_mobs : Array<Brew.GridThings.Monster> = []
    let monster_at : Brew.GridThings.Monster
    coord_area.getCoordinates().forEach((xy) => {
        monster_at = level.monsters.getAt(xy)
        if (monster_at) {
            affected_mobs.push(monster_at)
        }
    })

    return affected_mobs
}

// export function getMonstersWithinAffectedArea(level: Brew.Level, center_xy, radius: number) : Array<Brew.GridThings.Monster> { 
//     let affected_area = getBlastArea(level, center_xy, radius)
//     let affected_mobs : Array<Brew.GridThings.Monster> = []
//     let monster_at : Brew.GridThings.Monster

//     affected_area.getCoordinates().forEach((xy: Coordinate) => {
//         monster_at = level.monsters.getAt(xy)
//         if (monster_at) {
//             affected_mobs.push(monster_at)
//         }
//     })

//     return affected_mobs
// }

export function getPolarOffsetCoordinate(polar_theta: number, r_distance: number) : Coordinate {
    // assuming from origin 0,0

    let x = r_distance * Math.cos(polar_theta)
    let y = r_distance * Math.sin(polar_theta)
    x = roundToPrecision(x, 8)
    y = roundToPrecision(y, 8)
    let x_int = Math.floor(x)
    let y_int = Math.floor(y)

    let polar_xy = new Coordinate(x_int, y_int)
    return polar_xy
}
interface PolarCoordinate {
    dist_r: number,
    angle_theta: number,
}

export function xyToPolar (xy: Coordinate, origin_xy?: Coordinate ) : PolarCoordinate {
    if (!(origin_xy)) {
        origin_xy = new Coordinate(0, 0)
    }

    let xdiff = xy.x - origin_xy.x
    let ydiff = xy.y - origin_xy.y
    let polar_r = Math.sqrt((xdiff * xdiff) + (ydiff * ydiff))
    let polar_theta = Math.atan2(ydiff, xdiff)

    return {
        angle_theta: polar_theta,
        dist_r: polar_r
    }
}

export function getTradjectoryCoordinate(origin_xy: Coordinate, target_xy: Coordinate, distance: number) : Coordinate {
    // use polar coords to pick a distant tradjectory for a given target, based on an origination of force/blast/affect

    // convert target to polar coordinate based on origin
    let polar = xyToPolar(target_xy, origin_xy)
    
    let polar_r = polar.dist_r
    let polar_theta = polar.angle_theta

    // extend radius
    let new_r = polar_r + distance

    // re-calc relative x-y coord
    // let relative_x = new_r * Math.cos(polar_theta)
    // let relative_y = new_r * Math.sin(polar_theta)
    // let rel_xy = new Coordinate(Math.floor(relative_x), Math.floor(relative_y))
    let rel_xy = getPolarOffsetCoordinate(polar_theta, new_r)
    
    // re-calc actual x-y coord
    let new_xy = origin_xy.add(rel_xy)
    return new_xy
}

export function intersectionOfCoordinateLists(coords_a : Array<Coordinate>, coords_b: Array<Coordinate>) : Array<Coordinate> {
    let intersection : Array<Coordinate> = []

    // convert both arrays to number keys
    let keys_a  = coords_a.map((xy) => { return xyToKey(xy)})
    let keys_b  = coords_b.map((xy) => { return xyToKey(xy)})

    let intersect_keys = keys_a.filter((key_a) => {
        return (keys_b.indexOf(key_a) > -1)
    })

    intersection = intersect_keys.map((key) => { return keyToXY(key)})

    return intersection
}

export function isCoordinateInListOfCoordinates(xy: Coordinate, coords_a: Array<Coordinate>) : boolean {
    return (intersectionOfCoordinateLists([xy], coords_a).length > 0)
}

export function roundToPrecision(value: number, decimals: number) : number {
    let amount = Math.pow(10, decimals)

    return Math.round(value * amount) / amount
}