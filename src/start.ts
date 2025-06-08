import * as postal from 'postal'
import * as Brew from "./brew"

var gm : Brew.GameMaster

var BREW_FIRST_STARTUP : boolean = true
// var BREW_START_SEED : number = null

export function startGame(given_seed: number = 202) {

    postal.reset()
    let divGame = <HTMLDivElement> (document.getElementById("id_div_game"))
    
    // given_seed = 168
    // unconnected seed with broken pathmaps = 4258
    gm = new Brew.GameMaster(
        given_seed,
        divGame,
        Brew.Input.handleAllInput, // input
        Brew.Events.mainEventhandler,// event
        Brew.Intel.mainAiHandler, // ai
        Brew.Intel.runBeforePlayerTurn, // pre-player
        Brew.Intel.runAfterPlayerTurn, // post-player,
    )
    
    if (BREW_FIRST_STARTUP) {
        gm.initEventListener(divGame)
    }

    BREW_FIRST_STARTUP = false
    test_sandbox()
}

function test_sandbox() {
    // let a_set = new Brew.CoordinateArea()
    // a_set.addCoordinate(new Brew.Coordinate(2, 2))
    // a_set.addCoordinates(new Brew.Coordinate(2, 2).getAdjacent())
    // console.log("A", a_set.getCoordinates())

    // console.log("A except 0,0", a_set.getCoordinatesExcept([new Brew.Coordinate(0, 0)]))

    // let b_set = new Brew.CoordinateArea()
    // b_set.addCoordinates([new Brew.Coordinate(2, 2), new Brew.Coordinate(3, 2), new Brew.Coordinate(1, 2), new Brew.Coordinate(5, 5)])
    // debugger
    // console.log("B", b_set)
    // console.log("A+B union", b_set.getUnion(a_set))
    // console.log("A diff B", a_set.getDiff(b_set))
    // console.log("B diff A", b_set.getDiff(a_set))
    // console.log("A B symm diff", a_set.getSymmetricDiff(b_set))

}

// window.onload = startGame

// window.onload = function (event) {
//   someFunction(someArg, someOtherArg)
// }

// http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
function getParameterByName(name: string) {
    var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var gseed = getParameterByName("seed")
var use_boss_mode = Boolean(getParameterByName("boss"))

if (use_boss_mode) {
    Brew.Debug.toggleBossMode(true)

    
    let background_img_src = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png'
    let param_img = getParameterByName("img")

    if (param_img) {
        background_img_src = param_img
    }
    let imgBackground = <HTMLImageElement>(document.getElementById("id_img_backgroundcover"))
    imgBackground.src = background_img_src

}


startGame(Number(gseed))
