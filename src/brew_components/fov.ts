import * as Brew from "../brew"

// An array of transforms, each corresponding to one octant.
let transforms = [
    { xx:  1, xy:  0, yx:  0, yy:  1 },
    { xx:  1, xy:  0, yx:  0, yy: -1 },
    { xx: -1, xy:  0, yx:  0, yy:  1 },
    { xx: -1, xy:  0, yx:  0, yy: -1 },
    { xx:  0, xy:  1, yx:  1, yy:  0 },
    { xx:  0, xy:  1, yx: -1, yy:  0 },
    { xx:  0, xy: -1, yx:  1, yy:  0 },
    { xx:  0, xy: -1, yx: -1, yy:  0 }
];

export function symmetricRecursiveShadowcasting_Directional(cx, cy, transparent, reveal, facing_dir_xy: Brew.Coordinate) {
    let octants : number[] = []
    //  3|1
    // 7 * 5
    // 6 * 4
    //  2|0
    if (facing_dir_xy.compare(Brew.Directions.UP)) {
        octants = [3, 1]
    } else if (facing_dir_xy.compare(Brew.Directions.DOWN)) {
        octants = [2, 0]
    } else if (facing_dir_xy.compare(Brew.Directions.LEFT)) {
        octants = [7, 6]
    } else if (facing_dir_xy.compare(Brew.Directions.RIGHT)) {
        octants = [4, 5]
    } else {
        // console.warn("invalid facing direction")
        octants = [0, 1, 2, 3, 4, 5, 6, 7]
    }

    symmetricRecursiveShadowcasting(cx, cy, transparent, reveal, octants)
}

/**
 * Recursive shadowcasting algorithm.
 * This algorithm creates a field of view centered around (x, y).
 * Opaque tiles are treated as if they have beveled edges.
 * Transparent tiles are visible only if their center is visible, so the
 * algorithm is symmetric.
 * @param cx - x coordinate of center
 * @param cy - y coordinate of center
 * @param transparent - function that takes (x, y) as arguments and returns the transparency of that tile
 * @param reveal - callback function that reveals the tile at (x, y)
 */
export function symmetricRecursiveShadowcasting  (cx, cy, transparent, reveal, octants?: number[]) {
    if (!(octants)) {
        octants = [0, 1, 2, 3, 4, 5, 6, 7]
    }

    /**
     * Scan one row of one octant.
     * @param y - distance from the row scanned to the center
     * @param start - starting slope
     * @param end - ending slope
     * @param transform - describes the transfrom to apply on x and y; determines the octant
     */
    let scan = (y: number, start: number, end: number, transform: any) => {
        if (start >= end) {
            return
        }
        let xmin = Math.round((y - 0.5) * start)
        let xmax = Math.ceil((y + 0.5) * end - 0.5)
        for (let x = xmin; x <= xmax; x++) {
            let realx = cx + transform.xx * x + transform.xy * y
            let realy = cy + transform.yx * x + transform.yy * y
            if (transparent(realx, realy)) {
                if (x >= y * start && x <= y * end) {
                    reveal(realx, realy)
                }
            } else {
                if (x >= (y - 0.5) * start && x - 0.5 <= y * end) {
                    reveal(realx, realy)
                }
                scan(y + 1, start, (x - 0.5) / y, transform)
                start = (x + 0.5) / y
                if (start >= end) {
                    return
                }
            }
        }
        scan(y + 1, start, end, transform)
    }

    reveal(cx, cy)
    // Scan each octant
    for (var i = 0; i < 8; i++) {
        if (octants.indexOf(i) > -1) {
            scan(1, 0, 1, transforms[i])
        }
    }
}

// }
// window.shadowcast = function(cx, cy, transparent, reveal) {
//     'use strict';
//     /**
//      * Scan one row of one octant.
//      * @param y - distance from the row scanned to the center
//      * @param start - starting slope
//      * @param end - ending slope
//      * @param transform - describes the transfrom to apply on x and y; determines the octant
//      */
//     var scan = function(y, start, end, transform) {
//         if (start >= end) {
//             return;
//         }
//         var xmin = Math.round((y - 0.5) * start);
//         var xmax = Math.ceil((y + 0.5) * end - 0.5);
//         for (var x = xmin; x <= xmax; x++) {
//             var realx = cx + transform.xx * x + transform.xy * y;
//             var realy = cy + transform.yx * x + transform.yy * y;
//             if (transparent(realx, realy)) {
//                 if (x >= y * start && x <= y * end) {
//                     reveal(realx, realy);
//                 }
//             } else {
//                 if (x >= (y - 0.5) * start && x - 0.5 <= y * end) {
//                     reveal(realx, realy);
//                 }
//                 scan(y + 1, start, (x - 0.5) / y, transform);
//                 start = (x + 0.5) / y;
//                 if (start >= end) {
//                     return;
//                 }
//             }
//         }
//         scan(y + 1, start, end, transform);
//     };
//     // An array of transforms, each corresponding to one octant.
//     var transforms = [
//         { xx:  1, xy:  0, yx:  0, yy:  1 },
//         { xx:  1, xy:  0, yx:  0, yy: -1 },
//         { xx: -1, xy:  0, yx:  0, yy:  1 },
//         { xx: -1, xy:  0, yx:  0, yy: -1 },
//         { xx:  0, xy:  1, yx:  1, yy:  0 },
//         { xx:  0, xy:  1, yx: -1, yy:  0 },
//         { xx:  0, xy: -1, yx:  1, yy:  0 },
//         { xx:  0, xy: -1, yx: -1, yy:  0 }
//     ];
//     reveal(cx, cy);
//     // Scan each octant
//     for (var i = 0; i < 8; i++) {
//         scan(1, 0, 1, transforms[i]);
//     }
// };