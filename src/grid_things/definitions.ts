import * as ROT from 'rot-js'
import * as Brew from "../brew"
import { Above } from './above'
import { Feature } from './features'
import { Item } from './item'
import { Monster } from './monster'
import { Terrain } from './terrain'

export enum TerrainType {
    Rock,
    Broken_Wall,
    Sand,
    Grass,
    Rubble,
    Chasm,
    Highlight,
    LevelCheckPoint,
    UpStairs,
    Door,
    DoorOpen,
    DoorBroken,
    WarpBeacon,
}

interface TerrainDef {
    code?: string
    color?: number[]
    randomize_color?: number[]
    bg_color?: number[]
    randomize_bgcolor?: number[]
    blocks_walking?: boolean
    blocks_vision?: boolean
    blocks_flying?: boolean
    is_solid?: boolean
    alwaysOnTop?: boolean
}

let terrain_defaults : TerrainDef = {
    code: " ",
    color: Brew.Color.normal,
    bg_color: Brew.Color.dark_gray,
    blocks_walking: false,
    blocks_vision: false,
    blocks_flying: false,
    is_solid: false,
    alwaysOnTop: false,
}

// [key: number]: T
interface ITerrainDefs {
    [def_name: string] : TerrainDef 
} 

let terrain_definitions : ITerrainDefs = {
    "Rock": {
        code: "#",
        color: Brew.Color.normal,
        bg_color: Brew.Color.dark_gray,
        // randomize_bgcolor: [0, 0, 10],
        blocks_vision: true,
        blocks_walking: true,
        blocks_flying: true
    },
    "Broken_Wall": {
        code: Brew.Symbols.half_block_lower,
        color: Brew.Color.light_slate_gray,
        bg_color: Brew.Color.dark_gray,
        // randomize_bgcolor: [0, 0, 10],
        blocks_vision: false,
        blocks_walking: true,
        blocks_flying: true
    },
    "Sand":  {
        code: ".",
        color: Brew.Color.primary_shade_2,
        bg_color: Brew.Color.dark_gray,
        // randomize_bgcolor: [0, 0, 10],
        blocks_vision: false, 
        blocks_walking: false,
        blocks_flying: false
    },
    "Grass":  {
        code: '"',
        color: Brew.Color.secondary_green_shade_2,
        bg_color: Brew.Color.dark_gray,
        // randomize_bgcolor: [0, 0, 10],
        blocks_vision: false, 
        blocks_walking: false,
        blocks_flying: false
    },
    "Rubble":  {
        code: ",",
        color: Brew.Color.primary_shade_0,
        bg_color: Brew.Color.dark_gray,
        // randomize_bgcolor: [0, 0, 10],
        blocks_vision: false, 
        blocks_walking: false,
        blocks_flying: false
    },
    "Chasm":  {
        code: ":",
        color: Brew.Color.light_slate_gray,
        bg_color: Brew.Color.midnight_blue,
        blocks_vision: false,
        blocks_walking: true,
        blocks_flying: false
    },
    "Highlight": {
        code: " "
    },
    "LevelCheckPoint":  {
        code: "X",
        color: Brew.Color.red,
        blocks_vision: false, 
        blocks_walking: false,
        blocks_flying: false
    },
    "UpStairs":  {
        code: "<",
        blocks_vision: false, 
        blocks_walking: false,
        blocks_flying: false
    },
    "Door": {
        code: "+",
        color: Brew.Color.yellow,
        blocks_vision: true,
        blocks_walking: false,
        blocks_flying: false,
        alwaysOnTop: true,
        is_solid: true,
    },
    "DoorOpen": {
        code: "-",
        blocks_vision: false,
        blocks_walking: false,
        blocks_flying: false,
        alwaysOnTop: true,
    },
    "DoorBroken": {
        code: "/",
        blocks_vision: false,
        blocks_walking: false,
        blocks_flying: false,
        alwaysOnTop: true,
    },
    "WarpBeacon": {
        code: Brew.Symbols.quad_diamond,
        blocks_vision: false,
        blocks_walking: false,
        blocks_flying: false,
        alwaysOnTop: true,
    }
}

export function terrainFactory(terrain_type : TerrainType, options : TerrainDef = {}) : Terrain {
    let t : Terrain = new Terrain(terrain_type)
    
    // build up definition with 3 layers: default, given def, options
    // 1. default
    let def : TerrainDef = Brew.Utils.clone(terrain_defaults)
    
    // 2. given definition
    let type_name = TerrainType[terrain_type]
    let type_def = terrain_definitions[type_name]
    for (let prop in type_def) {
        // console.log("typedef", prop, type_def[prop])
        def[prop] = type_def[prop]
    } 
    
    // 3. options
    for (let prop in options) {
        // console.log("options", prop, options[prop])
        def[prop] = options[prop]
    }
    
    // 4. set all properties
    for (let prop in def) {
        if (prop.startsWith("randomize_")) {
            continue
        }
        t[prop] = def[prop]
    }

    //terrain dont have flags yet 
    //t.flags = [].concat(def.flags).concat(options.flags)

    // 5. randomize
    let random_rgb: number[]
    if (def.randomize_color) {
        random_rgb = def.randomize_color.map((c: number, index: number) => {
            return def.color[index] + ROT.RNG.getNormal(0, c)
        })
        t.color = Brew.Utils.safe_color(random_rgb)
    }

    if (def.randomize_bgcolor) {
        random_rgb = def.randomize_bgcolor.map((c: number, index: number) => {
            return def.bg_color[index] + ROT.RNG.getNormal(0, c)
        })
        t.bg_color = Brew.Utils.safe_color(random_rgb)
    }

    
    return t
}


export enum AboveType {
    Smoke = 1,
    Projectile,
    Flash
}

interface AboveDef {
    code?: string
    color?: number[]
}

let above_defaults : AboveDef = {
    code: "?",
    color: Brew.Color.black
}

// [key: number]: T
interface IAboveDefs {
    [def_name: string] : AboveDef 
} 

let above_definitions  : IAboveDefs = {
    "Smoke": {
        code: "^",
        color: Brew.Color.red
    },
    "Projectile": {
        code: "*",
        color: Brew.Color.black
    },
    "Flash": {
        code: "\u2588", //"#",
        color: Brew.Color.blue
    },
}

export function aboveFactory(above_type : AboveType, options : AboveDef = {}) : Above {
    let a : Above = new Above(above_type)
    
    // build up definition with 3 layers: default, given def, options
    // 1. default
    let def : AboveDef = Brew.Utils.clone(above_defaults)
    
    // 2. given definition
    let type_name = AboveType[above_type]
    let type_def = above_definitions[type_name]
    for (let prop in type_def) {
        // console.log("typedef", prop, type_def[prop])
        def[prop] = type_def[prop]
    } 
    
    // 3. options
    for (let prop in options) {
        // console.log("options", prop, options[prop])
        def[prop] = options[prop]
    }
    
    // 4. set all properties
    for (let prop in def) {
        a[prop] = def[prop]
    }
    
    return a
}

export enum FeatureType {
    RepairGoo,
    CorrosiveAcid,
    ProtectiveGoo,
    // Rocks,
    Scrap,
    Fire,
    TankPart,
    // TankTread,
    // TankTurret,
    // TankHelm,
    // Radiation,
}

interface FeatureDef {
    code?: string
    color?: number[]
    // bg_color?: number[]
    randomize_code?: string[]
    flags?: Array<Brew.Enums.Flag>,
}

let feature_defaults : FeatureDef = {
    code: Brew.Symbols.fourdots,
    color: Brew.Color.black,
    randomize_code: [],
    flags: [],
}

// [key: number]: T
interface IFeatureDefs {
    [def_name: string] : FeatureDef 
} 

let feature_definitions  : IFeatureDefs = {
    "Fire": {
        code: '^',
        color: Brew.Color.orange,
    },
    "Scrap": {
        code: ',',
        randomize_code: ["\u2574", "\u2575", "\u2576", "\u2577"],//[',', '*', '{', '}', '`'],
        color: null
    },
    "TankPart": {
        code: "x",
        color: Brew.Color.hero_blue,
    },
}

export function featureFactory(feature_type : FeatureType, options : FeatureDef = {}) : Feature {
    let f : Feature = new Feature(feature_type)
    
    // build up definition with 3 layers: default, given def, options
    // 1. default
    let def : FeatureDef = Brew.Utils.clone(feature_defaults)
    
    // 2. given definition
    let type_name = FeatureType[feature_type]
    let type_def = feature_definitions[type_name]
    for (let prop in type_def) {
        // console.log("typedef", prop, type_def[prop])
        def[prop] = type_def[prop]
    } 
    
    // 3. options
    for (let prop in options) {
        // console.log("options", prop, options[prop])
        def[prop] = options[prop]
    }
    
    // 4. set all properties
    for (let prop in def) {
        if (prop.startsWith("randomize_")) {
            continue
        }
        f[prop] = def[prop]
    }
    
    f.flags = [].concat(def.flags).concat(options.flags)

    // 5. randomize
    if (def.randomize_code.length > 0) {
        let c = Brew.Utils.randomOf(def.randomize_code)
        f.code = c
    }

    return f
}

export enum ItemType {
    Grenade,
    Nanotech,
    // SuitModule,
    // WarpCrystal,
    // KeyCard,
    PowerRelatedItem,
    PowerSystem,
    // Wreckage,
    // MacGuffin,
    Civilian,
    Supplies,
    Bullets,
    Shells,
}

export enum ItemSubtype {
    NonSpecific,
    PowerItem_Axe,
    PowerItem_Gun,
    G_Explosive,
    G_Concusive,
    G_Stun,
    N_Acid,
    // N_Barrier,
    // N_Might,
    N_Health,
    N_Armor,
    // N_Sticky,
}

interface ItemDef {
    code?: string
    color?: number[]
    subtype?: ItemSubtype

    power?: Brew.Powers.Power
    canPickup?: boolean
    canUse?: boolean
    canHeave?: boolean
    damage?: number
    flags?: Array<Brew.Enums.Flag>
}

let item_defaults : ItemDef = {
    code: "?",
    color: Brew.Color.black,
    subtype: ItemSubtype.NonSpecific,
    canPickup: true,
    canUse: true,
    canHeave: false,
    damage: 0,
    flags: [],
}

// [key: number]: T
interface IItemDefs {
    [def_name: string] : ItemDef 
} 

let item_definitions  : IItemDefs = {
    "PowerRelatedItem": {
        code: Brew.Symbols.arrow_up,
        color: Brew.Color.power_axe,
        canPickup: false,
        canUse: false,
    },
    "PowerSystem": {
        code: Brew.Symbols.power_sys,
        color: Brew.Color.orange,
        canPickup: false,
        canUse: false,
    },
    "Grenade": {
        code: '!',
        color: Brew.Color.goldenrod,
    },
    "NanotechCore": {
        code: '=', 
        color: Brew.Color.goldenrod,
    },
    // "SuitModule": {
    //     code: '?',
    //     color: Brew.Color.goldenrod,
    // },
    // "WarpCrystal": {
    //     code: Brew.Symbols.diamond_full,
    //     color: Brew.Color.goldenrod,
    //     canUse: false,
    // },
    // "KeyCard": {
    //     code: '-',
    //     color: Brew.Color.goldenrod,
    //     canUse: false,
    // },
    // "Wreckage": {
    //     code: '%',
    //     color: Brew.Color.white,
    //     canUse: false,
    //     canPickup: false,
    //     canHeave: true,
    // },
    // "MacGuffin": {
    //     code: '(',
    //     color: Brew.Color.goldenrod,
    //     canUse: false,
    //     canPickup: true,
    //     canHeave: false,
    // }
    "Civilian": {
        code: '@',
        color: Brew.Color.goldenrod,
        canUse: false,
        canPickup: true,
        canHeave: false,
    },
    "Supplies": {
        code: '%',
        color: Brew.Color.goldenrod,
        canUse: false,
        canPickup: true,
        canHeave: false,
    },
    "Bullets": {
        code: '=',
        color: Brew.Color.goldenrod,
        canUse: false,
        canPickup: true,
        canHeave: false,
    },
    "Shells": {
        code: Brew.Symbols.power_sys,
        color: Brew.Color.goldenrod,
        canUse: false,
        canPickup: true,
        canHeave: false,
    },
}

    //     Grenade,
    // Nanotech,
    // SuitModule,
    // WarpCrystal,
    // KeyCard,
export function itemFactory(item_type : ItemType, options : ItemDef = {}) : Item {
    let i : Item = new Item(item_type)
    
    // build up definition with 3 layers: default, given def, options
    // 1. default
    let def : ItemDef = Brew.Utils.clone(item_defaults)
    
    // 2. given definition
    let type_name = ItemType[item_type]
    let type_def = item_definitions[type_name]
    for (let prop in type_def) {
        // console.log("typedef", prop, type_def[prop])
        def[prop] = type_def[prop]
    } 
    
    // 3. options
    for (let prop in options) {
        // console.log("options", prop, options[prop])
        def[prop] = options[prop]
    }
    
    // 4. set all properties
    for (let prop in def) {
        i[prop] = def[prop]
    }

    
    i.flags = [].concat(def.flags).concat(options.flags)

    return i
}


export enum MonsterType {
    Hero,
    Architect,
    Mercenary,
    Soldier,
    Grenadier,
    Jeep,
}

interface MonsterDef  {
    code?: string
    color?: number[]
    attack_range?: number
    monster_status? : Brew.Enums.MonsterStatus
    speed?: number
    sight_range?: number
    hp_number?: number
    shield_number?: number
    flags?: Array<Brew.Enums.Flag>
}

let monster_defaults : MonsterDef = {
    code: '1',
    color: Brew.Color.normal,
    attack_range: 1,
    monster_status: Brew.Enums.MonsterStatus.Sleep,        
    speed: 12,
    sight_range: Brew.Config.default_monster_sight_range,
    flags: [],
    hp_number: 1,
    shield_number: 0,
}

// [key: number]: T
interface IMonsterDefs {
    [def_name: string] : MonsterDef 
} 

let monster_definitions : IMonsterDefs = {
    "Hero": { 
        code: "@",
        color: Brew.Color.hero_blue,
        attack_range: 1,
        sight_range: Brew.Config.default_player_sight_range,
        hp_number: 12,
    },
    "Architect": {

    },
    "Mercenary": {
        code: "m",
        color: Brew.Color.monster_color,
        attack_range: 4, 
        flags: [Brew.Enums.Flag.KeepsDistance, Brew.Enums.Flag.NeedsTargetLock],
        hp_number: 1,
    },
    "Soldier": {
        code: "s",
        color: Brew.Color.monster_color,
        attack_range: 6, 
        flags: [Brew.Enums.Flag.NeedsTargetLock],
        hp_number: 1,
    },
    "Grenadier": {
        code: "G",
        color: Brew.Color.monster_color,
        attack_range: 6, 
        hp_number: 2,
        flags: [],
    },
}

    
export function monsterFactory(gm: Brew.GameMaster, monster_type : MonsterType, options : MonsterDef = {}) : Monster {
    let m : Monster = new Brew.GridThings.Monster(monster_type)
    
    // build up definition with 3 layers: default, given def, options
    // 1. default
    let def : MonsterDef = Brew.Utils.clone(monster_defaults)
    
    // 2. given definition
    let type_name = MonsterType[monster_type]
    let type_def = monster_definitions[type_name]
    for (let prop in type_def) {
        // console.log("typedef", prop, type_def[prop])
        def[prop] = type_def[prop]
    } 
    
    // 3. options
    for (let prop in options) {
        // console.log("options", prop, options[prop])
        def[prop] = options[prop]
    }
    
    // 4. set all properties
    for (let prop in def) {
        m[prop] = def[prop]
    }
    
    // 5. initiate stats
    m.hp = new Brew.Stat(Brew.Enums.StatName.Health, def.hp_number)
    m.shields = new Brew.Stat(Brew.Enums.StatName.Shields, def.shield_number)

    m.flags = [].concat(def.flags)
    if (options.flags) {
        m.flags = m.flags.concat(options.flags)
    }

    // act for ROT.js engine
    m.act = () => {
        gm.channel_turn.publish("turn.start", { actor: m })
        // game.monsterAct(m)
    }

    return m
}
