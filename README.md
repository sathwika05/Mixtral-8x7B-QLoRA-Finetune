# Mixtral-8x7B · QLoRA Fine-Tuning

Fine-tuning a 47-billion-parameter mixture-of-experts model on a single GPU, and
serving it — the training run, the deployment, and the inference console that
calls it, in one repository.

![Mixtral-8x7B QLoRA fine-tuning](public/mixtral-qlora-fine-tuning.png)

<p align="left">
  <img alt="Mixtral-8x7B-v0.1" src="https://img.shields.io/badge/base-Mixtral--8x7B--v0.1-15413a">
  <img alt="QLoRA" src="https://img.shields.io/badge/method-QLoRA%204--bit%20NF4-1b7a4b">
  <img alt="AWS SageMaker" src="https://img.shields.io/badge/serving-SageMaker%20%C2%B7%20Lambda%20%C2%B7%20API%20Gateway-9a5b00">
  <img alt="Next.js" src="https://img.shields.io/badge/app-Next.js%2016%20%C2%B7%20TypeScript-14201b">
</p>

---

## What this is

Mixtral-8x7B has roughly 47B parameters. In BF16 that is about 94 GB of weights —
more than any single accessible GPU holds. This project loads it in **4-bit NF4**,
freezes it, and trains **LoRA adapters** over the frozen base, which puts the run
on one GPU and leaves roughly **3.96%** of parameters trainable.

The result is deployed to a SageMaker endpoint behind Lambda and API Gateway, and
this repository's web application calls it.

Two things are deliberately separate throughout, because conflating them is the
most common way an ML demo misleads:

```
Development lifecycle   Dolly 15K → Mixtral-8x7B → 4-bit NF4 → QLoRA → Adapter → Deployment
      (historical)

Runtime request path    Browser → /api/inference → API Gateway → Lambda → SageMaker → Response
      (per request)
```

A user's request does not pass through training. Only the runtime path animates
in the UI.

## Training

| | |
|---|---|
| Base model | Mixtral-8x7B-v0.1 (sparse MoE, 8 experts) |
| Dataset | Databricks Dolly 15K (`databricks/databricks-dolly-15k`) |
| Quantization | 4-bit NF4 |
| Compute dtype | BF16 |
| Gradient checkpointing | Enabled |
| LoRA rank / alpha | 64 / 16 |
| Trainable parameters | ~3.96% |
| Epochs | 2 |
| Batch size | 2 |
| Learning rate | 2e-4 |

Run on a SageMaker managed training job. The console reported the job
**Completed in approximately 7 hours**, and the CloudWatch log ends at
**1528/1528 steps** with the training toolkit reporting `SUCCESS`.

The notebooks and the training entry point are in [`training/`](training/).

### On the numbers

Every figure above is either a configuration value or a reading taken from the
AWS console. Round-trip latency is measured directly: timed end to end,
server-side, for a real request, and labeled as a total. Individual hops are not
timed, and the request-path animation shows topology and progress only.

Values that were not recorded stay `null` in [`data/model.ts`](data/model.ts) and
render as "Not recorded" rather than being filled with something plausible.

## Serving

```
Browser  →  Next.js /api/inference  →  API Gateway  →  Lambda  →  SageMaker Endpoint
                    (server)                                       fine-tuned Mixtral
```

The browser never learns where the model lives. `MIXTRAL_API_URL` and
`MIXTRAL_API_KEY` are read only inside route handlers, in a single module, and
the only endpoints exposed to the client are `/api/inference` and `/api/health`.
[`tests/architecture/boundaries.test.ts`](tests/architecture/boundaries.test.ts)
fails the build if a component, page, or hook so much as references them.

The deployed Lambda fixes generation settings server-side, so the app sends
`{ prompt }` alone and shows the parameters as read-only. Setting
`MIXTRAL_SUPPORTS_PARAMETERS=true` enables sending them, with no code change,
against a handler that accepts them.

### Endpoint status is never guessed

`GET /api/health` inspects configuration and **never contacts AWS**, because a
reachability check costs a real model invocation. So the app distinguishes
`configured` (environment is set, nothing contacted) from `reachable`, and the
latter is earned only by an explicit probe or a completed run. It never displays
"LIVE", and it never attributes a slow first request to a cold start it cannot
observe.

## Running it

```bash
cp .env.example .env.local     # set MIXTRAL_API_URL
npm install
npm run dev                    # http://localhost:3000
```

```bash
npm test          # 158 tests
npm run build
```

The app runs without an endpoint configured — it reports `not_configured` and
declines to invoke, rather than failing at startup.

## Deploying

The app needs a host that runs a Next.js server. A static export cannot serve it,
because `/api/inference` is what holds the endpoint credentials — without that
route the browser would have to carry them.

On Vercel: **Add New → Project**, import this repository, and leave the detected
framework settings alone. Set the environment before the first build, since
variables are read when the build runs rather than when the server starts, so a
later change needs a redeploy rather than a restart.

Every `MIXTRAL_*` variable is server-only and belongs in the host's dashboard,
never in the repository. `MIXTRAL_TIMEOUT_MS` should sit below the host's own
function time limit, so a slow request produces the app's timeout message rather
than the platform's error page.

`NEXT_PUBLIC_SITE_URL` is optional. It overrides the origin used for Open Graph
and canonical URLs, which otherwise resolves from the host's deployment URL.

[`render.yaml`](render.yaml) declares the same build, health check, and
environment for a Render blueprint deploy.

## Layout

| Path | |
|---|---|
| `app/` | Routes: overview, inference, case study, pipeline, and the two API handlers |
| `lib/inference/` | Config, prompt template, request/response adapter, and the single I/O client |
| `hooks/` | The only path from the UI to the backend |
| `data/` | Owner-editable facts: model, lifecycle, runtime nodes, evidence manifest |
| `components/` | Console, flow diagrams, case-study, and evidence components |
| `training/` | Notebooks and the training entry point that produced the adapter |
| `tests/` | Unit, component, and architectural boundary tests |
