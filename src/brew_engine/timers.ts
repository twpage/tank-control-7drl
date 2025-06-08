import * as Brew from "../brew"

// interface ITimerID {
//     monster_id: number,
//     flag : Brew.Enums.Flag
// }

export class TurnTimer {
    private trigger_turn: number
    extensions_count : number
    constructor(public actor: Brew.GridThings.Thing, public flag: Brew.Enums.Flag, public start_turn: number, public duration: number) {
        this.trigger_turn = start_turn + duration
        this.extensions_count = 0
    }

    checkTrigger(current_turn: number) {
        return current_turn >= this.trigger_turn
    }

    getKey() : string {
        return makeTurnTimerKey(this.actor, this.flag)
    }

    extendDuration(extra_turns:number) {
        this.duration += extra_turns
        this.trigger_turn += extra_turns
        this.extensions_count += 1
    }

    getTurnsRemaining(current_turn: number) : number {
        return (this.trigger_turn - current_turn)
    }
}

function makeTurnTimerKey(actor: Brew.GridThings.Thing, flag: Brew.Enums.Flag) : string {
    return actor.getID().toString() + '_' + Brew.Enums.Flag[flag]
}

export class TimerMonitor {
    dictionaryOfTimers : { [key: string] : TurnTimer }

    constructor() {
        this.dictionaryOfTimers = {}
    }

    hasTimer(actor: Brew.GridThings.Thing, flag: Brew.Enums.Flag) : boolean {
        let key = makeTurnTimerKey(actor, flag)
        return (key in this.dictionaryOfTimers)
    }

    getTimer(actor: Brew.GridThings.Thing, flag: Brew.Enums.Flag) : TurnTimer {
        if (this.hasTimer(actor, flag)) {
            let key = makeTurnTimerKey(actor, flag)
            return this.dictionaryOfTimers[key]

        } else {
            return null
        }
    }

    removeTimer(actor: Brew.GridThings.Thing, flag: Brew.Enums.Flag) : boolean {
        if (this.hasTimer(actor, flag)) {
            let key = makeTurnTimerKey(actor, flag)
            delete this.dictionaryOfTimers[key]
            return true
        } else {
            return false
        }

    }

    setFlagWithTimer(gm: Brew.GameMaster, actor: Brew.GridThings.Thing, flag: Brew.Enums.Flag, turn_duration: number) {
        let new_timer = new TurnTimer(actor, flag, gm.turn_count, turn_duration)
        actor.setFlag(flag)
        this.addTimer(new_timer)
    }
    
    addTimer(new_timer : TurnTimer) {
        // if has an existing timer, extend it instead
        if (this.hasTimer(new_timer.actor, new_timer.flag)) {
            // this.removeTimer(new_timer.actor, new_timer.flag)
            let existing_timer = this.getTimer(new_timer.actor, new_timer.flag)
            existing_timer.extendDuration(new_timer.duration)
        } else {
            let key = makeTurnTimerKey(new_timer.actor, new_timer.flag)
            this.dictionaryOfTimers[key] = new_timer
        }
    }

    getAllTimers() : Array<TurnTimer> {
        let all_timers : Array<TurnTimer> = []
        for (var key in this.dictionaryOfTimers) {
            if (this.dictionaryOfTimers.hasOwnProperty(key)) {
                var element = this.dictionaryOfTimers[key];
                all_timers.push(element)
            }
        }

        return all_timers
        // return (let tt of this.dictionaryOfTimers)
    }

    getAllTimersTriggeredFor(actor: Brew.GridThings.Thing, current_turn: number) {
        let all_timers = this.getAllTimers()
        let their_timers = all_timers.filter((timer: TurnTimer, index: number, array) => {
            return (timer.actor.isSameThing(actor) && (timer.checkTrigger(current_turn)))
        })
        return their_timers
    }

    getAllTimersFor(actor: Brew.GridThings.Thing) {
        let all_timers = this.getAllTimers()
        let their_timers = all_timers.filter((timer: TurnTimer, index: number, array) => {
            return timer.actor.isSameThing(actor)
        })
        return their_timers
    }

}
