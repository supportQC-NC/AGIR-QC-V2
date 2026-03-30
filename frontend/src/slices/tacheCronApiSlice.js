// import { apiSlice } from "./apiSlice";

// const TACHES_CRON_URL = "/api/taches-cron";

// export const tacheCronApiSlice = apiSlice.injectEndpoints({
//   endpoints: (builder) => ({
//     getTachesCron: builder.query({
//       query: ({ categorie, search, statut, page, limit, includeInactive } = {}) => ({
//         url: TACHES_CRON_URL,
//         params: {
//           ...(categorie && categorie !== "tous" && { categorie }),
//           ...(search && { search }),
//           ...(statut && statut !== "tous" && { statut }),
//           ...(page && { page }),
//           ...(limit && { limit }),
//           ...(includeInactive && { includeInactive: "true" }),
//         },
//       }),
//       providesTags: ["TacheCron"],
//       keepUnusedDataFor: 30,
//     }),
//     getTacheCronById: builder.query({ query: (id) => `${TACHES_CRON_URL}/${id}`, providesTags: ["TacheCron"] }),
//     getCategoriesCron: builder.query({ query: () => `${TACHES_CRON_URL}/categories`, keepUnusedDataFor: 300 }),
//     createTacheCron: builder.mutation({ query: (formData) => ({ url: TACHES_CRON_URL, method: "POST", body: formData, formData: true }), invalidatesTags: ["TacheCron"] }),
//     updateTacheCron: builder.mutation({ query: ({ id, formData }) => ({ url: `${TACHES_CRON_URL}/${id}`, method: "PUT", body: formData, formData: true }), invalidatesTags: ["TacheCron"] }),
//     deleteTacheCron: builder.mutation({ query: (id) => ({ url: `${TACHES_CRON_URL}/${id}`, method: "DELETE" }), invalidatesTags: ["TacheCron"] }),
//     toggleTacheCronActive: builder.mutation({ query: (id) => ({ url: `${TACHES_CRON_URL}/${id}/toggle-active`, method: "PATCH" }), invalidatesTags: ["TacheCron"] }),
//     updateTacheCronImage: builder.mutation({ query: ({ id, formData }) => ({ url: `${TACHES_CRON_URL}/${id}/image`, method: "PUT", body: formData, formData: true }), invalidatesTags: ["TacheCron"] }),
//     deleteTacheCronImage: builder.mutation({ query: (id) => ({ url: `${TACHES_CRON_URL}/${id}/image`, method: "DELETE" }), invalidatesTags: ["TacheCron"] }),
//     executerTacheCron: builder.mutation({ query: ({ id, argumentsActives }) => ({ url: `${TACHES_CRON_URL}/${id}/executer`, method: "POST", body: { argumentsActives } }), invalidatesTags: ["TacheCron", "ExecutionCron"] }),
//     annulerExecution: builder.mutation({ query: (id) => ({ url: `${TACHES_CRON_URL}/${id}/annuler`, method: "POST" }), invalidatesTags: ["TacheCron", "ExecutionCron"] }),
//     getStatutExecution: builder.query({ query: (id) => `${TACHES_CRON_URL}/${id}/statut`, providesTags: ["ExecutionCron"], keepUnusedDataFor: 5 }),
//     getExecutions: builder.query({
//       query: ({ tacheId, page, limit } = {}) => ({ url: `${TACHES_CRON_URL}/${tacheId}/executions`, params: { ...(page && { page }), ...(limit && { limit }) } }),
//       providesTags: ["ExecutionCron"], keepUnusedDataFor: 30,
//     }),
//     getExecutionDetail: builder.query({ query: (executionId) => `${TACHES_CRON_URL}/executions/${executionId}`, providesTags: ["ExecutionCron"] }),
//     uploadFichierExecution: builder.mutation({ query: ({ executionId, formData }) => ({ url: `${TACHES_CRON_URL}/executions/${executionId}/fichiers`, method: "POST", body: formData, formData: true }), invalidatesTags: ["ExecutionCron"] }),
//     deleteFichierExecution: builder.mutation({ query: ({ executionId, fichierId }) => ({ url: `${TACHES_CRON_URL}/executions/${executionId}/fichiers/${fichierId}`, method: "DELETE" }), invalidatesTags: ["ExecutionCron"] }),
//     getTachesCronStats: builder.query({ query: () => `${TACHES_CRON_URL}/stats`, keepUnusedDataFor: 60 }),
//   }),
// });

// export const {
//   useGetTachesCronQuery, useGetTacheCronByIdQuery, useGetCategoriesCronQuery,
//   useCreateTacheCronMutation, useUpdateTacheCronMutation, useDeleteTacheCronMutation, useToggleTacheCronActiveMutation,
//   useUpdateTacheCronImageMutation, useDeleteTacheCronImageMutation,
//   useExecuterTacheCronMutation, useAnnulerExecutionMutation, useGetStatutExecutionQuery,
//   useGetExecutionsQuery, useGetExecutionDetailQuery,
//   useUploadFichierExecutionMutation, useDeleteFichierExecutionMutation, useGetTachesCronStatsQuery,
// } = tacheCronApiSlice;

// export const getTacheCronImageUrl = (tacheId) => tacheId ? `${TACHES_CRON_URL}/${tacheId}/image` : null;
// export const getFichierExecutionUrl = (executionId, fichierId) => `${TACHES_CRON_URL}/executions/${executionId}/fichiers/${fichierId}`;
import { apiSlice } from "./apiSlice";

const TACHES_CRON_URL = "/api/taches-cron";

export const tacheCronApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTachesCron: builder.query({
      query: ({ categorie, search, statut, page, limit, includeInactive } = {}) => ({
        url: TACHES_CRON_URL,
        params: {
          ...(categorie && categorie !== "tous" && { categorie }),
          ...(search && { search }),
          ...(statut && statut !== "tous" && { statut }),
          ...(page && { page }),
          ...(limit && { limit }),
          ...(includeInactive && { includeInactive: "true" }),
        },
      }),
      providesTags: ["TacheCron"],
      keepUnusedDataFor: 30,
    }),
    getTacheCronById: builder.query({
      query: (id) => `${TACHES_CRON_URL}/${id}`,
      providesTags: ["TacheCron"],
    }),
    getCategoriesCron: builder.query({
      query: () => `${TACHES_CRON_URL}/categories`,
      keepUnusedDataFor: 300,
    }),
    createTacheCron: builder.mutation({
      query: (formData) => ({ url: TACHES_CRON_URL, method: "POST", body: formData, formData: true }),
      invalidatesTags: ["TacheCron"],
    }),
    updateTacheCron: builder.mutation({
      query: ({ id, formData }) => ({ url: `${TACHES_CRON_URL}/${id}`, method: "PUT", body: formData, formData: true }),
      invalidatesTags: ["TacheCron"],
    }),
    deleteTacheCron: builder.mutation({
      query: (id) => ({ url: `${TACHES_CRON_URL}/${id}`, method: "DELETE" }),
      invalidatesTags: ["TacheCron"],
    }),
    toggleTacheCronActive: builder.mutation({
      query: (id) => ({ url: `${TACHES_CRON_URL}/${id}/toggle-active`, method: "PATCH" }),
      invalidatesTags: ["TacheCron"],
    }),
    updateTacheCronImage: builder.mutation({
      query: ({ id, formData }) => ({ url: `${TACHES_CRON_URL}/${id}/image`, method: "PUT", body: formData, formData: true }),
      invalidatesTags: ["TacheCron"],
    }),
    deleteTacheCronImage: builder.mutation({
      query: (id) => ({ url: `${TACHES_CRON_URL}/${id}/image`, method: "DELETE" }),
      invalidatesTags: ["TacheCron"],
    }),
    executerTacheCron: builder.mutation({
      query: ({ id, argumentsActives }) => ({ url: `${TACHES_CRON_URL}/${id}/executer`, method: "POST", body: { argumentsActives } }),
      invalidatesTags: ["TacheCron", "ExecutionCron"],
    }),
    annulerExecution: builder.mutation({
      query: (id) => ({ url: `${TACHES_CRON_URL}/${id}/annuler`, method: "POST" }),
      invalidatesTags: ["TacheCron", "ExecutionCron"],
    }),
    getStatutExecution: builder.query({
      query: (id) => `${TACHES_CRON_URL}/${id}/statut`,
      providesTags: ["ExecutionCron"],
      keepUnusedDataFor: 5,
    }),
    getExecutions: builder.query({
      query: ({ tacheId, page, limit } = {}) => ({
        url: `${TACHES_CRON_URL}/${tacheId}/executions`,
        params: { ...(page && { page }), ...(limit && { limit }) },
      }),
      providesTags: ["ExecutionCron"],
      keepUnusedDataFor: 30,
    }),
    getExecutionDetail: builder.query({
      query: (executionId) => `${TACHES_CRON_URL}/executions/${executionId}`,
      providesTags: ["ExecutionCron"],
    }),
    uploadFichierExecution: builder.mutation({
      query: ({ executionId, formData }) => ({
        url: `${TACHES_CRON_URL}/executions/${executionId}/fichiers`,
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["ExecutionCron"],
    }),
    deleteFichierExecution: builder.mutation({
      query: ({ executionId, fichierId }) => ({
        url: `${TACHES_CRON_URL}/executions/${executionId}/fichiers/${fichierId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExecutionCron"],
    }),
    getTachesCronStats: builder.query({
      query: () => `${TACHES_CRON_URL}/stats`,
      keepUnusedDataFor: 60,
    }),

    // ============================================
    // DOCUMENTATION TACHE CRON
    // ============================================
    addDocumentationTacheCron: builder.mutation({
      query: ({ tacheId, formData }) => ({
        url: `${TACHES_CRON_URL}/${tacheId}/documentation`,
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["TacheCron"],
    }),
    updateDocumentationTacheCron: builder.mutation({
      query: ({ tacheId, docId, formData }) => ({
        url: `${TACHES_CRON_URL}/${tacheId}/documentation/${docId}`,
        method: "PUT",
        body: formData,
        formData: true,
      }),
      invalidatesTags: ["TacheCron"],
    }),
    deleteDocumentationTacheCron: builder.mutation({
      query: ({ tacheId, docId }) => ({
        url: `${TACHES_CRON_URL}/${tacheId}/documentation/${docId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["TacheCron"],
    }),
  }),
});

export const {
  useGetTachesCronQuery,
  useGetTacheCronByIdQuery,
  useGetCategoriesCronQuery,
  useCreateTacheCronMutation,
  useUpdateTacheCronMutation,
  useDeleteTacheCronMutation,
  useToggleTacheCronActiveMutation,
  useUpdateTacheCronImageMutation,
  useDeleteTacheCronImageMutation,
  useExecuterTacheCronMutation,
  useAnnulerExecutionMutation,
  useGetStatutExecutionQuery,
  useGetExecutionsQuery,
  useGetExecutionDetailQuery,
  useUploadFichierExecutionMutation,
  useDeleteFichierExecutionMutation,
  useGetTachesCronStatsQuery,
  // Documentation
  useAddDocumentationTacheCronMutation,
  useUpdateDocumentationTacheCronMutation,
  useDeleteDocumentationTacheCronMutation,
} = tacheCronApiSlice;

export const getTacheCronImageUrl = (tacheId) =>
  tacheId ? `${TACHES_CRON_URL}/${tacheId}/image` : null;

export const getFichierExecutionUrl = (executionId, fichierId) =>
  `${TACHES_CRON_URL}/executions/${executionId}/fichiers/${fichierId}`;

export const getTacheCronDocumentationUrl = (tacheId, docId) =>
  `${TACHES_CRON_URL}/${tacheId}/documentation/${docId}`;