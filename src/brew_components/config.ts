// export let Config : { [name: string]: any } = {
// 	BOSS_MODE: false,
// 	MAX_GRID_SIZE: 1024, // used for converting coordinates to indexes, only change this if either map dimension is ginormous
// 	screen_width_tiles: 64,
// 	screen_height_tiles: 32,
// 	font_size: 12,
// 	animation_speed: 33,
// 	rotjs_topology: 4,
// 	ally_hover_range: 3,
// 	max_depth: 4,
// 	max_powers: 3,
// 	max_health: 3,
// 	pack_attack_size: 3,
// 	pack_distance: 4,
// 	grenade_radius: 5, // todo: move this to the item itself / differentiate by level
// 	player_shield_amount: 3, // todo: make this rely on the power rank somehow
// }

// Config.map_width_tiles = Config.screen_width_tiles
// Config.map_height_tiles = Config.screen_height_tiles


export let MAX_GRID_SIZE = 1024 // used for converting coordinates to indexes, only change this if either map dimension is ginormous
export let screen_width_tiles = 60
export let screen_height_tiles = 30
export let font_size = 12
export let animation_speed = 33
export let rotjs_topology = 4
export let ally_hover_range = 3
export let max_depth = 4
export let max_powers = 3
export let max_items = 8
export let max_health = 3
export let pack_attack_size = 3
export let pack_distance = 4
export let grenade_radius = 5 // todo: move this to the item itself / differentiate by level
export let player_shield_amount = 3 // todo: make this rely on the power rank somehow
export let map_width_tiles = screen_width_tiles
export let map_height_tiles = screen_height_tiles
export let max_power_charges = 9
export let max_power_strength = 9
export let popup_msg_speed = 1500
export let local_sight_range = 6

export const explosion_damage = 1
export const turret_damage = 2
export const machinegun_damage = 1

export const default_monster_sight_range = 10
export const default_player_sight_range = 20
