// src/slices/errorSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  httpError: null,
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    setHttpError: (state, action) => {
      state.httpError = action.payload;
    },
    clearHttpError: (state) => {
      state.httpError = null;
    },
  },
});

export const { setHttpError, clearHttpError } = errorSlice.actions;
export default errorSlice.reducer;