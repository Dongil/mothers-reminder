# Family Message Board - 고급 AI 도구 활용 가이드

Claude CLI 개발 시 사용할 수 있는 최신 AI 도구들 (MCP, Subagent, Skills)

---

## 📚 목차
1. [MCP (Model Context Protocol)](#1-mcp-model-context-protocol)
2. [Subagent (서브에이전트)](#2-subagent-서브에이전트)
3. [Skills (스킬)](#3-skills-스킬)
4. [프로젝트 적용 방안](#4-프로젝트-적용-방안)

---

## 1. MCP (Model Context Protocol)

### 1.1 MCP란?

MCP는 AI 어시스턴트와 데이터 소스(데이터베이스, API, 엔터프라이즈 도구) 간의 안전한 양방향 연결을 구축하기 위한 오픈 표준이에요.

**쉽게 말하면**: AI가 외부 데이터에 접근할 수 있게 해주는 "USB 포트" 같은 거예요.

### 1.2 왜 필요한가?

기존 문제:
```
AI 앱 ─┬─ 커스텀 연동 1 → Google Drive
       ├─ 커스텀 연동 2 → Slack
       ├─ 커스텀 연동 3 → GitHub
       └─ 커스텀 연동 4 → Supabase

→ 데이터 소스마다 별도 코드 필요 (N×M 문제)
```

MCP 사용 후:
```
AI 앱 ─ MCP ─┬─ Google Drive MCP Server
             ├─ Slack MCP Server
             ├─ GitHub MCP Server
             └─ Supabase MCP Server

→ 표준 프로토콜로 통일!
```

### 1.3 MCP 아키텍처

MCP는 클라이언트-서버 모델을 사용하며, AI 애플리케이션(Claude Desktop, IDE 등)이 클라이언트 역할을 하고 데이터 소스나 도구를 나타내는 서버에 연결해요.

```
┌─────────────────────────────────────────┐
│  Host (Claude Desktop / IDE)            │
│  ┌────────────────────────────────┐     │
│  │  MCP Client 1 ←→ MCP Server 1  │     │
│  │  MCP Client 2 ←→ MCP Server 2  │     │
│  │  MCP Client 3 ←→ MCP Server 3  │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

**핵심 개념:**
- **Host**: AI 앱 (Claude Desktop, VS Code 등)
- **Client**: Host 내부의 연결 관리자
- **Server**: 데이터/도구 제공자

### 1.4 MCP 주요 기능

MCP는 5가지 핵심 커뮤니케이션 프리미티브를 정의: Prompts(준비된 지침), Resources(구조화된 데이터), Tools(실행 가능한 함수), Roots(파일 시스템 진입점), Sampling(AI 완성 요청 메커니즘)

1. **Resources**: 데이터 읽기
   - 파일, DB 레코드, API 응답
   
2. **Tools**: 함수 실행
   - 데이터베이스 쿼리, 파일 생성, API 호출
   
3. **Prompts**: 재사용 가능한 프롬프트 템플릿
   
4. **Sampling**: AI가 AI에게 요청
   - 서버가 클라이언트에게 "이것 좀 생성해줘" 요청
   
5. **Roots**: 파일 시스템 접근 권한

### 1.5 이 프로젝트에서 MCP 활용

#### 사용 사례 1: Supabase MCP Server
```typescript
// Claude가 직접 Supabase에 쿼리
"오늘 메시지 중 긴급한 것만 보여줘"

→ MCP Server가 자동으로:
   SELECT * FROM messages 
   WHERE display_date = CURRENT_DATE 
   AND priority = 'urgent'
```

#### 사용 사례 2: Google Drive MCP Server
```
"우리 가족 사진 중 어머님 생신 때 찍은 거 찾아서 
 메시지에 첨부해줘"

→ Google Drive MCP Server가:
   1. Drive에서 사진 검색
   2. 다운로드
   3. Supabase Storage 업로드
   4. 메시지에 첨부
```

#### 사용 사례 3: GitHub MCP Server (코드 관리)
```
"지난주에 수정한 MessageCard 컴포넌트 보여줘"

→ GitHub MCP Server가:
   1. Git 히스토리 조회
   2. 코드 diff 표시
```

### 1.6 MCP Server 설치 및 설정

#### Claude Desktop에 MCP 추가

**1단계: 설정 파일 위치**
```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json
```

**2단계: 설정 파일 편집**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "your-project-url",
        "SUPABASE_KEY": "your-anon-key"
      }
    },
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gdrive"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id",
        "GOOGLE_CLIENT_SECRET": "your-client-secret"
      }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

**3단계: Claude Desktop 재시작**

이제 Claude가 자동으로 Supabase, Google Drive, GitHub에 접근 가능!

### 1.7 커스텀 MCP Server 만들기

**프로젝트 전용 MCP Server 예시:**

```typescript
// mcp-server/family-board.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { createClient } from '@supabase/supabase-js';

const server = new Server({
  name: 'family-board',
  version: '1.0.0'
});

// Tool 정의: 긴급 메시지 생성
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'create_urgent_message',
      description: '긴급 메시지를 생성하고 즉시 알림',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          tts_time: { type: 'string' }
        },
        required: ['content']
      }
    }
  ]
}));

// Tool 실행
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'create_urgent_message') {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
    
    // 메시지 생성
    const { data, error } = await supabase
      .from('messages')
      .insert({
        content: request.params.arguments.content,
        priority: 'urgent',
        tts_enabled: true,
        tts_times: [request.params.arguments.tts_time]
      });
    
    return {
      content: [
        {
          type: 'text',
          text: `긴급 메시지 생성 완료: ${data?.id}`
        }
      ]
    };
  }
});

server.connect();
```

**사용:**
```bash
# package.json에 추가
{
  "scripts": {
    "mcp": "node mcp-server/family-board.js"
  }
}

# Claude Desktop 설정
{
  "mcpServers": {
    "family-board": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/path/to/family-message-board"
    }
  }
}
```

이제 Claude에게:
```
"어머님께 '지금 당장 약 드세요' 긴급 메시지 보내줘.
알림 시간은 지금으로."
```

→ 자동으로 MCP Server 호출!

---

## 2. Subagent (서브에이전트)

### 2.1 Subagent란?

**개념**: 메인 AI 에이전트가 특정 작업을 위임하는 전문화된 작은 에이전트들

**비유**:
```
메인 에이전트 (팀장)
  ├─ Subagent 1: DB 전문가 (데이터 조회/수정)
  ├─ Subagent 2: UI 전문가 (화면 생성)
  ├─ Subagent 3: TTS 전문가 (음성 처리)
  └─ Subagent 4: 알림 전문가 (스케줄링)
```

### 2.2 왜 사용하는가?

**장점:**
1. **전문성**: 각 에이전트가 특정 도메인에 집중
2. **병렬 처리**: 여러 작업 동시 수행
3. **유지보수**: 모듈화로 관리 쉬움
4. **컨텍스트 관리**: 각 에이전트가 필요한 정보만 보유

### 2.3 이 프로젝트에서 Subagent 활용

#### 설계 예시

```
Main Agent: "가족 메시지 보드 매니저"
  │
  ├─ Database Agent
  │   └─ 역할: Supabase CRUD, Realtime 구독
  │
  ├─ TTS Agent
  │   └─ 역할: 음성 생성, 속도 조절
  │
  ├─ Scheduler Agent
  │   └─ 역할: 알림 시간 계산, Cron 관리
  │
  ├─ UI Generator Agent
  │   └─ 역할: 컴포넌트 코드 생성
  │
  └─ Testing Agent
      └─ 역할: 테스트 코드 작성, 버그 검증
```

#### Claude CLI에서 Subagent 사용하기

**방법 1: 역할 기반 프롬프트**
```
[Database Agent로서]
src/hooks/useMessages.ts를 만들어줘.

전문 영역:
- Supabase Realtime 구독
- 에러 핸들링
- 캐싱 전략

요구사항:
- PostgreSQL 쿼리 최적화
- RLS 정책 준수
- 타입 안전성
```

**방법 2: 순차적 위임**
```
Step 1: [UI Agent]
"MessageCard 컴포넌트 디자인해줘"

Step 2: [Accessibility Agent]
"방금 만든 컴포넌트에 ARIA 속성 추가해줘"

Step 3: [Testing Agent]
"MessageCard 테스트 코드 작성해줘"
```

**방법 3: 병렬 작업**
```
동시에 3가지 작업:

[Database Agent]
"messages 테이블 마이그레이션 작성"

[API Agent]
"메시지 CRUD API Routes 생성"

[UI Agent]
"메시지 작성 폼 컴포넌트 생성"
```

### 2.4 Subagent 프롬프트 템플릿

```markdown
# Database Agent 프롬프트
당신은 Supabase 전문가입니다.

전문 분야:
- PostgreSQL 쿼리 최적화
- Row Level Security (RLS)
- Realtime 구독
- Edge Functions

제약사항:
- 항상 타입 안전성 보장
- RLS 정책 준수
- 에러 핸들링 필수

작업: [구체적 요청]
```

```markdown
# TTS Agent 프롬프트
당신은 Web Speech API 전문가입니다.

전문 분야:
- SpeechSynthesis API
- 음성 품질 최적화
- 브라우저 호환성
- 에러 복구

요구사항:
- 한국어 음성 우선
- 느린 속도 지원
- 볼륨 제어

작업: [구체적 요청]
```

---

## 3. Skills (스킬)

### 3.1 Skills란?

**개념**: Claude가 특정 작업을 수행하기 위한 재사용 가능한 전문 지식과 도구 모음

### 3.2 Skills vs MCP vs Subagent

| 항목 | MCP | Subagent | Skills |
|------|-----|----------|--------|
| 목적 | 데이터 연결 | 작업 위임 | 전문 지식 |
| 예시 | Supabase 연결 | DB 전문 에이전트 | "문서 작성 스킬" |
| 구현 | Server 프로그램 | 프롬프트 엔지니어링 | 지식 베이스 |
| 재사용 | ✅ 높음 | ✅ 높음 | ✅ 매우 높음 |

### 3.3 이 프로젝트에서 Skills 활용

Claude에는 이미 여러 공개 스킬이 있어요:

#### 사용 가능한 Public Skills

현재 시스템에 설치된 스킬:
- **docx**: Word 문서 생성/편집
- **pdf**: PDF 처리
- **pptx**: 프레젠테이션 생성
- **xlsx**: 스프레드시트 작성
- **frontend-design**: 고품질 UI 디자인
- **product-self-knowledge**: Anthropic 제품 정보

#### 활용 예시 1: 문서화 스킬
```
"PRD를 바탕으로 개발자 온보딩 문서를 
 docx 형식으로 만들어줘"

→ docx skill 자동 사용
→ 전문적인 포맷의 Word 문서 생성
```

#### 활용 예시 2: 프레젠테이션 스킬
```
"Family Message Board 프로젝트를 
 투자자에게 소개하는 PPT 만들어줘"

→ pptx skill 자동 사용
→ 슬라이드 자동 생성
```

#### 활용 예시 3: Frontend 디자인 스킬
```
"어르신용 큰 버튼 컴포넌트를 
 아름답게 디자인해줘"

→ frontend-design skill 자동 사용
→ 생산급 품질의 UI 생성
```

### 3.4 커스텀 스킬 만들기

**프로젝트 전용 스킬 예시:**

```markdown
# /mnt/skills/user/family-board/SKILL.md

# Family Message Board Development Skill

## 개요
경도 인지 장애 어르신을 위한 PWA 개발 전문 스킬

## 핵심 원칙
1. 접근성 최우선 (WCAG AA)
2. 큰 글씨 (최소 24pt)
3. 큰 버튼 (최소 48x48px)
4. 높은 색상 대비 (4.5:1 이상)
5. 음성 중심 인터페이스

## 기술 스택
- Next.js 14 (App Router)
- TypeScript (strict)
- Supabase (DB, Realtime, Auth)
- Tailwind CSS
- Web Speech API

## 컴포넌트 생성 규칙

### 태블릿 컴포넌트
```typescript
// 항상 이 템플릿 사용
interface TabletComponentProps {
  // Props 정의
}

export function TabletComponent({ ... }: TabletComponentProps) {
  return (
    <div className="
      p-6           // 큰 패딩
      text-2xl      // 24pt 글씨
      min-h-[60px]  // 최소 60px 높이
    ">
      {/* 내용 */}
    </div>
  );
}
```

### 색상 팔레트
```css
/* 중요도별 */
normal: #F5F5F5
important: #FFF9C4
urgent: #FFEBEE

/* 텍스트 */
primary: #212121
secondary: #757575
```

## TTS 구현 패턴
```typescript
// 항상 이 패턴 사용
const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9; // 느리게
  utterance.pitch = 1.0;
  speechSynthesis.speak(utterance);
};
```

## 데이터베이스 쿼리 패턴
```typescript
// 항상 RLS 고려
const { data, error } = await supabase
  .from('messages')
  .select(`
    *,
    author:users(name, photo_url)
  `)
  .eq('family_id', familyId)
  .eq('display_date', today)
  .order('priority', { ascending: false });
```

## 에러 메시지
- 어르신용: "문제가 생겼어요. 가족에게 알려드릴게요."
- 가족용: 기술적 상세 정보 포함
```

**사용:**
```bash
# Claude CLI 시작 시
"family-board skill을 사용해서 
 태블릿용 MessageCard 컴포넌트를 만들어줘"

→ skill의 모든 규칙 자동 적용!
```

---

## 4. 프로젝트 적용 방안

### 4.1 개발 워크플로우

#### Phase 1: 초기 설정 (MCP)
```
1. Claude Desktop에 MCP Server 추가
   - Supabase MCP
   - GitHub MCP
   - Google Drive MCP (사진용)

2. 커스텀 MCP Server 개발
   - Family Board 전용 도구들
```

#### Phase 2: 개발 (Subagent + Skills)
```
Main Task: "메시지 CRUD 기능 구현"

Step 1: [Database Agent + family-board skill]
"useMessages 훅 만들어줘"

Step 2: [UI Agent + frontend-design skill]
"MessageCard 컴포넌트 디자인해줘"

Step 3: [API Agent]
"메시지 API Routes 만들어줘"

Step 4: [Testing Agent]
"통합 테스트 작성해줘"
```

#### Phase 3: 통합 (MCP)
```
Claude: "MCP를 사용해서 실제 Supabase에 
        테스트 데이터 넣어줘"

→ Supabase MCP Server 자동 실행
→ 데이터 INSERT
```

### 4.2 실전 프롬프트 예시

#### 예시 1: 복잡한 기능 구현
```
[Main Agent]
태블릿 디스플레이 페이지를 만들어줘.

요구사항:
- 야간 모드 (20:00~06:00)
- TTS 자동 재생
- 실시간 메시지 동기화

[Database Agent에게 위임]
먼저 useMessages 훅을 만들어줘.
Realtime 구독 포함.

[TTS Agent에게 위임]
useTTS 훅을 만들어줘.
야간 모드 시 음소거.

[UI Agent에게 위임]
위 훅들을 사용해서 display 페이지 만들어줘.
frontend-design skill 사용.
```

#### 예시 2: MCP 활용
```
"GitHub MCP를 사용해서 
 지난 주 커밋 내역 분석하고
 주간 개발 리포트를 docx로 만들어줘"

→ GitHub MCP: 커밋 조회
→ docx skill: 리포트 생성
```

#### 예시 3: 전체 통합
```
"어머님께 '오늘 저녁 외식' 메시지를 
 Google Drive에 있는 가족 사진과 함께 보내줘.
 알림은 오후 5시로 설정."

→ Google Drive MCP: 사진 검색
→ Supabase MCP: 메시지 INSERT
→ family-board skill: 규칙 적용
→ 완료!
```

### 4.3 개발 효율 극대화 전략

#### 전략 1: 반복 작업 자동화
```typescript
// custom-mcp-server/templates.ts
export const COMPONENT_TEMPLATE = {
  name: 'create_tablet_component',
  description: '태블릿용 컴포넌트 템플릿 생성',
  execute: async (name: string) => {
    // 템플릿 코드 자동 생성
    return `
import { FC } from 'react';

interface ${name}Props {
  // Props
}

export const ${name}: FC<${name}Props> = ({ ... }) => {
  return (
    <div className="p-6 text-2xl min-h-[60px]">
      {/* Content */}
    </div>
  );
};
    `;
  }
};
```

#### 전략 2: 컨텍스트 공유
```
# .claude/context.md
현재 작업 중인 기능: 메시지 CRUD
관련 파일:
- src/hooks/useMessages.ts
- src/components/tablet/MessageCard.tsx
- src/app/api/messages/route.ts

참고할 문서:
- PRD.md
- UJM.md
- SETUP.md
```

Claude CLI가 이 파일을 자동으로 참조!

#### 전략 3: 스킬 체인
```
"family-board skill + frontend-design skill을 
 조합해서 어르신용 버튼 컴포넌트 만들어줘"

→ 두 스킬의 규칙 모두 적용
→ 접근성 + 디자인 품질 동시 달성
```

### 4.4 권장 도구 조합

```
개발 단계별 추천:

Week 1-2 (설계):
├─ Skills: product-self-knowledge (참고용)
└─ Subagent: Architecture Agent

Week 3 (환경 구축):
├─ MCP: GitHub (코드 관리)
└─ Skills: None

Week 4-5 (개발):
├─ MCP: Supabase, GitHub
├─ Subagent: Database, UI, API Agents
└─ Skills: family-board, frontend-design

Week 6 (문서화):
├─ MCP: GitHub
└─ Skills: docx, pptx
```

### 4.5 체크리스트

**MCP 설정:**
- [ ] Claude Desktop에 Supabase MCP 추가
- [ ] GitHub MCP 추가
- [ ] Google Drive MCP 추가 (선택)
- [ ] 커스텀 MCP Server 개발 (필요시)

**Subagent 정의:**
- [ ] Database Agent 프롬프트 준비
- [ ] UI Agent 프롬프트 준비
- [ ] TTS Agent 프롬프트 준비
- [ ] Testing Agent 프롬프트 준비

**Skills 준비:**
- [ ] family-board 커스텀 스킬 작성
- [ ] 공개 스킬 활용 계획 수립

---

## 5. 실전 예제

### 예제 1: 메시지 생성 자동화

```
사용자: "어머님께 약 먹으라는 긴급 메시지 보내줘.
        알림은 오후 3시, 3시 10분으로.
        Google Drive에서 약 사진 찾아서 첨부해줘."

Claude (내부 처리):
1. [Google Drive MCP] 사진 검색
2. [Supabase MCP] Storage 업로드
3. [family-board skill] 메시지 포맷 적용
4. [Supabase MCP] messages 테이블 INSERT
5. [Scheduler Agent] 알림 스케줄링

사용자에게: "완료했습니다! 
             메시지 ID: msg_12345
             사진: pill.jpg
             알림: 15:00, 15:10"
```

### 예제 2: 버그 수정

```
사용자: "MessageCard에서 긴 텍스트가 잘려.
        GitHub에서 관련 이슈 찾아보고 수정해줘."

Claude (내부 처리):
1. [GitHub MCP] 이슈 검색
2. [UI Agent] 버그 분석
3. [frontend-design skill] 수정 코드 생성
4. [Testing Agent] 테스트 코드 작성
5. [GitHub MCP] 커밋 + PR 생성

사용자에게: "수정 완료!
             PR: #42
             변경사항: line-clamp 제거, overflow-wrap 추가"
```

### 예제 3: 문서 생성

```
사용자: "지금까지 개발한 내용을 
        투자 피칭용 PPT로 만들어줘."

Claude (내부 처리):
1. [GitHub MCP] 커밋 히스토리 조회
2. [Supabase MCP] 사용 통계 조회
3. [pptx skill] 슬라이드 구성
   - 제목: "Family Message Board"
   - 문제점, 솔루션, 기술 스택
   - 개발 진행률, 향후 계획
4. [pptx skill] PPT 파일 생성

사용자에게: "완료! pitch-deck.pptx 다운로드 가능"
```

---

## 6. 트러블슈팅

### MCP 관련

**문제**: MCP Server 연결 안 됨
```
해결:
1. claude_desktop_config.json 확인
2. 환경변수 설정 확인
3. Claude Desktop 재시작
4. 로그 확인: ~/Library/Logs/Claude/
```

**문제**: 권한 에러
```
해결:
1. Supabase RLS 정책 확인
2. API Key 권한 확인
3. MCP Server 권한 설정 확인
```

### Subagent 관련

**문제**: Agent 간 컨텍스트 유실
```
해결:
1. 명시적 컨텍스트 전달
   "[Database Agent에게]
    앞서 만든 useMessages 훅을 사용해서..."

2. 파일 참조
   "src/hooks/useMessages.ts를 참고해서..."
```

### Skills 관련

**문제**: 스킬이 적용 안 됨
```
해결:
1. 명시적으로 스킬 호출
   "family-board skill을 사용해서..."

2. 스킬 파일 경로 확인
   /mnt/skills/user/family-board/SKILL.md
```

---

## 7. 참고 자료

### MCP
- 공식 문서: https://docs.anthropic.com/en/docs/build-with-claude/mcp
- GitHub: https://github.com/anthropics/mcp
- 커뮤니티: https://www.claudemcp.com

### Subagent
- 멀티 에이전트 패턴 연구
- LangGraph 문서 (참고용)

### Skills
- Skills 문서: /mnt/skills/public/
- 커스텀 스킬 가이드: /mnt/skills/examples/skill-creator/

---

**작성일**: 2026년 1월 12일  
**버전**: 1.0  
**작성자**: Claude & 철수

**다음 단계**: 이 가이드를 참고해서 실제 개발 시작!
