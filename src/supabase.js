import { createClient } from '@supabase/supabase-js'

// Configuration Supabase
// IMPORTANT: Créez un fichier .env.local à la racine avec vos clés
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'VOTRE_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'VOTRE_SUPABASE_ANON_KEY'

// Créer le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fonction helper pour vérifier si Supabase est configuré
export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  return url &&
         key &&
         url !== 'VOTRE_SUPABASE_URL' &&
         key !== 'VOTRE_SUPABASE_ANON_KEY' &&
         !url.includes('votre') &&
         !key.includes('votre')
}
