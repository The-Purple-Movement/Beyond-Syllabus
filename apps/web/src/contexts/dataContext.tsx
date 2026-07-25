"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { orpc } from "@/lib/orpc";
import { cacheGet, cachePut } from "@/lib/sliceCache";

type DataContextType = {
  /** Merged per-university slices: { [universityId]: universityData } */
  data: any;
  /** All university ids, available as soon as the lightweight list loads */
  universities: string[] | null;
  /** True until the university list has loaded */
  isFetching: boolean;
  isError: boolean;
  error: any;
  /**
   * Lazily fetch one university's slice (idempotent). Resolves when the
   * slice is present in `data`.
   */
  ensureUniversity: (universityId: string) => Promise<void>;
  /** True while the given university's slice is still loading */
  isUniversityLoading: (universityId: string) => boolean;
};

const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<any>({});
  const [universities, setUniversities] = useState<string[] | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  // Dedupe concurrent slice requests without re-rendering
  const inflight = useRef<Record<string, Promise<void> | undefined>>({});

  useEffect(() => {
    (async () => {
      try {
        const list = await orpc.syllabusUniversities.call();
        setUniversities(list as string[]);
        cachePut("universities", list);
      } catch (err: any) {
        // Offline fallback: the last known university list
        const cached = await cacheGet<string[]>("universities");
        if (cached?.length) {
          setUniversities(cached);
        } else {
          setIsError(true);
          setError(err);
        }
      } finally {
        setIsFetching(false);
      }
    })();
  }, []);

  const ensureUniversity = useCallback(
    (universityId: string): Promise<void> => {
      if (!universityId) return Promise.resolve();
      const existing = inflight.current[universityId];
      if (existing) return existing;

      const promise = (async () => {
        // Already loaded? (read latest state via updater trick not needed:
        // inflight map keeps this from double-fetching in one session)
        setLoading((prev) => ({ ...prev, [universityId]: true }));
        try {
          const slice = await orpc.syllabusForUniversity.call({
            university: universityId,
          });
          setData((prev: any) => ({ ...prev, ...(slice as object) }));
          cachePut(`slice:${universityId}`, slice);
        } catch (err: any) {
          // Offline fallback: the last cached copy of this university
          const cached = await cacheGet<object>(`slice:${universityId}`);
          if (cached) {
            setData((prev: any) => ({ ...prev, ...cached }));
          } else {
            setIsError(true);
            setError(err);
          }
          delete inflight.current[universityId];
        } finally {
          setLoading((prev) => ({ ...prev, [universityId]: false }));
        }
      })();

      inflight.current[universityId] = promise;
      return promise;
    },
    []
  );

  const isUniversityLoading = useCallback(
    (universityId: string) => !!loading[universityId],
    [loading]
  );

  return (
    <DataContext.Provider
      value={{
        data,
        universities,
        isFetching,
        isError,
        error,
        ensureUniversity,
        isUniversityLoading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);

/**
 * Convenience hook for pages scoped to one university: triggers the lazy
 * load and reports fetching until that university's slice is available.
 */
export const useUniversityData = (universityId: string | undefined) => {
  const ctx = useData();
  const { ensureUniversity } = ctx;

  useEffect(() => {
    if (universityId) ensureUniversity(universityId);
  }, [universityId, ensureUniversity]);

  const sliceReady = universityId ? !!ctx.data?.[universityId] : false;

  return {
    data: ctx.data,
    isFetching: ctx.isFetching || (!!universityId && !sliceReady && !ctx.isError),
    isError: ctx.isError,
    error: ctx.error,
  };
};
