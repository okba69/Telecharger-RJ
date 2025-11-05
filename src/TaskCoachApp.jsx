import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import MissionsView from './MissionsView'

function TaskCoachApp({ user, theme: initialTheme, setTheme: setParentTheme, supabaseConfigured }) {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState('today')

  // Load data from localStorage on mount
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : defaultValue
    } catch {
      return defaultValue
    }
  }

  // Tasks state
  const [tasks, setTasks] = useState(() => loadFromStorage('tasks', []))

  // Active task tracking
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const startTimeRef = useRef(null) // Absolute start time for current running session
  const baseSecondsRef = useRef(0) // Accumulated seconds before current session

  // Inbox (renamed to "À faire")
  const [inboxItems, setInboxItems] = useState(() => loadFromStorage('inboxItems', []))
  const [newInboxItem, setNewInboxItem] = useState('')
  const [inboxCategory, setInboxCategory] = useState('travail') // 'travail' or 'ecole'
  const [inboxDeadline, setInboxDeadline] = useState('') // Date deadline for inbox items

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskEstimate, setNewTaskEstimate] = useState(30)

  // Daily feedback
  const [dailyFeedback, setDailyFeedback] = useState(() => loadFromStorage('dailyFeedback', ''))
  const [energyLevel, setEnergyLevel] = useState(() => loadFromStorage('energyLevel', 5))
  const [satisfactionLevel, setSatisfactionLevel] = useState(() => loadFromStorage('satisfactionLevel', 5))

  // History
  const [history, setHistory] = useState(() => loadFromStorage('history', []))
  const [currentDate, setCurrentDate] = useState(() => loadFromStorage('currentDate', new Date().toDateString()))
  const [showNewDayModal, setShowNewDayModal] = useState(false)
  const [newDayDate, setNewDayDate] = useState('')

  // Task history (all tasks ever created)
  const [taskHistory, setTaskHistory] = useState(() => loadFromStorage('taskHistory', []))

  // Missions with subtasks
  const [missions, setMissions] = useState(() => loadFromStorage('missions', []))
  const [expandedMissionId, setExpandedMissionId] = useState(null)

  // Theme (from parent props)
  const theme = initialTheme
  const setTheme = setParentTheme

  // Focus mode & Pomodoro
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [pomodoroMode, setPomodoroMode] = useState('work') // 'work' | 'break'
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60) // Current countdown
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false)
  const pomodoroStartTimeRef = useRef(null) // Absolute start time for pomodoro
  const pomodoroBaseDurationRef = useRef(25 * 60) // Total duration for current session
  const [motivationalMessage, setMotivationalMessage] = useState('')
  const [pomodoroCount, setPomodoroCount] = useState(0)

  // Pomodoro configuration
  const [pomodoroConfig, setPomodoroConfig] = useState(() =>
    loadFromStorage('pomodoroConfig', { workMinutes: 25, breakMinutes: 5 })
  )

  // Drag and drop
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedInboxItem, setDraggedInboxItem] = useState(null)

  // Collapsible sections
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  // Audio
  const audioContextRef = useRef(null)
  const ambientOscillatorRef = useRef(null)
  const ambientGainNodeRef = useRef(null)
  const ambientIntervalRef = useRef(null)

  // Motivational messages
  const motivationalMessages = [
    "💪 Vous êtes sur la bonne voie ! Continue comme ça !",
    "🚀 Chaque minute compte. Restez concentré !",
    "🎯 La discipline bat le talent. Keep going !",
    "⚡ Vous êtes une machine de productivité !",
    "🔥 Le succès est la somme de petits efforts répétés !",
    "🌟 Excellent travail ! Vous progressez !",
    "💎 La concentration est votre super-pouvoir !",
    "🎪 Un pas à la fois vers l'excellence !",
    "⭐ Vous dominez cette tâche !",
    "🏆 Champion de la productivité en action !",
    "🧠 Focus maximal = Résultats maximaux !",
    "💯 Vous êtes inarrêtable aujourd'hui !",
    "🎨 Créez votre chef-d'œuvre, une tâche à la fois !",
    "🌈 Votre futur moi vous remercie !",
    "⚔️ Warrior mode : ACTIVÉ !"
  ]

  // ========== SUPABASE SYNCHRONIZATION ==========
  // Synchroniser toutes les données avec Supabase (ou localStorage si Supabase non configuré)
  useSupabaseSync(user, supabaseConfigured, tasks, setTasks, 'tasks')
  useSupabaseSync(user, supabaseConfigured, inboxItems, setInboxItems, 'inboxItems')
  useSupabaseSync(user, supabaseConfigured, dailyFeedback, (value) => setDailyFeedback(value), 'dailyFeedback')
  useSupabaseSync(user, supabaseConfigured, energyLevel, setEnergyLevel, 'energyLevel')
  useSupabaseSync(user, supabaseConfigured, satisfactionLevel, setSatisfactionLevel, 'satisfactionLevel')
  useSupabaseSync(user, supabaseConfigured, history, setHistory, 'history')
  useSupabaseSync(user, supabaseConfigured, currentDate, (value) => setCurrentDate(value), 'currentDate')
  useSupabaseSync(user, supabaseConfigured, taskHistory, setTaskHistory, 'taskHistory')
  useSupabaseSync(user, supabaseConfigured, pomodoroConfig, setPomodoroConfig, 'pomodoroConfig')
  useSupabaseSync(user, supabaseConfigured, missions, setMissions, 'missions')

  // Migrate existing missions to add category field (backward compatibility)
  useEffect(() => {
    const needsMigration = missions.some(m => !m.category)
    if (needsMigration) {
      setMissions(missions.map(m => ({
        ...m,
        category: m.category || 'work'
      })))
    }
  }, []) // Only run once on mount

  // ========== TIMER LOGIC ==========
  // Main timer loop with precise timing
  useEffect(() => {
    if (!isRunning || activeTaskId === null) return

    // Safety check: ensure refs are initialized
    if (startTimeRef.current === null) {
      const task = tasks.find(t => t.id === activeTaskId)
      if (task) {
        baseSecondsRef.current = task.secondsSpent
        startTimeRef.current = Date.now()
      }
    }

    // Update every 100ms for smooth display, but only increment seconds properly
    const interval = setInterval(() => {
      if (startTimeRef.current === null) return // Safety check

      const now = Date.now()
      const elapsedMs = now - startTimeRef.current
      const totalSeconds = baseSecondsRef.current + Math.floor(elapsedMs / 1000)

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === activeTaskId
            ? { ...task, secondsSpent: totalSeconds }
            : task
        )
      )
    }, 100) // Update every 100ms for smooth display

    return () => clearInterval(interval)
  }, [isRunning, activeTaskId, tasks])

  // ========== POMODORO TIMER ==========
  useEffect(() => {
    if (!isPomodoroRunning) return

    // Safety check: ensure refs are initialized
    if (pomodoroStartTimeRef.current === null) {
      pomodoroStartTimeRef.current = Date.now()
    }

    const interval = setInterval(() => {
      if (pomodoroStartTimeRef.current === null) return

      const now = Date.now()
      const elapsedMs = now - pomodoroStartTimeRef.current
      const elapsedSeconds = Math.floor(elapsedMs / 1000)
      const remainingSeconds = pomodoroBaseDurationRef.current - elapsedSeconds

      if (remainingSeconds <= 0) {
        // Timer finished
        playNotificationSound()
        setIsPomodoroRunning(false)
        pomodoroStartTimeRef.current = null

        if (pomodoroMode === 'work') {
          // Switch to break
          setPomodoroMode('break')
          const breakDuration = pomodoroConfig.breakMinutes * 60
          setPomodoroSeconds(breakDuration)
          pomodoroBaseDurationRef.current = breakDuration
          setPomodoroCount(prev => prev + 1)
          setMotivationalMessage('🎉 Excellent travail ! Prenez une pause bien méritée !')
        } else {
          // Switch to work
          setPomodoroMode('work')
          const workDuration = pomodoroConfig.workMinutes * 60
          setPomodoroSeconds(workDuration)
          pomodoroBaseDurationRef.current = workDuration
          const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
          setMotivationalMessage(randomMsg)
        }
      } else {
        setPomodoroSeconds(remainingSeconds)
      }
    }, 100) // Update every 100ms for smooth display

    return () => clearInterval(interval)
  }, [isPomodoroRunning, pomodoroMode, pomodoroConfig])

  // Generate motivational message periodically
  useEffect(() => {
    if (!isFocusMode) return

    const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
    setMotivationalMessage(randomMsg)

    const interval = setInterval(() => {
      const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
      setMotivationalMessage(randomMsg)
    }, 120000) // Every 2 minutes

    return () => clearInterval(interval)
  }, [isFocusMode])

  // ========== AUDIO ==========
  const playNotificationSound = () => {
    try {
      // Very gentle notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 600 // Softer frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // Much quieter
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Audio not supported')
    }
  }

  const playAmbientMusic = () => {
    try {
      if (ambientOscillatorRef.current) return // Already playing

      const audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Extended pentatonic scale with multiple octaves for more variety
      const pentatonicScale = [
        130.81, // C3
        146.83, // D3
        164.81, // E3
        196.00, // G3
        220.00, // A3
        261.63, // C4
        293.66, // D4
        329.63, // E4
        392.00, // G4
        440.00, // A4
        523.25, // C5
        587.33, // D5
      ]

      // Create 4 oscillators that will change notes over time
      const numVoices = 4
      const oscillators = []
      const gainNodes = []

      for (let i = 0; i < numVoices; i++) {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.type = 'sine'

        // Start with random note from scale
        const randomNote = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)]
        osc.frequency.value = randomNote

        // Start with volume at 0, will fade in
        gain.gain.setValueAtTime(0, audioContext.currentTime)

        osc.connect(gain)
        gain.connect(audioContext.destination)

        osc.start()

        oscillators.push(osc)
        gainNodes.push(gain)
      }

      // Function to animate the ambient music
      const animateMusic = () => {
        const now = audioContext.currentTime

        oscillators.forEach((osc, i) => {
          const gain = gainNodes[i]

          // Pick a new random note from the scale
          const newNote = pentatonicScale[Math.floor(Math.random() * pentatonicScale.length)]

          // Smoothly transition to new frequency over 3-5 seconds
          const transitionTime = 3 + Math.random() * 2
          osc.frequency.setValueAtTime(osc.frequency.value, now)
          osc.frequency.linearRampToValueAtTime(newNote, now + transitionTime)

          // Vary volume - some voices fade in, some fade out
          const shouldBeActive = Math.random() > 0.3 // 70% chance to be active
          const targetVolume = shouldBeActive ? (0.01 + Math.random() * 0.02) : 0

          gain.gain.setValueAtTime(gain.gain.value, now)
          gain.gain.linearRampToValueAtTime(targetVolume, now + transitionTime)
        })
      }

      // Initial animation
      animateMusic()

      // Change notes every 4-6 seconds for continuous variation
      const interval = setInterval(() => {
        if (ambientOscillatorRef.current) {
          animateMusic()
        } else {
          clearInterval(interval)
        }
      }, 4000 + Math.random() * 2000)

      // Store refs for cleanup
      ambientOscillatorRef.current = oscillators
      ambientGainNodeRef.current = gainNodes
      ambientIntervalRef.current = interval
      audioContextRef.current = audioContext
    } catch (error) {
      console.log('Ambient audio not supported')
    }
  }

  const stopAmbientMusic = () => {
    // Clear the interval
    if (ambientIntervalRef.current) {
      clearInterval(ambientIntervalRef.current)
      ambientIntervalRef.current = null
    }

    // Stop oscillators
    if (ambientOscillatorRef.current) {
      try {
        ambientOscillatorRef.current.forEach(osc => {
          osc.stop()
        })
      } catch (error) {
        console.log('Error stopping oscillators')
      }
      ambientOscillatorRef.current = null
      ambientGainNodeRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close()
      } catch (error) {
        console.log('Error closing audio context')
      }
      audioContextRef.current = null
    }
  }

  const triggerConfetti = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  // ========== HISTORY / NEW DAY ==========
  const openNewDayModal = () => {
    const today = new Date().toISOString().split('T')[0]
    setNewDayDate(today)
    setShowNewDayModal(true)
  }

  const archiveDay = () => {
    // Calculate completed tasks
    const completedTasks = tasks.filter(t => t.status === 'done')
    const totalProductiveSeconds = tasks.reduce((sum, t) => sum + t.secondsSpent, 0)

    // Use the selected date or today
    const archiveDate = newDayDate ? new Date(newDayDate) : new Date()

    // Create history entry
    const historyEntry = {
      id: Date.now(),
      date: archiveDate.toDateString(),
      dateISO: archiveDate.toISOString(),
      totalProductiveSeconds,
      feedback: dailyFeedback,
      energyLevel,
      satisfactionLevel,
      completedTasksCount: completedTasks.length,
      completedTasks: completedTasks.map(t => ({
        title: t.title,
        description: t.description,
        estimateMinutes: t.estimateMinutes,
        secondsSpent: t.secondsSpent
      }))
    }

    // Add to history
    setHistory([historyEntry, ...history])

    // Reset daily data
    setDailyFeedback('')
    setEnergyLevel(5)
    setSatisfactionLevel(5)

    // Remove completed tasks, keep incomplete ones
    setTasks(tasks.filter(t => t.status !== 'done'))

    // Keep inbox items as they are (don't reset checkboxes)
    // Inbox items stay untouched

    // Update current date
    setCurrentDate(archiveDate.toDateString())

    // Stop any running timer
    setIsRunning(false)
    setActiveTaskId(null)

    // Close modal
    setShowNewDayModal(false)
    setNewDayDate('')
  }

  const deleteHistoryEntry = (entryId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette journée de l\'historique ?')) {
      setHistory(history.filter(h => h.id !== entryId))
    }
  }

  // ========== TASK ACTIONS ==========
  const handleTaskClick = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === 'done') return

    // Just select the task, don't start timer automatically
    setActiveTaskId(taskId)
    setIsRunning(false) // User must click "Reprendre" to start timer
  }

  const handlePause = () => {
    setIsRunning(false)
    startTimeRef.current = null // Reset timing refs when pausing
    if (activeTaskId) {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTaskId ? { ...t, status: 'paused' } : t
        )
      )
    }
  }

  const handleResume = () => {
    if (activeTaskId) {
      const task = tasks.find(t => t.id === activeTaskId)
      if (task) {
        baseSecondsRef.current = task.secondsSpent
        startTimeRef.current = Date.now()
      }
    }

    setIsRunning(true)

    if (activeTaskId) {
      // Set active task to 'doing' and all others that were 'doing' to 'paused'
      setTasks(prevTasks =>
        prevTasks.map(t => {
          if (t.id === activeTaskId) {
            return { ...t, status: 'doing' }
          } else if (t.status === 'doing') {
            return { ...t, status: 'paused' }
          }
          return t
        })
      )
    }
  }

  const handleComplete = () => {
    if (activeTaskId === null) return

    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === activeTaskId ? { ...t, status: 'done' } : t
      )
    )
    setIsRunning(false)
    startTimeRef.current = null // Reset timing refs
    baseSecondsRef.current = 0
    setActiveTaskId(null)
    triggerConfetti()
    playNotificationSound()
  }

  const handleReactivateTask = (taskId, e) => {
    e.stopPropagation()
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === taskId ? { ...t, status: 'todo' } : t
      )
    )
  }

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const newTask = {
      id: Date.now(),
      title: newTaskTitle,
      description: newTaskDescription,
      estimateMinutes: parseInt(newTaskEstimate),
      status: 'todo',
      blockNote: '',
      secondsSpent: 0
    }

    setTasks([...tasks, newTask])

    // Add to task history (without duplicates of same title)
    const taskTemplate = {
      title: newTaskTitle,
      description: newTaskDescription,
      estimateMinutes: parseInt(newTaskEstimate),
      createdAt: Date.now()
    }

    // Check if similar task already exists in history
    const exists = taskHistory.some(t =>
      t.title.toLowerCase() === taskTemplate.title.toLowerCase() &&
      t.description === taskTemplate.description
    )

    if (!exists) {
      setTaskHistory([taskTemplate, ...taskHistory])
    }

    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskEstimate(30)
  }

  const recreateTaskFromHistory = (historyTask) => {
    const newTask = {
      id: Date.now(),
      title: historyTask.title,
      description: historyTask.description,
      estimateMinutes: historyTask.estimateMinutes,
      status: 'todo',
      blockNote: '',
      secondsSpent: 0
    }

    setTasks([...tasks, newTask])
  }

  const handleSelectTaskFromHistory = (e) => {
    const taskTitle = e.target.value
    if (!taskTitle) {
      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskEstimate(30)
      return
    }

    const selectedTask = taskHistory.find(t => t.title === taskTitle)
    if (selectedTask) {
      setNewTaskTitle(selectedTask.title)
      setNewTaskDescription(selectedTask.description)
      setNewTaskEstimate(selectedTask.estimateMinutes)
    }
  }

  const handleDeleteTask = (taskId, e) => {
    e.stopPropagation()
    if (activeTaskId === taskId) {
      setIsRunning(false)
      setActiveTaskId(null)
    }
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const handleBlockNoteChange = (e) => {
    const value = e.target.value
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === activeTaskId ? { ...t, blockNote: value } : t
      )
    )
  }

  // ========== DRAG AND DROP TASKS ==========
  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetTask) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.id === targetTask.id) return

    const draggedIndex = tasks.findIndex(t => t.id === draggedTask.id)
    const targetIndex = tasks.findIndex(t => t.id === targetTask.id)

    const newTasks = [...tasks]
    newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, draggedTask)

    setTasks(newTasks)
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
  }

  // ========== INBOX (À FAIRE) ==========
  const handleAddInboxItem = (e) => {
    e.preventDefault()
    if (!newInboxItem.trim()) return

    setInboxItems([...inboxItems, {
      id: Date.now(),
      text: newInboxItem,
      completed: false,
      category: inboxCategory,
      deadline: inboxDeadline || null // Add deadline if provided
    }])
    setNewInboxItem('')
    setInboxDeadline('') // Reset deadline after adding
  }

  const handleToggleInboxItem = (id) => {
    const updatedItems = inboxItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    )

    // Sort: uncompleted items first, completed items at the bottom
    const sortedItems = [
      ...updatedItems.filter(item => !item.completed),
      ...updatedItems.filter(item => item.completed)
    ]

    setInboxItems(sortedItems)
  }

  const handleRemoveInboxItem = (id) => {
    setInboxItems(inboxItems.filter(item => item.id !== id))
  }

  const handleCopyInboxItem = (item) => {
    setNewInboxItem(item.text)
    setInboxCategory(item.category || 'travail')
  }

  // Drag and drop for inbox
  const handleInboxDragStart = (e, item) => {
    setDraggedInboxItem(item)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleInboxDrop = (e, targetItem) => {
    e.preventDefault()
    if (!draggedInboxItem || draggedInboxItem.id === targetItem.id) return

    const draggedIndex = inboxItems.findIndex(i => i.id === draggedInboxItem.id)
    const targetIndex = inboxItems.findIndex(i => i.id === targetItem.id)

    const newItems = [...inboxItems]
    newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, draggedInboxItem)

    setInboxItems(newItems)
    setDraggedInboxItem(null)
  }

  const handleInboxDragEnd = () => {
    setDraggedInboxItem(null)
  }

  // ========== FOCUS MODE ==========
  const toggleFocusMode = () => {
    if (!isFocusMode && activeTaskId) {
      // Starting focus mode - show rocket animation first
      setIsLaunching(true)

      // After rocket animation (1.5s), show fullscreen focus mode
      setTimeout(() => {
        setIsLaunching(false)
        setIsFocusMode(true)
        setPomodoroMode('work')
        const workDuration = pomodoroConfig.workMinutes * 60
        setPomodoroSeconds(workDuration)
        pomodoroBaseDurationRef.current = workDuration
        pomodoroStartTimeRef.current = Date.now()
        setIsPomodoroRunning(true)

        // Start task timer automatically - initialize timing refs
        const task = tasks.find(t => t.id === activeTaskId)
        if (task) {
          baseSecondsRef.current = task.secondsSpent
          startTimeRef.current = Date.now()
        }
        setIsRunning(true)

        const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
        setMotivationalMessage(randomMsg)
      }, 1500)
    } else {
      // Stopping focus mode - keep timer running if it was running
      setIsFocusMode(false)
      setIsPomodoroRunning(false)
      pomodoroStartTimeRef.current = null
      // Don't reset timer refs here - let the timer continue if it was running
    }
  }

  const handleUnifiedPausePlay = () => {
    const newRunningState = !isRunning

    // Toggle task timer
    if (newRunningState) {
      // Starting - initialize timing refs
      if (activeTaskId) {
        const task = tasks.find(t => t.id === activeTaskId)
        if (task) {
          baseSecondsRef.current = task.secondsSpent
          startTimeRef.current = Date.now()
        }
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === activeTaskId ? { ...t, status: 'doing' } : t
          )
        )
      }
    } else {
      // Pausing - reset timing refs
      startTimeRef.current = null
      if (activeTaskId) {
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === activeTaskId ? { ...t, status: 'paused' } : t
          )
        )
      }
    }
    setIsRunning(newRunningState)

    // Toggle pomodoro timer
    setIsPomodoroRunning(newRunningState)
    if (newRunningState) {
      pomodoroStartTimeRef.current = Date.now()
    } else {
      pomodoroStartTimeRef.current = null
    }
  }

  const handlePomodoroToggle = () => {
    const newState = !isPomodoroRunning
    setIsPomodoroRunning(newState)
    if (newState) {
      pomodoroStartTimeRef.current = Date.now()
    } else {
      pomodoroStartTimeRef.current = null
    }
  }

  const handlePomodoroReset = () => {
    setPomodoroMode('work')
    const workDuration = pomodoroConfig.workMinutes * 60
    setPomodoroSeconds(workDuration)
    pomodoroBaseDurationRef.current = workDuration
    pomodoroStartTimeRef.current = null
    setIsPomodoroRunning(false)
  }

  // ========== KPI CALCULATIONS ==========
  const completedTasks = tasks.filter(t => t.status === 'done')
  const totalProductiveSeconds = tasks.reduce((sum, t) => sum + t.secondsSpent, 0)
  const totalProductiveHours = Math.floor(totalProductiveSeconds / 3600)
  const totalProductiveMinutes = Math.floor((totalProductiveSeconds % 3600) / 60)

  const calculateAverageDeviation = () => {
    const doneTasks = tasks.filter(t => t.status === 'done' && t.estimateMinutes > 0)
    if (doneTasks.length === 0) return 0

    const totalDeviation = doneTasks.reduce((sum, task) => {
      const estimatedSeconds = task.estimateMinutes * 60
      const deviation = ((task.secondsSpent - estimatedSeconds) / estimatedSeconds) * 100
      return sum + deviation
    }, 0)

    return Math.round(totalDeviation / doneTasks.length)
  }

  const averageDeviation = calculateAverageDeviation()
  const blockages = tasks.filter(t => t.blockNote && t.blockNote.trim())

  // ========== UTILITY FUNCTIONS ==========
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatPomodoroTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const activeTask = tasks.find(t => t.id === activeTaskId)

  // Time options in 15 min increments
  const timeOptions = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240]

  // Theme colors
  const themeClasses = theme === 'light' ? {
    bg: 'bg-gray-50',
    bgSecondary: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-400',
    border: 'border-gray-200',
    borderSecondary: 'border-gray-300',
    hover: 'hover:bg-gray-100',
    input: 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500',
    card: 'bg-white border-gray-200',
    header: 'bg-white border-gray-200',
    taskCard: 'bg-gray-50 border-gray-200 hover:border-gray-300',
    taskCardActive: 'bg-blue-50 border-blue-300',
    taskCardDone: 'bg-green-50 border-green-200',
    inboxItem: 'bg-gray-100 border-gray-200'
  } : {
    bg: 'bg-[#0a0a0a]',
    bgSecondary: 'bg-[#111]',
    text: 'text-neutral-200',
    textSecondary: 'text-neutral-400',
    textMuted: 'text-neutral-500',
    border: 'border-neutral-800',
    borderSecondary: 'border-neutral-700',
    hover: 'hover:bg-neutral-800',
    input: 'bg-neutral-900 border-neutral-700 text-neutral-200 placeholder-neutral-500',
    card: 'bg-[#111] border-neutral-800',
    header: 'bg-[#111] border-neutral-800',
    taskCard: 'bg-neutral-900 border-neutral-800 hover:border-neutral-700',
    taskCardActive: 'bg-blue-900/30 border-blue-600',
    taskCardDone: 'bg-green-900/20 border-green-800/50',
    inboxItem: 'bg-neutral-900 border-neutral-800'
  }

  // ========== RENDER ==========
  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
      {/* Header */}
      <header className={`border-b ${themeClasses.header}`}>
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">ProducHub</h1>
            {supabaseConfigured && (
              <div className="flex items-center gap-4">
                <div className={`text-sm ${themeClasses.textSecondary}`}>
                  {user?.displayName || user?.email}
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex gap-2">
            {['today', 'missions', 'analyze', 'history', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? theme === 'light' ? 'bg-blue-100 text-blue-900' : 'bg-neutral-700 text-white'
                    : `${themeClasses.textSecondary} ${themeClasses.hover}`
                }`}
              >
                {tab === 'today' && "Aujourd'hui"}
                {tab === 'missions' && '🎯 Missions'}
                {tab === 'analyze' && 'Analyse'}
                {tab === 'history' && 'Historique'}
                {tab === 'settings' && 'Paramètres'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {activeTab === 'today' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ========== COLUMN A: PLANIFIER ========== */}
            <div className="space-y-6">
              {/* À faire (Inbox with checkbox) */}
              <div className={`${themeClasses.card} border rounded-2xl p-6`}>
                <h2 className="text-lg font-semibold mb-4">
                  ✅ À faire
                  {inboxItems.length > 0 && (
                    <span className={`ml-2 text-sm font-normal ${themeClasses.textMuted}`}>
                      ({inboxItems.filter(item => !item.completed).length}/{inboxItems.length})
                    </span>
                  )}
                </h2>

                {/* Category Selector - Smaller and more subtle */}
                <div className="flex gap-1.5 mb-3">
                  <button
                    onClick={() => setInboxCategory('travail')}
                    className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      inboxCategory === 'travail'
                        ? theme === 'light'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-blue-900/20 text-blue-400 border border-blue-800/50'
                        : theme === 'light'
                        ? 'bg-gray-50 text-gray-500 border border-gray-200'
                        : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/50'
                    }`}
                  >
                    💼 Travail
                  </button>
                  <button
                    onClick={() => setInboxCategory('ecole')}
                    className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      inboxCategory === 'ecole'
                        ? theme === 'light'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-purple-900/20 text-purple-400 border border-purple-800/50'
                        : theme === 'light'
                        ? 'bg-gray-50 text-gray-500 border border-gray-200'
                        : 'bg-neutral-800/50 text-neutral-500 border border-neutral-700/50'
                    }`}
                  >
                    🎓 École
                  </button>
                </div>

                <form onSubmit={handleAddInboxItem} className="mb-4 space-y-2">
                  <input
                    type="text"
                    value={newInboxItem}
                    onChange={(e) => setNewInboxItem(e.target.value)}
                    placeholder="Ajouter une chose à faire..."
                    className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={inboxDeadline}
                      onChange={(e) => setInboxDeadline(e.target.value)}
                      className={`flex-1 ${themeClasses.input} rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      +
                    </button>
                  </div>
                </form>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {inboxItems
                    .sort((a, b) => {
                      // First sort by completed status (uncompleted first)
                      if (a.completed !== b.completed) {
                        return a.completed ? 1 : -1
                      }

                      // Then sort by deadline (items with deadline first, sorted by date)
                      const hasDeadlineA = !!a.deadline
                      const hasDeadlineB = !!b.deadline

                      if (hasDeadlineA && !hasDeadlineB) return -1
                      if (!hasDeadlineA && hasDeadlineB) return 1

                      if (hasDeadlineA && hasDeadlineB) {
                        return new Date(a.deadline) - new Date(b.deadline)
                      }

                      // Then sort by category (travail first, then école)
                      const catA = a.category || 'travail'
                      const catB = b.category || 'travail'
                      if (catA !== catB) {
                        return catA === 'travail' ? -1 : 1
                      }
                      return 0
                    })
                    .map(item => {
                      const category = item.category || 'travail'
                      const categoryColors = category === 'ecole'
                        ? theme === 'light'
                          ? 'bg-purple-50/50 border-purple-100'
                          : 'bg-purple-900/5 border-purple-900/20'
                        : theme === 'light'
                        ? 'bg-blue-50/50 border-blue-100'
                        : 'bg-blue-900/5 border-blue-900/20'

                      // Calculate deadline status
                      let deadlineColor = ''
                      let deadlineText = ''
                      if (item.deadline) {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const deadlineDate = new Date(item.deadline)
                        const diffTime = deadlineDate - today
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                        if (diffDays < 0) {
                          deadlineColor = 'text-red-600 font-semibold'
                          deadlineText = '🔴'
                        } else if (diffDays === 0) {
                          deadlineColor = 'text-orange-600 font-semibold'
                          deadlineText = '🟠'
                        } else if (diffDays <= 2) {
                          deadlineColor = 'text-orange-500'
                          deadlineText = '🟡'
                        } else {
                          deadlineColor = themeClasses.textMuted
                          deadlineText = '📅'
                        }
                      }

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleInboxDragStart(e, item)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleInboxDrop(e, item)}
                          onDragEnd={handleInboxDragEnd}
                          className={`${categoryColors} border rounded-lg p-3 flex items-center gap-3 cursor-move transition-all ${
                            draggedInboxItem?.id === item.id ? 'opacity-50' : ''
                          }`}
                        >
                          <span className={`${themeClasses.textMuted} text-xs cursor-grab`}>⋮⋮</span>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleInboxItem(item.id)}
                            className={`w-4 h-4 rounded ${theme === 'light' ? 'border-gray-400' : 'border-neutral-600'} text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer`}
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${item.completed ? `line-through ${themeClasses.textMuted}` : ''}`}>
                              {item.text}
                            </p>
                            {item.deadline && (
                              <p className={`text-[10px] ${deadlineColor} mt-1`}>
                                {deadlineText} {new Date(item.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyInboxItem(item)
                            }}
                            className={`${themeClasses.textMuted} hover:text-blue-400 text-xs transition-colors`}
                            title="Copier dans le champ"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => handleRemoveInboxItem(item.id)}
                            className={`${themeClasses.textMuted} hover:text-red-400 text-xs transition-colors`}
                          >
                            ✕
                          </button>
                        </div>
                      )
                    })}
                  {inboxItems.length === 0 && (
                    <p className={`text-[11px] ${themeClasses.textMuted} text-center py-4`}>Aucune chose à faire pour le moment</p>
                  )}
                </div>
              </div>

              {/* Add New Task */}
              <div className={`${themeClasses.card} border rounded-2xl p-6`}>
                <h2
                  className="text-lg font-semibold mb-4 cursor-pointer flex justify-between items-center hover:text-blue-500 transition-colors"
                  onClick={() => setIsNewTaskOpen(!isNewTaskOpen)}
                >
                  <span>➕ Nouvelle tâche</span>
                  <span className="text-sm">{isNewTaskOpen ? '▼' : '▶'}</span>
                </h2>

                {isNewTaskOpen && (
                  <form onSubmit={handleAddTask} className="space-y-3">
                  {/* Task History Selector */}
                  {taskHistory.length > 0 && (
                    <div>
                      <label className={`block text-xs ${themeClasses.textSecondary} mb-1`}>
                        Ou sélectionner une ancienne tâche
                      </label>
                      <select
                        onChange={handleSelectTaskFromHistory}
                        className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="">-- Nouvelle tâche --</option>
                        {taskHistory.map((histTask, idx) => (
                          <option key={idx} value={histTask.title}>
                            {histTask.title} ({histTask.estimateMinutes}min)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Titre de la tâche..."
                    className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Description courte..."
                    rows="2"
                    className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  <div className="flex gap-3">
                    <select
                      value={newTaskEstimate}
                      onChange={(e) => setNewTaskEstimate(e.target.value)}
                      className={`w-32 ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>
                          {time} min
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
                )}
              </div>
            </div>

            {/* ========== COLUMN B: BILAN DU JOUR ========== */}
            <div className="space-y-6">
              {/* KPIs */}
              <div className={`${themeClasses.card} border rounded-2xl p-6`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">📊 KPIs du jour</h2>
                  <button
                    onClick={openNewDayModal}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-3 py-1.5 font-medium transition-colors"
                  >
                    📅 Nouveau jour
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`bg-gradient-to-br ${theme === 'light' ? 'from-green-100 to-green-50 border-green-300' : 'from-green-900/30 to-green-800/20 border-green-800'} border rounded-xl p-4`}>
                    <div className="text-3xl font-bold mb-1">{completedTasks.length}</div>
                    <div className={`text-[11px] ${themeClasses.textSecondary}`}>Tâches terminées</div>
                  </div>

                  <div className={`bg-gradient-to-br ${theme === 'light' ? 'from-blue-100 to-blue-50 border-blue-300' : 'from-blue-900/30 to-blue-800/20 border-blue-800'} border rounded-xl p-4`}>
                    <div className="text-3xl font-bold mb-1">
                      {totalProductiveHours}h{totalProductiveMinutes.toString().padStart(2, '0')}
                    </div>
                    <div className={`text-[11px] ${themeClasses.textSecondary}`}>Temps productif</div>
                  </div>

                  <div className={`bg-gradient-to-br ${theme === 'light' ? 'from-purple-100 to-purple-50 border-purple-300' : 'from-purple-900/30 to-purple-800/20 border-purple-800'} border rounded-xl p-4`}>
                    <div className={`text-3xl font-bold mb-1 ${
                      averageDeviation > 0 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {averageDeviation > 0 ? '+' : ''}{averageDeviation}%
                    </div>
                    <div className={`text-[11px] ${themeClasses.textSecondary}`}>Écart moyen Est/Réel</div>
                  </div>

                  <div className={`bg-gradient-to-br ${theme === 'light' ? 'from-orange-100 to-orange-50 border-orange-300' : 'from-orange-900/30 to-orange-800/20 border-orange-800'} border rounded-xl p-4`}>
                    <div className="text-3xl font-bold mb-1">{blockages.length}</div>
                    <div className={`text-[11px] ${themeClasses.textSecondary}`}>Blocages</div>
                  </div>
                </div>

                {/* Blockages List */}
                {blockages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">⚠️ Blocages du jour</h3>
                    <div className="space-y-2">
                      {blockages.map(task => (
                        <div key={task.id} className={`${theme === 'light' ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-800/50'} border rounded-lg p-3`}>
                          <p className="text-xs font-medium mb-1">{task.title}</p>
                          <p className={`text-[11px] ${themeClasses.textSecondary}`}>{task.blockNote}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Personnel */}
              <div className={`${themeClasses.card} border rounded-2xl p-6`}>
                <h2
                  className="text-lg font-semibold mb-4 cursor-pointer flex justify-between items-center hover:text-purple-500 transition-colors"
                  onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                >
                  <span>💭 Feedback perso</span>
                  <span className="text-sm">{isFeedbackOpen ? '▼' : '▶'}</span>
                </h2>

                {isFeedbackOpen && (
                  <>
                    <textarea
                  value={dailyFeedback}
                  onChange={(e) => setDailyFeedback(e.target.value)}
                  placeholder="Comment s'est passée votre journée ? Qu'avez-vous appris ?"
                  rows="4"
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4`}
                />

                <div className="space-y-4">
                  <div>
                    <label className="flex justify-between text-sm mb-2">
                      <span>⚡ Énergie / Focus</span>
                      <span className="font-bold text-blue-400">{energyLevel}/10</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={energyLevel}
                      onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                      className={`w-full h-2 ${theme === 'light' ? 'bg-gray-300' : 'bg-neutral-700'} rounded-lg appearance-none cursor-pointer accent-blue-500`}
                    />
                  </div>

                  <div>
                    <label className="flex justify-between text-sm mb-2">
                      <span>😊 Satisfaction</span>
                      <span className="font-bold text-purple-400">{satisfactionLevel}/10</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={satisfactionLevel}
                      onChange={(e) => setSatisfactionLevel(parseInt(e.target.value))}
                      className={`w-full h-2 ${theme === 'light' ? 'bg-gray-300' : 'bg-neutral-700'} rounded-lg appearance-none cursor-pointer accent-purple-500`}
                    />
                  </div>
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'missions' && (
          <MissionsView
            missions={missions}
            setMissions={setMissions}
            tasks={tasks}
            activeTaskId={activeTaskId}
            isRunning={isRunning}
            isFocusMode={isFocusMode}
            draggedTask={draggedTask}
            handleTaskClick={handleTaskClick}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            handleUnifiedPausePlay={handleUnifiedPausePlay}
            handleComplete={handleComplete}
            handleDeleteTask={handleDeleteTask}
            toggleFocusMode={toggleFocusMode}
            formatTime={formatTime}
            formatPomodoroTime={formatPomodoroTime}
            pomodoroMode={pomodoroMode}
            pomodoroSeconds={pomodoroSeconds}
            isPomodoroRunning={isPomodoroRunning}
            pomodoroCount={pomodoroCount}
            handlePomodoroToggle={handlePomodoroToggle}
            handlePomodoroReset={handlePomodoroReset}
            theme={theme}
            themeClasses={themeClasses}
          />
        )}

        {activeTab === 'analyze' && (
          <div className={`${themeClasses.card} border rounded-2xl p-8`}>
            <h2 className="text-2xl font-bold mb-4">📈 Analyse de performance</h2>
            <div className={`space-y-4 ${themeClasses.textSecondary}`}>
              <p className="text-sm">Cette section affichera vos tendances de productivité au fil du temps :</p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Évolution du temps productif par jour (graphique)</li>
                <li>Écart moyen Estimé vs Réel dans le temps</li>
                <li>Analyse des blocages récurrents</li>
                <li>Tendances d'énergie et de satisfaction</li>
                <li>Meilleurs et pires jours de la semaine</li>
                <li>Catégories de tâches les plus chronophages</li>
              </ul>
              <div className={`mt-6 p-6 ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-xl`}>
                <p className={`text-xs ${themeClasses.textMuted} text-center`}>
                  📊 Les graphiques et analyses détaillées seront disponibles prochainement
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className={`${themeClasses.card} border rounded-2xl p-6`}>
              <h2 className="text-2xl font-bold mb-6">📅 Historique</h2>

              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className={`${themeClasses.textMuted} mb-2`}>Aucun historique pour le moment</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>
                    Cliquez sur "📅 Nouveau jour" pour archiver votre journée actuelle
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map(entry => {
                    const hours = Math.floor(entry.totalProductiveSeconds / 3600)
                    const minutes = Math.floor((entry.totalProductiveSeconds % 3600) / 60)

                    return (
                      <div
                        key={entry.id}
                        className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-xl p-6`}
                      >
                        {/* Date header */}
                        <div className={`flex justify-between items-start mb-4 pb-4 border-b ${themeClasses.border}`}>
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{entry.date}</h3>
                            <p className={`text-xs ${themeClasses.textMuted}`}>
                              {new Date(entry.dateISO).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-400">
                                {hours}h{minutes.toString().padStart(2, '0')}
                              </div>
                              <div className={`text-xs ${themeClasses.textMuted}`}>Temps productif</div>
                            </div>
                            <button
                              onClick={() => deleteHistoryEntry(entry.id)}
                              className={`${themeClasses.textMuted} hover:text-red-400 transition-colors`}
                              title="Supprimer cette journée"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* KPIs Grid */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-800/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-400">{entry.completedTasksCount}</div>
                            <div className={`text-[10px] ${themeClasses.textSecondary}`}>Tâches terminées</div>
                          </div>
                          <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border border-purple-800/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-purple-400">{entry.energyLevel}/10</div>
                            <div className={`text-[10px] ${themeClasses.textSecondary}`}>Énergie</div>
                          </div>
                          <div className="bg-gradient-to-br from-pink-900/20 to-pink-800/10 border border-pink-800/50 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-pink-400">{entry.satisfactionLevel}/10</div>
                            <div className={`text-[10px] ${themeClasses.textSecondary}`}>Satisfaction</div>
                          </div>
                        </div>

                        {/* Feedback */}
                        {entry.feedback && (
                          <div className="mb-4">
                            <h4 className={`text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>💭 Remarques</h4>
                            <div className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg p-3`}>
                              <p className={`text-sm ${themeClasses.text}`}>{entry.feedback}</p>
                            </div>
                          </div>
                        )}

                        {/* Completed Tasks */}
                        {entry.completedTasks.length > 0 && (
                          <div>
                            <h4 className={`text-sm font-semibold mb-2 ${themeClasses.textSecondary}`}>
                              ✅ Tâches accomplies ({entry.completedTasks.length})
                            </h4>
                            <div className="space-y-2">
                              {entry.completedTasks.map((task, idx) => {
                                const taskMinutes = Math.floor(task.secondsSpent / 60)
                                const deviation = taskMinutes - task.estimateMinutes

                                return (
                                  <div
                                    key={idx}
                                    className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg p-3`}
                                  >
                                    <div className="flex justify-between items-start mb-1">
                                      <h5 className="text-sm font-medium">{task.title}</h5>
                                      <div className={`text-xs ${themeClasses.textMuted}`}>
                                        {taskMinutes}min
                                      </div>
                                    </div>
                                    {task.description && (
                                      <p className={`text-xs ${themeClasses.textMuted} mb-2`}>{task.description}</p>
                                    )}
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className={themeClasses.textMuted}>
                                        Estimé: {task.estimateMinutes}min
                                      </span>
                                      <span className={deviation > 0 ? 'text-orange-400' : 'text-green-400'}>
                                        Écart: {deviation > 0 ? '+' : ''}{deviation}min
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={`${themeClasses.card} border rounded-2xl p-8`}>
            <h2 className="text-2xl font-bold mb-6">⚙️ Paramètres</h2>

            <div className="space-y-6">
              {/* Theme Setting */}
              <div className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-xl p-6`}>
                <h3 className="text-lg font-semibold mb-4">🎨 Apparence</h3>

                <div>
                  <label className="block text-sm font-medium mb-3">Thème</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : theme === 'light'
                          ? 'bg-gray-200 text-gray-700 border-2 border-gray-300 hover:bg-gray-300'
                          : 'bg-neutral-800 text-neutral-300 border-2 border-neutral-700 hover:bg-neutral-700'
                      }`}
                    >
                      🌙 Mode sombre
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                        theme === 'light'
                          ? 'bg-blue-600 text-white border-2 border-blue-500'
                          : theme === 'dark'
                          ? 'bg-neutral-800 text-neutral-300 border-2 border-neutral-700 hover:bg-neutral-700'
                          : 'bg-gray-200 text-gray-700 border-2 border-gray-300 hover:bg-gray-300'
                      }`}
                    >
                      ☀️ Mode clair
                    </button>
                  </div>
                </div>
              </div>

              {/* Pomodoro Configuration */}
              <div className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-xl p-6`}>
                <h3 className="text-lg font-semibold mb-4">⏱️ Configuration Pomodoro</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-3">Type de Pomodoro</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPomodoroConfig({ workMinutes: 25, breakMinutes: 5 })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                          pomodoroConfig.workMinutes === 25 && pomodoroConfig.breakMinutes === 5
                            ? 'bg-blue-600 text-white border-blue-500'
                            : theme === 'light'
                            ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        <div className="text-lg">🍅 Classique</div>
                        <div className="text-xs mt-1 opacity-80">25 min / 5 min</div>
                      </button>

                      <button
                        onClick={() => setPomodoroConfig({ workMinutes: 50, breakMinutes: 10 })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                          pomodoroConfig.workMinutes === 50 && pomodoroConfig.breakMinutes === 10
                            ? 'bg-blue-600 text-white border-blue-500'
                            : theme === 'light'
                            ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        <div className="text-lg">🚀 Deep Work</div>
                        <div className="text-xs mt-1 opacity-80">50 min / 10 min</div>
                      </button>

                      <button
                        onClick={() => setPomodoroConfig({ workMinutes: 90, breakMinutes: 20 })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                          pomodoroConfig.workMinutes === 90 && pomodoroConfig.breakMinutes === 20
                            ? 'bg-blue-600 text-white border-blue-500'
                            : theme === 'light'
                            ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        <div className="text-lg">⚡ Ultra Focus</div>
                        <div className="text-xs mt-1 opacity-80">90 min / 20 min</div>
                      </button>

                      <button
                        onClick={() => setPomodoroConfig({ workMinutes: 15, breakMinutes: 3 })}
                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                          pomodoroConfig.workMinutes === 15 && pomodoroConfig.breakMinutes === 3
                            ? 'bg-blue-600 text-white border-blue-500'
                            : theme === 'light'
                            ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                            : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700'
                        }`}
                      >
                        <div className="text-lg">⚡ Sprint</div>
                        <div className="text-xs mt-1 opacity-80">15 min / 3 min</div>
                      </button>
                    </div>
                  </div>

                  <div className={`${theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'} border rounded-lg p-3`}>
                    <p className="text-xs">
                      <strong>Actuel :</strong> {pomodoroConfig.workMinutes} min travail / {pomodoroConfig.breakMinutes} min pause
                    </p>
                  </div>
                </div>
              </div>

              {/* Firebase Status */}
              {!supabaseConfigured && (
                <div className={`${themeClasses.bgSecondary} border-2 ${theme === 'light' ? 'border-blue-300 bg-blue-50' : 'border-blue-800 bg-blue-900/20'} rounded-xl p-6`}>
                  <h3 className="text-lg font-semibold mb-4">🔄 Synchronisation multi-appareils</h3>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Actuellement, vos données sont stockées <strong>uniquement sur cet appareil</strong> (localStorage).
                  </p>
                  <div className={`${theme === 'light' ? 'bg-white' : 'bg-black/30'} rounded-lg p-4 mb-4`}>
                    <p className="text-sm mb-2"><strong>✨ Activez Firebase pour :</strong></p>
                    <ul className={`list-disc list-inside space-y-1 text-sm ${themeClasses.textSecondary} ml-4`}>
                      <li>Accéder à vos données depuis n'importe quel appareil</li>
                      <li>Synchronisation automatique en temps réel</li>
                      <li>Sauvegarde cloud sécurisée</li>
                      <li>Connexion avec votre compte Google</li>
                    </ul>
                  </div>
                  <a
                    href="https://github.com/okba69/Telecharger-RJ/blob/main/SUPABASE_SETUP.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    📖 Guide de configuration Firebase
                  </a>
                </div>
              )}

              {supabaseConfigured && (
                <div className={`${themeClasses.bgSecondary} border-2 ${theme === 'light' ? 'border-green-300 bg-green-50' : 'border-green-800 bg-green-900/20'} rounded-xl p-6`}>
                  <h3 className="text-lg font-semibold mb-2">✅ Firebase activé</h3>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    Vos données sont synchronisées dans le cloud. Connectez-vous avec le même compte Google sur vos autres appareils pour accéder à vos données.
                  </p>
                </div>
              )}

              {/* Future settings placeholder */}
              <div className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-xl p-6`}>
                <h3 className="text-lg font-semibold mb-4">⏰ Paramètres à venir</h3>
                <ul className={`list-disc list-inside space-y-2 text-sm ${themeClasses.textSecondary} ml-4`}>
                  <li>Heure de début de journée (par défaut 9h00)</li>
                  <li>Rappels automatiques (pause, hydratation, étirements)</li>
                  <li>Objectif de temps productif quotidien</li>
                  <li>Notifications pour les tâches dépassant l'estimation</li>
                  <li>Export automatique du bilan quotidien (PDF, JSON, CSV)</li>
                  <li>Intégration calendrier (Google Calendar, Outlook)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rocket Launch Animation */}
      {isLaunching && (
        <div className="rocket-overlay">
          <div className="rocket">🚀</div>
        </div>
      )}

      {/* Fullscreen Focus Mode */}
      {isFocusMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-fade-in" style={{
          background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4c1d95, #5b21b6)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite'
        }}>
          {/* Animated gradient overlay */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15), transparent 50%)',
            backgroundSize: '200% 200%',
            animation: 'pulse 8s ease-in-out infinite'
          }} />

          {/* Close button */}
          <button
            onClick={toggleFocusMode}
            className="absolute top-8 right-8 text-white/60 hover:text-white text-2xl transition-colors z-10"
          >
            ✕
          </button>

          {/* Main content */}
          <div className="relative max-w-3xl w-full">
            {/* Task info */}
            <div className="text-center mb-8 focus-fade-in">
              <h2 className="text-3xl font-bold mb-3 text-white">{activeTask?.title}</h2>
              <p className="text-lg text-purple-200">{activeTask?.description}</p>
            </div>

            {/* MAIN DISPLAY: Task Time - BIG */}
            <div className="flex justify-center mb-12 focus-zoom-in">
              <div className="text-center">
                <div className="text-[120px] leading-none font-bold font-mono text-white mb-4">
                  {formatTime(activeTask?.secondsSpent || 0)}
                </div>
                <div className="text-2xl text-purple-300 uppercase tracking-wider mb-2">
                  Temps de la tâche
                </div>
                <div className="text-sm text-purple-400">
                  Estimé: {activeTask?.estimateMinutes}min •
                  Écart: {Math.floor((activeTask?.secondsSpent || 0) / 60) - (activeTask?.estimateMinutes || 0)}min
                </div>
              </div>
            </div>

            {/* Pomodoro Section - Smaller */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-6">
                {/* Pomodoro Timer - Smaller Circle */}
                <div className="relative flex-shrink-0">
                  <svg width="140" height="140" className="transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="70"
                      cy="70"
                      r="60"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="70"
                      cy="70"
                      r="60"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={377}
                      strokeDashoffset={377 * (1 - (pomodoroMode === 'work' ? (25 * 60 - pomodoroSeconds) / (25 * 60) : (5 * 60 - pomodoroSeconds) / (5 * 60)))}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Timer in center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold font-mono text-white">
                      {formatPomodoroTime(pomodoroSeconds)}
                    </div>
                    <div className="text-[10px] text-purple-300 uppercase tracking-wider">
                      {pomodoroMode === 'work' ? '🎯 Focus' : '☕ Break'}
                    </div>
                  </div>
                </div>

                {/* Pomodoro Info and Controls */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-3">Mode Pomodoro</h3>

                  {/* Cycle Visualization */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-xs text-purple-300">Cycle actuel</div>
                      <div className="text-sm font-bold text-white">🍅 {pomodoroCount}</div>
                    </div>
                    <div className="flex gap-1 h-2">
                      {/* 25min work blocks */}
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={`work-${i}`}
                          className={`flex-[5] rounded ${
                            i < pomodoroCount
                              ? 'bg-purple-500'
                              : i === pomodoroCount && pomodoroMode === 'work'
                              ? 'bg-purple-400 animate-pulse'
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                      {/* 5min break blocks */}
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={`break-${i}`}
                          className={`flex-[1] rounded ${
                            i < pomodoroCount
                              ? 'bg-pink-500'
                              : i === pomodoroCount && pomodoroMode === 'break'
                              ? 'bg-pink-400 animate-pulse'
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-purple-400 mt-1">
                      <span>25min × 4</span>
                      <span>5min × 4</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleUnifiedPausePlay}
                      className="flex-1 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-white text-sm font-semibold transition-all"
                    >
                      {isRunning ? '⏸️ Pause Tout' : '▶️ Lancer Tout'}
                    </button>
                    <button
                      onClick={handlePomodoroReset}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm font-semibold transition-all"
                    >
                      🔄
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            {motivationalMessage && (
              <div className="text-center breathe">
                <div className="inline-block bg-gradient-to-r from-yellow-400/30 to-orange-400/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-yellow-400/30">
                  <p className="text-xl font-semibold text-white">{motivationalMessage}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confetti */}
      {showConfetti && (
        <>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                backgroundColor: ['#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </>
      )}

      {/* New Day Modal */}
      {showNewDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${themeClasses.card} border rounded-2xl p-6 max-w-md w-full mx-4 animate-fade-in`}>
            <h3 className="text-xl font-bold mb-4">📅 Nouveau jour</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Date de la journée à archiver</label>
              <input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              <p className={`text-xs ${themeClasses.textMuted} mt-2`}>
                Par défaut : {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg p-4 mb-4`}>
              <p className="text-sm mb-2">Cette action va :</p>
              <ul className={`text-xs ${themeClasses.textSecondary} space-y-1 ml-4`}>
                <li>• Archiver toutes les tâches terminées</li>
                <li>• Sauvegarder les KPIs et feedback du jour</li>
                <li>• Conserver les tâches non terminées</li>
                <li>• Garder les items "À faire" intacts</li>
                <li>• Réinitialiser les niveaux énergie/satisfaction</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewDayModal(false)}
                className={`flex-1 ${theme === 'light' ? 'bg-gray-300 hover:bg-gray-400 text-gray-800' : 'bg-neutral-800 hover:bg-neutral-700 text-white'} rounded-lg px-4 py-2 font-medium transition-colors`}
              >
                Annuler
              </button>
              <button
                onClick={archiveDay}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 font-medium transition-colors"
              >
                Archiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskCoachApp
