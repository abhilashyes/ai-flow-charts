import { useState } from 'react'
import { Modal, NumberField, SelectField, ReadOnlyField, FormActions } from '../formControls'
import { CONNECTOR_TYPES } from '../../utils/constants'
import { CONVEYANCE } from '../../utils/conveyance'
import { generateRefNum } from '../../utils/refnum'
import { validateConnector, hasErrors } from '../../utils/validation'

export default function ConnectorForm({ connectors, processes, editMode, onSubmit, onClose, initial }) {
  const isEdit = Boolean(initial)
  const refNum = isEdit ? initial.refNum : generateRefNum('C', connectors)
  // Only processes from the mode we're editing can be connected.
  const options = processes.filter((p) => p.mode === editMode)

  const [values, setValues] = useState(() => ({
    source: initial?.source ?? '',
    target: initial?.target ?? '',
    type: initial?.type ?? 'process-flow',
    modeOfConveyance: initial?.modeOfConveyance ?? 'Email',
    stdTime: initial?.stdTime ?? '',
    idealTime: initial?.idealTime ?? '',
    stdRes: initial?.stdRes ?? '',
    idealRes: initial?.idealRes ?? '',
  }))
  const [errors, setErrors] = useState({})

  const set = (field) => (v) => setValues((prev) => ({ ...prev, [field]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validateConnector(values, processes)
    setErrors(errs)
    if (hasErrors(errs)) return
    onSubmit(values)
    onClose()
  }

  return (
    <Modal
      title={isEdit ? 'Edit Connector' : 'Add Connector'}
      subtitle={isEdit ? `${refNum} · ${editMode}` : `New ${editMode} connector · ${refNum}`}
      onClose={onClose}
    >
      {options.length < 2 ? (
        <div className="rounded-md bg-amber-50 px-3 py-4 text-center text-[13px] text-amber-700">
          You need at least two <b>{editMode}</b> processes before adding a connector.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <ReadOnlyField label="Ref #" value={refNum} />

          <SelectField label="From Process" value={values.source} onChange={set('source')} error={errors.source}>
            <option value="">Select source…</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.refNum} — {p.name}
              </option>
            ))}
          </SelectField>

          <SelectField label="To Process" value={values.target} onChange={set('target')} error={errors.target}>
            <option value="">Select target…</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.refNum} — {p.name}
              </option>
            ))}
          </SelectField>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Type" value={values.type} onChange={set('type')}>
              {CONNECTOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Mode of Conveyance" value={values.modeOfConveyance} onChange={set('modeOfConveyance')}>
              {CONVEYANCE.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.glyph} {m.label}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Standard Time" value={values.stdTime} onChange={set('stdTime')} error={errors.stdTime} suffix="min" />
            <NumberField label="Ideal Time" value={values.idealTime} onChange={set('idealTime')} error={errors.idealTime} suffix="min" />
            <NumberField label="Standard Resources" value={values.stdRes} onChange={set('stdRes')} error={errors.stdRes} />
            <NumberField label="Ideal Resources" value={values.idealRes} onChange={set('idealRes')} error={errors.idealRes} />
          </div>

          <FormActions onCancel={onClose} submitLabel={isEdit ? 'Update Connector' : 'Save Connector'} />
        </form>
      )}
    </Modal>
  )
}
