// import React, { useState, useEffect } from "react";
// import { HiPlus, HiPencil, HiTrash, HiSearch, HiCheck, HiX, HiRefresh, HiTerminal, HiClock, HiPlay, HiStop, HiFolder, HiChartBar, HiDownload, HiDatabase, HiCog, HiShieldCheck, HiCode, HiLightningBolt, HiExclamation } from "react-icons/hi";
// import { useGetTachesCronQuery, useDeleteTacheCronMutation, useToggleTacheCronActiveMutation, useAnnulerExecutionMutation, useGetCategoriesCronQuery, getTacheCronImageUrl } from "../../slices/tacheCronApiSlice";
// import TacheCronModal from "../../components/Admin/TacheCronModal";
// import TacheCronExecuterModal from "../../components/Admin/TacheCronExecuterModal";
// import TacheCronHistoriqueModal from "../../components/Admin/TacheCronHistoriqueModal";
// import "./AdminTachesCronScreen.css";

// const CATEGORIE_ICONS = { sauvegarde: HiDatabase, synchronisation: HiRefresh, nettoyage: HiTrash, import_export: HiDownload, reporting: HiChartBar, maintenance: HiCog, monitoring: HiShieldCheck, autre: HiFolder };
// const STATUT_LABELS = { active: "Active", inactive: "Inactive", en_cours: "En cours", erreur: "Erreur" };

// const AdminTachesCronScreen = () => {
//   const [search, setSearch] = useState("");
//   const [filterCategorie, setFilterCategorie] = useState("");
//   const [filterStatut, setFilterStatut] = useState("");
//   const [includeInactive, setIncludeInactive] = useState(true);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [execModalOpen, setExecModalOpen] = useState(false);
//   const [historiqueModalOpen, setHistoriqueModalOpen] = useState(false);
//   const [selectedTache, setSelectedTache] = useState(null);

//   const { data: tachesData, isLoading, error, refetch } = useGetTachesCronQuery({
//     categorie: filterCategorie, search: search || undefined, statut: filterStatut,
//     includeInactive: includeInactive ? "true" : undefined, limit: 100,
//   });
//   const { data: categories } = useGetCategoriesCronQuery();
//   const [deleteTache, { isLoading: isDeleting }] = useDeleteTacheCronMutation();
//   const [toggleActive, { isLoading: isToggling }] = useToggleTacheCronActiveMutation();
//   const [annulerExecution, { isLoading: isAnnuling }] = useAnnulerExecutionMutation();

//   const taches = tachesData?.taches || [];
//   const hasRunning = taches.some((t) => t.statut === "en_cours" || t.estEnCoursTempsReel);

//   useEffect(() => {
//     let iv;
//     if (hasRunning) iv = setInterval(() => refetch(), 5000);
//     return () => { if (iv) clearInterval(iv); };
//   }, [hasRunning, refetch]);

//   const filtered = taches.filter((t) => {
//     const s = search.toLowerCase();
//     return t.titre?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s) || t.commande?.toLowerCase().includes(s) || t.tags?.some((tag) => tag.includes(s));
//   });

//   const handleCreate = () => { setSelectedTache(null); setModalOpen(true); };
//   const handleEdit = (t) => { setSelectedTache(t); setModalOpen(true); };
//   const handleHistorique = (t) => { setSelectedTache(t); setHistoriqueModalOpen(true); };

//   const handleExecuter = (t) => { setSelectedTache(t); setExecModalOpen(true); };

//   const handleAnnuler = async (t) => {
//     if (!window.confirm(`Annuler l'exécution de "${t.titre}" ?`)) return;
//     try { await annulerExecution(t._id).unwrap(); setTimeout(() => refetch(), 500); }
//     catch (err) { alert(err?.data?.message || "Erreur"); }
//   };

//   const handleDelete = async (t) => {
//     if (window.confirm(`Supprimer "${t.titre}" ?\n\nHistorique et fichiers seront supprimés.`)) {
//       try { await deleteTache(t._id).unwrap(); } catch (err) { alert(err?.data?.message || "Erreur"); }
//     }
//   };

//   const handleToggle = async (t) => {
//     try { await toggleActive(t._id).unwrap(); } catch (err) { alert(err?.data?.message || "Erreur"); }
//   };

//   const fmtDate = (d) => { if (!d) return "—"; return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
//   const fmtDuree = (ms) => { if (!ms) return "—"; if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`; };

//   const stats = {
//     total: taches.length,
//     actives: taches.filter((t) => t.isActive).length,
//     enCours: taches.filter((t) => t.statut === "en_cours" || t.estEnCoursTempsReel).length,
//     enErreur: taches.filter((t) => t.statut === "erreur").length,
//   };

//   if (isLoading) return <div className="admin-loading">Chargement...</div>;
//   if (error) return <div className="admin-error">Erreur: {error?.data?.message}</div>;

//   return (
//     <div className="admin-taches-cron">
//       <div className="admin-taches-cron-header">
//         <h1><HiTerminal /> Tâches Cron</h1>
//         <div className="admin-taches-cron-actions">
//           <div className="search-box"><HiSearch /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
//           <select className="filter-select" value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)}>
//             <option value="">Toutes catégories</option>
//             {categories?.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.count})</option>)}
//           </select>
//           <select className="filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
//             <option value="">Tous statuts</option>
//             <option value="active">Active</option><option value="en_cours">En cours</option><option value="erreur">En erreur</option><option value="inactive">Inactive</option>
//           </select>
//           <label className="checkbox-label"><input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} /><span>Inactifs</span></label>
//           <button className="btn-icon" onClick={refetch} title="Rafraîchir"><HiRefresh /></button>
//           <button className="btn-primary" onClick={handleCreate}><HiPlus /><span>Nouvelle tâche</span></button>
//         </div>
//       </div>

//       <div className="admin-taches-cron-stats">
//         <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div>
//         <div className="stat-card"><span className="stat-value">{stats.actives}</span><span className="stat-label">Actives</span></div>
//         <div className={`stat-card ${stats.enCours > 0 ? "en-cours" : ""}`}><span className="stat-value">{stats.enCours}</span><span className="stat-label">En cours</span></div>
//         <div className={`stat-card ${stats.enErreur > 0 ? "erreur" : ""}`}><span className="stat-value">{stats.enErreur}</span><span className="stat-label">En erreur</span></div>
//       </div>

//       <div className="admin-taches-cron-grid">
//         {filtered.length === 0 ? (
//           <div className="no-data"><HiTerminal /><p>Aucune tâche cron trouvée</p></div>
//         ) : filtered.map((tache) => {
//           const Icon = CATEGORIE_ICONS[tache.categorie] || HiFolder;
//           const enCours = tache.statut === "en_cours" || tache.estEnCoursTempsReel;
//           const enErreur = tache.statut === "erreur";

//           return (
//             <div key={tache._id} className={`tache-card ${!tache.isActive ? "inactive" : ""} ${enCours ? "en-cours" : ""} ${enErreur ? "en-erreur" : ""}`}>
//               <div className="tache-card-header">
//                 <div className="tache-icon">
//                   {tache.imagePath ? (
//                     <img src={getTacheCronImageUrl(tache._id)} alt={tache.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                       onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }} />
//                   ) : null}
//                   <div style={{ display: tache.imagePath ? "none" : "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}><Icon /></div>
//                 </div>
//                 <div className="tache-header-info">
//                   <span className={`statut-badge ${enCours ? "en_cours" : tache.isActive ? (enErreur ? "erreur" : "active") : "inactive"}`}>
//                     {enCours && <span className="pulse-dot" />}
//                     {enCours ? "En cours" : enErreur ? "Erreur" : tache.isActive ? "Active" : "Inactive"}
//                   </span>
//                 </div>
//               </div>

//               <div className="tache-card-body">
//                 <h3 className="tache-titre">{tache.titre}</h3>
//                 <p className="tache-description">{tache.descriptionCourte || tache.description?.slice(0, 120)}{!tache.descriptionCourte && tache.description?.length > 120 && "..."}</p>
//                 <div className="tache-commande"><HiCode /><code>{tache.commande}</code></div>

//                 {/* Arguments disponibles */}
//                 {tache.arguments?.length > 0 && (
//                   <div className="outil-tags">
//                     {tache.arguments.slice(0, 4).map((a) => (
//                       <span key={a._id} className="tag" title={a.description || a.valeur}>{a.nom}</span>
//                     ))}
//                     {tache.arguments.length > 4 && <span className="tag more">+{tache.arguments.length - 4}</span>}
//                   </div>
//                 )}

//                 <div className="tache-meta">
//                   <span className="meta-item"><Icon />{categories?.find((c) => c.value === tache.categorie)?.label || tache.categorie}</span>
//                   <span className="meta-item"><HiClock />{tache.timeoutSecondes}s</span>
//                   <span className="meta-item"><HiLightningBolt />{tache.nombreExecutions || 0} exec</span>
//                 </div>

//                 {(tache.frequenceDescription || tache.expressionCron) && (
//                   <div className="tache-frequence"><HiClock /><span>{tache.frequenceDescription || "Planifié"}</span>{tache.expressionCron && <code>{tache.expressionCron}</code>}</div>
//                 )}

//                 {tache.nombreExecutions > 0 && (
//                   <div className="tache-exec-stats">
//                     <span className="exec-stat succes"><HiCheck /> {tache.nombreSucces || 0}</span>
//                     <span className="exec-stat erreur"><HiExclamation /> {tache.nombreErreurs || 0}</span>
//                   </div>
//                 )}

//                 <div className="tache-derniere-exec">
//                   <HiClock />
//                   {tache.derniereExecution?.date ? (
//                     <><span>Dernière: {fmtDate(tache.derniereExecution.date)}</span><span className={`derniere-exec-statut ${tache.derniereExecution.statut}`}>{STATUT_LABELS[tache.derniereExecution.statut] || tache.derniereExecution.statut}</span><span>({fmtDuree(tache.derniereExecution.dureeMs)})</span></>
//                   ) : <span>Jamais exécutée</span>}
//                 </div>
//               </div>

//               <div className="tache-card-footer">
//                 {enCours ? (
//                   <button className="btn-executer running" onClick={() => handleAnnuler(tache)} disabled={isAnnuling}>
//                     {isAnnuling ? <div className="spinner-sm" /> : <HiStop />}<span>Arrêter</span>
//                   </button>
//                 ) : (
//                   <button className="btn-executer" onClick={() => handleExecuter(tache)} disabled={!tache.isActive} title={!tache.isActive ? "Tâche inactive" : "Lancer"}>
//                     <HiPlay /><span>Exécuter</span>
//                   </button>
//                 )}
//                 <div className="card-actions">
//                   <button className="btn-action btn-history" onClick={() => handleHistorique(tache)} title="Historique"><HiClock /></button>
//                   <button className="btn-action btn-toggle" onClick={() => handleToggle(tache)} disabled={isToggling || enCours} title={tache.isActive ? "Désactiver" : "Activer"}>{tache.isActive ? <HiX /> : <HiCheck />}</button>
//                   <button className="btn-action btn-edit" onClick={() => handleEdit(tache)} disabled={enCours} title="Modifier"><HiPencil /></button>
//                   <button className="btn-action btn-delete" onClick={() => handleDelete(tache)} disabled={isDeleting || enCours} title="Supprimer"><HiTrash /></button>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {modalOpen && <TacheCronModal tache={selectedTache} onClose={() => { setModalOpen(false); setSelectedTache(null); }} />}
//       {execModalOpen && selectedTache && <TacheCronExecuterModal tache={selectedTache} onClose={() => { setExecModalOpen(false); setSelectedTache(null); }} onLaunched={() => setTimeout(() => refetch(), 500)} />}
//       {historiqueModalOpen && selectedTache && <TacheCronHistoriqueModal tache={selectedTache} onClose={() => { setHistoriqueModalOpen(false); setSelectedTache(null); }} />}
//     </div>
//   );
// };

// export default AdminTachesCronScreen;
import React, { useState, useEffect } from "react";
import { HiPlus, HiPencil, HiTrash, HiSearch, HiCheck, HiX, HiRefresh, HiTerminal, HiClock, HiPlay, HiStop, HiFolder, HiChartBar, HiDownload, HiDatabase, HiCog, HiShieldCheck, HiCode, HiLightningBolt, HiExclamation, HiDocumentText } from "react-icons/hi";
import { useGetTachesCronQuery, useDeleteTacheCronMutation, useToggleTacheCronActiveMutation, useAnnulerExecutionMutation, useGetCategoriesCronQuery, getTacheCronImageUrl } from "../../slices/tacheCronApiSlice";
import TacheCronModal from "../../components/Admin/TacheCronModal";
import TacheCronExecuterModal from "../../components/Admin/TacheCronExecuterModal";
import TacheCronHistoriqueModal from "../../components/Admin/TacheCronHistoriqueModal";
import TacheCronDocumentationModal from "../../components/Admin/TacheCronDocumentationModal";
import "./AdminTachesCronScreen.css";

const CATEGORIE_ICONS = { sauvegarde: HiDatabase, synchronisation: HiRefresh, nettoyage: HiTrash, import_export: HiDownload, reporting: HiChartBar, maintenance: HiCog, monitoring: HiShieldCheck, autre: HiFolder };
const STATUT_LABELS = { active: "Active", inactive: "Inactive", en_cours: "En cours", erreur: "Erreur" };

const AdminTachesCronScreen = () => {
  const [search, setSearch] = useState("");
  const [filterCategorie, setFilterCategorie] = useState("");
  const [filterStatut, setFilterStatut] = useState("");
  const [includeInactive, setIncludeInactive] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [execModalOpen, setExecModalOpen] = useState(false);
  const [historiqueModalOpen, setHistoriqueModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedTache, setSelectedTache] = useState(null);

  const { data: tachesData, isLoading, error, refetch } = useGetTachesCronQuery({
    categorie: filterCategorie, search: search || undefined, statut: filterStatut,
    includeInactive: includeInactive ? "true" : undefined, limit: 100,
  });
  const { data: categories } = useGetCategoriesCronQuery();
  const [deleteTache, { isLoading: isDeleting }] = useDeleteTacheCronMutation();
  const [toggleActive, { isLoading: isToggling }] = useToggleTacheCronActiveMutation();
  const [annulerExecution, { isLoading: isAnnuling }] = useAnnulerExecutionMutation();

  const taches = tachesData?.taches || [];
  const hasRunning = taches.some((t) => t.statut === "en_cours" || t.estEnCoursTempsReel);

  useEffect(() => {
    let iv;
    if (hasRunning) iv = setInterval(() => refetch(), 5000);
    return () => { if (iv) clearInterval(iv); };
  }, [hasRunning, refetch]);

  const filtered = taches.filter((t) => {
    const s = search.toLowerCase();
    return t.titre?.toLowerCase().includes(s) || t.description?.toLowerCase().includes(s) || t.commande?.toLowerCase().includes(s) || t.tags?.some((tag) => tag.includes(s));
  });

  const handleCreate = () => { setSelectedTache(null); setModalOpen(true); };
  const handleEdit = (t) => { setSelectedTache(t); setModalOpen(true); };
  const handleHistorique = (t) => { setSelectedTache(t); setHistoriqueModalOpen(true); };
  const handleExecuter = (t) => { setSelectedTache(t); setExecModalOpen(true); };
  const handleDocumentation = (t) => { setSelectedTache(t); setDocModalOpen(true); };

  const handleAnnuler = async (t) => {
    if (!window.confirm(`Annuler l'exécution de "${t.titre}" ?`)) return;
    try { await annulerExecution(t._id).unwrap(); setTimeout(() => refetch(), 500); }
    catch (err) { alert(err?.data?.message || "Erreur"); }
  };

  const handleDelete = async (t) => {
    if (window.confirm(`Supprimer "${t.titre}" ?\n\nHistorique et fichiers seront supprimés.`)) {
      try { await deleteTache(t._id).unwrap(); } catch (err) { alert(err?.data?.message || "Erreur"); }
    }
  };

  const handleToggle = async (t) => {
    try { await toggleActive(t._id).unwrap(); } catch (err) { alert(err?.data?.message || "Erreur"); }
  };

  const fmtDate = (d) => { if (!d) return "—"; return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }); };
  const fmtDuree = (ms) => { if (!ms) return "—"; if (ms < 1000) return `${ms}ms`; if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`; return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`; };

  const stats = {
    total: taches.length,
    actives: taches.filter((t) => t.isActive).length,
    enCours: taches.filter((t) => t.statut === "en_cours" || t.estEnCoursTempsReel).length,
    enErreur: taches.filter((t) => t.statut === "erreur").length,
  };

  if (isLoading) return <div className="admin-loading">Chargement...</div>;
  if (error) return <div className="admin-error">Erreur: {error?.data?.message}</div>;

  return (
    <div className="admin-taches-cron">
      <div className="admin-taches-cron-header">
        <h1><HiTerminal /> Tâches Cron</h1>
        <div className="admin-taches-cron-actions">
          <div className="search-box"><HiSearch /><input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select className="filter-select" value={filterCategorie} onChange={(e) => setFilterCategorie(e.target.value)}>
            <option value="">Toutes catégories</option>
            {categories?.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.count})</option>)}
          </select>
          <select className="filter-select" value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
            <option value="">Tous statuts</option>
            <option value="active">Active</option><option value="en_cours">En cours</option><option value="erreur">En erreur</option><option value="inactive">Inactive</option>
          </select>
          <label className="checkbox-label"><input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} /><span>Inactifs</span></label>
          <button className="btn-icon" onClick={refetch} title="Rafraîchir"><HiRefresh /></button>
          <button className="btn-primary" onClick={handleCreate}><HiPlus /><span>Nouvelle tâche</span></button>
        </div>
      </div>

      <div className="admin-taches-cron-stats">
        <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div>
        <div className="stat-card"><span className="stat-value">{stats.actives}</span><span className="stat-label">Actives</span></div>
        <div className={`stat-card ${stats.enCours > 0 ? "en-cours" : ""}`}><span className="stat-value">{stats.enCours}</span><span className="stat-label">En cours</span></div>
        <div className={`stat-card ${stats.enErreur > 0 ? "erreur" : ""}`}><span className="stat-value">{stats.enErreur}</span><span className="stat-label">En erreur</span></div>
      </div>

      <div className="admin-taches-cron-grid">
        {filtered.length === 0 ? (
          <div className="no-data"><HiTerminal /><p>Aucune tâche cron trouvée</p></div>
        ) : filtered.map((tache) => {
          const Icon = CATEGORIE_ICONS[tache.categorie] || HiFolder;
          const enCours = tache.statut === "en_cours" || tache.estEnCoursTempsReel;
          const enErreur = tache.statut === "erreur";

          return (
            <div key={tache._id} className={`tache-card ${!tache.isActive ? "inactive" : ""} ${enCours ? "en-cours" : ""} ${enErreur ? "en-erreur" : ""}`}>
              <div className="tache-card-header">
                <div className="tache-icon">
                  {tache.imagePath ? (
                    <img src={getTacheCronImageUrl(tache._id)} alt={tache.titre} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <div style={{ display: tache.imagePath ? "none" : "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}><Icon /></div>
                </div>
                <div className="tache-header-info">
                  <span className={`statut-badge ${enCours ? "en_cours" : tache.isActive ? (enErreur ? "erreur" : "active") : "inactive"}`}>
                    {enCours && <span className="pulse-dot" />}
                    {enCours ? "En cours" : enErreur ? "Erreur" : tache.isActive ? "Active" : "Inactive"}
                  </span>
                  {tache.documentation?.length > 0 && (
                    <span className="doc-count-badge" title={`${tache.documentation.length} doc(s)`}>
                      <HiDocumentText /> {tache.documentation.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="tache-card-body">
                <h3 className="tache-titre">{tache.titre}</h3>
                <p className="tache-description">{tache.descriptionCourte || tache.description?.slice(0, 120)}{!tache.descriptionCourte && tache.description?.length > 120 && "..."}</p>
                <div className="tache-commande"><HiCode /><code>{tache.commande}</code></div>

                {/* Arguments disponibles */}
                {tache.arguments?.length > 0 && (
                  <div className="outil-tags">
                    {tache.arguments.slice(0, 4).map((a) => (
                      <span key={a._id} className="tag" title={a.description || a.valeur}>{a.nom}</span>
                    ))}
                    {tache.arguments.length > 4 && <span className="tag more">+{tache.arguments.length - 4}</span>}
                  </div>
                )}

                <div className="tache-meta">
                  <span className="meta-item"><Icon />{categories?.find((c) => c.value === tache.categorie)?.label || tache.categorie}</span>
                  <span className="meta-item"><HiClock />{tache.timeoutSecondes}s</span>
                  <span className="meta-item"><HiLightningBolt />{tache.nombreExecutions || 0} exec</span>
                </div>

                {(tache.frequenceDescription || tache.expressionCron) && (
                  <div className="tache-frequence"><HiClock /><span>{tache.frequenceDescription || "Planifié"}</span>{tache.expressionCron && <code>{tache.expressionCron}</code>}</div>
                )}

                {tache.nombreExecutions > 0 && (
                  <div className="tache-exec-stats">
                    <span className="exec-stat succes"><HiCheck /> {tache.nombreSucces || 0}</span>
                    <span className="exec-stat erreur"><HiExclamation /> {tache.nombreErreurs || 0}</span>
                  </div>
                )}

                <div className="tache-derniere-exec">
                  <HiClock />
                  {tache.derniereExecution?.date ? (
                    <><span>Dernière: {fmtDate(tache.derniereExecution.date)}</span><span className={`derniere-exec-statut ${tache.derniereExecution.statut}`}>{STATUT_LABELS[tache.derniereExecution.statut] || tache.derniereExecution.statut}</span><span>({fmtDuree(tache.derniereExecution.dureeMs)})</span></>
                  ) : <span>Jamais exécutée</span>}
                </div>
              </div>

              <div className="tache-card-footer">
                {enCours ? (
                  <button className="btn-executer running" onClick={() => handleAnnuler(tache)} disabled={isAnnuling}>
                    {isAnnuling ? <div className="spinner-sm" /> : <HiStop />}<span>Arrêter</span>
                  </button>
                ) : (
                  <button className="btn-executer" onClick={() => handleExecuter(tache)} disabled={!tache.isActive} title={!tache.isActive ? "Tâche inactive" : "Lancer"}>
                    <HiPlay /><span>Exécuter</span>
                  </button>
                )}
                <div className="card-actions">
                  <button className="btn-action btn-doc" onClick={() => handleDocumentation(tache)} title="Documentation"><HiDocumentText /></button>
                  <button className="btn-action btn-history" onClick={() => handleHistorique(tache)} title="Historique"><HiClock /></button>
                  <button className="btn-action btn-toggle" onClick={() => handleToggle(tache)} disabled={isToggling || enCours} title={tache.isActive ? "Désactiver" : "Activer"}>{tache.isActive ? <HiX /> : <HiCheck />}</button>
                  <button className="btn-action btn-edit" onClick={() => handleEdit(tache)} disabled={enCours} title="Modifier"><HiPencil /></button>
                  <button className="btn-action btn-delete" onClick={() => handleDelete(tache)} disabled={isDeleting || enCours} title="Supprimer"><HiTrash /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && <TacheCronModal tache={selectedTache} onClose={() => { setModalOpen(false); setSelectedTache(null); }} />}
      {execModalOpen && selectedTache && <TacheCronExecuterModal tache={selectedTache} onClose={() => { setExecModalOpen(false); setSelectedTache(null); }} onLaunched={() => setTimeout(() => refetch(), 500)} />}
      {historiqueModalOpen && selectedTache && <TacheCronHistoriqueModal tache={selectedTache} onClose={() => { setHistoriqueModalOpen(false); setSelectedTache(null); }} />}
      {docModalOpen && selectedTache && <TacheCronDocumentationModal tache={selectedTache} onClose={() => { setDocModalOpen(false); setSelectedTache(null); }} />}
    </div>
  );
};

export default AdminTachesCronScreen;