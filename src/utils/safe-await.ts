type AwaitResult<T> = [T, null] | [null, Error];

export const safeAwait = async <T>(
  promise: Promise<T>,
): Promise<AwaitResult<T>> => {
  try {
    const data = await promise;
    return [data, null];
  } catch (err) {
    return [null, err as Error];
  }
};
