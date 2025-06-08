import * as Brew from "../brew"

let facingPointerLookup : {[offset_id:number] : string} = {}
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.RIGHT)] = Brew.Symbols.pointer_right
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.LEFT)] = Brew.Symbols.pointer_left
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.UP)] = Brew.Symbols.pointer_up
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN)] = Brew.Symbols.pointer_down
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN_LEFT)] = Brew.Symbols.pointer_downleft
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN_RIGHT)] = Brew.Symbols.pointer_downright
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.UP_RIGHT)] = Brew.Symbols.pointer_upright
facingPointerLookup[Brew.Utils.xyToKey(Brew.Directions.UP_LEFT)] = Brew.Symbols.pointer_upleft

function getFacingPointerForOffset(offset_xy: Brew.Coordinate) : string {
    return facingPointerLookup[Brew.Utils.xyToKey(offset_xy)]
}

let facingDoubleArrowLookup : {[offset_id:number] : string} = {}
facingDoubleArrowLookup[Brew.Utils.xyToKey(Brew.Directions.RIGHT)] = Brew.Symbols.dbl_arrow_right
facingDoubleArrowLookup[Brew.Utils.xyToKey(Brew.Directions.LEFT)] = Brew.Symbols.dbl_arrow_left
facingDoubleArrowLookup[Brew.Utils.xyToKey(Brew.Directions.UP)] = Brew.Symbols.dbl_arrow_up
facingDoubleArrowLookup[Brew.Utils.xyToKey(Brew.Directions.DOWN)] = Brew.Symbols.dbl_arrow_down

function getDoubleArrowForOffset(offset_xy: Brew.Coordinate) : string {
    return facingDoubleArrowLookup[Brew.Utils.xyToKey(offset_xy)]
}

export function updateMonsterParts(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) {
    if (actor.building_type == Brew.Enums.ComponentPartsBuildingType.None) {
        return
    } else if (actor.building_type == Brew.Enums.ComponentPartsBuildingType.Tank) {
        let turretPower = actor.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)
        
        let tank_parts = buildFeaturesForTank(gm, actor.location.clone(), actor.facing_direction, turretPower.facing_direction)
        for (let p of tank_parts) {
            p.setParent(actor)
        }

        actor.setParts(tank_parts)
    }
}

export function placeMonsterPartsOnGrid(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) {
    let level = gm.getCurrentLevel()
    let component_parts = actor.getParts()

    for (let tank_part of component_parts) {
        if (level.isValid(tank_part.location)) {
            level.parts.removeAt(tank_part.location)
            level.parts.setAt(tank_part.location, tank_part)    
        }
    }
    let triggered = Brew.Movement.checkForImpactOfNewParts(gm, actor, component_parts)
    gm.displayList(component_parts.map((f) => { return f.location}))
}

export function removeMonsterPartsFromGrid(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) {
    let level = gm.getCurrentLevel()
    let component_parts = actor.getParts()

    for (let tank_part of component_parts) {
        if (level.isValid(tank_part.location)) {
            level.parts.removeAt(tank_part.location)
        }
    }

    gm.displayList(component_parts.map((f) => { return f.location}))        
}

let Sqrt2 = Math.sqrt(2)
let TurnNone = [0, 1]
let TurnHalf = [Math.PI, 1]
let TurnQuarter = [Math.PI / 2, 1]
let TurnOctant = [Math.PI / 4, Sqrt2]
let TurnThreeOctant = [Math.PI * 3 / 4, Sqrt2]

function buildFeaturesForTank(gm: Brew.GameMaster, center_xy: Brew.Coordinate, tank_facing_dir_xy: Brew.Coordinate, turret_facing_dir_xy: Brew.Coordinate) : Array<Brew.GridThings.Feature> {

    // let level = gm.getCurrentLevel()
    let tank_parts : Array<Brew.GridThings.Feature> = []
    let feature_part : Brew.GridThings.Feature

    let starting_angle = Brew.Utils.xyToPolar(tank_facing_dir_xy).angle_theta

    //  wall
    let wall_code : string = (tank_facing_dir_xy.x != 0) ? "|" : Brew.Symbols.box_hline
    for (let turn of [TurnHalf, TurnNone]) {
        feature_part = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.TankPart, { code: wall_code })
        feature_part.location = center_xy.add(Brew.Utils.getPolarOffsetCoordinate(starting_angle + turn[0], turn[1]))
        tank_parts.push(feature_part)
    }

    // front wall/pointer
    // wall_code = getFacingArrowForOffset(facing_dir_xy)
    // feature_part = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.TankWall, { code: wall_code })
    // feature_part.location = center_xy.add(Brew.Utils.getPolarOffsetCoordinate(starting_angle, 1))
    // tank_parts.push(feature_part)

    for (let turn of [TurnOctant, TurnQuarter, TurnThreeOctant]) {
        feature_part = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.TankPart, { code: '0' })
        feature_part.location = center_xy.add(Brew.Utils.getPolarOffsetCoordinate(starting_angle + turn[0], turn[1]))
        tank_parts.push(feature_part)
    }

    for (let turn of [TurnOctant, TurnQuarter, TurnThreeOctant]) {
        feature_part = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.TankPart, { code: '0' })
        feature_part.location = center_xy.add(Brew.Utils.getPolarOffsetCoordinate(starting_angle - turn[0], turn[1]))
        tank_parts.push(feature_part)
    }
    
    // driving/forward pointer
    let pointer_char = getFacingPointerForOffset(tank_facing_dir_xy)
    feature_part = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.TankPart, { code: pointer_char })
    let facing_xy = feature_part.location = center_xy.add(tank_facing_dir_xy)
    // remove whatever part is there now
    tank_parts = tank_parts.filter((f) => { return (!(f.location.compare(facing_xy))) })
    tank_parts.push(feature_part)
    
    // turret
    let turret_char = getDoubleArrowForOffset(turret_facing_dir_xy)
    let turret_xy = center_xy
    // remove whatever part is there now
    // tank_parts = tank_parts.filter((f) => { return (!(f.location.compare(turret_xy))) })
    // put in the new part
    feature_part = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.TankPart, { code: turret_char })
    feature_part.location = turret_xy
    tank_parts.push(feature_part)

    return tank_parts
}