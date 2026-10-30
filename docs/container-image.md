# 컨테이너 이미지 준비 및 검증 (#22)

> 상태: Ubuntu에서 npm ci/ESLint 및 **수정 후 Next.js 프로덕션 빌드 PASS**. **Critical 포함 audit 취약점 6건 및 컨테이너 실행/K3s 배포 미검증**
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

Node `v22.11.0`에서 `eslint-visitor-keys@5.0.1`의 요구 조건 `^22.13.0` 이상을 만족하지 않아 경고가 발생합니다. Node 24 LTS 또는 지원되는 최신 22.x에서 재검증합니다. 상세 감사 결과: **프로덕션 4건(High 3, Critical 1), 전체 6건(High 5, Critical 1)**. 취약 경로 및 조치 이력은 [보안 점검 이슈 #26](../issues/26)을 참고합니다. `npm audit fix --force`를 무조건 실행하지 않습니다.

## 수정 후 재검증 예정

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

## 프로덕션 의존성 취약점 조치 (2026-10-30)

빌드가 성공해도 현재 고정된 `next@16.3.5`에 **Critical** 보안 공지가 적용됩니다. 운영 이미지 배포를 진행하지 않습니다.

| 패키지 | lockfile 현재 | 패치 후보 / 기준 |
| --- | --- | --- |
| next | 16.3.5 | 16.4.3 (동일 메이저의 안정 릴리스) |
| eslint-config-next | 16.3.5 | 16.4.3 (Next와 버전 정렬) |
| follow-redirects | 1.16.0 | 1.16.1 이상 |
| sharp | 0.35.4 | 0.35.5 이상 |
| source-map-js | 1.2.1 | 1.2.2 이상 |
| zod | 4.6.5 | 4.6.6 이상 |
| brace-expansion | 1.1.18 등 중복 | `npm audit`에서 패치 가능한 버전 검토 |

**중요:** 이 파일은 대응 계획입니다. 패키지/잠금 파일은 아직 바꾸지 않았습니다. 변경 결과를 검증하지 않은 상태에서 수동으로 lockfile의 버전·integrity 값을 덮어쓰지 않습니다.

별도 개발 환경에서 Node 24 LTS 또는 지원되는 22.x로 전환한 뒤, **현재 브랜치의 작업 트리가 깨끗한지 먼저 확인**하고 아래를 실행합니다.

```bash
git status --short
node -v

# 패키지와 lockfile을 npm이 함께 갱신하도록 함
npm install --save-exact next@16.4.3 eslint-config-next@16.4.3
npm audit fix

# lockfile/프로덕션 버전·호환성·보안 검증
git diff -- package.json package-lock.json
npm ci
npm run lint
NEXT_PUBLIC_API_BASE_URL=/api npm run build
npm audit --omit=dev
npm audit
```

`npm audit fix`는 비강제 수정만 허용하고, 원치 않는 광범위 변경이 나오면 적용 내용을 리뷰합니다. **최종 패키지 업데이트/검증이 PASS여야 관련 변경을 PR 브랜치에 푸시하고 배포를 재검토**합니다.

공식 참고: [Next.js 16.4.3](https://github.com/vercel/next.js/releases/tag/v16.4.3), [Next RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr), [sharp](https://github.com/advisories/GHSA-wq5f-xc86-pv6w), [follow-redirects](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8), [source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q), [zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).

## 배포 전 필수 검증

- [x] Ubuntu 기능 브랜치의 `npm ci`, ESLint, 수정 후 Next.js 빌드 PASS (현재 Node 22.11.0 엔진 경고 남음)
- [ ] 취약점 패치·lockfile 재생성 후 `npm ci`/lint/build 재검증 및 prod/전체 audit 통과
- [ ] Docker 이미지 빌드 및 `server.js` 기동, 비특권 실행 확인
- [ ] 이미지에 `.env`·비밀정보·개인 DB 파일 포함되지 않았음 확인
- [ ] Node.js 베이스 이미지 버전/불변 digest 확정, 이미지 태그·digest 기록
- [ ] 프론트와 백엔드의 실제 Kubernetes Service 주소·포트 확인
- [ ] 브라우저 `/api` → WAF → API 경유 확인, SSR 내부 API 경계 검증
- [ ] 인증·게시글 목록/상세/작성 기능과 404, 재시작 회귀 확인
- [ ] SSH-only 서버에서 K3s 설치/네트워크 활성화는 독립 복구 경로 확보·#34 정책 승인 전 **금지**

변경 범위: `Dockerfile`, `.dockerignore`, `next.config.ts`, `src/api/client.ts`. 기존 프로덕션 배포는 이 PR을 병합하지 않는 한 변경되지 않습니다.
