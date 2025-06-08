import * as Brew from "../brew"
import { startGame } from "../start"

// called from postal.js channel
export function mainEventhandler(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent, envelope)  {
    if (data.eventType == Brew.Enums.BrewEventType.Error) {
        if (data.errorMsg) { console.log(data.errorMsg) }
        return
    } 
    
    if (data.eventType == Brew.Enums.BrewEventType.Info) {
        display_info(gm, data)
        
    } else if (data.eventType == Brew.Enums.BrewEventType.Move) {
       Brew.Movement.move(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.RotateBody) {
        Brew.Tank.rotate_body(gm, data)
 
    } else if (data.eventType == Brew.Enums.BrewEventType.RotateWeapon) {
        Brew.Tank.rotate_weapon(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.HelpOn) {
        Brew.Menus.showHelpMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Wait) {
        Brew.Movement.rest(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Pickup) {
        Brew.ItemInteraction.pickup(gm, data)
    
    } else if (data.eventType == Brew.Enums.BrewEventType.Drop) {
        Brew.ItemInteraction.dropItemAttempt(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Land) {
        Brew.ItemInteraction.doLandingEventAfterThrown(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Heave) {
        Brew.ItemInteraction.doLandingEventAfterHeave(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.UseItem) {
        Brew.ItemInteraction.useItem(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Special) {
        special(gm, data)
    
    } else if (data.eventType == Brew.Enums.BrewEventType.ApplyDamage) {
        Brew.Combat.applyDamage(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Attack) {
        Brew.Combat.attack(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.SmashAttack) {
        Brew.Combat.smash_attack(gm, data)
    
    } else if (data.eventType == Brew.Enums.BrewEventType.Hack) {
        remote_hack(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.ShieldsUp) {
        shields_up(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.CloakOn) {
        cloak_on(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.PhaseWalkOn) {
        phasewalk_on(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.RocketPunch) {
        Brew.Powers.rocketPunch(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.TargetingOn) {
       Brew.Targeting.targetingOn(gm, data)
        
    } else if (data.eventType == Brew.Enums.BrewEventType.TargetingCancel) {
       Brew.Targeting.targetingCancel(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.TargetingFinish) {
       Brew.Targeting.targetingFinish(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.TargetingMove) {
       Brew.Targeting.targetingMove(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.InventoryOn) {
        Brew.Menus.showInventoryList(gm, data)
        
    } else if (data.eventType == Brew.Enums.BrewEventType.ContextMenuOn) {
        Brew.Menus.showContextMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.HeadsUpDisplayOn) {
       Brew.Menus.showHeadsUpDisplay(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerMenuOn) {
        Brew.Menus.showPowerManagementMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerUninstall) {
        Brew.Powers.uninstallPower(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerSwapSelectMenuOn) {
        Brew.Menus.showPowerSwapSelectMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerSwapFinalize) {
        Brew.Powers.swapPower(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerInstallPromptOn) {
        Brew.Menus.showPowerInstallPromptMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerInstallReplacementOn) {
        Brew.Menus.showPowerInstallSelectMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PowerInstallFinalize) {
        Brew.Powers.installPower(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.PlayerDeath) {
        game_over(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.Victory) {
        game_victory(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.RestartGame) {
        restart_game(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.UsePortal) {
       Brew.Movement.triggerPortalUse(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.ChangeLevel) {
        change_level(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.RunAnimation) {
        Brew.Animations.runAnimationEvent(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.GenericMenuOn) {
        Brew.Menus.showGenericMenu(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.GenericMenuOff) {
        Brew.Menus.stopShowingGenericMenu(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.GenericMenuMove) {
        Brew.Menus.updateGenericMenu(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.GenericMenuSelect) {
       Brew. Menus.selectFromGenericMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.ConfirmPathsOn) {
        Brew.Menus.showConfirmPaths(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.ConfirmPathsFinalize) {
        Brew.Menus.finalizeConfirmPaths(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.ConfirmPathsCancel) {
        Brew.Menus.cancelConfirmPaths(gm, data)
    
    } else if (data.eventType == Brew.Enums.BrewEventType.HeavyAxeThrow ) {
        Brew.Powers.throw_axe(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.HeavyAxeRecall ) {
        Brew.Powers.recall_axe(gm, data)
        
    } else if (data.eventType == Brew.Enums.BrewEventType.DebugCreateMobMenuOn) {
        Brew.Debug.showCreateMonsterAtMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.DebugCreateMobAt) {
        Brew.Debug.createMonsterAt(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.DebugCreateFeatureMenuOn) {
        Brew.Debug.showCreateFeatureAtMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.DebugCreateFeatureAt) {
        Brew.Debug.createFeatureAt(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.DebugCreateTerrainAt) {
        Brew.Debug.createTerrainAt(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.DebugCreateTerrainMenuOn) {
        Brew.Debug.showCreateTerrainAtMenu(gm, data)

    } else if (data.eventType == Brew.Enums.BrewEventType.MassDamage) {
        Brew.Combat.applyMassDamage(gm, data)
    
    } else if (data.eventType == Brew.Enums.BrewEventType.Knockback) {
       Brew.Movement.knockback(gm, data)
    } else if (data.eventType == Brew.Enums.BrewEventType.AcquireTarget) {
       Brew.Targeting.aquireTargetLockEvent(gm, data)

    } else {
        console.error("received unknown event type", data)
    }
    
}

function change_level(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let portal : Brew.Portal = data.portalData.portal_used 
    let level_audit = Brew.Tank.processInventory(gm)

    gm.getCurrentLevel().monsters.removeAt(gm.getPlayer().location)
    gm.setupLevel(portal.dest_level_id, portal.dest_location_xy)
    // gm.displayAll()

    gm.insertEvent(Brew.Tank.getLevelAuditReport(gm, level_audit))
    gm.endEvent(data)
}

function special(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) { 
    
    // gm.displayAt(data.actor.location)
    gm.endEvent(data)


}

function display_info(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let level = gm.getCurrentLevel()
    // todo: this is the in-depth highlight tool, vs cursor overview

    // debug show what's there
    let divDebug = <HTMLDivElement> (document.getElementById("id_div_debug"))
    divDebug.innerHTML = "<p>" + data.moveData.to_xy.toString() + "</p>"
    gm.display.drawFooter()
    gm.endEvent(data)
}

function remote_hack(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let target_xy : Brew.Coordinate = data.moveData.to_xy
    let target = gm.getCurrentLevel().monsters.getAt(target_xy)

    // decrement power charge on success
    data.powerData.power.charge_stat.decrement(1)
    
    if (target.team != Brew.Enums.Team.Player) {
        target.team = Brew.Enums.Team.PlayerAllied
        console.log(`${target.name} has been hacked!!`)
        target.color = Brew.Color.hero_blue
        gm.displayAt(target.location)
    }
    gm.endEvent(data)

}

function shields_up(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    data.actor.shields = new Brew.Stat(Brew.Enums.StatName.Shields, Brew.Config.player_shield_amount)
    gm.getPlayer().color = Brew.Color.power_shield
    console.log("shields activated")

    // Brew.Animations.animateCircle(gm, data.actor.location, 3, Brew.Color.power_shield, data)
    let animationEvent = Brew.Animations.createCircleAnimationEvent(data, Brew.Color.power_shield, 3)
    // let animationEvent = Brew.Animations.createReverseCircleAnimationEvent(data, Brew.Color.power_shield, 3)
    gm.insertEvent(animationEvent)
    gm.endEvent(data)
}

function cloak_on(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    data.actor.setFlag(Brew.Enums.Flag.Invisible)
    gm.timer_monitor.addTimer(new Brew.Timers.TurnTimer(data.actor, Brew.Enums.Flag.Invisible, gm.turn_count, 20)) //todo: tie power duration to power level/strengh

    console.log("going dark")
    let animationEvent = Brew.Animations.createCircleAnimationEvent(data, Brew.Color.power_cloak, 3)
    gm.insertEvent(animationEvent)
    gm.endEvent(data)
}

function phasewalk_on(gm : Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    data.actor.setFlag(Brew.Enums.Flag.PhaseWalk)
    gm.timer_monitor.addTimer(new Brew.Timers.TurnTimer(data.actor, Brew.Enums.Flag.PhaseWalk, gm.turn_count, 10))
    console.log("ghost mode activated")
    // Brew.Animations.animateCircle(gm, data.actor.location, 3, Brew.Color.power_phasewalk, data)
    let animationEvent = Brew.Animations.createCircleAnimationEvent(data, Brew.Color.power_phasewalk, 3)
    gm.insertEvent(animationEvent)
    gm.endEvent(data)
}

function game_over(gm : Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    // gm.display.gameOverDraw()
    // gm.input_handler = InputHandler.WaitToRestart
    
    // clear out other actors
    gm.getCurrentLevel().monsters.getAllThings().forEach((mob: Brew.GridThings.Monster) => {
        if (!(mob.isSameThing(gm.getPlayer()))) {
            gm.scheduler.remove(mob)
        }
    })
    // clear out non-level actors
    gm.scheduler.remove(gm.getArchitect())
    
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []

    menu_entries.push({
        entryName: "New Game",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: {
            eventType: Brew.Enums.BrewEventType.RestartGame,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true
        }
    })

    menu_entries.push({
        entryName: "Restart Seed",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: {
            eventType: Brew.Enums.BrewEventType.RestartGame,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true,
            restartData: { seed: gm.getSeed() }
        }
    })

    let deathMenuEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.GenericMenuOn,
        actor: gm.getPlayer(),
        playerInitiated: false,
        endsTurn: false,
        genericMenuData: {
            menuTitle: "Congratulations",
            menuDescription: "You have died!",
            allowCancel: false,
            menuEntriesList: menu_entries
        }
    }

    // clear out pending event queue
    gm.clearEventQueue()

    gm.insertEvent(deathMenuEvent)
    gm.endEvent(data)
}

function restart_game(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let given_seed : number = null
    if (brEvent.restartData) {
        // starting_seed = brEvent.restartData.seed
        given_seed = brEvent.restartData.seed
    }
    startGame(given_seed)
}

export function createGenericEventOfType(gm : Brew.GameMaster, event_type: Brew.Enums.BrewEventType, ends_turn : boolean = false) : Brew.Enums.IBrewEvent {
    return {
        eventType: event_type,
        actor: gm.getPlayer(),
        playerInitiated: true,
        endsTurn: ends_turn
    }
}

export function addDataToEvent(brEvent : Brew.Enums.IBrewEvent, extraData: Brew.Enums.IBrewExtraEventData) : Brew.Enums.IBrewEvent {
    let newEvent : Brew.Enums.IBrewEvent = {...brEvent}

    for (var key in extraData) {
        if (extraData.hasOwnProperty(key)) {
            var element = extraData[key]
            newEvent[key] = element
        }
    }
    return newEvent
}

function game_victory(gm : Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    // gm.display.gameOverDraw()
    // gm.input_handler = InputHandler.WaitToRestart
    
    // clear out other actors
    gm.getCurrentLevel().monsters.getAllThings().forEach((mob: Brew.GridThings.Monster) => {
        if (!(mob.isSameThing(gm.getPlayer()))) {
            gm.scheduler.remove(mob)
        }
    })
    // clear out non-level actors
    gm.scheduler.remove(gm.getArchitect())
    
    let menu_entries : Array<Brew.Enums.IBrewGenericMenuEntry> = []

    menu_entries.push({
        entryName: "New Game",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: {
            eventType: Brew.Enums.BrewEventType.RestartGame,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true
        }
    })

    menu_entries.push({
        entryName: "Restart Seed",
        entryType: Brew.Enums.GenericMenuEntryType.EventBased,
        entryEvent: {
            eventType: Brew.Enums.BrewEventType.RestartGame,
            actor: gm.getPlayer(),
            playerInitiated: true,
            endsTurn: true,
            restartData: { seed: gm.getSeed() }
        }
    })

    let victoryMenuEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.GenericMenuOn,
        actor: gm.getPlayer(),
        playerInitiated: false,
        endsTurn: false,
        genericMenuData: {
            menuTitle: "V I C T O R Y",
            menuDescription: "You did it! Congratulations! This victory screen will have to do for now, until high scores are implemented.",
            allowCancel: false,
            menuEntriesList: menu_entries
        }
    }

    // clear out pending event queue
    gm.clearEventQueue()

    gm.insertEvent(victoryMenuEvent)
    gm.endEvent(data)
}