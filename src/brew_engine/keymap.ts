import * as ROT from 'rot-js'

// export const MoveRight = [ROT.VK_RIGHT, ROT.VK_D]
// export const MoveLeft = [ROT.VK_LEFT, ROT.VK_A]
// export const MoveUp = [ROT.VK_UP, ROT.VK_W]
// export const MoveDown = [ROT.VK_DOWN, ROT.VK_S]

export const MoveForward = [ROT.VK_UP, ROT.VK_W]
export const MoveBackward = [ROT.VK_DOWN, ROT.VK_S]
export const RotateBodyCW = [ROT.VK_RIGHT, ROT.VK_D]
export const RotateBodyCCW = [ROT.VK_LEFT, ROT.VK_A]

export const MovementKeys = [].concat(MoveForward, MoveBackward, RotateBodyCCW, RotateBodyCW)
export const RotateWeaponCW = [ROT.VK_E]
export const RotateWeaponCCW = [ROT.VK_Q]

export const Action = [ROT.VK_SPACE, ROT.VK_RETURN]
export const Examine = [ROT.VK_X]
export const HeadsUp = [ROT.VK_Z]
export const Inventory = [ROT.VK_I]

export const Menu = [ROT.VK_M]
export const Escape = [ROT.VK_ESCAPE]

export const DebugFOV = [ROT.VK_SLASH]
// export const DebugPaths = [ROT.VK_Q]
export const DebugMenu = [ROT.VK_BACK_QUOTE]

export const HotKey_1 = [ROT.VK_1]
export const HotKey_2 = [ROT.VK_2]
export const HotKey_3 = [ROT.VK_3]
export const HotKey_4 = [ROT.VK_4]

export const BossMode = [ROT.VK_B]

export const ScreenEnlarge = [ROT.VK_0]
export const ScreenShrink = [ROT.VK_9]

export const DirectionalMovementKeys = [].concat(MoveForward, MoveBackward)
export const RotationalMovementKeys = [].concat(RotateBodyCCW, RotateBodyCW)
export const RotationalWeaponKeys = [].concat(RotateWeaponCCW, RotateWeaponCW)
export const CWRotateKeys = [].concat(RotateBodyCW, RotateWeaponCW)
export const CCWRotateKeys = [].concat(RotateBodyCCW, RotateWeaponCCW)
export const HotKeys = [].concat(HotKey_1, HotKey_2, HotKey_3, HotKey_4)
export const ScreenSizeControl = [].concat(ScreenEnlarge, ScreenShrink)

export const Help = [ROT.VK_QUESTION_MARK, ROT.VK_SLASH]