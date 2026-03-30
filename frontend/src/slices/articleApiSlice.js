
// // src/slices/articleApiSlice.js
// import { apiSlice } from "./apiSlice";
// import { ARTICLES_URL } from "../constants";

// // URL pour les photos
// const PHOTOS_URL = "/api/photos";

// export const articleApiSlice = apiSlice.injectEndpoints({
//   endpoints: (builder) => ({
//     // Liste des articles avec pagination et filtres avancés côté serveur
//     getArticles: builder.query({
//       query: ({
//         nomDossierDBF,
//         page,
//         limit,
//         // Filtres textuels
//         search,
//         nart,
//         groupe,
//         fourn,
//         gisement,
//         // Filtres énumérés (TOUT, OUI, NON ou POSITIF, NUL, NEGATIF)
//         stock,
//         gencod,
//         promo,
//         deprec,
//         web,
//         photo,
//         reappro,
//         // Filtre numérique
//         tgc,
//         // ====== NOUVEAU : filtre par statut ======
//         statut,
//       }) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}`,
//         params: {
//           page,
//           limit,
//           // Filtres textuels - ne pas envoyer si vide
//           ...(search && { search }),
//           ...(nart && { nart }),
//           ...(groupe && { groupe }),
//           ...(fourn && { fourn }),
//           ...(gisement && { gisement }),
//           // Convertir les filtres OUI/NON en booléens pour le backend
//           // Stock: POSITIF = enStock:true, autres valeurs non supportées actuellement
//           ...(stock === "POSITIF" && { enStock: "true" }),
//           // Gencod: OUI = hasGencod:true, NON = hasGencod:false (pas supporté)
//           ...(gencod === "OUI" && { hasGencod: "true" }),
//           // Promo: OUI = hasPromo:true
//           ...(promo === "OUI" && { hasPromo: "true" }),
//           // Deprec: OUI = hasDeprec:true
//           ...(deprec === "OUI" && { hasDeprec: "true" }),
//           // Web: OUI = isWeb:true
//           ...(web === "OUI" && { isWeb: "true" }),
//           // Photo: OUI = hasPhoto:true
//           ...(photo === "OUI" && { hasPhoto: "true" }),
//           // Reappro: OUI = reapproMag:true
//           ...(reappro === "OUI" && { reapproMag: "true" }),
//           // TGC - filtre numérique
//           ...(tgc && tgc !== "TOUT" && { tgc }),
//           // ====== NOUVEAU : statut (ACTIF, DEPRECIE, ARRETE) ======
//           ...(statut && statut !== "TOUS" && { statut }),
//         },
//       }),
//       providesTags: ["Article"],
//       keepUnusedDataFor: 60,
//     }),

//     // Article par code NART
//     getArticleByNart: builder.query({
//       query: ({ nomDossierDBF, nart }) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/code/${nart}`,
//       }),
//       providesTags: ["Article"],
//     }),

//     // Article par code barre GENCOD
//     getArticleByGencod: builder.query({
//       query: ({ nomDossierDBF, gencod }) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/gencod/${gencod}`,
//       }),
//       providesTags: ["Article"],
//     }),

//     // ==========================================
//     // Navigation entre articles (prev/next)
//     // ==========================================
//     getAdjacentArticles: builder.query({
//       query: ({ nomDossierDBF, nart }) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/adjacent/${nart}`,
//       }),
//       providesTags: ["Article"],
//       keepUnusedDataFor: 60,
//     }),

//     // Recherche d'articles
//     searchArticles: builder.query({
//       query: ({ nomDossierDBF, q, field, limit }) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/search`,
//         params: { q, field, limit },
//       }),
//       providesTags: ["Article"],
//     }),

//     // Liste des groupes/familles
//     getGroupes: builder.query({
//       query: (nomDossierDBF) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/groupes`,
//       }),
//       providesTags: ["Article"],
//       keepUnusedDataFor: 300, // Cache 5 min car change rarement
//     }),

//     // Liste des taux TGC distincts
//     getTgcRates: builder.query({
//       query: (nomDossierDBF) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/tgc-rates`,
//       }),
//       providesTags: ["Article"],
//       keepUnusedDataFor: 300, // Cache 5 min car change rarement
//     }),

//     // Structure du fichier DBF
//     getArticlesStructure: builder.query({
//       query: (nomDossierDBF) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/structure`,
//       }),
//       providesTags: ["Article"],
//       keepUnusedDataFor: 600, // Cache 10 min
//     }),

//     // ==========================================
//     // PHOTOS
//     // ==========================================

//     // Obtenir l'URL de la photo d'un article
//     getArticlePhoto: builder.query({
//       query: ({ trigramme, nart }) => ({
//         url: `${PHOTOS_URL}/${trigramme}/${nart}`,
//         responseHandler: async (response) => {
//           // Retourner l'URL de la photo si elle existe
//           if (response.ok) {
//             return { exists: true, url: `${PHOTOS_URL}/${trigramme}/${nart}` };
//           }
//           return { exists: false, url: null };
//         },
//       }),
//       providesTags: ["ArticlePhoto"],
//       keepUnusedDataFor: 3600, // Cache 1 heure
//     }),

//     // Vérifier si une photo existe (HEAD request)
//     checkPhotoExists: builder.query({
//       query: ({ trigramme, nart }) => ({
//         url: `${PHOTOS_URL}/${trigramme}/${nart}`,
//         method: "HEAD",
//       }),
//       transformResponse: (response, meta) => {
//         return { exists: meta?.response?.ok ?? false };
//       },
//       transformErrorResponse: () => {
//         return { exists: false };
//       },
//       providesTags: ["ArticlePhoto"],
//       keepUnusedDataFor: 3600,
//     }),

//     // Invalider le cache des articles (admin)
//     invalidateArticleCache: builder.mutation({
//       query: (nomDossierDBF) => ({
//         url: `${ARTICLES_URL}/${nomDossierDBF}/invalidate-cache`,
//         method: "POST",
//       }),
//       invalidatesTags: ["Article"],
//     }),

//     // Statistiques du cache (admin)
//     getCacheStats: builder.query({
//       query: () => ({
//         url: `${ARTICLES_URL}/cache-stats`,
//       }),
//       keepUnusedDataFor: 30,
//     }),
//   }),
// });

// export const {
//   useGetArticlesQuery,
//   useGetArticleByNartQuery,
//   useGetArticleByGencodQuery,
//   useGetAdjacentArticlesQuery,
//   useSearchArticlesQuery,
//   useGetGroupesQuery,
//   useGetTgcRatesQuery,
//   useGetArticlesStructureQuery,
//   useGetArticlePhotoQuery,
//   useCheckPhotoExistsQuery,
//   useInvalidateArticleCacheMutation,
//   useGetCacheStatsQuery,
// } = articleApiSlice;

// // Helper pour construire l'URL de la photo
// export const getPhotoUrl = (trigramme, nart) => {
//   if (!trigramme || !nart) return null;
//   return `${PHOTOS_URL}/${trigramme}/${nart.trim()}`;
// };

// src/slices/articleApiSlice.js
import { apiSlice } from "./apiSlice";
import { ARTICLES_URL } from "../constants";

// URL pour les photos
const PHOTOS_URL = "/api/photos";

// ─────────────────────────────────────────────────────────────────────────────
// Mapping Mongoose → noms DBF attendus par le frontend
// ─────────────────────────────────────────────────────────────────────────────
const mapArticleToDBF = (article) => {
  if (!article) return article;
  return {
    ...article,
    // Identification
    NART: article.codeArticle ?? article.NART ?? "",
    DESIGN: article.designation ?? article.DESIGN ?? "",
    DESIGN2: article.designation2 ?? article.DESIGN2 ?? "",
    GENCOD: article.gencode ?? article.GENCOD ?? "",
    REFER: article.reference ?? article.REFER ?? "",
    FOURN: article.codeFourn ?? article.FOURN ?? 0,
    GROUPE: article.groupe ?? article.GROUPE ?? "",
    UNITE: article.unite ?? article.UNITE ?? "",

    // Prix
    PREV: article.prixRevient ?? article.PREV ?? 0,
    PVTE: article.prixVenteHT ?? article.PVTE ?? 0,
    PDETAIL: article.prixDetail ?? article.PDETAIL ?? 0,
    PACHAT: article.prixAchat ?? article.PACHAT ?? 0,
    PVPROMO: article.prixPromo ?? article.PVPROMO ?? 0,
    PVTETTC: article.prixVenteTTC ?? article.PVTETTC ?? 0,
    DERPREV: article.dernierPrixRevient ?? article.DERPREV ?? 0,
    QT2: article.qt2 ?? article.QT2 ?? 0,
    PR2: article.pr2 ?? article.PR2 ?? 0,
    QT3: article.qt3 ?? article.QT3 ?? 0,
    PR3: article.pr3 ?? article.PR3 ?? 0,

    // Stocks
    SMINI: article.stockMini ?? article.SMINI ?? 0,
    STOCK: article.stock ?? article.STOCK ?? 0,
    STLOC2: article.stockLocal2 ?? article.STLOC2 ?? 0,
    RESERV: article.reserve ?? article.RESERV ?? 0,
    STSECUR: article.stockSecurite ?? article.STSECUR ?? 0,
    S1: article.s1 ?? article.S1 ?? 0,
    S2: article.s2 ?? article.S2 ?? 0,
    S3: article.s3 ?? article.S3 ?? 0,
    S4: article.s4 ?? article.S4 ?? 0,
    S5: article.s5 ?? article.S5 ?? 0,
    CONDITNM: article.conditionnement ?? article.CONDITNM ?? 0,
    ENCDE: article.enCoursCommande ?? article.ENCDE ?? 0,

    // Taxes
    TAXES: article.taxes ?? article.TAXES ?? 0,
    ATVA: article.tva ?? article.ATVA ?? 0,
    TXADEDUIRE: article.txADeduire ?? article.TXADEDUIRE ?? 0,
    CODTGC: article.codeTGC ?? article.CODTGC ?? "",

    // Observations & divers
    OBSERV: article.observation ?? article.OBSERV ?? "",
    POURC: article.pourcentage ?? article.POURC ?? 0,
    DOUANE: article.douane ?? article.DOUANE ?? "",
    DEVISE: article.devise ?? article.DEVISE ?? "",
    DEPREC: article.depreciation ?? article.DEPREC ?? 0,
    CODMAJ: article.codeMaj ?? article.CODMAJ ?? "",
    CODTAR: article.codeTarif ?? article.CODTAR ?? "",

    // Gisements
    GISM1: article.gism1 ?? article.GISM1 ?? "",
    GISM2: article.gism2 ?? article.GISM2 ?? "",
    GISM3: article.gism3 ?? article.GISM3 ?? "",
    GISM4: article.gism4 ?? article.GISM4 ?? "",
    GISM5: article.gism5 ?? article.GISM5 ?? "",
    PLACE: article.place ?? article.PLACE ?? "",

    // Flags
    TARIFL: article.tarifLibre ?? article.TARIFL ?? false,
    TEXTE: article.texte ?? article.TEXTE ?? "",
    GENDOUBL: article.gencodeDouble ?? article.GENDOUBL ?? "",
    ASSOCIE: article.associe ?? article.ASSOCIE ?? "",
    FOTO: article.photo ?? article.FOTO ?? "",
    WEB: article.web ?? article.WEB ?? "",
    DESIFRN: article.designationFournisseur ?? article.DESIFRN ?? "",
    COULR: article.couleur ?? article.COULR ?? "",
    CDESPEC: article.commandeSpeciale ?? article.CDESPEC ?? 0,
    RENV: article.renvoi ?? article.RENV ?? "",
    COMPOSE: article.compose ?? article.COMPOSE ?? "",
    VOL: article.volume ?? article.VOL ?? 0,
    KL: article.kl ?? article.KL ?? "",
    SAV: article.sav ?? article.SAV ?? "",
    GARANTIE: article.garantie ?? article.GARANTIE ?? "",

    // Dates - on garde les dates Mongoose (ISO strings) ET on crée les alias DBF
    CREATION: article.dateCreation ?? article.CREATION ?? null,
    DATINV: article.dateInventaire ?? article.DATINV ?? null,
    DATINV2: article.dateInventaire2 ?? article.DATINV2 ?? null,
    DPROMOD: article.datePromoDebut ?? article.DPROMOD ?? null,
    DPROMOF: article.datePromoFin ?? article.DPROMOF ?? null,

    // Ventes (V1..V12)
    V1: article.ventes?.v1 ?? article.V1 ?? 0,
    V2: article.ventes?.v2 ?? article.V2 ?? 0,
    V3: article.ventes?.v3 ?? article.V3 ?? 0,
    V4: article.ventes?.v4 ?? article.V4 ?? 0,
    V5: article.ventes?.v5 ?? article.V5 ?? 0,
    V6: article.ventes?.v6 ?? article.V6 ?? 0,
    V7: article.ventes?.v7 ?? article.V7 ?? 0,
    V8: article.ventes?.v8 ?? article.V8 ?? 0,
    V9: article.ventes?.v9 ?? article.V9 ?? 0,
    V10: article.ventes?.v10 ?? article.V10 ?? 0,
    V11: article.ventes?.v11 ?? article.V11 ?? 0,
    V12: article.ventes?.v12 ?? article.V12 ?? 0,

    // Ruptures (RUP1..RUP12)
    RUP1: article.ruptures?.r1 ?? article.RUP1 ?? 0,
    RUP2: article.ruptures?.r2 ?? article.RUP2 ?? 0,
    RUP3: article.ruptures?.r3 ?? article.RUP3 ?? 0,
    RUP4: article.ruptures?.r4 ?? article.RUP4 ?? 0,
    RUP5: article.ruptures?.r5 ?? article.RUP5 ?? 0,
    RUP6: article.ruptures?.r6 ?? article.RUP6 ?? 0,
    RUP7: article.ruptures?.r7 ?? article.RUP7 ?? 0,
    RUP8: article.ruptures?.r8 ?? article.RUP8 ?? 0,
    RUP9: article.ruptures?.r9 ?? article.RUP9 ?? 0,
    RUP10: article.ruptures?.r10 ?? article.RUP10 ?? 0,
    RUP11: article.ruptures?.r11 ?? article.RUP11 ?? 0,
    RUP12: article.ruptures?.r12 ?? article.RUP12 ?? 0,
  };
};

// Mapping pour les articles adjacents (prev/next) - champs légers
const mapAdjacentArticle = (art) => {
  if (!art) return null;
  return {
    ...art,
    NART: art.codeArticle ?? art.NART ?? "",
    DESIGN: art.designation ?? art.DESIGN ?? "",
    GENCOD: art.gencode ?? art.GENCOD ?? "",
  };
};

export const articleApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Liste des articles avec pagination et filtres avancés côté serveur
    getArticles: builder.query({
      query: ({
        nomDossierDBF,
        page,
        limit,
        // Filtres textuels
        search,
        nart,
        groupe,
        fourn,
        gisement,
        // Filtres énumérés (TOUT, OUI, NON ou POSITIF, NUL, NEGATIF)
        stock,
        gencod,
        promo,
        deprec,
        web,
        photo,
        reappro,
        // Filtre numérique
        tgc,
        // ====== NOUVEAU : filtre par statut ======
        statut,
      }) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}`,
        params: {
          page,
          limit,
          // Filtres textuels - ne pas envoyer si vide
          ...(search && { search }),
          ...(nart && { nart }),
          ...(groupe && { groupe }),
          ...(fourn && { fourn }),
          ...(gisement && { gisement }),
          // Convertir les filtres OUI/NON en booléens pour le backend
          ...(stock === "POSITIF" && { enStock: "true" }),
          ...(gencod === "OUI" && { hasGencod: "true" }),
          ...(promo === "OUI" && { hasPromo: "true" }),
          ...(deprec === "OUI" && { hasDeprec: "true" }),
          ...(web === "OUI" && { isWeb: "true" }),
          ...(photo === "OUI" && { hasPhoto: "true" }),
          ...(reappro === "OUI" && { reapproMag: "true" }),
          ...(tgc && tgc !== "TOUT" && { tgc }),
          // ====== NOUVEAU : statut (ACTIF, DEPRECIE, ARRETE) ======
          ...(statut && statut !== "TOUS" && { statut }),
        },
      }),
      // ── Transformation : on mappe les noms Mongoose → noms DBF ──
      transformResponse: (response) => {
        if (response?.articles) {
          response.articles = response.articles.map(mapArticleToDBF);
        }
        return response;
      },
      providesTags: ["Article"],
      keepUnusedDataFor: 60,
    }),

    // Article par code NART
    getArticleByNart: builder.query({
      query: ({ nomDossierDBF, nart }) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/code/${nart}`,
      }),
      // ── Transformation : on mappe l'article + articleOriginal ──
      transformResponse: (response) => {
        if (response?.article) {
          response.article = mapArticleToDBF(response.article);
        }
        if (response?.articleOriginal) {
          response.articleOriginal = {
            ...response.articleOriginal,
            nart: response.articleOriginal.codeArticle ?? response.articleOriginal.nart ?? "",
            designation: response.articleOriginal.designation ?? "",
            gencod: response.articleOriginal.gencode ?? response.articleOriginal.gencod ?? "",
          };
        }
        return response;
      },
      providesTags: ["Article"],
    }),

    // Article par code barre GENCOD
    getArticleByGencod: builder.query({
      query: ({ nomDossierDBF, gencod }) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/gencod/${gencod}`,
      }),
      transformResponse: (response) => {
        if (response?.article) {
          response.article = mapArticleToDBF(response.article);
        }
        return response;
      },
      providesTags: ["Article"],
    }),

    // ==========================================
    // Navigation entre articles (prev/next)
    // ==========================================
    getAdjacentArticles: builder.query({
      query: ({ nomDossierDBF, nart }) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/adjacent/${nart}`,
      }),
      // ── Transformation : prev/next ont des champs légers ──
      transformResponse: (response) => {
        if (response?.previous) {
          response.previous = mapAdjacentArticle(response.previous);
        }
        if (response?.next) {
          response.next = mapAdjacentArticle(response.next);
        }
        return response;
      },
      providesTags: ["Article"],
      keepUnusedDataFor: 60,
    }),

    // Recherche d'articles
    searchArticles: builder.query({
      query: ({ nomDossierDBF, q, field, limit }) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/search`,
        params: { q, field, limit },
      }),
      transformResponse: (response) => {
        if (response?.articles) {
          response.articles = response.articles.map(mapArticleToDBF);
        }
        return response;
      },
      providesTags: ["Article"],
    }),

    // Liste des groupes/familles
    getGroupes: builder.query({
      query: (nomDossierDBF) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/groupes`,
      }),
      providesTags: ["Article"],
      keepUnusedDataFor: 300,
    }),

    // Liste des taux TGC distincts
    getTgcRates: builder.query({
      query: (nomDossierDBF) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/tgc-rates`,
      }),
      providesTags: ["Article"],
      keepUnusedDataFor: 300,
    }),

    // Structure du fichier DBF
    getArticlesStructure: builder.query({
      query: (nomDossierDBF) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/structure`,
      }),
      providesTags: ["Article"],
      keepUnusedDataFor: 600,
    }),

    // ==========================================
    // PHOTOS
    // ==========================================

    // Obtenir l'URL de la photo d'un article
    getArticlePhoto: builder.query({
      query: ({ trigramme, nart }) => ({
        url: `${PHOTOS_URL}/${trigramme}/${nart}`,
        responseHandler: async (response) => {
          if (response.ok) {
            return { exists: true, url: `${PHOTOS_URL}/${trigramme}/${nart}` };
          }
          return { exists: false, url: null };
        },
      }),
      providesTags: ["ArticlePhoto"],
      keepUnusedDataFor: 3600,
    }),

    // Vérifier si une photo existe (HEAD request)
    checkPhotoExists: builder.query({
      query: ({ trigramme, nart }) => ({
        url: `${PHOTOS_URL}/${trigramme}/${nart}`,
        method: "HEAD",
      }),
      transformResponse: (response, meta) => {
        return { exists: meta?.response?.ok ?? false };
      },
      transformErrorResponse: () => {
        return { exists: false };
      },
      providesTags: ["ArticlePhoto"],
      keepUnusedDataFor: 3600,
    }),

    // Invalider le cache des articles (admin)
    invalidateArticleCache: builder.mutation({
      query: (nomDossierDBF) => ({
        url: `${ARTICLES_URL}/${nomDossierDBF}/invalidate-cache`,
        method: "POST",
      }),
      invalidatesTags: ["Article"],
    }),

    // Statistiques du cache (admin)
    getCacheStats: builder.query({
      query: () => ({
        url: `${ARTICLES_URL}/cache-stats`,
      }),
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useGetArticlesQuery,
  useGetArticleByNartQuery,
  useGetArticleByGencodQuery,
  useGetAdjacentArticlesQuery,
  useSearchArticlesQuery,
  useGetGroupesQuery,
  useGetTgcRatesQuery,
  useGetArticlesStructureQuery,
  useGetArticlePhotoQuery,
  useCheckPhotoExistsQuery,
  useInvalidateArticleCacheMutation,
  useGetCacheStatsQuery,
} = articleApiSlice;

// Helper pour construire l'URL de la photo
export const getPhotoUrl = (trigramme, nart) => {
  if (!trigramme || !nart) return null;
  return `${PHOTOS_URL}/${trigramme}/${nart.trim()}`;
};