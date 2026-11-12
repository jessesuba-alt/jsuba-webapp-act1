# SuVault Firestore Security Specification

## 1. Data Invariants
- Identity Integrity: A file document can only be created or written if `incoming().userId == request.auth.uid`.
- Read Isolation: Users can only read, list, and delete their own file documents (`resource.data.userId == request.auth.uid`).
- User Profile Isolation: Users can only read and write their own `/users/{userId}` document where `{userId} == request.auth.uid`.
- Strict Schema: All incoming payloads must satisfy strict key constraints and boundary limits (no ghost fields).

## 2. The Dirty Dozen Payloads (Target: PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempting to read `/files/file_123` with `request.auth == null`.
2. **Unauthenticated Write**: Attempting to create `/files/file_123` with `request.auth == null`.
3. **Cross-Tenant Read**: User A (`uid_A`) querying `/files` without `where('userId', '==', 'uid_A')`.
4. **Cross-Tenant File Access**: User A (`uid_A`) attempting to get `/files/file_B` owned by `uid_B`.
5. **Cross-Tenant File Deletion**: User A (`uid_A`) attempting to delete `/files/file_B`.
6. **Spoofed Owner Write**: User A (`uid_A`) attempting to create a file with `userId: 'uid_B'`.
7. **Shadow Field Injection**: Attempting to create a file with unexpected field `isAdmin: true`.
8. **Malicious Path Length / Injection**: Document ID exceeding 128 characters or containing illegal characters.
9. **Payload Size Poisoning**: Notes exceeding 1000 characters.
10. **File Size Negative / Invalid Type**: `size` set to a negative number or string.
11. **Cross-Tenant User Profile Modification**: User A modifying `/users/user_B`.
12. **Role Tampering**: User setting unauthorized elevated roles.
