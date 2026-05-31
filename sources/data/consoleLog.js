import * as THREE from 'three/webgpu'

const text = `
███╗   ███╗███████╗██╗  ██╗███████╗██████╗ ██╗   ██╗
████╗ ████║██╔════╝██║  ██║██╔════╝██╔══██╗╚██╗ ██╔╝
██╔████╔██║█████╗  ███████║█████╗  ██║  ██║ ╚████╔╝ 
██║╚██╔╝██║██╔══╝  ██╔══██║██╔══╝  ██║  ██║  ╚██╔╝  
██║ ╚═╝ ██║███████╗██║  ██║███████╗██████╔╝   ██║   
╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚═════╝    ╚═╝   

╔═ Hello there ═════════════════════════════════════════╗
║ You sneaky developer! Thanks for visiting my portfolio.
║ S. M. Mehedy Kawser — competitive programmer,
║ full-stack developer & AI engineer.
╚═══════════════════════════════════════════════════════╝

╔═ Socials ═════════════════╗
║ Mail       ⇒ mehedykawser@gmail.com
║ GitHub     ⇒ https://github.com/mehedyk
║ LinkedIn   ⇒ https://www.linkedin.com/in/mehedyk/
║ YouTube    ⇒ https://www.youtube.com/@MehedyKawser
║ Facebook   ⇒ https://www.facebook.com/share/1bLCt9XY3R/
╚═══════════════════════════╝

╔═ Tech Stack ══════════════╗
║ Frontend  ⇒ React, JSX/TSX, TailwindCSS
║ Backend   ⇒ Node.js, Python, Supabase
║ Languages ⇒ C++, Python, JavaScript
║ Tools     ⇒ Vite, Git, Vercel, Netlify
╚═══════════════════════════╝

╔═ Debug ═══════════════════╗
║ Add #debug at the end of the URL and reload.
║ Press [V] to toggle free camera.
╚═══════════════════════════╝

╔═ Built with ══════════════╗
║ Three.js r${THREE.REVISION} — https://threejs.org/
║ Original template by Bruno Simon
║ https://github.com/brunosimon/folio-2025
╚═══════════════════════════╝
`

let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]
    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'
        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
