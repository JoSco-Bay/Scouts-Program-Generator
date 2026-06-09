"use client";

import { useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RunSheetRow { time: string; action: string; leaderNotes: string; }
interface Equipment { fromShed: string[]; toBring: string[]; consumables: string[]; }
interface Instructions {
  overview: string;
  setup: string[];
  runSheet: RunSheetRow[];
  equipment: Equipment;
  safety: string[];
  variations: { easier: string; harder: string };
}
interface LeaderScript {
  intro: string;
  instructions: string;
  debrief: string;
  reflectionQuestions: string[];
}
interface PrintableContent {
  items?: string[];
  controls?: { id: string; clue: string }[];
  bearings?: { from: string; to: string; bearing: string }[];
  scenario?: string;
  patientCondition?: string[];
  actions?: string[];
  debrief?: string;
  roles?: string[];
  objectives?: string[];
  cipherType?: string;
  key?: Record<string, string>;
  messages?: string[];
  sections?: { heading: string; lines: number }[];
  title?: string;
  instructions?: string;
}
interface Printable {
  needed: boolean;
  reason: string;
  type: string | null;
  title: string | null;
  content: PrintableContent | null;
}
interface VisualStep { label: string; description: string; }
interface VisualDiagram {
  type: string;       // "knot" | "fire_lay" | "shelter" | "first_aid" | "navigation" | "compass"
  name: string;
  steps: VisualStep[];
}
interface Visuals {
  needed: boolean;
  diagrams: VisualDiagram[];
}
interface Activity {
  title: string;
  tagline: string;
  oasLink: string;
  duration: string;
  groupSize: string;
  difficulty: string;
  instructions: Instructions;
  leaderScript: LeaderScript;
  printable: Printable;
  visuals: Visuals;
}

// ── SVG Diagram Library ───────────────────────────────────────────────────────

// Shared rope drawing helpers
const ROPE_COLOR = "#8B4513";
const ROPE_DARK  = "#5C2E00";
const ROPE_LIGHT = "#D2691E";

function RopeStrand({ d, color = ROPE_COLOR, width = 6 }: { d: string; color?: string; width?: number }) {
  return (
    <>
      <path d={d} stroke={ROPE_DARK} strokeWidth={width + 2} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} stroke={color} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={d} stroke={ROPE_LIGHT} strokeWidth={width * 0.3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
    </>
  );
}

// Individual knot diagrams — each returns an SVG element for one step
const KNOT_STEPS: Record<string, { viewBox: string; steps: React.ReactNode[] }> = {
  "Reef Knot": {
    viewBox: "0 0 300 120",
    steps: [
      // Step 1: two ends crossing
      <svg key="1" viewBox="0 0 300 120" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 1 — Cross left over right</text>
        <RopeStrand d="M 20 60 Q 80 40 150 60 Q 220 80 280 60" color={ROPE_COLOR}/>
        <RopeStrand d="M 20 70 Q 80 90 150 70 Q 220 50 280 70" color="#4169E1"/>
        <text x="150" y="108" textAnchor="middle" className="diag-tip">Left (brown) crosses OVER right (blue)</text>
      </svg>,
      // Step 2: tuck under
      <svg key="2" viewBox="0 0 300 120" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 2 — Tuck under and through</text>
        <RopeStrand d="M 20 55 Q 100 30 150 55 Q 180 70 160 80 Q 140 95 120 80 Q 100 65 150 55" color={ROPE_COLOR}/>
        <RopeStrand d="M 280 65 Q 200 90 150 65 Q 120 50 140 40 Q 160 28 180 40 Q 200 52 150 65" color="#4169E1"/>
        <text x="150" y="108" textAnchor="middle" className="diag-tip">Tuck the end through the loop</text>
      </svg>,
      // Step 3: finished knot
      <svg key="3" viewBox="0 0 300 120" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 3 — Right over left, tuck through</text>
        <RopeStrand d="M 20 65 Q 90 65 120 55 Q 145 45 150 55 Q 155 65 160 75 Q 170 90 200 75 Q 230 60 280 60" color={ROPE_COLOR}/>
        <RopeStrand d="M 20 55 Q 90 55 120 65 Q 145 75 150 65 Q 155 55 160 45 Q 170 30 200 45 Q 230 60 280 70" color="#4169E1"/>
        <circle cx="150" cy="60" r="18" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4"/>
        <text x="150" y="108" textAnchor="middle" className="diag-tip">Pull both ends — flat square knot ✓</text>
      </svg>,
    ]
  },
  "Bowline": {
    viewBox: "0 0 300 140",
    steps: [
      <svg key="1" viewBox="0 0 300 140" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 1 — Make a small loop (the rabbit hole)</text>
        <RopeStrand d="M 50 90 L 150 90" color={ROPE_COLOR}/>
        <RopeStrand d="M 150 90 Q 165 70 180 90 Q 195 110 150 90" color={ROPE_COLOR}/>
        <RopeStrand d="M 150 90 L 250 90" color={ROPE_COLOR}/>
        <text x="170" y="105" className="diag-tip" style={{fontSize:9}}>small loop</text>
        <text x="150" y="125" textAnchor="middle" className="diag-tip">Cross the working end over to make a loop</text>
      </svg>,
      <svg key="2" viewBox="0 0 300 140" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 2 — Rabbit comes up through the hole</text>
        <RopeStrand d="M 50 95 L 140 95 Q 155 75 170 95 Q 185 115 140 95" color={ROPE_COLOR}/>
        <RopeStrand d="M 140 70 L 140 50" color={ROPE_COLOR}/>
        <text x="140" y="40" textAnchor="middle" style={{fontSize:10,fill:"#92400e",fontStyle:"italic"}}>↑ rabbit up</text>
        <text x="150" y="125" textAnchor="middle" className="diag-tip">Working end comes UP through the small loop</text>
      </svg>,
      <svg key="3" viewBox="0 0 300 140" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 3 — Round the tree, back down the hole</text>
        <RopeStrand d="M 50 95 L 130 95 Q 145 75 160 95 Q 175 115 130 95" color={ROPE_COLOR}/>
        <RopeStrand d="M 130 75 Q 130 50 200 50 Q 250 50 250 80" color={ROPE_COLOR}/>
        <RopeStrand d="M 130 75 L 130 95" color={ROPE_COLOR}/>
        <circle cx="150" cy="85" r="22" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4"/>
        <text x="150" y="125" textAnchor="middle" className="diag-tip">Around the standing line, back down through loop ✓</text>
      </svg>,
    ]
  },
  "Clove Hitch": {
    viewBox: "0 0 300 130",
    steps: [
      <svg key="1" viewBox="0 0 300 130" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 1 — First loop over the post</text>
        <rect x="135" y="20" width="30" height="100" rx="4" fill="#8B6914" stroke="#5C4510" strokeWidth="2"/>
        <RopeStrand d="M 20 60 Q 80 60 140 60 Q 150 40 160 60 Q 200 60 280 60" color={ROPE_COLOR}/>
        <text x="150" y="118" textAnchor="middle" className="diag-tip">Pass rope over post, cross over itself</text>
      </svg>,
      <svg key="2" viewBox="0 0 300 130" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 2 — Second loop over the post</text>
        <rect x="135" y="20" width="30" height="100" rx="4" fill="#8B6914" stroke="#5C4510" strokeWidth="2"/>
        <RopeStrand d="M 20 55 Q 80 55 135 55 Q 125 45 135 75 Q 145 50 160 55 Q 200 55 280 55" color={ROPE_COLOR}/>
        <RopeStrand d="M 20 75 Q 80 75 135 75 Q 125 85 135 55" color={ROPE_COLOR}/>
        <text x="150" y="118" textAnchor="middle" className="diag-tip">Make a second loop to the right of the first</text>
      </svg>,
      <svg key="3" viewBox="0 0 300 130" className="diag-svg">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Step 3 — Tuck working end under second loop</text>
        <rect x="135" y="20" width="30" height="100" rx="4" fill="#8B6914" stroke="#5C4510" strokeWidth="2"/>
        <RopeStrand d="M 20 58 Q 90 50 135 58 Q 138 65 140 70 Q 142 75 148 72 Q 160 65 165 58 Q 210 58 280 58" color={ROPE_COLOR}/>
        <RopeStrand d="M 140 70 Q 143 82 137 78" color={ROPE_COLOR}/>
        <circle cx="150" cy="64" r="20" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4"/>
        <text x="150" y="118" textAnchor="middle" className="diag-tip">Tuck end under — pull tight ✓</text>
      </svg>,
    ]
  },
};

// Fire lay diagrams
function FireLayDiagram({ name }: { name: string }) {
  if (name.toLowerCase().includes("teepee") || name.toLowerCase().includes("tepee")) {
    return (
      <svg viewBox="0 0 280 200" className="diag-svg-large">
        <text x="140" y="18" textAnchor="middle" className="diag-step-label">Teepee / Cone Fire Lay</text>
        {/* Ground */}
        <ellipse cx="140" cy="175" rx="80" ry="12" fill="#8B6914" opacity="0.3"/>
        {/* Tinder bundle in center */}
        <ellipse cx="140" cy="165" rx="18" ry="8" fill="#DAA520" opacity="0.8"/>
        <text x="140" y="185" textAnchor="middle" style={{fontSize:9, fill:"#78350f"}}>tinder bundle</text>
        {/* Kindling sticks leaning in */}
        {[0,30,60,90,120,150,210,240,270,300,330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 140 + Math.cos(rad) * 65;
          const y1 = 165 + Math.sin(rad) * 12;
          return <line key={i} x1={x1} y1={y1} x2="140" y2="80" stroke="#8B4513" strokeWidth="3" strokeLinecap="round"/>;
        })}
        {/* Labels */}
        <text x="220" y="120" style={{fontSize:9, fill:"#92400e"}}>kindling</text>
        <line x1="208" y1="118" x2="185" y2="112" stroke="#92400e" strokeWidth="1"/>
        <text x="30" y="155" style={{fontSize:9, fill:"#92400e"}}>small fuel</text>
        <line x1="70" y1="152" x2="90" y2="148" stroke="#92400e" strokeWidth="1"/>
        {/* Arrow up for airflow */}
        <text x="140" y="55" textAnchor="middle" style={{fontSize:9, fill:"#dc2626"}}>↑ heat rises</text>
        <text x="140" y="195" textAnchor="middle" style={{fontSize:8, fill:"#78350f", fontStyle:"italic"}}>Best for: quick fire, cooking, signalling</text>
      </svg>
    );
  }
  if (name.toLowerCase().includes("log cabin") || name.toLowerCase().includes("star")) {
    return (
      <svg viewBox="0 0 280 200" className="diag-svg-large">
        <text x="140" y="18" textAnchor="middle" className="diag-step-label">Log Cabin Fire Lay</text>
        <ellipse cx="140" cy="175" rx="80" ry="10" fill="#8B6914" opacity="0.3"/>
        {/* Tinder in center */}
        <ellipse cx="140" cy="155" rx="16" ry="7" fill="#DAA520" opacity="0.7"/>
        {/* Log cabin layers */}
        {/* Bottom layer NS */}
        <rect x="100" y="148" width="80" height="10" rx="3" fill="#8B4513" stroke="#5C2E00" strokeWidth="1"/>
        {/* Bottom layer EW */}
        <rect x="108" y="140" width="10" height="25" rx="3" fill="#8B4513" stroke="#5C2E00" strokeWidth="1" transform="rotate(0 113 152)"/>
        <rect x="162" y="140" width="10" height="25" rx="3" fill="#8B4513" stroke="#5C2E00" strokeWidth="1"/>
        {/* Second layer NS */}
        <rect x="96" y="132" width="88" height="9" rx="3" fill="#A0522D" stroke="#5C2E00" strokeWidth="1"/>
        {/* Second layer EW */}
        <rect x="104" y="122" width="10" height="28" rx="3" fill="#A0522D" stroke="#5C2E00" strokeWidth="1"/>
        <rect x="166" y="122" width="10" height="28" rx="3" fill="#A0522D" stroke="#5C2E00" strokeWidth="1"/>
        {/* Third layer */}
        <rect x="92" y="115" width="96" height="9" rx="3" fill="#CD853F" stroke="#5C2E00" strokeWidth="1"/>
        <rect x="100" y="105" width="10" height="28" rx="3" fill="#CD853F" stroke="#5C2E00" strokeWidth="1"/>
        <rect x="170" y="105" width="10" height="28" rx="3" fill="#CD853F" stroke="#5C2E00" strokeWidth="1"/>
        <text x="140" y="195" textAnchor="middle" style={{fontSize:8, fill:"#78350f", fontStyle:"italic"}}>Best for: long-burning, warmth, camp cooking</text>
      </svg>
    );
  }
  // Default fire diagram
  return (
    <svg viewBox="0 0 280 180" className="diag-svg-large">
      <text x="140" y="18" textAnchor="middle" className="diag-step-label">{name}</text>
      <ellipse cx="140" cy="155" rx="70" ry="10" fill="#8B6914" opacity="0.3"/>
      {[0,45,90,135,180,225,270,315].map((a,i) => {
        const r = (a * Math.PI)/180;
        return <line key={i} x1={140+Math.cos(r)*55} y1={155+Math.sin(r)*9} x2="140" y2="85" stroke="#8B4513" strokeWidth="3.5" strokeLinecap="round"/>;
      })}
      <ellipse cx="140" cy="145" rx="15" ry="6" fill="#DAA520" opacity="0.8"/>
      <text x="140" y="175" textAnchor="middle" style={{fontSize:9, fill:"#78350f"}}>Place tinder in centre, lean kindling around</text>
    </svg>
  );
}

// First aid diagrams
function FirstAidDiagram({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("recovery") || n.includes("position")) {
    return (
      <svg viewBox="0 0 320 160" className="diag-svg-large">
        <text x="160" y="16" textAnchor="middle" className="diag-step-label">Recovery Position</text>
        {/* Body lying on side */}
        <ellipse cx="160" cy="100" rx="100" ry="28" fill="#fde68a" stroke="#92400e" strokeWidth="2" transform="rotate(-5 160 100)"/>
        {/* Head */}
        <circle cx="255" cy="88" r="22" fill="#fde68a" stroke="#92400e" strokeWidth="2"/>
        {/* Top arm forward */}
        <path d="M 200 82 Q 230 70 255 75" stroke="#92400e" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Bottom arm back */}
        <path d="M 120 95 Q 100 110 80 105" stroke="#d97706" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Top knee bent */}
        <path d="M 90 108 Q 75 130 95 145 Q 115 155 130 140" stroke="#92400e" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Airway arrow */}
        <path d="M 260 65 L 260 45" stroke="#22c55e" strokeWidth="2" markerEnd="url(#arr)"/>
        <text x="268" y="50" style={{fontSize:9, fill:"#22c55e"}}>airway open</text>
        {/* Labels */}
        <text x="160" y="148" textAnchor="middle" style={{fontSize:8, fill:"#78350f", fontStyle:"italic"}}>Stable side position · keeps airway clear · monitor breathing</text>
      </svg>
    );
  }
  if (n.includes("cpr") || n.includes("compression")) {
    return (
      <svg viewBox="0 0 320 200" className="diag-svg-large">
        <text x="160" y="16" textAnchor="middle" className="diag-step-label">CPR — Chest Compressions</text>
        {/* Person lying flat */}
        <ellipse cx="160" cy="130" rx="110" ry="30" fill="#fde68a" stroke="#92400e" strokeWidth="1.5"/>
        <circle cx="265" cy="115" r="20" fill="#fde68a" stroke="#92400e" strokeWidth="1.5"/>
        {/* Rescuer hands */}
        <rect x="140" y="98" width="40" height="18" rx="4" fill="#92400e" opacity="0.8"/>
        <rect x="143" y="88" width="34" height="14" rx="4" fill="#78350f" opacity="0.9"/>
        {/* Arrow down */}
        <line x1="160" y1="72" x2="160" y2="86" stroke="#dc2626" strokeWidth="3" markerEnd="url(#redarr)"/>
        <text x="170" y="82" style={{fontSize:9, fill:"#dc2626"}}>push down</text>
        {/* Measurements */}
        <text x="50" y="120" style={{fontSize:9, fill:"#92400e"}}>5–6cm deep</text>
        <text x="50" y="133" style={{fontSize:9, fill:"#92400e"}}>100–120/min</text>
        <text x="50" y="146" style={{fontSize:9, fill:"#92400e"}}>30 compressions</text>
        <text x="50" y="159" style={{fontSize:9, fill:"#92400e"}}>2 breaths</text>
        {/* Heel of hand label */}
        <text x="200" y="105" style={{fontSize:9, fill:"#44260a"}}>heel of hand</text>
        <text x="200" y="115" style={{fontSize:9, fill:"#44260a"}}>centre of chest</text>
        <text x="160" y="188" textAnchor="middle" style={{fontSize:8, fill:"#78350f", fontStyle:"italic"}}>Call 000 first · Push hard and fast · Don't stop until help arrives</text>
      </svg>
    );
  }
  if (n.includes("sling") || n.includes("arm")) {
    return (
      <svg viewBox="0 0 280 200" className="diag-svg-large">
        <text x="140" y="16" textAnchor="middle" className="diag-step-label">Arm Sling</text>
        {/* Torso */}
        <rect x="90" y="40" width="100" height="130" rx="20" fill="#fde68a" stroke="#92400e" strokeWidth="1.5" opacity="0.7"/>
        {/* Head */}
        <circle cx="140" cy="28" r="18" fill="#fde68a" stroke="#92400e" strokeWidth="1.5"/>
        {/* Sling triangle */}
        <path d="M 110 65 L 170 65 L 170 120 L 110 120 Z" fill="#4169E1" opacity="0.3" stroke="#4169E1" strokeWidth="1.5"/>
        {/* Arm in sling */}
        <path d="M 115 68 Q 140 90 165 68" stroke="#92400e" strokeWidth="8" fill="none" strokeLinecap="round"/>
        {/* Knot at neck */}
        <circle cx="140" cy="62" r="6" fill="#4169E1" stroke="#1d3461" strokeWidth="1"/>
        <text x="140" y="57" textAnchor="middle" style={{fontSize:8, fill:"#1d3461"}}>knot</text>
        {/* Labels */}
        <text x="200" y="85" style={{fontSize:9, fill:"#4169E1"}}>triangular</text>
        <text x="200" y="95" style={{fontSize:9, fill:"#4169E1"}}>bandage</text>
        <text x="140" y="185" textAnchor="middle" style={{fontSize:8, fill:"#78350f", fontStyle:"italic"}}>Support arm at 90° · tie knot to side of neck</text>
      </svg>
    );
  }
  // Generic first aid
  return (
    <svg viewBox="0 0 280 160" className="diag-svg-large">
      <text x="140" y="18" textAnchor="middle" className="diag-step-label">{name}</text>
      <rect x="90" y="40" width="100" height="100" rx="8" fill="none" stroke="#dc2626" strokeWidth="3"/>
      <line x1="140" y1="55" x2="140" y2="125" stroke="#dc2626" strokeWidth="8" strokeLinecap="round"/>
      <line x1="105" y1="90" x2="175" y2="90" stroke="#dc2626" strokeWidth="8" strokeLinecap="round"/>
      <text x="140" y="155" textAnchor="middle" style={{fontSize:9, fill:"#78350f"}}>First Aid</text>
    </svg>
  );
}

// Navigation diagrams
function NavigationDiagram({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("compass") || n.includes("bearing")) {
    return (
      <svg viewBox="0 0 280 240" className="diag-svg-large">
        <text x="140" y="16" textAnchor="middle" className="diag-step-label">Compass & Taking a Bearing</text>
        {/* Compass body */}
        <circle cx="140" cy="110" r="80" fill="white" stroke="#1c0f00" strokeWidth="3"/>
        <circle cx="140" cy="110" r="76" fill="#f8f8f0" stroke="#92400e" strokeWidth="1"/>
        {/* Degree marks */}
        {Array.from({length: 36}, (_,i) => {
          const a = (i*10*Math.PI)/180;
          const r1 = i%9===0 ? 60 : i%3===0 ? 65 : 68;
          return <line key={i}
            x1={140+Math.sin(a)*r1} y1={110-Math.cos(a)*r1}
            x2={140+Math.sin(a)*74} y2={110-Math.cos(a)*74}
            stroke="#44260a" strokeWidth={i%9===0?2:1} opacity={0.6}/>;
        })}
        {/* Cardinal points */}
        {[["N",0,"#dc2626"],["E",90,"#1c0f00"],["S",180,"#1c0f00"],["W",270,"#1c0f00"]].map(([label,deg,color])=>{
          const a = (Number(deg)*Math.PI)/180;
          return <text key={String(label)} x={140+Math.sin(a)*52} y={110-Math.cos(a)*52+4}
            textAnchor="middle" style={{fontSize:13,fontWeight:"bold",fill:String(color)}}>{String(label)}</text>;
        })}
        {/* Needle */}
        <polygon points="140,42 135,110 140,118 145,110" fill="#dc2626"/>
        <polygon points="140,178 135,110 140,102 145,110" fill="#1c0f00"/>
        <circle cx="140" cy="110" r="5" fill="#92400e" stroke="white" strokeWidth="1"/>
        {/* Bearing example */}
        <line x1="140" y1="110" x2="195" y2="55" stroke="#22c55e" strokeWidth="2" strokeDasharray="5,3"/>
        <text x="200" y="52" style={{fontSize:9,fill:"#22c55e"}}>045°</text>
        <text x="140" y="215" textAnchor="middle" style={{fontSize:9,fill:"#78350f",fontStyle:"italic"}}>Red needle = North · Read bearing at travel arrow</text>
        <text x="140" y="228" textAnchor="middle" style={{fontSize:8,fill:"#92400e"}}>RED in the BED = compass set correctly</text>
      </svg>
    );
  }
  if (n.includes("map") || n.includes("symbol")) {
    return (
      <svg viewBox="0 0 280 220" className="diag-svg-large">
        <text x="140" y="16" textAnchor="middle" className="diag-step-label">Common Map Symbols</text>
        {/* Grid of symbols with labels */}
        {[
          { x:40, y:50, sym: <><rect x="30" y="42" width="20" height="14" fill="#228B22" rx="2"/><text x="40" y="68" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Forest</text></> },
          { x:110, y:50, sym: <><line x1="98" y1="56" x2="122" y2="56" stroke="#4169E1" strokeWidth="3"/><text x="110" y="68" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>River</text></> },
          { x:180, y:50, sym: <><polygon points="180,42 185,56 175,56" fill="none" stroke="#1c0f00" strokeWidth="1.5"/><text x="180" y="68" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Spot ht</text></> },
          { x:250, y:50, sym: <><rect x="242" y="42" width="16" height="16" fill="none" stroke="#dc2626" strokeWidth="1.5"/><text x="250" y="68" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Building</text></> },
          { x:40, y:110, sym: <><path d="M30 120 Q40 100 50 120" fill="none" stroke="#8B4513" strokeWidth="2"/><text x="40" y="132" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Hill</text></> },
          { x:110, y:110, sym: <><line x1="98" y1="116" x2="122" y2="116" stroke="#8B4513" strokeWidth="2" strokeDasharray="4,2"/><text x="110" y="132" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Track</text></> },
          { x:180, y:110, sym: <><line x1="168" y1="116" x2="192" y2="116" stroke="#8B4513" strokeWidth="3"/><text x="180" y="132" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Road</text></> },
          { x:250, y:110, sym: <><circle cx="250" cy="116" r="7" fill="none" stroke="#4169E1" strokeWidth="1.5"/><text x="250" y="132" textAnchor="middle" style={{fontSize:8,fill:"#1c0f00"}}>Tank</text></> },
        ].map((item,i)=><g key={i}>{item.sym}</g>)}
        {/* Contour lines explanation */}
        <rect x="20" y="150" width="240" height="55" rx="4" fill="rgba(101,62,11,0.08)" stroke="rgba(101,62,11,0.2)" strokeWidth="1"/>
        <text x="140" y="165" textAnchor="middle" style={{fontSize:9,fontWeight:"bold",fill:"#44260a"}}>Contour Lines</text>
        <path d="M 40 185 Q 80 175 120 185 Q 160 195 200 185 Q 230 178 250 185" fill="none" stroke="#8B4513" strokeWidth="1.5"/>
        <path d="M 40 178 Q 80 168 120 178 Q 160 188 200 178 Q 230 171 250 178" fill="none" stroke="#8B4513" strokeWidth="1.5"/>
        <text x="140" y="200" textAnchor="middle" style={{fontSize:8,fill:"#78350f",fontStyle:"italic"}}>Closer together = steeper slope</text>
      </svg>
    );
  }
  return <svg viewBox="0 0 280 160" className="diag-svg-large">
    <text x="140" y="18" textAnchor="middle" className="diag-step-label">{name}</text>
    <circle cx="140" cy="90" r="55" fill="none" stroke="#92400e" strokeWidth="2"/>
    <line x1="140" y1="35" x2="140" y2="145" stroke="#1c0f00" strokeWidth="1.5" strokeDasharray="4"/>
    <line x1="85" y1="90" x2="195" y2="90" stroke="#1c0f00" strokeWidth="1.5" strokeDasharray="4"/>
    <polygon points="140,40 136,56 144,56" fill="#dc2626"/>
    <polygon points="140,140 136,124 144,124" fill="#1c0f00"/>
    <text x="140" y="30" textAnchor="middle" style={{fontSize:11,fontWeight:"bold",fill:"#dc2626"}}>N</text>
  </svg>;
}

// Shelter diagrams
function ShelterDiagram({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("lean") || n.includes("lean-to")) {
    return (
      <svg viewBox="0 0 300 180" className="diag-svg-large">
        <text x="150" y="16" textAnchor="middle" className="diag-step-label">Lean-To Shelter</text>
        {/* Ground */}
        <line x1="20" y1="155" x2="280" y2="155" stroke="#8B6914" strokeWidth="3"/>
        {/* Back wall post */}
        <line x1="60" y1="60" x2="60" y2="155" stroke="#8B4513" strokeWidth="8" strokeLinecap="round"/>
        <line x1="240" y1="60" x2="240" y2="155" stroke="#8B4513" strokeWidth="8" strokeLinecap="round"/>
        {/* Ridge pole */}
        <line x1="60" y1="60" x2="240" y2="60" stroke="#8B4513" strokeWidth="6" strokeLinecap="round"/>
        {/* Roof poles leaning */}
        {[70,90,110,130,150,170,190,210,230].map(x=>(
          <line key={x} x1={x} y1="60" x2={x+40} y2="155" stroke="#A0522D" strokeWidth="3" strokeLinecap="round"/>
        ))}
        {/* Thatching / leaves */}
        {[65,85,105,125,145,165,185,205,225].map((x,i)=>(
          <ellipse key={i} cx={x+20} cy={100} rx="12" ry="6" fill="#228B22" opacity="0.5" transform={`rotate(-40 ${x+20} 100)`}/>
        ))}
        {/* Labels */}
        <text x="150" y="55" textAnchor="middle" style={{fontSize:9,fill:"#44260a"}}>ridge pole</text>
        <text x="30" y="110" style={{fontSize:8,fill:"#228B22"}}>leaves/</text>
        <text x="30" y="120" style={{fontSize:8,fill:"#228B22"}}>bracken</text>
        <text x="150" y="172" textAnchor="middle" style={{fontSize:8,fill:"#78350f",fontStyle:"italic"}}>Face opening away from wind · 45° roof angle sheds rain</text>
      </svg>
    );
  }
  if (n.includes("a-frame") || n.includes("aframe")) {
    return (
      <svg viewBox="0 0 280 180" className="diag-svg-large">
        <text x="140" y="16" textAnchor="middle" className="diag-step-label">A-Frame Shelter</text>
        <line x1="30" y1="155" x2="250" y2="155" stroke="#8B6914" strokeWidth="3"/>
        {/* Ridge pole */}
        <line x1="60" y1="80" x2="220" y2="80" stroke="#8B4513" strokeWidth="6" strokeLinecap="round"/>
        {/* A-frame ends */}
        <line x1="60" y1="80" x2="40" y2="155" stroke="#8B4513" strokeWidth="5" strokeLinecap="round"/>
        <line x1="60" y1="80" x2="80" y2="155" stroke="#8B4513" strokeWidth="5" strokeLinecap="round"/>
        <line x1="220" y1="80" x2="200" y2="155" stroke="#8B4513" strokeWidth="5" strokeLinecap="round"/>
        <line x1="220" y1="80" x2="240" y2="155" stroke="#8B4513" strokeWidth="5" strokeLinecap="round"/>
        {/* Roof poles */}
        {[80,100,120,140,160,180,200].map(x=>(
          <g key={x}>
            <line x1={x} y1="80" x2={x-18} y2="155" stroke="#A0522D" strokeWidth="2.5"/>
            <line x1={x} y1="80" x2={x+18} y2="155" stroke="#A0522D" strokeWidth="2.5"/>
          </g>
        ))}
        {/* Labels */}
        <text x="140" y="75" textAnchor="middle" style={{fontSize:9,fill:"#44260a"}}>ridge pole</text>
        <text x="140" y="172" textAnchor="middle" style={{fontSize:8,fill:"#78350f",fontStyle:"italic"}}>Enter from one end · layer debris/leaves over frame</text>
      </svg>
    );
  }
  // Generic shelter
  return (
    <svg viewBox="0 0 280 160" className="diag-svg-large">
      <text x="140" y="18" textAnchor="middle" className="diag-step-label">{name}</text>
      <line x1="20" y1="140" x2="260" y2="140" stroke="#8B6914" strokeWidth="3"/>
      <polygon points="140,40 40,140 240,140" fill="none" stroke="#8B4513" strokeWidth="3"/>
      {[60,80,100,120,140,160,180,200,220].map(x=>(
        <line key={x} x1="140" y1="40" x2={x} y2="140" stroke="#A0522D" strokeWidth="2" opacity="0.6"/>
      ))}
      <text x="140" y="158" textAnchor="middle" style={{fontSize:9,fill:"#78350f"}}>Natural shelter frame</text>
    </svg>
  );
}

// ── Visual Guide Tab ──────────────────────────────────────────────────────────

function VisualGuide({ visuals, activityTitle }: { visuals: Visuals; activityTitle: string }) {
  const title = activityTitle.toLowerCase();

  // Auto-detect diagrams if AI didn't provide them
  const getAutoDiagrams = (): VisualDiagram[] => {
    const diagrams: VisualDiagram[] = [];
    if (title.includes("knot") || title.includes("lashing") || title.includes("rope")) {
      ["Reef Knot","Bowline","Clove Hitch"].forEach(name => diagrams.push({ type:"knot", name, steps:[] }));
    }
    if (title.includes("fire") || title.includes("camp fire") || title.includes("campfire")) {
      ["Teepee Fire Lay","Log Cabin Fire Lay"].forEach(name => diagrams.push({ type:"fire_lay", name, steps:[] }));
    }
    if (title.includes("first aid") || title.includes("cpr") || title.includes("recovery")) {
      ["Recovery Position","CPR Compressions","Arm Sling"].forEach(name => diagrams.push({ type:"first_aid", name, steps:[] }));
    }
    if (title.includes("compass") || title.includes("navigation") || title.includes("bearing") || title.includes("map")) {
      ["Compass & Bearing","Map Symbols"].forEach(name => diagrams.push({ type:"navigation", name, steps:[] }));
    }
    if (title.includes("shelter") || title.includes("bivouac") || title.includes("lean-to")) {
      ["Lean-To Shelter","A-Frame Shelter"].forEach(name => diagrams.push({ type:"shelter", name, steps:[] }));
    }
    return diagrams;
  };

  const diagrams = (visuals?.diagrams?.length > 0) ? visuals.diagrams : getAutoDiagrams();

  if (diagrams.length === 0) {
    return (
      <div className="no-printable">
        <div className="no-printable-icon">👁️</div>
        <h3>No visual guide needed</h3>
        <p>This activity doesn't require diagrams — all instructions are covered in the Instructions tab.</p>
      </div>
    );
  }

  return (
    <div className="visual-guide">
      {diagrams.map((diag, i) => (
        <div key={i} className="diag-section">
          <div className="diag-section-title">{diag.name}</div>
          {diag.type === "knot" && KNOT_STEPS[diag.name] ? (
            <div className="knot-steps">
              {KNOT_STEPS[diag.name].steps.map((step, si) => (
                <div key={si} className="knot-step-card">
                  <div className="knot-step-num">Step {si + 1}</div>
                  {step}
                </div>
              ))}
            </div>
          ) : diag.type === "fire_lay" ? (
            <FireLayDiagram name={diag.name}/>
          ) : diag.type === "first_aid" ? (
            <FirstAidDiagram name={diag.name}/>
          ) : diag.type === "navigation" || diag.type === "compass" ? (
            <NavigationDiagram name={diag.name}/>
          ) : diag.type === "shelter" ? (
            <ShelterDiagram name={diag.name}/>
          ) : (
            <div className="diag-generic">
              {diag.steps.map((step, si) => (
                <div key={si} className="diag-step-text">
                  <div className="diag-step-num">{si + 1}</div>
                  <div>
                    <div className="diag-step-label-text">{step.label}</div>
                    <div className="diag-step-desc">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Printable Renderers (same as before, abbreviated) ────────────────────────

function NaturePuzzle({ content, title }: { content: PrintableContent; title: string }) {
  const items = content.items ?? [];
  const cols = 4;
  const rows = Math.ceil(items.length / cols);
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <p className="print-sub">{content.instructions ?? "Cut along the dashed lines. Mix up the pieces and challenge Scouts to reassemble."}</p>
      </div>
      <div className="puzzle-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 120px)` }}>
        {items.map((item, i) => (
          <div key={i} className="puzzle-cell">
            <div className="puzzle-cell-inner">
              <svg viewBox="0 0 80 60" className="puzzle-svg">
                <rect width="80" height="60" fill="#e8f5e9" rx="2"/>
                <ellipse cx="40" cy="30" rx="20" ry="14" fill="#4caf50" opacity="0.6" transform={`rotate(${(i * 37) % 180} 40 30)`}/>
                <line x1="40" y1="44" x2="40" y2="16" stroke="#2e7d32" strokeWidth="1.5" opacity="0.7"/>
                <circle cx="68" cy="10" r="8" fill="#1c0f00" opacity="0.7"/>
                <text x="68" y="14" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{i + 1}</text>
              </svg>
              <span className="puzzle-label">{item}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="print-recording-table">
        <h3>Recording Sheet</h3>
        <div className="recording-grid">
          {items.map((_, i) => (
            <div key={i} className="recording-row">
              <span className="recording-num">{i + 1}</span>
              <span className="recording-line"/>
            </div>
          ))}
        </div>
      </div>
      <div className="print-footer">⚜ Scouts Australia · Cut along dashed lines</div>
    </div>
  );
}

function GenericPrintable({ content, title }: { content: PrintableContent; title: string }) {
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{content.title ?? title}</h1>
      </div>
      {(content.sections ?? []).map((s, i) => (
        <div key={i} className="ws-section">
          <h3 className="ws-heading">{s.heading}</h3>
          {Array.from({ length: s.lines ?? 3 }, (_, j) => <div key={j} className="ws-line"/>)}
        </div>
      ))}
      <div className="print-footer">⚜ Scouts Australia · Activity Worksheet</div>
    </div>
  );
}

function KimsGameSheet({ content, title }: { content: PrintableContent; title: string }) {
  const items = content.items ?? [];
  return (
    <div className="printable-sheet">
      <div className="print-header">
        <div className="print-logo">⚜ Scout Program Builder</div>
        <h1 className="print-title">{title}</h1>
        <p className="print-sub">Memorise the items, then write as many as you can remember.</p>
      </div>
      <div className="kims-two-col">
        <div className="kims-tray">
          <h3>Leader's Tray List (Leaders Only)</h3>
          <div className="kims-items-grid">
            {items.map((item, i) => <div key={i} className="kims-item"><span className="kims-num">{i+1}</span><span>{item}</span></div>)}
          </div>
        </div>
        <div className="kims-scout-sheet">
          <h3>Scout Recording Sheet</h3>
          <div className="kims-lines">
            {Array.from({ length: Math.max(items.length, 20) }, (_, i) => (
              <div key={i} className="kims-line"><span className="kims-line-num">{i+1}.</span><div className="kims-line-rule"/></div>
            ))}
          </div>
          <div className="kims-score">Score: _______ / {items.length}</div>
        </div>
      </div>
      <div className="print-footer">⚜ Scouts Australia · Kim's Game Sheet</div>
    </div>
  );
}

function PrintableRenderer({ printable }: { printable: Printable }) {
  if (!printable.needed || !printable.content || !printable.type) {
    return (
      <div className="no-printable">
        <div className="no-printable-icon">🎒</div>
        <h3>No printable needed</h3>
        <p>{printable.reason}</p>
      </div>
    );
  }
  const title = printable.title ?? "Activity Sheet";
  const content = printable.content;
  switch (printable.type) {
    case "nature_puzzle": return <NaturePuzzle content={content} title={title}/>;
    case "kims_game_sheet": return <KimsGameSheet content={content} title={title}/>;
    default: return <GenericPrintable content={content} title={title}/>;
  }
}

// ── Inline ────────────────────────────────────────────────────────────────────

function Inline({ t }: { t: string }) {
  const parts = t.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2,-2)}</strong>;
    if (p.startsWith("*")  && p.endsWith("*"))  return <em key={i}>{p.slice(1,-1)}</em>;
    if (p.startsWith("`")  && p.endsWith("`"))  return <code key={i} style={{fontFamily:"monospace",background:"rgba(101,62,11,0.1)",padding:"1px 4px",borderRadius:2,fontSize:"0.88em"}}>{p.slice(1,-1)}</code>;
    return p;
  })}</>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "instructions" | "visuals" | "printable" | "script";

export default function ActivityPage() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState<Tab>("instructions");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const activityName    = decodeURIComponent(params.get("name") ?? "");
    const activityContext = decodeURIComponent(params.get("context") ?? "");
    const section         = decodeURIComponent(params.get("section") ?? "Scouts");
    const oasContext      = decodeURIComponent(params.get("oas") ?? "");

    if (!activityName) { setError("No activity specified."); setLoading(false); return; }

    fetch("/api/generate-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityName, activityContext, section, oasContext }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.activity) setActivity(data.activity);
        else setError("Failed to generate activity.");
        setLoading(false);
      })
      .catch(() => { setError("Network error — please close this tab and try again."); setLoading(false); });
  }, []);

  // Detect if visual guide has content
  const hasVisuals = (act: Activity) => {
    if (act.visuals?.needed) return true;
    const t = act.title.toLowerCase();
    return t.includes("knot") || t.includes("lash") || t.includes("rope") ||
           t.includes("fire") || t.includes("first aid") || t.includes("cpr") ||
           t.includes("compass") || t.includes("navigation") || t.includes("bearing") ||
           t.includes("map") || t.includes("shelter") || t.includes("bivouac") ||
           t.includes("lean-to") || t.includes("recovery");
  };

  const diffColor: Record<string,string> = { Easy:"#15803d", Moderate:"#d97706", Challenging:"#dc2626" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Teko:wght@400;500;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1208; }

        .ap-root { min-height: 100vh; background: #1a1208;
          background-image: radial-gradient(ellipse 90% 40% at 50% -5%,rgba(101,62,11,0.45) 0%,transparent 60%);
          font-family: 'Source Serif 4', Georgia, serif; padding-bottom: 80px; }

        .ap-header { background: #fdf6e3; border-bottom: 1px solid rgba(101,62,11,0.15); position: relative; }
        .ap-header::before { content:''; position:absolute; top:0; bottom:0; left:44px; width:1px; background:rgba(220,38,38,0.15); pointer-events:none; }
        .ap-header-inner { max-width: 900px; margin: 0 auto; padding: 24px 40px 0 64px; }
        .ap-back { display:inline-flex; align-items:center; gap:6px; font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.15em; text-transform:uppercase; color:#a16207; text-decoration:none; margin-bottom:16px; cursor:pointer; background:none; border:none; transition:color 0.2s; }
        .ap-back:hover { color:#78350f; }
        .ap-eyebrow { font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; color:#a16207; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
        .ap-title { font-family:'Teko',sans-serif; font-size:clamp(28px,5vw,44px); font-weight:600; color:#1c0f00; line-height:1; margin-bottom:10px; }
        .ap-tagline { font-size:15px; color:#78350f; font-style:italic; margin-bottom:16px; }
        .ap-meta { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:0; }
        .ap-meta-pill { padding:4px 11px; border-radius:2px; border:1px solid rgba(101,62,11,0.2); background:rgba(255,255,255,0.6); font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.08em; color:#78350f; }
        .ap-meta-pill.diff { color:white; border-color:transparent; }

        .ap-tabs { display:flex; gap:0; margin-top:20px; border-top:1px solid rgba(101,62,11,0.12); }
        .ap-tab { padding:13px 20px; background:none; border:none; cursor:pointer; font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(120,53,15,0.5); border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 0.2s,border-color 0.2s; display:flex; align-items:center; gap:7px; }
        .ap-tab:hover { color:#78350f; }
        .ap-tab.active { color:#1c0f00; border-bottom-color:#92400e; }
        .ap-tab-badge { background:#15803d; color:white; border-radius:2px; font-size:9px; padding:1px 5px; letter-spacing:0.08em; }
        .ap-tab-badge.new { background:#d97706; }

        .ap-content { max-width:900px; margin:0 auto; padding:32px 40px 0 64px; }

        /* Instructions */
        .inst-section { margin-bottom:28px; }
        .inst-heading { font-family:'Teko',sans-serif; font-size:16px; letter-spacing:0.14em; text-transform:uppercase; color:#92400e; margin-bottom:10px; padding-bottom:5px; border-bottom:1px dashed rgba(101,62,11,0.2); }
        .inst-para { font-size:14.5px; line-height:1.72; color:#fdf6e3; margin-bottom:8px; }
        .inst-list { list-style:none; display:flex; flex-direction:column; gap:6px; }
        .inst-list li { display:flex; gap:10px; align-items:baseline; font-size:14px; line-height:1.65; color:#fdf6e3; }
        .inst-list li::before { content:''; width:5px; height:5px; border-radius:50%; background:#a16207; flex-shrink:0; margin-top:7px; }
        .equip-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .equip-col { background:rgba(253,246,227,0.06); border:1px solid rgba(161,98,7,0.15); border-radius:3px; padding:14px 16px; }
        .equip-col-title { font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:#a16207; margin-bottom:8px; }
        .equip-item { font-size:13px; color:rgba(253,246,227,0.8); padding:3px 0; display:flex; gap:6px; align-items:baseline; }
        .equip-item::before { content:'—'; color:rgba(161,98,7,0.4); flex-shrink:0; }
        .run-table { width:100%; border-collapse:collapse; font-size:13.5px; }
        .run-table thead tr { background:#1c0f00; }
        .run-table thead th { padding:8px 14px; text-align:left; font-family:'Teko',sans-serif; font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#fde68a; font-weight:500; }
        .run-table tbody tr { border-bottom:1px solid rgba(253,246,227,0.08); }
        .run-table tbody tr:nth-child(even) { background:rgba(253,246,227,0.03); }
        .run-table tbody td { padding:8px 14px; color:rgba(253,246,227,0.85); vertical-align:top; line-height:1.5; }
        .run-table tbody td:first-child { font-family:'Teko',sans-serif; font-size:14px; color:#fde68a; white-space:nowrap; }
        .safety-item { display:flex; gap:10px; align-items:baseline; font-size:14px; line-height:1.65; color:rgba(253,246,227,0.85); padding:5px 0; border-bottom:1px dotted rgba(253,246,227,0.08); }
        .safety-item::before { content:'⚠'; flex-shrink:0; font-size:13px; }
        .var-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .var-box { background:rgba(253,246,227,0.05); border:1px solid rgba(161,98,7,0.15); border-radius:3px; padding:14px 16px; }
        .var-box-title { font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:6px; }
        .var-box-title.easier { color:#15803d; } .var-box-title.harder { color:#dc2626; }
        .var-text { font-size:13.5px; line-height:1.65; color:rgba(253,246,227,0.75); }

        /* Visual Guide */
        .visual-guide { display:flex; flex-direction:column; gap:40px; padding-bottom:32px; }
        .diag-section { }
        .diag-section-title { font-family:'Teko',sans-serif; font-size:20px; letter-spacing:0.08em; color:#fde68a; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid rgba(253,230,138,0.15); display:flex; align-items:center; gap:10px; }
        .diag-section-title::before { content:'◆'; color:#92400e; font-size:12px; }
        .knot-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .knot-step-card { background:rgba(253,246,227,0.06); border:1px solid rgba(253,230,138,0.12); border-radius:3px; padding:12px; }
        .knot-step-num { font-family:'Teko',sans-serif; font-size:12px; letter-spacing:0.15em; text-transform:uppercase; color:#a16207; margin-bottom:8px; }
        .diag-svg { width:100%; height:auto; background:rgba(255,255,255,0.95); border-radius:3px; border:1px solid rgba(101,62,11,0.15); }
        .diag-svg-large { width:100%; max-width:360px; height:auto; background:rgba(255,255,255,0.95); border-radius:3px; border:1px solid rgba(101,62,11,0.15); display:block; margin:0 auto; }
        .diag-step-label { font-family:'Source Serif 4',serif; font-size:11px; fill:#44260a; font-style:italic; }
        .diag-tip { font-family:'Source Serif 4',serif; font-size:9.5px; fill:#78350f; font-style:italic; }
        .diag-generic { display:flex; flex-direction:column; gap:12px; }
        .diag-step-text { display:flex; gap:12px; align-items:flex-start; padding:10px; background:rgba(253,246,227,0.05); border-radius:3px; }
        .diag-step-num { flex-shrink:0; width:24px; height:24px; background:#92400e; color:white; border-radius:2px; font-family:'Teko',sans-serif; font-size:14px; display:flex; align-items:center; justify-content:center; }
        .diag-step-label-text { font-size:14px; font-weight:600; color:#fde68a; margin-bottom:4px; }
        .diag-step-desc { font-size:13px; line-height:1.6; color:rgba(253,246,227,0.7); }

        /* Script */
        .script-block { margin-bottom:28px; }
        .script-label { font-family:'Teko',sans-serif; font-size:13px; letter-spacing:0.16em; text-transform:uppercase; color:#a16207; margin-bottom:6px; }
        .script-text { background:rgba(253,246,227,0.07); border-left:3px solid rgba(161,98,7,0.4); border-radius:0 3px 3px 0; padding:14px 18px; font-size:15px; line-height:1.8; color:#fdf6e3; font-style:italic; }
        .script-qs { display:flex; flex-direction:column; gap:8px; }
        .script-q { display:flex; gap:12px; align-items:baseline; font-size:14.5px; line-height:1.65; color:rgba(253,246,227,0.85); }
        .script-q-num { flex-shrink:0; width:22px; height:22px; background:#92400e; color:white; border-radius:2px; font-family:'Teko',sans-serif; font-size:13px; display:flex; align-items:center; justify-content:center; }

        /* Printable */
        .print-actions { display:flex; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
        .print-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:2px; cursor:pointer; font-family:'Teko',sans-serif; font-size:15px; letter-spacing:0.12em; text-transform:uppercase; border:none; transition:all 0.2s; }
        .print-btn.primary { background:#1c0f00; color:#fde68a; }
        .print-btn.primary:hover { background:#92400e; }
        .print-btn.secondary { background:rgba(253,246,227,0.08); border:1px solid rgba(161,98,7,0.3); color:#d6b77a; }
        .print-btn.secondary:hover { background:rgba(253,246,227,0.15); }
        .printable-sheet { background:#fdf6e3; border-radius:3px; border:1px solid rgba(101,62,11,0.2); box-shadow:0 4px 20px rgba(0,0,0,0.4); padding:32px 36px 24px; font-family:'Source Serif 4',serif; position:relative; }
        .print-header { margin-bottom:24px; border-bottom:2px solid rgba(101,62,11,0.15); padding-bottom:16px; }
        .print-logo { font-family:'Teko',sans-serif; font-size:10px; letter-spacing:0.22em; text-transform:uppercase; color:#a16207; margin-bottom:6px; }
        .print-title { font-family:'Teko',sans-serif; font-size:28px; font-weight:600; color:#1c0f00; line-height:1; margin-bottom:6px; }
        .print-sub { font-size:12px; color:#78350f; font-style:italic; }
        .print-footer { margin-top:24px; padding-top:12px; border-top:1px dashed rgba(101,62,11,0.25); font-family:'Teko',sans-serif; font-size:10px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(101,62,11,0.45); text-align:center; }
        .puzzle-grid { display:grid; gap:0; border:2px dashed rgba(101,62,11,0.25); margin-bottom:20px; }
        .puzzle-cell { border:1.5px dashed rgba(101,62,11,0.3); position:relative; overflow:hidden; min-height:110px; }
        .puzzle-cell-inner { padding:6px; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; }
        .puzzle-svg { width:80px; height:60px; }
        .puzzle-label { font-size:11px; font-weight:600; color:#44260a; text-align:center; }
        .print-recording-table { margin-top:16px; }
        .print-recording-table h3 { font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.1em; color:#44260a; margin-bottom:10px; }
        .recording-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        .recording-row { display:flex; align-items:center; gap:6px; }
        .recording-num { font-family:'Teko',sans-serif; font-size:13px; font-weight:600; color:#78350f; width:20px; flex-shrink:0; }
        .recording-line { flex:1; height:1px; background:rgba(101,62,11,0.3); }
        .kims-two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .kims-two-col h3 { font-family:'Teko',sans-serif; font-size:14px; letter-spacing:0.1em; color:#44260a; margin-bottom:10px; }
        .kims-items-grid { display:flex; flex-direction:column; gap:4px; }
        .kims-item { display:flex; gap:8px; align-items:center; font-size:12.5px; color:#2d1a06; padding:3px 0; border-bottom:1px dotted rgba(101,62,11,0.12); }
        .kims-num { font-family:'Teko',sans-serif; font-size:13px; font-weight:600; color:#78350f; width:20px; flex-shrink:0; }
        .kims-lines { display:flex; flex-direction:column; gap:0; }
        .kims-line { display:flex; gap:8px; align-items:center; padding:6px 0; border-bottom:1px solid rgba(101,62,11,0.2); }
        .kims-line-num { font-family:'Teko',sans-serif; font-size:12px; color:#a16207; width:20px; flex-shrink:0; }
        .kims-line-rule { flex:1; }
        .kims-score { margin-top:14px; font-family:'Teko',sans-serif; font-size:16px; color:#44260a; }
        .ws-section { margin-bottom:20px; }
        .ws-heading { font-family:'Teko',sans-serif; font-size:15px; letter-spacing:0.1em; color:#44260a; margin-bottom:10px; }
        .ws-line { height:1px; background:rgba(101,62,11,0.25); margin:14px 0; }
        .no-printable { display:flex; flex-direction:column; align-items:center; gap:12px; padding:48px 0; text-align:center; }
        .no-printable-icon { font-size:40px; }
        .no-printable h3 { font-family:'Teko',sans-serif; font-size:22px; letter-spacing:0.06em; color:#fdf6e3; }
        .no-printable p { font-size:14px; color:rgba(253,246,227,0.55); font-style:italic; max-width:360px; line-height:1.65; }

        /* Loading */
        .ap-loading { display:flex; flex-direction:column; align-items:center; gap:16px; padding:80px 0; color:rgba(253,246,227,0.6); font-style:italic; }
        .ap-spinner { width:36px; height:36px; border:2px solid rgba(253,246,227,0.1); border-top-color:rgba(253,246,227,0.6); border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        @media print {
          .ap-root { background:white!important; }
          .ap-header,.ap-tabs,.print-actions { display:none!important; }
          .ap-content { padding:0!important; max-width:100%!important; }
          .printable-sheet,.diag-svg,.diag-svg-large { box-shadow:none!important; }
          body { background:white!important; }
        }

        @media (max-width:640px) {
          .ap-header-inner,.ap-content { padding-left:24px; padding-right:24px; }
          .ap-header::before { left:16px; }
          .equip-grid,.var-grid { grid-template-columns:1fr; }
          .knot-steps { grid-template-columns:1fr; }
          .kims-two-col { grid-template-columns:1fr; }
          .puzzle-grid { grid-template-columns:repeat(2,1fr)!important; }
        }
      `}</style>

      <div className="ap-root">
        <div className="ap-header">
          <div className="ap-header-inner">
            <button className="ap-back" onClick={() => window.close()}>← Close Tab</button>

            {loading ? (
              <div style={{paddingBottom:32}}>
                <div className="ap-loading">
                  <div className="ap-spinner"/>
                  <span>Generating activity resources…</span>
                </div>
              </div>
            ) : error ? (
              <div style={{paddingBottom:32,color:"#dc2626",fontFamily:"'Teko',sans-serif",fontSize:18}}>{error}</div>
            ) : activity ? (
              <>
                <div className="ap-eyebrow">⚜ Activity Resource</div>
                <h1 className="ap-title">{activity.title}</h1>
                {activity.tagline && <p className="ap-tagline">{activity.tagline}</p>}
                <div className="ap-meta">
                  {activity.duration   && <span className="ap-meta-pill">⏱ {activity.duration}</span>}
                  {activity.groupSize  && <span className="ap-meta-pill">👥 {activity.groupSize}</span>}
                  {activity.oasLink    && <span className="ap-meta-pill">⚜ {activity.oasLink}</span>}
                  {activity.difficulty && <span className="ap-meta-pill diff" style={{background:diffColor[activity.difficulty]??"#78350f"}}>{activity.difficulty}</span>}
                </div>
                <div className="ap-tabs">
                  <button className={`ap-tab ${tab==="instructions"?"active":""}`} onClick={()=>setTab("instructions")}>📋 Instructions</button>
                  {hasVisuals(activity) && (
                    <button className={`ap-tab ${tab==="visuals"?"active":""}`} onClick={()=>setTab("visuals")}>
                      🎨 Visual Guide <span className="ap-tab-badge new">NEW</span>
                    </button>
                  )}
                  <button className={`ap-tab ${tab==="printable"?"active":""}`} onClick={()=>setTab("printable")}>
                    🖨 Printable {activity.printable?.needed && <span className="ap-tab-badge">SHEET</span>}
                  </button>
                  <button className={`ap-tab ${tab==="script"?"active":""}`} onClick={()=>setTab("script")}>🎙 Leader Script</button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {!loading && !error && activity && (
          <div className="ap-content">

            {/* Instructions */}
            {tab === "instructions" && (
              <div>
                {activity.instructions.overview && <div className="inst-section"><div className="inst-heading">Overview</div><p className="inst-para"><Inline t={activity.instructions.overview}/></p></div>}
                {(activity.instructions.setup??[]).length>0 && <div className="inst-section"><div className="inst-heading">Setup</div><ul className="inst-list">{activity.instructions.setup.map((s,i)=><li key={i}><Inline t={s}/></li>)}</ul></div>}
                {(activity.instructions.runSheet??[]).length>0 && (
                  <div className="inst-section">
                    <div className="inst-heading">Timed Run Sheet</div>
                    <div style={{overflowX:"auto",borderRadius:3,border:"1px solid rgba(253,246,227,0.1)"}}>
                      <table className="run-table">
                        <thead><tr><th>Time</th><th>Action</th><th>Leader Notes</th></tr></thead>
                        <tbody>{activity.instructions.runSheet.map((r,i)=><tr key={i}><td>{r.time}</td><td><Inline t={r.action}/></td><td><Inline t={r.leaderNotes}/></td></tr>)}</tbody>
                      </table>
                    </div>
                  </div>
                )}
                {activity.instructions.equipment && (
                  <div className="inst-section">
                    <div className="inst-heading">Equipment</div>
                    <div className="equip-grid">
                      {[{label:"From the Shed",items:activity.instructions.equipment.fromShed},{label:"Leaders to Bring",items:activity.instructions.equipment.toBring},{label:"Consumables",items:activity.instructions.equipment.consumables}].map(col=>(
                        <div key={col.label} className="equip-col">
                          <div className="equip-col-title">{col.label}</div>
                          {(col.items??[]).length===0?<div className="equip-item" style={{opacity:0.4}}>None</div>:(col.items??[]).map((item,i)=><div key={i} className="equip-item">{item}</div>)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(activity.instructions.safety??[]).length>0 && <div className="inst-section"><div className="inst-heading">Safety</div>{activity.instructions.safety.map((s,i)=><div key={i} className="safety-item"><Inline t={s}/></div>)}</div>}
                {activity.instructions.variations && (
                  <div className="inst-section">
                    <div className="inst-heading">Variations</div>
                    <div className="var-grid">
                      <div className="var-box"><div className="var-box-title easier">↓ Easier</div><p className="var-text"><Inline t={activity.instructions.variations.easier}/></p></div>
                      <div className="var-box"><div className="var-box-title harder">↑ Harder</div><p className="var-text"><Inline t={activity.instructions.variations.harder}/></p></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visual Guide */}
            {tab === "visuals" && <VisualGuide visuals={activity.visuals} activityTitle={activity.title}/>}

            {/* Printable */}
            {tab === "printable" && (
              <div>
                {activity.printable?.needed && (
                  <div className="print-actions">
                    <button className="print-btn primary" onClick={()=>window.print()}>🖨 Print Sheet</button>
                  </div>
                )}
                <PrintableRenderer printable={activity.printable}/>
              </div>
            )}

            {/* Script */}
            {tab === "script" && activity.leaderScript && (
              <div>
                {[{label:"Introduction — say this to open the activity",text:activity.leaderScript.intro},{label:"Instructions — explain the activity",text:activity.leaderScript.instructions},{label:"Debrief — closing the activity",text:activity.leaderScript.debrief}].map(block=>block.text&&(
                  <div key={block.label} className="script-block">
                    <div className="script-label">{block.label}</div>
                    <div className="script-text"><Inline t={block.text}/></div>
                  </div>
                ))}
                {(activity.leaderScript.reflectionQuestions??[]).length>0 && (
                  <div className="script-block">
                    <div className="script-label">Reflection Questions</div>
                    <div className="script-qs">{activity.leaderScript.reflectionQuestions.map((q,i)=><div key={i} className="script-q"><div className="script-q-num">{i+1}</div><span><Inline t={q}/></span></div>)}</div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </>
  );
}
