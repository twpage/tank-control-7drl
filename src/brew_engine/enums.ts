import * as Brew from "../brew"

export enum ComponentPartsBuildingType {
    None,
    Tank,
}
export enum BrewObjectType {
    Thing = 1,
    Terrain,
    Item,
    Monster,
    Feature,
    Above
}

export enum BrewPowerType {
    EmptyNone = 1,
    TurretCannon,
    MachineGun,
    Scanner,
}

export enum BrewEventType {
    Error,
    Info,
    Wait,
    Move,
    Attack,
    Pickup,
    Drop,
    Land,
    Heave,
    UseItem,
    SmashAttack,
    ApplyDamage,
    MassDamage,
    Hack,
    HeavyAxeThrow,
    HeavyAxeRecall,
    ShieldsUp,
    CloakOn,
    PhaseWalkOn,
    RocketPunch,
    RunAnimation,
    
    PowerUninstall,

    PowerSwapSelectMenuOn,
    PowerSwapFinalize,

    PowerInstallPromptOn,
    PowerInstallReplacementOn,
    PowerInstallFinalize,

    TargetingOn,
    TargetingCancel,
    TargetingFinish,
    TargetingMove,
    
    InventoryOn,
    ContextMenuOn,
    PowerMenuOn,
    HeadsUpDisplayOn,

    GenericMenuOn,
    GenericMenuMove,
    GenericMenuSelect,
    GenericMenuOff,

    PlayerDeath,
    Victory,
    RestartGame,
    UsePortal,
    ChangeLevel,

    DebugCreateMobMenuOn,
    DebugCreateMobAt,
    
    DebugCreateFeatureMenuOn,
    DebugCreateFeatureAt,
    
    DebugCreateTerrainMenuOn,
    DebugCreateTerrainAt,

    ConfirmPathsOn,
    ConfirmPathsFinalize,
    ConfirmPathsCancel,
    Special,

    Knockback,

    AcquireTarget,

    WarpBeaconUpgradePower,
    WarpBeaconIncreasePower,
    WarpBeaconRechargePower,
    WarpBeaconHeal,
    WarpBeaconAllyDrop,

    RotateBody,
    RotateWeapon,
    HelpOn,
}

// export interface IContextMenuData {
//     item?: Brew.Item,
//     context_list: Array<ContextMenuItem>
//     selected_index: number
// }

export interface IDisplayOptions {
    blackAndWhiteMode?: boolean
}

// main brew event -> tack on extra data as necessary, according to type
export interface IBrewEvent extends IBrewExtraEventData {
    eventType: BrewEventType,
    actor: Brew.GridThings.Monster,
    endsTurn?: boolean,
    playerInitiated?: boolean,
    errorMsg?: string,
    // eventData?: any, // generic data

}

export interface IBrewExtraEventData {
    // specialized event data
    moveData?: IBrewMoveEventData,
    targetingData?: IBrewTargetingData,
    damageData?: IBrewDamageEventData,
    attackData?: IBrewAttackEventData,
    animationData?: IBrewAnimationEventData,
    itemData?: IBrewItemEventData,
    powerData?: IBrewPowerEventData,
    swapPowerData?: IBrewPowerEventData,
    startTargetingData?: IBrewStartTargetingEventData,
    portalData?: IBrewPortalEventData,
    offsetData?: IBrewOffsetEventData,
    inventoryData?: IBrewInventoryEventData,
    contextMenuData?: IBrewContextMenuData
    genericMenuData?: IBrewGenericMenuEventData,
    confirmPathsData?: IBrewConfirmPathsEventData,
    debugMenuData?: IBrewDebugMenuEventData,
    pathsData?: IBrewPathEventData,
    knockbackData?: IBrewKnockbackEventData,
    restartData?: IBrewRestartEventData,
    headsUpData?: IBrewHeadsUpEventData,
    rotateData?: IBrewRotateEventData,
    helpData?: IBrewHelpEventData,
}

export interface IBrewRotateEventData {
    old_facing_xy: Brew.Coordinate,
    new_facing_xy: Brew.Coordinate,
    weaponPower?: Brew.Powers.Power
}

export interface IBrewHelpEventData {
    selected_index: number,
}

export interface IBrewHeadsUpEventData {
    headsUpDisplayNotePages: Array<Brew.HUD.IHeadsUpPage>,
    selected_index: number,
}

// export enum BrewHeadsUpDisplayType {
//     HealthAndStatus,
//     MonsterNames,
//     BehavioralFlags,
//     TerrainAndFeatures,
//     ItemsInView,
// }

export interface IBrewPathEventData {
    from_xy: Brew.Coordinate,
    to_xy: Brew.Coordinate,
    path: Array<Brew.Coordinate>
}

// specialized event data
export interface IBrewMoveEventData {
    from_xy: Brew.Coordinate,
    to_xy: Brew.Coordinate
}

export interface ICoordinateColorPair {
    xy: Brew.Coordinate,
    color: number[]
}

export interface IBrewConfirmPathsEventData {
    follow_event: IBrewEvent,
    highlights: Array<ICoordinateColorPair>,
    valid_path: boolean,
}

export interface IBrewPortalEventData {
    portal_used: Brew.Portal
}

export interface IBrewRestartEventData {
    seed: number
}

export interface IBrewItemEventData {
    item: Brew.GridThings.Item,
    invkey?: string,
    to_xy?: Brew.Coordinate,
    // from_xy?: Brew.Coordinate,
}

export interface IBrewPowerEventData {
    power: Brew.Powers.Power
}

export interface IBrewInventoryEventData {
    inventory?: Brew.Inventory,
    selected_item_index?: number,
    direction?: number,
    item?: Brew.GridThings.Item,
    invkey?: string
}

export interface IBrewContextMenuData {
    context_list?: Array<ContextMenuItem>,
    selected_item_index?: number,
    direction?: number,
    item?: Brew.GridThings.Item,
    invkey?: string
}

export interface IBrewStartTargetingEventData {
    from_xy: Brew.Coordinate,
    to_xy: Brew.Coordinate,
    targetingAction: BrewTargetingAction,
    minimumArc?: number,
    maximumArc?: number,
    midpointArc?: number,
}

export interface IBrewOffsetEventData {
    offset_xy: Brew.Coordinate
}

export interface IBrewTargetingData {
    origin_xy: Brew.Coordinate 
    from_xy: Brew.Coordinate,
    to_xy: Brew.Coordinate,
    method: BrewTargetingMethod,
    action: BrewTargetingAction,
    destinationMustBeWalkable: boolean,
    destinationMustBeVisible: boolean,
    destinationMustHaveMob: boolean,
    pathBlockedByNonWalkable: boolean,
    pathBlockedByNonFlyable: boolean,
    pathBlockedByMobs: boolean,
    minimumDistance: number,
    maximumDistance?: number,
    minimumArc?: number,
    maximumArc?: number,
    midpointArc?: number,
    path?: Array<Brew.Coordinate>
}

export interface IBrewAttackEventData {
    from_xy: Brew.Coordinate,
    to_xy: Brew.Coordinate,
    target: Brew.GridThings.Monster,
    isMelee: boolean,
    damage: number,
    effects?: Array<Brew.Enums.Flag>,
    behind_xy?: Brew.Coordinate,
    // dontAnimate?: boolean
}

export interface IBrewDamageEventData {
    target: Brew.GridThings.Monster,
    damageToShields: number,
    damageToHP: number,
    shieldUsed: Brew.Powers.Power,
    isFatal: boolean,
    effects?: Array<Brew.Enums.Flag>
}

export enum BrewAnimationType {
    Flash,
    OverPath,
    CircleOut,
    CircleIn,
}

export interface IBrewAnimationEventData {
    animationType: BrewAnimationType
    from_xy: Brew.Coordinate
    to_xy: Brew.Coordinate
    path?: Array<Brew.Coordinate>
    color?: number[]
    code?: string
    range?: number
    //animationSpeed?: number
}

export interface IBrewKnockbackEventData {
    target: Brew.GridThings.Monster,
    origin_xy: Brew.Coordinate,
    magnitude: number
}

export interface IBrewGenericMenuEntry {
    entryType: GenericMenuEntryType,
    entryEvent: Brew.Enums.IBrewEvent,
    entryName?: string,
    entryDescription?: string,
}

export interface IBrewDebugMenuEventData {
    monsterTypeDefinition?: Brew.Definitions.MonsterType
    featureTypeDefinition?: Brew.Definitions.FeatureType
    terrainTypeDefinition?: Brew.Definitions.TerrainType
}

export interface IBrewGenericMenuEventData {
    menuTitle: string,
    menuDescription?: string,
    allowCancel: boolean,
    menuEntriesList?: Array<IBrewGenericMenuEntry>,
    selected_index?: number,
    direction?: number
}

export interface IBrewTurnData {
    actor: Brew.GridThings.Monster
}

export enum BrewInputSource {
    Keyboard,
    Mouse,
    Touch
}

export interface IBrewInputData {
    source: BrewInputSource,
    code?: number,
    button?: number,
    jsevent?: any
}

export enum InputHandler {
    Main,
    Targeting,
    ConfirmPaths,
    GenericMenu,
    WaitToDismiss,
    HeadsUpDisplay,
    HelpMenu,
}

export enum ContextMenuItem {
    Drop = 1,
    Use,
    Throw // todo: replace these with generic menu items
}

export enum GenericMenuEntryType {
    Yes = 1,
    No,
    InventoryItem,
    ItemContextAction,
    // PowerSelect,
    Quit,
    EventBased,
    Cancel
}

export enum BrewTargetingMethod {
    PointOnly,
    StraightLine
}

export enum BrewTargetingAction {
    Examine,
    Teleport,
    ThrowItem,
    HeaveItem,
    RangedAttack,
    Hack,
    RocketPunch,
    ThrowHeavyAxe,
    DebugSummonMob,
    DebugMakeFeature,
    DebugMakeTerrain,
}

export enum BrewVisionSource {
    xNoVision,
    xSelf,
    xRemote
}

export enum Flag {
    Stunned,
    Immobile,
    PackAttack,
    KeepsDistance,
    SeeAll,
    Invisible,
    RemoteScan,
    PhaseWalk,
    Hacked,
    Flying,
    Weak,
    Invulnerable,
    CausesWeak,
    CausesStun,
    CausesKnockback,
    OnDeathKnockback,
    CausesInvulnerable,
    NeedsTargetLock,
    Burnt,
    CausesExplosion,
}

export enum Team {
    Player = 1,
    PlayerAllied,
    Enemy
}

export enum PathmapCacheType {
    ToPlayer_Walk,
    ToPlayer_Fly,
    FromPlayer_Walk,
    FromPlayer_Fly
}

export enum LevelNavigationType {
    Walk,
    Fly
    //walkable no items no exits
    //ignore radiation
    //walkable safe from radiation
}

export enum StatName {
    Health = 1,
    Shields,
    PowerCharge,
    StrengthRank,
    Score,
}




// module Brew.Flags {
//     export const keeps_distance : IBrewFlag = {
//         // name: "keeps_distance",
//         desc_player: null,
//         desc_enemy: "attacks from a distance"
//     }
//     export const see_all : IBrewFlag = {
//         desc_player: "all-seeing",
//         desc_enemy: "sees everywhere"
//     }
//     export const is_invisible: IBrewFlag = {
//         desc_player: "is invisible",
//         desc_enemy: "is invisible"
//     }
// }
export enum MonsterStatus {
    Sleep,
    Wander,
    Hunt,
    Escape
}

export enum DisplayNames {
    Game,
    // Layer,
    HUD,
    Footer,
    Header,
}

// export enum BrewNoteType {
//     StatusEffect,
//     MonsterInfo
// }

export enum BrewNoteType {
    TimedEffect,
    Health,
    BehavioralFlag,
    Terrain,
    Feature,
    NotableItem,
    TargetingLock,
    Speed,
}

export enum FancyStepType {
    None,
    Squarestep,
    Lunge,
}

export interface ICharAndColor {
    char: string,
    color: Brew.Color.IColor
}

export enum PowerUpgradeType {
    IncreaseStrength = 1,
    IncreaseNumberOfCharges
}

export enum FiringArc {
    OctantArc = 1,
    QuarterArc,
    ThreeOctantArc,
    HalfArc,
    ThreeQuarterArc,
    FullArc,
}

