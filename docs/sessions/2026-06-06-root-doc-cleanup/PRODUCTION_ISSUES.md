# Production Issues - Detailed List

## Issue #1: CRITICAL - Support.tsx Contact Form Not Submitting

**Severity:** 🔴 CRITICAL  
**Priority:** Must fix before production  
**Category:** Broken Feature - Data Loss Risk

### Location
- **File:** [src/pages/Support.tsx](src/pages/Support.tsx)
- **Lines:** 81-92
- **Function:** `handleSubmit`

### Problem
The Support page contact form shows a success message to users, but **does NOT actually send the message to the backend**. Users believe their message was sent when it wasn't.

### Current Code (BROKEN)
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  toast({
    title: "Message Sent",
    description: "We'll get back to you within 24 hours.",
  });

  setFormData({ name: "", email: "", subject: "", message: "" });
  setIsSubmitting(false);
};
```

### Why This Is Critical
1. **User Messages Lost**: No one receives support requests from this page
2. **False Success**: Users think they're getting support
3. **Revenue Impact**: Users can't get help, will get frustrated
4. **Trust Damage**: Silent failure is worse than visible error

### How Contact.tsx Does It (CORRECT)
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast({
      title: "Validation Error",
      description: "Please check the form for errors.",
      variant: "destructive",
    });
    return;
  }

  setIsSubmitting(true);

  try {
    // Get reCAPTCHA token
    const recaptchaToken = await executeRecaptcha('contact');
    
    // Call the API to send the email
    const response = await contactService.submit({
      name: formData.name,
      email: formData.email,
      message: formData.message,
      purpose: formData.purpose,
      origin: originUrl,
      recaptcha_token: recaptchaToken || undefined,
    });
    
    // ... handle success
  } catch (error) {
    // ... handle error
  }
};
```

### Required Fix
Replace the entire `handleSubmit` function in Support.tsx with proper API integration:

1. Import `contactService` from `@/services/api`
2. Import `useRecaptcha` hook
3. Replace fake setTimeout with `contactService.submit()`
4. Set purpose as `'support'`
5. Handle API errors properly
6. Validate form before submission

### Estimated Impact
- **Time to Fix:** 15-20 minutes
- **Risk:** Low (copying pattern from Contact.tsx)
- **Testing:** Test form submission, verify email received

---

## Issue #2: MEDIUM - Careers.tsx Placeholder Content

**Severity:** 🟡 MEDIUM  
**Priority:** Should fix before production  
**Category:** Incomplete Feature

### Location
- **File:** [src/pages/Careers.tsx](src/pages/Careers.tsx)
- **Lines:** 47-67
- **Section:** Main content area

### Problem
The Careers page displays "Coming Soon" placeholder content instead of actual job listings.

### Current Code
```tsx
{/* Coming Soon */}
<section className="py-16">
  <div className="container mx-auto px-4">
    <Card className="max-w-3xl mx-auto text-center">
      <CardContent className="py-16">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-10 h-10 text-accent" />
        </div>
        <h2 className="text-3xl font-bold mb-4">We're Growing!</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          We're building something exciting and will be hiring soon. Check back regularly 
          for new opportunities, or register your interest below.
        </p>
        <div className="bg-muted/50 rounded-xl p-6 mb-8 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-4">
            Want to be notified when positions open?
          </p>
          <Link to="/contact?purpose=general">
            <Button variant="accent" size="lg" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Register Your Interest
            </Button>
          </Link>
        </div>
```

### Why This Matters
1. **User Expectations**: Users expect job listings on careers page
2. **SEO Impact**: Incomplete content hurts search rankings
3. **Professionalism**: "Coming Soon" looks unfinished
4. **User Experience**: Users directed to general contact form instead of proper hiring flow

### Solution Options

#### Option A: Implement Job Listings (Recommended)
1. Create Job model/interface
2. Create admin interface to manage jobs
3. Create JobCard component
4. Fetch from API in Careers.tsx
5. Display with proper job details

#### Option B: Remove from Navigation (Quick Fix)
1. Remove Careers link from navigation
2. Keep page but don't advertise it
3. Implement proper page later

#### Option C: Redirect to External URL (Temporary)
1. Link to job board (Indeed, LinkedIn Careers, etc.)
2. Redirect from Careers.tsx to external URL
3. Implement internal system later

### Estimated Impact
- **Option A Time:** 2-4 hours
- **Option B Time:** 15 minutes
- **Option C Time:** 5 minutes
- **Risk:** Low (all options are safe)

---

## Issue #3: INFO - mockData.ts Unused File

**Severity:** 🔵 INFO  
**Priority:** Nice to have - cleanup  
**Category:** Code Quality

### Location
- **File:** [src/lib/mockData.ts](src/lib/mockData.ts)
- **Status:** NOT USED IN PRODUCTION

### Problem
The mockData.ts file exists but is never imported or used in production code. It contains seed data that's likely meant for testing/development only.

### Current Usage
```
✓ VERIFIED: No imports of this file in production code
✓ VERIFIED: initializeMockData() is never called
✓ VERIFIED: STORAGE_KEYS are never referenced
```

### Recommendation
1. **Option A:** Keep as-is with clear comment explaining it's test/development only
2. **Option B:** Move to test utilities folder if it's used for testing
3. **Option C:** Remove if completely unused

### Estimated Impact
- **Time:** 5 minutes
- **Risk:** Very Low
- **Priority:** Low - doesn't affect production

---

## Summary Table

| Issue | File | Type | Severity | Impact | Time to Fix |
|-------|------|------|----------|--------|------------|
| Contact form not submitting | Support.tsx | Feature Broken | 🔴 CRITICAL | Users can't get support | 15-20 min |
| Placeholder content | Careers.tsx | Incomplete | 🟡 MEDIUM | Unprofessional appearance | 5-240 min |
| Unused mock data | mockData.ts | Code Quality | 🔵 INFO | None | 5 min |

---

## Production Checklist

### Before Launch
- [ ] Fix Support.tsx contact form
- [ ] Decide on Careers.tsx solution
- [ ] Test all contact forms work
- [ ] Verify emails are being sent
- [ ] Test error scenarios

### Optional (Before or After Launch)
- [ ] Clean up mockData.ts
- [ ] Add error logging
- [ ] Monitor contact form submissions
- [ ] Implement careers/jobs system

---

## Files Changed in This Audit

None yet - these are **recommendations** for you to implement.

---

**Audit Date:** 2026-01-17  
**Last Updated:** 2026-01-17  
**Status:** Ready for implementation
