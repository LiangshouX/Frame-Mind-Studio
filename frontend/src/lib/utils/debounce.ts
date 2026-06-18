export type DebouncedFn<T extends (...args: never[]) => void> = {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as DebouncedFn<T>
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debounced
}
