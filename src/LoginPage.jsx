import { useState } from 'react'
import { supabase } from './supabase'

function LoginPage({ theme }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const themeClasses = {
    light: {
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      card: 'bg-white',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      border: 'border-gray-200',
      input: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    dark: {
      bg: 'bg-gradient-to-br from-neutral-900 to-neutral-800',
      card: 'bg-neutral-800',
      text: 'text-white',
      textSecondary: 'text-neutral-400',
      border: 'border-neutral-700',
      input: 'bg-neutral-700 border-neutral-600 text-white focus:border-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const classes = themeClasses[theme]

  const handleEmailLogin = async (e) => {
    e.preventDefault()

    if (!email) {
      setError('Veuillez entrer votre email')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: window.location.origin
        }
      })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      console.error('Erreur de connexion:', error)
      setError(error.message || 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen ${classes.bg} flex items-center justify-center p-4`}>
      <div className={`${classes.card} rounded-2xl shadow-2xl p-8 max-w-md w-full border ${classes.border}`}>
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className={`text-3xl font-bold ${classes.text} mb-2`}>
            ProductivityHub
          </h1>
          <p className={`${classes.textSecondary}`}>
            Votre coach personnel de productivité
          </p>
        </div>

        {success ? (
          // Message de succès
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className={`text-xl font-semibold ${classes.text} mb-3`}>
              Email envoyé!
            </h2>
            <p className={`${classes.textSecondary} mb-4`}>
              Vérifiez votre boîte mail <strong>{email}</strong>
            </p>
            <p className={`text-sm ${classes.textSecondary} mb-6`}>
              Cliquez sur le lien dans l'email pour vous connecter.
              <br />
              <span className="text-xs">(Vérifiez aussi vos spams)</span>
            </p>
            <button
              onClick={() => {
                setSuccess(false)
                setEmail('')
                setLoading(false)
              }}
              className={`text-sm ${classes.textSecondary} hover:underline`}
            >
              Utiliser un autre email
            </button>
          </div>
        ) : (
          // Formulaire de connexion
          <>
            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin}>
              <div className="mb-6">
                <label className={`block text-sm font-medium ${classes.text} mb-2`}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  disabled={loading}
                  className={`w-full px-4 py-3 rounded-lg border ${classes.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-medium ${classes.button} shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <span>📧</span>
                    <span>Se connecter</span>
                  </>
                )}
              </button>
            </form>

            {/* Explication */}
            <div className={`mt-6 p-4 rounded-lg ${theme === 'light' ? 'bg-blue-50' : 'bg-blue-900/20'}`}>
              <p className={`text-xs ${classes.textSecondary} text-center`}>
                ✨ <strong>Connexion magique sans mot de passe</strong>
                <br />
                Entrez votre email, vous recevrez un lien de connexion instantané.
              </p>
            </div>
          </>
        )}

        {/* Avantages */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-700">
          <p className={`text-xs ${classes.textSecondary} text-center mb-3`}>
            Pourquoi se connecter ?
          </p>
          <ul className={`text-xs ${classes.textSecondary} space-y-2`}>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Synchronisation automatique entre tous vos appareils</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Sauvegarde cloud sécurisée de vos données</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Accès depuis n'importe où</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
