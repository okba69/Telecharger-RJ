import { useState, useEffect, useRef } from 'react'

function TaskCoachApp() {
  // ========== STATE MANAGEMENT ==========
  const [activeTab, setActiveTab] = useState('today')

  // Tasks state
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Préparer slide "Qualité des données PA"',
      description: 'Expliquer snapshot, job time, fuseau horaire.',
      estimateMinutes: 45,
      status: 'doing',
      blockNote: '',
      secondsSpent: 0
    },
    {
      id: 2,
      title: 'Rédiger notes soutenance',
      description: 'Structurer les points clés',
      estimateMinutes: 30,
      status: 'todo',
      blockNote: '',
      secondsSpent: 0
    }
  ])

  // Active task tracking
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const lastTickRef = useRef(Date.now())

  // Daily goals and inbox
  const [dailyGoals, setDailyGoals] = useState([
    { id: 1, text: 'Finaliser le dashboard SLA', criteria: 'Toutes les métriques affichées correctement' }
  ])
  const [inboxItems, setInboxItems] = useState([])
  const [newInboxItem, setNewInboxItem] = useState('')
  const [newGoalText, setNewGoalText] = useState('')
  const [newGoalCriteria, setNewGoalCriteria] = useState('')

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskEstimate, setNewTaskEstimate] = useState(30)

  // Daily feedback
  const [dailyFeedback, setDailyFeedback] = useState('')
  const [energyLevel, setEnergyLevel] = useState(5)
  const [satisfactionLevel, setSatisfactionLevel] = useState(5)

  // Focus mode
  const [isFocusMode, setIsFocusMode] = useState(false)

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

  // ========== TASK ACTIONS ==========
  const handleTaskClick = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === 'done') return

    setActiveTaskId(taskId)
    setIsRunning(true)
    lastTickRef.current = Date.now()

    if (task.status === 'todo') {
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, status: 'doing' } : t
        )
      )
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleResume = () => {
    setIsRunning(true)
    lastTickRef.current = Date.now()
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

  const handleBlockNoteChange = (e) => {
    const value = e.target.value
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === activeTaskId ? { ...t, blockNote: value } : t
      )
    )
  }

  // ========== INBOX & GOALS ==========
  const handleAddInboxItem = (e) => {
    e.preventDefault()
    if (!newInboxItem.trim()) return

    setInboxItems([...inboxItems, { id: Date.now(), text: newInboxItem }])
    setNewInboxItem('')
  }

  const handleRemoveInboxItem = (id) => {
    setInboxItems(inboxItems.filter(item => item.id !== id))
  }

  const handleAddGoal = (e) => {
    e.preventDefault()
    if (!newGoalText.trim()) return

    setDailyGoals([...dailyGoals, { id: Date.now(), text: newGoalText, criteria: newGoalCriteria }])
    setNewGoalText('')
    setNewGoalCriteria('')
  }

  const handleRemoveGoal = (id) => {
    setDailyGoals(dailyGoals.filter(goal => goal.id !== id))
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

  const activeTask = tasks.find(t => t.id === activeTaskId)

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
              {/* Daily Goals */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">🎯 Objectifs du jour</h2>

                <form onSubmit={handleAddGoal} className="mb-4 space-y-2">
                  <input
                    type="text"
                    value={newGoalText}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    placeholder="Nouvel objectif..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={newGoalCriteria}
                    onChange={(e) => setNewGoalCriteria(e.target.value)}
                    placeholder="Critère de succès..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    + Ajouter
                  </button>
                </form>

                <div className="space-y-2">
                  {dailyGoals.map(goal => (
                    <div key={goal.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium">{goal.text}</p>
                        <button
                          onClick={() => handleRemoveGoal(goal.id)}
                          className="text-neutral-500 hover:text-red-400 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      {goal.criteria && (
                        <p className="text-[11px] text-neutral-500">→ {goal.criteria}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inbox */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">📥 Inbox rapide</h2>

                <form onSubmit={handleAddInboxItem} className="mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInboxItem}
                      onChange={(e) => setNewInboxItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddInboxItem(e)}
                      placeholder="Yannick demande X..."
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
                    <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex justify-between items-center">
                      <p className="text-sm">{item.text}</p>
                      <button
                        onClick={() => handleRemoveInboxItem(item.id)}
                        className="text-neutral-500 hover:text-red-400 text-xs ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {inboxItems.length === 0 && (
                    <p className="text-[11px] text-neutral-500 text-center py-4">Aucune demande pour le moment</p>
                  )}
                </div>
              </div>
            </div>

            {/* ========== COLUMN B: EXÉCUTER ========== */}
            <div className="space-y-6">
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
                    <input
                      type="number"
                      value={newTaskEstimate}
                      onChange={(e) => setNewTaskEstimate(e.target.value)}
                      placeholder="Estimation (min)"
                      min="1"
                      className="w-32 bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
              </div>

              {/* Task List */}
              <div className="bg-[#111] border border-neutral-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">📋 Mes tâches</h2>
                  <button
                    onClick={() => setIsFocusMode(!isFocusMode)}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-3 py-1 transition-colors"
                  >
                    {isFocusMode ? '🔙 Mode Normal' : '🎯 Mode Focus'}
                  </button>
                </div>

                <div className="space-y-2">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => task.status !== 'done' && handleTaskClick(task.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        task.id === activeTaskId
                          ? 'bg-blue-900/30 border-blue-600'
                          : task.status === 'done'
                          ? 'bg-green-900/20 border-green-800/50 opacity-60'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold">{task.title}</h3>
                        <span className={`text-[10px] px-2 py-1 rounded ${
                          task.status === 'todo' ? 'bg-neutral-700 text-neutral-300' :
                          task.status === 'doing' ? 'bg-blue-700 text-blue-200' :
                          'bg-green-700 text-green-200'
                        }`}>
                          {task.status === 'todo' ? 'À faire' : task.status === 'doing' ? 'En cours' : 'Terminé'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mb-2">{task.description}</p>
                      <div className="flex justify-between items-center text-[11px] text-neutral-500">
                        <span>⏱️ Estimé: {task.estimateMinutes}min</span>
                        <span>⏲️ Réel: {Math.floor(task.secondsSpent / 60)}min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Task Timer */}
              {activeTask && (
                <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-4">⏱️ Tâche active</h2>

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
                        ▶️ Reprendre
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
    </div>
  )
}

export default TaskCoachApp
