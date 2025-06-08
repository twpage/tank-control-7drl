import * as Brew from "../brew"

function resetHUDToGame(gm: Brew.GameMaster) {
    gm.input_handler = Brew.Enums.InputHandler.Main
    gm.display.clearDisplay(Brew.Enums.DisplayNames.HUD)
    gm.displayAll()
}
    
//////////////////// context menu

export function showContextMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let context_action_list : Array<Brew.Enums.ContextMenuItem> = brEvent.contextMenuData.context_list
    let item = brEvent.contextMenuData.item
    let invkey = brEvent.contextMenuData.invkey

    let entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)

    context_action_list.forEach((context_action: Brew.Enums.ContextMenuItem, index: number, array) => {
        let entryEvent : Brew.Enums.IBrewEvent
        let entryName : string = Brew.Enums.ContextMenuItem[context_action]

        if (context_action == Brew.Enums.ContextMenuItem.Drop) {
            
            entryEvent = Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.Drop, true), {
                itemData: {
                    item: item,
                    invkey: invkey,
                    to_xy: gm.getPlayer().location.clone()
                }
            })

        } else if (context_action == Brew.Enums.ContextMenuItem.Throw) {
            entryEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.TargetingOn, false)
            entryEvent.itemData = {
                item: item,
                invkey: invkey
            }
            entryEvent.startTargetingData = {
                from_xy: gm.getPlayer().location,
                to_xy: gm.getPlayer().location, // todo: need code to find nearest logical target
                targetingAction: Brew.Enums.BrewTargetingAction.ThrowItem
            }
                
        } else if (context_action == Brew.Enums.ContextMenuItem.Use) {
            entryEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.UseItem, true)
            entryEvent.itemData = {
                item: item,
                invkey: invkey
            }                
        } else {
            throw new Error("bad context given")
        }

        entries.push({
            entryType: Brew.Enums.GenericMenuEntryType.ItemContextAction,
            entryName: entryName,
            entryEvent: entryEvent
        })
    })
    
    menuEvent.genericMenuData = {
        menuTitle: item.getName(),
        allowCancel: true,
        menuEntriesList: entries
    }
    // gm.input_handler = Brew.Enums.InputHandler.ContextMenu
    // gm.display.contextMenuDraw(contextList, 0)
    // data.contextMenuData.selected_item_index = 0
    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}

//////////////////// inventory
    
export function showInventoryList(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let inv : Brew.Inventory = data.inventoryData.inventory
    
    // gm.input_handler = Brew.Enums.InputHandler.InventoryList
    // gm.display.inventoryDraw(inv, 0)
    // data.inventoryData.selected_item_index = 0

    let entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    let item1 : Brew.GridThings.Item
    let item2: Brew.GridThings.Item

    let inv_keys = inv.getKeys()
    inv_keys.sort((key1, key2) => {
        item1 = inv.getItemByKey(key1)
        item2 = inv.getItemByKey(key2)
        if (item1.getDefinition() == item2.getDefinition()) {
            return 0
        } else {
            return (item1.getDefinition() < item2.getDefinition()) ? -1 : 1
        }
    })
    
    inv_keys.forEach((invkey: string, index: number, array) => {
        let invitem = inv.getInventoryItemByKey(invkey)
        
        entries.push({
            entryType: Brew.Enums.GenericMenuEntryType.InventoryItem,
            entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.ContextMenuOn), {
                contextMenuData: {
                    item: invitem.item,
                    invkey: invkey,
                    context_list: [Brew.Enums.ContextMenuItem.Drop, Brew.Enums.ContextMenuItem.Throw]//, Brew.Enums.ContextMenuItem.Use]//todo: figure out allowed contexts based on item type
                }
            })
        })
    });

    entries.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: (Brew.Config.max_items - inv.getItems().length) + " spaces remaining",
        entryDescription: "Your inventory has " + (Brew.Config.max_items - inv.getItems().length) + " spaces remaining",
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff, false)
    })

    menuEvent.genericMenuData = {
        menuTitle: "Inventory",
        allowCancel: true,
        menuEntriesList: entries
    }
    gm.insertEvent(menuEvent)
    gm.endEvent(data)
}

//////////////////////////////////////////////////
// power management screen + uninstall + swap
//////////////////////////////////////////////////

export function showPowerManagementMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let selected_power  = brEvent.powerData.power

    let entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)

    entries.push({
        entryName: "Swap",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.PowerSwapSelectMenuOn, false), {
            powerData: {
                power: selected_power
            }
        })
    })

    entries.push({
        entryName: "Uninstall",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.PowerUninstall, true), {
            powerData: {
                power: selected_power
            }
        })
    })
    
    menuEvent.genericMenuData = {
        menuTitle: Brew.Enums.BrewPowerType[selected_power.powerType],
        allowCancel: true,
        menuEntriesList: entries
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}


//////////////////// list of powers menu helper
// function showListOfPowersMenu_Helper(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent, eventOnSelection : Brew.Enums.BrewEventType, endsTurn : boolean) {
//     let selected_power  = brEvent.powerData.power

//     let player = gm.getPlayer()
//     let power_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
//     let powers = player.getPowers()

//     powers.listOfPowers.forEach((pow, index, array) => {

//         power_entries.push({
//             entryName: Brew.Enums.BrewPowerType[pow.powerType] + ` ${pow.charge_stat.getCurrentLevel()} / ${pow.charge_stat.getMaxLevel()}` ,
//             entryType: Brew.Enums.GenericMenuEntryType.PowerSelect,
//             entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, eventOnSelection, endsTurn), {
//                 powerData: {
//                     power: selected_power
//                 },
//                 swapPowerData: {
//                     power: pow
//                 }
//             })
//         })
//     })
    
//     let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
//     menuEvent.genericMenuData = {
//         menuTitle: Brew.Enums.BrewEventType[eventOnSelection],
//         allowCancel: true,
//         menuEntriesList: power_entries
//     }

//     gm.insertEvent(menuEvent)
//     gm.endEvent(brEvent)
// }

//////////////////////////////////////////////////
// power install
//////////////////////////////////////////////////

export function showPowerInstallPromptMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let power = brEvent.powerData.power
    let entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []

    entries.push({
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryName: "Yes, Install",
        entryDescription: Brew.Glossary.getPowerDesc(power),
        entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.PowerInstallReplacementOn, false), {
            powerData: {
                power: power
            }
        })
    })

    entries.push({
        entryType: Brew.Enums.GenericMenuEntryType.Cancel,
        entryName: "No, Cancel",
        entryDescription: Brew.Glossary.getPowerDesc(power),
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOff)
    })

    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    menuEvent.genericMenuData = {
        menuTitle: "Install This?",
        allowCancel: true,
        menuEntriesList: entries,
        menuDescription: "Install this new power in an empty slot or replace an existing power",
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}

export function showPowerInstallSelectMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // showListOfPowersMenu_Helper(gm, brEvent, Brew.Enums.BrewEventType.PowerInstallFinalize, true)
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    menuEvent.genericMenuData = {
        menuTitle: "Replace Which?",
        allowCancel: true,
        menuEntriesList: getMenuData_Entries_for_Powers(gm, brEvent.actor, Brew.Enums.BrewEventType.PowerInstallFinalize, true, brEvent.powerData.power)
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}

export function showPowerSwapSelectMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // showListOfPowersMenu_Helper(gm, brEvent, Brew.Enums.BrewEventType.PowerSwapFinalize, false)
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    menuEvent.genericMenuData = {
        menuTitle: "Swap With?",
        allowCancel: true,
        menuEntriesList: getMenuData_Entries_for_Powers(gm, brEvent.actor, Brew.Enums.BrewEventType.PowerSwapFinalize, false, brEvent.powerData.power)
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)

}

//////////////////////////////////////////////////
// power list
//////////////////////////////////////////////////

export function getMenuData_Entries_for_Powers(gm: Brew.GameMaster, power_user: Brew.GridThings.Monster, eventOnSelection: Brew.Enums.BrewEventType, eventEndsTurn: boolean, swapPowerWith?: Brew.Powers.Power) : Array<Brew.Enums.IBrewGenericMenuEntry> {
    // let player = gm.getPlayer()
    let power_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []
    let powers = power_user.getPowers()

    let basePower : Brew.Powers.Power
    let swapPower : Brew.Powers.Power
    let entry : Brew.Enums.IBrewGenericMenuEntry

    powers.listOfPowers.forEach((pow, index, array) => {
        entry = {

            entryName: Brew.Glossary.getPowerName(pow),
            entryType: Brew.Enums.GenericMenuEntryType.EventBased,
            entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, eventOnSelection, eventEndsTurn), {
                powerData: {
                    power: swapPowerWith ? swapPowerWith : pow
                }
            }),
            entryDescription: Brew.Glossary.getPowerDesc(pow)
        }

        if (swapPowerWith) {
            entry.entryEvent.swapPowerData = {
                power: pow
            }
        }

        power_entries.push(entry)
    })
    
    return power_entries
}


//////////////////////////////////////////////////
// HUD
//////////////////////////////////////////////////

export function showHeadsUpDisplay(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    
    gm.input_handler = Brew.Enums.InputHandler.HeadsUpDisplay
    
    let current_page = brEvent.headsUpData.selected_index
    let notes = brEvent.headsUpData.headsUpDisplayNotePages[current_page]
    gm.display.headsUpDisplayDraw(notes)

    gm.endEvent(brEvent)
}

//////////////////////////////////////////////////
// generic menu system
//////////////////////////////////////////////////

export function showGenericMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    
    let menu_entries = brEvent.genericMenuData.menuEntriesList

    gm.input_handler = Brew.Enums.InputHandler.GenericMenu
    gm.display.genericMenuDraw(brEvent.genericMenuData.menuTitle, brEvent.genericMenuData.menuDescription, menu_entries, 0)
    brEvent.genericMenuData.selected_index = 0

    gm.endEvent(brEvent)
}

export function stopShowingGenericMenu(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    resetHUDToGame(gm)
    gm.endEvent(data)
}

export function getEntryName(entry : Brew.Enums.IBrewGenericMenuEntry) : string {
    let entry_text : string

    if (entry.entryName) {
        entry_text = entry.entryName

    } else if (entry.entryType == Brew.Enums.GenericMenuEntryType.EventBased) {
        entry_text = Brew.Enums.BrewEventType[entry.entryEvent.eventType]
    } else if (entry.entryType == Brew.Enums.GenericMenuEntryType.InventoryItem) {
        entry_text = entry.entryEvent.contextMenuData.item.getName()
    } else if (entry.entryType == Brew.Enums.GenericMenuEntryType.ItemContextAction) {
        entry_text = entry.entryEvent.itemData.item.getName()
    } else {
        entry_text = Brew.Enums.GenericMenuEntryType[entry.entryType]
    }

    return entry_text
}

export function updateGenericMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let cycle_dir = brEvent.genericMenuData.direction
    let lastEventMenuData  = gm.getLastEvent().genericMenuData
    let current_index = lastEventMenuData.selected_index
    let entries = lastEventMenuData.menuEntriesList
        
    let new_index = Brew.Utils.mod(current_index + cycle_dir, entries.length)
    
    gm.display.genericMenuDraw(lastEventMenuData.menuTitle, lastEventMenuData.menuDescription, entries, new_index)
    
    // make sure data carries over during the subsequent event
    brEvent.genericMenuData.menuEntriesList = entries
    brEvent.genericMenuData.selected_index = new_index

    gm.endEvent(brEvent)
}

export function selectFromGenericMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let current_index : number = gm.getLastEvent().genericMenuData.selected_index
    let entries = gm.getLastEvent().genericMenuData.menuEntriesList
    
    let activeEntry = entries[current_index]
    
    resetHUDToGame(gm)
    // grab the event attached to this entry and load it to run next
    // console.log("finished menu, inserting this event", activeEntry.entryEvent)
    gm.insertEvent(activeEntry.entryEvent)
    gm.endEvent(brEvent)
}

//////////////////////////////////////////////////
// Confirm Paths Menu
//////////////////////////////////////////////////
export function showConfirmPaths(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    // draw the highlights
    gm.display.highlights.clearAll()
    for (let highlight_pair of brEvent.confirmPathsData.highlights) {
        // gm.display.highlights.setAt(highlight_pair.xy
        gm.display.highlights.setAt(highlight_pair.xy, Brew.Definitions.terrainFactory(Brew.Definitions.TerrainType.Highlight, { color: highlight_pair.color } ))
        gm.displayList(brEvent.confirmPathsData.highlights.map((pair: Brew.Enums.ICoordinateColorPair, index: number, array) => {
            return pair.xy
        }))
    }
    gm.input_handler = Brew.Enums.InputHandler.ConfirmPaths
    gm.endEvent(brEvent)
}

function stopConfirmPaths(gm: Brew.GameMaster, highlighted_path : Array<Brew.Enums.ICoordinateColorPair>) {
    gm.display.highlights.clearAll()
    gm.displayList(highlighted_path.map((pair: Brew.Enums.ICoordinateColorPair, index: number, array) => {
        return pair.xy
    }))

    gm.input_handler = Brew.Enums.InputHandler.Main
}

export function finalizeConfirmPaths(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let last_event = gm.getLastEvent()

    stopConfirmPaths(gm, last_event.confirmPathsData.highlights)
    gm.insertEvent(last_event.confirmPathsData.follow_event)
    gm.endEvent(brEvent)
}

export function cancelConfirmPaths(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let last_event = gm.getLastEvent()

    stopConfirmPaths(gm, last_event.confirmPathsData.highlights)
    gm.endEvent(brEvent)
}

export function getWarpBeaconMenuEvent(gm: Brew.GameMaster, level: Brew.Level, terrain: Brew.GridThings.Terrain): Brew.Enums.IBrewEvent {
    // return a menu event for a given warp pod location
    let player = gm.getPlayer()
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    let entry : Brew.Enums.IBrewGenericMenuEntry

    menuEvent.genericMenuData = {
        menuTitle: "Warp Pod",
        menuDescription: "Using a warp crystal, home base can transmit items and other upgrades to your systems. Be mindful, warp crystals are only good for one use.",
        allowCancel: true,
        menuEntriesList: []
    }

    menuEvent.genericMenuData.menuEntriesList.push({
        entryName: "Heal",
        entryDescription: "Restore health to maximum",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.WarpBeaconHeal)
    })

    menuEvent.genericMenuData.menuEntriesList.push({
        entryName: "Reinforcements",
        entryDescription: "Warp in an allied marine squad",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.WarpBeaconAllyDrop)
    })

    player.getPowers().listOfPowers.forEach((pow, index, array) => {
        if ((pow.canBeRecharged) && (pow.charge_stat.getCurrentLevel() < pow.charge_stat.getMaxLevel())) {
            menuEvent.genericMenuData.menuEntriesList.push({
                entryName: Brew.Glossary.getPowerShortName(pow) + " RECHARGE",
                entryDescription: "Restore this power to the maximum number of charges",
                entryType: Brew.Enums.GenericMenuEntryType.EventBased,
                entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.WarpBeaconRechargePower, false), {
                    powerData: {
                        power: pow
                    }
                })
            })
        }

        if (Brew.Powers.canUpgradePowerCharges(pow)) {
            menuEvent.genericMenuData.menuEntriesList.push({
                entryName: Brew.Glossary.getPowerShortName(pow) + " INCREASE",
                entryDescription: "Permanently increase the number of charges for this power. Also adds 1 charge.",
                entryType: Brew.Enums.GenericMenuEntryType.EventBased,
                entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.WarpBeaconIncreasePower, false), {
                    powerData: {
                        power: pow
                    }
                })
            })
        }

        if (Brew.Powers.canUpgradePowerStrength(pow)) {
            menuEvent.genericMenuData.menuEntriesList.push({
                entryName: Brew.Glossary.getPowerShortName(pow) + " UPGRADE",
                entryDescription: "Permanently increase the STRENGTH this power. Does not add new charges.",
                entryType: Brew.Enums.GenericMenuEntryType.EventBased,
                entryEvent: Brew.Events.addDataToEvent(Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.WarpBeaconUpgradePower, false), {
                    powerData: {
                        power: pow
                    }
                })
            })
        }

    })


    return menuEvent
   
}

//////////////////////////////////////////////////
// HELP
//////////////////////////////////////////////////

export function showHelpMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    
    gm.input_handler = Brew.Enums.InputHandler.HelpMenu
    
    let current_index = brEvent.helpData.selected_index
    // let notes = brEvent.headsUpData.headsUpDisplayNotePages[current_page]
    gm.display.drawHelpMenu(current_index)

    gm.endEvent(brEvent)
}
