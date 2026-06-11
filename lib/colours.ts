export const SECTION_COLOURS = {
  Joeys:     { accent: '#C17F24', pale: 'rgba(193,127,36,0.07)', text: '#fff', label: 'Joeys',     age: '5–8 yrs' },
  Cubs:      { accent: '#E8B800', pale: 'rgba(232,184,0,0.08)',  text: '#3d2800', label: 'Cubs',   age: '8–11 yrs' },
  Scouts:    { accent: '#6BBF5A', pale: 'rgba(107,191,90,0.08)', text: '#fff', label: 'Scouts',   age: '11–15 yrs' },
  Venturers: { accent: '#B5485E', pale: 'rgba(181,72,94,0.07)',  text: '#fff', label: 'Venturers',age: '15–18 yrs' },
} as const;

export type Section = keyof typeof SECTION_COLOURS;
export const NAVY = '#2C3E6B';
