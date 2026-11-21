import { useEffect, useRef } from 'react'
import useStore from '../../store/useStore'

export default function AtmosphereCanvas() {
  const canvasRef = useRef(null)
  const activeCity = useStore((s) => s.activeCity)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId
    
    // Resize canvas
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    handleResize()

    // Very simple abstract particles (representing dust in Jaipur, rain/data in Bengaluru, water in Kochi)
    const particles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2 + 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Theming logic for particle behavior based on city
      ctx.fillStyle = activeCity === 'jaipur' ? 'rgba(212, 175, 55, 0.4)' :
                      activeCity === 'bengaluru' ? 'rgba(26, 115, 232, 0.3)' :
                      'rgba(52, 168, 83, 0.3)'

      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Move
        p.x += p.speedX
        p.y += p.speedY
        
        // Wrap
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [activeCity])

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen"
    />
  )
}
