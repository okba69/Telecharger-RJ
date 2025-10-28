import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
// IMPORTANT: Créez un fichier .env.local à la racine avec vos clés
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder'

// Fonction helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  return url &&
         key &&
         url.includes('supabase.co') &&
         key.startsWith('eyJ')
}

// Créer le client Supabase avec des valeurs valides par défaut
// (même si ce sont des placeholders, cela ne bloque pas l'app)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
