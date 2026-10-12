/** Resolves to the promise's value, or to the error it rejected with. */
export async function safe<T>(promise: Promise<T>): Promise<T | Error> {
  try {
    return await promise
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error))
  }
}

export function isError(value: unknown): value is Error {
  return value instanceof Error
}
