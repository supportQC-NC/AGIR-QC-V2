// src/screens/admin/AdminFournisseursScreen.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  HiSearch, HiRefresh, HiOfficeBuilding, HiChevronLeft, HiChevronRight,
  HiPhone, HiEye, HiX, HiAdjustments, HiSortAscending, HiSortDescending,
  HiSwitchHorizontal, HiChevronDown, HiFilter, HiBan,
} from "react-icons/hi";
import { useGetEntreprisesQuery } from "../../slices/entrepriseApiSlice";
import { useGetFournisseursQuery, useGetFournisseursStatsQuery } from "../../slices/fournissApiSlice";
import "./AdminFournisseursScreen.css";

const STORAGE_KEY_ENTREPRISE = "admin_fournisseurs_selected_entreprise";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const formatPriceShort = (p) => {
  if (!p || p === 0) return "-";
  if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XPF", minimumFractionDigits: 0 }).format(p);
};

// Filtre santé fournisseur
const HEALTH_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actifs (au moins 1 article actif)" },
  { key: "all_stopped", label: "100% arrêtés uniquement" },
  { key: "hide_stopped", label: "Masquer les 100% arrêtés" },
  { key: "has_reappro", label: "Avec réappro nécessaire" },
];

const AdminFournisseursScreen = () => {
  const navigate = useNavigate();
  const { nomDossierDBF: urlNomDossier } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialEntreprise = () => {
    if (urlNomDossier) return urlNomDossier;
    return localStorage.getItem(STORAGE_KEY_ENTREPRISE) || "";
  };

  const [selectedEntreprise, setSelectedEntreprise] = useState(getInitialEntreprise);
  const [selectedEntrepriseData, setSelectedEntrepriseData] = useState(null);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [limit] = useState(50);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showFilters, setShowFilters] = useState(true);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const [healthFilter, setHealthFilter] = useState("all");

  const debouncedSearch = useDebounce(search, 400);

  // === Queries ===
  const { data: entreprises, isLoading: loadingEntreprises } = useGetEntreprisesQuery();

  const {
    data: dataFournisseurs,
    isLoading: loadingFournisseurs,
    error,
    refetch,
    isFetching,
  } = useGetFournisseursQuery(
    { nomDossierDBF: selectedEntreprise, page, limit, search: debouncedSearch || undefined },
    { skip: !selectedEntreprise }
  );

  const { data: statsData, isLoading: loadingStats } = useGetFournisseursStatsQuery(
    selectedEntreprise,
    { skip: !selectedEntreprise }
  );

  const allStats = statsData?.stats || {};

  // === Effects ===
  useEffect(() => {
    if (entreprises && selectedEntreprise) {
      const ent = entreprises.find((e) => e.nomDossierDBF === selectedEntreprise);
      if (ent) {
        setSelectedEntrepriseData(ent);
        localStorage.setItem(STORAGE_KEY_ENTREPRISE, selectedEntreprise);
      }
    }
  }, [entreprises, selectedEntreprise]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (search) params.set("search", search);
    setSearchParams(params, { replace: true });
  }, [search, page, setSearchParams]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  // === Handlers ===
  const handleEntrepriseChange = (e) => {
    const nomDossier = e.target.value;
    setSelectedEntreprise(nomDossier);
    setPage(1);
    setSearch("");
    setSortKey(null);
    setHealthFilter("all");
    if (nomDossier) {
      const ent = entreprises?.find((x) => x.nomDossierDBF === nomDossier);
      setSelectedEntrepriseData(ent);
      localStorage.setItem(STORAGE_KEY_ENTREPRISE, nomDossier);
    } else {
      setSelectedEntrepriseData(null);
      localStorage.removeItem(STORAGE_KEY_ENTREPRISE);
    }
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const safeTrim = (value) => (value === null || value === undefined ? "" : String(value).trim());

  // === Helper : est-ce que ce fournisseur a tous ses articles arrêtés ? ===
  const isAllStopped = (fournKey) => {
    const s = allStats[fournKey];
    if (!s || s.total === 0) return false;
    return s.arrete === s.total;
  };

  // === Filtrage par santé + Tri ===
  const filteredAndSortedFournisseurs = useMemo(() => {
    let list = dataFournisseurs?.fournisseurs || [];
    const hasStats = Object.keys(allStats).length > 0;

    // Filtre santé (nécessite les stats)
    if (hasStats && healthFilter !== "all") {
      list = list.filter((fourn) => {
        const fournKey = String(fourn.codeFourn).trim();
        const s = allStats[fournKey];
        if (!s) return healthFilter === "hide_stopped"; // pas de stats = pas d'articles = on garde si on masque les arrêtés

        switch (healthFilter) {
          case "active":
            return s.actif > 0;
          case "all_stopped":
            return s.total > 0 && s.arrete === s.total;
          case "hide_stopped":
            return !(s.total > 0 && s.arrete === s.total);
          case "has_reappro":
            return s.reappro > 0;
          default:
            return true;
        }
      });
    }

    // Tri
    if (sortKey && hasStats) {
      list = [...list].sort((a, b) => {
        const sa = allStats[String(a.codeFourn).trim()] || {};
        const sb = allStats[String(b.codeFourn).trim()] || {};
        const va = sa[sortKey] || 0;
        const vb = sb[sortKey] || 0;
        return sortDir === "desc" ? vb - va : va - vb;
      });
    }

    return list;
  }, [dataFournisseurs?.fournisseurs, allStats, sortKey, sortDir, healthFilter]);

  // === Stats globales agrégées ===
  const globalAggregated = useMemo(() => {
    if (Object.keys(allStats).length === 0) return null;
    let totalArticles = 0, totalActif = 0, totalDeprecie = 0, totalArrete = 0, totalReappro = 0, totalValue = 0, totalDepValue = 0;
    let fournTotalStopped = 0;
    Object.values(allStats).forEach((s) => {
      totalArticles += s.total;
      totalActif += s.actif;
      totalDeprecie += s.deprecie;
      totalArrete += s.arrete;
      totalReappro += s.reappro;
      totalValue += s.stockValueHT;
      totalDepValue += s.depValueHT;
      if (s.total > 0 && s.arrete === s.total) fournTotalStopped++;
    });
    return { totalArticles, totalActif, totalDeprecie, totalArrete, totalReappro, totalValue, totalDepValue, fournTotalStopped };
  }, [allStats]);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null;
    return sortDir === "desc" ? <HiSortDescending className="sort-icon-active" /> : <HiSortAscending className="sort-icon-active" />;
  };

  if (loadingEntreprises) return <div className="admin-fourn-page"><div className="admin-loading-state"><div className="loading-spinner"></div><p>Chargement...</p></div></div>;

  return (
    <div className="admin-fourn-page">
      {/* Header */}
      <header className="admin-fourn-header">
        <div className="header-left">
          <div className="header-icon"><HiOfficeBuilding /></div>
          <div className="header-title">
            <h1>Gestion des Fournisseurs</h1>
            <p className="header-subtitle">Consultation des fichiers fournisseurs DBF</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="entreprise-selector">
            <HiOfficeBuilding className="selector-icon" />
            <select value={selectedEntreprise} onChange={handleEntrepriseChange}>
              <option value="">Sélectionner une entreprise</option>
              {entreprises?.map((e) => (
                <option key={e._id} value={e.nomDossierDBF}>{e.trigramme} - {e.nomComplet}</option>
              ))}
            </select>
            <HiChevronDown className="selector-arrow" />
          </div>
        </div>
      </header>

      {!selectedEntreprise ? (
        <div className="empty-state">
          <div className="empty-icon"><HiOfficeBuilding /></div>
          <h2>Sélectionnez une entreprise</h2>
        </div>
      ) : (
        <div className="admin-fourn-content">
          {/* Sidebar */}
          <aside className={`filters-sidebar ${showFilters ? "open" : ""}`}>
            <div className="filters-header">
              <div className="filters-title"><HiFilter /> <span>Filtres</span></div>
              <button className="btn-toggle-filters" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <HiX /> : <HiAdjustments />}
              </button>
            </div>
            <div className="filters-body">
              <div className="filter-group">
                <label><HiSearch /> Recherche (Nom, Code, Ville...)</label>
                <input type="text" placeholder="Tapez votre recherche..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {/* Filtre santé fournisseur */}
              <div className="filter-group">
                <label><HiBan /> Santé fournisseur</label>
                <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
                  {HEALTH_FILTERS.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                {globalAggregated && globalAggregated.fournTotalStopped > 0 && (
                  <span className="filter-hint">
                    {globalAggregated.fournTotalStopped} fournisseur{globalAggregated.fournTotalStopped > 1 ? "s" : ""} avec 100% articles arrêtés
                  </span>
                )}
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="fourn-main">
            {/* Stats bar */}
            <div className="stats-bar">
              <div className="stat-item primary">
                <span className="stat-value">{dataFournisseurs?.pagination?.totalRecords?.toLocaleString() || 0}</span>
                <span className="stat-label">Fournisseurs</span>
              </div>
              {globalAggregated && (
                <>
                  <div className="stat-item stat-actif-g">
                    <span className="stat-value">{globalAggregated.totalActif.toLocaleString()}</span>
                    <span className="stat-label">Art. actifs</span>
                  </div>
                  <div className="stat-item stat-deprecie-g">
                    <span className="stat-value">{globalAggregated.totalDeprecie.toLocaleString()}</span>
                    <span className="stat-label">Dépréciés</span>
                  </div>
                  <div className="stat-item stat-arrete-g">
                    <span className="stat-value">{globalAggregated.totalArrete.toLocaleString()}</span>
                    <span className="stat-label">Arrêtés</span>
                  </div>
                  {globalAggregated.totalReappro > 0 && (
                    <div className="stat-item stat-reappro-g">
                      <span className="stat-value">{globalAggregated.totalReappro}</span>
                      <span className="stat-label">Réappro</span>
                    </div>
                  )}
                  <div className="stat-item">
                    <span className="stat-value">{formatPriceShort(globalAggregated.totalValue)}</span>
                    <span className="stat-label">Val. stock HT</span>
                  </div>
                </>
              )}
              <div className="stats-actions">
                <button className={`btn-icon-action ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)} title="Filtres"><HiAdjustments /></button>
                <button className="btn-icon-action" onClick={refetch} disabled={isFetching} title="Rafraîchir"><HiRefresh className={isFetching ? "spinning" : ""} /></button>
              </div>
            </div>

            {/* Info filtre actif */}
            {healthFilter !== "all" && (
              <div className="health-filter-banner">
                <span>Filtre actif : <strong>{HEALTH_FILTERS.find(f => f.key === healthFilter)?.label}</strong></span>
                <span className="health-filter-count">{filteredAndSortedFournisseurs.length} fournisseur{filteredAndSortedFournisseurs.length !== 1 ? "s" : ""}</span>
                <button className="health-filter-clear" onClick={() => setHealthFilter("all")}><HiX /> Réinitialiser</button>
              </div>
            )}

            {/* Table */}
            <div className="fourn-table-container">
              {loadingFournisseurs || isFetching ? (
                <div className="table-loading"><div className="loading-spinner"></div><p>Chargement des fournisseurs...</p></div>
              ) : error ? (
                <div className="table-error"><p>Erreur de chargement</p><button onClick={refetch}>Réessayer</button></div>
              ) : filteredAndSortedFournisseurs.length === 0 ? (
                <div className="table-empty">
                  <HiOfficeBuilding />
                  <h3>Aucun fournisseur trouvé</h3>
                  <p>{healthFilter !== "all" ? "Modifiez le filtre de santé ou la recherche" : "Modifiez votre recherche"}</p>
                </div>
              ) : (
                <table className="fourn-table">
                  <thead>
                    <tr>
                      <th className="col-code">Code</th>
                      <th className="col-nom">Nom</th>
                      <th className="col-adresse">Adresse</th>
                      <th className="col-tel">Tél.</th>
                      <th className="col-stats">Répartition</th>
                      <th className="col-sortable" onClick={() => handleSort("actif")}>Actifs <SortIcon col="actif" /></th>
                      <th className="col-sortable" onClick={() => handleSort("deprecie")}>Dépr. <SortIcon col="deprecie" /></th>
                      <th className="col-sortable" onClick={() => handleSort("arrete")}>Arrêt. <SortIcon col="arrete" /></th>
                      <th className="col-sortable col-reappro-head" onClick={() => handleSort("reappro")} title="Réappro magasin"><HiSwitchHorizontal /> <SortIcon col="reappro" /></th>
                      <th className="col-sortable" onClick={() => handleSort("stockValueHT")}>Val. HT <SortIcon col="stockValueHT" /></th>
                      <th className="col-actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedFournisseurs.map((fourn) => {
                      const fournKey = String(fourn.codeFourn).trim();
                      const stats = allStats[fournKey];
                      const hasStats = !!stats;
                      const total = stats?.total || 0;
                      const actif = stats?.actif || 0;
                      const deprecie = stats?.deprecie || 0;
                      const arrete = stats?.arrete || 0;
                      const reappro = stats?.reappro || 0;
                      const arreteRate = stats?.arreteRate || 0;
                      const depRate = stats?.depRate || 0;
                      const stockValueHT = stats?.stockValueHT || 0;
                      const allStopped = total > 0 && arrete === total;

                      const rowClass = allStopped ? "row-all-stopped" : arreteRate > 70 ? "row-health-bad" : depRate > 30 ? "row-health-warn" : "";

                      return (
                        <tr key={fourn.codeFourn} className={rowClass}>
                          <td className="col-code">
                            <Link to={`/admin/fournisseurs/${selectedEntreprise}/${fourn.codeFourn}`} className="fourn-code-link">
                              {fourn.codeFourn}
                            </Link>
                          </td>
                          <td className="col-nom">
                            <div className="nom-cell">
                              <strong>{safeTrim(fourn.nom)}</strong>
                              {allStopped && <span className="badge-all-stopped" title="Tous les articles sont arrêtés"><HiBan /> 100% arrêté</span>}
                            </div>
                          </td>
                          <td className="col-adresse">
                            <span className="adr-line">{safeTrim(fourn.adresse1)}</span>
                            <span className="adr-line city">{safeTrim(fourn.adresse2)} {safeTrim(fourn.adresse3)}</span>
                          </td>
                          <td className="col-tel">
                            {safeTrim(fourn.telephone) && (
                              <a href={`tel:${safeTrim(fourn.telephone)}`} className="tel-link"><HiPhone /> {safeTrim(fourn.telephone)}</a>
                            )}
                          </td>
                          <td className="col-stats">
                            {hasStats && total > 0 ? (
                              <div className="mini-stats-bar" title={`${actif} actifs / ${deprecie} dépréciés / ${arrete} arrêtés`}>
                                {actif > 0 && <div className="mini-segment seg-actif" style={{ width: `${(actif / total) * 100}%` }}></div>}
                                {deprecie > 0 && <div className="mini-segment seg-deprecie" style={{ width: `${(deprecie / total) * 100}%` }}></div>}
                                {arrete > 0 && <div className="mini-segment seg-arrete" style={{ width: `${(arrete / total) * 100}%` }}></div>}
                                <span className="mini-stats-total">{total}</span>
                              </div>
                            ) : hasStats ? (
                              <span className="no-articles">0 art.</span>
                            ) : loadingStats ? (
                              <span className="stats-loading">…</span>
                            ) : null}
                          </td>
                          <td className="col-num"><span className="num-actif">{hasStats ? actif : "-"}</span></td>
                          <td className="col-num"><span className={`num-deprecie ${deprecie > 0 ? "has" : ""}`}>{hasStats ? deprecie : "-"}</span></td>
                          <td className="col-num"><span className={`num-arrete ${arrete > 0 ? "has" : ""}`}>{hasStats ? arrete : "-"}</span></td>
                          <td className="col-num"><span className={`num-reappro ${reappro > 0 ? "has" : ""}`}>{hasStats ? reappro : "-"}</span></td>
                          <td className="col-num"><span className="num-value">{hasStats && stockValueHT > 0 ? formatPriceShort(stockValueHT) : "-"}</span></td>
                          <td className="col-actions">
                            <Link to={`/admin/fournisseurs/${selectedEntreprise}/${fourn.codeFourn}`} className="btn-view" title="Voir détails"><HiEye /></Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {dataFournisseurs?.pagination && dataFournisseurs.pagination.totalPages > 1 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Page {dataFournisseurs.pagination.page} sur {dataFournisseurs.pagination.totalPages}
                  ({dataFournisseurs.pagination.totalRecords} fournisseurs)
                </div>
                <div className="pagination-controls">
                  <button className="btn-page" disabled={!dataFournisseurs.pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
                    <HiChevronLeft /> Précédent
                  </button>
                  <button className="btn-page" disabled={!dataFournisseurs.pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                    Suivant <HiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default AdminFournisseursScreen;