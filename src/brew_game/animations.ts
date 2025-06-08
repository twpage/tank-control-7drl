import * as Brew from "../brew"

export function runAnimationEvent(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) { 
    // console.log("running animation ", brEvent.animationData.animationType)
    if (brEvent.animationData.animationType == Brew.Enums.BrewAnimationType.Flash) {
        runAnimation_Flash(gm, brEvent)
    } else if (brEvent.animationData.animationType == Brew.Enums.BrewAnimationType.OverPath) {
        runAnimation_OverPath(gm, brEvent)
    } else if (brEvent.animationData.animationType == Brew.Enums.BrewAnimationType.CircleOut) {
        runAnimation_Circle(gm, false, brEvent)
    } else if (brEvent.animationData.animationType == Brew.Enums.BrewAnimationType.CircleIn) {
        runAnimation_Circle(gm, true, brEvent)

    } else {
        console.error(`unknown animation type ${brEvent.animationData.animationType}`)
    }

}

export function runAnimation_OverPath(gm: Brew.GameMaster, brEvent: Brew.Enums.IBrewEvent) {
    let path : Array<Brew.Coordinate>

    if (brEvent.animationData.path) {
        path = brEvent.animationData.path
        // path.splice(path.length-1,1)
    } else if ((brEvent.animationData.from_xy) && (brEvent.animationData.to_xy)) {
        let to_xy : Brew.Coordinate = brEvent.animationData.to_xy
        let from_xy : Brew.Coordinate = brEvent.animationData.from_xy
        path = Brew.Utils.getLineBetweenPoints(from_xy, to_xy)
        // path.splice(0, 1)
    } else {
        console.log("can't run animation over path without path or to/from xy")
        gm.endEvent(brEvent)
    }

    if (path.length <= 1) {
        console.warn("skipping path animation with path <= 1")
        gm.endEvent(brEvent)
        return
    }
    // if (path.length == 0) {
    //     console.warn("tried running animation OverPath event without a path")
    //     gm.endEvent(brEvent)
    // }
    let level = gm.getCurrentLevel()
    
    path.forEach((xy: Brew.Coordinate, index, array) => {
        setTimeout(() => {
            if (index == path.length - 1) {
                level.above.removeAt(path[index-1])
                gm.displayAt(path[index-1])
                gm.endEvent(brEvent)

            } else {
                if (index > 0) {
                    // remove old one
                    level.above.removeAt(path[index-1])
                    gm.displayAt(path[index-1])
                } 
                level.above.removeAt(xy)
                level.above.setAt(xy, Brew.Definitions.aboveFactory(Brew.Definitions.AboveType.Projectile, {code: brEvent.animationData.code, color: brEvent.animationData.color}))
                gm.displayAt(xy)
            }
        },
        (index * Brew.Config.animation_speed)
        )
    })
}

export function runAnimation_Flash(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
    let to_xy : Brew.Coordinate = data.animationData.to_xy
    
    let level = gm.getCurrentLevel()
    let hasExisting = level.above.hasAt(to_xy)
    let existing_above : Brew.GridThings.Above
    let flash_color = data.animationData.color

    // show flash immediately
    if (hasExisting) {
        existing_above = level.above.getAt(to_xy)
        level.above.removeAt(to_xy)
    }

    level.above.setAt(to_xy, Brew.Definitions.aboveFactory(Brew.Definitions.AboveType.Flash, {color: flash_color } ))
    gm.displayAt(to_xy)

    // wait a bit then replace everything and end the event
    setTimeout(() => {
        level.above.removeAt(to_xy)
        if (hasExisting) {
            level.above.setAt(to_xy, existing_above)
        }
        gm.displayAt(to_xy)
        gm.endEvent(data)
    },
    (1 * Brew.Config.animation_speed)
    )
}

export function runAnimation_Circle(gm: Brew.GameMaster, reverse: boolean, data: Brew.Enums.IBrewEvent) {
    let level = gm.getCurrentLevel()
    let xy_lst : Brew.Coordinate[]
    
    //center_xy: Brew.Coordinate, radius: number, flash_color : number[], 
    let center_xy = data.animationData.to_xy
    let radius = data.animationData.range
    let flash_color = data.animationData.color
    if (reverse) { 
        radius += 1
    }
    let range_lst = [...Array(radius+1).keys()] // [0, 1, 2]
    if (reverse) {
        // range_lst = range_lst.sort((a, b) => { return range_lst[a] - range_lst[b] })
        range_lst = range_lst.reverse()
    }
    // console.log(range_lst)

    range_lst.forEach((r, index) => {
        setTimeout(() => {
            // console.log("triggered r = ", r)
            if (index > 0) {
                // clear previous circle
                xy_lst = Brew.Utils.getCirclePoints(center_xy, r)
                // xy_lst.forEach((xy, index, array) => {
                    xy_lst.forEach((xy, r, array) => {
                    level.above.removeAt(xy)
                })
                gm.displayList(xy_lst)
            }

            if (index < range_lst.length - 1) {
                
                // draw new circle
                let last_r = reverse ? (r - 1) : (r + 1)
                
                xy_lst = Brew.Utils.getCirclePoints(center_xy, last_r)
                // xy_lst.forEach((xy, index, array) => {
                    xy_lst.forEach((xy) => {
                    if (level.isValid(xy)) {
                        level.above.removeAt(xy)
                        level.above.setAt(xy, Brew.Definitions.aboveFactory(Brew.Definitions.AboveType.Flash, { color: flash_color }))
                    }
                })
                gm.displayList(xy_lst)
            }

            if (index == range_lst.length - 1) {
                gm.endEvent(data)
            }
        },
        (index * Brew.Config.animation_speed)
        )
    })
}

// export function animateRocketPunch(gm: Brew.GameMaster, data: Brew.Enums.IBrewEvent) {
//     let from_xy = data.targetingData.from_xy
//     let to_xy = data.targetingData.to_xy

//     let path = Utils.getLineBetweenPoints(from_xy, to_xy)
//     path.splice(0, 1)
//     let level = gm.getCurrentLevel()
    
//     path.forEach((xy: Brew.Coordinate, index, array) => {
//         setTimeout(() => {
//             if (index == path.length - 1) {
//                 level.above.removeAt(path[index-1])
//                 // todo: need a way to block or knock items already there
//                 // level.items.removeAt(path[index])
//                 // level.items.setAt(path[index], item)

//                 gm.displayAt(path[index-1])
//                 // gm.displayAt(path[index])
//                 gm.endEvent(data)

//             } else {
//                 if (index > 0) {
//                     // remove old one
//                     level.above.removeAt(path[index-1])
//                     gm.displayAt(path[index-1])
//                 } 
//                 level.above.removeAt(xy)
//                 level.above.setAt(xy, Brew.Definitions.aboveFactory(Brew.Definitions.AboveType.Flash, {code: '@', color: Brew.Color.red} ))
//                 gm.displayAt(xy)
//             }
//         },
//         (index * Brew.Config.animation_speed)
//         )
//     })
// }

export function createCircleAnimationEvent(predecessorEvent: Brew.Enums.IBrewEvent, circle_color: number[], radius: number) : Brew.Enums.IBrewEvent {
    return createCircleAnimation_Helper(predecessorEvent, false, circle_color, radius)
}

export function createReverseCircleAnimationEvent(predecessorEvent: Brew.Enums.IBrewEvent, circle_color: number[], radius: number) : Brew.Enums.IBrewEvent {
    return createCircleAnimation_Helper(predecessorEvent, true, circle_color, radius)
}

function createCircleAnimation_Helper(predecessorEvent: Brew.Enums.IBrewEvent, reversed: boolean, circle_color: number[], radius: number) : Brew.Enums.IBrewEvent {
    let circleType : Brew.Enums.BrewAnimationType

    if (reversed) {
        circleType = Brew.Enums.BrewAnimationType.CircleIn
    } else {
        circleType = Brew.Enums.BrewAnimationType.CircleOut
    }

    let animationEvent : Brew.Enums.IBrewEvent = {
        eventType: Brew.Enums.BrewEventType.RunAnimation,
        actor: predecessorEvent.actor,
        playerInitiated: predecessorEvent.playerInitiated,
        endsTurn: false,
        animationData: {
            animationType: circleType,
            range: radius,
            color: circle_color,
            to_xy: predecessorEvent.actor.location.clone(),
            from_xy: predecessorEvent.actor.location.clone()
        }
    }
    return animationEvent
}
