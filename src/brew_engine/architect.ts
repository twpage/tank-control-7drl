import * as ROT from 'rot-js'
import * as Brew from '../brew'


export function architectAI(gm: Brew.GameMaster, actor: Brew.GridThings.Monster) : Brew.Enums.IBrewEvent {
    
    let level = gm.getCurrentLevel()

    // check timers on everything that is not a monster

    for (let timer of gm.timer_monitor.getAllTimers()) {
        if (!(timer.actor instanceof Brew.GridThings.Monster)) {
            gm.checkTimersForActor(timer.actor)
        }
    }
    
    // fireeeee
    level.features.getAllThings().filter((feature) => { return feature.isType(Brew.Definitions.FeatureType.Fire) }).forEach((feature) => {
        spreadFire(gm, level, feature)
    })

    // look for ambient effects on on mobs
    level.monsters.getAllThings().forEach((mob) => {
        Brew.Movement.checkForAmbientEffects(gm, mob)
    })



    // return an event that does nothing!
    let noEvent = Brew.Events.createGenericEventOfType(gm, Brew.Enums.BrewEventType.Special, true)
    let noEvent2 : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.Special,
        actor: actor,
        playerInitiated: false,
        endsTurn: true
    }
    
    return noEvent2
}


function spreadFire(gm: Brew.GameMaster, level: Brew.Level, fire_feature: Brew.GridThings.Feature ) {
    let terrain_at: Brew.GridThings.Terrain
    let feature_at: Brew.GridThings.Feature
    let feature_spawn: Brew.GridThings.Feature
    
    terrain_at = level.terrain.getAt(fire_feature.location)

    if (ROT.RNG.getUniform() < 0.25) {
        level.features.removeAt(fire_feature.location)
        gm.timer_monitor.setFlagWithTimer(gm, terrain_at, Brew.Enums.Flag.Burnt, 10)
        gm.displayAt(fire_feature.location)
        return
    }

    fire_feature.location.getAdjacent().forEach((xy) => {
        if (!(level.isValid(xy))) {
            return
        }

        terrain_at = level.terrain.getAt(xy)
        if (terrain_at.blocks_flying || terrain_at.blocks_walking) {
            return
        }

        if (terrain_at.hasFlag(Brew.Enums.Flag.Burnt)) {
            return
        }

        feature_at = level.features.getAt(xy)

        if (feature_at) {
            if (feature_at.isType(Brew.Definitions.FeatureType.Fire)) {
                return
            } else {
                level.features.removeAt(xy)
            }
        }

        feature_spawn = Brew.Definitions.featureFactory(Brew.Definitions.FeatureType.Fire)
        // feature_spawn.setParent(feature_at)
        level.features.setAt(xy, feature_spawn)
        gm.displayAt(xy)
    })
}