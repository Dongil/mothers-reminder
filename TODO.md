# Family Message Board - 개발 TODO

> 경도 인지 장애 어르신을 위한 디지털 메시지 보드 PWA

**시작일**: 2026년 1월 13일
**목표**: MVP 완성
**현재 상태**: v1.3 /display 페이지 기능 개선 완료 (2026년 1월 22일)

---

## Phase 0: 프로젝트 초기화 ✅

### 환경 설정
- [x] Git 저장소 초기화
- [x] `.gitignore` 설정
- [x] Next.js 14 프로젝트 생성 (App Router, TypeScript)
- [x] 필수 패키지 설치
  - [x] `@supabase/supabase-js`, `@supabase/ssr`
  - [x] `next-pwa`
  - [x] `class-variance-authority`, `clsx`, `tailwind-merge`
  - [x] `react-hook-form`, `@hookform/resolvers`, `zod`
  - [x] `date-fns`, `lucide-react`

### 환경변수 설정 (.env.local)
- [x] `.env.example` 템플릿 생성
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 입력 (배포 시)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력 (배포 시)

---

## Phase 1: Supabase 설정 ✅

### 데이터베이스
- [x] `src/types/database.ts` - 타입 정의
- [x] `supabase/schema.sql` - 스키마 파일 생성
- [ ] Supabase에서 SQL 실행 (배포 시)

### 클라이언트 설정
- [x] `src/lib/supabase/client.ts` - 클라이언트용
- [x] `src/lib/supabase/server.ts` - 서버용
- [x] `src/lib/supabase/middleware.ts` - 미들웨어

---

## Phase 2: 기본 UI 컴포넌트 ✅

### 공통 컴포넌트
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/card.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/components/ui/textarea.tsx`
- [x] `src/components/ui/label.tsx`
- [x] `src/components/ui/badge.tsx`

### 유틸리티
- [x] `src/lib/utils.ts`
  - `cn()` - Tailwind 클래스 병합
  - `formatDate()` - "2026년 1월 12일 일요일"
  - `formatTime()` - "오후 3시 30분"
  - `calculateDday()` - D-day 계산
  - `getPriorityColor()` - 중요도별 색상

---

## Phase 3: 핵심 기능 ✅

### 메시지 CRUD
- [x] `src/hooks/useMessages.ts`
  - 메시지 조회 (오늘 날짜 필터)
  - 메시지 생성
  - 메시지 수정
  - 메시지 삭제
  - Realtime 구독

### API Routes
- [x] `src/app/api/messages/route.ts` - GET, POST
- [x] `src/app/api/messages/[id]/route.ts` - GET, PATCH, DELETE

### TTS (Text-to-Speech)
- [x] `src/lib/tts/speech.ts`
  - TTSService 클래스
  - `speak()`, `stop()`, `pause()`, `resume()`
  - 한국어 음성
  - 속도 조절
- [x] `src/hooks/useTTS.ts`

### 시간 기반 알림
- [x] `src/hooks/useNotifications.ts`
  - 알림 권한 요청
  - 알림 스케줄링
  - 차임벨 + TTS 재생
- [x] `useNightMode` - 야간 모드 훅

---

## Phase 4: 화면 구현 ✅

### 태블릿 컴포넌트
- [x] `src/components/tablet/MessageCard.tsx`
- [x] `src/components/tablet/NightMode.tsx`
- [x] `src/components/tablet/Header.tsx`

### 스마트폰 컴포넌트
- [x] `src/components/mobile/MessageForm.tsx`
- [x] `src/components/mobile/MessageList.tsx`

### 페이지
- [x] `src/app/(tablet)/display/page.tsx` - 메시지 보드
- [x] `src/app/(mobile)/home/page.tsx` - 가족용 대시보드
- [x] `src/app/(mobile)/messages/new/page.tsx` - 메시지 작성
- [x] `src/app/(mobile)/messages/[id]/edit/page.tsx` - 메시지 수정
- [x] `src/app/(auth)/login/page.tsx` - 로그인/회원가입

---

## Phase 5: PWA 설정 ✅

### Manifest
- [x] `public/manifest.json`

### 아이콘
- [x] `public/icons/icon.svg` - SVG 아이콘 (manifest에서 직접 사용)
- [x] ~~PNG 아이콘~~ - SVG 사용으로 불필요

### Service Worker
- [x] `next.config.ts` - next-pwa 설정
- [x] 캐싱 전략 설정

### 알림음
- [x] `public/sounds/chime.mp3` - 차임벨
- [x] `public/sounds/alert.mp3` - 긴급 알림

---

## Phase 6: 테스트 및 배포 ✅

### 기능 테스트
- [x] 메시지 CRUD 테스트
- [x] TTS 재생 테스트 (Google 한국의 음성)
- [x] 알림 시간 정확도 테스트 (예약 알림)
- [x] 야간 모드 테스트
- [x] Realtime 동기화 테스트

### 실제 기기 테스트
- [x] 갤럭시 탭 7 FE 테스트 (삼성 인터넷 + Cloud TTS)
- [x] Chrome 브라우저 테스트

### 배포
- [x] Vercel 배포 완료
- [x] 환경변수 설정
- [x] Supabase 스키마 적용
- [x] RLS 정책 설정 (단순화 버전)
- [x] PWA 설치 테스트

---

## 배포 체크리스트 ✅

### 1. Supabase 설정 ✅
```bash
# supabase/schema.sql - 테이블 생성
# supabase/rls-policies-v2.sql - RLS 정책 (단순화 버전)
```

### 2. Vercel 배포 ✅
```bash
# Vercel에 배포 완료
```

### 3. 환경변수 설정 ✅
- `NEXT_PUBLIC_SUPABASE_URL` - 설정됨
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 설정됨

### 4. 리소스 ✅
- `public/icons/icon.svg` - SVG 아이콘 사용
- `public/sounds/chime.mp3`, `alert.mp3` - 추가됨

---

## v1.1: 버그 수정 및 UI 개선 ✅ (2026년 1월 18일)

### 버그 수정
- [x] 모바일 메시지 작성 실패 수정 (Supabase 세션 localStorage 기반으로 변경)
- [x] 메시지 삭제 후 UI 즉시 업데이트
- [x] Supabase Realtime 구독 개선 (familyId 없이도 작동)

### UI 개선
- [x] 전체 페이지 시인성 개선 (헤더, 라벨, 버튼 색상 진하게)
- [x] display 페이지 메시지 폰트 100px로 증가
- [x] Input/Textarea 텍스트 색상 진하게

### 기능 추가
- [x] 로그아웃 기능 추가
- [x] 루트 페이지 /login 리다이렉트
- [x] /display 실시간 메시지 동기화

### PWA 네비게이션 개선
- [x] PWA 시작 페이지 로직 개선 (인증 확인 → 마지막 방문 페이지 → 기기 타입)
- [x] /home ↔ /display 페이지 전환 버튼 추가
- [x] 마지막 방문 페이지 localStorage 저장

### 디스플레이 기능 개선
- [x] Wake Lock API로 /display 화면 꺼짐 방지 (DID 디스플레이처럼)

### 반응형 UI 개선 (2026년 1월 19일)
- [x] /display 페이지 휴대폰에서 메시지 미리보기 가능하도록 수정
  - [x] MessageCard.tsx 메시지 폰트 반응형 (휴대폰 30px, 태블릿 100px)
  - [x] MessageCard.tsx "듣기" 버튼 크기 반응형 (휴대폰 작게, 태블릿 크게)
  - [x] Header.tsx flex-wrap, 폰트 크기 반응형, 날짜/시간 모바일 레이아웃
  - [x] display/page.tsx 패딩, 오버레이, footer 텍스트 반응형
- [x] PWA orientation "any"로 변경 (가로/세로 모두 지원)

---

## v1.3: /display 페이지 기능 개선 ✅ (2026년 1월 22일)

### DB 스키마 변경
- [x] `display_time` 필드 추가 (HH:MM 형식, NULL = 종일)
- [x] `supabase/migrations/add_display_time.sql` 마이그레이션 파일

### 메시지 표시 시간 기능
- [x] MessageForm에 표시 시간 입력 UI 추가
  - [x] 시간 입력이 기본값 (09:00)
  - [x] "종일" 버튼으로 종일 표시 전환
- [x] 알림 바로가기 버튼 (-60, -30, -15, -10, -5, 정각, +5, +10분)
- [x] 메시지 생성/수정 시 display_time 저장

### 시간순 정렬 로직
- [x] useMessages.ts 정렬 로직 수정
  - 1순위: 현재 시간 이후 메시지 (시간순 오름차순)
  - 2순위: 종일 메시지 (priority DESC, created_at DESC)
  - 3순위: 지나간 메시지 (시간순 내림차순)
- [x] 매 분마다 정렬 갱신

### 자정 감지 기능
- [x] `useDateRefresh` 훅 생성
  - 자정까지 남은 시간 계산 후 타이머 설정
  - 탭 포커스 시에도 날짜 확인
- [x] /display, /home 페이지에 자정 감지 적용
- [x] 날짜 변경 시 메시지 자동 새로고침

### 자동 스크롤 기능
- [x] /display 페이지 매 분마다 현재 시간 확인
- [x] 해당 시간 메시지가 있으면 자동 스크롤
- [x] MessageCard에 id 속성 추가

### 메시지 관리 페이지
- [x] `/messages/manage` - 날짜별 메시지 관리
  - 날짜 선택기 (이전/다음 버튼 + date input)
  - 해당 날짜 메시지 목록
  - 수정/삭제 기능
- [x] `/messages/calendar` - 달력 형태 내역
  - 월별 달력 표시
  - 메시지 개수 표시 (1-2개: 파란색, 3개 이상: 빨간색)
  - 날짜 클릭 시 관리 페이지로 이동

### UI 개선
- [x] /home 페이지에 달력/관리 네비게이션 버튼 추가
- [x] MessageCard에 표시 시간 표시
- [x] 달력/관리 페이지 버튼 시인성 개선

### 개발 환경
- [x] package.json dev 스크립트에 --webpack 플래그 추가 (Turbopack Windows 호환성 문제)

---

## 향후 로드맵 (MVP 이후)

### v1.5 - 추가 기능
- [ ] FCM 푸시 알림 (가족에게)
- [ ] 사진 첨부
- [ ] 기념일 자동 알림
- [ ] 날씨 정보 연동

### v2.0 - AI 음성 채팅
- [ ] Claude API 연동
- [ ] "오늘 뭐 해야 해?" 질문/응답
- [ ] 음성 명령

### v2.5 - 인지 기능 지원
- [ ] 기억력 게임
- [ ] 가족 사진 퀴즈

### v3.0 - 건강 데이터
- [ ] 혈압, 혈당 기록
- [ ] 복약 관리
- [ ] 병원 예약 연동

---

## 참고 문서

| 문서 | 설명 |
|------|------|
| [UJM.md](./UJM.md) | 사용자 여정 맵 |
| [PRD.md](./PRD.md) | 제품 요구사항 |
| [SETUP.md](./SETUP.md) | 개발 환경 설정 |
| [PROMPTS.md](./PROMPTS.md) | 개발 프롬프트 가이드 |

---

**작성일**: 2026년 1월 13일
**최종 업데이트**: 2026년 1월 22일
**버전**: 1.3 (/display 페이지 기능 개선)
