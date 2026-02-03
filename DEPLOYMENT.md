# 배포 가이드

> Family Message Board (엄마 알리미) Vercel + Supabase 배포 가이드

---

## 목차

1. [사전 준비](#1-사전-준비)
2. [Supabase 설정](#2-supabase-설정)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [Vercel 배포](#4-vercel-배포)
5. [배포 후 확인](#5-배포-후-확인)
6. [문제 해결](#6-문제-해결)

---

## 1. 사전 준비

### 필요한 계정

- [GitHub](https://github.com) - 코드 저장소
- [Vercel](https://vercel.com) - 프론트엔드 호스팅
- [Supabase](https://supabase.com) - 백엔드 서비스
- [Google Cloud](https://cloud.google.com) - TTS API (선택)

### 로컬 환경

```bash
# Node.js 18+ 필요
node --version

# pnpm 설치
npm install -g pnpm

# 의존성 설치
pnpm install

# 로컬 실행 확인
pnpm dev
```

---

## 2. Supabase 설정

### 2.1 프로젝트 생성

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `mothers-reminder`
   - Database Password: (강력한 비밀번호)
   - Region: Northeast Asia (Seoul)
4. "Create new project" 클릭

### 2.2 데이터베이스 스키마 적용

1. SQL Editor 열기
2. `supabase/schema.sql` 내용 실행
3. 마이그레이션 파일 순서대로 실행:
   - `supabase/migrations/v1.4_*.sql`
   - `supabase/migrations/v1.5_*.sql`
   - `supabase/migrations/v1.5.2_*.sql`
   - `supabase/migrations/v1.5.3_*.sql`
   - `supabase/migrations/v1.5.5_*.sql`

### 2.3 RLS 정책 설정

1. SQL Editor에서 실행:

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
```

2. `supabase/rls-policies-v2.sql` 실행

### 2.4 인증 설정

1. Authentication → Providers
2. Email 활성화
3. Site URL 설정: `https://your-domain.vercel.app`
4. Redirect URLs 추가:
   - `https://your-domain.vercel.app/auth/callback`

### 2.5 API 키 확인

1. Settings → API
2. 다음 값 복사:
   - Project URL
   - anon public key
   - service_role key (비밀!)

---

## 3. 환경 변수 설정

### 3.1 필수 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# 앱 URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Google Cloud TTS (선택)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Web Push VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BPxxx...
VAPID_PRIVATE_KEY=xxx...
```

### 3.2 VAPID 키 생성

```bash
# web-push로 VAPID 키 생성
npx web-push generate-vapid-keys
```

### 3.3 Google Cloud TTS 설정 (선택)

1. Google Cloud Console에서 프로젝트 생성
2. Text-to-Speech API 활성화
3. 서비스 계정 생성 및 JSON 키 다운로드
4. JSON 내용을 `GOOGLE_APPLICATION_CREDENTIALS_JSON`에 설정

---

## 4. Vercel 배포

### 4.1 GitHub 연동

1. 코드를 GitHub 저장소에 푸시
2. [Vercel](https://vercel.com) 접속
3. "New Project" 클릭
4. GitHub 저장소 선택

### 4.2 프로젝트 설정

1. Framework Preset: `Next.js`
2. Root Directory: `.` (기본값)
3. Build Command: `pnpm build` (자동 감지)
4. Output Directory: `.next` (자동 감지)

### 4.3 환경 변수 추가

1. Settings → Environment Variables
2. 3.1의 모든 환경 변수 추가
3. 각 변수를 Production, Preview, Development에 적용

### 4.4 배포

1. "Deploy" 클릭
2. 빌드 로그 확인
3. 배포 완료 후 URL 확인

### 4.5 도메인 설정 (선택)

1. Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정 (CNAME 또는 A 레코드)

---

## 5. 배포 후 확인

### 5.1 기능 테스트 체크리스트

- [ ] 회원가입/로그인 동작
- [ ] 메시지 작성/조회/수정/삭제
- [ ] 실시간 동기화 (다른 기기에서 확인)
- [ ] TTS 음성 재생
- [ ] 푸시 알림 수신
- [ ] 야간 모드 동작
- [ ] PWA 설치

### 5.2 빌드 성공 확인

```bash
# 로컬에서 프로덕션 빌드 테스트
pnpm build

# 에러 없이 완료되어야 함
```

### 5.3 Supabase 연결 확인

1. 배포된 사이트에서 로그인 시도
2. Supabase Dashboard → Auth → Users에서 사용자 확인
3. Table Editor에서 데이터 확인

---

## 6. 문제 해결

### 6.1 빌드 실패

**증상**: `pnpm build` 실패

**해결**:
```bash
# 타입 에러 확인
pnpm tsc --noEmit

# 린트 에러 확인
pnpm lint
```

### 6.2 인증 실패 (401 Unauthorized)

**증상**: API 호출 시 401 에러

**확인 사항**:
1. `NEXT_PUBLIC_SUPABASE_URL` 정확한지 확인
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` 정확한지 확인
3. Supabase Site URL 설정 확인

### 6.3 Realtime 연결 안됨

**증상**: 실시간 동기화 안됨

**확인 사항**:
1. Supabase Dashboard → Database → Replication
2. 관련 테이블 Realtime 활성화 확인
3. RLS 정책 확인

### 6.4 푸시 알림 안옴

**증상**: 웹 푸시 알림 수신 안됨

**확인 사항**:
1. VAPID 키 설정 확인
2. `SUPABASE_SERVICE_ROLE_KEY` 설정 확인
3. Service Worker 등록 상태 확인 (DevTools → Application)
4. 브라우저 알림 권한 확인

### 6.5 TTS 작동 안함

**증상**: 음성 재생 안됨

**확인 사항**:
1. Google Cloud TTS API 활성화 확인
2. `GOOGLE_APPLICATION_CREDENTIALS_JSON` 설정 확인
3. 서비스 계정 권한 확인
4. API 사용량 한도 확인

---

## 업데이트 배포

### 자동 배포 (권장)

- GitHub main 브랜치에 푸시 → Vercel 자동 배포

### 수동 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 환경 변수 변경

1. Vercel Dashboard → Settings → Environment Variables
2. 변수 수정 후 "Save"
3. 재배포 필요: Deployments → 최근 배포 → Redeploy

---

## 비용 정보

### Vercel (무료 티어)

- 100GB 대역폭/월
- 무제한 배포
- HTTPS 자동

### Supabase (무료 티어)

- 500MB 데이터베이스
- 5GB 대역폭/월
- 50MB 파일 스토리지
- 7일 로그 보관

### Google Cloud TTS

- 월 100만 자 무료
- 초과 시 $4/100만 자

---

**작성일**: 2026년 2월 3일
**버전**: 1.6.0
