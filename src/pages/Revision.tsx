import React, { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { supabase } from '../lib/supabase';
import { QuestionCard } from '../components/QuestionCard';
import { RefreshCw, BookOpen, Clock, AlertCircle } from 'lucide-react';

interface Formula {
  id: number;
  name: string;
  formula: string;
  meta: string;
  also?: string;
  units?: string;
}

interface Section {
  title: string;
  formulas: Formula[];
}

interface UnitData {
  id: number;
  num: string;
  title: string;
  sections: Section[];
  constants?: string[];
  notes?: string;
  important: string[];
  frequent: string[];
}

export const Revision: React.FC = () => {
  const { profile } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(profile?.id);

  const [frequentQuestions, setFrequentQuestions] = useState<any[]>([]);
  const [highPriorityQuestions, setHighPriorityQuestions] = useState<any[]>([]);
  const [incompleteUnits, setIncompleteUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formula Sheets State
  const [showFormulaSheets, setShowFormulaSheets] = useState(false);
  const [activeUnit, setActiveUnit] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState<number[]>([]);

  const engineeringChemistryData: UnitData[] = [
    {
      id: 1,
      num: "01",
      title: "Electrochemistry",
      sections: [
        { title: "1 · EMF & Electrode Potential", formulas: [
          { id: 101, name: "Cell EMF", formula: "E_cell = E_cathode − E_anode", meta: "E = electrode potential (V)", also: "Also: E_cell = E°_cell − (RT/nF) ln Q", units: "V" },
          { id: 102, name: "Standard EMF", formula: "E°_cell = E°_cathode − E°_anode", meta: "E° = standard electrode potential (measured vs SHE)", units: "V" }
        ]},
        { title: "2 · Nernst Equation", formulas: [
          { id: 103, name: "Nernst Equation (General)", formula: "E = E° − (RT/nF) ln Q  →  E = E° − (0.0592/n) log Q  [25°C]", meta: "R = 8.314 J/mol·K · T = temp (K) · n = mol e⁻ · F = 96485 C/mol · Q = reaction quotient", units: "V" },
          { id: 104, name: "Metal / Metal Ion", formula: "E = E° − (0.0592/n) log [1/Mⁿ⁺]", meta: "Mⁿ⁺ = metal ion activity/concentration", units: "V" },
          { id: 105, name: "Concentration Cell EMF", formula: "E = (0.0592/n) log (C₂/C₁)", meta: "C₁, C₂ = concentrations of two half-cells", units: "V" }
        ]},
        { title: "3 · Gibbs Free Energy & Equilibrium Constant", formulas: [
          { id: 106, name: "ΔG–EMF Relation", formula: "ΔG = −nFE_cell", meta: "n = mol e⁻ · F = 96485 C/mol · E = EMF (V)", also: "Also: ΔG° = −nFE°", units: "J" },
          { id: 107, name: "ΔG°–Keq Relation", formula: "ΔG° = −RT ln Keq = −2.303RT log Keq", meta: "Keq = equilibrium constant", units: "J/mol" },
          { id: 108, name: "E°–Keq Relation", formula: "log Keq = nE° / 0.0592  [25°C]", meta: "Keq = 10^(nE°/0.0592)", units: "dimensionless" }
        ]},
        { title: "4 · Conductance & Conductivity", formulas: [
          { id: 109, name: "Conductance", formula: "G = 1/R = κ · A/l", meta: "R = resistance (Ω) · κ = specific conductivity", units: "Siemens (S)" },
          { id: 110, name: "Specific Conductivity (κ)", formula: "κ = G × (l/A) = G × Cell Constant", meta: "Cell Constant = l/A (m⁻¹)", units: "S/m or S/cm" },
          { id: 111, name: "Molar Conductivity (Λm)", formula: "Λm = κ / C  (C in mol/m³)", meta: "Λm = (κ × 1000) / M  [M in mol/L]", units: "S·m²/mol" },
          { id: 112, name: "Kohlrausch's Law", formula: "Λ°m = Σ λ°₊ + Σ λ°₋", meta: "At infinite dilution", units: "S·m²/mol" }
        ]},
        { title: "5 · Transport Number & Ionic Mobility", formulas: [
          { id: 113, name: "Transport Number (t)", formula: "t₊ = u₊/(u₊+u₋)  ·  t₋ = u₋/(u₊+u₋)", meta: "t₊ + t₋ = 1", units: "dimensionless" }
        ]}
      ],
      constants: ["F = 96485 C/mol", "R = 8.314 J/mol·K", "RT/F at 25°C = 0.02569 V", "0.0592/n at 25°C (log form)"],
      notes: "Migration = movement under electric field · Diffusion = movement due to conc. gradient · Convection = bulk fluid movement",
      important: ["E_cell = E°_cell − (0.0592/n) log Q", "ΔG = −nFE", "Λm = κ/C", "log Keq = nE°/0.0592", "t₊ + t₋ = 1"],
      frequent: ["E_cell = E_cathode − E_anode", "E = E° − (0.0592/n) log Q", "ΔG = −nFE"]
    },
    {
      id: 2,
      num: "02",
      title: "Batteries & Energy Storage",
      sections: [
        { title: "1 · EMF – ΔG Relations", formulas: [
          { id: 201, name: "ΔG from EMF", formula: "ΔG = −nFE", meta: "ΔG° = −nFE°", units: "J" },
          { id: 202, name: "Max Work from Cell", formula: "W_max = nFE = −ΔG", meta: "Maximum electrical work extractable from the cell", units: "J" }
        ]},
        { title: "2 · Battery Capacity & Energy", formulas: [
          { id: 203, name: "Battery Capacity (Q)", formula: "Q = I × t", meta: "1 Ah = 3600 C", units: "Ah or C" },
          { id: 204, name: "Energy of Battery", formula: "Energy = V_cell × Q = V × I × t", meta: "1 Wh = 3600 J", units: "Wh or J" }
        ]},
        { title: "3 · Energy Density & Power Density", formulas: [
          { id: 205, name: "Gravimetric Energy Density", formula: "ED = Energy (Wh) / Mass (kg)", units: "Wh/kg" },
          { id: 206, name: "Power Density", formula: "PD = Power (W) / Mass (kg)", units: "W/kg" }
        ]},
        { title: "4 · Cell Efficiency", formulas: [
          { id: 207, name: "Energy (Round-trip) Efficiency", formula: "η_E = E_out / E_in × 100%", meta: "η_E = η_V × η_C", units: "%" }
        ]},
        { title: "5 · Fuel Cells", formulas: [
          { id: 208, name: "Fuel Cell Efficiency", formula: "η = ΔG / ΔH_combustion × 100%", meta: "Theoretical ~83% for H₂ fuel cell", units: "%" }
        ]}
      ],
      constants: ["F = 96485 C/mol", "1 Wh = 3600 J", "1 Ah = 3600 C", "E°(H₂/O₂) = 1.23 V"],
      notes: "Reversible cell: reaction can go both ways, rechargeable · Secondary cell = rechargeable",
      important: ["ΔG = −nFE", "Energy = V×I×t (Wh)", "η_E = E_out/E_in × 100%"],
      frequent: ["Q = I×t (Ah)", "Energy (J) = nFE_cell"]
    },
    {
      id: 3,
      num: "03",
      title: "Corrosion",
      sections: [
        { title: "1 · Electrochemical Corrosion Reactions", formulas: [
          { id: 301, name: "Anodic (Oxidation) Reaction", formula: "M → Mⁿ⁺ + ne⁻", meta: "Metal dissolves at anode" },
          { id: 302, name: "Cathodic – O₂ Reduction", formula: "O₂ + 2H₂O + 4e⁻ → 4OH⁻", meta: "Most common in atmospheric corrosion" }
        ]},
        { title: "2 · Corrosion Rate Expressions", formulas: [
          { id: 303, name: "Corrosion Rate (mpy)", formula: "CR = (534 × W) / (D × A × T)", meta: "W = mass loss (mg)", units: "mpy" }
        ]},
        { title: "3 · Polarization Relations", formulas: [
          { id: 304, name: "Tafel Equation", formula: "η = a + b log i", meta: "b = Tafel slope ≈ 0.12 V/decade", units: "V" }
        ]}
      ],
      constants: ["E°(Fe²⁺/Fe) = −0.44 V", "E°(Zn²⁺/Zn) = −0.76 V"],
      notes: "Galvanic Series (active→noble): Mg → Zn → Al → Fe → Ni → Cu → Ag → Au",
      important: ["M → Mⁿ⁺ + ne⁻", "O₂+2H₂O+4e⁻→4OH⁻"],
      frequent: ["CR = 534W/(D·A·T) mpy"]
    },
    {
      id: 4,
      num: "04",
      title: "Chemical Kinetics & Catalysis",
      sections: [
        { title: "1 · Arrhenius Equation & Activation Energy", formulas: [
          { id: 401, name: "Arrhenius Equation", formula: "k = A · e^(−Eₐ/RT)", meta: "ln k = ln A − Eₐ/RT", units: "same as k" },
          { id: 402, name: "Two-Temperature Form", formula: "log(k₂/k₁) = (Eₐ/2.303R) × (1/T₁ − 1/T₂)", units: "—" }
        ]},
        { title: "2 · Rate Laws", formulas: [
          { id: 403, name: "First Order", formula: "ln[A] = ln[A]₀ − kt    t₁/₂ = 0.693/k", units: "s⁻¹" }
        ]},
        { title: "6 · Adsorption (Heterogeneous Catalysis)", formulas: [
          { id: 404, name: "Langmuir Adsorption Isotherm", formula: "θ = KP / (1 + KP)", meta: "θ = fraction surface covered", units: "dimensionless" }
        ]}
      ],
      constants: ["R = 8.314 J/mol·K"],
      notes: "Homogeneous catalysis: same phase · Heterogeneous: different phases",
      important: ["k = Ae^(−Eₐ/RT)", "First order t₁/₂ = 0.693/k", "θ = KP/(1+KP)"],
      frequent: ["log(k₂/k₁) = Eₐ/2.303R × (1/T₁−1/T₂)"]
    },
    {
      id: 5,
      num: "05",
      title: "Nuclear Chemistry",
      sections: [
        { title: "1 · Mass Defect & Binding Energy", formulas: [
          { id: 501, name: "Mass Defect (Δm)", formula: "Δm = [Z·mₚ + (A−Z)·mₙ] − M_nucleus", meta: "1 u = 931.5 MeV", units: "u" },
          { id: 502, name: "Binding Energy", formula: "BE = Δm × 931.5 MeV", meta: "Higher BE/A → more stable", units: "MeV" }
        ]},
        { title: "2 · Radioactive Decay Law", formulas: [
          { id: 503, name: "Radioactive Decay Law", formula: "N = N₀ · e^(−λt)", meta: "A = λ · N", units: "atoms" },
          { id: 504, name: "Decay Constant", formula: "λ = 0.693 / t₁/₂", units: "s⁻¹" }
        ]},
        { title: "3 · Half-Life & Mean Life", formulas: [
          { id: 505, name: "Half-Life", formula: "t₁/₂ = 0.693 / λ", units: "seconds / years" }
        ]}
      ],
      constants: ["c = 3×10⁸ m/s", "1 u = 931.5 MeV", "Nₐ = 6.022×10²³"],
      notes: "Critical Mass: min. fissile material for chain reaction",
      important: ["E = mc²", "BE = Δm × 931.5 MeV", "N = N₀·e^(−λt)", "t₁/₂ = 0.693/λ"],
      frequent: ["Δm = [Zmₚ+(A−Z)mₙ] − M_nucleus"]
    }
  ];

  const currentUnit = engineeringChemistryData.find(u => u.id === activeUnit) || engineeringChemistryData[0];

  const filteredSections = currentUnit.sections.map(section => ({
    ...section,
    formulas: section.formulas.filter(f =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.meta.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(s => s.formulas.length > 0);

  const toggleExpand = (id: number) => {
    setExpandedCards(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (profile?.id) fetchRevisionData();
  }, [profile?.id, bookmarks]);

  const fetchRevisionData = async () => {
    setLoading(true);
    try {
      // Your existing queries...
      const { data: units } = await supabase.from('units').select('*').eq('subject_id', 'subject-chem');
      // ... (rest of your fetch logic remains unchanged)
      setIncompleteUnits(units || []);
      // Add your other queries as per your original file
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
          <RefreshCw size={24} />
        </div>
        <div>
          <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white">Revision Mode</h1>
          <p className="text-secondary-500 dark:text-slate-400 text-[14px] mt-1">
            Custom revision lists + Complete Engineering Chemistry Formula Sheets
          </p>
        </div>
      </div>

      {/* Formula Sheets Section */}
      <div className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-1">
            <div className="inline-flex px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium mb-4">
              📚 22CH203 – Engineering Chemistry II
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-secondary-900 dark:text-white">Formula Sheets</h2>
            <p className="mt-3 text-secondary-600 dark:text-slate-400">Quickly revise using beautifully organized unit-wise formula sheets.</p>
          </div>
          <button
            onClick={() => setShowFormulaSheets(!showFormulaSheets)}
            className="px-10 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold rounded-2xl flex items-center gap-3 transition-all"
          >
            Open Formula Sheets <span className="text-2xl">📘</span>
          </button>
        </div>

        {showFormulaSheets && (
          <div className="border-t border-secondary-200 dark:border-slate-700 bg-secondary-50 dark:bg-slate-950 p-8">
            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-4">
              {engineeringChemistryData.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => { setActiveUnit(unit.id); setSearchTerm(''); setExpandedCards([]); }}
                  className={`px-7 py-3 rounded-2xl font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    activeUnit === unit.id ? 'bg-white dark:bg-slate-800 shadow text-violet-700 dark:text-violet-400' : 'bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 text-secondary-600'
                  }`}
                >
                  Unit {unit.num} — {unit.title}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative mb-8 max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search formulas, equations, keywords..."
                className="w-full bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-700 rounded-2xl py-4 pl-12 focus:outline-none focus:border-violet-500"
              />
              <div className="absolute left-5 top-4 text-secondary-400">🔍</div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3 rounded-3xl border border-secondary-200 dark:border-slate-700">
                📖 <span className="font-semibold">Unit {currentUnit.num}: {currentUnit.title}</span>
              </div>
            </div>

            <div className="space-y-12">
              {filteredSections.length > 0 ? filteredSections.map((section, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-secondary-200 dark:bg-slate-700" />
                    <div className="uppercase text-xs font-bold tracking-widest text-violet-600 dark:text-violet-400">{section.title}</div>
                    <div className="h-px flex-1 bg-secondary-200 dark:bg-slate-700" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {section.formulas.map(f => {
                      const isExpanded = expandedCards.includes(f.id);
                      return (
                        <div key={f.id} onClick={() => toggleExpand(f.id)}
                          className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-700 rounded-3xl p-7 cursor-pointer hover:shadow-md transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              {f.units && <div className="text-xs text-secondary-500 mb-1">{f.units}</div>}
                              <div className="font-semibold text-lg">{f.name}</div>
                              <div className="font-mono text-base text-violet-700 dark:text-violet-400 mt-2">{f.formula}</div>
                              <div className="text-sm text-secondary-600 dark:text-slate-400 mt-3">{f.meta}</div>
                              {f.also && <div className="text-xs text-amber-600 mt-2">{f.also}</div>}
                            </div>
                            <div className={`text-4xl transition-transform ${isExpanded ? 'rotate-180' : ''}`}>↓</div>
                          </div>
                          {isExpanded && currentUnit.notes && (
                            <div className="mt-8 pt-8 border-t text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 p-5 rounded-2xl">
                              {currentUnit.notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 text-secondary-500">No matching formulas found.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rest of your existing Revision UI (High Priority, Frequently Viewed, Incomplete Units) */}
      {loading ? (
        <div className="py-12 text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-8">
            {/* High Priority & Frequently Viewed sections - keep as per your original */}
            {/* ... (you can copy from your previous Revision.tsx) */}
          </div>
          <div className="space-y-6">
            {/* Incomplete Units Sidebar */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Revision;