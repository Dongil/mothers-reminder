# PRD: Family Message Board (가족 메시지 보드)

## 문서 정보
- **프로젝트명**: Family Message Board
- **버전**: 1.0 MVP
- **작성일**: 2026년 1월 12일
- **작성자**: 철수
- **상태**: Draft

---

## 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [사용자 페르소나](#2-사용자-페르소나)
3. [기능 요구사항](#3-기능-요구사항)
4. [비기능 요구사항](#4-비기능-요구사항)
5. [기술 스택](#5-기술-스택)
6. [데이터베이스 스키마](#6-데이터베이스-스키마)
7. [시스템 아키텍처](#7-시스템-아키텍처)
8. [개발 일정](#8-개발-일정)
9. [제약사항](#9-제약사항)
10. [향후 로드맵](#10-향후-로드맵)

---

## 1. 프로젝트 개요

### 1.1 배경
- **문제**: 팔순 어머님의 경도 인지 장애로 단기 기억 저하
- **현재 상황**: 화이트보드 사용 중이나 관리 불편
- **목표**: 디지털 메시지 보드로 정보 전달 자동화

### 1.2 솔루션
PWA 기반 가족용 디지털 메시지 보드
- 태블릿: 고정 디스플레이 (식탁 옆)
- 스마트폰: 가족이 메시지 등록
- TTS: 음성으로 자동 알림

### 1.3 핵심 가치
- ✅ 중요 정보 놓치지 않음 (약, 일정)
- ✅ 실시간 메시지 전달
- ✅ 음성 알림으로 편리한 확인
- ✅ 가족 안심 (알림 발송 확인)

---

## 2. 사용자 페르소나

### 👵 주 사용자: 어머님 (82세)
```yaml
상태: 경도 인지 장애 초기
특징:
  - 단기 기억력 저하
  - 시력 약화 → 큰 글씨 필요
  - 터치 가능하나 귀찮아함
  - 음성 선호
사용 환경:
  - 갤럭시 탭 7 FE (식탁 옆 고정)
  - 항상 켜놓음
  - Wi-Fi 연결
주요 니즈:
  - 약 먹는 시간 알림
  - 오늘 일정 확인
  - 가족 메시지 듣기
```

### 👨‍💼 주 작성자: 철수 (50대)
```yaml
직업: 직장인, 개발자 (초급)
사용 환경:
  - 스마트폰 (주 사용)
  - 평일 출퇴근 중 사용
주요 니즈:
  - 빠른 메시지 등록
  - 알림 발송 확인
  - 어머님 상태 모니터링
```

### 👩 보조 사용자: 가족 (10명 미만)
```yaml
사용: 비정기적
니즈: 간편한 메시지 전송
```

---

## 3. 기능 요구사항

### 3.1 MVP 필수 기능

#### 📝 메시지 관리
**FR-001: 메시지 작성**
- 텍스트 입력 (최대 500자)
- 표시 날짜 선택
- 중요도 선택 (일반/중요/긴급)
- 사진 첨부 (선택, 최대 5MB)
- 수용 기준: 3초 이내 태블릿 표시

**FR-002: 메시지 표시**
- 날짜별 자동 필터링
- 중요도별 색상 구분
- 큰 글씨 (최소 24pt)
- 최대 10개 동시 표시

**FR-003: 메시지 수정/삭제**
- 본인 메시지만 가능
- 실시간 반영

#### 🔊 음성 기능 (TTS)
**FR-004: 텍스트 음성 변환**
- Web Speech API 사용
- 한국어 여성 음성
- 자동/수동 재생

**FR-005: 음성 설정**
- 속도 조절 (느림/보통/빠름)
- 볼륨 시간대별 설정
  - 주간(06:00-20:00): 높음
  - 야간(20:00-06:00): 음소거

#### 🔔 알림 시스템
**FR-006: 시간 기반 알림**
- 알림 시간 최대 5개 설정
- 사전 알림 (5분 전)
- 재알림 (10분 후)
- 차임벨 + TTS

**FR-007: 푸시 알림 (가족)**
- 메시지 전달 완료
- 음성 알림 발송
- FCM 사용

#### 📅 일정 관리
**FR-008: 일자별 메시지**
- 시작/종료 날짜 설정
- 자동 필터링

**FR-009: 반복 일정**
- 매일/매주/매월
- 시작일, 종료일 설정

**FR-010: D-day 카운터**
- "D-7", "D-Day" 표시
- 자동 카운트다운

#### 🌙 화면 모드
**FR-011: 야간 모드**
- 시간: 20:00 - 06:00
- 블랙 스크린
- 알림 음소거
- 터치로 즉시 깨어남

#### 👥 사용자 관리
**FR-012: 가족 계정**
- 최대 10명 등록
- 역할: 관리자/일반 사용자
- Supabase Auth

#### 💾 데이터 관리
**FR-013: 실시간 동기화**
- Supabase Realtime
- 3초 이내 동기화

**FR-014: 오프라인 모드**
- Service Worker 캐싱
- 최근 7일 메시지 캐시

**FR-015: 데이터 보관**
- 2년 후 자동 삭제
- 중요 메시지 보관 옵션

---

## 4. 비기능 요구사항

### 4.1 성능
- 페이지 로딩: 5초 이내
- 실시간 동기화: 3초 이내
- 알림 정확도: ±30초

### 4.2 가용성
- 시스템 가용성: 99.5%
- 알림 절대 놓치면 안 됨

### 4.3 사용성
- WCAG 2.1 Level AA
- 큰 글씨 (최소 24pt)
- 높은 색상 대비 (4.5:1)
- 큰 터치 영역 (48x48px)

### 4.4 보안
- HTTPS 필수
- 데이터 암호화
- Row Level Security

### 4.5 호환성
- 브라우저: Chrome, Safari (최근 2년)
- 기기: Android 10+, iOS 14+
- PWA Score: 90+

---

## 5. 기술 스택

### 5.1 Frontend
```yaml
Framework:
  - Next.js 14.2+ (App Router)
  - TypeScript 5.0+ (strict)
  - React 18+

Styling:
  - Tailwind CSS 3.4+
  - shadcn/ui

PWA:
  - next-pwa 5.6+
  - Workbox

Voice:
  - Web Speech API (TTS)
```

### 5.2 Backend
```yaml
BaaS:
  - Supabase
    - PostgreSQL
    - Realtime
    - Authentication
    - Storage
    - Edge Functions

Push:
  - Firebase Cloud Messaging (FCM)
```

### 5.3 배포
```yaml
Frontend: Vercel
Backend: Supabase
Domain: Vercel 제공 (무료)
SSL: 자동 HTTPS
```

### 5.4 개발 도구
```yaml
AI Coding:
  - Cursor AI (IDE)
  - Claude Sonnet 4

Version Control:
  - Git, GitHub

Package Manager:
  - pnpm (권장)

Linting:
  - ESLint, Prettier

Testing:
  - Jest, Playwright
```

---

## 6. 데이터베이스 스키마

### 6.1 ERD
```
users (사용자)
  ├─ id (PK)
  ├─ email
  ├─ name
  ├─ role
  └─ family_id (FK)

family (가족)
  ├─ id (PK)
  ├─ name
  └─ code

messages (메시지)
  ├─ id (PK)
  ├─ author_id (FK)
  ├─ family_id (FK)
  ├─ content
  ├─ priority
  ├─ display_date
  ├─ tts_enabled
  ├─ tts_times
  ├─ repeat_pattern
  └─ is_dday

notifications (알림 로그)
  ├─ id (PK)
  ├─ user_id (FK)
  ├─ message_id (FK)
  ├─ type
  └─ sent_at

settings (설정)
  ├─ id (PK)
  ├─ user_id (FK)
  ├─ night_mode_start
  ├─ night_mode_end
  ├─ tts_voice
  └─ volume_day
```

### 6.2 주요 테이블

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'member',
  family_id UUID REFERENCES family(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id),
  family_id UUID REFERENCES family(id),
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  display_date DATE NOT NULL,
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_times TEXT[],
  repeat_pattern VARCHAR(20),
  repeat_start DATE,
  repeat_end DATE,
  is_dday BOOLEAN DEFAULT FALSE,
  dday_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 7. 시스템 아키텍처

### 7.1 전체 구조
```
[사용자]
   ├─ 태블릿 앱 (디스플레이)
   └─ 스마트폰 앱 (작성)
        ↓
[Next.js Frontend] (Vercel)
   ├─ SSR/ISR
   ├─ API Routes
   └─ Service Worker
        ↓
[Supabase Backend]
   ├─ PostgreSQL
   ├─ Realtime (WebSocket)
   ├─ Auth (JWT)
   ├─ Storage
   └─ Edge Functions
        ↓
[FCM] → 푸시 알림
```

### 7.2 데이터 흐름

#### 메시지 전송
```
스마트폰 → Next.js API → Supabase DB 
→ Realtime → 태블릿 (즉시 표시)
```

#### 알림 발송
```
Edge Function (Cron) → DB 조회
→ 알림 대상 발견 → 태블릿 TTS
→ 가족 FCM 푸시
```

---

## 8. 개발 일정

### 8.1 마일스톤 (총 6주)

```
Week 1: 기획 및 설계 ✅
├─ PRD 작성
├─ DB 스키마 설계
└─ UI/UX 디자인

Week 2: 개발 환경 구축
├─ Next.js 프로젝트 초기화
├─ Supabase 설정
└─ PWA 설정

Week 3: 인증 및 메시지 CRUD
├─ Supabase Auth 연동
├─ 메시지 작성/조회
└─ 실시간 동기화

Week 4: TTS 및 알림
├─ Web Speech API 연동
├─ 시간 기반 알림
└─ FCM 푸시

Week 5: UI 개선
├─ 태블릿 UI (큰 글씨)
├─ 야간 모드
└─ 스마트폰 앱

Week 6: 테스트 및 배포
├─ 기능 테스트
├─ 사용자 테스트 (가족)
└─ Vercel 배포
```

### 8.2 상세 일정

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1 | 기획 | PRD, DB 스키마, 와이어프레임 |
| 2 | 환경 구축 | Next.js 프로젝트, Supabase DB |
| 3 | 핵심 기능 | 메시지 CRUD, 실시간 동기화 |
| 4 | 알림 시스템 | TTS, 푸시 알림 |
| 5 | UI/UX | 태블릿/스마트폰 UI |
| 6 | 테스트/배포 | 배포된 앱 |

---

## 9. 제약사항

### 9.1 기술적 제약
- iOS Safari PWA 제한 (백그라운드 알림)
- Web Speech API 브라우저 의존
- 무료 티어 제한
  - Supabase: 500MB DB, 1GB Storage
  - Vercel: 100GB 대역폭/월

### 9.2 비용 제약
- 무료 플랜만 사용
- 백업 불필요 (요구사항)

### 9.3 인력 제약
- 1인 개발 (바이브 코딩)
- 디자이너 없음 (shadcn/ui)

### 9.4 가정
- 태블릿 항상 Wi-Fi 연결
- 태블릿 항상 켜놓음 (충전 중)
- 어머님 터치 조작 가능
- Vercel, Supabase 서비스 안정적

---

## 10. 향후 로드맵

### v1.0 (MVP) - 현재
✅ 디지털 화이트보드 + TTS
- 메시지 작성/조회
- 음성 알림
- 야간 모드

### v1.5 (2-3주 후)
📅 추가 편의 기능
- 사진 첨부
- 기념일 자동 알림
- 날씨 정보

### v2.0 (2개월 후)
🤖 AI 음성 채팅
- "오늘 뭐 해야 해?" 질문
- Claude API 연동
- 음성 명령

### v2.5 (4개월 후)
🧠 인지 기능 지원
- 기억력 게임
- 가족 사진 퀴즈
- 회상 활동

### v3.0 (6개월 후)
🏥 건강 데이터 연동
- 혈압, 혈당 기록
- 복약 관리
- 병원 예약 연동

---

## 부록

### A. 핵심 화면 예시

#### 태블릿 메인 화면
```
┌─────────────────────────────────────┐
│  📅 2026년 1월 12일 일요일          │
│  오전 9시 30분  🌤️ 5°C            │
├─────────────────────────────────────┤
│  [  📢 전체 읽어주기  ] [  ⚙️  ]  │
├─────────────────────────────────────┤
│                                     │
│  💊 긴급 • 5시간 30분 후            │
│  ┌───────────────────────────────┐  │
│  │ 오후 3시 약 드세요            │  │
│  │ 혈압약 1알, 소화제 1알        │  │
│  │ [    🔊 지금 듣기    ]       │  │
│  └───────────────────────────────┘  │
│                                     │
│  🍽️ 중요 • 8시간 30분 후           │
│  ┌───────────────────────────────┐  │
│  │ 저녁 외식하러 가요            │  │
│  │ [사진]                        │  │
│  │ [    🔊 듣기    ]            │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

#### 스마트폰 메시지 작성
```
┌───────────────────────────┐
│  ← 새 메시지              │
├───────────────────────────┤
│  내용 *                   │
│  ┌─────────────────────┐  │
│  │ 오후 3시 약 드세요  │  │
│  └─────────────────────┘  │
│                           │
│  📅 표시 날짜             │
│  ◉ 오늘  ○ 내일          │
│                           │
│  📊 중요도                │
│  ○ 일반  ◉ 중요  ○ 긴급  │
│                           │
│  ⏰ 알림 시간             │
│  [14:55] [15:00]          │
│                           │
│  🔊 ☑ 음성 읽기           │
│                           │
│  [   메시지 전송   ]      │
└───────────────────────────┘
```

### B. API 엔드포인트 요약

```yaml
인증:
  - POST /auth/v1/signup
  - POST /auth/v1/token

메시지:
  - GET /api/messages
  - POST /api/messages
  - PATCH /api/messages/:id
  - DELETE /api/messages/:id

사용자:
  - GET /api/users/me
  - GET /api/family/members

알림:
  - GET /api/notifications

설정:
  - GET /api/settings
  - PATCH /api/settings
```

### C. 성공 지표

**정량적:**
- 일일 활성 사용: 5회 이상
- 알림 발송 성공률: 99.9%
- 시스템 가용성: 99.5%

**정성적:**
- 약 복용 누락 감소
- 가족 만족도 80% 이상
- 안정적 작동

---

**다음 단계:**
1. ✅ PRD 작성 완료
2. ⬜ 개발 환경 구축
3. ⬜ MVP 개발 시작
4. ⬜ 바이브 코딩으로 구현

**작성일**: 2026년 1월 12일  
**버전**: 1.0  
**작성자**: 철수 & Claude
