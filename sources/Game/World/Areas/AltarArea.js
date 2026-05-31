/**
 * AltarArea — stripped to a no-op stub.
 * The original altar area has been removed from this portfolio.
 * The 3D mesh still exists in the GLB. Without this class properly
 * initialising its WebGPU NodeMaterials the renderer crashes with
 * a "drawIndexed: Value is not of type unsigned long" error.
 * This stub receives the group and immediately hides every descendant,
 * preventing the broken materials from ever reaching the GPU.
 */
export class AltarArea
{
    constructor(group)
    {
        group.traverse((child) =>
        {
            child.visible = false

            if(child.isMesh)
            {
                if(Array.isArray(child.material))
                    child.material.forEach(m => m.dispose())
                else if(child.material)
                    child.material.dispose()

                if(child.geometry)
                    child.geometry.dispose()
            }
        })
    }
}