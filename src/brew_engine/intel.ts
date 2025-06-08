import * as ROT from 'rot-js'
import * as Brew from "../brew"

function alliedMonsterHandler(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {
    
    let allyEvent : Brew.Enums.IBrewEvent

    let target_list = Brew.Targeting.getClosestTargets(gm, actor).filter((m, index, array) => {
        return m.team == Brew.Enums.Team.Enemy
    })
    
    if (target_list.length == 0) {
        
        // no targets, do we know where the player is?
        if (!(actor.hasKnowledgeOf(gm.getPlayer()))) {
            
            let movingNotWaiting : boolean = false
            // do we have a last known location for the player?
            if (actor.destination_xy) {
                let move_xy = getNextStepFromAStar(gm, actor, actor.destination_xy)
                
                if (move_xy) {
                    movingNotWaiting = true
                    allyEvent = {
                        eventType: Brew.Enums.BrewEventType.Move,
                        actor: actor,
                        endsTurn: true,
                        playerInitiated: false,
                        moveData: {
                            from_xy: actor.location.clone(),
                            to_xy: move_xy.clone()
                        }
                    }
                }
            }
            
            if (!(movingNotWaiting)) {

                // if not, wait
                allyEvent = {
                    eventType: Brew.Enums.BrewEventType.Wait,
                    actor: actor,
                    endsTurn: true,
                    playerInitiated: false
                }
            }

        } else {
            // got the player, hover around
            let dist_from_player = Math.floor(Brew.Utils.dist2d(actor.location, gm.getPlayer().location))
            let hover_range = Math.max(Brew.Config.ally_hover_range, actor.attack_range)
            // let hover_range = Config.ally_hover_range
            let move_xy = actor.location
            
            // update last known location
            actor.destination_xy = gm.getPlayer().location.clone()
            
            let goal_type : Brew.Path.PathmapGoalType
            let event_type : Brew.Enums.BrewEventType = Brew.Enums.BrewEventType.Move

            if (dist_from_player < hover_range) {
                goal_type = Brew.Path.PathmapGoalType.EscapeTarget
                let travel_pathmap : Brew.Path.Pathmap = getAppropriatePathmap(gm, goal_type, actor, false)
                move_xy = travel_pathmap.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel(), true)
                if ((!(move_xy)) || (move_xy.compare(actor.location))) {
                    event_type = Brew.Enums.BrewEventType.Wait
                }             

            } else {
                // goal_type = Brew.Path.PathmapGoalType.ToTarget

                move_xy = getNextStepFromAStar(gm, actor, actor.destination_xy)
                if ((!(move_xy)) || (move_xy.compare(actor.location))) {
                    event_type = Brew.Enums.BrewEventType.Wait
                }
            }


            
            allyEvent = {
                eventType: event_type,
                actor: actor,
                endsTurn: true,
                playerInitiated: false,
                moveData: {
                    from_xy: actor.location.clone(),
                    to_xy: move_xy.clone()
                }
            }

        }

    } else {
        // let's hunt the nearest target...
        // let first_target = target_list[0]
        // let reposition_result = aiHuntReposition(gm, actor, first_target)
        
        // if (reposition_result.shouldMove) {
            // allyEvent = reposition_result.moveEvent
        // } else {
            // allyEvent = aiHuntTarget(gm, actor, first_target)
        // }
        let first_target = target_list[0]
        allyEvent = aiHuntTarget(gm, actor, first_target)

        // allyEvent = {
        //     eventType: Brew.Enums.BrewEventType.Attack,
        //     actor: actor,
        //     endsTurn: true,
        //     playerInitiated: false,
        //     attackData: {
        //         from_xy: actor.location.clone(),
        //         to_xy: target.location.clone(),
        //         target: target,
        //         isMelee: (actor.attack_range == 1),
        //         damage: 1
        //     }
        // }
    }

    return allyEvent
}


function aiWander(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {

    // if we dont have a wander destination, get one
    if (!(actor.destination_xy)) {
        actor.destination_xy = getSafeLocation(gm, actor)
        actor.giveup = 0
    }
    
    if (actor.location.compare(actor.destination_xy)) {
        // reached our destination, get a new one
        actor.destination_xy = getSafeLocation(gm, actor)
        actor.giveup = 0
            
    } else  {
        // haven't reached our destination yet
        if (actor.giveup > 4) {
            // waited too long, get a new one
            actor.destination_xy = getSafeLocation(gm, actor)
            actor.giveup = 0
            console.log(`${actor.name} gives up`)
        } else {
            // keep our existing destination
        }
    }
    
    // go toward destination if possible
    let wanderEvent : Brew.Enums.IBrewEvent
    let new_xy = getNextStepFromAStar(gm, actor, actor.destination_xy)
    
    if (new_xy) {
        // got a valid path
        wanderEvent = {
            eventType: Brew.Enums.BrewEventType.Move,
            actor: actor,
            playerInitiated: false,
            endsTurn: true,
            moveData: {
                from_xy: actor.location.clone(),
                to_xy: new_xy
            }
        }

    } else {
        // couldn't pathfind, increase giveup count
        actor.giveup += 1
        wanderEvent = {
            eventType: Brew.Enums.BrewEventType.Wait,
            actor: actor,
            playerInitiated: false,
            endsTurn: true
        }
    }

    return wanderEvent
}

interface IRepositionResult {
    shouldMove: boolean
    moveEvent?: Brew.Enums.IBrewEvent
}

function findNearbyPackMembers(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, target: Brew.GridThings.Monster) : Array<Brew.GridThings.Monster> {
    let level = gm.getCurrentLevel()

    let monsters : Array<Brew.GridThings.Monster>  = level.monsters.getAllThings().filter((m, index, array) => {
        
        return (
            (actor.hasKnowledgeOf(m)) &&
            (!(m.isSameThing(actor))) &&
            (!(Brew.Intel.isEnemy(actor, m))) &&
            (m.isType(actor.getDefinition()))
        )
    })

    return monsters
}

function aiHuntReposition(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, target: Brew.GridThings.Monster) : IRepositionResult {
    
    //
    let repositionEvent : Brew.Enums.IBrewEvent
    let dist : number
    let pathmap : Brew.Path.Pathmap
    let new_xy : Brew.Coordinate

    // 
    let response : IRepositionResult = {
        shouldMove: false
    }

    if (actor.hasFlag(Brew.Enums.Flag.Immobile)) {
        return response
    }

    // figure out how close we are to our closest target
    dist = Brew.Utils.dist2d(actor.location, target.location)

    // let pathmap_to = getAppropriatePathmap(gm, Brew.Path.PathmapGoalType.ToTarget, actor)
    // let path_value = pathmap_to.field.getAt(actor.location)
    // if (!(path_value)) { throw new Error("missing pathmap value at location")}
    
    // use distance because we may not be able to see someone

    // check pack
    let pack_attack = actor.hasFlag(Brew.Enums.Flag.PackAttack)
    let pack_members = findNearbyPackMembers(gm, actor, target)
    let attack_range : number
    let keeps_distance : boolean

    if (pack_attack && (pack_members.length < (Brew.Config.pack_attack_size - 1))) { // self included
        attack_range = Brew.Config.pack_distance
        keeps_distance = true
    } else {
        attack_range = actor.attack_range
        keeps_distance = actor.hasFlag(Brew.Enums.Flag.KeepsDistance)
    }

    // check keeps distance
    if (keeps_distance) {

        if (dist < (attack_range - 1)) {
            // move away
            response.shouldMove = true
            pathmap = getAppropriatePathmap(gm, Brew.Path.PathmapGoalType.EscapeTarget, actor, false)
            new_xy = pathmap.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel())

        } else if (dist > attack_range) {
            // move closer
            response.shouldMove = true

            // ranged shooters can still probably (??) shoot over chasms
            let useRangedAttackOverride = (actor.attack_range > 1)
            
            pathmap = getAppropriatePathmap(gm, Brew.Path.PathmapGoalType.ToTarget, actor, useRangedAttackOverride)
            new_xy = pathmap.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel())

            if (useRangedAttackOverride && (!(Brew.Movement.canMoveToLocation(gm, actor, new_xy)))) {
                pathmap = getAppropriatePathmap(gm, Brew.Path.PathmapGoalType.EscapeTarget, actor, false)
                new_xy = pathmap.getUnblockedDownhillNeighbor(actor.location, gm.getCurrentLevel())                    
            }

        }

        if (response.shouldMove) {
            if (new_xy) {
                // valid movement from pathmap
                response.moveEvent = {
                    eventType: Brew.Enums.BrewEventType.Move,
                    actor: actor,
                    playerInitiated: false,
                    endsTurn: true,
                    moveData: {
                        from_xy: actor.location.clone(),
                        to_xy: new_xy
                    }
                }
            } else {
                // invalid pathmap response, no move event
                response.shouldMove = false
            }
        }
    }

    // for everyone else, move unless we can attack
    if ((!(response.shouldMove)) && (dist > actor.attack_range)) {
        // move closer
        response.shouldMove = true

        new_xy = getNextStepFromAStar(gm, actor, target.location.clone())

        if (new_xy) {
            // valid movement from AStar
            response.moveEvent = {
                eventType: Brew.Enums.BrewEventType.Move,
                actor: actor,
                playerInitiated: false,
                endsTurn: true,
                moveData: {
                    from_xy: actor.location.clone(),
                    to_xy: new_xy
                }
            }
        } else {
            // invalid AStar response, no move event
            response.shouldMove = false
        }
    }
    
    return response       
}

function aiHunt(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {
    // step 0 - find closest threat
    let target : Brew.GridThings.Monster
    target = Brew.Targeting.getClosestTarget(gm, actor)
    return aiHuntTarget(gm, actor, target)
}


function aiHuntTarget(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, target: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {

    let dist: number
    let new_xy : Brew.Coordinate
    let pathmap : Brew.Path.Pathmap
    let huntEvent : Brew.Enums.IBrewEvent
    let is_melee : boolean

    // step 1 - reposition if we need to
    let reposition_result = aiHuntReposition(gm, actor, target)
    if (reposition_result.shouldMove) {
        huntEvent = reposition_result.moveEvent
        return huntEvent
    }

    // step 2 - try and attack since we seem to be well positioned
    let valid_attack = false
    dist = Brew.Utils.dist2d(actor.location, target.location)
    if (dist <= actor.attack_range) {
        // inside attack range - make sure we can hit something
        is_melee = (dist == 1)

        huntEvent = Brew.Targeting.createTestTargetingEvent(actor, target, 1, 2)

        
        // make sure out path is clear
        let rangedAttackCheck = Brew.Targeting.checkTargetingPath(gm, huntEvent)
        if (rangedAttackCheck.is_valid || is_melee) {
            valid_attack = true
        }
    }

    if (!(valid_attack)) {
        // one of two things - 
        // within range but something is blocking us
        // outside attack range but apparently we didnt need to move?
        console.log(`${actor.name}:${actor.getID()} is stuck`)
        huntEvent = {
            eventType: Brew.Enums.BrewEventType.Wait,
            actor: actor,
            playerInitiated: false,
            endsTurn: true
        }
    }

    return huntEvent
}




// called from postal.js channel
export function mainAiHandler(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {

    if (actor.isType(Brew.Definitions.MonsterType.Architect)) {
        return Brew.Architect.architectAI(gm, actor)
    }

    // handle hacked/allied monsters
    if (actor.team == Brew.Enums.Team.PlayerAllied) {
        return alliedMonsterHandler(gm, actor)
    }

    if (actor.hasFlag(Brew.Enums.Flag.Stunned)) {
        let stunnedEvent = {
            eventType: Brew.Enums.BrewEventType.Wait,
            actor: actor,
            playerInitiated: false,
            endsTurn: true
        }

        return stunnedEvent
    }
    
    let level = gm.getCurrentLevel()
    let player = gm.getPlayer()
    
    // update FOV
    // todo: need this every turn for each monster?
    updateFov(gm, actor)

    // change status
    let is_changed : boolean
    is_changed = updateMonsterStatus(gm, actor)
    
    // find action
    let aiActionEvent : Brew.Enums.IBrewEvent

    if (actor.monster_status == Brew.Enums.MonsterStatus.Sleep) {
        // do nothing
        aiActionEvent = {
            eventType: Brew.Enums.BrewEventType.Wait,
            actor: actor,
            playerInitiated: false,
            endsTurn: true
        }
        
    } else if (actor.monster_status == Brew.Enums.MonsterStatus.Wander) {
        
        aiActionEvent = aiWander(gm, actor)
        
    } else if (actor.monster_status == Brew.Enums.MonsterStatus.Hunt) {

        aiActionEvent = aiHunt(gm, actor)

    } else if (actor.monster_status == Brew.Enums.MonsterStatus.Escape) {
        // todo: escape
    } else {
        throw new Error(`unknown monster status ${actor.monster_status} for ${actor.getID()}`)
    }
    
    // adjust for targeting locks
    if (aiActionEvent.eventType == Brew.Enums.BrewEventType.Attack) {
        let needs_lock = actor.hasFlag(Brew.Enums.Flag.NeedsTargetLock)
        let has_lock = Brew.Targeting.hasTargetLock(actor, aiActionEvent.attackData.target)

        if (needs_lock && (!(has_lock))) {
            aiActionEvent.eventType = Brew.Enums.BrewEventType.AcquireTarget
        }
    }
    return aiActionEvent
}

function updateMonsterStatus(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : boolean {
    let init_status = actor.monster_status
    let new_status : Brew.Enums.MonsterStatus
    let player_in_fov = actor.inFOV(gm.getPlayer()) && (!(gm.getPlayer().hasFlag(Brew.Enums.Flag.Invisible)))
    let enemy_in_view : boolean = false
    Brew.Targeting.getClosestTargets(gm, actor).forEach((m, index, array) => {
        if ([Brew.Enums.Team.Player, Brew.Enums.Team.PlayerAllied].indexOf(m.team) > -1) {
            enemy_in_view = true
        }
    })

    if (actor.monster_status == Brew.Enums.MonsterStatus.Sleep) {
        new_status = Brew.Enums.MonsterStatus.Sleep
        
    } else if (actor.monster_status == Brew.Enums.MonsterStatus.Wander) {
        if (player_in_fov || enemy_in_view) {
            // see the player for the 'first' time
            new_status = Brew.Enums.MonsterStatus.Hunt  
            actor.destination_xy = gm.getPlayer().location
            
        } else {
            // keep wandering
            new_status = Brew.Enums.MonsterStatus.Wander
        }
        
    } else if (actor.monster_status == Brew.Enums.MonsterStatus.Hunt) {
        if (player_in_fov || enemy_in_view) {
            // still hunting
            new_status = Brew.Enums.MonsterStatus.Hunt
            actor.destination_xy = gm.getPlayer().location // keep track of where we last saw the player

        } else {
            // stop hunting
            new_status = Brew.Enums.MonsterStatus.Wander
        }
        
    } else if (actor.monster_status == Brew.Enums.MonsterStatus.Escape) {
        // todo: escape
        new_status = Brew.Enums.MonsterStatus.Escape
        
    } else {
        throw new Error(`unknown monster status ${actor.monster_status} for ${actor.getID()}`)
    }
    
    actor.monster_status = new_status
    return init_status == new_status
}

function getAppropriatePathmap(gm: Brew.GameMaster, goal_type: Brew.Path.PathmapGoalType, actor: Brew.GridThings.Monster, rangedAttackOverride: boolean) : Brew.Path.Pathmap {
    let is_flying = actor.hasFlag(Brew.Enums.Flag.Flying) || rangedAttackOverride
    let use_escape = goal_type == Brew.Path.PathmapGoalType.EscapeTarget
    let pathmap : Brew.Path.Pathmap

    if (is_flying && use_escape) {
        pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.FromPlayer_Fly)
    } else if (is_flying && (!(use_escape))) {
        pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.ToPlayer_Fly)
    } else if ((!(is_flying)) && use_escape) {
        pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.FromPlayer_Walk)
    } else if ((!(is_flying)) && (!(use_escape))) {
        pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.ToPlayer_Walk)
    }

    return pathmap
}

function getNavigationType(gm : Brew.GameMaster, actor: Brew.GridThings.Monster): Brew.Enums.LevelNavigationType {
    if (actor.hasFlag(Brew.Enums.Flag.Flying)) {
        return Brew.Enums.LevelNavigationType.Fly
    } else {
        return Brew.Enums.LevelNavigationType.Walk
    }
}

function getNextStepFromAStar(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, destination_xy: Brew.Coordinate) : Brew.Coordinate {
    let path = getPathFromAStar(gm, actor, destination_xy)
    if (path.length <= 1) {
        return null
    } else {
        return path[1]
    }
}

export function getPathFromAStar(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, destination_xy: Brew.Coordinate, ignoreOtherMonsters: boolean = false ) : Array<Brew.Coordinate> {
    let level = gm.getCurrentLevel()
    let fn_passable = (x: number, y: number) : boolean => {
        let xy = new Brew.Coordinate(x, y)
        
        if (!(level.isValid(xy))) {
            return false
        }
        
        if (level.monsters.hasAt(xy)) {
            let monster_at = level.monsters.getAt(xy)
            if (monster_at.isSameThing(actor)) {
                return true
            } else if (xy.compare(destination_xy)) {
                return true
            } else if (ignoreOtherMonsters) {
                return true
            } else {
                return false
            }
        }

        // if (level.monsters.hasAt(xy) && (!(actor.location.compare(xy))))  {
        //     return false
        // }
        
        let t = level.terrain.getAt(xy)
        let can_move = Brew.Movement.canMoveToLocation(gm, actor, xy)
        return can_move
    }
    
    let path : Array<Brew.Coordinate> = []
    let fn_update_path = (x: number, y: number) : void => {
        // let xy = new Brew.Coordinate(x, y)
        path.push(new Brew.Coordinate(x, y))
    }
    
    
    let astar = new ROT.Path.AStar(destination_xy.x, destination_xy.y, fn_passable, {topology: Brew.Config.rotjs_topology})
    // let astar = new ROT.Path.Dijkstra(destination_xy.x, destination_xy.y, fn_passable, {topology: Brew.Config.rotjs_topology})
    astar.compute(actor.location.x, actor.location.y, fn_update_path)
    
    return path 
}

function getSafeLocation(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Coordinate {
    // returns a walkable, monster-free location
    
    let xy : Brew.Coordinate
    let tries = 0
    while (tries < 50) {
        xy = Brew.Utils.randomOf(gm.getCurrentLevel().getWalkableTiles())
        if (!(gm.getCurrentLevel().monsters.hasAt(xy))) {
            return xy
        }
        tries += 1
    }
    
    console.error("unable to find safe location")
    return null
}

export function runBeforePlayerTurn(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) {
    gm.updateAllPathmaps()
    let updates = updateFov(gm, actor)
    gm.display.drawFooter()
    gm.displayList(updates)  
}

export function runAfterPlayerTurn(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) {
    // gm.pathmap_to_player = Brew.Path.createGenericMapToPlayer(gm, gm.getCurrentLevel())
    // gm.pathmap_to_playerally = Brew.Path.createGenericMapToPlayerAlly(gm, gm.getCurrentLevel())
    // gm.pathmap_from_player = Brew.Path.createMapFromPlayer(gm, gm.getCurrentLevel(), gm.pathmap_to_player)
    // gm.pathmap_from_playerally = Brew.Path.createMapFromPlayer(gm, gm.getCurrentLevel(), gm.pathmap_to_playerally)
    
    let updates : Array<Brew.Coordinate>
    let all_updates : Array<Brew.Coordinate> = []

    // update fov for everyone
    gm.getCurrentLevel().monsters.getAllThings().forEach((mob: Brew.GridThings.Monster) => {
        if (isPlayer(gm, mob)) {
            return
        }

        updates = updateFov(gm, mob)
        all_updates.concat(updates)
    })
    gm.displayList(all_updates)
    gm.updateAllPathmaps()
    gm.turn_count += 1
}

export function isPlayer(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : boolean {
    // return actor.isType(Brew.Definitions.MonsterType.Hero)
    return actor.isSameThing(gm.getPlayer())
}

function createAllowVisionFn(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, active_range: number) : (x, y) => boolean {
    let xy: Brew.Coordinate
    let level = gm.getCurrentLevel()
    let t : Brew.GridThings.Terrain

    let fn_allow_vision = (x: number, y: number) => { 

        xy = new Brew.Coordinate(x, y)
        
        // can never see outside the level
        if (!(level.isValid(xy))) {
            return false
        } 
        
        //  can always see where you are standing
        if (xy.compare(actor.location)) {
            return true
        }
        
        if (Brew.Utils.dist2d(actor.location, xy) > active_range) {
            return false
        }
        
        t = level.terrain.getAt(xy)
        return (!(t.blocks_vision))
    }

    return fn_allow_vision
}

export function updateFov(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Array<Brew.Coordinate> {
    let old_fov : Array<Brew.Coordinate> = actor.fov.getAllCoordinates()
    let xy: Brew.Coordinate
    let numberkey : number
    
    actor.clearFov()
    actor.clearKnowledge()
    let level = gm.getCurrentLevel()
    let t : Brew.GridThings.Terrain

    let fn_allow_vision = createAllowVisionFn(gm, actor, actor.sight_range)
    let fn_allow_vision_limited = createAllowVisionFn(gm, actor, Brew.Config.local_sight_range)

    // let fn_update_fov = (x, y, r, visibility) => {
    let fn_update_fov = (x, y) => {
        // TODO: also update level for lightcasting
        // ye_level.setLightAt(new Brew.Coordinate(x, y), 1)
        xy = new Brew.Coordinate(x, y)
        if (level.isValid(xy)) {
            
            actor.fov.setAt(xy, Brew.Enums.BrewVisionSource.xSelf)
            updateMemoryAt(gm, actor, gm.getCurrentLevel().id, xy)

            // check for monsters and add them to our knowledge
            let m_at : Brew.GridThings.Monster = level.monsters.getAt(xy)
            if ((m_at) && (!(m_at.hasFlag(Brew.Enums.Flag.Invisible))))  {
                actor.knowledge.setAt(xy, m_at)
            }
            
        }
        
        return true
    }
    
    // debug fov: see all
    if (isPlayer(gm, actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowAll)) {
        
        level.terrain.getAllCoordinates().forEach((xy, index, array) => {
            actor.fov.setAt(xy, Brew.Enums.BrewVisionSource.xSelf)
        })
    } else {
        // otherwise, run FOV normally
        // let rot_fov = new ROT.FOV.PreciseShadowcasting(fn_allow_vision, {})
        // rot_fov.compute(actor.location.x, actor.location.y, actor.sight_range, fn_update_fov)
        let view_direction = Brew.Tank.getPrimaryFacingDirection(gm, actor)
        let turretPower = actor.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)

        Brew.FieldOfView.symmetricRecursiveShadowcasting_Directional(actor.location.x, actor.location.y, fn_allow_vision, fn_update_fov, view_direction)
        Brew.FieldOfView.symmetricRecursiveShadowcasting(actor.location.x, actor.location.y, fn_allow_vision_limited, fn_update_fov)

    }
    
    // debug fov: add other monster view
    // todo: add different types of view for shading/whatever (e.g. not just boolean true/false)
        if (isPlayer(gm, actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowMobs)) {
            actor.clearFov()
        }
    
    // if player has remote scan on, then show other mob FOV
    if ((isPlayer(gm, actor) && (Brew.Debug.debug_vision == Brew.Debug.Vision.ShowMobs)) || 
        (isPlayer(gm, actor) && (actor.hasFlag(Brew.Enums.Flag.RemoteScan)))) {
        // actor.clearFov()
        level.monsters.getAllThings().forEach((mob: Brew.GridThings.Monster, index, array) => {
            if (mob.isSameThing(actor)) {
                return
            }
            
            mob.fov.getAllCoordinates().forEach((xy, index, array) => {
                actor.fov.setAt(xy, Brew.Enums.BrewVisionSource.xRemote)
            })
        })
    }
    
    // let diff_xy_list = Brew.Utils.diffOfCoordinateArrays(old_fov, actor.fov.getAllCoordinates())
    let old_fov_coords = new Brew.CoordinateArea(old_fov)
    let new_fov_coords = new Brew.CoordinateArea(actor.fov.getAllCoordinates())
    let diff_xy_list = old_fov_coords.getSymmetricDiff(new_fov_coords).getCoordinates()
    
    
    return diff_xy_list
}

export function updateMemoryAt(gm: Brew.GameMaster, actor: Brew.GridThings.Monster, level_id: number, xy: Brew.Coordinate) {
    
    let level = gm.getCurrentLevel()
    
    if (actor.memory.hasAt(xy)) {
        actor.memory.removeAt(xy)
    }
    let terrain = level.terrain.getAt(xy)
    actor.memory.setAt(xy, terrain)

    let feature = level.features.getAt(xy)
    if (feature && (!(terrain.alwaysOnTop))) {
        actor.memory.removeAt(xy)
        actor.memory.setAt(xy, feature)
    }
    
    let it = level.items.getAt(xy)
    if (it) {
        actor.memory.removeAt(xy)
        actor.memory.setAt(xy, it)
    }
}

export function isEnemy(actor1: Brew.GridThings.Monster, actor2: Brew.GridThings.Monster) : boolean {
    // todo: move this and canMove / can / is stuff to Brew.Utils or some other useful area
    let is_enemy : boolean
    if (actor1.team == actor2.team) {
        is_enemy = false
    } else if (actor1.team == Brew.Enums.Team.Enemy) {
        // is_enemy = ([Team.Player, Team.PlayerAllied].indexOf(actor2.team) > -1)
        is_enemy = (actor2.team != Brew.Enums.Team.Enemy)
    } else { // actor1 is NOT on enemy team, therefore player or playerally
        is_enemy = (actor2.team == Brew.Enums.Team.Enemy)
    }
    return is_enemy
}

export function getMonstersKnownBy(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Array<Brew.GridThings.Monster> {
    // return all monsters that I know about except myself
    let level = gm.getCurrentLevel()

    return level.monsters.getAllThings().filter((m, index, array) => {
        // let dist2d = Math.floor(Brew.Utils.dist2d(actor.location, m.location))
        return (
            (actor.hasKnowledgeOf(m)) &&
            (actor.fov.hasAt(m.location)) && 
            (!(m.isSameThing(actor)))
        )
    })
}

export function getItemsKnownBy(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Array<Brew.GridThings.Item> {
    // return all monsters that I know about except myself
    let level = gm.getCurrentLevel()

    return level.items.getAllThings().filter((i, index, array) => {
        // let dist2d = Math.floor(Brew.Utils.dist2d(actor.location, m.location))
        return (
            // (actor.hasKnowledgeOf(i)) &&
            (actor.fov.hasAt(i.location)) 
        )
    })
}
