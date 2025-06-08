import * as Brew from "../brew"
import { Thing } from '../grid_things/thing'

export class Item extends Thing  {
    power : Brew.Powers.Power // todo: figure out implementation vs extending Thing, maybe Thing is also an interface
    canPickup: boolean
    canHeave: boolean
    damage: number
    subtype: Brew.Definitions.ItemSubtype

    constructor (definition: Brew.Definitions.ItemType, subtype: Brew.Definitions.ItemSubtype = Brew.Definitions.ItemSubtype.NonSpecific) {
        super(Brew.Enums.BrewObjectType.Item, definition)
        this.subtype = subtype
    }

    getName() : string {
        return Brew.Glossary.getItemName(this)
    }
}


