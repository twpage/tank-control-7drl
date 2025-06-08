import * as Brew from "../brew"

export enum Vision {
    Normal,
    ShowMobs,
    ShowAll
}

export let debug_vision : Vision = Vision.Normal
export let debug_pathmap : Brew.Path.Pathmap = null
let debug_pathmap_id : number = 0

export function toggleFOV(gm: Brew.GameMaster) {
    let i : number = debug_vision
    i = (i + 1) % 3
    let dv :string = Vision[i]
    debug_vision = Vision[dv]

    let updatefov = Brew.Intel.updateFov(gm, gm.getPlayer())
    console.log("debug view:", dv)
    gm.displayAll()
}

export function togglePathmap(gm: Brew.GameMaster, pm: Brew.Path.Pathmap) {
    
    debug_pathmap_id = (debug_pathmap_id + 1) % 5
    
    if (debug_pathmap_id == 0) {
        console.log("DEBUG PATHMAP: OFF")
        debug_pathmap = null
    } else if (debug_pathmap_id == 1) {
        console.log("DEBUG PATHMAP: Walk To Player")
        debug_pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.ToPlayer_Walk)
    } else if (debug_pathmap_id == 2) {
        console.log("DEBUG PATHMAP: Fly To Player")
        debug_pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.ToPlayer_Fly)
    } else if (debug_pathmap_id == 3) {
        console.log("DEBUG PATHMAP: Walk Away From Player")
        // let to_map = Path.createGenericMapToPlayer(gm, gm.getCurrentLevel())
        debug_pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.FromPlayer_Walk)
    } else if (debug_pathmap_id == 4) {
        console.log("DEBUG PATHMAP: Fly Away From Player")
        // let to_map = Path.createGenericMapToPlayer(gm, gm.getCurrentLevel())
        debug_pathmap = gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.FromPlayer_Fly)
    }
    
    gm.displayAll()
}

export function createMonsterAt(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let level = gm.getCurrentLevel()
    let target_xy = brEvent.moveData.to_xy
    let monsterDef : Brew.Definitions.MonsterType = brEvent.debugMenuData.monsterTypeDefinition
    let newMob = Brew.Definitions.monsterFactory(gm, monsterDef, {monster_status: Brew.Enums.MonsterStatus.Wander })
    
    level.monsters.setAt(target_xy, newMob)
    gm.displayAt(target_xy)
    gm.addActorToScheduler(newMob)
    gm.endEvent(brEvent)
}

export function showCreateMonsterAtMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []

    // https://stackoverflow.com/questions/39372804/typescript-how-to-loop-through-enum-values-for-display-in-radio-buttons
    for (let enum_item in Brew.Definitions.MonsterType) {
        if (!(isNaN(Number(enum_item)))) {
            let enum_number : number = Number(enum_item)
            // console.log(enum_item)
            let entryEvent : Brew.Enums.IBrewEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.TargetingOn, false)
            entryEvent.startTargetingData = {
                from_xy: gm.getPlayer().location,
                to_xy: gm.getPlayer().location,
                targetingAction: Brew.Enums.BrewTargetingAction.DebugSummonMob
            }
            entryEvent.debugMenuData = {
                monsterTypeDefinition: enum_number
            }

            menu_entries.push({
                entryName: Brew.Definitions.MonsterType[enum_number],
                entryType: Brew.Enums.GenericMenuEntryType.EventBased,
                entryEvent: entryEvent
            })

        }
    }

    
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    menuEvent.genericMenuData = {
        menuTitle: "Monster",
        allowCancel: true,
        menuEntriesList: menu_entries
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}

export function createFeatureAt(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let level = gm.getCurrentLevel()
    let target_xy = brEvent.moveData.to_xy
    let featureDef : Brew.Definitions.FeatureType = brEvent.debugMenuData.featureTypeDefinition
    let new_feature = Brew.Definitions.featureFactory(featureDef)
    
    level.features.removeAt(target_xy)
    level.features.setAt(target_xy, new_feature)
    gm.displayAt(target_xy)
    gm.endEvent(brEvent)
}

export function showCreateFeatureAtMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []

    // https://stackoverflow.com/questions/39372804/typescript-how-to-loop-through-enum-values-for-display-in-radio-buttons
    for (let enum_item in Brew.Definitions.FeatureType) {
        if (!(isNaN(Number(enum_item)))) {
            let enum_number : number = Number(enum_item)
            // console.log(enum_item)
            let entryEvent : Brew.Enums.IBrewEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.TargetingOn, false)
            entryEvent.startTargetingData = {
                from_xy: gm.getPlayer().location,
                to_xy: gm.getPlayer().location,
                targetingAction: Brew.Enums.BrewTargetingAction.DebugMakeFeature
            }
            entryEvent.debugMenuData = {
                featureTypeDefinition: enum_number
            }

            menu_entries.push({
                entryName: Brew.Definitions.FeatureType[enum_number],
                entryType: Brew.Enums.GenericMenuEntryType.EventBased,
                entryEvent: entryEvent
            })

        }
    }

    
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    menuEvent.genericMenuData = {
        menuTitle: "Feature",
        allowCancel: true,
        menuEntriesList: menu_entries
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}

export function createTerrainAt(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let level = gm.getCurrentLevel()
    let target_xy = brEvent.moveData.to_xy
    let terrainDef : Brew.Definitions.TerrainType = brEvent.debugMenuData.terrainTypeDefinition
    let new_terrain = Brew.Definitions.terrainFactory(terrainDef)
    
    level.terrain.removeAt(target_xy)
    level.terrain.setAt(target_xy, new_terrain)
    gm.displayAt(target_xy)
    gm.endEvent(brEvent)
}

export function showCreateTerrainAtMenu(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []

    // https://stackoverflow.com/questions/39372804/typescript-how-to-loop-through-enum-values-for-display-in-radio-buttons
    for (let enum_item in Brew.Definitions.TerrainType) {
        if (!(isNaN(Number(enum_item)))) {
            let enum_number : number = Number(enum_item)
            // console.log(enum_item)
            let entryEvent : Brew.Enums.IBrewEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.TargetingOn, false)
            entryEvent.startTargetingData = {
                from_xy: gm.getPlayer().location,
                to_xy: gm.getPlayer().location,
                targetingAction: Brew.Enums.BrewTargetingAction.DebugMakeTerrain
            }
            entryEvent.debugMenuData = {
                terrainTypeDefinition: enum_number
            }

            menu_entries.push({
                entryName: Brew.Definitions.TerrainType[enum_number],
                entryType: Brew.Enums.GenericMenuEntryType.EventBased,
                entryEvent: entryEvent
            })

        }
    }

    
    let menuEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.GenericMenuOn)
    menuEvent.genericMenuData = {
        menuTitle: "Terrain",
        allowCancel: true,
        menuEntriesList: menu_entries
    }

    gm.insertEvent(menuEvent)
    gm.endEvent(brEvent)
}

// export function testPathMaps(gm: Brew.GameMaster) {
//     let start_time = Date.now()
//     console.log(start_time)
//     let elapsed_time : number
//     let N = 100

//     for (let i = 0; i < N; i++) {
//         let pm = Path.testCreateGenericMapToPlayer(gm, gm.getCurrentLevel(), LevelNavigationType.Walk, false)
//     }
//     elapsed_time = Date.now() - start_time
//     let avg_time = elapsed_time / N
//     console.log("total time", elapsed_time)
//     console.log("average time", avg_time)

//     let ppm = Path.testCreateGenericMapToPlayer(gm, gm.getCurrentLevel(), LevelNavigationType.Walk, false)
//     debug_pathmap = ppm
//     gm.displayAll()
// }
let useBackgroundCover : boolean = false

export function toggleBackgroundCover(gm: Brew.GameMaster) {
    useBackgroundCover = (!(useBackgroundCover))
    if (useBackgroundCover) {
        showBackgroundCover(gm)
    } else {
        hideBackgroundCover(gm)
    }
}

function showBackgroundCover(gm: Brew.GameMaster) {
    let fake_img = 'https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iBdiy3Q_YPhk/v2/800x-1.png'

    let imgBackground = <HTMLImageElement>(document.getElementById("id_img_backgroundcover"))
    imgBackground.src = fake_img

}

function hideBackgroundCover(gm: Brew.GameMaster) {
    let canvas = <HTMLCanvasElement>(gm.display.getDisplay(Brew.Enums.DisplayNames.Game).getContainer())
    let context = canvas.getContext("2d")
    context.drawImage(null, 0, 0)    
    gm.displayAll()
}

export let BOSS_MODE = false
export function toggleBossMode(to: boolean) {
    BOSS_MODE = to
}