// backend/services/commandeService.js
import { DBFFile } from "dbffile";
import path from "path";
import fs from "fs";

/**
 * Service de cache pour les commandes DBF (cmdref.dbf + cmdetail.dbf + cmdplus.dbf)
 * Gère trois fichiers DBF liés par NUMCDE
 * Optimisé avec index pour recherches O(1)
 */
class CommandeCacheService {
  constructor() {
    // Encodage des fichiers DBF (CP850 pour les fichiers français/calédoniens)
    this.dbfEncoding = "CP850";
    // Cache entêtes : Map<nomDossierDBF, CacheEntry>
    this.cacheRef = new Map();
    // Cache détails : Map<nomDossierDBF, CacheEntry>
    this.cacheDetail = new Map();
    // Cache cmdplus : Map<nomDossierDBF, CacheEntry>
    this.cachePlus = new Map();
    // Durée de validité du cache (5 minutes par défaut)
    this.cacheTTL = 5 * 60 * 1000;
    // Locks pour éviter les chargements multiples simultanés
    this.loadingLocksRef = new Map();
    this.loadingLocksDetail = new Map();
    this.loadingLocksPlus = new Map();
  }

  // =============================================
  // UTILITAIRES
  // =============================================

  safeTrim(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    return String(value).trim();
  }

  tokenize(str) {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0);
  }

  parseDbfDate(dateValue) {
    if (!dateValue) return null;
    if (dateValue instanceof Date) return dateValue;
    if (typeof dateValue === "string" && dateValue.length === 8) {
      const year = parseInt(dateValue.substring(0, 4));
      const month = parseInt(dateValue.substring(4, 6)) - 1;
      const day = parseInt(dateValue.substring(6, 8));
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof dateValue === "string") {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  isCacheValid(cacheEntry, dbfPath) {
    if (!cacheEntry) return false;
    if (Date.now() - cacheEntry.loadedAt > this.cacheTTL) return false;
    try {
      const stats = fs.statSync(dbfPath);
      if (stats.mtime.getTime() !== cacheEntry.lastModified.getTime()) return false;
    } catch {
      return false;
    }
    return true;
  }

  // =============================================
  // CONSTRUCTION DES INDEX - CMDREF (ENTÊTES)
  // =============================================

  createRefCacheEntry(records, dbfInfo) {
    const indexByNumcde = new Map();
    const indexByFourn = new Map();
    const indexByEtat = new Map();
    const indexByBateau = new Map();

    records.forEach((record, idx) => {
      if (record.NUMCDE) {
        const numcde = record.NUMCDE.trim().toUpperCase();
        indexByNumcde.set(numcde, idx);
      }
      if (record.FOURN !== undefined && record.FOURN !== null) {
        const fourn = record.FOURN;
        if (!indexByFourn.has(fourn)) indexByFourn.set(fourn, []);
        indexByFourn.get(fourn).push(idx);
      }
      if (record.ETAT !== undefined && record.ETAT !== null) {
        const etat = record.ETAT;
        if (!indexByEtat.has(etat)) indexByEtat.set(etat, []);
        indexByEtat.get(etat).push(idx);
      }
      if (record.BATEAU) {
        const bateau = record.BATEAU.trim();
        if (bateau) {
          if (!indexByBateau.has(bateau)) indexByBateau.set(bateau, []);
          indexByBateau.get(bateau).push(idx);
        }
      }
    });

    const searchIndex = this.buildRefSearchIndex(records);

    return {
      records,
      dbfInfo,
      indexByNumcde,
      indexByFourn,
      indexByEtat,
      indexByBateau,
      searchIndex,
      loadedAt: Date.now(),
      lastModified: dbfInfo.lastModified,
    };
  }

  buildRefSearchIndex(records) {
    const index = new Map();
    records.forEach((record, idx) => {
      const fieldsToIndex = [record.NUMCDE, record.OBSERV, record.BATEAU, record.NUMFACT];
      fieldsToIndex.forEach((field) => {
        if (field) {
          const tokens = this.tokenize(field.toString());
          tokens.forEach((token) => {
            if (token.length >= 2) {
              if (!index.has(token)) index.set(token, new Set());
              index.get(token).add(idx);
            }
          });
        }
      });
    });
    return index;
  }

  // =============================================
  // CONSTRUCTION DES INDEX - CMDETAIL (DÉTAILS)
  // =============================================

  createDetailCacheEntry(records, dbfInfo) {
    const indexByNumcde = new Map();
    const indexByNart = new Map();
    const totalsByNumcde = new Map();

    records.forEach((record, idx) => {
      const numcde = record.NUMCDE ? record.NUMCDE.trim().toUpperCase() : null;

      if (numcde) {
        if (!indexByNumcde.has(numcde)) indexByNumcde.set(numcde, []);
        indexByNumcde.get(numcde).push(idx);

        const qte = parseFloat(record.QTE) || 0;
        const pachat = parseFloat(record.PACHAT) || 0;
        const montant = parseFloat(record.MONTANT) || 0;

        if (!totalsByNumcde.has(numcde)) {
          totalsByNumcde.set(numcde, { totalMontant: 0, totalQtePachat: 0, nbLignes: 0 });
        }
        const totaux = totalsByNumcde.get(numcde);
        totaux.totalMontant += montant;
        totaux.totalQtePachat += qte * pachat;
        totaux.nbLignes += 1;
      }

      if (record.NART) {
        const nart = record.NART.trim().toUpperCase();
        if (!indexByNart.has(nart)) indexByNart.set(nart, []);
        indexByNart.get(nart).push(idx);
      }
    });

    for (const [, totaux] of totalsByNumcde) {
      totaux.totalMontant = Math.round(totaux.totalMontant * 100) / 100;
      totaux.totalQtePachat = Math.round(totaux.totalQtePachat * 100) / 100;
    }

    return {
      records,
      dbfInfo,
      indexByNumcde,
      indexByNart,
      totalsByNumcde,
      loadedAt: Date.now(),
      lastModified: dbfInfo.lastModified,
    };
  }

  // =============================================
  // CONSTRUCTION DES INDEX - CMDPLUS
  // =============================================

  /**
   * Crée une entrée de cache pour cmdplus.dbf
   * Index par NUMCDE pour accès O(1)
   */
  createPlusCacheEntry(records, dbfInfo) {
    // Index par NUMCDE -> index du record (1:1 comme cmdref)
    const indexByNumcde = new Map();

    records.forEach((record, idx) => {
      if (record.NUMCDE) {
        const numcde = record.NUMCDE.trim().toUpperCase();
        indexByNumcde.set(numcde, idx);
      }
    });

    return {
      records,
      dbfInfo,
      indexByNumcde,
      loadedAt: Date.now(),
      lastModified: dbfInfo.lastModified,
    };
  }

  // =============================================
  // CHARGEMENT DES FICHIERS DBF
  // =============================================

  async getCmdRef(entreprise) {
    const cacheKey = entreprise.nomDossierDBF;
    const dbfPath = path.join(entreprise.cheminBase, entreprise.nomDossierDBF, "cmdref.dbf");

    const cached = this.cacheRef.get(cacheKey);
    if (this.isCacheValid(cached, dbfPath)) return cached;

    if (this.loadingLocksRef.has(cacheKey)) {
      await this.loadingLocksRef.get(cacheKey);
      return this.cacheRef.get(cacheKey);
    }

    let resolveLock;
    const lockPromise = new Promise((resolve) => { resolveLock = resolve; });
    this.loadingLocksRef.set(cacheKey, lockPromise);

    try {
      console.log(`[CommandeCache] Chargement cmdref.dbf pour ${cacheKey}...`);
      const startTime = Date.now();

      if (!fs.existsSync(dbfPath)) throw new Error(`Fichier DBF non trouvé: ${dbfPath}`);

      const dbf = await DBFFile.open(dbfPath, { encoding: this.dbfEncoding });
      const records = await dbf.readRecords();
      const stats = fs.statSync(dbfPath);

      const dbfInfo = {
        path: dbfPath,
        recordCount: dbf.recordCount,
        fileSize: stats.size,
        lastModified: stats.mtime,
        fields: dbf.fields,
      };

      const cacheEntry = this.createRefCacheEntry(records, dbfInfo);
      this.cacheRef.set(cacheKey, cacheEntry);

      console.log(`[CommandeCache] cmdref chargé pour ${cacheKey}: ${records.length} commandes en ${Date.now() - startTime}ms`);
      return cacheEntry;
    } finally {
      this.loadingLocksRef.delete(cacheKey);
      resolveLock();
    }
  }

  async getCmdDetail(entreprise) {
    const cacheKey = entreprise.nomDossierDBF;
    const dbfPath = path.join(entreprise.cheminBase, entreprise.nomDossierDBF, "cmdetail.dbf");

    const cached = this.cacheDetail.get(cacheKey);
    if (this.isCacheValid(cached, dbfPath)) return cached;

    if (this.loadingLocksDetail.has(cacheKey)) {
      await this.loadingLocksDetail.get(cacheKey);
      return this.cacheDetail.get(cacheKey);
    }

    let resolveLock;
    const lockPromise = new Promise((resolve) => { resolveLock = resolve; });
    this.loadingLocksDetail.set(cacheKey, lockPromise);

    try {
      console.log(`[CommandeCache] Chargement cmdetail.dbf pour ${cacheKey}...`);
      const startTime = Date.now();

      if (!fs.existsSync(dbfPath)) throw new Error(`Fichier DBF non trouvé: ${dbfPath}`);

      const dbf = await DBFFile.open(dbfPath, { encoding: this.dbfEncoding });
      const records = await dbf.readRecords();
      const stats = fs.statSync(dbfPath);

      const dbfInfo = {
        path: dbfPath,
        recordCount: dbf.recordCount,
        fileSize: stats.size,
        lastModified: stats.mtime,
        fields: dbf.fields,
      };

      const cacheEntry = this.createDetailCacheEntry(records, dbfInfo);
      this.cacheDetail.set(cacheKey, cacheEntry);

      console.log(`[CommandeCache] cmdetail chargé pour ${cacheKey}: ${records.length} lignes en ${Date.now() - startTime}ms`);
      return cacheEntry;
    } finally {
      this.loadingLocksDetail.delete(cacheKey);
      resolveLock();
    }
  }

  /**
   * Charge ou récupère du cache cmdplus.dbf
   */
  async getCmdPlus(entreprise) {
    const cacheKey = entreprise.nomDossierDBF;
    const dbfPath = path.join(entreprise.cheminBase, entreprise.nomDossierDBF, "cmdplus.dbf");

    const cached = this.cachePlus.get(cacheKey);
    if (this.isCacheValid(cached, dbfPath)) return cached;

    if (this.loadingLocksPlus.has(cacheKey)) {
      await this.loadingLocksPlus.get(cacheKey);
      return this.cachePlus.get(cacheKey);
    }

    let resolveLock;
    const lockPromise = new Promise((resolve) => { resolveLock = resolve; });
    this.loadingLocksPlus.set(cacheKey, lockPromise);

    try {
      console.log(`[CommandeCache] Chargement cmdplus.dbf pour ${cacheKey}...`);
      const startTime = Date.now();

      if (!fs.existsSync(dbfPath)) throw new Error(`Fichier DBF non trouvé: ${dbfPath}`);

      const dbf = await DBFFile.open(dbfPath, { encoding: this.dbfEncoding });
      const records = await dbf.readRecords();
      const stats = fs.statSync(dbfPath);

      const dbfInfo = {
        path: dbfPath,
        recordCount: dbf.recordCount,
        fileSize: stats.size,
        lastModified: stats.mtime,
        fields: dbf.fields,
      };

      const cacheEntry = this.createPlusCacheEntry(records, dbfInfo);
      this.cachePlus.set(cacheKey, cacheEntry);

      console.log(`[CommandeCache] cmdplus chargé pour ${cacheKey}: ${records.length} enregistrements en ${Date.now() - startTime}ms`);
      return cacheEntry;
    } finally {
      this.loadingLocksPlus.delete(cacheKey);
      resolveLock();
    }
  }

  // =============================================
  // MÉTHODES DE RECHERCHE - ENTÊTES (CMDREF)
  // =============================================

  async findByNumcde(entreprise, numcde) {
    const cache = await this.getCmdRef(entreprise);
    const numcdeNormalized = numcde.trim().toUpperCase();
    const idx = cache.indexByNumcde.get(numcdeNormalized);
    return idx !== undefined ? cache.records[idx] : null;
  }

  async findByFournisseur(entreprise, fourn, options = {}) {
    const { page = 1, limit = 50 } = options;
    const cache = await this.getCmdRef(entreprise);

    const indices = cache.indexByFourn.get(fourn) || [];
    const commandes = indices.map((i) => cache.records[i]);

    commandes.sort((a, b) => {
      const dateA = this.parseDbfDate(a.DATCDE);
      const dateB = this.parseDbfDate(b.DATCDE);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });

    const totalRecords = commandes.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const paginatedCommandes = commandes.slice(startIndex, startIndex + limit);

    return { totalRecords, totalPages, page, limit, hasNextPage: startIndex + limit < totalRecords, hasPrevPage: page > 1, commandes: paginatedCommandes };
  }

  async search(entreprise, searchTerm, options = {}) {
    const { limit = 50 } = options;
    const cache = await this.getCmdRef(entreprise);

    let candidateIndices = null;

    if (searchTerm) {
      const tokens = this.tokenize(searchTerm);
      if (tokens.length > 0) {
        tokens.forEach((token) => {
          const matchingIndices = new Set();
          for (const [indexedToken, indices] of cache.searchIndex) {
            if (indexedToken.startsWith(token) || token.startsWith(indexedToken)) {
              indices.forEach((i) => matchingIndices.add(i));
            }
          }
          if (candidateIndices === null) {
            candidateIndices = matchingIndices;
          } else {
            candidateIndices = new Set([...candidateIndices].filter((i) => matchingIndices.has(i)));
          }
        });
      }
    }

    if (candidateIndices === null) {
      candidateIndices = new Set(cache.records.map((_, i) => i));
    }

    const results = [...candidateIndices];
    const limitedResults = results.slice(0, limit);

    return { totalFound: results.length, commandes: limitedResults.map((i) => cache.records[i]) };
  }

  /**
   * Recherche paginée avec tous les filtres avancés sur les entêtes
   * Enrichit chaque commande avec TOTAL_DETAIL et données cmdplus
   */
  async getPaginated(entreprise, options = {}) {
    const {
      page = 1,
      limit = 50,
      search, numcde, fourn, bateau, cdvise,
      verrou, hasFacture, groupage,
      etat,
      dateDebut, dateFin,
      withDetailTotals = true,
      withPlusData = true,
    } = options;

    const cache = await this.getCmdRef(entreprise);

    // Charger les caches secondaires en parallèle
    let detailCache = null;
    let plusCache = null;

    const parallelLoads = [];

    if (withDetailTotals) {
      parallelLoads.push(
        this.getCmdDetail(entreprise)
          .then((c) => { detailCache = c; })
          .catch((err) => console.warn(`[CommandeCache] cmdetail non disponible: ${err.message}`))
      );
    }

    if (withPlusData) {
      parallelLoads.push(
        this.getCmdPlus(entreprise)
          .then((c) => { plusCache = c; })
          .catch((err) => console.warn(`[CommandeCache] cmdplus non disponible: ${err.message}`))
      );
    }

    await Promise.all(parallelLoads);

    let filteredRecords = [...cache.records];

    // ============ FILTRES TEXTUELS ============
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecords = filteredRecords.filter((record) => {
        const numcdeVal = this.safeTrim(record.NUMCDE).toLowerCase();
        const observ = this.safeTrim(record.OBSERV).toLowerCase();
        const bateauVal = this.safeTrim(record.BATEAU).toLowerCase();
        const numfact = this.safeTrim(record.NUMFACT).toLowerCase();
        return numcdeVal.includes(searchLower) || observ.includes(searchLower) || bateauVal.includes(searchLower) || numfact.includes(searchLower);
      });
    }

    if (numcde) {
      const numcdeLower = numcde.toLowerCase();
      filteredRecords = filteredRecords.filter((record) => this.safeTrim(record.NUMCDE).toLowerCase().includes(numcdeLower));
    }

    if (fourn) {
      const fournVal = parseInt(fourn);
      if (!isNaN(fournVal)) {
        filteredRecords = filteredRecords.filter((record) => record.FOURN === fournVal);
      }
    }

    if (bateau) {
      const bateauLower = bateau.toLowerCase();
      filteredRecords = filteredRecords.filter((record) => this.safeTrim(record.BATEAU).toLowerCase().includes(bateauLower));
    }

    if (cdvise) {
      const cdviseLower = cdvise.toLowerCase();
      filteredRecords = filteredRecords.filter((record) => this.safeTrim(record.CDVISE).toLowerCase() === cdviseLower);
    }

    // ============ FILTRES BOOLÉENS ============
    if (verrou) {
      filteredRecords = filteredRecords.filter((record) => this.safeTrim(record.VERROU).toUpperCase() === "O");
    }
    if (hasFacture) {
      filteredRecords = filteredRecords.filter((record) => this.safeTrim(record.NUMFACT).length > 0);
    }
    if (groupage) {
      filteredRecords = filteredRecords.filter((record) => this.safeTrim(record.GROUPAGE).toUpperCase() === "O");
    }

    // ============ FILTRES NUMÉRIQUES ============
    if (etat !== undefined && etat !== null && !isNaN(etat)) {
      filteredRecords = filteredRecords.filter((record) => record.ETAT === etat);
    }

    // ============ FILTRES DE DATES ============
    if (dateDebut) {
      const dateDebutObj = new Date(dateDebut);
      dateDebutObj.setHours(0, 0, 0, 0);
      if (!isNaN(dateDebutObj.getTime())) {
        filteredRecords = filteredRecords.filter((record) => {
          const datcde = this.parseDbfDate(record.DATCDE);
          return datcde ? datcde >= dateDebutObj : false;
        });
      }
    }

    if (dateFin) {
      const dateFinObj = new Date(dateFin);
      dateFinObj.setHours(23, 59, 59, 999);
      if (!isNaN(dateFinObj.getTime())) {
        filteredRecords = filteredRecords.filter((record) => {
          const datcde = this.parseDbfDate(record.DATCDE);
          return datcde ? datcde <= dateFinObj : false;
        });
      }
    }

    // ============ TRI ============
    filteredRecords.sort((a, b) => {
      const dateA = this.parseDbfDate(a.DATCDE);
      const dateB = this.parseDbfDate(b.DATCDE);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB.getTime() - dateA.getTime();
    });

    // ============ PAGINATION ============
    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + limit);

    // ============ ENRICHISSEMENT ============
    const enrichedCommandes = paginatedRecords.map((record) => {
      const numcdeKey = record.NUMCDE ? record.NUMCDE.trim().toUpperCase() : null;

      // Totaux depuis cmdetail
      let detailData = {};
      if (detailCache && detailCache.totalsByNumcde && numcdeKey) {
        const totaux = detailCache.totalsByNumcde.get(numcdeKey);
        if (totaux) {
          detailData = {
            TOTAL_DETAIL: totaux.totalMontant,
            TOTAL_QTE_PACHAT: totaux.totalQtePachat,
            NB_LIGNES_DETAIL: totaux.nbLignes,
          };
        }
      }

      // Données depuis cmdplus
      let plusData = {};
      if (plusCache && plusCache.indexByNumcde && numcdeKey) {
        const plusIdx = plusCache.indexByNumcde.get(numcdeKey);
        if (plusIdx !== undefined) {
          const plusRecord = plusCache.records[plusIdx];
          plusData = {
            DATCONFIRM: plusRecord.DATCONFIRM,
            DATTRANSIT: plusRecord.DATTRANSIT,
            DATBATEAU: plusRecord.DATBATEAU,
            NUMCONTEN: plusRecord.NUMCONTEN,
            TYPCONTEN: plusRecord.TYPCONTEN,
            TRANSITAIR: plusRecord.TRANSITAIR,
            MONTFOURN: plusRecord.MONTFOURN,
            CMDECLIENT: plusRecord.CMDECLIENT,
            COLIS: plusRecord.COLIS,
            POIDS: plusRecord.POIDS,
            VOLUME: plusRecord.VOLUME,
            BOOKTRANS: plusRecord.BOOKTRANS,
            FACTTRANS: plusRecord.FACTTRANS,
            DATFACTRAN: plusRecord.DATFACTRAN,
            DEVISE: plusRecord.DEVISE,
            IM4: plusRecord.IM4,
            MONTCAF: plusRecord.MONTCAF,
            FRET_PLUS: plusRecord.FRET,
            HAD: plusRecord.HAD,
            DEBARQMT: plusRecord.DEBARQMT,
            FRAISDOSS: plusRecord.FRAISDOSS,
            FRAISINFO: plusRecord.FRAISINFO,
            FRAISAP: plusRecord.FRAISAP,
            FRAISTRESO: plusRecord.FRAISTRESO,
            TGC6FRAIS: plusRecord.TGC6FRAIS,
            DROIDOUANE: plusRecord.DROIDOUANE,
            TGC3DOUANE: plusRecord.TGC3DOUANE,
            TGC6DOUANE: plusRecord.TGC6DOUANE,
            TGC11DOUAN: plusRecord.TGC11DOUAN,
            TGC22DOUAN: plusRecord.TGC22DOUAN,
            DIVERLOCAL: plusRecord.DIVERLOCAL,
            FRETLOCAL: plusRecord.FRETLOCAL,
            TGC6LOCAL: plusRecord.TGC6LOCAL,
            PATENTE: plusRecord.PATENTE,
            FRAISBANK: plusRecord.FRAISBANK,
            ASSURANCE: plusRecord.ASSURANCE,
            COMMISSION: plusRecord.COMMISSION,
            REPARTIT: plusRecord.REPARTIT,
          };
        }
      }

      return {
        ...record,
        TOTAL_DETAIL: 0,
        TOTAL_QTE_PACHAT: 0,
        NB_LIGNES_DETAIL: 0,
        ...detailData,
        ...plusData,
      };
    });

    return {
      totalRecords,
      totalPages,
      page,
      limit,
      hasNextPage: startIndex + limit < totalRecords,
      hasPrevPage: page > 1,
      commandes: enrichedCommandes,
    };
  }

  // =============================================
  // MÉTHODES DE RECHERCHE - DÉTAILS (CMDETAIL)
  // =============================================

  async getDetailsByNumcde(entreprise, numcde) {
    const cache = await this.getCmdDetail(entreprise);
    const numcdeNormalized = numcde.trim().toUpperCase();
    const indices = cache.indexByNumcde.get(numcdeNormalized) || [];

    const details = indices.map((i) => cache.records[i]);
    details.sort((a, b) => {
      const nlA = parseFloat(a.NL) || 0;
      const nlB = parseFloat(b.NL) || 0;
      return nlA - nlB;
    });

    return details;
  }

  async getTotalsByNumcde(entreprise, numcde) {
    const cache = await this.getCmdDetail(entreprise);
    const numcdeNormalized = numcde.trim().toUpperCase();
    return cache.totalsByNumcde.get(numcdeNormalized) || { totalMontant: 0, totalQtePachat: 0, nbLignes: 0 };
  }

  async findDetailsByNart(entreprise, nart, options = {}) {
    const { page = 1, limit = 50 } = options;
    const cache = await this.getCmdDetail(entreprise);
    const nartNormalized = nart.trim().toUpperCase();

    const indices = cache.indexByNart.get(nartNormalized) || [];
    const details = indices.map((i) => cache.records[i]);

    const totalRecords = details.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const paginatedDetails = details.slice(startIndex, startIndex + limit);

    return { totalRecords, totalPages, page, limit, hasNextPage: startIndex + limit < totalRecords, hasPrevPage: page > 1, details: paginatedDetails };
  }

  // =============================================
  // MÉTHODES DE RECHERCHE - CMDPLUS
  // =============================================

  /**
   * Obtenir les données cmdplus pour une commande par NUMCDE - O(1)
   */
  async getPlusByNumcde(entreprise, numcde) {
    const cache = await this.getCmdPlus(entreprise);
    const numcdeNormalized = numcde.trim().toUpperCase();
    const idx = cache.indexByNumcde.get(numcdeNormalized);
    return idx !== undefined ? cache.records[idx] : null;
  }

  // =============================================
  // MÉTHODES UTILITAIRES / LISTES
  // =============================================

  async getFournisseurs(entreprise) {
    const cache = await this.getCmdRef(entreprise);
    const fournisseurs = [];
    for (const [code, indices] of cache.indexByFourn) {
      fournisseurs.push({ code, count: indices.length });
    }
    return fournisseurs.sort((a, b) => a.code - b.code);
  }

  async getBateaux(entreprise) {
    const cache = await this.getCmdRef(entreprise);
    const bateaux = [];
    for (const [nom, indices] of cache.indexByBateau) {
      bateaux.push({ nom, count: indices.length });
    }
    return bateaux.sort((a, b) => a.nom.localeCompare(b.nom));
  }

  async getEtats(entreprise) {
    const cache = await this.getCmdRef(entreprise);
    const etats = [];
    for (const [code, indices] of cache.indexByEtat) {
      etats.push({ code, count: indices.length });
    }
    return etats.sort((a, b) => a.code - b.code);
  }

  async getStructure(entreprise, fichier = "cmdref") {
    let cache;
    if (fichier === "cmdetail") {
      cache = await this.getCmdDetail(entreprise);
    } else if (fichier === "cmdplus") {
      cache = await this.getCmdPlus(entreprise);
    } else {
      cache = await this.getCmdRef(entreprise);
    }

    return {
      ...cache.dbfInfo,
      fields: cache.dbfInfo.fields.map((f) => ({
        name: f.name,
        type: f.type,
        size: f.size,
        decimalPlaces: f.decimalPlaces,
      })),
    };
  }

  // =============================================
  // GESTION DU CACHE
  // =============================================

  invalidate(nomDossierDBF) {
    this.cacheRef.delete(nomDossierDBF);
    this.cacheDetail.delete(nomDossierDBF);
    this.cachePlus.delete(nomDossierDBF);
    console.log(`[CommandeCache] Cache invalidé pour ${nomDossierDBF} (cmdref + cmdetail + cmdplus)`);
  }

  invalidateAll() {
    this.cacheRef.clear();
    this.cacheDetail.clear();
    this.cachePlus.clear();
    console.log("[CommandeCache] Tout le cache a été invalidé");
  }

  async preload(entreprise) {
    try {
      await Promise.all([
        this.getCmdRef(entreprise),
        this.getCmdDetail(entreprise),
        this.getCmdPlus(entreprise).catch(() => {}),
      ]);
    } catch (error) {
      console.error(`[CommandeCache] Erreur préchargement ${entreprise.nomDossierDBF}:`, error.message);
    }
  }

  getStats() {
    const stats = {};

    for (const [key, entry] of this.cacheRef) {
      if (!stats[key]) stats[key] = {};
      stats[key].cmdref = {
        recordCount: entry.records.length,
        loadedAt: new Date(entry.loadedAt).toISOString(),
        indexedTokens: entry.searchIndex.size,
        fournisseurs: entry.indexByFourn.size,
        bateaux: entry.indexByBateau.size,
        etats: entry.indexByEtat.size,
      };
    }

    for (const [key, entry] of this.cacheDetail) {
      if (!stats[key]) stats[key] = {};
      stats[key].cmdetail = {
        recordCount: entry.records.length,
        loadedAt: new Date(entry.loadedAt).toISOString(),
        commandesIndexees: entry.indexByNumcde.size,
        articlesIndexes: entry.indexByNart.size,
        commandesAvecTotaux: entry.totalsByNumcde.size,
      };
    }

    for (const [key, entry] of this.cachePlus) {
      if (!stats[key]) stats[key] = {};
      stats[key].cmdplus = {
        recordCount: entry.records.length,
        loadedAt: new Date(entry.loadedAt).toISOString(),
        commandesIndexees: entry.indexByNumcde.size,
      };
    }

    return stats;
  }
}

const commandeCacheService = new CommandeCacheService();
export default commandeCacheService;