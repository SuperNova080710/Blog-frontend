# 컨테이너 이미지 준비 및 검증 (#22)

> 상태: **Node 24.22.2 / Next.js 16.4.3에서 npm ci·ESLint·프로덕션 빌드 PASS, npm audit(전체/프로덕션) 0건**. 보안 커밋 `3641ae0` 원격 PR #25에 반영. Docker 실행·SSR/API/WAF 통합·K3s 배포는 미검증
> 연계: [2차 네트워크 프로젝트 #22](https://github.com/SuperNova080710/2nd-project-docs/issues/22), [#24](https://github.com/SuperNova080710/2nd-project-docs/issues/24), [#26](https://github.com/SuperNova080710/2nd-project-docs/issues/26)

## 변경 목적

기존 Next.js 16 애플리케이션을 K3s에 배포할 수 있도록 Node.js 24 멀티스테이지 Docker 이미지와 `output: "standalone"` 설정을 추가합니다. 최종 이미지는 비특권 사용자로 동작하도록 설계했습니다. 실제 서비스가 준비되었다는 뜻은 아닙니다.

## API 경로 구분

| 변수 | 환경 | 역할 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | **이미지 빌드 시** | 브라우저에서 접근할 API 진입 주소. 초기 후보는 같은 출처 `/api`. 클라이언트 코드에 포함되는 공개 값 |
| `API_INTERNAL_BASE_URL` | **서버 런타임** | Next.js 서버 컴포넌트가 호출할 내부 백엔드 주소. 예: `http://blog-api:3000` (Kubernetes Service 주소/실제 포트는 후속 설계에서 확정) |

`src/api/client.ts`에서는 서버 측 요청에 `API_INTERNAL_BASE_URL`을 우선 적용하고, 없으면 기존 공개 API 값을 사용합니다. 현재 Vercel 환경에서 공개 URL만 설정된 기존 동작은 유지하도록 설계했습니다.

**중요:** `NEXT_PUBLIC_*` 값은 이미지 빌드 시 번들에 고정됩니다. 이를 JWT, DB 비밀번호 등 비밀정보에 사용하면 안 됩니다. 브라우저가 `/api`를 사용하려면 별도의 Ingress/리버스 프록시가 해당 경로를 API/WAF 체인으로 전달해야 합니다. Next.js 서버 컴포넌트의 내부 API 호출은 WAF를 우회할 수 있으므로 별도의 신뢰 경계와 접근 제어가 필요합니다.

## 승인된 별도 개발 환경에서 검증할 명령

**SSH-only 운영 서버에서는 아래 `docker build`/`docker run`을 실행하지 않습니다.** Docker는 빌드/실행 과정에서 디스크와 네트워크 상태를 변경할 수 있습니다. K3s/기존 Docker/방화벽 변경 승인이 나기 전까지는 격리된 개발 환경에서 시험합니다.

```bash
# 이 PR 브랜치를 체크아웃한 별도 개발 환경에서 실행
npm ci
npm run lint
NEXT_PUBLIC_API_BASE_URL=/api npm run build

# Docker 이미지 빌드 (환경에 Docker 엔진 필요)
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=/api \
  --tag blog-frontend:issue-22 .
```

빌드 성공 후에는 별도 개발 환경에서만 루프백 바인딩으로 런타임을 확인합니다.

```bash
docker run --rm --name blog-frontend-issue22 \
  -p 127.0.0.1:3100:3000 \
  blog-frontend:issue-22
```

다른 터미널에서 초기 UI 응답을 점검할 수 있습니다.

```bash
curl -I http://127.0.0.1:3100/
```

이 단계에서는 `/api` 프록시 및 실제 백엔드가 없으므로 **로그인, 게시글 상세 SSR, API 요청 정상 동작을 보장하거나 완료 처리하지 않습니다.** 그러한 시험은 별도 내부 API 주소, 프록시 및 새 프로젝트 DB가 구성된 이후 실행합니다.

## 2026-10-30 Ubuntu 터미널 1차 검증

`feat/22-nextjs-container-image`를 사용자 Ubuntu 터미널에서 체크아웃하고 `npm ci`, `npm run lint`, `NEXT_PUBLIC_API_BASE_URL=/api npm run build`를 실행한 결과입니다.

| 검사 | 결과 | 해석 |
| --- | --- | --- |
| `npm ci` | PASS, 451 packages | `EBADENGINE`과 npm audit 취약점 경고 6건 별도 조치 필요 |
| `npm run lint` | PASS | ESLint 종료 오류 없음 |
| `next build` 컴파일 및 TypeScript | PASS | 컴파일·타입 점검 완료 |
| `/posts` 사전 렌더링 | FAIL | `useSearchParams()`가 `Suspense` 경계 밖에 존재 |
| 초기 프로덕션 빌드 종료 | FAIL (exit 1) | 성공으로 보고하지 않음 |

후속 수정: `src/app/posts/page.tsx`의 검색 파라미터 호출을 `Suspense` 하위 컴포넌트로 이동하고 화면 로딩 fallback 추가, `next.config.ts`에 `turbopack.root = process.cwd()` 명시. **2026-10-30 재실행에서 build PASS**: 컴파일·TypeScript 통과, 정적 페이지 8/8 생성 및 `/posts` prerender 정상.

Node `v22.11.0`에서 `eslint-visitor-keys@5.0.1`의 요구 조건 `^22.13.0` 이상을 만족하지 않아 경고가 발생합니다. 해당 구버전 환경에서는 경고가 있었습니다. 당시 감사 결과: **프로덕션 4건(High 3, Critical 1), 전체 6건(High 5, Critical 1)**. 이후 Node 24와 보안 패치 적용으로 둘 다 0건을 확인했습니다. 취약 경로 및 조치 이력은 [보안 점검 이슈 #26](../issues/26)을 참고합니다. `npm audit fix --force`를 무조건 실행하지 않습니다.

## 별도 환경 재검증 명령

```bash
git fetch origin feat/22-nextjs-container-image
git switch feat/22-nextjs-container-image
git pull --ff-only
node -v
npm ci
npm run lint
NEXT_PUBLIC_API_BASE_URL=/api npm run build
npm audit --omit=dev
```

위 검증을 수행한 Ubuntu 장비가 실제 SSH-only 운영 서버와 동일한 장비인지는 확인되지 않았습니다. Docker 빌드·실행 단계는 별도 격리 개발 환경을 권장하며, K3s/UFW/iptables 변경은 별도 승인 전 진행하지 않습니다.

## 프로덕션 의존성 취약점 조치 결과 (2026-10-30)

기존 `next@16.3.5` 및 전이 의존성의 감사 경고를 확인하고, 사용자 Ubuntu 환경에서 명시적 버전 업데이트 + `npm audit fix`(비강제)를 실행했습니다. 관련 두 파일은 사용자 커밋 [`3641ae0`](https://github.com/SuperNova080710/Blog-frontend/commit/3641ae05991941cd96cf8415ddd3df9f2fb8f3dc)으로 PR #25에 push됐습니다.

| 패키지 | 기존 | 갱신된 원격 lockfile |
| --- | --- | --- |
| next | 16.3.5 | **16.4.3** |
| eslint-config-next | 16.3.5 | **16.4.3** |
| follow-redirects | 1.16.0 | **1.16.2** |
| sharp | 0.35.4 | **0.35.5** |
| source-map-js | 1.2.1 | **1.2.2** |
| zod | 4.6.5 | **4.6.7** |
| brace-expansion | 1.1.18 외 중복 | **1.1.21 / 5.0.12** |

**실측 결과:** Node v24.22.2, npm 11.19.1에서 `npm ci`(취약점 0건), `npm run lint` PASS, `NEXT_PUBLIC_API_BASE_URL=/api npm run build` PASS(정적 8/8, 동적 `/posts/[id]`), `npm audit --omit=dev` 0건, `npm audit` 0건. `git diff --check`도 빈 출력으로 통과했고, 변경 파일은 `package.json`과 `package-lock.json` 2개였습니다. GitHub PR 비교 결과 병합 충돌은 `clean`이지만, 이는 이미지 런타임 검증이나 운영 배포 승인과 다릅니다.

**잔여 경고:** npm 11은 `unrs-resolver@1.12.2`의 `postinstall`이 allowScripts의 승인 대상이 아니라고 출력했습니다. `npm install-scripts ls`에서 재확인했으며, 변경을 일으키는 일괄 허용 명령은 실행하지 않았습니다. ESLint `9.39.5`의 지원 종료(deprecated) 경고도 남아 있습니다. 두 경고는 현재 lint/build 실패나 npm audit 취약점으로 판정하지 않지만, 관련 스크립트의 런타임 영향/호환성은 추가 검토합니다.

**남은 게이트:** Docker 이미지 실제 빌드·기동, 컨테이너의 비특권 사용자 확인, 이미지 내 비밀정보 검사, 베이스 이미지 digest 고정, 프록시와 SSR 내부 API 통신 통합 검증. SSH-only 운영 서버에서 Docker/K3s/방화벽을 변경하지 않습니다.

## 배포 전 필수 검증

- [x] Ubuntu 기능 브랜치의 Node 24.22.2에서 `npm ci`, ESLint, Next.js 16.4.3 프로덕션 빌드 PASS
- [x] 취약점 패치·lockfile 갱신 커밋 `3641ae0` push 및 prod/전체 `npm audit` 0건 검증
- [ ] Docker 이미지 빌드 및 `server.js` 기동, 비특권 실행 확인
- [ ] 이미지에 `.env`·비밀정보·개인 DB 파일 포함되지 않았음 확인
- [ ] Node.js 베이스 이미지 버전/불변 digest 확정, 이미지 태그·digest 기록
- [ ] 프론트와 백엔드의 실제 Kubernetes Service 주소·포트 확인
- [ ] 브라우저 `/api` → WAF → API 경유 확인, SSR 내부 API 경계 검증
- [ ] 인증·게시글 목록/상세/작성 기능과 404, 재시작 회귀 확인
- [ ] SSH-only 서버에서 K3s 설치/네트워크 활성화는 독립 복구 경로 확보·#34 정책 승인 전 **금지**

변경 범위: `Dockerfile`, `.dockerignore`, `next.config.ts`, `src/api/client.ts`, `src/app/posts/page.tsx`, `package.json`, `package-lock.json`, 이 문서. 기존 프로덕션 배포는 이 PR을 병합하지 않는 한 변경되지 않습니다.
