# DevOps & Cloud Engineer Notes

## 1. Apa itu DevOps?
DevOps adalah pendekatan yang menggabungkan development (Dev) dan operations (Ops) untuk meningkatkan kecepatan, kualitas, dan reliability dalam pengembangan software.

### Tujuan DevOps
- Continuous Integration (CI)
- Continuous Delivery/Deployment (CD)
- Automation
- Monitoring & Feedback

---

## 2. Lifecycle DevOps
1. Plan
2. Code
3. Build
4. Test
5. Release
6. Deploy
7. Operate
8. Monitor

---

## 3. Tools DevOps

### Version Control
- Git
- GitHub / GitLab / Bitbucket

### CI/CD
- Jenkins
- GitHub Actions
- GitLab CI

### Containerization
- Docker

### Orchestration
- Kubernetes

### Configuration Management
- Ansible
- Chef
- Puppet

### Monitoring
- Prometheus
- Grafana

---

## 4. Docker Basics

### Command Penting
```bash
docker build -t myapp .
docker run -p 3000:3000 myapp
docker ps
docker stop <container_id>
```

### Dockerfile Example
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

---

## 5. Kubernetes Basics

### Konsep
- Pod
- Deployment
- Service
- Namespace

### Command Penting
```bash
kubectl get pods
kubectl apply -f deployment.yaml
kubectl describe pod <pod_name>
```

---

## 6. CI/CD Pipeline Example

### GitHub Actions
```yaml
name: CI

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install
        run: npm install
      - name: Test
        run: npm test
```

---

## 7. Cloud Engineer Basics

### Cloud Provider
- AWS
- Google Cloud Platform (GCP)
- Microsoft Azure

### Service Umum
- Compute (VM)
- Storage
- Database
- Networking

---

## 8. GCP Notes

### Cloud Storage
- Standard (sering diakses)
- Nearline (jarang diakses)
- Coldline
- Archive

### Compute Engine
- Virtual Machine

### Cloud Run
- Deploy container tanpa manage server

---

## 9. Networking Basics

- IP Address
- DNS
- Load Balancer
- Firewall

---

## 10. Monitoring & Logging

- Logging: ELK Stack
- Metrics: Prometheus
- Visualization: Grafana

---

## 11. Best Practices

- Infrastructure as Code (IaC)
- Automation everything
- Secure by default
- Monitoring wajib

---

## 12. Interview Questions

### DevOps
- Apa itu CI/CD?
- Apa beda Docker vs VM?
- Apa itu Kubernetes?

### Cloud
- Apa itu load balancer?
- Apa itu auto scaling?
- Apa beda public vs private cloud?

---

## 13. Tips Belajar

- Practice > Theory
- Build project sendiri
- Gunakan cloud free tier
- Dokumentasi itu penting

---

## 14. Mini Project Idea

- Deploy app Node.js ke Docker
- Push ke GitHub
- Setup CI/CD
- Deploy ke Cloud Run

---

## 15. Roadmap DevOps

1. Linux Basics
2. Networking
3. Git
4. CI/CD
5. Docker
6. Kubernetes
7. Cloud
8. Monitoring

---

## 16. Linux Command Penting

```bash
ls
cd
cp
mv
rm
top
htop
netstat
```

---

## 17. Security Basics

- SSH Key
- Firewall
- HTTPS
- Secrets Management

---

## 18. Infrastructure as Code

### Terraform Example
```hcl
provider "aws" {
  region = "us-east-1"
}

resource "aws_instance" "example" {
  ami           = "ami-123456"
  instance_type = "t2.micro"
}
```

---

## 19. Scaling

- Horizontal Scaling
- Vertical Scaling

---

## 20. Conclusion

DevOps dan Cloud Engineer adalah skill yang sangat dibutuhkan di era modern. Fokus pada automation, scalability, dan reliability.

