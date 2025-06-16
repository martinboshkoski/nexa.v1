const { ObjectId } = require('mongodb');

class InvestmentController {
  constructor() {
    // Bind methods to preserve 'this' context
    this.getAllInvestments = this.getAllInvestments.bind(this);
    this.getInvestmentById = this.getInvestmentById.bind(this);
    this.createInvestment = this.createInvestment.bind(this);
    this.updateInvestment = this.updateInvestment.bind(this);
    this.deleteInvestment = this.deleteInvestment.bind(this);
    this.getSectors = this.getSectors.bind(this);
    this.getLocations = this.getLocations.bind(this);
  }

  // Get all investments with filtering and pagination
  async getAllInvestments(req, res) {
    try {
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');
      
      // Query parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const sector = req.query.sector;
      const location = req.query.location;
      const riskLevel = req.query.riskLevel;
      const minAmount = parseInt(req.query.minAmount);
      const maxAmount = parseInt(req.query.maxAmount);
      const search = req.query.search;
      
      // Build query
      const query = {};
      if (sector) query.sector = sector;
      if (location) query.location = location;
      if (riskLevel) query.riskLevel = riskLevel;
      if (minAmount || maxAmount) {
        query.amount = {};
        if (minAmount) query.amount.$gte = minAmount;
        if (maxAmount) query.amount.$lte = maxAmount;
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get total count for pagination
      const totalInvestments = await investmentsCollection.countDocuments(query);
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      const totalPages = Math.ceil(totalInvestments / limit);
      
      // Fetch investments
      const investments = await investmentsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      
      res.json({
        investments,
        pagination: {
          currentPage: page,
          totalPages,
          totalInvestments,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      console.error('Error fetching investments:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get single investment by ID
  async getInvestmentById(req, res) {
    try {
      const { id } = req.params;
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid investment ID' });
      }
      
      const investment = await investmentsCollection.findOne({ _id: new ObjectId(id) });
      
      if (!investment) {
        return res.status(404).json({ message: 'Investment not found' });
      }
      
      res.json(investment);
    } catch (error) {
      console.error('Error fetching investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new investment (admin only)
  async createInvestment(req, res) {
    try {
      const {
        title,
        description,
        company,
        sector,
        location,
        amount,
        riskLevel,
        expectedReturn,
        duration,
        contactEmail,
        website,
        status = 'active'
      } = req.body;

      // Validation
      if (!title || !description || !company || !sector || !amount) {
        return res.status(400).json({ 
          message: 'Title, description, company, sector, and amount are required' 
        });
      }

      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const newInvestment = {
        title: title.trim(),
        description: description.trim(),
        company: company.trim(),
        sector,
        location: location || '',
        amount: parseFloat(amount),
        riskLevel: riskLevel || 'medium',
        expectedReturn: expectedReturn || null,
        duration: duration || null,
        contactEmail: contactEmail || '',
        website: website || '',
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0
      };

      const result = await investmentsCollection.insertOne(newInvestment);
      const createdInvestment = await investmentsCollection.findOne({ _id: result.insertedId });

      res.status(201).json({
        message: 'Investment created successfully',
        investment: createdInvestment
      });
    } catch (error) {
      console.error('Error creating investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update investment (admin only)
  async updateInvestment(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
      
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid investment ID' });
      }

      // Remove fields that shouldn't be updated directly
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.views;
      
      // Add updated timestamp
      updateData.updatedAt = new Date();

      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const result = await investmentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      res.json({
        message: 'Investment updated successfully',
        investment: result.value
      });
    } catch (error) {
      console.error('Error updating investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete investment (admin only)
  async deleteInvestment(req, res) {
    try {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid investment ID' });
      }

      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const result = await investmentsCollection.deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Investment not found' });
      }

      res.json({ message: 'Investment deleted successfully' });
    } catch (error) {
      console.error('Error deleting investment:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all sectors
  async getSectors(req, res) {
    try {
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const sectors = await investmentsCollection.distinct('sector');
      res.json(sectors);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get all locations
  async getLocations(req, res) {
    try {
      const db = req.app.locals.db;
      const investmentsCollection = db.collection('investments');

      const locations = await investmentsCollection.distinct('location');
      res.json(locations.filter(location => location && location.trim() !== ''));
    } catch (error) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}

module.exports = new InvestmentController();
