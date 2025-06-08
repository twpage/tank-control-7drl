import * as Brew from "../brew"

export class Stat {
    private current_amount : number
    private max_amount : number

    constructor(private statName : Brew.Enums.StatName, amount: number) {
        this.current_amount = amount
        this.max_amount = amount
    }

    setCurrentLevel(amount: number) {
        this.current_amount = amount
    }

    setMaxLevel(amount: number) {
        this.max_amount = amount
    }

    setTo(amount: number) {
        this.current_amount = amount
        this.max_amount = amount
    } 

    getCurrentLevel() { return this.current_amount }
    getMaxLevel() { return this.max_amount }
    
    resetToMax() {
        this.current_amount = this.max_amount
    }

    isMaxed() : boolean {
        return this.current_amount == this.max_amount
    }

    isEmpty() : boolean {
        return this.current_amount == 0
    }

    increment(amount: number, overrideMax : boolean = false)  {
        if (overrideMax) {
            this.current_amount += amount
        } else {
            this.current_amount = Math.min(this.max_amount, this.current_amount + amount)
        }
    }

    decrement(amount: number) {
        this.current_amount = Math.max(0, this.current_amount - amount)
    }

    getType() : Brew.Enums.StatName {
        return this.statName
    }
}   
