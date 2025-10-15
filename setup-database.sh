#!/bin/bash

echo "🔄 Setting up PostgreSQL database for Chat Backend..."
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo ""
    echo "📥 Install PostgreSQL:"
    echo "  macOS: brew install postgresql@15"
    echo "  Ubuntu: sudo apt install postgresql postgresql-contrib"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is installed"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL is not running"
    echo "Starting PostgreSQL..."
    
    # Try to start PostgreSQL
    if command -v brew &> /dev/null; then
        brew services start postgresql@15
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    else
        echo "❌ Unable to start PostgreSQL automatically"
        echo "Please start PostgreSQL manually and run this script again"
        exit 1
    fi
    
    sleep 2
fi

echo "✅ PostgreSQL is running"

# Create database
echo "📦 Creating database 'chatdb'..."
createdb chatdb 2>/dev/null || echo "   Database may already exist"

echo "✅ Database created"

# Initialize schema
echo "🔨 Initializing database schema..."
npm run db:init

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ =========================================="
    echo "✅ Database setup complete!"
    echo "✅ =========================================="
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update .env with your database URL"
    echo "   2. Run: npm start"
    echo ""
else
    echo ""
    echo "❌ Database initialization failed"
    echo "Please check the error messages above"
    exit 1
fi
