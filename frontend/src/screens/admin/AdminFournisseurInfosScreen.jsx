// // src/screens/admin/AdminFournisseurInfosScreen.jsx
// import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
// import { useParams, useNavigate, Link } from "react-router-dom";
// import {
//   HiArrowLeft, HiOfficeBuilding, HiPhone, HiLocationMarker, HiDocumentText,
//   HiCube, HiChevronLeft, HiChevronRight, HiRefresh, HiExternalLink,
//   HiCalculator, HiCalendar, HiMail, HiAnnotation, HiBan, HiTrendingDown,
//   HiCheckCircle, HiSearch, HiDownload, HiX, HiEye, HiTag, HiPhotograph,
//   HiGlobe, HiExclamation, HiCurrencyDollar, HiArchive, HiAdjustments,
//   HiSwitchHorizontal
// } from "react-icons/hi";
// import { useGetEntrepriseByDossierQuery } from "../../slices/entrepriseApiSlice";
// import {
//   useGetFournisseurByCodeQuery,
//   useGetArticlesByFournisseurQuery,
// } from "../../slices/fournissApiSlice";
// import { getPhotoUrl } from "../../slices/articleApiSlice";
// import DemandeReapproModal from "../../components/Admin/DemandeReapproModal";
// import "./AdminFournisseurInfosScreen.css";

// // === CONSTANTES ===

// const TABS = [
//   { key: "actif", label: "Actifs", icon: <HiCheckCircle /> },
//   { key: "deprecie", label: "Dépréciés", icon: <HiTrendingDown /> },
//   { key: "arrete", label: "Arrêtés", icon: <HiBan /> },
//   { key: "reappro", label: "Réappro Magasin", icon: <HiSwitchHorizontal /> },
// ];

// const PAGE_SIZE = 25;
// const DEFAULT_MAPPING = { S1: "Magasin", S2: "S2", S3: "S3", S4: "S4", S5: "S5" };
// const DEPOT_KEYS = ["S1", "S2", "S3", "S4", "S5"];

// // ============================================================
// // EXPORT : champs avec leurs vrais noms DBF
// // Les clés qui commencent par _ sont des champs calculés
// // ============================================================
// const EXPORT_FIELDS = {
//   "Article - Identification": [
//     { key: "NART", label: "NART", default: true },
//     { key: "DESIGN", label: "DESIGN", default: true },
//     { key: "DESIGN2", label: "DESIGN2" },
//     { key: "GENCOD", label: "GENCOD" },
//     { key: "GROUPE", label: "GROUPE" },
//     { key: "FOURN", label: "FOURN", default: true },
//     { key: "REFER", label: "REFER" },
//     { key: "UNITE", label: "UNITE" },
//     { key: "DOUANE", label: "DOUANE" },
//     { key: "VOL", label: "VOL" },
//     { key: "WEB", label: "WEB" },
//     { key: "FOTO", label: "FOTO" },
//     { key: "_STATUS", label: "STATUT (calculé)", default: true },
//   ],
//   "Article - Prix": [
//     { key: "PVTETTC", label: "PVTETTC" },
//     { key: "PVTE", label: "PVTE", default: true },
//     { key: "PVPROMO", label: "PVPROMO" },
//     { key: "PACHAT", label: "PACHAT" },
//     { key: "PREV", label: "PREV" },
//     { key: "TAXES", label: "TAXES" },
//     { key: "DEPREC", label: "DEPREC" },
//     { key: "_VALEUR_STOCK_HT", label: "VALEUR_STOCK_HT (calculé)" },
//   ],
//   "Article - Stocks": [
//     { key: "_STOCK_TOTAL", label: "STOCK_TOTAL (calculé)", default: true },
//     { key: "S1", label: "S1", default: true },
//     { key: "S2", label: "S2" },
//     { key: "S3", label: "S3" },
//     { key: "S4", label: "S4" },
//     { key: "S5", label: "S5" },
//     { key: "RESERV", label: "RESERV" },
//     { key: "SMINI", label: "SMINI" },
//   ],
//   "Article - Emplacements": [
//     { key: "PLACE", label: "PLACE" },
//     { key: "GISM1", label: "GISM1" },
//     { key: "GISM2", label: "GISM2" },
//     { key: "GISM3", label: "GISM3" },
//     { key: "GISM4", label: "GISM4" },
//     { key: "GISM5", label: "GISM5" },
//   ],
//   "Article - Dates": [
//     { key: "CREATION", label: "CREATION" },
//     { key: "DATINV", label: "DATINV" },
//     { key: "DPROMOD", label: "DPROMOD" },
//     { key: "DPROMOF", label: "DPROMOF" },
//   ],
//   "Article - Divers": [
//     { key: "OBSERV", label: "OBSERV" },
//   ],
//   "Fournisseur": [
//     { key: "_F_NOM", label: "F_NOM" },
//     { key: "_F_AD1", label: "F_AD1" },
//     { key: "_F_AD2", label: "F_AD2" },
//     { key: "_F_AD3", label: "F_AD3" },
//     { key: "_F_AD4", label: "F_AD4" },
//     { key: "_F_AD5", label: "F_AD5" },
//     { key: "_F_LOCAL", label: "F_LOCAL" },
//     { key: "_F_TEL", label: "F_TEL" },
//     { key: "_F_FAX", label: "F_FAX" },
//     { key: "_F_TLX", label: "F_TLX" },
//     { key: "_F_DELAPRO", label: "F_DELAPRO" },
//     { key: "_F_COEFSMINI", label: "F_COEFSMINI" },
//     { key: "_F_FRANCO", label: "F_FRANCO" },
//     { key: "_F_TEXTE", label: "F_TEXTE" },
//     { key: "_F_OBSERV", label: "F_OBSERV" },
//   ],
// };

// const DEFAULT_SELECTED = Object.values(EXPORT_FIELDS).flat().filter(f => f.default).map(f => f.key);

// const AdminFournisseurInfosScreen = () => {
//   const { nomDossierDBF, fournId } = useParams();
//   const navigate = useNavigate();

//   const [selectedEntreprise, setSelectedEntreprise] = useState(nomDossierDBF || "");
//   const [activeTab, setActiveTab] = useState("actif");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedArticle, setSelectedArticle] = useState(null);
//   const [photoError, setPhotoError] = useState(false);
//   const [photoLoaded, setPhotoLoaded] = useState(false);
//   const [showExportModal, setShowExportModal] = useState(false);
//   const [exportScope, setExportScope] = useState("actif");
//   const [exportFields, setExportFields] = useState(DEFAULT_SELECTED);
//   const [showDemandeModal, setShowDemandeModal] = useState(false);
//   const [selectedForDemande, setSelectedForDemande] = useState([]);
//   const [message, setMessage] = useState(null);
//   const searchInputRef = useRef(null);

//   // === Queries ===

//   const { data: entrepriseData } = useGetEntrepriseByDossierQuery(selectedEntreprise, {
//     skip: !selectedEntreprise,
//   });

//   const { data: fournData, isLoading: loadingFourn, refetch } =
//     useGetFournisseurByCodeQuery(
//       { nomDossierDBF: selectedEntreprise, fourn: fournId },
//       { skip: !selectedEntreprise || !fournId }
//     );

//   const { data: articlesData, isLoading: loadingArticles } =
//     useGetArticlesByFournisseurQuery(
//       { nomDossierDBF: selectedEntreprise, fourn: fournId, page: 1, limit: 99999 },
//       { skip: !selectedEntreprise || !fournId }
//     );

//   const fournisseur = fournData?.fournisseur;
//   const allArticles = articlesData?.articles || [];

//   const mappingEntrepots = useMemo(() => {
//     return entrepriseData?.mappingEntrepots || DEFAULT_MAPPING;
//   }, [entrepriseData]);

//   const hasPhotosConfigured = !!entrepriseData?.cheminPhotos;
//   const trigramme = entrepriseData?.trigramme;

//   useEffect(() => { if (nomDossierDBF) setSelectedEntreprise(nomDossierDBF); }, [nomDossierDBF]);
//   useEffect(() => { setCurrentPage(1); setActiveTab("actif"); setSearchQuery(""); }, [fournId]);
//   useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

//   // === Helpers ===

//   const safeTrim = (val) => (val === null || val === undefined ? "" : String(val).trim());

//   const formatPrice = (p) =>
//     new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XPF", minimumFractionDigits: 0 }).format(p || 0);

//   const formatPriceShort = (p) => {
//     if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M XPF`;
//     if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K XPF`;
//     return formatPrice(p);
//   };

//   const formatStock = (stock) => {
//     if (stock === null || stock === undefined) return "-";
//     const num = parseFloat(stock);
//     return isNaN(num) ? "-" : num.toLocaleString("fr-FR");
//   };

//   const formatDate = (dateValue) => {
//     if (!dateValue) return "-";
//     if (typeof dateValue === "string" && dateValue.length === 8)
//       return `${dateValue.substring(6, 8)}/${dateValue.substring(4, 6)}/${dateValue.substring(0, 4)}`;
//     if (dateValue instanceof Date) return dateValue.toLocaleDateString("fr-FR");
//     return "-";
//   };

//   const calculateStockTotal = useCallback((art) => {
//     if (!art) return 0;
//     return DEPOT_KEYS.reduce((sum, k) => sum + (parseFloat(art[k]) || 0), 0);
//   }, []);

//   const getStockDepots = useCallback((art) => DEPOT_KEYS.map((k) => parseFloat(art?.[k]) || 0), []);

//   const calculateStockValueHT = useCallback((art) => {
//     return calculateStockTotal(art) * (parseFloat(art?.PVTE) || 0);
//   }, [calculateStockTotal]);

//   /**
//    * Classification :
//    * - "deprecie" : ** dans DESIGN ET stock > 0
//    * - "arrete"   : ** dans DESIGN ET stock = 0
//    * - "actif"    : pas de **
//    */
//   const classifyArticle = useCallback((art) => {
//     const design = safeTrim(art.DESIGN);
//     const stock = calculateStockTotal(art);
//     const has = design.includes("**");
//     if (has && stock > 0) return "deprecie";
//     if (has && stock === 0) return "arrete";
//     return "actif";
//   }, [calculateStockTotal]);

//   /**
//    * Réappro magasin : article actif OU déprécié, stock total > 0, S1 (magasin) = 0
//    */
//   const needsReappro = useCallback((art) => {
//     const status = classifyArticle(art);
//     if (status === "arrete") return false;
//     const s1 = parseFloat(art.S1) || 0;
//     const total = calculateStockTotal(art);
//     return total > 0 && s1 === 0;
//   }, [classifyArticle, calculateStockTotal]);

//   const statusLabels = { actif: "Actif", deprecie: "Déprécié", arrete: "Arrêté" };

//   const isPromoActive = useCallback((article) => {
//     if (!article?.DPROMOD || !article?.DPROMOF || !article?.PVPROMO) return false;
//     const p = (d) => {
//       if (!d) return null;
//       if (typeof d === "string" && d.length === 8) return new Date(+d.substring(0, 4), +d.substring(4, 6) - 1, +d.substring(6, 8));
//       if (typeof d === "string") { const x = new Date(d); return isNaN(x.getTime()) ? null : x; }
//       return d instanceof Date ? d : null;
//     };
//     const debut = p(article.DPROMOD), fin = p(article.DPROMOF);
//     if (!debut || !fin) return false;
//     const today = new Date(); today.setHours(0, 0, 0, 0);
//     debut.setHours(0, 0, 0, 0); fin.setHours(23, 59, 59, 999);
//     return today >= debut && today <= fin;
//   }, []);

//   // === Classification ===

//   const articlesByCategory = useMemo(() => {
//     const r = { actif: [], deprecie: [], arrete: [], reappro: [] };
//     allArticles.forEach((a) => {
//       r[classifyArticle(a)].push(a);
//       // L'onglet réappro est transversal : actifs + dépréciés avec S1=0 et stock>0
//       if (needsReappro(a)) r.reappro.push(a);
//     });
//     return r;
//   }, [allArticles, classifyArticle, needsReappro]);

//   const tabCounts = useMemo(() => ({
//     actif: articlesByCategory.actif.length,
//     deprecie: articlesByCategory.deprecie.length,
//     arrete: articlesByCategory.arrete.length,
//     reappro: articlesByCategory.reappro.length,
//   }), [articlesByCategory]);

//   const globalStats = useMemo(() => {
//     const total = allArticles.length;
//     if (total === 0) return null;
//     const calcVal = (arts) => arts.reduce((s, a) => s + calculateStockValueHT(a), 0);
//     const active = articlesByCategory.actif.length;
//     const deprecated = articlesByCategory.deprecie.length;
//     const stopped = articlesByCategory.arrete.length;
//     const reappro = articlesByCategory.reappro.length;
//     return {
//       total, active, deprecated, stopped, reappro,
//       activeRate: ((active / total) * 100).toFixed(1),
//       depRate: ((deprecated / total) * 100).toFixed(1),
//       stopRate: ((stopped / total) * 100).toFixed(1),
//       activeValue: calcVal(articlesByCategory.actif),
//       depValue: calcVal(articlesByCategory.deprecie),
//       totalValue: calcVal(allArticles),
//     };
//   }, [allArticles, articlesByCategory, calculateStockValueHT]);

//   // === Recherche + Pagination ===

//   const currentTabArticles = useMemo(() => {
//     const arts = articlesByCategory[activeTab] || [];
//     if (!searchQuery.trim()) return arts;
//     const q = searchQuery.trim().toLowerCase();
//     return arts.filter((a) => safeTrim(a.NART).toLowerCase().includes(q) || safeTrim(a.DESIGN).toLowerCase().includes(q));
//   }, [articlesByCategory, activeTab, searchQuery]);

//   const totalPages = Math.max(1, Math.ceil(currentTabArticles.length / PAGE_SIZE));
//   const paginatedArticles = currentTabArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

//   // === Export CSV ===

//   const resolveFieldValue = useCallback((art, fieldKey) => {
//     if (fieldKey === "_STATUS") return statusLabels[classifyArticle(art)] || "";
//     if (fieldKey === "_STOCK_TOTAL") return calculateStockTotal(art);
//     if (fieldKey === "_VALEUR_STOCK_HT") return calculateStockValueHT(art);
//     if (fieldKey.startsWith("_F_") && fournisseur) {
//       return safeTrim(fournisseur[fieldKey.replace("_F_", "")]);
//     }
//     return safeTrim(art[fieldKey]);
//   }, [fournisseur, classifyArticle, calculateStockTotal, calculateStockValueHT]);

//   const resolveFieldLabel = useCallback((fieldKey) => {
//     const all = Object.values(EXPORT_FIELDS).flat();
//     const found = all.find(f => f.key === fieldKey);
//     return found?.label || fieldKey;
//   }, []);

//   const openExportModal = (scope) => { setExportScope(scope); setShowExportModal(true); };
//   const toggleExportField = (key) => setExportFields((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

//   const toggleGroupFields = (groupName, allSelected) => {
//     const groupKeys = EXPORT_FIELDS[groupName].map(f => f.key);
//     setExportFields((prev) => allSelected ? prev.filter(k => !groupKeys.includes(k)) : [...new Set([...prev, ...groupKeys])]);
//   };

//   const selectAllFields = () => setExportFields(Object.values(EXPORT_FIELDS).flat().map(f => f.key));
//   const selectNoneFields = () => setExportFields([]);

//   const doExport = useCallback(() => {
//     const articles = exportScope === "all" ? allArticles : (articlesByCategory[exportScope] || []);
//     const scopeLabel = { actif: "actifs", deprecie: "deprecies", arrete: "arretes", reappro: "reappro", all: "tous" };
//     const filename = `articles_${safeTrim(fournisseur?.FOURN)}_${scopeLabel[exportScope] || "export"}.csv`;
//     if (articles.length === 0 || exportFields.length === 0) return;

//     const headers = exportFields.map(k => resolveFieldLabel(k));
//     const rows = articles.map((art) =>
//       exportFields.map((k) => {
//         const val = resolveFieldValue(art, k);
//         if (typeof val === "string" && (val.includes(";") || val.includes('"') || val.includes("\n")))
//           return `"${val.replace(/"/g, '""')}"`;
//         return val;
//       }).join(";")
//     );

//     const csv = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
//     URL.revokeObjectURL(url);
//     setShowExportModal(false);
//   }, [allArticles, articlesByCategory, exportScope, exportFields, fournisseur, resolveFieldValue, resolveFieldLabel]);

//   const handleViewArticle = (art) => { setSelectedArticle(art); setPhotoError(false); setPhotoLoaded(false); };

//   // === Sub-components ===

//   const InfoItem = ({ label, value, icon }) =>
//     value ? (
//       <div className="info-item">
//         <label>{icon && <span className="label-icon">{icon}</span>} {label}</label>
//         <span className="value">{value}</span>
//       </div>
//     ) : null;

//   const StockCell = ({ art }) => {
//     const depots = getStockDepots(art);
//     const total = calculateStockTotal(art);
//     return (
//       <td className="text-right stock-cell">
//         <span className="stock-value-num">{total}</span>
//         {total > 0 && (
//           <div className="stock-tooltip">
//             <div className="stock-tooltip-title">Stock par entrepôt</div>
//             {DEPOT_KEYS.map((key, i) => (
//               <div key={key} className={`stock-tooltip-row ${depots[i] > 0 ? "has-stock" : ""}`}>
//                 <span>{mappingEntrepots[key] || key}</span>
//                 <span className="stock-tooltip-qty">{depots[i]}</span>
//               </div>
//             ))}
//             <div className="stock-tooltip-total"><span>Total</span><span>{total}</span></div>
//           </div>
//         )}
//       </td>
//     );
//   };

//   // === Render ===

//   if (loadingFourn) return <div className="fourn-infos-page"><div className="loading-spinner"></div></div>;
//   if (!fournisseur) return <div className="fourn-infos-page"><div className="error-state">Fournisseur non trouvé</div></div>;

//   return (
//     <div className="fourn-infos-page">
//       <header className="fourn-infos-header">
//         <div className="header-left">
//           <button className="btn-back" onClick={() => navigate(-1)}><HiArrowLeft /></button>
//           <div className="header-title">
//             <div className="header-icon small"><HiOfficeBuilding /></div>
//             <div>
//               <h1>{safeTrim(fournisseur.NOM)}</h1>
//               <span className="header-subtitle">Code Fournisseur : {fournisseur.FOURN}</span>
//             </div>
//           </div>
//         </div>
//         <div className="header-actions">
//           <button className="btn-action" onClick={refetch} title="Rafraîchir"><HiRefresh /></button>
//         </div>
//       </header>

//       <div className="fourn-infos-content">
//         {message && (
//           <div style={{ padding: "10px 16px", margin: "0 0 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textAlign: "center", background: message.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: message.type === "success" ? "#059669" : "#dc2626", border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
//             {message.text}
//           </div>
//         )}
//         <div className="fourn-main-grid">
//           {/* === Colonne Gauche === */}
//           <div className="fourn-left-col">

//             {globalStats && (
//               <div className="fourn-card stats-overview-card">
//                 <h3><HiCube /> Répartition des Articles</h3>
//                 <div className="stats-trio">
//                   <div className="stat-block stat-actif" onClick={() => setActiveTab("actif")}>
//                     <span className="stat-number">{globalStats.active}</span>
//                     <span className="stat-label">Actifs</span>
//                     <span className="stat-value-stock">{formatPriceShort(globalStats.activeValue)}</span>
//                     <div className="stat-bar"><div className="stat-bar-fill actif" style={{ width: `${globalStats.activeRate}%` }} /></div>
//                   </div>
//                   <div className="stat-block stat-deprecie" onClick={() => setActiveTab("deprecie")}>
//                     <span className="stat-number">{globalStats.deprecated}</span>
//                     <span className="stat-label">Dépréciés</span>
//                     <span className="stat-value-stock risk">{formatPriceShort(globalStats.depValue)}</span>
//                     <div className="stat-bar"><div className="stat-bar-fill deprecie" style={{ width: `${globalStats.depRate}%` }} /></div>
//                   </div>
//                   <div className="stat-block stat-arrete" onClick={() => setActiveTab("arrete")}>
//                     <span className="stat-number">{globalStats.stopped}</span>
//                     <span className="stat-label">Arrêtés</span>
//                     <span className="stat-value-stock muted">0 XPF</span>
//                     <div className="stat-bar"><div className="stat-bar-fill arrete" style={{ width: `${globalStats.stopRate}%` }} /></div>
//                   </div>
//                 </div>
//                 <div className="combined-bar">
//                   <div className="combined-segment actif" style={{ width: `${globalStats.activeRate}%` }} />
//                   <div className="combined-segment deprecie" style={{ width: `${globalStats.depRate}%` }} />
//                   <div className="combined-segment arrete" style={{ width: `${globalStats.stopRate}%` }} />
//                 </div>
//                 <div className="stats-total-line">{globalStats.total} articles — Valeur stock totale HT : <strong>{formatPrice(globalStats.totalValue)}</strong></div>
//                 {globalStats.depValue > 0 && (
//                   <div className="stock-value-alert">
//                     <span className="stock-value-alert-label">Valeur stock à risque (HT) :</span>
//                     <span className="stock-value-alert-amount">{formatPrice(globalStats.depValue)}</span>
//                   </div>
//                 )}
//                 {globalStats.reappro > 0 && (
//                   <div className="reappro-alert" onClick={() => setActiveTab("reappro")}>
//                     <HiSwitchHorizontal />
//                     <span><strong>{globalStats.reappro}</strong> article{globalStats.reappro > 1 ? "s" : ""} à réapprovisionner en {mappingEntrepots.S1 || "Magasin"}</span>
//                   </div>
//                 )}
//               </div>
//             )}

//             <div className="fourn-card">
//               <h3><HiLocationMarker /> Coordonnées</h3>
//               <div className="info-grid-2cols">
//                 <InfoItem label="Adresse 1" value={safeTrim(fournisseur.AD1)} />
//                 <InfoItem label="Adresse 2" value={safeTrim(fournisseur.AD2)} />
//                 <InfoItem label="Adresse 3" value={safeTrim(fournisseur.AD3)} />
//                 <InfoItem label="Adresse 4" value={safeTrim(fournisseur.AD4)} />
//                 <InfoItem label="Adresse 5" value={safeTrim(fournisseur.AD5)} />
//                 <InfoItem label="Localisation" value={safeTrim(fournisseur.LOCAL)} icon={<HiLocationMarker />} />
//               </div>
//               <div className="info-grid-2cols mt-1">
//                 <InfoItem label="Téléphone" value={safeTrim(fournisseur.TEL)} icon={<HiPhone />} />
//                 <InfoItem label="Fax" value={safeTrim(fournisseur.FAX)} icon={<HiDocumentText />} />
//                 <InfoItem label="Télex / Email" value={safeTrim(fournisseur.TLX)} icon={<HiMail />} />
//               </div>
//             </div>

//             <div className="fourn-card">
//               <h3><HiCalculator /> Informations Commerciales</h3>
//               <div className="info-grid-2cols">
//                 <InfoItem label="Délai Appro (Jours)" value={safeTrim(fournisseur.DELAPRO)} icon={<HiCalendar />} />
//                 <InfoItem label="Coef Stock Mini" value={safeTrim(fournisseur.COEFSMINI)} />
//                 <InfoItem label="Franco" value={safeTrim(fournisseur.FRANCO)} />
//                 <InfoItem label="Code Texte" value={safeTrim(fournisseur.TEXTE)} />
//               </div>
//             </div>

//             {safeTrim(fournisseur.OBSERV) && (
//               <div className="fourn-card observations"><h3><HiAnnotation /> Observations</h3><p>{safeTrim(fournisseur.OBSERV)}</p></div>
//             )}

//             {Array.from({ length: 10 }, (_, i) => safeTrim(fournisseur[`NOT${i + 1}`])).some((v) => v) && (
//               <div className="fourn-card notes-section">
//                 <h3><HiDocumentText /> Notes &amp; Textes</h3>
//                 <div className="notes-grid">
//                   {Array.from({ length: 10 }, (_, i) => safeTrim(fournisseur[`NOT${i + 1}`])).map(
//                     (note, idx) => note && <div key={idx} className="note-item">{note}</div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* === Colonne Droite === */}
//           <div className="fourn-right-col">
//             <div className="fourn-card articles-section">
//               <div className="section-header">
//                 <h3><HiCube /> Articles fournis</h3>
//                 <div className="section-header-right">
//                   <span className="badge">{allArticles.length} réf.</span>
//                   <div className="export-dropdown">
//                     <button className="btn-export" title="Exporter CSV"><HiDownload /> <span>Export</span></button>
//                     <div className="export-menu">
//                       <button onClick={() => openExportModal(activeTab)}><HiAdjustments /> Onglet actuel ({TABS.find(t => t.key === activeTab)?.label})</button>
//                       <button onClick={() => openExportModal("all")}><HiAdjustments /> Tous les articles</button>
//                       <div className="export-sep"></div>
//                       {TABS.map(t => (
//                         <button key={t.key} onClick={() => openExportModal(t.key)}>{t.label} ({tabCounts[t.key]})</button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Onglets */}
//               <div className="articles-tabs">
//                 {TABS.map((tab) => (
//                   <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? "active" : ""} tab-${tab.key}`} onClick={() => setActiveTab(tab.key)}>
//                     <span className="tab-icon">{tab.icon}</span>
//                     <span className="tab-label">{tab.label}</span>
//                     <span className={`tab-count tab-count-${tab.key}`}>{tabCounts[tab.key]}</span>
//                   </button>
//                 ))}
//               </div>

//               {/* Recherche */}
//               <div className="search-bar">
//                 <HiSearch className="search-icon" />
//                 <input ref={searchInputRef} type="text" placeholder="Rechercher par code ou désignation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
//                 {searchQuery && <button className="search-clear" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}><HiX /></button>}
//                 {searchQuery && <span className="search-count">{currentTabArticles.length} résultat{currentTabArticles.length !== 1 ? "s" : ""}</span>}
//               </div>

//               {/* Info réappro + bouton demande */}
//               {activeTab === "reappro" && tabCounts.reappro > 0 && (
//                 <div className="reappro-info-banner">
//                   <HiSwitchHorizontal />
//                   <span>Articles avec du stock disponible mais <strong>0 en {mappingEntrepots.S1 || "Magasin"}</strong> — à transférer depuis un autre entrepôt.</span>
//                   <button
//                     className="btn-demande-reappro"
//                     onClick={() => {
//                       setSelectedForDemande(articlesByCategory.reappro);
//                       setShowDemandeModal(true);
//                     }}
//                   >
//                     <HiSwitchHorizontal /> Créer une demande de réappro ({tabCounts.reappro} art.)
//                   </button>
//                 </div>
//               )}

//               {loadingArticles ? (
//                 <div className="loading-inline"><div className="loading-spinner small"></div></div>
//               ) : paginatedArticles.length > 0 ? (
//                 <>
//                   <table className="linked-articles-table">
//                     <thead>
//                       <tr>
//                         <th>NART</th>
//                         <th>DESIGN</th>
//                         <th className="text-right">Stock Tot.</th>
//                         <th className="text-right">{mappingEntrepots.S1}</th>
//                         {activeTab === "reappro" && DEPOT_KEYS.slice(1).map(k => (
//                           <th key={k} className="text-right">{mappingEntrepots[k] || k}</th>
//                         ))}
//                         <th className="text-right">PVTE</th>
//                         <th className="text-right">Val. HT</th>
//                         <th className="text-center">Statut</th>
//                         <th className="col-actions"></th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {paginatedArticles.map((art) => {
//                         const status = classifyArticle(art);
//                         const s1 = parseFloat(art.S1) || 0;
//                         const hasPromo = isPromoActive(art);
//                         const valHT = calculateStockValueHT(art);
//                         return (
//                           <tr key={art.NART} className={`row-${status} ${needsReappro(art) && activeTab !== "reappro" ? "row-needs-reappro" : ""}`}>
//                             <td>
//                               <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(art.NART)}`} className="link-nart">
//                                 {safeTrim(art.NART)} <HiExternalLink />
//                               </Link>
//                             </td>
//                             <td>
//                               <div className="cell-design">
//                                 <span>{safeTrim(art.DESIGN)}</span>
//                                 {hasPromo && <span className="mini-badge promo"><HiTag /></span>}
//                                 {needsReappro(art) && activeTab !== "reappro" && <span className="mini-badge reappro" title="Réappro magasin"><HiSwitchHorizontal /></span>}
//                               </div>
//                             </td>
//                             <StockCell art={art} />
//                             <td className="text-right">
//                               <span className={`stock-s1 ${s1 > 0 ? "positive" : "zero"}`}>{formatStock(s1)}</span>
//                             </td>
//                             {activeTab === "reappro" && DEPOT_KEYS.slice(1).map(k => {
//                               const v = parseFloat(art[k]) || 0;
//                               return <td key={k} className="text-right"><span className={`stock-s1 ${v > 0 ? "positive" : "zero"}`}>{formatStock(v)}</span></td>;
//                             })}
//                             <td className="text-right">{formatPrice(art.PVTE)}</td>
//                             <td className="text-right">
//                               <span className={`val-stock ${valHT > 0 ? "" : "zero"}`}>{valHT > 0 ? formatPrice(valHT) : "-"}</span>
//                             </td>
//                             <td className="text-center">
//                               {status === "deprecie" && <span className="status-badge status-deprecie"><HiTrendingDown /> Déprécié</span>}
//                               {status === "arrete" && <span className="status-badge status-arrete"><HiBan /> Arrêté</span>}
//                               {status === "actif" && <span className="status-badge status-actif"><HiCheckCircle /> Actif</span>}
//                             </td>
//                             <td className="col-actions">
//                               <button className="btn-view-art" onClick={() => handleViewArticle(art)} title="Aperçu rapide"><HiEye /></button>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>

//                   {totalPages > 1 && (
//                     <div className="pagination-mini">
//                       <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}><HiChevronLeft /></button>
//                       <span>Page {currentPage} / {totalPages}<span className="pagination-total"> ({currentTabArticles.length} articles)</span></span>
//                       <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}><HiChevronRight /></button>
//                     </div>
//                   )}
//                 </>
//               ) : (
//                 <div className="empty-state-mini">
//                   <div className="empty-icon">{searchQuery ? <HiSearch /> : activeTab === "reappro" ? <HiSwitchHorizontal /> : activeTab === "actif" ? <HiCheckCircle /> : activeTab === "deprecie" ? <HiTrendingDown /> : <HiBan />}</div>
//                   <p>{searchQuery ? `Aucun résultat pour "${searchQuery}".` : activeTab === "reappro" ? "Aucun article à réapprovisionner." : activeTab === "actif" ? "Aucun article actif." : activeTab === "deprecie" ? "Aucun article déprécié." : "Aucun article arrêté."}</p>
//                   {searchQuery && <button className="btn-clear-search" onClick={() => setSearchQuery("")}>Effacer la recherche</button>}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ==================== MODAL EXPORT CSV ==================== */}
//       {showExportModal && (
//         <div className="article-modal-overlay" onClick={() => setShowExportModal(false)}>
//           <div className="export-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <div className="modal-title">
//                 <HiDownload />
//                 <div>
//                   <h2>Export CSV</h2>
//                   <span className="modal-nart">
//                     {exportScope === "all" ? "Tous les articles" : TABS.find(t => t.key === exportScope)?.label || exportScope}
//                     {" — "}{(exportScope === "all" ? allArticles : articlesByCategory[exportScope] || []).length} articles
//                   </span>
//                 </div>
//               </div>
//               <button className="btn-close-modal" onClick={() => setShowExportModal(false)}><HiX /></button>
//             </div>
//             <div className="export-modal-body">
//               <div className="export-scope-bar">
//                 <span className="export-scope-label">Périmètre :</span>
//                 {[{ key: "all", label: "Tous" }, ...TABS.map(t => ({ key: t.key, label: t.label }))].map((s) => (
//                   <button key={s.key} className={`export-scope-btn ${exportScope === s.key ? "active" : ""}`} onClick={() => setExportScope(s.key)}>
//                     {s.label} ({(s.key === "all" ? allArticles : articlesByCategory[s.key] || []).length})
//                   </button>
//                 ))}
//               </div>
//               <div className="export-actions-bar">
//                 <button className="btn-select-all" onClick={selectAllFields}>Tout sélectionner</button>
//                 <button className="btn-select-none" onClick={selectNoneFields}>Tout désélectionner</button>
//                 <button className="btn-select-default" onClick={() => setExportFields(DEFAULT_SELECTED)}>Par défaut</button>
//                 <span className="export-field-count">{exportFields.length} champ{exportFields.length !== 1 ? "s" : ""}</span>
//               </div>
//               <div className="export-fields-grid">
//                 {Object.entries(EXPORT_FIELDS).map(([groupName, fields]) => {
//                   const groupKeys = fields.map(f => f.key);
//                   const selectedInGroup = groupKeys.filter(k => exportFields.includes(k)).length;
//                   const allGroupSelected = selectedInGroup === groupKeys.length;
//                   return (
//                     <div key={groupName} className="export-field-group">
//                       <div className="export-group-header" onClick={() => toggleGroupFields(groupName, allGroupSelected)}>
//                         <input type="checkbox" checked={allGroupSelected} readOnly className="group-checkbox" onChange={() => {}} />
//                         <span className="export-group-name">{groupName}</span>
//                         <span className="export-group-count">{selectedInGroup}/{groupKeys.length}</span>
//                       </div>
//                       <div className="export-group-fields">
//                         {fields.map((field) => (
//                           <label key={field.key} className={`export-field-item ${exportFields.includes(field.key) ? "selected" : ""}`}>
//                             <input type="checkbox" checked={exportFields.includes(field.key)} onChange={() => toggleExportField(field.key)} />
//                             <span className="field-label">{field.label}</span>
//                           </label>
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//             <div className="export-modal-footer">
//               <button className="btn-cancel" onClick={() => setShowExportModal(false)}>Annuler</button>
//               <button className="btn-do-export" onClick={doExport} disabled={exportFields.length === 0}>
//                 <HiDownload /> Exporter {(exportScope === "all" ? allArticles : articlesByCategory[exportScope] || []).length} articles ({exportFields.length} champs)
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ==================== MODAL DÉTAIL ARTICLE ==================== */}
//       {selectedArticle && (
//         <div className="article-modal-overlay" onClick={() => setSelectedArticle(null)}>
//           <div className="article-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="modal-header">
//               <div className="modal-title">
//                 <HiCube />
//                 <div><h2>Détails de l'article</h2><span className="modal-nart">{safeTrim(selectedArticle.NART)}</span></div>
//               </div>
//               <div className="modal-header-actions">
//                 <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(selectedArticle.NART)}`} className="btn-view-full"><HiExternalLink /> <span>Fiche complète</span></Link>
//                 <button className="btn-close-modal" onClick={() => setSelectedArticle(null)}><HiX /></button>
//               </div>
//             </div>
//             <div className="modal-body">
//               <div className="modal-grid">
//                 {hasPhotosConfigured && (
//                   <div className="modal-photo-section">
//                     {!photoError ? (
//                       <div className={`photo-wrapper ${photoLoaded ? "loaded" : ""}`}>
//                         <img src={getPhotoUrl(trigramme, selectedArticle.NART)} alt={safeTrim(selectedArticle.DESIGN)} onError={() => setPhotoError(true)} onLoad={() => setPhotoLoaded(true)} />
//                         {!photoLoaded && <div className="photo-loading"><div className="loading-spinner small"></div></div>}
//                       </div>
//                     ) : (
//                       <div className="no-photo"><HiPhotograph /><span>Photo non disponible</span></div>
//                     )}
//                     <div className="modal-badges">
//                       {isPromoActive(selectedArticle) && <span className="modal-badge promo"><HiTag /> PROMO</span>}
//                       {classifyArticle(selectedArticle) === "deprecie" && <span className="modal-badge deprec-stock"><HiExclamation /> DÉPRÉCIÉ</span>}
//                       {classifyArticle(selectedArticle) === "arrete" && <span className="modal-badge arrete"><HiBan /> ARRÊTÉ</span>}
//                       {needsReappro(selectedArticle) && <span className="modal-badge reappro-badge"><HiSwitchHorizontal /> RÉAPPRO</span>}
//                       {selectedArticle.WEB?.toString().toUpperCase().trim() === "O" && <span className="modal-badge web"><HiGlobe /> WEB</span>}
//                     </div>
//                   </div>
//                 )}
//                 <div className="modal-info-section">
//                   <div className="info-block designation-block">
//                     <h3>{safeTrim(selectedArticle.DESIGN)}</h3>
//                     {safeTrim(selectedArticle.DESIGN2) && <p>{safeTrim(selectedArticle.DESIGN2)}</p>}
//                   </div>

//                   {classifyArticle(selectedArticle) === "arrete" && (
//                     <div className="arrete-banner"><HiBan /><div><strong>Article arrêté</strong><span>Déprécié et sans stock</span></div></div>
//                   )}
//                   {classifyArticle(selectedArticle) === "deprecie" && (
//                     <div className="deprec-stock-banner"><HiExclamation /><div><strong>Article déprécié</strong><span>Stock restant: {formatStock(calculateStockTotal(selectedArticle))} — Valeur HT: {formatPrice(calculateStockValueHT(selectedArticle))}</span></div></div>
//                   )}
//                   {needsReappro(selectedArticle) && (
//                     <div className="reappro-banner">
//                       <HiSwitchHorizontal />
//                       <div><strong>Réappro {mappingEntrepots.S1} nécessaire</strong><span>Stock total {formatStock(calculateStockTotal(selectedArticle))} mais {mappingEntrepots.S1} à 0</span></div>
//                       <button
//                         className="btn-demande-reappro-sm"
//                         onClick={() => {
//                           setSelectedForDemande([selectedArticle]);
//                           setSelectedArticle(null);
//                           setShowDemandeModal(true);
//                         }}
//                       >
//                         <HiSwitchHorizontal /> Demander réappro
//                       </button>
//                     </div>
//                   )}

//                   <div className="info-grid codes-grid">
//                     <div className="info-item"><label>NART</label><span className="value highlight">{safeTrim(selectedArticle.NART)}</span></div>
//                     <div className="info-item"><label>GENCOD</label><span className="value mono">{safeTrim(selectedArticle.GENCOD) || "-"}</span></div>
//                     <div className="info-item"><label>REFER</label><span className="value">{safeTrim(selectedArticle.REFER) || "-"}</span></div>
//                     <div className="info-item"><label>FOURN</label><span className="value">{selectedArticle.FOURN || "-"}</span></div>
//                     <div className="info-item"><label>GROUPE</label><span className="value tag">{safeTrim(selectedArticle.GROUPE) || "-"}</span></div>
//                     <div className="info-item"><label>UNITE</label><span className="value">{safeTrim(selectedArticle.UNITE) || "-"}</span></div>
//                   </div>

//                   <div className="info-block price-block">
//                     <h4><HiCurrencyDollar /> Prix</h4>
//                     <div className="price-grid">
//                       <div className="price-item main"><label>PVTE (HT)</label><span>{formatPrice(selectedArticle.PVTE)}</span></div>
//                       <div className="price-item"><label>PVTETTC</label><span className={isPromoActive(selectedArticle) ? "strikethrough" : ""}>{formatPrice(selectedArticle.PVTETTC)}</span></div>
//                       {isPromoActive(selectedArticle) && <div className="price-item promo-price"><label>PVPROMO</label><span>{formatPrice(selectedArticle.PVPROMO)}</span></div>}
//                       <div className="price-item"><label>PACHAT</label><span>{formatPrice(selectedArticle.PACHAT)}</span></div>
//                       <div className="price-item"><label>PREV</label><span>{formatPrice(selectedArticle.PREV)}</span></div>
//                       <div className="price-item"><label>TAXES</label><span>{selectedArticle.TAXES || 0}%</span></div>
//                     </div>
//                   </div>

//                   <div className="info-block stock-block">
//                     <h4><HiArchive /> Stocks par entrepôt</h4>
//                     <div className="stock-grid">
//                       <div className="stock-item total"><label>Total</label><span className={calculateStockTotal(selectedArticle) > 0 ? "positive" : "zero"}>{formatStock(calculateStockTotal(selectedArticle))}</span></div>
//                       {DEPOT_KEYS.map((key) => (
//                         <div key={key} className={`stock-item ${key === "S1" && needsReappro(selectedArticle) ? "stock-item-alert" : ""}`}>
//                           <label>{mappingEntrepots[key] || key}</label>
//                           <span className={parseFloat(selectedArticle[key]) > 0 ? "positive" : "zero"}>{formatStock(selectedArticle[key])}</span>
//                         </div>
//                       ))}
//                       <div className="stock-item"><label>RESERV</label><span className="reserved">{formatStock(selectedArticle.RESERV)}</span></div>
//                       <div className="stock-item"><label>SMINI</label><span>{formatStock(selectedArticle.SMINI)}</span></div>
//                     </div>
//                     {calculateStockTotal(selectedArticle) > 0 && (
//                       <div className="stock-value-line">Valeur stock HT : <strong>{formatPrice(calculateStockValueHT(selectedArticle))}</strong></div>
//                     )}
//                   </div>

//                   {(selectedArticle.GISM1 || selectedArticle.GISM2 || selectedArticle.GISM3 || selectedArticle.PLACE) && (
//                     <div className="info-block gisement-block">
//                       <h4><HiLocationMarker /> Emplacements</h4>
//                       <div className="gisement-grid">
//                         {selectedArticle.PLACE && <div className="gisement-item main"><label>PLACE</label><span>{safeTrim(selectedArticle.PLACE)}</span></div>}
//                         {[1,2,3,4,5].map((n) => selectedArticle[`GISM${n}`] && <div key={n} className="gisement-item"><label>GISM{n}</label><span>{safeTrim(selectedArticle[`GISM${n}`])}</span></div>)}
//                       </div>
//                     </div>
//                   )}

//                   <div className="info-block dates-block">
//                     <h4><HiCalendar /> Dates</h4>
//                     <div className="info-grid">
//                       <div className="info-item"><label>CREATION</label><span className="value">{formatDate(selectedArticle.CREATION)}</span></div>
//                       <div className="info-item"><label>DATINV</label><span className="value">{formatDate(selectedArticle.DATINV)}</span></div>
//                       {selectedArticle.DPROMOD && <div className="info-item"><label>DPROMOD</label><span className="value">{formatDate(selectedArticle.DPROMOD)}</span></div>}
//                       {selectedArticle.DPROMOF && <div className="info-item"><label>DPROMOF</label><span className="value">{formatDate(selectedArticle.DPROMOF)}</span></div>}
//                     </div>
//                   </div>

//                   {safeTrim(selectedArticle.OBSERV) && (
//                     <div className="info-block observations-block"><h4><HiAnnotation /> OBSERV</h4><p className="observations-text">{safeTrim(selectedArticle.OBSERV)}</p></div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ==================== MODAL DEMANDE RÉAPPRO ==================== */}
//       <DemandeReapproModal
//         isOpen={showDemandeModal}
//         onClose={() => setShowDemandeModal(false)}
//         entrepriseId={entrepriseData?._id}
//         articles={selectedForDemande}
//         source={selectedForDemande.length === 1 ? "article" : "fournisseur"}
//         fournisseurCode={fournisseur?.FOURN?.toString() || ""}
//         fournisseurNom={safeTrim(fournisseur?.NOM)}
//         mappingEntrepots={mappingEntrepots}
//         onSuccess={() => {
//           setMessage({ text: "✅ Demande de réappro envoyée avec succès !", type: "success" });
//           setTimeout(() => setMessage(null), 4000);
//         }}
//       />
//     </div>
//   );
// };

// export default AdminFournisseurInfosScreen;
// src/screens/admin/AdminFournisseurInfosScreen.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiArrowLeft, HiOfficeBuilding, HiPhone, HiLocationMarker, HiDocumentText,
  HiCube, HiChevronLeft, HiChevronRight, HiRefresh, HiExternalLink,
  HiCalculator, HiCalendar, HiMail, HiAnnotation, HiBan, HiTrendingDown,
  HiCheckCircle, HiSearch, HiDownload, HiX, HiEye, HiTag, HiPhotograph,
  HiGlobe, HiExclamation, HiCurrencyDollar, HiArchive, HiAdjustments,
  HiSwitchHorizontal, HiClipboardList, HiTruck
} from "react-icons/hi";
import { useGetEntrepriseByDossierQuery } from "../../slices/entrepriseApiSlice";
import {
  useGetFournisseurByCodeQuery,
  useGetArticlesByFournisseurQuery,
} from "../../slices/fournissApiSlice";
import {
  useGetCommandesByFournisseurQuery,
  useGetCommandeDetailsQuery,
} from "../../slices/commandeApiSlice";
import { getPhotoUrl } from "../../slices/articleApiSlice";
import DemandeReapproModal from "../../components/Admin/DemandeReapproModal";
import "./AdminFournisseurInfosScreen.css";

// === CONSTANTES ===

const TABS = [
  { key: "actif", label: "Actifs", icon: <HiCheckCircle /> },
  { key: "deprecie", label: "Dépréciés", icon: <HiTrendingDown /> },
  { key: "arrete", label: "Arrêtés", icon: <HiBan /> },
  { key: "reappro", label: "Réappro Magasin", icon: <HiSwitchHorizontal /> },
];

const PAGE_SIZE = 25;
const CMD_PAGE_SIZE = 20;
const DEFAULT_MAPPING = { S1: "Magasin", S2: "S2", S3: "S3", S4: "S4", S5: "S5" };
const DEPOT_KEYS = ["S1", "S2", "S3", "S4", "S5"];

const ETAT_LABELS = {
  0: "Brouillon",
  1: "Validée",
  2: "En cours",
  3: "Réceptionnée",
  4: "Facturée",
  5: "Clôturée",
};

const ETAT_COLORS = {
  0: "#606070",
  1: "#06b6d4",
  2: "#f59e0b",
  3: "#10b981",
  4: "#8b5cf6",
  5: "#404050",
};

// ============================================================
// EXPORT : champs avec leurs vrais noms DBF
// ============================================================
const EXPORT_FIELDS = {
  "Article - Identification": [
    { key: "NART", label: "NART", default: true },
    { key: "DESIGN", label: "DESIGN", default: true },
    { key: "DESIGN2", label: "DESIGN2" },
    { key: "GENCOD", label: "GENCOD" },
    { key: "GROUPE", label: "GROUPE" },
    { key: "FOURN", label: "FOURN", default: true },
    { key: "REFER", label: "REFER" },
    { key: "UNITE", label: "UNITE" },
    { key: "DOUANE", label: "DOUANE" },
    { key: "VOL", label: "VOL" },
    { key: "WEB", label: "WEB" },
    { key: "FOTO", label: "FOTO" },
    { key: "_STATUS", label: "STATUT (calculé)", default: true },
  ],
  "Article - Prix": [
    { key: "PVTETTC", label: "PVTETTC" },
    { key: "PVTE", label: "PVTE", default: true },
    { key: "PVPROMO", label: "PVPROMO" },
    { key: "PACHAT", label: "PACHAT" },
    { key: "PREV", label: "PREV" },
    { key: "TAXES", label: "TAXES" },
    { key: "DEPREC", label: "DEPREC" },
    { key: "_VALEUR_STOCK_HT", label: "VALEUR_STOCK_HT (calculé)" },
  ],
  "Article - Stocks": [
    { key: "_STOCK_TOTAL", label: "STOCK_TOTAL (calculé)", default: true },
    { key: "S1", label: "S1", default: true },
    { key: "S2", label: "S2" },
    { key: "S3", label: "S3" },
    { key: "S4", label: "S4" },
    { key: "S5", label: "S5" },
    { key: "RESERV", label: "RESERV" },
    { key: "SMINI", label: "SMINI" },
  ],
  "Article - Emplacements": [
    { key: "PLACE", label: "PLACE" },
    { key: "GISM1", label: "GISM1" },
    { key: "GISM2", label: "GISM2" },
    { key: "GISM3", label: "GISM3" },
    { key: "GISM4", label: "GISM4" },
    { key: "GISM5", label: "GISM5" },
  ],
  "Article - Dates": [
    { key: "CREATION", label: "CREATION" },
    { key: "DATINV", label: "DATINV" },
    { key: "DPROMOD", label: "DPROMOD" },
    { key: "DPROMOF", label: "DPROMOF" },
  ],
  "Article - Divers": [
    { key: "OBSERV", label: "OBSERV" },
  ],
  "Fournisseur": [
    { key: "_F_NOM", label: "F_NOM" },
    { key: "_F_AD1", label: "F_AD1" },
    { key: "_F_AD2", label: "F_AD2" },
    { key: "_F_AD3", label: "F_AD3" },
    { key: "_F_AD4", label: "F_AD4" },
    { key: "_F_AD5", label: "F_AD5" },
    { key: "_F_LOCAL", label: "F_LOCAL" },
    { key: "_F_TEL", label: "F_TEL" },
    { key: "_F_FAX", label: "F_FAX" },
    { key: "_F_TLX", label: "F_TLX" },
    { key: "_F_DELAPRO", label: "F_DELAPRO" },
    { key: "_F_COEFSMINI", label: "F_COEFSMINI" },
    { key: "_F_FRANCO", label: "F_FRANCO" },
    { key: "_F_TEXTE", label: "F_TEXTE" },
    { key: "_F_OBSERV", label: "F_OBSERV" },
  ],
};

const DEFAULT_SELECTED = Object.values(EXPORT_FIELDS).flat().filter(f => f.default).map(f => f.key);

// ============================================================
// COMPOSANT : Modal détail commande (lignes)
// ============================================================
const CommandeDetailModal = ({ numcde, nomDossierDBF, onClose }) => {
  const { data, isLoading, error } = useGetCommandeDetailsQuery(
    { nomDossierDBF, numcde },
    { skip: !numcde || !nomDossierDBF }
  );

  const formatPrice = (p) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XPF", minimumFractionDigits: 0 }).format(p || 0);

  const safeTrim = (val) => (val === null || val === undefined ? "" : String(val).trim());

  const lignes = data?.lignes || [];
  const resume = data?.resume || {};

  return (
    <div className="article-modal-overlay" onClick={onClose}>
      <div className="commande-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <HiClipboardList />
            <div>
              <h2>Détails commande</h2>
              <span className="modal-nart">{numcde}</span>
            </div>
          </div>
          <div className="modal-header-actions">
            <Link
              to={`/admin/commandes/${nomDossierDBF}/${numcde}`}
              className="btn-view-full"
            >
              <HiExternalLink /> <span>Page complète</span>
            </Link>
            <button className="btn-close-modal" onClick={onClose}><HiX /></button>
          </div>
        </div>
        <div className="modal-body">
          {isLoading ? (
            <div className="loading-inline"><div className="loading-spinner small"></div></div>
          ) : error ? (
            <div className="cmd-modal-error">Erreur lors du chargement des détails</div>
          ) : (
            <>
              {/* Résumé */}
              {resume.totaux && (
                <div className="cmd-modal-resume">
                  <div className="cmd-resume-item">
                    <span className="cmd-resume-label">Lignes</span>
                    <span className="cmd-resume-value">{resume.totalLignes}</span>
                  </div>
                  <div className="cmd-resume-item">
                    <span className="cmd-resume-label">Montant total</span>
                    <span className="cmd-resume-value highlight">{formatPrice(resume.totaux.totalMontant)}</span>
                  </div>
                  <div className="cmd-resume-item">
                    <span className="cmd-resume-label">Qté totale</span>
                    <span className="cmd-resume-value">{resume.totaux.totalQte}</span>
                  </div>
                  <div className="cmd-resume-item">
                    <span className="cmd-resume-label">Rentré</span>
                    <span className="cmd-resume-value">{resume.totaux.totalRentre}</span>
                  </div>
                  <div className="cmd-resume-item">
                    <span className="cmd-resume-label">Pointées</span>
                    <span className="cmd-resume-value">{resume.lignesPointees}/{resume.totalLignes}</span>
                  </div>
                </div>
              )}

              {/* Table des lignes */}
              {lignes.length > 0 ? (
                <div className="cmd-modal-table-wrap">
                  <table className="cmd-modal-table">
                    <thead>
                      <tr>
                        <th>NL</th>
                        <th>NART</th>
                        <th>Désignation</th>
                        <th className="text-right">Qté</th>
                        <th className="text-right">P.Achat</th>
                        <th className="text-right">Montant</th>
                        <th className="text-right">Rentré</th>
                        <th className="text-center">Pointé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignes.map((ligne, idx) => (
                        <tr key={idx} className={safeTrim(ligne.POINTE) === "O" ? "row-pointee" : ""}>
                          <td className="col-nl">{ligne.NL}</td>
                          <td>
                            <Link
                              to={`/admin/articles/${nomDossierDBF}/${safeTrim(ligne.NART)}`}
                              className="link-nart"
                            >
                              {safeTrim(ligne.NART)}
                            </Link>
                          </td>
                          <td className="col-design-cmd">
                            {safeTrim(ligne.DESIGN) || safeTrim(ligne.DESIGN2) || "-"}
                            {ligne._designFromArticle && <span className="from-art-badge" title="Désignation issue de article.dbf">art</span>}
                          </td>
                          <td className="text-right">{parseFloat(ligne.QTE) || 0}</td>
                          <td className="text-right">{formatPrice(ligne.PACHAT)}</td>
                          <td className="text-right cmd-montant">{formatPrice(ligne.MONTANT)}</td>
                          <td className="text-right">{parseFloat(ligne.RENTRE) || 0}</td>
                          <td className="text-center">
                            {safeTrim(ligne.POINTE) === "O"
                              ? <HiCheckCircle className="pointe-icon yes" />
                              : <span className="pointe-icon no">-</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="cmd-modal-empty">Aucune ligne trouvée pour cette commande.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};


// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const AdminFournisseurInfosScreen = () => {
  const { nomDossierDBF, fournId } = useParams();
  const navigate = useNavigate();

  const [selectedEntreprise, setSelectedEntreprise] = useState(nomDossierDBF || "");
  const [activeTab, setActiveTab] = useState("actif");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [photoError, setPhotoError] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState("actif");
  const [exportFields, setExportFields] = useState(DEFAULT_SELECTED);
  const [showDemandeModal, setShowDemandeModal] = useState(false);
  const [selectedForDemande, setSelectedForDemande] = useState([]);
  const [message, setMessage] = useState(null);
  const searchInputRef = useRef(null);

  // === État commandes ===
  const [cmdPage, setCmdPage] = useState(1);
  const [cmdSearch, setCmdSearch] = useState("");
  const [selectedCommande, setSelectedCommande] = useState(null); // NUMCDE pour le modal

  // === Queries ===

  const { data: entrepriseData } = useGetEntrepriseByDossierQuery(selectedEntreprise, {
    skip: !selectedEntreprise,
  });

  const { data: fournData, isLoading: loadingFourn, refetch } =
    useGetFournisseurByCodeQuery(
      { nomDossierDBF: selectedEntreprise, fourn: fournId },
      { skip: !selectedEntreprise || !fournId }
    );

  const { data: articlesData, isLoading: loadingArticles } =
    useGetArticlesByFournisseurQuery(
      { nomDossierDBF: selectedEntreprise, fourn: fournId, page: 1, limit: 99999 },
      { skip: !selectedEntreprise || !fournId }
    );

  const {
    data: commandesData,
    isLoading: loadingCommandes,
    isFetching: fetchingCommandes,
  } = useGetCommandesByFournisseurQuery(
    { nomDossierDBF: selectedEntreprise, fourn: fournId, page: cmdPage, limit: CMD_PAGE_SIZE },
    { skip: !selectedEntreprise || !fournId }
  );

  const fournisseur = fournData?.fournisseur;
  const allArticles = articlesData?.articles || [];

  const commandes = commandesData?.commandes || [];
  const cmdPagination = commandesData?.pagination || {};

  const mappingEntrepots = useMemo(() => {
    return entrepriseData?.mappingEntrepots || DEFAULT_MAPPING;
  }, [entrepriseData]);

  const hasPhotosConfigured = !!entrepriseData?.cheminPhotos;
  const trigramme = entrepriseData?.trigramme;

  useEffect(() => { if (nomDossierDBF) setSelectedEntreprise(nomDossierDBF); }, [nomDossierDBF]);
  useEffect(() => { setCurrentPage(1); setActiveTab("actif"); setSearchQuery(""); setCmdPage(1); setCmdSearch(""); }, [fournId]);
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  // === Helpers ===

  const safeTrim = (val) => (val === null || val === undefined ? "" : String(val).trim());

  const formatPrice = (p) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XPF", minimumFractionDigits: 0 }).format(p || 0);

  const formatPriceShort = (p) => {
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M XPF`;
    if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K XPF`;
    return formatPrice(p);
  };

  const formatStock = (stock) => {
    if (stock === null || stock === undefined) return "-";
    const num = parseFloat(stock);
    return isNaN(num) ? "-" : num.toLocaleString("fr-FR");
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    if (dateValue instanceof Date) return dateValue.toLocaleDateString("fr-FR");
    if (typeof dateValue === "string" && dateValue.length === 8)
      return `${dateValue.substring(6, 8)}/${dateValue.substring(4, 6)}/${dateValue.substring(0, 4)}`;
    if (typeof dateValue === "string") {
      const d = new Date(dateValue);
      return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("fr-FR");
    }
    return "-";
  };

  const calculateStockTotal = useCallback((art) => {
    if (!art) return 0;
    return DEPOT_KEYS.reduce((sum, k) => sum + (parseFloat(art[k]) || 0), 0);
  }, []);

  const getStockDepots = useCallback((art) => DEPOT_KEYS.map((k) => parseFloat(art?.[k]) || 0), []);

  const calculateStockValueHT = useCallback((art) => {
    return calculateStockTotal(art) * (parseFloat(art?.PVTE) || 0);
  }, [calculateStockTotal]);

  const classifyArticle = useCallback((art) => {
    const design = safeTrim(art.DESIGN);
    const stock = calculateStockTotal(art);
    const has = design.includes("**");
    if (has && stock > 0) return "deprecie";
    if (has && stock === 0) return "arrete";
    return "actif";
  }, [calculateStockTotal]);

  const needsReappro = useCallback((art) => {
    const status = classifyArticle(art);
    if (status === "arrete") return false;
    const s1 = parseFloat(art.S1) || 0;
    const total = calculateStockTotal(art);
    return total > 0 && s1 === 0;
  }, [classifyArticle, calculateStockTotal]);

  const statusLabels = { actif: "Actif", deprecie: "Déprécié", arrete: "Arrêté" };

  const isPromoActive = useCallback((article) => {
    if (!article?.DPROMOD || !article?.DPROMOF || !article?.PVPROMO) return false;
    const p = (d) => {
      if (!d) return null;
      if (typeof d === "string" && d.length === 8) return new Date(+d.substring(0, 4), +d.substring(4, 6) - 1, +d.substring(6, 8));
      if (typeof d === "string") { const x = new Date(d); return isNaN(x.getTime()) ? null : x; }
      return d instanceof Date ? d : null;
    };
    const debut = p(article.DPROMOD), fin = p(article.DPROMOF);
    if (!debut || !fin) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    debut.setHours(0, 0, 0, 0); fin.setHours(23, 59, 59, 999);
    return today >= debut && today <= fin;
  }, []);

  // === Classification ===

  const articlesByCategory = useMemo(() => {
    const r = { actif: [], deprecie: [], arrete: [], reappro: [] };
    allArticles.forEach((a) => {
      r[classifyArticle(a)].push(a);
      if (needsReappro(a)) r.reappro.push(a);
    });
    return r;
  }, [allArticles, classifyArticle, needsReappro]);

  const tabCounts = useMemo(() => ({
    actif: articlesByCategory.actif.length,
    deprecie: articlesByCategory.deprecie.length,
    arrete: articlesByCategory.arrete.length,
    reappro: articlesByCategory.reappro.length,
  }), [articlesByCategory]);

  const globalStats = useMemo(() => {
    const total = allArticles.length;
    if (total === 0) return null;
    const calcVal = (arts) => arts.reduce((s, a) => s + calculateStockValueHT(a), 0);
    const active = articlesByCategory.actif.length;
    const deprecated = articlesByCategory.deprecie.length;
    const stopped = articlesByCategory.arrete.length;
    const reappro = articlesByCategory.reappro.length;
    return {
      total, active, deprecated, stopped, reappro,
      activeRate: ((active / total) * 100).toFixed(1),
      depRate: ((deprecated / total) * 100).toFixed(1),
      stopRate: ((stopped / total) * 100).toFixed(1),
      activeValue: calcVal(articlesByCategory.actif),
      depValue: calcVal(articlesByCategory.deprecie),
      totalValue: calcVal(allArticles),
    };
  }, [allArticles, articlesByCategory, calculateStockValueHT]);

  // === Recherche + Pagination articles ===

  const currentTabArticles = useMemo(() => {
    const arts = articlesByCategory[activeTab] || [];
    if (!searchQuery.trim()) return arts;
    const q = searchQuery.trim().toLowerCase();
    return arts.filter((a) => safeTrim(a.NART).toLowerCase().includes(q) || safeTrim(a.DESIGN).toLowerCase().includes(q));
  }, [articlesByCategory, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(currentTabArticles.length / PAGE_SIZE));
  const paginatedArticles = currentTabArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // === Filtrage local commandes (recherche textuelle) ===

  const filteredCommandes = useMemo(() => {
    if (!cmdSearch.trim()) return commandes;
    const q = cmdSearch.trim().toLowerCase();
    return commandes.filter((c) =>
      safeTrim(c.NUMCDE).toLowerCase().includes(q) ||
      safeTrim(c.OBSERV).toLowerCase().includes(q) ||
      safeTrim(c.BATEAU).toLowerCase().includes(q) ||
      safeTrim(c.NUMFACT).toLowerCase().includes(q)
    );
  }, [commandes, cmdSearch]);

  // === Export CSV ===

  const resolveFieldValue = useCallback((art, fieldKey) => {
    if (fieldKey === "_STATUS") return statusLabels[classifyArticle(art)] || "";
    if (fieldKey === "_STOCK_TOTAL") return calculateStockTotal(art);
    if (fieldKey === "_VALEUR_STOCK_HT") return calculateStockValueHT(art);
    if (fieldKey.startsWith("_F_") && fournisseur) {
      return safeTrim(fournisseur[fieldKey.replace("_F_", "")]);
    }
    return safeTrim(art[fieldKey]);
  }, [fournisseur, classifyArticle, calculateStockTotal, calculateStockValueHT]);

  const resolveFieldLabel = useCallback((fieldKey) => {
    const all = Object.values(EXPORT_FIELDS).flat();
    const found = all.find(f => f.key === fieldKey);
    return found?.label || fieldKey;
  }, []);

  const openExportModal = (scope) => { setExportScope(scope); setShowExportModal(true); };
  const toggleExportField = (key) => setExportFields((prev) => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const toggleGroupFields = (groupName, allSelected) => {
    const groupKeys = EXPORT_FIELDS[groupName].map(f => f.key);
    setExportFields((prev) => allSelected ? prev.filter(k => !groupKeys.includes(k)) : [...new Set([...prev, ...groupKeys])]);
  };

  const selectAllFields = () => setExportFields(Object.values(EXPORT_FIELDS).flat().map(f => f.key));
  const selectNoneFields = () => setExportFields([]);

  const doExport = useCallback(() => {
    const articles = exportScope === "all" ? allArticles : (articlesByCategory[exportScope] || []);
    const scopeLabel = { actif: "actifs", deprecie: "deprecies", arrete: "arretes", reappro: "reappro", all: "tous" };
    const filename = `articles_${safeTrim(fournisseur?.FOURN)}_${scopeLabel[exportScope] || "export"}.csv`;
    if (articles.length === 0 || exportFields.length === 0) return;

    const headers = exportFields.map(k => resolveFieldLabel(k));
    const rows = articles.map((art) =>
      exportFields.map((k) => {
        const val = resolveFieldValue(art, k);
        if (typeof val === "string" && (val.includes(";") || val.includes('"') || val.includes("\n")))
          return `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(";")
    );

    const csv = "\uFEFF" + headers.join(";") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  }, [allArticles, articlesByCategory, exportScope, exportFields, fournisseur, resolveFieldValue, resolveFieldLabel]);

  const handleViewArticle = (art) => { setSelectedArticle(art); setPhotoError(false); setPhotoLoaded(false); };

  // === Sub-components ===

  const InfoItem = ({ label, value, icon }) =>
    value ? (
      <div className="info-item">
        <label>{icon && <span className="label-icon">{icon}</span>} {label}</label>
        <span className="value">{value}</span>
      </div>
    ) : null;

  const StockCell = ({ art }) => {
    const depots = getStockDepots(art);
    const total = calculateStockTotal(art);
    return (
      <td className="text-right stock-cell">
        <span className="stock-value-num">{total}</span>
        {total > 0 && (
          <div className="stock-tooltip">
            <div className="stock-tooltip-title">Stock par entrepôt</div>
            {DEPOT_KEYS.map((key, i) => (
              <div key={key} className={`stock-tooltip-row ${depots[i] > 0 ? "has-stock" : ""}`}>
                <span>{mappingEntrepots[key] || key}</span>
                <span className="stock-tooltip-qty">{depots[i]}</span>
              </div>
            ))}
            <div className="stock-tooltip-total"><span>Total</span><span>{total}</span></div>
          </div>
        )}
      </td>
    );
  };

  // === Render ===

  if (loadingFourn) return <div className="fourn-infos-page"><div className="loading-spinner"></div></div>;
  if (!fournisseur) return <div className="fourn-infos-page"><div className="error-state">Fournisseur non trouvé</div></div>;

  return (
    <div className="fourn-infos-page">
      <header className="fourn-infos-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate(-1)}><HiArrowLeft /></button>
          <div className="header-title">
            <div className="header-icon small"><HiOfficeBuilding /></div>
            <div>
              <h1>{safeTrim(fournisseur.NOM)}</h1>
              <span className="header-subtitle">Code Fournisseur : {fournisseur.FOURN}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-action" onClick={refetch} title="Rafraîchir"><HiRefresh /></button>
        </div>
      </header>

      <div className="fourn-infos-content">
        {message && (
          <div style={{ padding: "10px 16px", margin: "0 0 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textAlign: "center", background: message.type === "success" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: message.type === "success" ? "#059669" : "#dc2626", border: `1px solid ${message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}` }}>
            {message.text}
          </div>
        )}

        {/* ======= GRILLE 3 COLONNES ======= */}
        <div className="fourn-main-grid three-cols">

          {/* === Colonne Gauche : Infos fournisseur === */}
          <div className="fourn-left-col">

            {globalStats && (
              <div className="fourn-card stats-overview-card">
                <h3><HiCube /> Répartition des Articles</h3>
                <div className="stats-trio">
                  <div className="stat-block stat-actif" onClick={() => setActiveTab("actif")}>
                    <span className="stat-number">{globalStats.active}</span>
                    <span className="stat-label">Actifs</span>
                    <span className="stat-value-stock">{formatPriceShort(globalStats.activeValue)}</span>
                    <div className="stat-bar"><div className="stat-bar-fill actif" style={{ width: `${globalStats.activeRate}%` }} /></div>
                  </div>
                  <div className="stat-block stat-deprecie" onClick={() => setActiveTab("deprecie")}>
                    <span className="stat-number">{globalStats.deprecated}</span>
                    <span className="stat-label">Dépréciés</span>
                    <span className="stat-value-stock risk">{formatPriceShort(globalStats.depValue)}</span>
                    <div className="stat-bar"><div className="stat-bar-fill deprecie" style={{ width: `${globalStats.depRate}%` }} /></div>
                  </div>
                  <div className="stat-block stat-arrete" onClick={() => setActiveTab("arrete")}>
                    <span className="stat-number">{globalStats.stopped}</span>
                    <span className="stat-label">Arrêtés</span>
                    <span className="stat-value-stock muted">0 XPF</span>
                    <div className="stat-bar"><div className="stat-bar-fill arrete" style={{ width: `${globalStats.stopRate}%` }} /></div>
                  </div>
                </div>
                <div className="combined-bar">
                  <div className="combined-segment actif" style={{ width: `${globalStats.activeRate}%` }} />
                  <div className="combined-segment deprecie" style={{ width: `${globalStats.depRate}%` }} />
                  <div className="combined-segment arrete" style={{ width: `${globalStats.stopRate}%` }} />
                </div>
                <div className="stats-total-line">{globalStats.total} articles — Valeur stock totale HT : <strong>{formatPrice(globalStats.totalValue)}</strong></div>
                {globalStats.depValue > 0 && (
                  <div className="stock-value-alert">
                    <span className="stock-value-alert-label">Valeur stock à risque (HT) :</span>
                    <span className="stock-value-alert-amount">{formatPrice(globalStats.depValue)}</span>
                  </div>
                )}
                {globalStats.reappro > 0 && (
                  <div className="reappro-alert" onClick={() => setActiveTab("reappro")}>
                    <HiSwitchHorizontal />
                    <span><strong>{globalStats.reappro}</strong> article{globalStats.reappro > 1 ? "s" : ""} à réapprovisionner en {mappingEntrepots.S1 || "Magasin"}</span>
                  </div>
                )}
              </div>
            )}

            <div className="fourn-card">
              <h3><HiLocationMarker /> Coordonnées</h3>
              <div className="info-grid-2cols">
                <InfoItem label="Adresse 1" value={safeTrim(fournisseur.AD1)} />
                <InfoItem label="Adresse 2" value={safeTrim(fournisseur.AD2)} />
                <InfoItem label="Adresse 3" value={safeTrim(fournisseur.AD3)} />
                <InfoItem label="Adresse 4" value={safeTrim(fournisseur.AD4)} />
                <InfoItem label="Adresse 5" value={safeTrim(fournisseur.AD5)} />
                <InfoItem label="Localisation" value={safeTrim(fournisseur.LOCAL)} icon={<HiLocationMarker />} />
              </div>
              <div className="info-grid-2cols mt-1">
                <InfoItem label="Téléphone" value={safeTrim(fournisseur.TEL)} icon={<HiPhone />} />
                <InfoItem label="Fax" value={safeTrim(fournisseur.FAX)} icon={<HiDocumentText />} />
                <InfoItem label="Télex / Email" value={safeTrim(fournisseur.TLX)} icon={<HiMail />} />
              </div>
            </div>

            <div className="fourn-card">
              <h3><HiCalculator /> Informations Commerciales</h3>
              <div className="info-grid-2cols">
                <InfoItem label="Délai Appro (Jours)" value={safeTrim(fournisseur.DELAPRO)} icon={<HiCalendar />} />
                <InfoItem label="Coef Stock Mini" value={safeTrim(fournisseur.COEFSMINI)} />
                <InfoItem label="Franco" value={safeTrim(fournisseur.FRANCO)} />
                <InfoItem label="Code Texte" value={safeTrim(fournisseur.TEXTE)} />
              </div>
            </div>

            {safeTrim(fournisseur.OBSERV) && (
              <div className="fourn-card observations"><h3><HiAnnotation /> Observations</h3><p>{safeTrim(fournisseur.OBSERV)}</p></div>
            )}

            {Array.from({ length: 10 }, (_, i) => safeTrim(fournisseur[`NOT${i + 1}`])).some((v) => v) && (
              <div className="fourn-card notes-section">
                <h3><HiDocumentText /> Notes &amp; Textes</h3>
                <div className="notes-grid">
                  {Array.from({ length: 10 }, (_, i) => safeTrim(fournisseur[`NOT${i + 1}`])).map(
                    (note, idx) => note && <div key={idx} className="note-item">{note}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* === Colonne Milieu : Articles === */}
          <div className="fourn-middle-col">
            <div className="fourn-card articles-section">
              <div className="section-header">
                <h3><HiCube /> Articles fournis</h3>
                <div className="section-header-right">
                  <span className="badge">{allArticles.length} réf.</span>
                  <div className="export-dropdown">
                    <button className="btn-export" title="Exporter CSV"><HiDownload /> <span>Export</span></button>
                    <div className="export-menu">
                      <button onClick={() => openExportModal(activeTab)}><HiAdjustments /> Onglet actuel ({TABS.find(t => t.key === activeTab)?.label})</button>
                      <button onClick={() => openExportModal("all")}><HiAdjustments /> Tous les articles</button>
                      <div className="export-sep"></div>
                      {TABS.map(t => (
                        <button key={t.key} onClick={() => openExportModal(t.key)}>{t.label} ({tabCounts[t.key]})</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Onglets */}
              <div className="articles-tabs">
                {TABS.map((tab) => (
                  <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? "active" : ""} tab-${tab.key}`} onClick={() => setActiveTab(tab.key)}>
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                    <span className={`tab-count tab-count-${tab.key}`}>{tabCounts[tab.key]}</span>
                  </button>
                ))}
              </div>

              {/* Recherche articles */}
              <div className="search-bar">
                <HiSearch className="search-icon" />
                <input ref={searchInputRef} type="text" placeholder="Rechercher par code ou désignation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && <button className="search-clear" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}><HiX /></button>}
                {searchQuery && <span className="search-count">{currentTabArticles.length} résultat{currentTabArticles.length !== 1 ? "s" : ""}</span>}
              </div>

              {/* Info réappro + bouton demande */}
              {activeTab === "reappro" && tabCounts.reappro > 0 && (
                <div className="reappro-info-banner">
                  <HiSwitchHorizontal />
                  <span>Articles avec du stock disponible mais <strong>0 en {mappingEntrepots.S1 || "Magasin"}</strong> — à transférer depuis un autre entrepôt.</span>
                  <button
                    className="btn-demande-reappro"
                    onClick={() => {
                      setSelectedForDemande(articlesByCategory.reappro);
                      setShowDemandeModal(true);
                    }}
                  >
                    <HiSwitchHorizontal /> Créer une demande de réappro ({tabCounts.reappro} art.)
                  </button>
                </div>
              )}

              {loadingArticles ? (
                <div className="loading-inline"><div className="loading-spinner small"></div></div>
              ) : paginatedArticles.length > 0 ? (
                <>
                  <table className="linked-articles-table">
                    <thead>
                      <tr>
                        <th>NART</th>
                        <th>DESIGN</th>
                        <th className="text-right">Stock</th>
                        <th className="text-right">{mappingEntrepots.S1}</th>
                        {activeTab === "reappro" && DEPOT_KEYS.slice(1).map(k => (
                          <th key={k} className="text-right">{mappingEntrepots[k] || k}</th>
                        ))}
                        <th className="text-right">PVTE</th>
                        <th className="text-right">Val. HT</th>
                        <th className="text-center">Statut</th>
                        <th className="col-actions"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedArticles.map((art) => {
                        const status = classifyArticle(art);
                        const s1 = parseFloat(art.S1) || 0;
                        const hasPromo = isPromoActive(art);
                        const valHT = calculateStockValueHT(art);
                        return (
                          <tr key={art.NART} className={`row-${status} ${needsReappro(art) && activeTab !== "reappro" ? "row-needs-reappro" : ""}`}>
                            <td>
                              <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(art.NART)}`} className="link-nart">
                                {safeTrim(art.NART)} <HiExternalLink />
                              </Link>
                            </td>
                            <td>
                              <div className="cell-design">
                                <span>{safeTrim(art.DESIGN)}</span>
                                {hasPromo && <span className="mini-badge promo"><HiTag /></span>}
                                {needsReappro(art) && activeTab !== "reappro" && <span className="mini-badge reappro" title="Réappro magasin"><HiSwitchHorizontal /></span>}
                              </div>
                            </td>
                            <StockCell art={art} />
                            <td className="text-right">
                              <span className={`stock-s1 ${s1 > 0 ? "positive" : "zero"}`}>{formatStock(s1)}</span>
                            </td>
                            {activeTab === "reappro" && DEPOT_KEYS.slice(1).map(k => {
                              const v = parseFloat(art[k]) || 0;
                              return <td key={k} className="text-right"><span className={`stock-s1 ${v > 0 ? "positive" : "zero"}`}>{formatStock(v)}</span></td>;
                            })}
                            <td className="text-right">{formatPrice(art.PVTE)}</td>
                            <td className="text-right">
                              <span className={`val-stock ${valHT > 0 ? "" : "zero"}`}>{valHT > 0 ? formatPrice(valHT) : "-"}</span>
                            </td>
                            <td className="text-center">
                              {status === "deprecie" && <span className="status-badge status-deprecie"><HiTrendingDown /> Dépr.</span>}
                              {status === "arrete" && <span className="status-badge status-arrete"><HiBan /> Arrêté</span>}
                              {status === "actif" && <span className="status-badge status-actif"><HiCheckCircle /> Actif</span>}
                            </td>
                            <td className="col-actions">
                              <button className="btn-view-art" onClick={() => handleViewArticle(art)} title="Aperçu rapide"><HiEye /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div className="pagination-mini">
                      <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}><HiChevronLeft /></button>
                      <span>Page {currentPage} / {totalPages}<span className="pagination-total"> ({currentTabArticles.length} art.)</span></span>
                      <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}><HiChevronRight /></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state-mini">
                  <div className="empty-icon">{searchQuery ? <HiSearch /> : activeTab === "reappro" ? <HiSwitchHorizontal /> : activeTab === "actif" ? <HiCheckCircle /> : activeTab === "deprecie" ? <HiTrendingDown /> : <HiBan />}</div>
                  <p>{searchQuery ? `Aucun résultat pour "${searchQuery}".` : activeTab === "reappro" ? "Aucun article à réapprovisionner." : activeTab === "actif" ? "Aucun article actif." : activeTab === "deprecie" ? "Aucun article déprécié." : "Aucun article arrêté."}</p>
                  {searchQuery && <button className="btn-clear-search" onClick={() => setSearchQuery("")}>Effacer la recherche</button>}
                </div>
              )}
            </div>
          </div>

          {/* === Colonne Droite : Historique Commandes === */}
          <div className="fourn-right-col">
            <div className="fourn-card commandes-section">
              <div className="section-header">
                <h3><HiClipboardList /> Historique Commandes</h3>
                <div className="section-header-right">
                  <span className="badge">{cmdPagination.totalRecords || 0} cmd.</span>
                </div>
              </div>

              {/* Recherche commandes */}
              <div className="search-bar cmd-search-bar">
                <HiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="N° commande, bateau, observation..."
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                />
                {cmdSearch && (
                  <button className="search-clear" onClick={() => setCmdSearch("")}><HiX /></button>
                )}
              </div>

              {loadingCommandes ? (
                <div className="loading-inline"><div className="loading-spinner small"></div></div>
              ) : filteredCommandes.length === 0 ? (
                <div className="empty-state-mini">
                  <div className="empty-icon"><HiClipboardList /></div>
                  <p>{cmdSearch ? "Aucune commande ne correspond à la recherche." : "Aucune commande trouvée pour ce fournisseur."}</p>
                </div>
              ) : (
                <>
                  <div className="cmd-list">
                    {filteredCommandes.map((cmd) => {
                      const numcde = safeTrim(cmd.NUMCDE);
                      const etat = cmd.ETAT;
                      const etatLabel = ETAT_LABELS[etat] || `État ${etat}`;
                      const etatColor = ETAT_COLORS[etat] || "#606070";
                      const montant = cmd.TOTAL_DETAIL || 0;
                      const nbLignes = cmd.NB_LIGNES_DETAIL || 0;
                      const observ = safeTrim(cmd.OBSERV);
                      const bateau = safeTrim(cmd.BATEAU);
                      const numfact = safeTrim(cmd.NUMFACT);
                      const hasVerrou = safeTrim(cmd.VERROU).toUpperCase() === "O";

                      return (
                        <div
                          key={numcde}
                          className={`cmd-card ${hasVerrou ? "cmd-verrouille" : ""}`}
                          onClick={() => setSelectedCommande(numcde)}
                        >
                          <div className="cmd-card-top">
                            <span className="cmd-numcde">{numcde}</span>
                            <span className="cmd-etat" style={{ background: `${etatColor}20`, color: etatColor, borderColor: `${etatColor}40` }}>
                              {etatLabel}
                            </span>
                          </div>
                          <div className="cmd-card-info">
                            <div className="cmd-date">
                              <HiCalendar />
                              <span>{formatDate(cmd.DATCDE)}</span>
                            </div>
                            {montant > 0 && (
                              <div className="cmd-montant-badge">
                                <HiCurrencyDollar />
                                <span>{formatPrice(montant)}</span>
                              </div>
                            )}
                            {nbLignes > 0 && (
                              <span className="cmd-nb-lignes">{nbLignes} ligne{nbLignes > 1 ? "s" : ""}</span>
                            )}
                          </div>
                          {(bateau || numfact) && (
                            <div className="cmd-card-meta">
                              {bateau && <span className="cmd-meta-item"><HiTruck /> {bateau}</span>}
                              {numfact && <span className="cmd-meta-item"><HiDocumentText /> Fact. {numfact}</span>}
                            </div>
                          )}
                          {observ && <div className="cmd-card-observ">{observ}</div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination commandes */}
                  {cmdPagination.totalPages > 1 && (
                    <div className="pagination-mini">
                      <button disabled={!cmdPagination.hasPrevPage || fetchingCommandes} onClick={() => setCmdPage((p) => p - 1)}>
                        <HiChevronLeft />
                      </button>
                      <span>
                        {fetchingCommandes ? "..." : `Page ${cmdPagination.page} / ${cmdPagination.totalPages}`}
                        <span className="pagination-total"> ({cmdPagination.totalRecords} cmd.)</span>
                      </span>
                      <button disabled={!cmdPagination.hasNextPage || fetchingCommandes} onClick={() => setCmdPage((p) => p + 1)}>
                        <HiChevronRight />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ==================== MODAL DÉTAIL COMMANDE ==================== */}
      {selectedCommande && (
        <CommandeDetailModal
          numcde={selectedCommande}
          nomDossierDBF={selectedEntreprise}
          onClose={() => setSelectedCommande(null)}
        />
      )}

      {/* ==================== MODAL EXPORT CSV ==================== */}
      {showExportModal && (
        <div className="article-modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <HiDownload />
                <div>
                  <h2>Export CSV</h2>
                  <span className="modal-nart">
                    {exportScope === "all" ? "Tous les articles" : TABS.find(t => t.key === exportScope)?.label || exportScope}
                    {" — "}{(exportScope === "all" ? allArticles : articlesByCategory[exportScope] || []).length} articles
                  </span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowExportModal(false)}><HiX /></button>
            </div>
            <div className="export-modal-body">
              <div className="export-scope-bar">
                <span className="export-scope-label">Périmètre :</span>
                {[{ key: "all", label: "Tous" }, ...TABS.map(t => ({ key: t.key, label: t.label }))].map((s) => (
                  <button key={s.key} className={`export-scope-btn ${exportScope === s.key ? "active" : ""}`} onClick={() => setExportScope(s.key)}>
                    {s.label} ({(s.key === "all" ? allArticles : articlesByCategory[s.key] || []).length})
                  </button>
                ))}
              </div>
              <div className="export-actions-bar">
                <button className="btn-select-all" onClick={selectAllFields}>Tout sélectionner</button>
                <button className="btn-select-none" onClick={selectNoneFields}>Tout désélectionner</button>
                <button className="btn-select-default" onClick={() => setExportFields(DEFAULT_SELECTED)}>Par défaut</button>
                <span className="export-field-count">{exportFields.length} champ{exportFields.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="export-fields-grid">
                {Object.entries(EXPORT_FIELDS).map(([groupName, fields]) => {
                  const groupKeys = fields.map(f => f.key);
                  const selectedInGroup = groupKeys.filter(k => exportFields.includes(k)).length;
                  const allGroupSelected = selectedInGroup === groupKeys.length;
                  return (
                    <div key={groupName} className="export-field-group">
                      <div className="export-group-header" onClick={() => toggleGroupFields(groupName, allGroupSelected)}>
                        <input type="checkbox" checked={allGroupSelected} readOnly className="group-checkbox" onChange={() => {}} />
                        <span className="export-group-name">{groupName}</span>
                        <span className="export-group-count">{selectedInGroup}/{groupKeys.length}</span>
                      </div>
                      <div className="export-group-fields">
                        {fields.map((field) => (
                          <label key={field.key} className={`export-field-item ${exportFields.includes(field.key) ? "selected" : ""}`}>
                            <input type="checkbox" checked={exportFields.includes(field.key)} onChange={() => toggleExportField(field.key)} />
                            <span className="field-label">{field.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="export-modal-footer">
              <button className="btn-cancel" onClick={() => setShowExportModal(false)}>Annuler</button>
              <button className="btn-do-export" onClick={doExport} disabled={exportFields.length === 0}>
                <HiDownload /> Exporter {(exportScope === "all" ? allArticles : articlesByCategory[exportScope] || []).length} articles ({exportFields.length} champs)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DÉTAIL ARTICLE ==================== */}
      {selectedArticle && (
        <div className="article-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="article-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <HiCube />
                <div><h2>Détails de l'article</h2><span className="modal-nart">{safeTrim(selectedArticle.NART)}</span></div>
              </div>
              <div className="modal-header-actions">
                <Link to={`/admin/articles/${selectedEntreprise}/${safeTrim(selectedArticle.NART)}`} className="btn-view-full"><HiExternalLink /> <span>Fiche complète</span></Link>
                <button className="btn-close-modal" onClick={() => setSelectedArticle(null)}><HiX /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {hasPhotosConfigured && (
                  <div className="modal-photo-section">
                    {!photoError ? (
                      <div className={`photo-wrapper ${photoLoaded ? "loaded" : ""}`}>
                        <img src={getPhotoUrl(trigramme, selectedArticle.NART)} alt={safeTrim(selectedArticle.DESIGN)} onError={() => setPhotoError(true)} onLoad={() => setPhotoLoaded(true)} />
                        {!photoLoaded && <div className="photo-loading"><div className="loading-spinner small"></div></div>}
                      </div>
                    ) : (
                      <div className="no-photo"><HiPhotograph /><span>Photo non disponible</span></div>
                    )}
                    <div className="modal-badges">
                      {isPromoActive(selectedArticle) && <span className="modal-badge promo"><HiTag /> PROMO</span>}
                      {classifyArticle(selectedArticle) === "deprecie" && <span className="modal-badge deprec-stock"><HiExclamation /> DÉPRÉCIÉ</span>}
                      {classifyArticle(selectedArticle) === "arrete" && <span className="modal-badge arrete"><HiBan /> ARRÊTÉ</span>}
                      {needsReappro(selectedArticle) && <span className="modal-badge reappro-badge"><HiSwitchHorizontal /> RÉAPPRO</span>}
                      {selectedArticle.WEB?.toString().toUpperCase().trim() === "O" && <span className="modal-badge web"><HiGlobe /> WEB</span>}
                    </div>
                  </div>
                )}
                <div className="modal-info-section">
                  <div className="info-block designation-block">
                    <h3>{safeTrim(selectedArticle.DESIGN)}</h3>
                    {safeTrim(selectedArticle.DESIGN2) && <p>{safeTrim(selectedArticle.DESIGN2)}</p>}
                  </div>

                  {classifyArticle(selectedArticle) === "arrete" && (
                    <div className="arrete-banner"><HiBan /><div><strong>Article arrêté</strong><span>Déprécié et sans stock</span></div></div>
                  )}
                  {classifyArticle(selectedArticle) === "deprecie" && (
                    <div className="deprec-stock-banner"><HiExclamation /><div><strong>Article déprécié</strong><span>Stock restant: {formatStock(calculateStockTotal(selectedArticle))} — Valeur HT: {formatPrice(calculateStockValueHT(selectedArticle))}</span></div></div>
                  )}
                  {needsReappro(selectedArticle) && (
                    <div className="reappro-banner">
                      <HiSwitchHorizontal />
                      <div><strong>Réappro {mappingEntrepots.S1} nécessaire</strong><span>Stock total {formatStock(calculateStockTotal(selectedArticle))} mais {mappingEntrepots.S1} à 0</span></div>
                      <button
                        className="btn-demande-reappro-sm"
                        onClick={() => {
                          setSelectedForDemande([selectedArticle]);
                          setSelectedArticle(null);
                          setShowDemandeModal(true);
                        }}
                      >
                        <HiSwitchHorizontal /> Demander réappro
                      </button>
                    </div>
                  )}

                  <div className="info-grid codes-grid">
                    <div className="info-item"><label>NART</label><span className="value highlight">{safeTrim(selectedArticle.NART)}</span></div>
                    <div className="info-item"><label>GENCOD</label><span className="value mono">{safeTrim(selectedArticle.GENCOD) || "-"}</span></div>
                    <div className="info-item"><label>REFER</label><span className="value">{safeTrim(selectedArticle.REFER) || "-"}</span></div>
                    <div className="info-item"><label>FOURN</label><span className="value">{selectedArticle.FOURN || "-"}</span></div>
                    <div className="info-item"><label>GROUPE</label><span className="value tag">{safeTrim(selectedArticle.GROUPE) || "-"}</span></div>
                    <div className="info-item"><label>UNITE</label><span className="value">{safeTrim(selectedArticle.UNITE) || "-"}</span></div>
                  </div>

                  <div className="info-block price-block">
                    <h4><HiCurrencyDollar /> Prix</h4>
                    <div className="price-grid">
                      <div className="price-item main"><label>PVTE (HT)</label><span>{formatPrice(selectedArticle.PVTE)}</span></div>
                      <div className="price-item"><label>PVTETTC</label><span className={isPromoActive(selectedArticle) ? "strikethrough" : ""}>{formatPrice(selectedArticle.PVTETTC)}</span></div>
                      {isPromoActive(selectedArticle) && <div className="price-item promo-price"><label>PVPROMO</label><span>{formatPrice(selectedArticle.PVPROMO)}</span></div>}
                      <div className="price-item"><label>PACHAT</label><span>{formatPrice(selectedArticle.PACHAT)}</span></div>
                      <div className="price-item"><label>PREV</label><span>{formatPrice(selectedArticle.PREV)}</span></div>
                      <div className="price-item"><label>TAXES</label><span>{selectedArticle.TAXES || 0}%</span></div>
                    </div>
                  </div>

                  <div className="info-block stock-block">
                    <h4><HiArchive /> Stocks par entrepôt</h4>
                    <div className="stock-grid">
                      <div className="stock-item total"><label>Total</label><span className={calculateStockTotal(selectedArticle) > 0 ? "positive" : "zero"}>{formatStock(calculateStockTotal(selectedArticle))}</span></div>
                      {DEPOT_KEYS.map((key) => (
                        <div key={key} className={`stock-item ${key === "S1" && needsReappro(selectedArticle) ? "stock-item-alert" : ""}`}>
                          <label>{mappingEntrepots[key] || key}</label>
                          <span className={parseFloat(selectedArticle[key]) > 0 ? "positive" : "zero"}>{formatStock(selectedArticle[key])}</span>
                        </div>
                      ))}
                      <div className="stock-item"><label>RESERV</label><span className="reserved">{formatStock(selectedArticle.RESERV)}</span></div>
                      <div className="stock-item"><label>SMINI</label><span>{formatStock(selectedArticle.SMINI)}</span></div>
                    </div>
                    {calculateStockTotal(selectedArticle) > 0 && (
                      <div className="stock-value-line">Valeur stock HT : <strong>{formatPrice(calculateStockValueHT(selectedArticle))}</strong></div>
                    )}
                  </div>

                  {(selectedArticle.GISM1 || selectedArticle.GISM2 || selectedArticle.GISM3 || selectedArticle.PLACE) && (
                    <div className="info-block gisement-block">
                      <h4><HiLocationMarker /> Emplacements</h4>
                      <div className="gisement-grid">
                        {selectedArticle.PLACE && <div className="gisement-item main"><label>PLACE</label><span>{safeTrim(selectedArticle.PLACE)}</span></div>}
                        {[1,2,3,4,5].map((n) => selectedArticle[`GISM${n}`] && <div key={n} className="gisement-item"><label>GISM{n}</label><span>{safeTrim(selectedArticle[`GISM${n}`])}</span></div>)}
                      </div>
                    </div>
                  )}

                  <div className="info-block dates-block">
                    <h4><HiCalendar /> Dates</h4>
                    <div className="info-grid">
                      <div className="info-item"><label>CREATION</label><span className="value">{formatDate(selectedArticle.CREATION)}</span></div>
                      <div className="info-item"><label>DATINV</label><span className="value">{formatDate(selectedArticle.DATINV)}</span></div>
                      {selectedArticle.DPROMOD && <div className="info-item"><label>DPROMOD</label><span className="value">{formatDate(selectedArticle.DPROMOD)}</span></div>}
                      {selectedArticle.DPROMOF && <div className="info-item"><label>DPROMOF</label><span className="value">{formatDate(selectedArticle.DPROMOF)}</span></div>}
                    </div>
                  </div>

                  {safeTrim(selectedArticle.OBSERV) && (
                    <div className="info-block observations-block"><h4><HiAnnotation /> OBSERV</h4><p className="observations-text">{safeTrim(selectedArticle.OBSERV)}</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL DEMANDE RÉAPPRO ==================== */}
      <DemandeReapproModal
        isOpen={showDemandeModal}
        onClose={() => setShowDemandeModal(false)}
        entrepriseId={entrepriseData?._id}
        articles={selectedForDemande}
        source={selectedForDemande.length === 1 ? "article" : "fournisseur"}
        fournisseurCode={fournisseur?.FOURN?.toString() || ""}
        fournisseurNom={safeTrim(fournisseur?.NOM)}
        mappingEntrepots={mappingEntrepots}
        onSuccess={() => {
          setMessage({ text: "✅ Demande de réappro envoyée avec succès !", type: "success" });
          setTimeout(() => setMessage(null), 4000);
        }}
      />
    </div>
  );
};

export default AdminFournisseurInfosScreen;