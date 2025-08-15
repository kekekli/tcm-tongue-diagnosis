import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const formatDate = (timestamp: number, format?: string): string => {
  const date = dayjs(timestamp)
  const now = dayjs()
  const diffHours = now.diff(date, 'hour')
  const diffDays = now.diff(date, 'day')

  if (diffHours < 1) {
    return '刚刚'
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.format(format || 'MM-DD HH:mm')
  }
}

export const formatFullDate = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

export const formatDateRange = (start: number, end: number): string => {
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  
  if (startDate.isSame(endDate, 'day')) {
    return startDate.format('YYYY-MM-DD')
  } else {
    return `${startDate.format('MM-DD')} 至 ${endDate.format('MM-DD')}`
  }
}

export const getTimeOfDay = (): string => {
  const hour = dayjs().hour()
  
  if (hour < 6) return '深夜'
  if (hour < 12) return '上午'
  if (hour < 14) return '中午'
  if (hour < 18) return '下午'
  if (hour < 22) return '晚上'
  return '深夜'
}

export const isToday = (timestamp: number): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'day')
}

export const isThisWeek = (timestamp: number): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'week')
}

export const isThisMonth = (timestamp: number): boolean => {
  return dayjs(timestamp).isSame(dayjs(), 'month')
}