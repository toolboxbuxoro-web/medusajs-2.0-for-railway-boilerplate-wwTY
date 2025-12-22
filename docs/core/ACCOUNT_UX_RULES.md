# Account UX Rules & Principles

> **Last Updated**: December 22, 2024  
> **Audience**: Frontend developers, UX designers  
> **Purpose**: Ensure consistent, secure, and user-friendly Account experience

---

## 1. Core UX Principles

### 1.1 Phone is the Identity
- **Rule**: Never expose technical implementation details
- **Do**: Show phone number as primary identifier
- **Don't**: Show `998901234567@phone.local` to users
- **Example**:
  ```tsx
  // ❌ BAD
  <p>Вы вошли как: {customer.email}</p>
  
  // ✅ GOOD
  <p>Телефон: {customer.phone}</p>
  ```

### 1.2 No Email Exposure
- **Rule**: Email is a technical field, not user-facing
- **Do**: Hide email field entirely OR show phone instead
- **Don't**: Display technical emails in UI
- **Exception**: Legacy users with real emails (e.g., `user@gmail.com`) can see their email

### 1.3 Actions Must Be Obvious
- **Rule**: Every button must clearly state what it does
- **Do**: Use action verbs ("Сохранить", "Изменить", "Удалить")
- **Don't**: Use vague labels ("ОК", "Подтвердить")
- **Example**:
  ```tsx
  // ❌ BAD
  <Button>Подтвердить</Button>
  
  // ✅ GOOD
  <Button>Сохранить изменения</Button>
  ```

### 1.4 No Raw Backend Errors
- **Rule**: All error messages must be user-friendly and localized
- **Do**: Map backend errors to translation keys
- **Don't**: Show raw error strings like `"customer_not_found"`
- **Implementation**: Use `mapBackendError()` in `customer.ts`

---

## 2. Component Patterns

### 2.1 AccountInfo Component

**Purpose**: Reusable edit pattern for profile fields

**States**:
1. **View Mode**: Display current value + "Edit" button
2. **Edit Mode**: Show form fields + "Save" / "Cancel" buttons
3. **Success**: Green badge with success message
4. **Error**: Red badge with error message

**Rules**:
- Always show current value in view mode
- Always provide cancel button in edit mode
- Always clear error/success state when toggling edit mode
- Always use loading state during submission

**Example**:
```tsx
<AccountInfo
  label={t('phone')}
  currentInfo={customer.phone}  // ✅ Show current value
  isSuccess={successState}
  isError={!!errorMessage}
  errorMessage={errorMessage}  // ✅ Localized message
  clearState={clearState}
>
  {/* Edit form fields */}
</AccountInfo>
```

### 2.2 OTP Input Pattern

**Rules**:
1. OTP field is OPTIONAL on first submit
2. If no OTP provided → Send OTP → Show success message
3. User enters OTP → Submit again → Perform action
4. Always show "Код из SMS" label (localized)

**Example**:
```tsx
// Step 1: User clicks "Save" without OTP
<Input
  label={t('sms_code')}
  name="otp_code"
  type="text"
  // ✅ NOT required on first submit
/>

// Step 2: Backend sends OTP, returns "otp_sent"
// Frontend shows: "Код отправлен по SMS"

// Step 3: User enters code, clicks "Save" again
// Backend verifies OTP, performs action
```

### 2.3 Password Fields

**Rules**:
1. Always use `type="password"` for password inputs
2. Always require old password for password change
3. Always require password confirmation
4. Always show "Пароль скрыт в целях безопасности" in view mode

**Example**:
```tsx
<AccountInfo
  label={t('password')}
  currentInfo={<span>{t('password_hidden')}</span>}  // ✅ Never show actual password
>
  <Input label={t('old_password')} type="password" required />
  <Input label={t('new_password')} type="password" required />
  <Input label={t('confirm_password')} type="password" required />
  <Input label={t('sms_code')} type="text" />
</AccountInfo>
```

---

## 3. Button Rules

### 3.1 Primary Actions
- **Color**: Red (`bg-red-600`)
- **Use For**: Main CTAs (Save, Submit, Place Order)
- **Example**: "Сохранить изменения", "Оформить заказ"

### 3.2 Secondary Actions
- **Color**: Gray (`bg-gray-100`)
- **Use For**: Cancel, Back, Edit
- **Example**: "Отмена", "Назад", "Редактировать"

### 3.3 Destructive Actions
- **Color**: Red outline (`border-red-600 text-red-600`)
- **Use For**: Delete, Remove, Logout
- **Example**: "Удалить адрес", "Выйти"
- **Rule**: Always require confirmation for destructive actions

### 3.4 Loading States
- **Rule**: Always disable button during async operations
- **Do**: Show spinner + "Обработка..." text
- **Don't**: Leave button clickable during loading

**Example**:
```tsx
<Button
  isLoading={pending}  // ✅ Disable during submission
  type="submit"
>
  {t('save_changes')}
</Button>
```

---

## 4. Error Handling Rules

### 4.1 Error Message Mapping

**Backend Error** → **User-Facing Message**

| Backend Error | Translation Key | User Message (RU) |
|---------------|-----------------|-------------------|
| `invalid_code` | `errors.invalid_code` | "Неверный код подтверждения." |
| `invalid_phone` | `errors.invalid_phone` | "Введите корректный номер телефона (+998...)" |
| `otp_cooldown` | `errors.otp_cooldown` | "Пожалуйста, подождите 60 секунд перед повторной отправкой кода." |
| `too_many_requests` | `errors.too_many_requests` | "Слишком много попыток. Пожалуйста, попробуйте позже." |
| `customer_not_found` | `errors.error_occurred` | "Произошла ошибка. Пожалуйста, попробуйте еще раз." |

**Implementation**:
```tsx
// ✅ GOOD: Map backend error to translation key
const errorMessage = typeof state === "string" && !state.startsWith("success.") 
  ? state 
  : undefined

// In component:
<Badge color="red">
  <span>{errorMessage || t('error_occurred')}</span>
</Badge>
```

### 4.2 Success Message Pattern

**Rule**: All success messages use `success.*` translation keys

**Example**:
```tsx
// Backend returns: "success.password_changed"
// Frontend checks:
if (typeof state === "string" && state.startsWith("success.")) {
  setSuccessState(true)
}

// Display:
<Badge color="green">
  {t('password')} {t('updated_successfully')}
</Badge>
```

### 4.3 Error Display Rules

1. **Position**: Always below the field that caused the error
2. **Color**: Red badge (`color="red"`)
3. **Duration**: Persist until user dismisses or re-submits
4. **Clear On**: Edit mode toggle, form reset

---

## 5. Confirmation Patterns

### 5.1 When to Confirm

**Always Confirm**:
- Logout
- Delete address
- Delete account (future)
- Cancel order (future)

**Never Confirm**:
- Save changes (can be undone)
- Edit mode toggle
- Navigation

### 5.2 Confirmation Modal Template

```tsx
<Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
  <h3>{t('confirm_action')}</h3>
  <p>{t('action_description')}</p>
  <div className="flex gap-4">
    <Button variant="secondary" onClick={() => setShowConfirm(false)}>
      {t('cancel')}
    </Button>
    <Button variant="destructive" onClick={handleConfirm}>
      {t('confirm')}
    </Button>
  </div>
</Modal>
```

---

## 6. Translation Rules

### 6.1 Namespace Structure

```
account.*       → Account-specific UI (labels, actions)
errors.*        → Error messages
success.*       → Success messages
common.*        → Shared UI (buttons, labels)
checkout.*      → Checkout-specific (reused in profile)
```

### 6.2 Missing Translation Handling

**Rule**: Never show `MISSING_MESSAGE` or raw keys to users

**Do**:
```tsx
// ✅ Provide fallback
<Input label={t('sms_code') || "Код из SMS"} />
```

**Don't**:
```tsx
// ❌ No fallback
<Input label={t('sms_code')} />  // Shows "MISSING_MESSAGE" if key missing
```

### 6.3 Translation Parity

**Rule**: All messages must exist in BOTH `ru.json` and `uz.json`

**Check**:
```bash
# Compare keys
diff <(jq -r 'keys[]' messages/ru.json | sort) \
     <(jq -r 'keys[]' messages/uz.json | sort)
```

---

## 7. Responsive Design Rules

### 7.1 Mobile-First

**Rule**: Design for mobile, enhance for desktop

**Breakpoints**:
- Mobile: `< 640px` (default)
- Tablet: `640px - 1024px` (`sm:`, `md:`)
- Desktop: `> 1024px` (`lg:`, `xl:`)

**Example**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  {/* 1 column on mobile, 2 on desktop */}
</div>
```

### 7.2 Navigation

**Mobile**: Horizontal scroll tabs
```tsx
<div className="lg:hidden">
  <div className="flex gap-2 overflow-x-auto">
    {/* Tabs */}
  </div>
</div>
```

**Desktop**: Vertical sidebar
```tsx
<div className="hidden lg:block">
  <div className="sticky top-24">
    {/* Sidebar */}
  </div>
</div>
```

### 7.3 Form Layouts

**Mobile**: Single column
```tsx
<div className="grid grid-cols-1 gap-4">
  <Input label="Имя" />
  <Input label="Фамилия" />
</div>
```

**Desktop**: Two columns (when appropriate)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input label="Имя" />
  <Input label="Фамилия" />
</div>
```

---

## 8. Accessibility Rules

### 8.1 Semantic HTML

**Rule**: Use semantic elements for structure

**Do**:
```tsx
<h1>Профиль</h1>
<p>Описание</p>
<button type="submit">Сохранить</button>
```

**Don't**:
```tsx
<div className="text-2xl font-bold">Профиль</div>
<div>Описание</div>
<div onClick={handleSubmit}>Сохранить</div>
```

### 8.2 Form Labels

**Rule**: Every input must have a visible label

**Do**:
```tsx
<Input label="Телефон" name="phone" />
```

**Don't**:
```tsx
<input placeholder="Телефон" name="phone" />  // ❌ No label
```

### 8.3 Test IDs

**Rule**: Add `data-testid` to all interactive elements

**Example**:
```tsx
<Button data-testid="save-button">Сохранить</Button>
<Input data-testid="phone-input" />
<div data-testid="error-message">{error}</div>
```

---

## 9. Performance Rules

### 9.1 Server Components

**Rule**: Use Server Components for data fetching

**Do**:
```tsx
// app/account/profile/page.tsx
export default async function Profile() {
  const customer = await getCustomer()  // ✅ Server-side
  return <ProfileForm customer={customer} />
}
```

**Don't**:
```tsx
// ❌ Client-side fetch
"use client"
export default function Profile() {
  const [customer, setCustomer] = useState(null)
  useEffect(() => {
    fetch('/api/customer').then(...)
  }, [])
}
```

### 9.2 Client Components

**Rule**: Use Client Components ONLY for interactivity

**When to Use**:
- Form submissions (`useFormState`, `useFormStatus`)
- Toggle states (`useState`)
- Event handlers (`onClick`, `onChange`)

**Example**:
```tsx
"use client"  // ✅ Needed for useFormState
export default function ProfilePhone({ customer }) {
  const [state, formAction] = useFormState(changePhoneWithOtp, null)
  // ...
}
```

### 9.3 Revalidation

**Rule**: Revalidate customer data after mutations

**Implementation**:
```tsx
// lib/data/customer.ts
export async function updateCustomer(body) {
  const result = await sdk.store.customer.update(body, {}, getAuthHeaders())
  revalidateTag("customer")  // ✅ Invalidate cache
  return result
}
```

---

## 10. Security UX Rules

### 10.1 Password Visibility

**Rule**: Never show passwords in plain text

**Do**:
```tsx
<Input type="password" />
<span>{t('password_hidden')}</span>
```

**Don't**:
```tsx
<Input type="text" value={password} />
<span>{password}</span>
```

### 10.2 Sensitive Data

**Rule**: Mask or hide sensitive data in UI

**Examples**:
- Phone: `+998 ** *** **67` (partial masking, optional)
- Email: `user@******.com` (if shown)
- Password: Always hidden

### 10.3 Logout Confirmation

**Rule**: Confirm before logout (prevent accidental clicks)

**Implementation**:
```tsx
const handleLogout = async () => {
  if (confirm(t('confirm_logout'))) {  // ✅ Native confirm
    await signout(countryCode)
  }
}
```

---

## 11. Common Mistakes to Avoid

### ❌ Don't: Show Technical Emails
```tsx
// BAD
<p>Email: {customer.email}</p>  // Shows "998901234567@phone.local"
```

### ✅ Do: Show Phone Instead
```tsx
// GOOD
<p>Телефон: {customer.phone}</p>  // Shows "+998901234567"
```

---

### ❌ Don't: Use Raw Error Strings
```tsx
// BAD
<Badge color="red">{error}</Badge>  // Shows "customer_not_found"
```

### ✅ Do: Map to Translation Keys
```tsx
// GOOD
<Badge color="red">{t(`errors.${error}`)}</Badge>  // Shows localized message
```

---

### ❌ Don't: Forget Loading States
```tsx
// BAD
<Button onClick={handleSave}>Сохранить</Button>
```

### ✅ Do: Disable During Loading
```tsx
// GOOD
<Button isLoading={pending} onClick={handleSave}>
  Сохранить
</Button>
```

---

### ❌ Don't: Skip Confirmations
```tsx
// BAD
<Button onClick={handleDelete}>Удалить</Button>
```

### ✅ Do: Confirm Destructive Actions
```tsx
// GOOD
<Button onClick={() => {
  if (confirm(t('confirm_delete'))) handleDelete()
}}>
  Удалить
</Button>
```

---

## 12. Checklist for New Account Features

Before adding a new feature to the Account area:

- [ ] Does it require OTP? (If yes, use existing OTP pattern)
- [ ] Does it mutate sensitive data? (If yes, add confirmation)
- [ ] Are all error messages localized? (Check `errors.*` keys)
- [ ] Are all success messages localized? (Check `success.*` keys)
- [ ] Does it work on mobile? (Test at 375px width)
- [ ] Does it have loading states? (Use `useFormStatus`)
- [ ] Does it have test IDs? (Add `data-testid` attributes)
- [ ] Does it revalidate cache? (Use `revalidateTag("customer")`)
- [ ] Is it documented? (Update `ACCOUNT_SYSTEM.md`)

---

## 13. Future Improvements

### High Priority
1. Hide technical email in Overview page
2. Remove or implement email editing
3. Add logout confirmation modal

### Medium Priority
4. Profile picture upload
5. Session management (view/revoke active sessions)
6. Account deletion flow

### Low Priority
7. Two-factor authentication (beyond OTP)
8. Email verification (if real emails supported)
9. Password strength indicator
