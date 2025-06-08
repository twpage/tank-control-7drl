import * as Brew from "../brew"

interface ThingInterface {
    location: Brew.Coordinate
    code: string
}

export class GridOfThings<T> {

    // things: Dict<ThingInterface> = {}
    things: Brew.Utils.Dict<T> = {}
    
    clearAll () {
        this.things = {}
    }
    
    clone() : GridOfThings<T> {
        let new_GoT = new GridOfThings<T>()
        new_GoT.things = {...this.things}
        return new_GoT
    }
    
    hasAt (xy: Brew.Coordinate) : boolean {
        var key = Brew.Utils.xyToKey(xy)
        
        if (key in this.things) {
            return true
        } else { 
            return false
        }
    }
    
    getAt (xy: Brew.Coordinate) : T {
        if (this.hasAt(xy)) {
            var key = Brew.Utils.xyToKey(xy)
            return this.things[key]
        } else {
            return null
        }
    }
    
    // setAt (xy: Brew.Coordinate, something: Thing) : boolean {
    setAt (xy: Brew.Coordinate, something: T) : boolean {
        if (this.hasAt(xy)) {
            return false
        } else {
            var key = Brew.Utils.xyToKey(xy)
            this.things[key] = something
            
            // if its a Thing, set its location on the object as well 
            if (something instanceof Brew.GridThings.Thing) {
                (something as any).location = xy
            } 

            // something["location"] = xy

            return true
        }
    }
    
    removeAt (xy: Brew.Coordinate) : boolean {
        // returns true if we removed something, false if not
        if (this.hasAt(xy)) {
            var key = Brew.Utils.xyToKey(xy)
            delete this.things[key]
            return true
        } else {
            return false
        }
    }
    
    getAllCoordinates() : Array<Brew.Coordinate> {
        let xy: Brew.Coordinate
        let numberkey : number
        let coords : Array<Brew.Coordinate> = []
        
        for (let key in this.things) {
            numberkey = parseInt(key)
            xy = Brew.Utils.keyToXY(numberkey)
            coords.push(xy)
        }
        
        return coords
    }
    
    getAllThings() : Array<T> {
        let values : Array<T> = []
        for (let key in this.things) {
            values.push(this.things[key])
        }
        
        return values
    }
}


