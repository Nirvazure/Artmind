// Lucide v1.8.0 icons — ISC/MIT; see public/licenses/lucide.txt.
export const lucideIcons = {
  globe: [
    ['circle', { cx: '12', cy: '12', r: '10' }],
    ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }],
    ['path', { d: 'M2 12h20' }],
  ],
  lockKeyhole: [
    ['circle', { cx: '12', cy: '16', r: '1' }],
    ['rect', { x: '3', y: '10', width: '18', height: '12', rx: '2' }],
    ['path', { d: 'M7 10V7a5 5 0 0 1 10 0v3' }],
  ],
  lockKeyholeOpen: [
    ['circle', { cx: '12', cy: '16', r: '1' }],
    ['rect', { x: '3', y: '10', width: '18', height: '12', rx: '2' }],
    ['path', { d: 'M7 10V7a5 5 0 0 1 9.33-2.5' }],
  ],
  chevronUp: [['path', { d: 'm18 15-6-6-6 6' }]],
  chevronDown: [['path', { d: 'm6 9 6 6 6-6' }]],
  x: [
    ['path', { d: 'M18 6 6 18' }],
    ['path', { d: 'm6 6 12 12' }],
  ],
  layoutGrid: [
    [
      'rect',
      {
        width: '7',
        height: '7',
        x: '3',
        y: '3',
        rx: '1',
      },
    ],
    [
      'rect',
      {
        width: '7',
        height: '7',
        x: '14',
        y: '3',
        rx: '1',
      },
    ],
    [
      'rect',
      {
        width: '7',
        height: '7',
        x: '14',
        y: '14',
        rx: '1',
      },
    ],
    [
      'rect',
      {
        width: '7',
        height: '7',
        x: '3',
        y: '14',
        rx: '1',
      },
    ],
  ],
  images: [
    [
      'path',
      {
        d: 'm22 11-1.296-1.296a2.4 2.4 0 0 0-3.408 0L11 16',
      },
    ],
    [
      'path',
      {
        d: 'M4 8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2',
      },
    ],
    [
      'circle',
      {
        cx: '13',
        cy: '7',
        r: '1',
        fill: 'currentColor',
      },
    ],
    [
      'rect',
      {
        x: '8',
        y: '2',
        width: '14',
        height: '14',
        rx: '2',
      },
    ],
  ],
  bookmark: [
    [
      'path',
      {
        d: 'M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z',
      },
    ],
  ],
  arrowUpRight: [
    [
      'path',
      {
        d: 'M7 7h10v10',
      },
    ],
    [
      'path',
      {
        d: 'M7 17 17 7',
      },
    ],
  ],
  history: [
    [
      'path',
      {
        d: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8',
      },
    ],
    [
      'path',
      {
        d: 'M3 3v5h5',
      },
    ],
    [
      'path',
      {
        d: 'M12 7v5l4 2',
      },
    ],
  ],
} as const
