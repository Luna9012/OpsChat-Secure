#!/bin/bash
set -e

CLUSTER_NAME="opschat-local"
FRONTEND_IMAGE="opschat-frontend"
BACKEND_IMAGE="opschat-backend"
TAG="v1"
K8S_API_URL="http://localhost"

echo "OpsChat Kubernetes Deployment"
echo "================================="

if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo "KIND cluster '${CLUSTER_NAME}' already exists"
else
    echo "Creating KIND cluster '${CLUSTER_NAME}'..."
    kind create cluster --config kind-config.yaml --name ${CLUSTER_NAME}
    echo "Cluster created!"
fi

kubectl config use-context kind-${CLUSTER_NAME}

if kubectl get namespace ingress-nginx &>/dev/null; then
    echo "Ingress controller already installed"
else
    echo "Installing NGINX Ingress Controller..."
    kubectl apply -f k8s/ingress-nginx.yaml
    
    echo "Waiting for ingress controller to be ready (this may take 2-3 minutes)..."
    
    if kubectl wait --namespace ingress-nginx \
        --for=condition=available deployment/ingress-nginx-controller \
        --timeout=300s 2>/dev/null; then
        echo "Ingress controller ready!"
    else
        echo "Ingress controller is still starting..."
        echo "Checking pod status:"
        kubectl get pods -n ingress-nginx
        echo ""
        echo "   Continuing with deployment - ingress may need more time."
        echo "   If the app doesn't work, wait a minute and try: kubectl get pods -n ingress-nginx"
    fi
fi


if kubectl get deployment metrics-server -n kube-system &>/dev/null; then
    echo "Metrics server already installed"
else
    echo "Installing Metrics Server..."
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    

    sleep 5
    
    echo "Patching metrics-server for KIND compatibility..."
    kubectl patch deployment metrics-server -n kube-system --type='json' \
        -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]' \
        2>/dev/null || echo "   (patch may already be applied)"
    
    echo "Metrics server installed! Use 'kubectl top pods' to see resource usage."
fi


if kubectl get secret opschat-secrets &>/dev/null; then
    echo "Secrets already exist"
else
    echo "Creating secrets..."
    
    if [ -f .env ]; then
        GROQ_KEY=$(grep GROQ_API_KEY .env | cut -d '=' -f2)
        if [ -n "$GROQ_KEY" ]; then
            kubectl create secret generic opschat-secrets \
                --from-literal=GROQ_API_KEY=${GROQ_KEY}
            echo "Secrets created from .env file!"
        else
            echo "GROQ_API_KEY not found in .env"
            echo "Run: kubectl create secret generic opschat-secrets --from-literal=GROQ_API_KEY=your_key"
            exit 1
        fi
    else
        echo ".env file not found"
        echo "Run: kubectl create secret generic opschat-secrets --from-literal=GROQ_API_KEY=your_key"
        exit 1
    fi
fi


echo ""
echo "Building Docker Images..."
docker build -t ${BACKEND_IMAGE}:${TAG} ./opschat-backend
docker build -t ${FRONTEND_IMAGE}:${TAG} --build-arg VITE_API_URL=${K8S_API_URL} ./opschat-frontend
echo "Images built!"


echo ""
echo "Loading images into KIND cluster..."
kind load docker-image ${BACKEND_IMAGE}:${TAG} --name ${CLUSTER_NAME}
kind load docker-image ${FRONTEND_IMAGE}:${TAG} --name ${CLUSTER_NAME}
echo "Images loaded!"


echo ""
echo "Applying core Kubernetes manifests..."

kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

echo ""
echo "Ensuring ingress controller is ready before creating ingress resources..."

if kubectl wait --namespace ingress-nginx \
    --for=condition=available deployment/ingress-nginx-controller \
    --timeout=120s 2>/dev/null; then
    echo "Ingress controller ready!"
else
    echo "Ingress controller not ready yet. Waiting 30 more seconds..."
    sleep 30
fi

echo "Applying ingress resources..."
kubectl apply -f k8s/ingress-backend.yaml
kubectl apply -f k8s/ingress-frontend.yaml
kubectl apply -f k8s/ingress-minio.yaml
echo "Ingress resources created!"


echo ""
echo "Restarting deployments..."
kubectl rollout restart deployment backend 2>/dev/null || true
kubectl rollout restart deployment frontend 2>/dev/null || true
kubectl rollout restart deployment minio 2>/dev/null || true


echo ""
echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/backend --timeout=120s
kubectl rollout status deployment/frontend --timeout=120s


echo ""
echo "============================================="
echo "Deployment Complete!"
echo "============================================="
echo ""
echo "App:        http://localhost"
echo "MinIO:      http://minio.localhost"
echo ""
echo "   Useful commands:"
echo "   kubectl get pods          - View running pods"
echo "   kubectl logs -l app=backend -f  - Stream backend logs"
echo "   kind delete cluster --name ${CLUSTER_NAME}  - Delete cluster"
echo ""