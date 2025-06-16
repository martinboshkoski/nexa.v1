// Native MongoDB CompanyVerification Service
// Replaces Mongoose CompanyVerification model with native MongoDB operations

const { ObjectId } = require('mongodb');
const { CompanyVerificationIndexes, validateCompanyVerification, sanitizeCompanyVerification } = require('../models/CompanyVerification');

class CompanyVerificationService {
  constructor(db) {
    this.db = db;
    this.collection = db.collection('companyverifications');
    this.setupIndexes();
  }

  // Setup database indexes for efficient querying
  async setupIndexes() {
    try {
      // Create indexes based on CompanyVerification model definition
      for (const index of CompanyVerificationIndexes) {
        await this.collection.createIndex(index.key, { name: index.name });
      }
      console.log('CompanyVerification indexes created successfully');
    } catch (error) {
      console.log('CompanyVerification indexes already exist or error creating them:', error.message);
    }
  }

  // Create a new company verification request
  async createVerification(verificationData) {
    // Validate verification data
    const validation = validateCompanyVerification(verificationData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Sanitize and prepare verification data
    const sanitizedVerification = sanitizeCompanyVerification(verificationData);

    const result = await this.collection.insertOne(sanitizedVerification);
    return { ...sanitizedVerification, _id: result.insertedId };
  }

  // Find verification by ID
  async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  // Find verification by user ID
  async findByUserId(userId) {
    if (!ObjectId.isValid(userId)) {
      return null;
    }
    return await this.collection.findOne({ userId: new ObjectId(userId) });
  }

  // Get all verifications with filtering and pagination
  async getAllVerifications(options = {}) {
    const {
      page = 1,
      limit = 20,
      filter = {},
      sort = { submittedAt: -1 },
      populateUser = false,
      populateReviewer = false
    } = options;

    const skip = (page - 1) * limit;
    const query = { ...filter };

    let verifications;
    if (populateUser || populateReviewer) {
      const pipeline = [
        { $match: query },
        { $sort: sort },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ];

      if (populateUser) {
        pipeline.push(
          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user',
              pipeline: [
                {
                  $project: {
                    email: 1,
                    isVerified: 1,
                    profileImage: 1
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$user',
              preserveNullAndEmptyArrays: true
            }
          }
        );
      }

      if (populateReviewer) {
        pipeline.push(
          {
            $lookup: {
              from: 'users',
              localField: 'reviewedBy',
              foreignField: '_id',
              as: 'reviewer',
              pipeline: [
                {
                  $project: {
                    email: 1,
                    isVerified: 1
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$reviewer',
              preserveNullAndEmptyArrays: true
            }
          }
        );
      }

      verifications = await this.collection.aggregate(pipeline).toArray();
    } else {
      verifications = await this.collection.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();
    }

    return verifications;
  }

  // Get verifications by status
  async getVerificationsByStatus(status, options = {}) {
    return await this.getAllVerifications({
      ...options,
      filter: { status }
    });
  }

  // Get pending verifications
  async getPendingVerifications(options = {}) {
    return await this.getVerificationsByStatus('pending', options);
  }

  // Get verifications under review
  async getVerificationsUnderReview(options = {}) {
    return await this.getVerificationsByStatus('under_review', options);
  }

  // Update verification
  async updateVerification(id, updateData) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid verification ID');
    }

    // Sanitize update data
    const sanitizedUpdate = sanitizeCompanyVerification(updateData);
    delete sanitizedUpdate._id; // Remove _id from update data

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: sanitizedUpdate },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Update verification status
  async updateVerificationStatus(id, status, reviewData = {}) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid verification ID');
    }

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'requires_additional_info'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid verification status');
    }

    const updateDoc = {
      status,
      updatedAt: new Date()
    };

    // Add review-specific data
    if (reviewData.reviewedBy) {
      updateDoc.reviewedBy = new ObjectId(reviewData.reviewedBy);
      updateDoc.reviewedAt = new Date();
    }

    if (reviewData.reviewNotes) {
      updateDoc.reviewNotes = reviewData.reviewNotes;
    }

    if (reviewData.rejectionReason) {
      updateDoc.rejectionReason = reviewData.rejectionReason;
    }

    if (reviewData.additionalInfoRequested) {
      updateDoc.additionalInfoRequested = reviewData.additionalInfoRequested;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Approve verification
  async approveVerification(id, reviewerId, reviewNotes = '') {
    return await this.updateVerificationStatus(id, 'approved', {
      reviewedBy: reviewerId,
      reviewNotes
    });
  }

  // Reject verification
  async rejectVerification(id, reviewerId, rejectionReason, reviewNotes = '') {
    return await this.updateVerificationStatus(id, 'rejected', {
      reviewedBy: reviewerId,
      rejectionReason,
      reviewNotes
    });
  }

  // Request additional information
  async requestAdditionalInfo(id, reviewerId, additionalInfoRequested, reviewNotes = '') {
    return await this.updateVerificationStatus(id, 'requires_additional_info', {
      reviewedBy: reviewerId,
      additionalInfoRequested,
      reviewNotes
    });
  }

  // Update verification checks
  async updateVerificationChecks(id, checks) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid verification ID');
    }

    const validCheckFields = ['domainVerified', 'phoneVerified', 'addressVerified', 'documentsComplete'];
    const updateDoc = { updatedAt: new Date() };

    // Only update valid check fields
    Object.keys(checks).forEach(key => {
      if (validCheckFields.includes(key)) {
        updateDoc[`verificationChecks.${key}`] = Boolean(checks[key]);
      }
    });

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Calculate auto-approval score
  async calculateAutoApprovalScore(id) {
    const verification = await this.findById(id);
    if (!verification) {
      throw new Error('Verification not found');
    }

    let score = 0;

    // Check verification criteria
    if (verification.verificationChecks.domainVerified) score += 25;
    if (verification.verificationChecks.phoneVerified) score += 25;
    if (verification.verificationChecks.addressVerified) score += 25;
    if (verification.verificationChecks.documentsComplete) score += 25;

    // Update the score
    await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          autoApprovalScore: score,
          updatedAt: new Date()
        }
      }
    );

    // Auto-approve if score is 100
    if (score === 100 && verification.status === 'pending') {
      await this.updateVerificationStatus(id, 'approved', {
        reviewNotes: 'Auto-approved based on verification criteria'
      });
    }

    return score;
  }

  // Add document to verification
  async addDocument(id, documentData) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid verification ID');
    }

    const document = {
      type: documentData.type,
      fileName: documentData.fileName,
      filePath: documentData.filePath,
      uploadedAt: new Date()
    };

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $push: { documents: document },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Remove document from verification
  async removeDocument(id, fileName) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid verification ID');
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $pull: { documents: { fileName } },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  }

  // Delete verification
  async deleteVerification(id) {
    if (!ObjectId.isValid(id)) {
      throw new Error('Invalid verification ID');
    }

    const result = await this.collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Search verifications by company name
  async searchByCompanyName(searchTerm, options = {}) {
    const searchQuery = {
      'companyInfo.companyName': { $regex: searchTerm, $options: 'i' }
    };

    return await this.getAllVerifications({
      ...options,
      filter: searchQuery
    });
  }

  // Get verification statistics
  async getVerificationStats() {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];

    const statusStats = await this.collection.aggregate(pipeline).toArray();

    // Get overall stats
    const totalStats = await this.collection.aggregate([
      {
        $group: {
          _id: null,
          totalVerifications: { $sum: 1 },
          avgAutoApprovalScore: { $avg: '$autoApprovalScore' },
          totalDocuments: { $sum: { $size: { $ifNull: ['$documents', []] } } }
        }
      }
    ]).toArray();

    return {
      statusBreakdown: statusStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      totalVerifications: totalStats[0]?.totalVerifications || 0,
      avgAutoApprovalScore: totalStats[0]?.avgAutoApprovalScore || 0,
      totalDocuments: totalStats[0]?.totalDocuments || 0
    };
  }

  // Get verifications requiring review (for admin dashboard)
  async getVerificationsRequiringReview(options = {}) {
    return await this.getAllVerifications({
      ...options,
      filter: { 
        status: { 
          $in: ['pending', 'under_review', 'requires_additional_info'] 
        }
      },
      populateUser: true,
      sort: { submittedAt: 1 } // Oldest first
    });
  }

  // Count documents (for compatibility)
  async countDocuments(filter = {}) {
    return await this.collection.countDocuments(filter);
  }

  // Get distinct values (for compatibility)
  async distinct(field, filter = {}) {
    return await this.collection.distinct(field, filter);
  }

  // Aggregate (for compatibility)
  async aggregate(pipeline) {
    return await this.collection.aggregate(pipeline).toArray();
  }
}

module.exports = CompanyVerificationService;
