import { useState } from 'react'

function MissionsView({
  missions,
  setMissions,
  tasks,
  activeTaskId,
  isRunning,
  isFocusMode,
  draggedTask,
  handleTaskClick,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleUnifiedPausePlay,
  handleMarkDone,
  handleDeleteTask,
  toggleFocusMode,
  formatTime,
  formatPomodoroTime,
  pomodoroMode,
  pomodoroSeconds,
  isPomodoroRunning,
  pomodoroCount,
  handlePomodoroToggle,
  handlePomodoroReset,
  theme,
  themeClasses
}) {
  // Safety check: ensure all required props are provided
  if (!tasks || !Array.isArray(tasks)) {
    return <div className="p-8 text-center text-red-500">Erreur: tasks invalide</div>
  }

  if (!missions || !Array.isArray(missions)) {
    return <div className="p-8 text-center text-red-500">Erreur: missions invalide</div>
  }

  if (!themeClasses) {
    return <div className="p-8 text-center text-red-500">Erreur: themeClasses manquant</div>
  }

  try {
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionDescription, setNewMissionDescription] = useState('')
  const [newMissionCategory, setNewMissionCategory] = useState('work')
  const [expandedMissionId, setExpandedMissionId] = useState(null)
  const [draggedSubtask, setDraggedSubtask] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all') // all, doing, paused, done
  const [sortBy, setSortBy] = useState('recent') // recent, progress, alphabetical

  // ========== CONSTANTS ==========
  const categories = {
    work: { label: '💼 Travail', color: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50', bgDark: 'bg-blue-950/30', borderLight: 'border-blue-300', borderDark: 'border-blue-800' },
    school: { label: '📚 École', color: 'from-purple-500 to-purple-600', bgLight: 'bg-purple-50', bgDark: 'bg-purple-950/30', borderLight: 'border-purple-300', borderDark: 'border-purple-800' },
    personal: { label: '🏠 Personnel', color: 'from-green-500 to-green-600', bgLight: 'bg-green-50', bgDark: 'bg-green-950/30', borderLight: 'border-green-300', borderDark: 'border-green-800' }
  }

  const statusIcons = {
    doing: '🕓',
    paused: '⏸️',
    done: '✅'
  }

  const statusLabels = {
    doing: 'En cours',
    paused: 'En pause',
    done: 'Terminée'
  }

  // ========== MISSION MANAGEMENT ==========
  const handleAddMission = (e) => {
    e.preventDefault()
    if (!newMissionTitle.trim()) return

    const newMission = {
      id: Date.now(),
      title: newMissionTitle,
      description: newMissionDescription,
      category: newMissionCategory,
      status: 'doing',
      subtasks: [],
      createdAt: Date.now()
    }

    setMissions([...missions, newMission])
    setNewMissionTitle('')
    setNewMissionDescription('')
    setNewMissionCategory('work')
    setExpandedMissionId(newMission.id) // Auto-expand new mission
  }

  const handleChangeStatus = (missionId, newStatus) => {
    setMissions(missions.map(mission =>
      mission.id === missionId ? { ...mission, status: newStatus } : mission
    ))
  }

  const handleDeleteMission = (missionId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette mission ?')) {
      setMissions(missions.filter(m => m.id !== missionId))
    }
  }

  // ========== SUBTASK MANAGEMENT ==========
  const handleAddSubtask = (missionId, text) => {
    if (!text.trim()) return

    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        const newSubtask = {
          id: Date.now(),
          text,
          completed: false,
          estimateMinutes: 0,
          secondsSpent: 0,
          note: ''
        }
        return { ...mission, subtasks: [...mission.subtasks, newSubtask] }
      }
      return mission
    }))
  }

  const handleToggleSubtask = (missionId, subtaskId) => {
    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        const updatedSubtasks = mission.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )

        // Auto-update mission status based on subtasks (only if not manually paused)
        let newStatus = mission.status
        if (mission.status !== 'paused') {
          const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed)
          newStatus = allCompleted ? 'done' : 'doing'
        }

        return { ...mission, subtasks: updatedSubtasks, status: newStatus }
      }
      return mission
    }))
  }

  const handleDeleteSubtask = (missionId, subtaskId) => {
    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        return {
          ...mission,
          subtasks: mission.subtasks.filter(st => st.id !== subtaskId)
        }
      }
      return mission
    }))
  }

  const handleUpdateSubtaskText = (missionId, subtaskId, newText) => {
    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        return {
          ...mission,
          subtasks: mission.subtasks.map(st =>
            st.id === subtaskId ? { ...st, text: newText } : st
          )
        }
      }
      return mission
    }))
  }

  // ========== DRAG AND DROP ==========
  const handleSubtaskDragStart = (e, subtask) => {
    setDraggedSubtask(subtask)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleSubtaskDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleSubtaskDrop = (e, missionId, targetSubtask) => {
    e.preventDefault()
    if (!draggedSubtask || draggedSubtask.id === targetSubtask.id) return

    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        const draggedIndex = mission.subtasks.findIndex(st => st.id === draggedSubtask.id)
        const targetIndex = mission.subtasks.findIndex(st => st.id === targetSubtask.id)

        const newSubtasks = [...mission.subtasks]
        newSubtasks.splice(draggedIndex, 1)
        newSubtasks.splice(targetIndex, 0, draggedSubtask)

        return { ...mission, subtasks: newSubtasks }
      }
      return mission
    }))

    setDraggedSubtask(null)
  }

  // ========== PROGRESS CALCULATION ==========
  const calculateProgress = (mission) => {
    if (mission.subtasks.length === 0) return 0
    const completed = mission.subtasks.filter(st => st.completed).length
    return Math.round((completed / mission.subtasks.length) * 100)
  }

  // ========== FILTER & SORT ==========
  const getFilteredAndSortedMissions = () => {
    let filtered = missions

    // Apply filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.status === filterStatus)
    }

    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'progress') {
        return calculateProgress(b) - calculateProgress(a)
      } else if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title)
      } else { // recent
        return b.createdAt - a.createdAt
      }
    })

    return sorted
  }

  const activeTask = tasks.find(t => t.id === activeTaskId)

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Hero Section */}
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          🎯 Missions & Sous-missions
        </h1>
        <p className={`text-sm sm:text-base ${themeClasses.textSecondary} max-w-2xl mx-auto`}>
          Planifie, organise et suis la progression de tes missions au quotidien
        </p>
      </div>

      {/* Tasks Management Section - From Today Tab */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mes tâches */}
        <div className={`${themeClasses.card} border rounded-2xl p-6 shadow-lg`}>
          <h2 className="text-lg font-semibold mb-4">📋 Mes tâches</h2>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-2">
            {tasks.length === 0 ? (
              <p className={`text-sm ${themeClasses.textMuted} text-center py-8`}>
                Aucune tâche. Créez-en une pour commencer !
              </p>
            ) : (
              [...tasks]
                .sort((a, b) => {
                  if (a.id === activeTaskId) return -1
                  if (b.id === activeTaskId) return 1
                  if (a.status === 'done' && b.status !== 'done') return 1
                  if (a.status !== 'done' && b.status === 'done') return -1
                  return 0
                })
                .map(task => (
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
                        ? themeClasses.taskCardActive
                        : task.status === 'done'
                        ? `${themeClasses.taskCardDone} opacity-60`
                        : themeClasses.taskCard
                    } ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className={`${themeClasses.textMuted} text-xs cursor-grab`}>⋮⋮</span>
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">{task.title}</h3>
                          {task.estimateMinutes > 0 && (
                            <p className={`text-[10px] ${themeClasses.textMuted}`}>
                              Estimé: {task.estimateMinutes} min
                            </p>
                          )}
                        </div>
                      </div>
                      {task.id === activeTaskId && (
                        <span className="text-xs px-2 py-0.5 bg-blue-600 text-white rounded-full animate-pulse">
                          Active
                        </span>
                      )}
                    </div>

                    {task.id === activeTaskId && (
                      <div className="flex items-center justify-between pt-2 border-t border-blue-700/30">
                        <span className="text-xs font-mono font-bold text-blue-400">
                          {formatTime(task.secondsSpent)}
                        </span>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Tâche active */}
        <div className={`${themeClasses.card} rounded-2xl p-6 shadow-lg ${
          isFocusMode
            ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-pink-900/60 border-2 border-purple-500 shadow-2xl shadow-purple-500/20'
            : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {isFocusMode ? '🎯 Mode Focus' : '⏱️ Tâche active'}
            </h2>
            <div className="flex gap-2">
              {!isFocusMode && (
                <button
                  onClick={toggleFocusMode}
                  className="text-xs rounded-lg px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  🎯 Mode Focus
                </button>
              )}
              {isFocusMode && (
                <button
                  onClick={toggleFocusMode}
                  className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  ✕ Quitter
                </button>
              )}
            </div>
          </div>

          {isFocusMode && (
            <div className="bg-black/30 rounded-xl p-4 mb-4 text-center">
              <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-wider">
                {pomodoroMode === 'work' ? '🎯 Travail Focus' : '☕ Pause'}
              </div>
              <div className="text-5xl font-bold font-mono mb-2">
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
                  🔄 Réinitialiser
                </button>
              </div>
            </div>
          )}

          {activeTask ? (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 ${theme === 'light' ? 'bg-white/10' : 'bg-black/20'}`}>
                <h3 className="font-bold text-lg mb-2">{activeTask.title}</h3>
                {activeTask.estimateMinutes > 0 && (
                  <p className={`text-xs ${themeClasses.textMuted} mb-2`}>
                    Estimé: {activeTask.estimateMinutes} min
                  </p>
                )}
                <div className="text-3xl font-mono font-bold text-center py-4">
                  {formatTime(activeTask.secondsSpent)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUnifiedPausePlay}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 text-sm font-bold transition-all"
                >
                  {isRunning ? '⏸️ Pause' : '▶️ Démarrer'}
                </button>
                <button
                  onClick={handleMarkDone}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-3 text-sm font-bold transition-all"
                >
                  ✓ Terminer
                </button>
              </div>

              <button
                onClick={(e) => handleDeleteTask(activeTaskId, e)}
                className={`w-full ${themeClasses.textMuted} hover:text-red-400 text-xs transition-colors`}
              >
                🗑️ Supprimer la tâche
              </button>
            </div>
          ) : (
            <p className={`text-sm ${themeClasses.textMuted} text-center py-12`}>
              Aucune tâche active.<br />Sélectionnez une tâche pour commencer.
            </p>
          )}
        </div>
      </div>

      {/* Add New Mission - Modern Design */}
      <div className={`${themeClasses.card} border-2 ${theme === 'light' ? 'border-blue-200' : 'border-blue-900'} rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 shadow-lg hover:shadow-xl transition-all duration-300`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
            ➕
          </div>
          <h3 className="text-xl font-bold">Créer une nouvelle mission</h3>
        </div>

        <form onSubmit={handleAddMission} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>
              Titre de la mission *
            </label>
            <input
              type="text"
              value={newMissionTitle}
              onChange={(e) => setNewMissionTitle(e.target.value)}
              placeholder="Ex: Finaliser le projet de fin d'année..."
              className={`w-full ${themeClasses.input} rounded-xl px-4 py-3 text-sm border-2 ${theme === 'light' ? 'border-gray-200 focus:border-blue-500' : 'border-neutral-700 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>
              Description (optionnelle)
            </label>
            <textarea
              value={newMissionDescription}
              onChange={(e) => setNewMissionDescription(e.target.value)}
              placeholder="Décris les objectifs et détails de ta mission..."
              rows="3"
              className={`w-full ${themeClasses.input} rounded-xl px-4 py-3 text-sm border-2 ${theme === 'light' ? 'border-gray-200 focus:border-blue-500' : 'border-neutral-700 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.textSecondary}`}>
              Catégorie
            </label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewMissionCategory(key)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all ${
                    newMissionCategory === key
                      ? `bg-gradient-to-r ${cat.color} text-white border-transparent shadow-lg scale-105`
                      : `${theme === 'light' ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-neutral-900 border-neutral-700 hover:border-neutral-600'}`
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-4 text-base font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            🚀 Créer la mission
          </button>
        </form>
      </div>

      {/* Filter & Sort Controls */}
      {missions.length > 0 && (
        <div className={`${themeClasses.card} border rounded-xl p-4 sm:p-5 mb-6 shadow-md`}>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            {/* Filter by Status */}
            <div className="flex-1">
              <label className={`block text-xs font-medium mb-2 ${themeClasses.textSecondary}`}>
                Filtrer par statut
              </label>
              <div className="flex flex-wrap gap-2">
                {['all', 'doing', 'paused', 'done'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white shadow-md'
                        : `${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-neutral-800 hover:bg-neutral-700'}`
                    }`}
                  >
                    {status === 'all' ? '📋 Toutes' : `${statusIcons[status]} ${statusLabels[status]}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex-1">
              <label className={`block text-xs font-medium mb-2 ${themeClasses.textSecondary}`}>
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'light' ? 'border-gray-200' : 'border-neutral-700'}`}
              >
                <option value="recent">📅 Plus récentes</option>
                <option value="progress">📊 Progression</option>
                <option value="alphabetical">🔤 Alphabétique</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Missions List */}
      <div className="space-y-5">
        {missions.length === 0 ? (
          <div className={`${themeClasses.card} border-2 border-dashed ${theme === 'light' ? 'border-gray-300' : 'border-neutral-700'} rounded-2xl p-12 text-center`}>
            <div className="text-6xl mb-4">🎯</div>
            <p className={`text-lg font-medium mb-2`}>Aucune mission créée</p>
            <p className={`text-sm ${themeClasses.textMuted}`}>
              Commence par créer ta première mission ci-dessus !
            </p>
          </div>
        ) : (
          getFilteredAndSortedMissions().map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isExpanded={expandedMissionId === mission.id}
              onToggleExpand={() => setExpandedMissionId(
                expandedMissionId === mission.id ? null : mission.id
              )}
              onDelete={() => handleDeleteMission(mission.id)}
              onChangeStatus={(newStatus) => handleChangeStatus(mission.id, newStatus)}
              onAddSubtask={(text) => handleAddSubtask(mission.id, text)}
              onToggleSubtask={(subtaskId) => handleToggleSubtask(mission.id, subtaskId)}
              onDeleteSubtask={(subtaskId) => handleDeleteSubtask(mission.id, subtaskId)}
              onUpdateSubtaskText={(subtaskId, text) => handleUpdateSubtaskText(mission.id, subtaskId, text)}
              onSubtaskDragStart={handleSubtaskDragStart}
              onSubtaskDragOver={handleSubtaskDragOver}
              onSubtaskDrop={(e, targetSubtask) => handleSubtaskDrop(e, mission.id, targetSubtask)}
              calculateProgress={calculateProgress}
              categories={categories}
              statusIcons={statusIcons}
              statusLabels={statusLabels}
              theme={theme}
              themeClasses={themeClasses}
              draggedSubtask={draggedSubtask}
            />
          ))
        )}
      </div>
    </div>
  )
  } catch (error) {
    console.error('Erreur dans MissionsView:', error)
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 text-lg font-bold mb-4">⚠️ Erreur lors du chargement de la page Missions</div>
        <div className="text-sm text-gray-600 mb-2">Détails: {error.message}</div>
        <div className="text-xs text-gray-500">Vérifiez la console pour plus d'informations</div>
      </div>
    )
  }
}

// ========== MISSION CARD COMPONENT ==========
function MissionCard({
  mission,
  isExpanded,
  onToggleExpand,
  onDelete,
  onChangeStatus,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtaskText,
  onSubtaskDragStart,
  onSubtaskDragOver,
  onSubtaskDrop,
  calculateProgress,
  categories,
  statusIcons,
  statusLabels,
  theme,
  themeClasses,
  draggedSubtask
}) {
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [editText, setEditText] = useState('')
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const progress = calculateProgress(mission)
  const completedCount = mission.subtasks.filter(st => st.completed).length
  const totalCount = mission.subtasks.length
  const category = categories[mission.category || 'work']

  const handleAddSubtaskSubmit = (e) => {
    e.preventDefault()
    if (newSubtaskText.trim()) {
      onAddSubtask(newSubtaskText)
      setNewSubtaskText('')
    }
  }

  const handleStartEdit = (subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditText(subtask.text)
  }

  const handleSaveEdit = (subtaskId) => {
    if (editText.trim()) {
      onUpdateSubtaskText(subtaskId, editText)
    }
    setEditingSubtaskId(null)
    setEditText('')
  }

  return (
    <div className={`${themeClasses.card} border-2 ${theme === 'light' ? category.borderLight : category.borderDark} rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 ${isExpanded ? 'ring-2 ring-blue-500/30' : ''}`}>
      {/* Mission Header */}
      <div
        className={`p-5 sm:p-6 cursor-pointer ${themeClasses.hover} transition-all relative overflow-hidden`}
        onClick={onToggleExpand}
      >
        {/* Category Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5`} />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="text-xl sm:text-2xl font-bold truncate">{mission.title}</h3>

                {/* Category Badge */}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${theme === 'light' ? category.bgLight : category.bgDark} flex-shrink-0`}>
                  {category.label}
                </span>
              </div>

              {mission.description && (
                <p className={`text-sm ${themeClasses.textSecondary} leading-relaxed`}>{mission.description}</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {/* Status Dropdown */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStatusMenu(!showStatusMenu)
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    mission.status === 'done'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : mission.status === 'paused'
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {statusIcons[mission.status]} {statusLabels[mission.status]}
                  <span className="text-[10px]">▼</span>
                </button>

                {showStatusMenu && (
                  <div className={`absolute right-0 mt-1 ${themeClasses.card} border rounded-lg shadow-xl z-20 min-w-[140px]`}>
                    {['doing', 'paused', 'done'].map(status => (
                      <button
                        key={status}
                        onClick={(e) => {
                          e.stopPropagation()
                          onChangeStatus(status)
                          setShowStatusMenu(false)
                        }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2 ${
                          mission.status === status ? 'font-bold' : ''
                        }`}
                      >
                        {statusIcons[status]} {statusLabels[status]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className={`${themeClasses.textMuted} hover:text-red-400 transition-colors text-lg`}
                  title="Supprimer"
                >
                  🗑️
                </button>
                <span className="text-2xl transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>
                  ▶
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className={`font-medium ${themeClasses.textMuted}`}>
                  {completedCount} / {totalCount} sous-tâches complétées
                </span>
                <span className="font-bold text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {progress}%
                </span>
              </div>
              <div className={`w-full h-3 ${theme === 'light' ? 'bg-gray-200' : 'bg-neutral-800'} rounded-full overflow-hidden shadow-inner`}>
                <div
                  className={`h-full bg-gradient-to-r ${category.color} transition-all duration-500 ease-out shadow-lg`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks (Expanded) */}
      {isExpanded && (
        <div className={`border-t-2 ${theme === 'light' ? category.borderLight : category.borderDark} p-5 sm:p-6 ${theme === 'light' ? 'bg-gray-50/50' : 'bg-neutral-900/30'}`}>
          {/* Subtasks List */}
          <div className="space-y-3 mb-5">
            {mission.subtasks.length === 0 ? (
              <p className={`text-center ${themeClasses.textMuted} py-4 text-sm`}>
                Aucune sous-tâche. Commence par en ajouter une !
              </p>
            ) : (
              mission.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  draggable
                  onDragStart={(e) => onSubtaskDragStart(e, subtask)}
                  onDragOver={onSubtaskDragOver}
                  onDrop={(e) => onSubtaskDrop(e, subtask)}
                  className={`${
                    theme === 'light' ? 'bg-white border-gray-300' : 'bg-neutral-900 border-neutral-700'
                  } border-2 rounded-xl p-3 sm:p-4 flex items-center gap-3 transition-all duration-200 hover:shadow-md ${
                    draggedSubtask?.id === subtask.id ? 'opacity-50 scale-95' : 'hover:scale-[1.01]'
                  } ${subtask.completed ? 'opacity-70' : ''}`}
                >
                  <span className={`${themeClasses.textMuted} text-sm cursor-grab hover:text-blue-500 transition-colors`}>
                    ⋮⋮
                  </span>

                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => onToggleSubtask(subtask.id)}
                    className="w-5 h-5 rounded-md text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                  />

                  {editingSubtaskId === subtask.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => handleSaveEdit(subtask.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(subtask.id)
                        if (e.key === 'Escape') setEditingSubtaskId(null)
                      }}
                      className={`flex-1 ${themeClasses.input} rounded-lg px-3 py-2 text-sm border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`flex-1 text-sm sm:text-base ${subtask.completed ? `line-through ${themeClasses.textMuted}` : 'font-medium'}`}
                      onDoubleClick={() => handleStartEdit(subtask)}
                    >
                      {subtask.text}
                    </span>
                  )}

                  <button
                    onClick={() => handleStartEdit(subtask)}
                    className={`${themeClasses.textMuted} hover:text-blue-500 text-base transition-colors flex-shrink-0`}
                    title="Modifier"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={() => onDeleteSubtask(subtask.id)}
                    className={`${themeClasses.textMuted} hover:text-red-500 text-base transition-colors flex-shrink-0`}
                    title="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add Subtask Form */}
          <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="Ajouter une sous-tâche..."
              className={`flex-1 ${themeClasses.input} rounded-xl px-4 py-3 text-sm border-2 ${theme === 'light' ? 'border-gray-300 focus:border-blue-500' : 'border-neutral-700 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all`}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4 sm:px-6 py-3 text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              ➕ Ajouter
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default MissionsView
