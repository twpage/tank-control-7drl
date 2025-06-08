import * as Brew from "../brew"

interface IInventoryItemCatalog {
    [invkey: string]: IInventoryItem
}

interface IInventoryItem  {
    item: Brew.GridThings.Item
    num_stacked: number
}

let default_inv_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

export class Inventory {
    private items: IInventoryItemCatalog = {}
    num_items: number
    max_items: number
    inv_keys: string[]
    // assign_key_fn: () => string
            
    constructor(max_items: number, inv_keys: string[] = default_inv_keys) {
        // this.items = {}
        this.num_items = 0
        this.max_items = max_items
        this.inv_keys = inv_keys
        
        if (inv_keys.length < max_items) {
            throw new Error("Not enough inventory keys given for maximum number of items")
        }
    }
    
    hasCapacity() : boolean {
        return this.num_items < this.max_items
    }
    
    addItem(an_item: Brew.GridThings.Item) : boolean {
        // returns false if inv is full
        if (this.num_items == this.max_items) {
            return false
        }
        
        let invkey = this.assignInventoryKey(an_item)
        this.items[invkey] = {
            item: an_item,
            num_stacked: 1
        }
        this.num_items += 1
        return true
    }
    
    assignInventoryKey(an_item: Brew.GridThings.Item) : string {
        for (let key_value of this.inv_keys) {
            // console.log(key_value, (!(key_value in this.items)))
            if (!(key_value in this.items)) {
                return key_value
            }
        }
        
        throw new Error("Ran out of free inventory keys")
    }
    
    getItemByKey(inv_key: string) : Brew.GridThings.Item {
        if (!(inv_key in this.items)) {
            throw new Error(`No item linked to inventory key: ${inv_key}`)
        }
        
        return this.items[inv_key].item
    }
    
    getInventoryItemByKey(inv_key: string) : IInventoryItem {
        if (!(inv_key in this.items)) {
            throw new Error(`No item linked to inventory key: ${inv_key}`)
        }
        
        return this.items[inv_key]
    }
    
    removeItemByKey(inv_key: string) : void {
        if (!(inv_key in this.items)) {
            throw new Error(`No item linked to inventory key: ${inv_key}`)
        }
        
        delete this.items[inv_key]
        this.num_items -= 1
    }
    
    getItems() : Array<Brew.GridThings.Item> {
        let results : Array<Brew.GridThings.Item> = []
        
        for (let invkey in this.items) {
                results.push(this.items[invkey].item)
        }
        
        return results
    }
    
    getKeys() : Array<string> {
        let results : Array<string> = []
        
        for (let invkey in this.items) {
            results.push(invkey)
        }
        
        return results
    }

    findKeyForItemOfType(given_type : Brew.Definitions.ItemType) : string {
        let found_invkey = null
        for (let invkey in this.items) {
            let it = this.getItemByKey(invkey)
            if (it.isType(given_type)) {
                found_invkey = invkey
                break
            }
        }

        return found_invkey
    }
    
    
}

