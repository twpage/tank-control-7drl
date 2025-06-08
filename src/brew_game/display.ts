import * as ROT from 'rot-js'
import * as Brew from '../brew'
import { HUD } from '../brew';
import { IColor } from '../brew_components/color'
import { ICharAndColor } from "../brew_engine/enums"

class ROTDisplay2 extends ROT.Display {
    private my_context : CanvasRenderingContext2D  = null

    getWidth() : number {
        return Number(this.getContainer().attributes.getNamedItem("width").value)
    }

    getHeight() : number {
        return Number(this.getContainer().attributes.getNamedItem("height").value)
    }

    getTileWidth() : number {
        return this.getWidth() / Brew.Config.screen_width_tiles
    }

    getTileHeight() : number {
        return this.getHeight() / Brew.Config.screen_height_tiles
    }

    clearRect(x: number, y: number, width: number, height: number) {
        // this._context = <HTMLElement>(this.getContainer())
        // this._context = this.getContainer().firstChild(
        if (!(this.my_context)) {
            // let canvas = <HTMLCanvasElement>this.getContainer()
            // this.my_context = canvas.getContext("2d")
            this.my_context = (<HTMLCanvasElement>this.getContainer()).getContext("2d")
        }
        
        
        this.my_context.clearRect(x * width, y * height, width, height)
    }

    clearRect_Tiles(x: number, y: number, width_in_tiles: number, height_in_tiles: number) {
        if (!(this.my_context)) {
            this.my_context = (<HTMLCanvasElement>this.getContainer()).getContext("2d")
        }
        let tile_width = this.getTileWidth()
        let tile_height = this.getTileHeight()        
        
        this.my_context.clearRect(x * tile_width, y * tile_height, width_in_tiles * tile_width, height_in_tiles * tile_height)        
    }
}

export class Display {
    // private rot_displays: { [name: string]: ROTDisplay2 }
    private rot_displays: { [name: string]: ROTDisplay2 }
    private gm: Brew.GameMaster
    public highlights : Brew.GridOfThings<Brew.GridThings.Terrain>
    
    private my_tile_width : number 
    private my_tile_height : number
    
    
    constructor(gm: Brew.GameMaster, div_container : HTMLDivElement) {
        this.rot_displays = {}
        this.gm = gm
        this.highlights = new Brew.GridOfThings<Brew.GridThings.Terrain>()
        
        // setup ROTjs canvas(es)
        this.initCanvas(div_container, Brew.Config.screen_width_tiles, Brew.Config.screen_height_tiles)
        
        // this.my_tile_width = this.getDisplay(Brew.Enums.DisplayNames.Game).getContainer().width / Brew.Config.screen_width_tiles
        // this.my_tile_height = this.getDisplay(Brew.Enums.DisplayNames.Game).getContainer().height / Brew.Config.screen_height_tiles
        this.my_tile_width = Number(this.getDisplay(Brew.Enums.DisplayNames.Game).getContainer().attributes.getNamedItem("width").value) / Brew.Config.screen_width_tiles
        this.my_tile_height = Number(this.getDisplay(Brew.Enums.DisplayNames.Game).getContainer().attributes.getNamedItem("height").value) / Brew.Config.screen_height_tiles

    }
    
    initCanvas(div_container: HTMLDivElement, width: number, height: number) : void {

        // if we already have containers, destroy/recreate them when game restarts
        if (div_container.children.length > 0) {
            while (div_container.firstChild) {
                div_container.removeChild(div_container.firstChild)
            }
        }
        
        let bg_color : string
        if (Brew.Debug.BOSS_MODE) {
            bg_color = "transparent"
        } else {
            bg_color = ROT.Color.toHex(Brew.Color.charcoal)
        }
        // game - main screen
        let canvas_bg_color : number[]
        canvas_bg_color = Brew.Color.bg_unexplored
        let font_size = Brew.Config.font_size

        let gameDisplay = new ROTDisplay2({
            width: width,
            height: height,
            border: 0,
            spacing: 1.15,
            fontSize: font_size,
            bg: bg_color,
            // bg: "transparent",
            forceSquareRatio: false,
        })
        
        let game_canvas = <HTMLCanvasElement>(gameDisplay.getContainer())
        div_container.appendChild(game_canvas)
        this.addDisplay(Brew.Enums.DisplayNames.Game, gameDisplay)
        
        // hud - targeting, highlighting, etc
        let hudDisplay = new ROTDisplay2({
            width: width,
            height: height,
            border: 0,
            spacing: 1.15,
            fontSize: font_size,
            // bg:  ROT.Color.toHex(Brew.Color.blue), 
            bg: "transparent", 
            forceSquareRatio: false,
        })

        let hud_canvas = <HTMLCanvasElement>(hudDisplay.getContainer())
        div_container.appendChild(hud_canvas)        
        let top_height = hudDisplay.getTileHeight()

        hud_canvas.setAttribute("style", `position: absolute; top: ${top_height}; left: 0`)
        this.addDisplay(Brew.Enums.DisplayNames.HUD, hudDisplay)

        // BOSS MODE
        if (Brew.Debug.BOSS_MODE) {
            bg_color = ROT.Color.toHex(Brew.Color.white)// "transparent"
        } else {
            bg_color = ROT.Color.toHex(Brew.Color.charcoal)
        }

        // footer
        let footerDisplay = new ROTDisplay2({
            width: width,
            height: 3,
            border: 0,
            spacing: 1.15,
            fontSize: font_size,
            bg: bg_color,
            forceSquareRatio: false,
        })

        let footer_div = document.createElement("div")
        footer_div.setAttribute("id", "id_div_footer")
        footer_div.appendChild(footerDisplay.getContainer())
        div_container.appendChild(footer_div)
        this.addDisplay(Brew.Enums.DisplayNames.Footer, footerDisplay)

        // header
        let headerDisplay = new ROTDisplay2({
            width: width,
            height: 1,
            border: 0,
            spacing: 1.15,
            fontSize: font_size,
            bg: bg_color,
            forceSquareRatio: false,
        })

        let header_div = document.createElement("div")
        header_div.setAttribute("id", "id_div_header")
        header_div.appendChild(headerDisplay.getContainer())
        div_container.insertBefore(header_div, game_canvas)
        // div_container.appendChild(header_div)
        this.addDisplay(Brew.Enums.DisplayNames.Header, headerDisplay)

    }
    

    // Display management
    addDisplay(name: Brew.Enums.DisplayNames, disp: ROTDisplay2) : void {
        this.rot_displays[name] = disp
    }
    
    getDisplay(name: Brew.Enums.DisplayNames) : ROTDisplay2 {
        // make sure display exists
        if (!(name in this.rot_displays)) {
            throw new RangeError(`cannot find ROT display named ${name}`)
        } 
        
        return this.rot_displays[name];
    }
    
    clearAll() : void {
        for (let name in this.rot_displays) {
            let displayName = Brew.Enums.DisplayNames[name]
            this.clearDisplay(displayName)
        }
    }
    
    clearDisplay(name: Brew.Enums.DisplayNames) {
        let display = this.getDisplay(name)
        display.clearRect(0, 0, display.getWidth(), display.getHeight())
        // display.clear()
        
    }

    clearDisplayAt(name: Brew.Enums.DisplayNames, x: number, y: number) {
        let display = this.getDisplay(name)
        //twp
        display.clearRect(x, y, this.my_tile_width, this.my_tile_height)
    }
    
    // Drawing on the grid
    drawAll(display_options: Brew.Enums.IDisplayOptions) : void {
        for (let x = 0; x < Brew.Config.screen_width_tiles; x++) {
            for (let y = 0; y < Brew.Config.screen_height_tiles; y++) {
                this.drawAt(new Brew.Coordinate(x, y), display_options)
            }
        }
    }
    
    drawAt(xy: Brew.Coordinate, display_options? : Brew.Enums.IDisplayOptions) : boolean {
        
        let draw : any[]
        let level = this.gm.getCurrentLevel()

        if (Brew.Debug.debug_pathmap) {
            let pc_of_max : number
            let color_value : IColor
        
            let path_value = Brew.Debug.debug_pathmap.field.getAt(xy)
            if (path_value) {
            // if (path_value < Brew.Debug.debug_pathmap.max_value) {
                // if (path_value == FastDijkstraMap.MAX_INT) {
                //     color_value = Brew.Color.white
                // } else if (path_value == null) {
                //     color_value = Brew.Color.white
                // if (path_value == 0) {
                //     color_value = Brew.Color.violet
                // } else if (path_value == Number.MAX_VALUE) {
                //     color_value = Brew.Color.green

                if (path_value < 0) {
                    pc_of_max = (path_value / Brew.Debug.debug_pathmap.min_value)  
                    color_value = ROT.Color.interpolate(Brew.Color.blue, Brew.Color.white, 1 - pc_of_max)

                } else {
                    pc_of_max = (path_value / Brew.Debug.debug_pathmap.max_value)
                    color_value = ROT.Color.interpolate(Brew.Color.blue, Brew.Color.white, pc_of_max)    
                }

            } else {
                color_value = Brew.Color.violet
            }

            this.getDisplay(Brew.Enums.DisplayNames.Game).draw(xy.x, xy.y, " ", ROT.Color.toHex(Brew.Color.white), ROT.Color.toHex(color_value))
            
            return true

        }

        // 0. PLAYER FOV
        let in_fov : boolean
        in_fov = this.gm.getPlayer().fov.hasAt(xy)
        
        if (!(in_fov)) {
            // not in view, check memory
            let mem = this.gm.getPlayer().memory.getAt(xy)
            // draw = [' ', Brew.Color.black, Brew.Color.bg_unexplored]
            if (mem) {
                // saw it before
                draw = [mem.code, Brew.Color.memory, Brew.Color.bg_memory]
                
            } else {
                // never seen it
                draw = [' ', Brew.Color.black, Brew.Color.bg_unexplored]
            }
            
        } else {
            // IN VIEW
            
            // 1. TERRAIN
            let terrain = level.terrain.getAt(xy)
            
            if (terrain == null) {
                // debugger
            } 
            
            draw = [terrain.code, terrain.color, terrain.bg_color]

            // 2. FEATURES
            let feature = level.features.getAt(xy)
            let portal_at = level.portals.getAt(xy) // don't draw features on top of stairs
            if (feature && (!(portal_at)) && (!(terrain.alwaysOnTop))) {
                draw[0] = feature.code
                if (feature.color) {
                    draw[1] = feature.color
                }

                if (feature.bg_color) {
                    draw[2] = feature.bg_color
                }
            }
            
            // 3. ITEMS
            let item = level.items.getAt(xy)
            if (item) {
                draw[0] = item.code
                draw[1] = item.color
            }

            
            // 4. MONSTERS
            let mob = level.monsters.getAt(xy)
            if (mob) {
                draw[0] = mob.code
                draw[1] = mob.color

                if (mob.hasFlag(Brew.Enums.Flag.Stunned)) {
                    draw[2] = Brew.Color.green
                }

                let range_threat = Brew.Targeting.isRangedAttackThreat(this.gm, mob, this.gm.getPlayer())
                if (range_threat) {
                    draw[2] = Brew.Color.red
                }

            }

            // 4.5 : PARTS
            let part = level.parts.getAt(xy)
            if (part) {
                draw[0] = part.code
                draw[1] = part.color
            }
            
            // 5. ABOVE / OVERHEAD
            let ab = level.above.getAt(xy)
            if (ab) {
                draw[0] = ab.code
                draw[1] = ab.color
            }

            // REMOTE VISION
            let fov_type : Brew.Enums.BrewVisionSource = this.gm.getPlayer().fov.getAt(xy)
            if (fov_type == Brew.Enums.BrewVisionSource.xRemote) {
                draw[1] = Brew.Color.bg_remote_vision
            }
            
        }

        // boss mode
        if (Brew.Debug.BOSS_MODE) {
            draw[2] = Brew.Color.white
            
            // let faded_color = ROT.Color.interpolate(draw[1], Brew.Color.white, 0.6667)
            draw[1] = ROT.Color.interpolate(draw[1], Brew.Color.white, 0.6667)
        }

        // highlights
        let highlight = this.highlights.getAt(xy)
        if (highlight) {
            // this.getDisplay(Brew.Enums.DisplayNames.HUD).draw(xy.x, xy.y, " ", ROT.Color.toHex(Color.black), ROT.Color.toHex(highlight.color))
            draw[2] = highlight.color
        } else {
            // this.getDisplay(Brew.Enums.DisplayNames.HUD)._context.clearRect(xy.x * this.my_tile_width, xy.y * this.my_tile_height, this.my_tile_width, this.my_tile_height)
        }

        if ((display_options) && (display_options.blackAndWhiteMode)) {
            draw[1] = Brew.Color.gray
            draw[2] = Brew.Color.dark_gray
        }

        if (Brew.Debug.BOSS_MODE) {
            
            this.clearDisplayAt(Brew.Enums.DisplayNames.Game, xy.x, xy.y)
            if (highlight) {
                this.getDisplay(Brew.Enums.DisplayNames.Game).draw(xy.x, xy.y, draw[0], ROT.Color.toHex(draw[1]), ROT.Color.toHex(draw[2]))
            } else {
                this.getDisplay(Brew.Enums.DisplayNames.Game).draw(xy.x, xy.y, draw[0], ROT.Color.toHex(draw[1]))
            }
            
            
        } else {
            this.getDisplay(Brew.Enums.DisplayNames.Game).draw(xy.x, xy.y, draw[0], ROT.Color.toHex(draw[1]), ROT.Color.toHex(draw[2]))            
        }
        
        
        return true // TODO: make this return false if nothing new to draw (cache?)
    }
    
    convertScreenToMap (screen_xy: Brew.Coordinate) : Brew.Coordinate {
        // TODO: screen offset goes here
        let offset_xy = new Brew.Coordinate(0, 0)
        
        return screen_xy.add(offset_xy)
    }
    
    // inventory
    // inventoryDraw(inv: Brew.Inventory, selected_item_index: number) : void {
    //     this.clearDisplay(Brew.Enums.DisplayNames.HUD)
    //     this.drawAll({blackAndWhiteMode: true})
        
    //     let item_text : string
    //     let keys = inv.getKeys()
    //     let toggleText: string
        
    //     for (let i = 0; i < keys.length; i++) {
    //         let invkey = keys[i]
    //         let invitem = inv.getInventoryItemByKey(invkey)
            
    //         if (selected_item_index == i) {
    //             toggleText = "+ "
    //         } else {
    //             toggleText = "- "
    //         }
            
    //         this.getDisplay(Brew.Enums.DisplayNames.HUD).draw(0, i, invkey, ROT.Color.toHex(Brew.Color.white))
    //         item_text = toggleText + invitem.item.getDefinition() + invitem.item.getID().toString() + invitem.item.name
    //         item_text = item_text.slice(0, Brew.Config.screen_width_tiles - 2)
    //         this.getDisplay(Brew.Enums.DisplayNames.HUD).drawText(2, i, item_text)
    //         // .draw(0, i, invkey, ROT.Color.toHex(Color.white))
    //     }
    // }
    
    // context menu
    contextMenuDraw(context_list : Array<Brew.Enums.ContextMenuItem>, selected_item_index: number) : void {
        this.clearDisplay(Brew.Enums.DisplayNames.HUD)
        this.drawAll({blackAndWhiteMode: true})
        
        let item_text : string
        let toggleText: string
        
        for (let i = 0; i < context_list.length; i++) {
            
            if (selected_item_index == i) {
                toggleText = "+ "
            } else {
                toggleText = "- "
            }
            
            item_text = toggleText + Brew.Enums.ContextMenuItem[context_list[i]]
            item_text = item_text.slice(0, Brew.Config.screen_width_tiles - 2)
            this.getDisplay(Brew.Enums.DisplayNames.HUD).drawText(2, i, item_text)
        }
    }
    
    drawFrame(disp_name: Brew.Enums.DisplayNames, topleft_xy : Brew.Coordinate, bottomright_xy: Brew.Coordinate, frame_color: IColor, bg_frame_color: IColor, title: string) {
        
        let frDisplay = this.getDisplay(disp_name)
        let frame_hex = ROT.Color.toHex(frame_color)
        let bg_hex = ROT.Color.toHex(bg_frame_color)

        // draw corners
        frDisplay.draw(topleft_xy.x, topleft_xy.y, Brew.Symbols.box_topleft, frame_hex, bg_hex)
        frDisplay.draw(bottomright_xy.x, topleft_xy.y, Brew.Symbols.box_topright, frame_hex, bg_hex)
        frDisplay.draw(topleft_xy.x, bottomright_xy.y, Brew.Symbols.box_bottomleft, frame_hex, bg_hex)
        frDisplay.draw(bottomright_xy.x, bottomright_xy.y, Brew.Symbols.box_bottomright, frame_hex, bg_hex)

        // draw left & right sides
        for (let y = topleft_xy.y + 1; y <= bottomright_xy.y - 1; y++) {
            frDisplay.draw(topleft_xy.x, y, Brew.Symbols.box_vline, frame_hex, bg_hex)
            frDisplay.draw(bottomright_xy.x, y, Brew.Symbols.box_vline, frame_hex, bg_hex)
        }

        // draw top & bottom side
        for (let x = topleft_xy.x + 1; x <= bottomright_xy.x - 1; x++) {
            frDisplay.draw(x, bottomright_xy.y, Brew.Symbols.box_hline, frame_hex, bg_hex)
            if (!(title)) {
                frDisplay.draw(x, topleft_xy.y, Brew.Symbols.box_hline, frame_hex, bg_hex)
            }
        }

        if (title) {
            // center title
            let frame_width = bottomright_xy.x - topleft_xy.x
            let half_width = Math.floor(frame_width / 2)
            
            title = "[ " + title + " ]"
            
            let title_x = Math.max(0, Math.floor( (frame_width - title.length) / 2))
            
            for (let x = 1; x < title_x; x++) {
                frDisplay.draw(topleft_xy.x + x, topleft_xy.y, Brew.Symbols.box_hline, frame_hex, bg_hex)
            }

            for (let x = 0; x < title.length; x++) {
                frDisplay.draw(topleft_xy.x + title_x + x, topleft_xy.y, title[x], frame_hex, bg_hex)
            }
            
            for (let x = title_x + title.length + 1; x <= bottomright_xy.x - 1; x++) {
                frDisplay.draw(x, topleft_xy.y, Brew.Symbols.box_hline, frame_hex, bg_hex)
            }
            

        }

    }
    
    drawVerticalLine(disp_name: Brew.Enums.DisplayNames, x: number, y_top: number, y_bottom: number, line_color: IColor, bg_line_color: IColor) {
        
        let frDisplay = this.getDisplay(disp_name)
        let line_hex = ROT.Color.toHex(line_color)
        let bg_hex = ROT.Color.toHex(bg_line_color)

        for (let y = y_top; y <= y_bottom; y++) {
            frDisplay.draw(x, y, Brew.Symbols.box_vline, line_hex, bg_hex)
        }

    }


    // generic menu
    genericMenuDraw(title: string, given_desc: string, entries : Array<Brew.Enums.IBrewGenericMenuEntry>, selected_index: number) : void {
        // this.clearDisplay(Brew.Enums.DisplayNames.HUD)
        this.drawAll({blackAndWhiteMode: true})
        
        // define our work around
        let topleft_xy = new Brew.Coordinate(1, 1)
        let bottomright_xy = new Brew.Coordinate(Brew.Config.screen_width_tiles - 2, Brew.Config.screen_height_tiles - 2)

        let full_width = (bottomright_xy.x - topleft_xy.x)
        let half_width = Math.floor(full_width / 2)

        // todo: add menu colors to genericMenu options
        let menu_frame_color = Brew.Color.goldenrod
        let desc_height = 3
        // this.drawFrame(Brew.Enums.DisplayNames.HUD, topleft_xy, bottomright_xy, menu_frame_color, title)
        // this.drawVerticalLine(Brew.Enums.DisplayNames.HUD, half_width, topleft_xy.y + desc_height, bottomright_xy.y - 1, menu_frame_color)
        // draw[1] = Brew.Color.gray
        
        let bg_frame_color : IColor = Brew.Color.dark_gray
        this.drawFrame(Brew.Enums.DisplayNames.Game, topleft_xy, bottomright_xy, menu_frame_color, bg_frame_color, title)
        this.drawVerticalLine(Brew.Enums.DisplayNames.Game, half_width, topleft_xy.y + desc_height, bottomright_xy.y - 1, menu_frame_color, bg_frame_color)

        let entry_text : string
        let toggleText: string
        let description : string 

        if (given_desc) {
            description = given_desc
        } else {
            description = ""
        }
        description = "%b{"+ ROT.Color.toHex(bg_frame_color) + "}" + description

        // let frDisplay = this.getDisplay(Brew.Enums.DisplayNames.HUD)
        let frDisplay = this.getDisplay(Brew.Enums.DisplayNames.Game)
        frDisplay.drawText(topleft_xy.x + 1, topleft_xy.y + 1, description, full_width - 1)

        let items_start_y =  topleft_xy.y + desc_height + 1
        let selected_entry : Brew.Enums.IBrewGenericMenuEntry

        for (let i = 0; i < entries.length; i++) {
            
            if (selected_index == i) {
                // toggleText = (i+1).toString() + ">"
                toggleText = "> "
                selected_entry = entries[i]
            } else {
                // toggleText = (i+1).toString() + " "
                toggleText = "- "
            }
            
            entry_text = toggleText + Brew.Menus.getEntryName(entries[i])
            entry_text = entry_text.slice(0, Brew.Config.screen_width_tiles - 2)

            entry_text = "%b{"+ ROT.Color.toHex(bg_frame_color) + "}" + entry_text
            frDisplay.drawText(topleft_xy.x + 1, items_start_y + i, entry_text)
        }

        if (selected_entry) {
            let entry_desc = "%b{"+ ROT.Color.toHex(bg_frame_color) + "}"
            if (selected_entry.entryDescription) {
                entry_desc += selected_entry.entryDescription
            }
            frDisplay.drawText(half_width + 1, items_start_y, entry_desc, half_width - 1)
        }
    }
    
    gameOverDraw() : void {
        this.clearDisplay(Brew.Enums.DisplayNames.HUD)
        this.drawAll({blackAndWhiteMode: true})
        
        this.getDisplay(Brew.Enums.DisplayNames.HUD).drawText(2, 2, "Congratulations!")
        this.getDisplay(Brew.Enums.DisplayNames.HUD).drawText(2, 4, "You have died.")
    }

    updateDescriptionFooterForPoint(map_xy: Brew.Coordinate) {
        let player = this.gm.getPlayer()
        let level = this.gm.getCurrentLevel()
        let desc : string
        let footer_disp = this.getDisplay(Brew.Enums.DisplayNames.Footer)
        
        let in_fov = player.fov.hasAt(map_xy)
        let has_memory = player.memory.hasAt(map_xy)

        if (in_fov || has_memory) {
            if (in_fov) {
                desc = "You see "
            } else  {
                desc = "You remember seeing "
            }

            let mob_at = level.monsters.getAt(map_xy)
            let terrain_at = level.terrain.getAt(map_xy)
            let feature_at = level.features.getAt(map_xy)
            let item_at = level.items.getAt(map_xy)
            let portal_at = level.portals.getAt(map_xy)
            // todo: get description() for Things

            footer_disp.clear()

            if (mob_at && in_fov) {
                footer_disp.drawText(0, 0, mob_at.getName())
                let mob_notes = Brew.HUD.getCurrentNotes(this.gm).filter((note) => {
                    return note.subject.isSameThing(mob_at)
                })
            
                this.drawNotesOntoFooter(mob_notes, 1, 2)

            } else if (item_at) {
                footer_disp.drawText(0, 0, Brew.Glossary.getItemName(item_at))
                let item_desc = Brew.Glossary.getItemDescription(item_at)
                footer_disp.drawText(0, 1, item_desc.typeDesc)
                if (item_desc.subTypeDesc) {
                    footer_disp.drawText(0, 2, item_desc.subTypeDesc)
                }

            // } else if (overhead_at) {
            //     desc += Brew.Definitions.AboveType[overhead_at.getDefinition()] + " overhead"
            } else if (feature_at) {
                footer_disp.drawText(0, 0, Brew.Glossary.getFeatureName(feature_at))
                footer_disp.drawText(0, 1, Brew.Glossary.getFeatureDescription(feature_at))

            } else {
                footer_disp.drawText(0, 0, Brew.Definitions.TerrainType[terrain_at.getDefinition()] )
            }
        } 

        // todo: eventually make this into a canvas / ROT display element (?)
        // let divDebug = <HTMLDivElement> (document.getElementById("id_div_debug"))
        // divDebug.innerHTML = `<p>${desc}</p>`


        // this.getDisplay(Brew.Enums.DisplayNames.Footer).drawText(0, 0, desc)

        // log some debug stuff
        // console.log(`-- debug info for ${map_xy.x}, ${map_xy.y} --`)
        // console.log("path to player", this.gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.ToPlayer_Walk).field.getAt(map_xy))
        // console.log("path from player", this.gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.FromPlayer_Walk).field.getAt(map_xy))
        // console.log("flypath to player", this.gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.ToPlayer_Fly).field.getAt(map_xy))
        // console.log("flypath from player", this.gm.pathmaps.getPathmap(Brew.Enums.PathmapCacheType.FromPlayer_Fly).field.getAt(map_xy))
        
    }
    
    drawPowerInfo() {
        // draw a strip across the bottom of the footer with the power info
        
        let powers = this.gm.getPlayer().getPowers()
        
        let current_row = 2
        
        let col = 0
        for (let pow of powers.listOfPowers) {
            let line_desc = "[ " + Brew.Glossary.getPowerShortName(pow)  + " " + pow.charge_stat.getCurrentLevel() + " ]"
            this.getDisplay(Brew.Enums.DisplayNames.Footer).drawText(col, current_row, line_desc)
            col += line_desc.length
        }
    }

    drawFooter() {


        // this.clearDisplay(Brew.Enums.DisplayNames.Footer)
        this.getDisplay(Brew.Enums.DisplayNames.Footer).clear()

        this.drawPowerInfo()


        // draw all notes a the bottom except behavioral ones
        let hud_notes = Brew.HUD.getCurrentNotes(this.gm)
        this.drawNotesOntoFooter(hud_notes, 0, 2)
    }

    drawHeader() {
        // this.clearDisplay(Brew.Enums.DisplayNames.Footer)
        let header_disp = this.getDisplay(Brew.Enums.DisplayNames.Header)
        header_disp.clear()

        let score_text = "SCORE: " + this.gm.getPlayer().score.getCurrentLevel()
        header_disp.drawText(0, 0, score_text)

        let level_text = "AREA: " + this.gm.getCurrentLevel().depth
        let x = Brew.Config.map_width_tiles - level_text.length
        header_disp.drawText(x - 1, 0, level_text)

        let middle_text = "Tank Control! (? for HELP)"
        x = (Brew.Config.map_width_tiles / 2) - (middle_text.length / 2) 
        header_disp.drawText(x, 0, middle_text)
        // this.drawPowerInfo()


        // draw all notes a the bottom except behavioral ones
        // let hud_notes = Brew.HUD.getCurrentNotes(this.gm)
        // this.drawNotesOntoFooter(hud_notes, 0, 2)
    }

    // headsUpDisplayDraw(hudDisplayType : Brew.Enums.BrewHeadsUpDisplayType) {
    headsUpDisplayDraw(pageOfNotes: Brew.HUD.IHeadsUpPage) {

        let level = this.gm.getCurrentLevel()
        let letter : string

        // this.clearDisplay(Brew.Enums.DisplayNames.HUD)
        this.drawAll({blackAndWhiteMode: true})
        
        // treat letters as a grid
        let hud_lettergrid : Brew.GridOfThings<ICharAndColor> = pageOfNotes.grid // Brew.HUD.getHUDLetterGrid(this.gm, listOfNotes)
        
        // draw the letter grid
        hud_lettergrid.getAllCoordinates().forEach((xy: Brew.Coordinate, index: number) => {
            letter = hud_lettergrid.getAt(xy).char
            // this.getDisplay(Brew.Enums.DisplayNames.HUD).draw(xy.x, xy.y, letter)
            this.getDisplay(Brew.Enums.DisplayNames.Game).draw(xy.x, xy.y, letter, ROT.Color.toHex(hud_lettergrid.getAt(xy).color))
        })
    }

    drawNotesOntoFooter(notes_list: Array<Brew.HUD.HUDNote>, start_row: number, max_rows: number) {
        let new_text : string
        let running_width = 0
        let current_row = start_row
        let max_width = Brew.Config.screen_width_tiles

        let text_color : IColor
        if (Brew.Debug.BOSS_MODE) {
            text_color = Brew.Color.black
        } else {
            text_color = Brew.Color.normal
        }

        for (let i = 0; i < notes_list.length; i++) {
            new_text = notes_list[i].getNoteText() + " "
            if ((running_width + new_text.length) > max_width) {
                current_row += 1
                running_width = 0
            }

            if (current_row >= (start_row + max_rows)) {
                return
            }

            for (let w = 0; w < new_text.length; w++) {
                let write_color : IColor
                if ((w == 0) && (notes_list[i].subject.color)) {
                    write_color = <IColor>(notes_list[i].subject.color)
                } else {
                    write_color = text_color
                }
                this.getDisplay(Brew.Enums.DisplayNames.Footer).draw(running_width + w, current_row, new_text[w], ROT.Color.toHex(write_color))
            }
            running_width += new_text.length
        }

    }

    drawPopupMessage(msg_text: string, location_xy: Brew.Coordinate, color: IColor, delay?: number) {
        
        if (!(delay)) {
            delay = Brew.Config.popup_msg_speed
        }

        let hud_display = this.getDisplay(Brew.Enums.DisplayNames.HUD)
        let max_width = Brew.Config.screen_width_tiles
        let msg_width = Math.min(max_width, msg_text.length)

        let msg_text_trimmed = msg_text//.substring(0, msg_width)

        let blank_letter_grid = new Brew.GridOfThings<ICharAndColor>()
        let success = Brew.HUD.placeWordsOnLetterGrid(blank_letter_grid, msg_text_trimmed, Brew.Color.white, location_xy)

        blank_letter_grid.getAllCoordinates().forEach((xy: Brew.Coordinate, index: number) => {
            let letter = blank_letter_grid.getAt(xy).char
            // this.getDisplay(Brew.Enums.DisplayNames.HUD).draw(xy.x, xy.y, letter)
            this.getDisplay(Brew.Enums.DisplayNames.HUD).draw(xy.x, xy.y, letter, ROT.Color.toHex(blank_letter_grid.getAt(xy).color))
        })

        // hud_display.drawText(location_xy.x, location_xy.y, msg_text, max_width)

        setTimeout(() => {
            // hud_display.clearRect_Tiles(location_xy.x, location_xy.y, msg_width, 1)
            blank_letter_grid.getAllCoordinates().forEach((xy: Brew.Coordinate, index: number) => {
                hud_display.clearRect_Tiles(xy.x, xy.y, 1, 1)
            })
    
        }, delay)
    }

    drawHelpMenu(helpMsgIndex: number) {
        this.drawAll({blackAndWhiteMode: true})
                
        // define our work around
        let topleft_xy = new Brew.Coordinate(1, 1)
        let bottomright_xy = new Brew.Coordinate(Brew.Config.screen_width_tiles - 2, Brew.Config.screen_height_tiles - 2)

        let full_width = (bottomright_xy.x - topleft_xy.x)
        let half_width = Math.floor(full_width / 2)
        
        let menu_frame_color = Brew.Color.goldenrod
        
        let bg_frame_color : IColor = Brew.Color.dark_gray
        this.drawFrame(Brew.Enums.DisplayNames.Game, topleft_xy, bottomright_xy, menu_frame_color, bg_frame_color, "HELP")
        
        let bgcolor_text = "%b{"+ ROT.Color.toHex(bg_frame_color) + "}"
        let frDisplay = this.getDisplay(Brew.Enums.DisplayNames.Game)

        let current_y = topleft_xy.y + 1
        let max_y = Brew.Config.map_height_tiles - 2
        while (helpMsgIndex < Brew.Tank.helpMessages.length) {

            let line_count = frDisplay.drawText(topleft_xy.x + 1, current_y, bgcolor_text + Brew.Tank.helpMessages[helpMsgIndex], full_width - 1)

            if ((current_y + line_count + 1) > max_y) {
                break
            }

            current_y += line_count + 1
            helpMsgIndex += 1
        }
    }
    
}

