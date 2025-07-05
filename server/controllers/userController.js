const UserService = require('../services/userService');
const bcrypt = require('bcryptjs');

class UserController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.createOrUpdateCompany = this.createOrUpdateCompany.bind(this);
    this.updateCredentials = this.updateCredentials.bind(this);
  }

  // Get user profile
  async getProfile(req, res) {
    try {
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const companiesCollection = db.collection('companies');
      
      // Ensure user ID is properly formatted
      const userId = req.user._id.toString ? req.user._id : req.user._id;
      
      // Get user profile
      const user = await userService.findById(userId);
      
      // Get company profile if exists
      const company = await companiesCollection.findOne({ userId: userId });
      
      res.json({
        user: userService.sanitizeUser(user),
        company: company || null
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const db = req.app.locals.db;
      const userService = new UserService(db);

      // Get user ID from JWT/session
      const userId = req.user._id || req.user.id;

      // Get the update data from the request body
      const { email, companyInfo, profileComplete } = req.body;

      // Fetch current user
      const currentUser = await userService.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prepare updateData
      const updateData = {};

      // Email update (check for uniqueness)
      if (typeof email === 'string' && email.trim() !== currentUser.email) {
        const existingUser = await userService.findByEmail(email.trim());
        if (existingUser && existingUser._id.toString() !== currentUser._id.toString()) {
          return res.status(400).json({ message: 'Email already exists' });
        }
        updateData.email = email.trim();
      }

      // Company info update (merge with existing)
      if (companyInfo) {
        updateData.companyInfo = {
          ...currentUser.companyInfo,
          ...companyInfo
        };
        // Trim all string fields
        Object.keys(updateData.companyInfo).forEach(key => {
          if (typeof updateData.companyInfo[key] === 'string') {
            updateData.companyInfo[key] = updateData.companyInfo[key].trim();
          }
        });
      }

      // Profile complete
      if (typeof profileComplete === 'boolean') {
        updateData.profileComplete = profileComplete;
      }

      // Actually update the user
      const updatedUser = await userService.updateUser(currentUser._id, updateData);

      res.json({
        message: 'Profile updated successfully',
        user: userService.sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Create or update company profile (separate companies collection)
  async createOrUpdateCompany(req, res) {
    try {
      const { 
        companyName, 
        address,
        taxNumber, 
        industry,
        contactEmail,
        website, 
        mission, 
        logoUrl,
        role,
        description,
        crnNumber,
        phone,
        companyPIN,
        companySize
      } = req.body;
      
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const companiesCollection = db.collection('companies');
      
      // Ensure user ID is properly formatted
      const userId = req.user._id;
      
      // Validate required fields - make companyName the only required field
      if (!companyName) {
        return res.status(400).json({ message: 'Company name is required' });
      }
      
      console.log('👤 Updating profile for user ID:', req.user._id);
      console.log('📊 Company data received:', { companyName, industry, address });
      
      // Check if company profile already exists
      const existingCompany = await companiesCollection.findOne({ userId: userId });
      
      // Prepare data for companies collection (backward compatibility)
      const companyData = {
        companyName,
        companyAddress: address || '', // Map address to companyAddress for backward compatibility
        taxNumber: taxNumber || '',
        businessActivity: industry || '', // Map industry to businessActivity
        updatedAt: new Date()
      };
      
      // Add optional fields if provided
      if (contactEmail) companyData.email = contactEmail;
      if (website) companyData.website = website;
      if (mission) companyData.mission = mission;
      if (logoUrl) companyData.logoUrl = logoUrl;

      // Prepare comprehensive data for User.companyInfo
      const userCompanyInfoUpdate = {
        companyName: companyName || '',
        address: address || '',
        taxNumber: taxNumber || '',
        contactEmail: contactEmail || '',
        website: website || '',
        mission: mission || '',
        logoUrl: logoUrl || '',
        role: role || '',
        description: description || '',
        crnNumber: crnNumber || '',
        phone: phone || '',
        companyPIN: companyPIN || '',
        industry: industry || '',
        companySize: companySize || ''
      };

      // Get current user to see existing data
      const currentUser = await userService.findById(userId);
      
      console.log('🔍 Current user found:', currentUser ? 'Yes' : 'No');
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const userUpdatePayload = {
        profileComplete: true,
        companyInfo: userCompanyInfoUpdate
      };
      
      console.log('📤 User update payload:', userUpdatePayload);
      
      // Update or create company in companies collection
      if (existingCompany) {
        console.log('🔄 Updating existing company in companies collection');
        await companiesCollection.updateOne(
          { userId: userId },
          { $set: companyData }
        );
      } else {
        console.log('✨ Creating new company in companies collection');
        companyData.userId = userId;
        companyData.createdAt = new Date();
        await companiesCollection.insertOne(companyData);
      }
      
      // CRITICAL: Update user's companyInfo and profileComplete status
      console.log('🔄 Updating user companyInfo...');
      const userUpdateResult = await userService.updateUser(userId, userUpdatePayload);
      console.log('✅ User update result:', userUpdateResult ? 'Success' : 'Failed');
      
      // Verify the update by fetching the user again
      const updatedUser = await userService.findById(userId);
      console.log('🔍 Updated user companyInfo:', updatedUser?.companyInfo);
      console.log('📊 Updated user profileComplete:', updatedUser?.profileComplete);
      
      res.json({ 
        message: 'Company profile saved successfully',
        companyInfo: updatedUser?.companyInfo,
        profileComplete: updatedUser?.profileComplete
      });
      
    } catch (error) {
      console.error('❌ Company profile save error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }

  // Update user credentials (username and password)
  async updateCredentials(req, res) {
    try {
      const { currentPassword, username, password } = req.body;
      
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      
      if (!username && !password) {
        return res.status(400).json({ message: 'At least one field (username or password) must be provided' });
      }
      
      const db = req.app.locals.db;
      const userService = new UserService(db);
      
      // Ensure user ID is properly formatted
      const userId = req.user._id.toString ? req.user._id : req.user._id;
      
      // Get current user to verify current password
      const currentUser = await userService.findById(userId);
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Prepare update data
      const updateData = {};
      
      // Update username if provided
      if (username) {
        // Check if username is already taken
        const existingUser = await userService.findByUsername(username);
        if (existingUser && existingUser._id.toString() !== userId) {
          return res.status(400).json({ message: 'Username is already taken' });
        }
        updateData.username = username;
      }
      
      // Update password if provided
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        updateData.password = hashedPassword;
      }
      
      // Update user credentials
      const result = await userService.updateUser(userId, updateData);
      
      // Fetch the updated user to send back
      const updatedUser = await userService.findById(userId);
      
      res.json({ 
        message: 'Credentials updated successfully',
        user: userService.sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('❌ Credentials update error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = new UserController();
