import { useState, useEffect, useRef } from 'react'

function TaskCoachApp() {
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
  const lastTickRef = useRef(Date.now())

  // Inbox (renamed to "À faire")
  const [inboxItems, setInboxItems] = useState(() => loadFromStorage('inboxItems', []))
  const [newInboxItem, setNewInboxItem] = useState('')

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskEstimate, setNewTaskEstimate] = useState(30)

  // Daily feedback
  const [dailyFeedback, setDailyFeedback] = useState(() => loadFromStorage('dailyFeedback', ''))
  const [energyLevel, setEnergyLevel] = useState(() => loadFromStorage('energyLevel', 5))
  const [satisfactionLevel, setSatisfactionLevel] = useState(() => loadFromStorage('satisfactionLevel', 5))

  // Focus mode & Pomodoro
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [pomodoroMode, setPomodoroMode] = useState('work') // 'work' | 'break'
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60) // 25 minutes
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false)
  const pomodoroTickRef = useRef(Date.now())
  const [motivationalMessage, setMotivationalMessage] = useState('')
  const [pomodoroCount, setPomodoroCount] = useState(0)

  // Drag and drop
  const [draggedTask, setDraggedTask] = useState(null)
  const [draggedInboxItem, setDraggedInboxItem] = useState(null)

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

  // ========== PERSISTENCE ==========
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('inboxItems', JSON.stringify(inboxItems))
  }, [inboxItems])

  useEffect(() => {
    localStorage.setItem('dailyFeedback', dailyFeedback)
  }, [dailyFeedback])

  useEffect(() => {
    localStorage.setItem('energyLevel', JSON.stringify(energyLevel))
  }, [energyLevel])

  useEffect(() => {
    localStorage.setItem('satisfactionLevel', JSON.stringify(satisfactionLevel))
  }, [satisfactionLevel])

  // ========== TIMER LOGIC ==========
  useEffect(() => {
    if (!isRunning || activeTaskId === null) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaSeconds = Math.floor((now - lastTickRef.current) / 1000)

      if (deltaSeconds >= 1) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeTaskId
              ? { ...task, secondsSpent: task.secondsSpent + deltaSeconds }
              : task
          )
        )
        lastTickRef.current = now
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, activeTaskId])

  // ========== POMODORO TIMER ==========
  useEffect(() => {
    if (!isPomodoroRunning) return

    const interval = setInterval(() => {
      const now = Date.now()
      const deltaSeconds = Math.floor((now - pomodoroTickRef.current) / 1000)

      if (deltaSeconds >= 1) {
        setPomodoroSeconds(prev => {
          const newSeconds = prev - deltaSeconds
          if (newSeconds <= 0) {
            // Timer finished
            playNotificationSound()
            if (pomodoroMode === 'work') {
              setPomodoroMode('break')
              setPomodoroSeconds(5 * 60) // 5 min break
              setPomodoroCount(prev => prev + 1)
              setMotivationalMessage('🎉 Excellent travail ! Prenez une pause bien méritée !')
            } else {
              setPomodoroMode('work')
              setPomodoroSeconds(25 * 60) // 25 min work
              const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
              setMotivationalMessage(randomMsg)
            }
            return pomodoroMode === 'work' ? 5 * 60 : 25 * 60
          }
          return newSeconds
        })
        pomodoroTickRef.current = now
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPomodoroRunning, pomodoroMode])

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
    if (activeTaskId) {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === activeTaskId ? { ...t, status: 'paused' } : t
        )
      )
    }
  }

  const handleResume = () => {
    setIsRunning(true)
    lastTickRef.current = Date.now()
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
    setNewTaskTitle('')
    setNewTaskDescription('')
    setNewTaskEstimate(30)
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

    setInboxItems([...inboxItems, { id: Date.now(), text: newInboxItem, completed: false }])
    setNewInboxItem('')
  }

  const handleToggleInboxItem = (id) => {
    setInboxItems(inboxItems.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const handleRemoveInboxItem = (id) => {
    setInboxItems(inboxItems.filter(item => item.id !== id))
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
        setPomodoroSeconds(25 * 60)
        setIsPomodoroRunning(true)
        pomodoroTickRef.current = Date.now()
        const randomMsg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
        setMotivationalMessage(randomMsg)
      }, 1500)
    } else {
      // Stopping focus mode
      setIsFocusMode(false)
      setIsPomodoroRunning(false)
    }
  }

  const handlePomodoroToggle = () => {
    setIsPomodoroRunning(!isPomodoroRunning)
    if (!isPomodoroRunning) {
      pomodoroTickRef.current = Date.now()
    }
  }

  const handlePomodoroReset = () => {
    setPomodoroMode('work')
    setPomodoroSeconds(25 * 60)
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

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-neutral-200">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-[#111]">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">ProductivityHub</h1>

          {/* Tabs */}
          <nav className="flex gap-2">
            {['today', 'analyze', 'history', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                {tab === 'today' && "Aujourd'hui"}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ========== COLUMN A: PLANIFIER ========== */}
            <div className="space-y-6">
              {/* À faire (Inbox with checkbox) */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">✅ À faire</h2>

                <form onSubmit={handleAddInboxItem} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInboxItem}
                      onChange={(e) => setNewInboxItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddInboxItem(e)}
                      placeholder="Ajouter une chose à faire..."
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      +
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {inboxItems.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleInboxDragStart(e, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleInboxDrop(e, item)}
                      onDragEnd={handleInboxDragEnd}
                      className={`bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center gap-3 cursor-move transition-all ${
                        draggedInboxItem?.id === item.id ? 'opacity-50' : ''
                      }`}
                    >
                      <span className="text-neutral-600 text-xs cursor-grab">⋮⋮</span>
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleInboxItem(item.id)}
                        className="w-4 h-4 rounded border-neutral-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <p className={`text-sm flex-1 ${item.completed ? 'line-through text-neutral-500' : ''}`}>
                        {item.text}
                      </p>
                      <button
                        onClick={() => handleRemoveInboxItem(item.id)}
                        className="text-neutral-500 hover:text-red-400 text-xs transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {inboxItems.length === 0 && (
                    <p className="text-[11px] text-neutral-500 text-center py-4">Aucune chose à faire pour le moment</p>
                  )}
                </div>
              </div>

              {/* Add New Task */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">➕ Nouvelle tâche</h2>

                <form onSubmit={handleAddTask} className="space-y-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Titre de la tâche..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <textarea
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    placeholder="Description courte..."
                    rows="2"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-3">
                    <select
                      value={newTaskEstimate}
                      onChange={(e) => setNewTaskEstimate(e.target.value)}
                      className="w-32 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </div>
            </div>

            {/* ========== COLUMN B: EXÉCUTER ========== */}
            <div className="space-y-6">
              {/* Task List */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">📋 Mes tâches</h2>
                  <button
                    onClick={toggleFocusMode}
                    disabled={!activeTaskId}
                    className={`text-xs rounded-lg px-3 py-1 transition-colors ${
                      activeTaskId
                        ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                        : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    🎯 Mode Focus
                  </button>
                </div>

                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 text-center py-8">
                      Aucune tâche. Créez-en une pour commencer !
                    </p>
                  ) : (
                    tasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, task)}
                        onDragEnd={handleDragEnd}
                        onClick={() => task.status !== 'done' && handleTaskClick(task.id)}
                        className={`border rounded-lg p-4 cursor-move transition-all ${
                          task.id === activeTaskId
                            ? 'bg-blue-900/30 border-blue-600'
                            : task.status === 'done'
                            ? 'bg-green-900/20 border-green-800/50 opacity-60'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                        } ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-neutral-600 text-xs cursor-grab">⋮⋮</span>
                            <h3 className="text-sm font-semibold flex-1">{task.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-1 rounded ${
                              task.status === 'todo' ? 'bg-neutral-700 text-neutral-300' :
                              task.status === 'doing' ? 'bg-blue-700 text-blue-200' :
                              task.status === 'paused' ? 'bg-yellow-700 text-yellow-200' :
                              'bg-green-700 text-green-200'
                            }`}>
                              {task.status === 'todo' ? 'À faire' :
                               task.status === 'doing' ? 'En cours' :
                               task.status === 'paused' ? 'En pause' :
                               'Terminé'}
                            </span>
                            {task.status === 'done' && (
                              <button
                                onClick={(e) => handleReactivateTask(task.id, e)}
                                className="text-neutral-500 hover:text-blue-400 text-sm transition-colors"
                                title="Réactiver la tâche"
                              >
                                🔄
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="text-neutral-500 hover:text-red-400 text-sm transition-colors"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-neutral-400 mb-2">{task.description}</p>
                        <div className="flex justify-between items-center text-[11px] text-neutral-500">
                          <span>⏱️ Estimé: {task.estimateMinutes}min</span>
                          <span>⏲️ Réel: {Math.floor(task.secondsSpent / 60)}min</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Task Timer */}
              {activeTask && (
                <div className={`rounded-2xl p-6 transition-all duration-500 ${
                  isFocusMode
                    ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-pink-900/60 border-2 border-purple-500 shadow-2xl shadow-purple-500/20 scale-105'
                    : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700'
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                      {isFocusMode ? '🎯 Mode Focus' : '⏱️ Tâche active'}
                    </h2>
                    {isFocusMode && (
                      <button
                        onClick={toggleFocusMode}
                        className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                      >
                        ✕ Quitter
                      </button>
                    )}
                  </div>

                  {/* Pomodoro Timer (only in focus mode) */}
                  {isFocusMode && (
                    <div className="bg-black/30 rounded-xl p-4 mb-4 text-center animate-fade-in">
                      <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider">
                        {pomodoroMode === 'work' ? '🎯 Travail Focus' : '☕ Pause'}
                      </div>
                      <div className="text-6xl font-bold font-mono mb-2">
                        {formatPomodoroTime(pomodoroSeconds)}
                      </div>
                      <div className="text-[10px] text-neutral-500 mb-3">
                        🍅 Pomodoros: {pomodoroCount}
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={handlePomodoroToggle}
                          className="px-4 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          {isPomodoroRunning ? '⏸️ Pause' : '▶️ Démarrer'}
                        </button>
                        <button
                          onClick={handlePomodoroReset}
                          className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                        >
                          🔄 Reset
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Motivational Message (only in focus mode) */}
                  {isFocusMode && motivationalMessage && (
                    <div className="mb-4 text-center animate-pulse">
                      <div className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-lg px-4 py-2">
                        <p className="text-sm font-semibold">{motivationalMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2">{activeTask.title}</h3>
                    <p className="text-sm text-neutral-300">{activeTask.description}</p>
                  </div>

                  <div className="bg-black/30 rounded-xl p-6 mb-4">
                    <div className="text-5xl font-mono font-bold text-center mb-2">
                      {formatTime(activeTask.secondsSpent)}
                    </div>
                    <div className="flex justify-center gap-4 text-[11px] text-neutral-400">
                      <span>Estimé: {activeTask.estimateMinutes}min</span>
                      <span>|</span>
                      <span className={
                        activeTask.secondsSpent > activeTask.estimateMinutes * 60
                          ? 'text-orange-400'
                          : 'text-green-400'
                      }>
                        Écart: {Math.floor(activeTask.secondsSpent / 60) - activeTask.estimateMinutes}min
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {isRunning ? (
                      <button
                        onClick={handlePause}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
                      >
                        ⏸️ Pause
                      </button>
                    ) : (
                      <button
                        onClick={handleResume}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
                      >
                        {activeTask.secondsSpent === 0 ? '▶️ Démarrer' : '▶️ Reprendre'}
                      </button>
                    )}
                    <button
                      onClick={handleComplete}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-3 font-medium transition-colors"
                    >
                      ✅ Terminé
                    </button>
                  </div>

                  {/* Block Note */}
                  <div>
                    <label className="block text-sm font-medium mb-2">⚠️ Blocage actuel ?</label>
                    <textarea
                      value={activeTask.blockNote}
                      onChange={handleBlockNoteChange}
                      placeholder="Décrivez le problème rencontré..."
                      rows="3"
                      className="w-full bg-neutral-900/50 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {!activeTask && (
                <div className="bg-[#111] border border-neutral-800 rounded-2xl p-8 text-center">
                  <p className="text-neutral-500 mb-2">Aucune tâche active</p>
                  <p className="text-[11px] text-neutral-600">Cliquez sur une tâche pour démarrer le chrono</p>
                </div>
              )}
            </div>

            {/* ========== COLUMN C: BILAN DU JOUR ========== */}
            <div className="space-y-6">
              {/* KPIs */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">📊 KPIs du jour</h2>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-800 rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1">{completedTasks.length}</div>
                    <div className="text-[11px] text-neutral-400">Tâches terminées</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-800 rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1">
                      {totalProductiveHours}h{totalProductiveMinutes.toString().padStart(2, '0')}
                    </div>
                    <div className="text-[11px] text-neutral-400">Temps productif</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-800 rounded-xl p-4">
                    <div className={`text-3xl font-bold mb-1 ${
                      averageDeviation > 0 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {averageDeviation > 0 ? '+' : ''}{averageDeviation}%
                    </div>
                    <div className="text-[11px] text-neutral-400">Écart moyen Est/Réel</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-800 rounded-xl p-4">
                    <div className="text-3xl font-bold mb-1">{blockages.length}</div>
                    <div className="text-[11px] text-neutral-400">Blocages</div>
                  </div>
                </div>

                {/* Blockages List */}
                {blockages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">⚠️ Blocages du jour</h3>
                    <div className="space-y-2">
                      {blockages.map(task => (
                        <div key={task.id} className="bg-orange-900/20 border border-orange-800/50 rounded-lg p-3">
                          <p className="text-xs font-medium mb-1">{task.title}</p>
                          <p className="text-[11px] text-neutral-400">{task.blockNote}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Personnel */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">💭 Feedback perso</h2>

                <textarea
                  value={dailyFeedback}
                  onChange={(e) => setDailyFeedback(e.target.value)}
                  placeholder="Comment s'est passée votre journée ? Qu'avez-vous appris ?"
                  rows="4"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
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
                      className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
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
                      className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">📈 Analyse de performance</h2>
            <div className="space-y-4 text-neutral-400">
              <p className="text-sm">Cette section affichera vos tendances de productivité au fil du temps :</p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Évolution du temps productif par jour (graphique)</li>
                <li>Écart moyen Estimé vs Réel dans le temps</li>
                <li>Analyse des blocages récurrents</li>
                <li>Tendances d'énergie et de satisfaction</li>
                <li>Meilleurs et pires jours de la semaine</li>
                <li>Catégories de tâches les plus chronophages</li>
              </ul>
              <div className="mt-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 text-center">
                  📊 Les graphiques et analyses détaillées seront disponibles prochainement
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">📅 Historique</h2>
            <div className="space-y-4 text-neutral-400">
              <p className="text-sm">
                Cette section conservera l'historique complet de vos journées de travail :
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Liste de toutes vos journées passées</li>
                <li>Détails des tâches accomplies chaque jour</li>
                <li>Blocages rencontrés et comment vous les avez résolus</li>
                <li>Évolution de votre énergie et satisfaction</li>
                <li>Recherche et filtres par date, catégorie, mots-clés</li>
              </ul>
              <div className="mt-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 text-center">
                  💾 L'historique sera automatiquement sauvegardé à la fin de chaque journée
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-[#111] border border-neutral-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-4">⚙️ Paramètres</h2>
            <div className="space-y-4 text-neutral-400">
              <p className="text-sm">Personnalisez votre expérience de productivité :</p>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Heure de début de journée (par défaut 9h00)</li>
                <li>Durée d'un bloc focus (Pomodoro 25min, Deep Work 50min, Custom...)</li>
                <li>Rappels automatiques (pause, hydratation, étirements)</li>
                <li>Objectif de temps productif quotidien</li>
                <li>Notifications pour les tâches dépassant l'estimation</li>
                <li>Export automatique du bilan quotidien (PDF, JSON, CSV)</li>
                <li>Thème (Dark, Light, Auto)</li>
                <li>Intégration calendrier (Google Calendar, Outlook)</li>
              </ul>
              <div className="mt-6 p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 text-center">
                  🔧 Les options de configuration seront disponibles prochainement
                </p>
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
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 flex items-center justify-center p-8 animate-fade-in">
          {/* Background stars */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={toggleFocusMode}
            className="absolute top-8 right-8 text-white/60 hover:text-white text-2xl transition-colors z-10"
          >
            ✕
          </button>

          {/* Main content */}
          <div className="relative max-w-2xl w-full">
            {/* Task info */}
            <div className="text-center mb-8 focus-fade-in">
              <h2 className="text-3xl font-bold mb-3 text-white">{activeTask?.title}</h2>
              <p className="text-lg text-purple-200">{activeTask?.description}</p>
            </div>

            {/* Circular Progress with Timer */}
            <div className="flex justify-center mb-8 focus-zoom-in">
              <div className="relative">
                {/* SVG Circular Progress */}
                <svg width="280" height="280" className="transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="140"
                    cy="140"
                    r="120"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={754}
                    strokeDashoffset={754 * (1 - (pomodoroMode === 'work' ? (25 * 60 - pomodoroSeconds) / (25 * 60) : (5 * 60 - pomodoroSeconds) / (5 * 60)))}
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
                  <div className="text-7xl font-bold font-mono text-white mb-2">
                    {formatPomodoroTime(pomodoroSeconds)}
                  </div>
                  <div className="text-sm text-purple-300 uppercase tracking-wider">
                    {pomodoroMode === 'work' ? '🎯 Focus Session' : '☕ Break Time'}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 mb-8 focus-fade-in">
              <button
                onClick={handlePomodoroToggle}
                className="px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl text-white font-semibold text-lg transition-all transform hover:scale-105"
              >
                {isPomodoroRunning ? '⏸️ Pause' : '▶️ Start'}
              </button>
              <button
                onClick={handlePomodoroReset}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl text-white font-semibold text-lg transition-all transform hover:scale-105"
              >
                🔄 Reset
              </button>
            </div>

            {/* Motivational Message */}
            {motivationalMessage && (
              <div className="text-center breathe">
                <div className="inline-block bg-gradient-to-r from-yellow-400/30 to-orange-400/30 backdrop-blur-sm rounded-2xl px-8 py-4 border border-yellow-400/30">
                  <p className="text-xl font-semibold text-white">{motivationalMessage}</p>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-8 flex justify-center gap-6 text-center focus-fade-in">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-white">🍅 {pomodoroCount}</div>
                <div className="text-xs text-purple-300">Pomodoros</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-white">{formatTime(activeTask?.secondsSpent || 0)}</div>
                <div className="text-xs text-purple-300">Total Time</div>
              </div>
            </div>
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
    </div>
  )
}

export default TaskCoachApp
