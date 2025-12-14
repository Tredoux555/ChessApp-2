#!/bin/bash
# Database Setup Script for Railway
# Run this in Railway's web shell

echo "🚀 Starting database setup..."
echo ""

# Use Prisma to push schema (recommended method)
echo "📦 Running Prisma db push..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Tables created:"
    echo "- User"
    echo "- Game"
    echo "- Friendship"
    echo "- Message"
    echo "- Product"
    echo "- Order"
    echo "- Tournament"
    echo "- TournamentParticipant"
    echo "- TournamentMatch"
    echo "- Spectator"
else
    echo ""
    echo "❌ Database setup failed. Check the error above."
    exit 1
fi

