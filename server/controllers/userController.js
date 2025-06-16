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
      console.log('userController.js - createOrUpdateCompany - Step 6: Received request to create/update company profile');
      console.log('userController.js - createOrUpdateCompany - Step 6.1: User ID:', req.user._id);
      console.log('userController.js - createOrUpdateCompany - Step 6.2: Request body:', req.body);
      
      const { companyName, companyAddress, taxNumber, businessActivity, email, website } = req.body;
      const db = req.app.locals.db;
      const userService = new UserService(db);
      const companiesCollection = db.collection('companies');
      
      // Validate required fields
      if (!companyName || !companyAddress || !taxNumber) {
        console.log('userController.js - createOrUpdateCompany - Step 6.3: Missing required fields');
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Check if company profile already exists
      const existingCompany = await companiesCollection.findOne({ userId: req.user._id });
      console.log('userController.js - createOrUpdateCompany - Step 6.4: Existing company found:', existingCompany ? 'Yes' : 'No');
      
      const companyData = { // For 'companies' collection
        companyName,
        companyAddress,
        taxNumber,
        businessActivity, // businessActivity is stored here
        updatedAt: new Date()
      };
      
      // Add optional fields if provided
      if (email) companyData.email = email; // This is company's contact email for 'companies' collection
      if (website) companyData.website = website;
      
      console.log('userController.js - createOrUpdateCompany - Step 7: Company data prepared for DB (companies collection):', companyData);

      // Prepare data for User.companyInfo
      const userCompanyInfoUpdate = {
        companyName: companyName,
        address: companyAddress, // Map companyAddress from form to address in User.companyInfo
        taxNumber: taxNumber,
        contactEmail: email,     // Map email from form to contactEmail in User.companyInfo
        website: website
        // Note: 'businessActivity' is not in the User.companyInfo schema based on the provided doc.
        // Other fields like mission, industry, etc., will not be populated from this form.
      };
      console.log('userController.js - createOrUpdateCompany - Step 7.1: Data prepared for User.companyInfo:', userCompanyInfoUpdate);

      const userUpdatePayload = {
        profileComplete: true,
        companyInfo: userCompanyInfoUpdate
      };
      
      if (existingCompany) {
        // Update existing company in 'companies' collection
        console.log('userController.js - createOrUpdateCompany - Step 8.1: Updating existing company in DB (companies collection)');
        await companiesCollection.updateOne(
          { userId: req.user._id },
          { $set: companyData }
        );
        console.log('userController.js - createOrUpdateCompany - Step 8.2: Existing company updated in DB (companies collection)');
        
        // Also update User.companyInfo and ensure profileComplete is true
        console.log('userController.js - createOrUpdateCompany - Step 9.2: Updating User.companyInfo and profileComplete status via userService for existing company');
        await userService.updateUser(req.user._id, userUpdatePayload);
        console.log('userController.js - createOrUpdateCompany - Step 9.3: User.companyInfo and profileComplete status updated for existing company');

      } else {
        // Create new company in 'companies' collection
        console.log('userController.js - createOrUpdateCompany - Step 8.3: Creating new company in DB (companies collection)');
        companyData.userId = req.user._id;
        companyData.createdAt = new Date();
        await companiesCollection.insertOne(companyData);
        console.log('userController.js - createOrUpdateCompany - Step 8.4: New company created in DB (companies collection)');
        
        // Update user profile completion status and User.companyInfo
        console.log('userController.js - createOrUpdateCompany - Step 9: Updating User.companyInfo and marking profile as complete via userService for new company');
        await userService.updateUser(req.user._id, userUpdatePayload);
        console.log('userController.js - createOrUpdateCompany - Step 9.1: User.companyInfo and profile marked as complete via userService for new company');
      }
      
      console.log('userController.js - createOrUpdateCompany - Step 8.5: Company profile saved successfully overall');
      res.json({ message: 'Company profile saved successfully' });
    } catch (error) {
      console.error('❌ Company profile save error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
}

module.exports = new UserController();
