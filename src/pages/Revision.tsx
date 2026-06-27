import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { supabase } from '../lib/supabase';
import { QuestionCard } from '../components/QuestionCard';
import { RefreshCw, BookOpen, Clock, AlertCircle, Book, Search } from 'lucide-react';

export const Revision: React.FC = () => {
  const { profile } = useAuth();
  const { bookmarks, toggleBookmark } = useBookmarks(profile?.id);
  const [frequentQuestions, setFrequentQuestions] = useState<any[]>([]);
  const [highPriorityQuestions, setHighPriorityQuestions] = useState<any[]>([]);
  const [incompleteUnits, setIncompleteUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Formula Sheet State
  const [showFormulas, setShowFormulas] = useState(false);
  const [activeUnit, setActiveUnit] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchRevisionData();
    }
  }, [profile, bookmarks]);

  const fetchRevisionData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Incomplete Units
      const { data: units } = await supabase.from('units').select('*').eq('subject_id', 'subject-chem');
      const { data: qlist } = await supabase.from('questions').select('id, unit_id');
      const { data: progress } = await supabase.from('question_progress').select('question_id, completed').eq('user_id', profile?.id);
      
      const incomplete = (units || []).filter((u: any) => {
        const qInUnit = (qlist || []).filter((q: any) => q.unit_id === u.id);
        const compInUnit = qInUnit.filter((q: any) => (progress || []).some((p: any) => p.question_id === q.id && p.completed));
        return qInUnit.length === 0 || (compInUnit.length / qInUnit.length) < 0.7;
      });
      setIncompleteUnits(incomplete);

      // 2. Fetch Frequently Viewed Questions
      const { data: viewedProgress } = await supabase
        .from('question_progress')
        .select('question_id')
        .eq('user_id', profile?.id)
        .eq('viewed', true)
        .order('last_viewed', { ascending: false });

      const viewedIds = (viewedProgress || []).map((p: any) => p.question_id).slice(0, 5);
      if (viewedIds.length > 0) {
        const { data: viewedQs } = await supabase.from('questions').select('*').in('id', viewedIds);
        setFrequentQuestions(viewedQs || []);
      }

      // 3. High Priority Questions
      const unitIds = incomplete.map((u: any) => u.id);
      if (unitIds.length > 0) {
        const { data: prioQs } = await supabase
          .from('questions')
          .select('*')
          .in('unit_id', unitIds)
          .order('question_number', { ascending: true });
        
        setHighPriorityQuestions((prioQs || []).slice(0, 8));
      } else {
        if (bookmarks.length > 0) {
          const { data: bookQs } = await supabase.from('questions').select('*').in('id', bookmarks);
          setHighPriorityQuestions(bookQs || []);
        }
      }
    } catch (e) {
      console.error('Error fetching revision data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Static Formula Sheet Data structures directly matching the document architecture
  const formulaUnits = [
    {
      id: 1,
      num: "Unit 01",
      title: "Electrochemistry",
      sections: [
        {
          title: "1 · EMF & Electrode Potential",
          single: false,
          cards: [
            { name: "Cell EMF", formula: "E_cell = E_cathode − E_anode", meta: "E = electrode potential (V)", also: "Also: E_cell = E°_cell − (RT/nF) ln Q", unit: "V" },
            { name: "Standard EMF", formula: "E°_cell = E°_cathode − E°_anode", meta: "E° = standard electrode potential (measured vs SHE)", unit: "V" }
          ]
        },
        {
          title: "2 · Nernst Equation",
          single: true,
          cards: [
            { name: "Nernst Equation (General)", formula: "E = E° − (RT/nF) ln Q  →  E = E° − (0.0592/n) log Q  [25°C]", meta: "R = 8.314 J/mol·K · T = temp (K) · n = mol e⁻ · F = 96485 C/mol · Q = reaction quotient", also: "Also: E = E° − (0.0257/n) ln Q  [298 K]", unit: "V" },
            { name: "Metal / Metal Ion", formula: "E = E° − (0.0592/n) log [1/Mⁿ⁺]", meta: "Mⁿ⁺ = metal ion activity/concentration", unit: "V" },
            { name: "Concentration Cell EMF", formula: "E = (0.0592/n) log (C₂/C₁)", meta: "C₁, C₂ = concentrations of two half-cells", also: "Higher conc. → cathode", unit: "V" }
          ]
        },
        {
          title: "3 · Gibbs Free Energy & Equilibrium Constant",
          single: false,
          cards: [
            { name: "ΔG–EMF Relation", formula: "ΔG = −nFE_cell", meta: "n = mol e⁻ · F = 96485 C/mol · E = EMF (V)", also: "Also: ΔG° = −nFE°", unit: "J (÷1000→kJ)" },
            { name: "ΔG°–Keq Relation", formula: "ΔG° = −RT ln Keq = −2.303RT log Keq", meta: "Keq = equilibrium constant", unit: "J/mol" },
            { name: "E°–Keq Relation", formula: "log Keq = nE° / 0.0592  [25°C]", meta: "n = mol e⁻ · E° = standard EMF", also: "Keq = 10^(nE°/0.0592)", unit: "dimensionless" },
            { name: "ΔG°–Keq via E°", formula: "ΔG° = −nFE° = −RT ln Keq", meta: "Combined relation", also: "nFE° = 2.303RT log Keq", unit: "J/mol" }
          ]
        },
        {
          title: "4 · Conductance & Conductivity",
          single: false,
          cards: [
            { name: "Conductance", formula: "G = 1/R = κ · A/l", meta: "R = resistance (Ω) · κ = specific conductivity · A = area (m²) · l = length (m)", unit: "Siemens (S)" },
            { name: "Specific Conductivity (κ)", formula: "κ = G × (l/A) = G × Cell Constant", meta: "Cell Constant = l/A (m⁻¹)", unit: "S/m or S/cm" },
            { name: "Molar Conductivity (Λm)", formula: "Λm = κ / C  (C in mol/m³)", meta: "C = molar concentration", also: "Λm = (κ × 1000) / M  [M in mol/L]", unit: "S·m²/mol" },
            { name: "Kohlrausch's Law", formula: "Λ°m = Σ λ°₊ + Σ λ°₋", meta: "λ° = limiting molar ionic conductance · At infinite dilution", unit: "S·m²/mol" }
          ]
        },
        {
          title: "5 · Transport Number & Ionic Mobility",
          single: false,
          cards: [
            { name: "Transport Number (t)", formula: "t₊ = u₊/(u₊+u₋)  ·  t₋ = u₋/(u₊+u₋)", meta: "u = ionic mobility (m²/V·s)", also: "t₊ + t₋ = 1", unit: "dimensionless" },
            { name: "Ionic Mobility → Conductance", formula: "λ = u × F", meta: "u = ionic mobility · F = Faraday constant", unit: "S·m²/mol" }
          ]
        },
        {
          title: "6 · SHE & Electrical Double Layer",
          single: false,
          cards: [
            { name: "SHE Half-Reaction", formula: "2H⁺ + 2e⁻  ⇌  H₂   E° = 0.000 V", meta: "Reference electrode; all potentials measured vs SHE", unit: "V" },
            { name: "Helmholtz Double Layer", formula: "C = ε·A/d", meta: "ε = permittivity · A = electrode area · d = layer thickness", also: "Acts like a parallel-plate capacitor", unit: "Farads (F)" }
          ]
        },
        {
          title: "7 · Galvanic Cell Notation",
          single: true,
          cards: [
            { name: "Cell Notation", formula: "Anode | Anode soln. || Cathode soln. | Cathode", meta: "|| = salt bridge · Oxidation at anode · Reduction at cathode", also: "E_cell > 0 → spontaneous reaction", unit: "—" }
          ]
        }
      ],
      constants: ["F = 96485 C/mol", "R = 8.314 J/mol·K", "T(K) = T(°C) + 273", "RT/F at 25°C = 0.02569 V", "0.0592/n at 25°C (log form)"],
      note: "Migration = movement under electric field · Diffusion = movement due to conc. gradient · Convection = bulk fluid movement",
      important: ["E_cell = E°_cell − (0.0592/n) log Q", "ΔG = −nFE", "Λm = κ/C", "log Keq = nE°/0.0592", "t₊ + t₋ = 1"],
      frequent: ["E_cell = E_cathode − E_anode", "E = E° − (0.0592/n) log Q", "ΔG = −nFE  [kJ = ΔG/1000]", "Λm = (κ × 1000)/M", "Conc. Cell: E = (0.0592/n) log(C₂/C₁)"]
    },
    {
      id: 2,
      num: "Unit 02",
      title: "Batteries & Energy Storage",
      sections: [
        {
          title: "1 · EMF – ΔG Relations",
          single: false,
          cards: [
            { name: "ΔG from EMF", formula: "ΔG = −nFE", meta: "n = mol e⁻ · F = 96485 C/mol · E = cell EMF (V)", also: "ΔG° = −nFE°", unit: "J" },
            { name: "Max Work from Cell", formula: "W_max = nFE = −ΔG", meta: "Maximum electrical work extractable from the cell", unit: "J" }
          ]
        },
        {
          title: "2 · Battery Capacity & Energy",
          single: false,
          cards: [
            { name: "Battery Capacity (Q)", formula: "Q = I × t", meta: "I = current (A) · t = time (h or s)", also: "1 Ah = 3600 C", unit: "Ah or C" },
            { name: "Theoretical Capacity", formula: "C_th = nF / M", meta: "n = electrons · F = 96485 · M = molar mass (g/mol)", also: "Specific capacity (per gram)", unit: "mAh/g" },
            { name: "Energy of Battery", formula: "Energy = V_cell × Q = V × I × t", meta: "V = voltage (V) · Q = capacity (Ah)", also: "1 Wh = 3600 J", unit: "Wh or J" },
            { name: "Energy in Joules", formula: "E = nFE_cell   or   E = P × t", meta: "P = power (W) · t = time (s)", unit: "J" }
          ]
        },
        {
          title: "3 · Energy Density & Power Density",
          single: false,
          cards: [
            { name: "Gravimetric Energy Density", formula: "ED = Energy (Wh) / Mass (kg)", meta: "Higher → lighter battery for same energy", unit: "Wh/kg" },
            { name: "Volumetric Energy Density", formula: "ED_vol = Energy (Wh) / Volume (L)", meta: "Volume = total battery volume", unit: "Wh/L" },
            { name: "Power Density", formula: "PD = Power (W) / Mass (kg)", meta: "P = V × I · Relates to discharge rate", unit: "W/kg" },
            { name: "Power Output", formula: "P = V × I = I²R = V²/R", meta: "V = voltage (V) · I = current (A) · R = resistance (Ω)", unit: "W" }
          ]
        },
        {
          title: "4 · Cell Efficiency",
          single: false,
          cards: [
            { name: "Voltage Efficiency", formula: "η_V = V_actual / V_theoretical × 100%", meta: "V_actual = measured discharge voltage", unit: "%" },
            { name: "Coulombic (Charge) Efficiency", formula: "η_C = Q_discharge / Q_charge × 100%", meta: "Q = capacity in Ah · Ideal = 100%", unit: "%" },
            { name: "Energy (Round-trip) Efficiency", formula: "η_E = E_out / E_in × 100%", meta: "E_out = energy discharged · E_in = energy charged", also: "η_E = η_V × η_C", unit: "%" },
            { name: "Thermodynamic Efficiency", formula: "η_th = ΔG / ΔH × 100%", meta: "ΔG = Gibbs energy · ΔH = enthalpy change", also: "ΔG = ΔH − TΔS", unit: "%" }
          ]
        },
        {
          title: "5 · Fuel Cells",
          single: false,
          cards: [
            { name: "H₂–O₂ Fuel Cell Reactions", formula: "Anode: H₂ → 2H⁺+2e⁻ | Cathode: ½O₂+2H⁺+2e⁻→H₂O", meta: "Overall: H₂ + ½O₂ → H₂O", also: "E° = 1.23 V at 25°C", unit: "V" },
            { name: "Fuel Cell Efficiency", formula: "η = ΔG / ΔH_combustion × 100%", meta: "ΔG = −nFE · ΔH = enthalpy of combustion", also: "Theoretical ~83% for H₂ fuel cell", unit: "%" }
          ]
        },
        {
          title: "6 · Lithium-Ion Battery",
          single: false,
          cards: [
            { name: "Li-ion Anode Reaction", formula: "LiC₆ → Li⁺ + e⁻ + C₆ (discharge)", meta: "Graphite anode, Li intercalation · Reverse on charging", unit: "—" },
            { name: "Li-ion Cathode Reaction", formula: "Li₁₋ₓCoO₂ + xLi⁺ + xe⁻ → LiCoO₂", meta: "LiCoO₂ = lithium cobalt oxide cathode", also: "E° ≈ 3.7 V (nominal)", unit: "—" },
            { name: "State of Charge (SOC)", formula: "SOC = (Q_remaining / Q_total) × 100%", meta: "Q = capacity in Ah · SOC = 100% → fully charged", unit: "%" },
            { name: "Depth of Discharge (DOD)", formula: "DOD = 100% − SOC", meta: "Inverse of SOC", also: "DOD = 80% means 20% charge left", unit: "%" }
          ]
        }
      ],
      constants: ["F = 96485 C/mol", "1 Wh = 3600 J", "1 Ah = 3600 C", "E°(H₂/O₂) = 1.23 V", "Li-ion nominal ≈ 3.6–3.7 V"],
      note: "Reversible cell: reaction can go both ways, rechargeable · Irreversible cell: single-use (primary) · Secondary cell = rechargeable",
      important: ["Q = I × t", "Energy = V_cell × Q", "η_E = η_V × η_C", "η_th = ΔG / ΔH"],
      frequent: ["Q = I × t", "W_max = nFE", "ED = Energy / Mass", "Theoretical Capacity = nF / M"]
    },
    {
      id: 3,
      num: "Unit 03",
      title: "Corrosion & Protective Coatings",
      sections: [
        {
          title: "1 · Rates of Corrosion & Pilling-Bedworth Rule",
          single: false,
          cards: [
            { name: "Corrosion Rate (mpy)", formula: "Rate = (534 × W) / (D × A × t)", meta: "W = weight loss (mg) · D = density (g/cm³) · A = area (in²) · t = time (h)", also: "mpy = mils per year penetration", unit: "mpy" },
            { name: "Pilling-Bedworth Ratio (PBR)", formula: "PBR = V_oxide / V_metal = (M_oxide × d_metal) / (n × M_metal × d_oxide)", meta: "M = molar mass · d = density · n = metal atoms per oxide molecule", also: "PBR < 1: Porous · PBR 1-2: Protective · PBR > 2: Flaking", unit: "ratio" }
          ]
        },
        {
          title: "2 · Electrochemical Corrosion Mechanism",
          single: true,
          cards: [
            { name: "Anodic Oxidation Mechanism", formula: "M  →  Mⁿ⁺ + n e⁻  (At smaller/anodic areas)", meta: "Metal dissolution / oxidation causing localized structural damage", unit: "—" },
            { name: "Cathodic Reduction (Acidic)", formula: "2H⁺ + 2e⁻  →  H₂ (g)  [Hydrogen Evolution]", meta: "Occurs in acidic mediums when non-oxidizing acids are active", unit: "—" },
            { name: "Cathodic Reduction (Basic/Neutral)", formula: "O₂ + 2H₂O + 4e⁻  →  4OH⁻  [Oxygen Absorption]", meta: "Occurs in neutral/alkaline environments exposed to atmospheric air", unit: "—" }
          ]
        }
      ],
      constants: ["1 mil = 0.001 inch", "PBR Ideal threshold: 1 ≤ PBR ≤ 2"],
      note: "Galvanic Corrosion: distinct potentials form macrocells · Differential Aeration: localized oxygen concentration deficit acts as anode",
      important: ["Rate = (534 × W) / (D × A × t)", "PBR = V_oxide / V_metal"],
      frequent: ["Calculate mpy Corrosion rate", "Determine Pilling-Bedworth metal oxide safety passivity"]
    },
    {
      id: 4,
      num: "Unit 04",
      title: "Chemical Kinetics & Catalysis",
      sections: [
        {
          title: "1 · Integrated Rate Laws",
          single: false,
          cards: [
            { name: "Zero-Order Integrated Law", formula: "[A]_t = −k·t + [A]_0", meta: "Rate is independent of reactant concentration", also: "Half-Life: t_1/2 = [A]_0 / (2k)", unit: "M·s⁻¹" },
            { name: "First-Order Integrated Law", formula: "ln[A]_t = −k·t + ln[A]_0  →  k = (2.303 / t) log([A]_0 / [A]_t)", meta: "Rate depends on single reactant raised to 1st power", also: "Half-Life: t_1/2 = 0.693 / k", unit: "s⁻¹" },
            { name: "Second-Order Integrated Law", formula: "1/[A]_t = k·t + 1/[A]_0", meta: "Rate depends on concentration squared", also: "Half-Life: t_1/2 = 1 / (k·[A]_0)", unit: "M⁻¹·s⁻¹" }
          ]
        },
        {
          title: "2 · Temperature Dependency & Enzyme Kinetics",
          single: false,
          cards: [
            { name: "Arrhenius Equation", formula: "k = A · e^(−Ea / RT)  →  log(k₂/k₁) = (Ea / 2.303R) · [ (T₂−T₁) / (T₁T₂) ]", meta: "k = rate constant · Ea = activation energy · A = frequency factor", unit: "J/mol" },
            { name: "Michaelis-Menten Equation", formula: "v = (V_max · [S]) / (Km + [S])", meta: "v = initial velocity · V_max = max rate · Km = Michaelis constant · [S] = substrate", unit: "mol/L·s" }
          ]
        }
      ],
      constants: ["R = 8.314 J/mol·K", "ln(2) ≈ 0.693"],
      note: "Molecularity: specific numbers of colliding reactant species · Order: experimentally derived power exponents mapping rate law equations",
      important: ["k = (2.303/t) log([A]_0/[A]_t)", "log(k₂/k₁) = (Ea/2.303R) * (ΔT/T₁T₂)", "v = V_max[S] / (Km + [S])"],
      frequent: ["First-order concentration half-life", "Activation Energy extraction via temperature parameter coefficients"]
    },
    {
      id: 5,
      num: "Unit 05",
      title: "Nuclear Chemistry & Alternative Energy",
      sections: [
        {
          title: "1 · Radioactive Decay Laws",
          single: false,
          cards: [
            { name: "Radioactive Decay Rate", formula: "N_t = N_0 · e^(−λ·t)  →  λ = (2.303 / t) log(N_0 / N_t)", meta: "N = quantity of radioactive nuclides · λ = decay constant", also: "Half-life: t_1/2 = 0.693 / λ", unit: "s⁻¹" },
            { name: "Nuclear Mass Defect (Δm)", formula: "Δm = [ Z·m_p + (A−Z)·m_n ] − m_nucleus", meta: "Z = proton count · A = mass count · m_p/m_n = resting weights", unit: "amu" }
          ]
        },
        {
          title: "2 · Nuclear Energy Equivalence",
          single: true,
          cards: [
            { name: "Einstein Mass-Energy Equivalence", formula: "E = Δm · c²", meta: "c = speed of light (3 × 10⁸ m/s) · Δm in kilograms", also: "Binding Energy Conversion: 1 amu = 931.5 MeV", unit: "J or MeV" }
          ]
        }
      ],
      constants: ["c = 3 × 10⁸ m/s", "1 amu = 1.6605 × 10⁻²⁷ kg", "1 amu equivalent = 931.5 MeV"],
      note: "Nuclear Fission: heavy nucleus fractures into smaller products · Nuclear Fusion: light nuclei unite releasing massive energy streams under high thermal pressure",
      important: ["λ = 0.693 / t_1/2", "E = Δm × 931.5 MeV"],
      frequent: ["Decay lifecycle calculations", "Binding energy structural per-nucleon calculations"]
    }
  ];

  // Client-side local search helper filtering dynamic queries matching formula text layout
  const filteredFormulaUnits = formulaUnits.map(unit => {
    if (!searchQuery.trim()) return unit;
    const q = searchQuery.toLowerCase();
    
    const matchedSections = unit.sections.map(sec => {
      const matchedCards = sec.cards.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.formula.toLowerCase().includes(q) || 
        c.meta.toLowerCase().includes(q)
      );
      return { ...sec, cards: matchedCards };
    }).filter(sec => sec.cards.length > 0);

    if (matchedSections.length > 0 || unit.title.toLowerCase().includes(q)) {
      return { ...unit, sections: matchedSections.length > 0 ? matchedSections : unit.sections };
    }
    return null;
  }).filter(Boolean) as typeof formulaUnits;

  const currentActiveUnitData = filteredFormulaUnits.find(u => u.id === activeUnit) || filteredFormulaUnits[0];

  return (
    <div className="space-y-6 select-none">
      
      {/* Header */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={24} />
          </div>
          <div>
            <h1 className="text-[24px] font-semibold text-secondary-900 dark:text-white">
              Revision Mode
            </h1>
            <p className="text-secondary-500 dark:text-slate-400 text-[14px] mt-1">
              Custom revision lists targeting high-priority, weak areas, and frequently studied concepts.
            </p>
          </div>
        </div>
        
        {/* Formula Reference Trigger Button */}
        <button
          onClick={() => setShowFormulas(!showFormulas)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
            showFormulas 
              ? 'bg-amber-500 border-amber-600 text-white shadow-md' 
              : 'bg-secondary-50 dark:bg-slate-800 border-secondary-200 dark:border-slate-700 text-secondary-700 dark:text-slate-200 hover:bg-secondary-100 dark:hover:bg-slate-700'
          }`}
        >
          <Book size={16} />
          <span>{showFormulas ? 'Hide Formula Sheet' : 'Show Formula Sheet'}</span>
        </button>
      </div>

      {/* Embedded Formula Reference Workspace */}
      {showFormulas && (
        <div className="p-6 bg-slate-950 text-slate-100 border border-slate-800 rounded-premium shadow-xl space-y-6 transition-all duration-300">
          
          {/* Formula Sheet Nav & Internal Search */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {formulaUnits.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setActiveUnit(u.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    activeUnit === u.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {u.id === 1 ? '⚡' : u.id === 2 ? '🔋' : u.id === 3 ? '🔩' : u.id === 4 ? '⚗️' : '☢️'} {u.title}
                </button>
              ))}
            </div>

            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search formulas across units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-md py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>
          </div>

          {/* Dynamic Content Display */}
          {currentActiveUnitData ? (
            <div className="space-y-6">
              {/* Internal Banner */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-slate-800 relative overflow-hidden">
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">{currentActiveUnitData.num}</span>
                <h2 className="text-xl font-bold text-white mt-1">{currentActiveUnitData.title}</h2>
                <span className="text-[11px] font-mono text-slate-600 block mt-2">22CH203 · Engineering Chemistry II</span>
              </div>

              {/* Sections & Cards */}
              {currentActiveUnitData.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase whitespace-nowrap">{section.title}</span>
                    <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/30 to-transparent" />
                  </div>

                  <div className={`grid gap-3.5 ${section.single && !searchQuery ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                    {section.cards.map((card, cIdx) => (
                      <div key={cIdx} className="p-4 bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 rounded-md relative transition-all group">
                        <span className="absolute top-3 right-3 text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700/60">{card.unit}</span>
                        <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">{card.name}</h4>
                        <p className="font-mono text-xs font-semibold text-slate-100 mb-2 leading-relaxed tracking-wide bg-slate-950/40 p-2 rounded border border-slate-800/40">{card.formula}</p>
                        <div className="text-[11px] text-slate-400 leading-normal border-t border-slate-800/80 pt-2 mt-2">{card.meta}</div>
                        {card.also && <div className="text-[10px] font-mono text-blue-400 mt-1">{card.also}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Constants Bar */}
              <div className="p-3 bg-purple-950/20 border border-purple-900/40 rounded-md space-y-1.5">
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">⚙ Constants</div>
                <div className="flex flex-wrap gap-2">
                  {currentActiveUnitData.constants.map((constVal, cIdx) => (
                    <span key={cIdx} className="font-mono text-[11px] bg-slate-900 text-slate-200 border border-slate-800 px-2.5 py-0.5 rounded">{constVal}</span>
                  ))}
                </div>
              </div>

              {/* General Note */}
              <div className="text-xs font-medium text-amber-400/90 bg-amber-500/5 border border-amber-500/20 p-3 rounded-md">
                📝 {currentActiveUnitData.note}
              </div>

              {/* Highlights & Exam analytics grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-md">
                  <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase mb-2">★ Most Important Exam Formulas</div>
                  <ul className="space-y-1.5 font-mono text-xs text-emerald-300/90">
                    {currentActiveUnitData.important.map((f, fIdx) => <li key={fIdx} className="border-b border-slate-800/50 pb-1 last:border-0">{f}</li>)}
                  </ul>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-md">
                  <div className="text-[10px] font-bold tracking-wider text-rose-400 uppercase mb-2">🔢 Frequently Asked Numericals</div>
                  <ul className="space-y-1.5 font-mono text-xs text-rose-300/90">
                    {currentActiveUnitData.frequent.map((f, fIdx) => <li key={fIdx} className="border-b border-slate-800/50 pb-1 last:border-0">{f}</li>)}
                  </ul>
                </div>
              </div>

            </div>
          ) : (
            <div className="py-6 text-center text-slate-500 text-xs font-medium">
              No formulas matching your search workspace query.
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-secondary-500 text-[14px]">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading revision lists...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main Revision Feed */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* High Priority */}
            <div>
              <h3 className="font-semibold text-[14px] text-secondary-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-500" size={16} />
                <span>High Priority Questions</span>
              </h3>
              {highPriorityQuestions.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium text-secondary-500 text-center text-[13px] font-medium">
                  Syllabus is complete! No high priority questions.
                </div>
              ) : (
                <div className="space-y-3">
                  {highPriorityQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      userId={profile?.id}
                      isBookmarked={bookmarks.includes(q.id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Frequently Viewed */}
            <div>
              <h3 className="font-semibold text-[14px] text-secondary-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="text-primary-600 dark:text-primary-400" size={16} />
                <span>Frequently Viewed / Recent Questions</span>
              </h3>
              {frequentQuestions.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium text-secondary-500 text-center text-[13px] font-medium">
                  No recently studied questions found yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {frequentQuestions.map(q => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      userId={profile?.id}
                      isBookmarked={bookmarks.includes(q.id)}
                      onToggleBookmark={toggleBookmark}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar components */}
          <div className="space-y-6">
            
            {/* Incomplete Units */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-premium shadow-sm">
              <h3 className="font-semibold text-[14px] text-secondary-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-primary-600 dark:text-primary-400" />
                <span>Incomplete Units</span>
              </h3>
              
              {incompleteUnits.length === 0 ? (
                <div className="text-center py-6 text-secondary-500">
                  <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">All Units Completed!</p>
                  <p className="text-[12px] text-secondary-400 mt-1">Excellent syllabus coverage.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incompleteUnits.map(unit => (
                    <div key={unit.id} className="p-3 bg-secondary-50 dark:bg-slate-800/50 rounded-md">
                      <span className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 block uppercase tracking-wide">Unit {unit.unit_number}</span>
                      <h4 className="text-[14px] font-semibold text-secondary-900 dark:text-white mt-1 leading-snug">{unit.unit_name}</h4>
                      <p className="text-[12px] text-secondary-500 dark:text-slate-400 mt-1">{unit.question_count} Questions left to cover</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Revision;