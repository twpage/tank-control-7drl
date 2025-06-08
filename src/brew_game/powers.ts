import * as Brew from "../brew"

export interface IBrewPowerDefinition {
    powerType: Brew.Enums.BrewPowerType
    canBeRecharged: boolean
    startingCharges: number
    maxStrength: number
    // strength: number
    color: number[]
    conveys_flags?: Array<Brew.Enums.Flag>
}

export class Power {
    id: number
    color: number[]
    charge_stat : Brew.Stat
    powerType: Brew.Enums.BrewPowerType
    canBeRecharged: boolean
    activated: boolean = false
    strength: Brew.Stat
    associated_item: Brew.GridThings.Item
    conveys_flags : Array<Brew.Enums.Flag>
    facing_direction: Brew.Coordinate
    firing_arc: Brew.Enums.FiringArc = Brew.Enums.FiringArc.FullArc

    constructor(power_def : IBrewPowerDefinition) {
        this.id = Brew.Utils.generateID()
        this.powerType = power_def.powerType
        this.canBeRecharged = power_def.canBeRecharged
        
        this.charge_stat = new Brew.Stat(Brew.Enums.StatName.PowerCharge, power_def.startingCharges)
        this.charge_stat.setCurrentLevel(power_def.startingCharges)
        
        this.strength = new Brew.Stat(Brew.Enums.StatName.StrengthRank, power_def.maxStrength)
        this.strength.setCurrentLevel(1)

        this.color = power_def.color

        if (power_def.conveys_flags) {
            this.conveys_flags = [].concat(power_def.conveys_flags)
        } else {
            this.conveys_flags = []
        }

        this.facing_direction = new Brew.Coordinate(0, 0)
    }

    // isActive() : boolean {
    //     return this.activated
    // }
}

export class PowerSuite {
    // array of powers
    listOfPowers : Array<Power> = []
    max_capacity : number
    current_capacity : number = 0
    
    constructor(max_capacity : number) {
        this.max_capacity = max_capacity
    }
    
    addPower(power : Power) : boolean {
        // returns true if we successfully added this power

        if (this.current_capacity == this.max_capacity) {
            return false
        } else {
            this.listOfPowers.push(power)
            return true
        }
    }

    removePower(selected_power: Power) : boolean {
        let remove_index = this.listOfPowers.findIndex((pow: Power, index: number, array) => {
            return pow.id == selected_power.id
        })
        if (remove_index == -1) {
            return false
        } else {
            this.listOfPowers.splice(remove_index, 1)
            return true
        }
    }

    hasPowerOfType(given_powertype : Brew.Enums.BrewPowerType) : boolean {
        // returns true if we have at least one power of a given type
        let gotIt : boolean = false
        this.listOfPowers.forEach((pow, index, array) => {
            if (pow.powerType == given_powertype) {
                gotIt = true
            }
        })

        return gotIt
    }

    getPowerOfType(given_powertype : Brew.Enums.BrewPowerType, defaultToMostCharged : boolean = true) : Power {
        // returns the power object associated with a given type
        // if multiple powers are found, it returns the one with the
        // most charge by default, but this behavior can be reversed 
        let candidate_list : Array<Power> = []

        for (let i = 0; i < this.listOfPowers.length; i++) {
            let pow = this.listOfPowers[i]
            if (pow.powerType == given_powertype) {
                candidate_list.push(pow)
            }
        }

        if (candidate_list.length == 0) {
            return null
        } else if (candidate_list.length == 1) {
            return candidate_list[0]
        } else {
            // multiple
            candidate_list.sort((aPow, bPow) => {
                if (defaultToMostCharged) {
                    return bPow.charge_stat.getCurrentLevel() - aPow.charge_stat.getCurrentLevel()
                } else {
                    return aPow.charge_stat.getCurrentLevel() - bPow.charge_stat.getCurrentLevel()
                }
            })
            return candidate_list[0]
        }
    }

    getPowerByIndex(index: number) {
        if ((index < 0) || (index >= this.listOfPowers.length) || (index >= this.max_capacity)) {
            return null
        }
            
        return this.listOfPowers[index]
    }

    hasPowerByID(given_power: Power) : boolean {
        return this.listOfPowers.findIndex((pow: Power, index: number, obj) => {
            return given_power.id == pow.id
        }) > -1
    }

    getIndexFromPower(given_power: Power) : number {
        if (this.hasPowerByID(given_power)) {
            let found_index = this.listOfPowers.findIndex((pow: Power, index: number, obj) => {return given_power.id == pow.id})
            return found_index

        } else {
            return null
        }
    }

} // end class


let power_defaults : { [power_def: string] : IBrewPowerDefinition } = {
    "TurretCannon": {
        powerType: Brew.Enums.BrewPowerType.TurretCannon,
        canBeRecharged: true,
        startingCharges: 3,
        maxStrength: 1,
        color: Brew.Color.black,
    },
    "MachineGun": {
        powerType: Brew.Enums.BrewPowerType.MachineGun,
        canBeRecharged: true,
        startingCharges: 3,
        maxStrength: 1,
        color: Brew.Color.black,
    },
    "Scanner": {
        powerType: Brew.Enums.BrewPowerType.Scanner,
        canBeRecharged: true,
        startingCharges: 3,
        maxStrength: 1,
        color: Brew.Color.black,
    },
}

export function getEmptyPower() : Power {
    let empty_def : IBrewPowerDefinition = {
        powerType: Brew.Enums.BrewPowerType.EmptyNone,
        canBeRecharged: false,
        maxStrength: 1,
        startingCharges: 0,
        color: null,
    }

    let empty_power = new Power(empty_def)

    return empty_power
}

export function createBasicPowerOfType(powerType : Brew.Enums.BrewPowerType) : Power {
    let power_def : IBrewPowerDefinition = power_defaults[Brew.Enums.BrewPowerType[powerType]]
    let new_power = new Power(power_def)

    if (powerType == Brew.Enums.BrewPowerType.TurretCannon) {
        new_power.associated_item = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.PowerRelatedItem, { subtype: Brew.Definitions.ItemSubtype.PowerItem_Gun, damage: Brew.Config.turret_damage, flags: [Brew.Enums.Flag.CausesExplosion]})
    } else if (powerType == Brew.Enums.BrewPowerType.MachineGun) {
        new_power.associated_item = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.PowerRelatedItem, { subtype: Brew.Definitions.ItemSubtype.PowerItem_Gun, damage: Brew.Config.machinegun_damage, flags: []})
    }

    return new_power
}

export function createItemFromPower(pow: Power) : Brew.GridThings.Item {
    let power_item = Brew.Definitions.itemFactory(Brew.Definitions.ItemType.PowerSystem, { power: pow, color: pow.color })
    return power_item
}

export function createPowerFromItem(power_item: Brew.GridThings.Item) : Power {
    let power : Power = power_item.power
    return power
}

export function createPowerItemOfType(powerType: Brew.Enums.BrewPowerType) : Brew.GridThings.Item {
    let pow = createBasicPowerOfType(powerType)
    let item = createItemFromPower(pow)
    return item
}

export function uninstallPower(gm : Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent)  { 
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()
    let selected_power = brEvent.powerData.power
    let item_exists = level.items.hasAt(player.location)

    if (selected_power.powerType == Brew.Enums.BrewPowerType.EmptyNone) {
        gm.endEvent(brEvent)
        return
    }

    if (item_exists) {// todo: handle attempt at uninstall vs. success
        gm.endEvent(brEvent)
    } else {

        let power_item = createItemFromPower(selected_power)
        
        level.items.setAt(player.location, power_item)

        let selected_index = player.getPowers().getIndexFromPower(selected_power)
        player.getPowers().listOfPowers[selected_index] = getEmptyPower()
        // player.getPowers().removePower(selected_power)
        // player.getPowers().addPower(getEmptyPower())

        // return true
        gm.endEvent(brEvent)
    }
}

export function installPower(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()
    let selected_power = brEvent.powerData.power
    let swapwith_power = brEvent.swapPowerData.power

    let swapwith_index = player.getPowers().getIndexFromPower(swapwith_power)
    // place new power in the old power slot
    player.getPowers().listOfPowers[swapwith_index] = selected_power

    // take the power off the floor
    level.items.removeAt(player.location) 

    // dump the old power if it's not an empty slot holder
    if (selected_power.powerType != Brew.Enums.BrewPowerType.EmptyNone) {
        let power_item = createItemFromPower(swapwith_power) // Brew.Definitions.itemFactory(Definitions.ItemType.PowerSystem, { power: swapwith_power})
        level.items.setAt(player.location, power_item)
    }

    gm.endEvent(brEvent)
}

export function swapPower(gm : Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent)  { 
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()
    let selected_power = brEvent.powerData.power
    let swapwith_power = brEvent.swapPowerData.power

    let selected_index = player.getPowers().getIndexFromPower(selected_power)
    let swapwith_index = player.getPowers().getIndexFromPower(swapwith_power)
    
    player.getPowers().listOfPowers[swapwith_index] = selected_power
    player.getPowers().listOfPowers[selected_index] = swapwith_power

    // return true
    // gm.insertEvent(Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff))
    gm.endEvent(brEvent)
}

export function triggerPower(gm : Brew.GameMaster, actor : Brew.GridThings.Monster, givenPower : Power) : Brew.Enums.IBrewEvent {
    let powerEvent : Brew.Enums.IBrewEvent

    if ((givenPower.powerType == Brew.Enums.BrewPowerType.TurretCannon) || (givenPower.powerType == Brew.Enums.BrewPowerType.MachineGun)) {
        let weapon_arc_range = Brew.Tank.getFiringArcRange(gm, actor.location, givenPower)
        powerEvent = {
            eventType: Brew.Enums.BrewEventType.TargetingOn,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            powerData: {
                power: givenPower
            },
            startTargetingData: {
                from_xy: gm.getPlayer().location,
                to_xy: gm.getPlayer().location,
                targetingAction: Brew.Enums.BrewTargetingAction.RangedAttack,
                minimumArc: weapon_arc_range.minAngle,
                maximumArc: weapon_arc_range.maxAngle,
                midpointArc: weapon_arc_range.midpointAngle,
            }
        }
    // } else if (givenPower.powerType == Brew.Enums.BrewPowerType.MachineGun) {
    //         powerEvent = {
    //             eventType: Brew.Enums.BrewEventType.TargetingOn,
    //             actor: gm.getPlayer(),
    //             playerInitiated: true,
    //             endsTurn: false,
    //             powerData: {
    //                 power: givenPower
    //             },
    //             startTargetingData: {
    //                 from_xy: gm.getPlayer().location,
    //                 to_xy: gm.getPlayer().location,
    //                 targetingAction: Brew.Enums.BrewTargetingAction.RangedAttack
    //             }
    //         }
    
    } else {
        console.error("unknown power type")
    }

    return powerEvent
}

export function safelyEndPhaseWalk(gm: Brew.GameMaster, actor: Brew.GridThings.Thing) {
    // if we ended phasewalk, make sure we arent stuck in some rocks
    let t_at : Brew.GridThings.Terrain = gm.getCurrentLevel().terrain.getAt(actor.location)
    if (t_at.blocks_walking) {

        // todo: take some damage / attack / die by rock stuck
        let player = gm.getPlayer()
        let level = gm.getCurrentLevel()
        let safe_xy = level.getSafeLocationNear(player.location)
        let old_xy = player.location.clone()

        level.monsters.setAt(safe_xy, player)
        level.monsters.removeAt(old_xy)

        gm.displayList([old_xy, safe_xy])

    }

}

export function rocketPunch(gm : Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    
    // decrement power charge on success
    data.powerData.power.charge_stat.decrement(1)

    let moveEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.Move,
        actor: data.actor,
        playerInitiated: data.playerInitiated,
        endsTurn: data.endsTurn,
        moveData: {
            from_xy: data.actor.location.clone(),
            to_xy: data.targetingData.path[data.targetingData.path.length-2]
        }
    }
    
    let victim : Brew.GridThings.Monster = gm.getCurrentLevel().monsters.getAt(data.targetingData.to_xy)
    if (!(victim)) {
        console.error("should have been a monster at the end of this rainbow")
    }

    let rpDamage = 1
    let attack_type : Brew.Enums.BrewEventType = Brew.Enums.BrewEventType.Attack

    let attackEvent : Brew.Enums.IBrewEvent = {
        eventType: attack_type,
        actor: data.actor,
        playerInitiated: data.playerInitiated,
        endsTurn: data.endsTurn,
        attackData: {
            from_xy: data.actor.location.clone(),
            to_xy: victim.location.clone(),
            target: victim,
            isMelee: true,
            damage: rpDamage
        }        
    }
    attackEvent = Brew.Combat.possiblyConvertAttackToSmashAttack(gm, attackEvent)
    
    let animationEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.RunAnimation,
        actor: data.actor,
        playerInitiated: data.playerInitiated,
        endsTurn: data.endsTurn,
        animationData: {
            animationType: Brew.Enums.BrewAnimationType.OverPath,
            code: data.actor.code,
            color: Brew.Color.red,
            from_xy: moveEvent.moveData.from_xy,
            to_xy: moveEvent.moveData.to_xy
        }
    }

    gm.insertEvent(animationEvent)
    gm.insertEvent(moveEvent)
    gm.insertEvent(attackEvent)

    // Brew.Animations.animateRocketPunch(gm, data)
    gm.endEvent(data)
}



function damageAllInAxePath(gm: Brew.GameMaster, axe_path: Array<Brew.Coordinate>, axe_power: Power, recall: boolean) {
    
    // if (recall) {
    //     axe_path.splice(axe_path.length-1,1)
    // }
    if (recall) {
        // cut off the end when recalling (dont hit player)
        axe_path.splice(axe_path.length-1, 1)
    } else {
        // cut off the front when throwing
        axe_path.splice(0, 1)
    }

    let dmg_amount : number = axe_power.associated_item.damage

    let massDamageEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.MassDamage,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        attackData: {
            isMelee: true,
            damage: dmg_amount,
            from_xy: null,
            to_xy: null,
            target: null,
            effects: Brew.Combat.filterDamageEffects(axe_power.associated_item.flags)
        },
        pathsData: {
            from_xy: axe_path[0],
            to_xy: axe_path[axe_path.length-1],
            path: axe_path
        }
    }
    gm.insertEvent(massDamageEvent)
}

export function throw_axe(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // put the axe down where it lands        
    let level = gm.getCurrentLevel()
    let final_xy = brEvent.pathsData.to_xy
    
    brEvent.powerData.power.charge_stat.decrement(1)

    // todo: really need a way to move items around
    let axe_item = brEvent.powerData.power.associated_item
    level.items.removeAt(final_xy)
    level.items.setAt(final_xy, axe_item)
    gm.displayAt(final_xy)

    // update the power to say the axe is activated and do a link
    let power : Power = brEvent.powerData.power
    power.activated = true

    damageAllInAxePath(gm, brEvent.pathsData.path, power, false)

    gm.endEvent(brEvent)
}

export function recall_axe(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // todo: how to handle - or restrict - multiple axe powers

    // find the axe
    let power : Power = brEvent.powerData.power
    let axe_item : Brew.GridThings.Item = power.associated_item
    let level = gm.getCurrentLevel()
    let axe_xy = axe_item.location
    level.items.removeAt(axe_xy)
    gm.displayAt(axe_xy)

    let animationEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.RunAnimation, false)
    animationEvent.animationData = {
        animationType: Brew.Enums.BrewAnimationType.OverPath,
        code: axe_item.code,
        color: axe_item.color,
        from_xy: brEvent.pathsData.from_xy,
        to_xy: brEvent.pathsData.to_xy,
        path: brEvent.pathsData.path
    }
    gm.insertEvent(animationEvent)

    // deactivate
    brEvent.powerData.power.activated = false
    
    damageAllInAxePath(gm, brEvent.pathsData.path, brEvent.powerData.power, true)

    gm.endEvent(brEvent)
}

// export function warp_power(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
//     let new_loc_xy = gm.getCurrentLevel().getSafeLocation()

//     let warpEvent : Brew.Enums.IBrewEvent = {
//         eventType: Brew.Enums.BrewEventType.Move,
//         actor: brEvent.actor,
//         playerInitiated: true,
//         endsTurn: true,
//         moveData: {
//             from_xy: brEvent.actor.location.clone(),
//             to_xy: new_loc_xy
//         }
//     }

//     gm.endEvent(warpEvent)
// }

// export function stun_power(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {

//     let stunEvent : Brew.Enums.IBrewEvent = {
//         eventType: Brew.Enums.BrewEventType.MassDamage,
//         actor: brEvent.actor,
//         playerInitiated: true,
//         endsTurn: true,
//         attackData: {
//             from_xy: gm.ac
//         },
//         pathsData: {
            
//         },
//     }

//     gm.endEvent(brEvent)
// }

export function getPowerMaxDistance(for_power: Power) {
    return 4 + (for_power.strength.getCurrentLevel() * 2)
}

export function canUpgradePowerStrength(given_power: Power) : boolean {
    return (given_power.strength.getCurrentLevel() < given_power.strength.getMaxLevel())
}

export function canUpgradePowerCharges(given_power: Power) : boolean {
    return ((given_power.canBeRecharged) && (given_power.charge_stat.getMaxLevel() < Brew.Config.max_power_charges))
}
