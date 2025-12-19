# Final Test Checklist - Riddick Chess App

## ✅ Core Functionality Tests

### 1. Authentication
- [ ] Login page loads
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Session persists on refresh

### 2. Dashboard
- [ ] Dashboard loads after login
- [ ] "New Game" button works
- [ ] Quick access cards (Game History, Board Settings, Profile) work
- [ ] Header navigation visible
- [ ] Mobile bottom nav visible

### 3. Game Creation & Playing
- [ ] New Game modal opens
- [ ] User search works (real-time filtering)
- [ ] Game challenge sends notification
- [ ] Game page loads
- [ ] Chess board renders with pieces
- [ ] Pieces are Chess.com style (merida/neo)
- [ ] Moves work (drag & drop)
- [ ] Real-time moves sync between players
- [ ] Timer counts down correctly
- [ ] Timer syncs between players
- [ ] Game controls visible (Offer Draw, Resign, Close Game)
- [ ] Draw offer works
- [ ] Resign works
- [ ] Close game works (creator only)

### 4. Admin Panel
- [ ] Admin link visible for admin users
- [ ] Admin panel loads
- [ ] Users tab: List users, Make/Remove admin, Delete user
- [ ] Messages tab: View flagged messages, Unflag, Delete
- [ ] Products tab: Add product, Edit product, Delete product
- [ ] All admin actions work

### 5. Marketplace
- [ ] Products display
- [ ] Product images show correctly
- [ ] Images fit properly (object-contain)
- [ ] Currency shows ¥ (Yuan)
- [ ] Product cards look good

### 6. Profile
- [ ] Profile page loads
- [ ] Edit profile works
- [ ] Upload profile picture works
- [ ] Display name edit works
- [ ] Bio edit works

### 7. Settings
- [ ] Board settings page loads
- [ ] Board theme selection works
- [ ] Piece set selection works
- [ ] Preferences save correctly

### 8. Chat
- [ ] Chat page loads
- [ ] Friends list shows
- [ ] Send friend request works
- [ ] Accept friend request works
- [ ] Chat interface works
- [ ] Messages send/receive

### 9. Game History
- [ ] Game history page loads
- [ ] Games list displays
- [ ] Filters work
- [ ] Search works

### 10. Real-time Features
- [ ] Socket.io connects
- [ ] Move notifications work
- [ ] Challenge notifications work
- [ ] Friend request notifications work
- [ ] Online status updates

### 11. UI/UX
- [ ] Dark mode toggle works
- [ ] Mobile navigation visible
- [ ] Desktop navigation visible
- [ ] All pages responsive
- [ ] No console errors
- [ ] No broken images
- [ ] Loading states work

### 12. Error Handling
- [ ] 404 page works
- [ ] Error boundaries work
- [ ] API errors handled gracefully
- [ ] Network errors handled

## 🚨 Critical Issues to Check

1. **Real-time moves** - Must sync between players
2. **Timer sync** - Must be synchronized
3. **Admin access** - Only riddick should be admin
4. **Product images** - Must display correctly
5. **Currency** - Must show ¥ not $
6. **Socket.io** - Must connect properly
7. **Database** - All queries work
8. **Authentication** - Sessions work correctly

## 📝 Notes

- Test with 2 different accounts
- Test on mobile viewport
- Test on desktop viewport
- Check browser console for errors
- Check network tab for failed requests

