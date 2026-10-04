import React from 'react';
import { STATE_LABELS } from '../library';

// The two personal marks a reader wants to see on the cover itself.
const RIBBON_STATES = ['okundu', 'alindi'];
const shownStates = marks => RIBBON_STATES.filter(state => marks.includes(state));

/** Ribbons drawn on the cover. They are decoration for sighted readers;
 * StateSummary says the same thing after the title, where a screen reader
 * moving through the card expects it. */
export default function StateRibbons({ marks = [] }) {
 const shown = shownStates(marks);
 if (!shown.length) return null;
 return <span className="state-ribbons" aria-hidden="true">
  {shown.map(state => <span key={state} className="state-ribbon" data-state={state}>{STATE_LABELS[state]}</span>)}
 </span>;
}

export function StateSummary({ marks = [] }) {
 const shown = shownStates(marks);
 if (!shown.length) return null;
 return <span className="visually-hidden">Durum: {shown.map(state => STATE_LABELS[state]).join(', ')}.</span>;
}
