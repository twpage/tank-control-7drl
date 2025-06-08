import * as postal from 'postal'
import * as ROT from 'rot-js'
import * as Brew from '../brew'

export class GameMaster {
    
    // main ROT engine
    scheduler : ROT.Scheduler.Speed
    engine : ROT.Engine
    turn_count : number = 0
    first_startup : boolean

    // ROTjs displays
    public display : Brew.Display
    
    // postal.js channels
    public channel_event : IChannelDefinition<Brew.Enums.IBrewEvent> // main channel for all game events
    public channel_turn : IChannelDefinition<Brew.Enums.IBrewTurnData> // handle turn start/end
    public channel_input : IChannelDefinition<Brew.Enums.IBrewInputData> // channel for external user input  
    public channel_display : IChannelDefinition<any> // channel for external user input  

    // channel listeners
    private feed_event : ISubscriptionDefinition<any>
    private feed_turn_start : ISubscriptionDefinition<any>
    private feed_turn_end : ISubscriptionDefinition<any>
    private feed_input : ISubscriptionDefinition<any>
    private feed_display : ISubscriptionDefinition<any>
    
    private event_queue : Array<Brew.Enums.IBrewEvent> = []

    // private variables
    private start_seed : number
    private player : Brew.GridThings.Monster
    private architect : Brew.GridThings.Monster

    private current_level : any 
    private block_input : boolean
    private current_turn_actor : any
    // public Brew.Pathmap_to_player : Brew.Path.Pathmap
    // public Brew.Pathmap_to_playerally : Brew.Path.Pathmap
    // public Brew.Pathmap_from_player : Brew.Path.Pathmap
    // public Brew.Pathmap_from_playerally : Brew.Path.Pathmap // todo: dictionary of Brew.Pathmaps instead of this
    public pathmaps : Brew.Path.PathmapCache
    public timer_monitor : Brew.Timers.TimerMonitor

    // outsourced functions
    private event_fn: any
    private input_fn: any
    private ai_fn: any
    private preplayer_fn: any
    private postplayer_fn: any
    // private postturn_fn : any

    public input_handler : Brew.Enums.InputHandler = Brew.Enums.InputHandler.Main

    private lastEvent : Brew.Enums.IBrewEvent
    private lastEventIncludeErrors : Brew.Enums.IBrewEvent
    
    private levels : Brew.Utils.Dict<Brew.Level> = {}

    constructor(given_seed :number, div_container: HTMLDivElement, input_fn: any, event_fn: any, ai_fn: any, preplayer_fn: any, postplayer_fn: any) {
        
        // init RNG
        this.initRNG(given_seed)

        // instantiate ROTjs engine
        this.scheduler = new ROT.Scheduler.Speed()
        this.engine = new ROT.Engine(this.scheduler)
        this.block_input = true

        // initiate internal utility classes
        this.timer_monitor = new Brew.Timers.TimerMonitor()
        this.pathmaps = new Brew.Path.PathmapCache()

        // display class will handle setting up canvas, etc
        this.display = new Brew.Display(this, div_container)
        
        // setup event/input handlers
        // this.initEventListener(div_container)
        
        // instantiate postal.js channels
        this.channel_event = postal.channel("event")
        this.channel_turn = postal.channel("turn")
        this.channel_input = postal.channel("input")
        this.channel_display = postal.channel("display")
        
        // outsourced functions
        this.event_fn = event_fn
        this.input_fn = input_fn
        this.ai_fn = ai_fn
        this.preplayer_fn = preplayer_fn
        this.postplayer_fn = postplayer_fn
        // this.postturn_fn = postturn_fn

        // start feed listeners
        this.feed_turn_start = this.channel_turn.subscribe("turn.start", (data: Brew.Enums.IBrewTurnData, envelope) => {this.handleTurnStart(data, envelope)}) 
        this.feed_turn_end = this.channel_turn.subscribe("turn.end", (data: Brew.Enums.IBrewTurnData, envelope) => {this.handleTurnEnd(data, envelope)}) 
        
        this.feed_event = this.channel_event.subscribe("event.start", (data: Brew.Enums.IBrewEvent, envelope) => { this.eventFunctionWrapper(data, envelope) })
        this.feed_event = this.channel_event.subscribe("event.end", (data: Brew.Enums.IBrewEvent, envelope) => { this.handleEventEnd(data, envelope) })
        
        this.feed_input = this.channel_input.subscribe("input.*", (data: Brew.Enums.IBrewInputData, envelope) => { this.inputFunctionWrapper(data, envelope) }) 
        
        this.feed_display = this.channel_display.subscribe("display.*", (data, envelope) => { this.handleDisplay(data, envelope) })
        
        // set up first level, start engine, define player, etc
        this.setupGame()

        // if (BREW_FIRST_STARTUP) {
        //     this.startMenu()
        // }
    }
    
    initRNG(given_seed: number) {
        if (given_seed) {
            this.start_seed = given_seed
        } else {
            this.start_seed = Math.floor(ROT.RNG.getUniform() * 9999)
        }

        ROT.RNG.setSeed(this.start_seed)
        console.log("starting with SEED ", this.start_seed)
    }

    getSeed() { return this.start_seed }
    
    setupGame() {

        // init player for the first time and add to the scheduler
        let player = buildPlayer(this)
        this.player = player 

        // architect is like a non-mob environmental manager
        this.architect = Brew.Definitions.monsterFactory(this, Brew.Definitions.MonsterType.Architect)

        // build first level
        let first_level = Brew.LevelGenerator.buildLevel(this, 1, false)
        this.addLevel(first_level)

        this.setupLevel(first_level.id, first_level.simple_start_xy)
        this.engine.start()
    }
    
    addLevel(new_level : Brew.Level) {
        let key = new_level.id
        this.levels[key] = new_level
    }

    removeLevel(level_id : number) {
        delete this.levels[level_id]
    }

    getLevelByID(level_id: number) : Brew.Level {
        return this.levels[level_id]
    }

    hasLevel(level_id : number) : boolean {
        return level_id in this.levels
    }

    setupLevel(level_id : number, player_start_xy : Brew.Coordinate) {
        let player = this.getPlayer()
        this.engine.lock()
        
        if (!(this.hasLevel(level_id))) {
            throw new Error(`Level with id ${level_id} does not exist`)
        }
        
        if (this.current_level) {
            player.memory_archive.saveLevelMemory(this.current_level.id, player.memory)
        }

        let new_level = this.levels[level_id]
        
        // set this as our current level
        this.current_level = new_level

        // make sure we add player to the level somewhere 
        // todo: better starting coords based on entrance/exit portals
        if (new_level.monsters.hasAt(player_start_xy)) {
            console.error("monster already exists at player's starting location")
        }        
        
        new_level.monsters.setAt(player_start_xy, player)

        // figure out facing direction
        let half_x = Brew.Config.map_width_tiles / 2
        let half_y = Brew.Config.map_height_tiles / 2

        let turret = player.getPowers().getPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)
        if ((player_start_xy.x < half_x) && (player_start_xy.y < half_y)) {
            turret.facing_direction = Brew.Directions.RIGHT.clone()
        } else if ((player_start_xy.x < half_x) && (player_start_xy.y >= half_y)) {
            turret.facing_direction = Brew.Directions.UP.clone()
        } else if ((player_start_xy.x >= half_x) && (player_start_xy.y < half_y)) {
            turret.facing_direction = Brew.Directions.LEFT.clone()
        } else {
            turret.facing_direction = Brew.Directions.DOWN.clone()
        }

        Brew.Parts.updateMonsterParts(this, player)
        Brew.Parts.placeMonsterPartsOnGrid(this, player)
    
        // clear memory and reset if we've been on this level before
        this.player.memory.clearAll()
        if (player.memory_archive.hasLevelMemory(new_level.id)) {
            player.memory = player.memory_archive.getLevelMemory(new_level.id)
        }

        Brew.Intel.runBeforePlayerTurn(this, player)

        
        // redo all Brew.Pathmaps
        this.updateAllPathmaps()
        //this.preplayer_fn(this, this.player)
        //this.display.drawAll()
        
        // schedule all mobs in the level
        this.scheduler.clear()
        this.addActorToScheduler(this.player)
        for (let m of new_level.monsters.getAllThings()) {
            if (!(m.isSameThing(this.player))) {
                this.addActorToScheduler(m)
                Brew.Parts.updateMonsterParts(this, m)
                Brew.Parts.placeMonsterPartsOnGrid(this, m)
                        
            }
        }
        this.addActorToScheduler(this.getArchitect())
        // this.addActorToScheduler(Definitions.monsterFactory(this, Brew.Definitions.MonsterType.Architect))
        this.displayAll()
        this.display.drawHeader()
        
        this.engine.unlock()
    }
    
    updateAllPathmaps() {
        let level = this.getCurrentLevel()
        
        let to_path_walk = Brew.Path.createGenericMapToPlayer(this, level, Brew.Enums.LevelNavigationType.Walk, true)
        this.pathmaps.updateCache(Brew.Enums.PathmapCacheType.ToPlayer_Walk, to_path_walk)
        this.pathmaps.updateCache(Brew.Enums.PathmapCacheType.FromPlayer_Walk, Brew.Path.createMapFromPlayer(this, level, to_path_walk, true))

        // update flight maps if we need to
        // let has_flyers : boolean = level.monsters.getAllThings().some((mob: Brew.GridThings.Monster) => {
        //     return mob.hasFlag(Brew.Enums.Flag.Flying)
        // })
        // changing this to always true in case targeters need to use it to shoot over chasms
        let needs_flying_map = true
        if (needs_flying_map) {
            let to_path_fly = Brew.Path.createGenericMapToPlayer(this, level, Brew.Enums.LevelNavigationType.Fly, true)
            this.pathmaps.updateCache(Brew.Enums.PathmapCacheType.ToPlayer_Fly, to_path_fly)
            this.pathmaps.updateCache(Brew.Enums.PathmapCacheType.FromPlayer_Fly, Brew.Path.createMapFromPlayer(this, level, to_path_fly, true))
        }

    }

    addActorToScheduler(mob: Brew.GridThings.Monster) {
        this.scheduler.add(mob, true)
    }

    removeActorFromScheduler(mob: Brew.GridThings.Monster) {
        this.scheduler.remove(mob)
    }

    inputFunctionWrapper(data, envelope) {
        if (this.block_input == true) {
            // console.warn("input blocked")
            ;
        } else {
            this.input_fn(this, data, envelope)
        }
    }
    
    eventFunctionWrapper(data: Brew.Enums.IBrewEvent, envelope) {
        if (data.eventType != Brew.Enums.BrewEventType.Error) {
            this.block_input = true
        }

        this.event_fn(this, data, envelope)
    }
    
    handleDisplay(data, envelope: IEnvelope<any>) {
        if (!(data)) {
            // console.warn("passed null display data", data)
            return
        }

        if (envelope.topic == "display.all") {
            this.display.drawAll(data)
        } else if (envelope.topic == "display.at") {
            this.display.drawAt(data)
        } else if (envelope.topic == "display.list") {
            for (let i = 0; i < data.length; i++) {
                this.display.drawAt(data[i])
            }
        } else {
            console.error("invalid display data", data)
        }
    }
    
    handleEventEnd(data: Brew.Enums.IBrewEvent, envelope) {

        this.lastEventIncludeErrors = data // keep track of last events including errors 
        if (data.eventType != Brew.Enums.BrewEventType.Error) {
            this.lastEvent = data // keep track of the last non-error event
        }
        
        if (this.event_queue.length > 0) {
            
            let nextEvent = this.event_queue.pop()
            
            // propogate EndsTurn if this event is supposed to end the turn
            if (data.endsTurn == true) {
                // swap/propogate true endsTurn
                data.endsTurn = false
                nextEvent.endsTurn = true
                
            } 
            
            this.channel_event.publish("event.start", nextEvent)

        } else {
            if (data.endsTurn) {
                // console.log("event end: turn end")
                this.channel_turn.publish("turn.end", {actor: data.actor})

            } else {
                // if it doesn't end turn, allow the player to put in input again
                if (data.actor.isType(Brew.Definitions.MonsterType.Hero)) {
                    // console.log("input blocking OFF")
                    this.block_input = false
                }
            }
        }
    }
    
    initEventListener(div_container: HTMLDivElement) {
        // add event listeners to page/canvas
        div_container.ownerDocument.addEventListener("keydown", (e) => {
            
            if (Brew.KeyMap.MovementKeys.concat(Brew.KeyMap.Action).indexOf(e.keyCode) > -1) {
                e.preventDefault()    
            }
            
            this.channel_input.publish("input.keyboard", {
                source: Brew.Enums.BrewInputSource.Keyboard,
                code: e.keyCode, 
                jsevent: e
            })
        })
        
        div_container.addEventListener("mousedown", (e) => {
            this.channel_input.publish("input.mouse", {
                source: Brew.Enums.BrewInputSource.Mouse,
                button: e.button,
                jsevent: e
            })
        })
        
        div_container.addEventListener("mousemove", (e) => {
            this.channel_input.publish("input.mouse", {
                source: Brew.Enums.BrewInputSource.Mouse,
                button: e.button,
                jsevent: e
            })
        })

    }
    
    getPlayer() : Brew.GridThings.Monster { 
        return this.player
    }

    getArchitect() : Brew.GridThings.Monster {
        return this.architect
    }

    getCurrentLevel() : Brew.Level {
        return this.current_level
    }
    
    setPlayer(new_player: Brew.GridThings.Monster) : void {
        this.player = new_player
    }
    
    setCurrentLevel(new_level: any) : void {
        this.current_level = new_level
    }
    
    // postal feed handlers
    handleTurnEnd(data: Brew.Enums.IBrewTurnData, envelope: IEnvelope<any>)  {
        let mob = data.actor
        // console.log(`END TURN: ${mob.name}`)
        // this.postturn_fn(this, mob)

        if (mob.isType(Brew.Definitions.MonsterType.Hero)) {
            // console.log("input blocking OFF")
            this.postplayer_fn(this, mob)
        }
        
        this.engine.unlock()
    }
    
    handleTurnStart(data: Brew.Enums.IBrewTurnData, envelope: IEnvelope<any>) {
        let mob = data.actor
        // console.log(`START TURN: ${mob.name}`)

        this.current_turn_actor = mob 
        
        this.engine.lock()
        this.checkTimersForActor(mob)
        // Movement.checkForAmbientEffects(this, mob)

        if (mob.isType(Brew.Definitions.MonsterType.Hero)) {//todo: change this to isPlayer
            // console.log("input blocking OFF")
            this.preplayer_fn(this, mob)
            this.block_input = false
            
        } else {
            let ai_event : Brew.Enums.IBrewEvent
            ai_event = this.ai_fn(this, mob)
            this.channel_event.publish("event.start", ai_event)
        }
    }
    
    //endEvent(data: Brew.Enums.IBrewEvent, nextEventData? : Brew.Enums.IBrewEvent) {
    endEvent(data: Brew.Enums.IBrewEvent) {
        this.channel_event.publish("event.end", data)
        //twp: need to handle inserted events first
        // if (nextEventData) {
        //     this.channel_event.publish("event.start", nextEventData)
        // }
    }

    insertEvent_Next(inserted_event : Brew.Enums.IBrewEvent) : boolean {
        // inserts event after the next upcoming event (2nd from the end)

        this.event_queue.splice(-2, 0, inserted_event)

        return true
    }

    insertEvent(inserted_event : Brew.Enums.IBrewEvent) : boolean {
        // insert into a waiting queue to trigger before we go back to the pipeline
        this.event_queue.unshift(inserted_event)
        return true
    }

    clearEventQueue() {
        this.event_queue = []
    }
    
    getLastEvent(includeErrors: boolean = false) {
        if (includeErrors) {
            return this.lastEventIncludeErrors
        } else {
            return this.lastEvent
        }
    }
    
    copyEventDataFromLastEvent(modified_event: Brew.Enums.IBrewEvent) {
        let lastEvent = this.getLastEvent()
        let ignoreList = ["actor", "playerInitiated", "endsTurn", "eventType"]
        for (let key in lastEvent) {
            if (lastEvent.hasOwnProperty(key)) {
                if (ignoreList.indexOf(key) == -1) { // not on the ignore list
                    var element = lastEvent[key]
                    modified_event[key] = element
                }
            }
        }
    }

    // display shortcuts
    displayAt(xy: Brew.Coordinate) : void {
        if (!(xy)) {
            console.warn("passed in null xy coords to displayAt", xy)
        }
        this.channel_display.publish("display.at", xy)
    }
    
    displayAll(display_options : Brew.Enums.IDisplayOptions = {}) : void {
        this.channel_display.publish("display.all", display_options)
    }
    
    displayList(xy_list: Array<Brew.Coordinate>) : void {
        this.channel_display.publish("display.list", xy_list)
    }

    // turn Brew.Timers
    checkTimersForActor(actor: Brew.GridThings.Thing) {
        let timer_list = this.timer_monitor.getAllTimersTriggeredFor(actor, this.turn_count)
        if (timer_list.length > 0) {
            for (let timer of timer_list) {
                actor.removeFlag(timer.flag)
                this.displayAt(actor.location)
                this.timer_monitor.removeTimer(timer.actor, timer.flag)//todo: need centralized way of doing Brew.Timers
            }
        }
    }
    
}

function buildPlayer(gm : GameMaster, player_name : string = "Hero") : Brew.GridThings.Monster {

    let player = Brew.Definitions.monsterFactory(gm, Brew.Definitions.MonsterType.Hero)

    player.name = player_name
    // player.code = Symbols.smiley_face
    player.inventory = new Brew.Inventory(Brew.Config.max_items)
    player.power_suite = new Brew.Powers.PowerSuite(Brew.Config.max_powers)
    player.team = Brew.Enums.Team.Player

    player.setFacing(Brew.Directions.DOWN.clone())
    player.building_type = Brew.Enums.ComponentPartsBuildingType.Tank
    let turretPower = Brew.Powers.createBasicPowerOfType(Brew.Enums.BrewPowerType.TurretCannon)
    turretPower.facing_direction = Brew.Directions.DOWN.clone()
    turretPower.firing_arc = Brew.Enums.FiringArc.QuarterArc
    turretPower.charge_stat.setTo(8)
    
    let machineGun = Brew.Powers.createBasicPowerOfType(Brew.Enums.BrewPowerType.MachineGun)
    machineGun.charge_stat.setTo(16)
    
    player.power_suite.addPower(turretPower)
    player.power_suite.addPower(machineGun)

    // for (let i = 0; i < 8; i++) {
    //     player.inventory.addItem(Brew.Definitions.itemFactory(Brew.Definitions.ItemType.Supplies))
    // }
    return player
}
