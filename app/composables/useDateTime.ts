import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export function useDateTime() {
  function formatDateTime(value?: string | null, pattern = 'YYYY-MM-DD HH:mm') {
    if (!value) return '-'

    const date = dayjs.utc(value)
    if (!date.isValid()) return value

    return date.utcOffset(8).format(pattern)
  }

  return {
    formatDateTime,
  }
}
