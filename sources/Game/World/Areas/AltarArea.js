/**
 * AltarArea — no-op stub.
 * The altar area has been removed. The mesh still exists in areas.glb
 * but its materials are the globally shared "palette" and
 * "emissiveOrangeRadialGradient" materials — disposing them would
 * destroy the entire world's geometry rendering.
 * Setting visible=false on the group is sufficient: Three.js skips
 * the whole subtree in the render pass without touching the materials.
 */
export class AltarArea
{
    constructor(group)
    {
        group.visible = false
    }
}