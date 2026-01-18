# Family Message Board - 개발 TODO

> 경도 인지 장애 어르신을 위한 디지털 메시지 보드 PWA

**시작일**: 2026년 1월 13일
**목표**: MVP 완성
**현재 상태**: v1.1 버그 수정 및 UI 개선 완료 (2026년 1월 18일)

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
**최종 업데이트**: 2026년 1월 18일
**버전**: 1.1 (버그 수정 및 UI 개선)
