import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import LoginPage from './LoginPage'
import TaskCoachApp from './TaskCoachApp'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      return saved ? JSON.parse(saved) : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    // Vérifier si Supabase est configuré
    const configured = isSupabaseConfigured()
    setSupabaseConfigured(configured)

    if (configured) {
      // Supabase configuré: utiliser l'authentification

      // Récupérer la session actuelle
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        setLoading(false)
      })

      // Écouter les changements d'authentification
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

      return () => subscription.unsubscribe()
    } else {
      // Supabase non configuré: mode localStorage
      setUser({ isLocalMode: true, id: 'local-user', email: 'local@mode' })
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(theme))
  }, [theme])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-neutral-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎯</div>
          <div className="text-white text-xl font-semibold">Chargement...</div>
        </div>
      </div>
    )
  }

  // Si Supabase est configuré et utilisateur non connecté: afficher la page de login
  if (supabaseConfigured && !user) {
    return <LoginPage theme={theme} />
  }

  // Sinon: afficher l'application (mode local ou connecté)
  return <TaskCoachApp user={user} theme={theme} setTheme={setTheme} supabaseConfigured={supabaseConfigured} />
}

export default App
