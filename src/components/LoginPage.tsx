import React, { useState, useEffect } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, getAuthSnapshot, callGameApi } from "../lib/supabase";
import { 
  Shield, 
  Lock, 
  Mail, 
  Sparkles, 
  Castle, 
  ChevronRight, 
  Activity,
  Sword,
  ShieldAlert,
  User,
  Check,
  Edit2,
  RefreshCw,
  Skull
} from "lucide-react";
import { Hero } from "../types";
import { generateSingleNoviceHero } from "../utils/gameCalculations";

interface LoginPageProps {
  onLoginSuccess: (cityName: string, startingHeroes?: Hero[]) => void;
  addLog: (message: string, type?: "info" | "victory" | "defeat" | "loot" | "system") => void;
}

export default function LoginPage({ onLoginSuccess, addLog }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Naming state (when authenticated but needs to name the city)
  const [showNamingStep, setShowNamingStep] = useState(false);
  const [tempCityName, setTempCityName] = useState("");
  const [userCredential, setUserCredential] = useState<any>(null);

  // Starter hero selection states
  const [showNoviceChoiceStep, setShowNoviceChoiceStep] = useState(false);
  const [candidateNovices, setCandidateNovices] = useState<Hero[]>([]);
  const [selectedNoviceIds, setSelectedNoviceIds] = useState<string[]>([]);
  const [editingHeroId, setEditingHeroId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // If a user logs in via Google or is authenticated with no city named, show naming step
  useEffect(() => {
    getAuthSnapshot().then(({ user }) => {
      if (user) setUserCredential(user);
      setShowNamingStep(true);
    });
  }, []);

  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      addLog("☁️ Connexion établie via Google avec succès !", "victory");
    } catch (err: any) {
      console.error("Google authentication error:", err);
      if (err.code !== "provider-canceled") {
        setError("Impossible de s'authentifier via Google : " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères pour protéger votre royaume.");
      setLoading(false);
      return;
    }

    if (authMode === "signup" && password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      if (authMode === "login") {
        const credential = await signInWithEmail(email, password);
        // Success: check if save game exists and has cityName inside App.tsx
        // App.tsx handles the Supabase auth subscription and loads the city state.
        addLog("☁️ Connexion établie avec succès ! Royaume synchronisé.", "victory");
      } else {
        const credential = await signUpWithEmail(email, password);
        setUserCredential(credential.data.user);
        // Force show naming step for newly signed up users
        setShowNamingStep(true);
        addLog("☁️ Dynastie cloud créée avec succès ! Nommez votre cité.", "victory");
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let frenchMessage = "Une erreur est survenue lors de l'authentification.";
      if (err.code === "invalid_email") {
        frenchMessage = "Adresse e-mail invalide.";
      } else if (
        err.code === "invalid_credentials"
      ) {
        frenchMessage = "Identifiants incorrects (adresse e-mail ou mot de passe erroné).";
      } else if (err.code === "user_already_exists") {
        frenchMessage = "Cette adresse e-mail est déjà associée à un autre souverain.";
      } else if (err.code === "weak_password") {
        frenchMessage = "Le mot de passe est trop faible (6 caractères minimum).";
      } else if (err.code === "network_error") {
        frenchMessage = "Impossible de contacter le royaume. Vérifiez votre connexion internet.";
      }
      setError(frenchMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateStartingNovices = () => {
    const list: Hero[] = [];

    for (let i = 0; i < 5; i++) {
      const tempHero = generateSingleNoviceHero();
      list.push(tempHero);
    }
    setCandidateNovices(list);
    setSelectedNoviceIds([]);
  };

  const handleConfirmCityName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempCityName.trim()) {
      setError("Le nom de votre cité ne peut pas être vide.");
      return;
    }
    setError(null);

    const user = userCredential;
    if (!user) {
      setError("Session de souverain perdue. Veuillez vous reconnecter.");
      return;
    }

    // Instead of instantly saving, generate starting novices and move to step 3!
    generateStartingNovices();
    setShowNamingStep(false);
    setShowNoviceChoiceStep(true);
  };

  const handleConfirmStarterSquad = async () => {
    if (selectedNoviceIds.length !== 2) {
      setError("Veuillez sélectionner exactement 2 novices pour votre escouade initiale.");
      return;
    }
    setLoading(true);
    setError(null);

    const user = userCredential;
    if (!user) {
      setError("Session perdue. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    try {
      const formattedName = tempCityName.trim();
      const chosenHeroes = candidateNovices.filter(hero => selectedNoviceIds.includes(hero.id));

      const finalHeroes = chosenHeroes.map(hero => ({
        ...hero,
        status: "idle" as const,
        isActive: false
      }));

      // Initialize the authoritative game through game-api.
      try {
        await callGameApi("/bootstrap", {
          method: "POST",
          body: JSON.stringify({
          cityName: formattedName,
          resources: { gold: 125, food: 75, wood: 40, stone: 0, ore: 0 },
          buildings: { "habitation": 1, "guilde": 0 },
          citizens: { unassigned: 3, woodcutters: 0, farmers: 0, miners: 0, quarrymen: 0 },
          totalCitizensCount: 3,
          districts: {},
          heroes: finalHeroes,
          activeDungeonFloor: 1,
          activeDungeonRoom: 1,
          highestFloorReached: 1,
          isMigrationPending: false,
          updatedAt: new Date().toISOString()
          })
        });
      } catch (cloudErr: any) {
        console.warn("Could not initialize the authoritative game:", cloudErr);
        addLog("⚠️ Impossible d'initialiser la partie serveur. Réessayez lorsque la connexion est disponible.", "system");
      }

      addLog(`🏰 Cité de ${formattedName} ralliée sous vos bannières !`, "victory");
      addLog(`🤝 ${finalHeroes[0].name} et ${finalHeroes[1].name} intègrent de suite l'escouade de votre domaine !`, "victory");
      onLoginSuccess(formattedName, finalHeroes);
    } catch (err: any) {
      console.error("Failed to complete starter setup:", err);
      setError("Impossible de fonder la cité et d'établir l'escouade. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectNovice = (id: string) => {
    setSelectedNoviceIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 2) {
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  const handleUpdateNoviceName = (id: string, newName: string) => {
    setCandidateNovices(prev => {
      return prev.map(hero => {
        if (hero.id === id) {
          return { ...hero, name: newName };
        }
        return hero;
      });
    });
  };

  if (showNoviceChoiceStep) {
    return (
      <div className="min-h-screen bg-[#060403] text-[#e3dbc8] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#926430]/60 select-none">
        {/* Ambient Dark Magic Atmospheric BG Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8c5a2b]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="w-full max-w-7xl bg-[#160f0a] border-2 border-[#5c402b] rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.85)] relative flex flex-col items-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#926430]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-14 h-14 bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16] rounded-2xl flex items-center justify-center mb-4 shadow-xl border-2 border-[#d4af37]">
            <Sparkles className="w-7 h-7 text-[#fdf9f2] animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase mb-1 text-center">
            Choisissez vos Fondateurs
          </h2>
          <p className="text-xs text-[#a89078] leading-relaxed mb-6 font-serif max-w-2xl text-center">
            Cinq novices intrépides désirent se rallier à la nouvelle cité de <strong className="text-[#fdf9f2] font-sans text-sm">{tempCityName}</strong>. 
            Sélectionnez <strong className="text-[#fbbf24]">exactement 2 novices</strong> pour établir votre première escouade. Personnalisez leur nom ou leur genre à votre guise !
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-red-900/50 rounded-xl text-red-300 text-xs text-center font-sans flex items-center justify-center gap-2 max-w-md w-full">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full mb-6">
            {candidateNovices.map((hero) => {
              const isSelected = selectedNoviceIds.includes(hero.id);
              const cardBorderClass = isSelected 
                ? "border-[#d4af37] bg-[#5c402b]/15 shadow-[0_0_15px_rgba(212,175,55,0.15)]" 
                : "border-[#45301f] hover:border-[#ae8650]/65 bg-[#0f0a06]";
              
              const STAT_LABELS: Record<string, string> = {
                str: "Force (STR)",
                wiz: "Sagesse (WIZ)",
                agi: "Agilité (AGI)",
                dex: "Dextérité (DEX)",
                end: "Constitution (END)",
                luk: "Chance (LUK)",
                int: "Intelligence (INT)"
              };
              const entries = Object.entries(hero.baseStats || {}) as [string, number][];
              const valid = entries.filter(([key]) => key in STAT_LABELS);
              const bestEntry = valid.reduce((max, curr) => curr[1] > max[1] ? curr : max, valid[0] || ["str", 0]);
              const worstEntry = valid.reduce((min, curr) => curr[1] < min[1] ? curr : min, valid[0] || ["str", 0]);

              return (
                <div 
                  key={hero.id}
                  onClick={() => toggleSelectNovice(hero.id)}
                  className={`border-2 rounded-2xl p-4 transition-all duration-300 relative cursor-pointer flex flex-col justify-between ${cardBorderClass}`}
                >
                  {/* Select Badge in Corner */}
                  <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => toggleSelectNovice(hero.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-all border ${
                        isSelected 
                          ? "bg-[#d4af37] border-[#d4af37] text-[#120b07]" 
                          : "bg-[#0b0704] border-[#45301f] text-transparent hover:border-[#ae8650]"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                  </div>

                  <div>
                    {/* Header Row: Race, Gender and Elite Status */}
                    <div className="flex gap-1.5 items-center justify-between mb-3">
                      <div className="flex gap-1.5 items-center">
                        <span className="text-[9.5px] font-extrabold uppercase bg-[#2a170a] text-[#caa050] border border-[#5c402b]/55 px-2 py-0.5 rounded-md font-mono">
                          {hero.race}
                        </span>
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                          hero.gender === "Male" ? "bg-blue-950/40 text-blue-300 border border-blue-900/40" : "bg-pink-950/40 text-pink-300 border border-pink-900/40"
                        }`}>
                          {hero.gender === "Male" ? "♂" : "♀"}
                        </span>
                      </div>
                      {hero.isElite && (
                        <span className="text-[9px] font-extrabold uppercase bg-[#f59e0b]/20 text-[#fbbf24] border border-[#d97706] px-1.5 py-0.5 rounded font-mono animate-pulse">
                          🔥 Élite
                        </span>
                      )}
                    </div>

                    {/* Name Input Field (acting as title) */}
                    <div className="mb-4 relative" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={hero.name}
                        onChange={(e) => handleUpdateNoviceName(hero.id, e.target.value)}
                        className="bg-transparent border-b border-[#45301f] focus:border-[#d4af37] text-[#fbf7f0] text-center text-sm focus:outline-none w-full font-serif font-bold py-1 pr-6 transition-all duration-200 placeholder-[#5c4b3f]"
                        placeholder="Nom de l'aventurier"
                        maxLength={20}
                      />
                      <Edit2 className="w-3 h-3 text-[#ae8650]/70 hover:text-[#d4af37] absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                    </div>

                    {/* Simplified attributes & key metrics */}
                    <div className="space-y-3 font-mono text-xs">
                      {/* Best and Worst Stats (no verbose labels, intuitive icons) */}
                      <div className="grid grid-cols-2 gap-2 bg-[#0b0704]/60 border border-[#45301f]/30 rounded-xl p-2">
                        <div className="text-center">
                          <span className="block text-[8px] text-stone-500 uppercase tracking-wider font-bold mb-0.5">Meilleur</span>
                          <span className="font-extrabold text-emerald-400 text-[11px]">
                            ▲ {bestEntry[0].toUpperCase()} ({bestEntry[1]})
                          </span>
                        </div>
                        <div className="text-center border-l border-[#302216]/40">
                          <span className="block text-[8px] text-stone-500 uppercase tracking-wider font-bold mb-0.5">Faible</span>
                          <span className="font-extrabold text-rose-400 text-[11px]">
                            ▼ {worstEntry[0].toUpperCase()} ({worstEntry[1]})
                          </span>
                        </div>
                      </div>

                      {/* HP & PM (Clean and lightweight, side-by-side) */}
                      <div className="flex justify-around items-center pt-1 border-t border-[#302216]/30">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400">❤️</span>
                          <strong className="text-[#dfdbc7] text-[11.5px] font-bold">{hero.calculatedStats.maxHp}</strong>
                          <span className="text-[9px] text-stone-500">PV</span>
                        </div>
                        <div className="w-px h-3 bg-[#302216]/40" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-sky-400">🔮</span>
                          <strong className="text-[#dfdbc7] text-[11.5px] font-bold">{hero.calculatedStats.maxMana || 20}</strong>
                          <span className="text-[9px] text-stone-500">PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="w-full max-w-sm mt-4">
            <button
              type="button"
              onClick={handleConfirmStarterSquad}
              disabled={selectedNoviceIds.length !== 2 || loading}
              className={`w-full py-3 px-6 rounded-xl font-bold font-serif text-center text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                selectedNoviceIds.length === 2 && !loading
                  ? "bg-gradient-to-r from-[#8c5a2b] to-[#b3844a] text-[#fbf7f0] hover:from-[#cba374] hover:to-[#ae8650] shadow-[0_5px_15px_rgba(140,90,43,0.3)] border-2 border-[#d4af37]"
                  : "bg-[#1c140f] text-[#5c4b3f] border-2 border-[#2c1d15] cursor-not-allowed opacity-60"
              }`}
            >
              {loading ? (
                <span className="animate-pulse">Création du fief en cours...</span>
              ) : (
                <>
                  <span>⚔️ Fonder la Cité et Commencer</span>
                  <ChevronRight className="w-4 h-4 text-[#fdf9f2]" />
                </>
              )}
            </button>
          </div>
          
          <div className="text-[10px] text-stone-500 font-mono mt-4">
            Sélectionné : {selectedNoviceIds.length} / 2
          </div>
        </div>
      </div>
    );
  }

  if (showNamingStep) {
    return (
      <div className="min-h-screen bg-[#060403] text-[#e3dbc8] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#926430]/60 select-none">
        {/* Ambient Dark Magic Atmospheric BG Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#8c5a2b]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-950/20 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="w-full max-w-md bg-[#160f0a] border-2 border-[#5c402b] rounded-3xl p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8)] relative text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#926430]/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl border-2 border-[#d4af37]">
            <Castle className="w-8 h-8 text-[#fdf9f2]" />
          </div>

          <h2 className="text-2xl font-serif font-extrabold text-[#d4af37] tracking-wider uppercase mb-2">
            Fondez votre Royaume
          </h2>
          <p className="text-xs text-[#a89078] leading-relaxed mb-6 font-serif max-w-xs mx-auto">
            Chaque grande dynastie naît d'un simple campement. Donnez un nom glorieux à votre bastion pour inscrire vos exploits dans la légende.
          </p>

          <form onSubmit={handleConfirmCityName} className="space-y-5 text-left">
            {error && (
              <div className="p-3 bg-rose-950/40 border border-red-900/50 rounded-xl text-red-300 text-xs text-center font-sans flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] text-[#a89078] font-bold font-serif uppercase tracking-widest block mb-2">
                Nom de la Cité ralliée
              </label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    required
                    value={tempCityName}
                    onChange={(e) => setTempCityName(e.target.value)}
                    placeholder="Ex: Val-Ombré, Sables-Gourmands, IddleCity..."
                    className="bg-[#0f0a06] border-2 border-[#45301f] text-[#fbf7f0] rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:border-[#d4af37] w-full placeholder-slate-700 font-sans transition-all"
                    maxLength={25}
                  />
                  <Sword className="w-4 h-4 text-[#8c5a2b] absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const presetNames = [
                      "Val-Ombré", "Sables-Gourmands", "Fort-Dragon", "Haut-Castel", 
                      "Havre-Lune", "Roche-Brune", "Mont-Vigie", "Orée-Bois", 
                      "Fendragon", "Grand-Azur", "Château-Tempête", "Garde-Roc",
                      "Port-Soleil", "Rive-Gauche", "Sainte-Braise", "Vent-Froid"
                    ];
                    // Generate procedural names
                    const prefixes = ["Val", "Fort", "Mont", "Castel", "Haut", "Roche", "Garde", "Havre", "Port", "Bois", "Pont", "Grand", "Rive", "Fend"];
                    const suffixes = ["Ombré", "Braise", "Dragon", "Vigie", "Sable", "Clair", "Gris", "Noir", "Argent", "Doré", "Brune", "Lune", "Soleil", "Tempête", "Roc", "Azur", "Vent", "Etoile"];
                    
                    let newName = "";
                    if (Math.random() > 0.4) {
                      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
                      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
                      newName = `${prefix}-${suffix}`;
                    } else {
                      newName = presetNames[Math.floor(Math.random() * presetNames.length)];
                    }
                    setTempCityName(newName);
                    setError(null);
                  }}
                  title="Générer un nom aléatoire"
                  className="px-3.5 bg-[#20150d] hover:bg-[#332215] border-2 border-[#5c402b] hover:border-[#d4af37] text-[#d4af37] rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95 shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] text-[#8c5a2b] font-medium block mt-1.5 ml-1">
                La cité commencera avec une Cabane de Niveau 1 et des provisions de survie.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#8c5a2b] to-[#b3844a] text-[#fbf7f0] hover:from-[#cba374] hover:to-[#ae8650] shadow-[0_5px_15px_rgba(140,90,43,0.3)] border-2 border-[#d4af37] py-3.5 px-4 rounded-xl font-bold font-serif text-center text-sm transition-all duration-200 cursor-pointer w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Édification des fondations...</span>
              ) : (
                <>
                  <span>⚔️ Fonder la Cité</span>
                  <ChevronRight className="w-4 h-4 text-[#fdf9f2]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070504] text-[#e3dbc8] flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-[#926430]/60 select-none">
      {/* Immersive Dark-Fantasy Magic Backdrops */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-red-950/15 rounded-full blur-[110px] pointer-events-none animate-pulse animate-duration-5000" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#ae8650]/5 rounded-full blur-[130px] pointer-events-none animate-pulse animate-duration-3000" />

      {/* Decorative corners for that D&D feel */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#5c402b]/40 pointer-events-none hidden sm:block" />
      <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#5c402b]/40 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#5c402b]/40 pointer-events-none hidden sm:block" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#5c402b]/40 pointer-events-none hidden sm:block" />

      <div className="w-full max-w-sm bg-[#160f0a] border-2 border-[#5c402b] rounded-3xl p-7 shadow-[0_15px_40px_rgba(0,0,0,0.85)] relative overflow-hidden">
        {/* Subtle interior glow */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#926430]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

        {/* Dynamic game crest logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-[#ae8650] via-[#86592e] to-[#462d16] rounded-xl flex items-center justify-center mx-auto shadow-md border-2 border-[#d4af37] mb-3">
            <span className="text-2xl shadow-sm">🏰</span>
          </div>
          <h1 className="text-xl font-bold font-serif leading-none tracking-widest text-[#d4af37] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            IddleCityDonjon
          </h1>
          <span className="text-[9px] uppercase tracking-widest text-[#a89078] font-bold font-mono mt-1 block">
            {authMode === "login" ? "Jeu Incrémental & Exploration de Donjon" : "Création d'un Nouveau Compte Souverain"}
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/30 border border-red-900/50 rounded-xl text-red-300 text-xs text-center font-sans flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-[10px] text-[#a89078] font-bold font-serif uppercase tracking-wider block mb-1">
              Adresse E-mail
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="souverain@iddlecity.fr"
                className="bg-[#0f0a06] border border-[#5c402b] text-[#dfdbc7] rounded-xl px-3 py-2.5 pl-10 text-xs focus:outline-none focus:border-[#d4af37] w-full placeholder-slate-700 font-sans transition-colors"
              />
              <Mail className="w-3.5 h-3.5 text-[#5c402b] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#a89078] font-bold font-serif uppercase tracking-wider block mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0f0a06] border border-[#5c402b] text-[#dfdbc7] rounded-xl px-3 py-2.5 pl-10 text-xs focus:outline-none focus:border-[#d4af37] w-full placeholder-slate-700 font-sans transition-colors"
                minLength={6}
              />
              <Lock className="w-3.5 h-3.5 text-[#5c402b] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {authMode === "signup" && (
            <div>
              <label className="text-[10px] text-[#a89078] font-bold font-serif uppercase tracking-wider block mb-1">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0f0a06] border border-[#5c402b] text-[#dfdbc7] rounded-xl px-3 py-2.5 pl-10 text-xs focus:outline-none focus:border-[#d4af37] w-full placeholder-slate-700 font-sans transition-colors"
                  minLength={6}
                />
                <Lock className="w-3.5 h-3.5 text-[#5c402b] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#8c5a2b] to-[#b3844a] text-[#fbf7f0] hover:from-[#cba374] hover:to-[#ae8650] shadow-[0_3px_10px_rgba(140,90,43,0.2)] border border-[#d4af37] py-2.5 px-4 rounded-xl font-serif font-bold text-center text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Incantation en cours...</span>
            ) : (
              <>
                <span>⚔️ {authMode === "login" ? "Entrer dans la Cité" : "Créer mon Compte Souverain"}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#fdf9f2]" />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-3 items-center">
          <div className="flex-grow border-t border-[#5c402b]/20"></div>
          <span className="flex-shrink mx-4 text-[9px] text-[#a89078] uppercase tracking-widest font-mono">OU</span>
          <div className="flex-grow border-t border-[#5c402b]/20"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full bg-[#1e140d] hover:bg-[#2e2015] border border-[#5c402b] text-[#dfdbc7] hover:text-[#fbf7f0] py-2.5 px-4 rounded-xl text-center text-xs font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.63-.19-1.18-.54-1.66-.41z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>S'identifier avec Google</span>
        </button>

        <div className="mt-5 pt-4 border-t border-[#5c402b]/25 text-center text-[11px] font-sans">
          {authMode === "login" ? (
            <p className="text-[#a89078]">
              Nouveau prélat souverain ?{" "}
              <button
                onClick={() => {
                  setAuthMode("signup");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="text-[#d4af37] duration-150 transition-colors hover:text-[#cba374] font-bold cursor-pointer underline ml-1"
              >
                Créez une dynastie !
              </button>
            </p>
          ) : (
            <p className="text-[#a89078]">
              Déjà seigneur d'un domaine ?{" "}
              <button
                onClick={() => {
                  setAuthMode("login");
                  setConfirmPassword("");
                  setError(null);
                }}
                className="text-[#d4af37] duration-150 transition-colors hover:text-[#cba374] font-bold cursor-pointer underline ml-1"
              >
                Connectez-vous ici
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
