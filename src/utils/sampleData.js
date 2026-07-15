// Pre-loaded sample diagram for the Current version of the seeded flow: a single
// coherent left-to-right value chain. Positions (x,y) are persisted per shape.
export const initialProcesses = [
  { id: 1, refNum: 'P01', name: 'Raw Material Receipt', type: 'rectangle', stdTime: 60, stdTimeUnit: 'min', idealTime: 30, idealTimeUnit: 'min', stdRes: 3, idealRes: 2, laneId: null, x: 84, y: 220 },
  { id: 2, refNum: 'P02', name: 'Quality Check', type: 'diamond', stdTime: 45, stdTimeUnit: 'min', idealTime: 20, idealTimeUnit: 'min', stdRes: 2, idealRes: 1, laneId: null, x: 252, y: 220 },
  { id: 3, refNum: 'P03', name: 'Manufacturing', type: 'rectangle', stdTime: 8, stdTimeUnit: 'hr', idealTime: 4, idealTimeUnit: 'hr', stdRes: 5, idealRes: 3, laneId: null, x: 420, y: 220 },
  { id: 4, refNum: 'P04', name: 'Packaging', type: 'rectangle', stdTime: 120, stdTimeUnit: 'min', idealTime: 60, idealTimeUnit: 'min', stdRes: 3, idealRes: 2, laneId: null, x: 588, y: 220 },
  { id: 5, refNum: 'P05', name: 'End Customer', type: 'customer', stdTime: 0, stdTimeUnit: 'min', idealTime: 0, idealTimeUnit: 'min', stdRes: 0, idealRes: 0, laneId: null, x: 756, y: 220 },
]

export const initialConnectors = [
  { id: 1, refNum: 'C01', source: 1, target: 2, type: 'process-flow', modeOfConveyance: 'Physical Transport', stdTime: 15, stdTimeUnit: 'min', idealTime: 5, idealTimeUnit: 'min', stdRes: 2, idealRes: 1, srcSide: 'auto', tgtSide: 'auto' },
  { id: 2, refNum: 'C02', source: 2, target: 3, type: 'information-flow', modeOfConveyance: 'Email', stdTime: 30, stdTimeUnit: 'min', idealTime: 10, idealTimeUnit: 'min', stdRes: 1, idealRes: 1, srcSide: 'auto', tgtSide: 'auto' },
  { id: 3, refNum: 'C03', source: 3, target: 4, type: 'process-flow', modeOfConveyance: 'Conveyor', stdTime: 20, stdTimeUnit: 'min', idealTime: 10, idealTimeUnit: 'min', stdRes: 1, idealRes: 1, srcSide: 'auto', tgtSide: 'auto' },
  { id: 4, refNum: 'C04', source: 4, target: 5, type: 'process-flow', modeOfConveyance: 'Physical Transport', stdTime: 1, stdTimeUnit: 'day', idealTime: 12, idealTimeUnit: 'hr', stdRes: 1, idealRes: 1, srcSide: 'auto', tgtSide: 'auto' },
]
