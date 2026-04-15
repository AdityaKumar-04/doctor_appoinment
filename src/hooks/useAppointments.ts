import useSWR from "swr";

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then(r => {
    if (!r.ok) throw new Error("Failed to fetch data");
    return r.json();
});

export function useAppointments(role: string, userId: string | null | undefined, status: string = "all", page: number = 1) {
  const url = userId ? `/api/appointments?role=${role}&userId=${userId}&status=${status}&page=${page}` : null;
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);

  return {
    appointments: data?.appointments || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    isError: error,
    mutate,
  };
}
