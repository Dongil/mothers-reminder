import { format, parseISO, addDays, getDay } from 'date-fns';
import type { Message } from '@/types/database';

/**
 * 특정 날짜에 메시지를 표시해야 하는지 확인
 */
export function shouldDisplayOnDate(message: Message, targetDate: Date): boolean {
  const targetDateStr = format(targetDate, 'yyyy-MM-dd');

  // 일반 메시지 (반복 아님)
  if (message.repeat_pattern === 'none' || !message.repeat_pattern) {
    // display_forever인 경우 시작일 이후 항상 표시
    if (message.display_forever) {
      return message.display_date <= targetDateStr;
    }
    return message.display_date === targetDateStr;
  }

  // 반복 비활성화
  if (!message.repeat_enabled) return false;

  // 시작일 이전이면 표시 안함
  if (message.repeat_start && targetDate < parseISO(message.repeat_start)) return false;

  // 종료일 이후면 표시 안함
  if (message.repeat_end && targetDate > parseISO(message.repeat_end)) return false;

  // 건너뛰기 날짜 체크
  if (message.repeat_skip_dates?.includes(targetDateStr)) return false;

  // 주간 반복: 요일 매칭
  if (message.repeat_pattern === 'weekly') {
    const dayOfWeek = getDay(targetDate); // 0 (일) ~ 6 (토)
    return message.repeat_weekdays?.includes(dayOfWeek) ?? false;
  }

  // 일간 반복
  if (message.repeat_pattern === 'daily') {
    return true;
  }

  // 월간 반복
  if (message.repeat_pattern === 'monthly' && message.repeat_month_day) {
    return targetDate.getDate() === message.repeat_month_day;
  }

  return false;
}

/**
 * 메시지가 반복 메시지인지 확인
 */
export function isRepeatMessage(message: Message): boolean {
  return message.repeat_pattern === 'weekly' &&
         message.repeat_weekdays !== null &&
         message.repeat_weekdays.length > 0;
}

/**
 * 요일 번호 배열을 한글 요일 문자열로 변환
 * 예: [1, 2, 3, 4, 5] -> "월 화 수 목 금"
 */
export function formatWeekdays(weekdays: number[]): string {
  const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  return weekdays
    .sort((a, b) => a - b)
    .map(day => WEEKDAY_NAMES[day])
    .join(' ');
}

/**
 * 요일 번호 배열을 짧은 요약 문자열로 변환
 * 예: [1, 2, 3, 4, 5] -> "평일", [0, 6] -> "주말"
 */
export function formatWeekdaysSummary(weekdays: number[]): string {
  const sorted = [...weekdays].sort((a, b) => a - b);

  // 평일 (월-금)
  if (sorted.length === 5 &&
      sorted[0] === 1 && sorted[4] === 5 &&
      sorted.every((v, i) => v === i + 1)) {
    return '평일';
  }

  // 주말 (토-일)
  if (sorted.length === 2 && sorted[0] === 0 && sorted[1] === 6) {
    return '주말';
  }

  // 매일
  if (sorted.length === 7) {
    return '매일';
  }

  return formatWeekdays(weekdays);
}

/**
 * 다음에 해당하는 요일 날짜 계산
 * @param targetDay 0 (일) ~ 6 (토)
 * @param fromDate 시작 날짜 (기본: 오늘)
 */
export function getNextWeekday(targetDay: number, fromDate: Date = new Date()): Date {
  const currentDay = getDay(fromDate);
  let daysUntil = targetDay - currentDay;

  // 오늘 이후의 다음 해당 요일
  if (daysUntil <= 0) {
    daysUntil += 7;
  }

  return addDays(fromDate, daysUntil);
}

/**
 * 다음에 활성화될 요일들 중 가장 빠른 날짜 계산
 */
export function getNextActiveDate(weekdays: number[], fromDate: Date = new Date()): Date | null {
  if (!weekdays || weekdays.length === 0) return null;

  const nextDates = weekdays.map(day => getNextWeekday(day, fromDate));
  return nextDates.reduce((earliest, date) =>
    date < earliest ? date : earliest
  );
}

/**
 * 시간 문자열 포맷 (24시간 -> 오전/오후)
 */
export function formatTimeWithAmPm(time: string | null): string {
  if (!time) return '종일';

  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;

  return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
}
