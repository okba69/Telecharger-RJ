import { useState } from 'react'

function MissionsView({ missions, setMissions, theme, themeClasses }) {
  const [newMissionTitle, setNewMissionTitle] = useState('')
  const [newMissionDescription, setNewMissionDescription] = useState('')
  const [expandedMissionId, setExpandedMissionId] = useState(null)
  const [draggedSubtask, setDraggedSubtask] = useState(null)

  // ========== MISSION MANAGEMENT ==========
  const handleAddMission = (e) => {
    e.preventDefault()
    if (!newMissionTitle.trim()) return

    const newMission = {
      id: Date.now(),
      title: newMissionTitle,
      description: newMissionDescription,
      status: 'doing',
      subtasks: [],
      createdAt: Date.now()
    }

    setMissions([...missions, newMission])
    setNewMissionTitle('')
    setNewMissionDescription('')
    setExpandedMissionId(newMission.id) // Auto-expand new mission
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

        // Auto-update mission status based on subtasks
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every(st => st.completed)
        const status = allCompleted ? 'done' : 'doing'

        return { ...mission, subtasks: updatedSubtasks, status }
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

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold mb-6">🎯 Missions & Sous-missions</h2>

      {/* Add New Mission */}
      <div className={`${themeClasses.card} border rounded-2xl p-6 mb-6`}>
        <h3 className="text-lg font-semibold mb-4">➕ Nouvelle Mission</h3>
        <form onSubmit={handleAddMission} className="space-y-3">
          <input
            type="text"
            value={newMissionTitle}
            onChange={(e) => setNewMissionTitle(e.target.value)}
            placeholder="Titre de la mission..."
            className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            required
          />
          <textarea
            value={newMissionDescription}
            onChange={(e) => setNewMissionDescription(e.target.value)}
            placeholder="Description (optionnelle)..."
            rows="2"
            className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            Créer la mission
          </button>
        </form>
      </div>

      {/* Missions List */}
      <div className="space-y-4">
        {missions.length === 0 ? (
          <p className={`text-center ${themeClasses.textMuted} py-8`}>
            Aucune mission. Créez-en une pour commencer !
          </p>
        ) : (
          missions.map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isExpanded={expandedMissionId === mission.id}
              onToggleExpand={() => setExpandedMissionId(
                expandedMissionId === mission.id ? null : mission.id
              )}
              onDelete={() => handleDeleteMission(mission.id)}
              onAddSubtask={(text) => handleAddSubtask(mission.id, text)}
              onToggleSubtask={(subtaskId) => handleToggleSubtask(mission.id, subtaskId)}
              onDeleteSubtask={(subtaskId) => handleDeleteSubtask(mission.id, subtaskId)}
              onUpdateSubtaskText={(subtaskId, text) => handleUpdateSubtaskText(mission.id, subtaskId, text)}
              onSubtaskDragStart={handleSubtaskDragStart}
              onSubtaskDragOver={handleSubtaskDragOver}
              onSubtaskDrop={(e, targetSubtask) => handleSubtaskDrop(e, mission.id, targetSubtask)}
              calculateProgress={calculateProgress}
              theme={theme}
              themeClasses={themeClasses}
              draggedSubtask={draggedSubtask}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ========== MISSION CARD COMPONENT ==========
function MissionCard({
  mission,
  isExpanded,
  onToggleExpand,
  onDelete,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onUpdateSubtaskText,
  onSubtaskDragStart,
  onSubtaskDragOver,
  onSubtaskDrop,
  calculateProgress,
  theme,
  themeClasses,
  draggedSubtask
}) {
  const [newSubtaskText, setNewSubtaskText] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [editText, setEditText] = useState('')

  const progress = calculateProgress(mission)
  const completedCount = mission.subtasks.filter(st => st.completed).length
  const totalCount = mission.subtasks.length

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
    <div className={`${themeClasses.card} border rounded-2xl overflow-hidden`}>
      {/* Mission Header */}
      <div
        className={`p-6 cursor-pointer ${themeClasses.hover} transition-colors`}
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{mission.title}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                mission.status === 'done'
                  ? 'bg-green-700 text-green-200'
                  : 'bg-blue-700 text-blue-200'
              }`}>
                {mission.status === 'done' ? '✅ Terminé' : '🔄 En cours'}
              </span>
            </div>
            {mission.description && (
              <p className={`text-sm ${themeClasses.textSecondary}`}>{mission.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className={`${themeClasses.textMuted} hover:text-red-400 transition-colors text-sm`}
            >
              🗑️
            </button>
            <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className={themeClasses.textMuted}>
                {completedCount} / {totalCount} sous-tâches
              </span>
              <span className="font-semibold text-blue-400">{progress}%</span>
            </div>
            <div className={`w-full h-2 ${theme === 'light' ? 'bg-gray-200' : 'bg-neutral-800'} rounded-full overflow-hidden`}>
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Subtasks (Expanded) */}
      {isExpanded && (
        <div className={`border-t ${themeClasses.border} p-6 pt-4`}>
          {/* Subtasks List */}
          <div className="space-y-2 mb-4">
            {mission.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                draggable
                onDragStart={(e) => onSubtaskDragStart(e, subtask)}
                onDragOver={onSubtaskDragOver}
                onDrop={(e) => onSubtaskDrop(e, subtask)}
                className={`${
                  theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-neutral-900/50 border-neutral-800'
                } border rounded-lg p-3 flex items-center gap-3 transition-all ${
                  draggedSubtask?.id === subtask.id ? 'opacity-50' : ''
                }`}
              >
                <span className={`${themeClasses.textMuted} text-xs cursor-grab`}>⋮⋮</span>

                <input
                  type="checkbox"
                  checked={subtask.completed}
                  onChange={() => onToggleSubtask(subtask.id)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
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
                    className={`flex-1 ${themeClasses.input} rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`flex-1 text-sm ${subtask.completed ? `line-through ${themeClasses.textMuted}` : ''}`}
                    onDoubleClick={() => handleStartEdit(subtask)}
                  >
                    {subtask.text}
                  </span>
                )}

                <button
                  onClick={() => handleStartEdit(subtask)}
                  className={`${themeClasses.textMuted} hover:text-blue-400 text-xs transition-colors`}
                  title="Modifier"
                >
                  ✏️
                </button>

                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className={`${themeClasses.textMuted} hover:text-red-400 text-xs transition-colors`}
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add Subtask Form */}
          <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2">
            <input
              type="text"
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              placeholder="Ajouter une sous-tâche..."
              className={`flex-1 ${themeClasses.input} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              + Ajouter
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default MissionsView
