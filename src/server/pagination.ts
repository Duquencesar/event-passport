/**
 * Helper de paginação para superar o limite de 1000 linhas do PostgREST.
 * Use quando precisa percorrer TODAS as linhas (não apenas contar).
 *
 * Exemplo:
 *   const all = await fetchAllRows<{ id: string }>((from, to) =>
 *     db.from("checkins").select("id").range(from, to),
 *   );
 */
export const SUPABASE_PAGE_SIZE = 1000;

type PageResult<T> = { data: T[] | null; error: { message: string } | null };

export async function fetchAllRows<T>(
  query: (from: number, to: number) => PromiseLike<PageResult<T>>,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < SUPABASE_PAGE_SIZE) break;
    from += SUPABASE_PAGE_SIZE;
  }
  return all;
}
