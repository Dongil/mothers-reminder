// 비밀번호 정책 유틸리티
// v1.5: 최소 8자, 영문+숫자 필수

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 비밀번호 정책 검증
 * - 최소 8자 이상
 * - 영문자 최소 1개 포함
 * - 숫자 최소 1개 포함
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push('비밀번호를 입력해주세요');
    return { valid: false, errors };
  }

  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('비밀번호에 영문자를 포함해야 합니다');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호에 숫자를 포함해야 합니다');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 비밀번호 정책 안내 메시지
 */
export const PASSWORD_POLICY_MESSAGE = '비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다';
