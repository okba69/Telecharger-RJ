import { useState, useEffect } from 'react'

function MissionsView({
  missions,
  setMissions,
  tasks,
  setTasks,
  activeSubtaskId,
  setActiveSubtaskId,
  isRunning,
  setIsRunning,
  startTimeRef,
  baseSecondsRef,
  isFocusMode,
  setIsFocusMode,
  pomodoroMode,
  setPomodoroMode,
  pomodoroSeconds,
  setPomodoroSeconds,
  isPomodoroRunning,
  setIsPomodoroRunning,
  pomodoroStartTimeRef,
  pomodoroBaseDurationRef,
  pomodoroCount,
  pomodoroConfig,
  theme,
  themeClasses
}) {
  // UI State
  const [expandedMissionId, setExpandedMissionId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [editText, setEditText] = useState('')

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  // Form state
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionCategory, setNewMissionCategory] = useState('work')
  const [newMissionDescription, setNewMissionDescription] = useState('')
  const [newSubtaskText, setNewSubtaskText] = useState({})

  // Constants
  const categories = {
    work: { label: '💼 Travail', color: 'blue', gradient: 'from-blue-500 to-blue-600', bg: 'bg-blue-600' },
    school: { label: '📚 École', color: 'purple', gradient: 'from-purple-500 to-purple-600', bg: 'bg-purple-600' },
    personal: { label: '🏠 Personnel', color: 'green', gradient: 'from-green-500 to-green-600', bg: 'bg-green-600' }
  }

  const statusIcons = {
    doing: '🕓',
    paused: '⏸️',
    done: '✅'
  }

  // MIGRATION: Convert old tasks to individual missions
  useEffect(() => {
    if (tasks && tasks.length > 0 && !localStorage.getItem('tasksMigrated')) {
      console.log('Migrating', tasks.length, 'tasks to individual missions...')

      // Create a separate mission for each task
      const newMissions = tasks.map((task, index) => ({
        id: Date.now() + index,
        title: task.title,
        category: 'work',
        description: task.description || '',
        status: task.status === 'done' ? 'done' : 'doing',
        subtasks: [],
        createdAt: Date.now() + index
      }))

      setMissions([...missions, ...newMissions])
      localStorage.setItem('tasksMigrated', 'true')
      console.log('Migration complete:', newMissions.length, 'missions created')
    }
  }, [])

  // SECOND MIGRATION: Convert "Tâches diverses" subtasks to individual missions
  useEffect(() => {
    const diverseMission = missions.find(m => m.title === 'Tâches diverses')
    if (diverseMission && diverseMission.subtasks.length > 0 && !localStorage.getItem('diversesMigrated')) {
      console.log('Converting Tâches diverses subtasks to individual missions...')

      // Create a mission for each subtask
      const newMissions = diverseMission.subtasks.map((subtask, index) => ({
        id: Date.now() + index,
        title: subtask.text,
        category: 'work',
        description: subtask.description || '',
        status: subtask.completed ? 'done' : 'doing',
        subtasks: [],
        createdAt: Date.now() + index
      }))

      // Remove the "Tâches diverses" mission and add new missions
      setMissions([
        ...missions.filter(m => m.id !== diverseMission.id),
        ...newMissions
      ])

      localStorage.setItem('diversesMigrated', 'true')
      console.log('Conversion complete:', newMissions.length, 'missions created')
    }
  }, [missions])

  const handleCreateMission = (e) => {
    e.preventDefault()
    if (!newMissionTitle.trim()) return

    const newMission = {
      id: Date.now(),
      title: newMissionTitle.trim(),
      category: newMissionCategory,
      description: newMissionDescription.trim(),
      status: 'doing',
      subtasks: [],
      createdAt: Date.now()
    }

    setMissions([...missions, newMission])
    setNewMissionTitle('')
    setNewMissionDescription('')
    setNewMissionCategory('work')
    setShowCreateForm(false)
    setExpandedMissionId(newMission.id)
  }

  const handleDeleteMission = (missionId) => {
    if (window.confirm('Supprimer cette mission ?')) {
      setMissions(missions.filter(m => m.id !== missionId))
      if (expandedMissionId === missionId) setExpandedMissionId(null)
    }
  }

  const handleChangeStatus = (missionId, newStatus) => {
    setMissions(missions.map(m =>
      m.id === missionId ? { ...m, status: newStatus } : m
    ))
  }

  const handleAddSubtask = (missionId) => {
    const text = newSubtaskText[missionId]?.trim()
    if (!text) return

    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        return {
          ...mission,
          subtasks: [
            ...mission.subtasks,
            { id: Date.now(), text, completed: false, estimateMinutes: 0, secondsSpent: 0, note: '' }
          ]
        }
      }
      return mission
    }))

    setNewSubtaskText({ ...newSubtaskText, [missionId]: '' })
  }

  const handleToggleSubtask = (missionId, subtaskId) => {
    setMissions(missions.map(mission => {
      if (mission.id === missionId) {
        const updatedSubtasks = mission.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        )
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
    setMissions(missions.map(mission =>
      mission.id === missionId
        ? { ...mission, subtasks: mission.subtasks.filter(st => st.id !== subtaskId) }
        : mission
    ))
  }

  const handleUpdateSubtaskText = (missionId, subtaskId, newText) => {
    setMissions(missions.map(mission =>
      mission.id === missionId
        ? { ...mission, subtasks: mission.subtasks.map(st => st.id === subtaskId ? { ...st, text: newText } : st) }
        : mission
    ))
  }

  const handleStartSubtask = (missionId, subtaskId) => {
    if (isRunning && activeSubtaskId) handleStopSubtask()

    setActiveSubtaskId({ missionId, subtaskId })
    setIsRunning(true)

    const mission = missions.find(m => m.id === missionId)
    const subtask = mission?.subtasks.find(st => st.id === subtaskId)
    if (subtask) {
      baseSecondsRef.current = subtask.secondsSpent || 0
      startTimeRef.current = Date.now()
    }
  }

  const handleStopSubtask = () => {
    if (!activeSubtaskId) return

    const now = Date.now()
    const elapsedMs = now - startTimeRef.current
    const totalSeconds = baseSecondsRef.current + Math.floor(elapsedMs / 1000)

    setMissions(missions.map(mission => {
      if (mission.id === activeSubtaskId.missionId) {
        return {
          ...mission,
          subtasks: mission.subtasks.map(st =>
            st.id === activeSubtaskId.subtaskId ? { ...st, secondsSpent: totalSeconds } : st
          )
        }
      }
      return mission
    }))

    setIsRunning(false)
    startTimeRef.current = null
    baseSecondsRef.current = 0
  }

  const handleCompleteSubtask = () => {
    if (!activeSubtaskId) return
    handleStopSubtask()
    handleToggleSubtask(activeSubtaskId.missionId, activeSubtaskId.subtaskId)
    setActiveSubtaskId(null)
  }

  useEffect(() => {
    if (!isRunning || !activeSubtaskId) return

    const interval = setInterval(() => {
      if (startTimeRef.current === null) return

      const now = Date.now()
      const elapsedMs = now - startTimeRef.current
      const totalSeconds = baseSecondsRef.current + Math.floor(elapsedMs / 1000)

      setMissions(prevMissions =>
        prevMissions.map(mission => {
          if (mission.id === activeSubtaskId.missionId) {
            return {
              ...mission,
              subtasks: mission.subtasks.map(st =>
                st.id === activeSubtaskId.subtaskId ? { ...st, secondsSpent: totalSeconds } : st
              )
            }
          }
          return mission
        })
      )
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning, activeSubtaskId])

  const calculateProgress = (mission) => {
    if (mission.subtasks.length === 0) return 0
    const completed = mission.subtasks.filter(st => st.completed).length
    return Math.round((completed / mission.subtasks.length) * 100)
  }

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    const pad = (num) => num.toString().padStart(2, '0')
    return h + ':' + pad(m) + ':' + pad(s)
  }

  const formatPomodoroTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    const pad = (num) => num.toString().padStart(2, '0')
    return pad(m) + ':' + pad(s)
  }

  const toggleFocusMode = () => {
    if (!isFocusMode) {
      // Entering focus mode
      setIsFocusMode(true)
      const workDuration = pomodoroConfig.workMinutes * 60
      setPomodoroSeconds(workDuration)
      pomodoroBaseDurationRef.current = workDuration
      pomodoroStartTimeRef.current = Date.now()
      setIsPomodoroRunning(true)
      setPomodoroMode('work')
    } else {
      // Exiting focus mode
      setIsFocusMode(false)
      setIsPomodoroRunning(false)
      pomodoroStartTimeRef.current = null
    }
  }

  const handlePomodoroToggle = () => {
    if (isPomodoroRunning) {
      setIsPomodoroRunning(false)
      pomodoroStartTimeRef.current = null
    } else {
      pomodoroStartTimeRef.current = Date.now()
      setIsPomodoroRunning(true)
    }
  }

  const handlePomodoroReset = () => {
    const workDuration = pomodoroConfig.workMinutes * 60
    setPomodoroSeconds(workDuration)
    pomodoroBaseDurationRef.current = workDuration
    pomodoroStartTimeRef.current = null
    setIsPomodoroRunning(false)
    setPomodoroMode('work')
  }

  const getFilteredAndSortedMissions = () => {
    let filtered = missions
    if (categoryFilter !== 'all') filtered = filtered.filter(m => m.category === categoryFilter)
    if (statusFilter !== 'all') filtered = filtered.filter(m => m.status === statusFilter)

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'progress') return calculateProgress(b) - calculateProgress(a)
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title)
      return b.createdAt - a.createdAt
    })

    return sorted
  }

  const getActiveSubtask = () => {
    if (!activeSubtaskId) return null
    const mission = missions.find(m => m.id === activeSubtaskId.missionId)
    if (!mission) return null
    const subtask = mission.subtasks.find(st => st.id === activeSubtaskId.subtaskId)
    return { mission, subtask }
  }

  const activeData = getActiveSubtask()

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🎯 Missions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Organisez votre travail en missions et sous-missions
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setCategoryFilter('all')}
          className={'px-3 py-1.5 rounded-full text-xs font-medium transition-all ' + (
            categoryFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : (theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-neutral-800 hover:bg-neutral-700')
          )}
        >
          📋 Toutes
        </button>
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => setCategoryFilter(key)}
            className={'px-3 py-1.5 rounded-full text-xs font-medium transition-all ' + (
              categoryFilter === key ? cat.bg + ' text-white shadow-md' : (theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-neutral-800 hover:bg-neutral-700')
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg px-4 py-3 text-sm font-bold transition-all mb-4 shadow-md hover:shadow-lg"
        >
          ➕ Nouvelle mission
        </button>
      )}

      {showCreateForm && (
        <div className={themeClasses.card + ' border rounded-lg p-4 mb-4 shadow-md'}>
          <form onSubmit={handleCreateMission} className="space-y-3">
            <input
              type="text"
              value={newMissionTitle}
              onChange={(e) => setNewMissionTitle(e.target.value)}
              placeholder="Titre de la mission *"
              className={themeClasses.input + ' w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500'}
              autoFocus
              required
            />
            <div className="flex gap-2">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewMissionCategory(key)}
                  className={'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ' + (
                    newMissionCategory === key ? 'bg-gradient-to-r ' + cat.gradient + ' text-white shadow-md' : (theme === 'light' ? 'bg-gray-100 hover:bg-gray-200' : 'bg-neutral-800 hover:bg-neutral-700')
                  )}
                >
                  {cat.label.split(' ')[0]}
                </button>
              ))}
            </div>
            <textarea
              value={newMissionDescription}
              onChange={(e) => setNewMissionDescription(e.target.value)}
              placeholder="Description (optionnelle)"
              rows="2"
              className={themeClasses.input + ' w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'}
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors">
                ✓ Créer
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setNewMissionTitle(''); setNewMissionDescription(''); }} className={'flex-1 ' + (theme === 'light' ? 'bg-gray-200 hover:bg-gray-300' : 'bg-neutral-800 hover:bg-neutral-700') + ' rounded-lg px-4 py-2 text-sm font-medium transition-colors'}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {activeData && (
        <div className={themeClasses.card + ' rounded-2xl p-4 mb-4 shadow-lg ' + (isFocusMode ? 'bg-gradient-to-br from-indigo-900/60 via-purple-900/60 to-pink-900/60 border-2 border-purple-500 shadow-purple-500/20' : 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-2 border-blue-500')}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">
              {isFocusMode ? '🎯 Mode Focus' : '⏱️ Mission active'}
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
                  🔄 Reset
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className={'rounded-xl p-4 ' + (theme === 'light' ? 'bg-white/10' : 'bg-black/20')}>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">{activeData.mission.title}</div>
              <h3 className="font-bold text-lg mb-2">{activeData.subtask.text}</h3>
              <div className="text-3xl font-mono font-bold text-center py-2">
                {formatTime(activeData.subtask.secondsSpent)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
              >
                {isRunning ? '⏸️ Pause' : '▶️ Démarrer'}
              </button>
              <button
                onClick={handleCompleteSubtask}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-bold transition-colors"
              >
                ✓ Terminer
              </button>
            </div>

            <button
              onClick={() => { handleStopSubtask(); setActiveSubtaskId(null); }}
              className={'w-full ' + (theme === 'light' ? 'text-gray-600 hover:text-red-600' : 'text-gray-400 hover:text-red-400') + ' text-xs transition-colors'}
            >
              ✕ Arrêter et fermer
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {getFilteredAndSortedMissions().length === 0 ? (
          <div className={themeClasses.card + ' border-2 border-dashed rounded-lg p-8 text-center'}>
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-medium mb-1">Aucune mission</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cliquez sur "+ Nouvelle mission" pour commencer</p>
          </div>
        ) : (
          getFilteredAndSortedMissions().map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isExpanded={expandedMissionId === mission.id}
              onToggleExpand={() => setExpandedMissionId(expandedMissionId === mission.id ? null : mission.id)}
              onDelete={() => handleDeleteMission(mission.id)}
              onChangeStatus={(status) => handleChangeStatus(mission.id, status)}
              onAddSubtask={() => handleAddSubtask(mission.id)}
              onToggleSubtask={(subtaskId) => handleToggleSubtask(mission.id, subtaskId)}
              onDeleteSubtask={(subtaskId) => handleDeleteSubtask(mission.id, subtaskId)}
              onUpdateSubtaskText={(subtaskId, text) => handleUpdateSubtaskText(mission.id, subtaskId, text)}
              onStartSubtask={(subtaskId) => handleStartSubtask(mission.id, subtaskId)}
              newSubtaskText={newSubtaskText[mission.id] || ''}
              setNewSubtaskText={(text) => setNewSubtaskText({ ...newSubtaskText, [mission.id]: text })}
              activeSubtaskId={activeSubtaskId}
              editingSubtaskId={editingSubtaskId}
              setEditingSubtaskId={setEditingSubtaskId}
              editText={editText}
              setEditText={setEditText}
              calculateProgress={calculateProgress}
              formatTime={formatTime}
              categories={categories}
              statusIcons={statusIcons}
              theme={theme}
              themeClasses={themeClasses}
            />
          ))
        )}
      </div>

      {missions.length > 0 && (
        <div className={themeClasses.card + ' border rounded-lg p-3 mt-4'}>
          <div className="flex flex-wrap gap-2 text-xs">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={themeClasses.input + ' rounded px-2 py-1 text-xs border'}>
              <option value="all">Tous les statuts</option>
              <option value="doing">En cours</option>
              <option value="paused">En pause</option>
              <option value="done">Terminées</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={themeClasses.input + ' rounded px-2 py-1 text-xs border'}>
              <option value="recent">Plus récentes</option>
              <option value="progress">Par progression</option>
              <option value="alphabetical">Alphabétique</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

function MissionCard({
  mission, isExpanded, onToggleExpand, onDelete, onChangeStatus, onAddSubtask, onToggleSubtask,
  onDeleteSubtask, onUpdateSubtaskText, onStartSubtask, newSubtaskText, setNewSubtaskText,
  activeSubtaskId, editingSubtaskId, setEditingSubtaskId, editText, setEditText,
  calculateProgress, formatTime, categories, statusIcons, theme, themeClasses
}) {
  const progress = calculateProgress(mission)
  const category = categories[mission.category || 'work']
  const completedCount = mission.subtasks.filter(st => st.completed).length
  const totalCount = mission.subtasks.length

  const handleStartEdit = (subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditText(subtask.text)
  }

  const handleSaveEdit = (subtaskId) => {
    if (editText.trim()) onUpdateSubtaskText(subtaskId, editText.trim())
    setEditingSubtaskId(null)
    setEditText('')
  }

  return (
    <div className={themeClasses.card + ' border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all'}>
      <div className={'p-3 cursor-pointer ' + themeClasses.hover + ' transition-all'} onClick={onToggleExpand}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold truncate">{mission.title}</h3>
                <span className={'text-[10px] px-2 py-0.5 rounded-full ' + category.bg + ' text-white'}>{category.label.split(' ')[0]}</span>
                <span className="text-xs">{statusIcons[mission.status]}</span>
              </div>
              {totalCount > 0 && <div className="text-xs text-gray-500 mt-1">{completedCount}/{totalCount} • {progress}%</div>}
            </div>
          </div>
          {totalCount > 0 && (
            <div className="w-16 h-2 bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div className={'h-full bg-gradient-to-r ' + category.gradient + ' transition-all duration-300'} style={{ width: progress + '%' }} />
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className={'border-t p-3 ' + (theme === 'light' ? 'bg-gray-50' : 'bg-neutral-900/30')}>
          {mission.description && <p className={'text-xs ' + themeClasses.textSecondary + ' mb-3'}>{mission.description}</p>}

          <div className="space-y-2 mb-3">
            {mission.subtasks.map((subtask) => {
              const isActive = activeSubtaskId?.missionId === mission.id && activeSubtaskId?.subtaskId === subtask.id
              return (
                <div key={subtask.id} className={'flex items-center gap-2 p-2 rounded ' + (isActive ? 'bg-blue-100 dark:bg-blue-950/50 border border-blue-500' : theme === 'light' ? 'bg-white border border-gray-200' : 'bg-neutral-900 border border-neutral-700') + (subtask.completed ? ' opacity-60' : '')}>
                  <input type="checkbox" checked={subtask.completed} onChange={() => onToggleSubtask(subtask.id)} className="w-4 h-4 rounded cursor-pointer" />
                  {editingSubtaskId === subtask.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => handleSaveEdit(subtask.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(subtask.id); if (e.key === 'Escape') setEditingSubtaskId(null); }}
                      className={'flex-1 ' + themeClasses.input + ' rounded px-2 py-1 text-xs border'}
                      autoFocus
                    />
                  ) : (
                    <span className={'flex-1 text-sm' + (subtask.completed ? ' line-through' : '')} onDoubleClick={() => handleStartEdit(subtask)}>
                      {subtask.text}
                    </span>
                  )}
                  {subtask.secondsSpent > 0 && <span className="text-[10px] font-mono text-gray-500">{formatTime(subtask.secondsSpent)}</span>}
                  {!subtask.completed && !isActive && (
                    <button onClick={() => onStartSubtask(subtask.id)} className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors" title="Démarrer">▶️</button>
                  )}
                  <button onClick={() => handleStartEdit(subtask)} className={themeClasses.textMuted + ' hover:text-blue-500 text-xs'}>✏️</button>
                  <button onClick={() => onDeleteSubtask(subtask.id)} className={themeClasses.textMuted + ' hover:text-red-500 text-xs'}>✕</button>
                </div>
              )
            })}
          </div>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddSubtask() }}
              placeholder="+ Ajouter une sous-mission"
              className={'flex-1 ' + themeClasses.input + ' rounded px-3 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-blue-500'}
            />
            <button onClick={onAddSubtask} className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-xs font-bold transition-colors">➕</button>
          </div>

          <div className="flex gap-2 text-xs">
            <select value={mission.status} onChange={(e) => onChangeStatus(e.target.value)} className={themeClasses.input + ' rounded px-2 py-1 text-xs border'} onClick={(e) => e.stopPropagation()}>
              <option value="doing">🕓 En cours</option>
              <option value="paused">⏸️ En pause</option>
              <option value="done">✅ Terminée</option>
            </select>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={themeClasses.textMuted + ' hover:text-red-500 px-2 transition-colors'}>🗑️ Supprimer</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MissionsView
