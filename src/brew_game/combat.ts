import * as Brew from "../brew"

export function killMonster(gm : Brew.GameMaster, victim: Brew.GridThings.Monster) {
    let level = gm.getCurrentLevel()
    let xy = victim.location.clone()
    level.monsters.removeAt(xy)
    gm.displayAt(xy)
    gm.removeActorFromScheduler(victim)

    // todo: animate parts/blood spray
    // let surrounding_xy_list = xy.getAdjacent()
    let nearby_xy : Brew.Coordinate
    let item_at : Brew.GridThings.Item
    // todo: randomize/configurize # of parts
    // for (let i = 0; i < 4; i++) {
    //     let random_angle = Math.floor(Math.random()*2*Math.PI)
    //     let random_distance = Brew.Utils.getRandomInt(1, 3)
    //     let offset_xy = Brew.Utils.getPolarOffsetCoordinate(random_angle, random_distance)
    //     nearby_xy = xy.add(offset_xy)
    //     // nearby_xy = randomOf(surrounding_xy_list)
    //     if (!(level.isValid(nearby_xy))) {
    //         continue
    //     }
    //     if (level.terrain.getAt(nearby_xy).blocks_flying) {
    //         continue
    //     }
    //     item_at = level.items.getAt(nearby_xy)
    //     if (item_at) {
    //         continue
    //     }

    //     level.features.setAt(nearby_xy, Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.Scrap))
    //     gm.displayAt(nearby_xy)
    // }        
    // level.features.setAt(xy, Brew.Definitions.featureFactory(Definitions.FeatureType.RepairGoo))
    
    // leave corpses for all HP > 1
    // if (victim.hp.getMaxLevel() > 1) {
    //     let corpse_xy : Brew.Coordinate
    //     item_at = level.items.getAt(xy)
    //     if (item_at) {
    //         let nearby_xy = level.getSafeLocationNear(xy, true)
    //         level.items.removeAt(xy)
    //         level.items.setAt(nearby_xy, item_at)
    //         gm.displayAt(nearby_xy)
    //     }
    //     level.items.setAt(xy, Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Wreckage))
    //     gm.displayAt(xy)
    // }

    let didTrigger = triggerOnDeath(gm, victim)
}

function triggerOnDeath(gm: Brew.GameMaster, victim: Brew.GridThings.Monster) : boolean {

    let num_events = 0

    if (victim.hasFlag(Brew.Enums.Flag.OnDeathKnockback)) {
        
        num_events += triggerKnockbackBlast(gm, victim.location.clone(), 10, [victim]) // todo: config blast radius

    }

    return (num_events > 0)
}

export function triggerKnockbackBlast(gm: Brew.GameMaster, origin_xy: Brew.Coordinate, magnitude: number, excluded_mobs: Array<Brew.GridThings.Monster> = []) : number {
    let num_events = 0

    let level = gm.getCurrentLevel()
    let dist : number

    // figure out which targets are affected by the blast
    // also build a distance map so we dont have to recalc everything again
    let area = Brew.Utils.getBlastArea(level, origin_xy, magnitude)
    area.removeCoordinate(origin_xy)
    let affected_mobs = Brew.Utils.getMonstersWithinCoordinateArea(level, area)

    affected_mobs.sort((mob_a, mob_b) : number => {
        return Brew.Utils.dist2d(origin_xy, mob_b.location) - Brew.Utils.dist2d(origin_xy, mob_a.location)
    })

    // console.log(affected_mobs)
    let trigger_actor  = level.monsters.getAt(origin_xy)
    if (!(trigger_actor)) {
        trigger_actor = gm.getArchitect()
    }

    let kdist : number
    let knockbackEvent : Brew.Enums.IBrewEvent
    affected_mobs.forEach((mob: Brew.GridThings.Monster) => {
        kdist = Brew.Movement.calculateKnockbackDistance(gm, origin_xy, magnitude, mob)
        
        knockbackEvent = {
            eventType: Brew.Enums.BrewEventType.Knockback,
            actor: trigger_actor,
            playerInitiated: false,
            endsTurn: false,
            knockbackData: {
                magnitude: magnitude,
                origin_xy: origin_xy,
                target: mob
            }
        }
        gm.insertEvent(knockbackEvent)
        num_events += 1
    })

    gm.insertEvent({
        eventType: Brew.Enums.BrewEventType.RunAnimation,
        actor: trigger_actor,
        playerInitiated: false,
        endsTurn: false,
        animationData: {
            animationType: Brew.Enums.BrewAnimationType.CircleOut,
            color: Brew.Color.color_force,
            from_xy: origin_xy,
            to_xy: origin_xy,
            range: magnitude
        }
    })
    return num_events
}

export function calcDamage(gm: Brew.GameMaster, attacker : Brew.GridThings.Monster, victim: Brew.GridThings.Monster, damage : number) : Brew.Enums.IBrewDamageEventData {
    // see how much damage victim can absorb
    // let shield_strength = 0
    // let shield : Brew.Power = victim.getPowers().getPowerOfType(BrewPowerType.Shield)
    
    // if ((shield) && (shield.currentCharge > 0)) {
    //     shield_strength = shield.currentCharge
    // }
    let shield_strength: number = 0

    if (victim) {
        shield_strength = victim.shields.getCurrentLevel()
    }

    let hp_damage : number
    let shield_damage : number
    let is_fatal : boolean = false

    if (shield_strength >= damage) {
        hp_damage = 0
        shield_damage = damage

        if ((shield_strength == shield_damage) && (victim.isSameThing(gm.getPlayer()))) {
            // if we just lost our shield, recolor
            victim.color = Brew.Color.hero_blue
        }
    } else if ((victim) && (victim.hasFlag(Brew.Enums.Flag.Invulnerable))) {
        hp_damage = 0
        
    } else {

        hp_damage = damage - shield_strength
        shield_damage = shield_strength
        if (victim) {
            is_fatal = ((victim.hp.getCurrentLevel() - hp_damage) <= 0)
        } else {
            is_fatal = false
        }
        
    }

    // if target is already WEAK, every attack with damage over 1 is fatal
    if (victim) {
        let is_weakened = victim.hasFlag(Brew.Enums.Flag.Weak)

        if (is_weakened && (hp_damage > 0)) {
            is_fatal = true
        }
    }
    
    return {
        target: victim,
        damageToHP: hp_damage,
        damageToShields: shield_damage,
        shieldUsed: null,
        isFatal: is_fatal
    }
}

export function applyDamage(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let victim : Brew.GridThings.Monster = data.damageData.target
    // console.log("applying damage")

    let calc_damage = data.damageData

    if (victim) {

        // apply damage
        if (calc_damage.damageToShields > 0) {
            victim.shields.decrement(calc_damage.damageToShields)
        } 

        if (calc_damage.damageToHP > 0) {
            victim.hp.decrement(calc_damage.damageToHP)
        }

        let flash_color : number[]
        if (data.damageData.damageToShields > data.damageData.damageToHP) {
            flash_color = Brew.Color.power_shield
        } else {
            flash_color = Brew.Color.damage_flash
        }

        let animationEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.RunAnimation,
            actor: data.actor,
            endsTurn: false,
            playerInitiated: true, // todo: check if is-player
            animationData: {
                animationType: Brew.Enums.BrewAnimationType.Flash,
                from_xy: null,
                to_xy: data.damageData.target.location,
                color: flash_color
            }
        }
        gm.insertEvent(animationEvent)
    }

    if ((victim) && (calc_damage.isFatal) && (victim.isSameThing(gm.getPlayer()))) {
        
        let fatalEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.PlayerDeath,
            actor: data.actor,
            playerInitiated: false,
            endsTurn: true
        }
        // data.endsTurn = false
        gm.insertEvent(fatalEvent)
        gm.endEvent(data)
        

    } else {
        if ((victim) && (calc_damage.isFatal)) {
            // someone else died
            killMonster(gm, victim)
        }

        if (data.damageData.effects) {
            if (victim) {
                applyCombatEffects(gm, data.actor, victim, data.damageData.effects)
            } else {
                applyCombatEffects(gm, data.actor, null, data.damageData.effects, data.attackData.to_xy)
            }
        }

        gm.endEvent(data)
    }
}

function applyCombatEffects(gm: Brew.GameMaster, attacker: Brew.GridThings.Monster, victim: Brew.GridThings.Monster, effects: Array<Brew.Enums.Flag>, nonvictim_target_xy?: Brew.Coordinate) {

    if (victim) {
        if (effects.indexOf(Brew.Enums.Flag.CausesStun) > -1) {
            gm.timer_monitor.setFlagWithTimer(gm, victim, Brew.Enums.Flag.Stunned, 5)
            gm.displayAt(victim.location)
        }

        if (effects.indexOf(Brew.Enums.Flag.CausesWeak) > -1) {
            gm.timer_monitor.setFlagWithTimer(gm, victim, Brew.Enums.Flag.Weak, 5)
            gm.displayAt(victim.location)
        }

        if (effects.indexOf(Brew.Enums.Flag.CausesInvulnerable) > -1) {
            gm.timer_monitor.setFlagWithTimer(gm, victim, Brew.Enums.Flag.Invulnerable, 5)
            gm.displayAt(victim.location)
        }
    }

    if (effects.indexOf(Brew.Enums.Flag.CausesExplosion) > -1) {
        // let explosion_damage = 2
        let fake_grenade : Brew.GridThings.Item = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Grenade, { damage: Brew.Config.explosion_damage })
        fake_grenade.subtype = Brew.Definitions.ItemSubtype.G_Explosive
        let target_xy : Brew.Coordinate
        if (victim) {
            target_xy = victim.location.clone()
        } else if (nonvictim_target_xy) {
            target_xy = nonvictim_target_xy
        } else {
            throw new Error("missing target coord for non-victim explosion")
        }
        Brew.ItemInteraction.triggerGrenade(gm, fake_grenade, target_xy)

    }

    if (effects.indexOf(Brew.Enums.Flag.CausesKnockback) > -1) {
        let magnitude = Brew.Movement.calculateKnockbackDistance(gm, attacker.location, 10, victim)
        
        let knockbackEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.Knockback,
            actor: attacker,
            playerInitiated: false,
            endsTurn: false,
            knockbackData: {
                magnitude: magnitude,
                origin_xy: attacker.location.clone(),
                target: victim
            }
        }
        gm.insertEvent(knockbackEvent)
    }

}

export function possiblyConvertAttackToSmashAttack(gm: Brew.GameMaster, attackEvent: Brew.Enums.IBrewEvent) : Brew.Enums.IBrewEvent {
    if (!(Brew.Intel.isPlayer(gm, attackEvent.actor))) {
        // only player can wall smash (for now?)
        return attackEvent
    }

    let wallsmash_response = Brew.Combat.checkForWallSmash(gm, attackEvent.actor, attackEvent.attackData.target)
    if (wallsmash_response.is_wall_smash) {
        attackEvent.eventType = Brew.Enums.BrewEventType.SmashAttack
        attackEvent.attackData.damage *= 2
        attackEvent.attackData.behind_xy = wallsmash_response.behind_target_xy
    }

    return attackEvent
}

export function attack(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let animationEvent : Brew.Enums.IBrewEvent
    let victim : Brew.GridThings.Monster = data.attackData.target
    
    if (data.powerData) {
        data.powerData.power.charge_stat.decrement(1)
    }

    // when you get attacked go into hunting mode no matter what
    if (victim) {
        if (!(victim.isSameThing(gm.getPlayer()))) {
            victim.monster_status = Brew.Enums.MonsterStatus.Hunt
        }
    }

    let damageEvent : Brew.Enums.IBrewEvent = {...data}
    damageEvent.eventType = Brew.Enums.BrewEventType.ApplyDamage
    
    // if we already have damage calcs passed in, use them, if not, calculate now
    if (!(damageEvent.damageData)) {
        damageEvent.damageData = calcDamage(gm, data.actor, victim, data.attackData.damage)
    }

    // add any effects to the damage event
    if (data.attackData.effects) {
        damageEvent.damageData.effects = data.attackData.effects.concat([])
    }

    if ((data.attackData.isMelee) || ((victim) && (victim.location.compare(data.actor.location)))) {
        console.log(`${data.actor.name} attacks ${data.attackData.target.name}`)

        gm.insertEvent(damageEvent)

        gm.endEvent(data)

    } else {
        // handle ranged attacks
        // console.log(`${data.actor.name} SHOOTS ${data.attackData.target.name}`)

        animationEvent = {
            eventType: Brew.Enums.BrewEventType.RunAnimation,
            actor: data.actor,
            endsTurn: false,
            playerInitiated: true, // todo: check if is-player
            animationData: {
                animationType: Brew.Enums.BrewAnimationType.OverPath,
                from_xy: data.attackData.from_xy,
                to_xy: data.attackData.to_xy,
                color: data.actor.color, // todo: how to color ranged attacks
                code: '*'
            }
        }
        gm.insertEvent_Next(animationEvent)
        gm.insertEvent(damageEvent)

        gm.endEvent(data)
    }
}
export interface IWallSmashResponse {
    is_wall_smash: boolean
    behind_target_xy: Brew.Coordinate
}

export function checkForWallSmash(gm: Brew.GameMaster, attacker: Brew.GridThings.Monster, target: Brew.GridThings.Monster) : IWallSmashResponse {
    // check for wall smashing
    let attack_offset_xy = target.location.subtract(attacker.location).toUnit()
    // let behind_target_xy = attacker.location.add(attack_offset_xy.multiplyScalar(2))
    let behind_target_xy = target.location.add(attack_offset_xy.multiplyScalar(1))
    let level = gm.getCurrentLevel()

    if (level.isValid(behind_target_xy)) {
        let terrain_at = level.terrain.getAt(behind_target_xy)
        // if (terrain_at.blocks_walking) {
        if ((terrain_at.blocks_flying) || terrain_at.is_solid){
            return {
                is_wall_smash: true,
                behind_target_xy: behind_target_xy
            }
        }
    }
    return {
        is_wall_smash: false,
        behind_target_xy: behind_target_xy
    }
}

export function smash_attack(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    
    if (data.powerData) {
        data.powerData.power.charge_stat.decrement(1)
    }

    let victim : Brew.GridThings.Monster = data.attackData.target
    let calc_damage = calcDamage(gm, data.actor, victim, data.attackData.damage)

    // depending on what was behind the attack, maybe break something
    let level = gm.getCurrentLevel()
    if (data.attackData.behind_xy) {
        
        let terrain_at = level.terrain.getAt(data.attackData.behind_xy)
        if (Brew.Movement.isDoor(terrain_at)) {
            level.terrain.removeAt(data.attackData.behind_xy)
            level.terrain.setAt(data.attackData.behind_xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.DoorBroken))
            gm.displayAt(data.attackData.behind_xy)
        }
    }

    if (calc_damage.isFatal) {
        // when smash attacks are fatal, move player into dead victims spot

        // move the player into that spot
        let level = gm.getCurrentLevel()
        let old_xy = gm.getPlayer().location
        let new_xy = victim.location.clone()

        killMonster(gm, victim)
        
        level.monsters.removeAt(old_xy)
        level.monsters.setAt(new_xy, gm.getPlayer())
        gm.displayList([old_xy, new_xy])
        
        let animationEvent = Brew.Animations.createCircleAnimationEvent(data, Brew.Color.damage_flash, 3)
        animationEvent.animationData.to_xy = data.attackData.to_xy
        gm.insertEvent(animationEvent)
        // Brew.Animations.animateCircle(gm, data.attackData.to_xy, 3, Brew.Color.damage_flash, data)
        
        gm.endEvent(data)

    } else {
        data.damageData = calc_damage
        attack(gm, data)
    }
}

export function applyMassDamage(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let xy_list = brEvent.pathsData.path
    let attackData : Brew.Enums.IBrewAttackEventData = brEvent.attackData
    let level = gm.getCurrentLevel()

    xy_list.forEach((xy: Brew.Coordinate, index: number, array) => {
        let mob_at = level.monsters.getAt(xy)
        // todo: damage/affect terrain, items, etc.
        if (mob_at) {
            let damageData = calcDamage(gm, brEvent.actor, mob_at, attackData.damage)
            
            let damageEvent : Brew.Enums.IBrewEvent = {
                eventType: Brew.Enums.BrewEventType.ApplyDamage,
                actor: brEvent.actor,
                playerInitiated: false,
                endsTurn: false,
                damageData: damageData
            }
            damageEvent.damageData.effects = brEvent.attackData.effects
            
            gm.insertEvent(damageEvent)
        }
    })

    gm.endEvent(brEvent)
}

export function filterDamageEffects(listOfFlags: Array<Brew.Enums.Flag>) : Array<Brew.Enums.Flag> {
    let combat_effects_list = [
        Brew.Enums.Flag.CausesKnockback,
        Brew.Enums.Flag.CausesStun,
        Brew.Enums.Flag.CausesExplosion,
    ]

    return listOfFlags.filter((my_flag: Brew.Enums.Flag) => {
        return (combat_effects_list.indexOf(my_flag) > -1)
    })
}
