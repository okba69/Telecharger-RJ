import { useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Hook de synchronisation Firestore
 * Synchronise automatiquement les données entre localStorage et Firestore
 *
 * @param {Object} user - L'utilisateur connecté
 * @param {boolean} firebaseConfigured - Firebase est-il configuré ?
 * @param {Object} data - Les données à synchroniser (état React)
 * @param {Function} setData - Fonction pour mettre à jour les données
 * @param {string} dataKey - Clé pour identifier les données (ex: 'tasks', 'inboxItems')
 */
export function useFirestoreSync(user, firebaseConfigured, data, setData, dataKey) {
  const initialLoadDone = useRef(false)
  const isLocalUpdate = useRef(false)

  // 1. Charger les données depuis Firestore au démarrage
  useEffect(() => {
    if (!firebaseConfigured || !user || user.isLocalMode || initialLoadDone.current) {
      return
    }

    const loadFromFirestore = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'data', dataKey)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          // Les données existent dans Firestore
          const firestoreData = docSnap.data().value
          isLocalUpdate.current = true
          setData(firestoreData)
          console.log(`✅ ${dataKey} chargé depuis Firestore`)
        } else {
          // Première connexion: migrer localStorage vers Firestore
          const localData = localStorage.getItem(dataKey)
          if (localData) {
            const parsedData = JSON.parse(localData)
            await setDoc(docRef, { value: parsedData, updatedAt: new Date().toISOString() })
            console.log(`📤 ${dataKey} migré de localStorage vers Firestore`)
          }
        }

        initialLoadDone.current = true
      } catch (error) {
        console.error(`❌ Erreur lors du chargement de ${dataKey}:`, error)
      }
    }

    loadFromFirestore()
  }, [firebaseConfigured, user, dataKey, setData])

  // 2. Écouter les changements en temps réel depuis Firestore
  useEffect(() => {
    if (!firebaseConfigured || !user || user.isLocalMode || !initialLoadDone.current) {
      return
    }

    const docRef = doc(db, 'users', user.uid, 'data', dataKey)

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && !isLocalUpdate.current) {
        const firestoreData = docSnap.data().value
        setData(firestoreData)
        console.log(`🔄 ${dataKey} synchronisé depuis Firestore`)
      }
      isLocalUpdate.current = false
    })

    return () => unsubscribe()
  }, [firebaseConfigured, user, dataKey, setData])

  // 3. Sauvegarder dans Firestore quand les données changent
  useEffect(() => {
    if (!firebaseConfigured || !user || user.isLocalMode || !initialLoadDone.current) {
      // Mode localStorage uniquement
      localStorage.setItem(dataKey, JSON.stringify(data))
      return
    }

    const saveToFirestore = async () => {
      try {
        isLocalUpdate.current = true
        const docRef = doc(db, 'users', user.uid, 'data', dataKey)
        await setDoc(docRef, { value: data, updatedAt: new Date().toISOString() })
        // Aussi sauvegarder en localStorage comme backup
        localStorage.setItem(dataKey, JSON.stringify(data))
        console.log(`💾 ${dataKey} sauvegardé dans Firestore`)
      } catch (error) {
        console.error(`❌ Erreur lors de la sauvegarde de ${dataKey}:`, error)
      }
    }

    saveToFirestore()
  }, [data, firebaseConfigured, user, dataKey])
}
