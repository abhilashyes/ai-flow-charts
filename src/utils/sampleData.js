// Pre-loaded sample so the app is populated on first open. Two standard and two
// ideal processes, with connectors in each mode.
export const initialProcesses = [
  { id: 1, refNum: 'P01', name: 'Raw Material Receipt', type: 'rectangle', stdTime: 60, idealTime: 30, stdRes: 3, idealRes: 2, mode: 'standard' },
  { id: 2, refNum: 'P02', name: 'Quality Check', type: 'diamond', stdTime: 45, idealTime: 20, stdRes: 2, idealRes: 1, mode: 'standard' },
  { id: 3, refNum: 'P03', name: 'Manufacturing', type: 'rectangle', stdTime: 480, idealTime: 240, stdRes: 5, idealRes: 3, mode: 'standard' },
  { id: 4, refNum: 'P04', name: 'Inspection', type: 'diamond', stdTime: 30, idealTime: 15, stdRes: 2, idealRes: 1, mode: 'ideal' },
  { id: 5, refNum: 'P05', name: 'Packaging', type: 'rectangle', stdTime: 120, idealTime: 60, stdRes: 3, idealRes: 2, mode: 'ideal' },
]

export const initialConnectors = [
  { id: 1, refNum: 'C01', source: 1, target: 2, type: 'process-flow', modeOfConveyance: 'Physical Transport', stdTime: 15, idealTime: 5, stdRes: 2, idealRes: 1, mode: 'standard' },
  { id: 2, refNum: 'C02', source: 2, target: 3, type: 'information-flow', modeOfConveyance: 'Email', stdTime: 30, idealTime: 10, stdRes: 1, idealRes: 1, mode: 'standard' },
  { id: 3, refNum: 'C03', source: 4, target: 5, type: 'process-flow', modeOfConveyance: 'Conveyor', stdTime: 20, idealTime: 10, stdRes: 1, idealRes: 1, mode: 'ideal' },
  { id: 4, refNum: 'C04', source: 4, target: 5, type: 'information-flow', modeOfConveyance: 'API', stdTime: 5, idealTime: 2, stdRes: 1, idealRes: 1, mode: 'ideal' },
]
