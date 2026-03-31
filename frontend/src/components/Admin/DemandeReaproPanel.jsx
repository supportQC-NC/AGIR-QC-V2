// src/components/Admin/DemandeReaproPanel.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  HiSwitchHorizontal, HiCheck, HiExclamation, HiUser,
  HiClock, HiChevronDown, HiChevronUp, HiQrcode,
  HiMinus, HiPlus, HiBan, HiArrowRight, HiLocationMarker,
} from "react-icons/hi";
import {
  useGetDemandesReapproQuery,
  usePrendreEnChargeDemandeMutation,
  useScanLigneDemandeMutation,
  useRelacherDemandeMutation,
  useTraiterLigneDemandeMutation,
} from "../../slices/demandeReapproApiSlice";
import "./DemandeReapproPanel.css";

const PRIO_CONFIG = {
  critique: { label: "CRITIQUE", emoji: "🔴" },
  urgent: { label: "URGENT", emoji: "🟠" },
  normal: { label: "Normal", emoji: "🔵" },
};

const DemandesReapproPanel = ({ entrepriseId, mappingEntrepots = {}, onPriseEnCharge }) => {
  const [expandedDemande, setExpandedDemande] = useState(null);
  const [activeDemande, setActiveDemande] = useState(null);
  const [selectedLigneId, setSelectedLigneId] = useState(null);
  const [scanValue, setScanValue] = useState("");
  const [scanQte, setScanQte] = useState(1);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");
  const scanInputRef = useRef(null);
  const articleInfoRef = useRef(null);

  const { data: dataAttente, refetch: refetchAttente } = useGetDemandesReapproQuery(
    { entrepriseId, status: "en_attente" },
    { skip: !entrepriseId, pollingInterval: 30000 }
  );
  const { data: dataEnCours, refetch: refetchEnCours } = useGetDemandesReapproQuery(
    { entrepriseId, status: "en_cours" },
    { skip: !entrepriseId, pollingInterval: 30000 }
  );

  const [prendreEnCharge, { isLoading: loadingPrise }] = usePrendreEnChargeDemandeMutation();
  const [scanLigne, { isLoading: loadingScan }] = useScanLigneDemandeMutation();
  const [relacher, { isLoading: loadingRelacher }] = useRelacherDemandeMutation();
  const [traiterLigne] = useTraiterLigneDemandeMutation();

  const demandesAttente = dataAttente?.demandes || [];
  const demandesEnCours = dataEnCours?.demandes || [];

  // Auto-select première ligne en attente
  useEffect(() => {
    if (activeDemande) {
      const premiereLigne = activeDemande.lignes?.find((l) => l.status === "en_attente");
      if (premiereLigne) {
        setSelectedLigneId(premiereLigne._id);
        setScanQte(premiereLigne.quantiteDemandee);
      } else {
        setSelectedLigneId(null);
      }
    }
  }, [activeDemande]);

  // Focus scan SANS scroll (évite le jump sur mobile)
  useEffect(() => {
    if (selectedLigneId && scanInputRef.current) {
      setTimeout(() => {
        scanInputRef.current?.focus({ preventScroll: true });
      }, 200);
    }
  }, [selectedLigneId]);

  useEffect(() => {
    if (scanSuccess) { const t = setTimeout(() => setScanSuccess(""), 3000); return () => clearTimeout(t); }
  }, [scanSuccess]);
  useEffect(() => {
    if (scanError) { const t = setTimeout(() => setScanError(""), 5000); return () => clearTimeout(t); }
  }, [scanError]);

  const refetchAll = () => { refetchAttente(); refetchEnCours(); };

  const handlePrendreEnCharge = async (demandeId) => {
    try {
      const result = await prendreEnCharge(demandeId).unwrap();
      setActiveDemande(result.demande);
      setScanValue(""); setScanError(""); setScanSuccess("");
      refetchAll();
    } catch (err) { setScanError(err?.data?.message || "Erreur"); }
  };

  const handleRelacher = async () => {
    if (!activeDemande) return;
    if (!window.confirm("Relâcher cette demande ?")) return;
    try {
      await relacher(activeDemande._id).unwrap();
      setActiveDemande(null); setSelectedLigneId(null);
      refetchAll();
    } catch (err) { setScanError(err?.data?.message || "Erreur"); }
  };

  const handleSelectLigne = (ligne) => {
    if (ligne.status !== "en_attente") return;
    setSelectedLigneId(ligne._id);
    setScanQte(ligne.quantiteDemandee);
    setScanValue(""); setScanError("");
  };

  const handleScan = async (e) => {
    e?.preventDefault();
    if (!scanValue.trim() || !activeDemande || !selectedLigneId) return;
    setScanError("");

    try {
      const result = await scanLigne({
        demandeId: activeDemande._id,
        ligneId: selectedLigneId,
        code: scanValue.trim(),
        quantiteTraitee: scanQte,
      }).unwrap();

      setScanSuccess(`✅ ${result.ligneScanResult.nart} — ${result.ligneScanResult.quantiteTraitee} unité(s)`);
      setScanValue("");
      setActiveDemande(result.demande);

      if (result.isComplete) {
        setTimeout(() => {
          setActiveDemande(null); setSelectedLigneId(null);
          setScanSuccess("🎉 Demande traitée !");
          refetchAll();
          if (onPriseEnCharge) onPriseEnCharge(result);
        }, 1000);
      }
    } catch (err) {
      setScanError(err?.data?.message || "Code incorrect");
      setScanValue("");
      setTimeout(() => scanInputRef.current?.focus({ preventScroll: true }), 100);
    }
  };

  const handleIgnorerLigne = async (ligneId) => {
    if (!activeDemande) return;
    const note = window.prompt("Raison :", "Article introuvable");
    if (note === null) return;
    try {
      const result = await traiterLigne({
        demandeId: activeDemande._id, ligneId,
        action: "ignore", noteAgent: note || "Ignoré", quantiteTraitee: 0,
      }).unwrap();
      setActiveDemande(result);
      refetchAll();
    } catch (err) { setScanError(err?.data?.message || "Erreur"); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-";

  // ═══════════════════════════════════════════
  // MODE GUIDÉ
  // ═══════════════════════════════════════════
  if (activeDemande) {
    const lignesAttente = activeDemande.lignes?.filter((l) => l.status === "en_attente") || [];
    const lignesFaites = activeDemande.lignes?.filter((l) => l.status !== "en_attente") || [];
    const totalLignes = activeDemande.lignes?.length || 0;
    const selectedLigne = activeDemande.lignes?.find((l) => l._id === selectedLigneId);
    const prio = PRIO_CONFIG[activeDemande.priorite] || PRIO_CONFIG.normal;

    return (
      <div className="demandes-panel guided-mode">
        {/* ─── BARRE HEADER ─── */}
        <div className="drp-active-header">
          <div className="drp-active-title">
            <span className={`drp-prio-badge prio-${activeDemande.priorite}`}>{prio.emoji}</span>
            <span className="drp-ref">{activeDemande.reference}</span>
          </div>
          <div className="drp-active-progress">
            <span className="drp-progress-text">{lignesFaites.length}/{totalLignes}</span>
            <div className="drp-progress-bar">
              <div className="drp-progress-fill" style={{ width: `${(lignesFaites.length / totalLignes) * 100}%` }} />
            </div>
          </div>
          <button className="drp-btn-relacher" onClick={handleRelacher} disabled={loadingRelacher}>Relâcher</button>
        </div>

        {/* ─── MESSAGES ─── */}
        {scanSuccess && <div className="drp-msg success">{scanSuccess}</div>}
        {scanError && <div className="drp-msg error">{scanError}</div>}

        {/* ─── ZONE SCAN EN HAUT (toujours visible avec clavier) ─── */}
        {selectedLigne && (
          <div className="drp-scan-top">
            <form className="drp-scan-form" onSubmit={handleScan}>
              <div className="drp-scan-row">
                <div className="drp-scan-input-wrap">
                  <HiQrcode />
                  <input
                    ref={scanInputRef}
                    type="text"
                    placeholder="Scannez le code barre..."
                    value={scanValue}
                    onChange={(e) => setScanValue(e.target.value)}
                    autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                    enterKeyHint="go"
                  />
                </div>
                <button type="submit" className="drp-scan-ok" disabled={!scanValue.trim() || loadingScan}>
                  {loadingScan ? "..." : "OK"}
                </button>
              </div>
              <div className="drp-scan-qte-row">
                <span>Qté :</span>
                <button type="button" className="qte-btn" onClick={() => setScanQte((q) => Math.max(1, q - 1))}><HiMinus /></button>
                <input type="number" min="1" value={scanQte} onChange={(e) => setScanQte(parseInt(e.target.value) || 1)} className="drp-qte-input" />
                <button type="button" className="qte-btn" onClick={() => setScanQte((q) => q + 1)}><HiPlus /></button>
                <button type="button" className="drp-btn-skip" onClick={() => handleIgnorerLigne(selectedLigne._id)}>
                  <HiBan /> Passer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── ARTICLE À CHERCHER (juste sous le scan) ─── */}
        {selectedLigne && (
          <div className="drp-current-article" ref={articleInfoRef}>
            <div className="drp-current-label"><HiArrowRight /> Allez chercher :</div>
            <div className="drp-current-main">
              <div className="drp-current-nart">{selectedLigne.nart}</div>
              <div className="drp-current-design">{selectedLigne.designation}</div>
            </div>
            {selectedLigne.gencod && <div className="drp-current-gencod">CB : {selectedLigne.gencod}</div>}
            <div className="drp-current-bottom">
              <div className="drp-current-qte">×<strong>{selectedLigne.quantiteDemandee}</strong></div>
              <div className="drp-current-stocks">
                {["S1","S2","S3","S4","S5"].map((k) => (
                  (selectedLigne.stocksSnapshot?.[k] || 0) > 0 && (
                    <span key={k} className="drp-stock-chip">{mappingEntrepots[k] || k}: {selectedLigne.stocksSnapshot[k]}</span>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tout terminé */}
        {!selectedLigne && lignesAttente.length === 0 && (
          <div className="drp-all-done"><HiCheck /> Tous les articles ont été traités !</div>
        )}

        {/* ─── CHECKLIST ─── */}
        <div className="drp-checklist">
          <div className="drp-checklist-title">
            <HiLocationMarker /> {lignesAttente.length} restant{lignesAttente.length !== 1 ? "s" : ""} sur {totalLignes}
          </div>
          <div className="drp-checklist-list">
            {activeDemande.lignes?.map((ligne) => {
              const isSelected = ligne._id === selectedLigneId;
              const isDone = ligne.status === "traite";
              const isIgnored = ligne.status === "ignore";

              return (
                <div
                  key={ligne._id}
                  className={`drp-check-item ${isDone ? "done" : ""} ${isIgnored ? "ignored" : ""} ${isSelected ? "selected" : ""} ${!isDone && !isIgnored ? "pending" : ""}`}
                  onClick={() => !isDone && !isIgnored && handleSelectLigne(ligne)}
                >
                  <div className="drp-check-status">
                    {isDone ? <HiCheck /> : isIgnored ? <HiBan /> : <span className="drp-check-dot" />}
                  </div>
                  <div className="drp-check-info">
                    <span className="drp-check-nart">{ligne.nart}</span>
                    <span className="drp-check-design">{ligne.designation}</span>
                  </div>
                  <div className="drp-check-qte">
                    {isDone ? <span className="done-qte">✓ {ligne.quantiteTraitee}</span>
                      : isIgnored ? <span className="ignored-qte">—</span>
                      : <span>×{ligne.quantiteDemandee}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // MODE LISTE
  // ═══════════════════════════════════════════
  if (demandesAttente.length === 0 && demandesEnCours.length === 0) {
    return (
      <div className="drp-empty-panel">
        <HiCheck className="drp-empty-icon" />
        <p className="drp-empty-text">Aucune demande en attente</p>
        <p className="drp-empty-sub">Les demandes des admins apparaîtront ici</p>
      </div>
    );
  }

  const allDemandes = [...demandesEnCours, ...demandesAttente];

  return (
    <div className="demandes-panel">
      <div className="drp-header">
        <h3><HiSwitchHorizontal /> Demandes ({allDemandes.length})</h3>
      </div>
      <div className="drp-list">
        {allDemandes.map((demande) => {
          const prio = PRIO_CONFIG[demande.priorite] || PRIO_CONFIG.normal;
          const isExpanded = expandedDemande === demande._id;
          const isEnCours = demande.status === "en_cours";

          return (
            <div key={demande._id} className={`drp-card prio-border-${demande.priorite}`}>
              <div className="drp-card-header" onClick={() => setExpandedDemande(isExpanded ? null : demande._id)}>
                <div className="drp-card-left">
                  <span className={`drp-prio-badge prio-${demande.priorite}`}>{prio.emoji} {prio.label}</span>
                  <span className="drp-ref">{demande.reference}</span>
                  {demande.fournisseurNom && <span className="drp-fourn">— {demande.fournisseurNom}</span>}
                </div>
                <div className="drp-card-right">
                  {isEnCours && <span className="drp-badge-encours">En cours</span>}
                  <span className="drp-count">{demande.lignes?.length || 0} art.</span>
                  <span className="drp-date"><HiClock /> {formatDate(demande.createdAt)}</span>
                  {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                </div>
              </div>

              {isExpanded && (
                <div className="drp-card-body">
                  {demande.noteAdmin && <div className="drp-note-admin"><HiExclamation /> <span>{demande.noteAdmin}</span></div>}
                  <div className="drp-meta"><span><HiUser /> {demande.creePar?.prenom} {demande.creePar?.nom}</span></div>
                  <div className="drp-articles-preview">
                    {demande.lignes?.map((ligne, idx) => (
                      <div key={idx} className="drp-article-row">
                        <span className="drp-art-nart">{ligne.nart}</span>
                        <span className="drp-art-design">{ligne.designation}</span>
                        <span className="drp-art-qte">×{ligne.quantiteDemandee}</span>
                      </div>
                    ))}
                  </div>
                  {isEnCours ? (
                    <button className="drp-btn-reprendre" onClick={() => setActiveDemande(demande)}>
                      <HiQrcode /> Reprendre le scan
                    </button>
                  ) : (
                    <button className="drp-btn-prendre" onClick={() => handlePrendreEnCharge(demande._id)} disabled={loadingPrise}>
                      <HiQrcode /> {loadingPrise ? "..." : `Prendre en charge (${demande.lignes?.length} articles)`}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DemandesReapproPanel;