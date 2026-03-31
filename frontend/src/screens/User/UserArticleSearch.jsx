// src/screens/user/UserArticleSearch.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  HiSearch,
  HiOfficeBuilding,
  HiCube,
  HiX,
  HiQrcode,
  HiPhotograph,
  HiExclamation,
  HiCubeTransparent,
  HiSwitchHorizontal,
  HiTag,
  HiGlobe,
  HiChartBar,
  HiTruck,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import { useGetMyEntreprisesQuery } from "../../slices/entrepriseApiSlice";
import {
  useGetArticleByNartQuery,
  useGetArticleByGencodQuery,
  getPhotoUrl,
} from "../../slices/articleApiSlice";
import { useGetArticleFilialeDataQuery } from "../../slices/fillialeApiSlice";
import "./UserArticleSearch.css";

const ArticleSearch = () => {
  const [selectedEntreprise, setSelectedEntreprise] = useState("");
  const [selectedEntrepriseData, setSelectedEntrepriseData] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchType, setSearchType] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [photoError, setPhotoError] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const inputRef = useRef(null);

  const { data: entreprises, isLoading: loadingEntreprises } =
    useGetMyEntreprisesQuery();

  const {
    data: resultByNart,
    isLoading: loadingNart,
    error: errorNart,
    isFetching: fetchingNart,
  } = useGetArticleByNartQuery(
    { nomDossierDBF: selectedEntreprise, nart: searchTerm },
    { skip: !selectedEntreprise || !searchTerm || searchType !== "nart" },
  );

  const {
    data: resultByGencod,
    isLoading: loadingGencod,
    error: errorGencod,
    isFetching: fetchingGencod,
  } = useGetArticleByGencodQuery(
    { nomDossierDBF: selectedEntreprise, gencod: searchTerm },
    { skip: !selectedEntreprise || !searchTerm || searchType !== "gencod" },
  );

  const result = searchType === "gencod" ? resultByGencod : resultByNart;
  const article = result?.article;

  const {
    data: filialeData,
    isLoading: loadingFiliales,
    isFetching: fetchingFiliales,
  } = useGetArticleFilialeDataQuery(
    {
      nomDossierDBF: selectedEntreprise,
      nart: article?.NART?.trim() || "",
    },
    {
      skip: !selectedEntreprise || !article?.NART,
    },
  );

  // ===== HELPERS =====

  const safeTrim = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    return String(value);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XPF",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatStock = (stock) => {
    if (stock === null || stock === undefined) return "-";
    return stock.toLocaleString("fr-FR");
  };

  const calculateDiscount = (originalPrice, promoPrice) => {
    if (!originalPrice || !promoPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
  };

  const getEntrepotLabel = (key) => {
    const mapping = selectedEntrepriseData?.mappingEntrepots || {
      S1: "Magasin",
      S2: "S2",
      S3: "S3",
      S4: "S4",
      S5: "S5",
    };
    return mapping[key] || key;
  };

  const calculateStockTotal = (art) => {
    if (!art) return 0;
    return (
      (parseFloat(art.S1) || 0) +
      (parseFloat(art.S2) || 0) +
      (parseFloat(art.S3) || 0) +
      (parseFloat(art.S4) || 0) +
      (parseFloat(art.S5) || 0)
    );
  };

  const getEnCommande = (art) => {
    if (!art) return 0;
    return parseFloat(art.ENCDE) || 0;
  };

  const getPromoTTC = (art) => {
    if (!art?.PVPROMO) return 0;
    const taux = parseFloat(art.ATVA) || 0;
    return Math.round(art.PVPROMO * (1 + taux / 100));
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string" && dateValue.length === 8) {
      const year = parseInt(dateValue.substring(0, 4));
      const month = parseInt(dateValue.substring(4, 6)) - 1;
      const day = parseInt(dateValue.substring(6, 8));
      return new Date(year, month, day);
    }
    if (typeof dateValue === "string") {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (typeof dateValue === "number") {
      if (dateValue > 19000000 && dateValue < 30000000) {
        const str = dateValue.toString();
        const year = parseInt(str.substring(0, 4));
        const month = parseInt(str.substring(4, 6)) - 1;
        const day = parseInt(str.substring(6, 8));
        return new Date(year, month, day);
      }
      return new Date(dateValue);
    }
    return null;
  };

  const isPromoActive = (art) => {
    if (!art?.DPROMOD || !art?.DPROMOF || !art?.PVPROMO) return false;
    const dateDebut = parseDate(art.DPROMOD);
    const dateFin = parseDate(art.DPROMOF);
    if (!dateDebut || !dateFin) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin.setHours(23, 59, 59, 999);
    return today >= dateDebut && today <= dateFin;
  };

  const formatPromoEndDate = (dateValue) => {
    const date = parseDate(dateValue);
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ===== EFFECTS =====

  useEffect(() => {
    if (entreprises?.length === 1) {
      setSelectedEntreprise(entreprises[0].nomDossierDBF);
      setSelectedEntrepriseData(entreprises[0]);
    }
  }, [entreprises]);

  useEffect(() => {
    if (selectedEntreprise && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedEntreprise]);

  useEffect(() => {
    setPhotoError(false);
    setPhotoLoaded(false);
    setActiveTab("details");
  }, [searchTerm]);

  useEffect(() => {
    const res = searchType === "gencod" ? resultByGencod : resultByNart;
    if (res?.article && searchTerm) {
      setSearchValue("");
      // Ne pas re-focus automatiquement : ça rouvre le clavier virtuel
    }
  }, [resultByNart, resultByGencod, searchType, searchTerm]);

  // ===== HANDLERS =====

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchValue.trim() || !selectedEntreprise) return;
    const value = searchValue.trim();
    setSearchTerm(value);
    setSearchType(/^\d{8,13}$/.test(value) ? "gencod" : "nart");
    // Fermer le clavier virtuel
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchValue("");
    setSearchTerm("");
    setSearchType(null);
    setPhotoError(false);
    setPhotoLoaded(false);
    setActiveTab("details");
    inputRef.current?.focus();
  };

  const handleEntrepriseChange = (e) => {
    const nomDossier = e.target.value;
    setSelectedEntreprise(nomDossier);
    const ent = entreprises?.find((x) => x.nomDossierDBF === nomDossier);
    setSelectedEntrepriseData(ent);
    handleClear();
  };

  // ===== DERIVED STATE =====

  const isRenvoi = result?.isRenvoi || false;
  const articleOriginal = result?.articleOriginal;
  const nombreRenvois = result?.nombreRenvois || 0;
  const hasActivePromo = article ? isPromoActive(article) : false;
  const isLoading = loadingNart || loadingGencod;
  const isFetching = fetchingNart || fetchingGencod;
  const error = searchType === "gencod" ? errorGencod : errorNart;
  const hasPhotosConfigured = !!selectedEntrepriseData?.cheminPhotos;

  const photoUrl =
    hasPhotosConfigured && article
      ? getPhotoUrl(selectedEntrepriseData?.trigramme, article.NART)
      : null;

  // ===== RENDER: FILIALES TAB =====

  const renderFilialesTab = () => {
    if (loadingFiliales || fetchingFiliales) {
      return (
        <div className="filiales-loading">
          <div className="loading-spinner"></div>
          <p>Chargement des données inter-entreprises...</p>
        </div>
      );
    }

    if (!filialeData?.filiales?.length) {
      return (
        <div className="filiales-empty">
          <HiGlobe className="filiales-empty-icon" />
          <h3>Aucune donnée disponible</h3>
          <p>Cet article n'a pas de correspondance dans les autres entités</p>
        </div>
      );
    }

    const filiales = filialeData.filiales;
    const stockFiliales = filialeData.stockTotal || 0;
    const stockLocal = calculateStockTotal(article);
    const stockTotalGroupe = stockFiliales + stockLocal;
    const filialesAvecStock = filiales.filter((f) => f.stock > 0);
    const filialesSansStock = filiales.filter((f) => f.stock === 0);
    const nbEntitesAvecStock =
      filialesAvecStock.length + (stockLocal > 0 ? 1 : 0);

    const renderFilialeCard = (filiale, index, hasStock) => (
      <div
        key={`${hasStock ? "stock" : "nostock"}-${index}`}
        className={`filiale-card ${hasStock ? "has-stock" : "no-stock"}`}
      >
        <div className="filiale-card-header">
          <div className="filiale-card-entity">
            <span className="filiale-trigramme">{filiale.trigramme}</span>
            <span className="filiale-nom">{filiale.entrepriseNom}</span>
          </div>
          <div
            className={`filiale-card-status ${hasStock ? "in-stock" : "out-of-stock"}`}
          >
            {hasStock ? <HiCheckCircle /> : <HiXCircle />}
            <span>{hasStock ? "En stock" : "Rupture"}</span>
          </div>
        </div>
        <div className="filiale-card-body">
          <div className="filiale-card-info">
            <span className="filiale-card-label">Code</span>
            <code className="filiale-card-nart">{filiale.nartFiliale}</code>
          </div>
          <div className="filiale-card-info">
            <span className="filiale-card-label">Stock</span>
            <span
              className={`filiale-card-stock ${hasStock ? "positive" : "zero"}`}
            >
              {hasStock ? formatStock(filiale.stock) : "0"}
            </span>
          </div>
          <div className="filiale-card-info">
            <span className="filiale-card-label">Prix</span>
            {filiale.hasPrix ? (
              <span className={`filiale-card-prix ${!hasStock ? "muted" : ""}`}>
                {formatPrice(filiale.prix)}
              </span>
            ) : (
              <span className="filiale-card-prix-na">Grossiste</span>
            )}
          </div>
        </div>
      </div>
    );

    return (
      <div className="filiales-content">
        <div className="filiales-summary">
          <div className="filiales-summary-card total">
            <HiChartBar className="summary-icon" />
            <div className="summary-info">
              <span className="summary-label">Stock Groupe</span>
              <span
                className={`summary-value ${stockTotalGroupe > 0 ? "positive" : "zero"}`}
              >
                {formatStock(stockTotalGroupe)}
              </span>
            </div>
          </div>
          <div className="filiales-summary-card count">
            <HiOfficeBuilding className="summary-icon" />
            <div className="summary-info">
              <span className="summary-label">Entités</span>
              <span className="summary-value">{filiales.length}</span>
            </div>
          </div>
          <div className="filiales-summary-card available">
            <HiCube className="summary-icon" />
            <div className="summary-info">
              <span className="summary-label">En stock</span>
              <span className="summary-value positive">
                {nbEntitesAvecStock}
              </span>
            </div>
          </div>
        </div>

        <div className="filiales-list">
          <h3 className="filiales-list-title">
            <HiGlobe />
            Disponibilité par entité
          </h3>
          <div className="filiales-cards-container">
            {filialesAvecStock.map((f, i) => renderFilialeCard(f, i, true))}
            {filialesSansStock.map((f, i) => renderFilialeCard(f, i, false))}
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER: LOADING / EMPTY =====

  if (loadingEntreprises) {
    return (
      <div className="article-search-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!entreprises?.length) {
    return (
      <div className="article-search-page">
        <div className="empty-state">
          <HiOfficeBuilding className="empty-icon" />
          <h2>Aucun accès</h2>
          <p>Vous n'avez accès à aucune entreprise</p>
        </div>
      </div>
    );
  }

  // ===== RENDER: MAIN =====

  return (
    <div className="article-search-page">
      <header className="search-header">
        <div className="header-content">
          {entreprises.length > 1 ? (
            <div className="entreprise-select-wrapper">
              <HiOfficeBuilding className="select-icon" />
              <select
                value={selectedEntreprise}
                onChange={handleEntrepriseChange}
                className="entreprise-select"
              >
                <option value="">Entreprise...</option>
                {entreprises.map((e) => (
                  <option key={e._id} value={e.nomDossierDBF}>
                    {e.trigramme} - {e.nomComplet}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="entreprise-chip">
              <HiOfficeBuilding />
              <span>{entreprises[0].trigramme}</span>
              <span className="chip-separator">•</span>
              <span>{entreprises[0].nomComplet}</span>
            </div>
          )}
        </div>
      </header>

      <main className="search-main">
        {selectedEntreprise ? (
          <>
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-container">
                <HiQrcode className="input-icon" />
                <input
                  ref={inputRef}
                  type="text"
                  className="search-input"
                  placeholder="Code barre ou code article..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {searchValue && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={handleClear}
                    aria-label="Effacer"
                  >
                    <HiX />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="search-btn"
                disabled={!searchValue.trim() || isFetching}
              >
                <HiSearch />
                <span>{isFetching ? "..." : "Rechercher"}</span>
              </button>
            </form>

            <div className="results-container">
              {isLoading || isFetching ? (
                <div className="result-loading">
                  <div className="loading-spinner"></div>
                  <p>Recherche en cours...</p>
                </div>
              ) : error ? (
                <div className="result-not-found">
                  <div className="not-found-icon">
                    <HiCube />
                  </div>
                  <h3>Article non trouvé</h3>
                  <p>Vérifiez le code et réessayez</p>
                  <span className="searched-code">
                    Code recherché : {searchTerm}
                  </span>
                </div>
              ) : article ? (
                <div
                  className={`article-result ${isRenvoi ? "has-renvoi" : ""} ${hasActivePromo ? "has-promo" : ""}`}
                >
                  {/* === PROMO BANNER === */}
                  {hasActivePromo && (
                    <div className="promo-banner">
                      <div className="promo-banner-content">
                        <HiTag className="promo-icon" />
                        <span>PROMOTION EN COURS</span>
                        <span className="promo-discount">
                          -
                          {calculateDiscount(
                            article.PVTETTC,
                            getPromoTTC(article),
                          )}
                          %
                        </span>
                      </div>
                      <div className="promo-end-date">
                        Jusqu'au {formatPromoEndDate(article.DPROMOF)}
                      </div>
                    </div>
                  )}

                  {/* === RENVOI BANNER === */}
                  {isRenvoi && (
                    <div className="renvoi-banner">
                      <div className="renvoi-banner-content">
                        <HiSwitchHorizontal className="renvoi-icon" />
                        <span>ARTICLE EN RENVOI</span>
                      </div>
                    </div>
                  )}

                  {/* === RENVOI DETAILS === */}
                  {isRenvoi && articleOriginal && (
                    <div className="renvoi-details-section">
                      <div className="renvoi-details">
                        <div className="renvoi-from">
                          <span className="renvoi-label">Article scanné</span>
                          <span className="renvoi-nart">
                            {articleOriginal.nart}
                          </span>
                          <span className="renvoi-design">
                            {articleOriginal.designation}
                          </span>
                          {articleOriginal.gencod && (
                            <span className="renvoi-gencod">
                              <HiQrcode /> {articleOriginal.gencod}
                            </span>
                          )}
                        </div>
                        <div className="renvoi-arrow">
                          <HiSwitchHorizontal />
                        </div>
                        <div className="renvoi-to">
                          <span className="renvoi-label">Remplacé par</span>
                          <span className="renvoi-nart">
                            {safeTrim(article.NART)}
                          </span>
                          <span className="renvoi-design">
                            {safeTrim(article.DESIGN)}
                          </span>
                          {safeTrim(article.GENCOD) && (
                            <span className="renvoi-gencod">
                              <HiQrcode /> {safeTrim(article.GENCOD)}
                            </span>
                          )}
                        </div>
                      </div>
                      {nombreRenvois > 1 && (
                        <div className="renvoi-chain-warning">
                          ⚠️ Chaîne de {nombreRenvois} renvois
                        </div>
                      )}
                    </div>
                  )}

                  {/* === TABS === */}
                  <div className="article-tabs">
                    <button
                      className={`tab-btn ${activeTab === "details" ? "active" : ""}`}
                      onClick={() => setActiveTab("details")}
                    >
                      <HiCube />
                      <span>Détails</span>
                    </button>
                    <button
                      className={`tab-btn ${activeTab === "filiales" ? "active" : ""}`}
                      onClick={() => setActiveTab("filiales")}
                    >
                      <HiGlobe />
                      <span>Stock Groupe</span>
                      {filialeData?.filiales?.length > 0 && (
                        <span className="tab-badge">
                          {filialeData.filiales.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* === TAB CONTENT === */}
                  {activeTab === "details" ? (
                    <div className="article-details-container">
                      {/* PHOTO */}
                      {hasPhotosConfigured && (
                        <div className="article-photo-section">
                          {hasActivePromo && (
                            <div className="photo-promo-badge">
                              <span className="promo-percent">
                                -
                                {calculateDiscount(
                                  article.PVTETTC,
                                  getPromoTTC(article),
                                )}
                                %
                              </span>
                            </div>
                          )}
                          {!photoError ? (
                            <div
                              className={`photo-container ${photoLoaded ? "loaded" : ""}`}
                            >
                              <img
                                src={photoUrl}
                                alt={safeTrim(article.DESIGN)}
                                onError={() => setPhotoError(true)}
                                onLoad={() => setPhotoLoaded(true)}
                                className="article-photo"
                              />
                              {!photoLoaded && (
                                <div className="photo-placeholder">
                                  <div className="loading-spinner small"></div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="no-photo">
                              <HiPhotograph />
                              <span>Photo non disponible</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* INFO */}
                      <div className="article-info-section">
                        {/* Header: codes + stock indicator */}
                        <div className="article-header">
                          <div className="article-codes">
                            <span
                              className={`nart-badge ${isRenvoi ? "renvoi" : ""}`}
                            >
                              {isRenvoi && (
                                <HiSwitchHorizontal className="badge-icon" />
                              )}
                              {safeTrim(article.NART)}
                            </span>
                            {safeTrim(article.GENCOD) && (
                              <span className="gencod-label">
                                <HiQrcode />
                                {safeTrim(article.GENCOD)}
                              </span>
                            )}
                          </div>
                          <div
                            className={`stock-indicator ${calculateStockTotal(article) > 0 ? "in-stock" : "out-of-stock"}`}
                          >
                            {calculateStockTotal(article) > 0 ? (
                              <>
                                <span className="stock-dot"></span>
                                En stock
                              </>
                            ) : (
                              <>
                                <HiExclamation />
                                Rupture
                              </>
                            )}
                          </div>
                        </div>

                        {/* Designation */}
                        <div className="article-designation">
                          <h2>{safeTrim(article.DESIGN)}</h2>
                          {safeTrim(article.DESIGN2) && (
                            <p className="designation-2">
                              {safeTrim(article.DESIGN2)}
                            </p>
                          )}
                        </div>

                        {/* Entrepots grid */}
                        <div className="entrepots-info-grid">
                          <div className="info-card fourn">
                            <span className="info-label">Fournisseur</span>
                            <span className="info-value">
                              {safeTrim(article.FOURN) || "-"}
                            </span>
                          </div>

                          <div className="info-card en-commande">
                            <HiTruck className="info-card-icon" />
                            <span className="info-label">En Commande</span>
                            <span
                              className={`info-value ${getEnCommande(article) > 0 ? "positive" : ""}`}
                            >
                              {formatStock(getEnCommande(article))}
                            </span>
                          </div>

                          <div className="info-card stock-total">
                            <span className="info-label">Stock Total</span>
                            <span
                              className={`info-value ${calculateStockTotal(article) > 0 ? "positive" : "zero"}`}
                            >
                              {formatStock(calculateStockTotal(article))}
                            </span>
                          </div>

                          {["S1", "S2", "S3", "S4", "S5"].map((key) => (
                            <div className="info-card" key={key}>
                              <span className="info-label">
                                {getEntrepotLabel(key)}
                              </span>
                              <span className="info-value highlight">
                                {formatStock(article[key])}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Extra info */}
                        <div className="article-extra-info">
                          {safeTrim(article.REFER) && (
                            <div className="extra-info-item">
                              <span className="extra-label">Réf. fourn.</span>
                              <span className="extra-value">
                                {safeTrim(article.REFER)}
                              </span>
                            </div>
                          )}
                          {safeTrim(article.GROUPE) && (
                            <div className="extra-info-item">
                              <span className="extra-label">Groupe</span>
                              <span className="extra-value">
                                {safeTrim(article.GROUPE)}
                              </span>
                            </div>
                          )}
                          {safeTrim(article.PLACE) && (
                            <div className="extra-info-item">
                              <span className="extra-label">Place</span>
                              <span className="extra-value">
                                {safeTrim(article.PLACE)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* === PRIX === */}
                        <div
                          className={`price-section ${hasActivePromo ? "has-promo" : ""}`}
                        >
                          {hasActivePromo ? (
                            <>
                              <div className="price-main promo">
                                <div className="price-promo-container">
                                  <span className="price-label">
                                    Prix PROMO TTC
                                  </span>
                                  <div className="price-with-badge">
                                    <span className="price-value promo-price">
                                      {formatPrice(getPromoTTC(article))}
                                    </span>
                                    <span className="discount-badge">
                                      -
                                      {calculateDiscount(
                                        article.PVTETTC,
                                        getPromoTTC(article),
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                                <div className="original-price-container">
                                  <span className="price-label-small">
                                    Prix normal TTC
                                  </span>
                                  <span className="price-value original-price strikethrough">
                                    {formatPrice(article.PVTETTC)}
                                  </span>
                                </div>
                                <div className="original-price-container">
                                  <span className="price-label-small">
                                    Prix promo HT
                                  </span>
                                  <span className="price-value original-price">
                                    {formatPrice(article.PVPROMO)}
                                  </span>
                                </div>
                              </div>
                              <div className="promo-savings">
                                <HiTag />
                                <span>
                                  Économie de{" "}
                                  {formatPrice(
                                    article.PVTETTC - getPromoTTC(article),
                                  )}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="price-main">
                              <span className="price-label">Prix TTC</span>
                              <span className="price-value">
                                {formatPrice(article.PVTETTC)}
                              </span>
                            </div>
                          )}
                          <div className="price-details">
                            <div className="price-item">
                              <span>Prix HT</span>
                              <span>{formatPrice(article.PVTE)}</span>
                            </div>
                            <div className="price-item">
                              <span>Taux TGC</span>
                              <span>{article.ATVA || 0}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Stock réservé */}
                        {article.RESERV > 0 && (
                          <div className="stock-section">
                            <h3>Stock réservé</h3>
                            <div className="stock-grid">
                              <div className="stock-card reserved">
                                <span className="stock-label">Réservé</span>
                                <span className="stock-value">
                                  {formatStock(article.RESERV)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Observations */}
                        {safeTrim(article.OBSERV) && (
                          <div className="observations-section">
                            <h3>Observations</h3>
                            <p>{safeTrim(article.OBSERV)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    renderFilialesTab()
                  )}
                </div>
              ) : searchTerm ? (
                <div className="result-not-found">
                  <div className="not-found-icon">
                    <HiCube />
                  </div>
                  <h3>Article non trouvé</h3>
                  <p>Aucun article ne correspond à "{searchTerm}"</p>
                </div>
              ) : (
                <div className="result-placeholder">
                  <div className="placeholder-icon">
                    <HiQrcode />
                  </div>
                  <h3>Prêt à scanner</h3>
                  <p>Scannez un code barre ou saisissez un code article</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="select-entreprise-prompt">
            <div className="prompt-icon">
              <HiOfficeBuilding />
            </div>
            <h2>Sélectionnez une entreprise</h2>
            <p>Choisissez une entreprise pour commencer la recherche</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ArticleSearch;
