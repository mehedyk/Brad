import * as THREE from 'three/webgpu'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import pallyBoldData from '../../../data/PallyBoldFont.json'
import { Inputs } from '../../Inputs/Inputs.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'

export class LandingArea extends Area
{
    constructor(model)
    {
        super(model)

        this.localTime = uniform(0)

        this.setLetters()
        this.setKiosk()
        this.setControls()
        this.setBonfire()
        this.setAchievement()
    }

    setLetters()
    {
        const references = this.references.items.get('letters')

        const SIZE   = 1.3
        const DEPTH  = 0.45

        const topCenter = new THREE.Vector3()
        const bottomCenter = new THREE.Vector3()
        let rotationY = Math.PI + 0.44

        if(references && references.length > 0)
        {
            // Hide original geometry (spells Bruno's name, baked into GLB) and disable their physics
            for(const reference of references)
            {
                reference.traverse(child => { child.visible = false })
                const object = reference.userData.object
                if(object)
                {
                    this.game.objects.disable(object)
                }
            }

            // Get rotation from the first reference
            rotationY = references[0].rotation.y

            // Vector perpendicular to the text baseline (along the ground)
            const normal = new THREE.Vector3(Math.sin(rotationY), 0, Math.cos(rotationY))

            // Sort references by their global position projected onto the normal vector descending
            const sortedReferences = [...references].sort((a, b) => {
                const posA = new THREE.Vector3()
                const posB = new THREE.Vector3()
                a.getWorldPosition(posA)
                b.getWorldPosition(posB)
                return posB.dot(normal) - posA.dot(normal)
            })
            
            // Top line (original "BRUNO" letters)
            const topLineRefs = sortedReferences.slice(0, Math.ceil(references.length / 2))
            // Bottom line (original "SIMON" letters)
            const bottomLineRefs = sortedReferences.slice(Math.ceil(references.length / 2))

            const tempPos = new THREE.Vector3()

            if(topLineRefs.length > 0)
            {
                for(const ref of topLineRefs)
                {
                    ref.getWorldPosition(tempPos)
                    topCenter.add(tempPos)
                }
                topCenter.divideScalar(topLineRefs.length)
            }

            if(bottomLineRefs.length > 0)
            {
                for(const ref of bottomLineRefs)
                {
                    ref.getWorldPosition(tempPos)
                    bottomCenter.add(tempPos)
                }
                bottomCenter.divideScalar(bottomLineRefs.length)
            }
        }
        else
        {
            // Fallbacks in global space if references are empty
            topCenter.set(-5.2, -2.53, 3.0 + SIZE + 0.25).add(this.model.position)
            bottomCenter.set(-5.2, -2.53, 3.0).add(this.model.position)
        }

        // Build MEHEDY / KAWSER as 3D text using the Optimer font
        const font = new FontLoader().parse(pallyBoldData)

        const material = new THREE.MeshStandardMaterial({
            color: 0xff8039,
            roughness: 0.55,
            metalness: 0.08,
        })

        const makeText = (str) =>
        {
            const geo = new TextGeometry(str, {
                font,
                size: SIZE,
                depth: DEPTH,
                curveSegments: 5,
                bevelEnabled: true,
                bevelThickness: 0.06,
                bevelSize:      0.04,
                bevelSegments:  3
            })
            geo.computeBoundingBox()
            const w = geo.boundingBox.max.x - geo.boundingBox.min.x
            geo.translate(-w / 2, 0, 0)
            return new THREE.Mesh(geo, material)
        }

        // Direction along the text baseline
        const dir = new THREE.Vector3(Math.cos(rotationY), 0, -Math.sin(rotationY))
        const spacing = 0.95 // Letter spacing

        const createBreakableLetter = (char, position, rotationY) =>
        {
            const mesh = makeText(char)
            
            mesh.position.copy(position)
            mesh.rotation.y = rotationY

            mesh.geometry.computeBoundingBox()
            const w = mesh.geometry.boundingBox.max.x - mesh.geometry.boundingBox.min.x

            const object = this.game.objects.add(
                {
                    model: mesh,
                    updateMaterials: true,
                    castShadow: true,
                    receiveShadow: true,
                },
                {
                    type: 'dynamic',
                    position: position,
                    rotation: mesh.quaternion,
                    friction: 0.5,
                    mass: 0.15,
                    sleeping: true,
                    colliders: [
                        {
                            shape: 'cuboid',
                            parameters: [ w * 0.5, SIZE * 0.5, DEPTH * 0.5 ],
                            position: { x: 0, y: SIZE * 0.5, z: -DEPTH * 0.5 }
                        }
                    ]
                }
            )

            // Enable collision sound and event tracking
            const physical = object.physical
            if(physical)
            {
                physical.colliders[0].setActiveEvents(this.game.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
                physical.colliders[0].setContactForceEventThreshold(2)
                physical.onCollision = (force, position) =>
                {
                    this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
                }
            }

            // Add to hideable array for frustum culling
            this.objects.hideable.push(mesh)
        }

        // Create MEHEDY letters
        const line1Chars = 'MEHEDY'.split('')
        for(let i = 0; i < line1Chars.length; i++)
        {
            const offset = (i - (line1Chars.length - 1) / 2) * spacing
            const pos = topCenter.clone().add(dir.clone().multiplyScalar(offset))
            createBreakableLetter(line1Chars[i], pos, rotationY)
        }

        // Create KAWSER letters
        const line2Chars = 'KAWSER'.split('')
        for(let i = 0; i < line2Chars.length; i++)
        {
            const offset = (i - (line2Chars.length - 1) / 2) * spacing
            const pos = bottomCenter.clone().add(dir.clone().multiplyScalar(offset))
            createBreakableLetter(line2Chars[i], pos, rotationY)
        }
    }

    setKiosk()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('kioskInteractivePoint')[0].position,
            'Map',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('map')
                // interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // this.game.map.items.get('map').events.on('close', () =>
        // {
        //     interactivePoint.show()
        // })
    }

    setControls()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('controlsInteractivePoint')[0].position,
            'Controls',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.menu.open('controls')
                interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // Menu instance
        const menuInstance = this.game.menu.items.get('controls')

        menuInstance.events.on('close', () =>
        {
            interactivePoint.show()
        })

        menuInstance.events.on('open', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                menuInstance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                menuInstance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                menuInstance.tabs.goTo('touch')
        })
    }

    setBonfire()
    {
        const position = this.references.items.get('bonfireHashes')[0].position

        // Particles
        let particles = null
        {
            const emissiveMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
    
            const count = 30
            const elevation = uniform(5)
            const positions = new Float32Array(count * 3)
            const scales = new Float32Array(count)
    
    
            for(let i = 0; i < count; i++)
            {
                const i3 = i * 3
    
                const angle = Math.PI * 2 * Math.random()
                const radius = Math.pow(Math.random(), 1.5) * 1
                positions[i3 + 0] = Math.cos(angle) * radius
                positions[i3 + 1] = Math.random()
                positions[i3 + 2] = Math.sin(angle) * radius
    
                scales[i] = 0.02 + Math.random() * 0.06
            }
            
            const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
            const scaleAttribute = instancedArray(scales, 'float').toAttribute()
    
            const material = new THREE.SpriteNodeMaterial()
            material.outputNode = emissiveMaterial.outputNode
    
            const progress = float(0).toVar()
    
            material.positionNode = Fn(() =>
            {
                const newPosition = positionAttribute.toVar()
                progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())
    
                newPosition.y.assign(progress.mul(elevation))
                newPosition.xz.addAssign(this.game.wind.direction.mul(progress))
    
                const progressHide = step(0.8, progress).mul(100)
                newPosition.y.addAssign(progressHide)
                
                return newPosition
            })()
            material.scaleNode = Fn(() =>
            {
                const progressScale = progress.remapClamp(0.5, 1, 1, 0)
                return scaleAttribute.mul(progressScale)
            })()
    
            const geometry = new THREE.CircleGeometry(0.5, 8)
    
            particles = new THREE.Mesh(geometry, material)
            particles.visible = false
            particles.position.copy(position)
            particles.count = count
            this.game.scene.add(particles)
        }

        // Hashes
        {
            const alphaNode = Fn(() =>
            {
                const baseUv = uv(1)
                const distanceToCenter = baseUv.sub(0.5).length()
    
                const voronoi = texture(
                    this.game.noises.voronoi,
                    baseUv
                ).g
    
                voronoi.subAssign(distanceToCenter.remap(0, 0.5, 0.3, 0))
    
                return voronoi
            })()
    
            const material = new MeshDefaultMaterial({
                colorNode: color(0x6F6A87),
                alphaNode: alphaNode,
                hasWater: false,
                hasLightBounce: false
            })
    
            const mesh = this.references.items.get('bonfireHashes')[0]
            mesh.material = material
        }

        // Burn
        const burn = this.references.items.get('bonfireBurn')[0]
        burn.visible = false

        // Interactive point
        this.game.interactivePoints.create(
            this.references.items.get('bonfireInteractivePoint')[0].position,
            'Res(e)t',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.reset()

                gsap.delayedCall(2, () =>
                {
                    // Bonfire
                    particles.visible = true
                    burn.visible = true
                    this.game.ticker.wait(2, () =>
                    {
                        particles.geometry.boundingSphere.center.y = 2
                        particles.geometry.boundingSphere.radius = 2
                    })

                    // Sound
                    this.game.audio.groups.get('campfire').items[0].positions.push(position)
                })
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'landing')
        })
        this.events.on('boundingOut', () =>
        {
            this.game.achievements.setProgress('landingLeave', 1)
        })
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}