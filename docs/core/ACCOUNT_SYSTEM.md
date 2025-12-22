# Account System Documentation

> **Last Updated**: December 22, 2024  
> **Status**: Production  
> **Auth Model**: Phone-first with OTP verification
> **Delivery Model**: BTS Pickup Only (Address management disabled)

---

## 1. System Architecture

### 1.1 Identity Model

**Primary Identifier**: Phone number (normalized to `998XXXXXXXXX` format)

**Email Strategy**:
- **Technical email**: `{phone_digits}@phone.local` (e.g., `998901234567@phone.local`)
- **Legacy users**: May have real emails (e.g., `user@gmail.com`)
- **Auth Identity**: Uses `emailpass` provider with `entity_id = email`
- **No `provider_id`**: Medusa 2.x does not use this field

**Login Flow**:
1. User enters phone + password
2. System normalizes phone → `+998XXXXXXXXX`
3. Backend finds customer by phone (SQL query on normalized digits)
4. Uses customer's stored email for authentication
5. Fallback to technical email if customer not found

---

## 2. Account Area Structure

### 2.1 Pages & Routes

| Route | Component | Purpose | Auth Required |
|-------|-----------|---------|---------------|
| `/account` | `@dashboard/page.tsx` | Overview (orders, profile stats) | ✅ Yes |
| `/account/profile` | `@dashboard/profile/page.tsx` | Edit profile (name, email, phone, password, billing) | ✅ Yes |
| `/account/addresses` | `@dashboard/addresses/page.tsx` | Delivery information (BTS only) | ✅ Yes |
| `/account/orders` | `@dashboard/orders/page.tsx` | Order history | ✅ Yes |
| `/account/orders/details/:id` | `@dashboard/orders/[id]/page.tsx` | Order details | ✅ Yes |
| `/account` (logged out) | `@login/page.tsx` | Login/Register form | ❌ No |

### 2.2 Account Features

#### **Overview Page** (`/account`)
- **Data Displayed**:
  - Welcome message with first name
  - Email (technical or real)
  - Profile completion % (based on: email, name, phone)
  - Recent orders (last 5)
- **Actions**: View all orders link
- **Security**: Read-only display, no mutations

#### **Profile Page** (`/account/profile`)
Editable sections (each in `AccountInfo` component):

1. **Name** (`ProfileName`)
   - Fields: `first_name`, `last_name`
   - Backend: `updateCustomer()` via SDK
   - OTP: ❌ No
   - Risk: ✅ LOW (cosmetic change)

2. **Email** (`ProfileEmail`)
   - Fields: `email`
   - Backend: ⚠️ **DISABLED** (commented out)
   - OTP: ❌ No
   - Risk: ⚠️ **MEDIUM** (non-functional, confusing UX)

3. **Phone** (`ProfilePhone`)
   - Fields: `phone`, `otp_code`
   - Backend: `/store/otp/change-phone`
   - OTP: ✅ **YES** (purpose: `change_phone`)
   - Risk: ✅ LOW (OTP-protected)

4. **Password** (`ProfilePassword`)
   - Fields: `old_password`, `new_password`, `confirm_password`, `otp_code`
   - Backend: `/store/otp/change-password`
   - OTP: ✅ **YES** (purpose: `change_password`)
   - Risk: ✅ LOW (OTP + old password required)

5. **Billing Address**
   - ❌ **The "Billing Address" section has been removed.**
   - Address management is disabled in favor of BTS pickup point selection at checkout.

#### **Addresses Page** (`/account/addresses`)
- **Status**: **Read-Only Information**
- **Content**: Displays information that delivery is only available via BTS pickup points.
- **Actions**: None. Address management is disabled.
- **Backend**: None.
- **Risk**: ✅ LOW (static content)

#### **Orders Page** (`/account/orders`)
- **Data**: Full order history
- **Actions**: View order details
- **Backend**: `listCustomerOrders()` via SDK
- **OTP**: ❌ No
- **Risk**: ✅ LOW (read-only)

---

## 3. OTP Security Model

### 3.1 OTP Purposes

| Purpose | Used For | Cooldown | TTL | One-Time Use |
|---------|----------|----------|-----|--------------|
| `register` | New account signup | 60s | 15 min | ✅ Yes |
| `reset_password` | Forgot password flow | 60s | 15 min | ✅ Yes |
| `change_password` | Change password in account | 60s | 15 min | ✅ Yes |
| `change_phone` | Change phone number | 60s | 15 min | ✅ Yes |
| `checkout` | Guest checkout auto-registration | 60s | 15 min | ✅ Yes |

### 3.2 OTP Flow (Generic)

```
1. User clicks "Edit" → enters new data
2. Frontend calls action (e.g., changePhoneWithOtp)
3. If no OTP code provided:
   → Backend sends OTP via SMS
   → Returns "otp_sent"
   → User sees success message
4. User enters OTP code + clicks "Save" again
5. Backend verifies OTP (atomic Redis operation)
6. If valid:
   → Consumes verification flag (one-time use)
   → Performs mutation (update phone/password)
   → Returns success
```

### 3.3 Backend OTP Routes

| Endpoint | Auth Required | Purpose | Validates |
|----------|---------------|---------|-----------|
| `/store/otp/request` | ❌ No | Send OTP code | Phone format, rate limit, cooldown |
| `/store/otp/verify` | ❌ No | Verify OTP code | Code match, not expired |
| `/store/otp/reset-password` | ❌ No | Reset password (forgot flow) | OTP, phone, new password |
| `/store/otp/change-password` | ⚠️ **NO AUTH** | Change password (logged in) | OTP, old password, new password |
| `/store/otp/change-phone` | ✅ **YES** | Change phone number | OTP, auth session, phone not in use |

### 3.4 Redis Keys

```
otp:{phone}:{purpose}              → 6-digit code (TTL: 15 min)
otp_verified:{phone}:{purpose}     → verification flag (TTL: 30 min)
otp_attempts:{phone}                → rate limit counter (TTL: 15 min)
otp_cooldown:{phone}:{purpose}     → cooldown flag (TTL: 60 sec)
```

**Atomic Operations**:
- `otpStoreVerify()`: Verify code → delete OTP → set verified flag (Lua script)
- `otpStoreConsumeVerified()`: Check verified flag → delete flag (Lua script)

---

## 4. Security Analysis

### 4.1 ✅ SAFE Behaviors

1. **Phone Change**: Requires OTP + auth session + uniqueness check
2. **Password Change**: Requires OTP + old password verification
3. **Password Reset**: Requires OTP + phone ownership
4. **OTP Atomicity**: All OTP operations use Redis Lua scripts (no race conditions)
5. **Rate Limiting**: Global per-phone limit (default: configurable via env)
6. **Cooldown**: 60-second cooldown prevents SMS spam
7. **One-Time Use**: Verification flags are consumed after use

### 4.2 ⚠️ RISKY Behaviors

#### **MEDIUM Risk**

1. **Email Edit is Disabled but Visible**
   - **Issue**: `ProfileEmail` component is rendered but does nothing
   - **Why Dangerous**: Confuses users, creates false expectations
   - **Abuse**: User tries to change email, nothing happens, support tickets increase
   - **Fix**: Hide email field entirely OR implement OTP-protected email change

2. **Email Exposure in Overview**
   - **Issue**: Technical email (`998901234567@phone.local`) is shown to users
   - **Why Dangerous**: Exposes internal implementation detail
   - **Abuse**: User confusion, perceived as a bug
   - **Fix**: Hide email field OR show "Телефон: +998..." instead

3. **Change Password Route Not Auth-Protected**
   - **Issue**: `/store/otp/change-password` does NOT check `auth_context`
   - **Why Dangerous**: Anyone with phone + OTP + old password can change password
   - **Abuse**: If attacker knows old password + has SMS access, can change password without being logged in
   - **Severity**: MEDIUM (requires old password + OTP, but bypasses session)
   - **Fix**: Add auth middleware OR verify session in route handler

#### **LOW Risk**

4. **No Logout Confirmation**
   - **Issue**: Logout button has no confirmation dialog
   - **Why Dangerous**: Accidental logout (especially on mobile)
   - **Abuse**: User frustration, not a security issue
   - **Fix**: Add confirmation modal

5. **Profile Completion Metric Includes Technical Email**
   - **Issue**: Profile completion counts technical email as "complete"
   - **Why Dangerous**: Misleading metric (user never set email)
   - **Abuse**: None, just UX confusion
   - **Fix**: Exclude technical emails from completion calculation

### 4.3 ✅ NOT RISKY (False Alarms)

1. **Name/Address Changes Without OTP**: ✅ SAFE
   - These are low-sensitivity fields
   - No identity or auth impact

2. **OTP Routes Without Auth**: ✅ SAFE (by design)
   - `/otp/request`, `/otp/verify`, `/otp/reset-password` are intentionally public
   - They validate phone ownership via SMS

---

## 5. Known Limitations

1. **Legacy User Support**:
   - Users with real emails (e.g., `user@gmail.com`) can log in
   - System finds customer by phone → uses stored email
   - Fallback to technical email if customer not found

2. **Email as Technical Field**:
   - Email is NOT user-facing
   - Used only for Medusa auth identity
   - Phone is the true identifier

3. **No Email Change Flow**:
   - Currently disabled
   - Would require: OTP on new email + phone verification

4. **No Phone Verification on Signup**:
   - OTP is sent during signup, but not re-verified after account creation
   - Assumption: If user completes signup, phone is verified

---

## 6. Data Flow Diagrams

### 6.1 Login Flow

```
User enters phone + password
         ↓
Frontend: normalizeUzPhone(phone) → +998XXXXXXXXX
         ↓
Backend: findCustomerByPhone(phone)
         ↓
    Found? → Use customer.email
    Not Found? → Use technical email (998...@phone.local)
         ↓
SDK: auth.login("emailpass", { email, password })
         ↓
    Success → Set auth token cookie
    Failure → Try fallback email (if different)
         ↓
    Still Fail → Return "invalid_credentials"
```

### 6.2 Change Phone Flow

```
User clicks "Edit Phone"
         ↓
User enters new phone
         ↓
Frontend: changePhoneWithOtp(formData)
         ↓
Backend: /store/otp/change-phone
         ↓
    No OTP? → Send OTP → Return "otp_sent"
         ↓
User enters OTP + submits again
         ↓
Backend:
  1. Verify OTP (atomic)
  2. Check auth session (auth_identity_id)
  3. Check new phone not in use
  4. Consume OTP flag (atomic)
  5. Update customer.phone
  6. Update customer.email (new technical email)
  7. Update auth identity entity_id
         ↓
    Success → Return { success: true }
```

### 6.3 Change Password Flow

```
User clicks "Edit Password"
         ↓
User enters old_password, new_password, confirm_password
         ↓
Frontend: changePasswordWithOtp(formData)
         ↓
Backend: /store/otp/change-password
         ↓
    No OTP? → Send OTP → Return "otp_sent"
         ↓
User enters OTP + submits again
         ↓
Backend:
  1. Verify OTP (atomic)
  2. Find customer by phone
  3. Authenticate with old password
  4. Update password via auth.updateProvider()
         ↓
    Success → Return { success: true }
```

---

## 7. Translation Keys

All account-related messages use `account.*` namespace:

```json
{
  "account": {
    "overview": "Обзор",
    "profile": "Профиль",
    "addresses": "Адреса",
    "orders": "Заказы",
    "logout": "Выйти",
    "hello": "Здравствуйте",
    "signed_in_as": "Вы вошли как:",
    "recent_orders": "Недавние заказы",
    "profile_completion": "Заполнение профиля",
    "password": "Пароль",
    "password_hidden": "Пароль скрыт в целях безопасности",
    "old_password": "Старый пароль",
    "new_password": "Новый пароль",
    "confirm_password": "Подтвердите пароль",
    "sms_code": "Код из SMS",
    "phone": "Телефон",
    "email": "Электронная почта",
    "name": "Имя",
    "save_changes": "Сохранить изменения",
    "cancel": "Отмена",
    "edit": "Редактировать",
    "updated_successfully": "успешно обновлено"
  },
  "errors": {
    "invalid_code": "Неверный код подтверждения.",
    "invalid_phone": "Введите корректный номер телефона (+998...)",
    "otp_sent": "Код отправлен по SMS",
    "otp_cooldown": "Пожалуйста, подождите 60 секунд перед повторной отправкой кода.",
    "password_change_failed": "Не удалось изменить пароль"
  },
  "success": {
    "password_changed": "Пароль успешно изменен.",
    "phone_changed": "Номер телефона успешно изменен."
  }
}
```

---

## 8. Testing Checklist

### Manual Test Plan

- [ ] **Login**: Phone + password → Success
- [ ] **Login**: Legacy email user → Success
- [ ] **Profile**: Edit name → Save → Verify update
- [ ] **Profile**: Edit phone → Request OTP → Enter code → Save → Verify update
- [ ] **Profile**: Edit password → Request OTP → Enter old + new + code → Save → Verify update
- [ ] **Profile**: Try to edit email → Verify nothing happens (disabled)
- [ ] **Addresses**: Verify "BTS Delivery Only" message is displayed
- [ ] **Orders**: View order history → Click order → Verify details
- [ ] **Logout**: Click logout → Verify redirect to login
- [ ] **OTP Cooldown**: Request OTP → Try again within 60s → Verify error
- [ ] **OTP Rate Limit**: Request OTP 10+ times → Verify rate limit error

---

## 9. Production Readiness

### ✅ SAFE FOR PROD

1. OTP system (Redis-backed, atomic)
2. Phone change flow (OTP + auth + uniqueness)
3. Password change flow (OTP + old password)
4. BTS Delivery integration (no address management)
5. Order history
6. Logout

### ⚠️ MUST FIX BEFORE SCALE

1. **Hide or implement email editing** (current state is confusing)
2. **Hide technical email in Overview** (show phone instead)
3. **Add auth check to `/store/otp/change-password`** (or document why it's safe)
4. **Add logout confirmation** (UX improvement)

### 📋 NICE TO HAVE

1. Profile picture upload
2. Email verification flow (if real emails are supported)
3. Two-factor authentication (beyond OTP)
4. Session management (view active sessions, revoke)
5. Account deletion flow
