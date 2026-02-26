export type TerminalPrototype = {
  name: string;
  tagline: string;
  palette: string[];
  shape: string;
  elevation: string;
  notes: string;
  wild?: boolean;
};

export const terminalPrototypes: TerminalPrototype[] = [
  {
    name: 'Luminous Stack',
    tagline: 'Layered neon planes that float like command tiles.',
    palette: ['#0f172a', '#5b21b6', '#d946ef', '#e879f9'],
    shape: 'slab + inset',
    elevation: 'glimmering double shadow',
    notes: 'Stack four identical slabs; a subtle split animates their luminous edges as focus shifts.',
  },
  {
    name: 'Cabinet Drawer',
    tagline: 'Terminal embedded in a filing cabinet with a slate hinge.',
    palette: ['#111827', '#374151', '#f97316', '#fef3c7'],
    shape: 'rectangular drawer + bevel',
    elevation: 'linear gradient depth + faint brass lips',
    notes: 'Pulling one drawer drops a new canvas, encouraging quick workspace swaps without GPU-heavy renders.',
  },
  {
    name: 'Voice Halo',
    tagline: 'Ambient ring that listens, glows, and reacts to vocal command.',
    palette: ['#020617', '#0ea5e9', '#4338ca', '#fff3c4'],
    shape: 'circular halo',
    elevation: 'soft neon bloom',
    notes: 'No screen; responses happen in floating widgets. Reconfigurable via voice; perfect for kids without strong GPUs.',
  },
  {
    name: 'Slate Flip',
    tagline: 'Old-school expose flipped sideways into a matte slate.',
    palette: ['#07070d', '#18181b', '#fde68a', '#f472b6'],
    shape: 'wide slab with swivel center',
    elevation: 'heavy drop shadow + micro bevel',
    notes: 'Push left to flip vertices and reveal a second terminal. Merge two panels by stacking their flips.',
  },
  {
    name: 'Widget Bloom',
    tagline: 'Two-toned widgets that bloom from a plant-like stalk.',
    palette: ['#030712', '#0ea5e9', '#2dd4bf', '#f9a8d4'],
    shape: 'rounded tiles connected by stems',
    elevation: 'layered translucent glass',
    notes: 'Pair with a lower-performance GPU: just render the bloom animation and swap widget data with simple overlays.',
  },
  {
    name: 'Archive Ribbon',
    tagline: 'Horizontal ribbons that split or merge when you drag a label.',
    palette: ['#020617', '#374151', '#ef4444', '#fb7185'],
    shape: 'long ribbons with gentle curvature',
    elevation: 'soft shadow + highlight streak',
    notes: 'Four ribbons start aligned, then zip apart to reveal contextual consoles with a minimal fade.',
  },
  {
    name: 'Geo Filing',
    tagline: 'Cubic frame nested inside a tilted shelving unit.',
    palette: ['#05060c', '#1f2937', '#facc15', '#a5b4fc'],
    shape: '3D rotated cube',
    elevation: 'shelf-aligned glow lines',
    notes: 'Stacked in a grid of four, the cubes slide to expose new depths, merging adjacent sides to form a single continuous terminal.',
  },
  {
    name: 'Velvet Split',
    tagline: 'Card table with velvet inset for soft raytrace-like edges.',
    palette: ['#01030a', '#1d1d27', '#fb7185', '#c084fc'],
    shape: 'rounded rectangles with inner stroke',
    elevation: 'dense drop + diffused rim',
    notes: 'Split horizontally; each side reveals bespoke controls. Merge them with a simple seam join animation.',
  },
  {
    name: "That's Batshit Crazy / Solar Filing",
    tagline: 'Solar-powered filing terminal that floats and spins through the room.',
    palette: ['#000000', '#571c87', '#fcd34d', '#ffeb3b'],
    shape: 'floating arcs + solar panel detail',
    elevation: 'hovering, animated orbit',
    notes: 'Every second it rotates to show a different view; not meant for heavy compute but absolute spectacle.',
    wild: true,
  },
  {
    name: "That's Batshit Crazy / Voice Stack",
    tagline: 'Voice-first stack that listens inside a transparent jar with widgets.',
    palette: ['#020617', '#1d4ed8', '#34d399', '#f472b6'],
    shape: 'cylindrical jar + ribbon widgets',
    elevation: 'glassy, floating tiers',
    notes: 'You speak, widgets glow, and the jar splits into four separate panes—no heavy GPU just playful sound cues.',
    wild: true,
  },
];
