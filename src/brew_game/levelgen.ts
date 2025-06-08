import * as ROT from 'rot-js'
import * as Brew from '../brew'


export function buildLevel(gm: Brew.GameMaster, depth: number, lastLevel: boolean) {
    let success : boolean

    let my_level = new Brew.Level(Brew.Config.map_width_tiles, Brew.Config.map_height_tiles, depth)

    // todo: make this an array and use some/all to make sure its a good level
    success = false
    let num_tries = 0
    while (!(success)) {
        num_tries += 1
        success = setupTerrain_Simple(my_level, lastLevel)
    }
    console.log(`depth ${depth}: ${num_tries} tries`)

    my_level.updateNavigation()
    addTerrainSpice(my_level)
    my_level.updateNavigation()
    
    success = setupExitLocations(my_level, lastLevel)
    success = setupPortals(gm, my_level)
    success = setupItems(my_level, lastLevel)
    success = setupMonsters(gm, my_level, lastLevel)


    my_level.isConstructed = true
    return my_level
}

export function buildAndAttachNewLevel(gm: Brew.GameMaster, currentLevel: Brew.Level, portal: Brew.Portal) {
    let next_level = buildLevel(gm, currentLevel.depth + 1, false)
    gm.addLevel(next_level)
    portal.attachDestination(next_level.id, next_level.simple_start_xy)
}

function setupPortals(gm: Brew.GameMaster, lair: Brew.Level) : boolean {
    let portal_forward : Brew.Portal
    portal_forward = new Brew.Portal(lair.id, lair.simple_exit_xy)
    // portal_forward.attachDestination(listLevels[i+1].id, listLevels[i+1].simple_start_xy)
    lair.portals.setAt(lair.simple_exit_xy, portal_forward)
    return true
}

function setupTerrain_Simple (lair : Brew.Level, lastLevel: boolean) : boolean {
    
    let terrain: Brew.GridThings.Terrain
    
    let easyMap = (x: number, y: number, what: number) => {
        let xy: Brew.Coordinate = new Brew.Coordinate(x, y)
        // walls override
        // if ((x == 0) || (y == 0) || (x == lair.width - 1) || (y == lair.height - 1)) {
        //     terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Wall)
        // } else {
            if (what == 1) {
                terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Rock)
            } else if (what == 0) {
                terrain = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Sand)
            } else {
                throw new RangeError(`Unexpected levelgen return value ${what}`)
            }
    
        // }
        
        lair.terrain.setAt(xy, terrain)
    }

    // let rotMap = new ROT.Map.Arena(lair.width, lair.height)
    let rotMap = new ROT.Map.Cellular(lair.width, lair.height, { connected: true } )

    rotMap.randomize(0.4)
    rotMap.create(easyMap)
    // rotMap.create(easyMap)
    // rotMap.create(easyMap)

    // make terrain interesting
    let noise = new ROT.Noise.Simplex(10)
    let terrain_at : Brew.GridThings.Terrain
    for (let x = 1; x < (lair.width - 1); x++) {
        for (let y = 1; y < (lair.height - 1); y++) {
            let xy = new Brew.Coordinate(x, y)
            
            let p = noise.get(x/10, y/10)

            if ((p > .5) && (!(lastLevel))) {
                terrain_at = lair.terrain.getAt(xy)
                if (terrain_at.isType(Brew.Definitions.TerrainType.Sand)) {
                    lair.terrain.removeAt(xy)
                    lair.terrain.setAt(xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Grass))
                }
            }

            if (p < -0.5) {
                terrain_at = lair.terrain.getAt(xy)
                if (terrain_at.isType(Brew.Definitions.TerrainType.Sand)) {
                    lair.terrain.removeAt(xy)
                    lair.terrain.setAt(xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Rubble))
                }
            }
        }
    }

    return true
}

function setupExitLocations (lair : Brew.Level, lastLevel: boolean) : boolean {

    // get all available floor spots
    let floors : Array<Brew.Coordinate> = Brew.Utils.randomize(Brew.Utils.clone(lair.navigation_tiles[Brew.Enums.LevelNavigationType.Walk]), true)
    

    // unless otherwise specified, pick a random start location
    // todo: ensure minimum distance between start and end
    let start_xy = floors[0]
    let exit_xy = floors[1]
    let min_distance = Math.max(Brew.Config.map_height_tiles, Brew.Config.map_width_tiles) / 2
    while (Brew.Utils.dist2d(start_xy, exit_xy) < min_distance) {
        exit_xy = Brew.Utils.randomOf(floors, true)
    }
    // console.log("start", start_xy)
    // console.log("exit", exit_xy)

    lair.simple_start_xy = start_xy
    lair.simple_exit_xy = exit_xy

    // let start_xy = lair.simple_start_xy
    // let exit_xy = lair.simple_exit_xy

    // let entrance_stairs = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.UpStairs)
    // lair.terrain.removeAt(start_xy)
    // lair.terrain.setAt(start_xy, entrance_stairs)
    // if (lair.depth == 1) {
    //     entrance_stairs.code = Brew.Symbols.double_angle_bracket_left
    // }

    // if (lair.depth < Brew.Config.max_depth) {
    if (!(lastLevel)) {
        lair.terrain.removeAt(exit_xy)
        lair.terrain.setAt(exit_xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.LevelCheckPoint))
    }

    // todo: eventually this will be fail-able
    return true
}

function setupItems (lair: Brew.Level, lastLevel: boolean) : boolean {
    // some items
    let it : Brew.GridThings.Item
    let num_civilians = 5
    let num_supplies = 5
    let num_bullets = 5
    let num_shells = 5

    for (let i = 0; i < num_civilians; i++) {
        it = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Civilian)
        lair.items.setAt(lair.getSafeLocation() , it)
    } 

    for (let i = 0; i < num_supplies; i++) {
        it = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Supplies)
        lair.items.setAt(lair.getSafeLocation() , it)
    } 

    for (let i = 0; i < num_shells; i++) {
        it = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Shells)
        lair.items.setAt(lair.getSafeLocation() , it)
    } 

    for (let i = 0; i < num_bullets; i++) {
        it = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Bullets)
        lair.items.setAt(lair.getSafeLocation() , it)
    } 

    return true
}

function setupMonsters (gm : Brew.GameMaster, lair: Brew.Level, lastLevel: boolean) : boolean {
    let weightedMonsters = {
        "Mercenary": 5,
        "Soldier": 5,
        // "Grenadier": 2,
        // "Jeep": 2,
    }

    if (lair.depth > 5) {
        weightedMonsters["Grenadier"] = Math.min(5, (lair.depth - 5))
    }
    
    let num_monsters = 10 + (lair.depth * 2)
    for (let i = 0; i < num_monsters; i++) {
        // let mdef : Brew.Definitions.MonsterType
        // if (ROT.RNG.getUniform() < 0.7) {
        //     mdef = Brew.Definitions.MonsterType.Killbot
        // } else {
        //     mdef = Brew.Definitions.MonsterType.Guardguy
        // }
        let mdef = Brew.Definitions.MonsterType[ROT.RNG.getWeightedValue(weightedMonsters)]
        // let mob = Brew.Definitions.monsterFactory(gm, Brew.Definitions.MonsterType.Killbot, {monster_status: Brew.GridThings.MonsterStatus.Wander })
        let mob = Brew.Definitions.monsterFactory(gm, mdef, {monster_status: Brew.Enums.MonsterStatus.Wander })
        // mob.code = i.toString()
        mob.name = "Monster " + i.toString()
        // mob.code = i.toString()

        // mob.monster_status = Brew.GridThings.MonsterStatus.Wander
        // todo: ensure monsters dont start too near the starting location
        let xy : Brew.Coordinate = lair.getSafeLocation()
        // let xy : Brew.Coordinate = Brew.randomOf(level.floors)
        lair.monsters.setAt(xy, mob)
        // gm.scheduler.add(mob, true)
    }

    return true
}

function addTerrainSpice(level: Brew.Level) {
    let floors : Array<Brew.Coordinate> = Brew.Utils.randomize(Brew.Utils.clone(level.navigation_tiles[Brew.Enums.LevelNavigationType.Walk]), true)

    let num_buildings = ROT.RNG.getUniformInt(0, 3)

    let building_tiles = new Brew.CoordinateArea()

    for (let i = 0; i < num_buildings; i++) {
        let size = Math.max(3, Math.floor(ROT.RNG.getNormal(10, 1)))
        let center_xy = floors[i]

        let structure : Brew.Rooms.Room
        if (ROT.RNG.getUniform() < 0.5) {
            structure = new Brew.Rooms.OvalRoom(new Brew.Rooms.Rectangle(center_xy.x, center_xy.y, size, size))
        } else {
            structure = new Brew.Rooms.RectangleRoom(new Brew.Rooms.Rectangle(center_xy.x, center_xy.y, size, size))
            
        }
        
        for (let xy of structure.getWalls()) {
            if (building_tiles.hasCoordinate(xy)) {
                continue
            }

            if (ROT.RNG.getUniform() > 0.25) {
                if (level.isValid_PointsOnly(xy)) {
                    level.terrain.removeAt(xy)
                    level.terrain.setAt(xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Broken_Wall))
                }
            }
            
            building_tiles.addCoordinate(xy)
        }

        for (let xy of structure.getFloors()) {
            // if (building_tiles.hasCoordinate)

            if (level.isValid_PointsOnly(xy)) {
                level.terrain.removeAt(xy)
                level.terrain.setAt(xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Rubble))
            }
            
            // building_tiles.addCoordinate(xy)
        }
    }

}