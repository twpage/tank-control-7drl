import * as ROT from 'rot-js'
import * as Brew from "../brew"

export class Thing {
    // public id: number
    protected objtype: Brew.Enums.BrewObjectType = Brew.Enums.BrewObjectType.Thing
    protected definition: any
    protected id : number
    
    public name: string = "unnamed_thing"
    public code: string = "0"
    public color: number[]
    public bg_color: number[]
    public location: Brew.Coordinate
    
    flags: Array<Brew.Enums.Flag> = []

    constructor (objtype: Brew.Enums.BrewObjectType, definition: any) {
        this.objtype = objtype
        this.definition = definition
        this.id = Brew.Utils.generateID()
    }
    
    public setLocation(xyNew: Brew.Coordinate) : void {
        this.location = xyNew
    }
    
    public getDefinition() : any {
        return this.definition
    }
    
    public isType(other_definition: any) : boolean {
        return other_definition == this.definition
    } 
    
    public getID() : number {
        return this.id
    }
    
    public isSameThing(other_thing: Thing) : boolean {
        return this.getID() === other_thing.getID()
    }

    public getName() : string {
        // override this
        throw new Error("Thing subclass missing getName override")
    }

    setFlag(flag: Brew.Enums.Flag) {
        Brew.Utils.remove(this.flags, flag)
        this.flags.push(flag)
    }
    
    removeFlag(flag: Brew.Enums.Flag) : boolean {
        // returns true if we had this flag, false if not
        if (this.flags.indexOf(flag) > -1) {
            Brew.Utils.remove(this.flags, flag)
            return true
        } else {
            return false
        }
    }
    
    hasFlag(flag: Brew.Enums.Flag) : boolean {
        // return (this.flags.indexOf(flag) > -1) 
        return (this.getFlags().indexOf(flag) > -1) 
    }

    getFlags() : Array<Brew.Enums.Flag> {
        return this.flags
    }
}
