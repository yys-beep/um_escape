// src/libraryData.js
export const LIBRARY_BOUNDS_X = 9;
export const LIBRARY_BOUNDS_Z = 26;
export const LIBRARY_BOOKSHELF_DIMENSIONS = { width: 2, height: 8, depth: 10 };
export const STAFF_PATROL_X = 3.5;
export const STAFF_PATROL_DISTANCE = 18;
export const STAFF_CATCH_DISTANCE = 2.5;
export const LIBRARY_ARCHIVE_CODE = '0313';

export const LIBRARY_BOOKSHELVES = [
  { id: 'shelf-1', x: -7, z: 14 },
  { id: 'shelf-2', x: 7, z: 14 },
  { id: 'shelf-3', x: -7, z: 8 },
  { id: 'shelf-4', x: 5, z: 8 },
  { id: 'shelf-5', x: 7, z: 2 },
  { id: 'shelf-6', x: -5, z: 2 },
  { id: 'shelf-7', x: -7, z: -4 },
  { id: 'shelf-8', x: 6, z: -4 },
  { id: 'shelf-9', x: -7, z: -10 },
  { id: 'shelf-10', x: 7, z: -10 },
  { id: 'shelf-11', x: -7, z: -16 },
  { id: 'shelf-12', x: 7, z: -16 },
  { id: 'shelf-13', x: -4, z: -20 },
  { id: 'shelf-14', x: 4, z: -20 },
];

export const LIBRARY_HIDDEN_BOOKS = [
  {
    id: 'book_1',
    title: 'Volume I: Cover-up',
    position: [-2.45, -1, -9],
    geometry: [0.1, 0.6, 0.4],
    color: '#552222',
    emissive: '#552222',
    callNumber: '099.00',
    lore: 'The spine is warm. A name is scratched out beneath the dust jacket.',
  },
  {
    id: 'book_2',
    title: 'Volume II: Logs',
    position: [2.45, -1, -13],
    geometry: [0.1, 0.6, 0.4],
    color: '#223355',
    emissive: '#223355',
    callNumber: '312.00',
    lore: 'Experiment logs reference a subject who stopped attending lectures.',
  },
  {
    id: 'book_3',
    title: 'Volume III: Notes',
    position: [1, -1, -9.45],
    geometry: [0.4, 0.6, 0.1],
    color: '#225522',
    emissive: '#225522',
    callNumber: '150.00',
    lore: 'A bookmark reads: "She asked too many questions about Project 313."',
  },
  {
    id: 'book_4',
    title: 'Volume IV: Terminated',
    position: [-1, -1, -14.45],
    geometry: [0.4, 0.6, 0.1],
    color: '#554422',
    emissive: '#554422',
    callNumber: '399.00',
    lore: 'The final page is stamped: TERMINATED. The ink is still wet.',
  },
];

export function normalizeLibraryPosition(x, z) {
  return {
    x: (x + LIBRARY_BOUNDS_X) / (2 * LIBRARY_BOUNDS_X),
    z: (z + LIBRARY_BOUNDS_Z) / (2 * LIBRARY_BOUNDS_Z),
  };
}

export function getBookshelfMinimapStyle(shelf) {
  const center = normalizeLibraryPosition(shelf.x, shelf.z);
  const widthPct = (LIBRARY_BOOKSHELF_DIMENSIONS.width / (2 * LIBRARY_BOUNDS_X)) * 100;
  const heightPct = (LIBRARY_BOOKSHELF_DIMENSIONS.depth / (2 * LIBRARY_BOUNDS_Z)) * 100;

  return {
    left: `${center.x * 100 - widthPct / 2}%`,
    top: `${center.z * 100 - heightPct / 2}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
  };
}