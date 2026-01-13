# Family Message Board - Setup Guide

## Claude CLI 개발 시작 가이드

이 문서는 Claude CLI를 사용해 프로젝트를 처음부터 구축하는 가이드입니다.

---

## 📋 사전 준비사항

### 필수 설치
```bash
# Node.js 18+ 설치 확인
node --version

# pnpm 설치 (권장)
npm install -g pnpm

# Claude CLI 설치
npm install -g @anthropic-ai/claude-cli
```

### 계정 준비
1. **Vercel 계정**: https://vercel.com
2. **Supabase 계정**: https://supabase.com
3. **Firebase 계정**: https://console.firebase.google.com (FCM용)

---

## 🚀 Step 1: 프로젝트 초기화

### 1.1 Next.js 프로젝트 생성
```bash
# 프로젝트 디렉토리 생성
mkdir family-message-board
cd family-message-board

# Next.js 프로젝트 초기화
pnpm create next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# 디렉토리 구조 확인
# ✓ app/
# ✓ components/
# ✓ lib/
# ✓ public/
```

### 1.2 필수 패키지 설치
```bash
# Supabase 클라이언트
pnpm add @supabase/supabase-js @supabase/ssr

# PWA
pnpm add next-pwa
pnpm add -D @types/service-worker

# UI 라이브러리
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# 폼 관리
pnpm add react-hook-form @hookform/resolvers zod

# 날짜 처리
pnpm add date-fns

# 개발 도구
pnpm add -D @types/node typescript eslint prettier
```

---

## 🗄️ Step 2: Supabase 설정

### 2.1 Supabase 프로젝트 생성
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 이름: `mother-reminder`
4. Database Password 설정 (저장 필수!)
5. Region: `Northeast Asia (Seoul)`

### 2.2 환경변수 설정
프로젝트 루트에 `.env.local` 파일 생성:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Admin (서버 전용)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> Supabase Dashboard > Settings > API에서 확인

### 2.3 데이터베이스 스키마 생성
Supabase SQL Editor에서 실행:

```sql
-- 1. family 테이블
CREATE TABLE family (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. users 테이블 (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  relationship VARCHAR(50),
  photo_url TEXT,
  family_id UUID REFERENCES family(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. messages 테이블
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES family(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  
  display_date DATE NOT NULL,
  display_duration INT DEFAULT 1,
  display_forever BOOLEAN DEFAULT FALSE,
  
  photo_url TEXT,
  
  tts_enabled BOOLEAN DEFAULT TRUE,
  tts_times TEXT[],
  tts_voice VARCHAR(20) DEFAULT 'female',
  tts_speed DECIMAL(3,1) DEFAULT 1.0,
  background_sound VARCHAR(20) DEFAULT 'chime',
  
  repeat_pattern VARCHAR(20),
  repeat_weekdays INT[],
  repeat_month_day INT,
  repeat_start DATE,
  repeat_end DATE,
  
  is_dday BOOLEAN DEFAULT FALSE,
  dday_date DATE,
  dday_label VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. notifications 테이블
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. settings 테이블
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  night_mode_start TIME DEFAULT '20:00',
  night_mode_end TIME DEFAULT '06:00',
  
  tts_voice VARCHAR(20) DEFAULT 'female',
  tts_speed DECIMAL(3,1) DEFAULT 1.0,
  
  volume_day INT DEFAULT 80,
  volume_night INT DEFAULT 0,
  
  ui_mode VARCHAR(20) DEFAULT 'touch',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_messages_family_id ON messages(family_id);
CREATE INDEX idx_messages_display_date ON messages(display_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- RLS (Row Level Security) 활성화
ALTER TABLE family ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- family 테이블
CREATE POLICY "Family members can view family"
  ON family FOR SELECT
  USING (id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

-- users 테이블
CREATE POLICY "Users can view family members"
  ON users FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- messages 테이블
CREATE POLICY "Family members can view messages"
  ON messages FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Family members can insert messages"
  ON messages FOR INSERT
  WITH CHECK (family_id IN (
    SELECT family_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Authors can update own messages"
  ON messages FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own messages"
  ON messages FOR DELETE
  USING (author_id = auth.uid());

-- notifications 테이블
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- settings 테이블
CREATE POLICY "Users can manage own settings"
  ON settings FOR ALL
  USING (user_id = auth.uid());
```

### 2.4 Realtime 활성화
Supabase Dashboard > Database > Replication
- `messages` 테이블 Realtime 활성화

---

## 🎨 Step 3: 프로젝트 구조 설정

### 3.1 디렉토리 구조
```
family-message-board/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 페이지
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (tablet)/          # 태블릿 뷰
│   │   │   └── display/
│   │   ├── (mobile)/          # 스마트폰 뷰
│   │   │   ├── messages/
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── api/               # API Routes
│   │   │   ├── messages/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/            # 재사용 컴포넌트
│   │   ├── ui/               # shadcn/ui 컴포넌트
│   │   ├── tablet/           # 태블릿 전용
│   │   ├── mobile/           # 스마트폰 전용
│   │   └── shared/           # 공통
│   │
│   ├── lib/                  # 유틸리티
│   │   ├── supabase/
│   │   │   ├── client.ts    # 클라이언트용
│   │   │   ├── server.ts    # 서버용
│   │   │   └── middleware.ts
│   │   ├── tts/
│   │   │   └── speech.ts    # Web Speech API
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── hooks/                # 커스텀 훅
│   │   ├── useMessages.ts
│   │   ├── useTTS.ts
│   │   ├── useNotifications.ts
│   │   └── useRealtime.ts
│   │
│   ├── types/                # TypeScript 타입
│   │   ├── database.ts
│   │   ├── message.ts
│   │   └── user.ts
│   │
│   └── styles/
│       └── globals.css
│
├── public/
│   ├── icons/               # PWA 아이콘
│   ├── sounds/              # 알림음
│   └── manifest.json        # PWA Manifest
│
├── .env.local              # 환경변수
├── next.config.js          # Next.js 설정
├── tailwind.config.ts      # Tailwind 설정
├── tsconfig.json
└── package.json
```

---

## ⚙️ Step 4: 설정 파일

### 4.1 next.config.js
```javascript
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
};

module.exports = withPWA(nextConfig);
```

### 4.2 tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        // 어르신용 큰 글씨
        'tablet-xl': '32px',
        'tablet-lg': '28px',
        'tablet-md': '24px',
      },
      colors: {
        // 중요도별 색상
        priority: {
          normal: '#F5F5F5',
          important: '#FFF9C4',
          urgent: '#FFEBEE',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### 4.3 public/manifest.json
```json
{
  "name": "Family Message Board",
  "short_name": "Family Board",
  "description": "가족 메시지 보드",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 📝 Step 5: Claude CLI로 개발 시작

### 5.1 초기 파일 생성 요청
```bash
# Claude CLI 시작
claude

# 프롬프트 예시
"다음 파일들을 생성해줘:

1. src/lib/supabase/client.ts
   - Supabase 클라이언트 초기화
   - 환경변수에서 URL, ANON_KEY 가져오기

2. src/types/database.ts
   - Supabase 테이블 타입 정의
   - User, Message, Family, Settings 타입

3. src/lib/utils.ts
   - cn() 함수 (tailwind merge)
   - 날짜 포맷 함수들

4. src/components/ui/button.tsx
   - shadcn/ui Button 컴포넌트
   - 큰 버튼 variant 추가 (어르신용)"
```

### 5.2 핵심 기능 구현 순서
```
Phase 1: 인증
├─ 1. Supabase Auth 연동
├─ 2. 로그인/회원가입 페이지
└─ 3. 세션 관리

Phase 2: 메시지 CRUD
├─ 1. 메시지 작성 폼
├─ 2. 메시지 목록 조회
├─ 3. 실시간 구독 (Realtime)
└─ 4. 수정/삭제

Phase 3: TTS
├─ 1. Web Speech API 래퍼
├─ 2. 자동 재생
└─ 3. 수동 재생 (다시 듣기)

Phase 4: 알림
├─ 1. 시간 기반 알림 (Service Worker)
├─ 2. FCM 푸시 설정
└─ 3. 알림 로그

Phase 5: UI
├─ 1. 태블릿 디스플레이 뷰
├─ 2. 스마트폰 작성 뷰
└─ 3. 야간 모드
```

---

## 🔧 Step 6: 개발 시 참고사항

### 6.1 Claude CLI 프롬프트 팁
```
좋은 예:
"src/components/tablet/MessageCard.tsx 파일을 만들어줘.
요구사항:
- 메시지 내용, 작성자, 시간 표시
- 중요도별 색상 (normal/important/urgent)
- 큰 글씨 (24pt 이상)
- TTS 버튼 (48x48px)
- TypeScript strict 모드
- Tailwind CSS 사용"

나쁜 예:
"메시지 카드 만들어줘"
```

### 6.2 바이브 코딩 원칙
1. **명확한 명세**: 무엇을 만들지 구체적으로
2. **규칙 설정**: TypeScript, Tailwind, 큰 글씨 등
3. **감독**: 생성된 코드 검토 및 피드백

### 6.3 자주 사용할 명령어
```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 타입 체크
pnpm tsc --noEmit

# 린트
pnpm lint
```

---

## 🚢 Step 7: 배포

### 7.1 Vercel 배포
```bash
# Vercel CLI 설치
pnpm add -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 7.2 태블릿 설정
1. Chrome 브라우저로 앱 접속
2. 메뉴 > "홈 화면에 추가"
3. 설정 > 디스플레이 > "화면 자동 꺼짐: 사용 안 함"
4. 개발자 옵션 > "화면 켜짐 유지" (충전 중)

---

## 📚 추가 참고 자료

### 문서
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- PWA: https://web.dev/progressive-web-apps/

### 도구
- shadcn/ui: https://ui.shadcn.com/
- Tailwind: https://tailwindcss.com/
- Lucide Icons: https://lucide.dev/

---

## ✅ 체크리스트

개발 시작 전 확인:
- [ ] Node.js 18+ 설치
- [ ] pnpm 설치
- [ ] Claude CLI 설치
- [ ] Vercel 계정 생성
- [ ] Supabase 계정 생성
- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 생성
- [ ] 환경변수 설정 (.env.local)
- [ ] Next.js 프로젝트 초기화
- [ ] 필수 패키지 설치

준비 완료 후:
```bash
claude
# "Family Message Board 프로젝트를 시작하자. 
#  먼저 src/lib/supabase/client.ts 파일을 만들어줘."
```

---

**작성일**: 2026년 1월 12일  
**버전**: 1.0
