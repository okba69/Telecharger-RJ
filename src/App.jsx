import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import LoginPage from './LoginPage'
import TaskCoachApp from './TaskCoachApp'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firebaseConfigured, setFirebaseConfigured] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme')
      return saved ? JSON.parse(saved) : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    // Vérifier si Firebase est configuré
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
    const isConfigured = apiKey && apiKey !== 'VOTRE_API_KEY' && !apiKey.includes('votre')

    setFirebaseConfigured(isConfigured)

    if (isConfigured) {
      // Firebase configuré: utiliser l'authentification
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
        setLoading(false)
      })
      return () => unsubscribe()
    } else {
      // Firebase non configuré: mode localStorage
      setUser({ isLocalMode: true, displayName: 'Utilisateur Local' })
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('theme', JSON.stringify(theme))
  }, [theme])

  if (loading) {
    // Écran de chargement
    const themeClasses = theme === 'light' ? {
      bg: 'bg-gray-50',
      text: 'text-gray-900'
    } : {
      bg: 'bg-[#0a0a0a]',
      text: 'text-neutral-200'
    }

    return (
      <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🚀</div>
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  // Si Firebase est configuré et utilisateur non connecté: afficher la page de login
  if (firebaseConfigured && !user) {
    return <LoginPage theme={theme} />
  }

  // Sinon: afficher l'application (mode local ou connecté)
  return <TaskCoachApp user={user} theme={theme} setTheme={setTheme} firebaseConfigured={firebaseConfigured} />
}

export default App
