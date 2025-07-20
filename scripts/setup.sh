#!/bin/bash

# ChatzOne Backend Setup Script
# This script sets up the ChatzOne backend for development or production

set -e  # Exit on any error

echo "🚀 ChatzOne Backend Setup Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js $NODE_VERSION is installed"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if PostgreSQL is installed
check_postgres() {
    if command -v psql &> /dev/null; then
        PG_VERSION=$(psql --version | awk '{print $3}')
        print_status "PostgreSQL $PG_VERSION is installed"
    else
        print_warning "PostgreSQL not found. You'll need to install it or use Docker."
    fi
}

# Check if Redis is installed
check_redis() {
    if command -v redis-cli &> /dev/null; then
        REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
        print_status "Redis $REDIS_VERSION is installed"
    else
        print_warning "Redis not found. You'll need to install it or use Docker."
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing Node.js dependencies..."
    npm install
    print_status "Dependencies installed successfully"
}

# Setup environment file
setup_env() {
    print_step "Setting up environment file..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_status "Environment file created from template"
        print_warning "Please edit .env file with your configuration before starting the server"
    else
        print_status "Environment file already exists"
    fi
}

# Setup database
setup_database() {
    print_step "Setting up database..."
    
    # Check if DATABASE_URL is set
    if grep -q "postgresql://username:password@localhost:5432/chatzone" .env; then
        print_warning "Please update DATABASE_URL in .env file with your PostgreSQL credentials"
        return
    fi
    
    # Run migrations
    print_status "Running database migrations..."
    npm run migrate
    print_status "Database migrations completed"
}

# Create necessary directories
create_directories() {
    print_step "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    
    print_status "Directories created"
}

# Setup Docker (optional)
setup_docker() {
    print_step "Docker setup..."
    
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        print_status "Docker and Docker Compose are available"
        
        read -p "Do you want to use Docker for the database services? (y/n): " use_docker
        
        if [ "$use_docker" = "y" ] || [ "$use_docker" = "Y" ]; then
            print_status "Starting PostgreSQL and Redis with Docker..."
            docker-compose up -d postgres redis
            
            # Wait for services to be ready
            print_status "Waiting for services to be ready..."
            sleep 10
            
            # Update .env for Docker services
            sed -i.bak 's|DATABASE_URL=.*|DATABASE_URL=postgresql://chatzone_user:chatzone_pass@localhost:5432/chatzone|' .env
            sed -i.bak 's|REDIS_URL=.*|REDIS_URL=redis://localhost:6379|' .env
            
            print_status "Docker services started and .env updated"
        fi
    else
        print_warning "Docker not found. Skipping Docker setup."
    fi
}

# Main setup function
main() {
    echo ""
    print_step "Starting ChatzOne backend setup..."
    echo ""
    
    # System checks
    check_node
    check_postgres
    check_redis
    
    echo ""
    
    # Setup steps
    install_dependencies
    setup_env
    create_directories
    
    # Ask about Docker setup
    setup_docker
    
    # Database setup (if not using Docker)
    if [ ! "$(docker ps -q -f name=chatzone_postgres)" ]; then
        setup_database
    fi
    
    echo ""
    print_status "✅ Setup completed successfully!"
    echo ""
    
    # Next steps
    echo -e "${BLUE}Next steps:${NC}"
    echo "1. Edit the .env file with your configuration"
    echo "2. Make sure PostgreSQL and Redis are running"
    echo "3. Run 'npm run dev' to start the development server"
    echo "4. Visit http://localhost:5000/health to check if the server is running"
    echo ""
    
    # Configuration checklist
    echo -e "${YELLOW}Configuration Checklist:${NC}"
    echo "□ Update DATABASE_URL with your PostgreSQL credentials"
    echo "□ Update REDIS_URL with your Redis connection"
    echo "□ Add JWT_SECRET (use a strong random string)"
    echo "□ Configure OAuth (Google, Facebook) if needed"
    echo "□ Add Cloudinary credentials for image uploads"
    echo "□ Add Stripe credentials for payments"
    echo "□ Add Firebase credentials for push notifications"
    echo "□ Add Google Translate API key for translations"
    echo ""
    
    # Development vs Production
    echo -e "${BLUE}Environment Setup:${NC}"
    echo "Development: npm run dev"
    echo "Production: npm start"
    echo "Docker: docker-compose up"
    echo ""
}

# Run main function
main "$@"