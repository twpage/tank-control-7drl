import * as Brew from "../brew"

enum TargetingError {
    TargetNotViewable = 1,
    TargetNotWalkable,
    PathBlockedByTerrain,
    PathBlockedByMob,
    TargetMonsterRequired,
    LessThanMinimumDistance,
    MoreThanMaximumDistance,
    LandingNotWalkable,
    TargetNotWithinFiringArc,
}

export interface ITargetingResponse {
    is_valid: boolean
    path: Array<Brew.Coordinate>
    error_reason?: TargetingError
    actual_xy?: Brew.Coordinate
}

//////////////////// target lock management

interface ITargetLock { 
    from: number,
    to: number
}

let targetLockList : Array<ITargetLock> = []

export function clearTargetLocks() {
    targetLockList = []
}

function matchTargetLock(attacker: Brew.GridThings.Monster, target: Brew.GridThings.Monster, given_targetlock: ITargetLock) : boolean {
    return (
        (attacker.getID() == given_targetlock.from) &&
        (target.getID() == given_targetlock.to)
    )
}

export function hasTargetLock(attacker: Brew.GridThings.Monster, target: Brew.GridThings.Monster) : boolean {
    let attacker_id = attacker.getID()
    let target_id = target.getID()
    
    let found_list = targetLockList.filter((targetlock) => {
        return matchTargetLock(attacker, target, targetlock)
    })

    return found_list.length > 0
}

function addTargetLock(attacker: Brew.GridThings.Monster, target: Brew.GridThings.Monster) {
    if (hasTargetLock(attacker, target)) {
        // no need to ask twice
        return
    }

    let new_lock : ITargetLock = {
        from: attacker.getID(),
        to: target.getID()
    }

    targetLockList.push(new_lock)
}

export function clearTargetLocksBy(attacker: Brew.GridThings.Monster) : number[] {
    let had_locks_on : number[] = []

    targetLockList = targetLockList.filter((targetlock) => {
        if (targetlock.from == attacker.getID()) {
            had_locks_on.push(targetlock.to)
            return false
        } else {
            return true
        }
    })

    return had_locks_on
}

export function clearTargetLocksOn(target: Brew.GridThings.Monster) : number[] {
    let had_locks_by : number[] = []

    targetLockList = targetLockList.filter((targetlock) => {
        if (targetlock.to == target.getID()) {
            had_locks_by.push(targetlock.from)
            return false
        } else {
            return true
        }
    })

    return had_locks_by
}

// export function getTargetLocksOn(target: Brew.GridThings.Monster) : Array<ITargetLock> {
//     //
//     return targetLockList.filter((targetlock) => {
//         return targetlock.to == target.getID()
//     })
// }

export function aquireTargetLockEvent(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // send in what would otherwise be an attack event
    let target = brEvent.attackData.target
    let attacker = brEvent.actor

    addTargetLock(attacker, target)

    // console.log("target locked")
    // flash when locking
    gm.insertEvent({
        eventType: Brew.Enums.BrewEventType.RunAnimation,
        actor: brEvent.actor,
        endsTurn: false,
        playerInitiated: false,
        animationData: {
            animationType: Brew.Enums.BrewAnimationType.Flash,
            color: Brew.Color.orange,
            from_xy: attacker.location.clone(),
            to_xy: attacker.location.clone(),
        }
    })
    gm.endEvent(brEvent)
}

//////////////////// targeting

export function targetingOn(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    
    // set up targeting data depending on type
    data.targetingData = Brew.Targeting.getTargetingDataByType(gm, data)
    
    // guess initial target
    let good_guess = false
    let guess_mob = getClosestTarget(gm, data.actor)
    if (guess_mob) {
        data.targetingData.to_xy = guess_mob.location
        
        // check new targeting and show the results
        let resp = Brew.Targeting.checkTargetingPath(gm, data)

        if (resp.is_valid) {
            showTargetingHighlights(gm, data, resp)
            good_guess = true
        }
    }
    
    // if we dont have a good guess or path is invalid then start from scratch
    if (!(good_guess)) {
        let tgtHighlight = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight)
        tgtHighlight.color = Brew.Color.target_cursor
        
        gm.display.highlights.setAt(gm.getPlayer().location, tgtHighlight)
        gm.displayAt(gm.getPlayer().location)
    }
    
    // examine is a special case
    if (data.targetingData.action == Brew.Enums.BrewTargetingAction.Examine) {
        gm.display.updateDescriptionFooterForPoint(data.targetingData.to_xy)
    }
    
    gm.input_handler = Brew.Enums.InputHandler.Targeting
    
    gm.endEvent(data)
}

export function targetingCancel(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    console.log("cancelling targeting")
    clearTargetingHighlights(gm)
    gm.display.drawFooter()
    gm.input_handler = Brew.Enums.InputHandler.Main
    gm.endEvent(data)
}

export function targetingFinish(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    
    // make sure we didn't error out first
    let resp = Brew.Targeting.checkTargetingPath(gm, data)
    if (!(resp.is_valid)) {
        targetingCancel(gm, data)
        return
    }

    // console.log("target gotten: ", data.targetingData.action)
    clearTargetingHighlights(gm)
    gm.input_handler = Brew.Enums.InputHandler.Main

    gm.copyEventDataFromLastEvent(data)
    data.targetingData.path = resp.path

    let nextEventAfterTargeting : Brew.Enums.IBrewEvent;
    
    if (data.targetingData.action == Brew.Enums.BrewTargetingAction.ThrowItem) {
        nextEventAfterTargeting = {
            // todo: change this to some kind of 'landing' event
            eventType: Brew.Enums.BrewEventType.Land,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: true,
            itemData: {
                item: data.itemData.item,
                invkey: data.itemData.invkey,
                to_xy: data.targetingData.to_xy.clone()
            }
        }

        let animationEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.RunAnimation,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,//TODO: maybe this breaks soemthing?
            animationData: {
                animationType: Brew.Enums.BrewAnimationType.OverPath,
                code: data.itemData.item.code,
                color: data.itemData.item.color,
                from_xy: data.actor.location.clone(),
                to_xy: data.targetingData.to_xy.clone()
            }

        }
        gm.insertEvent(animationEvent)

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.HeaveItem) {
        nextEventAfterTargeting = {
            // todo: change this to some kind of 'landing' event
            eventType: Brew.Enums.BrewEventType.Heave,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: true,
            itemData: {
                item: data.itemData.item,
                // invkey: data.itemData.invkey,
                to_xy: data.targetingData.to_xy.clone(),
                // from_xy: data.targetingData.from_xy.clone(),
            }
        }

        let animationEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.RunAnimation,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,//TODO: maybe this breaks soemthing?
            animationData: {
                animationType: Brew.Enums.BrewAnimationType.OverPath,
                code: data.itemData.item.code,
                color: data.itemData.item.color,
                from_xy: data.actor.location.clone(),
                to_xy: data.targetingData.to_xy.clone()
            }

        }
        gm.insertEvent(animationEvent)

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.ThrowHeavyAxe) {
        nextEventAfterTargeting = {
            eventType: Brew.Enums.BrewEventType.HeavyAxeThrow,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: true,
            pathsData: {
                from_xy: data.targetingData.from_xy.clone(),
                to_xy: data.targetingData.to_xy.clone(),
                path: data.targetingData.path
            },
            powerData: {...data.powerData}
        }

        let animationEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.RunAnimation,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,//TODO: maybe this breaks soemthing?
            animationData: {
                animationType: Brew.Enums.BrewAnimationType.OverPath,
                code: data.powerData.power.associated_item.code, //todo: need a better code for the axe
                color: Brew.Color.power_axe,
                from_xy: data.actor.location.clone(),
                to_xy: data.targetingData.to_xy.clone()
            }

        }
        gm.insertEvent(animationEvent)

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.Hack) {
        nextEventAfterTargeting = {
            
            eventType: Brew.Enums.BrewEventType.Hack,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: true,
            powerData: data.powerData,
            moveData: {
                to_xy: data.targetingData.to_xy.clone(),
                from_xy: data.targetingData.from_xy.clone()
            }
        }

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.RocketPunch) {
        nextEventAfterTargeting = {
            
            eventType: Brew.Enums.BrewEventType.RocketPunch,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: true,
            powerData: data.powerData,
            moveData: {
                to_xy: data.targetingData.to_xy.clone(),
                from_xy: data.targetingData.from_xy.clone()
            },
            targetingData: {...data.targetingData}
        }
    
    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.Examine) {

        nextEventAfterTargeting = {
            eventType: Brew.Enums.BrewEventType.Info,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,
            moveData: {
                from_xy: data.targetingData.from_xy,
                to_xy: data.targetingData.to_xy
            }
        }

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.DebugSummonMob) {

        nextEventAfterTargeting = {
            eventType: Brew.Enums.BrewEventType.DebugCreateMobAt,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,
            moveData: {
                from_xy: data.targetingData.from_xy,
                to_xy: data.targetingData.to_xy
            },
            debugMenuData: {...data.debugMenuData}
        }

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.DebugMakeFeature) {

        nextEventAfterTargeting = {
            eventType: Brew.Enums.BrewEventType.DebugCreateFeatureAt,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,
            moveData: {
                from_xy: data.targetingData.from_xy,
                to_xy: data.targetingData.to_xy
            },
            debugMenuData: {...data.debugMenuData}
        }

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.DebugMakeTerrain) {

        nextEventAfterTargeting = {
            eventType: Brew.Enums.BrewEventType.DebugCreateTerrainAt,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: false,
            moveData: {
                from_xy: data.targetingData.from_xy,
                to_xy: data.targetingData.to_xy
            },
            debugMenuData: {...data.debugMenuData}
        }

    } else if (data.targetingData.action == Brew.Enums.BrewTargetingAction.RangedAttack) {
        let attack_target = gm.getCurrentLevel().monsters.getAt(data.targetingData.to_xy)

        nextEventAfterTargeting = {
            
            eventType: Brew.Enums.BrewEventType.Attack,
            actor: data.actor,
            playerInitiated: true,
            endsTurn: true,
            powerData: data.powerData,
            attackData: {
                from_xy: data.targetingData.from_xy,
                to_xy: data.targetingData.to_xy,
                target: attack_target,
                isMelee: false,
                damage: data.powerData.power.associated_item.damage,
                effects: Brew.Combat.filterDamageEffects(data.powerData.power.associated_item.flags)
            }
        }

    } else {
        throw new Error(`unknown or unhandled type of targeting action ${data.targetingData.action}`)
    }

    gm.insertEvent_Next(nextEventAfterTargeting)
    gm.endEvent(data)         
}    

export function showTargetingHighlights(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent, targetingResponse : ITargetingResponse) {
    
    // clear the old highlights
    clearTargetingHighlights(gm)
    
    // setup our highlight colors
    let tHighlight = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight)
    tHighlight.color = Brew.Color.target_path
    let tCursor = Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight)
    
    // set highlights across the path and show them
    targetingResponse.path.forEach((xy: Brew.Coordinate, index, array) => {
        gm.display.highlights.setAt(xy, tHighlight)
    })
    
    // change cursor color depending on the outcome
    if (targetingResponse.is_valid) {
        tCursor.color = Brew.Color.target_cursor
    } else {
        tCursor.color = Brew.Color.target_error
    }
    
    // set the cursor by itself
    gm.display.highlights.removeAt(data.targetingData.to_xy)
    gm.display.highlights.setAt(data.targetingData.to_xy, tCursor)
    
    // tell the display to redraw all these new highlighted squares
    gm.displayList(targetingResponse.path.concat(data.targetingData.to_xy))
    // gm.displayAt(data.targetingData.to_xy)
}

export function clearTargetingHighlights(gm: Brew.GameMaster) {
    // actually just clear all highlights
    let copyList = gm.display.highlights.getAllCoordinates() 
    copyList.forEach((value, index, array) => {
        gm.display.highlights.removeAt(value)
    })
    gm.displayList(copyList)
}

export function targetingMove(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    // modify event, so we can grab last event next time.. keep updating target location as we move
    
    // move target
    let offset_xy = data.offsetData.offset_xy 
    let current_target_xy = data.targetingData.to_xy
    let new_target_xy = current_target_xy.add(offset_xy)

    // twp: copy event data from last event, so we keep track of our item/target thing/etc
    // let lastEventData = gm.getLastEvent().itemData
    // data.itemData = {...lastEventData}
    gm.copyEventDataFromLastEvent(data)
    
    // set new target
    data.targetingData.to_xy = new_target_xy
    
    // check new targeting and show the results
    let resp = Brew.Targeting.checkTargetingPath(gm, data)
    showTargetingHighlights(gm, data, resp)
    
    // examine is a special case - apply this code as we go
    if (data.targetingData.action == Brew.Enums.BrewTargetingAction.Examine) {
        gm.display.updateDescriptionFooterForPoint(data.targetingData.to_xy)
    }
    
    gm.endEvent(data)
}

export function checkTargetingPath(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) : ITargetingResponse {
    
    let level = gm.getCurrentLevel()
    let target_xy : Brew.Coordinate = data.targetingData.to_xy
    let in_fov : boolean = data.actor.fov.hasAt(target_xy) //data.actor.inFOV(t)

    // initial response
    let response : ITargetingResponse = {
        is_valid: false,
        path: []
    }

    // check target first, easier than checking the entire path
    if ((!in_fov) &&  data.targetingData.destinationMustBeVisible) {
        response.error_reason = TargetingError.TargetNotViewable
        return response
    }

    let terrain_at = level.terrain.getAt(target_xy)
    if (terrain_at.blocks_walking && data.targetingData.destinationMustBeWalkable) {
        response.error_reason = TargetingError.TargetNotWalkable
        return response
    }


    if (data.targetingData.method == Brew.Enums.BrewTargetingMethod.PointOnly) {
        
        response.path = [target_xy]
        response.is_valid = true

    } else if (data.targetingData.method == Brew.Enums.BrewTargetingMethod.StraightLine) {
        
        // draw new path
        let path_lst = Brew.Utils.getLineBetweenPoints(data.targetingData.from_xy, data.targetingData.to_xy)

        // check for minimum distance
        if (path_lst.length < data.targetingData.minimumDistance) {
            response.is_valid = false
            response.error_reason = TargetingError.LessThanMinimumDistance
            return response
        }

        // check for max distance
        if (data.targetingData.maximumDistance && (path_lst.length > data.targetingData.maximumDistance)) {
            response.is_valid = false
            response.error_reason = TargetingError.MoreThanMaximumDistance
            return response
        }

        // check for within arc
        if (data.targetingData.minimumArc) {
            let target_offset_polar = Brew.Utils.xyToPolar(target_xy, data.targetingData.from_xy)
            let target_angle = target_offset_polar.angle_theta

            if ((Math.abs(data.targetingData.midpointArc) == Math.PI) && (target_offset_polar.angle_theta < 0)) {
                target_angle = Math.PI + (Math.PI - Math.abs(target_angle))
            }

            let in_arc1 = (target_angle >= data.targetingData.minimumArc) && (target_angle <= data.targetingData.midpointArc)
            let in_arc2 = (target_angle >= data.targetingData.midpointArc) && (target_angle <= data.targetingData.maximumArc)

            if (!(in_arc1 || in_arc2)) {
                response.is_valid = false
                response.error_reason = TargetingError.TargetNotWithinFiringArc
                return response
            }
    
        }
        

        // assume path is true unless we run into something
        response.is_valid = true
        
        let real_path_lst : Array<Brew.Coordinate> = []
        
        for (let i = 0; i < path_lst.length; i++) {
            let xy = path_lst[i] 
            let t = level.terrain.getAt(xy)
            in_fov = data.actor.fov.hasAt(xy) //data.actor.inFOV(t)
            
            if (data.targetingData.destinationMustBeVisible && (!(in_fov))) {
                response.is_valid = false
                response.error_reason = TargetingError.TargetNotViewable
                break
            } 
            
            if (data.targetingData.pathBlockedByNonWalkable && t.blocks_walking) {
                response.is_valid = false
                response.error_reason = TargetingError.PathBlockedByTerrain
                break
            }

            if (data.targetingData.pathBlockedByNonFlyable && t.blocks_flying) {
                response.is_valid = false
                response.error_reason = TargetingError.PathBlockedByTerrain
                break
            }

            let m = level.monsters.getAt(xy)
            let last_element = i == (path_lst.length - 1)
            
            if (!(last_element)) {
                
                // not the last coord, but mob is in the way
                if (data.targetingData.pathBlockedByMobs && (m) && (!(i == 0))) {
                    real_path_lst.push(xy)
                    response.is_valid = false
                    response.error_reason = TargetingError.PathBlockedByMob
                    response.actual_xy = xy.clone()
                    break
                }
                
            } else {
                // is the last element, check if we need to have a mob target
                // todo: maybe some kind of good / bad indicator for the path
            } 
            
            real_path_lst.push(xy)
        } // end path for loop
        
        response.path = real_path_lst
    } // end if

    // see if we need a target at the end of everything
    if (response.is_valid && data.targetingData.destinationMustHaveMob) {
        let check_m = level.monsters.getAt(target_xy)
        if (!(check_m)) {
            response.is_valid = false
            response.error_reason = TargetingError.TargetMonsterRequired

        } else if (!(data.actor.hasKnowledgeOf(check_m))) {
            response.is_valid = false
            response.error_reason = TargetingError.TargetMonsterRequired
        }
    }

    // special check for 'actual' landing spot
    if (response.actual_xy) {
        let terrain_at = level.terrain.getAt(response.actual_xy)
        if (data.targetingData.destinationMustBeWalkable && terrain_at.blocks_walking) {
            response.is_valid = false
            response.error_reason = TargetingError.LandingNotWalkable
        }
    }

    return response
}

export function getTargetingDataByType(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) :  Brew.Enums.IBrewTargetingData{
    let tgtAction =  data.startTargetingData.targetingAction
    let result : Brew.Enums.IBrewTargetingData
    let power : Brew.Powers.Power

    if ([Brew.Enums.BrewTargetingAction.RangedAttack].indexOf(tgtAction) > -1) {
        // let firing_range = Brew.Tank.getFiringArcRange(gm, data.actor.location, )
        let mob_target_required : boolean = (data.powerData.power.powerType != Brew.Enums.BrewPowerType.TurretCannon)

        result = {
            action: data.startTargetingData.targetingAction, // copied over from initial event
            origin_xy: gm.getPlayer().location.clone(),
            from_xy: gm.getPlayer().location.clone(),
            to_xy: gm.getPlayer().location.clone(),
            method: Brew.Enums.BrewTargetingMethod.StraightLine, 
            destinationMustBeVisible: true,  
            destinationMustBeWalkable: false,
            destinationMustHaveMob: mob_target_required,
            pathBlockedByNonFlyable: true,
            pathBlockedByNonWalkable: false,
            pathBlockedByMobs: true,
            minimumDistance: 0,
            minimumArc: data.startTargetingData.minimumArc,
            maximumArc: data.startTargetingData.maximumArc,
            midpointArc: data.startTargetingData.midpointArc,
        }

    } else if ([Brew.Enums.BrewTargetingAction.Examine, Brew.Enums.BrewTargetingAction.DebugSummonMob, Brew.Enums.BrewTargetingAction.DebugMakeFeature, Brew.Enums.BrewTargetingAction.DebugMakeTerrain].indexOf(tgtAction) > -1) {
        result = {
            action: data.startTargetingData.targetingAction, // copied over from initial event
            origin_xy: gm.getPlayer().location.clone(),
            from_xy: gm.getPlayer().location.clone(),
            to_xy: gm.getPlayer().location.clone(),
            method: Brew.Enums.BrewTargetingMethod.PointOnly,
            destinationMustBeVisible: false,  
            destinationMustBeWalkable: false,
            destinationMustHaveMob: false,
            pathBlockedByNonFlyable: false,
            pathBlockedByNonWalkable: false,
            pathBlockedByMobs: false,
            minimumDistance: 0,
        }

    } else {
        // default case
        result = {
            action: data.startTargetingData.targetingAction, // copied over from initial event
            origin_xy: gm.getPlayer().location.clone(),
            from_xy: gm.getPlayer().location.clone(),
            to_xy: gm.getPlayer().location.clone(),
            method: Brew.Enums.BrewTargetingMethod.StraightLine, 
            destinationMustBeVisible: true,  
            destinationMustBeWalkable: true,
            destinationMustHaveMob: false,
            pathBlockedByNonFlyable: true,
            pathBlockedByNonWalkable: false,
            pathBlockedByMobs: true,
            minimumDistance: 0,
        }
    }

    return result
}

interface Dict<T> {
    [key: number]: T
}

export function getClosestTargets(gm : Brew.GameMaster, actor: Brew.GridThings.Monster) : Array<Brew.GridThings.Monster> {
    // return closest target within attack range
    let level = gm.getCurrentLevel()
    let distMap : Dict<number> = {}

    for (let m of level.monsters.getAllThings()) {
        let dist2d = Brew.Utils.dist2d(actor.location, m.location)
        distMap[m.getID()] = dist2d
    }

    let monsters : Array<Brew.GridThings.Monster>  = Brew.Intel.getMonstersKnownBy(gm, actor).filter((m, index, array) => {
        // let dist2d = Math.floor(Utils.dist2d(actor.location, m.location))
        return (Brew.Intel.isEnemy(actor, m)) //&& 
            // (dist2d <= actor.attack_range)
        
    }).sort((aMob, bMob) => {
        return distMap[aMob.getID()] - distMap[bMob.getID()]
    })

    return monsters
}

export function getClosestTarget(gm : Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.GridThings.Monster {
    let targets = getClosestTargets(gm, actor)
    if (targets.length == 0) {
        return null
    } else {
        return targets[0]
    }
}

export function isRangedAttackThreat(gm: Brew.GameMaster, potential_attacker : Brew.GridThings.Monster, target: Brew.GridThings.Monster) : boolean {
    // friends should not be threats
    if (!(Brew.Intel.isEnemy(target, potential_attacker))) {
        return false
    }
    
    // if they have a lock then they've already been through all the algorithms
    if (hasTargetLock(potential_attacker, target)) {
        return true
    }

    // melee-only bad guys shouldnt ever be ranged threats
    if (potential_attacker.attack_range == 1) {
        return false
    }

    // if they need a lock but don't have one then obviously they fail this test
    if (potential_attacker.hasFlag(Brew.Enums.Flag.NeedsTargetLock)) {
        return false
    }

    // otherwise check if they have a clear shot
    let testTargetEvent = createTestTargetingEvent(potential_attacker, target, 0, 2)
    let targeting_check = checkTargetingPath(gm, testTargetEvent)
    return targeting_check.is_valid
}

export function createTestTargetingEvent(potential_attacker: Brew.GridThings.Monster, target: Brew.GridThings.Monster, damage : number, min_distance : number) : Brew.Enums.IBrewEvent {
    let testTargetEvent : Brew.Enums.IBrewEvent
    testTargetEvent = {
        eventType: Brew.Enums.BrewEventType.Attack,
        actor: potential_attacker,
        playerInitiated: false,
        endsTurn: true,
        attackData: {
            from_xy: potential_attacker.location.clone(),
            to_xy: target.location.clone(),
            target: target,
            isMelee: false,
            damage: damage
        }
    }
    testTargetEvent.targetingData = {
        action: Brew.Enums.BrewTargetingAction.RangedAttack,
        method: Brew.Enums.BrewTargetingMethod.StraightLine,
        destinationMustBeVisible: true,
        destinationMustHaveMob: true,
        destinationMustBeWalkable: false, // can still attack
        origin_xy: testTargetEvent.attackData.from_xy,
        from_xy: testTargetEvent.attackData.from_xy,
        to_xy: testTargetEvent.attackData.to_xy,
        minimumDistance: min_distance,
        pathBlockedByMobs: true,
        pathBlockedByNonWalkable: false,
        pathBlockedByNonFlyable: true,
    }

    return testTargetEvent
}
