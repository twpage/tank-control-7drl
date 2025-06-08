import * as Brew from "../brew"

function inputError(errorMsg: string) : Brew.Enums.IBrewEvent {
    return {
        eventType: Brew.Enums.BrewEventType.Error,
        actor: null,
        playerInitiated: true,
        endsTurn: false,
        errorMsg: errorMsg
    }
}
    
// called from postal.js channel
export function handleAllInput(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) {
    
    let myEvent : Brew.Enums.IBrewEvent
    
    // default main handler
    if (gm.input_handler == Brew.Enums.InputHandler.Main) {
        myEvent = mainInputHandler(gm, data, envelope)
        
    // targeting handler
    } else if (gm.input_handler == Brew.Enums.InputHandler.Targeting) {
        myEvent = targetingInputHandler(gm, data, envelope)
        
    // generic menu handler
    } else if (gm.input_handler == Brew.Enums.InputHandler.GenericMenu) {
        myEvent = genericMenuHandler(gm, data)

    } else if (gm.input_handler == Brew.Enums.InputHandler.WaitToDismiss) {
        myEvent = waitToDismissHandler(gm, data)

    } else if (gm.input_handler == Brew.Enums.InputHandler.HeadsUpDisplay) {
        myEvent = headsUpDisplayHandler(gm, data)

    } else if (gm.input_handler == Brew.Enums.InputHandler.HelpMenu) {
        myEvent = helpMenuHandler(gm, data)

    // } else if (gm.input_handler == Brew.Enums.InputHandler.WaitToRestart) {
    //     myEvent = waitToRestartHandler(gm, data, envelope)

    } else if (gm.input_handler == Brew.Enums.InputHandler.ConfirmPaths) {
        myEvent = confirmPathsHandler(gm, data, envelope)
        
        
    } else {
        console.error(`unknown input handler ${gm.input_handler}`)
    }
    
    // post to events channel here ?
    gm.channel_event.publish("event.start", myEvent)
}

// function waitToRestartHandler(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) : Brew.Enums.IBrewEvent {
//     let keycode = data.code
    

//     if (KeyMap.Action.indexOf(keycode) > -1) {
//         let resetEvent : Brew.Enums.IBrewEvent = {
//             eventType: Brew.Enums.BrewEventType.RestartGame,
//             actor: gm.getPlayer(),
//             playerInitiated: true,
//             endsTurn: true
//         }

//         return resetEvent
//     } else {
//         return inputError("game over - press ACTION to restart")
//     }
// }

function waitToDismissHandler(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData) : Brew.Enums.IBrewEvent {
    let keycode = data.code
    
    if ((Brew.KeyMap.Escape.indexOf(keycode) > -1) || (Brew.KeyMap.Action.indexOf(keycode) > -1)) {
        return Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)

    } else {

        return inputError("waiting to dismiss first")
    }

}

function headsUpDisplayHandler(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewInputData) : Brew.Enums.IBrewEvent {
    let keycode = brEvent.code
    let hudEvent : Brew.Enums.IBrewEvent
    let prevMenuEvent = gm.getLastEvent()

    if ((Brew.KeyMap.Escape.indexOf(keycode) > -1) || (Brew.KeyMap.Action.indexOf(keycode) > -1) || (Brew.KeyMap.HeadsUp.indexOf(keycode) > -1)) {
        return Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    
    } else if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
        let cycle_dir = getCycleIncrementValueFromKeypress(keycode)
        let new_page_index = Brew.Utils.mod(prevMenuEvent.headsUpData.selected_index + cycle_dir, prevMenuEvent.headsUpData.headsUpDisplayNotePages.length)
        console.log(new_page_index, prevMenuEvent.headsUpData.headsUpDisplayNotePages.length)
        hudEvent = {
            eventType: Brew.Enums.BrewEventType.HeadsUpDisplayOn,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            headsUpData: {
                headsUpDisplayNotePages: prevMenuEvent.headsUpData.headsUpDisplayNotePages,
                selected_index: new_page_index,
            }
        }
        
        return hudEvent
        
    } else {
        
        return inputError("generic menu - unknown keypress")
    }
}


function confirmPathsHandler(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) : Brew.Enums.IBrewEvent {
    let keycode = data.code
    let confirmPathsEvent : Brew.Enums.IBrewEvent
    
    // make sure path was actually valid
    let lastEvent = gm.getLastEvent()
    let valid_path = lastEvent.confirmPathsData.valid_path

    if ((Brew.KeyMap.Action.indexOf(keycode) > -1) && (valid_path)) {
        confirmPathsEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.ConfirmPathsFinalize, false)

    } else {

        confirmPathsEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.ConfirmPathsCancel, false)
    }

    return confirmPathsEvent
}

function getCycleIncrementValueFromKeypress(keycode: number) : number {
    // return 1 or -1 depending on which keys were pressed, for menu/toggling
    let cycle_dir : number
        
    let offset_xy = Brew.Utils.getDirectionFromKeycode(keycode)
    
    if ((offset_xy.x < 0) || (offset_xy.y < 0)) {
        cycle_dir = -1
    } else if ((offset_xy.x > 0) || (offset_xy.y > 0)) {
        cycle_dir = 1
    } else {
        throw new Error("Some kind of weird direction thingy happened")
    }

    return cycle_dir
}

function genericMenuHandler(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewInputData) : Brew.Enums.IBrewEvent {
    let keycode = brEvent.code
    let genericMenuEvent : Brew.Enums.IBrewEvent
    let prevMenuEvent = gm.getLastEvent()
    let allowCancel = prevMenuEvent.genericMenuData.allowCancel

    if ((Brew.KeyMap.Escape.indexOf(keycode) > -1) && allowCancel) {
        genericMenuEvent = {
            eventType: Brew.Enums.BrewEventType.GenericMenuOff,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false
        }
        
        return genericMenuEvent
    
    } else if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
        let cycle_dir = getCycleIncrementValueFromKeypress(keycode)
        
        genericMenuEvent = {
            eventType: Brew.Enums.BrewEventType.GenericMenuMove,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            genericMenuData: {
                menuTitle: prevMenuEvent.genericMenuData.menuTitle,
                menuDescription: prevMenuEvent.genericMenuData.menuDescription,
                allowCancel: allowCancel,
                direction: cycle_dir
            }
        }
        
        return genericMenuEvent
        
    } else if (Brew.KeyMap.Action.indexOf(keycode) > -1) {
        
        genericMenuEvent = {
            eventType: Brew.Enums.BrewEventType.GenericMenuSelect,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false
        }
        return genericMenuEvent
        
    } else {
        
        return inputError("generic menu - unknown keypress")
            
    }
}

function targetingInputHandler(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) : Brew.Enums.IBrewEvent {
    
    let tgtEvent : Brew.Enums.IBrewEvent
    let lastEvent = gm.getLastEvent()
    
    if (data.source == Brew.Enums.BrewInputSource.Keyboard) {
        let keycode = data.code
        
        if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {

            // move target
            let offset_xy : Brew.Coordinate = Brew.Utils.getDirectionFromKeycode(keycode)
            
            let current_target_xy = lastEvent.targetingData.to_xy.clone()
            let new_target_xy = current_target_xy.add(offset_xy)
            
            if (!(gm.getCurrentLevel().isValid(new_target_xy))) {
                return inputError("can't move target over there")
            }
            
            // new move event
            tgtEvent = {
                eventType: Brew.Enums.BrewEventType.TargetingMove,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                offsetData: {
                    offset_xy: offset_xy
                }
            }

            // copy targeting data over from last event
            tgtEvent.targetingData = Brew.Utils.clone(lastEvent.targetingData)
            tgtEvent.targetingData.to_xy = lastEvent.targetingData.to_xy.clone()
            tgtEvent.targetingData.from_xy = lastEvent.targetingData.from_xy.clone()
            
        } else if ((Brew.KeyMap.Action.indexOf(keycode) > -1) || (Brew.KeyMap.Examine.indexOf(keycode) > -1) || (Brew.KeyMap.HotKeys.indexOf(keycode) > -1)) { 
            // todo: make this trigger the actual thing we are targeting for
            // finish targeting
            tgtEvent = {
                eventType: Brew.Enums.BrewEventType.TargetingFinish,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }
            
            // copy targeting data over from last event
            tgtEvent.targetingData = Brew.Utils.clone(gm.getLastEvent().targetingData)
            
        } else {
            // cancel it
            tgtEvent = {
                eventType: Brew.Enums.BrewEventType.TargetingCancel,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }

        }
    } else if (data.source == Brew.Enums.BrewInputSource.Mouse) {
        let screen_xy = getScreenCoordsFromMouseEvent(gm, data)
        if (!(screen_xy)) {
            return inputError("click outside of screen")
        }
        
        let map_xy = gm.display.convertScreenToMap(screen_xy)
        
        if (data.jsevent.type == "mousedown") {
            
            // finish targeting
            tgtEvent = {
                eventType: Brew.Enums.BrewEventType.TargetingFinish,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false
            }
            
            // copy targeting data over from last event
            tgtEvent.targetingData = Brew.Utils.clone(gm.getLastEvent().targetingData)
            
        } else if (data.jsevent.type == "mousemove") {

            let current_target_xy = lastEvent.targetingData.to_xy.clone()
            let new_target_xy = map_xy
            
            // new move event
            tgtEvent = {
                eventType: Brew.Enums.BrewEventType.TargetingMove,
                actor: gm.getPlayer(),
                playerInitiated: true,
                endsTurn: false,
                offsetData: {
                    offset_xy: map_xy.subtract(current_target_xy)
                }
            }

            // copy targeting data over from last event
            tgtEvent.targetingData = Brew.Utils.clone(lastEvent.targetingData)
            tgtEvent.targetingData.to_xy = lastEvent.targetingData.to_xy.clone()
            tgtEvent.targetingData.from_xy = lastEvent.targetingData.from_xy.clone()

        }
    }

    return tgtEvent
}
    
function mainInputHandler(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) : Brew.Enums.IBrewEvent {
    
    let playerEvent : Brew.Enums.IBrewEvent
    
    
    if (data.source == Brew.Enums.BrewInputSource.Keyboard) {
        playerEvent = translateKeyboardInputIntoEvent(gm, data, envelope)
    } else if (data.source == Brew.Enums.BrewInputSource.Mouse) {
        playerEvent = translateMouseInputIntoEvent(gm, data, envelope)
    } else {
        console.error("unexpected input type")
    }
    
    return playerEvent
}

function translateKeyboardInputIntoEvent(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) : Brew.Enums.IBrewEvent {

    let ev : Brew.Enums.IBrewEvent
    ev = {
        eventType: null,
        actor: gm.getPlayer(),
        playerInitiated: true
    }
    
    let keycode = data.code
    
    if (Brew.KeyMap.DirectionalMovementKeys.indexOf(keycode) > -1) {
        return inputDirectionalMovement(gm, keycode)
    } else if (Brew.KeyMap.RotationalMovementKeys.indexOf(keycode) > -1) {
        return inputRotationalMovement(gm, keycode)
    } else if (Brew.KeyMap.RotationalWeaponKeys.indexOf(keycode) > -1) {
        return inputRotationalWeapon(gm, keycode)
    } else if (Brew.KeyMap.Help.indexOf(keycode) > -1) {
        return inputHelp(gm)
    } else if (Brew.KeyMap.Action.indexOf(keycode) > -1) {
        return inputAction(gm, keycode)
    } else if (Brew.KeyMap.Examine.indexOf(keycode) > -1) {
        return inputExamine(gm, keycode)
    } else if (Brew.KeyMap.HeadsUp.indexOf(keycode) > -1) {
        return inputHeadsUp(gm, keycode)
    } else if (Brew.KeyMap.DebugFOV.indexOf(keycode) > -1) {
        Brew.Debug.toggleFOV(gm)
    // } else if (Brew.KeyMap.DebugPaths.indexOf(keycode) > -1) {
    //     Brew.Debug.togglePathmap(gm, null)
    } else if (Brew.KeyMap.Inventory.indexOf(keycode) > -1) {
        return inputInventory(gm, keycode)
    } else if (Brew.KeyMap.Menu.indexOf(keycode) > -1) {
        return inputPowerMenu(gm, keycode)
    } else if (Brew.KeyMap.HotKeys.indexOf(keycode) > -1) {
        return inputHotkey(gm, keycode, keycode-49)
    } else if (Brew.KeyMap.DebugMenu.indexOf(keycode) > -1) {
        return inputDebugMenu(gm, keycode)
    } else if (Brew.KeyMap.BossMode.indexOf(keycode) > -1) {
        return inputBossMode(gm, keycode)
    } else if (Brew.KeyMap.ScreenSizeControl.indexOf(keycode) > -1) {
        return inputScreenResize(gm, keycode)
    }
    
    return inputError("")
}

function inputRotationalMovement(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let player = gm.getPlayer()

    let new_facing_dir_xy : Brew.Coordinate = Brew.Tank.getRotatedFacingDirectionFromKeycode(player.facing_direction, keycode)
    // player.facing_direction = new_facing_dir_xy
    let rotateEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.RotateBody,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: true,
        rotateData: {
            old_facing_xy: player.facing_direction.clone(),
            new_facing_xy: new_facing_dir_xy
        }
    }
    return rotateEvent
}

function inputRotationalWeapon(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let player = gm.getPlayer()
    let turretPower = player.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)

    let new_facing_dir_xy : Brew.Coordinate = Brew.Tank.getRotatedFacingDirectionFromKeycode(turretPower.facing_direction, keycode)
    // player.facing_direction = new_facing_dir_xy
    let moveEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.RotateWeapon,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: true,
        rotateData: {
            old_facing_xy: player.facing_direction.clone(),
            new_facing_xy: new_facing_dir_xy,
            weaponPower: turretPower
        }
    }
    return moveEvent
}

function inputDirectionalMovement(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    
    let level = gm.getCurrentLevel()
    
    // determine offset
    // let offset_xy : Brew.Coordinate = Brew.Utils.getDirectionFromKeycode(keycode)
    let offset_xy : Brew.Coordinate = Brew.Tank.getDirectionFromKeycode(gm.getPlayer(), keycode)

    if (!(offset_xy)) {
        return inputError("invalid movement key - no direction")
    }
    
    // check whats over there
    let new_xy = gm.getPlayer().location.add(offset_xy)
    
    if (!(level.isValid(new_xy))) {
        return inputError("You can't go there")
    }
    
    // let t: Brew.Terrain = level.terrain.getAt(new_xy)
    if (!(Brew.Movement.canMoveToLocation(gm, gm.getPlayer(), new_xy))) {
        return inputError("You can't go to there")
    }

    let old_xy = gm.getPlayer().location.clone()

    let m: Brew.GridThings.Monster = level.monsters.getAt(new_xy)
    if (m) {
        return playerMeleeAttack(gm, m)
    }
    
    // move event
    
    let moveEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.Move,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: true,
        moveData: {
            from_xy: old_xy,
            to_xy: new_xy
        }
    }
    return moveEvent
}

function playerMeleeAttack(gm: Brew.GameMaster, target: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {
    let player = gm.getPlayer()
    let level = gm.getCurrentLevel()
    
    let player_damage  = 1
    let attack_type = Brew.Enums.BrewEventType.Attack

    // check for wall smashing
    // let can_wallsmash = Brew.Combat.checkForWallSmash(gm, player, target)
    
    // if (can_wallsmash) {
    //     attack_type = Brew.Enums.BrewEventType.SmashAttack
    //     player_damage = 2
    // }

    let attackEvent : Brew.Enums.IBrewEvent = {
        eventType: attack_type,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: true,
        attackData: {
            from_xy: gm.getPlayer().location,
            to_xy: target.location,
            target: target,
            isMelee: true,
            damage: player_damage
        }
    }
    attackEvent = Brew.Combat.possiblyConvertAttackToSmashAttack(gm, attackEvent)
    
    return attackEvent
}

function inputAction(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    // pickup / rest
    
    // lets see whats here
    let level = gm.getCurrentLevel()
    let player = gm.getPlayer()
    let item_here = level.items.getAt(player.location)
    
    // if the item here is a power system then it is a special case
    let system_item_here = null
    if ((item_here) && (item_here.isType(Brew.Definitions.ItemType.PowerSystem))) {
        system_item_here = item_here
        item_here = null
    }

    let portal_here = level.portals.getAt(player.location)
    let monster_nearby : boolean
    
    // find out if there is a monster nearby
    monster_nearby = false
    player.knowledge.getAllThings().forEach((thingy: Brew.GridThings.Thing, index: number, array) => {
        if ((thingy instanceof Brew.GridThings.Monster) && (!(thingy.isSameThing(player))) && (Brew.Intel.isEnemy(player, thingy))) {
            monster_nearby = true
        }
    })

    if (monster_nearby) {
        gm.display.drawPopupMessage("Waiting - enemy in range", player.location, Brew.Color.violet)
        return Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.Wait, true)
    }

    // build up a list of options and then show a menu only if we need to
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    
    if (portal_here) {
        // menu_entries.push({
        //     entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        //     entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.UsePortal), {portalData: {portal_used: portal_here}})
        // })
        return Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.UsePortal), {portalData: {portal_used: portal_here}})
    }


    let can_pickup = player.inventory.hasCapacity() 
    if (item_here && (!(can_pickup))) {
        gm.display.drawPopupMessage("Inventory is full!", player.location, Brew.Color.violet)
    }
    
    if (item_here && can_pickup && item_here.canPickup) {
        // menu_entries.push({
        //     entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        //     entryEvent: {
        //         eventType: Brew.Enums.BrewEventType.Pickup,
        //         actor: player,
        //         playerInitiated: true,
        //         endsTurn: true,
        //             itemData: {
        //                 item: item_here
        //         }
        //     }
        // })
        return  {
            eventType: Brew.Enums.BrewEventType.Pickup,
            actor: player,
            playerInitiated: true,
            endsTurn: true,
                itemData: {
                    item: item_here
            }
        }
    }

    // if (item_here && item_here.canHeave) {
    //     let heaveEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.TargetingOn, false)
    //     heaveEvent.itemData = {
    //         item: item_here
    //     }
    //     heaveEvent.startTargetingData = {
    //         from_xy: player.location,
    //         to_xy: player.location,
    //         targetingAction: Brew.Enums.BrewTargetingAction.HeaveItem
    //     }

    //     menu_entries.push({
    //         entryName: "Heave",
    //         entryDescription: "Dramatically heave this wreckage into another target",
    //         entryType: Brew.Enums.GenericMenuEntryType.EventBased,
    //         entryEvent: heaveEvent
    //     })
    // }

    // // handle powers/systems
    // if (system_item_here) {
    //     menu_entries.push({
    //         entryType: Brew.Enums.GenericMenuEntryType.EventBased,
    //         entryName: "Install this Power",
    //         entryDescription: "Brings up the power installation menu - will prompt you to swap out an existing power.",
    //         entryEvent: {
    //             eventType: Brew.Enums.BrewEventType.PowerInstallPromptOn,
    //             actor: player,
    //             playerInitiated: true,
    //             endsTurn: false,
    //             powerData: {
    //                 power: system_item_here.power
    //             }
    //         }
    //     })
    // }

    return Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.Wait, true)
    // put together a menu if we need to, or just generate the most obvious event action
    // let finalEvent : Brew.Enums.IBrewEvent
    // let waitEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.Wait, true)
    // // console.log("monster nearby?", monster_nearby)

    // if (menu_entries.length == 0) {
    //     finalEvent = waitEvent
    // } else if ((menu_entries.length == 1) && (!(monster_nearby))) {    
    //     finalEvent = menu_entries[0].entryEvent

    // } else {
    //     let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    //     menu_entries.push({
    //         entryType: Brew.Enums.GenericMenuEntryType.EventBased,
    //         entryDescription: "Rest (ends your turn)",
    //         entryEvent: waitEvent
    //     })
    //     menu_entries.unshift({
    //         entryType: Brew.Enums.GenericMenuEntryType.Cancel,
    //         entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff)
    //     })
    //     menuEvent.genericMenuData = {
    //         menuTitle: "Ambiguous Input",
    //         menuDescription: "There are multiple actions you may be trying to take and there is an enemy near by, confirm your action.",
    //         allowCancel: true,
    //         menuEntriesList: menu_entries
    //     }

    //     finalEvent = menuEvent
    // }

    
    // return finalEvent
}

function inputExamine(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let examineEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.TargetingOn,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        startTargetingData: {
            from_xy: gm.getPlayer().location,
            to_xy: gm.getPlayer().location,
            targetingAction: Brew.Enums.BrewTargetingAction.Examine
        }
    }
    
    return examineEvent
}

function inputHeadsUp(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let notes = Brew.HUD.getCurrentNotes(gm)
    let note_pages = Brew.HUD.getHUDPages(gm, notes)

    let hudEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.HeadsUpDisplayOn,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        headsUpData: {
            selected_index: 0,
            headsUpDisplayNotePages: note_pages
        }
    }
    
    return hudEvent
}

function inputHotkey(gm : Brew.GameMaster, keycode : number, hotkey : number) {
    let player = gm.getPlayer()
    let validPower = player.getPowers().getPowerByIndex(hotkey)

    if (!(validPower)) {
        return inputError("hotkey not assigned to a valid power")
    }

    // if its empty and not already activated, no dice
    if (validPower.charge_stat.isEmpty() && (!(validPower.activated))) {
        return inputError("Not enough charges on that power")
    }

    let powerEvent = Brew.Powers.triggerPower(gm, player, validPower)
    return powerEvent
}

function inputInventory(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let invEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.InventoryOn,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        inventoryData: {
            inventory: gm.getPlayer().inventory
        }
    }
    return invEvent
}

function inputPowerMenu(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let player = gm.getPlayer()
    let power_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let powers = player.getPowers()

    power_entries = Brew.Menus.getMenuData_Entries_for_Powers(gm, player, Brew.Enums.BrewEventType.PowerMenuOn, false)

    let menuEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.GenericMenuOn,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        genericMenuData: {
            menuTitle: "Active Powers",
            allowCancel: true,
            menuEntriesList: power_entries
        },
    }
    return menuEvent
}

function inputDebugMenu(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    let player = gm.getPlayer()
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let powers = player.getPowers()

    menu_entries.push({
        entryName: "Create Mob",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.DebugCreateMobMenuOn, false)
    })

    menu_entries.push({
        entryName: "Create Feature",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.DebugCreateFeatureMenuOn, false)
    })

    menu_entries.push({
        entryName: "Create Terrain",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.DebugCreateTerrainMenuOn, false)
    })

    let menuEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.GenericMenuOn,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        genericMenuData: {
            menuTitle: "Debug",
            allowCancel: true,
            menuEntriesList: menu_entries
        }
    }
    return menuEvent
}

function getScreenCoordsFromMouseEvent(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData) : Brew.Coordinate {
    
    // use ROT to translate on screen coords
    let rot_coords : number | [number, number]
    rot_coords = gm.display.getDisplay(Brew.Enums.DisplayNames.Game).eventToPosition(data.jsevent)
    
    if (rot_coords[0] == -1)  { // rot: coord outside of canvas
        return null
    }
    
    let screen_xy = new Brew.Coordinate(rot_coords[0], rot_coords[1])
    
    return screen_xy
}

function translateMouseInputIntoEvent(gm: Brew.GameMaster, data: Brew.Enums.IBrewInputData, envelope) : Brew.Enums.IBrewEvent {
    
    let screen_xy = getScreenCoordsFromMouseEvent(gm, data)
    if (!(screen_xy)) {
        return inputError("click outside of screen")
    }
    
    let map_xy = gm.display.convertScreenToMap(screen_xy)
    
    if (data.jsevent.type != "mousedown") {
        return inputHover(gm, map_xy)
    }
    
    if (data.button == 0) {
        // regular click
        // return inputClick(gm, map_xy)
        return inputError("temporarily disabled clicking")
    } else {
        // return inputAltClick(gm, data, map_xy)
        return inputError("no alt clicking allowed")
    }
}

function inputHover(gm: Brew.GameMaster, map_xy: Brew.Coordinate) {
    let infoEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.Info,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        moveData: {
            from_xy: map_xy,
            to_xy: map_xy
        }
    }
    
    return infoEvent
}

function inputClick(gm: Brew.GameMaster, map_xy: Brew.Coordinate) {
    let specialEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.Special,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: true,
        moveData: {
            from_xy: null,
            to_xy: map_xy
        }
    }
    
    return specialEvent
}
    
function inputBossMode(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    Brew.Debug.toggleBackgroundCover(gm)
    return inputError("ok")
}

function inputScreenResize(gm: Brew.GameMaster, keycode: number) : Brew.Enums.IBrewEvent {
    
    let font_size = gm.display.getDisplay(Brew.Enums.DisplayNames.Game).getOptions().fontSize
    let new_font_size : number 

    if (Brew.KeyMap.ScreenEnlarge.indexOf(keycode) > -1) {
        new_font_size = font_size + 2
    } else {
        new_font_size = font_size - 2
    }

    for (let disp of [Brew.Enums.DisplayNames.Game, Brew.Enums.DisplayNames.HUD, Brew.Enums.DisplayNames.Footer, Brew.Enums.DisplayNames.Header]) {
        gm.display.getDisplay(disp).setOptions({ fontSize: new_font_size})
    }

    gm.display.drawAll({})
    return inputError("ok")
}

function inputHelp(gm: Brew.GameMaster) : Brew.Enums.IBrewEvent {
    let helpEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.HelpOn,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: false,
        helpData: {
            selected_index: 0
        }
    }
    return helpEvent
}

function helpMenuHandler(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewInputData) : Brew.Enums.IBrewEvent {
    let keycode = brEvent.code
    let helpEvent : Brew.Enums.IBrewEvent
    let prevMenuEvent = gm.getLastEvent()

    if ((Brew.KeyMap.Escape.indexOf(keycode) > -1) || (Brew.KeyMap.Action.indexOf(keycode) > -1) || (Brew.KeyMap.Help.indexOf(keycode) > -1)) {
        return Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    
    } else if (Brew.KeyMap.MovementKeys.indexOf(keycode) > -1) {
        let cycle_dir = getCycleIncrementValueFromKeypress(keycode)
        let new_page_index = Brew.Utils.mod(prevMenuEvent.helpData.selected_index + cycle_dir, Brew.Tank.helpMessages.length)
        // console.log(new_page_index, prevMenuEvent.headsUpData.headsUpDisplayNotePages.length)
        helpEvent = {
            eventType: Brew.Enums.BrewEventType.HelpOn,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: false,
            helpData: {
                // headsUpDisplayNotePages: prevMenuEvent.headsUpData.headsUpDisplayNotePages,
                selected_index: new_page_index,
            }
        }
        
        return helpEvent
        
    } else {
        
        return inputError("help menu - unknown keypress")
    }
}

