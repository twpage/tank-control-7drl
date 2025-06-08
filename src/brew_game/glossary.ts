// store all (or most) text-based descriptions and names of things that get displayed

import * as Brew from '../brew'

interface IGlossaryPower {
    shortName: string
    longName: string
    description: string
}

export function getPowerName(power: Brew.Powers.Power) : string {
    return GlossaryPower[power.powerType].longName
}

export function getPowerShortName(power: Brew.Powers.Power) : string {
    return GlossaryPower[power.powerType].shortName
}

export function getPowerDesc(pow: Brew.Powers.Power) : string {
    // return GlossaryPower[power.powerType].description
    let desc : string
    if (pow.powerType == Brew.Enums.BrewPowerType.EmptyNone) {
        desc = "Nothing installed"
    } else {
        desc = GlossaryPower[pow.powerType].description
    }

    desc += "\n\nAmmo: " + pow.charge_stat.getCurrentLevel() + " / " + pow.charge_stat.getMaxLevel()
    // desc += "\nLevel: " + pow.strength.getCurrentLevel()

    return desc
    
}

let GlossaryPower : { [powerType: string] : IGlossaryPower } = {}

GlossaryPower[Brew.Enums.BrewPowerType.TurretCannon] = {
    longName: "Turret Gun",
    shortName: "TURRET",
    description: "Giant turret cannon",
}
GlossaryPower[Brew.Enums.BrewPowerType.MachineGun] = {
    longName: "Machine Gun",
    shortName: "M85",
    description: "Smaller more manueverable machine gun",
}
GlossaryPower[Brew.Enums.BrewPowerType.Scanner] = {
    longName: "Scanner",
    shortName: "SCAN",
    description: "Long range scanner",
}

// GlossaryPower[Enums.BrewPowerType.] = {
//     longName: "",
//     shortName: "",
//     description: "",
// }

let GlossaryItemType : { [itemType: string] : string } = {}
GlossaryItemType[Brew.Definitions.ItemType.Grenade] = "A small grenade, light enough to throw."
// GlossaryItemType[Brew.Definitions.ItemType.KeyCard] = "Used for accessing secure areas"
// GlossaryItemType[Brew.Definitions.ItemType.Nanotech] = "Small phial of inert nanites."// When shattered, nanites will interact with the immediate surroundings in strange ways."
GlossaryItemType[Brew.Definitions.ItemType.PowerRelatedItem] = "Special Item"
GlossaryItemType[Brew.Definitions.ItemType.PowerSystem] = "Power modules give special abilities"
// GlossaryItemType[Brew.Definitions.ItemType.Wreckage] = "Smoldering shell of a destroyed robot"
// GlossaryItemType[Brew.Definitions.ItemType.MacGuffin] = "This is how you win the game for now!"
// GlossaryItemType[Brew.Definitions.ItemType.WarpCrystal] = "Functions as a unique fuel for telewarp technology"// - essential for communicating with home base" // transponder
GlossaryItemType[Brew.Definitions.ItemType.Bullets] = "Reloads machine gun after each area checkpoint"
GlossaryItemType[Brew.Definitions.ItemType.Civilian] = "Successful rescues add to your score"
GlossaryItemType[Brew.Definitions.ItemType.Shells] = "Reloads turret gun after each area checkpoint"
GlossaryItemType[Brew.Definitions.ItemType.Supplies] = "Restores armor after each area checkpoint"



interface IGlossaryItemSubType {
    longName: string,
    description: string,
}

let GlossaryItemSubType : { [itemSubType: string] : IGlossaryItemSubType } = {}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.G_Concusive] = {
    longName: "Blast Grenade",
    description: "Unleases a blast of force, knocking back any targets",
}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.G_Explosive] = {
    longName: "Grenade",
    description: "Explodes and does direct damage to any targets caught in the blast"
}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.G_Stun] = {
    longName: "Stun Grenade",
    description: "Temporarily stuns any targets in range, but otherwise does no damage."
}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.N_Acid] = {
    longName: "Nanotech (Corrosive)",
    description: "Causes corrision - infected target can be destroyed in one hit"//& brittle armor
}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.N_Armor] = {
    longName: "Nanotech (Armor)",
    description: "Hardens armor, making infected targets temporarily invincible"
}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.N_Health] = {
    longName: "Nanotech (Repair)",
    description: "Has a regenerative affect - heals any target exposed"
}
// GlossaryItemSubType[Brew.Definitions.ItemSubtype.NonSpecific]
GlossaryItemSubType[Brew.Definitions.ItemSubtype.PowerItem_Axe] = {
    longName: "Heavy Axe",
    description: "The heavy axe, quantum-bound to whomever threw it here"
}
GlossaryItemSubType[Brew.Definitions.ItemSubtype.PowerItem_Gun] = {
    longName: "???",
    description: "NOT SEEN?"
}

// GlossaryItemSubType[Brew.Definitions.ItemSubtype.]

interface IItemDescription {
    typeDesc: string
    subTypeDesc?: string
}

export function getItemDescription(item: Brew.GridThings.Item) : IItemDescription {
    let item_desc : IItemDescription

    if (item.subtype != Brew.Definitions.ItemSubtype.NonSpecific) {
        item_desc = {
            typeDesc: GlossaryItemType[item.getDefinition()],
            subTypeDesc: GlossaryItemSubType[item.subtype].description
        }

    } else {
        item_desc = {
            typeDesc: GlossaryItemType[item.getDefinition()]
        }
    }

    return item_desc
}

export function getItemName(item: Brew.GridThings.Item) : string {
    let name : string = "unnamed item"
    if (item.isType(Brew.Definitions.ItemType.PowerSystem)) {
        name = "Power: " + getPowerShortName(item.power)
    } else if (item.subtype == Brew.Definitions.ItemSubtype.NonSpecific) {
        name = Brew.Definitions.ItemType[item.getDefinition()]

    } else {
        // if (item.getDefinition() == Brew.Definitions.ItemType.Grenade) {
        //     name = Brew.Definitions.ItemSubtype[item.subtype]
        // } 
        name = GlossaryItemSubType[item.subtype].longName
    }

    return name
}

interface IGlossaryFeatureType {
    longName: string,
    description: string,
}

let GlossaryFeature : { [featureType: string] : IGlossaryFeatureType } = {}
GlossaryFeature[Brew.Definitions.FeatureType.CorrosiveAcid] = {
    longName: "Corrosive Nanobots",
    description: GlossaryItemSubType[Brew.Definitions.ItemSubtype.N_Acid].description
}
GlossaryFeature[Brew.Definitions.FeatureType.Fire] = {
    longName: "Fire",
    description: "The flames flicker dangerously"
}
GlossaryFeature[Brew.Definitions.FeatureType.ProtectiveGoo] = {
    longName: "Armor Nanobots",
    description: GlossaryItemSubType[Brew.Definitions.ItemSubtype.N_Armor].description
}
GlossaryFeature[Brew.Definitions.FeatureType.RepairGoo] = {
    longName: "Repair Nanobots",
    description: GlossaryItemSubType[Brew.Definitions.ItemSubtype.N_Health].description
}
GlossaryFeature[Brew.Definitions.FeatureType.Scrap] = {
    longName: "Scrap",
    description: "Debris from a previous battle"
}
// GlossaryFeature[Brew.Definitions.FeatureType.] = {
//     longName: "",
//     description: ""
// }
export function getFeatureName(feature: Brew.GridThings.Feature) : string {
    return GlossaryFeature[feature.getDefinition()].longName
}
export function getFeatureDescription(feature: Brew.GridThings.Feature) : string {
    return GlossaryFeature[feature.getDefinition()].description
}
