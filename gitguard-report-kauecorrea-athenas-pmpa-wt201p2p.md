> 🔒 **Localização e sugestão de correção disponíveis no PROguard.** Este relatório FREE mostra o que foi encontrado, não onde nem como corrigir.

# Relatório de Segurança — kauecorrea/athenas-pmpa

**Scan:** `cmtazlngs003bncdwwt201p2p` · MANUAL · branch `main` · commit `5ab6e5e7e1af`
**Status:** COMPLETED · **Executado em:** 2026-08-27T03:52:39.037Z · **Concluído em:** 2026-08-27T03:55:12.471Z
**Relatório gerado em:** 2026-08-27T03:56:26.846Z por GitGuard

## Instruções para a IA que for corrigir isto

- Repositório alvo: kauecorrea/athenas-pmpa, branch "main", commit 5ab6e5e7e1afe7ed3090ee26a491b22ac8e3948f. Aplique as correções diretamente nesse checkout.
- Em "dependencyUpgrades", cada entrada agrupa TODOS os CVEs de um mesmo pacote — faça UM upgrade por pacote (para "recommendedVersion" ou mais recente), não uma correção por CVE.
- Em "secrets", nunca tente adivinhar ou reconstruir o valor original do segredo (ele foi propositalmente redigido) — apenas remova/rotacione conforme "remediation".
- Depois de aplicar as correções, rode os testes existentes do projeto e, se disponível, o linter/build antes de considerar concluído.

## Resumo

- **Total de findings:** 71
- **Por severidade:** HIGH: 20 · MEDIUM: 42 · LOW: 9
- **Por scanner:** TRIVY: 62 · SEMGREP: 9

## Dependências para atualizar

### 📦 `react-router` (12 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `7.13.1` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-42211 | react-router: React Router: Remote Code Execution via prototype pollution in Framework Mode | — |
| HIGH | CVE-2026-42342 | react-router: @remix-run/server-runtime: React Router / Remix: Denial of Service via unbounded path expansion in __manifest endpoint | — |
| HIGH | CVE-2026-55685 | React Router: Unauthenticated Denial of Service via Inefficient Route Matching | — |
| HIGH | — | React Router: RSC Mode CSRF Bypass Allows Action Execution Before 400 Response | — |
| HIGH | CVE-2026-33245 | react-router: React Router: Cross-Site Scripting vulnerability via untrusted React Server Component redirects | — |
| HIGH | CVE-2026-34077 | react-router: React Router: Denial of Service via client-side Cross-Site Scripting in RSC redirect handling | — |
| MEDIUM | CVE-2026-33244 | react-router: React Router: Cross-Site Scripting (XSS) via improper HTTP Location header neutralization | — |
| MEDIUM | CVE-2026-40181 | react-router: React Router: Open redirect vulnerability via specially crafted URLs | — |
| MEDIUM | CVE-2026-53666 | React Router: Arbitrary Constructor Injection via deserializeErrors() in React Router SSR Hydration | — |
| MEDIUM | CVE-2026-53667 | React Router: RSCErrorHandler Missing Protocol Validation (XSS) | — |
| MEDIUM | CVE-2026-53669 | React Router: Open redirect via backslash in <Link> and useNavigate (CVE-2025-68470 bypass) | — |
| LOW | CVE-2026-53663 | react-router: @remix-run/server-runtime: React Router: Insufficient CSRF protection allows integrity impact | — |

### 📦 `xlsx` (2 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `0.18.5` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2023-30533 | Prototype Pollution in sheetJS | — |
| HIGH | CVE-2024-22363 | SheetJS Regular Expression Denial of Service (ReDoS) | — |

### 📦 `axios` (28 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `1.13.6` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-42033 | axios: Axios: HTTP Transport Hijacking via Prototype Pollution | — |
| HIGH | CVE-2026-42035 | axios: Axios: Arbitrary HTTP header injection via prototype pollution | — |
| HIGH | CVE-2026-42043 | axios: Axios: NO_PROXY bypass via crafted URL | — |
| HIGH | CVE-2026-42264 | axios: Axios: Prototype pollution allows information disclosure and request manipulation | — |
| HIGH | CVE-2026-44486 | axios: Axios: Information disclosure of proxy credentials via HTTP redirects | — |
| HIGH | CVE-2026-44487 | axios: Axios: Information disclosure of proxy credentials via redirect flows | — |
| HIGH | CVE-2026-44488 | axios: Axios: Denial of Service due to unenforced request and response size limits | — |
| HIGH | CVE-2026-44494 | axios: Axios: Man-in-the-Middle (MITM) attack via Prototype Pollution | — |
| HIGH | CVE-2026-44495 | axios: Axios: Information disclosure due to prototype pollution vulnerability | — |
| HIGH | CVE-2026-44496 | axios: Axios: Client-side Denial of Service via unescaped regex metacharacters in XSRF cookie name | — |
| MEDIUM | CVE-2025-62718 | axios: Axios: Server-Side Request Forgery and proxy bypass due to improper hostname normalization | — |
| MEDIUM | CVE-2026-40175 | axios: Axios: Remote Code Execution via Prototype Pollution escalation | — |
| MEDIUM | CVE-2026-42034 | axios: Axios: Denial of Service via oversized streamed uploads bypassing body limits | — |
| MEDIUM | CVE-2026-42036 | axios: Axios: Denial of Service via unbounded stream consumption when 'responseType: 'stream'' is used | — |
| MEDIUM | CVE-2026-42037 | axios: Node.js: Axios: Information disclosure via CRLF injection in multipart Content-Type header | — |
| MEDIUM | CVE-2026-42038 | axios: Axios: Information disclosure due to `no_proxy` bypass | — |
| MEDIUM | CVE-2026-42039 | axios: Node.js: Axios: Denial of Service via unbounded recursion in toFormData with deeply nested request data | — |
| MEDIUM | CVE-2026-42041 | axios: Axios: Authentication bypass due to prototype pollution of HTTP error handling | — |
| MEDIUM | CVE-2026-42042 | axios: Axios: XSRF token bypass leading to information disclosure | — |
| MEDIUM | CVE-2026-42044 | axios: Axios: Invisible JSON Response Tampering via Prototype Pollution Gadget | — |
| MEDIUM | CVE-2026-44490 | axios: Axios: Information disclosure and denial of service due to prototype pollution | — |
| MEDIUM | — | Axios: Excessive recursion in formDataToJSON can cause denial of service | — |
| MEDIUM | — | Axios: Nested axios option objects can consume polluted prototype values | — |
| MEDIUM | — | Axios: Fetch adapter `ReadableStream` uploads bypass `maxBodyLength` | — |
| MEDIUM | — | Axios: Prototype pollution gadgets can alter axios request construction | — |
| MEDIUM | — | Axios: HTTP/2 streamed uploads bypass `maxBodyLength` | — |
| MEDIUM | — | Axios: Deep formToJSON Key Recursion Can Cause Denial of Service | — |
| LOW | CVE-2026-42040 | axios: Axios: Incorrect null byte handling can lead to data integrity issues | — |

### 📦 `form-data` (1 CVE) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `4.0.5` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-12143 | form-data: form-data: Form field override via CRLF injection | — |

### 📦 `path-to-regexp` (2 CVEs) — severidade máxima: HIGH

**Ação recomendada:** atualizar de `8.3.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| HIGH | CVE-2026-4926 | path-to-regexp: path-to-regexp: Denial of Service via crafted regular expressions | — |
| MEDIUM | CVE-2026-4923 | path-to-regexp: path-to-regexp: Denial of Service via specially crafted paths with multiple wildcards | — |

### 📦 `dompurify` (13 CVEs) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `3.3.3` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-65898 | DOMPurify before 3.4.11 fails to clone the ALLOWED_ATTR allowlist when ... | — |
| MEDIUM | CVE-2026-65902 | DOMPurify before 3.4.7 (affected versions <= 3.4.5) passes direct refe ... | — |
| MEDIUM | CVE-2026-65903 | dompurify: DOMPurify: Security bypass allows injection of malicious content | — |
| MEDIUM | CVE-2026-41238 | DOMPurify: DOMPurify: Cross-Site Scripting bypass via prototype pollution | — |
| MEDIUM | CVE-2026-41239 | DOMPurify: Vue 2: DOMPurify: Cross-site scripting due to incomplete sanitization of template expressions | — |
| MEDIUM | CVE-2026-41240 | DOMPurify: DOMPurify: Cross-Site Scripting (XSS) via inconsistent tag sanitization | — |
| MEDIUM | CVE-2026-49458 | dompurify: DOMPurify: Cross-site scripting due to improper sanitization of DOM nodes | — |
| MEDIUM | CVE-2026-49459 | dompurify: DOMPurify: Cross-site scripting bypass allows arbitrary script execution | — |
| MEDIUM | CVE-2026-49978 | dompurify: DOMPurify: Cross-site scripting vulnerability allows code execution | — |
| LOW | CVE-2026-65899 | DOMPurify 3.0.0 before 3.4.9 does not reset the retained Trusted Types ... | — |
| LOW | CVE-2026-65900 | DOMPurify versions >=3.0.0 and before 3.4.8, when configured with SAFE ... | — |
| LOW | — | DOMPurify: `CUSTOM_ELEMENT_HANDLING` bypasses `afterSanitizeElements` for allowed custom elements. | — |
| LOW | CVE-2026-65901 | DOMPurify through 3.4.6 contains a cross-site scripting vulnerability  ... | — |

### 📦 `follow-redirects` (1 CVE) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `1.15.11` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | — | follow-redirects leaks Custom Authentication Headers to Cross-Domain Redirect Targets | — |

### 📦 `ip-address` (1 CVE) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `10.1.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-42338 | ip-address: ip-address: Cross-site scripting via improper HTML escaping of untrusted input | — |

### 📦 `qs` (1 CVE) — severidade máxima: MEDIUM

**Ação recomendada:** atualizar de `6.15.0` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| MEDIUM | CVE-2026-8723 | ### Summary    `qs.stringify` throws `TypeError` when called with `arr ... | — |

### 📦 `body-parser` (1 CVE) — severidade máxima: LOW

**Ação recomendada:** atualizar de `2.2.2` para `a versão mais recente` (ou superior).

| Severidade | CVE | Descrição | Corrigido em |
|---|---|---|---|
| LOW | CVE-2026-12590 | body-parser: body-parser: Denial of Service via invalid limit option | — |

## Outros findings

| Severidade | Scanner | Categoria | Título | Local |
|---|---|---|---|---|
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| MEDIUM | SEMGREP | SAST | Semgrep Finding: rules.ajinabraham.njsscan.generic.error_disclosure.generic_error_disclosure | — |
| LOW | SEMGREP | SAST | Semgrep Finding: rules.javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring | — |
| LOW | SEMGREP | SAST | Semgrep Finding: rules.javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring | — |
