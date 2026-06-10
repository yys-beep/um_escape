// ─── STAGE 2 CONSTANTS & REDUCER ─────────────────────────────────────────────
// Kept in a separate file so react-refresh fast-reload works correctly.

export const PROJECTOR_FILES = [
  {
    id: 'experiment',
    label: 'Experiment 313 Started',
    corrupt: 'Exp3rim3nt 313 St@rted',
    hint: 'The beginning of it all — Subject M.R. enrolled.',
  },
  {
    id: 'missing',
    label: 'Subject Maya Missing',
    corrupt: 'Subj3ct M@ya M1ssing',
    hint: 'She disappeared three days after injection.',
  },
  {
    id: 'coverup',
    label: 'Cover-up Authorized',
    corrupt: 'C0v3r-up Auth0riz3d',
    hint: 'The university buried the records.',
  },
];

export const PROJECTOR_CORRECT_ORDER = ['experiment', 'missing', 'coverup'];

export const HIDDEN_MESSAGE = 'THE LIBRARY KNOWS.';

export const CINEMATIC_LINES = [
  'Files uploaded to the University database.',
  "PROJECT 313: SUBJECT M.R. — LEAD RESEARCHER: [NAME REDACTED]",
  'The hallucinations... the missing students... it was them.',
  "Maya's spirit guided you here to expose the truth.",
  'Campus emergency alarms echo in the distance. As you escape, Maya smiles and fades away.',
  'Some truths refuse to stay buried.',
];

export const INITIAL_PUZZLE_STATE = {
  collectedFragments: [],
  wiresConnected: [false, false, false],
  projectorPuzzleSolved: false,
  nightmareActive: false,
  staircaseRevealed: false,
};

export function lectureHallReducer(state, action) {
  switch (action.type) {
    case 'CONNECT_WIRE': {
      const wires = [...state.wiresConnected];
      wires[action.index] = true;
      return { ...state, wiresConnected: wires };
    }
    case 'COLLECT_FRAGMENT': {
      if (state.collectedFragments.includes(action.id)) return state;
      return { ...state, collectedFragments: [...state.collectedFragments, action.id] };
    }
    case 'SOLVE_PROJECTOR':
      return { ...state, projectorPuzzleSolved: true };
    case 'TRIGGER_NIGHTMARE':
      return { ...state, nightmareActive: true };
    case 'END_NIGHTMARE':
      return { ...state, nightmareActive: false };
    case 'REVEAL_STAIRCASE':
      return { ...state, staircaseRevealed: true };
    case 'RESET':
      return INITIAL_PUZZLE_STATE;
      default:
      return state;
  }
}
