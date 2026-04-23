#!/bin/bash
# Test chat API endpoints

BASE_URL="http://localhost:8080"
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser$TIMESTAMP@test.com"
TEST_ADMIN_EMAIL="testadmin$TIMESTAMP@test.com"

echo "=== ARGATY CHAT API TEST ==="
echo ""

# 1. Register test user
echo "1. Registering test user: $TEST_EMAIL"
USER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"123123\",
    \"fullName\": \"Test User\"
  }")
echo "Response: $USER_RESPONSE"
echo ""

# 2. Login test user
echo "2. Logging in test user"
USER_LOGIN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"123123\"
  }")
echo "Response: $USER_LOGIN"

# Extract token
USER_TOKEN=$(echo "$USER_LOGIN" | jq -r '.data.accessToken' 2>/dev/null || echo "")
if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  echo "Failed to get user token"
  exit 1
fi
echo "User Token: ${USER_TOKEN:0:20}..."
echo ""

# 3. Start authenticated chat
echo "3. Starting authenticated chat for user"
CHAT_START=$(curl -s -X POST "$BASE_URL/api/v1/chat/start-auth" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN")
echo "Response: $CHAT_START"

SESSION_ID=$(echo "$CHAT_START" | jq -r '.data.sessionId' 2>/dev/null || echo "")
if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
  echo "Failed to get session ID"
  exit 1
fi
echo "Session ID: $SESSION_ID"
echo ""

# 4. User sends message
echo "4. User sending message"
USER_MESSAGE=$(curl -s -X POST "$BASE_URL/api/v1/chat/$SESSION_ID/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"message\": \"Hello admin, can you help?\",
    \"sender\": \"visitor\"
  }")
echo "Response: $USER_MESSAGE"
echo ""

# 5. Register admin user
echo "5. Registering admin user: $TEST_ADMIN_EMAIL"
ADMIN_REGISTER=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_ADMIN_EMAIL\",
    \"password\": \"123123\",
    \"fullName\": \"Test Admin\",
    \"role\": \"ADMIN\"
  }")
echo "Response: $ADMIN_REGISTER"
echo ""

# 6. Login admin user
echo "6. Logging in admin user"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_ADMIN_EMAIL\",
    \"password\": \"123123\"
  }")
echo "Response: $ADMIN_LOGIN"

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.accessToken' 2>/dev/null || echo "")
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "Failed to get admin token"
  exit 1
fi
echo "Admin Token: ${ADMIN_TOKEN:0:20}..."
echo ""

# 7. Admin gets list of chat sessions
echo "7. Admin fetching chat sessions"
SESSIONS=$(curl -s -X GET "$BASE_URL/api/v1/admin/chat/sessions" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "Response: $SESSIONS"
echo ""

# 8. Get messages for session
echo "8. Getting messages for session: $SESSION_ID"
MESSAGES=$(curl -s -X GET "$BASE_URL/api/v1/chat/$SESSION_ID/messages" \
  -H "Authorization: Bearer $USER_TOKEN")
echo "Response: $MESSAGES"
echo ""

echo "=== TEST COMPLETE ==="
