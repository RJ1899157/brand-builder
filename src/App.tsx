import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Layers, 
  Newspaper, 
  RefreshCw, 
  HelpCircle, 
  Loader2, 
  Heart, 
  Share2, 
  Bookmark, 
  Eye, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Sliders, 
  Lock, 
  Cpu, 
  AlertCircle,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BrandProduct, PromptSet, AdShot } from "./types";

const PRESETS: BrandProduct[] = [
  {
    productName: "Espace Elixir",
    productDescription: "A luxurious botanical night sleep tonic housed in a heavy, mouth-blown gradient indigo glass bottle with a smooth basalt stone stoppling.",
    brandIdentity: "Quiet Luxury Apothecary & Nocturnal Wellness",
    keyColor: "Midnight Twilight Indigo & Deep Basalt Sand",
    styling: "Ethereal Editorial Premium"
  },
  {
    productName: "Solaris Trail",
    productDescription: "An aerodynamic outdoor hiking shoe utilizing an ultra-durable carbon-fiber framework and bio-degradable green lichen composite soles.",
    brandIdentity: "Avan-Garde Eco-Athletics & Rugged Expedition Technology",
    keyColor: "Electric Lime Green & Mineral Gray",
    styling: "Techwear Industrial Functionalism"
  },
  {
    productName: "AuraPur",
    productDescription: "A minimalist cylindrical ambient air purifier made from fine matte sand-spun ceramic and hand-polished ash oak rings.",
    brandIdentity: "Harmonious Japandi Simplicity & Pure Natural Comfort",
    keyColor: "Soft Oatmeal White & Sanded Pale Oak",
    styling: "Japandi Sculpturalism"
  }
];

export default function App() {
  // Brand creation state
  const [formData, setFormData] = useState<BrandProduct>({
    productName: "",
    productDescription: "",
    brandIdentity: "",
    keyColor: "",
    styling: "Sleek Modernism"
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Prompt generation status
  const [promptSet, setPromptSet] = useState<PromptSet | null>(null);
  const [isPromptsLoading, setIsPromptsLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // Loaded mockup shots
  const [shots, setShots] = useState<AdShot[]>([
    {
      id: "billboard",
      medium: "billboard",
      title: "Widescreen Billboard",
      aspectRatio: "16:9",
      prompt: "",
      loading: false
    },
    {
      id: "newspaper",
      medium: "newspaper",
      title: "Print Newspaper Page",
      aspectRatio: "3:4",
      prompt: "",
      loading: false
    },
    {
      id: "social",
      medium: "social",
      title: "Social Post Card",
      aspectRatio: "1:1",
      prompt: "",
      loading: false
    }
  ]);

  // Loading quotes / steps
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingPhrases = [
    "Analyzing brand details and aesthetic direction...",
    "Defining absolute shape, textures, and product features...",
    "Ensuring strict guidelines: Removing humans and silhouettes...",
    "Drafting medium-specific compositions...",
    "Finalizing highly aligned, consistent branding templates..."
  ];

  // Image loading steps
  const [imageLoadingSteps, setImageLoadingSteps] = useState<{ [key: string]: number }>({
    billboard: 0,
    newspaper: 0,
    social: 0
  });

  const imagePhrases = [
    "Initializing Nano-Banana engine...",
    "Staging custom scene lighting...",
    "Casting consistent material shadows...",
    "Excluding figures & rendering pristine details...",
    "Finalizing image bytes to view..."
  ];

  // Rotate loading text
  useEffect(() => {
    let interval: any;
    if (isPromptsLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isPromptsLoading]);

  // Handle preset clicks
  const selectPreset = (preset: BrandProduct) => {
    setFormData(preset);
  };

  // Helper to handle prompt editing
  const updateShotPrompt = (id: string, newPrompt: string) => {
    setShots((prev) =>
      prev.map((shot) => (shot.id === id ? { ...shot, prompt: newPrompt } : shot))
    );
  };

  // 1. Hook up Brand specifications to gemini-3.5-flash for prompts
  const generateBrandConcepts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim() && !formData.productDescription.trim()) {
      setPromptError("Please provide either a Product Name or a Description detail to begin.");
      return;
    }

    setIsPromptsLoading(true);
    setPromptError(null);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/brand/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate brand directives.");
      }

      setPromptSet(data);
      
      // Auto-populate empty inputs in the UI with derived responses
      setFormData((prev) => ({
        ...prev,
        productName: data.derivedProductName || prev.productName,
        productDescription: data.derivedProductDescription || prev.productDescription
      }));

      // Pre-fill prompt fields of separate mediums
      setShots((prev) =>
        prev.map((shot) => {
          let adPrompt = "";
          if (shot.medium === "billboard") adPrompt = data.billboardPrompt;
          else if (shot.medium === "newspaper") adPrompt = data.newspaperPrompt;
          else if (shot.medium === "social") adPrompt = data.socialPrompt;

          return {
            ...shot,
            prompt: adPrompt,
            error: undefined // Reset individual error states
          };
        })
      );
    } catch (err: any) {
      console.error(err);
      setPromptError(err.message || "An unexpected error occurred while communicating with the server.");
    } finally {
      setIsPromptsLoading(false);
    }
  };

  // 1b. Compile directives and immediately generate all images in parallel
  const compileAndGenerateAll = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.productName.trim() && !formData.productDescription.trim()) {
      setPromptError("Please provide either a Product Name or a Description detail to begin.");
      return;
    }

    setIsPromptsLoading(true);
    setPromptError(null);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/brand/generate-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to generate brand directives.");
      }

      setPromptSet(data);

      // Auto-populate empty inputs in the UI with derived responses
      setFormData((prev) => ({
        ...prev,
        productName: data.derivedProductName || prev.productName,
        productDescription: data.derivedProductDescription || prev.productDescription
      }));

      // Pre-fill prompt fields of separate mediums in state
      setShots((prev) =>
        prev.map((shot) => {
          let adPrompt = "";
          if (shot.medium === "billboard") adPrompt = data.billboardPrompt;
          else if (shot.medium === "newspaper") adPrompt = data.newspaperPrompt;
          else if (shot.medium === "social") adPrompt = data.socialPrompt;

          return {
            ...shot,
            prompt: adPrompt,
            error: undefined // Reset individual error states
          };
        })
      );

      setIsPromptsLoading(false);

      // Trigger the graphic renders immediately in parallel using the freshly compiled prompts
      await Promise.all([
        imagineAd("billboard", data.billboardPrompt),
        imagineAd("newspaper", data.newspaperPrompt),
        imagineAd("social", data.socialPrompt)
      ]);
    } catch (err: any) {
      console.error(err);
      setPromptError(err.message || "An unexpected error occurred during automatic brand formulation.");
    } finally {
      setIsPromptsLoading(false);
    }
  };

  // 2. Hook up image generator helper via Nano-Banana model
  const imagineAd = async (id: string, customPrompt?: string) => {
    const targetShot = shots.find((shot) => shot.id === id);
    const promptToUse = customPrompt || targetShot?.prompt;
    if (!promptToUse) return;

    // Start loader
    setShots((prev) =>
      prev.map((shot) =>
        shot.id === id
          ? { ...shot, loading: true, error: undefined, warning: undefined }
          : shot
      )
    );

    // Track steps
    setImageLoadingSteps((prev) => ({ ...prev, [id]: 0 }));
    const stepInterval = setInterval(() => {
      setImageLoadingSteps((prev) => ({
        ...prev,
        [id]: (prev[id] + 1) % imagePhrases.length
      }));
    }, 2800);

    try {
      const response = await fetch("/api/brand/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          aspectRatio: targetShot ? targetShot.aspectRatio : "1:1"
        })
      });

      const data = await response.json();
      if (!response.ok && !data.imageUrl) {
        throw new Error(data.error || "The image generator failed to output data.");
      }

      setShots((prev) =>
        prev.map((shot) =>
          shot.id === id
            ? {
                ...shot,
                imageUrl: data.imageUrl,
                warning: data.warning,
                loading: false,
                error: data.error ? String(data.error) : undefined
              }
            : shot
        )
      );
    } catch (err: any) {
      console.error(err);
      setShots((prev) =>
        prev.map((shot) =>
          shot.id === id
            ? {
                ...shot,
                loading: false,
                error: err.message || "Model failed to imagine shot. Ensure your API Key is added."
              }
            : shot
        )
      );
    } finally {
      clearInterval(stepInterval);
    }
  };

  // Run all mediums in parallel
  const imagineAllMediums = async () => {
    if (!promptSet) return;
    await Promise.all(shots.map((shot) => imagineAd(shot.id)));
  };

  return (
    <div id="brand-builder-root" className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-zinc-950">
      {/* Top Professional Navbar */}
      <header id="studio-header" className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center text-zinc-950 shadow-md">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display uppercase tracking-wider text-white flex items-center gap-2">
              Brand Builder <span className="text-[10px] bg-zinc-900 text-yellow-400 font-mono px-2 py-0.5 rounded border border-zinc-800">Bento v2.1</span>
            </h1>
            <p className="text-xs text-zinc-500 font-mono">Imagine products anywhere • Nano-Banana Image Model</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-zinc-900 border border-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg font-mono">
            <Cpu className="w-3.5 h-3.5 text-zinc-500" />
            <span>Engine: <span className="text-yellow-400">Nano-Banana v2.1</span></span>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main id="studio-main" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Specification Column - Bento Card */}
        <div id="creator-workspace" className="lg:col-span-12 xl:col-span-5 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
          <div className="mb-6">
            <span className="text-[11px] font-mono uppercase bg-zinc-950 border border-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full font-medium tracking-wider inline-block">
              Phase 1: Brand Formulation
            </span>
            <h2 className="text-2xl font-bold font-display tracking-tight text-white mt-3">Define Your Creation</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Describe your product to construct a persistent visual baseline. Formulations automatically exclude human figures.
            </p>
          </div>

          {/* Quick presets list */}
          <div className="mb-6">
            <label className="text-xs font-mono font-medium text-zinc-550 block mb-2 px-1">QUICK START CONCEPTS</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPreset(p)}
                  className={`text-xs px-3 py-2.5 rounded-xl border text-left transition-all duration-200 leading-snug flex flex-col ${
                    formData.productName === p.productName
                      ? "border-yellow-400 bg-zinc-950 text-yellow-400 shadow-sm"
                      : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="font-bold block truncate w-full">{p.productName}</span>
                  <span className={`text-[10px] mt-0.5 truncate w-full block ${formData.productName === p.productName ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {p.brandIdentity.split(' & ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={generateBrandConcepts} className="space-y-4">
            <div>
              <label htmlFor="productName" className="text-xs font-mono font-bold text-zinc-400 block mb-1">PRODUCT / BRAND NAME (OPTIONAL IF DESC PROVIDED)</label>
              <input
                id="productName"
                type="text"
                placeholder="e.g. Aura Mist"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-zinc-950 transition-all duration-150 text-white"
              />
            </div>

            <div>
              <label htmlFor="productDescription" className="text-xs font-mono font-bold text-zinc-400 block mb-1">PHYSICAL PRODUCT DESCRIPTION (OPTIONAL IF NAME PROVIDED)</label>
              <textarea
                id="productDescription"
                rows={3}
                placeholder="Describe material details, shapes, label colors. Or leave blank to let Gemini imagine details from the brand name."
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-zinc-950 transition-all duration-150 text-white leading-relaxed"
              />
            </div>

            {/* Collapsible Advanced Brand Tuning Options */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 bg-zinc-950 hover:bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs font-mono font-bold text-zinc-400 transition-all duration-150 cursor-pointer"
              >
                <span className="flex items-center gap-1.5 uppercase">
                  <Sliders className="w-3.5 h-3.5 text-yellow-400" />
                  Aesthetics & Aura Tuning
                </span>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded flex items-center gap-1">
                  {showAdvanced ? "COLLAPSE" : "EXPAND OPTIONAL"}
                  <ChevronRight className={`w-3 h-3 transition-transform duration-150 ${showAdvanced ? "rotate-90" : ""}`} />
                </span>
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="keyColor" className="text-xs font-mono font-bold text-zinc-400 block mb-1">KEY COLOR PALETTE</label>
                    <input
                      id="keyColor"
                      type="text"
                      placeholder="e.g. Matte Amber & Obsidian"
                      value={formData.keyColor}
                      onChange={(e) => setFormData({ ...formData, keyColor: e.target.value })}
                      className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-zinc-950 transition-all duration-150 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="styling" className="text-xs font-mono font-bold text-zinc-400 block mb-1">AESTHETIC STYLING</label>
                    <input
                      id="styling"
                      type="text"
                      placeholder="e.g. Minimalist Retro"
                      value={formData.styling}
                      onChange={(e) => setFormData({ ...formData, styling: e.target.value })}
                      className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-zinc-950 transition-all duration-150 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="brandIdentity" className="text-xs font-mono font-bold text-zinc-400 block mb-1">BRAND IDENTITY / CORE ENERGY</label>
                  <input
                    id="brandIdentity"
                    type="text"
                    placeholder="e.g. Quiet Luxury Apothecary, Sustainable Rugged"
                    value={formData.brandIdentity}
                    onChange={(e) => setFormData({ ...formData, brandIdentity: e.target.value })}
                    className="w-full text-sm bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-zinc-950 transition-all duration-150 text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                id="compile-all-btn"
                type="button"
                onClick={compileAndGenerateAll}
                disabled={isPromptsLoading || shots.some((s) => s.loading)}
                className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-sm py-4 rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer relative overflow-hidden"
              >
                {isPromptsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Structuring Concept...</span>
                  </>
                ) : shots.some((s) => s.loading) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Imagining Layouts...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-zinc-950 animate-pulse" />
                    <span>Compile & Generate All Images</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={isPromptsLoading || shots.some((s) => s.loading)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 border border-zinc-700/50 disabled:border-zinc-800 text-zinc-200 disabled:text-zinc-500 font-bold text-xs py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Compile Brand Directives Only</span>
              </button>
            </div>
          </form>

          {/* Guidelines disclaimer */}
          <div className="mt-4 p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-normal">
              <strong>Consistency Enforcement:</strong> Visual prompts will strictly describe materials and backgrounds cohesively. Human figures or features are blocked by direct backend command prompts.
            </p>
          </div>

          {promptError && (
            <div className="mt-4 p-3.5 bg-red-950/40 border border-red-900 text-red-300 text-xs rounded-xl flex items-center gap-2 font-medium animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              <span>{promptError}</span>
            </div>
          )}
        </div>

        {/* Right Output Showcase/Dashboard and Interactive Stages */}
        <div id="studio-gallery" className="lg:col-span-12 xl:col-span-7 space-y-8">
          {/* Transition Loader */}
          {isPromptsLoading && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center shadow-2xl flex flex-col items-center justify-center gap-4 py-20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-radial-gradient(circle_at_center,_#1c1917_0%,_transparent_70%) opacity-30"></div>
              <div className="relative">
                <Loader2 className="w-10 h-10 animate-spin text-yellow-400" />
                <Layers className="w-4 h-4 text-zinc-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-semibold tracking-wide font-mono text-zinc-200 animate-pulse mt-2 relative z-10">
                {loadingPhrases[loadingStep]}
              </p>
              <p className="text-xs text-zinc-400 max-w-xs leading-relaxed relative z-10">
                Consulting custom layout specifications and compiling absolute consistency controls.
              </p>
            </motion.div>
          )}

          {/* Concept Directives Panel - Beautiful Bento Card */}
          <AnimatePresence>
            {!isPromptsLoading && promptSet && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-550">Integrated Strategy</span>
                    <h3 className="text-lg font-bold font-display tracking-tight text-white mt-1">Compiled Directives</h3>
                  </div>

                  <button
                    onClick={imagineAllMediums}
                    className="bg-yellow-400 hover:bg-yellow-500 text-zinc-950 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                    Imagine All Mediums
                  </button>
                </div>

                {promptSet.isLocalFallback && (
                  <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-2xl text-xs text-yellow-300 leading-relaxed flex items-start gap-3">
                    <Info className="w-5 h-5 shrink-0 text-yellow-400" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wide text-yellow-400 mb-0.5 text-[11px]">💡 Offline Formulation Protection Active</p>
                      <p className="text-zinc-300">
                        The Gemini API daily requests are exhausted. We have successfully generated consistent, elite-styled visual directives using our high-precision Local Design Engine. Feel free to tweak, customize, or generate your advertisement images below!
                      </p>
                    </div>
                  </div>
                )}

                {shots.some((shot) => shot.warning) && (
                  <div className="p-4 bg-orange-400/5 border border-orange-400/20 rounded-2xl text-xs text-orange-200 leading-relaxed flex items-start gap-3">
                    <Info className="w-5 h-5 shrink-0 text-orange-400" />
                    <div>
                      <p className="font-extrabold uppercase tracking-wide text-orange-300 mb-0.5 text-[11px]">⚠️ Image quota fallback active</p>
                      <p className="text-zinc-300">
                        One or more image renderings are displaying a local placeholder because Gemini image quota has been exceeded. Direct AI-generated image results may be limited until the quota resets.
                      </p>
                    </div>
                  </div>
                )}

                {/* Slogan showcase block inside Bento Layout */}
                <div className="p-5 bg-zinc-950 text-white rounded-2xl relative overflow-hidden flex flex-col gap-1 items-start justify-center border border-zinc-800 bg-[radial-gradient(circle_at_center,_#1c1917_0%,_#09090b_100%)]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 blur-3xl rounded-full"></div>
                  <div className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase mb-1">BRAND SLOGAN</div>
                  <div className="text-2xl italic font-display font-black text-yellow-400 leading-tight">
                    "{promptSet.slogan}"
                  </div>
                  <div className="absolute right-4 bottom-2 text-3xl text-zinc-900 font-black tracking-tighter uppercase font-display select-none select-none">
                    {formData.productName}
                  </div>
                </div>

                {/* Visual baseline analysis block */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">PRODUCT VISUAL BASELINE</h4>
                  <p className="text-xs text-zinc-350 bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl leading-relaxed">
                    {promptSet.productSummary}
                  </p>
                </div>

                {/* Specific prompts tweaking panels */}
                <div>
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">MEDIUM DIRECTIVES (TAP TO CUSTOMIZE)</h4>
                  <div className="space-y-3">
                    {shots.map((shot) => (
                      <div key={shot.id} className="border border-zinc-800 rounded-xl p-3 bg-zinc-950/40 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                            {shot.medium === "billboard" && <Layers className="w-3.5 h-3.5 text-blue-400" />}
                            {shot.medium === "newspaper" && <Newspaper className="w-3.5 h-3.5 text-orange-400" />}
                            {shot.medium === "social" && <Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
                            {shot.title}
                          </span>
                          <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono uppercase">
                            ASPECT RATIO {shot.aspectRatio}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={shot.prompt}
                          onChange={(e) => updateShotPrompt(shot.id, e.target.value)}
                          className="w-full text-xs bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-2 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-yellow-400 transition-all font-mono leading-relaxed"
                          placeholder={`${shot.title} prompt configuration...`}
                        />
                        {shot.warning && (
                          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-orange-100 text-[11px] leading-snug">
                            {shot.warning}
                          </div>
                        )}
                        <div className="flex justify-end mt-1">
                          <button
                            onClick={() => imagineAd(shot.id)}
                            disabled={shot.loading}
                            className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-950 border border-zinc-800 hover:border-zinc-700 disabled:text-zinc-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            {shot.loading ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 text-yellow-400" />
                                <span>Generate {shot.medium} shot</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty Workspace Landing Page */}
          {!isPromptsLoading && !promptSet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center justify-center gap-4 py-12 relative overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-400/5 blur-3xl rounded-full"></div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-xs relative z-10">
                <Sparkles className="w-6 h-6 text-yellow-400/85 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold font-display tracking-tight text-white relative z-10">Concept Studio Staging</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed relative z-10">
                Fill in the Brand specifications on the left panel (either simple name or descriptions), or click a Quick-Start concept below to immediately preview.
              </p>
              
              {/* Add a friendly direct initializer button here in empty state! */}
              <div className="pt-2 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    // Pre-fill a concept first if form is empty
                    if (!formData.productName && !formData.productDescription) {
                      selectPreset(PRESETS[0]);
                    }
                    setTimeout(() => {
                      const btn = document.getElementById("compile-all-btn");
                      if (btn) btn.click();
                    }, 50);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all"
                >
                  Quick-Generate Default Concept
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-mono mt-2 relative z-10">
                <span>Exclusively Powered by Nano-Banana Engine</span>
              </div>
            </motion.div>
          )}

          {/* Medium Placements Mockups Grid in beautiful Bento segments */}
          {promptSet && (
            <div id="mockups-presentation" className="space-y-12 pt-4">
              <div className="border-b border-zinc-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
                  <h3 className="text-lg font-bold font-display tracking-tight text-white">Active Medium Mockup Canvas</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={imagineAllMediums}
                    disabled={shots.some((s) => s.loading)}
                    className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 text-xs font-black px-4 py-2 rounded-xl shadow-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                  >
                    {shots.some((s) => s.loading) ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                        <span>Generating Studio...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-950" />
                        <span>Generate All Images</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs font-mono text-zinc-500 italic hidden sm:inline">Strict Rule: No Humans Allowed</span>
                </div>
              </div>

              {shots.map((shot) => (
                <div key={shot.id} id={`mockup-tile-${shot.id}`} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest font-mono text-zinc-400 flex items-center gap-1.5">
                      {shot.medium === "billboard" && <span className="p-1 rounded bg-zinc-900 border border-zinc-800 text-yellow-400 text-[10px]">BILLBOARD</span>}
                      {shot.medium === "newspaper" && <span className="p-1 rounded bg-zinc-900 border border-zinc-800 text-orange-400 text-[10px]">NEWSPRINT</span>}
                      {shot.medium === "social" && <span className="p-1 rounded bg-zinc-900 border border-zinc-800 text-blue-400 text-[10px]">DIGITAL SOCIAL</span>}
                      {shot.title} ({shot.aspectRatio})
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase font-semibold">Excluding human silhouettes</span>
                  </div>

                  {/* Medium Specific Frame Renders inside dedicated Bento chassis */}
                  {shot.medium === "billboard" && (
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-transparent to-transparent opacity-60"></div>
                      {/* Structure Support Bars */}
                      <div className="absolute top-0 right-0 left-0 h-1 bg-yellow-400/40"></div>
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl relative overflow-hidden aspect-[16/9] flex items-center justify-center">
                        {shot.loading ? (
                          <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                            <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{imagePhrases[imageLoadingSteps.billboard]}</p>
                          </div>
                        ) : shot.error ? (
                          <div className="absolute inset-x-6 text-center text-xs p-6 bg-red-950/40 border border-red-900 text-red-300 rounded-xl leading-relaxed">
                            <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-400" />
                            <span>{shot.error}</span>
                            <button
                              onClick={() => imagineAd(shot.id)}
                              className="mt-3 block mx-auto bg-yellow-400 hover:bg-yellow-500 text-zinc-950 text-[10px] font-bold px-3 py-1.5 rounded-md"
                            >
                              Retry Image Generation
                            </button>
                          </div>
                        ) : shot.imageUrl ? (
                          <img
                            src={shot.imageUrl}
                            className="w-full h-full object-cover select-none"
                            alt="Brand Billboard"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2">
                            <Layers className="w-10 h-10 text-zinc-700" />
                            <p className="text-xs font-medium">Billboard Image Not Generated Yet</p>
                            <button
                              onClick={() => imagineAd(shot.id)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold px-3.5 py-1.5 rounded-lg text-xs mt-2 transition-all font-mono cursor-pointer"
                            >
                              Imagine Billboard
                            </button>
                          </div>
                        )}

                        <div className="absolute top-3 right-3 bg-zinc-900 border border-zinc-800 text-yellow-400/90 backdrop-blur-md px-3 py-1 rounded-md text-[9px] tracking-widest font-mono font-semibold uppercase">
                          Digital Panel • 16:9
                        </div>
                      </div>

                      {/* Hardware base of Billboard */}
                      <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> ENGINE: NANO-BANANA v2.1</span>
                        <span>SITUATED STATE: URBAN CENTRAL</span>
                      </div>
                    </div>
                  )}

                  {shot.medium === "newspaper" && (
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-1 bg-orange-400/40"></div>
                      <div className="bg-[#FAF9F6] text-zinc-900 p-6 md:p-8 rounded-2xl border border-stone-200 overflow-hidden font-serif">
                        {/* Newspaper Masthead */}
                        <div className="border-b-4 border-double border-zinc-800 pb-4 text-center mb-6">
                          <h3 className="text-3xl font-display font-extrabold tracking-tight uppercase text-zinc-900">THE DAILY BRAND GAZETTE</h3>
                          <div className="flex justify-between items-center text-[10px] uppercase font-mono mt-2.5 tracking-widest text-zinc-600 px-1">
                            <span>VOL. CCLXVII • NO. 402</span>
                            <span>TUESDAY, JUNE 9, 2026</span>
                            <span>PRICE SIX CENTS</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                          {/* Newspaper Column */}
                          <div className="md:col-span-1 border-r border-zinc-300 pr-4 space-y-3 font-serif select-none hidden md:block text-zinc-800">
                            <h5 className="text-xs font-mono font-extrabold tracking-wider uppercase text-zinc-900">TODAY'S FEATURES</h5>
                            <p className="text-[10px] leading-relaxed text-zinc-700">
                              A stunning technological baseline emerged today. Elite designers and strategists formulate brand elements without traditional human labor structures.
                            </p>
                            <div className="h-px bg-zinc-300"></div>
                            <p className="text-[10px] leading-relaxed text-zinc-700">
                              "Form and purity are optimized simultaneously," quotes leading global research engines.
                            </p>
                          </div>

                          {/* Newspaper ad container */}
                          <div className="md:col-span-3 space-y-4">
                            <div className="relative border-4 border-zinc-900 p-1 bg-stone-100 aspect-[3/4] flex items-center justify-center overflow-hidden rounded">
                              {shot.loading ? (
                                <div className="absolute inset-0 bg-stone-200 flex flex-col items-center justify-center p-6 text-center gap-3">
                                  <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
                                  <p className="text-xs font-mono text-zinc-700 uppercase tracking-widest">{imagePhrases[imageLoadingSteps.newspaper]}</p>
                                </div>
                              ) : shot.error ? (
                                <div className="absolute inset-x-6 text-center text-xs p-6 bg-stone-300 border border-zinc-500 text-stone-800 rounded-lg leading-relaxed font-sans">
                                  <AlertCircle className="w-5 h-5 mx-auto mb-2 text-stone-700" />
                                  <span>{shot.error}</span>
                                  <button
                                    onClick={() => imagineAd(shot.id)}
                                    className="mt-3 block mx-auto bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-md"
                                  >
                                    Retry Image Generation
                                  </button>
                                </div>
                              ) : shot.imageUrl ? (
                                <img
                                  src={shot.imageUrl}
                                  className="w-full h-full object-cover select-none filter grayscale contrast-110 sepia-[15%]"
                                  alt="Brand Newspaper ad"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2 font-sans">
                                  <Newspaper className="w-10 h-10 text-zinc-400" />
                                  <p className="text-xs font-medium">Newspaper Print Not Generated</p>
                                  <button
                                    onClick={() => imagineAd(shot.id)}
                                    className="bg-zinc-950 hover:bg-zinc-900 text-white px-3.5 py-1.5 rounded-lg text-xs mt-2 transition-all font-mono cursor-pointer"
                                  >
                                    Imagine Newspaper Ad
                                  </button>
                                </div>
                              )}

                              <div className="absolute top-2 right-2 bg-zinc-900 text-white px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase">
                                ADVERTISEMENT PAGE 5
                              </div>
                            </div>

                            {/* Slogan & Editorial Footer */}
                            <div className="text-center md:text-left">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-950 leading-tight">
                                {promptSet.slogan}
                              </h4>
                              <p className="text-[10px] text-zinc-600 mt-1 lines-clamp-2 italic leading-relaxed">
                                Featuring clean physical form structures, premium key tones, and authentic materials. Zero artificial human mockups. Designed by {formData.productName}.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hardware base of Newspaper Bento */}
                      <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> MEDIUM: RETRO MONOCHROME LITHO</span>
                        <span>SITUATED STATE: PRINT ARCHIVE</span>
                      </div>
                    </div>
                  )}

                  {shot.medium === "social" && (
                    <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 left-0 h-1 bg-blue-400/40"></div>
                      
                      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 max-w-md mx-auto space-y-4">
                        {/* Social post header */}
                        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-400 to-indigo-600 flex items-center justify-center p-[1px]">
                              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white uppercase font-display">
                                {formData.productName ? formData.productName.substring(0, 2) : "BB"}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-zinc-200 flex items-center gap-1">
                                {formData.productName.toLowerCase().replace(/\s+/g, "") || "brand_builder"}
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block"></span>
                              </p>
                              <p className="text-[9px] text-zinc-500 font-mono tracking-wider">SPONSORED SHOWCASE</p>
                            </div>
                          </div>
                          <HelpCircle className="w-4 h-4 text-zinc-550 cursor-pointer hover:text-zinc-400" />
                        </div>

                        {/* 1:1 image placement */}
                        <div className="relative aspect-square bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
                          {shot.loading ? (
                            <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-6 text-center gap-3">
                              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
                              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{imagePhrases[imageLoadingSteps.social]}</p>
                            </div>
                          ) : shot.error ? (
                            <div className="absolute inset-x-6 text-center text-xs p-6 bg-red-950/30 border border-red-900 text-red-300 rounded-xl leading-relaxed">
                              <AlertCircle className="w-5 h-5 mx-auto mb-2 text-red-500" />
                              <span>{shot.error}</span>
                              <button
                                onClick={() => imagineAd(shot.id)}
                                className="mt-3 block mx-auto bg-yellow-400 hover:bg-yellow-500 text-zinc-950 text-[10px] font-bold px-3 py-1.5 rounded-md"
                              >
                                Retry Image Generation
                              </button>
                            </div>
                          ) : shot.imageUrl ? (
                            <img
                              src={shot.imageUrl}
                              className="w-full h-full object-cover select-none"
                              alt="Social grid ad"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-500 gap-2">
                              <Sparkles className="w-10 h-10 text-zinc-750" />
                              <p className="text-xs font-medium">Social Card Not Generated Yet</p>
                              <button
                                onClick={() => imagineAd(shot.id)}
                                className="bg-yellow-400 hover:bg-yellow-500 text-zinc-950 font-bold px-3.5 py-1.5 rounded-lg text-xs mt-2 transition-all font-mono cursor-pointer"
                              >
                                Imagine Social Post
                              </button>
                            </div>
                          )}

                          <div className="absolute top-3 right-3 bg-zinc-900 border border-zinc-800 text-zinc-200 px-2.5 py-0.5 rounded-md text-[9px] tracking-wide font-mono font-medium shadow-xs">
                            Studio Grid • 1:1
                          </div>
                        </div>

                        {/* Interactive metadata footer */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-zinc-500 font-medium">
                            <div className="flex items-center gap-4">
                              <Heart className="w-5 h-5 hover:text-red-500 cursor-pointer transition-colors" />
                              <Share2 className="w-5 h-5 hover:text-blue-500 cursor-pointer transition-colors" />
                            </div>
                            <Bookmark className="w-5 h-5 hover:text-yellow-400 cursor-pointer transition-colors" />
                          </div>

                          <div className="text-xs leading-relaxed text-zinc-300">
                            <p>
                              <span className="font-bold text-white mr-2">
                                {formData.productName.toLowerCase().replace(/\s+/g, "") || "brand"}
                              </span>
                              <strong>{promptSet.slogan}</strong>. Synthesizing absolute physical texture, beautiful shapes, and elegant key tones of {formData.productName}.
                            </p>
                            <p className="text-yellow-400 space-x-1.5 mt-1 font-semibold font-mono text-[10px] tracking-tight">
                              <span>#{formData.productName.replace(/\s+/g, "")}</span>
                              <span>#industrialDesign</span>
                              <span>#noFiguresAllowed</span>
                              <span>#genAI</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Hardware base of Social Bento */}
                      <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> SYSTEM: INSTANT CARD RENDER</span>
                        <span>SITUATED STATE: SOCIAL CLOUD</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Styled minimalistic Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 px-6 py-6 text-center text-xs text-zinc-500 font-mono mt-12 flex flex-col md:flex-row items-center justify-between max-w-7xl w-full mx-auto uppercase tracking-wider gap-4">
        <div>Model Parameters: CFG 7.5 | Steps 50 | Sampler DPM++</div>
        <p>© 2026 Brand Builder Studio. Built entirely on Nano-Banana Imagery rules.</p>
        <div>Batch ID: BB-2026-XT</div>
      </footer>
    </div>
  );
}
