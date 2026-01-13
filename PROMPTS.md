# Claude CLI 개발 프롬프트 가이드

Family Message Board 프로젝트를 Claude CLI로 개발할 때 사용할 프롬프트 모음입니다.

---

## 📋 프로젝트 컨텍스트 (첫 시작 시)

```
나는 Family Message Board라는 PWA 앱을 개발하고 있어.

프로젝트 개요:
- 경도 인지 장애 어르신을 위한 디지털 메시지 보드
- 태블릿: 메시지 표시 + TTS 음성 재생
- 스마트폰: 가족이 메시지 작성

기술 스택:
- Next.js 14 (App Router, TypeScript)
- Supabase (DB, Realtime, Auth)
- Tailwind CSS + shadcn/ui
- PWA (next-pwa)
- Web Speech API (TTS)

개발 원칙:
- TypeScript strict 모드
- 큰 글씨 (최소 24pt)
- 큰 버튼 (최소 48x48px)
- 높은 색상 대비
- 접근성 (WCAG AA)

프로젝트 문서:
- PRD.md: 제품 요구사항 문서
- UJM.md: 사용자 여정 맵
- SETUP.md: 개발 환경 설정 가이드

지금부터 단계별로 개발을 시작할게.
```

---

## Phase 1: Supabase 클라이언트 설정

### 1.1 Supabase 클라이언트 (클라이언트 사이드)
```
src/lib/supabase/client.ts 파일을 만들어줘.

요구사항:
- createBrowserClient 사용
- 환경변수에서 URL, ANON_KEY 가져오기
- TypeScript로 작성
- 에러 처리 포함

코드 예시 구조:
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // 구현
}
```

### 1.2 Supabase 클라이언트 (서버 사이드)
```
src/lib/supabase/server.ts 파일을 만들어줘.

요구사항:
- createServerClient 사용
- cookies 처리
- TypeScript로 작성
```

### 1.3 데이터베이스 타입
```
src/types/database.ts 파일을 만들어줘.

다음 테이블의 TypeScript 타입을 정의:
1. Family
   - id: string (UUID)
   - name: string
   - code: string
   - created_at: string

2. User
   - id: string (UUID)
   - email: string
   - name: string
   - role: 'admin' | 'member'
   - relationship: string
   - family_id: string
   - created_at: string

3. Message
   - id: string (UUID)
   - author_id: string
   - family_id: string
   - content: string
   - priority: 'normal' | 'important' | 'urgent'
   - display_date: string
   - tts_enabled: boolean
   - tts_times: string[]
   - repeat_pattern: 'none' | 'daily' | 'weekly' | 'monthly'
   - is_dday: boolean
   - created_at: string

각 테이블에 대해 Insert, Update 타입도 정의해줘.
```

---

## Phase 2: 유틸리티 함수

### 2.1 공통 유틸
```
src/lib/utils.ts 파일을 만들어줘.

포함할 함수:
1. cn(...inputs: ClassValue[]): string
   - Tailwind 클래스 병합 (clsx + tailwind-merge)

2. formatDate(date: string | Date): string
   - "2026년 1월 12일 일요일" 형식

3. formatTime(time: string): string
   - "오후 3시 30분" 형식

4. calculateDday(targetDate: string): number
   - D-day 계산

5. getPriorityColor(priority: string): string
   - 중요도별 색상 반환
```

### 2.2 TTS 유틸
```
src/lib/tts/speech.ts 파일을 만들어줘.

Web Speech API를 사용한 TTS 클래스:

class TTSService {
  speak(text: string, options?: SpeechOptions): void
  stop(): void
  pause(): void
  resume(): void
}

interface SpeechOptions {
  voice?: 'male' | 'female'
  speed?: number (0.7 ~ 1.2)
  volume?: number (0 ~ 1)
  lang?: string ('ko-KR')
}

요구사항:
- Singleton 패턴
- 브라우저 지원 체크
- 에러 처리
- 한국어 음성 필터링
```

---

## Phase 3: 컴포넌트 (UI)

### 3.1 Button 컴포넌트
```
src/components/ui/button.tsx 파일을 만들어줘.

shadcn/ui Button 기반으로:

variants:
- default
- outline
- ghost
- tablet (큰 버튼, 최소 60px 높이)

sizes:
- sm (40px)
- md (48px)
- lg (60px)
- xl (72px) - 태블릿용

TypeScript로 작성, forwardRef 사용
```

### 3.2 MessageCard (태블릿용)
```
src/components/tablet/MessageCard.tsx 파일을 만들어줘.

Props:
- message: Message
- onPlay?: () => void

UI 요구사항:
- 큰 글씨 (제목 28pt, 본문 24pt)
- 중요도별 배경색
  - normal: #F5F5F5
  - important: #FFF9C4
  - urgent: #FFEBEE
- 테두리 4px
- 패딩 24px
- "🔊 지금 듣기" 버튼 (60px 높이)
- 작성자, 시간 표시 (회색, 18pt)

TypeScript + Tailwind CSS
```

### 3.3 MessageForm (스마트폰용)
```
src/components/mobile/MessageForm.tsx 파일을 만들어줘.

react-hook-form + zod 사용

필드:
- content: textarea (최대 500자)
- priority: select (normal/important/urgent)
- display_date: date picker
- tts_enabled: checkbox
- tts_times: time picker array

검증:
- content: 필수, 1~500자
- display_date: 필수, 오늘 이후

제출 시 Supabase에 INSERT

TypeScript로 작성
```

---

## Phase 4: 커스텀 훅

### 4.1 useMessages
```
src/hooks/useMessages.ts 파일을 만들어줘.

메시지 CRUD + Realtime 구독을 위한 훅:

interface UseMessagesReturn {
  messages: Message[]
  loading: boolean
  error: Error | null
  createMessage: (data: MessageInsert) => Promise<void>
  updateMessage: (id: string, data: MessageUpdate) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

요구사항:
- Supabase Realtime 구독
- 오늘 날짜 메시지만 필터링
- 중요도별 정렬 (urgent > important > normal)
- 에러 처리
- 컴포넌트 언마운트 시 구독 해제
```

### 4.2 useTTS
```
src/hooks/useTTS.ts 파일을 만들어줘.

TTS 기능을 위한 훅:

interface UseTTSReturn {
  speak: (text: string, options?: SpeechOptions) => void
  stop: () => void
  isSpeaking: boolean
  isSupported: boolean
}

TTSService 클래스 사용
브라우저 지원 체크 포함
```

### 4.3 useNotifications
```
src/hooks/useNotifications.ts 파일을 만들어줘.

Service Worker 기반 알림을 위한 훅:

interface UseNotificationsReturn {
  requestPermission: () => Promise<void>
  scheduleNotification: (message: Message) => Promise<void>
  permission: NotificationPermission
}

요구사항:
- Notification API 권한 요청
- Service Worker 등록 확인
- 스케줄링 (시간 도래 시 알림)
```

---

## Phase 5: 페이지

### 5.1 태블릿 디스플레이 페이지
```
src/app/(tablet)/display/page.tsx 파일을 만들어줘.

태블릿 전용 메시지 표시 화면:

레이아웃:
- 헤더: 날짜, 시간, 날씨 (32pt)
- 액션 바: "전체 읽어주기", "설정" 버튼
- 메시지 리스트: MessageCard 컴포넌트들
- 스크롤 가능

기능:
- useMessages 훅으로 메시지 조회
- useTTS 훅으로 음성 재생
- 야간 모드 (20:00~06:00 블랙 스크린)

TypeScript + Tailwind
Server Component로 작성
```

### 5.2 스마트폰 메시지 작성 페이지
```
src/app/(mobile)/messages/new/page.tsx 파일을 만들어줘.

메시지 작성 화면:

레이아웃:
- 헤더: "← 새 메시지"
- MessageForm 컴포넌트
- 제출 버튼 (하단 고정)

기능:
- 폼 제출 시 Supabase INSERT
- 성공 시 "/" 페이지로 리다이렉트
- 에러 시 토스트 메시지

TypeScript
```

### 5.3 스마트폰 홈 페이지
```
src/app/(mobile)/page.tsx 파일을 만들어줘.

가족용 홈 화면:

섹션:
1. 어머니 상태 (온라인/오프라인, 마지막 확인 시간)
2. "+ 새 메시지 작성" 버튼
3. 오늘의 메시지 리스트 (수정/삭제 가능)
4. 이번 주 통계

기능:
- useMessages 훅으로 메시지 조회
- 실시간 동기화
- 메시지 삭제 확인 다이얼로그

TypeScript + Tailwind
```

---

## Phase 6: API Routes

### 6.1 메시지 API
```
src/app/api/messages/route.ts 파일을 만들어줘.

GET /api/messages
- Query: date (optional)
- Response: Message[]
- 가족 구성원만 조회 가능 (RLS)

POST /api/messages
- Body: MessageInsert
- Response: Message
- 작성자 ID 자동 설정
```

```
src/app/api/messages/[id]/route.ts 파일을 만들어줘.

PATCH /api/messages/:id
- Body: Partial<MessageUpdate>
- Response: Message
- 본인 메시지만 수정 가능

DELETE /api/messages/:id
- Response: { success: boolean }
- 본인 메시지만 삭제 가능
```

---

## Phase 7: PWA 설정

### 7.1 Service Worker
```
public/sw.js 파일을 만들어줘.

기능:
1. 캐싱 전략
   - 페이지: Network First
   - 이미지: Cache First
   - API: Network Only

2. 푸시 알림 수신
   - push 이벤트 리스너
   - notification 표시

3. 백그라운드 동기화
   - 오프라인 시 메시지 큐잉
   - 온라인 복귀 시 전송
```

### 7.2 Web App Manifest
```
public/manifest.json 파일을 만들어줘.

설정:
- name: "Family Message Board"
- short_name: "Family Board"
- display: "standalone"
- orientation: "portrait"
- theme_color: "#000000"
- background_color: "#ffffff"
- icons: 192x192, 512x512
```

---

## 🎯 개발 순서 요약

```
1단계: 기본 설정
├─ Supabase 클라이언트 설정
├─ 타입 정의
└─ 유틸리티 함수

2단계: UI 컴포넌트
├─ Button, Card 등 기본 UI
├─ MessageCard (태블릿)
└─ MessageForm (스마트폰)

3단계: 훅 & 로직
├─ useMessages (CRUD + Realtime)
├─ useTTS (음성 재생)
└─ useNotifications (알림)

4단계: 페이지
├─ 태블릿 디스플레이
├─ 스마트폰 홈
└─ 메시지 작성

5단계: API
├─ 메시지 CRUD API
└─ 인증 확인

6단계: PWA
├─ Service Worker
├─ Manifest
└─ 푸시 알림

7단계: 테스트 & 배포
├─ 기능 테스트
├─ 실제 기기 테스트
└─ Vercel 배포
```

---

## 💡 프롬프트 작성 팁

### 좋은 프롬프트 예시
```
"src/components/tablet/NightMode.tsx 파일을 만들어줘.

기능:
- 20:00~06:00 사이 블랙 스크린 표시
- 터치 시 즉시 해제
- 서서히 어두워지는 애니메이션 (3초)

UI:
- 전체 화면 (#000000)
- 중앙에 "화면을 터치하면 깨어납니다" (흰색, 18pt)
- 애니메이션: opacity 0 → 1

TypeScript + Tailwind
React.memo 사용해서 최적화"
```

### 나쁜 프롬프트 예시
```
"야간 모드 만들어줘"
```

---

## 🔍 디버깅 프롬프트

### 에러 해결
```
"다음 에러가 발생했어:
[에러 메시지 복사]

파일: src/hooks/useMessages.ts
예상 원인: Realtime 구독 해제 안 됨

어떻게 수정해야 할까?"
```

### 코드 리뷰 요청
```
"src/components/tablet/MessageCard.tsx 파일을 리뷰해줘.

체크 포인트:
- TypeScript strict 모드 준수
- 접근성 (ARIA)
- 성능 최적화 (useMemo, useCallback)
- 큰 글씨 (24pt 이상)
- 에러 처리

개선점 알려줘."
```

---

**작성일**: 2026년 1월 12일  
**버전**: 1.0
