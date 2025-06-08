import * as Brew from "../brew"
import { target_cursor } from "../brew_components/color";

let turn_history : Array<number> = []
let last_step : Brew.Coordinate

function updateTurns(from_xy: Brew.Coordinate, to_xy: Brew.Coordinate) {
    
    let step_direction_xy = to_xy.subtract(from_xy)
    

    if (last_step) {
        let turn_angle = Brew.Turning.getAngleBetween(last_step, step_direction_xy)
        turn_history.push(turn_angle)
        if (turn_history.length > 4) {
            let first = turn_history.shift()
        }
    }
    // console.log(turn_history)
    last_step = step_direction_xy
}

function checkForFancySteps() : Brew.Enums.FancyStepType {
    let fancy_footwork : Brew.Enums.FancyStepType = Brew.Enums.FancyStepType.None

    if (checkForSquareStep()) {
        fancy_footwork = Brew.Enums.FancyStepType.Squarestep
    } else if (checkForLunge()) {
        fancy_footwork = Brew.Enums.FancyStepType.Lunge
    } 

    return fancy_footwork
}

function checkForLunge() : boolean {
    if (turn_history.length == 0) {
        return false
    }

    let last_turn = turn_history[turn_history.length-1]
    return Math.abs(last_turn) == Math.PI
}

function checkForSquareStep() : boolean {
    let half_pi = Math.PI / 2

    if (turn_history.length < 4) {
        return false
    }

    let qtr_turn_indicators = turn_history.map((angle_rads) : number => {
        if (Math.abs(angle_rads) == half_pi) {
            return Math.sign(angle_rads)
        } else {
            return 0
        }
    })
    
    let sum_of_turns = qtr_turn_indicators.reduce((prev_val: number, current_val: number) : number => {
        return prev_val + current_val
    }, 0)

    let is_circle_step = Math.abs(sum_of_turns) == 4

    return is_circle_step
    
}

export function move(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let level = gm.getCurrentLevel()

    // debug: check if location is full of a monster already
    let m_at = level.monsters.getAt(data.moveData.to_xy)
    if (m_at) {
        console.error(`${data.actor.name} trying to move onto an occupied grid, ${data.moveData.from_xy} -> ${data.moveData.to_xy}`)
    }
    Brew.Parts.removeMonsterPartsFromGrid(gm, data.actor)

    level.monsters.removeAt(data.moveData.from_xy)
    level.monsters.setAt(data.moveData.to_xy, data.actor)

    Brew.Parts.updateMonsterParts(gm, data.actor)
    Brew.Parts.placeMonsterPartsOnGrid(gm, data.actor)

    // check for trigger events
    let didTrigger = checkForTriggerOnStep(gm, data.actor, data.moveData.to_xy, data.moveData.from_xy)
    let ambientTrigger = checkForAmbientEffects(gm, data.actor)

    // if (Brew.Intel.isPlayer(gm, data.actor)) {
    //     updateTurns(data.moveData.from_xy, data.moveData.to_xy)
        
    // }


    // turn off target locks when someone moves
    Brew.Targeting.clearTargetLocksBy(data.actor)

    gm.displayList([data.moveData.from_xy, data.moveData.to_xy])
    gm.endEvent(data)
}

export function checkForImpactOfNewParts(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, component_parts: Array<Brew.GridThings.Feature>) : boolean {
    let level = gm.getCurrentLevel()
    let terrain_at :Brew.GridThings.Terrain
    let num_changes = 0

    for (let part of component_parts) {
        if (level.isValid(part.location)) {
            terrain_at = level.terrain.getAt(part.location)
            if ((terrain_at.isType(Brew.Definitions.TerrainType.Rock)) || (terrain_at.isType(Brew.Definitions.TerrainType.Broken_Wall))) {
                level.terrain.removeAt(part.location)
                level.terrain.setAt(part.location, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Rubble))
                num_changes += 1
            }
        }
    }

    return num_changes > 0
}

function checkForTriggerOnStep(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, location_xy: Brew.Coordinate, previous_xy: Brew.Coordinate) : boolean {

    let level = gm.getCurrentLevel()
    let triggerEvent : Brew.Enums.IBrewEvent
    let num_events = 0
    
    // 
    let terrain_at = level.terrain.getAt(location_xy)
    let terrain_from = level.terrain.getAt(previous_xy)
    let door_change : boolean

    if (isDoor(terrain_at)) {
        door_change = holdTheDoor(gm, terrain_at)
        if (door_change) {
            gm.displayAt(location_xy)
        }
    }

    if (isDoor(terrain_from)) {
        door_change = holdTheDoor(gm, terrain_from)
        if (door_change) {
            gm.displayAt(previous_xy)
        }
    }
    
    return (num_events > 0)
}

export function isDoor(terrain: Brew.GridThings.Terrain) : boolean {
    return ((terrain.isType(Brew.Definitions.TerrainType.Door) || terrain.isType(Brew.Definitions.TerrainType.DoorOpen)))
}

function holdTheDoor(gm: Brew.GameMaster, the_door: Brew.GridThings.Terrain) : boolean {
    let level = gm.getCurrentLevel()
    let xy = the_door.location.clone()
    let monster_on_it = level.monsters.getAt(xy)
    let item_on_it = level.items.getAt(xy)
    let something_on_it = monster_on_it || item_on_it

    // if its closed
    if (the_door.isType(Brew.Definitions.TerrainType.Door)) {
        // and someone is standing on it, make it open
        if (something_on_it) {
            level.terrain.removeAt(xy)
            level.terrain.setAt(xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.DoorOpen))
            return true
        }
    }

    // if its open
    if (the_door.isType(Brew.Definitions.TerrainType.DoorOpen)) {
        // and no one is standing on it, close it
        if (!(something_on_it)) {
            level.terrain.removeAt(xy)
            level.terrain.setAt(xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Door))
            return true
        }
    }

    return false
}

export function checkForAmbientEffects(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : boolean {

    let level = gm.getCurrentLevel()
    let triggerEvent : Brew.Enums.IBrewEvent
    let num_events = 0
    let location_xy = actor.location

    // check for part/components of other monsters
    let part_at = level.parts.getAt(location_xy)
    if (part_at) {
        if (part_at.isType(Brew.Definitions.FeatureType.TankPart) && (!(part_at.getParent().isSameThing(actor)))) {
            // smooshed by a tank
            triggerEvent = {
                eventType: Brew.Enums.BrewEventType.Attack,
                actor: actor,
                playerInitiated: false,
                endsTurn: false,
                attackData: {
                    from_xy: location_xy,
                    to_xy: location_xy,
                    target: actor,
                    isMelee: true,
                    damage: 1,
                    effects: [],
                }
            }

            gm.insertEvent(triggerEvent)
            num_events += 1
        }    
    }
    // check for interactive features
    let feature_at = level.features.getAt(location_xy)
    if (feature_at) {
        if (feature_at.isType(Brew.Definitions.FeatureType.RepairGoo)) {
            
            actor.hp.increment(1)
            console.log(`${actor.name} health is now ${actor.hp}`)
            level.features.removeAt(location_xy)

        } else if (feature_at.isType(Brew.Definitions.FeatureType.CorrosiveAcid)) {
            level.features.removeAt(location_xy)

            triggerEvent = {
                eventType: Brew.Enums.BrewEventType.Attack,
                actor: actor,
                playerInitiated: false,
                endsTurn: false,
                attackData: {
                    from_xy: location_xy,
                    to_xy: location_xy,
                    target: actor,
                    isMelee: true,
                    damage: 0,
                    effects: [Brew.Enums.Flag.CausesWeak], // todo: way to color attack flashes
                }
            }

            gm.insertEvent(triggerEvent)
            num_events += 1
        } else if (feature_at.isType(Brew.Definitions.FeatureType.ProtectiveGoo)) {
            level.features.removeAt(location_xy)

            triggerEvent = {
                eventType: Brew.Enums.BrewEventType.Attack,
                actor: actor,
                playerInitiated: false,
                endsTurn: false,
                attackData: {
                    from_xy: location_xy,
                    to_xy: location_xy,
                    target: actor,
                    isMelee: true,
                    damage: 0,
                    effects: [Brew.Enums.Flag.CausesInvulnerable], // todo: way to color attack flashes
                }
            }

            gm.insertEvent(triggerEvent)
            num_events += 1
        }


    }
    // console.log(`${num_events} ambient events inserted`)
    return (num_events > 0)
}

export function canMoveToLocation(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, location_xy: Brew.Coordinate) : boolean {
    let level = gm.getCurrentLevel()

    if (!(level.isValid(location_xy))) {
        return false
    }

    let t = level.terrain.getAt(location_xy)
    return (
        (!(t.blocks_walking)) ||
        (t.blocks_walking && (actor.hasFlag(Brew.Enums.Flag.PhaseWalk))) ||
        ((!(t.blocks_flying)) && (actor.hasFlag(Brew.Enums.Flag.Flying))) 
    )
}

export function knockback(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let knockbackData = brEvent.knockbackData

    let knockback_path = calculateKnockbackPath(gm, knockbackData.origin_xy, knockbackData.magnitude, knockbackData.target)
    if (knockback_path.length < 2) {
        gm.endEvent(brEvent)
        return
    }

    let final_xy = knockback_path[knockback_path.length - 1]
    
    // check if something else exists that that location
    let level = gm.getCurrentLevel()
    let mob_at = level.monsters.getAt(final_xy)
    let attackEvent : Brew.Enums.IBrewEvent

    if (mob_at) {
        final_xy = knockback_path[knockback_path.length - 2] // todo: is this safe or do we need to check for knockback path distances < 2?
        
    }
    console.log("knockpath", knockback_path)

    let animationEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.RunAnimation,
        actor: knockbackData.target,
        playerInitiated: false,
        endsTurn: false,
        animationData: {
            animationType: Brew.Enums.BrewAnimationType.OverPath,
            code: knockbackData.target.code,
            color: Brew.Color.red,
            from_xy: knockbackData.target.location,
            to_xy: final_xy,
            path: knockback_path
        }
    }

    let moveEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.Move,
        actor: knockbackData.target,
        playerInitiated: false,
        endsTurn: false,
        moveData: {
            from_xy: knockbackData.target.location,
            to_xy: final_xy,
        }
    }

    // gm.insertEvent(moveEvent)
    // gm.insertEvent(animationEvent)
    gm.insertEvent_Next(moveEvent)
    gm.insertEvent_Next(animationEvent)

    gm.endEvent(brEvent)
}

function calculateKnockbackPath(gm: Brew.GameMaster, origin_xy: Brew.Coordinate, distance: number, target: Brew.GridThings.Monster) : Array<Brew.Coordinate> {

    let target_xy = target.location.clone()
    // let offset_xy = target_xy.subtract(origin_xy).toUnit()
    // // todo: calculate slope and use that instead of this method which will only give straights/diagonals
    // let flyaway_xy = offset_xy.multiplyScalar(distance)
    // let final_xy = target_xy.add(flyaway_xy)
    let final_xy = Brew.Utils.getTradjectoryCoordinate(origin_xy, target_xy, distance)

    let full_path = Brew.Utils.getLineBetweenPoints(target_xy, final_xy)
    let actual_path : Array<Brew.Coordinate> = []
    let level = gm.getCurrentLevel()
    let terrain_at : Brew.GridThings.Terrain
    let mob_at : Brew.GridThings.Monster
    let xy: Brew.Coordinate

    for (let i = 0; i < full_path.length; i++) {
        xy = full_path[i]
        if (!(level.isValid(xy))) {
            break
        }
        
        terrain_at = level.terrain.getAt(xy)
        if ((terrain_at.blocks_flying) || (terrain_at.is_solid)) {
            break
        } 
        
        mob_at = level.monsters.getAt(xy)
        if ((mob_at) && (i > 0)) {
            break
        }

        actual_path.push(xy)
        
    }

    return actual_path
}

export function calculateKnockbackDistance(gm: Brew.GameMaster, origin_xy: Brew.Coordinate, magnitude: number, target: Brew.GridThings.Monster) : number {

    let target_xy = target.location.clone()
    let dist = Math.floor(Brew.Utils.dist2d(origin_xy, target_xy))

    return Math.max(0, magnitude - dist)
}

export function triggerPortalUse(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {

    let portal : Brew.Portal = brEvent.portalData.portal_used 
    
    // is this the escape portal?
    let level = gm.getCurrentLevel()

    // figure out if we're going somewhere in the same level or new level
    if (portal.dest_level_id != gm.getCurrentLevel().id) {
        // going to a new level

        // make new levels on the fly!!
        Brew.LevelGenerator.buildAndAttachNewLevel(gm, level, portal)
        let changeLevelEvent = {...brEvent}
        changeLevelEvent.eventType = Brew.Enums.BrewEventType.ChangeLevel
        gm.insertEvent(changeLevelEvent)
    }

    // maybe it was an item
    let portal_thing : Brew.GridThings.Thing
    if (brEvent.itemData) {
        portal_thing = brEvent.itemData.item
    } else {
        portal_thing = brEvent.actor
    }
        
    gm.endEvent(brEvent)
}

// let movementDirectionCache 
export function rest(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // updateTurns(brEvent.actor.location, brEvent.actor.location)
    if (brEvent.actor.isSameThing(gm.getPlayer())) {
        resetStepTurns()
    }
    gm.endEvent(brEvent)
}

function resetStepTurns() {
    last_step = null
    turn_history = []
}
