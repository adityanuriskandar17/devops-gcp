# Monitoring & Logging

Panduan monitoring, logging, dan alerting untuk **GKE**, berorientasi **GCP Console**.

---

## Console path

| Fitur | Console path |
|-------|-------------|
| GKE Dashboard | `Kubernetes Engine` → **Clusters** → klik cluster |
| Workload status | `Kubernetes Engine` → **Workloads** |
| Pod logs | `Kubernetes Engine` → **Workloads** → klik workload → **Logs** |
| Cloud Monitoring | `Monitoring` → **Dashboards** |
| Logs Explorer | `Logging` → **Logs Explorer** |

---

## GKE Dashboard

**Console:** `Kubernetes Engine` → **Clusters** → klik cluster

| Tab | Informasi |
|-----|-----------|
| **Details** | Cluster info, version, endpoint, node count |
| **Nodes** | Daftar node, status, CPU/RAM usage |
| **Storage** | Persistent Volumes |
| **Logs** | Link ke Logs Explorer |
| **Observability** | Metrics dashboard (CPU, RAM, network, disk) |

---

## Metrics Penting

### Cluster level

| Metric | Deskripsi | Alert threshold |
|--------|-----------|-----------------|
| Node count | Jumlah node running | Jika tidak sesuai expected |
| Node CPU utilization | CPU usage per node | > 80% sustained |
| Node memory utilization | RAM usage per node | > 85% |
| Node disk utilization | Disk usage per node | > 85% |

### Pod level

| Metric | Deskripsi | Alert threshold |
|--------|-----------|-----------------|
| Pod restart count | Berapa kali Pod restart | > 5 dalam 1 jam |
| Container CPU usage | CPU actual vs request/limit | Mendekati limit |
| Container memory usage | RAM actual vs limit | > 80% limit (risiko OOM) |
| Pod status | Running / Pending / Failed | Pending > 5 menit |

---

## Logging

### Container logs

**Console:** `Kubernetes Engine` → **Workloads** → klik workload → klik Pod → **Container logs**

Atau via Logs Explorer:

```
resource.type="k8s_container"
resource.labels.cluster_name="my-cluster"
resource.labels.namespace_name="production"
resource.labels.container_name="api-server"
```

### Query berguna

```
# Error logs dari semua container di namespace production
resource.type="k8s_container"
resource.labels.namespace_name="production"
severity>=ERROR

# OOM killed events
resource.type="k8s_node"
jsonPayload.message:"OOM"

# Pod scheduled/started events
resource.type="k8s_cluster"
protoPayload.methodName:"pods"

# Specific Pod logs
resource.type="k8s_container"
resource.labels.pod_name="api-server-7b4f5c-x2k9"
```

---

## Alerting

**Console:** `Monitoring` → **Alerting** → **Create policy**

### Alert yang recommended

| Alert | Metric | Threshold |
|-------|--------|-----------|
| Pod crash loop | Restart count | > 5 dalam 10 menit |
| High CPU node | Node CPU utilization | > 85% selama 5 menit |
| High memory node | Node memory utilization | > 90% selama 5 menit |
| Pod pending | Pod status = Pending | > 5 menit |
| Disk full node | Node disk utilization | > 90% |
| Node not ready | Node status != Ready | Any |
| HPA at max | HPA current = max replicas | > 10 menit (butuh scale lebih) |

---

## Troubleshooting Umum

| Gejala | Penyebab | Solusi |
|--------|----------|--------|
| Pod status **Pending** | Tidak ada node dengan resource cukup | Scale up node pool / cluster autoscaler |
| Pod status **CrashLoopBackOff** | App crash saat startup | Cek container logs, fix app error |
| Pod status **ImagePullBackOff** | Image tidak ditemukan atau no permission | Cek image name, registry permission |
| Pod status **OOMKilled** | Pakai RAM melebihi memory limit | Naikkan memory limit atau optimize app |
| Node **NotReady** | Node masalah (disk, network) | Cek node events, drain dan replace |
| Service no external IP | Pending LoadBalancer | Cek quota, firewall rules |
