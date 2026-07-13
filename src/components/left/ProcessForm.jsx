import { useState } from 'react'
import { Modal, TextField, NumberField, SelectField, ReadOnlyField, FormActions } from '../formControls'
import { PROCESS_TYPES } from '../../utils/constants'
import { generateRefNum } from '../../utils/refnum'
import { validateProcess, hasErrors } from '../../utils/validation'

export default function ProcessForm({ processes, editMode, onSubmit, onClose }) {
  const nextRef = generateRefNum('P', processes)
  const [values, setValues] = useState({
    name: '',
    type: 'rectangle',
    stdTime: '',
    idealTime: '',
    stdRes: '',
    idealRes: '',
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (v) => setValues((prev) => ({ ...prev, [field]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validateProcess(values)
    setErrors(errs)
    if (hasErrors(errs)) return
    onSubmit(values)
    onClose()
  }

  return (
    <Modal
      title="Add Process"
      subtitle={`New ${editMode} process · ${nextRef}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyField label="Ref #" value={nextRef} />
          <SelectField label="Type" value={values.type} onChange={set('type')}>
            {PROCESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField
          label="Name"
          value={values.name}
          onChange={set('name')}
          error={errors.name}
          placeholder="e.g. Quality Check"
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Standard Time" value={values.stdTime} onChange={set('stdTime')} error={errors.stdTime} suffix="min" />
          <NumberField label="Ideal Time" value={values.idealTime} onChange={set('idealTime')} error={errors.idealTime} suffix="min" />
          <NumberField label="Standard Resources" value={values.stdRes} onChange={set('stdRes')} error={errors.stdRes} />
          <NumberField label="Ideal Resources" value={values.idealRes} onChange={set('idealRes')} error={errors.idealRes} />
        </div>

        <FormActions onCancel={onClose} submitLabel="Save Process" />
      </form>
    </Modal>
  )
}
