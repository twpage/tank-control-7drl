// import * as Brew from "../brew"

// export function restoreHealth(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
//     let target = brEvent.actor
//     target.hp.resetToMax()
//     removeWarpCrystal(brEvent.actor)
//     gm.display.drawFooter()
//     gm.endEvent(brEvent)
// }

// export function rechargePower(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
//     let power = brEvent.powerData.power
//     power.charge_stat.resetToMax()
//     removeWarpCrystal(brEvent.actor)
//     gm.display.drawFooter()
//     gm.endEvent(brEvent)
// }

// export function increasePower(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
//     let power = brEvent.powerData.power
//     power.charge_stat.setMaxLevel(power.charge_stat.getMaxLevel() + 1)
//     power.charge_stat.increment(1)
//     removeWarpCrystal(brEvent.actor)
//     gm.display.drawFooter()
//     gm.endEvent(brEvent)
// }

// export function upgradePower(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
//     let power = brEvent.powerData.power
//     power.strength.increment(1)
//     removeWarpCrystal(brEvent.actor)
//     gm.display.drawFooter()
//     gm.endEvent(brEvent)
// }

// export function hasWarpCrystal(holder: Brew.GridThings.Monster) : boolean {
//     let found_it = holder.inventory.findKeyForItemOfType(Brew.Definitions.ItemType.WarpCrystal)
//     if (found_it) { 
//         return true
//     } else {
//         return false
//     }
// }

// function removeWarpCrystal(holder: Brew.GridThings.Monster) {
//     let found_key = holder.inventory.findKeyForItemOfType(Brew.Definitions.ItemType.WarpCrystal)    
//     holder.inventory.removeItemByKey(found_key)
// }

