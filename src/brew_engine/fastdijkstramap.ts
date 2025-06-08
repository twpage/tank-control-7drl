import * as Brew from "../brew"

export const MAX_INT = 1/0
let MAX_GRID_SIZE = Brew.Config.MAX_GRID_SIZE

export interface IDijkstraMap {
    [key: number] : number
}

interface IStorageMap {
    [key: number] : boolean
}

let flood_fill_fn = (x: number, y: number, level: Brew.Level, pathable_fn: IPathableFunction, local_map: IDijkstraMap, passable: IStorageMap, blocked: IStorageMap) => {
    // stop condition: out of bounds
    if (
        (x < 0) ||
        (y < 0) ||
        (x >= level.width) ||
        (y >= level.height)
    ) {
        return
    }

    let key = Brew.Utils.x_and_yToKey(x, y).toString()

    // stop condition: already visited
    if (local_map.hasOwnProperty(key)) {
        return
    }

    // stop condition: blocked
    if (blocked.hasOwnProperty(key)) {
        return
    }

    // stop condition: hit a wall
    let terrain_at = level.terrain.things[key]
    if (!(pathable_fn(terrain_at))) {
        blocked[key] = true
        return
    }

    // otherwise, set value 
    local_map[key] = MAX_INT

    // keep track of passable tiles
    passable[key] = true

    // recursion
    flood_fill_fn(x+1, y, level, pathable_fn, local_map, passable, blocked)
    flood_fill_fn(x-1, y, level, pathable_fn, local_map, passable, blocked)
    flood_fill_fn(x, y+1, level, pathable_fn, local_map, passable, blocked)
    flood_fill_fn(x, y-1, level, pathable_fn, local_map, passable, blocked)
    return
}

export interface IPathableFunction {
    (terrain_at: Brew.GridThings.Terrain) : boolean
}

export let PathFunctionWalkable : IPathableFunction
PathFunctionWalkable = function(terrain_at: Brew.GridThings.Terrain): boolean {
    return (!(terrain_at.blocks_walking))
}

export let PathFunctionFlyable : IPathableFunction
PathFunctionFlyable = function(terrain_at: Brew.GridThings.Terrain): boolean {
    return (!(terrain_at.blocks_flying))
}

export function setupDijkstraMap(level: Brew.Level, start_xy: Brew.Coordinate, pathable_fn: IPathableFunction) : IDijkstraMap {
    let djMap : IDijkstraMap = {}
    let blocked : IStorageMap = {}
    let passable : IStorageMap = {}

    // set all passable tiles to MAX-INT
    flood_fill_fn(start_xy.x, start_xy.y, level, pathable_fn, djMap, passable, blocked)

    // set target/goal to 0
    // djMap[Brew.Utils.x_and_yToKey(start_xy.x, start_xy.y)] = 0

    return djMap
}


function getAdjacentKeys(at_key: number) : number[] {
    return [at_key - 1, at_key + 1, at_key - MAX_GRID_SIZE, at_key + MAX_GRID_SIZE]
}

export function solveDijkstraMap(djMap: IDijkstraMap) : number {
    let adjacent_map : { [key: number] : number[] } = {}
    let adjacent_keys : number[]
    // let madeChanges = true
    let count_passes = 0

    let lowest_neighbor_val : number
    let map_value : number
    let neighbor_val : number
    let neighbor_values : number[]
    // let key: string
    // let i : number

    let current_queue : number[] = []
    let next_queue : number[] = []

    for (let kkey in djMap) {
        current_queue.push(Number(kkey))
    }

    while (current_queue.length) {
        count_passes += 1

        current_queue.forEach((num_key: number, index: number, array) => {

            map_value = djMap[num_key]
            
            // find adjacent neighbor tiles
            if (num_key in adjacent_map) {
                adjacent_keys = adjacent_map[num_key]
            } else {
                // if we haven't already looked them up, then calculate them 
                adjacent_keys = getAdjacentKeys(num_key).filter((my_key: number, index: number, array) => {
                    return (my_key in djMap)
                })
                
                // .. and store them for later
                adjacent_map[num_key] = adjacent_keys
            }

            // go through each neighbors and find the lowest value
            lowest_neighbor_val  = MAX_INT// 1/0

            adjacent_keys.forEach((neighbor_key: number, index: number, array) => {
                neighbor_val = djMap[neighbor_key]
                if (neighbor_val < lowest_neighbor_val) {
                    lowest_neighbor_val = neighbor_val
                }
            })

            if ((map_value - lowest_neighbor_val) >= 2) {
                djMap[num_key] = lowest_neighbor_val + 1

                next_queue = next_queue.concat(adjacent_keys)
                // next_queue.push(num_key)

            } 

        })
    
    current_queue = next_queue.concat([])
    next_queue = []
}

    return count_passes
}

export interface IMaxMin {
    max: number,
    min: number
}

export function getMaxAndMinDijkstraMapValues(djmap : IDijkstraMap) : IMaxMin {
    let max_value = -(1/0)
    let min_value = 1/0

    for (let key in djmap) {
        // if (djmap.hasOwnProperty(key)) {
            let map_value = djmap[key]
            if (map_value != MAX_INT) {
                if (map_value < min_value) {
                    min_value = map_value
                }

                if (map_value > max_value) {
                    max_value = map_value
                }
            }
        // }
    }

    return {
        max: max_value,
        min: min_value
    }
}
