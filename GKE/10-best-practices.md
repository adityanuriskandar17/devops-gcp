# Best Practices

Checklist dan rekomendasi untuk **GKE** production, berorientasi **GCP Console**.

---

## Security

| Praktik | Detail |
|---------|--------|
| **Private cluster** untuk production | Control plane tidak exposed ke internet |
| **Workload Identity** bukan service account key | Akses GCP services tanpa key file |
| **RBAC** — least privilege | Jangan berikan cluster-admin ke semua orang |
| **Network Policy** aktif | Isolasi traffic antar Pod |
| **Non-root containers** | Container jalan sebagai non-root user |
| **Binary Authorization** | Hanya deploy image yang sudah di-scan/sign |
| **Shielded nodes** | Secure boot, integrity monitoring |
| **Node auto-upgrade** | Security patches otomatis |

---

## Availability

| Praktik | Detail |
|---------|--------|
| **Regional cluster** | Control plane dan nodes di 3 zona |
| **replicas ≥ 2** untuk setiap Deployment | Pod mati → masih ada yang serving |
| **Pod Disruption Budget** | Minimal 1 Pod selalu running saat maintenance |
| **readinessProbe + livenessProbe** | Kubernetes tahu kapan Pod ready/healthy |
| **Preemption-safe** untuk Spot VM | Pod harus bisa di-evict gracefully |
| **Release channel: Regular** | Auto-upgrade dengan stabilitas |
| **Maintenance window** di jam sepi | Minimize impact ke user |

### Health check contoh

```yaml
readinessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
```

---

## Performance & Scaling

| Praktik | Detail |
|---------|--------|
| **Resource requests & limits** di semua Pod | Scheduler bisa optimal + prevent noisy neighbor |
| **HPA** untuk scale horizontal | Scale Pod berdasarkan traffic |
| **Cluster Autoscaler** | Scale node berdasarkan pending Pods |
| **VPA recommend mode** | Identifikasi right-size resource |
| **Ingress** bukan LoadBalancer per Service | 1 LB untuk banyak Service (hemat + efisien) |
| **Spot VM node pool** untuk non-critical | 60-91% diskon |

---

## Cost Optimization

| Praktik | Detail |
|---------|--------|
| **Autopilot** untuk workload kecil/variable | Bayar per Pod, tidak bayar idle |
| **Spot VM** node pool | Diskon 60-91% |
| **Cluster Autoscaler** min nodes rendah | Scale down saat sepi |
| **Right-size resources** (VPA) | Jangan over-provision |
| **Matikan cluster dev** malam/weekend | Schedule start/stop |
| **Namespace resource quotas** | Cegah team over-allocate |
| **CUD** untuk production stabil | 25-52% diskon |
| **Monitor billing** | Budget alerts |

---

## Monitoring

| Praktik | Detail |
|---------|--------|
| **GKE Dashboard** | Monitor cluster health |
| **Container logs** → Logs Explorer | Debug app errors |
| **Alert: Pod CrashLoopBackOff** | Pod restart > 5x |
| **Alert: Node CPU > 85%** | Scale up needed |
| **Alert: Pending Pods > 5 min** | Not enough resources |
| **Budget alert** | Cost control |

---

## CI/CD

| Praktik | Detail |
|---------|--------|
| **Container image di Artifact Registry** | Jangan pakai Docker Hub untuk production |
| **Image tag ≠ latest** | Pakai version tag (v1.2.3) atau SHA |
| **Rolling update strategy** | Zero downtime deploy |
| **Rollback plan** | Test rollback di staging |
| **GitOps** (Argo CD / Flux) | Git sebagai single source of truth |

---

## Checklist Sebelum Production

```
CLUSTER
☐ Regional cluster (bukan zonal)
☐ Private cluster (atau authorized networks ketat)
☐ Release channel: Regular
☐ Maintenance window di jam sepi
☐ Deletion protection enabled
☐ Shielded nodes enabled

SECURITY
☐ Workload Identity enabled
☐ RBAC configured (least privilege)
☐ Network Policy enabled
☐ Non-root containers
☐ Node auto-upgrade enabled

WORKLOADS
☐ Resource requests & limits di semua Pod
☐ Replicas ≥ 2 untuk critical services
☐ readinessProbe & livenessProbe configured
☐ Pod Disruption Budget set
☐ Image dari Artifact Registry (bukan Docker Hub)
☐ Image tag versioned (bukan :latest)

SCALING
☐ HPA configured untuk setiap Deployment
☐ Cluster Autoscaler enabled
☐ Min nodes ≥ 1 (atau sesuai kebutuhan)
☐ Spot VM pool untuk non-critical

NETWORKING
☐ Ingress untuk expose (bukan LoadBalancer per Service)
☐ Internal Service untuk komunikasi antar service
☐ SSL/TLS configured

MONITORING
☐ Cloud Monitoring dashboard
☐ Alert: Pod crash loop
☐ Alert: Node high CPU/RAM
☐ Alert: Pending Pods
☐ Container logging enabled
☐ Budget alert configured

BACKUP
☐ Backup for GKE enabled (jika butuh DR)
☐ YAML manifests di Git (GitOps)
```
