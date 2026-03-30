// src/slices/fournissApiSlice.js
import { apiSlice } from "./apiSlice";

const FOURNISSEURS_URL = "/api/fournisseurs";

// ─────────────────────────────────────────────────────────────────────────────
// Mapping Mongoose → noms DBF attendus par le frontend
// ─────────────────────────────────────────────────────────────────────────────
const mapFournisseurToDBF = (fourn) => {
  if (!fourn) return fourn;
  return {
    ...fourn,
    FOURN: fourn.codeFourn ?? fourn.FOURN ?? 0,
    NOM: fourn.nom ?? fourn.NOM ?? "",
    AD1: fourn.adresse1 ?? fourn.AD1 ?? "",
    AD2: fourn.adresse2 ?? fourn.AD2 ?? "",
    AD3: fourn.adresse3 ?? fourn.AD3 ?? "",
    AD4: fourn.adresse4 ?? fourn.AD4 ?? "",
    AD5: fourn.adresse5 ?? fourn.AD5 ?? "",
    TEL: fourn.telephone ?? fourn.TEL ?? "",
    TLX: fourn.email ?? fourn.TLX ?? "",
    FAX: fourn.fax ?? fourn.FAX ?? "",
    OBSERV: fourn.observation ?? fourn.OBSERV ?? "",
    DELAPRO: fourn.delaiAppro ?? fourn.DELAPRO ?? 0,
    COEFSMINI: fourn.coefMini ?? fourn.COEFSMINI ?? 0,
    TEXTE: fourn.texte ?? fourn.TEXTE ?? "",
    FRANCO: fourn.franco ?? fourn.FRANCO ?? 0,
    LOCAL: fourn.local ?? fourn.LOCAL ?? "",
  };
};

// Mapping articles du fournisseur (champs Mongoose → DBF)
const mapArticleToDBF = (article) => {
  if (!article) return article;
  return {
    ...article,
    NART: article.codeArticle ?? article.NART ?? "",
    DESIGN: article.designation ?? article.DESIGN ?? "",
    DESIGN2: article.designation2 ?? article.DESIGN2 ?? "",
    GENCOD: article.gencode ?? article.GENCOD ?? "",
    REFER: article.reference ?? article.REFER ?? "",
    FOURN: article.codeFourn ?? article.FOURN ?? 0,
    GROUPE: article.groupe ?? article.GROUPE ?? "",
    UNITE: article.unite ?? article.UNITE ?? "",
    PREV: article.prixRevient ?? article.PREV ?? 0,
    PVTE: article.prixVenteHT ?? article.PVTE ?? 0,
    PDETAIL: article.prixDetail ?? article.PDETAIL ?? 0,
    PACHAT: article.prixAchat ?? article.PACHAT ?? 0,
    PVPROMO: article.prixPromo ?? article.PVPROMO ?? 0,
    PVTETTC: article.prixVenteTTC ?? article.PVTETTC ?? 0,
    DERPREV: article.dernierPrixRevient ?? article.DERPREV ?? 0,
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
    ENCDE: article.enCoursCommande ?? article.ENCDE ?? 0,
    TAXES: article.taxes ?? article.TAXES ?? 0,
    DEPREC: article.depreciation ?? article.DEPREC ?? 0,
    OBSERV: article.observation ?? article.OBSERV ?? "",
    WEB: article.web ?? article.WEB ?? "",
    FOTO: article.photo ?? article.FOTO ?? "",
    GISM1: article.gism1 ?? article.GISM1 ?? "",
    GISM2: article.gism2 ?? article.GISM2 ?? "",
    GISM3: article.gism3 ?? article.GISM3 ?? "",
    GISM4: article.gism4 ?? article.GISM4 ?? "",
    GISM5: article.gism5 ?? article.GISM5 ?? "",
    PLACE: article.place ?? article.PLACE ?? "",
    CREATION: article.dateCreation ?? article.CREATION ?? null,
    DATINV: article.dateInventaire ?? article.DATINV ?? null,
    DPROMOD: article.datePromoDebut ?? article.DPROMOD ?? null,
    DPROMOF: article.datePromoFin ?? article.DPROMOF ?? null,
    GENDOUBL: article.gencodeDouble ?? article.GENDOUBL ?? "",
    ASSOCIE: article.associe ?? article.ASSOCIE ?? "",
  };
};

export const fournissApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Liste des fournisseurs avec pagination
    getFournisseurs: builder.query({
      query: ({ nomDossierDBF, page, limit, search }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}`,
        params: {
          page,
          limit,
          ...(search && { search }),
        },
      }),
      // ── Transformation : mapper les fournisseurs ──
      transformResponse: (response) => {
        if (response?.fournisseurs) {
          response.fournisseurs = response.fournisseurs.map(mapFournisseurToDBF);
        }
        return response;
      },
      providesTags: ["Fournisseur"],
      keepUnusedDataFor: 60,
    }),

    // Stats bulk : actif/déprécié/arrêté/réappro/valeur pour TOUS les fournisseurs
    getFournisseursStats: builder.query({
      query: (nomDossierDBF) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/stats`,
      }),
      providesTags: ["FournisseurStats"],
      keepUnusedDataFor: 120,
    }),

    // Détail d'un fournisseur par code
    getFournisseurByCode: builder.query({
      query: ({ nomDossierDBF, fourn }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/code/${fourn}`,
      }),
      // ── Transformation ──
      transformResponse: (response) => {
        if (response?.fournisseur) {
          response.fournisseur = mapFournisseurToDBF(response.fournisseur);
        }
        return response;
      },
      providesTags: (result, error, arg) => [
        { type: "Fournisseur", id: arg.fourn },
      ],
    }),

    // Articles liés à un fournisseur
    getArticlesByFournisseur: builder.query({
      query: ({ nomDossierDBF, fourn, page, limit }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/code/${fourn}/articles`,
        params: { page, limit },
      }),
      // ── Transformation : mapper les articles ──
      transformResponse: (response) => {
        if (response?.articles) {
          response.articles = response.articles.map(mapArticleToDBF);
        }
        return response;
      },
      providesTags: (result, error, arg) => [
        { type: "Article", id: `LIST_FOURN_${arg.fourn}` },
      ],
    }),

    // Recherche rapide
    searchFournisseurs: builder.query({
      query: ({ nomDossierDBF, q, limit }) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/search`,
        params: { q, limit },
      }),
      transformResponse: (response) => {
        if (response?.fournisseurs) {
          response.fournisseurs = response.fournisseurs.map(mapFournisseurToDBF);
        }
        return response;
      },
      providesTags: ["Fournisseur"],
    }),

    // Structure
    getFournisseursStructure: builder.query({
      query: (nomDossierDBF) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/structure`,
      }),
      keepUnusedDataFor: 600,
    }),

    // Invalider cache
    invalidateFournissCache: builder.mutation({
      query: (nomDossierDBF) => ({
        url: `${FOURNISSEURS_URL}/${nomDossierDBF}/invalidate-cache`,
        method: "POST",
      }),
      invalidatesTags: ["Fournisseur", "FournisseurStats"],
    }),
  }),
});

export const {
  useGetFournisseursQuery,
  useGetFournisseursStatsQuery,
  useGetFournisseurByCodeQuery,
  useGetArticlesByFournisseurQuery,
  useSearchFournisseursQuery,
  useGetFournisseursStructureQuery,
  useInvalidateFournissCacheMutation,
} = fournissApiSlice;