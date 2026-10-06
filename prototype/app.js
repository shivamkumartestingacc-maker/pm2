/* =====================================================================
   PM Dashboard — Interactive Prototype
   Layer A (prototype controller) and Layer B (product UI) are separate.
   Flow switching re-renders the product viewport; no browser navigation.
   ---------------------------------------------------------------------
   Sections
     1. Utilities & DOM helpers
     2. Dummy data (people, projects, records)
     3. State (prototype-level / product-level)
     4. Derivation (quick actions, insights, finances)
     5. UI primitives
     6. Prototype controller (Layer A)
     7. Product shell (Layer B)
     8. Views: Quick Actions / Insights / Records / Project
     9. Action modals
    10. Router & init
   ===================================================================== */
'use strict';

/* =====================================================================
   1. UTILITIES & DOM HELPERS
   ===================================================================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function h(tag, props, ...kids) {
  const node = document.createElement(tag);
  if (props) {
    for (const key of Object.keys(props)) {
      const v = props[key];
      if (v == null || v === false) continue;
      if (key === 'class') node.className = v;
      else if (key === 'text') node.textContent = v;
      else if (key === 'html') node.innerHTML = v;
      else if (key === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (key === 'dataset' && typeof v === 'object') Object.assign(node.dataset, v);
      else if (key === 'on' && typeof v === 'object') {
        for (const ev of Object.keys(v)) node.addEventListener(ev, v[ev]);
      } else if (key === 'attrs' && typeof v === 'object') {
        for (const a of Object.keys(v)) node.setAttribute(a, v[a]);
      } else node.setAttribute(key, v === true ? '' : String(v));
    }
  }
  appendKids(node, kids);
  return node;
}
function appendKids(node, kids) {
  kids.flat(6).forEach(k => {
    if (k == null || k === false) return;
    node.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  });
  return node;
}
const clear = node => { while (node && node.firstChild) node.removeChild(node.firstChild); };

const ICONS = {
  chevron:   '<path d="M9 6l6 6-6 6"/>',
  down:      '<path d="M6 9l6 6 6-6"/>',
  up:        '<path d="M18 15l-6-6-6 6"/>',
  close:     '<path d="M18 6L6 18M6 6l12 12"/>',
  expand:    '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  collapse:  '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
  check:     '<path d="M20 6L9 17l-5-5"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  external:  '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  doc:       '<path d="M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V7z"/><path d="M14 3v4h4"/>',
  calendar:  '<rect x="3.5" y="5" width="17" height="16" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  money:     '<rect x="2.5" y="6" width="19" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/>',
  ticket:    '<path d="M4 8.5A2.5 2.5 0 016.5 6h11A2.5 2.5 0 0120 8.5v1a2.5 2.5 0 000 5v1A2.5 2.5 0 0117.5 18h-11A2.5 2.5 0 014 15.5v-1a2.5 2.5 0 000-5z"/>',
  shield:    '<path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/>',
  search:    '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  inbox:     '<path d="M4 13h4l1.5 3h5L16 13h4"/><path d="M4 13l2.5-7h11L20 13v5a1 1 0 01-1 1H5a1 1 0 01-1-1z"/>',
  chart:     '<path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/>',
  folder:    '<path d="M3 7a1 1 0 011-1h5l2 2.5h8a1 1 0 011 1V18a1 1 0 01-1 1H4a1 1 0 01-1-1z"/>',
  layers:    '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  alert:     '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>',
  clock:     '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  user:      '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.7-3.6 3.5-5.5 7-5.5s6.3 1.9 7 5.5"/>',
  plus:      '<path d="M12 5v14M5 12h14"/>',
  note:      '<path d="M5 4h14v11l-5 5H5z"/><path d="M19 15h-5v5"/>',
  refresh:   '<path d="M20 11a8 8 0 10-2.3 6.3"/><path d="M20 5v6h-6"/>',
  sort:      '<path d="M8 5v14M8 5L5 8M8 5l3 3M16 19V5M16 19l3-3M16 19l-3-3"/>',
  building:  '<path d="M4 21V6l7-3v18M11 21h9V10l-9-3"/><path d="M7 9h1M7 13h1M7 17h1M15 13h1M15 17h1"/>'
};
function icon(name, size = 14, cls = '') {
  const span = h('span', { class: 'ico ico--' + size + (cls ? ' ' + cls : ''), attrs: { 'aria-hidden': 'true' } });
  /* explicit box so a size with no matching CSS class still renders correctly */
  span.style.width = size + 'px';
  span.style.height = size + 'px';
  span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    (ICONS[name] || '') + '</svg>';
  return span;
}

/* ---- dates / numbers ---- */
const DAY = 86400000;
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const dOff = n => new Date(TODAY.getTime() + n * DAY);
const dayDiff = date => Math.round((new Date(date).setHours(0, 0, 0, 0) - TODAY.getTime()) / DAY);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
}
function fmtDateShort(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.getDate() + ' ' + MONTHS[d.getMonth()];
}
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const inrLakh = n => '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + ' L';
const pct = n => Math.round(n) + '%';

/* Urgency language: overdue > due today > soon > calm */
function urgency(n) { return n < 0 ? 'overdue' : n <= 1 ? 'soon' : 'calm'; }
function dueLabel(n) {
  if (n < -1) return 'Overdue ' + Math.abs(n) + ' d';
  if (n === -1) return 'Overdue 1 d';
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  return n + ' d left';
}
function ageLabel(n) { return n <= 0 ? 'Today' : n === 1 ? '1 d ago' : n + ' d ago'; }

/* =====================================================================
   2. DUMMY DATA
   ===================================================================== */
const ROLES = {
  'pm-admin': {
    id: 'pm-admin', label: 'PM Admin',
    user: { id: 'u-meera', name: 'Meera Krishnan', initials: 'MK', title: 'PM Admin · Operations' },
    can: { pmMissedWork: true, assignPm: true, assignSe: true, actForPm: true }
  },
  'pm': {
    id: 'pm', label: 'PM',
    user: { id: 'u-ananya', name: 'Ananya Rao', initials: 'AR', title: 'Project Manager' },
    can: { pmMissedWork: false, assignPm: false, assignSe: true, actForPm: false }
  }
};

const PM_LIST = [
  { id: 'u-ananya',  name: 'Ananya Rao',    initials: 'AR', projects: 3, region: 'West zone' },
  { id: 'u-rohit',   name: 'Rohit Menon',   initials: 'RM', projects: 2, region: 'South zone' },
  { id: 'u-sara',    name: 'Sara Qureshi',  initials: 'SQ', projects: 1, region: 'North zone' },
  { id: 'u-devansh', name: 'Devansh Iyer',  initials: 'DI', projects: 1, region: 'Infra' }
];
const SE_LIST = [
  { id: 'se-karthik', name: 'Karthik Nair',   initials: 'KN', trade: 'Civil' },
  { id: 'se-imran',   name: 'Imran Sheikh',   initials: 'IS', trade: 'MEP' },
  { id: 'se-priya',   name: 'Priya Balan',    initials: 'PB', trade: 'Civil' },
  { id: 'se-vikram',  name: 'Vikram Shah',    initials: 'VS', trade: 'Finishes' }
];
const DESIGNERS = [
  { id: 'd-neha',   name: 'Neha Sharma',  initials: 'NS', dept: 'Design · Architecture' },
  { id: 'd-farhan', name: 'Farhan Ali',   initials: 'FA', dept: 'Design · Structure' }
];
const QA_LIST = [
  { id: 'qa-arjun', name: 'Arjun Pillai',   initials: 'AP' },
  { id: 'qa-divya', name: 'Divya Nambiar',  initials: 'DN' }
];
const CONTRACTORS = [
  { id: 'c-shreeji',  name: 'Shreeji Civil Works' },
  { id: 'c-nova',     name: 'Nova Finishing Co.' },
  { id: 'c-buildright', name: 'BuildRight Structures' }
];
const DEPARTMENTS = ['Civil / Site team', 'MEP', 'Design', 'QA / Quality', 'Finance', 'Commercial'];

const byId = (list, id) => list.find(x => x.id === id) || null;
const personName = id => {
  const p = byId(PM_LIST, id) || byId(SE_LIST, id) || byId(DESIGNERS, id) || byId(QA_LIST, id);
  return p ? p.name : '—';
};

/* ---- stage / sub-stage template (sequential, no parallel stages) ---- */
const STAGE_TEMPLATE = [
  { name: 'Mobilisation & Site Setup', subs: [['Site handover & demarcation', 6], ['Temporary utilities & hoarding', 5], ['Site office & store setup', 5]] },
  { name: 'Foundation', subs: [['Excavation & earthwork', 10], ['PCC & footings', 8], ['Raft / pile cap casting', 12]] },
  { name: 'Structure', subs: [['Columns & beams — L1', 9], ['Slab casting — L1', 7], ['Columns & beams — L2', 9], ['Slab casting — L2', 7], ['Staircase & lift core', 8]] },
  { name: 'Brickwork & Blockwork', subs: [['External blockwork', 10], ['Internal partitions', 9], ['Lintels, chajjas & coping', 5]] },
  { name: 'MEP Rough-in', subs: [['Electrical conduiting', 10], ['Plumbing risers & drainage', 9], ['HVAC ducting & chases', 8]] },
  { name: 'Plastering', subs: [['Internal plastering', 12], ['External plastering', 10]] },
  { name: 'Flooring & Finishes', subs: [['Flooring — tiles / stone', 12], ['Doors, frames & windows', 8], ['Fixtures & fittings', 7]] },
  { name: 'Painting & Polish', subs: [['Primer & putty', 8], ['Final coat & texture', 7], ['Polish & touch-ups', 5]] },
  { name: 'Handover & Snagging', subs: [['Snag list closure', 6], ['Deep cleaning', 4], ['Client handover & documentation', 4]] }
];

/* Project seed list. phase: handover | ongoing | completed
   anchor: which sub-stage date is pinned relative to today, so the board's
   urgency labels stay believable. */
const PROJECT_SEED = [
  { id: 'P-01', name: 'Skyline Residency — Tower B', qid: 'QID-2041', customer: 'Vantage Developers Pvt Ltd',
    customerContact: 'Mr. Suresh Kapoor', type: 'Residential · G+14', pmId: 'u-ananya', seId: 'se-karthik',
    contractorId: 'c-shreeji', contractValue: 48600000, phase: 'ongoing', stageIdx: 2, subIdx: 3,
    anchor: { kind: 'current-planned-end', offset: 0 }, delayDays: 0, status: 'On track' },
  { id: 'P-02', name: 'Harbor Point Retail Fit-out', qid: 'QID-2087', customer: 'Harbor Retail Group',
    customerContact: 'Ms. Rehana Merchant', type: 'Retail fit-out · 2 levels', pmId: 'u-ananya', seId: 'se-imran',
    contractorId: 'c-nova', contractValue: 21400000, phase: 'ongoing', stageIdx: 4, subIdx: 0,
    anchor: { kind: 'last-completed-actual-end', offset: -1 }, delayDays: 6, status: 'Delayed' },
  { id: 'P-03', name: 'Greenwood Villas — Phase 2', qid: 'QID-2103', customer: 'Greenwood Homes',
    customerContact: 'Mr. Ajay Sethi', type: 'Residential · 12 villas', pmId: 'u-rohit', seId: 'se-priya',
    contractorId: 'c-buildright', contractValue: 36200000, phase: 'ongoing', stageIdx: 5, subIdx: 0,
    anchor: { kind: 'last-completed-actual-end', offset: -1 }, delayDays: 0, status: 'On track' },
  { id: 'P-04', name: 'Nexa Corporate Interiors — L12', qid: 'QID-2119', customer: 'Nexa Technologies',
    customerContact: 'Rakesh Iyer · Facilities', type: 'Corporate interiors', pmId: 'u-sara', seId: 'se-vikram',
    contractorId: 'c-nova', contractValue: 18800000, phase: 'ongoing', stageIdx: 6, subIdx: 1,
    anchor: { kind: 'current-planned-end', offset: 1 }, delayDays: 3, status: 'At risk' },
  { id: 'P-05', name: 'Riverside Bridge Approach Road', qid: 'QID-2126', customer: 'State PWD',
    customerContact: 'EE · K. Sundaram', type: 'Infrastructure · 2.4 km', pmId: 'u-devansh', seId: 'se-karthik',
    contractorId: 'c-buildright', contractValue: 84000000, phase: 'ongoing', stageIdx: 1, subIdx: 2,
    anchor: { kind: 'last-completed-actual-end', offset: -1 }, delayDays: 9, status: 'Delayed' },
  { id: 'P-06', name: 'Metro Annex — Block C', qid: 'QID-2134', customer: 'Metro Rail Corporation',
    customerContact: 'Dy. CE · S. Bhattacharya', type: 'Commercial · G+6', pmId: 'u-rohit', seId: 'se-priya',
    contractorId: 'c-shreeji', contractValue: 57000000, phase: 'ongoing', stageIdx: 3, subIdx: 1,
    anchor: { kind: 'current-planned-end', offset: 0 }, delayDays: 0, status: 'On track' },
  { id: 'P-07', name: 'Lakeview Clubhouse', qid: 'QID-2140', customer: 'Lakeview Estates',
    customerContact: 'Ms. Anita Desai', type: 'Amenity · G+1', pmId: 'u-ananya', seId: 'se-vikram',
    contractorId: 'c-nova', contractValue: 12600000, phase: 'ongoing', stageIdx: 7, subIdx: 0,
    anchor: { kind: 'last-completed-actual-end', offset: -1 }, delayDays: 2, status: 'At risk' },

  { id: 'P-08', name: 'Vertex Logistics Warehouse', qid: 'QID-2151', customer: 'Vertex Supply Chain',
    customerContact: 'Mr. Nikhil Verma', type: 'Industrial · PEB 18,000 sq ft', pmId: null, seId: null,
    contractorId: 'c-buildright', contractValue: 42000000, phase: 'handover', designerId: 'd-neha',
    handoverReceivedDaysAgo: 2, handoverDueIn: 1, status: 'Awaiting handover review' },
  { id: 'P-09', name: 'Aster Senior Living — Wing A', qid: 'QID-2152', customer: 'Aster Care Trust',
    customerContact: 'Dr. Malini Rao', type: 'Healthcare · G+4', pmId: null, seId: null,
    contractorId: 'c-shreeji', contractValue: 63500000, phase: 'handover', designerId: 'd-farhan',
    handoverReceivedDaysAgo: 5, handoverDueIn: -2, status: 'Awaiting handover review' },
  { id: 'P-10', name: 'Crestview School — Block D', qid: 'QID-2158', customer: 'Crestview Edu Trust',
    customerContact: 'Principal · J. Fernandes', type: 'Institutional · G+3', pmId: null, seId: null,
    contractorId: 'c-nova', contractValue: 29800000, phase: 'handover', designerId: 'd-neha',
    handoverReceivedDaysAgo: 0, handoverDueIn: 3, status: 'Awaiting handover review' },
  { id: 'P-11', name: 'Cedar Grove Retail Podium', qid: 'QID-2146', customer: 'Cedar Grove Realty',
    customerContact: 'Mr. P. Malhotra', type: 'Retail · G+2', pmId: 'u-sara', seId: 'se-vikram',
    contractorId: 'c-nova', contractValue: 31200000, phase: 'handover', designerId: 'd-farhan',
    handoverReceivedDaysAgo: 11, handoverDueIn: null, status: 'Handed over', handoverState: 'sent',
    stageIdx: 0, subIdx: 0, anchor: { kind: 'current-planned-start', offset: 12 }, delayDays: 0 },
  { id: 'P-12', name: 'Bluestone Service Apartments', qid: 'QID-2139', customer: 'Bluestone Hospitality',
    customerContact: 'Ms. T. Kulkarni', type: 'Hospitality · G+7', pmId: 'u-devansh', seId: 'se-priya',
    contractorId: 'c-shreeji', contractValue: 55400000, phase: 'handover', designerId: 'd-neha',
    handoverReceivedDaysAgo: 19, handoverDueIn: null, status: 'Handed over', handoverState: 'sent',
    stageIdx: 1, subIdx: 0, anchor: { kind: 'current-planned-start', offset: -2 }, delayDays: 0 },

  { id: 'P-20', name: 'Orchid Heights — Tower A', qid: 'QID-1984', customer: 'Orchid Realty',
    customerContact: 'Mr. V. Anand', type: 'Residential · G+11', pmId: 'u-ananya', seId: 'se-karthik',
    contractorId: 'c-shreeji', contractValue: 41200000, phase: 'completed', stageIdx: 8, subIdx: 2,
    anchor: { kind: 'last-completed-actual-end', offset: -118 }, delayDays: 4, status: 'Completed',
    completedDaysAgo: 118 },
  { id: 'P-21', name: 'Bluebay Warehouse — Unit 4', qid: 'QID-1997', customer: 'Bluebay Logistics',
    customerContact: 'Mr. H. Dsouza', type: 'Industrial · PEB', pmId: 'u-rohit', seId: 'se-imran',
    contractorId: 'c-buildright', contractValue: 26800000, phase: 'completed', stageIdx: 8, subIdx: 2,
    anchor: { kind: 'last-completed-actual-end', offset: -176 }, delayDays: 0, status: 'Completed',
    completedDaysAgo: 176 },
  { id: 'P-22', name: 'Saffron Retail Store — Andheri', qid: 'QID-2002', customer: 'Saffron Retail',
    customerContact: 'Ms. K. Joshi', type: 'Retail · 4,200 sq ft', pmId: 'u-sara', seId: 'se-vikram',
    contractorId: 'c-nova', contractValue: 9400000, phase: 'completed', stageIdx: 8, subIdx: 2,
    anchor: { kind: 'last-completed-actual-end', offset: -231 }, delayDays: 0, status: 'Completed',
    completedDaysAgo: 231 }
];

/* ---- schedule builder: sequential stages > sub-stages, planned vs actual ---- */
function buildSchedule(seed) {
  const flat = [];
  STAGE_TEMPLATE.forEach((stage, si) => stage.subs.forEach((s, bi) => flat.push({ si, bi, name: s[0], dur: s[1] })));

  const anchorFlatIdx = (() => {
    const idx = flat.findIndex(f => f.si === seed.stageIdx && f.bi === seed.subIdx);
    return idx >= 0 ? idx : 0;
  })();
  const anchor = seed.anchor || { kind: 'current-planned-start', offset: 0 };
  const completedMode = anchor.kind === 'last-completed-actual-end';
  /* index of last completed sub-stage */
  const lastDoneIdx = completedMode ? anchorFlatIdx : anchorFlatIdx - 1;
  const slip = seed.delayDays || 0;

  /* natural planned sequence from day 0 */
  let cursor = 0;
  const rows = flat.map(f => {
    const plannedStart = cursor;
    cursor += f.dur;
    return { ...f, plannedStart, plannedEnd: cursor - 1 };
  });

  /* actuals: completed sub-stages carry the slip from the stage before current */
  rows.forEach((r, i) => {
    const isDone = i <= lastDoneIdx;
    const slipApplies = r.si >= Math.max(0, seed.stageIdx - 1);
    r.actualStart = isDone ? r.plannedStart + (slipApplies ? slip : 0) : null;
    r.actualEnd = isDone ? r.plannedEnd + (slipApplies ? slip : 0) : null;
    r.state = isDone ? 'Completed' : (i === lastDoneIdx + 1 && !completedMode ? 'In progress' : (completedMode && i === lastDoneIdx + 1 ? 'Ready to start' : 'Not started'));
  });

  /* pin the anchor sub-stage to today + offset, then shift everything */
  const anchorRow = rows[anchorFlatIdx];
  const natural = completedMode ? anchorRow.actualEnd : (anchor.kind === 'current-planned-end' ? anchorRow.plannedEnd : anchorRow.plannedStart);
  const shift = anchor.offset - natural;
  rows.forEach(r => {
    r.plannedStart = dOff(r.plannedStart + shift);
    r.plannedEnd = dOff(r.plannedEnd + shift);
    if (r.actualStart != null) r.actualStart = dOff(r.actualStart + shift);
    if (r.actualEnd != null) r.actualEnd = dOff(r.actualEnd + shift);
  });

  /* state correction: a sub-stage cannot be "In progress" before its planned start */
  rows.forEach(r => {
    if (r.state === 'In progress' && dayDiff(r.plannedStart) > 0) r.state = 'Not started';
  });

  /* in-progress sub-stage progress + forecast */
  rows.forEach((r, i) => {
    if (r.state === 'In progress') {
      const total = r.dur;
      const elapsed = Math.max(0, Math.min(total, dayDiff(TODAY) - dayDiff(r.plannedStart) + 1));
      r.progress = Math.max(8, Math.min(92, Math.round((elapsed / total) * 100)));
      r.forecastEnd = slip > 0 ? dOff(dayDiff(r.plannedEnd) + slip) : r.plannedEnd;
    } else if (r.state === 'Completed') r.progress = 100;
    else r.progress = 0;
    r.id = seed.id + '-s' + r.si + '-' + r.bi;
  });

  /* group into stages */
  return STAGE_TEMPLATE.map((stage, si) => {
    const subs = rows.filter(r => r.si === si);
    const done = subs.filter(s => s.state === 'Completed').length;
    const progress = Math.round(subs.reduce((a, s) => a + s.progress, 0) / subs.length);
    const state = done === subs.length ? 'Completed' : (done > 0 || subs.some(s => s.state === 'In progress') ? 'In progress' : 'Not started');
    return {
      id: seed.id + '-st' + si,
      name: stage.name,
      subs,
      state,
      progress,
      plannedStart: subs[0].plannedStart,
      plannedEnd: subs[subs.length - 1].plannedEnd,
      actualStart: subs.find(s => s.actualStart) ? subs.find(s => s.actualStart).actualStart : null,
      actualEnd: done === subs.length ? subs[subs.length - 1].actualEnd : null,
      varianceDays: done === subs.length ? dayDiff(subs[subs.length - 1].actualEnd) - dayDiff(subs[subs.length - 1].plannedEnd) : null
    };
  });
}

/* ---- finances derived from the schedule (client money vs contractor payout) ---- */
function buildFinances(project) {
  const stages = project.schedule;
  const payable = stages.slice(1);
  const totalDays = payable.reduce((a, st) => a + st.subs.reduce((x, s) => x + s.dur, 0), 0) || 1;
  const currentStageIdx = project.stageIdx;

  const client = payable.map((st, i) => {
    const si = i + 1;
    const days = st.subs.reduce((x, s) => x + s.dur, 0);
    const amount = Math.round((project.contractValue * days / totalDays) / 10000) * 10000;
    const startsIn = dayDiff(st.plannedStart);
    let state, requestedOn = null, paidOn = null;
    if (si < currentStageIdx) { state = 'Paid'; requestedOn = dOff(dayDiff(st.plannedStart) - 14); paidOn = dOff(dayDiff(st.plannedStart) - 5); }
    else if (si === currentStageIdx) { state = 'Paid'; requestedOn = dOff(dayDiff(st.plannedStart) - 12); paidOn = dOff(dayDiff(st.plannedStart) - 4); }
    else if (si === currentStageIdx + 1 && startsIn <= 10 && startsIn >= -5) state = 'To request';
    else state = 'Not due';
    return { id: project.id + '-cp' + si, projectId: project.id, kind: 'client', stage: st.name, stageIdx: si,
      stageStart: st.plannedStart, amount, state, requestedOn, paidOn, milestone: 'Stage ' + si + ' mobilisation payment' };
  });

  /* contractor payouts — one per completed sub-stage; only the most recent is actionable */
  const doneSubs = [];
  stages.forEach(st => st.subs.forEach(s => { if (s.state === 'Completed') doneSubs.push({ st, s }); }));
  const contractor = doneSubs.slice(-6).map((row, i, arr) => {
    const { st, s } = row;
    const isLast = i === arr.length - 1;
    const since = -dayDiff(s.actualEnd);
    const amount = Math.round((project.contractValue * s.dur / totalDays / 1.7) / 10000) * 10000;
    let state = 'Paid', requestedOn = null;
    if (isLast && project.phase === 'ongoing' && since >= 1 && since <= 6) { state = 'Awaiting request'; }
    else if (isLast && project.phase === 'ongoing' && since > 6) { state = 'Paid'; }
    else if (isLast && project.phase === 'ongoing') { state = 'Pending completion'; }
    if (state === 'Paid') { requestedOn = dOff(dayDiff(s.actualEnd) + 1); }
    return { id: project.id + '-co' + s.si + s.bi, projectId: project.id, kind: 'contractor',
      contractorId: project.contractorId, stage: st.name, subStage: s.name, completedOn: s.actualEnd,
      plannedEnd: s.plannedEnd, amount, state, requestedOn,
      measurement: 'Measurement book entry MB/' + project.qid.slice(-4) + '/' + (s.si + 1) + '.' + (s.bi + 1) };
  });

  return { client, contractor };
}

/* ---- handover document packs ---- */
function buildHandover(project) {
  if (project.phase !== 'handover') return null;
  const designer = byId(DESIGNERS, project.designerId);
  const received = dOff(-project.handoverReceivedDaysAgo);
  const sets = [
    { name: 'General arrangement drawings — all levels', type: 'DWG', meta: 'Rev C · 42 sheets', size: '18.4 MB' },
    { name: 'Structural design set & calculations', type: 'PDF', meta: 'Rev B · 96 pages', size: '24.1 MB' },
    { name: 'MEP layout & schematic drawings', type: 'PDF', meta: 'Rev A · 38 sheets', size: '12.7 MB' },
    { name: 'Bill of quantities (BOQ)', type: 'XLSX', meta: 'Rev 2 · 6 tabs', size: '860 KB' },
    { name: 'Specification & material schedule', type: 'PDF', meta: 'Rev A · 54 pages', size: '6.2 MB' },
    { name: 'Statutory approvals & NOC copies', type: 'PDF', meta: '12 documents', size: '9.8 MB' }
  ];
  const count = project.id === 'P-08' ? 5 : project.id === 'P-10' ? 4 : 6;
  return {
    id: project.id + '-ho',
    projectId: project.id,
    designerId: project.designerId,
    designerName: designer ? designer.name : 'Design',
    designerDept: designer ? designer.dept : 'Design',
    receivedOn: received,
    dueIn: project.handoverDueIn,
    state: project.handoverState || 'pending',
    docs: sets.slice(0, count).map((d, i) => ({
      id: project.id + '-doc' + (i + 1),
      name: d.name, type: d.type, meta: d.meta, size: d.size,
      issuedBy: designer ? designer.name : 'Design',
      issuedOn: dOff(-project.handoverReceivedDaysAgo - (i % 3)),
      category: 'Design handover',
      review: 'Unreviewed',
      remark: null
    }))
  };
}

/* ---- SE Updates records (Quick Actions + Project → SE Updates share these) ---- */
const SE_RECORDS = {
  'P-01': [
    { id: 'P-01-se-01', type: 'inspection-report', title: 'Rebar inspection — Slab L2, Grid C–F',
      raisedBy: 'se-karthik', raisedDaysAgo: 1, state: 'Pending approval', dueIn: 0,
      scope: 'Slab L2 reinforcement before pour · Grid C–F',
      checklist: { total: 24, pass: 22, attention: 2 },
      items: [
        { item: 'Bar diameter & spacing — top mat', result: 'Pass', note: '12 mm @ 150 c/c as per drawing S-204' },
        { item: 'Bar diameter & spacing — bottom mat', result: 'Pass', note: '10 mm @ 125 c/c as per drawing S-205' },
        { item: 'Cover blocks @ 25 mm', result: 'Observation', note: 'Spacing above 1 m at grid D4 — add 6 additional blocks' },
        { item: 'Lap length & splice location', result: 'Pass', note: '55d laps staggered, verified at 14 locations' },
        { item: 'Shuttering alignment & supports', result: 'Pass', note: 'Props @ 1.2 m c/c, wedges tight' },
        { item: 'Embedments & conduit clearance', result: 'Observation', note: 'Two conduits resting on bottom mat — re-tie before pour' }
      ],
      conclusion: 'Reinforcement acceptable for pour subject to closing the two observations before casting.' },
    { id: 'P-01-se-02', type: 'daily-report', title: 'Daily report — Columns L2 casting', raisedBy: 'se-karthik',
      raisedDaysAgo: 6, state: 'Published', dueIn: null },
    { id: 'P-01-se-03', type: 'material-request', title: 'Material request — TMT Fe500 42 t', raisedBy: 'se-karthik',
      raisedDaysAgo: 9, state: 'Approved', dueIn: null }
  ],
  'P-02': [
    { id: 'P-02-se-01', type: 'daily-report', title: 'Daily report — Electrical conduiting, Level 1',
      raisedBy: 'se-imran', raisedDaysAgo: 0, state: 'Pending approval', dueIn: 0,
      summary: 'Conduiting for Level 1 retail grid completed on the north bay. Two DB locations shifted after coordination with the landlord’s MEP drawing.',
      workDone: [
        'GI conduiting — north bay, 480 m laid and tied',
        'DB-1A / DB-1B wall boxes set and labelled',
        'Cable tray support fabrication — 32 supports welded',
        'Coordination walkthrough with landlord MEP team'
      ],
      manpower: { skilled: 14, unskilled: 8, staff: 2 },
      hours: 184,
      materials: [
        { item: 'GI conduit 25 mm', qty: '480 m' },
        { item: 'Saddles & ties', qty: '960 nos' },
        { item: 'MS angle 25×25', qty: '180 kg' }
      ],
      issues: [
        'Landlord drawing revision shifted two DB locations — re-routing adds ~40 m conduit',
        'Scaffolding at south bay still occupied by the false-ceiling team'
      ],
      safety: 'Toolbox talk on working at height. No incidents. One near-miss (unsecured ladder) closed on site.',
      nextDay: 'Complete south bay conduiting once scaffolding is released; start cable pulling for the east circuit.' },
    { id: 'P-02-se-02', type: 'material-request', title: 'Material request — GI conduit & accessories',
      raisedBy: 'se-imran', raisedDaysAgo: 4, state: 'Approved', dueIn: null },
    { id: 'P-02-se-03', type: 'daily-report', title: 'Daily report — Internal partitions close-out',
      raisedBy: 'se-imran', raisedDaysAgo: 11, state: 'Published', dueIn: null }
  ],
  'P-03': [
    { id: 'P-03-se-01', type: 'weekly-material-report', title: 'Weekly material report — Week 40',
      raisedBy: 'se-priya', raisedDaysAgo: 0, state: 'Pending approval', dueIn: 1,
      week: 'Week 40', period: fmtDate(dOff(-6)) + ' – ' + fmtDate(TODAY),
      lines: [
        { material: 'AAC blocks 600×200×200', opening: 4200, received: 6000, consumed: 5480, closing: 4720, unit: 'nos', variance: '+2.1%' },
        { material: 'OPC 53 grade cement', opening: 320, received: 400, consumed: 386, closing: 334, unit: 'bags', variance: '−1.4%' },
        { material: 'River sand (plastering)', opening: 46, received: 60, consumed: 58, closing: 48, unit: 'm³', variance: '+3.6%' },
        { material: 'Bonding adhesive', opening: 84, received: 60, consumed: 71, closing: 73, unit: 'bags', variance: '0.0%' }
      ],
      summary: 'Blockwork consumption 2.1% above the estimated rate for villas 7–12; largely attributable to cutting wastage on curved partitions.' },
    { id: 'P-03-se-02', type: 'inspection-report', title: 'Inspection — Lintel & chajja levels', raisedBy: 'se-priya',
      raisedDaysAgo: 7, state: 'Approved', dueIn: null }
  ],
  'P-05': [
    { id: 'P-05-se-01', type: 'material-request', title: 'Material request — Raft concrete & TMT Fe500',
      raisedBy: 'se-karthik', raisedDaysAgo: 2, state: 'Pending approval', dueIn: -1,
      neededBy: fmtDate(dOff(3)), reason: 'Raft / pile cap casting window opens in 3 days; RMC slot must be confirmed 48 h ahead.',
      lines: [
        { material: 'RMC M30 (raft)', spec: 'PPC based, 180 mm slump ± 25', qty: 180, unit: 'm³', estRate: 6450, amount: 1161000 },
        { material: 'TMT Fe500D 25 mm', spec: 'IS 1786, mill test cert required', qty: 42, unit: 't', estRate: 61800, amount: 2595600 },
        { material: 'TMT Fe500D 16 mm', spec: 'IS 1786', qty: 18, unit: 't', estRate: 62400, amount: 1123200 },
        { material: 'Curing compound', spec: 'Acrylic, spray applied', qty: 400, unit: 'L', estRate: 145, amount: 58000 }
      ],
      deliveryLocation: 'Site batch plant + laydown area B',
      total: 4937800 },
    { id: 'P-05-se-02', type: 'daily-report', title: 'Daily report — PCC & footings', raisedBy: 'se-karthik',
      raisedDaysAgo: 3, state: 'Pending approval', dueIn: -2,
      summary: 'PCC completed for chains 0+180 to 0+320. Raining in the evening restricted the second pour.',
      workDone: ['PCC 1:4:8 laid — 140 m length', 'Formwork for footing F7–F9 ready', 'De-shuttering at chains 0+060 to 0+180'],
      manpower: { skilled: 22, unskilled: 31, staff: 3 }, hours: 296,
      materials: [{ item: 'PCC M10', qty: '96 m³' }, { item: 'Steel plates', qty: '1.2 t' }],
      issues: ['Unseasonal rain 17:30–19:10 — pour stopped, rescheduled', 'Approach road at chain 0+300 waterlogged; transit mixers rerouted'],
      safety: 'PPE compliance 100%. Excavation edge protection reinstated after rain.',
      nextDay: 'Complete footing F7–F9 reinforcement; resume PCC once the laydown area dries.' },
    { id: 'P-05-se-03', type: 'inspection-report', title: 'Inspection — Compaction test, chain 0+120', raisedBy: 'se-karthik',
      raisedDaysAgo: 8, state: 'Published', dueIn: null }
  ],
  'P-07': [
    { id: 'P-07-se-01', type: 'inspection-report', title: 'Inspection — Putty & primer finish, main hall',
      raisedBy: 'se-vikram', raisedDaysAgo: 3, state: 'Pending approval', dueIn: -1,
      scope: 'Interior putty and primer finish — main hall & lounge ceiling',
      checklist: { total: 18, pass: 15, attention: 3 },
      items: [
        { item: 'Surface preparation & scraping', result: 'Pass', note: 'Loose material removed, surface dust-free' },
        { item: 'Putty coat thickness (2 coats)', result: 'Pass', note: 'Measured 1.1–1.4 mm at 8 locations' },
        { item: 'Sanding uniformity', result: 'Observation', note: 'Undulation visible under grazing light at lounge ceiling grid 3' },
        { item: 'Primer coverage & opacity', result: 'Pass', note: 'Uniform, no bleed-through' },
        { item: 'Corner beads & edge alignment', result: 'Observation', note: 'Two external corners out of line by ~3 mm' },
        { item: 'Protection of adjacent finishes', result: 'Pass', note: 'Flooring and joinery masked' }
      ],
      conclusion: 'Finish acceptable to proceed to the final coat after re-sanding the lounge ceiling and correcting two corners.' }
  ],
  'P-04': [
    { id: 'P-04-se-01', type: 'daily-report', title: 'Daily report — Door frames, L12 east wing', raisedBy: 'se-vikram',
      raisedDaysAgo: 1, state: 'Published', dueIn: null },
    { id: 'P-04-se-02', type: 'material-request', title: 'Material request — Fixtures & fittings', raisedBy: 'se-vikram',
      raisedDaysAgo: 5, state: 'Approved', dueIn: null }
  ],
  'P-06': [
    { id: 'P-06-se-01', type: 'daily-report', title: 'Daily report — Internal partitions, Block C', raisedBy: 'se-priya',
      raisedDaysAgo: 1, state: 'Published', dueIn: null }
  ]
};

/* ---- QA reports (Quick Actions + Project → QA Reports share these) ---- */
const QA_RECORDS = {
  'P-01': [
    { id: 'P-01-qa-01', title: 'QA report — Slab L2 pre-pour check', stage: 'Structure', subStage: 'Slab casting — L2',
      inspectedDaysAgo: 1, inspectorId: 'qa-arjun', state: 'Pending review', dueIn: 0,
      summary: 'Pre-pour verification of reinforcement, cover and embedments for Slab L2. Two minor items to close before casting.',
      checklist: { total: 26, pass: 24, attention: 2 },
      findings: [
        { item: 'Cover blocks spacing at grid D4', severity: 'Minor', note: 'Above 1 m spacing over a 4 m² patch — additional blocks to be placed before pour.', clause: 'IS 456 · 26.4' },
        { item: 'Conduits resting on bottom mat', severity: 'Minor', note: 'Two conduits to be re-tied to the top mat to avoid cover loss.', clause: 'Project MEP spec 4.2' },
        { item: 'Cube test scheduling', severity: 'Observation', note: 'Confirm 6 cubes for the pour; lab slot booked for the following morning.', clause: 'IS 516' }
      ] },
    { id: 'P-01-qa-02', title: 'QA report — Columns L1 cube test review', stage: 'Structure', subStage: 'Columns & beams — L1',
      inspectedDaysAgo: 22, inspectorId: 'qa-arjun', state: 'Approved', dueIn: null,
      summary: 'All 6 cubes achieved 34.6–37.2 N/mm² against M30 requirement.', checklist: { total: 12, pass: 12, attention: 0 }, findings: [] }
  ],
  'P-05': [
    { id: 'P-05-qa-01', title: 'QA report — Raft reinforcement & curing readiness', stage: 'Foundation', subStage: 'Raft / pile cap casting',
      inspectedDaysAgo: 2, inspectorId: 'qa-divya', state: 'Pending review', dueIn: -1,
      summary: 'Pre-cast verification for the raft at chains 0+000 to 0+180. One major item on bottom cover must be closed before casting.',
      checklist: { total: 30, pass: 26, attention: 4 },
      findings: [
        { item: 'Bottom cover to raft reinforcement', severity: 'Major', note: 'Cover measured 32–38 mm against 50 mm specified at 6 of 12 locations. Additional spacers required and re-inspection needed.', clause: 'IS 456 · 26.4.1' },
        { item: 'Kicker surface preparation', severity: 'Minor', note: 'Laitance not fully removed at pile cap PC-04.', clause: 'Project spec 3.7' },
        { item: 'Curing arrangement for the pour day', severity: 'Minor', note: 'Water source for ponding not yet confirmed for the 48 h curing window.', clause: 'IS 456 · 13.5' },
        { item: 'Thermocouple placement (mass concrete)', severity: 'Observation', note: 'Place at 3 locations as per the approved method statement.', clause: 'MMS-014' }
      ] },
    { id: 'P-05-qa-02', title: 'QA report — Compaction, approach embankment', stage: 'Foundation', subStage: 'Excavation & earthwork',
      inspectedDaysAgo: 9, inspectorId: 'qa-divya', state: 'Rejected', dueIn: null,
      summary: 'Field density below 95% MDD at two layers; re-compaction ordered.', checklist: { total: 14, pass: 10, attention: 4 }, findings: [] }
  ],
  'P-04': [
    { id: 'P-04-qa-01', title: 'QA report — Flooring level tolerance, L12', stage: 'Flooring & Finishes', subStage: 'Flooring — tiles / stone',
      inspectedDaysAgo: 0, inspectorId: 'qa-arjun', state: 'Pending review', dueIn: 1,
      summary: 'Level tolerance check across the open floor plate. One minor deviation near the service core.',
      checklist: { total: 20, pass: 19, attention: 1 },
      findings: [
        { item: 'Floor level deviation near service core', severity: 'Minor', note: '+4 mm over a 2 m straight edge at grid B7 — within re-workable limits before threshold installation.', clause: 'IS 15622 · 6.3' }
      ] }
  ],
  'P-07': [
    { id: 'P-07-qa-01', title: 'QA report — Primer & putty finish, main hall', stage: 'Painting & Polish', subStage: 'Primer & putty',
      inspectedDaysAgo: 0, inspectorId: 'qa-divya', state: 'Pending review', dueIn: 1,
      summary: 'Surface finish check ahead of the final coat. One minor item on ceiling undulation.',
      checklist: { total: 16, pass: 15, attention: 1 },
      findings: [
        { item: 'Ceiling undulation, lounge grid 3', severity: 'Minor', note: 'Visible under grazing light — re-sand and spot-putty before the final coat.', clause: 'Painting spec 5.1' }
      ] }
  ],
  'P-03': [
    { id: 'P-03-qa-01', title: 'QA report — External plastering, villas 7–9', stage: 'Plastering', subStage: 'External plastering',
      inspectedDaysAgo: 14, inspectorId: 'qa-arjun', state: 'Approved', dueIn: null,
      summary: 'Plaster thickness and finish within tolerance.', checklist: { total: 18, pass: 18, attention: 0 }, findings: [] }
  ]
};

/* ---- Client tickets (Quick Actions + Project → Client Tickets share these) ---- */
const TICKET_RECORDS = {
  'P-01': [
    { id: 'P-01-tk-01', code: 'TCK-1042', client: 'Mr. Suresh Kapoor', title: 'Seepage marks on L3 ceiling after rain',
      category: 'Quality / Defect', raisedDaysAgo: 3, priority: 'High', state: 'Open', department: null, dueIn: -1,
      messages: [
        { who: 'Mr. Suresh Kapoor', role: 'Client', daysAgo: 3, text: 'After yesterday’s rain we noticed three damp patches on the L3 ceiling near the staircase lobby. Photographs are attached. This is the same area where the slab was cast last month — please check whether this is a curing issue or a plumbing leak before we proceed further.' }
      ],
      internalNotes: [
        { who: 'Karthik Nair', role: 'Site Engineer', daysAgo: 2, text: 'Visual check done. No active leak from the plumbing chase. Likely honeycombing near the construction joint at grid D4. Recommend a water-tightness test before patch repair.' }
      ] },
    { id: 'P-01-tk-02', code: 'TCK-1036', client: 'Mr. Suresh Kapoor', title: 'Request for revised layout of parking ramp',
      category: 'Design change', raisedDaysAgo: 12, priority: 'Medium', state: 'Resolved', department: 'Design', dueIn: null,
      messages: [{ who: 'Mr. Suresh Kapoor', role: 'Client', daysAgo: 12, text: 'Can the parking ramp gradient be reduced slightly? Two of our buyers raised this.' }],
      internalNotes: [] }
  ],
  'P-07': [
    { id: 'P-07-tk-01', code: 'TCK-1051', client: 'Ms. Anita Desai', title: 'Change request — lobby lighting fixture selection',
      category: 'Change request', raisedDaysAgo: 1, priority: 'Medium', state: 'Open', department: null, dueIn: 1,
      messages: [
        { who: 'Ms. Anita Desai', role: 'Client', daysAgo: 1, text: 'We would like to move to the larger pendant fixtures for the clubhouse lobby. Could you share the cost and schedule impact? We are happy to approve quickly if it does not push handover.' }
      ],
      internalNotes: [] }
  ],
  'P-04': [
    { id: 'P-04-tk-01', code: 'TCK-1048', client: 'Rakesh Iyer · Facilities', title: 'Access cards not working at L12 turnstile',
      category: 'Site access', raisedDaysAgo: 5, priority: 'High', state: 'In review', department: 'MEP', dueIn: -2,
      messages: [
        { who: 'Rakesh Iyer', role: 'Client', daysAgo: 5, text: 'Since Monday, staff cards are intermittently failing at the L12 turnstile. This is affecting shift changeovers. Please look into it as a priority.' },
        { who: 'Rakesh Iyer', role: 'Client', daysAgo: 2, text: 'Still happening this morning — around 8:40 AM, four of our team could not enter.' }
      ],
      internalNotes: [
        { who: 'Vikram Shah', role: 'Site Engineer', daysAgo: 3, text: 'Reader firmware updated once; issue recurred. Suspect the controller power supply unit shared with the pantry circuit.' }
      ] }
  ]
};

/* ---- Project documents (Project → Documents). Handover docs come from the pack. ---- */
const DOC_RECORDS = {
  'P-01': [
    { name: 'Structural GA — Tower B, levels 1–4', type: 'PDF', meta: 'Rev C · 28 sheets', issuedDaysAgo: 34, source: 'Design · Neha Sharma', category: 'Drawings', status: 'Issued for construction', review: 'Not required' },
    { name: 'Method statement — slab casting L2', type: 'PDF', meta: 'MS-021 · 14 pages', issuedDaysAgo: 9, source: 'Site · Karthik Nair', category: 'Method statement', status: 'Approved', review: 'Not required' },
    { name: 'Cube test report — Columns L1', type: 'PDF', meta: 'Lab/2026/418', issuedDaysAgo: 20, source: 'QA · Arjun Pillai', category: 'QA record', status: 'Closed', review: 'Not required' },
    { name: 'Weekly progress report — Week 39', type: 'XLSX', meta: '4 tabs', issuedDaysAgo: 8, source: 'PM · Ananya Rao', category: 'Report', status: 'Shared with client', review: 'Not required' },
    { name: 'RA 1 measurement sheet — Structure', type: 'XLSX', meta: 'MB/2041/3.1', issuedDaysAgo: 16, source: 'Commercial', category: 'Commercial', status: 'Under verification', review: 'Not required' }
  ],
  'P-02': [
    { name: 'MEP coordination drawings — Level 1', type: 'DWG', meta: 'Rev D · 16 sheets', issuedDaysAgo: 18, source: 'Design · Farhan Ali', category: 'Drawings', status: 'Issued for construction', review: 'Not required' },
    { name: 'Landlord fit-out guidelines', type: 'PDF', meta: 'v6 · 42 pages', issuedDaysAgo: 46, source: 'Client · Harbor Retail Group', category: 'Client document', status: 'Reference', review: 'Not required' },
    { name: 'Material approval — GI conduit & accessories', type: 'PDF', meta: 'MAS-014', issuedDaysAgo: 12, source: 'PM · Ananya Rao', category: 'Material approval', status: 'Approved', review: 'Not required' }
  ],
  'P-05': [
    { name: 'Approved GFC — approach road & embankment', type: 'PDF', meta: 'Rev B · 52 sheets', issuedDaysAgo: 61, source: 'Design · Neha Sharma', category: 'Drawings', status: 'Issued for construction', review: 'Not required' },
    { name: 'MMS-014 — mass concrete raft pour', type: 'PDF', meta: '18 pages', issuedDaysAgo: 11, source: 'Site · Karthik Nair', category: 'Method statement', status: 'Approved', review: 'Not required' },
    { name: 'Field density test report — chain 0+120', type: 'PDF', meta: 'FDT/2026/092', issuedDaysAgo: 8, source: 'QA · Divya Nambiar', category: 'QA record', status: 'Rejected — re-test', review: 'Not required' }
  ],
  'P-03': [
    { name: 'Villa typology set — Phase 2', type: 'PDF', meta: 'Rev E · 34 sheets', issuedDaysAgo: 88, source: 'Design · Neha Sharma', category: 'Drawings', status: 'Issued for construction', review: 'Not required' },
    { name: 'Weekly material report — Week 39', type: 'XLSX', meta: '3 tabs', issuedDaysAgo: 7, source: 'SE · Priya Balan', category: 'Report', status: 'Approved', review: 'Not required' }
  ],
  'P-04': [
    { name: 'Interior layout — L12 as-built coordination', type: 'DWG', meta: 'Rev F · 22 sheets', issuedDaysAgo: 26, source: 'Design · Farhan Ali', category: 'Drawings', status: 'Issued for construction', review: 'Not required' },
    { name: 'Flooring material sample approval', type: 'PDF', meta: 'MAS-031', issuedDaysAgo: 19, source: 'Client · Nexa Technologies', category: 'Material approval', status: 'Approved', review: 'Not required' }
  ],
  'P-06': [
    { name: 'Structural set — Block C', type: 'PDF', meta: 'Rev C · 40 sheets', issuedDaysAgo: 74, source: 'Design · Neha Sharma', category: 'Drawings', status: 'Issued for construction', review: 'Not required' }
  ],
  'P-07': [
    { name: 'Clubhouse architectural set', type: 'PDF', meta: 'Rev D · 24 sheets', issuedDaysAgo: 96, source: 'Design · Neha Sharma', category: 'Drawings', status: 'Issued for construction', review: 'Not required' },
    { name: 'Painting specification & shade card', type: 'PDF', meta: '22 pages', issuedDaysAgo: 30, source: 'Client · Lakeview Estates', category: 'Specification', status: 'Approved', review: 'Not required' }
  ]
};

/* ---- PM Missed Work (PM Admin only) ---- */
const MISSED_WORK = [
  { id: 'MW-01', projectId: 'P-03', pmId: 'u-rohit', category: 'qa', categoryLabel: 'QA Requests',
    title: 'QA report review — External plastering, villas 7–9', expectedDaysAgo: 4,
    detail: 'QA raised the report for review on the same day. Site work has continued and the next sub-stage started without a recorded PM decision.',
    action: 'Review and approve the QA report', summary: '18 of 18 checklist items passed · no open findings' },
  { id: 'MW-02', projectId: 'P-06', pmId: 'u-rohit', category: 'money', categoryLabel: 'Money / Payments',
    title: 'Client money request — MEP Rough-in stage', expectedDaysAgo: 2,
    detail: 'The request window opened 10 days before the stage start. Finance has not received a client payment request for this stage.',
    action: 'Send the client payment request', summary: '₹ stage payment · window opened 12 days ago' },
  { id: 'MW-03', projectId: 'P-05', pmId: 'u-devansh', category: 'se-updates', categoryLabel: 'SE Updates',
    title: 'Daily report approval — PCC & footings', expectedDaysAgo: 6,
    detail: 'Two daily reports are awaiting approval. The client app has not received site updates for the period.',
    action: 'Approve and publish the daily report', summary: '2 reports pending · 296 labour hours unverified' }
];

/* ---- assemble the dummy database (single source of truth) ---- */
const DB = { projects: [], missedWork: [] };

function initDB() {
  DB.projects = PROJECT_SEED.map(seed => {
    const p = Object.assign({}, seed);
    p.schedule = buildSchedule(p);
    p.finances = buildFinances(p);
    p.handover = buildHandover(p);
    p.records = {
      se: (SE_RECORDS[p.id] || []).map(r => Object.assign({}, r, { projectId: p.id, raisedOn: dOff(-r.raisedDaysAgo) })),
      qa: (QA_RECORDS[p.id] || []).map(r => Object.assign({}, r, { projectId: p.id, inspectedOn: dOff(-r.inspectedDaysAgo) })),
      tickets: (TICKET_RECORDS[p.id] || []).map(r => Object.assign({}, r, { projectId: p.id, raisedOn: dOff(-r.raisedDaysAgo) }))
    };
    /* documents: handover pack first, then project documents */
    p.documents = (p.handover ? p.handover.docs.map(d => Object.assign({}, d, { source: 'Design · ' + p.handover.designerName, status: 'Handover pack' })) : [])
      .concat((DOC_RECORDS[p.id] || []).map(d => Object.assign({}, d, {
        id: p.id + '-pd' + d.name.length + '-' + d.issuedDaysAgo,
        issuedOn: dOff(-d.issuedDaysAgo)
      })));
    DB.projects.push(p);
    return p;
  });
  DB.missedWork = MISSED_WORK.map(m => Object.assign({}, m, { cleared: false }));
}

const getProject = id => DB.projects.find(p => p.id === id) || null;
const getSeRecord = (pid, id) => (getProject(pid) ? getProject(pid).records.se.find(r => r.id === id) : null);
const getQaRecord = (pid, id) => (getProject(pid) ? getProject(pid).records.qa.find(r => r.id === id) : null);
const getTicket = (pid, id) => (getProject(pid) ? getProject(pid).records.tickets.find(r => r.id === id) : null);
const getHandoverDoc = (pid, id) => {
  const p = getProject(pid);
  return p && p.handover ? p.handover.docs.find(d => d.id === id) : null;
};

/* =====================================================================
   3. STATE — prototype-level and product-level kept separate
   ===================================================================== */
const prototypeState = {
  currentFlow: 'flow-qa',
  role: 'pm-admin'
};

const productState = {
  view: 'quick-actions',              /* quick-actions | insights | records | project */
  qa: { expanded: null, scrollX: 0 }, /* board context preserved across overlays */
  records: { tab: 'ongoing', query: '', filters: { pm: 'all', status: 'all', delay: 'all' }, sort: { key: 'name', dir: 'asc' } },
  project: { id: null, section: 'details', focusId: null, returnTo: null },
  overlay: null,                      /* { kind, category, actionId } */
  flash: null                         /* transient confirmation inside a view */
};

const currentRole = () => ROLES[prototypeState.role];
const currentUser = () => currentRole().user;
const can = key => !!currentRole().can[key];

/* =====================================================================
   4. DERIVATION — quick actions, insights
   ===================================================================== */
const CATEGORIES = [
  { id: 'design-handover', label: 'Design Handover', icon: 'doc', hint: 'Packs received from Design' },
  { id: 'se-updates', label: 'SE Updates', icon: 'note', hint: 'Reports and requests from Site Engineers' },
  { id: 'money', label: 'Money / Payments', icon: 'money', hint: 'Client requests and contractor payouts' },
  { id: 'qa', label: 'QA Requests', icon: 'checkCircle', hint: 'Quality reports awaiting review' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', hint: 'Schedule events needing a PM decision' },
  { id: 'tickets', label: 'Tickets', icon: 'ticket', hint: 'Client-raised issues' },
  { id: 'pm-missed', label: 'PM Missed Work', icon: 'alert', hint: 'Escalations — PM Admin only', adminOnly: true }
];
const categoryById = id => CATEGORIES.find(c => c.id === id);

const SE_TYPES = {
  'daily-report': { label: 'Daily Report', short: 'Daily', verb: 'Approve & publish', publishedToClient: true },
  'inspection-report': { label: 'Inspection Report', short: 'Inspection', verb: 'Approve & publish', publishedToClient: true },
  'material-request': { label: 'Material Request', short: 'Material', verb: 'Approve request', publishedToClient: false },
  'weekly-material-report': { label: 'Weekly Material Report', short: 'Weekly', verb: 'Approve report', publishedToClient: false }
};

/* Which project section an action's "Open in project" deep-links to */
const DEEP_LINK = {
  'design-handover': 'documents',
  'se-updates': 'se-updates',
  'money': 'finances',
  'qa': 'qa',
  'schedule': 'schedule',
  'tickets': 'tickets',
  'pm-missed': 'details'
};
const SECTION_LABEL = {
  details: 'Project Details', schedule: 'Schedule', 'se-updates': 'SE Updates', finances: 'Finances',
  documents: 'Documents', qa: 'QA Reports', tickets: 'Client Tickets'
};

function scheduleActionFor(p) {
  for (const stage of p.schedule) {
    for (const sub of stage.subs) {
      if (sub.state === 'In progress' && dayDiff(sub.plannedEnd) <= 0) {
        return {
          id: 'act-sch-' + sub.id, category: 'schedule', type: 'mark-complete', projectId: p.id,
          title: 'Mark sub-stage complete', person: stage.name + ' → ' + sub.name,
          dueIn: dayDiff(sub.plannedEnd), focusId: sub.id,
          payload: { subId: sub.id, stageId: stage.id }
        };
      }
      if (sub.state === 'Ready to start') {
        return {
          id: 'act-sch-' + sub.id, category: 'schedule', type: 'start-next', projectId: p.id,
          title: 'Start next sub-stage', person: stage.name + ' → ' + sub.name,
          dueIn: dayDiff(sub.plannedStart), focusId: sub.id,
          payload: { subId: sub.id, stageId: stage.id }
        };
      }
    }
  }
  return null;
}

function buildActions() {
  const out = [];
  DB.projects.forEach(p => {
    /* Design handover — projects arriving from Design.
       A PM who has completed their review no longer sees the action; PM Admin
       still sees it until the project is sent to a PM. */
    if (p.handover && p.handover.state === 'pending' && !(prototypeState.role === 'pm' && p.handover.pmCompleted)) {
      out.push({
        id: 'act-ho-' + p.id, category: 'design-handover', projectId: p.id,
        title: 'Review design handover pack',
        person: p.handover.designerName + ' · ' + p.handover.designerDept,
        meta: p.handover.docs.length + ' documents · received ' + ageLabel(p.handoverReceivedDaysAgo).toLowerCase(),
        dueIn: p.handover.dueIn, focusId: p.handover.docs[0] ? p.handover.docs[0].id : null,
        payload: { handoverId: p.handover.id }
      });
    }
    /* SE updates awaiting PM approval */
    p.records.se.filter(r => r.state === 'Pending approval').forEach(r => {
      out.push({
        id: 'act-se-' + r.id, category: 'se-updates', type: r.type, projectId: p.id,
        title: SE_TYPES[r.type].label, person: personName(r.raisedBy) + ' · Site Engineer',
        meta: r.title, dueIn: r.dueIn, focusId: r.id, payload: { seId: r.id }
      });
    });
    /* Money — client money request (window opens 10 days before stage start) */
    p.finances.client.filter(c => c.state === 'To request').forEach(c => {
      out.push({
        id: 'act-mc-' + c.id, category: 'money', type: 'client-request', projectId: p.id,
        title: 'Request client payment', person: p.customer,
        meta: c.stage + ' starts ' + fmtDateShort(c.stageStart) + ' · ' + inrLakh(c.amount),
        dueIn: dayDiff(c.stageStart), focusId: c.id, payload: { paymentId: c.id }
      });
    });
    /* Money — contractor payout (surfaces 1 day after sub-stage completion) */
    p.finances.contractor.filter(c => c.state === 'Awaiting request').forEach(c => {
      const expected = dOff(dayDiff(c.completedOn) + 1);
      out.push({
        id: 'act-mp-' + c.id, category: 'money', type: 'contractor-payout', projectId: p.id,
        title: 'Initiate contractor payout', person: (byId(CONTRACTORS, c.contractorId) || {}).name || 'Contractor',
        meta: c.subStage + ' completed ' + fmtDateShort(c.completedOn) + ' · ' + inrLakh(c.amount),
        dueIn: dayDiff(expected), focusId: c.id, payload: { paymentId: c.id }
      });
    });
    /* QA reports awaiting review */
    p.records.qa.filter(q => q.state === 'Pending review').forEach(q => {
      out.push({
        id: 'act-qa-' + q.id, category: 'qa', projectId: p.id,
        title: 'Review QA report', person: personName(q.inspectorId) + ' · QA',
        meta: q.subStage + ' · ' + q.findings.length + ' finding' + (q.findings.length === 1 ? '' : 's') + ' to close',
        dueIn: q.dueIn, focusId: q.id, payload: { qaId: q.id }
      });
    });
    /* Schedule actions derived from the project schedule */
    const sch = scheduleActionFor(p);
    if (sch) out.push(sch);
    /* Client tickets */
    p.records.tickets.filter(t => t.state !== 'Resolved').forEach(t => {
      out.push({
        id: 'act-tk-' + t.id, category: 'tickets', projectId: p.id,
        title: t.title, person: t.client + ' · ' + t.category,
        meta: t.code + ' · ' + t.priority + ' priority' + (t.department ? ' · assigned ' + t.department : ' · unassigned'),
        dueIn: t.dueIn, focusId: t.id, payload: { ticketId: t.id }
      });
    });
  });
  /* PM Missed Work — PM Admin only */
  DB.missedWork.filter(m => !m.cleared).forEach(m => {
    out.push({
      id: 'act-mw-' + m.id, category: 'pm-missed', projectId: m.projectId,
      title: m.title, person: personName(m.pmId) + ' · PM',
      meta: m.categoryLabel + ' · expected ' + ageLabel(m.expectedDaysAgo).toLowerCase(),
      dueIn: -m.expectedDaysAgo, focusId: null, payload: { missedId: m.id }
    });
  });
  return out;
}

function actionVisible(a) {
  const role = currentRole();
  if (a.category === 'pm-missed') return role.can.pmMissedWork;
  const p = getProject(a.projectId);
  if (!p) return false;
  if (a.category === 'design-handover') return true;
  return role.id === 'pm-admin' || p.pmId === role.user.id;
}
const visibleActions = () => buildActions().filter(actionVisible);
const actionsByCategory = catId => visibleActions().filter(a => a.category === catId)
  .sort((a, b) => (a.dueIn == null ? 999 : a.dueIn) - (b.dueIn == null ? 999 : b.dueIn));
const getAction = id => buildActions().find(a => a.id === id) || null;

/* ---- insights ---- */
function buildInsights() {
  const actions = visibleActions();
  const ongoing = DB.projects.filter(p => p.phase === 'ongoing');
  const delayed = ongoing.filter(p => p.delayDays > 0);
  const avgDev = ongoing.reduce((a, p) => a + p.delayDays, 0) / (ongoing.length || 1);
  const outstanding = ongoing.reduce((a, p) => a + p.finances.client.filter(c => c.state === 'To request' || c.state === 'Requested')
    .reduce((x, c) => x + c.amount, 0), 0);
  const outstandingCount = ongoing.reduce((a, p) => a + p.finances.client.filter(c => c.state === 'To request' || c.state === 'Requested').length, 0);
  const qaAll = ongoing.reduce((a, p) => a + p.records.qa.length, 0);
  const qaApprovedFirstPass = ongoing.reduce((a, p) => a + p.records.qa.filter(q => q.state === 'Approved').length, 0);

  return [
    {
      id: 'open-actions', name: 'Open actions', value: String(actions.length), unit: '',
      cmp: { dir: 'flat', text: 'across ' + CATEGORIES.filter(c => actions.some(a => a.category === c.id)).length + ' of ' + CATEGORIES.filter(c => !c.adminOnly || can('pmMissedWork')).length + ' categories' },
      desc: 'Work awaiting your decision right now, derived from live project records.',
      detail: {
        meaning: 'Every action card on Quick Actions maps to a record that is waiting on a PM decision — an approval, a request or a schedule update.',
        performance: actions.filter(a => a.dueIn != null && a.dueIn < 0).length + ' overdue · ' + actions.filter(a => a.dueIn === 0).length + ' due today · ' + actions.filter(a => a.dueIn != null && a.dueIn > 0).length + ' upcoming',
        breakdown: CATEGORIES.filter(c => !c.adminOnly || can('pmMissedWork')).map(c => {
          const n = actions.filter(a => a.category === c.id).length;
          return { label: c.label, value: String(n), sub: n === 1 ? '1 action' : n + ' actions', meter: n / Math.max(1, actions.length) };
        })
      }
    },
    {
      id: 'ongoing-projects', name: 'Ongoing projects', value: String(ongoing.length), unit: '',
      cmp: { dir: 'up', text: '+1 handed over this month' },
      desc: 'Live sites under execution across ' + new Set(ongoing.map(p => p.pmId)).size + ' project managers.',
      detail: {
        meaning: 'Projects past design handover and under active execution. Completed projects move to Records.',
        performance: ongoing.filter(p => p.status === 'On track').length + ' on track · ' + ongoing.filter(p => p.status === 'At risk').length + ' at risk · ' + ongoing.filter(p => p.status === 'Delayed').length + ' delayed',
        breakdown: ongoing.map(p => ({ label: p.name, value: p.status, sub: currentStageName(p) + ' · ' + pct(stageProgress(p)) + ' complete', meter: stageProgress(p) / 100 }))
      }
    },
    {
      id: 'schedule-deviation', name: 'Avg schedule deviation', value: '+' + avgDev.toFixed(1), unit: 'days',
      cmp: { dir: delayed.length > ongoing.length / 2 ? 'down' : 'flat', text: delayed.length + ' of ' + ongoing.length + ' projects behind plan' },
      desc: 'Average slip between planned and actual sub-stage completion dates.',
      detail: {
        meaning: 'Measured per project as the difference between planned and actual completion of the most recently completed sub-stage.',
        performance: 'Worst case: ' + ongoing.slice().sort((a, b) => b.delayDays - a.delayDays)[0].name + ' at +' + ongoing.slice().sort((a, b) => b.delayDays - a.delayDays)[0].delayDays + ' days',
        breakdown: ongoing.map(p => ({ label: p.name, value: p.delayDays === 0 ? 'On plan' : '+' + p.delayDays + ' d', sub: personName(p.pmId), meter: Math.min(1, p.delayDays / 10) }))
      }
    },
    {
      id: 'client-outstanding', name: 'Client payments pending', value: inrLakh(outstanding), unit: '',
      cmp: { dir: 'flat', text: outstandingCount + ' stage payment' + (outstandingCount === 1 ? '' : 's') + ' awaiting request' },
      desc: 'Stage payments inside the 10-day request window that have not been raised with the client.',
      detail: {
        meaning: 'Client money requests open 10 days before a stage starts. This metric counts everything not yet received.',
        performance: 'Raise requests from Quick Actions → Money / Payments to keep cash flow aligned to the schedule.',
        breakdown: ongoing.flatMap(p => p.finances.client.filter(c => c.state !== 'Paid').map(c => ({
          label: p.name, value: inrLakh(c.amount), sub: c.stage + ' · ' + c.state.toLowerCase(), meter: 0.6
        }))).slice(0, 8)
      }
    },
    {
      id: 'approval-turnaround', name: 'Approval turnaround', value: '1.8', unit: 'days',
      cmp: { dir: 'up', text: '0.4 d faster than last month' },
      desc: 'Median time between an SE or QA raising an item and your recorded decision.',
      detail: {
        meaning: 'Lower is better. Measures only PM-side decision time, not the follow-up work.',
        performance: 'Daily reports 0.6 d · inspection reports 1.4 d · QA reports 2.2 d · material requests 1.9 d',
        breakdown: [
          { label: 'Daily reports', value: '0.6 d', sub: '24 approved this month', meter: 0.3 },
          { label: 'Inspection reports', value: '1.4 d', sub: '11 approved this month', meter: 0.5 },
          { label: 'QA reports', value: '2.2 d', sub: '6 approved this month', meter: 0.8 },
          { label: 'Material requests', value: '1.9 d', sub: '9 approved this month', meter: 0.65 }
        ]
      }
    },
    {
      id: 'qa-first-pass', name: 'QA first-pass approval', value: pct(Math.round((qaApprovedFirstPass / Math.max(1, qaAll)) * 100)), unit: '',
      cmp: { dir: 'up', text: '+6 pts vs last quarter' },
      desc: 'Share of QA reports approved without a rework cycle.',
      detail: {
        meaning: 'Reports approved at first review against all reports closed in the period. A fall usually points to a process issue on one site.',
        performance: qaAll + ' reports on record · ' + qaApprovedFirstPass + ' approved at first pass',
        breakdown: ongoing.filter(p => p.records.qa.length).map(p => {
          const total = p.records.qa.length;
          const ok = p.records.qa.filter(q => q.state === 'Approved').length;
          return { label: p.name, value: pct(Math.round((ok / total) * 100)), sub: ok + ' of ' + total + ' reports', meter: ok / total };
        })
      }
    }
  ];
}

/* schedule helpers used across views */
function currentStage(p) { return p.schedule[p.stageIdx] || p.schedule[0]; }
function currentStageName(p) {
  const st = currentStage(p);
  if (!st) return '—';
  const running = st.subs.find(s => s.state === 'In progress' || s.state === 'Ready to start');
  return running ? st.name + ' · ' + running.name : st.name;
}
function stageProgress(p) {
  const all = p.schedule.reduce((a, st) => a + st.subs.length, 0);
  const done = p.schedule.reduce((a, st) => a + st.subs.filter(s => s.state === 'Completed').length, 0);
  const partial = p.schedule.reduce((a, st) => a + st.subs.reduce((x, s) => x + (s.state === 'In progress' ? s.progress / 100 : 0), 0), 0);
  return Math.round(((done + partial) / all) * 100);
}
function getSub(p, subId) {
  for (const st of p.schedule) { const s = st.subs.find(x => x.id === subId); if (s) return { stage: st, sub: s }; }
  return null;
}

/* =====================================================================
   5. UI PRIMITIVES
   ===================================================================== */
function btn(opts) {
  const { label, variant = '', size = '', iconName, onClick, disabled, title, block, type = 'button', autofocus } = opts;
  const cls = ['btn', variant ? 'btn--' + variant : '', size ? 'btn--' + size : '', block ? 'btn--block' : ''].filter(Boolean).join(' ');
  return h('button', {
    type, class: cls, disabled: !!disabled, title: title || null,
    attrs: Object.assign({ 'data-action': label ? label.toLowerCase().replace(/\s+/g, '-') : 'button' }, autofocus ? { 'data-autofocus': '' } : {}),
    on: { click: e => { e.stopPropagation(); if (onClick) onClick(e); } }
  }, iconName ? icon(iconName, 14) : null, label ? h('span', { text: label }) : null);
}

function badge(label, tone = 'neutral', iconName) {
  return h('span', { class: 'badge badge--' + tone, text: label }, iconName ? icon(iconName, 12) : null);
}

const STATUS_TONE = {
  'Paid': 'ok', 'Approved': 'ok', 'Published': 'ok', 'Completed': 'ok', 'Resolved': 'ok', 'Closed': 'ok', 'Handed over': 'ok',
  'Pending approval': 'warn', 'Pending review': 'warn', 'Awaiting request': 'warn', 'To request': 'warn', 'Open': 'warn', 'In review': 'warn',
  'Unreviewed': 'neutral', 'Not started': 'neutral', 'Not due': 'neutral', 'Requested': 'info', 'Sent to Finance': 'info', 'Pending completion': 'neutral', 'In progress': 'info',
  'Ready to start': 'info', 'Rejected': 'brand', 'Delayed': 'brand', 'At risk': 'warn', 'On track': 'ok', 'Awaiting handover review': 'warn'
};
const statusBadge = state => badge(state, STATUS_TONE[state] || 'neutral');

function timeChip(dueIn) {
  if (dueIn == null) return null;
  const u = urgency(dueIn);
  const cls = u === 'overdue' ? 'time-chip time-chip--overdue' : (u === 'soon' ? 'time-chip time-chip--soon' : 'time-chip');
  return h('span', { class: cls, attrs: { 'data-urgency': u } }, icon('clock', 12), h('span', { text: dueLabel(dueIn) }));
}

function meter(value, tone) {
  return h('div', { class: 'meter', attrs: { role: 'presentation' } },
    h('div', { class: 'meter__fill' + (tone ? ' meter__fill--' + tone : ''), style: { width: Math.max(0, Math.min(100, value)) + '%' } }));
}
function meterRow(value, tone) {
  return h('div', { class: 'meter-row' }, meter(value, tone), h('span', { text: pct(value) }));
}
function kvGrid(items) {
  return h('div', { class: 'kv-grid' }, items.filter(Boolean).map(it =>
    h('div', { class: 'kv' },
      h('div', { class: 'kv__k', text: it.k }),
      h('div', { class: 'kv__v' + (it.sub ? ' kv__v--sub' : ''), text: it.v }))));
}
function statStrip(items) {
  return h('div', { class: 'stat-strip' }, items.map(it =>
    h('div', { class: 'stat-strip__i' },
      h('div', { class: 'stat-strip__k', text: it.k }),
      h('div', { class: 'stat-strip__v', text: it.v }))));
}
function sectionTitle(text, extra) {
  return h('div', { class: 'panel__head' }, h('div', { class: 'panel__title', text }), extra || null);
}
function panel(title, bodyNode, opts = {}) {
  return h('section', { class: 'panel' },
    title ? h('div', { class: 'panel__head' },
      h('div', { class: 'panel__title', text: title }),
      opts.sub ? h('div', { class: 'panel__sub', text: opts.sub }) : null,
      h('div', { class: 'panel__head-spacer' }),
      opts.actions || null) : null,
    h('div', { class: 'panel__body' + (opts.flush ? ' panel__body--flush' : '') }, bodyNode));
}
function emptyState(opts) {
  return h('div', { class: 'empty' },
    icon(opts.icon || 'inbox', 20),
    h('div', { class: 'empty__t', text: opts.title }),
    opts.desc ? h('div', { class: 'empty__d', text: opts.desc }) : null,
    opts.action || null);
}

/* ---- searchable select ---- */
function combo(opts) {
  const { options, placeholder = 'Select…', onChange, label } = opts;
  let value = opts.value;
  let open = false, query = '', activeIdx = 0;
  const valEl = h('span', { class: 'combo__val' });
  const search = h('input', { class: 'input combo__search', type: 'text', placeholder: 'Search…', attrs: { 'aria-label': 'Search ' + (label || 'options') } });
  const listEl = h('div', { class: 'combo__list', role: 'listbox' });
  const pop = h('div', { class: 'combo__pop' }, search, listEl);
  const control = h('button', {
    type: 'button', class: 'btn combo__control', attrs: { 'aria-haspopup': 'listbox', 'aria-expanded': 'false' },
    on: { click: () => toggle() }
  }, valEl, icon('down', 14));
  const root = h('div', { class: 'combo' }, control, pop);
  pop.style.display = 'none';

  const current = () => options.find(o => o.id === value);
  function syncControl() {
    const c = current();
    clear(valEl);
    if (c) { valEl.textContent = c.label; valEl.classList.remove('combo__ph'); }
    else { valEl.textContent = placeholder; valEl.classList.add('combo__ph'); }
    control.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function renderList() {
    clear(listEl);
    const filtered = options.filter(o => !query || (o.label + ' ' + (o.sub || '')).toLowerCase().includes(query.toLowerCase()));
    if (!filtered.length) { listEl.appendChild(h('div', { class: 'combo__empty', text: 'No matches' })); return; }
    filtered.forEach((o, i) => {
      listEl.appendChild(h('button', {
        type: 'button', class: 'combo__opt' + (i === activeIdx ? ' is-active' : ''),
        attrs: { role: 'option', 'aria-selected': o.id === value ? 'true' : 'false' },
        on: {
          click: () => { onChange(o.id); close(); control.focus(); },
          mouseenter: () => { activeIdx = i; renderList(); }
        }
      }, h('span', { text: o.label }), o.sub ? h('span', { class: 'combo__opt-sub', text: o.sub }) : null));
    });
  }
  function openPop() { open = true; query = ''; activeIdx = 0; pop.style.display = ''; renderList(); syncControl(); search.focus(); }
  function close() { open = false; pop.style.display = 'none'; syncControl(); }
  function toggle() { open ? close() : openPop(); }

  search.addEventListener('input', () => { query = search.value; activeIdx = 0; renderList(); });
  search.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); control.focus(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = listEl.querySelectorAll('.combo__opt').length;
      activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + n) % Math.max(1, n);
      renderList();
    }
    if (e.key === 'Enter') {
      const b = listEl.querySelectorAll('.combo__opt')[activeIdx];
      if (b) { e.preventDefault(); b.click(); }
    }
  });
  document.addEventListener('click', e => { if (open && !root.contains(e.target)) close(); });
  syncControl();
  root.sync = syncControl;
  root.setValue = v => { value = v; syncControl(); };
  return root;
}

/* ---- table ---- */
function table(opts) {
  const { columns, rows, onRowClick, focusId, emptyMsg, rowClass, sort, onSort } = opts;
  if (!rows.length) return emptyState(emptyMsg || { title: 'Nothing here', desc: 'No records match the current view.', icon: 'inbox' });
  const thead = h('tr', {}, columns.map(c => {
    const sortable = !!(c.sortKey && onSort);
    const ariaSort = sortable && sort && sort.key === c.sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : null;
    return h('th', {
      class: [(c.cls || ''), sortable ? 'is-sortable' : ''].filter(Boolean).join(' '),
      attrs: sortable ? Object.assign({ 'aria-sort': ariaSort || 'none' }, { 'data-sort': c.sortKey }) : null,
      on: sortable ? { click: () => onSort(c.sortKey), keydown: e => { if (e.key === 'Enter') onSort(c.sortKey); } } : null,
      tabindex: sortable ? '0' : null
    }, h('span', { text: c.label }), sortable ? icon('sort', 12, 'sort-ico') : null);
  }));
  const tbody = h('tbody', {}, rows.map(row => {
    const tr = h('tr', {
      class: [onRowClick ? 'is-clickable' : '', rowClass ? rowClass(row) : '', focusId && row.id === focusId ? 'is-focus' : ''].filter(Boolean).join(' '),
      attrs: onRowClick ? { tabindex: '0', role: 'button', 'data-row-id': row.id } : null,
      on: onRowClick ? {
        click: () => onRowClick(row),
        keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } }
      } : null
    }, columns.map(c => h('td', { class: c.cls || null }, c.render ? c.render(row) : (row[c.key] != null ? String(row[c.key]) : '—'))));
    return tr;
  }));
  const tbl = h('table', { class: 'table' }, h('thead', {}, thead), tbody);
  const wrap = h('div', { class: 'table-wrap' }, tbl);
  if (opts.footer) {
    tbl.appendChild(h('tfoot', {}, h('tr', {}, columns.map((c, i) => h('td', { class: c.cls || null }, i === 0 ? opts.footer[0] : (opts.footer[i] || ''))))));
  }
  return wrap;
}

/* ---- overlay (modal / drawer) — always contained inside the product viewport ---- */
let activeOverlay = null;
let lastFocused = null;

function openOverlay(config) {
  activeOverlay = config;
  lastFocused = document.activeElement;
  renderOverlay();
}
function closeOverlay() {
  activeOverlay = null;
  const layer = $('#overlayLayer');
  layer.classList.remove('is-open');
  clear(layer);
  if (lastFocused && document.contains(lastFocused)) { try { lastFocused.focus(); } catch (e) {} }
  lastFocused = null;
}
function renderOverlay() {
  const layer = $('#overlayLayer');
  clear(layer);
  if (!activeOverlay) { layer.classList.remove('is-open'); return; }
  layer.classList.add('is-open');
  const c = activeOverlay;
  const closeBtn = h('button', {
    type: 'button', class: 'mclose', attrs: { 'aria-label': 'Close', 'data-action': 'close-modal' },
    on: { click: () => { if (c.onClose) c.onClose(); else closeOverlay(); } }
  }, icon('close', 14));
  const panelEl = h('div', {
    class: 'overlay__panel overlay__panel--' + (c.size || 'lg'),
    attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': c.title || 'Details' }
  },
    h('div', { class: 'mhead' },
      h('div', { class: 'mhead__t' },
        h('h2', { text: c.title || '' }),
        c.subtitle ? h('div', { class: 'mhead__sub' }, c.subtitle) : null),
      closeBtn),
    h('div', { class: 'mbody' }, c.body || null),
    c.footer ? h('div', { class: 'mfoot' }, c.footer) : null);

  const overlayEl = h('div', { class: 'overlay' + (c.kind === 'drawer' ? ' overlay--drawer' : '') },
    h('div', { class: 'overlay__bd', on: { click: () => { if (c.onClose) c.onClose(); else closeOverlay(); } } }),
    panelEl);
  layer.appendChild(overlayEl);

  layer.onkeydown = e => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    if (c.onClose) c.onClose(); else closeOverlay();
  };
  const focusTarget = panelEl.querySelector('[data-autofocus]') || panelEl.querySelector('.mclose');
  if (focusTarget) focusTarget.focus();
}

/* ---- toast ---- */
function toast(message, opts = {}) {
  const layer = $('#toastLayer');
  const el = h('div', { class: 'toast', attrs: { role: 'status' } },
    icon(opts.icon || 'checkCircle', 14),
    h('span', { text: message }),
    h('button', { type: 'button', class: 'toast__x', attrs: { 'aria-label': 'Dismiss' }, on: { click: () => remove() } }, icon('close', 12)));
  layer.appendChild(el);
  const timer = setTimeout(remove, 4200);
  function remove() { clearTimeout(timer); if (el.parentNode) el.parentNode.removeChild(el); }
}

/* =====================================================================
   6. PROTOTYPE CONTROLLER (Layer A)
   ===================================================================== */
const FLOWS = [
  { id: 'flow-qa', group: 'Operations', label: 'Quick Actions', apply: () => { productState.view = 'quick-actions'; } },
  { id: 'flow-insights', group: 'Operations', label: 'Insights', apply: () => { productState.view = 'insights'; } },
  { id: 'flow-rec-dh', group: 'Records', label: 'Design Handover', apply: () => { productState.view = 'records'; productState.records.tab = 'design-handover'; } },
  { id: 'flow-rec-ongoing', group: 'Records', label: 'Ongoing Projects', apply: () => { productState.view = 'records'; productState.records.tab = 'ongoing'; } },
  { id: 'flow-rec-completed', group: 'Records', label: 'Completed Projects', apply: () => { productState.view = 'records'; productState.records.tab = 'completed'; } }
];
const getFlow = id => FLOWS.find(f => f.id === id);

function selectFlow(flowId, opts = {}) {
  const flow = getFlow(flowId);
  if (!flow) return;
  prototypeState.currentFlow = flowId;
  flow.apply();
  if (!opts.keepOverlay) { activeOverlay = null; }
  renderAll();
}
/* keep the rail honest when navigation happens inside the product */
function syncFlowFromProduct() {
  if (productState.view === 'quick-actions') prototypeState.currentFlow = 'flow-qa';
  else if (productState.view === 'insights') prototypeState.currentFlow = 'flow-insights';
  else if (productState.view === 'records') {
    prototypeState.currentFlow = 'flow-rec-' + (productState.records.tab === 'design-handover' ? 'dh' : productState.records.tab);
  }
  /* project view: the rail keeps the flow the project was opened from */
}

function renderRail() {
  /* role switch */
  const switchEl = $('#roleSwitch');
  clear(switchEl);
  Object.keys(ROLES).forEach(roleId => {
    switchEl.appendChild(h('button', {
      type: 'button', text: ROLES[roleId].label,
      attrs: { 'aria-pressed': prototypeState.role === roleId ? 'true' : 'false', 'data-role': roleId },
      on: { click: () => setRole(roleId) }
    }));
  });

  /* flows */
  const list = $('#flowList');
  clear(list);
  const groups = [];
  FLOWS.forEach(f => {
    let g = groups.find(x => x.name === f.group);
    if (!g) { g = { name: f.group, items: [] }; groups.push(g); }
    g.items.push(f);
  });
  groups.forEach((g, gi) => {
    const groupEl = h('div', { class: 'flow-group' }, h('div', { class: 'flow-group__label', text: g.name }));
    g.items.forEach((f, i) => {
      const active = prototypeState.currentFlow === f.id;
      groupEl.appendChild(h('button', {
        type: 'button', class: 'flow-item',
        attrs: { 'aria-current': active ? 'true' : 'false', 'data-flow': f.id },
        on: { click: () => selectFlow(f.id) }
      },
        h('span', { class: 'flow-item__n', text: String(gi * 3 + i + 1).padStart(2, '0') }),
        h('span', { class: 'flow-item__label', text: f.label })));
    });
    list.appendChild(groupEl);
  });

  /* project context (deep-linked project view) */
  if (productState.view === 'project' && productState.project.id) {
    const p = getProject(productState.project.id);
    if (p) {
      const ctx = h('div', { class: 'flow-context' },
        h('div', { class: 'flow-context__k', text: 'Inside project' }),
        h('div', { class: 'flow-context__v', text: p.name }),
        h('button', {
          type: 'button', on: { click: () => closeProject() }
        }, icon('arrowLeft', 12), h('span', { text: productState.project.returnTo === 'records' ? 'Back to Records' : 'Back to Quick Actions' })));
      list.insertBefore(ctx, list.firstChild);
    }
  }

  const open = visibleActions().length;
  $('#protoStateReadout').textContent = ROLES[prototypeState.role].label + ' · ' + open + ' open action' + (open === 1 ? '' : 's');
}

function setRole(roleId) {
  if (prototypeState.role === roleId) return;
  prototypeState.role = roleId;
  activeOverlay = null;
  /* an expanded PM-only column must not survive a role change */
  if (productState.qa.expanded === 'pm-missed' && !can('pmMissedWork')) productState.qa.expanded = null;
  renderAll();
  toast('Prototype role switched to ' + ROLES[roleId].label, { icon: 'user' });
}

/* =====================================================================
   7. PRODUCT SHELL (Layer B)
   ===================================================================== */
function renderAll() {
  syncFlowFromProduct();
  renderRail();
  renderProduct();
}

function navigateView(view, opts = {}) {
  productState.view = view;
  activeOverlay = null;
  if (view !== 'project') {
    productState.project = { id: null, section: 'details', focusId: null, returnTo: null };
  }
  if (opts.recordsTab) productState.records.tab = opts.recordsTab;
  renderAll();
}

function buildProductSidebar() {
  const openCount = visibleActions().length;
  const nav = h('nav', { class: 'pside__nav' });

  const navItem = (opts) => {
    const active = opts.active;
    return h('button', {
      type: 'button', class: 'nav-item', attrs: { 'aria-current': active ? 'page' : null, 'data-nav': opts.id },
      on: { click: opts.onClick }
    }, icon(opts.icon, 13), h('span', { class: 'nav-item__label', text: opts.label }),
      opts.count != null ? h('span', { class: 'nav-count', text: String(opts.count) }) : null);
  };

  nav.appendChild(h('div', { class: 'nav-group' },
    navItem({
      id: 'quick-actions', label: 'Quick Actions', icon: 'inbox', count: openCount,
      active: productState.view === 'quick-actions',
      onClick: () => navigateView('quick-actions')
    }),
    navItem({
      id: 'insights', label: 'Insights', icon: 'chart',
      active: productState.view === 'insights',
      onClick: () => navigateView('insights')
    })));

  const recordsActive = productState.view === 'records' || productState.view === 'project';
  const tab = productState.records.tab;
  nav.appendChild(h('div', { class: 'nav-group' },
    h('div', { class: 'nav-group__label', text: 'Records' }),
    h('div', { class: 'nav-sub' },
      navItem({
        id: 'rec-dh', label: 'Design Handover', icon: 'doc',
        count: DB.projects.filter(p => p.phase === 'handover').length,
        active: recordsActive && tab === 'design-handover',
        onClick: () => navigateView('records', { recordsTab: 'design-handover' })
      }),
      navItem({
        id: 'rec-ongoing', label: 'Ongoing Projects', icon: 'building',
        count: DB.projects.filter(p => p.phase === 'ongoing').length,
        active: recordsActive && tab === 'ongoing',
        onClick: () => navigateView('records', { recordsTab: 'ongoing' })
      }),
      navItem({
        id: 'rec-completed', label: 'Completed Projects', icon: 'folder',
        count: DB.projects.filter(p => p.phase === 'completed').length,
        active: recordsActive && tab === 'completed',
        onClick: () => navigateView('records', { recordsTab: 'completed' })
      }))));

  const u = currentUser();
  return h('aside', { class: 'pside' },
    h('div', { class: 'pside__brand' },
      h('div', { class: 'pside__glyph' }, icon('building', 14)),
      h('div', {},
        h('div', { class: 'pside__name', text: 'PM Dashboard' }),
        h('div', { class: 'pside__env', text: 'Construction operations' }))),
    nav,
    h('div', { class: 'pside__user' },
      h('div', { class: 'avatar', text: u.initials }),
      h('div', { class: 'pside__user-meta' },
        h('div', { class: 'pside__user-name', text: u.name }),
        h('div', { class: 'pside__user-role', text: currentRole().label }))));
}

function buildProductHeader() {
  let left;
  if (productState.view === 'quick-actions') {
    left = h('div', { class: 'phead__crumb' }, icon('inbox', 14), h('b', { text: 'Quick Actions' }));
  } else if (productState.view === 'insights') {
    left = h('div', { class: 'phead__crumb' }, icon('chart', 14), h('b', { text: 'Insights' }));
  } else if (productState.view === 'records') {
    const tabLabel = { 'design-handover': 'Design Handover', ongoing: 'Ongoing Projects', completed: 'Completed Projects' }[productState.records.tab];
    left = h('div', { class: 'phead__crumb' }, icon('folder', 14), h('span', { text: 'Records' }), icon('chevron', 12), h('b', { text: tabLabel }));
  } else {
    const p = getProject(productState.project.id);
    left = h('div', { class: 'phead__crumb' },
      h('span', { text: productState.project.returnTo === 'records' ? 'Records' : 'Quick Actions' }),
      icon('chevron', 12), h('b', { text: p ? p.name : 'Project' }),
      icon('chevron', 12), h('span', { text: SECTION_LABEL[productState.project.section] || 'Project Details' }));
  }

  const right = h('div', { class: 'phead__meta' });
  if (productState.view === 'quick-actions') {
    const n = visibleActions().length;
    right.appendChild(h('span', { text: n + ' action' + (n === 1 ? '' : 's') + ' open' }));
    right.appendChild(statusBadge(currentRole().label));
  } else if (productState.view === 'project') {
    const p = getProject(productState.project.id);
    if (p) right.appendChild(statusBadge(p.status));
  } else {
    right.appendChild(h('span', { text: 'Prototype data · not production' }));
  }

  return h('header', { class: 'phead' }, left, h('div', { class: 'phead__spacer' }), right);
}

function renderProduct() {
  const root = $('#product');
  clear(root);
  root.appendChild(buildProductSidebar());

  const content = h('div', { class: 'pcontent' + (productState.view === 'quick-actions' ? ' pcontent--flush' : '') });
  if (productState.view === 'quick-actions') content.appendChild(renderQuickActions());
  else if (productState.view === 'insights') content.appendChild(renderInsights());
  else if (productState.view === 'records') content.appendChild(renderRecords());
  else if (productState.view === 'project') content.appendChild(renderProject());

  const main = h('div', { class: 'pmain' }, buildProductHeader(), content);
  root.appendChild(main);
  renderOverlay();

  /* keep deep-linked records visible without manual scrolling */
  const focused = content.querySelector('.is-focus');
  if (focused && focused.scrollIntoView) focused.scrollIntoView({ block: 'center' });
}

/* =====================================================================
   8a. VIEW — QUICK ACTIONS
   ===================================================================== */
function actionCard(a) {
  const p = getProject(a.projectId);
  const cat = categoryById(a.category);
  const foot = [];

  foot.push(timeChip(a.dueIn));

  if (a.category === 'money') {
    foot.push(a.type === 'client-request'
      ? h('span', { class: 'tag tag--client', text: 'Client request' })
      : h('span', { class: 'tag tag--contractor', text: 'Contractor payout' }));
  }
  if (a.category === 'se-updates') foot.push(h('span', { class: 'tag', text: SE_TYPES[a.type].short }));
  if (a.category === 'schedule') foot.push(h('span', { class: 'tag', text: a.type === 'mark-complete' ? 'Mark complete' : 'Start next' }));
  if (a.category === 'qa') {
    const q = getQaRecord(a.projectId, a.payload.qaId);
    const major = q ? q.findings.filter(f => f.severity === 'Major').length : 0;
    if (major) foot.push(badge(major + ' major', 'brand'));
  }
  if (a.category === 'tickets') {
    const t = getTicket(a.projectId, a.payload.ticketId);
    if (t) foot.push(badge(t.priority, t.priority === 'High' ? 'brand' : 'neutral'));
  }
  if (a.category === 'design-handover') {
    const ho = p.handover;
    const reviewed = ho.docs.filter(d => d.review !== 'Unreviewed').length;
    foot.push(h('span', { class: 'tag', text: reviewed + ' / ' + ho.docs.length + ' reviewed' }));
  }
  if (a.category === 'pm-missed') {
    const m = DB.missedWork.find(x => x.id === a.payload.missedId);
    if (m) foot.push(badge(m.categoryLabel, 'brand'));
  }

  return h('button', {
    type: 'button',
    class: 'action-card' + (a.category === 'pm-missed' ? ' action-card--missed' : ''),
    attrs: { 'data-action-id': a.id, 'data-category': a.category },
    on: { click: () => openAction(a.id) }
  },
    h('div', { class: 'action-card__top' },
      h('span', { class: 'action-card__proj', text: p ? p.name : '—' }),
      h('span', { class: 'action-card__qid', text: p ? p.qid : '' })),
    h('div', { class: 'action-card__title', text: a.title }),
    h('div', { class: 'action-card__meta' }, a.person),
    a.meta ? h('div', { class: 'action-card__meta', text: a.meta }) : null,
    h('div', { class: 'action-card__foot' }, foot, h('span', { class: 'spacer' }),
      h('span', { class: 'tag', text: cat ? cat.label : '' })));
}

function renderQuickActions() {
  const cats = CATEGORIES.filter(c => !c.adminOnly || can(c.id === 'pm-missed' ? 'pmMissedWork' : true));
  const expanded = productState.qa.expanded;

  const board = h('div', { class: 'board', attrs: { role: 'list' } });
  cats.forEach(cat => {
    const items = actionsByCategory(cat.id);
    const isExpanded = expanded === cat.id;
    const isMin = !!expanded && !isExpanded;

    let col;
    if (isMin) {
      col = h('div', {
        class: 'qcol is-min' + (cat.id === 'pm-missed' ? ' qcol--missed' : ''),
        attrs: { role: 'listitem', tabindex: '0', 'aria-label': cat.label + ', ' + items.length + ' actions, collapsed', 'data-col': cat.id },
        on: {
          click: () => expandColumn(cat.id),
          keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); expandColumn(cat.id); } }
        }
      },
        h('div', { class: 'qcol__head' },
          h('span', { class: 'qcol__title', text: cat.label }),
          h('span', { class: 'qcol__count', text: String(items.length) })));
    } else {
      const body = h('div', { class: 'qcol__body', attrs: { 'data-col-body': cat.id } },
        items.length
          ? items.map(a => actionCard(a))
          : emptyState({ icon: 'checkCircle', title: 'Nothing pending', desc: cat.hint + '. New items appear here automatically.' }));

      col = h('div', {
        class: 'qcol' + (isExpanded ? ' is-expanded' : '') + (cat.id === 'pm-missed' ? ' qcol--missed' : ''),
        attrs: { role: 'listitem', 'data-col': cat.id }
      },
        h('div', { class: 'qcol__head' },
          h('span', { class: 'qcol__title', text: cat.label, title: cat.hint }),
          h('span', { class: 'qcol__count' + (items.length ? '' : ' is-zero'), text: items.length ? String(items.length) : '—' }),
          h('span', { class: 'qcol__spacer' }),
          h('button', {
            type: 'button', class: 'qcol__expand',
            attrs: { 'aria-label': isExpanded ? 'Collapse ' + cat.label : 'Expand ' + cat.label, 'aria-expanded': isExpanded ? 'true' : 'false', 'data-expand': cat.id },
            on: { click: () => expandColumn(isExpanded ? null : cat.id) }
          }, icon(isExpanded ? 'collapse' : 'expand', 14))),
        body);
    }
    board.appendChild(col);
  });

  const scroller = h('div', { class: 'board-scroll', attrs: { tabindex: '0', 'aria-label': 'Quick Actions board' } }, board);
  scroller.addEventListener('scroll', () => { productState.qa.scrollX = scroller.scrollLeft; });
  requestAnimationFrame(() => { scroller.scrollLeft = productState.qa.scrollX || 0; });

  const n = visibleActions().length;
  const head = h('div', { class: 'page-head' },
    h('div', { class: 'page-head__row' },
      h('div', { class: 'page-head__t' },
        h('h1', { text: 'Quick Actions' }),
        h('p', { text: n + ' item' + (n === 1 ? '' : 's') + ' need your attention. Columns are categories of work — select a card to act on it in place, or open the exact project section.' })),
      h('div', { class: 'page-head__actions' },
        h('span', { class: 'tag', text: currentRole().label + ' view' }))));

  return h('div', { style: { display: 'contents' } }, head, scroller);
}

function expandColumn(catId) {
  const scroller = $('.board-scroll');
  if (scroller) productState.qa.scrollX = 0;
  productState.qa.expanded = catId;
  renderAll();
  if (catId) {
    const col = $('.qcol.is-expanded');
    if (col) {
      const first = col.querySelector('.action-card');
      if (first) first.focus();
    }
  }
}

/* =====================================================================
   8b. VIEW — INSIGHTS
   ===================================================================== */
function renderInsights() {
  const kpis = buildInsights();
  const grid = h('div', { class: 'kpi-grid' }, kpis.map(k => {
    const trendCls = k.cmp.dir === 'up' ? 'trend--up' : k.cmp.dir === 'down' ? 'trend--down' : 'trend--flat';
    return h('button', {
      type: 'button', class: 'kpi', attrs: { 'data-kpi': k.id },
      on: { click: () => openKpi(k.id) }
    },
      h('div', { class: 'kpi__top' },
        h('span', { class: 'kpi__name', text: k.name }),
        icon(k.cmp.dir === 'up' ? 'up' : k.cmp.dir === 'down' ? 'down' : 'refresh', 12, trendCls)),
      h('div', { class: 'kpi__val' }, k.value, k.unit ? h('small', { text: k.unit }) : null),
      h('div', { class: 'kpi__cmp' }, h('span', { class: 'trend ' + trendCls, text: k.cmp.text })),
      h('div', { class: 'kpi__desc', text: k.desc }));
  }));

  const note = h('div', { class: 'insight-note' }, icon('note', 14),
    h('span', { text: 'Metrics are calculated from the same dummy project records that drive Quick Actions and Records — completing an action changes the numbers here.' }));

  return h('div', {},
    h('div', { class: 'page-head' },
      h('div', { class: 'page-head__row' },
        h('div', { class: 'page-head__t' },
          h('h1', { text: 'Insights' }),
          h('p', { text: 'How the portfolio is performing. Select a metric for its definition, current position and breakdown.' })))),
    h('div', { class: 'insights-body' }, grid, note));
}

function openKpi(kpiId) {
  const k = buildInsights().find(x => x.id === kpiId);
  if (!k) return;
  const body = [
    h('div', { class: 'mbody__sec' },
      h('div', { class: 'section-title', text: 'What this measures' }),
      h('p', { style: { fontSize: '12.5px', lineHeight: '1.6', color: 'var(--muted)' }, text: k.detail.meaning })),
    h('div', { class: 'mbody__sec' },
      h('div', { class: 'section-title', text: 'Current position' }),
      h('div', { class: 'stat-strip' },
        h('div', { class: 'stat-strip__i' }, h('div', { class: 'stat-strip__k', text: 'Value' }), h('div', { class: 'stat-strip__v', text: k.value + (k.unit ? ' ' + k.unit : '') })),
        h('div', { class: 'stat-strip__i' }, h('div', { class: 'stat-strip__k', text: 'Context' }), h('div', { class: 'stat-strip__v', style: { fontSize: '12px' }, text: k.cmp.text }))),
      h('p', { style: { fontSize: '12px', lineHeight: '1.6', color: 'var(--muted)' }, text: k.detail.performance })),
    h('div', { class: 'mbody__sec' },
      h('div', { class: 'section-title', text: 'Breakdown' }),
      h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' },
        k.detail.breakdown.length ? k.detail.breakdown.map(row =>
          h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(150px,2fr) 84px minmax(70px,1fr)', gap: '10px', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid var(--line-soft)', fontSize: '12px' } },
            h('div', {}, h('div', { style: { fontWeight: '600' }, text: row.label }), row.sub ? h('div', { style: { fontSize: '11px', color: 'var(--faint)' }, text: row.sub }) : null),
            h('div', { style: { fontWeight: '600', fontVariantNumeric: 'tabular-nums' }, text: row.value }),
            meter(Math.round((row.meter || 0) * 100)))) : emptyState({ icon: 'chart', title: 'No data', desc: 'Nothing to break down for this metric yet.' }))))
  ];

  openOverlay({
    size: 'lg', title: k.name,
    subtitle: [h('span', { text: k.desc })],
    body,
    footer: [
      h('div', { class: 'mfoot__hint' }, icon('chart', 14), h('span', { text: 'Prototype metric · dummy data' })),
      h('div', { class: 'mfoot__spacer' }),
      btn({ label: 'Close', autofocus: true, onClick: () => closeOverlay() })
    ]
  });
}

/* =====================================================================
   8c. VIEW — RECORDS
   ===================================================================== */
const RECORD_TABS = [
  { id: 'design-handover', label: 'Design Handover' },
  { id: 'ongoing', label: 'Ongoing Projects' },
  { id: 'completed', label: 'Completed Projects' }
];
const phaseOfTab = tab => tab === 'design-handover' ? 'handover' : tab;

function projectRowBase(p) {
  return {
    id: p.id, name: p.name, qid: p.qid, customer: p.customer, pmId: p.pmId,
    stage: currentStageName(p), progress: stageProgress(p), delay: p.delayDays, status: p.status, p
  };
}
function sortRows(rows, sort) {
  const dir = sort.dir === 'desc' ? -1 : 1;
  return rows.slice().sort((a, b) => {
    const av = a[sort.key], bv = b[sort.key];
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

function renderRecords() {
  const tab = productState.records.tab;
  const counts = {
    'design-handover': DB.projects.filter(p => p.phase === 'handover').length,
    ongoing: DB.projects.filter(p => p.phase === 'ongoing').length,
    completed: DB.projects.filter(p => p.phase === 'completed').length
  };

  const tabs = h('div', { class: 'tabs', attrs: { role: 'tablist' } }, RECORD_TABS.map(t =>
    h('button', {
      type: 'button', class: 'tab', attrs: { role: 'tab', 'aria-selected': tab === t.id ? 'true' : 'false', 'data-tab': t.id },
      on: { click: () => { productState.records.tab = t.id; productState.records.query = ''; renderAll(); } }
    }, t.label, h('span', { class: 'tab__n', text: String(counts[t.id]) }))));

  let body;
  if (tab === 'design-handover') body = renderHandoverRecords();
  else if (tab === 'ongoing') body = renderOngoingRecords();
  else body = renderCompletedRecords();

  const desc = {
    'design-handover': 'Projects received from Design and projects already handed over to a PM. Open a pending handover to review its documents.',
    ongoing: 'Live sites under execution. Search, filter and open any project to inspect its records.',
    completed: 'Closed sites retained for record lookup. No operational urgency — open a project to review its history.'
  }[tab];

  return h('div', {},
    h('div', { class: 'page-head' },
      h('div', { class: 'page-head__row' },
        h('div', { class: 'page-head__t' },
          h('h1', { text: 'Records' }),
          h('p', { text: desc })))),
    tabs,
    body);
}

function recordFilters(rows, phase) {
  const q = productState.records.query.trim().toLowerCase();
  const f = productState.records.filters;
  return rows.filter(p => {
    if (phase && p.phase !== phase) return false;
    if (q) {
      const hay = [p.name, p.qid, p.customer, personName(p.pmId)].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.pm !== 'all' && p.pmId !== f.pm) return false;
    if (f.status !== 'all' && p.status !== f.status) return false;
    if (f.delay === 'delayed' && p.delayDays === 0) return false;
    if (f.delay === 'onplan' && p.delayDays > 0) return false;
    return true;
  });
}

function searchInput() {
  const input = h('input', {
    class: 'input', type: 'search', placeholder: 'Search project, customer, QID or PM',
    value: productState.records.query, attrs: { 'aria-label': 'Search projects', 'data-search': 'projects' },
    on: { input: e => { productState.records.query = e.target.value; rerenderRecordsBody(); } }
  });
  return h('div', { class: 'search' }, icon('search', 14), input);
}

/* re-render only the records body so search keeps focus */
function rerenderRecordsBody() {
  const host = $('#recordsBody');
  if (!host) { renderAll(); return; }
  const tab = productState.records.tab;
  clear(host);
  host.appendChild(tab === 'design-handover' ? renderHandoverRecords() : tab === 'ongoing' ? renderOngoingRecords() : renderCompletedRecords());
}

function pmFilter() {
  const opts = [{ id: 'all', label: 'All PMs' }].concat(PM_LIST.map(pm => ({ id: pm.id, label: pm.name, sub: pm.region })));
  let node = null;
  const c = combo({
    options: opts, value: productState.records.filters.pm, label: 'PM',
    onChange: v => { productState.records.filters.pm = v; node.setValue(v); rerenderRecordsBody(); }
  });
  node = c;
  return c;
}
function statusFilter(phase) {
  const statuses = phase === 'completed' ? ['Completed'] : ['On track', 'At risk', 'Delayed'];
  const opts = [{ id: 'all', label: 'All statuses' }].concat(statuses.map(s => ({ id: s, label: s })));
  let node = null;
  const c = combo({
    options: opts, value: productState.records.filters.status, label: 'status',
    onChange: v => { productState.records.filters.status = v; node.setValue(v); rerenderRecordsBody(); }
  });
  node = c;
  return c;
}

function renderOngoingRecords() {
  const rows = sortRows(recordFilters(DB.projects, 'ongoing').map(projectRowBase), productState.records.sort);
  const st = productState.records.sort;

  const toolbar = h('div', { class: 'toolbar' },
    searchInput(), pmFilter(), statusFilter('ongoing'),
    h('button', {
      type: 'button', class: 'chip-filter', attrs: { 'aria-pressed': productState.records.filters.delay === 'delayed' ? 'true' : 'false' },
      on: { click: () => { productState.records.filters.delay = productState.records.filters.delay === 'delayed' ? 'all' : 'delayed'; renderAll(); } }
    }, 'Delayed only'),
    h('div', { class: 'toolbar__spacer' }),
    h('span', { class: 'tag', text: rows.length + ' of ' + DB.projects.filter(p => p.phase === 'ongoing').length + ' projects' }));

  const tbl = table({
    columns: [
      { label: 'Project', sortKey: 'name', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.name }), h('div', { class: 'cell-sub', text: r.qid + ' · ' + r.p.type })) },
      { label: 'Customer', sortKey: 'customer', render: r => h('span', { text: r.customer }) },
      { label: 'PM', sortKey: 'pmId', render: r => { const pm = byId(PM_LIST, r.pmId); return h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, h('div', { class: 'avatar', text: pm ? pm.initials : '—' }), h('span', { text: pm ? pm.name : 'Unassigned' })); } },
      { label: 'Current stage', render: r => h('span', { text: r.stage }) },
      { label: 'Progress', sortKey: 'progress', render: r => meterRow(r.progress) },
      { label: 'Schedule', sortKey: 'delay', render: r => r.delay > 0 ? h('span', { class: 'delay-note' }, icon('alert', 12), h('span', { text: '+' + r.delay + ' d' })) : badge('On plan', 'ok') },
      { label: 'Status', sortKey: 'status', render: r => statusBadge(r.status) }
    ],
    rows, sort: st,
    onSort: key => {
      productState.records.sort = { key, dir: st.key === key && st.dir === 'asc' ? 'desc' : 'asc' };
      rerenderRecordsBody();
    },
    onRowClick: r => openProject(r.id, 'details', null, 'records'),
    emptyMsg: { icon: 'search', title: 'No matching projects', desc: 'Adjust the search or filters to see ongoing projects.' }
  });

  return h('div', { id: 'recordsBody' }, toolbar, h('div', { class: 'rec-body' }, h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, tbl))));
}

function renderCompletedRecords() {
  const rows = sortRows(recordFilters(DB.projects, 'completed').map(p => {
    const last = p.schedule[p.schedule.length - 1];
    return Object.assign(projectRowBase(p), { completedOn: last ? last.actualEnd : null, value: p.contractValue });
  }), productState.records.sort);
  const st = productState.records.sort;

  const toolbar = h('div', { class: 'toolbar' }, searchInput(), pmFilter(),
    h('div', { class: 'toolbar__spacer' }),
    h('span', { class: 'tag', text: rows.length + ' project' + (rows.length === 1 ? '' : 's') }));

  const tbl = table({
    columns: [
      { label: 'Project', sortKey: 'name', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.name }), h('div', { class: 'cell-sub', text: r.qid + ' · ' + r.p.type })) },
      { label: 'Customer', sortKey: 'customer', render: r => h('span', { text: r.customer }) },
      { label: 'PM', sortKey: 'pmId', render: r => h('span', { text: personName(r.pmId) }) },
      { label: 'Completed on', render: r => h('span', { class: 'tnum', text: fmtDate(r.completedOn) }) },
      { label: 'Contract value', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.value) }) },
      { label: 'Status', render: r => statusBadge(r.status) }
    ],
    rows, sort: st,
    onSort: key => { productState.records.sort = { key, dir: st.key === key && st.dir === 'asc' ? 'desc' : 'asc' }; rerenderRecordsBody(); },
    onRowClick: r => openProject(r.id, 'details', null, 'records'),
    emptyMsg: { icon: 'folder', title: 'No matching projects', desc: 'No completed projects match the current filters.' }
  });

  return h('div', { id: 'recordsBody' }, toolbar, h('div', { class: 'rec-body' }, h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, tbl))));
}

function renderHandoverRecords() {
  const q = productState.records.query.trim().toLowerCase();
  const rows = DB.projects.filter(p => p.phase === 'handover')
    .filter(p => !q || [p.name, p.qid, p.customer].join(' ').toLowerCase().includes(q))
    .map(p => ({
      id: p.id, name: p.name, qid: p.qid, customer: p.customer, p,
      designer: p.handover ? p.handover.designerName : '—',
      received: p.handoverReceivedDaysAgo, dueIn: p.handover ? p.handover.dueIn : null,
      pm: p.pmId ? personName(p.pmId) : 'Not assigned',
      se: p.seId ? personName(p.seId) : 'Not assigned',
      state: p.handover && p.handover.state === 'pending' ? 'Awaiting handover review' : 'Handed over'
    }));

  const toolbar = h('div', { class: 'toolbar' }, searchInput(),
    h('div', { class: 'toolbar__spacer' }),
    h('span', { class: 'tag', text: rows.filter(r => r.state === 'Awaiting handover review').length + ' awaiting review' }));

  const openHandover = r => {
    if (r.p.handover && r.p.handover.state === 'pending') openAction('act-ho-' + r.p.id);
    else openProject(r.p.id, 'documents', r.p.handover ? r.p.handover.docs[0].id : null, 'records');
  };

  const tbl = table({
    columns: [
      { label: 'Project', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.name }), h('div', { class: 'cell-sub', text: r.qid + ' · ' + r.p.type })) },
      { label: 'Customer', render: r => h('span', { text: r.customer }) },
      { label: 'Design', render: r => h('span', { text: r.designer }) },
      { label: 'Received', render: r => h('span', { class: 'tnum', text: fmtDate(dOff(-r.received)) }) },
      { label: 'Decision', render: r => r.dueIn == null ? h('span', { class: 'tag', text: 'Closed' }) : timeChip(r.dueIn) },
      { label: 'PM assigned', render: r => h('span', { text: r.pm }) },
      { label: 'SE assigned', render: r => h('span', { text: r.se }) },
      { label: 'State', render: r => statusBadge(r.state) }
    ],
    rows, onRowClick: openHandover,
    emptyMsg: { icon: 'doc', title: 'No handovers', desc: 'No projects have arrived from Design with this filter.' }
  });

  return h('div', { id: 'recordsBody' }, toolbar, h('div', { class: 'rec-body' },
    h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, tbl))));
}

/* =====================================================================
   8d. VIEW — PROJECT (deep-link target)
   ===================================================================== */
const PROJECT_SECTIONS = ['details', 'schedule', 'se-updates', 'finances', 'documents', 'qa', 'tickets'];
const uiState = { expandedStages: {}, selectedSub: null };

function openProject(projectId, section, focusId, returnTo) {
  productState.project = { id: projectId, section: section || 'details', focusId: focusId || null, returnTo: returnTo || 'quick-actions' };
  productState.view = 'project';
  activeOverlay = null;
  const p = getProject(projectId);
  uiState.expandedStages = {};
  uiState.selectedSub = null;
  /* open the stage that holds the deep-linked sub-stage */
  if (focusId && p) {
    const found = getSub(p, focusId);
    if (found) uiState.expandedStages[found.stage.id] = true;
  }
  if (p && p.stageIdx != null && p.schedule[p.stageIdx]) uiState.expandedStages[p.schedule[p.stageIdx].id] = true;
  renderAll();
  toast('Opened ' + (p ? p.name : 'project') + ' · ' + SECTION_LABEL[productState.project.section], { icon: 'arrowRight' });
}
function closeProject() {
  const returnTo = productState.project.returnTo;
  productState.view = returnTo === 'records' ? 'records' : 'quick-actions';
  productState.project = { id: null, section: 'details', focusId: null, returnTo: null };
  activeOverlay = null;
  renderAll();
}
function gotoSection(section, focusId) {
  productState.project.section = section;
  if (focusId !== undefined) productState.project.focusId = focusId;
  activeOverlay = null;
  renderAll();
}

function renderProject() {
  const p = getProject(productState.project.id);
  if (!p) return emptyState({ icon: 'folder', title: 'Project not found', desc: 'Return to Records and select a project.' });
  const section = productState.project.section;
  const last = p.schedule[p.schedule.length - 1];
  const pm = byId(PM_LIST, p.pmId);
  const se = byId(SE_LIST, p.seId);

  const back = h('button', {
    type: 'button', class: 'btn btn--quiet btn--sm', attrs: { 'data-action': 'back' },
    on: { click: () => closeProject() }
  }, icon('arrowLeft', 14), h('span', { text: productState.project.returnTo === 'records' ? 'Back to Records' : 'Back to Quick Actions' }));

  const head = h('div', { class: 'proj-head' },
    h('div', { style: { marginBottom: '10px' } }, back),
    h('div', { class: 'proj-head__top' },
      h('div', { class: 'proj-head__t' },
        h('h1', { text: p.name }),
        h('div', { class: 'proj-head__sub' },
          h('span', { text: p.customer }),
          h('span', { class: 'sep', text: '·' }),
          h('span', { class: 'tnum', text: p.qid }),
          h('span', { class: 'sep', text: '·' }),
          h('span', { text: p.type }),
          p.status ? [h('span', { class: 'sep', text: '·' }), statusBadge(p.status)] : null)),
      h('div', { class: 'page-head__actions' },
        p.handover && p.handover.state === 'pending'
          ? btn({ label: 'Review handover', iconName: 'doc', onClick: () => openAction('act-ho-' + p.id) })
          : null)),
    h('div', { class: 'proj-stats' },
      h('div', { class: 'proj-stat' }, h('div', { class: 'proj-stat__k', text: 'Current stage' }), h('div', { class: 'proj-stat__v', text: currentStageName(p) })),
      h('div', { class: 'proj-stat' }, h('div', { class: 'proj-stat__k', text: 'Overall progress' }), h('div', { class: 'proj-stat__v' }, meterRow(stageProgress(p)))),
      h('div', { class: 'proj-stat' }, h('div', { class: 'proj-stat__k', text: 'PM' }), h('div', { class: 'proj-stat__v' }, h('div', { class: 'avatar', text: pm ? pm.initials : '—' }), h('span', { text: pm ? pm.name : 'Not assigned' }))),
      h('div', { class: 'proj-stat' }, h('div', { class: 'proj-stat__k', text: 'Site Engineer' }), h('div', { class: 'proj-stat__v', text: se ? se.name : 'Not assigned' })),
      h('div', { class: 'proj-stat' }, h('div', { class: 'proj-stat__k', text: 'Contract value' }), h('div', { class: 'proj-stat__v tnum', text: inr(p.contractValue) })),
      h('div', { class: 'proj-stat' }, h('div', { class: 'proj-stat__k', text: p.phase === 'completed' ? 'Completed' : 'Planned completion' }), h('div', { class: 'proj-stat__v tnum', text: fmtDate(last ? (last.actualEnd || last.plannedEnd) : null) }))));

  const counts = {
    'se-updates': p.records.se.length, qa: p.records.qa.length, tickets: p.records.tickets.length,
    documents: p.documents.length, finances: p.finances.client.length + p.finances.contractor.length
  };
  const tabs = h('div', { class: 'tabs', attrs: { role: 'tablist', 'aria-label': 'Project sections' } },
    PROJECT_SECTIONS.map(s => h('button', {
      type: 'button', class: 'tab', attrs: { role: 'tab', 'aria-selected': section === s ? 'true' : 'false', 'data-section': s },
      on: { click: () => gotoSection(s, null) }
    }, SECTION_LABEL[s], counts[s] != null ? h('span', { class: 'tab__n', text: String(counts[s]) }) : null)));

  let body;
  if (section === 'details') body = renderProjectDetails(p);
  else if (section === 'schedule') body = renderProjectSchedule(p);
  else if (section === 'se-updates') body = renderProjectSe(p);
  else if (section === 'finances') body = renderProjectFinances(p);
  else if (section === 'documents') body = renderProjectDocuments(p);
  else if (section === 'qa') body = renderProjectQa(p);
  else body = renderProjectTickets(p);

  return h('div', {}, head, tabs, h('div', { class: 'proj-body' }, body));
}

function renderProjectDetails(p) {
  const pm = byId(PM_LIST, p.pmId), se = byId(SE_LIST, p.seId), con = byId(CONTRACTORS, p.contractorId);
  const first = p.schedule[0], last = p.schedule[p.schedule.length - 1];
  const done = p.schedule.filter(s => s.state === 'Completed').length;

  const facts = kvGrid([
    { k: 'Project ID', v: p.qid }, { k: 'Customer', v: p.customer }, { k: 'Client contact', v: p.customerContact },
    { k: 'Project type', v: p.type }, { k: 'Project manager', v: pm ? pm.name : 'Not assigned' },
    { k: 'Site engineer', v: se ? se.name : 'Not assigned' }, { k: 'Main contractor', v: con ? con.name : '—' },
    { k: 'Contract value', v: inr(p.contractValue) },
    { k: 'Site start', v: fmtDate(first ? first.actualStart || first.plannedStart : null) },
    { k: p.phase === 'completed' ? 'Completed on' : 'Planned completion', v: fmtDate(last ? (last.actualEnd || last.plannedEnd) : null) },
    { k: 'Current stage', v: currentStageName(p) },
    { k: 'Stages complete', v: done + ' of ' + p.schedule.length }
  ]);

  const summary = h('p', { style: { fontSize: '12.5px', lineHeight: '1.65', color: 'var(--muted)' } },
    p.name + ' is a ' + p.type.toLowerCase() + ' project for ' + p.customer + ', currently at ' + currentStageName(p) +
    '. ' + done + ' of ' + p.schedule.length + ' stages are complete (' + pct(stageProgress(p)) + ' overall).' +
    (p.delayDays > 0 ? ' The project is running ' + p.delayDays + ' days behind the baseline schedule.' : ' The project is on the baseline schedule.'));

  const stages = h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' },
    p.schedule.map(st => h('div', {
      style: { display: 'grid', gridTemplateColumns: 'minmax(180px,2fr) 110px 90px minmax(90px,1fr)', gap: '10px', alignItems: 'center', padding: '9px 12px', borderBottom: '1px solid var(--line-soft)', fontSize: '12px' }
    },
      h('div', { style: { fontWeight: '600' }, text: st.name }),
      h('div', { class: 'tnum', style: { color: 'var(--faint)' }, text: fmtDateShort(st.plannedStart) + ' – ' + fmtDateShort(st.plannedEnd) }),
      h('div', {}, statusBadge(st.state)),
      meterRow(st.progress)))));

  return [
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Project summary' }), summary),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Key details' }), facts),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Stage overview' }), stages)
  ];
}

function renderProjectSchedule(p) {
  const focusId = productState.project.focusId;
  const head = h('div', { class: 'sched__head' },
    h('div', { text: 'Stage / sub-stage' }), h('div', { text: 'Planned start' }), h('div', { text: 'Planned end' }),
    h('div', { text: 'Actual start' }), h('div', { text: 'Actual end' }), h('div', { text: 'Progress' }), h('div', { text: 'State' }));

  const body = h('div', {}, p.schedule.map(st => {
    const isOpen = uiState.expandedStages[st.id] !== undefined ? uiState.expandedStages[st.id] : st.state !== 'Not started';
    const nodes = [];
    const variance = st.varianceDays;
    nodes.push(h('div', {
      class: 'sched__row sched__row--stage', attrs: { tabindex: '0', role: 'button', 'aria-expanded': isOpen ? 'true' : 'false', 'data-stage': st.id },
      on: {
        click: () => { uiState.expandedStages[st.id] = !isOpen; renderAll(); },
        keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uiState.expandedStages[st.id] = !isOpen; renderAll(); } }
      }
    },
      h('div', { class: 'sched__name' }, icon('chevron', 12, 'sched__caret' + (isOpen ? ' is-open' : '')), h('span', { text: st.name })),
      h('div', { class: 'tnum', text: fmtDateShort(st.plannedStart) }),
      h('div', { class: 'tnum', text: fmtDateShort(st.plannedEnd) }),
      h('div', { class: 'tnum', text: st.actualStart ? fmtDateShort(st.actualStart) : '—' }),
      h('div', { class: 'tnum', text: st.actualEnd ? fmtDateShort(st.actualEnd) : '—' }),
      meterRow(st.progress),
      h('div', {}, statusBadge(st.state))));

    if (isOpen) {
      st.subs.forEach(sub => {
        const selected = uiState.selectedSub === sub.id;
        nodes.push(h('div', {
          class: 'sched__row sched__row--sub' + (focusId === sub.id ? ' is-focus' : ''),
          attrs: { tabindex: '0', role: 'button', 'data-sub': sub.id },
          on: {
            click: () => { uiState.selectedSub = selected ? null : sub.id; renderAll(); },
            keydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uiState.selectedSub = selected ? null : sub.id; renderAll(); } }
          }
        },
          h('div', { class: 'sched__name' }, h('span', { text: sub.name })),
          h('div', { class: 'tnum', text: fmtDateShort(sub.plannedStart) }),
          h('div', { class: 'tnum', text: fmtDateShort(sub.plannedEnd) }),
          h('div', { class: 'tnum', text: sub.actualStart ? fmtDateShort(sub.actualStart) : '—' }),
          h('div', { class: 'tnum', text: sub.actualEnd ? fmtDateShort(sub.actualEnd) : '—' }),
          meterRow(sub.progress, sub.state === 'Completed' ? 'ok' : null),
          h('div', {}, statusBadge(sub.state))));

        if (selected) {
          const dev = sub.actualEnd ? dayDiff(sub.actualEnd) - dayDiff(sub.plannedEnd) : (sub.state === 'In progress' && p.delayDays > 0 ? p.delayDays : null);
          nodes.push(h('div', { class: 'sched__detail' },
            h('dl', {},
              h('div', {}, h('dt', { text: 'Duration' }), h('dd', { text: sub.dur + ' days planned' })),
              h('div', {}, h('dt', { text: 'Planned window' }), h('dd', { class: 'tnum', text: fmtDate(sub.plannedStart) + ' → ' + fmtDate(sub.plannedEnd) })),
              h('div', {}, h('dt', { text: 'Actual' }), h('dd', { class: 'tnum', text: sub.actualStart ? fmtDate(sub.actualStart) + ' → ' + (sub.actualEnd ? fmtDate(sub.actualEnd) : 'in progress') : 'Not started' })),
              h('div', {}, h('dt', { text: 'Deviation' }), h('dd', {}, dev == null ? h('span', { text: 'On plan' }) : dev === 0 ? h('span', { text: 'On plan' }) : h('span', { class: 'delay-note' }, icon('alert', 12), h('span', { text: (dev > 0 ? '+' : '') + dev + ' days' })))),
              sub.state === 'In progress' ? h('div', {}, h('dt', { text: 'Forecast end' }), h('dd', { class: 'tnum', text: fmtDate(sub.forecastEnd || sub.plannedEnd) })) : null),
            h('div', { style: { marginTop: '10px', display: 'flex', gap: '8px' } },
              sub.state === 'In progress' ? btn({ label: 'Mark complete', size: 'sm', onClick: () => { closeOverlay(); openScheduleFromSub(p, sub); } }) : null,
              sub.state === 'Ready to start' ? btn({ label: 'Start sub-stage', size: 'sm', onClick: () => { openScheduleFromSub(p, sub); } }) : null)));
        }
      });
    }
    return nodes;
  }));

  const delayed = p.delayDays > 0;
  const delayStrip = delayed
    ? h('div', { class: 'insight-note', style: { background: 'var(--warm)', borderColor: 'rgba(169,74,68,.24)', color: 'var(--brand-ink)' } },
      icon('alert', 14),
      h('span', { text: 'This project is ' + p.delayDays + ' days behind the baseline. Sub-stages completed from ' + p.schedule[Math.max(0, p.stageIdx - 1)].name + ' onwards carry the slip.' }))
    : h('div', { class: 'insight-note' }, icon('checkCircle', 14), h('span', { text: 'Actual dates are tracking the baseline. No delay recorded on completed sub-stages.' }));

  return h('div', { class: 'mbody__sec' },
    delayStrip,
    h('div', { class: 'sched' }, head, body));
}

/* opens the schedule action modal for a specific sub-stage (from the project schedule) */
function openScheduleFromSub(p, sub) {
  const isStart = sub.state === 'Ready to start' || sub.state === 'Not started';
  scheduleModal({
    projectId: p.id,
    payload: { subId: sub.id },
    action: { category: 'schedule', type: isStart ? 'start-next' : 'mark-complete', projectId: p.id, focusId: sub.id }
  });
}

function renderProjectSe(p) {
  const filter = uiState.seFilter || 'all';
  const types = [['all', 'All'], ['daily-report', 'Daily'], ['inspection-report', 'Inspection'], ['material-request', 'Material'], ['weekly-material-report', 'Weekly']];
  const rows = p.records.se.filter(r => filter === 'all' || r.type === filter);

  const chips = h('div', { class: 'toolbar' },
    types.map(([id, label]) => h('button', {
      type: 'button', class: 'chip-filter', attrs: { 'aria-pressed': filter === id ? 'true' : 'false' },
      on: { click: () => { uiState.seFilter = id; renderAll(); } }
    }, label)),
    h('div', { class: 'toolbar__spacer' }),
    h('span', { class: 'tag', text: p.records.se.filter(r => r.state === 'Pending approval').length + ' awaiting approval' }));

  const tbl = table({
    columns: [
      { label: 'Report / request', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.title }), h('div', { class: 'cell-sub', text: SE_TYPES[r.type].label + ' · ' + (r.scope || r.summary || (r.lines ? r.lines.length + ' line items' : '')).toString().slice(0, 90) })) },
      { label: 'Type', render: r => h('span', { class: 'tag', text: SE_TYPES[r.type].short }) },
      { label: 'Raised by', render: r => h('span', { text: personName(r.raisedBy) }) },
      { label: 'Date', render: r => h('span', { class: 'tnum', text: fmtDate(r.raisedOn) }) },
      { label: 'State', render: r => statusBadge(r.state) }
    ],
    rows,
    focusId: productState.project.focusId,
    onRowClick: r => openSeRecord(p.id, r.id),
    emptyMsg: { icon: 'note', title: 'No SE updates', desc: 'No reports or requests of this type on this project.' }
  });

  return h('div', { class: 'mbody__sec' }, chips, h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, tbl)));
}

function renderProjectFinances(p) {
  const focusId = productState.project.focusId;
  const clientRows = p.finances.client;
  const conRows = p.finances.contractor;

  const note = h('div', { class: 'insight-note' }, icon('money', 14),
    h('span', { text: 'Client money is requested before a stage starts. Contractor payouts are initiated after a sub-stage is completed — the two are tracked separately.' }));

  const clientTable = table({
    columns: [
      { label: 'Stage', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.stage }), h('div', { class: 'cell-sub', text: r.milestone })) },
      { label: 'Stage start', render: r => h('span', { class: 'tnum', text: fmtDate(r.stageStart) }) },
      { label: 'Amount', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.amount) }) },
      { label: 'Requested', render: r => h('span', { class: 'tnum', text: r.requestedOn ? fmtDate(r.requestedOn) : '—' }) },
      { label: 'Received', render: r => h('span', { class: 'tnum', text: r.paidOn ? fmtDate(r.paidOn) : '—' }) },
      { label: 'State', render: r => statusBadge(r.state) }
    ],
    rows: clientRows, focusId,
    onRowClick: r => openMoneyRecord(p.id, r.id, 'client'),
    emptyMsg: { icon: 'money', title: 'No client payments', desc: 'No stage payments recorded for this project.' }
  });

  const contractorTable = table({
    columns: [
      { label: 'Sub-stage', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.subStage }), h('div', { class: 'cell-sub', text: r.stage + ' · ' + r.measurement })) },
      { label: 'Contractor', render: r => h('span', { text: (byId(CONTRACTORS, r.contractorId) || {}).name || '—' }) },
      { label: 'Completed', render: r => h('span', { class: 'tnum', text: fmtDate(r.completedOn) }) },
      { label: 'Amount', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.amount) }) },
      { label: 'Requested', render: r => h('span', { class: 'tnum', text: r.requestedOn ? fmtDate(r.requestedOn) : '—' }) },
      { label: 'State', render: r => statusBadge(r.state) }
    ],
    rows: conRows, focusId,
    onRowClick: r => openMoneyRecord(p.id, r.id, 'contractor'),
    emptyMsg: { icon: 'money', title: 'No contractor payouts', desc: 'No sub-stage completions have generated a payout yet.' }
  });

  const clientTotal = clientRows.reduce((a, r) => a + r.amount, 0);
  const conTotal = conRows.reduce((a, r) => a + r.amount, 0);

  return h('div', { class: 'mbody__sec' },
    note,
    h('section', { class: 'panel' },
      h('div', { class: 'panel__head' },
        h('div', { class: 'panel__title', text: 'Client money — stage payments' }),
        h('div', { class: 'panel__sub', text: p.customer }),
        h('div', { class: 'panel__head-spacer' }),
        h('span', { class: 'tag', text: 'Total ' + inr(clientTotal) })),
      h('div', { class: 'panel__body panel__body--flush' }, clientTable)),
    h('section', { class: 'panel' },
      h('div', { class: 'panel__head' },
        h('div', { class: 'panel__title', text: 'Contractor payouts' }),
        h('div', { class: 'panel__sub', text: (byId(CONTRACTORS, p.contractorId) || {}).name || 'Contractor' }),
        h('div', { class: 'panel__head-spacer' }),
        h('span', { class: 'tag', text: 'Total ' + inr(conTotal) })),
      h('div', { class: 'panel__body panel__body--flush' }, contractorTable)));
}

function docRowNode(doc, opts = {}) {
  const { onView, onApprove, onRemark, focus } = opts;
  const reviewed = doc.review !== 'Unreviewed';
  return h('div', { class: 'doc-row' + (focus ? ' is-focus' : ''), attrs: { 'data-doc': doc.id } },
    h('div', { class: 'doc-row__file', text: doc.type }),
    h('div', {},
      h('div', { class: 'doc-row__t', text: doc.name }),
      h('div', { class: 'doc-row__s', text: doc.meta + ' · ' + doc.size })),
    h('div', { class: 'tnum', text: fmtDateShort(doc.issuedOn) }),
    h('div', { text: doc.issuedBy || doc.source || '—' }),
    h('div', { text: doc.category || '—' }),
    h('div', {}, badge(doc.review, doc.review === 'Approved' ? 'ok' : doc.review === 'Remark added' ? 'warn' : 'neutral')),
    h('div', { class: 'doc-row__acts' },
      onRemark ? btn({ label: doc.remark ? 'Remark' : 'Add remark', size: 'sm', iconName: 'note', onClick: () => onRemark(doc) }) : null,
      onApprove ? btn({
        label: reviewed ? 'Approved' : 'Mark correct', size: 'sm', iconName: 'check',
        variant: reviewed ? '' : 'primary', disabled: doc.review === 'Approved',
        onClick: () => onApprove(doc)
      }) : null,
      onView ? btn({ label: 'View', size: 'sm', iconName: 'external', onClick: () => onView(doc) }) : null));
}

function renderProjectDocuments(p) {
  const focusId = productState.project.focusId;
  const ho = p.handover;
  const others = p.documents.filter(d => !ho || ho.docs.every(x => x.id !== d.id));

  const handoverPanel = ho ? h('section', { class: 'panel' },
    h('div', { class: 'panel__head' },
      h('div', { class: 'panel__title', text: 'Design handover pack' }),
      h('div', { class: 'panel__sub', text: 'Received ' + fmtDate(dOff(-p.handoverReceivedDaysAgo)) + ' from ' + ho.designerName }),
      h('div', { class: 'panel__head-spacer' }),
      statusBadge(ho.state === 'pending' ? 'Awaiting handover review' : 'Handed over'),
      ho.state === 'pending' ? btn({ label: 'Open handover review', size: 'sm', onClick: () => openAction('act-ho-' + p.id) }) : null),
    h('div', { class: 'panel__body panel__body--flush' },
      h('div', { class: 'doc-list' },
        h('div', { class: 'doc-row doc-row--head' },
          h('div', {}), h('div', { text: 'Document' }), h('div', { text: 'Issued' }), h('div', { text: 'Owner' }), h('div', { text: 'Category' }), h('div', { text: 'Review' }), h('div', {})),
        ho.docs.map(d => docRowNode(d, {
          focus: focusId === d.id,
          onView: () => openAction('act-ho-' + p.id),
          onApprove: doc => { openAction('act-ho-' + p.id); },
          onRemark: doc => { openAction('act-ho-' + p.id); }
        })))))
    : null;

  const docsTable = table({
    columns: [
      { label: 'Document', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.name }), h('div', { class: 'cell-sub', text: r.meta })) },
      { label: 'Type', render: r => h('span', { class: 'tag', text: r.type }) },
      { label: 'Date', render: r => h('span', { class: 'tnum', text: fmtDate(r.issuedOn) }) },
      { label: 'Source / owner', render: r => h('span', { text: r.source }) },
      { label: 'Category', render: r => h('span', { text: r.category }) },
      { label: 'Status', render: r => statusBadge(r.status) }
    ],
    rows: others,
    emptyMsg: { icon: 'folder', title: 'No documents', desc: 'No project documents have been recorded yet.' }
  });

  return h('div', { class: 'mbody__sec' }, handoverPanel,
    h('section', { class: 'panel' },
      h('div', { class: 'panel__head' }, h('div', { class: 'panel__title', text: 'Project documents' }),
        h('div', { class: 'panel__head-spacer' }), h('span', { class: 'tag', text: others.length + ' files' })),
      h('div', { class: 'panel__body panel__body--flush' }, docsTable)));
}

function renderProjectQa(p) {
  const tbl = table({
    columns: [
      { label: 'Report', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.title }), h('div', { class: 'cell-sub', text: r.summary ? r.summary.slice(0, 96) + (r.summary.length > 96 ? '…' : '') : '' })) },
      { label: 'Stage / sub-stage', render: r => h('span', { text: r.stage + ' · ' + r.subStage }) },
      { label: 'Date', render: r => h('span', { class: 'tnum', text: fmtDate(r.inspectedOn) }) },
      { label: 'Inspector', render: r => h('span', { text: personName(r.inspectorId) }) },
      { label: 'Findings', cls: 'num', render: r => h('span', { class: 'tnum', text: String(r.findings ? r.findings.length : 0) }) },
      { label: 'State', render: r => statusBadge(r.state) }
    ],
    rows: p.records.qa,
    focusId: productState.project.focusId,
    onRowClick: r => openQaRecord(p.id, r.id),
    emptyMsg: { icon: 'checkCircle', title: 'No QA reports', desc: 'No quality reports recorded for this project.' }
  });
  return h('div', { class: 'mbody__sec' }, h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, tbl)));
}

function renderProjectTickets(p) {
  const tbl = table({
    columns: [
      { label: 'Ticket', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.title }), h('div', { class: 'cell-sub', text: r.code + ' · ' + r.category })) },
      { label: 'Client', render: r => h('span', { text: r.client }) },
      { label: 'Raised', render: r => h('span', { class: 'tnum', text: fmtDate(r.raisedOn) }) },
      { label: 'Priority', render: r => badge(r.priority, r.priority === 'High' ? 'brand' : 'neutral') },
      { label: 'Department', render: r => h('span', { text: r.department || 'Unassigned' }) },
      { label: 'State', render: r => statusBadge(r.state) }
    ],
    rows: p.records.tickets,
    focusId: productState.project.focusId,
    onRowClick: r => openTicketRecord(p.id, r.id),
    emptyMsg: { icon: 'ticket', title: 'No tickets', desc: 'No client tickets recorded for this project.' }
  });
  return h('div', { class: 'mbody__sec' }, h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, tbl)));
}

/* =====================================================================
   9. ACTION MODALS — one contextual surface per action category
   ===================================================================== */
const sep = () => h('span', { class: 'sep', text: '·' });

function actionFooter(o) {
  return [
    o.hint ? h('div', { class: 'mfoot__hint' }, icon(o.hintIcon || 'alert', 14), typeof o.hint === 'string' ? h('span', { text: o.hint }) : o.hint) : null,
    h('div', { class: 'mfoot__spacer' }),
    o.onOpenInProject ? btn({ label: 'Open in project', iconName: 'external', onClick: o.onOpenInProject }) : null,
    btn({ label: 'Close', onClick: o.onClose || closeOverlay }),
    o.secondary ? o.secondary : null,
    o.primaryLabel ? btn({ label: o.primaryLabel, variant: 'primary', disabled: !!o.primaryDisabled, autofocus: true, onClick: o.onPrimary }) : null
  ];
}
function actionSubtitle(p, catLabel, dueIn, extra) {
  return [h('span', { text: p.name }), sep(), h('span', { class: 'tnum', text: p.qid }), sep(), h('span', { text: catLabel })]
    .concat(extra ? [sep(), extra] : [])
    .concat(dueIn != null ? [sep(), timeChip(dueIn)] : []);
}
function deepLinkFor(ctx) {
  const a = ctx.action;
  if (a && a.category === 'pm-missed') {
    const m = DB.missedWork.find(x => x.id === a.payload.missedId);
    return { section: DEEP_LINK[m ? m.category : 'pm-missed'], focusId: null, label: 'Open in project' };
  }
  return { section: DEEP_LINK[a ? a.category : 'details'], focusId: a ? a.focusId : (ctx.focusId || null), label: 'Open in project' };
}
function openInProjectFrom(ctx) {
  const dl = deepLinkFor(ctx);
  closeOverlay();
  openProject(ctx.projectId, dl.section, dl.focusId, 'quick-actions');
}

/* ---- 9a. Design Handover ---- */
function designHandoverModal(ctx) {
  const p = getProject(ctx.projectId);
  if (!p || !p.handover) return;
  const ho = p.handover;
  const isAdmin = can('assignPm');
  let assignedPm = p.pmId || null;
  let assignedSe = p.seId || null;
  let remarkFor = null;

  const docsHost = h('div', { class: 'doc-list' });
  const gateHint = h('span', {});
  const summaryHost = h('div', {});

  const pmCombo = combo({
    options: PM_LIST.map(pm => ({ id: pm.id, label: pm.name, sub: pm.projects + ' projects · ' + pm.region })),
    value: assignedPm, label: 'PM', placeholder: 'Select a PM',
    onChange: v => { assignedPm = v; pmCombo.setValue(v); sync(); }
  });
  const seCombo = combo({
    options: SE_LIST.map(se => ({ id: se.id, label: se.name, sub: se.trade })),
    value: assignedSe, label: 'SE', placeholder: 'Select a Site Engineer',
    onChange: v => { assignedSe = v; seCombo.setValue(v); sync(); }
  });

  function renderDocs() {
    clear(docsHost);
    docsHost.appendChild(h('div', { class: 'doc-row doc-row--head' },
      h('div', {}), h('div', { text: 'Document' }), h('div', { text: 'Issued' }), h('div', { text: 'Owner' }),
      h('div', { text: 'Category' }), h('div', { text: 'Review' }), h('div', {})));
    ho.docs.forEach(doc => {
      docsHost.appendChild(docRowNode(doc, {
        onApprove: d => { d.review = 'Approved'; if (remarkFor === d.id) remarkFor = null; renderDocs(); sync(); },
        onRemark: d => { remarkFor = remarkFor === d.id ? null : d.id; renderDocs(); },
        onView: d => toast('Opening ' + d.name + ' (prototype — file not attached)', { icon: 'doc' })
      }));
      if (remarkFor === doc.id) {
        const ta = h('textarea', { class: 'input', placeholder: 'Add a remark for Design…', attrs: { 'aria-label': 'Remark for ' + doc.name } });
        ta.value = doc.remark || '';
        docsHost.appendChild(h('div', { class: 'sched__detail' },
          h('div', { class: 'field' }, h('div', { class: 'field__label', text: 'Remark' }), ta),
          h('div', { class: 'btn-row', style: { marginTop: '8px' } },
            btn({
              label: 'Save remark', size: 'sm', variant: 'primary', onClick: () => {
                doc.remark = ta.value.trim();
                if (doc.review !== 'Approved') doc.review = doc.remark ? 'Remark added' : 'Unreviewed';
                remarkFor = null; renderDocs(); sync();
              }
            }),
            btn({ label: 'Cancel', size: 'sm', onClick: () => { remarkFor = null; renderDocs(); } }))));
      }
    });
  }

  function sync() {
    const reviewed = ho.docs.filter(d => d.review !== 'Unreviewed').length;
    clear(summaryHost);
    summaryHost.appendChild(h('div', { class: 'stat-strip' },
      h('div', { class: 'stat-strip__i' }, h('div', { class: 'stat-strip__k', text: 'Documents' }), h('div', { class: 'stat-strip__v', text: String(ho.docs.length) })),
      h('div', { class: 'stat-strip__i' }, h('div', { class: 'stat-strip__k', text: 'Reviewed' }), h('div', { class: 'stat-strip__v', text: reviewed + ' / ' + ho.docs.length })),
      h('div', { class: 'stat-strip__i' }, h('div', { class: 'stat-strip__k', text: 'Received' }), h('div', { class: 'stat-strip__v', style: { fontSize: '12px' }, text: fmtDate(ho.receivedOn) })),
      h('div', { class: 'stat-strip__i' }, h('div', { class: 'stat-strip__k', text: 'Decision' }), h('div', { class: 'stat-strip__v' }, timeChip(ho.dueIn)))));

    const ready = reviewed === ho.docs.length;
    const needsPm = isAdmin && !assignedPm;
    clear(gateHint);
    if (!ready) gateHint.appendChild(h('span', { text: (ho.docs.length - reviewed) + ' document' + (ho.docs.length - reviewed === 1 ? '' : 's') + ' still unreviewed' }));
    else if (needsPm) gateHint.appendChild(h('span', { text: 'Select a PM to send the project' }));
    else gateHint.appendChild(h('span', { text: isAdmin ? 'Ready to send to the selected PM' : 'Handover reviewed — ready to confirm' }));

    const primary = $('.overlay__panel .mfoot .btn--primary');
    if (primary) primary.disabled = !(ready && (isAdmin ? assignedPm : true));
  }

  const assignment = h('div', { class: 'mbody__sec' },
    h('div', { class: 'section-title', text: isAdmin ? 'Assignment' : 'Site Engineer assignment' }),
    h('div', { class: 'kv-grid', style: { gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' } },
      isAdmin ? h('div', { class: 'kv' }, h('div', { class: 'kv__k', text: 'Assign PM' }), h('div', { style: { marginTop: '6px' } }, pmCombo)) : null,
      h('div', { class: 'kv' }, h('div', { class: 'kv__k', text: 'Assign SE' }), h('div', { style: { marginTop: '6px' } }, seCombo))),
    h('div', { class: 'field__hint', text: isAdmin ? 'Sending the project moves it to the selected PM’s Ongoing Projects and closes this handover action.' : 'SE assignment is recorded on the project. PM Admin sends the project to a PM.' }));

  const body = [
    h('div', { class: 'mbody__sec' }, summaryHost),
    h('div', { class: 'mbody__sec' },
      h('div', { class: 'section-title', text: 'Documents from Design' }),
      h('div', { class: 'panel' }, h('div', { class: 'panel__body panel__body--flush' }, docsHost))),
    assignment
  ];

  function complete() {
    if (isAdmin) {
      ho.state = 'sent';
      ho.sentOn = TODAY;
      p.pmId = assignedPm;
      if (assignedSe) p.seId = assignedSe;
      p.phase = 'ongoing';
      p.status = 'On track';
      closeOverlay();
      renderAll();
      toast('Handover sent to ' + personName(assignedPm) + ' · ' + p.name, { icon: 'checkCircle' });
    } else {
      ho.pmCompleted = true;
      if (assignedSe) p.seId = assignedSe;
      closeOverlay();
      renderAll();
      toast('Handover reviewed and SE recorded · awaiting PM assignment', { icon: 'checkCircle' });
    }
  }

  renderDocs();
  openOverlay({
    size: 'xl',
    title: 'Design handover review',
    subtitle: actionSubtitle(p, 'Design Handover', ho.dueIn, h('span', { text: ho.designerName + ' · ' + ho.designerDept })),
    body,
    footer: actionFooter({
      hint: gateHint,
      hintIcon: 'doc',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'design-handover', focusId: ho.docs[0] ? ho.docs[0].id : null } }),
      primaryLabel: isAdmin ? 'Send to PM' : 'Confirm handover review',
      onPrimary: complete
    })
  });
  sync();
}

/* ---- 9b. SE Updates ---- */
function seUpdateModal(ctx) {
  const p = getProject(ctx.projectId);
  const rec = getSeRecord(p.id, ctx.payload.seId);
  if (!rec) return;
  const t = SE_TYPES[rec.type];
  const actionable = rec.state === 'Pending approval';

  let body;
  if (rec.type === 'daily-report') {
    body = [
      h('div', { class: 'mbody__sec' },
        statStrip([
          { k: 'Manpower', v: (rec.manpower ? rec.manpower.skilled + rec.manpower.unskilled + rec.manpower.staff : 0) + ' on site' },
          { k: 'Labour hours', v: String(rec.hours || 0) },
          { k: 'Materials logged', v: String((rec.materials || []).length) },
          { k: 'Open issues', v: String((rec.issues || []).length) }
        ])),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Summary' }),
        h('div', { class: 'report' }, h('div', { class: 'report__sec' }, h('div', { class: 'report__v', text: rec.summary })))),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Work completed' }),
        h('div', { class: 'report' }, h('div', { class: 'report__sec' },
          h('ul', { style: { margin: '0', paddingLeft: '18px', fontSize: '12px', lineHeight: '1.7' } }, (rec.workDone || []).map(w => h('li', { text: w })))))),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Issues on site' }),
        h('div', { class: 'report' }, h('div', { class: 'report__sec' },
          (rec.issues || []).length ? h('ul', { style: { margin: '0', paddingLeft: '18px', fontSize: '12px', lineHeight: '1.7' } }, rec.issues.map(w => h('li', { text: w }))) : h('div', { class: 'report__v', text: 'None reported.' })))),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Safety & next day' }),
        h('div', { class: 'report' },
          h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Safety' }), h('div', { class: 'report__v', text: rec.safety })),
          h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Planned for tomorrow' }), h('div', { class: 'report__v', text: rec.nextDay }))))
    ];
  } else if (rec.type === 'inspection-report') {
    body = [
      h('div', { class: 'mbody__sec' },
        statStrip([
          { k: 'Scope', v: rec.scope },
          { k: 'Checklist', v: rec.checklist.pass + ' / ' + rec.checklist.total + ' pass' },
          { k: 'Attention', v: String(rec.checklist.attention) },
          { k: 'Inspected', v: fmtDate(rec.raisedOn) }
        ])),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Inspection items' }),
        table({
          columns: [
            { label: 'Item', render: r => h('div', { class: 'cell-title', text: r.item }) },
            { label: 'Result', render: r => badge(r.result, r.result === 'Pass' ? 'ok' : r.result === 'Observation' ? 'warn' : 'brand') },
            { label: 'Note', render: r => h('span', { text: r.note }) }
          ],
          rows: rec.items
        })),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Conclusion' }),
        h('div', { class: 'report' }, h('div', { class: 'report__sec' }, h('div', { class: 'report__v', text: rec.conclusion }))))
    ];
  } else if (rec.type === 'material-request') {
    body = [
      h('div', { class: 'mbody__sec' },
        statStrip([
          { k: 'Needed by', v: rec.neededBy },
          { k: 'Line items', v: String(rec.lines.length) },
          { k: 'Estimated value', v: inr(rec.total) },
          { k: 'Delivery', v: rec.deliveryLocation }
        ])),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Reason' }),
        h('div', { class: 'report' }, h('div', { class: 'report__sec' }, h('div', { class: 'report__v', text: rec.reason })))),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Requested material' }),
        table({
          columns: [
            { label: 'Material', render: r => h('div', {}, h('div', { class: 'cell-title', text: r.material }), h('div', { class: 'cell-sub', text: r.spec })) },
            { label: 'Qty', cls: 'num', render: r => h('span', { class: 'tnum', text: r.qty + ' ' + r.unit }) },
            { label: 'Est. rate', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.estRate) }) },
            { label: 'Amount', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.amount) }) }
          ],
          rows: rec.lines,
          footer: [h('span', { text: 'Total' }), '', '', inr(rec.total)]
        }))
    ];
  } else {
    body = [
      h('div', { class: 'mbody__sec' },
        statStrip([
          { k: 'Week', v: rec.week },
          { k: 'Period', v: rec.period },
          { k: 'Materials tracked', v: String(rec.lines.length) },
          { k: 'Raised', v: fmtDate(rec.raisedOn) }
        ])),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Consumption' }),
        table({
          columns: [
            { label: 'Material', render: r => h('div', { class: 'cell-title', text: r.material }) },
            { label: 'Opening', cls: 'num', render: r => h('span', { class: 'tnum', text: r.opening + ' ' + r.unit }) },
            { label: 'Received', cls: 'num', render: r => h('span', { class: 'tnum', text: r.received }) },
            { label: 'Consumed', cls: 'num', render: r => h('span', { class: 'tnum', text: r.consumed }) },
            { label: 'Closing', cls: 'num', render: r => h('span', { class: 'tnum', text: r.closing }) },
            { label: 'Variance', cls: 'num', render: r => h('span', { class: 'tnum', text: r.variance }) }
          ],
          rows: rec.lines
        })),
      h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'SE summary' }),
        h('div', { class: 'report' }, h('div', { class: 'report__sec' }, h('div', { class: 'report__v', text: rec.summary }))))
    ];
  }

  if (!actionable) {
    body.unshift(h('div', { class: 'confirm' }, icon('checkCircle', 14),
      h('span', { text: 'This ' + t.label.toLowerCase() + ' is ' + rec.state.toLowerCase() + (rec.decidedBy ? ' · decided by ' + rec.decidedBy : '') + '.' })));
  }

  let rejectNode = null;
  if (actionable && rec.type === 'material-request') {
    rejectNode = btn({
      label: 'Reject', onClick: () => {
        rec.state = 'Rejected';
        rec.decidedBy = currentUser().name;
        rec.decidedOn = TODAY;
        closeOverlay(); renderAll();
        toast('Material request rejected · ' + rec.title, { icon: 'close' });
      }
    });
  }

  openOverlay({
    size: 'lg',
    title: t.label,
    subtitle: actionSubtitle(p, 'SE Updates', actionable ? rec.dueIn : null, h('span', { text: personName(rec.raisedBy) + ' · Site Engineer' })),
    body,
    footer: actionFooter({
      hint: actionable ? (t.publishedToClient ? 'Approving publishes this to the customer app.' : 'Approving records your decision on the project record.') : 'No action required — this item is closed.',
      hintIcon: 'note',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'se-updates', focusId: rec.id } }),
      secondary: rejectNode,
      primaryLabel: actionable ? t.verb : null,
      onPrimary: () => {
        rec.state = t.publishedToClient ? 'Published' : 'Approved';
        rec.decidedBy = currentUser().name;
        rec.decidedOn = TODAY;
        closeOverlay(); renderAll();
        toast(t.label + ' ' + rec.state.toLowerCase() + ' · ' + p.name, { icon: 'checkCircle' });
      }
    })
  });
}

/* ---- 9c. Money / Payments — client request ---- */
function clientMoneyModal(ctx) {
  const p = getProject(ctx.projectId);
  const pay = p.finances.client.find(c => c.id === ctx.payload.paymentId);
  if (!pay) return;
  const daysUntil = dayDiff(pay.stageStart);
  const received = p.finances.client.filter(c => c.state === 'Paid').reduce((a, c) => a + c.amount, 0);
  const actionable = pay.state === 'To request';
  const stage = p.schedule[pay.stageIdx];

  const body = [
    h('div', { class: 'mbody__sec' },
      statStrip([
        { k: 'Upcoming stage', v: pay.stage },
        { k: 'Stage starts', v: fmtDate(pay.stageStart) },
        { k: 'Time to start', v: dueLabel(daysUntil) },
        { k: 'Amount to request', v: inr(pay.amount) }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Payment context' }),
      kvGrid([
        { k: 'Customer', v: p.customer },
        { k: 'Client contact', v: p.customerContact },
        { k: 'Milestone', v: pay.milestone },
        { k: 'Contract value', v: inr(p.contractValue) },
        { k: 'Received to date', v: inr(received) },
        { k: 'Stage window', v: fmtDateShort(stage.plannedStart) + ' → ' + fmtDateShort(stage.plannedEnd) }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Stage payment history' }),
      table({
        columns: [
          { label: 'Stage', render: r => h('div', { class: 'cell-title', text: r.stage }) },
          { label: 'Amount', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.amount) }) },
          { label: 'Requested', render: r => h('span', { class: 'tnum', text: r.requestedOn ? fmtDate(r.requestedOn) : '—' }) },
          { label: 'Received', render: r => h('span', { class: 'tnum', text: r.paidOn ? fmtDate(r.paidOn) : '—' }) },
          { label: 'State', render: r => statusBadge(r.state) }
        ],
        rows: p.finances.client,
        focusId: pay.id
      }))
  ];

  if (!actionable) {
    body.unshift(h('div', { class: 'confirm' }, icon('checkCircle', 14),
      h('span', { text: 'This stage payment is ' + pay.state.toLowerCase() + (pay.requestedOn ? ' · requested ' + fmtDate(pay.requestedOn) : '') + '.' })));
  }

  openOverlay({
    size: 'lg',
    title: 'Client money request',
    subtitle: actionSubtitle(p, 'Money / Payments', daysUntil, h('span', { class: 'tag tag--client', text: 'Client request' })),
    body,
    footer: actionFooter({
      hint: actionable ? 'Requests open 10 days before a stage starts so payment lands before mobilisation.' : 'No action required for this payment.',
      hintIcon: 'money',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'money', focusId: pay.id } }),
      primaryLabel: actionable ? 'Request payment' : null,
      onPrimary: () => {
        pay.state = 'Requested';
        pay.requestedOn = TODAY;
        closeOverlay(); renderAll();
        toast('Payment request sent to ' + p.customer + ' · ' + inr(pay.amount), { icon: 'checkCircle' });
      }
    })
  });
}

/* ---- 9d. Money / Payments — contractor payout ---- */
function contractorPayoutModal(ctx) {
  const p = getProject(ctx.projectId);
  const pay = p.finances.contractor.find(c => c.id === ctx.payload.paymentId);
  if (!pay) return;
  const contractor = byId(CONTRACTORS, pay.contractorId) || { name: 'Contractor' };
  const since = -dayDiff(pay.completedOn);
  const actionable = pay.state === 'Awaiting request';
  const deviation = dayDiff(pay.completedOn) - dayDiff(pay.plannedEnd);

  const body = [
    h('div', { class: 'mbody__sec' },
      statStrip([
        { k: 'Contractor', v: contractor.name },
        { k: 'Completed sub-stage', v: pay.subStage },
        { k: 'Completed', v: fmtDate(pay.completedOn) },
        { k: 'Payout amount', v: inr(pay.amount) }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Completion detail' }),
      kvGrid([
        { k: 'Stage', v: pay.stage },
        { k: 'Planned completion', v: fmtDate(pay.plannedEnd) },
        { k: 'Actual completion', v: fmtDate(pay.completedOn) },
        { k: 'Deviation', v: deviation === 0 ? 'On plan' : (deviation > 0 ? '+' : '') + deviation + ' days' },
        { k: 'Measurement', v: pay.measurement },
        { k: 'Payout state', v: pay.state }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Recent contractor payouts' }),
      table({
        columns: [
          { label: 'Sub-stage', render: r => h('div', { class: 'cell-title', text: r.subStage }) },
          { label: 'Completed', render: r => h('span', { class: 'tnum', text: fmtDate(r.completedOn) }) },
          { label: 'Amount', cls: 'num', render: r => h('span', { class: 'tnum', text: inr(r.amount) }) },
          { label: 'State', render: r => statusBadge(r.state) }
        ],
        rows: p.finances.contractor,
        focusId: pay.id
      }))
  ];

  if (!actionable) {
    body.unshift(h('div', { class: 'confirm' }, icon('checkCircle', 14),
      h('span', { text: 'This payout is ' + pay.state.toLowerCase() + (pay.requestedOn ? ' · requested ' + fmtDate(pay.requestedOn) : '') + '.' })));
  }

  openOverlay({
    size: 'lg',
    title: 'Contractor payout request',
    subtitle: actionSubtitle(p, 'Money / Payments', actionable ? -Math.max(0, since - 1) : null, h('span', { class: 'tag tag--contractor', text: 'Contractor payout' })),
    body,
    footer: actionFooter({
      hint: actionable ? 'Payouts are initiated 1 day after a sub-stage is completed and routed to Finance.' : 'No action required for this payout.',
      hintIcon: 'money',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'money', focusId: pay.id } }),
      primaryLabel: actionable ? 'Send to Finance' : null,
      onPrimary: () => {
        pay.state = 'Sent to Finance';
        pay.requestedOn = TODAY;
        closeOverlay(); renderAll();
        toast('Payout request sent to Finance · ' + contractor.name + ' · ' + inr(pay.amount), { icon: 'checkCircle' });
      }
    })
  });
}

/* ---- 9e. QA Requests ---- */
function qaModal(ctx) {
  const p = getProject(ctx.projectId);
  const rec = getQaRecord(p.id, ctx.payload.qaId);
  if (!rec) return;
  const actionable = rec.state === 'Pending review';
  const remarkTa = h('textarea', {
    class: 'input', placeholder: actionable ? 'Remarks for the QA team or site (required to reject)…' : 'No remarks recorded.',
    disabled: !actionable, attrs: { 'aria-label': 'QA remarks' }
  });
  remarkTa.value = rec.remark || '';
  const rejectBtn = btn({ label: 'Reject', disabled: true, onClick: () => doReject() });

  function syncReject() {
    rejectBtn.disabled = !(actionable && remarkTa.value.trim().length > 0);
  }
  remarkTa.addEventListener('input', syncReject);

  function doReject() {
    rec.state = 'Rejected';
    rec.remark = remarkTa.value.trim();
    rec.decidedBy = currentUser().name;
    closeOverlay(); renderAll();
    toast('QA report rejected · rework raised on site', { icon: 'close' });
  }

  const body = [
    h('div', { class: 'mbody__sec' },
      statStrip([
        { k: 'Stage', v: rec.stage },
        { k: 'Sub-stage', v: rec.subStage },
        { k: 'Inspected', v: fmtDate(rec.inspectedOn) },
        { k: 'Checklist', v: rec.checklist.pass + ' / ' + rec.checklist.total + ' pass' }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Summary' }),
      h('div', { class: 'report' }, h('div', { class: 'report__sec' }, h('div', { class: 'report__v', text: rec.summary })))),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Findings' }),
      rec.findings && rec.findings.length
        ? h('div', { class: 'findings' }, rec.findings.map(f => h('div', { class: 'finding' },
          h('div', { class: 'finding__sev' }, badge(f.severity, f.severity === 'Major' ? 'brand' : f.severity === 'Minor' ? 'warn' : 'neutral')),
          h('div', {},
            h('div', { class: 'finding__t', text: f.item }),
            h('div', { class: 'finding__d', text: f.note }),
            f.clause ? h('div', { class: 'finding__d', style: { color: 'var(--faint)' }, text: 'Reference · ' + f.clause }) : null))))
        : h('div', { class: 'report' }, h('div', { class: 'report__sec' }, h('div', { class: 'report__v', text: 'No findings recorded — checklist fully passed.' })))),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Remarks' }),
      h('div', { class: 'field' }, remarkTa, h('div', { class: 'field__hint', text: actionable ? 'Approve records acceptance. Reject requires a remark so the site knows what to rework.' : 'This report is closed.' })))
  ];

  if (!actionable) {
    body.unshift(h('div', { class: 'confirm' }, icon(rec.state === 'Rejected' ? 'close' : 'checkCircle', 14),
      h('span', { text: 'This QA report is ' + rec.state.toLowerCase() + (rec.decidedBy ? ' · by ' + rec.decidedBy : '') + '.' })));
  }

  openOverlay({
    size: 'lg',
    title: 'QA report review',
    subtitle: actionSubtitle(p, 'QA Requests', actionable ? rec.dueIn : null, h('span', { text: personName(rec.inspectorId) + ' · QA' })),
    body,
    footer: actionFooter({
      hint: actionable ? 'Review → approve or reject → the action closes on the board.' : 'No action required — this report is closed.',
      hintIcon: 'checkCircle',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'qa', focusId: rec.id } }),
      secondary: actionable ? rejectBtn : null,
      primaryLabel: actionable ? 'Approve report' : null,
      onPrimary: () => {
        rec.state = 'Approved';
        rec.remark = remarkTa.value.trim() || rec.remark || null;
        rec.decidedBy = currentUser().name;
        closeOverlay(); renderAll();
        toast('QA report approved · ' + p.name, { icon: 'checkCircle' });
      }
    })
  });
  syncReject();
}

/* ---- 9f. Schedule ---- */
function recomputeSchedule(p) {
  p.schedule.forEach(st => {
    const done = st.subs.filter(s => s.state === 'Completed').length;
    st.state = done === st.subs.length ? 'Completed' : (done > 0 || st.subs.some(s => s.state === 'In progress') ? 'In progress' : 'Not started');
    st.progress = Math.round(st.subs.reduce((a, s) => a + s.progress, 0) / st.subs.length);
    const firstActual = st.subs.find(s => s.actualStart);
    st.actualStart = firstActual ? firstActual.actualStart : null;
    st.actualEnd = done === st.subs.length ? st.subs[st.subs.length - 1].actualEnd : null;
    st.varianceDays = st.actualEnd ? dayDiff(st.actualEnd) - dayDiff(st.plannedEnd) : null;
  });
}

function scheduleModal(ctx) {
  const p = getProject(ctx.projectId);
  const found = getSub(p, ctx.payload.subId);
  if (!found) return;
  const { stage, sub } = found;
  const kind = ctx.action && ctx.action.type === 'start-next' ? 'start-next' : 'mark-complete';
  const isStart = kind === 'start-next';
  const deviation = sub.actualEnd ? dayDiff(sub.actualEnd) - dayDiff(sub.plannedEnd) : (isStart ? dayDiff(TODAY) - dayDiff(sub.plannedStart) : p.delayDays);
  const idx = stage.subs.indexOf(sub);
  const prev = idx > 0 ? stage.subs[idx - 1] : null;
  const next = idx < stage.subs.length - 1 ? stage.subs[idx + 1] : null;

  const body = [
    h('div', { class: 'mbody__sec' },
      statStrip([
        { k: 'Stage', v: stage.name },
        { k: 'Sub-stage', v: sub.name },
        { k: isStart ? 'Planned start' : 'Planned completion', v: fmtDate(isStart ? sub.plannedStart : sub.plannedEnd) },
        { k: 'Current state', v: sub.state }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Planned vs actual' }),
      kvGrid([
        { k: 'Planned start', v: fmtDate(sub.plannedStart) },
        { k: 'Planned end', v: fmtDate(sub.plannedEnd) },
        { k: 'Actual start', v: sub.actualStart ? fmtDate(sub.actualStart) : '—' },
        { k: 'Actual end', v: sub.actualEnd ? fmtDate(sub.actualEnd) : '—' },
        { k: 'Planned duration', v: sub.dur + ' days' },
        { k: 'Deviation', v: deviation === 0 ? 'On plan' : (deviation > 0 ? '+' : '') + deviation + ' days' }
      ])),
    isStart
      ? h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Ready to start' }),
        h('div', { class: 'report' },
          h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Predecessor' }),
            h('div', { class: 'report__v', text: prev ? prev.name + ' — completed ' + fmtDate(prev.actualEnd) : 'None in this stage' })),
          h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Next activity' }),
            h('div', { class: 'report__v', text: sub.name + ' · ' + sub.dur + ' days planned' + (next ? ' · followed by ' + next.name : '') }))))
      : h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Completion context' }),
        h('div', { class: 'report' },
          h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Progress recorded on site' }),
            h('div', { style: { marginTop: '6px' } }, meterRow(sub.progress))),
          h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Following activity' }),
            h('div', { class: 'report__v', text: next ? next.name + ' · planned start ' + fmtDate(next.plannedStart) : 'Stage closes after this sub-stage' }))))
  ];

  if (deviation !== 0) {
    body.unshift(h('div', { class: 'insight-note', style: { background: 'var(--warm)', borderColor: 'rgba(169,74,68,.24)', color: 'var(--brand-ink)' } },
      icon('alert', 14),
      h('span', { text: (isStart ? 'This sub-stage was planned to start on ' : 'This sub-stage was planned to complete on ') + fmtDate(isStart ? sub.plannedStart : sub.plannedEnd) + ' — ' + Math.abs(deviation) + ' day' + (Math.abs(deviation) === 1 ? '' : 's') + ' ' + (deviation > 0 ? 'behind' : 'ahead') + '.' })));
  }

  openOverlay({
    size: 'lg',
    title: isStart ? 'Start next sub-stage' : 'Mark sub-stage complete',
    subtitle: actionSubtitle(p, 'Schedule', isStart ? dayDiff(sub.plannedStart) : dayDiff(sub.plannedEnd), h('span', { text: stage.name })),
    body,
    footer: actionFooter({
      hint: 'Schedule actions come from the project schedule. The full schedule stays in Project → Schedule.',
      hintIcon: 'calendar',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'schedule', focusId: sub.id } }),
      primaryLabel: isStart ? 'Start sub-stage' : 'Mark complete',
      onPrimary: () => {
        if (isStart) {
          sub.state = 'In progress';
          sub.actualStart = TODAY;
          sub.progress = 10;
          toast('Started ' + sub.name + ' · ' + p.name, { icon: 'checkCircle' });
        } else {
          sub.state = 'Completed';
          sub.progress = 100;
          sub.actualEnd = TODAY;
          sub.actualStart = sub.actualStart || sub.plannedStart;
          if (next && next.state === 'Not started') next.state = 'Ready to start';
          toast('Marked ' + sub.name + ' complete · ' + p.name, { icon: 'checkCircle' });
        }
        recomputeSchedule(p);
        closeOverlay(); renderAll();
      }
    })
  });
}

/* ---- 9g. Client Tickets ---- */
function ticketModal(ctx) {
  const p = getProject(ctx.projectId);
  const t = getTicket(p.id, ctx.payload.ticketId);
  if (!t) return;
  const actionable = t.state !== 'Resolved';
  const age = -dayDiff(t.raisedOn);

  const replyTa = h('textarea', {
    class: 'input', placeholder: 'Reply to the client…', disabled: !actionable, attrs: { 'aria-label': 'Reply to client' }
  });
  const internalTa = h('textarea', {
    class: 'input', placeholder: 'Internal note (not visible to the client)…', disabled: !actionable, attrs: { 'aria-label': 'Internal note' }
  });
  let dept = t.department;
  const deptCombo = combo({
    options: [{ id: null, label: 'Unassigned' }].concat(DEPARTMENTS.map(d => ({ id: d, label: d }))),
    value: dept, label: 'department', placeholder: 'Assign department',
    onChange: v => { dept = v; deptCombo.setValue(v); syncResolve(); }
  });
  const resolveBtn = btn({ label: 'Resolve ticket', variant: 'primary', disabled: true, autofocus: true, onClick: () => doResolve() });
  const hintEl = h('span', { text: '' });

  function syncResolve() {
    const has = replyTa.value.trim().length > 0 || dept !== t.department;
    resolveBtn.disabled = !(actionable && has);
    clear(hintEl);
    hintEl.appendChild(document.createTextNode(
      !actionable ? 'Ticket resolved.' : has ? 'Reply is sent to the client app and the ticket closes.' : 'Add a reply or change the assigned department to resolve.'));
  }
  replyTa.addEventListener('input', syncResolve);

  function doResolve() {
    const reply = replyTa.value.trim();
    const internal = internalTa.value.trim();
    if (reply) t.messages.push({ who: currentUser().name, role: currentRole().label, daysAgo: 0, text: reply });
    if (internal) t.internalNotes.push({ who: currentUser().name, role: currentRole().label, daysAgo: 0, text: internal });
    t.department = dept;
    t.state = 'Resolved';
    t.resolvedOn = TODAY;
    closeOverlay(); renderAll();
    toast('Ticket ' + t.code + ' resolved' + (dept ? ' · assigned to ' + dept : ''), { icon: 'checkCircle' });
  }

  const thread = h('div', { class: 'thread' },
    t.messages.map(m => h('div', { class: 'msg' },
      h('div', { class: 'msg__head' }, h('span', { class: 'msg__who', text: m.who }), h('span', { text: m.role }), sep(), h('span', { text: ageLabel(m.daysAgo) })),
      h('div', { class: 'msg__body' }, h('p', { text: m.text })))),
    t.internalNotes.map(m => h('div', { class: 'msg msg--internal' },
      h('div', { class: 'msg__head' }, icon('note', 12), h('span', { class: 'msg__who', text: m.who }), h('span', { text: 'Internal note' }), sep(), h('span', { text: ageLabel(m.daysAgo) })),
      h('div', { class: 'msg__body' }, h('p', { text: m.text })))));

  const body = [
    h('div', { class: 'mbody__sec' },
      kvGrid([
        { k: 'Ticket', v: t.code }, { k: 'Client', v: t.client }, { k: 'Category', v: t.category },
        { k: 'Raised', v: fmtDate(t.raisedOn) + ' · ' + ageLabel(age).toLowerCase() },
        { k: 'Priority', v: t.priority }, { k: 'Department', v: t.department || 'Unassigned' }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Conversation' }), thread),
    actionable ? h('div', { class: 'mbody__sec' },
      h('div', { class: 'section-title', text: 'Respond' }),
      h('div', { class: 'field' }, h('div', { class: 'field__label', text: 'Reply to client' }), replyTa),
      h('div', { class: 'field', style: { marginTop: '10px' } }, h('div', { class: 'field__label', text: 'Internal note' }), internalTa),
      h('div', { class: 'field', style: { marginTop: '10px' } }, h('div', { class: 'field__label', text: 'Assign to department' }), deptCombo))
      : null
  ];

  if (!actionable) {
    body.unshift(h('div', { class: 'confirm' }, icon('checkCircle', 14),
      h('span', { text: 'Resolved' + (t.resolvedOn ? ' on ' + fmtDate(t.resolvedOn) : '') + (t.department ? ' · ' + t.department : '') + '.' })));
  }

  openOverlay({
    size: 'lg',
    title: t.title,
    subtitle: actionSubtitle(p, 'Tickets', actionable ? t.dueIn : null, h('span', { text: t.code + ' · ' + t.category })),
    body,
    footer: [
      h('div', { class: 'mfoot__hint' }, icon('ticket', 14), hintEl),
      h('div', { class: 'mfoot__spacer' }),
      btn({ label: 'Open in project', iconName: 'external', onClick: () => openInProjectFrom({ projectId: p.id, action: { category: 'tickets', focusId: t.id } }) }),
      btn({ label: 'Close', onClick: () => closeOverlay() }),
      actionable ? resolveBtn : null
    ]
  });
  syncResolve();
}

/* ---- 9h. PM Missed Work (PM Admin only) ---- */
function missedWorkModal(ctx) {
  const m = DB.missedWork.find(x => x.id === ctx.payload.missedId);
  if (!m) return;
  const p = getProject(m.projectId);
  const pm = byId(PM_LIST, m.pmId);

  const body = [
    h('div', { class: 'mbody__sec' },
      statStrip([
        { k: 'PM responsible', v: pm ? pm.name : '—' },
        { k: 'Category', v: m.categoryLabel },
        { k: 'Expected', v: fmtDate(dOff(-m.expectedDaysAgo)) },
        { k: 'Overdue by', v: m.expectedDaysAgo + ' days' }
      ])),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'What was missed' }),
      h('div', { class: 'report' },
        h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Action' }), h('div', { class: 'report__v', text: m.title })),
        h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Context' }), h('div', { class: 'report__v', text: m.detail })),
        h('div', { class: 'report__sec' }, h('div', { class: 'report__k', text: 'Record state' }), h('div', { class: 'report__v', text: m.summary })))),
    h('div', { class: 'mbody__sec' }, h('div', { class: 'section-title', text: 'Required action' }),
      h('div', { class: 'kv-grid' },
        h('div', { class: 'kv' }, h('div', { class: 'kv__k', text: 'Action to complete' }), h('div', { class: 'kv__v', text: m.action })),
        h('div', { class: 'kv' }, h('div', { class: 'kv__k', text: 'Acting as' }), h('div', { class: 'kv__v', text: currentUser().name + ' on behalf of ' + (pm ? pm.name : 'PM') }))))
  ];

  openOverlay({
    size: 'lg',
    title: 'PM missed work',
    subtitle: actionSubtitle(p, 'PM Missed Work', -m.expectedDaysAgo, h('span', { text: (pm ? pm.name : 'PM') + ' · PM' })),
    body,
    footer: actionFooter({
      hint: 'PM Admin only. Completing records the action against the project and clears the escalation.',
      hintIcon: 'shield',
      onOpenInProject: () => openInProjectFrom({ projectId: p.id, action: { category: 'pm-missed', payload: { missedId: m.id } } }),
      primaryLabel: 'Complete on behalf of PM',
      onPrimary: () => {
        m.cleared = true;
        m.completedBy = currentUser().name;
        m.completedOn = TODAY;
        closeOverlay(); renderAll();
        toast('Completed on behalf of ' + (pm ? pm.name : 'PM') + ' · ' + p.name, { icon: 'checkCircle' });
      }
    })
  });
}

/* ---- dispatch ---- */
function openAction(actionId) {
  const a = getAction(actionId);
  if (!a) return;
  const ctx = { action: a, projectId: a.projectId, payload: a.payload };
  if (a.category === 'design-handover') designHandoverModal(ctx);
  else if (a.category === 'se-updates') seUpdateModal(ctx);
  else if (a.category === 'money') (a.type === 'client-request' ? clientMoneyModal : contractorPayoutModal)(ctx);
  else if (a.category === 'qa') qaModal(ctx);
  else if (a.category === 'schedule') scheduleModal(ctx);
  else if (a.category === 'tickets') ticketModal(ctx);
  else if (a.category === 'pm-missed') missedWorkModal(ctx);
}
const openSeRecord = (pid, id) => seUpdateModal({ projectId: pid, payload: { seId: id }, action: null });
const openQaRecord = (pid, id) => qaModal({ projectId: pid, payload: { qaId: id }, action: null });
const openTicketRecord = (pid, id) => ticketModal({ projectId: pid, payload: { ticketId: id }, action: null });
const openMoneyRecord = (pid, id, kind) => (kind === 'client' ? clientMoneyModal : contractorPayoutModal)({ projectId: pid, payload: { paymentId: id }, action: null });

/* =====================================================================
   10. ROUTER & INIT
   ===================================================================== */
function init() {
  initDB();
  renderAll();
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activeOverlay) { e.preventDefault(); closeOverlay(); }
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

/* expose a small surface for inspection / testing */
window.PM = {
  prototypeState, productState, DB, ROLES, CATEGORIES,
  buildActions, visibleActions, actionsByCategory, buildInsights,
  selectFlow, setRole, openAction, openProject, closeProject, gotoSection, expandColumn
};
