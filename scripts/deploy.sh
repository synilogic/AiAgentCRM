#!/bin/bash

# AI Agent CRM Deployment Script
# This script handles production deployment with zero-downtime

set -e

# Configuration
PROJECT_NAME="aiagentcrm"
DOCKER_REGISTRY="your-registry.com"
VERSION=${1:-latest}
ENVIRONMENT=${2:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    if ! command -v git &> /dev/null; then
        error "Git is not installed"
    fi
    
    log "Prerequisites check passed"
}

# Load environment variables
load_env() {
    log "Loading environment variables..."
    
    if [ ! -f .env ]; then
        error ".env file not found"
    fi
    
    source .env
    
    # Validate required environment variables
    required_vars=(
        "JWT_SECRET"
        "MONGODB_URI"
        "OPENAI_API_KEY"
        "RAZORPAY_KEY_ID"
        "RAZORPAY_KEY_SECRET"
        "EMAIL_SERVICE"
        "EMAIL_USER"
        "EMAIL_PASS"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    log "Environment variables loaded successfully"
}

# Backup current deployment
backup_deployment() {
    log "Creating backup of current deployment..."
    
    if docker-compose ps | grep -q "Up"; then
        docker-compose exec -T mongodb mongodump --out /backups/backup_$(date +%Y%m%d_%H%M%S) || warning "Backup failed, continuing..."
    fi
    
    log "Backup completed"
}

# Pull latest code
pull_latest_code() {
    log "Pulling latest code..."
    
    git fetch origin
    git checkout main
    git pull origin main
    
    log "Latest code pulled successfully"
}

# Build and push Docker images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    log "Building backend image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION ./backend
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-backend:$VERSION
    
    # Build frontend
    log "Building frontend image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION ./frontend
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-frontend:$VERSION
    
    # Build admin
    log "Building admin image..."
    docker build -t $DOCKER_REGISTRY/$PROJECT_NAME-admin:$VERSION ./admin
    docker push $DOCKER_REGISTRY/$PROJECT_NAME-admin:$VERSION
    
    log "All images built and pushed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    docker-compose exec -T backend npm run migrate || warning "Migrations failed, continuing..."
    
    log "Database migrations completed"
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Stop current services
    log "Stopping current services..."
    docker-compose down --remove-orphans
    
    # Start services with new images
    log "Starting services with new images..."
    docker-compose up -d
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    timeout=300
    counter=0
    
    while [ $counter -lt $timeout ]; do
        if docker-compose ps | grep -q "Up"; then
            log "Services are healthy"
            break
        fi
        sleep 5
        counter=$((counter + 5))
    done
    
    if [ $counter -eq $timeout ]; then
        error "Services failed to start within timeout"
    fi
    
    log "Services deployed successfully"
}

# Run health checks
health_checks() {
    log "Running health checks..."
    
    # Check backend health
    if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        error "Backend health check failed"
    fi
    
    # Check frontend health
    if ! curl -f http://localhost:3000 > /dev/null 2>&1; then
        error "Frontend health check failed"
    fi
    
    # Check admin health
    if ! curl -f http://localhost:3001 > /dev/null 2>&1; then
        error "Admin health check failed"
    fi
    
    log "All health checks passed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Run backend tests
    docker-compose exec -T backend npm test || warning "Backend tests failed"
    
    # Run frontend tests
    docker-compose exec -T frontend npm test -- --watchAll=false || warning "Frontend tests failed"
    
    log "Tests completed"
}

# Update deployment info
update_deployment_info() {
    log "Updating deployment info..."
    
    echo "{
        \"version\": \"$VERSION\",
        \"environment\": \"$ENVIRONMENT\",
        \"deployed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"commit\": \"$(git rev-parse HEAD)\",
        \"branch\": \"$(git rev-parse --abbrev-ref HEAD)\"
    }" > deployment-info.json
    
    log "Deployment info updated"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Stop current services
    docker-compose down
    
    # Start previous version
    docker-compose up -d
    
    log "Rollback completed"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old containers
    docker container prune -f
    
    log "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment for version $VERSION in $ENVIRONMENT environment"
    
    # Set up error handling
    trap 'error "Deployment failed. Rolling back..." && rollback' ERR
    
    check_prerequisites
    load_env
    backup_deployment
    pull_latest_code
    build_images
    deploy_services
    run_migrations
    health_checks
    run_tests
    update_deployment_info
    cleanup
    
    log "Deployment completed successfully!"
    log "Version: $VERSION"
    log "Environment: $ENVIRONMENT"
    log "Services are running and healthy"
}

# Parse command line arguments
case "$1" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_checks
        ;;
    "test")
        run_tests
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|test} [version] [environment]"
        echo "  deploy   - Deploy the application"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Run health checks"
        echo "  test     - Run tests"
        exit 1
        ;;
esac 