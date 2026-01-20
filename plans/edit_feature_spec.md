# Edit Feature for Session-Created Items - Specification Document

## Overview
Implement an edit feature allowing users to modify title, images (screenshots), reference link (URL), and description for items created during the current session. The edit process involves creating a new GitHub issue with updated data and closing the original issue.

## Architecture Overview

### Current System
- **Frontend**: HTML/CSS/JavaScript application running on Cloudflare Pages
- **Backend**: Cloudflare Functions interfacing with GitHub API
- **Data Storage**: GitHub Issues repository (xaxkep/DevLoop)
- **Authentication**: Cloudflare Access for user email
- **File Storage**: Images stored in GitHub repository `/images` directory

### Components Involved
1. **Frontend Components**:
   - `nexus_core_v2.html`: Main application with JavaScript logic
   - Modal dialogs for add/edit operations
   - Card rendering for displaying items

2. **Backend Components**:
   - `functions/api/issues.js`: Issue creation and listing
   - `functions/api/issues/[id].js`: Individual issue operations (PATCH for labels, DELETE for closing)
   - `functions/api/upload.js`: Image upload to GitHub

3. **Data Structures**:
   - Item object: `{id, type, title, description, status, feasibility, effort, url, screenshots, createdBy, email, selected, createdAt, isSessionItem}`

## Session Tracking

### Implementation
- Add `isSessionItem` boolean flag to item objects
- Set `isSessionItem: true` for all newly created items during the current browser session
- Persist session items in localStorage with session-specific key
- Clear session items on page refresh or login/logout

### Logic
```javascript
// When adding new item
const newItem = { ... , isSessionItem: true };
sessionItems.push(newItem.id);
localStorage.setItem('sessionItems', JSON.stringify(sessionItems));

// On load, mark items as session items
items.forEach(item => {
    if (sessionItems.includes(item.id)) {
        item.isSessionItem = true;
    }
});
```

## UI Modifications

### Edit Button
- Add edit button (pencil icon) to cards for session items only
- Position: Top-right corner of card, next to delete button
- Visibility: Only show for `item.isSessionItem === true`
- Permission: Available regardless of user role (since it's session-based)

### Edit Modal
- Reuse and extend the existing "Add New Item" modal
- Rename title to "Edit Item"
- Prefill fields with current item data
- Restrict editable fields: title, description, reference URL, screenshots
- Disable/restrict: type, status, feasibility, effort (as per requirements)
- Add "Save Changes" button instead of "Add to Board"

### Visual Indicators
- Add subtle indicator on session items (e.g., "Session" badge or different border)
- Highlight editable fields in modal
- Show validation for required fields (title)

## Data Flow for Updating

### Process Flow
1. User clicks edit button on session item
2. Modal opens with prefilled data
3. User modifies allowed fields
4. On save:
   - Validate required fields (title)
   - Create new GitHub issue with updated data
   - Close/delete original issue
   - Update local items array
   - Refresh UI

### Detailed Steps
1. **Validation**: Ensure title is not empty
2. **Create New Issue**:
   - Build new issue body with updated fields
   - Upload any new screenshots
   - POST to `/api/issues` with new data
3. **Delete Old Issue**:
   - PATCH original issue to closed state via `/api/issues/[id]`
4. **Update Local State**:
   - Replace old item with new item in `items` array
   - Update `sessionItems` if needed
   - Save to localStorage

### Error Handling
- If new issue creation fails, show error and keep original
- If deletion fails, show warning but update local state
- Fallback to local storage if GitHub API unavailable

## Backend Changes

### New API Endpoint: PUT /api/issues/[id]
- Purpose: Handle full item updates by creating new and deleting old
- Request Body: `{ title, description, url, screenshots }`
- Process:
  1. Get current issue data
  2. Create new issue with updated fields
  3. Close original issue
  4. Return new issue data

### Modified Functions

#### functions/api/issues.js
- No changes needed (creation handled by existing POST)

#### functions/api/issues/[id].js
- Add PUT method for full updates
- Handle creation of new issue and closure of old
- Ensure proper authorization (user email tracking)

#### functions/api/upload.js
- No changes needed (image upload already exists)

### Authentication & Authorization
- Use existing Cloudflare Access for user identification
- Allow edits only if user email matches the reporter (from issue body)
- For session items, allow edits regardless (since they're new)

## Implementation Plan

### Phase 1: Session Tracking
1. Modify `addNewItem()` to set `isSessionItem: true`
2. Add session items tracking in localStorage
3. Update `loadItems()` to restore session flags

### Phase 2: UI Modifications
1. Add edit button to card template
2. Create edit modal by extending add modal
3. Implement field prefill and restrictions
4. Add visual indicators for session items

### Phase 3: Edit Logic
1. Implement edit button click handler
2. Add `editItem()` function similar to `addNewItem()`
3. Handle new issue creation and old issue closure
4. Update local state and UI

### Phase 4: Backend API
1. Add PUT method to `functions/api/issues/[id].js`
2. Implement create-new-delete-old logic
3. Add proper error handling and logging

### Phase 5: Testing & Polish
1. Test edit flow for session items
2. Verify data integrity and error cases
3. Polish UI/UX for edit experience

## Security Considerations
- Restrict edits to allowed fields only
- Validate input data on both frontend and backend
- Ensure users can only edit their own session items
- Rate limiting for API calls

## Performance Considerations
- Lazy load edit modal components
- Optimize image uploads (reuse existing uploads where possible)
- Cache session items in memory to avoid localStorage overhead

## Migration & Compatibility
- Existing items remain non-editable (no regression)
- Session items are clearly marked
- Backward compatibility with existing API responses

## Mermaid Diagram: Edit Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant G as GitHub API

    U->>F: Click Edit on Session Item
    F->>F: Open Edit Modal (prefilled)
    U->>F: Modify fields & Save
    F->>F: Validate input
    F->>B: PUT /api/issues/[id] with updates
    B->>G: Create new issue with updated data
    G-->>B: New issue created
    B->>G: Close original issue
    G-->>B: Original issue closed
    B-->>F: Return new issue data
    F->>F: Update local items array
    F->>F: Refresh UI