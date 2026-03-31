// src/screens/user/UserReappro.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  HiQrcode, HiOfficeBuilding, HiTrash, HiPencil, HiCheck, HiX,
  HiDownload, HiRefresh, HiPlus, HiSwitchHorizontal, HiServer,
  HiDesktopComputer, HiFolder, HiCube, HiLocationMarker, HiExclamation,
  HiShare, HiUser, HiClock,
} from "react-icons/hi";
import { useGetMyEntreprisesQuery } from "../../slices/entrepriseApiSlice";
import {
  useCreateReapproMutation, useGetReapproEnCoursQuery,
  useScanArticleReapproMutation, useAddLigneReapproMutation,
  useUpdateLigneReapproMutation, useDeleteLigneReapproMutation,
  useExportReapproMutation, useDownloadReapproMutation, useDeleteReapproMutation,
  useUpdateTitreReapproMutation, usePartagerReapproMutation,
  useGetReapproPartagesQuery, useReprendreReapproMutation,
} from "../../slices/reapproApiSlice";
import { useCountPendingDemandesQuery } from "../../slices/demandeReapproApiSlice";
import DemandesReapproPanel from "../../components/Admin/DemandeReaproPanel";
import "./UserReappro.css";

const UserReappro = () => {
  const [selectedEntreprise, setSelectedEntreprise] = useState("");
  const [scanValue, setScanValue] = useState("");
  const [currentArticle, setCurrentArticle] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [quantite, setQuantite] = useState("");
  const [editingLigne, setEditingLigne] = useState(null);
  const [editQuantite, setEditQuantite] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [nomReappro, setNomReappro] = useState("");
  const [message, setMessage] = useState(null);
  const [exportMode, setExportMode] = useState("server");
  const [cheminServeur, setCheminServeur] = useState("");
  const [activeTab, setActiveTab] = useState("scan");

  const scanInputRef = useRef(null);
  const quantiteInputRef = useRef(null);

  // Queries
  const { data: entreprises, isLoading: loadingEntreprises } = useGetMyEntreprisesQuery();
  const { data: reappro, refetch: refetchReappro } = useGetReapproEnCoursQuery(selectedEntreprise, { skip: !selectedEntreprise });
  const { data: pendingData } = useCountPendingDemandesQuery(selectedEntreprise, { skip: !selectedEntreprise, pollingInterval: 30000 });
  const { data: partages, refetch: refetchPartages } = useGetReapproPartagesQuery(selectedEntreprise, { skip: !selectedEntreprise });

  const pendingCount = pendingData?.count || 0;
  const pendingCritique = pendingData?.critique || 0;
  const partagesCount = partages?.length || 0;

  // Mutations
  const [createReappro] = useCreateReapproMutation();
  const [scanArticle, { isLoading: scanning }] = useScanArticleReapproMutation();
  const [addLigne, { isLoading: adding }] = useAddLigneReapproMutation();
  const [updateLigne] = useUpdateLigneReapproMutation();
  const [deleteLigne] = useDeleteLigneReapproMutation();
  const [exportReappro, { isLoading: exporting }] = useExportReapproMutation();
  const [downloadReappro, { isLoading: downloading }] = useDownloadReapproMutation();
  const [deleteReappro] = useDeleteReapproMutation();
  const [updateTitre] = useUpdateTitreReapproMutation();
  const [partagerReappro] = usePartagerReapproMutation();
  const [reprendreReappro] = useReprendreReapproMutation();

  useEffect(() => { if (entreprises?.length === 1) setSelectedEntreprise(entreprises[0]._id); }, [entreprises]);
  useEffect(() => { if (reappro?.entreprise?.cheminExportInventaire) setCheminServeur(reappro.entreprise.cheminExportInventaire); }, [reappro]);

  useEffect(() => {
    if (selectedEntreprise && reappro && !currentArticle && !showConfirmation && activeTab === "scan" && scanInputRef.current) {
      scanInputRef.current.focus();
      setTimeout(() => { if (document.activeElement === scanInputRef.current) { scanInputRef.current.blur(); setTimeout(() => scanInputRef.current?.focus(), 50); } }, 0);
    }
  }, [selectedEntreprise, reappro, currentArticle, showConfirmation, activeTab]);

  const showMsg = (text, type = "info") => { setMessage({ text, type }); setTimeout(() => setMessage(null), 4000); };

  // ─── HANDLERS ───
  const handleScan = async (e) => {
    e?.preventDefault();
    if (!scanValue.trim() || !reappro) return;
    try {
      const result = await scanArticle({ reapproId: reappro._id, code: scanValue.trim() }).unwrap();
      setCurrentArticle(result.articleInfo); setShowConfirmation(true); setScanValue("");
      if (result.articleInfo.isRenvoi) showMsg(`🔄 Renvoi: ${result.articleInfo.articleOriginal?.nart} → ${result.articleInfo.nart}`, "warning");
    } catch (err) { showMsg(err?.data?.message || "Erreur de scan", "error"); setScanValue(""); }
  };

  const handleEntrepriseChange = (e) => { setSelectedEntreprise(e.target.value); setCurrentArticle(null); setShowConfirmation(false); setScanValue(""); setQuantite(""); setActiveTab("scan"); };
  const handleStartReappro = async () => {
    if (!selectedEntreprise) return;
    try { await createReappro({ entrepriseId: selectedEntreprise }).unwrap(); refetchReappro(); showMsg("Réappro démarré", "success"); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };
  const handleConfirmReappro = (confirm) => {
    if (confirm) { setShowConfirmation(false); setQuantite(""); setTimeout(() => quantiteInputRef.current?.focus(), 100); }
    else { setCurrentArticle(null); setShowConfirmation(false); setQuantite(""); setTimeout(() => scanInputRef.current?.focus(), 100); }
  };
  const handleAddLigne = async (e) => {
    e.preventDefault(); if (!currentArticle || !quantite || parseInt(quantite) < 1) return;
    try {
      await addLigne({ reapproId: reappro._id, nart: currentArticle.nart, gencod: currentArticle.gencod, designation: currentArticle.designation, refer: currentArticle.refer, quantite: parseInt(quantite), stocks: currentArticle.stocks, isUnknown: currentArticle.isUnknown, isRenvoi: currentArticle.isRenvoi, articleOriginal: currentArticle.articleOriginal }).unwrap();
      setCurrentArticle(null); setQuantite(""); refetchReappro(); showMsg("Article ajouté", "success"); setTimeout(() => scanInputRef.current?.focus(), 100);
    } catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };
  const handleCancelScan = () => { setCurrentArticle(null); setShowConfirmation(false); setQuantite(""); setScanValue(""); setTimeout(() => scanInputRef.current?.focus(), 100); };
  const handleEditLigne = (ligne) => { setEditingLigne(ligne._id); setEditQuantite(ligne.quantite.toString()); };
  const handleSaveEdit = async (ligneId) => {
    if (!editQuantite || parseInt(editQuantite) < 1) return;
    try { await updateLigne({ reapproId: reappro._id, ligneId, quantite: parseInt(editQuantite) }).unwrap(); setEditingLigne(null); setEditQuantite(""); refetchReappro(); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };
  const handleDeleteLigne = async (ligneId) => {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    try { await deleteLigne({ reapproId: reappro._id, ligneId }).unwrap(); refetchReappro(); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };
  const handleExport = async () => {
    if (!nomReappro.trim()) { showMsg("Nom requis", "error"); return; }
    try {
      if (exportMode === "download") {
        const contenu = await downloadReappro({ reapproId: reappro._id, nomReappro: nomReappro.trim() }).unwrap();
        const nomFichier = `stock.dat reappro ${nomReappro.trim().replace(/[^a-zA-Z0-9_\- ]/g, "_")}`;
        const blob = new Blob([contenu], { type: "text/plain;charset=utf-8" }); const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = nomFichier; document.body.appendChild(link); link.click(); document.body.removeChild(link); window.URL.revokeObjectURL(url);
        showMsg(`Téléchargé: ${nomFichier}`, "success");
      } else {
        const result = await exportReappro({ reapproId: reappro._id, nomReappro: nomReappro.trim(), cheminDestination: cheminServeur.trim() }).unwrap();
        showMsg(`Enregistré: ${result.fichier.chemin}`, "success");
      }
      setShowExportModal(false); setNomReappro(""); refetchReappro();
    } catch (err) { showMsg(err?.data?.message || "Erreur d'export", "error"); }
  };
  const handleCancelReappro = async () => {
    if (!window.confirm("Annuler et supprimer ce réappro ?")) return;
    try { await deleteReappro(reappro._id).unwrap(); refetchReappro(); showMsg("Réappro annulé", "success"); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };

  // ─── PARTAGE ───
  const handlePartager = async () => {
    if (!reappro) return;
    const titre = window.prompt("Donnez un titre à ce réappro (pour que les autres sachent de quoi il s'agit) :", reappro.titre || "");
    if (titre === null) return;
    if (!titre.trim()) { showMsg("Un titre est requis pour partager", "error"); return; }
    try {
      await partagerReappro({ reapproId: reappro._id, titre: titre.trim() }).unwrap();
      showMsg("Réappro partagé — les autres agents peuvent le reprendre", "success");
      refetchReappro(); refetchPartages();
    } catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };

  const handleReprendre = async (reapproId) => {
    try {
      await reprendreReappro(reapproId).unwrap();
      showMsg("Réappro repris — vous pouvez continuer", "success");
      setActiveTab("scan"); refetchReappro(); refetchPartages();
    } catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };

  const handleEditTitre = async () => {
    if (!reappro) return;
    const titre = window.prompt("Titre du réappro :", reappro.titre || "");
    if (titre === null) return;
    try { await updateTitre({ reapproId: reappro._id, titre: titre.trim() }).unwrap(); refetchReappro(); }
    catch (err) { showMsg(err?.data?.message || "Erreur", "error"); }
  };

  const openExportModal = () => {
    const nom = window.prompt("Nom du réappro:", reappro?.titre || "");
    if (nom === null) return;
    if (!nom.trim()) { showMsg("Nom requis", "error"); return; }
    setNomReappro(nom.trim()); setShowExportModal(true); setExportMode("server");
    setCheminServeur(reappro?.entreprise?.cheminExportInventaire || "\\\\192.168.0.250\\Rcommun\\STOCK\\collect_sec");
  };
  const handleEditChemin = () => { const c = window.prompt("Chemin de destination:", cheminServeur); if (c !== null) setCheminServeur(c); };

  const getStockLabel = (k) => (currentArticle?.stocksLabels || reappro?.entreprise?.mappingEntrepots || {})[k] || k;
  const getTotalStock = (s) => s ? (s.S1||0)+(s.S2||0)+(s.S3||0)+(s.S4||0)+(s.S5||0) : 0;

  if (loadingEntreprises) return <div className="reappro-loading">Chargement...</div>;
  if (!entreprises || entreprises.length === 0) return <div className="reappro-empty"><HiOfficeBuilding /><p>Aucune entreprise</p></div>;

  return (
    <div className="reappro-screen">
      {/* Header */}
      <div className="reappro-header">
        <h1><HiRefresh /> Réapprovisionnement</h1>
        <div className="entreprise-selector">
          <HiOfficeBuilding />
          <select value={selectedEntreprise} onChange={handleEntrepriseChange} disabled={reappro?.status === "en_cours"}>
            <option value="">-- Entreprise --</option>
            {entreprises?.map((e) => (<option key={e._id} value={e._id}>{e.trigramme} - {e.nomComplet}</option>))}
          </select>
        </div>
      </div>

      {message && <div className={`reappro-message ${message.type}`}>{message.text}</div>}

      {/* Onglets — visibles dès qu'une entreprise est sélectionnée */}
      {selectedEntreprise && (
        <div className="reappro-tabs">
          <button className={`reappro-tab ${activeTab === "scan" ? "active" : ""}`} onClick={() => setActiveTab("scan")}>
            <HiQrcode /> Scanner
          </button>
          <button className={`reappro-tab ${activeTab === "demandes" ? "active" : ""}`} onClick={() => setActiveTab("demandes")}>
            <HiSwitchHorizontal /> Demandes
            {pendingCount > 0 && <span className={`tab-badge ${pendingCritique > 0 ? "critique" : ""}`}>{pendingCount}</span>}
          </button>
          <button className={`reappro-tab ${activeTab === "partages" ? "active" : ""}`} onClick={() => { setActiveTab("partages"); refetchPartages(); }}>
            <HiShare /> Partagés
            {partagesCount > 0 && <span className="tab-badge partage">{partagesCount}</span>}
          </button>
        </div>
      )}

      {/* Contenu */}
      {!selectedEntreprise ? (
        <div className="reappro-placeholder"><HiOfficeBuilding /><p>Sélectionnez une entreprise</p></div>

      ) : activeTab === "demandes" ? (
        <DemandesReapproPanel entrepriseId={selectedEntreprise} mappingEntrepots={reappro?.entreprise?.mappingEntrepots || {}}
          onPriseEnCharge={(result) => { setActiveTab("scan"); refetchReappro(); showMsg(`✅ ${result.message || "Demande prise en charge"}`, "success"); }} />

      ) : activeTab === "partages" ? (
        /* ═══ ONGLET PARTAGÉS ═══ */
        <div className="reappro-partages">
          {!partages || partages.length === 0 ? (
            <div className="reappro-empty-tab"><HiShare /><p>Aucun réappro partagé</p><span>Quand un agent partage un réappro en cours, il apparaît ici</span></div>
          ) : (
            <div className="partages-list">
              {partages.map((r) => (
                <div key={r._id} className="partage-card">
                  <div className="partage-info">
                    <div className="partage-titre">{r.titre || "Sans titre"}</div>
                    <div className="partage-meta">
                      <span><HiUser /> {r.user?.prenom} {r.user?.nom}</span>
                      <span><HiCube /> {r.totalArticles} art. — {r.totalQuantite} unités</span>
                      <span><HiClock /> {new Date(r.updatedAt).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {r.lignes?.length > 0 && (
                      <div className="partage-apercu">
                        {r.lignes.slice(0, 3).map((l, i) => (
                          <span key={i} className="partage-art">{l.nart} <small>×{l.quantite}</small></span>
                        ))}
                        {r.lignes.length > 3 && <span className="partage-more">+{r.lignes.length - 3} autres</span>}
                      </div>
                    )}
                  </div>
                  <button className="btn-reprendre" onClick={() => handleReprendre(r._id)} disabled={!!reappro}>
                    <HiRefresh /> Reprendre
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      ) : !reappro ? (
        <div className="reappro-start"><HiRefresh /><p>Aucun réappro en cours</p><button className="btn-start" onClick={handleStartReappro}><HiPlus /> Démarrer</button></div>

      ) : (
        /* ═══ ONGLET SCAN ═══ */
        <div className="reappro-content">
          {/* Titre du réappro */}
          <div className="reappro-titre-bar">
            <span className="reappro-titre-text">{reappro.titre || "Réappro en cours"}</span>
            <button className="reappro-titre-edit" onClick={handleEditTitre}><HiPencil /></button>
          </div>

          {/* Scan */}
          <div className="scan-section">
            <h2>Scanner un article</h2>
            {!currentArticle ? (
              <form className="scan-form" onSubmit={handleScan}>
                <div className="scan-input-wrapper"><HiQrcode /><input ref={scanInputRef} type="text" placeholder="Code barre ou NART..." value={scanValue} onChange={(e) => setScanValue(e.target.value)} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" /></div>
                <button type="submit" disabled={!scanValue.trim() || scanning}>{scanning ? "..." : "OK"}</button>
              </form>
            ) : showConfirmation ? (
              <div className="article-scanned">
                <div className={`article-info ${currentArticle.isUnknown ? "unknown" : ""} ${currentArticle.isRenvoi ? "renvoi" : ""}`}>
                  {currentArticle.isRenvoi && <div className="article-renvoi-banner"><HiSwitchHorizontal /> RENVOI</div>}
                  {currentArticle.isRenvoi && currentArticle.articleOriginal && (<div className="renvoi-details"><div className="renvoi-from"><span className="renvoi-label">Scanné</span><span className="renvoi-nart">{currentArticle.articleOriginal.nart}</span><span className="renvoi-design">{currentArticle.articleOriginal.designation}</span></div><div className="renvoi-arrow"><HiSwitchHorizontal /></div><div className="renvoi-to"><span className="renvoi-label">Remplacé par</span><span className="renvoi-nart">{currentArticle.nart}</span><span className="renvoi-design">{currentArticle.designation}</span></div></div>)}
                  {!currentArticle.isRenvoi && (<div className="article-main-info"><div className="article-code">{currentArticle.nart}</div><div className="article-designation">{currentArticle.designation}</div>{currentArticle.refer && <div className="article-refer"><strong>Réf:</strong> {currentArticle.refer}</div>}{currentArticle.gencod && <div className="article-gencod"><strong>CB:</strong> {currentArticle.gencod}</div>}</div>)}
                  {currentArticle.isRenvoi && (<div className="article-final-info"><div className="article-final-label">Article réappro:</div><div className="article-code">{currentArticle.nart}</div><div className="article-designation">{currentArticle.designation}</div></div>)}
                  {currentArticle.nombreRenvois > 1 && <div className="renvoi-chain-warning"><HiExclamation /> Chaîne de {currentArticle.nombreRenvois} renvois</div>}
                  <div className="stocks-section"><div className="stocks-title"><HiLocationMarker /> Stocks</div><div className="stocks-grid">{["S1","S2","S3","S4","S5"].map((k) => (<div key={k} className={`stock-item ${(currentArticle.stocks?.[k]||0) === 0 ? "stock-zero" : "stock-positive"}`}><span className="stock-label">{getStockLabel(k)}</span><span className="stock-value">{currentArticle.stocks?.[k]||0}</span></div>))}</div><div className="stock-total"><span className="stock-total-label">TOTAL:</span><span className={`stock-total-value ${getTotalStock(currentArticle.stocks)===0?"zero":""}`}>{getTotalStock(currentArticle.stocks)}</span></div></div>
                  {currentArticle.isUnknown && <div className="article-warning"><HiExclamation /> Article inconnu</div>}
                </div>
                <div className="confirmation-box"><p className="confirmation-question">Créer un réappro ?</p><div className="confirmation-actions"><button className="btn-yes" onClick={() => handleConfirmReappro(true)}><HiCheck /> Oui</button><button className="btn-no" onClick={() => handleConfirmReappro(false)}><HiX /> Non</button></div></div>
              </div>
            ) : (
              <div className="article-scanned">
                <div className={`article-info compact ${currentArticle.isRenvoi ? "renvoi" : ""}`}>
                  {currentArticle.isRenvoi && <div className="compact-renvoi-badge"><HiSwitchHorizontal /> Renvoi de {currentArticle.articleOriginal?.nart}</div>}
                  <div className="article-code">{currentArticle.nart}</div><div className="article-designation">{currentArticle.designation}</div>
                  <div className="compact-stocks">Stock total: <strong>{getTotalStock(currentArticle.stocks)}</strong></div>
                </div>
                <form className="quantite-form" onSubmit={handleAddLigne}>
                  <label>Quantité:</label>
                  <div className="quantite-input-wrapper"><button type="button" className="quantite-btn" onClick={() => setQuantite((p) => p===""||parseInt(p)<=1 ? "" : (parseInt(p)-1).toString())}>−</button><input ref={quantiteInputRef} type="text" inputMode="numeric" pattern="[0-9]*" value={quantite} onChange={(e) => setQuantite(e.target.value.replace(/[^0-9]/g,""))} className="quantite-input" placeholder="Qté" /><button type="button" className="quantite-btn" onClick={() => setQuantite((p) => p==="" ? "1" : (parseInt(p)+1).toString())}>+</button></div>
                  <div className="quantite-actions"><button type="submit" className="btn-confirm" disabled={!quantite||parseInt(quantite)<1||adding}><HiCheck /> Valider</button><button type="button" className="btn-cancel" onClick={handleCancelScan}><HiX /></button></div>
                </form>
              </div>
            )}
          </div>

          {/* Récap */}
          <div className="recap-section">
            <div className="recap-header">
              <h2><HiCube /> Récap</h2>
              <div className="recap-stats"><span>{reappro.totalArticles||0} art.</span><span>{reappro.totalQuantite||0} unités</span></div>
            </div>
            <div className="lignes-list">
              {reappro.lignes?.length === 0 ? (<div className="no-lignes">Aucun article</div>) : reappro.lignes?.map((ligne) => (
                <div key={ligne._id} className={`ligne-item ${ligne.isUnknown?"unknown":""} ${ligne.isRenvoi?"renvoi":""}`}>
                  <div className="ligne-info"><div className="ligne-main">{ligne.isRenvoi && <span className="ligne-renvoi-badge"><HiSwitchHorizontal /></span>}<span className="ligne-code">{ligne.nart}</span><span className="ligne-design">{ligne.designation}</span></div>{ligne.refer && <div className="ligne-refer"><small>Réf: {ligne.refer}</small></div>}{ligne.stocksSnapshot && <div className="ligne-stocks"><small>Stk: {ligne.stocksSnapshot.S1||0}/{ligne.stocksSnapshot.S2||0}/{ligne.stocksSnapshot.S3||0}</small></div>}</div>
                  {editingLigne === ligne._id ? (
                    <div className="ligne-edit"><button type="button" className="edit-btn" onClick={() => setEditQuantite((p) => Math.max(1,parseInt(p||1)-1).toString())}>−</button><input type="text" inputMode="numeric" value={editQuantite} onChange={(e) => setEditQuantite(e.target.value.replace(/[^0-9]/g,""))} className="edit-input" /><button type="button" className="edit-btn" onClick={() => setEditQuantite((p) => (parseInt(p||0)+1).toString())}>+</button><button onClick={() => handleSaveEdit(ligne._id)}><HiCheck /></button><button onClick={() => setEditingLigne(null)}><HiX /></button></div>
                  ) : (
                    <div className="ligne-actions"><span className="ligne-quantite">{ligne.quantite}</span><button className="edit-btn" onClick={() => handleEditLigne(ligne)}><HiPencil /></button><button className="delete-btn" onClick={() => handleDeleteLigne(ligne._id)}><HiTrash /></button></div>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="reappro-actions">
              <button className="btn-export" onClick={openExportModal} disabled={!reappro.lignes?.length}><HiDownload /> Terminer</button>
              <button className="btn-partager" onClick={handlePartager} disabled={!reappro.lignes?.length}><HiShare /> Partager</button>
              <button className="btn-cancel-reappro" onClick={handleCancelReappro}><HiTrash /></button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Export */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content modal-export" onClick={(e) => e.stopPropagation()}>
            <h2><HiDownload /> Terminer</h2>
            <p className="modal-stats">{reappro.totalArticles} articles - {reappro.totalQuantite} unités</p>
            <div className="modal-info-row"><label>Nom:</label><span className="modal-value">{nomReappro}</span><button type="button" className="btn-edit-small" onClick={() => { const n = window.prompt("Nom:", nomReappro); if (n!==null&&n.trim()) setNomReappro(n.trim()); }}><HiPencil /></button></div>
            <div className="export-mode-selector"><label>Destination:</label><div className="export-mode-options"><button type="button" className={`export-mode-btn ${exportMode==="server"?"active":""}`} onClick={() => setExportMode("server")}><HiServer /><span>Serveur</span></button><button type="button" className={`export-mode-btn ${exportMode==="download"?"active":""}`} onClick={() => setExportMode("download")}><HiDesktopComputer /><span>Mon poste</span></button></div></div>
            {exportMode === "server" && (<div className="modal-info-row chemin-row"><label><HiFolder /> Chemin:</label><span className="modal-value mono">{cheminServeur}</span><button type="button" className="btn-edit-small" onClick={handleEditChemin}><HiPencil /></button></div>)}
            {exportMode === "download" && <div className="export-info"><small>Téléchargement via navigateur</small></div>}
            <div className="modal-actions"><button className="btn-confirm" onClick={handleExport} disabled={!nomReappro.trim()||(exportMode==="server"&&!cheminServeur.trim())||exporting||downloading}>{exporting||downloading ? "..." : exportMode==="download" ? <><HiDownload /> Télécharger</> : <><HiServer /> Enregistrer</>}</button><button className="btn-cancel" onClick={() => setShowExportModal(false)}>Annuler</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReappro;