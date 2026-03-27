# CLI Commands Cheatsheet

Perintah **gcloud container** dan **kubectl** untuk GKE, disandingkan dengan **Console path**.

---

## Cluster Management

| Aksi | Console | CLI |
|------|---------|-----|
| List clusters | `Kubernetes Engine` → Clusters | `gcloud container clusters list` |
| Create Autopilot | Clusters → CREATE → Autopilot | `gcloud container clusters create-auto NAME --region=REGION` |
| Create Standard | Clusters → CREATE → Standard | `gcloud container clusters create NAME --region=REGION --num-nodes=3` |
| Delete cluster | Clusters → cluster → DELETE | `gcloud container clusters delete NAME --region=REGION` |
| Describe cluster | Clusters → klik cluster | `gcloud container clusters describe NAME --region=REGION` |
| Connect (kubeconfig) | Clusters → cluster → CONNECT | `gcloud container clusters get-credentials NAME --region=REGION` |
| Resize | Clusters → Node pool → EDIT | `gcloud container clusters resize NAME --node-pool=POOL --num-nodes=5` |

---

## Node Pool

| Aksi | Console | CLI |
|------|---------|-----|
| List pools | Cluster → Node pools | `gcloud container node-pools list --cluster=CLUSTER` |
| Create pool | Cluster → ADD NODE POOL | `gcloud container node-pools create POOL --cluster=CLUSTER --machine-type=TYPE --num-nodes=3` |
| Delete pool | Node pool → DELETE | `gcloud container node-pools delete POOL --cluster=CLUSTER` |
| Enable autoscaling | Node pool → EDIT → Autoscaling | `gcloud container clusters update CLUSTER --enable-autoscaling --node-pool=POOL --min-nodes=1 --max-nodes=10` |

### Create Spot VM node pool

```bash
gcloud container node-pools create spot-pool \
    --cluster=my-cluster \
    --region=asia-southeast2 \
    --machine-type=e2-standard-4 \
    --spot \
    --num-nodes=2 \
    --enable-autoscaling \
    --min-nodes=0 \
    --max-nodes=10
```

---

## kubectl — Workloads

| Aksi | Command |
|------|---------|
| List Pods | `kubectl get pods` |
| List Pods (semua namespace) | `kubectl get pods -A` |
| Describe Pod | `kubectl describe pod POD_NAME` |
| Pod logs | `kubectl logs POD_NAME` |
| Pod logs (follow) | `kubectl logs -f POD_NAME` |
| Exec into Pod | `kubectl exec -it POD_NAME -- /bin/sh` |
| Delete Pod | `kubectl delete pod POD_NAME` |

---

## kubectl — Deployments

| Aksi | Command |
|------|---------|
| List Deployments | `kubectl get deployments` |
| Create from YAML | `kubectl apply -f deployment.yaml` |
| Update image | `kubectl set image deployment/NAME container=IMAGE:TAG` |
| Scale | `kubectl scale deployment/NAME --replicas=5` |
| Rollout status | `kubectl rollout status deployment/NAME` |
| Rollback | `kubectl rollout undo deployment/NAME` |
| History | `kubectl rollout history deployment/NAME` |
| Delete | `kubectl delete deployment NAME` |

---

## kubectl — Services & Networking

| Aksi | Command |
|------|---------|
| List Services | `kubectl get services` |
| List Ingress | `kubectl get ingress` |
| Describe Service | `kubectl describe service NAME` |
| Expose Deployment | `kubectl expose deployment NAME --type=LoadBalancer --port=80 --target-port=8080` |
| Port forward (debug) | `kubectl port-forward pod/POD_NAME 8080:8080` |

---

## kubectl — Config & Secrets

| Aksi | Command |
|------|---------|
| List ConfigMaps | `kubectl get configmaps` |
| List Secrets | `kubectl get secrets` |
| Create ConfigMap | `kubectl create configmap NAME --from-literal=KEY=VALUE` |
| Create Secret | `kubectl create secret generic NAME --from-literal=KEY=VALUE` |
| View ConfigMap | `kubectl describe configmap NAME` |

---

## kubectl — Namespaces

| Aksi | Command |
|------|---------|
| List namespaces | `kubectl get namespaces` |
| Create namespace | `kubectl create namespace NAME` |
| Switch namespace | `kubectl config set-context --current --namespace=NAME` |
| Resources in namespace | `kubectl get all -n NAME` |

---

## kubectl — Autoscaling

| Aksi | Command |
|------|---------|
| Create HPA | `kubectl autoscale deployment NAME --min=2 --max=10 --cpu-percent=70` |
| List HPA | `kubectl get hpa` |
| Describe HPA | `kubectl describe hpa NAME` |

---

## kubectl — Debug

| Aksi | Command |
|------|---------|
| Cluster info | `kubectl cluster-info` |
| Node status | `kubectl get nodes` |
| Node describe | `kubectl describe node NODE_NAME` |
| Events | `kubectl get events --sort-by=.metadata.creationTimestamp` |
| Top (resource usage) | `kubectl top pods` / `kubectl top nodes` |
