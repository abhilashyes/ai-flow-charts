import { useState } from 'react'
import { Modal, TextField, NumberField, SelectField, ReadOnlyField, FormActions } from '../formControls'
import { PROCESS_TYPES } from '../../utils/constants'
import { generateRefNum } from '../../utils/refnum'
import { validateProcess, hasErrors } from '../../utils/validation'

export default function ProcessForm({ processes, editMode, onSubmit, onClose, initial }) {
  const isEdit = Boolean(initial)
  const refNum = isEdit ? initial.refNum : generateRefNum('P', processes)
  const [values, setValues] = useState(() => ({
    name: initial?.name ?? '',
    type: initial?.type ?? 'rectangle',
    stdTime: initial?.stdTime ?? '',
    idealTime: initial?.idealTime ?? '',
    stdRes: initial?.stdRes ?? '',
    idealRes: initial?.idealRes ?? '',
  }))
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
      title={isEdit ? 'Edit Process' : 'Add Process'}
      subtitle={isEdit ? `${refNum} · ${editMode}` : `New ${editMode} process · ${refNum}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyField label="Ref #" value={refNum} />
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

        <FormActions onCancel={onClose} submitLabel={isEdit ? 'Update Process' : 'Save Process'} />
      </form>
    </Modal>
  )
}
