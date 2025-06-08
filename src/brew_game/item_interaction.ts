import * as Brew from "../brew"

export function useItem(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) { 
    // todo: replace this with a proper use event (also what is there to use)
    // for now just consume and give health

    let item = brEvent.itemData.item
    let invkey = brEvent.itemData.invkey
    let player = gm.getPlayer()

    player.inventory.removeItemByKey(invkey)
    player.hp.increment(1)
    console.log("+1 health")
    gm.endEvent(brEvent)
    
}

export function dropItemAttempt(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) { 
    let drop_xy = data.itemData.to_xy

    let it = gm.getCurrentLevel().items.getAt(drop_xy)
    if (it) {
        // let dropError : Brew.Enums.IBrewEvent = {
        //     eventType: Brew.Enums.BrewEventType.Error,
        //     actor: null, // gm.getPlayer(),
        //     playerInitiated: true,
        //     endsTurn: false,
        //     errorMsg: "something is already here"
        // }
    
        // data.endsTurn = false
        // gm.insertEvent(dropError)
        // console.log("something already is here")
        gm.display.drawPopupMessage("Already something here", gm.getPlayer().location, Brew.Color.white)
        data.endsTurn = false
        gm.endEvent(data)

    } else {
        let invkey = data.itemData.invkey
        let item = data.itemData.item
        
        gm.getPlayer().inventory.removeItemByKey(invkey) // already happens in landing event
        gm.getCurrentLevel().items.setAt(drop_xy, item)
        gm.displayAt(drop_xy)
        gm.endEvent(data)

    }
}

export function pickup(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    
    // remove it from the floor
    let it : Brew.GridThings.Item = data.itemData.item
    gm.getCurrentLevel().items.removeAt(it.location)
    // console.log("removed from level", it.location)
    // Intel.updateMemoryAt(gm, gm.getPlayer(), it.location)
    
    // add to inventory
    let ok = gm.getPlayer().inventory.addItem(it)
    gm.display.drawPopupMessage("Picked up " + Brew.Glossary.getItemName(it), data.actor.location, Brew.Color.violet)

    if (!(ok)) {
        gm.display.drawPopupMessage("No more room!", it.location, Brew.Color.violet)
        throw new Error("inventory full - we shouldn't be here")
    }
    
    console.log(`Picked up ${it.name}`)
    gm.endEvent(data)
}   

export function doLandingEventAfterThrown(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let item = brEvent.itemData.item
    let level = gm.getCurrentLevel()
    

    // if it explodes...
    if (item.isType(Brew.Definitions.ItemType.Grenade) || item.isType(Brew.Definitions.ItemType.Nanotech)) {

        // remove the item from inventory
        gm.getPlayer().inventory.removeItemByKey(brEvent.itemData.invkey)
    
        if (item.isType(Brew.Definitions.ItemType.Grenade)) {
            triggerGrenade(gm, brEvent.itemData.item, brEvent.itemData.to_xy)

        } else if (item.isType(Brew.Definitions.ItemType.Nanotech)) {
            triggerNanoCore(gm, brEvent.itemData.item, brEvent.itemData.to_xy)
        }

        gm.endEvent(brEvent)

    } else {
        dropItemAttempt(gm, brEvent)
        return
    }
}

export function doLandingEventAfterHeave(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let item = brEvent.itemData.item
    let level = gm.getCurrentLevel()
    
    // clear item from the original location
    level.items.removeAt(brEvent.itemData.item.location)

    // check for target
    let mob_at = level.monsters.getAt(brEvent.itemData.to_xy)
    if (mob_at) {
        let hitUpsideYoHeadEvent : Brew.Enums.IBrewEvent = {
            eventType: Brew.Enums.BrewEventType.Attack,
            actor: brEvent.actor,
            playerInitiated: true,
            endsTurn: false,
            attackData: {
                from_xy: brEvent.itemData.item.location,
                to_xy: brEvent.itemData.to_xy,
                isMelee: true,
                damage: 1,
                target: mob_at,
                // dontAnimate: true,
            }
        }
        gm.insertEvent(hitUpsideYoHeadEvent)
    } else {
        // item removed so no need to do anything extra.. dont think we want heaving multiple times
    }
    gm.endEvent(brEvent)
}

export function triggerNanoCore(gm: Brew.GameMaster, nano_item: Brew.GridThings.Item, target_xy: Brew.Coordinate) {
    let level = gm.getCurrentLevel()
    let terrain_at : Brew.GridThings.Terrain
    let feature_at : Brew.GridThings.Feature

    // feature map
    let feature_type : Brew.Definitions.FeatureType

    if (nano_item.subtype == Brew.Definitions.ItemSubtype.N_Health) {
        feature_type = Brew.Definitions.FeatureType.RepairGoo
    } else if (nano_item.subtype == Brew.Definitions.ItemSubtype.N_Acid) {
        feature_type = Brew.Definitions.FeatureType.CorrosiveAcid
    } else if (nano_item.subtype == Brew.Definitions.ItemSubtype.N_Armor) {
        feature_type = Brew.Definitions.FeatureType.ProtectiveGoo
    } else {
        console.error("unknown nano goo")
    }

    let max_tiles = 5
    let num_tiles = 1
    let affected_area = [target_xy]
    let offset_list = [Brew.Directions.UP.clone(), Brew.Directions.DOWN.clone(), Brew.Directions.LEFT.clone(), Brew.Directions.RIGHT.clone()]
    let avoid_indices : number[] = []

    let offset_i : number
    let dist = 1
    let xy : Brew.Coordinate

    while (num_tiles < max_tiles) {

        for (offset_i = 0; offset_i < offset_list.length; offset_i++) {
            if (avoid_indices.indexOf(offset_i) > -1) {
                // don't grow in this direction
                continue
            }
            
            xy = target_xy.add(offset_list[offset_i].multiplyScalar(dist))

            if (!(level.isValid(xy))) {
                continue
            }

            terrain_at = level.terrain.getAt(xy)
            if (terrain_at.blocks_walking) {
                avoid_indices.push(offset_i)
                continue
            }

            feature_at = level.features.getAt(xy)
            if (feature_at && feature_at.getDefinition() == feature_type) {
                avoid_indices.push(offset_i)
                continue
            }

            affected_area.push(xy)
            num_tiles += 1

            if (num_tiles == max_tiles) {
                break
            }
        }

        dist += 1
    }
    
    affected_area.forEach((xy: Brew.Coordinate, index: number) => {
        feature_at = level.features.getAt(xy)
        if (feature_at) {
            level.features.removeAt(xy)
        }

        level.features.setAt(xy, Brew.Definitions.featureFactory(feature_type))
    })
    gm.displayList(affected_area)
}

export function triggerGrenade(gm: Brew.GameMaster, grenade_item: Brew.GridThings.Item, target_xy: Brew.Coordinate) {
    
    // for concussion grenades use existing knockback event caller
    if (grenade_item.subtype == Brew.Definitions.ItemSubtype.G_Concusive) {
        Brew.Combat.triggerKnockbackBlast(gm, target_xy, Brew.Config.grenade_radius)
        return 
    }
    
    // otherwise go through and apply damage / effects
    let level = gm.getCurrentLevel()
    let player = gm.getPlayer()
    let blast_radius = Brew.Config.grenade_radius

    // let affected_mobs = Utils.getMonstersWithinRadius(level, target_xy, Brew.Config.grenade_radius)
    let area = Brew.Utils.getBlastArea(level, target_xy, blast_radius)
    let affected_mobs = Brew.Utils.getMonstersWithinCoordinateArea(level, area)
    let affected_area = affected_mobs.map((mob) => { return mob.location })

    let damage: number
    let effect_flags: Array<Brew.Enums.Flag>
    let blast_color : Brew.Color.IColor

    if (grenade_item.subtype == Brew.Definitions.ItemSubtype.G_Explosive) {
        damage = grenade_item.damage
        effect_flags = []
        blast_color = Brew.Color.color_explosion

    } else if (grenade_item.subtype == Brew.Definitions.ItemSubtype.G_Stun) {
        damage = 0
        effect_flags = [Brew.Enums.Flag.CausesStun]
        blast_color = Brew.Color.color_stun
    } else {
        throw new Error(`unknown grenade type ${grenade_item.subtype}`)
    }

    let massEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.MassDamage,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        attackData: {
            from_xy: player.location,
            to_xy: target_xy,
            isMelee: false,
            target: null,
            damage: damage,
            effects: effect_flags,
        },
        pathsData: {
            from_xy: null,
            to_xy: null,
            path: affected_area,
        }
    }
    gm.insertEvent({
        eventType: Brew.Enums.BrewEventType.RunAnimation,
        actor: gm.getPlayer(),
        playerInitiated: false,
        endsTurn: false,
        animationData: {
            animationType: Brew.Enums.BrewAnimationType.CircleOut,
            color: Brew.Color.color_force,
            from_xy: target_xy,
            to_xy: target_xy,
            range: blast_radius
        }
    })    
    gm.insertEvent(massEvent)
}

// export function setItemAtLocation(level: Level, item: Brew.GridThings.Item, target_xy: Brew.Coordinate) {
//     let existing_item = level.items.getAt(target_xy)

//     if (existing_item) {
//         pushExistingItemAwayToSafeSpot(level, existing_item)
//     }
//     level.items.setAt(target_xy, item)
// }

// export function pushExistingItemAwayToSafeSpot(level: Level, item_at: Brew.GridThings.Item) {
//     let item_xy = item_at.location.clone()
//     let near_xy = level.getSafeLocationNear(item_xy, true)
//     level.items.removeAt(item_xy)
//     level.items.setAt(near_xy, item_at)
// }
