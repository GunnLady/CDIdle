import React, { useState } from "react";
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } from "../lib/supabase";
import {
  Cloud,
  CloudLightning,
  CloudRain,
  Database,
  Lock,
  Mail,
  RefreshCw,
  Trash2,
  LogOut,
  User,
  ShieldAlert,
  Sparkles,
  Info
} from "lucide-react";
import { Resources } from "../types";
import { formatResourceValue } from "./IconDetails";

interface AccountPanelProps {
  currentUser: any;
  isAuthLoading: boolean;
  isSyncing: boolean;
  resources: Resources;
  buildings: { [key: string]: number };
  totalCitizensCount: number;
  heroesCount: number;
  highestFloorReached: number;
  onSaveCloud: () => Promise<void>;
  onHardReset: () => Promise<void>;
  addLog: (message: string, type?: "info" | "victory" | "defeat" | "loot" | "system") => void;
  isCloudQuotaExceeded?: boolean;
}

export default function AccountPanel({
  currentUser,
  isAuthLoading,
  isSyncing,
  resources,
  buildings,
  totalCitizensCount,
  heroesCount,
  highestFloorReached,
  onSaveCloud,
  onHardReset,
  addLog,
  isCloudQuotaExceeded = false
}: AccountPanelProps) {
  // Auth Form states (only used if offline/logged out)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Danger reset confirmations
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const handleAuthSubmit = async (e: React.FormEvent) => {
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
        await signInWithEmail(email, password);
        addLog("☁️ Connexion établie avec succès ! Royaume synchronisé.", "victory");
      } else {
        await signUpWithEmail(email, password);
        addLog("☁️ Dynastie cloud créée avec succès !", "victory");
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
        frenchMessage = "Cette adresse e-mail est déjà occupée par un autre souverain.";
      } else if (err.code === "weak_password") {
        frenchMessage = "Le mot de passe est trop faible (6 caractères minimum).";
      }
      setError(frenchMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addLog("🔒 Session cloud fermée. Sauvegarde locale active.", "info");
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="bg-[#18110b] border-2 border-[#5c402b] rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#caa050] animate-spin" />
        <p className="text-xs text-[#a89078] font-mono">
          Contact des archives royales dans le Cloud en cours...
        </p>
      </div>
    );
  }

  // 1. OFFLINE PORTAL (IF LOGGED OUT)
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto bg-[#18110b] border-2 border-[#5c402b] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#926430]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#caa050] via-[#86592e] to-[#462d16] rounded-xl flex items-center justify-center mx-auto shadow-md border-2 border-[#d4af37] mb-3">
            <Cloud className="w-6 h-6 text-[#110905]" />
          </div>
          <h3 className="text-lg font-serif font-bold text-[#caa050] uppercase tracking-wide">
            Dynastie Cloud & Sync
          </h3>
          <p className="text-xs text-[#a89078] mt-1 font-sans">
            Connectez votre compte pour sauvegarder vos progrès sur le Cloud et y accéder n'importe où !
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-400 mb-4 font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#8c5a2b] font-bold block mb-1 font-mono">
              Adresse E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#5a483a]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="souverain@royaume.fr"
                className="bg-[#0f0a06] border-2 border-[#45301f] text-[#fbf7f0] rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none focus:border-[#d4af37] w-full font-serif"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#8c5a2b] font-bold block mb-1 font-mono">
              Mot de passe (6+ car.)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#5a483a]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0f0a06] border-2 border-[#45301f] text-[#fbf7f0] rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none focus:border-[#d4af37] w-full font-serif"
              />
            </div>
          </div>

          {authMode === "signup" && (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#8c5a2b] font-bold block mb-1 font-mono">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#5a483a]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#0f0a06] border-2 border-[#45301f] text-[#fbf7f0] rounded-xl pl-10 pr-3.5 py-2 text-xs focus:outline-none focus:border-[#d4af37] w-full font-serif"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-b from-[#caa050] to-[#ab813a] hover:from-[#d9b363] hover:to-[#be9348] text-[#110905] font-serif font-black text-xs uppercase tracking-widest rounded-xl border border-[#ebd7a0]/40 shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : authMode === "login" ? (
              "S'authentifier"
            ) : (
              "Créer un royaume"
            )}
          </button>
        </form>

        {/* GOOGLE AUTH POPUP DIVIDER */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-[#45301f]/60"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase tracking-widest text-[#5a483a] font-mono">Ou</span>
          <div className="flex-grow border-t border-[#45301f]/60"></div>
        </div>

        {/* GOOGLE PROVIDER POPUP */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full py-2 bg-[#120a06] border border-[#5c402b]/65 hover:bg-[#1a110a] hover:border-[#ae8650] text-[#dfdbc7] font-serif font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>🌐 Authentifier via Google</span>
        </button>

        {/* TOGGLE AUTH MODE LINK */}
        <div className="text-center mt-5">
          <button
            onClick={() => {
              setAuthMode(authMode === "login" ? "signup" : "login");
              setError(null);
            }}
            className="text-[11px] text-[#ae8650] hover:underline font-serif"
          >
            {authMode === "login"
              ? "Pas encore souverain ? Fondez une dynastie"
              : "Déjà souverain d'empire ? Connectez-vous"}
          </button>
        </div>
      </div>
    );
  }

  // 2. CONNECTED PORTAL (IF LOGGED IN)
  return (
    <div className="bg-[#18110b] border-2 border-[#5c402b] rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
      
      {/* Cloud User Profile Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#3e2917]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-center relative">
            <User className="w-5 h-5 text-emerald-400" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#18110b] animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold block font-mono">
              Souverain Cloud Actif
            </span>
            <span className="text-xs font-serif font-black text-[#dfdbc7]">
              {currentUser.email || "Utilisateur Anonyme"}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="text-[10px] font-serif font-bold text-red-400 hover:bg-red-950/20 border border-red-900/30 hover:border-red-800 px-3.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          title="Fermer la session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Fermer la session</span>
        </button>
      </div>

      {/* KINGDOM STATISTICS LOG */}
      <div className="bg-[#100a06] p-4 rounded-xl border border-[#3c291a]/80 space-y-3">
        <h4 className="text-[10px] font-bold text-[#caa050] uppercase tracking-widest font-serif flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Résumé d'exploration du Royaume</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-[#150d08]/80 p-3 rounded-lg border border-[#3a2211]/50 flex flex-col justify-between">
            <span className="text-[9px] text-[#8f8376] uppercase">Bâtiments</span>
            <span className="text-white font-serif font-bold text-base mt-1">
              {Object.values(buildings).reduce((a, b) => a + b, 0)} Lvl
            </span>
          </div>
          <div className="bg-[#150d08]/80 p-3 rounded-lg border border-[#3a2211]/50 flex flex-col justify-between">
            <span className="text-[9px] text-[#8f8376] uppercase">Citoyens</span>
            <span className="text-white font-serif font-bold text-base mt-1">
              {totalCitizensCount} Paysans
            </span>
          </div>
          <div className="bg-[#150d08]/80 p-3 rounded-lg border border-[#3a2211]/50 flex flex-col justify-between">
            <span className="text-[9px] text-[#8f8376] uppercase">Champions</span>
            <span className="text-white font-serif font-bold text-base mt-1">
              {heroesCount} Aventuriers
            </span>
          </div>
          <div className="bg-[#150d08]/80 p-3 rounded-lg border border-[#3a2211]/50 flex flex-col justify-between">
            <span className="text-[9px] text-[#8f8376] uppercase">Étage Record</span>
            <span className="text-white font-serif font-bold text-base mt-1 text-[#fbbf24]">
              Étage {highestFloorReached}
            </span>
          </div>
        </div>

        {/* Resources list */}
        <div className="pt-3 border-t border-[#3c291a]/40 text-[11px] text-[#a89078] flex flex-wrap gap-x-4 gap-y-1">
          <span>Or : <strong className="text-yellow-500 font-mono">{formatResourceValue(resources.gold)}</strong></span>
          <span>Nourriture : <strong className="text-emerald-500 font-mono">{formatResourceValue(resources.food)}</strong></span>
          <span>Bois : <strong className="text-orange-500 font-mono">{formatResourceValue(resources.wood)}</strong></span>
          <span>Pierre : <strong className="text-gray-300 font-mono">{formatResourceValue(resources.stone)}</strong></span>
          <span>Minerai : <strong className="text-purple-400 font-mono">{formatResourceValue(resources.ore)}</strong></span>
        </div>
      </div>

      {/* CLOUD MANUAL SYNCHRONIZATION ACTION */}
      <div className="space-y-3">
        {isCloudQuotaExceeded && (
          <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs text-amber-300 leading-relaxed font-sans">
            <span className="font-bold flex items-center gap-1.5 text-amber-400">
              <CloudLightning className="w-4 h-4 shrink-0 animate-pulse" />
              <span>Quota Cloud Journalier Atteint</span>
            </span>
            <p className="mt-1">
              La limite de sauvegarde cloud gratuite est atteinte pour aujourd'hui. Votre progression est <strong>automatiquement sauvegardée en toute sécurité sur votre appareil (Local Storage)</strong>, vous ne perdrez aucun progrès ! La synchronisation cloud reprendra demain.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onSaveCloud}
            disabled={isSyncing}
            className="flex-1 py-3 bg-gradient-to-b from-[#caa050] to-[#ab813a] hover:from-[#d9b363] hover:to-[#be9348] text-[#110905] font-serif font-black text-xs uppercase tracking-widest rounded-xl border border-[#ebd7a0]/40 shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synchronisation cloud...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                <span>Sauvegarder Progrès (Cloud)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* HARD RESET ZONE (DANGER RED BAR) */}
      <div className="pt-4 border-t border-[#3e2917]">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2 bg-red-950/25 hover:bg-red-950/40 border border-red-900/40 hover:border-red-800 text-red-400 text-xs font-serif font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Réinitialiser totalement le Royaume (Reset)</span>
          </button>
        ) : (
          <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl space-y-3 animate-fade-in">
            <div className="flex items-start gap-2 text-xs text-red-300 font-mono leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong>⚠️ ATTENTION !</strong> Cette action est irréversible. Vos données locales ainsi que votre sauvegarde cloud seront définitivement détruites. Vous recommencerez de zéro.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await onHardReset();
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-2 bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-serif font-black text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
              >
                Oui, TOUT supprimer !
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-[#2c1d12] hover:bg-[#3d291a] text-[#dfc3a7] border border-[#5c402b]/60 font-serif font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
