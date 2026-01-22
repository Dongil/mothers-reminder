import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Priority } from '@/types/database';

/**
 * Tailwind CSS 클래스 병합
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 날짜 포맷 - "2026년 1월 12일 일요일"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy년 M월 d일 EEEE', { locale: ko });
}

/**
 * 짧은 날짜 포맷 - "1월 12일"
 */
export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'M월 d일', { locale: ko });
}

/**
 * 시간 포맷 - "오후 3시 30분"
 */
export function formatTime(time: string | Date): string {
  let hours: number;
  let minutes: number;

  if (time instanceof Date) {
    hours = time.getHours();
    minutes = time.getMinutes();
  } else {
    // "15:30" 형식의 시간 문자열을 파싱
    [hours, minutes] = time.split(':').map(Number);
  }

  const period = hours < 12 ? '오전' : '오후';
  const hour12 = hours % 12 || 12;

  if (minutes === 0) {
    return `${period} ${hour12}시`;
  }
  return `${period} ${hour12}시 ${minutes}분`;
}

/**
 * 상대 시간 - "5분 전", "2시간 후"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}

/**
 * D-day 계산
 * @returns 음수: 지남, 0: D-Day, 양수: 남음
 */
export function calculateDday(targetDate: string | Date): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return differenceInDays(target, today);
}

/**
 * D-day 문자열 - "D-7", "D-Day", "D+3"
 */
export function formatDday(targetDate: string | Date): string {
  const days = calculateDday(targetDate);
  if (days === 0) return 'D-Day';
  if (days > 0) return `D-${days}`;
  return `D+${Math.abs(days)}`;
}

/**
 * 중요도별 배경색
 */
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 border-red-200';
    case 'important':
      return 'bg-yellow-50 border-yellow-200';
    case 'normal':
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

/**
 * 중요도별 텍스트 색상
 */
export function getPriorityTextColor(priority: Priority): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-700';
    case 'important':
      return 'text-yellow-700';
    case 'normal':
    default:
      return 'text-gray-700';
  }
}

/**
 * 중요도 라벨
 */
export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'urgent':
      return '긴급';
    case 'important':
      return '중요';
    case 'normal':
    default:
      return '일반';
  }
}

/**
 * 야간 모드 여부 확인
 */
export function isNightMode(
  nightStart: string = '20:00',
  nightEnd: string = '06:00'
): boolean {
  const now = new Date();
  const currentTime = format(now, 'HH:mm');

  // 시작 시간이 끝 시간보다 큰 경우 (예: 20:00 ~ 06:00)
  if (nightStart > nightEnd) {
    return currentTime >= nightStart || currentTime < nightEnd;
  }
  // 시작 시간이 끝 시간보다 작은 경우 (예: 00:00 ~ 06:00)
  return currentTime >= nightStart && currentTime < nightEnd;
}

/**
 * 알림 시간까지 남은 시간 (분)
 */
export function getMinutesUntilTime(time: string): number {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  const diff = target.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60));
}

/**
 * 오늘 날짜 (YYYY-MM-DD)
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * 시간에 오프셋(분)을 더해서 새 시간 반환
 * @param time "HH:MM" 형식의 시간
 * @param offsetMinutes 분 단위 오프셋 (양수: 이후, 음수: 이전)
 * @returns "HH:MM" 형식의 새 시간, 범위 벗어나면 null
 */
export function calculateTimeOffset(time: string, offsetMinutes: number): string | null {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + offsetMinutes;

  // 00:00 ~ 23:59 범위 체크
  if (totalMinutes < 0 || totalMinutes >= 24 * 60) {
    return null;
  }

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

/**
 * 현재 시간을 "HH:MM" 형식으로 반환
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}
