// src/screens/admin/AdminDemandesReapproScreen.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiArrowLeft, HiSwitchHorizontal, HiTrash, HiPencil, HiCheck, HiX,
  HiSearch, HiOfficeBuilding, HiPlus, HiClock, HiUser, HiExclamation,
  HiRefresh, HiBan, HiChevronDown, HiChevronUp,
} from "react-icons/hi";
import { useGetMyEntreprisesQuery } from "../../slices/entrepriseApiSlice";
import {
  useGetDemandesReapproQuery,
  useAnnulerDemandeMutation,
  useDeleteDemandeMutation,
  useMarkDemandeAsReadMutation,
  useCreateDemandeReapproMutation,
} from "../../slices/demandeReapproApiSlice";
import "./AdminDemandesReapproScreen.css";

const PRIO_CONFIG = {
  critique: { label: "Critique", emoji: "🔴", color: "#ef4444" },
  urgent: { label: "Urgent", emoji: "🟠", color: "#f59e0b" },
  normal: { label: "Normal", emoji: "🔵", color: "#06b6d4" },
};
const STATUS_CONFIG = {
  en_attente: { label: "En attente", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  en_cours: { label: "En cours", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)" },
  termine: { label: "Terminé", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  annule: { label: "Annulé", color: "#606070", bg: "rgba(96,96,112,0.1)" },
};

const AdminDemandesReapproScreen = () => {
  const navigate = useNavigate();
  const [selectedEntreprise, setSelectedEntreprise] = useState("");
  const [activeMainTab, setActiveMainTab] = useState("demandes");
  const [filterStatus, setFilterStatus] = useState("en_attente");
  const [expandedDemande, setExpandedDemande] = useState(null);
  const [msg, setMsg] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingDemande, setEditingDemande] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [modalLignes, setModalLignes] = useState([]);
  const [modalPriorite, setModalPriorite] = useState("normal");
  const [modalNote, setModalNote] = useState("");
  const [modalError, setModalError] = useState("");
  const searchTimeout = useRef(null);

  const showMsg = (text, type = "success") => { setMsg({ text, type }); setTimeout(() => setMsg(null), 4000); };

  const { data: entreprises } = useGetMyEntreprisesQuery();

  // Queries selon l'onglet actif
  const { data: dataActive, isLoading: loadingActive, refetch: refetchActive } = useGetDemandesReapproQuery(
    { entrepriseId: selectedEntreprise, status: filterStatus || undefined, limit: 100 },
    { skip: !selectedEntreprise || activeMainTab !== "demandes" }
  );
  const { data: dataHistorique, isLoading: loadingHistorique, refetch: refetchHistorique } = useGetDemandesReapproQuery(
    { entrepriseId: selectedEntreprise, status: "termine", limit: 100 },
    { skip: !selectedEntreprise || activeMainTab !== "historique" }
  );

  const [annulerDemande] = useAnnulerDemandeMutation();
  const [deleteDemandeMut] = useDeleteDemandeMutation();
  const [markAsRead] = useMarkDemandeAsReadMutation();
  const [createDemande, { isLoading: creating }] = useCreateDemandeReapproMutation();

  const demandes = activeMainTab === "demandes" ? (dataActive?.demandes || []) : (dataHistorique?.demandes || []);

  useEffect(() => { if (entreprises?.length === 1) setSelectedEntreprise(entreprises[0]._id); }, [entreprises]);

  // Search debounced
  const handleSearchArticles = useCallback(async (q) => {
    if (!q || q.trim().length < 2 || !selectedEntreprise) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/demandes-reappro/search-articles/${selectedEntreprise}?q=${encodeURIComponent(q)}`, { credentials: "include" });
      const data = await res.json();
      setSearchResults(data.articles || []);
    } catch { setSearchResults([]); }
    setSearching(false);
  }, [selectedEntreprise]);

  const onSearchChange = (val) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearchArticles(val), 300);
  };

  // Modal helpers
  const addArticle = (art) => {
    if (modalLignes.find((l) => l.nart === art.NART)) return;
    setModalLignes((prev) => [...prev, {
      nart: art.NART, gencod: art.GENCOD, designation: art.DESIGN, fourn: art.FOURN,
      quantiteDemandee: 1, stocksSnapshot: { S1: art.S1, S2: art.S2, S3: art.S3, S4: art.S4, S5: art.S5 },
    }]);
  };
  const removeLigne = (idx) => setModalLignes((prev) => prev.filter((_, i) => i !== idx));
  const updateQte = (idx, val) => {
    const num = parseInt(val) || 0;
    setModalLignes((prev) => prev.map((l, i) => i === idx ? { ...l, quantiteDemandee: Math.max(1, num) } : l));
  };

  const openCreateModal = () => {
    setEditingDemande(null); setModalLignes([]); setModalPriorite("normal"); setModalNote(""); setModalError("");
    setSearchQuery(""); setSearchResults([]); setShowModal(true);
  };
  const openEditModal = (demande) => {
    setEditingDemande(demande);
    setModalLignes(demande.lignes.map((l) => ({
      nart: l.nart, gencod: l.gencod, designation: l.designation, fourn: l.fourn,
      quantiteDemandee: l.quantiteDemandee, stocksSnapshot: l.stocksSnapshot || {},
    })));
    setModalPriorite(demande.priorite); setModalNote(demande.noteAdmin || ""); setModalError("");
    setSearchQuery(""); setSearchResults([]); setShowModal(true);
  };

  const handleSubmit = async () => {
    if (modalLignes.length === 0) return;
    setModalError("");
    try {
      if (editingDemande) { try { await deleteDemandeMut(editingDemande._id).unwrap(); } catch {} }
      await createDemande({
        entrepriseId: selectedEntreprise, source: "manuel",
        priorite: modalPriorite, noteAdmin: modalNote, lignes: modalLignes,
      }).unwrap();
      setShowModal(false);
      showMsg(editingDemande ? "Demande modifiée" : "Demande créée");
      refetchActive(); refetchHistorique();
    } catch (err) { setModalError(err?.data?.message || "Erreur lors de la création"); }
  };

  const handleAnnuler = async (id) => {
    if (!window.confirm("Annuler cette demande ?")) return;
    try { await annulerDemande(id).unwrap(); showMsg("Demande annulée"); refetchActive(); refetchHistorique(); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };

  const handleDeletePermanent = async (id) => {
    if (!window.confirm("Supprimer DÉFINITIVEMENT cette demande ?")) return;
    try { await deleteDemandeMut(id).unwrap(); showMsg("Demande supprimée"); refetchActive(); refetchHistorique(); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };

  const handleMarkRead = async (id) => { try { await markAsRead(id).unwrap(); refetchHistorique(); } catch {} };

  const formatDate = (d) => d ? new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  const selectedEntrepriseData = entreprises?.find((e) => e._id === selectedEntreprise);
  const mappingEntrepots = selectedEntrepriseData?.mappingEntrepots || { S1: "Magasin", S2: "S2", S3: "S3", S4: "S4", S5: "S5" };

  const allActiveDemandes = dataActive?.demandes || [];
  const statsCount = { en_attente: allActiveDemandes.filter((d) => d.status === "en_attente").length, en_cours: allActiveDemandes.filter((d) => d.status === "en_cours").length };

  const isReapproArticle = (art) => {
    const hasStars = (art.DESIGN || "").includes("**");
    const s1 = art.S1 || 0; const stockAutre = (art.S2||0) + (art.S3||0) + (art.S4||0) + (art.S5||0);
    if (hasStars && (s1 + stockAutre) <= 0) return false;
    return s1 === 0 && stockAutre > 0;
  };

  return (
    <div className="admin-demandes-page">
      {/* HEADER */}
      <header className="adm-header">
        <div className="adm-header-left">
          <button className="btn-back" onClick={() => navigate(-1)}><HiArrowLeft /></button>
          <HiSwitchHorizontal className="adm-header-icon" />
          <h1>Demandes de Réappro</h1>
        </div>
        <div className="adm-header-right">
          <select className="adm-entreprise-select" value={selectedEntreprise} onChange={(e) => { setSelectedEntreprise(e.target.value); setExpandedDemande(null); }}>
            <option value="">— Entreprise —</option>
            {entreprises?.map((e) => (<option key={e._id} value={e._id}>{e.trigramme} - {e.nomComplet}</option>))}
          </select>
          {selectedEntreprise && <button className="btn-new-demande" onClick={openCreateModal}><HiPlus /> Nouvelle demande</button>}
        </div>
      </header>

      {!selectedEntreprise ? (
        <div className="adm-placeholder"><HiOfficeBuilding /><p>Sélectionnez une entreprise</p></div>
      ) : (
        <>
          {/* ONGLETS */}
          <div className="adm-main-tabs">
            <button className={`adm-main-tab ${activeMainTab === "demandes" ? "active" : ""}`} onClick={() => { setActiveMainTab("demandes"); setFilterStatus("en_attente"); }}>
              <HiSwitchHorizontal /> Demandes
              {(statsCount.en_attente + statsCount.en_cours) > 0 && <span className="adm-tab-badge">{statsCount.en_attente + statsCount.en_cours}</span>}
            </button>
            <button className={`adm-main-tab ${activeMainTab === "historique" ? "active" : ""}`} onClick={() => setActiveMainTab("historique")}>
              <HiClock /> Historique
            </button>
          </div>

          {/* MESSAGE */}
          {msg && <div className={`adm-msg ${msg.type}`}>{msg.text}</div>}

          {/* SOUS-FILTRES */}
          {activeMainTab === "demandes" && (
            <div className="adm-sub-filters">
              {[{ key: "en_attente", label: "En attente", count: statsCount.en_attente }, { key: "en_cours", label: "En cours", count: statsCount.en_cours }, { key: "", label: "Tous", count: statsCount.en_attente + statsCount.en_cours }].map((f) => (
                <button key={f.key} className={`adm-filter-btn ${filterStatus === f.key ? "active" : ""}`} onClick={() => setFilterStatus(f.key)}>
                  {f.label} {f.count > 0 && <span>({f.count})</span>}
                </button>
              ))}
              <button className="adm-btn-refresh" onClick={() => refetchActive()} title="Rafraîchir"><HiRefresh /></button>
            </div>
          )}

          {/* LISTE */}
          {(activeMainTab === "demandes" ? loadingActive : loadingHistorique) ? (
            <div className="adm-loading">Chargement...</div>
          ) : demandes.length === 0 ? (
            <div className="adm-empty">{activeMainTab === "historique" ? "Aucun historique" : "Aucune demande"}</div>
          ) : (
            <div className="adm-list">
              {demandes.map((demande) => {
                const prio = PRIO_CONFIG[demande.priorite] || PRIO_CONFIG.normal;
                const statusConf = STATUS_CONFIG[demande.status] || STATUS_CONFIG.en_attente;
                const isExpanded = expandedDemande === demande._id;
                const lignesTraitees = demande.lignes?.filter((l) => l.status === "traite").length || 0;
                const lignesIgnorees = demande.lignes?.filter((l) => l.status === "ignore").length || 0;
                const totalLignes = demande.lignes?.length || 0;
                const isNew = demande.status === "termine" && !demande.notifLueParAdmin;
                const canEdit = demande.status === "en_attente";
                const canAnnuler = demande.status === "en_attente" || demande.status === "en_cours";

                return (
                  <div key={demande._id} className={`adm-card ${isNew ? "unread" : ""}`}>
                    <div className="adm-card-header" onClick={() => { setExpandedDemande(isExpanded ? null : demande._id); if (isNew) handleMarkRead(demande._id); }}>
                      <div className="adm-card-left">
                        <span className={`adm-prio prio-${demande.priorite}`}>{prio.emoji}</span>
                        <span className="adm-ref">{demande.reference}</span>
                        <span className="adm-status-badge" style={{ background: statusConf.bg, color: statusConf.color }}>{statusConf.label}</span>
                        {isNew && <span className="adm-badge-new">Nouveau</span>}
                      </div>
                      <div className="adm-card-right">
                        {demande.fournisseurNom && <span className="adm-fourn">{demande.fournisseurNom}</span>}
                        <span className="adm-card-count">{lignesTraitees + lignesIgnorees}/{totalLignes}</span>
                        <span className="adm-card-date"><HiClock /> {formatDate(demande.createdAt)}</span>
                        {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="adm-card-body">
                        <div className="adm-card-meta">
                          <span><HiUser /> {demande.creePar?.prenom} {demande.creePar?.nom}</span>
                          {demande.assigneA && <span>Agent : {demande.assigneA.prenom} {demande.assigneA.nom}</span>}
                          <span>Source : {demande.source}</span>
                          {demande.termineAt && <span>Terminée : {formatDate(demande.termineAt)}</span>}
                        </div>
                        {demande.noteAdmin && <div className="adm-card-note"><HiExclamation /> {demande.noteAdmin}</div>}

                        <div className="adm-card-lignes">
                          <table className="adm-lignes-table">
                            <thead><tr>
                              <th>NART</th><th>Désignation</th>
                              <th className="text-center">{mappingEntrepots.S1 || "S1"}</th>
                              <th className="text-center">{mappingEntrepots.S2 || "S2"}</th>
                              <th className="text-center">{mappingEntrepots.S3 || "S3"}</th>
                              <th className="text-center">Dem.</th><th className="text-center">Traité</th><th>Statut</th>
                            </tr></thead>
                            <tbody>
                              {demande.lignes?.map((ligne) => (
                                <tr key={ligne._id} className={`adm-ligne-row ${ligne.status}`}>
                                  <td className="adm-td-nart">{ligne.nart}</td>
                                  <td className="adm-td-design">{ligne.designation}</td>
                                  <td className="adm-td-stock">{ligne.stocksSnapshot?.S1 ?? "-"}</td>
                                  <td className="adm-td-stock">{ligne.stocksSnapshot?.S2 ?? "-"}</td>
                                  <td className="adm-td-stock">{ligne.stocksSnapshot?.S3 ?? "-"}</td>
                                  <td className="adm-td-num">{ligne.quantiteDemandee}</td>
                                  <td className="adm-td-num">{ligne.status === "traite" ? ligne.quantiteTraitee : "-"}</td>
                                  <td>
                                    {ligne.status === "traite" && <span className="adm-ligne-badge done"><HiCheck /> Traité</span>}
                                    {ligne.status === "ignore" && <span className="adm-ligne-badge ignored"><HiBan /> Ignoré</span>}
                                    {ligne.status === "en_attente" && <span className="adm-ligne-badge pending">En attente</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="adm-card-actions">
                          {canEdit && <button className="adm-btn-edit" onClick={(e) => { e.stopPropagation(); openEditModal(demande); }}><HiPencil /> Modifier</button>}
                          {canAnnuler && <button className="adm-btn-annuler" onClick={(e) => { e.stopPropagation(); handleAnnuler(demande._id); }}><HiBan /> Annuler</button>}
                          <button className="adm-btn-delete" onClick={(e) => { e.stopPropagation(); handleDeletePermanent(demande._id); }}><HiTrash /> Supprimer</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════ MODAL ══════ */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2><HiPlus /> {editingDemande ? "Modifier la demande" : "Nouvelle demande"}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}><HiX /></button>
            </div>
            <div className="adm-modal-body">
              {modalError && <div className="adm-modal-error">{modalError}</div>}

              <div className="adm-modal-section">
                <label>Priorité</label>
                <div className="adm-prio-selector">
                  {Object.entries(PRIO_CONFIG).map(([key, conf]) => (
                    <button key={key} className={`adm-prio-btn ${modalPriorite === key ? "active" : ""} prio-${key}`} onClick={() => setModalPriorite(key)}>{conf.emoji} {conf.label}</button>
                  ))}
                </div>
              </div>

              <div className="adm-modal-section">
                <label>Note (optionnel)</label>
                <textarea value={modalNote} onChange={(e) => setModalNote(e.target.value)} placeholder="Instructions pour l'agent..." rows={2} />
              </div>

              <div className="adm-modal-section">
                <label>Rechercher un article</label>
                <div className="adm-search-wrap">
                  <HiSearch />
                  <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="NART, code barre ou désignation..." autoComplete="off" />
                  {searching && <span className="adm-search-spinner" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="adm-search-results">
                    {searchResults.map((art) => {
                      const alreadyAdded = modalLignes.some((l) => l.nart === art.NART);
                      const isReappro = isReapproArticle(art);
                      return (
                        <div key={art.NART} className={`adm-search-row ${alreadyAdded ? "added" : ""}`} onClick={() => !alreadyAdded && addArticle(art)}>
                          <div className="adm-sr-main">
                            <div className="adm-sr-top">
                              <span className="adm-sr-nart">{art.NART}</span>
                              {isReappro && <span className="adm-sr-reappro-badge">Réappro</span>}
                              <span className="adm-sr-design">{art.DESIGN}</span>
                            </div>
                            <div className="adm-sr-stocks">
                              {["S1","S2","S3","S4","S5"].map((k) => (
                                <span key={k} className={`adm-sr-stock-chip ${art[k] > 0 ? "positive" : "zero"}`}>{mappingEntrepots[k] || k}: {art[k]}</span>
                              ))}
                            </div>
                          </div>
                          {alreadyAdded ? <span className="adm-sr-check"><HiCheck /></span> : <span className="adm-sr-add"><HiPlus /></span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {modalLignes.length > 0 && (
                <div className="adm-modal-section">
                  <label>Articles sélectionnés ({modalLignes.length})</label>
                  <div className="adm-selected-lignes">
                    {modalLignes.map((ligne, idx) => {
                      const stockTotal = Object.values(ligne.stocksSnapshot || {}).reduce((s, v) => s + (v || 0), 0);
                      return (
                        <div key={ligne.nart} className="adm-sel-ligne">
                          <div className="adm-sel-info">
                            <div className="adm-sel-top"><span className="adm-sel-nart">{ligne.nart}</span><span className="adm-sel-design">{ligne.designation}</span></div>
                            <div className="adm-sel-stocks">
                              {["S1","S2","S3","S4","S5"].map((k) => ((ligne.stocksSnapshot?.[k] || 0) > 0 && <span key={k} className="adm-sel-stock">{mappingEntrepots[k] || k}: {ligne.stocksSnapshot[k]}</span>))}
                              <span className="adm-sel-total">Total: {stockTotal}</span>
                            </div>
                          </div>
                          <div className="adm-sel-qte"><label>Qté</label><input type="number" min="1" value={ligne.quantiteDemandee} onChange={(e) => updateQte(idx, e.target.value)} className="adm-qte-input" /></div>
                          <button className="adm-sel-remove" onClick={() => removeLigne(idx)}><HiTrash /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="adm-modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
              <button className="btn-create" onClick={handleSubmit} disabled={creating || modalLignes.length === 0}>
                <HiSwitchHorizontal /> {creating ? "Envoi..." : editingDemande ? `Modifier (${modalLignes.length} art.)` : `Créer (${modalLignes.length} art.)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDemandesReapproScreen;