import { useState } from 'react'
import { Modal, TextField, NumberField, SelectField, ReadOnlyField, CheckboxField, FormActions } from '../formControls'
import { PROCESS_TYPES, TIME_UNITS, DEFAULT_TIME_UNIT } from '../../utils/constants'
import { generateRefNum } from '../../utils/refnum'
import { validateProcess, hasErrors } from '../../utils/validation'

export default function ProcessForm({ processes, lanes = [], onSubmit, onClose, initial }) {
  const isEdit = Boolean(initial)
  const refNum = isEdit ? initial.refNum : generateRefNum('P', processes)
  const [values, setValues] = useState(() => ({
    name: initial?.name ?? '',
    type: initial?.type ?? 'rectangle',
    stdTime: initial?.stdTime ?? '',
    stdTimeUnit: initial?.stdTimeUnit ?? DEFAULT_TIME_UNIT,
    idealTime: initial?.idealTime ?? '',
    idealTimeUnit: initial?.idealTimeUnit ?? DEFAULT_TIME_UNIT,
    stdRes: initial?.stdRes ?? '',
    idealRes: initial?.idealRes ?? '',
    abnormal: initial?.abnormal ?? false,
    laneId: initial?.laneId ?? '',
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
      subtitle={isEdit ? refNum : `New process · ${refNum}`}
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

        <SelectField label="Swim lane" value={values.laneId} onChange={set('laneId')}>
          <option value="">Unassigned</option>
          {lanes.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </SelectField>

        <TimeRow
          label="Standard Time"
          value={values.stdTime}
          unit={values.stdTimeUnit}
          error={errors.stdTime}
          onValue={set('stdTime')}
          onUnit={set('stdTimeUnit')}
        />
        <TimeRow
          label="Ideal Time"
          value={values.idealTime}
          unit={values.idealTimeUnit}
          error={errors.idealTime}
          onValue={set('idealTime')}
          onUnit={set('idealTimeUnit')}
        />

        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Standard Resources" value={values.stdRes} onChange={set('stdRes')} error={errors.stdRes} />
          <NumberField label="Ideal Resources" value={values.idealRes} onChange={set('idealRes')} error={errors.idealRes} />
        </div>

        <CheckboxField
          label="🚩 Abnormality"
          hint="flag a problem here"
          checked={values.abnormal}
          onChange={set('abnormal')}
        />

        <FormActions onCancel={onClose} submitLabel={isEdit ? 'Update Process' : 'Save Process'} />
      </form>
    </Modal>
  )
}

// A time value paired with its own unit dropdown (units are independent).
export function TimeRow({ label, value, unit, error, onValue, onUnit }) {
  return (
    <div className="grid grid-cols-2 items-start gap-3">
      <NumberField label={label} value={value} onChange={onValue} error={error} />
      <SelectField label="Unit" value={unit} onChange={onUnit}>
        {TIME_UNITS.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </SelectField>
    </div>
  )
}
