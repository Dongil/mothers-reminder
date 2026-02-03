/**
 * @fileoverview 반복 메시지 유틸리티 함수
 *
 * 이 파일은 반복 메시지(매일, 매주, 매월)의 표시 여부를 판단하고,
 * 요일 정보를 포맷팅하는 유틸리티 함수들을 제공합니다.
 *
 * 반복 패턴 종류:
 * - none: 일반 메시지 (반복 없음)
 * - daily: 매일 반복
 * - weekly: 매주 특정 요일에 반복
 * - monthly: 매월 특정 일자에 반복
 *
 * 주요 기능:
 * - 특정 날짜에 메시지 표시 여부 판단
 * - 요일 배열을 한글 문자열로 변환
 * - 다음 활성 날짜 계산
 *
 * @see useMessages - 메시지 조회 시 반복 메시지 필터링에 사용
 */

import { format, parseISO, addDays, getDay } from 'date-fns';
import type { Message } from '@/types/database';

/**
 * shouldDisplayOnDate - 특정 날짜에 메시지를 표시해야 하는지 확인
 *
 * @description 메시지의 반복 설정과 날짜 조건을 확인하여
 * 해당 날짜에 메시지를 표시해야 하는지 판단합니다.
 *
 * 판단 로직:
 *   1. 일반 메시지 (repeat_pattern === 'none'):
 *      - display_forever가 true면 시작일 이후 항상 표시
 *      - 아니면 display_date와 정확히 일치할 때만 표시
 *
 *   2. 반복 메시지:
 *      - repeat_enabled가 false면 표시 안함
 *      - repeat_start 이전이면 표시 안함
 *      - repeat_end 이후면 표시 안함
 *      - repeat_skip_dates에 포함되면 표시 안함
 *      - 패턴에 따라 요일/일자 매칭 확인
 *
 * @param {Message} message - 확인할 메시지
 * @param {Date} targetDate - 확인할 날짜
 * @returns {boolean} 표시 여부
 *
 * @example
 * // 매주 월, 수, 금 반복 메시지가 수요일에 표시되는지 확인
 * const message = { repeat_pattern: 'weekly', repeat_weekdays: [1, 3, 5] };
 * const wednesday = new Date('2024-01-10'); // 수요일
 * shouldDisplayOnDate(message, wednesday); // true
 *
 * @example
 * // 특정 날짜 건너뛰기
 * const message = {
 *   repeat_pattern: 'weekly',
 *   repeat_weekdays: [1, 3, 5],
 *   repeat_skip_dates: ['2024-01-10']
 * };
 * shouldDisplayOnDate(message, new Date('2024-01-10')); // false
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
 * isRepeatMessage - 메시지가 반복 메시지인지 확인
 *
 * @description 메시지가 주간 반복으로 설정되어 있고
 * 요일이 하나 이상 선택되어 있는지 확인합니다.
 *
 * @param {Message} message - 확인할 메시지
 * @returns {boolean} 반복 메시지 여부
 *
 * @example
 * const message = { repeat_pattern: 'weekly', repeat_weekdays: [1, 3, 5] };
 * isRepeatMessage(message); // true
 */
export function isRepeatMessage(message: Message): boolean {
  return message.repeat_pattern === 'weekly' &&
         message.repeat_weekdays !== null &&
         message.repeat_weekdays.length > 0;
}

/**
 * formatWeekdays - 요일 번호 배열을 한글 요일 문자열로 변환
 *
 * @description JavaScript의 getDay() 반환값(0=일~6=토)을
 * 한글 요일 문자열로 변환합니다.
 *
 * @param {number[]} weekdays - 요일 번호 배열 (0=일요일 ~ 6=토요일)
 * @returns {string} 공백으로 구분된 한글 요일 문자열
 *
 * @example
 * formatWeekdays([1, 2, 3, 4, 5]); // "월 화 수 목 금"
 * formatWeekdays([0, 6]); // "일 토"
 */
export function formatWeekdays(weekdays: number[]): string {
  const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  return weekdays
    .sort((a, b) => a - b)
    .map(day => WEEKDAY_NAMES[day])
    .join(' ');
}

/**
 * formatWeekdaysSummary - 요일 배열을 짧은 요약 문자열로 변환
 *
 * @description 자주 사용되는 요일 조합은 특별한 이름으로 표시합니다.
 *
 * 특별 표시:
 *   - [1,2,3,4,5] → "평일"
 *   - [0,6] → "주말"
 *   - [0,1,2,3,4,5,6] → "매일"
 *   - 그 외 → 개별 요일 표시
 *
 * @param {number[]} weekdays - 요일 번호 배열
 * @returns {string} 요약 문자열
 *
 * @example
 * formatWeekdaysSummary([1, 2, 3, 4, 5]); // "평일"
 * formatWeekdaysSummary([0, 6]); // "주말"
 * formatWeekdaysSummary([0, 1, 2, 3, 4, 5, 6]); // "매일"
 * formatWeekdaysSummary([1, 3, 5]); // "월 수 금"
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
 * getNextWeekday - 다음에 해당하는 요일 날짜 계산
 *
 * @description 지정된 요일이 다음에 오는 날짜를 계산합니다.
 * 오늘이 해당 요일이면 다음 주의 같은 요일을 반환합니다.
 *
 * @param {number} targetDay - 목표 요일 (0=일요일 ~ 6=토요일)
 * @param {Date} [fromDate=new Date()] - 시작 날짜 (기본: 오늘)
 * @returns {Date} 다음 해당 요일 날짜
 *
 * @example
 * // 오늘이 화요일(2)일 때
 * getNextWeekday(5); // 이번 주 금요일
 * getNextWeekday(1); // 다음 주 월요일
 * getNextWeekday(2); // 다음 주 화요일 (오늘 이후이므로)
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
 * getNextActiveDate - 다음에 활성화될 날짜 계산
 *
 * @description 주어진 요일 배열 중 가장 빨리 오는 날짜를 반환합니다.
 *
 * @param {number[]} weekdays - 활성 요일 배열
 * @param {Date} [fromDate=new Date()] - 시작 날짜
 * @returns {Date | null} 가장 가까운 활성 날짜 또는 null
 *
 * @example
 * // 오늘이 화요일(2)이고, 활성 요일이 월, 수, 금일 때
 * getNextActiveDate([1, 3, 5]); // 이번 주 수요일
 */
export function getNextActiveDate(weekdays: number[], fromDate: Date = new Date()): Date | null {
  if (!weekdays || weekdays.length === 0) return null;

  const nextDates = weekdays.map(day => getNextWeekday(day, fromDate));
  return nextDates.reduce((earliest, date) =>
    date < earliest ? date : earliest
  );
}

/**
 * formatTimeWithAmPm - 시간 문자열을 오전/오후 형식으로 변환
 *
 * @description 24시간 형식의 시간 문자열을
 * 한국어 오전/오후 형식으로 변환합니다.
 *
 * @param {string | null} time - 시간 문자열 ('HH:MM' 형식) 또는 null
 * @returns {string} 포맷된 시간 문자열 또는 '종일'
 *
 * @example
 * formatTimeWithAmPm('09:30'); // "오전 9:30"
 * formatTimeWithAmPm('14:00'); // "오후 2:00"
 * formatTimeWithAmPm('00:00'); // "오전 12:00"
 * formatTimeWithAmPm(null); // "종일"
 */
export function formatTimeWithAmPm(time: string | null): string {
  if (!time) return '종일';

  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12; // 0시는 12시로 표시

  return `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
}
