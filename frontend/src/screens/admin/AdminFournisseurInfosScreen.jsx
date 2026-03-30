// src/screens/admin/AdminFournisseurInfosScreen.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiArrowLeft, HiOfficeBuilding, HiPhone, HiLocationMarker, HiDocumentText,
  HiCube, HiChevronLeft, HiChevronRight, HiRefresh, HiExternalLink,
  HiCalculator, HiCalendar, HiMail, HiAnnotation, HiBan, HiTrendingDown,
  HiCheckCircle, HiSearch, HiDownload, HiX, HiEye, HiTag, HiPhotograph,
  HiGlobe, HiExclamation, HiCurrencyDollar, HiArchive, HiAdjustments,
  HiSwitchHorizontal
} from "react-icons/hi";
import { useGetEntrepriseByDossierQuery } from "../../slices/entrepriseApiSlice";
import {
  useGetFournisseurByCodeQuery,
  useGetArticlesByFournisseurQuery,
} from "../../slices/fournissApiSlice";
import { getPhotoUrl } from "../../slices/articleApiSlice";
import "./AdminFournisseurInfosScreen.css";

const TABS = [
  { key: "actif", label: "Actifs", icon: <HiCheckCircle /> },
  { key: "deprecie", label: "Dépréciés", icon: <HiTrendingDown /> },
  { key: "arrete", label: "Arrêtés", icon: <HiBan /> },
  { key: "reappro", label: "Réappro Magasin", icon: <HiSwitchHorizontal /> },
];

const PAGE_SIZE = 25;
const DEFAULT_MAPPING = { S1: "Magasin", S2: "S2", S3: "S3", S4: "S4", S5: "S5" };
const DEPOT_KEYS = ["s1", "s2", "s3", "s4", "s5"];
const DEPOT_LABELS = ["S1", "S2", "S3", "S4", "S5"];

const EXPORT_FIELDS = {
  "Article - Identification": [
    { key: "codeArticle", label: "NART", default: true },
    { key: "designation", label: "DESIGN", default: true },
    { key: "designation2", label: "DESIGN2" },
    { key: "gencode", label: "GENCOD" },
    { key: "groupe", label: "GROUPE" },
    { key: "codeFourn", label: "FOURN", default: true },
    { key: "reference", label: "REFER" },
    { key: "unite", label: "UNITE" },
    { key: "douane", label: "DOUANE" },
    { key: "volume", label: "VOL" },
    { key: "web", label: "WEB" },
    { key: "photo", label: "FOTO" },
    { key: "_STATUS", label: "STATUT (calculé)", default: true },
  ],
  "Article - Prix": [
    { key: "prixVenteTTC", label: "PVTETTC" },
    { key: "prixVenteHT", label: "PVTE", default: true },
    { key: "prixPromo", label: "PVPROMO" },
    { key: "prixAchat", label: "PACHAT" },
    { key: "prixRevient", label: "PREV" },
    { key: "taxes", label: "TAXES" },
    { key: "depreciation", label: "DEPREC" },
    { key: "_VALEUR_STOCK_HT", label: "VALEUR_STOCK_HT (calculé)" },
  ],
  "Article - Stocks": [
    { key: "_STOCK_TOTAL", label: "STOCK_TOTAL (calculé)", default: true },
    { key: "s1", label: "S1", default: true },
    { key: "s2", label: "S2" },
    { key: "s3", label: "S3" },
    { key: "s4", label: "S4" },
    { key: "s5", label: "S5" },
    { key: "reserve", label: "RESERV" },
    { key: "stockMini", label: "SMINI" },
  ],
  "Article - Emplacements": [
    { key: "place", label: "PLACE" },
    { key: "gism1", label: "GISM1" },
    { key: "gism2", label: "GISM2" },
    { key: "gism3", label: "GISM3" },
    { key: "gism4", label: "GISM4" },
    { key: "gism5", label: "GISM5" },
  ],
  "Article - Dates": [
    { key: "dateCreation", label: "CREATION" },
    { key: "dateInventaire", label: "DATINV" },
    { key: "datePromoDebut", label: "DPROMOD" },
    { key: "datePromoFin", label: "DPROMOF" },
  ],
  "Article - Divers": [
    { key: "observation", label: "OBSERV" },
  ],
  "Fournisseur": [
    { key: "_F_nom", label: "F_NOM" },
    { key: "_F_adresse1", label: "F_AD1" },
    { key: "_F_adresse2", label: "F_AD2" },
    { key: "_F_adresse3", label: "F_AD3" },
    { key: "_F_adresse4", label: "F_AD4" },
    { key: "_F_adresse5", label: "F_AD5" },
    { key: "_F_local", label: "F_LOCAL" },
    { key: "_F_telephone", label: "F_TEL" },
    { key: "_F_fax", label: "F_FAX" },
    { key: "_F_email", label: "F_TLX" },
    { key: "_F_delaiAppro", label: "F_DELAPRO" },
    { key: "_F_coefMini", label: "F_COEFSMINI" },
    { key: "_F_franco", label: "F_FRANCO" },
    { key: "_F_texte", label: "F_TEXTE" },
    { key: "_F_observation", label: "F_OBSERV" },
  ],
};

const DEFAULT_SELECTED = Object.values(EXPORT_FIELDS).flat().filter(f => f.default).map(f => f.key);

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
  const searchInputRef = useRef(null);

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

  const fournisseur = fournData?.fournisseur;
  const allArticles = articlesData?.articles || [];

  const mappingEntrepots = useMemo(() => {
    return entrepriseData?.mappingEntrepots || DEFAULT_MAPPING;
  }, [entrepriseData]);

  const hasPhotosConfigured = !!entrepriseData?.cheminPhotos;
  const trigramme = entrepriseData?.trigramme;

  useEffect(() => { if (nomDossierDBF) setSelectedEntreprise(nomDossierDBF); }, [nomDossierDBF]);
  useEffect(() => { setCurrentPage(1); setActiveTab("actif"); setSearchQuery(""); }, [fournId]);
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

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
    // String ISO de Mongoose : "2024-01-15T00:00:00.000Z"
    // OU format DBF brut : "20240115"
    if (typeof dateValue === "string") {
      // Format DBF brut
      if (dateValue.length === 8 && /^\d{8}$/.test(dateValue)) {
        const y = parseInt(dateValue.substring(0, 4));
        const m = parseInt(dateValue.substring(4, 6));
        const d = parseInt(dateValue.substring(6, 8));
        if (y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31)
          return `${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${y}`;
        return "-";
      }
      // String ISO ou autre format de date
      const parsed = new Date(dateValue);
      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "-";
    }
    // Objet Date natif
    if (dateValue instanceof Date) return dateValue.toLocaleDateString("fr-FR");
    // Timestamp numérique
    if (typeof dateValue === "number") {
      const parsed = new Date(dateValue);
      return !isNaN(parsed.getTime()) ? parsed.toLocaleDateString("fr-FR") : "-";
    }
    return "-";
  };

  const calculateStockTotal = useCallback((art) => {
    if (!art) return 0;
    return DEPOT_KEYS.reduce((sum, k) => sum + (parseFloat(art[k]) || 0), 0);
  }, []);

  const getStockDepots = useCallback((art) => DEPOT_KEYS.map((k) => parseFloat(art?.[k]) || 0), []);

  const calculateStockValueHT = useCallback((art) => {
    return calculateStockTotal(art) * (parseFloat(art?.prixVenteHT) || 0);
  }, [calculateStockTotal]);

  const classifyArticle = useCallback((art) => {
    const dep = art.depreciation || 0;
    if (dep >= 99) return "arrete";
    if (dep > 0) return "deprecie";
    return "actif";
  }, []);

  const needsReappro = useCallback((art) => {
    const status = classifyArticle(art);
    if (status === "arrete") return false;
    const s1 = parseFloat(art.s1) || 0;
    const total = calculateStockTotal(art);
    return total > 0 && s1 === 0;
  }, [classifyArticle, calculateStockTotal]);

  const statusLabels = { actif: "Actif", deprecie: "Déprécié", arrete: "Arrêté" };

  const isPromoActive = useCallback((article) => {
    if (!article?.datePromoDebut || !article?.datePromoFin || !article?.prixPromo) return false;
    const debut = new Date(article.datePromoDebut);
    const fin = new Date(article.datePromoFin);
    if (isNaN(debut.getTime()) || isNaN(fin.getTime())) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    debut.setHours(0, 0, 0, 0); fin.setHours(23, 59, 59, 999);
    return today >= debut && today <= fin;
  }, []);

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

  const currentTabArticles = useMemo(() => {
    const arts = articlesByCategory[activeTab] || [];
    if (!searchQuery.trim()) return arts;
    const q = searchQuery.trim().toLowerCase();
    return arts.filter((a) =>
      (a.codeArticle || "").toLowerCase().includes(q) ||
      (a.designation || "").toLowerCase().includes(q)
    );
  }, [articlesByCategory, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(currentTabArticles.length / PAGE_SIZE));
  const paginatedArticles = currentTabArticles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const resolveFieldValue = useCallback((art, fieldKey) => {
    if (fieldKey === "_STATUS") return statusLabels[classifyArticle(art)] || "";
    if (fieldKey === "_STOCK_TOTAL") return calculateStockTotal(art);
    if (fieldKey === "_VALEUR_STOCK_HT") return calculateStockValueHT(art);
    if (fieldKey.startsWith("_F_") && fournisseur) {
      return safeTrim(fournisseur[fieldKey.replace("_F_", "")]);
    }
    const val = art[fieldKey];
    return val !== null && val !== undefined ? String(val).trim() : "";
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
    const filename = `articles_${fournisseur?.codeFourn || ""}_${scopeLabel[exportScope] || "export"}.csv`;
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
                <span>{mappingEntrepots[DEPOT_LABELS[i]] || DEPOT_LABELS[i]}</span>
                <span className="stock-tooltip-qty">{depots[i]}</span>
              </div>
            ))}
            <div className="stock-tooltip-total"><span>Total</span><span>{total}</span></div>
          </div>
        )}
      </td>
    );
  };

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
              <h1>{fournisseur.nom}</h1>
              <span className="header-subtitle">Code Fournisseur : {fournisseur.codeFourn}</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-action" onClick={refetch} title="Rafraîchir"><HiRefresh /></button>
        </div>
      </header>

      <div className="fourn-infos-content">
        <div className="fourn-main-grid three-cols">

          {/* Colonne Gauche */}
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
                <InfoItem label="Adresse 1" value={fournisseur.adresse1} />
                <InfoItem label="Adresse 2" value={fournisseur.adresse2} />
                <InfoItem label="Adresse 3" value={fournisseur.adresse3} />
                <InfoItem label="Adresse 4" value={fournisseur.adresse4} />
                <InfoItem label="Adresse 5" value={fournisseur.adresse5} />
                <InfoItem label="Localisation" value={fournisseur.local} icon={<HiLocationMarker />} />
              </div>
              <div className="info-grid-2cols mt-1">
                <InfoItem label="Téléphone" value={fournisseur.telephone} icon={<HiPhone />} />
                <InfoItem label="Fax" value={fournisseur.fax} icon={<HiDocumentText />} />
                <InfoItem label="Email" value={fournisseur.email} icon={<HiMail />} />
              </div>
            </div>

            <div className="fourn-card">
              <h3><HiCalculator /> Informations Commerciales</h3>
              <div className="info-grid-2cols">
                <InfoItem label="Délai Appro (Jours)" value={fournisseur.delaiAppro} icon={<HiCalendar />} />
                <InfoItem label="Coef Stock Mini" value={fournisseur.coefMini} />
                <InfoItem label="Franco" value={fournisseur.franco} />
                <InfoItem label="Code Texte" value={fournisseur.texte} />
              </div>
            </div>

            {fournisseur.observation && (
              <div className="fourn-card observations"><h3><HiAnnotation /> Observations</h3><p>{fournisseur.observation}</p></div>
            )}

            {fournisseur.notes && fournisseur.notes.length > 0 && (
              <div className="fourn-card notes-section">
                <h3><HiDocumentText /> Notes &amp; Textes</h3>
                <div className="notes-grid">
                  {fournisseur.notes.map((note, idx) => note && <div key={idx} className="note-item">{note}</div>)}
                </div>
              </div>
            )}
          </div>

          {/* Colonne Droite : Articles */}
          <div className="fourn-middle-col" style={{ gridColumn: "2 / -1" }}>
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

              <div className="articles-tabs">
                {TABS.map((tab) => (
                  <button key={tab.key} className={`tab-btn ${activeTab === tab.key ? "active" : ""} tab-${tab.key}`} onClick={() => setActiveTab(tab.key)}>
                    <span className="tab-icon">{tab.icon}</span>
                    <span className="tab-label">{tab.label}</span>
                    <span className={`tab-count tab-count-${tab.key}`}>{tabCounts[tab.key]}</span>
                  </button>
                ))}
              </div>

              <div className="search-bar">
                <HiSearch className="search-icon" />
                <input ref={searchInputRef} type="text" placeholder="Rechercher par code ou désignation..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                {searchQuery && <button className="search-clear" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }}><HiX /></button>}
                {searchQuery && <span className="search-count">{currentTabArticles.length} résultat{currentTabArticles.length !== 1 ? "s" : ""}</span>}
              </div>

              {activeTab === "reappro" && tabCounts.reappro > 0 && (
                <div className="reappro-info-banner">
                  <HiSwitchHorizontal />
                  <span>Articles avec du stock disponible mais <strong>0 en {mappingEntrepots.S1 || "Magasin"}</strong> — à transférer depuis un autre entrepôt.</span>
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
                        {activeTab === "reappro" && DEPOT_KEYS.slice(1).map((k, i) => (
                          <th key={k} className="text-right">{mappingEntrepots[DEPOT_LABELS[i + 1]] || DEPOT_LABELS[i + 1]}</th>
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
                        const s1 = parseFloat(art.s1) || 0;
                        const hasPromo = isPromoActive(art);
                        const valHT = calculateStockValueHT(art);
                        return (
                          <tr key={art._id} className={`row-${status} ${needsReappro(art) && activeTab !== "reappro" ? "row-needs-reappro" : ""}`}>
                            <td>
                              <Link to={`/admin/articles/${selectedEntreprise}/${art.codeArticle}`} className="link-nart">
                                {art.codeArticle} <HiExternalLink />
                              </Link>
                            </td>
                            <td>
                              <div className="cell-design">
                                <span>{art.designation}</span>
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
                            <td className="text-right">{formatPrice(art.prixVenteHT)}</td>
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
        </div>
      </div>

      {/* MODAL EXPORT CSV */}
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

      {/* MODAL DETAIL ARTICLE */}
      {selectedArticle && (
        <div className="article-modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="article-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <HiCube />
                <div><h2>Détails de l'article</h2><span className="modal-nart">{selectedArticle.codeArticle}</span></div>
              </div>
              <div className="modal-header-actions">
                <Link to={`/admin/articles/${selectedEntreprise}/${selectedArticle.codeArticle}`} className="btn-view-full"><HiExternalLink /> <span>Fiche complète</span></Link>
                <button className="btn-close-modal" onClick={() => setSelectedArticle(null)}><HiX /></button>
              </div>
            </div>
            <div className="modal-body">
              <div className="modal-grid">
                {hasPhotosConfigured && (
                  <div className="modal-photo-section">
                    {!photoError ? (
                      <div className={`photo-wrapper ${photoLoaded ? "loaded" : ""}`}>
                        <img src={getPhotoUrl(trigramme, selectedArticle.codeArticle)} alt={selectedArticle.designation} onError={() => setPhotoError(true)} onLoad={() => setPhotoLoaded(true)} />
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
                      {selectedArticle.web === "O" && <span className="modal-badge web"><HiGlobe /> WEB</span>}
                    </div>
                  </div>
                )}
                <div className="modal-info-section">
                  <div className="info-block designation-block">
                    <h3>{selectedArticle.designation}</h3>
                    {selectedArticle.designation2 && <p>{selectedArticle.designation2}</p>}
                  </div>

                  {classifyArticle(selectedArticle) === "arrete" && (
                    <div className="arrete-banner"><HiBan /><div><strong>Article arrêté</strong><span>Déprécié et sans stock</span></div></div>
                  )}
                  {classifyArticle(selectedArticle) === "deprecie" && (
                    <div className="deprec-stock-banner"><HiExclamation /><div><strong>Article déprécié</strong><span>Stock restant: {formatStock(calculateStockTotal(selectedArticle))} — Valeur HT: {formatPrice(calculateStockValueHT(selectedArticle))}</span></div></div>
                  )}

                  <div className="info-grid codes-grid">
                    <div className="info-item"><label>NART</label><span className="value highlight">{selectedArticle.codeArticle}</span></div>
                    <div className="info-item"><label>GENCOD</label><span className="value mono">{selectedArticle.gencode || "-"}</span></div>
                    <div className="info-item"><label>REFER</label><span className="value">{selectedArticle.reference || "-"}</span></div>
                    <div className="info-item"><label>FOURN</label><span className="value">{selectedArticle.codeFourn || "-"}</span></div>
                    <div className="info-item"><label>GROUPE</label><span className="value tag">{selectedArticle.groupe || "-"}</span></div>
                    <div className="info-item"><label>UNITE</label><span className="value">{selectedArticle.unite || "-"}</span></div>
                  </div>

                  <div className="info-block price-block">
                    <h4><HiCurrencyDollar /> Prix</h4>
                    <div className="price-grid">
                      <div className="price-item main"><label>PVTE (HT)</label><span>{formatPrice(selectedArticle.prixVenteHT)}</span></div>
                      <div className="price-item"><label>PVTETTC</label><span className={isPromoActive(selectedArticle) ? "strikethrough" : ""}>{formatPrice(selectedArticle.prixVenteTTC)}</span></div>
                      {isPromoActive(selectedArticle) && <div className="price-item promo-price"><label>PVPROMO</label><span>{formatPrice(selectedArticle.prixPromo)}</span></div>}
                      <div className="price-item"><label>PACHAT</label><span>{formatPrice(selectedArticle.prixAchat)}</span></div>
                      <div className="price-item"><label>PREV</label><span>{formatPrice(selectedArticle.prixRevient)}</span></div>
                      <div className="price-item"><label>TAXES</label><span>{selectedArticle.taxes || 0}%</span></div>
                    </div>
                  </div>

                  <div className="info-block stock-block">
                    <h4><HiArchive /> Stocks par entrepôt</h4>
                    <div className="stock-grid">
                      <div className="stock-item total"><label>Total</label><span className={calculateStockTotal(selectedArticle) > 0 ? "positive" : "zero"}>{formatStock(calculateStockTotal(selectedArticle))}</span></div>
                      {DEPOT_KEYS.map((key, i) => (
                        <div key={key} className="stock-item">
                          <label>{mappingEntrepots[DEPOT_LABELS[i]] || DEPOT_LABELS[i]}</label>
                          <span className={parseFloat(selectedArticle[key]) > 0 ? "positive" : "zero"}>{formatStock(selectedArticle[key])}</span>
                        </div>
                      ))}
                      <div className="stock-item"><label>RESERV</label><span className="reserved">{formatStock(selectedArticle.reserve)}</span></div>
                      <div className="stock-item"><label>SMINI</label><span>{formatStock(selectedArticle.stockMini)}</span></div>
                    </div>
                    {calculateStockTotal(selectedArticle) > 0 && (
                      <div className="stock-value-line">Valeur stock HT : <strong>{formatPrice(calculateStockValueHT(selectedArticle))}</strong></div>
                    )}
                  </div>

                  {(selectedArticle.gism1 || selectedArticle.gism2 || selectedArticle.gism3 || selectedArticle.place) && (
                    <div className="info-block gisement-block">
                      <h4><HiLocationMarker /> Emplacements</h4>
                      <div className="gisement-grid">
                        {selectedArticle.place && <div className="gisement-item main"><label>PLACE</label><span>{selectedArticle.place}</span></div>}
                        {[1,2,3,4,5].map((n) => selectedArticle[`gism${n}`] && <div key={n} className="gisement-item"><label>GISM{n}</label><span>{selectedArticle[`gism${n}`]}</span></div>)}
                      </div>
                    </div>
                  )}

                  <div className="info-block dates-block">
                    <h4><HiCalendar /> Dates</h4>
                    <div className="info-grid">
                      <div className="info-item"><label>CREATION</label><span className="value">{formatDate(selectedArticle.dateCreation)}</span></div>
                      <div className="info-item"><label>DATINV</label><span className="value">{formatDate(selectedArticle.dateInventaire)}</span></div>
                      {selectedArticle.datePromoDebut && <div className="info-item"><label>DPROMOD</label><span className="value">{formatDate(selectedArticle.datePromoDebut)}</span></div>}
                      {selectedArticle.datePromoFin && <div className="info-item"><label>DPROMOF</label><span className="value">{formatDate(selectedArticle.datePromoFin)}</span></div>}
                    </div>
                  </div>

                  {selectedArticle.observation && (
                    <div className="info-block observations-block"><h4><HiAnnotation /> OBSERV</h4><p className="observations-text">{selectedArticle.observation}</p></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFournisseurInfosScreen;