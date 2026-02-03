# 변경 이력 (Changelog)

> Family Message Board (엄마 알리미) 버전별 변경 내역

모든 주요 변경 사항은 이 파일에 기록됩니다.

---

## [1.6.0] - 2026-02-03

### 프로젝트 정리 및 문서화

#### Added (추가)
- 시스템 아키텍처 문서 (`ARCHITECTURE.md`)
- 배포 가이드 문서 (`DEPLOYMENT.md`)
- 사용자 메뉴얼 (`docs/USER-MANUAL.md`)
- 간단 메뉴얼 (`docs/QUICK-GUIDE.md`)
- 설정 페이지 사용 가이드 섹션 (`QuickGuideSection.tsx`)

#### Changed (변경)
- 6개 핵심 파일에 상세 JSDoc 주석 추가
- `README.md` 프로젝트 소개 보완

#### Removed (제거)
- 불필요한 console.log 디버그 로그 약 50개 제거
  - `send-notification.ts`: [Push] 디버그 로그
  - `usePushNotification.ts`: [Push] 디버그 로그
  - `middleware.ts`: [Admin Check] 로그

#### Fixed (수정)
- 설정 페이지 사용 가이드 섹션 시인성 개선
  - 제목/아이콘 색상 강조 (`text-gray-900`, `text-blue-600`)
  - 설명 텍스트 가독성 향상 (`text-gray-700`, `leading-relaxed`)

---

## [1.5.6] - 2026-02-03

### UI 수정

#### Changed (변경)
- `/messages/manage`: 작성자 정보와 TTS 알람 시간 같은 줄 표시
- `/messages/manage`: 하단에 "새 메시지 작성" 버튼 항상 표시
- `/messages/new`: URL date 파라미터를 기본 날짜로 설정
- `/messages/calendar`: 월 변경 상태 URL 저장 (`?month=yyyy-MM`)

#### Fixed (수정)
- `supabase` 클라이언트 불필요한 재생성 방지 (`useMemo`)
- 로딩 중 카운터 깜빡임 방지

---

## [1.5.5] - 2026-02-02

### 반복 메시지 시스템

#### Added (추가)
- 주간 반복 메시지 지원 (요일 선택)
- `repeat-utils.ts`: 반복 메시지 유틸리티 함수
- `WeekdaySelector.tsx`: 요일 선택 UI 컴포넌트
- `/messages/repeat`: 반복 메시지 관리 페이지
- "오늘만 건너뛰기" 기능 (skip_dates)
- 가족 관리자 메시지 수정/삭제 권한

#### Changed (변경)
- `MessageForm.tsx`: 반복 설정 섹션 추가
- `/home`, `/display`: 반복 메시지 필터링 적용

#### Fixed (수정)
- 활성 가족 변경 후 메시지가 이전 가족으로 추가되는 버그
- Realtime UPDATE 시 author 정보 유실

---

## [1.5.4] - 2026-01-31

### UI 개선

#### Changed (변경)
- 참여 요청 카드 시인성 향상 (amber 색상)
- 가족 카드에 관리자 이름, 멤버 목록 표시
- 메시지 카드에 알람 횟수, 작성자 정보 표시
- 활성 가족 변경 시 애니메이션 효과

#### Added (추가)
- 메시지 수정/삭제 권한 제어 (본인 메시지만)

---

## [1.5.3] - 2026-01-31

### 새 메시지 푸시 알림

#### Added (추가)
- 새 메시지 작성 시 가족 멤버에게 푸시 알림
- `sendPushToFamilyMembers()` 함수
- 알림 설정 (새 메시지, 참여 요청 on/off)
- `NotificationSettingsSection.tsx` 컴포넌트

#### Changed (변경)
- 커스텀 Service Worker (`public/sw.js`)
- `useMessages.ts`: API 라우트 호출로 변경

---

## [1.5.2] - 2026-01-30

### 가족 참여 요청 푸시 알림

#### Added (추가)
- `push_subscriptions` 테이블
- `web-push` 패키지
- Service Worker 푸시 핸들러
- `usePushNotification` 훅
- 가족 참여 요청/수락/거절 시 푸시 알림

---

## [1.5.1] - 2026-01-30

### 비밀번호 변경 및 프라이버시 수정

#### Added (추가)
- 설정 페이지 비밀번호 변경 기능
- `/api/auth/change-password` API

#### Fixed (수정)
- 가족 미참여 사용자에게 다른 가족 메시지 노출 버그

---

## [1.5.0] - 2026-01-30

### 인증 개선 및 시스템 관리자 대시보드

#### Added (추가)
- 비밀번호 정책 (8자 이상, 영문+숫자)
- 로그인 시도 제한 (5회 실패 시 10분 잠금)
- 비밀번호 찾기/재설정 기능
- 이메일 찾기 기능
- 회원 탈퇴 (소프트 삭제, 30일 유예)
- 시스템 관리자 대시보드 (`/admin/*`)
- 감사 로그, TTS 사용량 로그

#### Changed (변경)
- 관리자 테이블 및 권한 시스템

---

## [1.4.0] - 2026-01-28

### 다중 가족 지원 및 설정 페이지

#### Added (추가)
- 다중 가족 지원 (생성, 참여 요청, 활성 가족 선택)
- `/settings` 설정 페이지
- TTS 음성 선택 (8가지)
- 야간 모드 시간 설정
- 가족 멤버 역할 (관리자/일반)

#### Changed (변경)
- 회원가입에 성별, 닉네임 추가
- 헤더에 활성 가족명 표시

---

## [1.3.0] - 2026-01-22

### 디스플레이 기능 개선

#### Added (추가)
- 메시지 표시 시간 기능 (`display_time`)
- 시간순 메시지 정렬 로직
- 자정 감지 및 날짜 갱신 (`useDateRefresh`)
- 자동 스크롤 기능
- `/messages/manage`: 날짜별 메시지 관리
- `/messages/calendar`: 달력 형태 내역

#### Fixed (수정)
- 자정 후 날짜 업데이트 안되는 문제
- 내일 메시지가 오늘 목록에 표시되는 문제

---

## [1.1.0] - 2026-01-18

### 버그 수정 및 UI 개선

#### Fixed (수정)
- 모바일 메시지 작성 실패 (Supabase 세션)
- 메시지 삭제 후 UI 즉시 업데이트

#### Changed (변경)
- 전체 페이지 시인성 개선 (헤더, 라벨, 버튼 색상)
- display 페이지 메시지 폰트 100px
- PWA 네비게이션 개선

#### Added (추가)
- 로그아웃 기능
- Wake Lock API (화면 꺼짐 방지)

---

## [1.0.0] - 2026-01-17

### MVP 출시

#### Added (추가)
- 메시지 CRUD (작성, 조회, 수정, 삭제)
- Supabase Realtime 실시간 동기화
- Google Cloud TTS 한국어 음성
- 시간 기반 알림 스케줄링
- 야간 모드 (20:00 - 06:00)
- PWA 지원 (설치, 오프라인)
- 태블릿 디스플레이 화면 (`/display`)
- 스마트폰 관리 화면 (`/home`)
- 이메일/비밀번호 인증

---

## 버전 규칙

- **MAJOR.MINOR.PATCH** 형식
- MAJOR: 대규모 기능 변경
- MINOR: 새 기능 추가
- PATCH: 버그 수정, UI 개선

---

**최초 작성**: 2026년 2월 3일
