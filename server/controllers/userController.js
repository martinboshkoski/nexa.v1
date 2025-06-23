const UserService = require('../services/userService');

class UserController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getProfile = this.getProfile.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.createOrUpdateCompany = this.createOrUpdateCompany.bind(this);
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
      const { 
        // Direct user fields
        email,
        // Company Info fields from req.body
        companyName, 
        mission, 
        website, 
        industry, 
        description, 
        crnNumber, 
        address, 
        phone, 
        companyPIN, 
        taxNumber, 
        contactEmail
      } = req.body;

      let profileComplete = req.body.profileComplete;

      const db = req.app.locals.db;
      const userService = new UserService(db);
      
      // Ensure user ID is properly formatted
      const userId = req.user._id.toString ? req.user._id : req.user._id;
      console.log('🔧 Profile update - Processed user ID:', userId);
      console.log('📧 Email update requested:', email);
      
      // Prepare update data for user's direct fields
      const updateData = {};
      
      // Handle email update if provided
      if (email !== undefined) {
        updateData.email = email;
      }

      // Prepare companyInfo update
      const companyInfoUpdate = {};
      if (companyName !== undefined) companyInfoUpdate.companyName = companyName;
      if (mission !== undefined) companyInfoUpdate.mission = mission;
      if (website !== undefined) companyInfoUpdate.website = website;
      if (industry !== undefined) companyInfoUpdate.industry = industry;
      if (description !== undefined) companyInfoUpdate.description = description;
      if (crnNumber !== undefined) companyInfoUpdate.crnNumber = crnNumber;
      if (address !== undefined) companyInfoUpdate.address = address;
      if (phone !== undefined) companyInfoUpdate.phone = phone;
      if (companyPIN !== undefined) companyInfoUpdate.companyPIN = companyPIN;
      if (taxNumber !== undefined) companyInfoUpdate.taxNumber = taxNumber;
      if (contactEmail !== undefined) companyInfoUpdate.contactEmail = contactEmail;

      // If any company info fields are present, add the companyInfo object to updateData
      if (Object.keys(companyInfoUpdate).length > 0) {
        updateData.companyInfo = companyInfoUpdate;
        // If profileComplete is not explicitly set to false, and company info is being updated,
        // we can infer profile is now more complete.
        if (profileComplete === undefined || profileComplete === true) {
          updateData.profileComplete = true;
        }
      }
      
      // Handle explicit profileComplete status from request body
      if (profileComplete !== undefined) {
        updateData.profileComplete = profileComplete;
      }
      
      console.log('📤 Profile update data:', updateData);
      
      // Update user profile
      const result = await userService.updateUser(userId, updateData);
      
      // Fetch the updated user to send back
      const updatedUser = await userService.findById(userId);
      
      res.json({ 
        message: 'Profile updated successfully',
        user: userService.sanitizeUser(updatedUser)
      });
    } catch (error) {
      console.error('❌ Profile update error:', error);
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
}

module.exports = new UserController();
