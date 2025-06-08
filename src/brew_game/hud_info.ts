import * as ROT from 'rot-js'
import * as Brew from "../brew"
import { generateID } from "../brew_components/utils";
import { ICharAndColor} from "../brew_engine/enums"
import { IColor } from "../brew_components/color";

let PRIORITY_PLAYER_HEALTH = 10000
let PRIORITY_PLAYER_EFFECTS = 9000
let PRIORITY_TARGETLOCK = 8000
let PRIORITY_MOB_HEALTH = 7000
let PRIORITY_MOB_EFFECTS = 6000
//// 
let PRIORITY_ITEMS = 5000
let PRIORITY_MOB_FLAGS = 4000
let PRIORITY_PLAYER_FLAGS = 4000
let PRIORITY_FEATURE = 3000
let PRIORITY_TERRAIN = 2000


export class HUDNote {
    private noteID : number
    
    constructor(public noteType: Brew.Enums.BrewNoteType, public subject: Brew.GridThings.Thing, public priority : number, public note_color : IColor) {
        this.noteID = generateID()
    }

    getNoteText() : string {
        return ""
    }

    getOverlayText() : string {
        return ""
    }

    setColor(new_color:IColor) {
        this.note_color = new_color
    }

    getColor() : IColor {
        return this.note_color
    }
}

class NoteTerrain extends HUDNote {
    constructor(public subject: Brew.GridThings.Terrain, public priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.Terrain, subject, priority, note_color)
    }

    getNoteText() : string {
        return  this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        return Brew.Definitions.TerrainType[this.subject.getDefinition()]
    }
}

class NoteFeature extends HUDNote {
    constructor(public subject: Brew.GridThings.Feature, public priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.Feature, subject, priority, note_color)
    }

    getNoteText() : string {
        return  this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        return Brew.Glossary.getFeatureName(this.subject)
    }
}

class NoteTimedEffect extends HUDNote {
    constructor(public turn_timer: Brew.Timers.TurnTimer, public current_turn: number, priority : number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.TimedEffect, turn_timer.actor, priority, note_color)
    }

    getNoteText() : string {
        return this.turn_timer.actor.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        // return `${this.subject.code} ${Brew.Enums.Flag[this.flag]}`
        let turns_remaining = this.turn_timer.getTurnsRemaining(this.current_turn)
        return `${Brew.Enums.Flag[this.turn_timer.flag]} ${turns_remaining}`
    }

}

class NoteMonsterHealth extends HUDNote {
    constructor(public subject: Brew.GridThings.Monster, priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.Health, subject, priority, note_color)
    }

    getNoteText() : string {
        return  this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        let text = ""
        
        // for (let i = 0; i < this.subject.hp.getCurrentLevel(); i++) {
        for (let i = 1; i <= this.subject.hp.getMaxLevel(); i++) {
            if (i <= this.subject.hp.getCurrentLevel() ) {
                text += Brew.Symbols.heart_full
            } else {
                text += Brew.Symbols.heart_empty
            }
        }

        if (this.subject.shields.getMaxLevel() > 0) {
            // text += " "
            for (let i = 0; i < this.subject.shields.getMaxLevel(); i++) {
                if (i < this.subject.shields.getCurrentLevel()) {
                    text += Brew.Symbols.diamond_full
                } else {
                    text += Brew.Symbols.diamond_empty
                }
                
            }
        }
        
        return text
    }
}

class NoteMonsterFlag extends HUDNote {
    constructor(public subject: Brew.GridThings.Monster, public flag : Brew.Enums.Flag, priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.BehavioralFlag, subject, priority, note_color)
    }

    getNoteText() : string {
        return  this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        return Brew.Enums.Flag[this.flag]
    }
}

class NoteMonsterSpeed extends HUDNote {
    constructor(public subject: Brew.GridThings.Monster, private speed: number, priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.Speed, subject, priority, note_color)
    }

    getNoteText() : string {
        return this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        if (this.speed < 12) {
            return "Moves Slowly"
        } else {
            return "Moves Fast!"
        }
    }
}

class NoteTargetingLock extends HUDNote {
    constructor(public subject: Brew.GridThings.Monster, public lock_on : Brew.GridThings.Monster, priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.TargetingLock, subject, priority, note_color)
    }

    getNoteText() : string {
        return  this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        return `TLock [${this.lock_on.code}]`
    }
}

class NoteItemOnFloor extends HUDNote {
    constructor(public subject: Brew.GridThings.Item, priority: number, public note_color: IColor) {
        super(Brew.Enums.BrewNoteType.NotableItem, subject, priority, note_color)
    }

    getNoteText() : string {
        return  this.subject.code + " " + this.getOverlayText()
    }

    getOverlayText() : string {
        return Brew.Glossary.getItemName(this.subject)
    }
}

export function getCurrentNotes(gm: Brew.GameMaster) : Array<HUDNote> {
    let hud_notes : Array<HUDNote> = []
    let current_turn = gm.turn_count
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()
    
    // always show player health/shield
    hud_notes.push(new NoteMonsterHealth(player, PRIORITY_PLAYER_HEALTH, Brew.Color.color_notes_player))

    // show player timed effects / flags
    let timed_effects : Array<Brew.Timers.TurnTimer> = gm.timer_monitor.getAllTimersFor(player)
    let covered_flags : Array<Brew.Enums.Flag> = []
    timed_effects.forEach((turn_timer) => {
        hud_notes.push(new NoteTimedEffect(turn_timer, current_turn, PRIORITY_PLAYER_EFFECTS, Brew.Color.color_notes_player))
        covered_flags.push(turn_timer.flag)
    })

    // any other flags that player has? (flight)
    for (let player_flag of player.getFlags()) {
        if (covered_flags.indexOf(player_flag) == -1) {
            hud_notes.push(new NoteMonsterFlag(player, player_flag, PRIORITY_PLAYER_FLAGS, Brew.Color.color_notes_player))
        }
    }

    // monsters nearby
    let dist : number
    let priority : number
    let mob_list : Array<Brew.GridThings.Monster> = []
    let distMap : {[id: number] : number } = {}
    let max_dist : number
    let mob_note_color : IColor

    // create simple distance map from player, to gauge relative threat
    Brew.Intel.getMonstersKnownBy(gm, player).forEach((mob) => {
        mob_list.push(mob)
        dist = Brew.Utils.dist2d(player.location, mob.location)
        distMap[mob.getID()] = dist
        max_dist = Math.max(dist, max_dist)
    })

    mob_list.forEach((mob, index) => {
        mob_note_color = getDifferentiatedColor(Brew.Color.dark_red, Brew.Color.goldenrod, mob_list.length, index)

        covered_flags = [] // reset for each new mob
        dist = distMap[mob.getID()]
        // at least one note for health/shield
        hud_notes.push(new NoteMonsterHealth(mob, PRIORITY_MOB_HEALTH, mob_note_color))
        timed_effects = gm.timer_monitor.getAllTimersFor(mob)
        
        // potentially multiple notes for timed status effects (burning, weakened, etc)
        for(let i = 0; i < timed_effects.length; i++) {
            // hud_notes.push(new NoteTimedEffect(timed_effects[i], current_turn, PRIORITY_MOB_EFFECTS - (max_dist - dist), mob_note_color))
            hud_notes.push(new NoteTimedEffect(timed_effects[i], current_turn, PRIORITY_MOB_EFFECTS, mob_note_color))
            if (covered_flags.indexOf(timed_effects[i].flag) == -1) {
                covered_flags.push(timed_effects[i].flag)
            }
        }

        // list all behavioral (non-timed) effects/flags
        for(let i = 0; i < mob.flags.length; i++) {
            let mob_flag = mob.flags[i]
            if (covered_flags.indexOf(mob_flag) == -1) {
                // not previously covered
                hud_notes.push(new NoteMonsterFlag(mob, mob_flag, PRIORITY_MOB_FLAGS, mob_note_color))
            }
        }

        if (mob.speed != 12) {
            hud_notes.push(new NoteMonsterSpeed(mob, mob.speed, PRIORITY_MOB_FLAGS, mob_note_color))
        }
    })

    // items
    let item_list : Array<Brew.GridThings.Item> = []
    Brew.Intel.getItemsKnownBy(gm, gm.getPlayer()).forEach((item) => {
        item_list.push(item)
        dist = Brew.Utils.dist2d(player.location, item.location)
        // priority = inverse of distance
        distMap[item.getID()] = dist
        max_dist = Math.max(dist, max_dist)
    })

    item_list.forEach((item) => {
        dist = distMap[item.getID()]
        priority = PRIORITY_ITEMS // - (max_dist - dist)
        hud_notes.push(new NoteItemOnFloor(item, priority, Brew.Color.blue))
    })

    // terrain and features -- only need 1 of each
    let generic_content_notes = getGenericContentNotes(gm)

    let shown_terrain : { [def: string] : boolean } = {}
    let shown_features : { [def: string] : boolean } = {}
    let already_shown : boolean
    let combined_generic_notes : Array<HUDNote> = []
    combined_generic_notes = combined_generic_notes.concat(generic_content_notes.featureNotes)
    combined_generic_notes = combined_generic_notes.concat(generic_content_notes.terrainNotes)

    for (let note of combined_generic_notes) {

        already_shown = false
        if (note.subject instanceof Brew.GridThings.Terrain) {
            if (note.subject.getDefinition() in shown_terrain) {
                already_shown = true
            } 
        } else if (note.subject instanceof Brew.GridThings.Feature) {
            if (note.subject.getDefinition() in shown_features) {
                already_shown = true
            } 
        }

        if (!(already_shown)) {
            if (note.subject instanceof Brew.GridThings.Terrain) {
                shown_terrain[note.subject.getDefinition()] = true
            } else if (note.subject instanceof Brew.GridThings.Feature) {
                shown_features[note.subject.getDefinition()] = true
            }

            hud_notes.push(note)
        }
    }

    hud_notes = hud_notes.concat(getTargetLockNotes(gm))

    hud_notes.sort((note_a, note_b) => {
        return note_b.priority - note_a.priority
    })

    return hud_notes
}

export function getLabelOffsetsForPoint() : Array<Brew.Coordinate> {
    let list_all = [Brew.Directions.LEFT, Brew.Directions.RIGHT, Brew.Directions.UP_RIGHT, Brew.Directions.DOWN_RIGHT, Brew.Directions.UP_LEFT, Brew.Directions.DOWN_LEFT]
    // return list_all
    return Brew.Utils.randomize(list_all, false)
}

export const usefulLabelArrowLookup : {[offset_id:number] : string} = {}
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.RIGHT)] = Brew.Symbols.pointer_left
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.LEFT)] = Brew.Symbols.pointer_right
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.UP)] = Brew.Symbols.pointer_down
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN)] = Brew.Symbols.pointer_up
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN_LEFT)] = Brew.Symbols.pointer_upright
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN_RIGHT)] = Brew.Symbols.pointer_upleft
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.UP_RIGHT)] = Brew.Symbols.pointer_downleft
usefulLabelArrowLookup[Brew.Utils.xyToKey(Brew.Directions.UP_LEFT)] = Brew.Symbols.pointer_downright

export function getLabelArrowForOffset(offset_xy: Brew.Coordinate) : string {
    return usefulLabelArrowLookup[Brew.Utils.xyToKey(offset_xy)]
}



export interface IHeadsUpPage {
    grid: Brew.GridOfThings<ICharAndColor>
    note: Array<HUDNote>
}

export function getHUDPages(gm: Brew.GameMaster, given_notes: Array<HUDNote>) : Array<IHeadsUpPage> {
    // sort by priority
    given_notes.sort((note_a, note_b) => {
        return note_b.priority - note_a.priority
    })
    let max_notes_per_page = 6

    let makeNewPage = true
    let all_pages : Array<IHeadsUpPage> = []
    let currentPage : IHeadsUpPage
    let skipped_notes : Array<HUDNote> = []

    let note_idx = 0
    while (note_idx < given_notes.length) {
        if (makeNewPage) {
            currentPage = {
                grid: new Brew.GridOfThings<ICharAndColor>(),
                note: []
            }
            makeNewPage = false
        }

        let success = false
        let text : string
        let note = given_notes[note_idx]
        
        let existing_char = currentPage.grid.getAt(note.subject.location)
        
        if (existing_char) {
            success = false
        } else {
            text = note.getOverlayText()
            success = placeWordsOnLetterGrid(currentPage.grid, text, note.getColor(), note.subject.location)
        }

        if (success) {
            currentPage.grid.setAt(note.subject.location, { char: note.subject.code, color: note.getColor()})
            currentPage.note.push(note)
            note_idx += 1
        } 

        makeNewPage = (!(success)) || (currentPage.note.length == max_notes_per_page)

        if (makeNewPage) {
            all_pages.push(currentPage)
        }
    }
    all_pages.push(currentPage)

    return all_pages
}

function calcWordsStartCoordinate(spot_xy: Brew.Coordinate, offset_xy : Brew.Coordinate, words: string) : Brew.Coordinate {
    let pointer_xy = spot_xy.add(offset_xy)
    let words_start_xy : Brew.Coordinate = null

    if (offset_xy.x > 0) {
        // text flows to the right
        words_start_xy = spot_xy.add(offset_xy)
    } else if (offset_xy. x < 0) {
        // text flows from the left
        words_start_xy = spot_xy.add(offset_xy).add(new Brew.Coordinate(-1 * (words.length - 1), 0))
    } else {
        throw new Error("function not designed for xy.x = 0")
    }

    return words_start_xy
}

export function placeWordsOnLetterGrid(grid: Brew.GridOfThings<ICharAndColor>, words: string, color: Brew.Color.IColor, spot_xy: Brew.Coordinate) : boolean {
    let is_open : boolean
    let pointer_char : string
    let full_text : string
    let i : number
    let xy : Brew.Coordinate
    let offset_xy_list = getLabelOffsetsForPoint()
    let offset_xy : Brew.Coordinate
    let words_start_xy : Brew.Coordinate

    // for (let words_start_xy of offset_list) {
    for (let j = 0; j < offset_xy_list.length; j++) {
        offset_xy = offset_xy_list[j]
        pointer_char = getLabelArrowForOffset(offset_xy)
        if (offset_xy.x > 0) {
            full_text = pointer_char + words
        } else if (offset_xy.x < 0) {
            full_text = words + pointer_char
        } else {
            throw new Error("function not designed for xy.x = 0")
        }

        words_start_xy = calcWordsStartCoordinate(spot_xy, offset_xy, full_text)
        
        is_open = checkIfBlankSpaceExistsOnLetterGrid(grid, full_text, words_start_xy)
        if (is_open) {
            for (i = 0; i < full_text.length; i++) {
                xy = words_start_xy.add(new Brew.Coordinate(i, 0))
                grid.setAt(xy, { char: full_text[i], color: color})
            }
            return true
        }
    }

    console.log("unable to find a spot for ", words)
    return false
}

function checkIfBlankSpaceExistsOnLetterGrid(grid: Brew.GridOfThings<ICharAndColor>, words: string, words_start_xy: Brew.Coordinate) : boolean {
    // return true if we were able to place the words on the grid
    let xy: Brew.Coordinate

    // make sure it is in bounds
    if ((words_start_xy.x < 0) || (words_start_xy.y < 0)) {
        return false
    }

    if ((words_start_xy.x >= Brew.Config.screen_width_tiles) || (words_start_xy.y >= Brew.Config.screen_height_tiles)) {
        return false
    }

    if ((words_start_xy.x + words.length - 1) >= Brew.Config.screen_width_tiles) {
        return false
    }

    for (let i = 0; i < words.length; i++) {
        xy = words_start_xy.add(new Brew.Coordinate(i, 0))
        if (grid.hasAt(xy)) {
            return false
        }
    }

    return true
}

interface IUniqueContentNotes {
    terrainNotes: Array<NoteTerrain>
    featureNotes: Array<NoteFeature>
}

function getGenericContentNotes(gm: Brew.GameMaster) : IUniqueContentNotes {
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()
    let terrain_at : Brew.GridThings.Terrain
    let feature_at : Brew.GridThings.Feature
    let terrain_notes : Array<NoteTerrain> = []
    let feature_notes : Array<NoteFeature> = []
    
    // let locations : Array<Brew.Coordinate> = Brew.Utils.randomize(player.fov.getAllCoordinates(), false)
    let locations : Array<Brew.Coordinate> = player.fov.getAllCoordinates()

    for (let xy of locations) {
        terrain_at = level.terrain.getAt(xy)
        if (terrain_at) { // should always be true?
            terrain_notes.push(new NoteTerrain(terrain_at, PRIORITY_TERRAIN, Brew.Color.normal))
        }
        feature_at = level.features.getAt(xy)
        if (feature_at) {
            feature_notes.push(new NoteFeature(feature_at, PRIORITY_FEATURE, Brew.Color.normal))
        }
    }

    return {
        terrainNotes: terrain_notes,
        featureNotes: feature_notes
    }
}

function getTargetLockNotes(gm: Brew.GameMaster) : Array<NoteTargetingLock> {
    let lock_notes : Array<NoteTargetingLock> = []
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()

    for (let mob of level.monsters.getAllThings()) {
        if (Brew.Targeting.hasTargetLock(mob, player)) {
            lock_notes.push(new NoteTargetingLock(mob, player, PRIORITY_TARGETLOCK, Brew.Color.orange))
        }
    }

    return lock_notes
}

function getDifferentiatedColor(high_color: IColor, low_color: IColor, num_items: number, this_item_num: number) : IColor {
    let factor = this_item_num / num_items
    return ROT.Color.interpolate(low_color, high_color, factor)
}