// Use these throughout the app instead of plain `useDispatch` / `useSelector`.
// - useAppSelector: pre-typed with RootState so you don't repeat the type on every selector
// - useAppDispatch: pre-typed with AppDispatch so thunks dispatch correctly
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
