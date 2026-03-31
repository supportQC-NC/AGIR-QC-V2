// src/screens/admin/AdminCommandeDetailScreen.jsx
import React, { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  HiArrowLeft,
  HiChevronLeft,
  HiChevronRight,
  HiClipboardList,
  HiDocumentText,
  HiTruck,
  HiCalendar,
  HiLockClosed,
  HiLockOpen,
  HiCurrencyDollar,
  HiShoppingCart,
  HiGlobe,
  HiDocumentDuplicate,
  HiCheckCircle,
  HiClock,
  HiExclamation,
  HiRefresh,
  HiSearch,
  HiCheck,
  HiX,
  HiExternalLink,
  HiEye,
} from "react-icons/hi";
import {
  useGetCommandeByNumcdeQuery,
  useGetAdjacentCommandesQuery,
} from "../../slices/commandeApiSlice";
import { useGetEntrepriseByDossierQuery } from "../../slices/entrepriseApiSlice";
import "./AdminCommandeDetailsScreen.css";

// Icônes et couleurs par défaut par état
const ETAT_DEFAULTS = {
  0: { color: "muted", icon: HiDocumentText },
  1: { color: "info", icon: HiClock },
  2: { color: "muted", icon: HiDocumentText },
  3: { color: "warning", icon: HiExclamation },
  4: { color: "info", icon: HiTruck },
  5: { color: "success", icon: HiCheckCircle },
  6: { color: "warning", icon: HiGlobe },
  7: { color: "info", icon: HiTruck },
  8: { color: "info", icon: HiTruck },
  9: { color: "muted", icon: HiShoppingCart },
};

const DEFAULT_ETAT_LABELS = {
  0: "Brouillon",
  1: "A Préparer",
  2: "Proforma",
  3: "Reliquat",
  4: "Envoyée",
  5: "Confirmée",
  6: "Transit",
  7: "Bateau",
  8: "Avion",
  9: "Commande locale",
};

const AdminCommandeDetailScreen = () => {
  const { nomDossierDBF, numcde } = useParams();
  const navigate = useNavigate();

  const [searchLignes, setSearchLignes] = useState("");
  const [filterPointe, setFilterPointe] = useState("TOUT");

  // Queries
  const {
    data: commandeData,
    isLoading,
    error,
    refetch,
  } = useGetCommandeByNumcdeQuery(
    { nomDossierDBF, numcde },
    { skip: !nomDossierDBF || !numcde },
  );

  const { data: adjacentData } = useGetAdjacentCommandesQuery(
    { nomDossierDBF, numcde },
    { skip: !nomDossierDBF || !numcde },
  );

  const { data: entreprise } = useGetEntrepriseByDossierQuery(nomDossierDBF, {
    skip: !nomDossierDBF,
  });

  // Données
  const commande = commandeData?.commande;
  const cmdplus = commandeData?.cmdplus;
  const details = commandeData?.details;
  const lignes = details?.lignes || [];
  const totaux = details?.totaux || {};

  const etatLabelsMap = useMemo(() => {
    if (entreprise?.mappingEtatsCommande) {
      const mapping = entreprise.mappingEtatsCommande;
      const result = { ...DEFAULT_ETAT_LABELS };
      Object.keys(mapping).forEach((key) => {
        result[key] = mapping[key];
      });
      return result;
    }
    return DEFAULT_ETAT_LABELS;
  }, [entreprise]);

  // Filtrage local des lignes
  const filteredLignes = useMemo(() => {
    let result = [...lignes];
    if (searchLignes) {
      const searchLower = searchLignes.toLowerCase();
      result = result.filter(
        (l) =>
          (l.NART && l.NART.trim().toLowerCase().includes(searchLower)) ||
          (l.DESIGN && l.DESIGN.trim().toLowerCase().includes(searchLower)) ||
          (l.REFER && l.REFER.trim().toLowerCase().includes(searchLower)),
      );
    }
    if (filterPointe === "OUI") {
      result = result.filter(
        (l) => l.POINTE && l.POINTE.trim().toUpperCase() === "O",
      );
    } else if (filterPointe === "NON") {
      result = result.filter(
        (l) => !l.POINTE || l.POINTE.trim().toUpperCase() !== "O",
      );
    }
    return result;
  }, [lignes, searchLignes, filterPointe]);

  // Helpers
  const safeTrim = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    return String(value);
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return "-";
    const n = parseFloat(price);
    if (isNaN(n)) return "-";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XPF",
      minimumFractionDigits: 0,
    }).format(n);
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return "-";
    const n = parseFloat(num);
    if (isNaN(n)) return "-";
    return n.toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) return "-";
      return dateValue.toLocaleDateString("fr-FR");
    }
    if (typeof dateValue === "string" && dateValue.length === 8) {
      return `${dateValue.substring(6, 8)}/${dateValue.substring(4, 6)}/${dateValue.substring(0, 4)}`;
    }
    if (typeof dateValue === "string" && dateValue.includes("-")) {
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("fr-FR");
    }
    return "-";
  };

  const getEtatInfo = (etat) => {
    const label = etatLabelsMap[etat] || `État ${etat}`;
    const defaults = ETAT_DEFAULTS[etat] || {
      color: "muted",
      icon: HiDocumentText,
    };
    return { label, color: defaults.color, icon: defaults.icon };
  };

  // Vérifie si cmdplus a des données significatives
  const hasCmdplusData = useMemo(() => {
    if (!cmdplus) return false;
    // Vérifier s'il y a au moins un champ non vide/non nul
    const fieldsToCheck = [
      "DATCONFIRM", "DATTRANSIT", "DATBATEAU", "NUMCONTEN", "TYPCONTEN",
      "TRANSITAIR", "CMDECLIENT", "COLIS", "POIDS", "VOLUME",
      "BOOKTRANS", "FACTTRANS",
    ];
    return fieldsToCheck.some((f) => {
      const val = cmdplus[f];
      if (val === null || val === undefined) return false;
      if (val instanceof Date) return !isNaN(val.getTime());
      if (typeof val === "string") return val.trim().length > 0;
      return val !== 0;
    });
  }, [cmdplus]);

  // Vérifie si cmdplus a des frais
  const hasCmdplusFrais = useMemo(() => {
    if (!cmdplus) return false;
    const fraisFields = [
      "MONTFOURN", "MONTCAF", "FRET", "HAD", "DEBARQMT", "FRAISDOSS",
      "FRAISINFO", "FRAISAP", "FRAISTRESO", "TGC6FRAIS", "DROIDOUANE",
      "TGC3DOUANE", "TGC6DOUANE", "TGC11DOUAN", "TGC22DOUAN",
      "DIVERLOCAL", "FRETLOCAL", "TGC6LOCAL", "PATENTE", "FRAISBANK",
      "ASSURANCE", "COMMISSION", "REPARTIT",
    ];
    return fraisFields.some((f) => {
      const val = parseFloat(cmdplus[f]);
      return !isNaN(val) && val !== 0;
    });
  }, [cmdplus]);

  const handleNavigate = (targetNumcde) => {
    if (targetNumcde) {
      navigate(`/admin/commandes/${nomDossierDBF}/${targetNumcde}`);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="commande-detail-page">
        <div className="detail-loading">
          <div className="loading-spinner"></div>
          <p>Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="commande-detail-page">
        <div className="detail-error">
          <HiExclamation />
          <h2>Erreur</h2>
          <p>{error?.data?.message || "Impossible de charger la commande"}</p>
          <div className="error-actions">
            <button onClick={refetch} className="btn-retry">
              <HiRefresh /> Réessayer
            </button>
            <Link to={`/admin/commandes/${nomDossierDBF}`} className="btn-back">
              <HiArrowLeft /> Retour aux commandes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!commande) return null;

  const etatInfo = getEtatInfo(commande.ETAT);
  const EtatIcon = etatInfo.icon;
  const isVerrouille = safeTrim(commande.VERROU).toUpperCase() === "O";
  const hasFacture = safeTrim(commande.NUMFACT).length > 0;
  const isGroupage = safeTrim(commande.GROUPAGE).toUpperCase() === "O";

  return (
    <div className="commande-detail-page">
      {/* Top Bar */}
      <div className="detail-topbar">
        <Link to={`/admin/commandes/${nomDossierDBF}`} className="btn-back-list">
          <HiArrowLeft />
          <span>Commandes</span>
        </Link>

        <div className="topbar-nav">
          <button
            className="btn-nav"
            disabled={!adjacentData?.previous}
            onClick={() => handleNavigate(adjacentData?.previous?.NUMCDE)}
            title="Commande précédente"
          >
            <HiChevronLeft />
          </button>
          <span className="nav-current">
            <HiClipboardList />
            N° {safeTrim(commande.NUMCDE)}
          </span>
          <button
            className="btn-nav"
            disabled={!adjacentData?.next}
            onClick={() => handleNavigate(adjacentData?.next?.NUMCDE)}
            title="Commande suivante"
          >
            <HiChevronRight />
          </button>
        </div>

        <div className="topbar-meta">
          {commandeData?._queryTime && (
            <span className="query-time">{commandeData._queryTime}</span>
          )}
          <button className="btn-refresh" onClick={refetch} title="Rafraîchir">
            <HiRefresh />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="detail-content">
        {/* Header Card */}
        <div className="detail-header-card">
          <div className="header-card-top">
            <div className="header-card-title">
              <div className="numcde-display">
                <span className="numcde-label">Commande</span>
                <span className="numcde-value">{safeTrim(commande.NUMCDE)}</span>
              </div>
              <span className={`etat-badge etat-${etatInfo.color} large`}>
                <EtatIcon />
                {etatInfo.label}
              </span>
            </div>

            <div className="header-badges">
              {isVerrouille ? (
                <span className="detail-badge verrou">
                  <HiLockClosed /> Verrouillée
                </span>
              ) : (
                <span className="detail-badge unlocked">
                  <HiLockOpen /> Non verrouillée
                </span>
              )}
              {isGroupage && (
                <span className="detail-badge groupage">
                  <HiDocumentDuplicate /> Groupage
                </span>
              )}
              {hasFacture && (
                <span className="detail-badge facture">
                  <HiCurrencyDollar /> Facturée
                </span>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="header-info-grid">
            <div className="info-card">
              <div className="info-card-icon"><HiShoppingCart /></div>
              <div className="info-card-content">
                <label>Fournisseur</label>
                <span>{commande.FOURN || "-"}</span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><HiCalendar /></div>
              <div className="info-card-content">
                <label>Date commande</label>
                <span>{formatDate(commande.DATCDE)}</span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><HiTruck /></div>
              <div className="info-card-content">
                <label>Bateau</label>
                <span>{safeTrim(commande.BATEAU) || "-"}</span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><HiCalendar /></div>
              <div className="info-card-content">
                <label>Arrivée prévue</label>
                <span>{formatDate(commande.ARRIVEE)}</span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><HiGlobe /></div>
              <div className="info-card-content">
                <label>Devise</label>
                <span>
                  {commande.DVISE || "-"}{" "}
                  {safeTrim(commande.CDVISE) && `(${safeTrim(commande.CDVISE)})`}
                </span>
              </div>
            </div>
            <div className="info-card">
              <div className="info-card-icon"><HiClipboardList /></div>
              <div className="info-card-content">
                <label>Nb lignes</label>
                <span>{commande.COMPTLIG || details?.totalLignes || 0}</span>
              </div>
            </div>
          </div>

          {/* Observations */}
          {safeTrim(commande.OBSERV) && (
            <div className="header-observ">
              <span className="observ-label">📝 Observations</span>
              <p>{safeTrim(commande.OBSERV)}</p>
            </div>
          )}
        </div>

        {/* Montants Summary Cards (cmdref) */}
        <div className="montants-cards">
          <div className="montant-card main">
            <span className="montant-label">Total Produits</span>
            <span className="montant-value">{formatPrice(commande.TOTPR)}</span>
          </div>
          <div className="montant-card">
            <span className="montant-label">Taxes</span>
            <span className="montant-value">{formatPrice(commande.TAXES)}</span>
          </div>
          <div className="montant-card">
            <span className="montant-label">Fret</span>
            <span className="montant-value">{formatPrice(commande.FRET)}</span>
          </div>
          <div className="montant-card">
            <span className="montant-label">Fret Transit</span>
            <span className="montant-value">{formatPrice(commande.FRTRANSIT)}</span>
          </div>
          {details?.totalLignes > 0 && (
            <div className="montant-card calculated">
              <span className="montant-label">Total Montant (détails)</span>
              <span className="montant-value">{formatPrice(totaux.totalMontant)}</span>
            </div>
          )}
        </div>

        {/* ========== CMDPLUS — Logistique ========== */}
        {cmdplus && hasCmdplusData && (
          <div className="cmdplus-card">
            <h3>🚢 Logistique &amp; Transit</h3>
            <div className="cmdplus-grid">
              <div className="cmdplus-item">
                <label>Date confirmée</label>
                <span>{formatDate(cmdplus.DATCONFIRM)}</span>
              </div>
              <div className="cmdplus-item">
                <label>Date transit</label>
                <span>{formatDate(cmdplus.DATTRANSIT)}</span>
              </div>
              <div className="cmdplus-item">
                <label>Date bateau</label>
                <span>{formatDate(cmdplus.DATBATEAU)}</span>
              </div>
              <div className="cmdplus-item">
                <label>N° Conteneur</label>
                <span className="mono">{safeTrim(cmdplus.NUMCONTEN) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Type conteneur</label>
                <span>{safeTrim(cmdplus.TYPCONTEN) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Transitaire</label>
                <span>{safeTrim(cmdplus.TRANSITAIR) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Cde client</label>
                <span>{safeTrim(cmdplus.CMDECLIENT) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Colis</label>
                <span>{safeTrim(cmdplus.COLIS) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Poids</label>
                <span>{safeTrim(cmdplus.POIDS) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Volume</label>
                <span>{safeTrim(cmdplus.VOLUME) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Booking transit</label>
                <span className="mono">{safeTrim(cmdplus.BOOKTRANS) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Facture transit</label>
                <span className="mono">{safeTrim(cmdplus.FACTTRANS) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Date fact. transit</label>
                <span>{formatDate(cmdplus.DATFACTRAN)}</span>
              </div>
              <div className="cmdplus-item">
                <label>Devise (taux)</label>
                <span>{cmdplus.DEVISE || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>IM4</label>
                <span className="mono">{safeTrim(cmdplus.IM4) || "-"}</span>
              </div>
              <div className="cmdplus-item">
                <label>Montant fournisseur</label>
                <span className="highlight">{formatPrice(cmdplus.MONTFOURN)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========== CMDPLUS — Frais & Taxes ========== */}
        {cmdplus && hasCmdplusFrais && (
          <div className="cmdplus-frais-card">
            <h3>💰 Frais, Douane &amp; Taxes</h3>
            <div className="frais-grid">
              <div className="frais-item main-frais">
                <label>Montant CAF</label>
                <span>{formatPrice(cmdplus.MONTCAF)}</span>
              </div>
              <div className="frais-item main-frais">
                <label>Fret (cmdplus)</label>
                <span>{formatPrice(cmdplus.FRET)}</span>
              </div>

              <div className="frais-separator"><span>Frais divers</span></div>
              <div className="frais-item">
                <label>HAD</label>
                <span>{formatPrice(cmdplus.HAD)}</span>
              </div>
              <div className="frais-item">
                <label>Débarquement</label>
                <span>{formatPrice(cmdplus.DEBARQMT)}</span>
              </div>
              <div className="frais-item">
                <label>Frais dossier</label>
                <span>{formatPrice(cmdplus.FRAISDOSS)}</span>
              </div>
              <div className="frais-item">
                <label>Frais info</label>
                <span>{formatPrice(cmdplus.FRAISINFO)}</span>
              </div>
              <div className="frais-item">
                <label>Frais AP</label>
                <span>{formatPrice(cmdplus.FRAISAP)}</span>
              </div>
              <div className="frais-item">
                <label>Frais trésorerie</label>
                <span>{formatPrice(cmdplus.FRAISTRESO)}</span>
              </div>
              <div className="frais-item">
                <label>Frais bancaires</label>
                <span>{formatPrice(cmdplus.FRAISBANK)}</span>
              </div>
              <div className="frais-item">
                <label>Assurance</label>
                <span>{formatPrice(cmdplus.ASSURANCE)}</span>
              </div>
              <div className="frais-item">
                <label>Commission</label>
                <span>{formatPrice(cmdplus.COMMISSION)}</span>
              </div>
              <div className="frais-item">
                <label>Patente</label>
                <span>{formatPrice(cmdplus.PATENTE)}</span>
              </div>

              <div className="frais-separator"><span>Douane &amp; TGC</span></div>
              <div className="frais-item">
                <label>Droits de douane</label>
                <span>{formatPrice(cmdplus.DROIDOUANE)}</span>
              </div>
              <div className="frais-item">
                <label>TGC 3% douane</label>
                <span>{formatPrice(cmdplus.TGC3DOUANE)}</span>
              </div>
              <div className="frais-item">
                <label>TGC 6% douane</label>
                <span>{formatPrice(cmdplus.TGC6DOUANE)}</span>
              </div>
              <div className="frais-item">
                <label>TGC 11% douane</label>
                <span>{formatPrice(cmdplus.TGC11DOUAN)}</span>
              </div>
              <div className="frais-item">
                <label>TGC 22% douane</label>
                <span>{formatPrice(cmdplus.TGC22DOUAN)}</span>
              </div>
              <div className="frais-item">
                <label>TGC 6% frais</label>
                <span>{formatPrice(cmdplus.TGC6FRAIS)}</span>
              </div>

              <div className="frais-separator"><span>Local</span></div>
              <div className="frais-item">
                <label>Divers local</label>
                <span>{formatPrice(cmdplus.DIVERLOCAL)}</span>
              </div>
              <div className="frais-item">
                <label>Fret local</label>
                <span>{formatPrice(cmdplus.FRETLOCAL)}</span>
              </div>
              <div className="frais-item">
                <label>TGC 6% local</label>
                <span>{formatPrice(cmdplus.TGC6LOCAL)}</span>
              </div>
              <div className="frais-item">
                <label>Répartition</label>
                <span>{formatPrice(cmdplus.REPARTIT)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Facture Section */}
        {hasFacture && (
          <div className="facture-card">
            <h3>🧾 Facturation</h3>
            <div className="facture-grid">
              <div className="facture-item">
                <label>N° Facture</label>
                <span className="facture-value">{safeTrim(commande.NUMFACT)}</span>
              </div>
              <div className="facture-item">
                <label>Date Facture</label>
                <span>{formatDate(commande.DATFACT)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes Section */}
        {(safeTrim(commande.NOT1) || safeTrim(commande.NOT2) || safeTrim(commande.NOT3)) && (
          <div className="notes-card">
            <h3>📄 Notes</h3>
            <div className="notes-list">
              {[...Array(10)].map((_, i) => {
                const noteKey = `NOT${i + 1}`;
                const noteVal = safeTrim(commande[noteKey]);
                return noteVal ? (
                  <p key={noteKey} className="note-line">{noteVal}</p>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Detail Lines Section */}
        <div className="detail-lines-section">
          <div className="lines-header">
            <h2>
              <HiDocumentText />
              Lignes de commande
              <span className="lines-count">{lignes.length} lignes</span>
            </h2>
            <div className="lines-controls">
              <div className="lines-search">
                <HiSearch />
                <input
                  type="text"
                  placeholder="Rechercher article, désignation..."
                  value={searchLignes}
                  onChange={(e) => setSearchLignes(e.target.value)}
                />
                {searchLignes && (
                  <button className="btn-clear-search" onClick={() => setSearchLignes("")}>
                    <HiX />
                  </button>
                )}
              </div>
              <select
                className="lines-filter-pointe"
                value={filterPointe}
                onChange={(e) => setFilterPointe(e.target.value)}
              >
                <option value="TOUT">Toutes les lignes</option>
                <option value="OUI">Pointées</option>
                <option value="NON">Non pointées</option>
              </select>
            </div>
          </div>

          {/* Résumé lignes */}
          <div className="lines-summary">
            <div className="summary-item">
              <label>Total Qté</label>
              <span>{formatNumber(totaux.totalQte)}</span>
            </div>
            <div className="summary-item">
              <label>Total Rentrée</label>
              <span>{formatNumber(totaux.totalRentre)}</span>
            </div>
            <div className="summary-item">
              <label>Total Montant</label>
              <span className="highlight">{formatPrice(totaux.totalMontant)}</span>
            </div>
            <div className="summary-item">
              <label>Total Fret</label>
              <span>{formatPrice(totaux.totalFret)}</span>
            </div>
            <div className="summary-item">
              <label>Total Taxes</label>
              <span>{formatPrice(totaux.totalTaxes)}</span>
            </div>
          </div>

          {/* Lines Table */}
          <div className="lines-table-container">
            {filteredLignes.length === 0 ? (
              <div className="table-empty">
                <HiDocumentText />
                <h3>Aucune ligne trouvée</h3>
                <p>
                  {searchLignes || filterPointe !== "TOUT"
                    ? "Modifiez vos filtres"
                    : "Cette commande ne contient aucune ligne"}
                </p>
              </div>
            ) : (
              <table className="lines-table">
                <thead>
                  <tr>
                    <th className="col-nl">#</th>
                    <th className="col-pointe">Pté</th>
                    <th className="col-nart">Code Art.</th>
                    <th className="col-design">Désignation</th>
                    <th className="col-refer">Réf. Fourn.</th>
                    <th className="col-qte text-right">Qté</th>
                    <th className="col-rentre text-right">Rentrée</th>
                    <th className="col-pachat text-right">P. Achat</th>
                    <th className="col-montant text-right">Montant</th>
                    <th className="col-fret text-right">Fret</th>
                    <th className="col-taxes text-right">Taxes</th>
                    <th className="col-pcaf text-right">P. CAF</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLignes.map((ligne, index) => {
                    const isPointe = ligne.POINTE && ligne.POINTE.trim().toUpperCase() === "O";
                    const qte = parseFloat(ligne.QTE) || 0;
                    const rentre = parseFloat(ligne.RENTRE) || 0;
                    const receptionComplete = qte > 0 && rentre >= qte;
                    const receptionPartielle = qte > 0 && rentre > 0 && rentre < qte;

                    return (
                      <tr
                        key={`${ligne.IDLIGN || index}`}
                        className={`
                          ${isPointe ? "row-pointe" : ""}
                          ${receptionComplete ? "row-complete" : ""}
                          ${receptionPartielle ? "row-partielle" : ""}
                        `}
                      >
                        <td className="col-nl">
                          <span className="nl-value">{ligne.NL || index + 1}</span>
                        </td>
                        <td className="col-pointe">
                          {isPointe ? (
                            <span className="pointe-yes" title="Pointée"><HiCheck /></span>
                          ) : (
                            <span className="pointe-no" title="Non pointée"><HiX /></span>
                          )}
                        </td>
                        <td className="col-nart">
                          <Link
                            to={`/admin/articles/${nomDossierDBF}/${safeTrim(ligne.NART)}`}
                            className="nart-link"
                            title="Voir l'article"
                          >
                            {safeTrim(ligne.NART)}
                            <HiExternalLink className="link-icon" />
                          </Link>
                        </td>
                        <td className="col-design">
                          <span className="design-text">{safeTrim(ligne.DESIGN) || "-"}</span>
                        </td>
                        <td className="col-refer">
                          <span className="refer-text">{safeTrim(ligne.REFER) || "-"}</span>
                        </td>
                        <td className="col-qte text-right">
                          <span className="qte-value">{formatNumber(ligne.QTE)}</span>
                        </td>
                        <td className="col-rentre text-right">
                          <span className={`rentre-value ${receptionComplete ? "complete" : receptionPartielle ? "partielle" : ""}`}>
                            {formatNumber(ligne.RENTRE)}
                          </span>
                        </td>
                        <td className="col-pachat text-right">{formatNumber(ligne.PACHAT, 3)}</td>
                        <td className="col-montant text-right">
                          <span className="montant-cell">{formatPrice(ligne.MONTANT)}</span>
                        </td>
                        <td className="col-fret text-right">{formatNumber(ligne.FRET, 3)}</td>
                        <td className="col-taxes text-right">{formatNumber(ligne.TAXES, 3)}</td>
                        <td className="col-pcaf text-right">{formatNumber(ligne.PCAF, 3)}</td>
                        <td className="col-actions">
                          <Link
                            to={`/admin/articles/${nomDossierDBF}/${safeTrim(ligne.NART)}`}
                            className="btn-view-article"
                            title="Voir l'article"
                          >
                            <HiEye />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandeDetailScreen;