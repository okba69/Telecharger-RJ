import { useEffect, useRef } from 'react'
import { supabase } from '../supabase'

/**
 * Hook de synchronisation Supabase
 * Synchronise automatiquement les données entre localStorage et Supabase
 *
 * @param {Object} user - L'utilisateur connecté
 * @param {boolean} supabaseConfigured - Supabase est-il configuré ?
 * @param {Object} data - Les données à synchroniser (état React)
 * @param {Function} setData - Fonction pour mettre à jour les données
 * @param {string} dataKey - Clé pour identifier les données (ex: 'tasks', 'inboxItems')
 */
export function useSupabaseSync(user, supabaseConfigured, data, setData, dataKey) {
  const initialLoadDone = useRef(false)
  const isLocalUpdate = useRef(false)

  // 1. Charger les données depuis Supabase au démarrage
  useEffect(() => {
    if (!supabaseConfigured || !user || user.isLocalMode || initialLoadDone.current) {
      return
    }

    const loadFromSupabase = async () => {
      try {
        const { data: supabaseData, error } = await supabase
          .from('user_data')
          .select('value')
          .eq('user_id', user.id)
          .eq('data_key', dataKey)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw error
        }

        if (supabaseData) {
          // Les données existent dans Supabase
          isLocalUpdate.current = true
          setData(supabaseData.value)
          console.log(`✅ ${dataKey} chargé depuis Supabase`)
        } else {
          // Première connexion: migrer localStorage vers Supabase
          const localData = localStorage.getItem(dataKey)
          if (localData) {
            const parsedData = JSON.parse(localData)
            await supabase
              .from('user_data')
              .upsert({
                user_id: user.id,
                data_key: dataKey,
                value: parsedData,
                updated_at: new Date().toISOString()
              })
            console.log(`📤 ${dataKey} migré de localStorage vers Supabase`)
          }
        }

        initialLoadDone.current = true
      } catch (error) {
        console.error(`❌ Erreur lors du chargement de ${dataKey}:`, error)
      }
    }

    loadFromSupabase()
  }, [supabaseConfigured, user, dataKey, setData])

  // 2. Écouter les changements en temps réel depuis Supabase
  useEffect(() => {
    if (!supabaseConfigured || !user || user.isLocalMode || !initialLoadDone.current) {
      return
    }

    const channel = supabase
      .channel(`public:user_data:${dataKey}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_data',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new.data_key === dataKey && !isLocalUpdate.current) {
            setData(payload.new.value)
            console.log(`🔄 ${dataKey} synchronisé depuis Supabase`)
          }
          isLocalUpdate.current = false
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabaseConfigured, user, dataKey, setData])

  // 3. Sauvegarder dans Supabase quand les données changent
  useEffect(() => {
    if (!supabaseConfigured || !user || user.isLocalMode || !initialLoadDone.current) {
      // Mode localStorage uniquement
      localStorage.setItem(dataKey, JSON.stringify(data))
      return
    }

    const saveToSupabase = async () => {
      try {
        isLocalUpdate.current = true
        await supabase
          .from('user_data')
          .upsert({
            user_id: user.id,
            data_key: dataKey,
            value: data,
            updated_at: new Date().toISOString()
          })
        // Aussi sauvegarder en localStorage comme backup
        localStorage.setItem(dataKey, JSON.stringify(data))
        console.log(`💾 ${dataKey} sauvegardé dans Supabase`)
      } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de ${dataKey}:`, error)
      }
    }

    saveToSupabase()
  }, [data, supabaseConfigured, user, dataKey])
}
