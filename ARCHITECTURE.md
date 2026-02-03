# 시스템 아키텍처

> Family Message Board (엄마 알리미) - 경도 인지 장애 어르신을 위한 디지털 메시지 보드

## 개요

이 문서는 Family Message Board 시스템의 전체 아키텍처를 설명합니다.

---

## 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                         사용자 디바이스                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐              ┌─────────────────────┐          │
│   │   태블릿     │              │     스마트폰         │          │
│   │ (/display)  │              │ (/home, /settings)  │          │
│   │             │              │ (/messages/*)       │          │
│   │ • 메시지 표시 │              │ • 메시지 작성/관리    │          │
│   │ • TTS 재생   │              │ • 가족 관리          │          │
│   │ • 야간 모드   │              │ • 설정              │          │
│   └─────────────┘              └─────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                          │
│                         (Vercel)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  App Router │    │ API Routes  │    │   PWA       │        │
│   │             │    │             │    │             │        │
│   │ • SSR/RSC   │    │ • /api/*    │    │ • SW        │        │
│   │ • 라우팅    │    │ • REST API  │    │ • 오프라인   │        │
│   │ • 레이아웃  │    │ • 인증 체크  │    │ • Push      │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Supabase Backend                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │ PostgreSQL  │    │  Realtime   │    │    Auth     │        │
│   │             │    │             │    │             │        │
│   │ • 데이터 저장│    │ • WebSocket │    │ • JWT       │        │
│   │ • RLS       │    │ • 실시간     │    │ • 이메일 인증│        │
│   │ • 마이그레이션│   │ • 변경 감지  │    │ • 비번 재설정│        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       외부 서비스                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐                           │
│   │ Google TTS  │    │  Web Push   │                           │
│   │             │    │             │                           │
│   │ • 한국어 음성│    │ • VAPID     │                           │
│   │ • 8가지 보이스│   │ • 브라우저 알림│                          │
│   └─────────────┘    └─────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 폴더 구조

```
mothers-reminder/
├── public/                    # 정적 파일
│   ├── icons/                 # PWA 아이콘
│   ├── sounds/                # 알림음 (chime, alert)
│   ├── sw.js                  # Service Worker
│   └── manifest.json          # PWA 매니페스트
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 인증 페이지 그룹
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   │
│   │   ├── (mobile)/          # 모바일 페이지 그룹
│   │   │   ├── home/
│   │   │   ├── settings/
│   │   │   └── messages/
│   │   │       ├── new/
│   │   │       ├── [id]/edit/
│   │   │       ├── manage/
│   │   │       ├── calendar/
│   │   │       └── repeat/
│   │   │
│   │   ├── (tablet)/          # 태블릿 페이지 그룹
│   │   │   └── display/
│   │   │
│   │   ├── admin/             # 관리자 페이지
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── families/
│   │   │   └── audit-logs/
│   │   │
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # 인증 관련
│   │   │   ├── messages/      # 메시지 CRUD
│   │   │   ├── families/      # 가족 관리
│   │   │   ├── settings/      # 설정
│   │   │   ├── tts/           # TTS API
│   │   │   ├── push-subscriptions/
│   │   │   └── admin/         # 관리자 API
│   │   │
│   │   └── auth/callback/     # OAuth 콜백
│   │
│   ├── components/            # React 컴포넌트
│   │   ├── ui/                # 기본 UI 컴포넌트
│   │   ├── mobile/            # 모바일 전용
│   │   ├── tablet/            # 태블릿 전용
│   │   └── settings/          # 설정 페이지
│   │
│   ├── hooks/                 # Custom Hooks
│   │   ├── useMessages.ts     # 메시지 CRUD
│   │   ├── useUser.ts         # 사용자 인증
│   │   ├── useSettings.ts     # 설정 관리
│   │   ├── useNotifications.ts # TTS/알림
│   │   ├── useFamilies.ts     # 가족 관리
│   │   └── usePushNotification.ts
│   │
│   ├── lib/                   # 유틸리티
│   │   ├── supabase/          # Supabase 클라이언트
│   │   ├── push/              # 푸시 알림
│   │   ├── auth/              # 인증 유틸
│   │   ├── logging/           # 로깅
│   │   ├── utils.ts           # 공통 유틸
│   │   └── repeat-utils.ts    # 반복 메시지
│   │
│   └── types/                 # TypeScript 타입
│       └── database.ts        # DB 스키마 타입
│
├── supabase/                  # Supabase 설정
│   ├── schema.sql             # 초기 스키마
│   └── migrations/            # 마이그레이션
│
└── scripts/                   # 빌드 스크립트
    └── add-push-to-sw.js      # SW 푸시 핸들러 추가
```

---

## 데이터 흐름

### 1. 메시지 생성 흐름

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 스마트폰  │───►│ API Route│───►│ Supabase │───►│  태블릿   │
│ 메시지   │    │ /api/    │    │ Realtime │    │ /display │
│ 작성     │    │ messages │    │          │    │          │
└──────────┘    └────┬─────┘    └──────────┘    └──────────┘
                     │
                     ▼
              ┌──────────┐
              │ Web Push │
              │ 가족에게  │
              │ 알림 발송 │
              └──────────┘
```

### 2. TTS 재생 흐름

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ 태블릿   │───►│ API Route│───►│ Google   │───►│  Audio   │
│ 듣기    │    │ /api/tts │    │ Cloud TTS│    │  재생    │
│ 버튼 클릭│    │          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 3. 실시간 동기화 흐름

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Supabase │    │ WebSocket│    │  Client  │
│ Database │───►│ Realtime │───►│   Hook   │
│ 변경     │    │ Channel  │    │ setState │
└──────────┘    └──────────┘    └──────────┘
```

---

## 주요 기술 결정

### 1. Next.js App Router 선택

- **이유**: 서버 컴포넌트로 초기 로딩 성능 향상
- **장점**: 파일 기반 라우팅, 레이아웃 공유
- **고려사항**: `'use client'` 지시어로 클라이언트 컴포넌트 명시

### 2. Supabase Realtime 사용

- **이유**: 메시지 변경사항 즉시 반영 필요
- **구현**: `postgres_changes` 채널 구독
- **장점**: 별도 WebSocket 서버 불필요

### 3. Google Cloud TTS 선택

- **이유**: 웹 브라우저 기본 TTS보다 자연스러운 한국어 음성
- **구현**: 서버 사이드 API Route에서 호출
- **장점**: 8가지 한국어 음성 선택 가능

### 4. Web Push over FCM

- **이유**: 별도 네이티브 앱 없이 웹에서 푸시 알림
- **구현**: VAPID 키 기반 인증, Service Worker 핸들링
- **제한**: iOS Safari에서 제한적 지원

### 5. PWA 구현

- **이유**: 앱스토어 없이 설치 가능
- **구현**: `next-pwa` + 커스텀 Service Worker
- **기능**: 오프라인 지원, 홈 화면 추가

---

## 보안 구조

### Row Level Security (RLS)

```sql
-- 메시지는 같은 가족만 조회 가능
CREATE POLICY "messages_select_policy" ON messages
FOR SELECT USING (
  family_id IN (
    SELECT family_id FROM family_members
    WHERE user_id = auth.uid()
  )
);

-- 메시지 작성자 또는 가족 관리자만 수정 가능
CREATE POLICY "messages_update_policy" ON messages
FOR UPDATE USING (
  author_id = auth.uid() OR
  family_id IN (
    SELECT family_id FROM family_members
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

### API 인증

- Supabase Auth JWT 토큰 사용
- `@supabase/ssr` 쿠키 기반 세션 관리
- 미들웨어에서 관리자 경로 보호

---

## 성능 최적화

### 클라이언트

1. **정적 생성**: 변경 적은 페이지 SSG
2. **이미지 최적화**: Next.js Image 컴포넌트
3. **번들 최적화**: 동적 임포트, 트리 쉐이킹
4. **캐싱**: Service Worker 캐싱 전략

### 서버

1. **연결 재사용**: Supabase 클라이언트 싱글톤
2. **병렬 처리**: `Promise.all`로 병렬 쿼리
3. **인덱싱**: 자주 조회되는 컬럼에 인덱스

---

## 모니터링 및 로깅

### 감사 로그 (`audit_logs`)

- 관리자 행동 기록
- 민감한 데이터 변경 추적

### 활동 로그 (`user_activity_logs`)

- 사용자 활동 추적 (선택적)
- 서비스 사용 패턴 분석

### TTS 사용 로그 (`tts_usage_logs`)

- TTS API 호출량 추적
- 비용 모니터링

---

## 확장성 고려

### 현재 아키텍처 한계

- Supabase 무료 티어: 500MB DB, 5GB 대역폭/월
- Vercel 무료 티어: 100GB 대역폭/월
- Google TTS: 월 100만 자 무료

### 확장 시 고려사항

1. **데이터베이스**: Supabase Pro 또는 자체 PostgreSQL
2. **TTS**: 캐싱으로 중복 호출 감소
3. **CDN**: 정적 파일 CDN 분리
4. **푸시**: 대량 발송 시 큐 시스템 도입

---

**작성일**: 2026년 2월 3일
**버전**: 1.6.0
