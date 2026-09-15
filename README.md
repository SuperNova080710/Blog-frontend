# Blog Frontend

개인 블로그의 프론트엔드 프로젝트입니다.

현재 구현된 NestJS 기반 Blog Backend API와 연동하는 것을 기준으로 개발합니다.

## 기술 스택

* Next.js 16.3.5
* React 19.2.8
* TypeScript
* Tailwind CSS 4
* React Compiler
* ESLint
* Next.js App Router
* Turbopack

## 개발 환경

* Node.js 22.x
* npm

## 실행 방법

의존성을 설치합니다.

```bash
npm install
```

개발 서버를 실행합니다.

```bash
npm run dev -- -p 3001
```

프론트엔드는 `3001` 포트를 사용하며, 백엔드 API는 개발 환경에서 `3000` 포트를 사용합니다.

브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:3001
```

## 주요 명령어

```bash
# 개발 서버
npm run dev

# ESLint 검사
npm run lint

# Production 빌드
npm run build

# Production 서버
npm run start
```

## 프로젝트 구조

```text
src/
└── app/
    ├── favicon.ico
    ├── globals.css
    ├── layout.tsx
    └── page.tsx
```

현재는 Next.js App Router의 초기 구조만 구성되어 있습니다.

향후 기능 구현에 따라 API Client, 인증 상태, 게시글 관련 컴포넌트 및 페이지가 추가될 예정입니다.

## 개발 방향

프론트엔드는 현재 구현된 Backend API를 기준으로 기능을 구현합니다.

개발 순서는 다음과 같이 진행합니다.

1. 공통 레이아웃 및 페이지 구조
2. Backend API Client
3. 인증 API 및 인증 상태
4. 로그인 및 회원가입
5. Access Token / Refresh Token 처리
6. 게시글 목록 및 페이지네이션
7. 게시글 상세
8. 게시글 작성
9. 게시글 수정 및 삭제
10. Loading / Error 처리
11. UI 및 반응형 디자인
12. 운영 환경 구성 및 배포

기능 범위를 임의로 확장하지 않고 GitHub Issue 단위로 개발합니다.
