import * as Brew from "../brew"

interface INavigationTileList {
    [id : string] : Array<Brew.Coordinate>
}

export class Level {
    id: number
    width: number
    height: number
    depth: number
    simple_start_xy: Brew.Coordinate
    simple_exit_xy: Brew.Coordinate
    floors: Array<Brew.Coordinate>

    navigation_tiles: INavigationTileList
    
    monsters: Brew.GridOfThings<Brew.GridThings.Monster>
    terrain: Brew.GridOfThings<Brew.GridThings.Terrain>
    items: Brew.GridOfThings<Brew.GridThings.Item>
    features: Brew.GridOfThings<Brew.GridThings.Feature>
    above: Brew.GridOfThings<Brew.GridThings.Above>
    portals: Brew.GridOfThings<Brew.Portal>
    parts: Brew.GridOfThings<Brew.GridThings.Feature>

    isConstructed: boolean = false

    constructor(width: number, height: number, depth?: number) {
        this.id = Brew.Utils.generateID()
        this.width = width
        this.height = height
        this.depth = depth || 0
        
        this.terrain = new Brew.GridOfThings<Brew.GridThings.Terrain>()
        this.monsters = new Brew.GridOfThings<Brew.GridThings.Monster>()
        this.items = new Brew.GridOfThings<Brew.GridThings.Item>()
        this.features = new Brew.GridOfThings<Brew.GridThings.Feature>()
        this.above = new Brew.GridOfThings<Brew.GridThings.Above>()
        this.portals = new Brew.GridOfThings<Brew.Portal>()
        this.parts = new Brew.GridOfThings<Brew.GridThings.Feature>()

        this.navigation_tiles = {}
        this.navigation_tiles[Brew.Enums.LevelNavigationType.Walk] = []
        this.navigation_tiles[Brew.Enums.LevelNavigationType.Fly] = []
    }
    
    isValid (xy: Brew.Coordinate) : boolean {
        return (this.isConstructed) && (xy.x >= 0) && (xy.y >= 0) && (xy.x < this.width) && (xy.y < this.height) 
    }

    isValid_PointsOnly (xy: Brew.Coordinate) : boolean {
        return (xy.x >= 0) && (xy.y >= 0) && (xy.x < this.width) && (xy.y < this.height) 
    }

    getSafeLocationNear (spot_xy : Brew.Coordinate, exclude_location_with_item : boolean = false): Brew.Coordinate {
        // returns a safe spot near a given Brew.Coordinate
        // safe = walkable, monster-free, not an exit
        
        let max_size = 10 // stop after 5 successively bigger squares
        let points : Array<Brew.Coordinate>
        for (let size = 1; size < max_size; size++) {
            points = Brew.Utils.getSquarePoints(spot_xy, size)
            for (let xy of points) {
                if (this.isSafe(xy, exclude_location_with_item)) {
                    return xy
                }
            }
        }
        console.warn("unable to find suitable place to exit phasewalk - dumping to potentially dumb random location")
        let random_xy = this.getSafeLocation()
        return random_xy
    }

    isSafe (xy: Brew.Coordinate, exclude_location_with_item : boolean = false) : boolean {
        let not_ok : boolean

        not_ok = (
            (!(this.isValid(xy))) || 
            (this.terrain.getAt(xy).blocks_walking) || 
            (this.monsters.hasAt(xy)) ||
            (this.portals.hasAt(xy)) || 
            (exclude_location_with_item && (this.items.hasAt(xy))) || 
            (xy.compare(this.simple_exit_xy)) ||
            (xy.compare(this.simple_start_xy))
        )

        return (!(not_ok))
    }

    getSafeLocation () : Brew.Coordinate {
        // returns a walkable, monster-free location
        
        let xy : Brew.Coordinate
        let tries = 0
        let not_ok : boolean

        while (tries < 50) {
            xy = Brew.Utils.randomOf(this.getWalkableTiles())
            not_ok = (
                (this.monsters.hasAt(xy)) ||
                (xy.compare(this.simple_exit_xy)) ||
                (xy.compare(this.simple_start_xy))
            )

            if (!(not_ok)) {
                return xy
            }
            tries += 1
        }
        
        console.error("unable to find safe location")
        return null
    }

    updateNavigation() {
        let t : Brew.GridThings.Terrain
        let xy : Brew.Coordinate

        for (let x = 1; x < (this.width - 1); x++) {
            for (let y = 1; y < (this.height - 1); y++) {
                xy = new Brew.Coordinate(x, y)
                t = this.terrain.getAt(xy)

                if (!(t.blocks_walking)) {
                    this.navigation_tiles[Brew.Enums.LevelNavigationType.Walk].push(xy)
                }

                if (!(t.blocks_flying)) {
                    this.navigation_tiles[Brew.Enums.LevelNavigationType.Fly].push(xy)
                }
            }
        }
    }

    getWalkableTiles() {
        return this.getNavigableTilesOfType(Brew.Enums.LevelNavigationType.Walk)
    }

    getFlyableTiles() {
        return this.getNavigableTilesOfType(Brew.Enums.LevelNavigationType.Fly)
    }

    getNavigableTilesOfType(navType : Brew.Enums.LevelNavigationType) {
        return this.navigation_tiles[navType]
    }

}
