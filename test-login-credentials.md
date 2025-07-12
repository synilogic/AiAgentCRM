# AI Agent CRM - Login Credentials for Testing

## 🔐 Test Accounts Available

### 1. Admin Account
- **Email**: `admin@aiagentcrm.com`
- **Password**: `admin123`
- **Role**: `admin`
- **Access**: Full admin panel access
- **Use for**: Admin dashboard, user management, system settings

### 2. Sample User Accounts

#### User 1 - Rahul
- **Email**: `rahul@example.com`
- **Password**: `password123`
- **Role**: `user`
- **Business**: Updated Business
- **Use for**: Regular user testing

#### User 2 - Priya Patel
- **Email**: `priya@example.com`
- **Password**: `password123`
- **Role**: `user`
- **Business**: E-commerce Ventures
- **Use for**: E-commerce user testing

#### User 3 - Arjun Singh
- **Email**: `arjun@example.com`
- **Password**: `password123`
- **Role**: `user`
- **Business**: Tech Innovations Ltd
- **Use for**: Tech business testing

#### User 4 - Sneha Gupta
- **Email**: `sneha@example.com`
- **Password**: `password123`
- **Role**: `user`
- **Business**: Healthcare Solutions
- **Use for**: Healthcare business testing

#### User 5 - Vikram Mehta
- **Email**: `vikram@example.com`
- **Password**: `password123`
- **Role**: `user`
- **Business**: Real Estate Pro
- **Use for**: Real estate business testing

## 🌐 Login URLs

- **User Frontend**: http://localhost:3000/login
- **Admin Frontend**: http://localhost:3001/login
- **Main Frontend**: http://localhost:3002/login

## 🚀 Quick Test Instructions

1. **Start the applications** (if not already running):
   ```bash
   ./start-all-apps.bat
   ```

2. **Access any frontend** and try logging in with the credentials above

3. **API Testing** (optional):
       ```bash
    # Test via backend API directly
    POST http://localhost:5000/api/auth/login
    Content-Type: application/json
    
    {
      "email": "rahul@example.com",
      "password": "password123"
    }
    ```

## ✅ Expected Behavior

- **Successful login** should redirect to the dashboard
- **Failed login** will show "Invalid credentials" message
- **Admin users** have access to additional admin features
- **Regular users** see the standard user interface

## 🔧 Troubleshooting

If login still fails:

1. **Check backend logs** for detailed error messages
2. **Verify database connection** - ensure MongoDB is running
3. **Run database seeding** again if needed:
   ```bash
   cd backend
   node scripts/seedDatabaseSimple.js
   ```
4. **Test backend API** directly using the credentials above

## 📝 Notes

- All passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens are valid for 24 hours
- Email verification is bypassed for test accounts
- Database seeding creates these accounts automatically

## ✅ Login Fix Summary

**Issue Resolved**: The login functionality was failing because the database didn't have any user accounts.

**Solution Applied**:
1. ✅ Ran database seeding script to create admin and test user accounts
2. ✅ Verified all user accounts can authenticate successfully  
3. ✅ Confirmed JWT token generation is working properly
4. ✅ Updated test credentials with actual working accounts

**Result**: Login functionality is now working perfectly! Use any of the credentials above to test the login feature on the frontend applications. 