import * as Brew from "../brew"

export class Portal {
    source_level_id: number
    source_location_xy: Brew.Coordinate
    destinationExists: boolean
    dest_level_id: number = null
    dest_location_xy: Brew.Coordinate = null

    constructor (from_level_id : number, from_level_xy: Brew.Coordinate)  {
        this.source_level_id = from_level_id
        this.source_location_xy = from_level_xy
        this.destinationExists = false
    }

    public attachDestination (to_level_id : number, to_level_xy : Brew.Coordinate) : boolean {
        this.dest_level_id = to_level_id
        this.dest_location_xy = to_level_xy
        this.destinationExists = true
        return true // todo: return false when level gen fails -- can it fail?
    }

    getReversePortal () : Portal {
        // return a portal that is the reverse/inverse of this portal
        
        let reversePortal : Portal

        if (this.destinationExists) {
            reversePortal = new Portal(this.dest_level_id, this.dest_location_xy)
            reversePortal.dest_level_id = this.source_level_id
            reversePortal.dest_location_xy = this.source_location_xy

        } else {
            console.warn("can't reverse a portal without a destination")
            reversePortal = null
        }

        return reversePortal
    }
}