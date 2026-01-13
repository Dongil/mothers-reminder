# Family Message Board - 개발 TODO

> 경도 인지 장애 어르신을 위한 디지털 메시지 보드 PWA

**시작일**: 2026년 1월 13일
**목표**: MVP 완성

---

## Phase 0: 프로젝트 초기화

### 환경 설정
- [ ] Git 저장소 초기화
- [ ] `.gitignore` 설정
- [ ] Next.js 14 프로젝트 생성 (App Router, TypeScript)
- [ ] 필수 패키지 설치
  - [ ] `@supabase/supabase-js`, `@supabase/ssr`
  - [ ] `next-pwa`
  - [ ] `@radix-ui/react-*`, `class-variance-authority`, `clsx`, `tailwind-merge`
  - [ ] `react-hook-form`, `@hookform/resolvers`, `zod`
  - [ ] `date-fns`, `lucide-react`

### 환경변수 설정 (.env.local)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 입력
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 입력 (서버용)

---

## Phase 1: Supabase 설정

### 데이터베이스
- [ ] `family` 테이블 생성
- [ ] `users` 테이블 생성 (auth.users 연동)
- [ ] `messages` 테이블 생성
- [ ] `notifications` 테이블 생성
- [ ] `settings` 테이블 생성
- [ ] 인덱스 생성

### 보안
- [ ] RLS (Row Level Security) 활성화
- [ ] 테이블별 RLS 정책 생성
  - [ ] family: 가족 구성원만 조회
  - [ ] users: 같은 가족만 조회, 본인만 수정
  - [ ] messages: 가족 구성원 조회/작성, 본인만 수정/삭제
  - [ ] notifications: 본인만 조회
  - [ ] settings: 본인만 관리

### Realtime
- [ ] `messages` 테이블 Realtime 활성화

### 클라이언트 설정
- [ ] `src/lib/supabase/client.ts` - 클라이언트용
- [ ] `src/lib/supabase/server.ts` - 서버용
- [ ] `src/types/database.ts` - 타입 정의

---

## Phase 2: 기본 UI 컴포넌트

### 공통 컴포넌트 (shadcn/ui 기반)
- [ ] `src/components/ui/button.tsx`
  - variants: default, outline, ghost, tablet (큰 버튼)
  - sizes: sm, md, lg, xl
- [ ] `src/components/ui/card.tsx`
- [ ] `src/components/ui/input.tsx`
- [ ] `src/components/ui/textarea.tsx`
- [ ] `src/components/ui/select.tsx`
- [ ] `src/components/ui/checkbox.tsx`
- [ ] `src/components/ui/dialog.tsx`
- [ ] `src/components/ui/toast.tsx`

### 유틸리티
- [ ] `src/lib/utils.ts`
  - `cn()` - Tailwind 클래스 병합
  - `formatDate()` - "2026년 1월 12일 일요일"
  - `formatTime()` - "오후 3시 30분"
  - `calculateDday()` - D-day 계산
  - `getPriorityColor()` - 중요도별 색상

---

## Phase 3: 핵심 기능

### 메시지 CRUD
- [ ] `src/hooks/useMessages.ts`
  - 메시지 조회 (오늘 날짜 필터)
  - 메시지 생성
  - 메시지 수정
  - 메시지 삭제
  - Realtime 구독

### API Routes
- [ ] `src/app/api/messages/route.ts` - GET, POST
- [ ] `src/app/api/messages/[id]/route.ts` - PATCH, DELETE

### TTS (Text-to-Speech)
- [ ] `src/lib/tts/speech.ts`
  - TTSService 클래스
  - `speak()`, `stop()`, `pause()`, `resume()`
  - 한국어 여성 음성
  - 속도 조절 (느림)
- [ ] `src/hooks/useTTS.ts`

### 시간 기반 알림
- [ ] `src/hooks/useNotifications.ts`
  - 알림 권한 요청
  - 알림 스케줄링
  - 차임벨 + TTS 재생

---

## Phase 4: 화면 구현

### 태블릿 컴포넌트
- [ ] `src/components/tablet/MessageCard.tsx`
  - 큰 글씨 (제목 28pt, 본문 24pt)
  - 중요도별 배경색
  - "듣기" 버튼 (60px 높이)
- [ ] `src/components/tablet/NightMode.tsx`
  - 20:00~06:00 블랙 스크린
  - 터치 시 해제
- [ ] `src/components/tablet/Header.tsx`
  - 날짜, 시간, 날씨

### 스마트폰 컴포넌트
- [ ] `src/components/mobile/MessageForm.tsx`
  - 내용, 중요도, 날짜, 알림 시간
  - react-hook-form + zod 검증
- [ ] `src/components/mobile/MessageList.tsx`
  - 메시지 목록 + 수정/삭제

### 페이지
- [ ] `src/app/(tablet)/display/page.tsx`
  - 메시지 보드 메인 화면
  - 자동 TTS 재생
  - 야간 모드
- [ ] `src/app/(mobile)/page.tsx`
  - 가족용 홈 (대시보드)
- [ ] `src/app/(mobile)/messages/new/page.tsx`
  - 메시지 작성
- [ ] `src/app/(mobile)/messages/[id]/edit/page.tsx`
  - 메시지 수정

### 인증 (간단히)
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] 가족 코드로 가입/로그인

---

## Phase 5: PWA 설정

### Manifest
- [ ] `public/manifest.json`
  - name, short_name, icons
  - display: standalone
  - orientation: portrait

### 아이콘
- [ ] `public/icons/icon-192x192.png`
- [ ] `public/icons/icon-512x512.png`

### Service Worker
- [ ] `next.config.js` - next-pwa 설정
- [ ] 캐싱 전략
  - 페이지: Network First
  - 이미지: Cache First
  - API: Network Only

### 알림음
- [ ] `public/sounds/chime.mp3` - 차임벨
- [ ] `public/sounds/alert.mp3` - 긴급 알림

---

## Phase 6: 테스트 및 배포

### 기능 테스트
- [ ] 메시지 CRUD 테스트
- [ ] TTS 재생 테스트
- [ ] 알림 시간 정확도 테스트
- [ ] 야간 모드 테스트
- [ ] Realtime 동기화 테스트

### 실제 기기 테스트
- [ ] 갤럭시 탭 7 FE 테스트
  - 화면 크기, 글씨 크기
  - TTS 음성 품질
  - 장시간 켜놓기
- [ ] 스마트폰 테스트 (Android/iOS)

### 배포
- [ ] Vercel 프로젝트 생성
- [ ] 환경변수 설정
- [ ] 배포 및 도메인 확인
- [ ] PWA 설치 테스트

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
| [ADVANCED-TOOLS.md](./ADVANCED-TOOLS.md) | MCP, Subagent, Skills |

---

**작성일**: 2026년 1월 13일
**버전**: 1.0
