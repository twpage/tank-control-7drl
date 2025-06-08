import * as Brew from "../brew"
import { Thing } from '../grid_things/thing'

export class Above extends Thing {

    constructor (definition: Brew.Definitions.AboveType) {
        super(Brew.Enums.BrewObjectType.Above, definition)
    }
    
    public getName() : string {
        return Brew.Definitions.AboveType[this.definition]
    }
}

