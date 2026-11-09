// The interest taxonomy and the rules that put a session under an interest.
//
// Liam's ask (2026-11-08): "categorize talks based on core interests of each team member: storage
// and performance for Matt, testing things for Mason, operators, DRA, disagg etc for me, and agents
// and agentic stuff for you [Rich]". Rich: "make sure it aligns with things like inference, HPC,
// storage, operators, scheduling, training, disagg p&d, etc. and maybe come up with a custom mapping
// per event."
//
// HOW A SESSION IS TAGGED. Every interest has keyword rules. A rule is a regular expression (whole
// words, case-insensitive unless `cs`, for acronyms that are also words: DRA, MIG, CI). Each hit
// scores by where it lands: the title and the track/topic/project labels are worth 3, the abstract
// 1 per distinct rule (not per occurrence, so a talk that says "storage" nine times is not nine
// times as much about storage). An interest applies at `THRESHOLD` or more. So: one title hit is
// enough; a track label alone is not quite, it needs one supporting mention in the abstract; three
// different storage words in the abstract are enough. The hits are kept as the `why` the app shows.
//
// Then data/overrides.json (hand corrections per session id, `add` and `remove`) is applied last
// and always wins — that is the "custom mapping per event".

export const THRESHOLD = 3

/** @typedef {{ id: string, label: string, blurb: string, rules: (string | { re: string, cs?: boolean, w?: number })[] }} Interest */

/** @type {Interest[]} */
export const INTERESTS = [
  {
    id: 'inference',
    label: 'Inference',
    blurb: 'serving models: vLLM, llm-d, KServe, inference gateways, KV cache, latency per token',
    rules: [
      'inference', 'inferenc\\w*', 'model serving', 'serving', 'vllm', 'llm-d', 'kserve', 'sglang',
      'tensorrt', 'triton', 'inference gateway', 'ai gateway', 'kv[- ]cache', 'quantiz\\w*',
      'tokens? per second', 'time to first token', 'ttft', 'model server', 'llm serving',
      'generative ai', 'open[- ]weight', 'ollama', 'nvidia dynamo', 'speculative decoding',
      { re: 'LLMs?', cs: true }, 'large language model', 'model router', 'model routing',
    ],
  },
  {
    id: 'agents',
    label: 'Agents & agentic',
    blurb: 'agents, MCP, A2A, kagent, multi-agent systems, RAG, copilots, tool calling',
    rules: [
      'agents?', 'agentic', 'multi[- ]agent', 'mcp', 'model context protocol', 'kagent', 'a2a',
      'agent[- ]to[- ]agent', 'tool[- ]calling', 'copilot', 'rag', 'retrieval[- ]augmented',
      'ai assistant', 'autonomous', 'langchain', 'langgraph', 'crewai', 'openai agents', 'agentgateway',
      'claude code', 'coding agent', 'ai[- ]native', 'prompt injection',
    ],
  },
  {
    id: 'training',
    label: 'Training & fine-tuning',
    blurb: 'distributed training, fine-tuning, Kubeflow, JobSet, checkpoints, RL',
    rules: [
      'training', 'fine[- ]?tun\\w*', 'pre[- ]?training', 'kubeflow', 'pytorch', 'jobset',
      'training operator', 'trainer', 'lora', 'rlhf', 'reinforcement learning', 'checkpoint\\w*',
      'distributed training', 'ray', 'model training', 'mlops', 'ml pipelines?', 'notebook',
    ],
  },
  {
    id: 'disagg',
    label: 'Disaggregated P/D',
    blurb: 'prefill/decode disaggregation, KV cache transfer, LMCache, NIXL, Dynamo',
    rules: [
      'disaggregat\\w*', 'prefill', 'decode', 'p/d', 'prefill[- /]decode', 'kv[- ]cache transfer',
      'lmcache', 'nixl', 'dynamo', 'kv[- ]cache', 'cache[- ]aware routing', 'prefix[- ]cach\\w*',
    ],
  },
  {
    id: 'dra',
    label: 'DRA & devices',
    blurb: 'Dynamic Resource Allocation, device plugins, GPU sharing, MIG, accelerator management',
    rules: [
      { re: 'DRA', cs: true }, 'dynamic resource allocation', 'device plugins?', 'resourceclaims?',
      'resourceslices?', 'deviceclass\\w*', 'device management', 'gpu sharing', 'gpu[- ]slicing',
      { re: 'MIG', cs: true }, 'time[- ]slicing', 'hami', 'accelerator sharing', 'device attributes?',
      'partitionable devices?', 'node resource', 'gpu operator', 'cohdi', 'composable',
    ],
  },
  {
    id: 'gpu',
    label: 'GPUs & accelerators',
    blurb: 'NVIDIA, AMD, TPU, Gaudi, NPU; getting the most out of expensive silicon',
    rules: [
      'gpus?', 'accelerators?', 'tpus?', 'nvidia', 'amd', 'rocm', 'cuda', 'gaudi', 'npus?',
      'gpu utilization', 'gpu cluster', 'nccl', 'infiniband', 'rdma', 'nvlink', 'xpu', 'intel gpu',
    ],
  },
  {
    id: 'hpc',
    label: 'HPC & batch',
    blurb: 'batch workloads, gang scheduling, Kueue, Volcano, Slurm, MPI, supercomputing',
    rules: [
      'hpc', 'high[- ]performance computing', 'batch', 'mpi', 'slurm', 'supercomput\\w*', 'kueue',
      'volcano', 'gang[- ]scheduling', 'job queue\\w*', 'queueing', 'armada', 'workload manager',
      'scientific computing', 'simulation', 'research computing', 'exascale', 'batch jobs?',
    ],
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    blurb: 'the scheduler, topology-aware placement, preemption, Kueue, Volcano, KAI, YuniKorn',
    rules: [
      'schedul\\w*', 'kueue', 'volcano', 'kai scheduler', 'yunikorn', 'topology[- ]aware',
      'bin[- ]packing', 'preempt\\w*', 'placement', 'node affinity', 'taints?', 'tolerations?',
      'pod topology', 'scheduler plugins?', 'workload placement', 'descheduler', 'koordinator',
    ],
  },
  {
    id: 'autoscaling',
    label: 'Autoscaling',
    blurb: 'HPA, VPA, KEDA, Karpenter, cluster autoscaler, scale to zero',
    rules: [
      'autoscal\\w*', 'auto[- ]scal\\w*', 'hpa', 'vpa', 'keda', 'karpenter', 'cluster autoscaler',
      'scale[- ]to[- ]zero', 'right[- ]?siz\\w*', 'elastic\\w*', 'node provisioning', 'horizontal pod',
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    blurb: 'CSI, volumes, Rook/Ceph, Longhorn, object storage, backup, model caching and loading',
    rules: [
      'storage', 'csi', 'persistent ?volumes?', 'pvcs?', 'rook', 'ceph', 'longhorn', 'object storage',
      's3', 'block storage', 'nvme', 'file ?systems?', 'data protection', 'backups?', 'velero',
      'snapshots?', 'model cache', 'model loading', 'model weights', 'openebs', 'minio', 'nfs',
      'volume', 'stateful\\w*', 'data[- ]plane storage', 'disaster recovery', 'replication',
      'container storage', 'storage class\\w*', 'iops', 'throughput', 'local disk\\w*',
    ],
  },
  {
    id: 'performance',
    label: 'Performance',
    blurb: 'latency, throughput, benchmarks, profiling, tail latency, cost of a request',
    rules: [
      'performance', 'performant', 'latency', 'latencies', 'throughput', 'benchmark\\w*', 'optimi[sz]\\w*',
      'profil\\w*', 'p9[59]', 'tail latency', 'efficien\\w*', 'kube-burner', 'load test\\w*',
      'scalability', 'at scale', 'bottleneck\\w*', 'faster', 'speed', 'overhead', 'tuning', 'tune',
      'resource utili[sz]ation', 'utili[sz]ation', 'perf', 'flame ?graphs?', 'cold start\\w*',
    ],
  },
  {
    id: 'testing',
    label: 'Testing & reliability',
    blurb: 'test suites, e2e, conformance, CI, chaos engineering, flakes, release quality',
    rules: [
      'test', 'tests', 'testing', 'tested', 'e2e', 'end[- ]to[- ]end tests?', 'conformance', { re: 'CI', cs: true },
      'ci/cd', 'chaos', 'litmus', 'fuzz\\w*', 'flak\\w*', 'kind', 'integration tests?', 'regression\\w*',
      'prow', 'release engineering', 'quality', 'validat\\w*', 'verification', 'verify', 'reliab\\w*',
      'resilien\\w*', 'fault injection', 'game ?days?', 'canary', 'smoke tests?', 'test[- ]infra',
      'upgrade testing', 'soak', 'load testing', 'correctness', 'bugs?',
    ],
  },
  {
    id: 'operators',
    label: 'Operators & controllers',
    blurb: 'CRDs, controllers, reconciliation, kubebuilder, controller-runtime, OLM',
    rules: [
      'operators?', 'custom resources?', 'crds?', 'controllers?', 'reconcil\\w*', 'kubebuilder',
      'controller-runtime', 'operator framework', 'olm', 'operator sdk', 'declarative api',
      'operator pattern', 'kro', 'metacontroller', 'api extension\\w*', 'aggregated api',
    ],
  },
  {
    id: 'networking',
    label: 'Networking & mesh',
    blurb: 'CNI, Cilium, eBPF, service mesh, Istio, Envoy, Gateway API, ingress, DNS',
    rules: [
      'network\\w*', 'cni', 'cilium', 'ebpf', 'service mesh', 'istio', 'linkerd', 'envoy', 'gateway api',
      'ingress', 'load balanc\\w*', 'dns', 'coredns', 'ovn', 'kube-proxy', 'ipv6', 'multi[- ]cluster networking',
      'kgateway', 'ambient', 'sidecar\\w*', 'mtls', 'egress', 'network polic\\w*', 'hubble', 'bgp',
    ],
  },
  {
    id: 'observability',
    label: 'Observability',
    blurb: 'OpenTelemetry, Prometheus, metrics, traces, logs, SLOs, telemetry pipelines',
    rules: [
      'observab\\w*', 'opentelemetry', 'otel', 'prometheus', 'metrics?', 'tracing', 'traces?', 'logging',
      'logs?', 'grafana', 'fluentd', 'fluent bit', 'telemetry', 'jaeger', 'slos?', 'slis?', 'monitoring',
      'alerting', 'dashboards?', 'perses', 'thanos', 'cortex', 'mimir', 'loki', 'tempo', 'pyroscope',
    ],
  },
  {
    id: 'security',
    label: 'Security',
    blurb: 'supply chain, SBOM, Sigstore, Falco, policy, RBAC, zero trust, SPIFFE, CVEs',
    rules: [
      'secur\\w*', 'supply chain', 'sbom', 'sigstore', 'cosign', 'falco', 'polic\\w*', 'kyverno', 'opa',
      'gatekeeper', 'rbac', 'zero[- ]trust', 'spiffe', 'spire', 'secrets?', 'vulnerab\\w*', 'cves?',
      'confidential computing', 'runtime security', 'compliance', 'attestation', 'hardening',
      'threat\\w*', 'attack\\w*', 'exploit\\w*', 'encrypt\\w*', 'identity', 'authn?', 'authz', 'oidc',
      'tetragon', 'slsa', 'in-toto', 'sandbox\\w*', 'gvisor', 'kata', 'isolation',
    ],
  },
  {
    id: 'platform',
    label: 'Platform engineering',
    blurb: 'internal developer platforms, Backstage, golden paths, self-service, Crossplane',
    rules: [
      'platform engineering', 'platform', 'idp', 'internal developer platform', 'backstage',
      'golden paths?', 'developer experience', 'devex', 'crossplane', 'self[- ]service', 'developer portal',
      'platform team\\w*', 'paved (?:road|path)s?', 'cognitive load', 'kratix', 'score', 'radius', 'dapr',
    ],
  },
  {
    id: 'delivery',
    label: 'GitOps & delivery',
    blurb: 'Argo, Flux, CI/CD, progressive delivery, Helm, canaries, release pipelines',
    rules: [
      'gitops', 'argo ?cd', 'argo', 'flux', 'ci/cd', 'cicd', 'progressive delivery', 'canar\\w*',
      'helm', 'continuous delivery', 'continuous deployment', 'tekton', 'pipelines?', 'deployment\\w*',
      'rollouts?', 'blue[- /]green', 'release\\w*', 'kustomize', 'oci artifacts?', 'buildpacks?', 'dagger',
    ],
  },
  {
    id: 'multicluster',
    label: 'Multi-cluster & fleet',
    blurb: 'fleets, Karmada, OCM, Cluster API, hybrid and multi-cloud',
    rules: [
      'multi[- ]?clusters?', 'fleets?', 'karmada', 'open cluster management', 'ocm', 'cluster api',
      'capi', 'hybrid[- ]cloud', 'multi[- ]cloud', 'federat\\w*', 'thousands of clusters', 'hundreds of clusters',
      'cluster lifecycle', 'cluster management', 'k8gb', 'liqo', 'submariner', 'clusterset\\w*',
    ],
  },
  {
    id: 'edge',
    label: 'Edge & telco',
    blurb: 'edge, IoT, k3s, KubeEdge, resource-constrained nodes, 5G',
    rules: [
      'edge', 'iot', 'k3s', 'k0s', 'kubeedge', 'resource[- ]constrained', 'far edge', '5g', 'telco',
      'telecom\\w*', 'embedded', 'ran', 'retail', 'vehicles?', 'drones?', 'satellite\\w*', 'disconnected',
    ],
  },
  {
    id: 'data',
    label: 'Data & databases',
    blurb: 'Spark, Flink, Kafka, streaming, databases, Vitess, Postgres, vector stores',
    rules: [
      'data processing', 'spark', 'flink', 'kafka', 'strimzi', 'streaming', 'databases?', 'vitess',
      'postgres\\w*', 'mysql', 'data pipelines?', 'vector (?:database|store|db)s?', 'lakehouse', 'iceberg',
      'etl', 'analytics', 'cloudnative[- ]?pg', 'cnpg', 'redis', 'valkey', 'cassandra', 'mongodb', 'data lake',
      'feature store', 'dataset\\w*',
    ],
  },
  {
    id: 'sovereign',
    label: 'On-prem & sovereign',
    blurb: 'bare metal, air-gapped, sovereign cloud, self-hosted, Metal3, regulated industries',
    rules: [
      'sovereign\\w*', 'air[- ]?gap\\w*', 'on[- ]prem\\w*', 'bare[- ]?metal', 'metal3', 'self[- ]hosted',
      'private cloud', 'data residency', 'regulated', 'government', 'public sector', 'defen[cs]e',
      'classified', 'own infrastructure', 'data center\\w*', 'datacenter\\w*', 'colocation', 'tinkerbell',
      'digital sovereignty', 'eu', 'fedramp', 'hipaa', 'financial services', 'bank\\w*', 'healthcare',
    ],
  },
  {
    id: 'internals',
    label: 'Kubernetes internals',
    blurb: 'SIGs, kubelet, API server, etcd, control plane, container runtimes, KEPs',
    rules: [
      'sig[- ]\\w+', 'kubelet', 'api[- ]?server', 'etcd', 'control plane', 'containerd', 'cri-o', 'crio',
      'keps?', 'upstream', 'maintainers?', 'kubernetes release', 'node lifecycle', 'api machinery',
      'in[- ]place', 'pod resize', 'sidecar containers?', 'kube-?apiserver', 'controller manager',
      'cgroups?', 'runc', 'oci', 'image pull\\w*', 'deprecat\\w*', 'graduat\\w*',
    ],
  },
  {
    id: 'virtualization',
    label: 'VMs & virtualization',
    blurb: 'KubeVirt, virtual machines on Kubernetes, VM migration off VMware',
    rules: [
      'kubevirt', 'virtual machines?', 'vms?', 'virtualization', 'vmware', 'hypervisor\\w*', 'live migration',
      'vsphere', 'openshift virtualization', 'harvester', 'firecracker', 'microvms?',
    ],
  },
  {
    id: 'cost',
    label: 'Cost & sustainability',
    blurb: 'FinOps, OpenCost, carbon, Kepler, green computing, cloud spend',
    rules: [
      'finops', 'opencost', 'costs?', 'spend', 'bill\\w*', 'sustainab\\w*', 'carbon', 'kepler', 'green',
      'energy', 'power consumption', 'savings', 'cheaper', 'waste', 'chargeback', 'showback', 'budget\\w*',
    ],
  },
  {
    id: 'wasm',
    label: 'WebAssembly',
    blurb: 'Wasm on Kubernetes: Spin, wasmCloud, components',
    rules: ['wasm', 'webassembly', 'spin', 'wasmcloud', 'wasi', 'component model', 'spinkube'],
  },
]

/**
 * The team's presets. Each is a set of interests that selects those sessions in one click; anyone
 * can add or drop interests from there. The `about` line is shown under the name in the picker.
 */
export const TEAM = [
  { id: 'matt', name: 'Matt', about: 'storage and performance', interests: ['storage', 'performance'] },
  { id: 'mason', name: 'Mason', about: 'testing things', interests: ['testing'] },
  { id: 'liam', name: 'Liam', about: 'operators, DRA, disaggregated P/D, scheduling', interests: ['operators', 'dra', 'disagg', 'scheduling'] },
  { id: 'rich', name: 'Rich', about: 'agents and agentic stuff', interests: ['agents'] },
]

/** Where a hit lands, and what it is worth. */
export const WEIGHT = { title: 3, labels: 3, abstract: 1 }

/** The rule objects, compiled once. */
function compile(interest) {
  return interest.rules.map((r) => {
    const spec = typeof r === 'string' ? { re: r } : r
    return { re: new RegExp(`(?<![\\w/-])(?:${spec.re})(?![\\w-])`, spec.cs ? '' : 'i'), w: spec.w ?? 1, src: spec.re }
  })
}
const COMPILED = INTERESTS.map((i) => ({ id: i.id, rules: compile(i) }))

/**
 * Score a session against every interest.
 * @param {{ title: string, abstract: string, labels: string[] }} s
 * @returns {Record<string, { score: number, why: string[] }>} every interest with any hit at all
 */
export function scoreSession(s) {
  const out = {}
  const labels = s.labels.join(' \n ')
  for (const { id, rules } of COMPILED) {
    let score = 0
    const why = []
    for (const rule of rules) {
      let hit = 0
      const t = s.title.match(rule.re)
      const l = labels.match(rule.re)
      const a = s.abstract.match(rule.re)
      if (t) hit += WEIGHT.title
      if (l) hit += WEIGHT.labels
      if (a) hit += WEIGHT.abstract
      if (hit) {
        score += hit * rule.w
        why.push((t ?? l ?? a)[0])
      }
    }
    if (score > 0) out[id] = { score, why }
  }
  return out
}

/**
 * The interests a session is tagged with, in taxonomy order, plus why. Overrides last.
 * @param {{ id: string, title: string, abstract: string, labels: string[] }} s
 * @param {Record<string, { add?: string[], remove?: string[] }>} overrides
 */
export function tagSession(s, overrides = {}) {
  const scores = scoreSession(s)
  const o = overrides[s.id] ?? {}
  const tags = []
  const why = {}
  for (const i of INTERESTS) {
    const sc = scores[i.id]
    const on = (sc && sc.score >= THRESHOLD && !(o.remove ?? []).includes(i.id)) || (o.add ?? []).includes(i.id)
    if (!on) continue
    tags.push(i.id)
    why[i.id] = sc ? [...new Set(sc.why.map((w) => w.toLowerCase()))].slice(0, 6) : ['hand-picked']
    if ((o.add ?? []).includes(i.id) && sc) why[i.id] = ['hand-picked', ...why[i.id]].slice(0, 6)
  }
  return { tags, why }
}
