# 🎯 ACTION PLAN - Feature Implementation

## 📊 Current Status Assessment

### ✅ **1. USER PROFILE** - PARTIALLY IMPLEMENTED

**What Exists:**
- ✅ API: `app/api/profile/route.ts` (GET search, PUT update)
- ✅ Page: `app/profile/page.tsx` (basic display only)
- ✅ Database: User model with `displayName`, `bio`, `profileImage`

**What's Missing:**
- ❌ Profile editing UI (form to edit displayName, bio, profileImage)
- ❌ Profile image upload functionality
- ❌ View other users' profiles
- ❌ Profile stats (games played, wins, losses)

**Priority:** HIGH
**Estimated Time:** 2-3 hours

---

### ✅ **2. FRIEND REQUESTS** - BACKEND READY, UI MISSING

**What Exists:**
- ✅ API: `app/api/friends/route.ts` (GET, POST, PUT, DELETE)
- ✅ Database: Friendship model with status (pending, accepted, rejected)
- ✅ Socket events: `friend-request`, `friend-accepted`
- ✅ FriendsList component (shows accepted friends only)

**What's Missing:**
- ❌ UI to send friend requests (button on user search/profile)
- ❌ UI to view pending friend requests
- ❌ UI to accept/reject friend requests
- ❌ Friend request notifications
- ❌ Integration with FriendsList to show pending requests

**Priority:** HIGH (needed for chat to work)
**Estimated Time:** 3-4 hours

---

### ⚠️ **3. TIMER STARTS ON ACCEPTANCE** - NEEDS FIX

**Current Behavior:**
- Timer starts immediately when game is created
- Game status is "active" immediately
- Both players' timers start counting down right away

**What Needs to Change:**
- Add "pending" status to Game model
- Timer should NOT start until challenge is accepted
- When challenge is accepted, change status to "active" and start timer
- Need to modify game creation flow

**Priority:** HIGH
**Estimated Time:** 1-2 hours

**Files to Modify:**
- `app/api/games/route.ts` - Change initial status to "pending"
- `app/api/games/[id]/route.ts` - Add "accept-challenge" action
- `components/notifications/NotificationListener.tsx` - Add accept handler
- `components/chess/ChessGame.tsx` - Only start timer if status is "active"

---

### ✅ **4. CHAT FUNCTIONALITY** - MOSTLY COMPLETE

**What Exists:**
- ✅ API: `app/api/messages/route.ts` (GET, POST)
- ✅ Page: `app/chat/page.tsx`
- ✅ Components: `ChatInterface.tsx`, `FriendsList.tsx`
- ✅ Socket events: `chat-message`, `new-message`
- ✅ Real-time messaging works

**What's Missing:**
- ❌ Friend request UI (needed to add friends to chat with)
- ❌ Typing indicators (socket event exists but not implemented in UI)
- ❌ Unread message counts
- ❌ Message search/filter
- ⚠️ **BUG**: ChatInterface uses `friendId` but API expects `userId` - needs fix

**Priority:** MEDIUM (works once friend requests are added)
**Estimated Time:** 2-3 hours (after friend requests)

---

### ⚠️ **5. SHOP/MARKETPLACE** - PARTIALLY IMPLEMENTED

**What Exists:**
- ✅ API: `app/api/products/route.ts` (GET, POST, PUT, DELETE)
- ✅ Page: `app/marketplace/page.tsx`
- ✅ Components: `ProductGrid.tsx`, `ProductForm.tsx`
- ✅ Database: Product and Order models

**What's Missing:**
- ❌ Product detail page (clicking "View Details" does nothing)
- ❌ Order creation functionality
- ❌ Purchase flow (add to cart, checkout)
- ❌ Order history page
- ❌ Seller dashboard (view/manage own products)
- ❌ WeChat QR code integration (mentioned in requirements)
- ❌ Payment confirmation system

**Priority:** MEDIUM
**Estimated Time:** 4-6 hours

---

## 🎯 IMPLEMENTATION PRIORITY ORDER

### **Phase 1: Critical Fixes** (Must do first)
1. **Timer starts on acceptance** ⚠️ (1-2 hours)
   - Fix game creation to use "pending" status
   - Add accept challenge endpoint
   - Update notification handler

### **Phase 2: Core Features** (Enable main functionality)
2. **Friend Requests UI** ⚠️ (3-4 hours)
   - Add friend request button to user search/profile
   - Create friend requests page/component
   - Add accept/reject UI
   - Integrate with FriendsList

3. **User Profile Editing** ⚠️ (2-3 hours)
   - Create profile edit form
   - Add image upload (or URL input)
   - Add profile view for other users

### **Phase 3: Enhancements** (Polish existing features)
4. **Chat Enhancements** (2-3 hours)
   - Typing indicators
   - Unread counts
   - Better UI/UX

5. **Shop Completion** (4-6 hours)
   - Product detail page
   - Order creation
   - Purchase flow
   - Order history

---

## 📝 DETAILED TASKS

### Task 1: Fix Timer to Start on Acceptance

**Files to Create/Modify:**
1. `app/api/games/route.ts`
   - Change initial status from "active" to "pending"
   - Don't set `lastMoveAt` until accepted

2. `app/api/games/[id]/route.ts`
   - Add new action: `accept-challenge`
   - Change status from "pending" to "active"
   - Set `lastMoveAt` to current time
   - Start timer countdown

3. `components/notifications/NotificationListener.tsx`
   - Update Accept button to call accept-challenge API
   - Navigate to game after acceptance

4. `components/chess/ChessGame.tsx`
   - Only start timer countdown if status === "active"
   - Show "Waiting for opponent to accept" if status === "pending"

5. `prisma/schema.prisma`
   - Verify status can be "pending" (currently supports it)

---

### Task 2: Friend Requests UI

**Files to Create:**
1. `components/friends/FriendRequests.tsx` (NEW)
   - List pending friend requests received
   - Accept/Reject buttons
   - Real-time updates via socket

2. `components/friends/SendFriendRequest.tsx` (NEW)
   - Button component to send friend request
   - Show status (pending, accepted, not friends)
   - Use in user search results and profile pages

**Files to Modify:**
1. `components/chat/FriendsList.tsx`
   - Add tab for "Friend Requests"
   - Show pending requests section
   - Add "Add Friend" button

2. `app/chat/page.tsx`
   - Integrate FriendRequests component
   - Add navigation between friends and requests

3. `components/notifications/NotificationListener.tsx`
   - Add listener for `new-friend-request` socket event
   - Show toast notification

---

### Task 3: User Profile Editing

**Files to Create:**
1. `components/profile/ProfileEditForm.tsx` (NEW)
   - Form for displayName, bio, profileImage URL
   - Image preview
   - Save/Cancel buttons

**Files to Modify:**
1. `app/profile/page.tsx`
   - Add edit mode toggle
   - Show ProfileEditForm when editing
   - Add "Edit Profile" button

2. `app/profile/[id]/page.tsx` (NEW)
   - View other users' profiles
   - Show "Send Friend Request" button if not friends
   - Show profile stats

---

### Task 4: Chat Enhancements

**Files to Modify:**
1. `components/chat/ChatInterface.tsx`
   - Add typing indicator display
   - Add typing event emitter
   - Show unread message count

2. `components/chat/FriendsList.tsx`
   - Show unread count badges
   - Show online/offline status

---

### Task 5: Shop Completion

**Files to Create:**
1. `app/marketplace/[id]/page.tsx` (NEW)
   - Product detail page
   - Add to cart / Buy now buttons
   - Seller information

2. `components/marketplace/OrderForm.tsx` (NEW)
   - Quantity selector
   - WeChat QR code display
   - Order confirmation

3. `app/orders/page.tsx` (NEW)
   - Order history
   - Order status tracking

**Files to Modify:**
1. `components/marketplace/ProductGrid.tsx`
   - Make "View Details" navigate to product page
   - Add "Buy Now" quick action

2. `app/api/orders/route.ts` (NEW)
   - Create order endpoint
   - Get user orders endpoint

---

## 🚀 RECOMMENDED STARTING POINT

**Start with Phase 1: Timer Fix** - This is critical and quick to implement.

Then move to **Phase 2: Friend Requests** - This unlocks chat functionality.

Then **Phase 2: Profile Editing** - Completes user management.

Finally **Phase 3** enhancements can be done as needed.

---

## 📋 CHECKLIST

### Phase 1: Critical Fixes
- [ ] Add "pending" status to game creation
- [ ] Create accept-challenge API endpoint
- [ ] Update notification handler to accept challenges
- [ ] Fix timer to only start when accepted
- [ ] Test timer behavior

### Phase 2: Core Features
- [ ] Create FriendRequests component
- [ ] Create SendFriendRequest component
- [ ] Add friend request UI to search results
- [ ] Add friend request UI to profile pages
- [ ] Integrate friend requests with FriendsList
- [ ] Add friend request notifications
- [ ] Create ProfileEditForm component
- [ ] Add edit mode to profile page
- [ ] Create user profile view page

### Phase 3: Enhancements
- [ ] Add typing indicators to chat
- [ ] Add unread message counts
- [ ] Create product detail page
- [ ] Create order form
- [ ] Create order history page
- [ ] Add WeChat QR code integration

---

## ⚠️ NOTES

1. **Timer Fix** is the most critical - games shouldn't start until accepted
2. **Friend Requests** must be done before chat can be fully functional
3. **Profile Editing** is straightforward but important for UX
4. **Shop** can be done incrementally - basic functionality first, then enhancements

---

## 🎯 ESTIMATED TOTAL TIME

- Phase 1: 1-2 hours
- Phase 2: 5-7 hours
- Phase 3: 6-9 hours
- **Total: 12-18 hours**

---

Ready to start implementation! 🚀

