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
  // VERSION SIMPLE DE TEST
  const [newMissionTitle, setNewMissionTitle] = useState('')

  const handleAddMission = (e) => {
    e.preventDefault()
    if (!newMissionTitle.trim()) return

    const newMission = {
      id: Date.now(),
      title: newMissionTitle,
      category: 'work',
      status: 'doing',
      subtasks: [],
      createdAt: Date.now()
    }

    setMissions([...missions, newMission])
    setNewMissionTitle('')
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">🎯 Page Missions - Version Simple</h1>

      <div className={`${themeClasses.card} border rounded-xl p-6 mb-6`}>
        <h2 className="text-xl font-semibold mb-4">Créer une mission</h2>
        <form onSubmit={handleAddMission} className="flex gap-3">
          <input
            type="text"
            value={newMissionTitle}
            onChange={(e) => setNewMissionTitle(e.target.value)}
            placeholder="Titre de la mission..."
            className={`flex-1 ${themeClasses.input} rounded-lg px-4 py-2`}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 font-medium"
          >
            Ajouter
          </button>
        </form>
      </div>

      <div className={`${themeClasses.card} border rounded-xl p-6`}>
        <h2 className="text-xl font-semibold mb-4">Mes missions ({missions.length})</h2>
        {missions.length === 0 ? (
          <p className={`text-center ${themeClasses.textMuted} py-8`}>
            Aucune mission pour le moment
          </p>
        ) : (
          <div className="space-y-3">
            {missions.map(mission => (
              <div
                key={mission.id}
                className={`border rounded-lg p-4 ${themeClasses.card}`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">{mission.title}</h3>
                  <button
                    onClick={() => setMissions(missions.filter(m => m.id !== mission.id))}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`mt-6 p-4 ${themeClasses.card} border rounded-lg`}>
        <p className="text-sm text-green-500">✅ Si vous voyez ce texte, la page Missions fonctionne !</p>
        <p className={`text-xs mt-2 ${themeClasses.textMuted}`}>
          Nombre de tâches: {tasks.length} | Thème: {theme}
        </p>
      </div>
    </div>
  )
}

export default MissionsView
