import * as Brew from "../brew"

let BrewFiringArcAngles : { [arc_name: string] : number } = {}
BrewFiringArcAngles[Brew.Enums.FiringArc.FullArc] = Math.PI * 2
BrewFiringArcAngles[Brew.Enums.FiringArc.HalfArc] = Math.PI
BrewFiringArcAngles[Brew.Enums.FiringArc.QuarterArc] = Math.PI / 2
BrewFiringArcAngles[Brew.Enums.FiringArc.OctantArc] = Math.PI / 4
BrewFiringArcAngles[Brew.Enums.FiringArc.ThreeOctantArc] = Math.PI * 3/4
BrewFiringArcAngles[Brew.Enums.FiringArc.ThreeQuarterArc] = Math.PI * 3/2

export function getFiringArcValues(arc_name: Brew.Enums.FiringArc) : number {
    return BrewFiringArcAngles[arc_name]
}

export function getDirectionFromKeycode(actor: Brew.GridThings.Monster, keycode: number): Brew.Coordinate {
    let direction_xy: Brew.Coordinate
    
    if (Brew.KeyMap.MoveForward.indexOf(keycode) > -1) {
        direction_xy = actor.facing_direction
        
    } else if (Brew.KeyMap.MoveBackward.indexOf(keycode) > -1) {
        let backwards_xy = actor.facing_direction.multiplyScalar(-1)
        direction_xy = backwards_xy

    } else {
        return null
    }
            
    return direction_xy
}

export function getRotatedFacingDirectionFromKeycode(facing_dir_xy: Brew.Coordinate, keycode: number) : Brew.Coordinate {
    let new_facing_xy : Brew.Coordinate
    // let turn_angle = Math.PI / 2
    let current_angle = Brew.Utils.xyToPolar(facing_dir_xy.toUnit()).angle_theta
    let new_angle : number

    if (Brew.KeyMap.CWRotateKeys.indexOf(keycode) > -1) {
        new_angle = current_angle + (Math.PI / 2)
    } else if (Brew.KeyMap.CCWRotateKeys.indexOf(keycode) > -1) {
        new_angle = current_angle - (Math.PI / 2)
    } else {
        return null
    }

    if (Math.abs(new_angle) == Math.PI) {
        new_angle = Math.PI
    }

    new_facing_xy = Brew.Utils.getPolarOffsetCoordinate(new_angle, 1)
    // console.log(new_angle, new_facing_xy)

    return new_facing_xy
}

export function rotate_body(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let new_facing_xy = brEvent.rotateData.new_facing_xy
    brEvent.actor.facing_direction = new_facing_xy

    Brew.Parts.removeMonsterPartsFromGrid(gm, brEvent.actor)
    Brew.Parts.updateMonsterParts(gm, brEvent.actor)
    Brew.Parts.placeMonsterPartsOnGrid(gm, brEvent.actor)

    gm.endEvent(brEvent)
}

export function rotate_weapon(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let new_facing_xy = brEvent.rotateData.new_facing_xy
    let weaponPower = brEvent.rotateData.weaponPower
    weaponPower.facing_direction = new_facing_xy

    Brew.Parts.removeMonsterPartsFromGrid(gm, brEvent.actor)
    Brew.Parts.updateMonsterParts(gm, brEvent.actor)
    Brew.Parts.placeMonsterPartsOnGrid(gm, brEvent.actor)

    gm.endEvent(brEvent)
}

export function getPrimaryFacingDirection(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Coordinate {
    let view_direction: Brew.Coordinate
    let turretPower = actor.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)
    if (turretPower) {
        view_direction = turretPower.facing_direction
    } else {
        view_direction = actor.facing_direction
    }

    return view_direction
}

export interface IFiringArcRange {
    minAngle: number
    maxAngle: number
    midpointAngle: number
}

export function getFiringArcRange(gm: Brew.GameMaster, center_xy: Brew.Coordinate, weaponPower: Brew.Powers.Power) : IFiringArcRange {

    let facing_dir_xy = weaponPower.facing_direction
    let center_angle = Brew.Utils.xyToPolar(facing_dir_xy).angle_theta

    let full_arc = getFiringArcValues(weaponPower.firing_arc)
    let half_range = full_arc / 2

    let min_angle = center_angle - half_range
    let max_angle = center_angle + half_range

    return {
        minAngle: min_angle,
        midpointAngle: center_angle,
        maxAngle: max_angle,
    }
}

// export function isTargetWithinFiringArc(gm: Brew.GameMaster, center_xy: Brew.Coordinate, weaponPower: Brew.Powers.Power, target_xy: Brew.Coordinate) : boolean {
//     // find the max/min values of our range
//     let arc_range = getFiringArcRange(gm, center_xy, weaponPower)

//     // figure out where target is relative to center
//     // let dist = Brew.Utils.dist2d(center_xy, target_xy)
//     let target_offset_polar = Brew.Utils.xyToPolar(target_xy, center_xy)

//     return true
// }

interface IEndOfLevelInventoryAudit {
    hpRepaired: number,
    hpOversupplied: boolean,
    shellsLoaded: number,
    shellsOversupplied: boolean,
    bulletsLoaded: number,
    bulletsOversupplied: boolean,
    civiliansRescued: number,
}

export function processInventory(gm: Brew.GameMaster) : IEndOfLevelInventoryAudit {
    let player = gm.getPlayer()
    let item : Brew.GridThings.Item
    let turret_gun = player.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)
    let machine_gun = player.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.MachineGun)

    let audit : IEndOfLevelInventoryAudit = {
        civiliansRescued: 0,
        hpRepaired: 0,
        hpOversupplied: false,
        shellsLoaded: 0,
        shellsOversupplied: false,
        bulletsLoaded: 0,
        bulletsOversupplied: false
    }

    for (let inv_key of player.inventory.getKeys()) {
        item = player.inventory.getItemByKey(inv_key)

        // increment health for each supplies
        if (item.isType(Brew.Definitions.ItemType.Supplies)) {
            
            if (player.hp.isMaxed()) {
                audit.hpOversupplied = true
            }

            player.hp.increment(1)
            audit.hpRepaired += 1
            
            player.inventory.removeItemByKey(inv_key)
            
        } else if (item.isType(Brew.Definitions.ItemType.Civilian)) {
            audit.civiliansRescued += 1
            player.score.increment(1, true)
            player.inventory.removeItemByKey(inv_key)

        } else if (item.isType(Brew.Definitions.ItemType.Shells)) {
            
            if (turret_gun.charge_stat.isMaxed()) {
                audit.shellsOversupplied = true
            } 
            turret_gun.charge_stat.increment(1)
            audit.shellsLoaded += 1
            player.inventory.removeItemByKey(inv_key)

        } else if (item.isType(Brew.Definitions.ItemType.Bullets)) {
            
            if (machine_gun.charge_stat.isMaxed()) {
                audit.bulletsOversupplied = true
            } 
            machine_gun.charge_stat.increment(1)
            audit.bulletsLoaded += 1
            player.inventory.removeItemByKey(inv_key)
        }
    }

    return audit
}

export function getLevelAuditReport(gm: Brew.GameMaster, audit_report : IEndOfLevelInventoryAudit) : Brew.Enums.IBrewEvent {

    let entryList : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let too_many : string

    let rescue_text : string
    if (audit_report.civiliansRescued >= 5) {
        rescue_text = "You rescued " + audit_report.civiliansRescued + " civilians! May God bless you!"
    } else if (audit_report.civiliansRescued > 1) {
        rescue_text = "You rescued " + audit_report.civiliansRescued + " civilians. Thank you."
    } else if (audit_report.civiliansRescued == 1) {
        rescue_text = "You rescued a single civilian. Please, help us find more."
    } else {
        rescue_text = "You rescued no civilians. Surely there must be more survivors?"
    }

    entryList.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: "Civilians Rescued",
        entryDescription: rescue_text,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    })

    too_many = (audit_report.hpOversupplied) ? "; we had more parts than we needed" : ""
    entryList.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: "Tank Repairs",
        entryDescription: "We repaired " + audit_report.hpRepaired + " units of armor to your tank" + too_many,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    })

    too_many = (audit_report.shellsOversupplied) ? "; more than your tank's capacity" : ""
    entryList.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: "Shells Loaded",
        entryDescription: "We loaded " + audit_report.shellsLoaded + " shells" + too_many,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    })

    too_many = (audit_report.bulletsOversupplied) ? "; more than your tank's capacity" : ""
    entryList.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: "Bullets Loaded",
        entryDescription: "We loaded " + audit_report.bulletsLoaded + " units of ammunition for your machine gun" + too_many,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    })

    entryList.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: "Onward",
        entryDescription: "More battlegrounds await - the wounded are in desparate need of rescue.",
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    })

    let actionReportMenu : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.GenericMenuOn,
        actor: gm.getPlayer(),
        playerInitiated: false,
        endsTurn: false,
        genericMenuData: {
            allowCancel: false,
            menuTitle: "Area Action Report",
            menuDescription: Brew.Utils.randomOf( listEndOfLevelMessages, true),
            menuEntriesList:  entryList,
        }
    }

    return actionReportMenu
}

let listEndOfLevelMessages : string[] = [
    "welcome friend. We have heard of you and your tank. We'll do what we can to help.",
    "Wecome. We heard rumors of your tank from the resistance... it is an amazing sight.",
    "We will take the wounded from here - you are needed back on the battlefield. Good luck!",
    "Well met. Your reputation preceeds you - we are glad to help a true hero of the resistance.",
    "You are doing God's work out there. Please save as many as you can.",
    "So that tank is yours! I thought we were doomed for sure. Be careful out there - we will do what we can do help.",
]

export let helpMessages : string[] = [
    "The resistance has stolen a tank! As the only qualified tank commander, it's your mission to head into the battlefield and rescue as many civilians as you can. Destroy any regime soldiers you come across. We will mark checkpoints (X) on your map - collect as many civilians and supplies as you can. We will repair and resupply your tank before sending you to the next area. Good luck!",
    "Your tank " + Brew.Symbols.pointer_up + " + and turret " + Brew.Symbols.dbl_arrow_up + " can face different directions, and rotate independently.",
    "- CONTROLS -",
    "9/0 : Shrink/Enlarge Screen",
    "W S : Tank Forward/Back",
    "D : Rotate Tank Body Clockwise (tank pointer: " + Brew.Symbols.pointer_left + ")",
    "A : Rotate Tank Body Counter-Clockwise",
    "E : Rotate TURRET Clockwise (turret pointer: " + Brew.Symbols.dbl_arrow_left + ")",
    "Q : Rotate TURRET Counter-Clockwise",
    "1 : Fire Main Turret (facing direction only)",
    "2 : Fire Machine Gun (all directions)",
    "SPACE : Wait, Pickup, Use Exit (X)",
    "i : Inventory",
    "Z : Heads up Display (arrows to move, ESC/Z/SPACE to exit)",
    "X : eXamine nearby",
    "- HOW TO PLAY -",
    "You can SMASH through most obstacles - including enemies",
    "You can carry a limited number of items (" + Brew.Config.max_items + ")",
    "Each area has a red exit checkpoint (marked X), bringing different items with you will become your core strategy:",
    "@ Rescuing Civilians is the only way to increase your SCORE",
    "% Supplies - Repair 1 point of armor for each carried",
    Brew.Symbols.power_sys + " Shells - Reload 1 unit of ammo for your main turret",
    "= Bullets - Reload 1 unit of ammo for your machine gun",
    "Get through as many areas as you can - rescue as many civilians as you can. I'm afraid your mission will not end well for you personally... you are doing God's work."

]
