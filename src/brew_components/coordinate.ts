// coordinates & direction constants

import * as Brew from "../brew"

export class Coordinate {
    public x: number
    public y: number
    
    constructor (xx: number, yy: number) {
        this.x = xx
        this.y = yy
    }
    
    toString () {
        return `(${this.x}, ${this.y})`
    }
    
    clone () : Coordinate {
        return new Coordinate(this.x, this.y)
    }
    
    compare(other_xy: Coordinate) : boolean {
        return (this.x == other_xy.x) && (this.y == other_xy.y)
    }
    
    add (other_xy: Coordinate) : Coordinate {
        let xy = new Coordinate(this.x + other_xy.x, this.y + other_xy.y)
        return xy
    }
    
    subtract (other_xy: Coordinate) : Coordinate {
        let xy = new Coordinate(this.x - other_xy.x, this.y - other_xy.y)
        return xy
    }
    
    multiplyScalar (scalar_amount : number) : Coordinate {
        let xy = new Coordinate(this.x * scalar_amount, this.y * scalar_amount)
        return xy
    }

    toUnit () : Coordinate {
        let x_sign : number = (this.x == 0) ? 0 : (Math.abs(this.x) / this.x)
        let y_sign : number = (this.y == 0) ? 0 : (Math.abs(this.y) / this.y)
        let xy = new Coordinate(x_sign, y_sign)
        return xy
    }
    
    getAdjacent() : Array<Coordinate> {
        return [
            this.add(Brew.Directions.UP),
            this.add(Brew.Directions.DOWN),
            this.add(Brew.Directions.LEFT),
            this.add(Brew.Directions.RIGHT)
        ]
    }

    getDiagonals() : Array<Coordinate> {
        return [
            this.add(Brew.Directions.UP_LEFT),
            this.add(Brew.Directions.UP_RIGHT),
            this.add(Brew.Directions.DOWN_LEFT),
            this.add(Brew.Directions.DOWN_RIGHT)
        ]
    }

    getSurrounding() : Array<Coordinate> {
        return [
            this.add(Brew.Directions.UP),
            this.add(Brew.Directions.DOWN),
            this.add(Brew.Directions.LEFT),
            this.add(Brew.Directions.RIGHT),
            this.add(Brew.Directions.DOWN_LEFT),
            this.add(Brew.Directions.DOWN_RIGHT),
            this.add(Brew.Directions.UP_LEFT),
            this.add(Brew.Directions.UP_RIGHT),
        ]
    }

}

export class CoordinateArea {
    private list_of_coords: Array<Coordinate>
    constructor(given_xy_list: Array<Coordinate> = []) {
        this.list_of_coords = []
        this.addCoordinates(given_xy_list)
    }

    getCoordinates(): Array<Coordinate> {
        return this.list_of_coords
    }

    addCoordinate(add_xy: Coordinate) : boolean {
        // returns true if a new coord, false if already exists in the list
        if (this.hasCoordinate(add_xy)) {
            return false
        } else {
            this.list_of_coords.push(add_xy.clone())
            return true
        }
    }

    addCoordinates(xy_list: Array<Coordinate>) : boolean {
        let results = xy_list.map((xy) : boolean => {
            return this.addCoordinate(xy)
        })

        return results.every((was_new) : boolean => { return was_new })
    }

    findCoordinate(find_xy: Coordinate): number {
        return this.list_of_coords.findIndex((xy) : boolean => {
            return xy.compare(find_xy)
        })
    }

    hasCoordinate(has_xy: Coordinate) : boolean {
        return this.findCoordinate(has_xy) > -1
    }

    removeCoordinate(del_xy: Coordinate) : boolean {
        let idx = this.findCoordinate(del_xy)
        if (idx > -1) {
            this.list_of_coords.splice(idx, 1)
            return true
        } else {
            return false
        }
    }

    getUnion(other_area: CoordinateArea) : CoordinateArea {
        // return elements of A + B
        let combined_area = new CoordinateArea(this.list_of_coords)
        other_area.getCoordinates().forEach((xy) => {
            combined_area.addCoordinate(xy)
        })

        return combined_area
    }

    getDiff(other_area: CoordinateArea) : CoordinateArea {
        // return elements of A not in B
        let diff_area = new CoordinateArea()
        this.getCoordinates().forEach((xy) => {
            if (!(other_area.hasCoordinate(xy))) {
                diff_area.addCoordinate(xy)
            }
        })
        return diff_area
    }

    getSymmetricDiff(other_area: CoordinateArea) : CoordinateArea {
        // return elements of A not in B and B not in A
        
        let diff_a = this.getDiff(other_area)
        let diff_b = other_area.getDiff(this)
        return diff_a.getUnion(diff_b)
    }

    getCoordinatesExcept(exception_xy_list: Array<Coordinate>) : Array<Coordinate> {
        let other_area = new CoordinateArea(exception_xy_list)
        return this.getDiff(other_area).getCoordinates()
    }

    filter(filter_fn: ICoordinateAreaFilter) : CoordinateArea {
        return new CoordinateArea(this.list_of_coords.filter(filter_fn))
    }
}

interface ICoordinateAreaFilter {
    (xy: Coordinate): boolean
}