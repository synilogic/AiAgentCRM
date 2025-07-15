#!/bin/bash

# Ai Agentic CRM Backup Script
# This script handles database and application data backups

set -e

# Configuration
BACKUP_DIR="/backups"
MONGODB_CONTAINER="aiagentcrm_mongodb"
RETENTION_DAYS=30
COMPRESS=true

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

# Create backup directory
create_backup_dir() {
    log "Creating backup directory..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$BACKUP_DIR/mongodb"
    mkdir -p "$BACKUP_DIR/uploads"
    mkdir -p "$BACKUP_DIR/logs"
    
    log "Backup directory created"
}

# Backup MongoDB
backup_mongodb() {
    log "Starting MongoDB backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="mongodb_backup_$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/mongodb/$BACKUP_NAME"
    
    # Create MongoDB backup
    docker exec $MONGODB_CONTAINER mongodump \
        --out /data/db/$BACKUP_NAME \
        --gzip \
        --archive=/data/db/$BACKUP_NAME.gz
    
    # Copy backup from container
    docker cp $MONGODB_CONTAINER:/data/db/$BACKUP_NAME.gz "$BACKUP_PATH.gz"
    
    # Verify backup
    if [ -f "$BACKUP_PATH.gz" ]; then
        log "MongoDB backup completed: $BACKUP_PATH.gz"
        
        # Get backup size
        BACKUP_SIZE=$(du -h "$BACKUP_PATH.gz" | cut -f1)
        log "Backup size: $BACKUP_SIZE"
    else
        error "MongoDB backup failed"
    fi
}

# Backup uploads directory
backup_uploads() {
    log "Starting uploads backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="uploads_backup_$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/uploads/$BACKUP_NAME"
    
    # Check if uploads directory exists
    if [ -d "./uploads" ]; then
        if [ "$COMPRESS" = true ]; then
            tar -czf "$BACKUP_PATH.tar.gz" -C ./uploads .
            log "Uploads backup completed: $BACKUP_PATH.tar.gz"
        else
            cp -r ./uploads "$BACKUP_PATH"
            log "Uploads backup completed: $BACKUP_PATH"
        fi
    else
        warning "Uploads directory not found, skipping"
    fi
}

# Backup logs
backup_logs() {
    log "Starting logs backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="logs_backup_$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/logs/$BACKUP_NAME"
    
    # Check if logs directory exists
    if [ -d "./logs" ]; then
        if [ "$COMPRESS" = true ]; then
            tar -czf "$BACKUP_PATH.tar.gz" -C ./logs .
            log "Logs backup completed: $BACKUP_PATH.tar.gz"
        else
            cp -r ./logs "$BACKUP_PATH"
            log "Logs backup completed: $BACKUP_PATH"
        fi
    else
        warning "Logs directory not found, skipping"
    fi
}

# Backup configuration files
backup_config() {
    log "Starting configuration backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="config_backup_$TIMESTAMP"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    # Create configuration backup
    tar -czf "$BACKUP_PATH.tar.gz" \
        .env \
        docker-compose.yml \
        nginx/nginx.conf \
        monitoring/prometheus.yml \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='uploads' \
        --exclude='logs' \
        --exclude='backups'
    
    log "Configuration backup completed: $BACKUP_PATH.tar.gz"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    MANIFEST_FILE="$BACKUP_DIR/backup_manifest_$TIMESTAMP.json"
    
    cat > "$MANIFEST_FILE" << EOF
{
    "backup_id": "$TIMESTAMP",
    "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "environment": "$(echo $NODE_ENV || echo 'production')",
    "backup_components": {
        "mongodb": "$(ls -1 $BACKUP_DIR/mongodb/mongodb_backup_$TIMESTAMP.gz 2>/dev/null || echo 'not_found')",
        "uploads": "$(ls -1 $BACKUP_DIR/uploads/uploads_backup_$TIMESTAMP.tar.gz 2>/dev/null || echo 'not_found')",
        "logs": "$(ls -1 $BACKUP_DIR/logs/logs_backup_$TIMESTAMP.tar.gz 2>/dev/null || echo 'not_found')",
        "config": "$(ls -1 $BACKUP_DIR/config_backup_$TIMESTAMP.tar.gz 2>/dev/null || echo 'not_found')"
    },
    "system_info": {
        "hostname": "$(hostname)",
        "disk_usage": "$(df -h $BACKUP_DIR | tail -1 | awk '{print $5}')",
        "backup_size": "$(du -sh $BACKUP_DIR | cut -f1)"
    }
}
EOF
    
    log "Backup manifest created: $MANIFEST_FILE"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Remove backups older than retention period
    find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "backup_manifest_*.json" -mtime +$RETENTION_DAYS -delete
    
    # Remove empty directories
    find "$BACKUP_DIR" -type d -empty -delete
    
    log "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Verify MongoDB backup
    if [ -f "$BACKUP_DIR/mongodb/mongodb_backup_$TIMESTAMP.gz" ]; then
        if gzip -t "$BACKUP_DIR/mongodb/mongodb_backup_$TIMESTAMP.gz"; then
            log "MongoDB backup integrity verified"
        else
            error "MongoDB backup integrity check failed"
        fi
    fi
    
    # Verify compressed backups
    for backup_file in "$BACKUP_DIR"/*.tar.gz; do
        if [ -f "$backup_file" ]; then
            if tar -tzf "$backup_file" > /dev/null 2>&1; then
                log "Backup integrity verified: $(basename $backup_file)"
            else
                error "Backup integrity check failed: $(basename $backup_file)"
            fi
        fi
    done
    
    log "All backup integrity checks passed"
}

# Send backup notification
send_notification() {
    log "Sending backup notification..."
    
    # You can integrate with your notification service here
    # Example: Slack, email, etc.
    
    BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)
    BACKUP_COUNT=$(find $BACKUP_DIR -name "*.gz" -o -name "*.tar.gz" | wc -l)
    
    echo "Backup completed successfully!"
    echo "Total backups: $BACKUP_COUNT"
    echo "Total size: $BACKUP_SIZE"
    echo "Backup directory: $BACKUP_DIR"
    
    log "Notification sent"
}

# Main backup function
main() {
    log "Starting backup process..."
    
    create_backup_dir
    backup_mongodb
    backup_uploads
    backup_logs
    backup_config
    create_manifest
    verify_backup
    cleanup_old_backups
    send_notification
    
    log "Backup process completed successfully!"
}

# Parse command line arguments
case "$1" in
    "backup")
        main
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    "verify")
        verify_backup
        ;;
    "mongodb")
        backup_mongodb
        ;;
    "uploads")
        backup_uploads
        ;;
    "logs")
        backup_logs
        ;;
    "config")
        backup_config
        ;;
    *)
        echo "Usage: $0 {backup|cleanup|verify|mongodb|uploads|logs|config}"
        echo "  backup   - Create full backup"
        echo "  cleanup  - Clean up old backups"
        echo "  verify   - Verify backup integrity"
        echo "  mongodb  - Backup MongoDB only"
        echo "  uploads  - Backup uploads only"
        echo "  logs     - Backup logs only"
        echo "  config   - Backup configuration only"
        exit 1
        ;;
esac 