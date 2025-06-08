import * as Brew from "../brew"
import { Thing } from '../grid_things/thing'

export class Terrain extends Thing {
    blocks_walking: boolean
    blocks_vision: boolean
    blocks_flying: boolean  // todo: need a cleaner connection to the terrain Interface (no need to define these multiple times)
    is_solid: boolean
    alwaysOnTop: boolean

    constructor (definition: Brew.Definitions.TerrainType) {
        super(Brew.Enums.BrewObjectType.Terrain, definition)
    }

    public getName() : string {
        return Brew.Definitions.TerrainType[this.definition]
    }
}

