export async function withMinimumDuration<T>(task: Promise<T>, minimumMs = 1000): Promise<T> {
  const startedAt = Date.now()

  try {
    return await task
  } finally {
    const remaining = minimumMs - (Date.now() - startedAt)
    if (remaining > 0) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, remaining))
    }
  }
}
