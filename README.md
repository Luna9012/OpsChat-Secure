# OpsChat

A real-time chat application with AI features, built to demonstrate DevOps practices.

## 🚀 Quick Start

### Option 1: Docker Compose (Simple)

```bash
docker-compose up
```

**Access:** http://localhost:8080

### Option 2: Kubernetes with KIND (Advanced)

**Option A: One-command deployment (recommended)**
Make sure you have .env file with GROQ_API_KEY, then:
```bash
./deploy.sh
```

**Option B: Manual step-by-step**
```bash
# 1. Create cluster
kind create cluster --config kind-config.yaml --name opschat-local

# 2. Install ingress controller
kubectl apply -f k8s/ingress-nginx.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s

# 3. Create secrets
kubectl create secret generic opschat-secrets --from-literal=GROQ_API_KEY=your_key_here

# 4. Build images
docker build -t opschat-backend:v1 ./opschat-backend
docker build -t opschat-frontend:v1 --build-arg VITE_API_URL=http://localhost ./opschat-frontend

# 5. Load into KIND
kind load docker-image opschat-backend:v1 --name opschat-local
kind load docker-image opschat-frontend:v1 --name opschat-local

# 6. Deploy
kubectl apply -f k8s/
```

**Access:** http://localhost

---

## 📁 Project Structure

```
OpsChat/
├── opschat-frontend/     # React + Vite frontend
├── opschat-backend/      # Node.js + Express + Socket.io backend
├── k8s/                  # Kubernetes manifests
├── docker-compose.yml    # Local development setup
├── deploy.sh             # Kubernetes deployment script
└── kind-config.yaml      # KIND cluster configuration
```

---

## 🔧 Features

- **Real-time Chat** - Socket.io powered messaging
- **AI Translation** - Translate messages using Groq LLM
- **AI Summarization** - Summarize conversations
- **Smart Replies** - AI-suggested responses
- **File Uploads** - Images and voice notes via MinIO/S3
- **Channels & DMs** - Group and private messaging

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, Socket.io, Prisma |
| Database | PostgreSQL |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| AI | Groq API |
| Container | Docker, Docker Compose |
| Orchestration | Kubernetes (KIND for local) |

---

## 📋 Development

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local dev without Docker)
- KIND + kubectl (for Kubernetes testing)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
GROQ_API_KEY=your_groq_api_key
VITE_API_URL=http://localhost:3000
```

---

## 🛑 Stopping & Starting

### Docker Compose

| Command | Data Preserved? | Use When |
|---------|-----------------|----------|
| `docker-compose stop` | ✅ Yes | Pause containers temporarily |
| `docker-compose down` | ✅ Yes | Stop and remove containers |
| `docker-compose down -v` | ❌ **No** | Full cleanup including database |

```bash
# Stop (preserves data)
docker-compose stop

# Restart
docker-compose start

# Or stop and remove containers (data still safe)
docker-compose down

# Restart
docker-compose up
```

### Kubernetes (KIND)

| Command | Data Preserved? | Use When |
|---------|-----------------|----------|
| `kubectl scale deployment --all --replicas=0` | ✅ Yes | Stop pods temporarily |
| `kind delete cluster --name opschat-local` | ❌ **No** | Full cleanup |

```bash
# Stop all pods (preserves data)
kubectl scale deployment --all --replicas=0

# Restart pods
kubectl scale deployment backend --replicas=2
kubectl scale deployment frontend --replicas=1
kubectl scale deployment postgres --replicas=1
kubectl scale deployment redis --replicas=1
kubectl scale deployment minio --replicas=1

# Full cleanup (DELETES ALL DATA)
kind delete cluster --name opschat-local
```

> 💡 **Tip:** KIND uses minimal resources when idle. You can leave the cluster running without stopping it.
