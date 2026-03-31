// src/slices/apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants";

export const apiSlice = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include", // Important pour les cookies JWT
  }),
  tagTypes: [
    "User",
    "Entreprise",
    "Concurrent",
    "Filiale",
    "Outil",
    "TacheCron",
    "ExecutionCron",
  ],
  endpoints: (builder) => ({}),
});
