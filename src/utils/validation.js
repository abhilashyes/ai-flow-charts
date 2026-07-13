// Form validation. Each validator returns an object of { field: message } for
// invalid fields; an empty object means the form is valid.

export function validateProcess(values) {
  const errors = {}
  if (!values.name || !values.name.trim()) errors.name = 'Name is required.'
  if (!(Number(values.stdTime) > 0)) errors.stdTime = 'Standard time must be greater than 0.'
  if (!(Number(values.idealTime) > 0)) errors.idealTime = 'Ideal time must be greater than 0.'
  if (!(Number(values.stdRes) > 0)) errors.stdRes = 'Standard resources must be at least 1.'
  if (!(Number(values.idealRes) > 0)) errors.idealRes = 'Ideal resources must be at least 1.'
  return errors
}

export function validateConnector(values, processes) {
  const errors = {}
  const source = Number(values.source)
  const target = Number(values.target)

  if (!source) errors.source = 'Select a source process.'
  if (!target) errors.target = 'Select a target process.'
  if (source && target && source === target) {
    errors.target = 'Source and target must be different.'
  }
  if (source && !processes.some((p) => p.id === source)) {
    errors.source = 'Source process no longer exists.'
  }
  if (target && !processes.some((p) => p.id === target)) {
    errors.target = 'Target process no longer exists.'
  }
  if (!(Number(values.stdTime) > 0)) errors.stdTime = 'Standard time must be greater than 0.'
  if (!(Number(values.idealTime) > 0)) errors.idealTime = 'Ideal time must be greater than 0.'
  if (!(Number(values.stdRes) > 0)) errors.stdRes = 'Standard resources must be at least 1.'
  if (!(Number(values.idealRes) > 0)) errors.idealRes = 'Ideal resources must be at least 1.'
  return errors
}

export const hasErrors = (errors) => Object.keys(errors).length > 0
