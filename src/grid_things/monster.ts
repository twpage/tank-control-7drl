import * as Brew from "../brew"
import { Thing } from './thing'

class MemoryPalace {
    memory_dict : Brew.Utils.Dict<Brew.GridOfThings<Thing>>

    constructor () {
        this.memory_dict = {}
    }

    saveLevelMemory(level_id: number, memory: Brew.GridOfThings<Thing>) {
        this.memory_dict[level_id] = memory.clone()
    }

    hasLevelMemory(level_id: number) : boolean {
        return level_id in this.memory_dict
    }

    getLevelMemory(level_id: number) : Brew.GridOfThings<Thing> {
        if (this.hasLevelMemory(level_id)) {
            return this.memory_dict[level_id]
        } else {
            console.error("missing memory archive for given level id:", level_id)
            return null
        }
    }
}

export class Monster extends Thing {
    speed: number
    sight_range: number
    monster_status: Brew.Enums.MonsterStatus
    destination_xy: Brew.Coordinate
    giveup: number
    attack_range: number
    hp: Brew.Stat
    shields: Brew.Stat
    power_suite: Brew.Powers.PowerSuite
    team: Brew.Enums.Team = Brew.Enums.Team.Enemy
    facing_direction: Brew.Coordinate
    score: Brew.Stat

    fov: Brew.GridOfThings<Brew.Enums.BrewVisionSource>
    knowledge: Brew.GridOfThings<Thing>
    memory: Brew.GridOfThings<Thing>
    memory_archive: MemoryPalace
    
    parts: Array<Brew.GridThings.Feature> = []
    building_type: Brew.Enums.ComponentPartsBuildingType = Brew.Enums.ComponentPartsBuildingType.None
    inventory: Brew.Inventory
    
    constructor (definition: Brew.Definitions.MonsterType) {
        super(Brew.Enums.BrewObjectType.Monster, definition)
        this.fov = new Brew.GridOfThings<Brew.Enums.BrewVisionSource>()
        this.knowledge = new Brew.GridOfThings<Thing>()
        this.memory = new Brew.GridOfThings<Thing>()
        this.memory_archive = new MemoryPalace()
        this.power_suite = new Brew.Powers.PowerSuite(0)
        this.facing_direction = new Brew.Coordinate(0, 0)
        // this.flags = []
        this.score = new Brew.Stat(Brew.Enums.StatName.Score, 0)
    }
    
    setFacing(new_direction: Brew.Coordinate) {
        this.facing_direction = new_direction
    }

    clearParts() {
        this.parts = []
    }

    getParts() : Array<Brew.GridThings.Feature> {
        return this.parts
    }

    setParts(new_parts: Array<Brew.GridThings.Feature>) {
        this.parts = new_parts
    }

    getSpeed() : number {
        return this.speed
    }

    act(): void {} // gets overridden by factory creation 

    clearFov() : void {
        this.fov = new Brew.GridOfThings<Brew.Enums.BrewVisionSource>()
    }   
    
    clearKnowledge() : void {
        this.knowledge = new Brew.GridOfThings<Thing>()
    }

    hasKnowledgeOf(other_thing : Monster) : boolean {
        for (let thing of this.knowledge.getAllThings()) {
            if (thing.isSameThing(other_thing)) {
                return true
            }
        }
        
        return false
    }

    inFOV(target: Thing) {
        return (this.fov.hasAt(target.location))
    }

    getPowers() : Brew.Powers.PowerSuite {
        return this.power_suite
    }

    public getName() : string {
        return Brew.Definitions.MonsterType[this.definition]
    }

    // override default Thing get Brew.Enums.Flags
    getFlags() : Array<Brew.Enums.Flag> {
        let my_flags : Array<Brew.Enums.Flag> = this.flags.concat([])

        for (let pow of this.power_suite.listOfPowers) {
            my_flags = my_flags.concat(pow.conveys_flags)
        }

        return my_flags
    }
}

