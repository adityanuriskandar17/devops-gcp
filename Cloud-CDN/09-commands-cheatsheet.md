# CLI Commands Cheatsheet

Perintah **gcloud** untuk Cloud CDN, disandingkan dengan **Console path**.

---

## Backend Bucket (Cloud Storage origin)

| Aksi | Console | CLI |
|------|---------|-----|
| Create backend bucket | LB → Backend → Create backend bucket | `gcloud compute backend-buckets create NAME --gcs-bucket-name=BUCKET` |
| Enable CDN | LB → Backend → Enable Cloud CDN | `gcloud compute backend-buckets update NAME --enable-cdn` |
| Disable CDN | LB → Backend → Disable Cloud CDN | `gcloud compute backend-buckets update NAME --no-enable-cdn` |
| List backend buckets | LB → Backend configuration | `gcloud compute backend-buckets list` |
| Describe | LB → Backend → klik | `gcloud compute backend-buckets describe NAME` |
| Delete | LB → Backend → Delete | `gcloud compute backend-buckets delete NAME` |

### Create backend bucket + CDN lengkap

```bash
gcloud compute backend-buckets create my-static-backend \
    --gcs-bucket-name=my-website-bucket \
    --enable-cdn \
    --cache-mode=CACHE_ALL_STATIC \
    --default-ttl=3600 \
    --max-ttl=86400 \
    --client-ttl=3600
```

---

## Backend Service (VM / Cloud Run origin)

| Aksi | Console | CLI |
|------|---------|-----|
| Enable CDN | LB → Backend service → Enable Cloud CDN | `gcloud compute backend-services update NAME --enable-cdn --global` |
| Disable CDN | LB → Backend service → Disable Cloud CDN | `gcloud compute backend-services update NAME --no-enable-cdn --global` |
| Set cache mode | LB → Backend → CDN → Cache mode | `gcloud compute backend-services update NAME --cache-mode=CACHE_ALL_STATIC --global` |

### Update TTL pada backend service

```bash
gcloud compute backend-services update my-backend \
    --enable-cdn \
    --cache-mode=CACHE_ALL_STATIC \
    --default-ttl=3600 \
    --max-ttl=86400 \
    --client-ttl=3600 \
    --global
```

---

## Cache Invalidation

| Aksi | Console | CLI |
|------|---------|-----|
| Invalidate single path | Cloud CDN → origin → Cache invalidation | `gcloud compute url-maps invalidate-cdn-cache URL_MAP --path="/image.png"` |
| Invalidate prefix | Cloud CDN → origin → Cache invalidation | `gcloud compute url-maps invalidate-cdn-cache URL_MAP --path="/images/*"` |
| Invalidate all | Cloud CDN → origin → Cache invalidation | `gcloud compute url-maps invalidate-cdn-cache URL_MAP --path="/*"` |

```bash
# Invalidate single file
gcloud compute url-maps invalidate-cdn-cache my-url-map \
    --path="/css/style.css"

# Invalidate folder
gcloud compute url-maps invalidate-cdn-cache my-url-map \
    --path="/images/*"

# Invalidate everything
gcloud compute url-maps invalidate-cdn-cache my-url-map \
    --path="/*"

# Regional URL map
gcloud compute url-maps invalidate-cdn-cache my-url-map \
    --path="/*" \
    --region=asia-southeast2
```

---

## Signed URL

| Aksi | Console | CLI |
|------|---------|-----|
| Add signing key (bucket) | LB → Backend bucket → Signed URL | `gcloud compute backend-buckets add-signed-url-key NAME --key-name=KEY --key-file=FILE` |
| Add signing key (service) | LB → Backend service → Signed URL | `gcloud compute backend-services add-signed-url-key NAME --key-name=KEY --key-file=FILE --global` |
| Generate signed URL | — (programmatic) | `gcloud compute sign-url URL --key-name=KEY --key-file=FILE --expires-in=1h` |
| Remove signing key | — | `gcloud compute backend-buckets delete-signed-url-key NAME --key-name=KEY` |

### Setup signing key

```bash
# Generate random key (base64url, 128-bit minimum)
head -c 16 /dev/urandom | base64 | tr '+/' '-_' > cdn-key.txt

# Add key ke backend bucket
gcloud compute backend-buckets add-signed-url-key my-backend-bucket \
    --key-name=my-cdn-key \
    --key-file=cdn-key.txt

# Generate signed URL
gcloud compute sign-url \
    "https://cdn.example.com/premium/video.mp4" \
    --key-name=my-cdn-key \
    --key-file=cdn-key.txt \
    --expires-in=2h
```

---

## SSL Certificate

| Aksi | Console | CLI |
|------|---------|-----|
| Create Google-managed cert | LB → Frontend → Certificate | `gcloud compute ssl-certificates create NAME --domains=DOMAIN --global` |
| Create self-managed cert | LB → Frontend → Certificate | `gcloud compute ssl-certificates create NAME --certificate=CERT --private-key=KEY --global` |
| List certificates | — | `gcloud compute ssl-certificates list` |
| Describe | — | `gcloud compute ssl-certificates describe NAME --global` |
| Delete | — | `gcloud compute ssl-certificates delete NAME --global` |

---

## Load Balancer

### Create LB + backend bucket + CDN (full)

```bash
# 1. Reserve static IP
gcloud compute addresses create my-cdn-ip --global

# 2. Create backend bucket with CDN
gcloud compute backend-buckets create my-static-backend \
    --gcs-bucket-name=my-website-bucket \
    --enable-cdn

# 3. Create URL map
gcloud compute url-maps create my-cdn-lb \
    --default-backend-bucket=my-static-backend

# 4. Create SSL cert
gcloud compute ssl-certificates create my-cert \
    --domains=www.example.com \
    --global

# 5. Create HTTPS proxy
gcloud compute target-https-proxies create my-https-proxy \
    --url-map=my-cdn-lb \
    --ssl-certificates=my-cert

# 6. Create forwarding rule
gcloud compute forwarding-rules create my-cdn-rule \
    --global \
    --target-https-proxy=my-https-proxy \
    --address=my-cdn-ip \
    --ports=443
```

---

## Cloud Armor (Edge Security)

```bash
# Create security policy
gcloud compute security-policies create my-cdn-policy \
    --type=CLOUD_ARMOR_EDGE

# Add rule: block specific country
gcloud compute security-policies rules create 1000 \
    --security-policy=my-cdn-policy \
    --expression="origin.region_code == 'CN'" \
    --action=deny-403

# Add rule: rate limit
gcloud compute security-policies rules create 2000 \
    --security-policy=my-cdn-policy \
    --expression="true" \
    --action=rate-based-ban \
    --rate-limit-threshold-count=100 \
    --rate-limit-threshold-interval-sec=60 \
    --ban-duration-sec=300

# Attach to backend bucket
gcloud compute backend-buckets update my-backend-bucket \
    --edge-security-policy=my-cdn-policy
```

---

## Media CDN

```bash
# Create origin
gcloud edge-cache origins create my-video-origin \
    --origin-address="gs://my-video-bucket"

# Create service
gcloud edge-cache services create my-media-cdn \
    --edge-cache-origin=my-video-origin

# Describe service
gcloud edge-cache services describe my-media-cdn

# Prefetch content
gcloud edge-cache services prefetch my-media-cdn \
    --paths="/videos/popular.mp4"

# Invalidate cache
gcloud edge-cache services invalidate-cache my-media-cdn \
    --paths="/videos/old.mp4"

# List services
gcloud edge-cache services list

# Delete service
gcloud edge-cache services delete my-media-cdn
```

---

## Monitoring (via gcloud)

```bash
# Lihat CDN cache hit/miss dari logging
gcloud logging read \
    'resource.type="http_load_balancer" AND jsonPayload.cacheHit=true' \
    --limit=20 \
    --format="table(timestamp, httpRequest.requestUrl, httpRequest.status)"

# Lihat cache MISS saja
gcloud logging read \
    'resource.type="http_load_balancer" AND jsonPayload.cacheLookup=true AND jsonPayload.cacheHit=false' \
    --limit=20

# Lihat error 5xx
gcloud logging read \
    'resource.type="http_load_balancer" AND httpRequest.status>=500' \
    --limit=20
```
