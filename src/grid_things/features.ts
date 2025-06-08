import * as Brew from "../brew"
import { Thing } from '../grid_things/thing'

export class Feature extends Thing  {
    private parent : Thing

    constructor (definition: Brew.Definitions.FeatureType) {
        super(Brew.Enums.BrewObjectType.Feature, definition)
        this.parent = null
    }

    public getName() : string {
        return Brew.Definitions.FeatureType[this.definition]
    }

    public getParent() : Thing {
        return this.parent
    }

    // public isRoot() : boolean {
    //     return (this.parent) ? false : true
    // }

    public setParent(p: Thing) {
        this.parent = p
    }

    // public getRoot() : Feature {
    //     if (this.isRoot()) {
    //         return this
    //     } else {
    //         return this.parent.getRoot()
    //     }
    // }
}

