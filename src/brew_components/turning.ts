import * as Brew from '../brew'
import { Coordinate } from '../brew_components/coordinate'

export function getAngleBetween(coord_from: Coordinate, coord_to: Coordinate): number {
    let theta_from = Brew.Utils.xyToPolar(coord_from).angle_theta
    let theta_to = Brew.Utils.xyToPolar(coord_to).angle_theta
    let raw_diff = theta_to - theta_from
    // =IF(G6<-PI(),-1*(G6+PI()),IF(G6>PI(),-1*(G6-PI()),G6))
    let pi = Math.PI
    let neg_pi = -1 * pi

    let diff : number
    if (raw_diff < neg_pi) {
        diff = -1 * (raw_diff + pi)
    } else if (raw_diff > pi) {
        diff = -1 * (raw_diff + neg_pi)
    } else {
        diff = raw_diff
    }
    return diff
}