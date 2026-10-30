# 컨테이너 이미지 준비 및 검증 (#22)

> 상태: 코드/설정 초안, **Docker 이미지 빌드·실행·K3s 배포 미검증**
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

## 배포 전 필수 검증

- [ ] `npm ci`, ESLint, Next.js 빌드 실제 PASS
- [ ] Docker 이미지 빌드 및 `server.js` 기동, 비특권 실행 확인
- [ ] 이미지에 `.env`·비밀정보·개인 DB 파일 포함되지 않았음 확인
- [ ] Node.js 베이스 이미지 버전/불변 digest 확정, 이미지 태그·digest 기록
- [ ] 프론트와 백엔드의 실제 Kubernetes Service 주소·포트 확인
- [ ] 브라우저 `/api` → WAF → API 경유 확인, SSR 내부 API 경계 검증
- [ ] 인증·게시글 목록/상세/작성 기능과 404, 재시작 회귀 확인
- [ ] SSH-only 서버에서 K3s 설치/네트워크 활성화는 독립 복구 경로 확보·#34 정책 승인 전 **금지**

변경 범위: `Dockerfile`, `.dockerignore`, `next.config.ts`, `src/api/client.ts`. 기존 프로덕션 배포는 이 PR을 병합하지 않는 한 변경되지 않습니다.
