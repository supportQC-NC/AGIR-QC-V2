// src/components/DemandeReapproModal.jsx
import React, { useState, useMemo } from "react";
import {
  HiX, HiExclamation, HiSwitchHorizontal, HiCheckCircle,
  HiPaperAirplane, HiTrash, HiPlus, HiMinus,
} from "react-icons/hi";
import { useCreateDemandeReapproMutation } from "../../slices/demandeReapproApiSlice";
import "./DemandeReapproModal.css";

const PRIORITES = [
  { key: "normal", label: "Normal", color: "#06b6d4", emoji: "🔵" },
  { key: "urgent", label: "Urgent", color: "#f59e0b", emoji: "🟠" },
  { key: "critique", label: "Critique", color: "#ef4444", emoji: "🔴" },
];

/**
 * Modal pour créer une demande de réappro
 * 
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - entrepriseId: string (ObjectId)
 *  - articles: [{ NART, GENCOD, DESIGN, FOURN, S1, S2, S3, S4, S5 }]
 *  - source: "fournisseur" | "article"
 *  - fournisseurCode: string (optionnel)
 *  - fournisseurNom: string (optionnel)
 *  - mappingEntrepots: { S1: "Magasin", S2: "...", ... }
 *  - onSuccess: () => void (callback après succès)
 */
const DemandeReapproModal = ({
  isOpen,
  onClose,
  entrepriseId,
  articles = [],
  source = "manuel",
  fournisseurCode = "",
  fournisseurNom = "",
  mappingEntrepots = {},
  onSuccess,
}) => {
  const [priorite, setPriorite] = useState("normal");
  const [noteAdmin, setNoteAdmin] = useState("");
  const [lignes, setLignes] = useState(() =>
    articles.map((art) => ({
      nart: (art.NART || "").trim(),
      gencod: (art.GENCOD || "").trim(),
      designation: (art.DESIGN || "").trim(),
      fourn: (art.FOURN || "").toString().trim(),
      quantiteDemandee: 1,
      selected: true,
      stocksSnapshot: {
        S1: parseFloat(art.S1) || 0,
        S2: parseFloat(art.S2) || 0,
        S3: parseFloat(art.S3) || 0,
        S4: parseFloat(art.S4) || 0,
        S5: parseFloat(art.S5) || 0,
      },
    }))
  );

  const [createDemande, { isLoading }] = useCreateDemandeReapproMutation();

  // Recalcul quand articles changent (ex: ouverture avec nouveaux articles)
  React.useEffect(() => {
    if (isOpen) {
      setLignes(
        articles.map((art) => ({
          nart: (art.NART || "").trim(),
          gencod: (art.GENCOD || "").trim(),
          designation: (art.DESIGN || "").trim(),
          fourn: (art.FOURN || "").toString().trim(),
          quantiteDemandee: 1,
          selected: true,
          stocksSnapshot: {
            S1: parseFloat(art.S1) || 0,
            S2: parseFloat(art.S2) || 0,
            S3: parseFloat(art.S3) || 0,
            S4: parseFloat(art.S4) || 0,
            S5: parseFloat(art.S5) || 0,
          },
        }))
      );
      setPriorite("normal");
      setNoteAdmin("");
    }
  }, [isOpen, articles]);

  const selectedLignes = useMemo(() => lignes.filter((l) => l.selected), [lignes]);
  const totalQte = useMemo(() => selectedLignes.reduce((s, l) => s + l.quantiteDemandee, 0), [selectedLignes]);

  const toggleSelect = (idx) => {
    setLignes((prev) => prev.map((l, i) => (i === idx ? { ...l, selected: !l.selected } : l)));
  };

  const toggleAll = () => {
    const allSelected = lignes.every((l) => l.selected);
    setLignes((prev) => prev.map((l) => ({ ...l, selected: !allSelected })));
  };

  const updateQte = (idx, delta) => {
    setLignes((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, quantiteDemandee: Math.max(1, l.quantiteDemandee + delta) } : l
      )
    );
  };

  const setQte = (idx, val) => {
    const num = parseInt(val) || 1;
    setLignes((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, quantiteDemandee: Math.max(1, num) } : l))
    );
  };

  const removeLigne = (idx) => {
    setLignes((prev) => prev.filter((_, i) => i !== idx));
  };

  const [modalError, setModalError] = useState("");

  const handleSubmit = async () => {
    if (selectedLignes.length === 0) return;
    setModalError("");

    try {
      await createDemande({
        entrepriseId,
        source,
        fournisseurCode,
        fournisseurNom,
        priorite,
        noteAdmin,
        lignes: selectedLignes.map(({ selected, ...rest }) => rest),
      }).unwrap();

      onSuccess?.();
      onClose();
    } catch (err) {
      setModalError(err?.data?.message || "Erreur lors de la création de la demande");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="demande-modal-overlay" onClick={onClose}>
      <div className="demande-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="demande-modal-header">
          <div className="demande-modal-title">
            <HiSwitchHorizontal />
            <div>
              <h2>Demande de Réappro</h2>
              {fournisseurNom && <span className="demande-modal-sub">Fournisseur : {fournisseurNom} ({fournisseurCode})</span>}
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}><HiX /></button>
        </div>

        {/* Body */}
        <div className="demande-modal-body">
          {/* Priorité */}
          <div className="demande-section">
            <label className="demande-label">Priorité</label>
            <div className="priorite-selector">
              {PRIORITES.map((p) => (
                <button
                  key={p.key}
                  className={`priorite-btn ${priorite === p.key ? "active" : ""} prio-${p.key}`}
                  onClick={() => setPriorite(p.key)}
                >
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="demande-section">
            <label className="demande-label">Note / Commentaire (optionnel)</label>
            <textarea
              className="demande-textarea"
              placeholder="Ex: Rayon vide ce matin, réappro prioritaire..."
              value={noteAdmin}
              onChange={(e) => setNoteAdmin(e.target.value)}
              rows={2}
            />
          </div>

          {/* Articles */}
          <div className="demande-section">
            <div className="demande-articles-header">
              <label className="demande-label">Articles à réapprovisionner ({selectedLignes.length}/{lignes.length})</label>
              <button className="btn-toggle-all" onClick={toggleAll}>
                {lignes.every((l) => l.selected) ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>

            <div className="demande-articles-list">
              {lignes.map((ligne, idx) => {
                const stockTotal = Object.values(ligne.stocksSnapshot).reduce((s, v) => s + v, 0);
                return (
                  <div key={`${ligne.nart}-${idx}`} className={`demande-article-row ${ligne.selected ? "selected" : "deselected"}`}>
                    <input
                      type="checkbox"
                      checked={ligne.selected}
                      onChange={() => toggleSelect(idx)}
                      className="demande-checkbox"
                    />
                    <div className="demande-article-info">
                      <div className="demande-article-top">
                        <span className="demande-nart">{ligne.nart}</span>
                        <span className="demande-design">{ligne.designation}</span>
                      </div>
                      <div className="demande-article-stocks">
                        {["S1", "S2", "S3", "S4", "S5"].map((k) => (
                          ligne.stocksSnapshot[k] > 0 && (
                            <span key={k} className="demande-stock-chip">
                              {mappingEntrepots[k] || k}: {ligne.stocksSnapshot[k]}
                            </span>
                          )
                        ))}
                        <span className="demande-stock-total">Total: {stockTotal}</span>
                      </div>
                    </div>
                    <div className="demande-qte-control">
                      <button className="qte-btn" onClick={() => updateQte(idx, -1)} disabled={!ligne.selected}><HiMinus /></button>
                      <input
                        type="number"
                        min="1"
                        value={ligne.quantiteDemandee}
                        onChange={(e) => setQte(idx, e.target.value)}
                        className="qte-input"
                        disabled={!ligne.selected}
                      />
                      <button className="qte-btn" onClick={() => updateQte(idx, 1)} disabled={!ligne.selected}><HiPlus /></button>
                    </div>
                    <button className="btn-remove-ligne" onClick={() => removeLigne(idx)} title="Retirer"><HiTrash /></button>
                  </div>
                );
              })}

              {lignes.length === 0 && (
                <div className="demande-empty">Aucun article à réapprovisionner</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="demande-modal-footer">
          {modalError && <div style={{ flex: "1 1 100%", padding: "6px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 600, background: "rgba(239,68,68,0.12)", color: "#ef4444", marginBottom: "6px" }}>{modalError}</div>}
          <div className="demande-summary">
            <span>{selectedLignes.length} article{selectedLignes.length !== 1 ? "s" : ""}</span>
            <span className="demande-summary-sep">•</span>
            <span>{totalQte} unité{totalQte !== 1 ? "s" : ""}</span>
            <span className="demande-summary-sep">•</span>
            <span className={`demande-prio-badge prio-${priorite}`}>
              {PRIORITES.find((p) => p.key === priorite)?.emoji} {PRIORITES.find((p) => p.key === priorite)?.label}
            </span>
          </div>
          <div className="demande-footer-actions">
            <button className="btn-cancel-demande" onClick={onClose}>Annuler</button>
            <button
              className="btn-submit-demande"
              onClick={handleSubmit}
              disabled={isLoading || selectedLignes.length === 0}
            >
              <HiPaperAirplane /> {isLoading ? "Envoi..." : "Envoyer la demande"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandeReapproModal;