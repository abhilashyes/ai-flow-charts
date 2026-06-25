import type { VsmProject } from '../types'

/** Serialize the whole project to a JSON file download. */
export function exportProjectJson(project: VsmProject) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vsm-project.json'
  a.click()
  URL.revokeObjectURL(url)
}

/** Parse + lightly validate a project JSON string. Throws on bad input. */
export function parseProjectJson(text: string): VsmProject {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.states) || data.states.length === 0) {
    throw new Error('Invalid project file: missing states')
  }
  for (const s of data.states) {
    if (!s.id || !Array.isArray(s.nodes) || !Array.isArray(s.edges)) {
      throw new Error('Invalid project file: malformed state')
    }
  }
  const activeStateId =
    data.activeStateId && data.states.some((s: { id: string }) => s.id === data.activeStateId)
      ? data.activeStateId
      : data.states[0].id
  return {
    version: data.version ?? 1,
    timeUnit: data.timeUnit ?? 'days',
    states: data.states,
    activeStateId,
  }
}

/** Open a file picker and resolve with the chosen file's text. */
export function pickJsonFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    }
    input.click()
  })
}
