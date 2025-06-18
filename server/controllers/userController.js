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
      
      // Get user profile
      const user = await userService.findById(req.user._id);
      
      // Get company profile if exists
      const company = await companiesCollection.findOne({ userId: req.user._id });
      
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
      console.log('userController.js - updateProfile - Step 10: Received request to update user profile');
      console.log('userController.js - updateProfile - Step 10.1: User ID:', req.user._id);
      console.log('userController.js - updateProfile - Step 10.2: Request body:', req.body);
      
      const { 
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
      
      // Prepare update data for user's direct fields
      const updateData = {};

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

      console.log('userController.js - updateProfile - Step 11: Update data being sent to userService for user profile:', updateData);
      
      // Update user profile
      const result = await userService.updateUser(req.user._id, updateData);
      console.log('userController.js - updateProfile - Step 12: Profile updated in DB, result:', result);
      
      // Fetch the updated user to send back
      const updatedUser = await userService.findById(req.user._id);
      
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
      console.log('🔍 userController.js - createOrUpdateCompany - Step 1: Received request');
      console.log('🔍 User ID:', req.user._id);
      console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
      
      const { companyName, companyAddress, taxNumber, businessActivity, email, website, mission, logoUrl } = req.body;
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const companiesCollection = db.collection('companies');
      
      // Validate required fields
      if (!companyName || !companyAddress || !taxNumber) {
        console.log('❌ Missing required fields - companyName:', !!companyName, 'companyAddress:', !!companyAddress, 'taxNumber:', !!taxNumber);
        return res.status(400).json({ message: 'Missing required fields: companyName, companyAddress, and taxNumber are required' });
      }
      
      console.log('✅ All required fields present');
      
      // Check if company profile already exists
      const existingCompany = await companiesCollection.findOne({ userId: req.user._id });
      console.log('🔍 Existing company found:', existingCompany ? 'Yes' : 'No');
      
      // Prepare data for companies collection
      const companyData = {
        companyName,
        companyAddress,
        taxNumber,
        businessActivity: businessActivity || 'General Business', // Provide default if not provided
        updatedAt: new Date()
      };
      
      // Add optional fields if provided
      if (email) companyData.email = email;
      if (website) companyData.website = website;
      if (mission) companyData.mission = mission;
      if (logoUrl) companyData.logoUrl = logoUrl;
      
      console.log('🔍 Company data for companies collection:', JSON.stringify(companyData, null, 2));

      // Prepare data for User.companyInfo (this is the crucial part for your issue)
      const userCompanyInfoUpdate = {
        companyName: companyName,
        address: companyAddress, // Map companyAddress from form to address in User.companyInfo
        taxNumber: taxNumber,
        contactEmail: email || '',     // Map email from form to contactEmail in User.companyInfo
        website: website || '',
        mission: mission || '',
        logoUrl: logoUrl || ''
      };
      
      console.log('🔍 User companyInfo update data:', JSON.stringify(userCompanyInfoUpdate, null, 2));

      // Get current user to see existing data
      const currentUser = await userService.findById(req.user._id);
      console.log('🔍 Current user companyInfo before update:', JSON.stringify(currentUser?.companyInfo || {}, null, 2));

      const userUpdatePayload = {
        profileComplete: true,
        companyInfo: userCompanyInfoUpdate
      };
      
      console.log('🔍 Final user update payload:', JSON.stringify(userUpdatePayload, null, 2));
      
      // Update or create company in companies collection
      if (existingCompany) {
        console.log('📝 Updating existing company in companies collection');
        await companiesCollection.updateOne(
          { userId: req.user._id },
          { $set: companyData }
        );
        console.log('✅ Company updated in companies collection');
      } else {
        console.log('📝 Creating new company in companies collection');
        companyData.userId = req.user._id;
        companyData.createdAt = new Date();
        await companiesCollection.insertOne(companyData);
        console.log('✅ New company created in companies collection');
      }
      
      // CRITICAL: Update user's companyInfo and profileComplete status
      console.log('📝 Updating user companyInfo and profileComplete status');
      const userUpdateResult = await userService.updateUser(req.user._id, userUpdatePayload);
      console.log('✅ User update result:', userUpdateResult ? 'Success' : 'Failed');
      
      // Verify the update by fetching the user again
      const updatedUser = await userService.findById(req.user._id);
      console.log('🔍 User companyInfo after update:', JSON.stringify(updatedUser?.companyInfo || {}, null, 2));
      console.log('🔍 User profileComplete after update:', updatedUser?.profileComplete);
      
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
