import React, { useState, useRef } from "react";
import { HiX, HiClock, HiTerminal, HiChevronLeft, HiChevronRight, HiArrowLeft, HiUser, HiPlay, HiDownload, HiTrash, HiUpload, HiDocumentText, HiPaperClip } from "react-icons/hi";
import { useGetExecutionsQuery, useGetExecutionDetailQuery, useUploadFichierExecutionMutation, useDeleteFichierExecutionMutation, getFichierExecutionUrl } from "../../slices/tacheCronApiSlice";

const STATUT_LABELS = { succes: "Succès", erreur: "Erreur", timeout: "Timeout", annule: "Annulé", en_cours: "En cours" };

const formatDate = (d) => { if (!d) return "—"; return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
const formatDuree = (ms) => { if (!ms) return "—"; if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`; };
const formatSize = (b) => { if (!b) return "0 B"; const k = 1024; const s = ["B", "KB", "MB", "GB"]; const i = Math.floor(Math.log(b) / Math.log(k)); return parseFloat((b / Math.pow(k, i)).toFixed(2)) + " " + s[i]; };

const TacheCronHistoriqueModal = ({ tache, onClose }) => {
  const [page, setPage] = useState(1);
  const [selectedExecId, setSelectedExecId] = useState(null);
  const fileInputRef = useRef(null);

  const { data: execData, isLoading } = useGetExecutionsQuery({ tacheId: tache._id, page, limit: 15 });
  const { data: detail, isLoading: loadingDetail, refetch: refetchDetail } = useGetExecutionDetailQuery(selectedExecId, { skip: !selectedExecId });
  const [uploadFichier, { isLoading: uploading }] = useUploadFichierExecutionMutation();
  const [deleteFichier] = useDeleteFichierExecutionMutation();

  const executions = execData?.executions || [];
  const pagination = execData?.pagination;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedExecId) return;
    const fd = new FormData();
    fd.append("fichier", file);
    try { await uploadFichier({ executionId: selectedExecId, formData: fd }).unwrap(); refetchDetail(); }
    catch (err) { alert(err?.data?.message || "Erreur upload"); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteFichier = async (fId, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try { await deleteFichier({ executionId: selectedExecId, fichierId: fId }).unwrap(); refetchDetail(); }
    catch (err) { alert(err?.data?.message || "Erreur suppression"); }
  };

  const handleDownload = (fId, nom) => {
    const url = getFichierExecutionUrl(selectedExecId, fId);
    const a = document.createElement("a"); a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ===== Vue détail =====
  if (selectedExecId) {
    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal-content large">
          <div className="modal-header">
            <h2><HiTerminal /> Détail de l'exécution</h2>
            <button className="modal-close" onClick={onClose}><HiX /></button>
          </div>
          <div className="modal-body">
            <button className="btn-secondary" onClick={() => setSelectedExecId(null)} style={{ alignSelf: "flex-start" }}><HiArrowLeft /> Retour</button>

            {loadingDetail ? <div className="admin-loading">Chargement...</div> : detail ? (
              <div className="execution-detail">
                <div className="execution-detail-header">
                  <div className="detail-field"><span className="label">Statut</span><span className={`value statut-text ${detail.statut}`}>{STATUT_LABELS[detail.statut]}</span></div>
                  <div className="detail-field"><span className="label">Durée</span><span className="value">{formatDuree(detail.dureeMs)}</span></div>
                  <div className="detail-field"><span className="label">Début</span><span className="value">{formatDate(detail.dateDebut)}</span></div>
                  <div className="detail-field"><span className="label">Fin</span><span className="value">{formatDate(detail.dateFin)}</span></div>
                  <div className="detail-field"><span className="label">Lancé par</span><span className="value">{detail.lancePar ? `${detail.lancePar.prenom} ${detail.lancePar.nom}` : "Système"}</span></div>
                  <div className="detail-field"><span className="label">Code sortie</span><span className="value">{detail.codeSortie !== null ? detail.codeSortie : "—"}</span></div>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Commande exécutée</label>
                  <div className="tache-commande"><code>{detail.commandeExecutee}</code></div>
                </div>

                {detail.argumentsActives?.length > 0 && detail.tache?.arguments && (
                  <div className="form-group">
                    <label style={{ fontWeight: 600 }}>Arguments activés</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {detail.tache.arguments.filter((a) => detail.argumentsActives.includes(a._id)).map((a) => (
                        <span key={a._id} className="tag" style={{ background: "rgba(var(--accent-rgb),0.15)", borderColor: "var(--accent)", color: "var(--accent)" }}>{a.nom}: <code>{a.valeur}</code></span>
                      ))}
                    </div>
                  </div>
                )}

                {detail.erreurInterne && (
                  <div className="form-group">
                    <label style={{ fontWeight: 600, color: "var(--danger)" }}>Erreur interne</label>
                    <div className="log-output stderr">{detail.erreurInterne}</div>
                  </div>
                )}

                <div className="log-section">
                  <div className="log-section-title stdout"><HiTerminal /> stdout</div>
                  {detail.sortieStandard ? <pre className="log-output">{detail.sortieStandard}</pre> : <div className="log-empty">Aucune sortie</div>}
                </div>

                <div className="log-section">
                  <div className="log-section-title stderr"><HiX /> stderr</div>
                  {detail.sortieErreur ? <pre className="log-output stderr">{detail.sortieErreur}</pre> : <div className="log-empty">Aucune erreur</div>}
                </div>

                {/* Fichiers */}
                <div className="log-section">
                  <div className="log-section-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}><HiPaperClip /> Fichiers ({detail.fichiersGeneres?.length || 0})</span>
                    <label className="btn-secondary" style={{ padding: "4px 10px", fontSize: 11, cursor: "pointer", opacity: uploading ? 0.5 : 1 }}>
                      <HiUpload /> {uploading ? "..." : "Ajouter"}
                      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} disabled={uploading} />
                    </label>
                  </div>
                  {detail.fichiersGeneres?.length > 0 ? (
                    <div className="fichiers-list">
                      {detail.fichiersGeneres.map((f) => (
                        <div key={f._id} className="fichier-item">
                          <div className="fichier-icon"><HiDocumentText /></div>
                          <div className="fichier-info">
                            <span className="fichier-nom">{f.nom}</span>
                            <span className="fichier-meta">{formatSize(f.taille)} • {f.source === "auto" ? "Auto" : "Manuel"} • {formatDate(f.dateAjout)}</span>
                          </div>
                          <div className="fichier-actions">
                            <button className="btn-action btn-view" onClick={() => handleDownload(f._id, f.nom)} title="Télécharger"><HiDownload /></button>
                            <button className="btn-action btn-delete" onClick={() => handleDeleteFichier(f._id, f.nom)} title="Supprimer"><HiTrash /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="log-empty">Aucun fichier</div>}
                </div>
              </div>
            ) : <div className="log-empty">Non trouvée</div>}
          </div>
        </div>
      </div>
    );
  }

  // ===== Vue liste =====
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content large">
        <div className="modal-header">
          <h2><HiClock /> Historique — {tache.titre}</h2>
          <button className="modal-close" onClick={onClose}><HiX /></button>
        </div>
        <div className="modal-body">
          {isLoading ? <div className="admin-loading">Chargement...</div> : executions.length === 0 ? (
            <div className="log-empty">Aucune exécution enregistrée</div>
          ) : (
            <>
              <div className="executions-list">
                {executions.map((ex) => (
                  <div key={ex._id} className="execution-item" onClick={() => setSelectedExecId(ex._id)}>
                    <div className={`execution-statut-dot ${ex.statut}`} />
                    <div className="execution-info">
                      <div className="execution-info-top">
                        <span className={`statut-text ${ex.statut}`}>{STATUT_LABELS[ex.statut] || ex.statut}</span>
                        <span className="execution-duree">{formatDuree(ex.dureeMs)}</span>
                        {ex.fichiersGeneres?.length > 0 && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--accent)" }}><HiPaperClip /> {ex.fichiersGeneres.length}</span>}
                      </div>
                      <div className="execution-info-bottom">
                        <span>{formatDate(ex.dateDebut)}</span>
                        <span>{ex.declenchement === "manuel" ? (<><HiUser style={{ fontSize: 10 }} /> {ex.lancePar ? `${ex.lancePar.prenom} ${ex.lancePar.nom}` : "Admin"}</>) : (<><HiPlay style={{ fontSize: 10 }} /> Planifié</>)}</span>
                        {ex.codeSortie !== null && <span>Code: {ex.codeSortie}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {pagination?.totalPages > 1 && (
                <div className="modal-pagination">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}><HiChevronLeft /></button>
                  <span>{page} / {pagination.totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}><HiChevronRight /></button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TacheCronHistoriqueModal;