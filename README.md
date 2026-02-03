# Family Message Board (엄마 알리미)

> 경도 인지 장애 어르신을 위한 디지털 메시지 보드 PWA

화이트보드 대신 태블릿으로 가족 메시지를 전달하고, 음성으로 읽어주는 서비스입니다.

---

## 주요 기능

### 태블릿 (디스플레이)
- 오늘의 메시지 목록 실시간 표시
- TTS(Text-to-Speech)로 메시지 음성 읽기
- 시간별 자동 스크롤
- 야간 모드 (설정된 시간에 화면 어둡게)
- 화면 꺼짐 방지 (Wake Lock)

### 스마트폰 (관리)
- 메시지 작성/수정/삭제
- 반복 메시지 설정 (매일, 매주 요일별)
- 달력에서 메시지 관리
- 푸시 알림 수신
- 가족 생성 및 참여

### 시스템
- 실시간 동기화 (Supabase Realtime)
- 웹 푸시 알림
- 다중 가족 지원
- PWA (앱처럼 설치 가능)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| TTS | Google Cloud Text-to-Speech |
| Push | Web Push (VAPID) |
| Hosting | Vercel |
| PWA | next-pwa, Custom Service Worker |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm
- Supabase 계정
- Google Cloud 계정 (TTS용)

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/mothers-reminder.git
cd mothers-reminder

# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집
```

### 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 앱 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Web Push VAPID
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

### 개발 서버 실행

```bash
pnpm dev
```

http://localhost:3000 에서 확인

### 빌드

```bash
pnpm build
pnpm start
```

---

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
├── components/       # React 컴포넌트
├── hooks/            # Custom Hooks
├── lib/              # 유틸리티 함수
└── types/            # TypeScript 타입
```

---

## 문서

| 문서 | 설명 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 아키텍처 |
| [CHANGELOG.md](./CHANGELOG.md) | 버전별 변경 이력 |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 배포 가이드 |
| [PRD.md](./PRD.md) | 제품 요구사항 |
| [TODO.md](./TODO.md) | 개발 TODO 목록 |
| [docs/USER-MANUAL.md](./docs/USER-MANUAL.md) | 사용자 메뉴얼 |
| [docs/QUICK-GUIDE.md](./docs/QUICK-GUIDE.md) | 간단 가이드 |

---

## 주요 화면

### 태블릿 디스플레이 (`/display`)
메시지를 큰 글씨로 표시하고 음성으로 읽어줍니다.

### 홈 화면 (`/home`)
오늘의 메시지를 확인하고 새 메시지를 작성합니다.

### 설정 (`/settings`)
가족 관리, TTS 설정, 알림 설정을 합니다.

### 달력 (`/messages/calendar`)
월별로 메시지를 확인합니다.

---

## 라이선스

Private - 개인 가족 사용 목적

---

## 연락처

문의: admin@mothers-reminder.com

---

**버전**: 1.6.0
**최종 업데이트**: 2026년 2월 3일
