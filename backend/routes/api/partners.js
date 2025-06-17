const express = require('express');
const router = express.Router();
const Partner = require('../../models/Partner');
const PartnerNotification = require('../../models/PartnerNotification');
const ActivityLog = require('../../models/ActivityLog');
const User = require('../../models/User');
const multer = require('multer');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, bucket } = require('../../s3config');
const sanitizeHtml = require('sanitize-html');
const { parse } = require('csv-parse');
const fs = require('fs');
const path = require('path');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  console.log('isAuthenticated middleware:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session,
  });
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  console.error('Authentication failed: User not authenticated or req.user is undefined');
  res.status(401).json({ message: 'Not authenticated' });
};

// Middleware to check if user is superadmin or admin
const isAdminOrSuperAdmin = (req, res, next) => {
  if (req.user && ['superadmin', 'admin'].includes(req.user.role)) {
    return next();
  }
  console.error('Access denied: Insufficient permissions for user:', req.user?.email);
  res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
};

// Function to compute partner status
const computePartnerStatus = (partner) => {
  const today = new Date();
  const endDate = new Date(partner.endDate);

  if (today > endDate) {
    return 'Cold';
  }

  const hasTermSheet = partner.services.some(service => service.termSheets && service.termSheets.length > 0);
  if (hasTermSheet) {
    return 'Hot';
  }

  if (partner.services.length > 0) {
    return 'Warm';
  }

  return 'Cold';
};

// Log activity with detailed changes
const logActivity = async (req, action, partnerId, partnerName, projectName, changes, details) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('User not found for activity logging:', req.user._id);
      return;
    }

    const logEntry = new ActivityLog({
      action,
      partnerId,
      partnerName: partnerName || 'Unknown Partner',
      projectName: projectName || 'N/A',
      userId: req.user._id,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
      changes: changes || null,
      details: sanitizeHtml(details || '', { allowedTags: [], allowedAttributes: {} }),
      timestamp: new Date(),
    });
    await logEntry.save();
    console.log('Activity logged:', { action, partnerId, partnerName, projectName, changes, details });
  } catch (err) {
    console.error('Error logging activity:', {
      message: err.message,
      stack: err.stack,
      userId: req.user?._id,
      action,
      partnerId,
      partnerName,
      projectName,
      changes,
      details,
    });
  }
};

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/partners
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const partners = await Partner.find();
    res.json(partners);
  } catch (err) {
    console.error('Error fetching partners:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/partners/notifications
router.get('/notifications', isAuthenticated, async (req, res) => {
  try {
    const notifications = await PartnerNotification.find().sort({ createdAt: -1 });
    if (!notifications) {
      return res.status(404).json({ message: 'No notifications found' });
    }
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching partner notifications:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/partners/:id/activity-logs
router.get('/:id/activity-logs', isAuthenticated, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ partnerId: req.params.id }).sort({ timestamp: -1 });
    if (!logs || logs.length === 0) {
      return res.status(404).json({ message: 'No activity logs found for this partner' });
    }
    res.json(logs);
  } catch (err) {
    console.error('Error fetching activity logs for partner:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/partners/activity-logs
router.get('/activity-logs', isAuthenticated, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    if (!logs || logs.length === 0) {
      return res.status(404).json({ message: 'No activity logs found' });
    }
    res.json(logs);
  } catch (err) {
    console.error('Error fetching activity logs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/partners
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newPartner = new Partner({
      ...req.body,
      status: req.body.status || computePartnerStatus({ services: [], endDate: req.body.endDate || new Date() }),
      manualStatus: !!req.body.status,
    });
    await newPartner.save();

    const notification = new PartnerNotification({
      message: `New partner added: ${newPartner.name}`,
      partnerId: newPartner._id,
    });
    await notification.save();

    await logActivity(
      req,
      'Partner Created',
      newPartner._id,
      newPartner.name,
      newPartner.projectName,
      null,
      `Created partner: ${newPartner.name} with project: ${newPartner.projectName}`
    );

    res.status(201).json(newPartner);
  } catch (err) {
    console.error('Error adding partner:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/partners/:id
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    console.log('Fetched partner:', { partnerId: req.params.id, status: partner.status, manualStatus: partner.manualStatus });
    res.json(partner);
  } catch (err) {
    console.error('Error fetching partner:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/partners/:id
router.delete('/:id', isAuthenticated, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    for (const service of partner.services) {
      if (service.termSheets && service.termSheets.length > 0) {
        for (const termSheet of service.termSheets) {
          try {
            const fileKey = termSheet.split('bge-user-files.s3.amazonaws.com/')[1];
            const deleteParams = {
              Bucket: bucket,
              Key: fileKey,
            };
            const deleteCommand = new DeleteObjectCommand(deleteParams);
            await s3Client.send(deleteCommand);
            console.log(`Deleted term sheet from S3: ${fileKey}`);
          } catch (deleteError) {
            console.error('Error deleting term sheet during partner deletion:', deleteError);
          }
        }
      }
    }

    await logActivity(
      req,
      'Partner Deleted',
      partner._id,
      partner.name,
      partner.projectName,
      null,
      `Deleted partner: ${partner.name} with project: ${partner.projectName}`
    );

    await Partner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Partner deleted successfully' });
  } catch (err) {
    console.error('Error deleting partner:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/partners/:id/status
router.put('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status } = req.body;
    if (!['Hot', 'Warm', 'Cold'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const beforeStatus = partner.status;
    partner.status = status;
    partner.manualStatus = true;
    console.log('Updated status via /status endpoint:', { before: beforeStatus, after: status });

    const notification = new PartnerNotification({
      message: `Partner status changed to ${status}: ${partner.name}`,
      partnerId: partner._id,
    });
    await notification.save();

    await logActivity(
      req,
      'Status Changed',
      partner._id,
      partner.name,
      partner.projectName,
      { status: { before: beforeStatus, after: status } },
      `Changed status to ${status}`
    );

    await partner.save();
    res.json(partner);
  } catch (err) {
    console.error('Error updating partner status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/partners/import-preview
router.post('/import-preview', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const parser = parse({ columns: true, trim: true });
    const records = [];

    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(parser)
      .on('data', (record) => {
        records.push({
          name: record.name,
          projectName: record.projectName,
          status: ['Hot', 'Warm', 'Cold'].includes(record.status) ? record.status : 'Cold',
          startDate: record.startDate ? new Date(record.startDate) : null,
          endDate: record.endDate ? new Date(record.endDate) : null,
          durationStatus: ['Upcoming', 'Ongoing', 'Expired', 'Custom'].includes(record.durationStatus) ? record.durationStatus : 'Upcoming',
          durationStatusCustom: record.durationStatusCustom || '',
          category: record.category || '',
          contact: {
            email: record.contactEmail || '',
            phone: record.contactPhone || '',
            person: record.contactPerson || '',
            role: record.contactRole || '',
          },
        });
      })
      .on('end', () => {
        console.log('Parsed CSV for preview:', { recordCount: records.length });
        res.json({ previewData: records, totalRecords: records.length });
      })
      .on('error', (err) => {
        console.error('Error parsing CSV:', err);
        res.status(500).json({ message: 'Error parsing CSV file', error: err.message });
      });
  } catch (err) {
    console.error('Error in import preview:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/partners/import
router.post('/import', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const parser = parse({ columns: true, trim: true });
    const records = [];
    const errors = [];

    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
      .pipe(parser)
      .on('data', (record) => {
        records.push(record);
      })
      .on('end', async () => {
        const totalRecords = records.length;
        let processedRecords = 0;

        for (const [index, record] of records.entries()) {
          try {
            const partnerData = {
              name: record.name,
              projectName: record.projectName,
              status: ['Hot', 'Warm', 'Cold'].includes(record.status) ? record.status : 'Cold',
              manualStatus: !!record.status,
              startDate: record.startDate ? new Date(record.startDate) : new Date(),
              endDate: record.endDate ? new Date(record.endDate) : new Date(),
              durationStatus: ['Upcoming', 'Ongoing', 'Expired', 'Custom'].includes(record.durationStatus) ? record.durationStatus : 'Upcoming',
              durationStatusCustom: record.durationStatusCustom || '',
              category: record.category || '',
              contact: {
                email: record.contactEmail || '',
                phone: record.contactPhone || '',
                person: record.contactPerson || '',
                role: record.contactRole || '',
              },
              services: [],
              milestones: [],
            };

            // Validate required fields
            if (!partnerData.name || !partnerData.projectName || !partnerData.startDate || !partnerData.endDate) {
              errors.push(`Record ${index + 1}: Missing required fields`);
              continue;
            }

            const newPartner = new Partner(partnerData);
            await newPartner.save();

            await logActivity(
              req,
              'Partner Imported',
              newPartner._id,
              newPartner.name,
              newPartner.projectName,
              null,
              `Imported partner: ${newPartner.name} with project: ${newPartner.projectName}`
            );

            processedRecords++;
          } catch (err) {
            errors.push(`Record ${index + 1}: ${err.message}`);
          }
        }

        console.log('Import completed:', { totalRecords, processedRecords, errors });
        res.json({
          message: 'Import completed',
          totalRecords,
          processedRecords,
          errors,
        });
      })
      .on('error', (err) => {
        console.error('Error parsing CSV for import:', err);
        res.status(500).json({ message: 'Error parsing CSV file', error: err.message });
      });
  } catch (err) {
    console.error('Error in import:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/partners/:id/services
router.post('/:id/services', isAuthenticated, upload.array('termSheets', 5), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    let termSheetUrls = [];
    if (req.files && req.files.length > 0) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const maxSize = 10 * 1024 * 1024;

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ message: 'Only PDF, DOCX, and XLSX files are allowed.' });
        }
        if (file.size > maxSize) {
          return res.status(400).json({ message: 'File size exceeds 10 MB limit.' });
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `partner-term-sheet/${Date.now()}-${req.params.id}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await s3Client.send(command);
        const termSheetUrl = `https://bge-user-files.s3.amazonaws.com/${fileName}`;
        termSheetUrls.push(termSheetUrl);
        console.log('Term sheet uploaded to S3:', termSheetUrl);
      }
    }

    const newService = {
      name: req.body.name,
      description: req.body.description,
      createdAt: new Date(),
      termSheets: termSheetUrls,
      cost: req.body.cost ? Number(req.body.cost) : undefined,
      status: req.body.status,
    };

    partner.services.push(newService);
    await partner.save();

    const updatedPartner = await Partner.findById(req.params.id);
    const addedService = updatedPartner.services[updatedPartner.services.length - 1];

    await logActivity(
      req,
      'Service Added',
      partner._id,
      partner.name,
      partner.projectName,
      {
        'service.name': { before: null, after: newService.name },
        'service.description': { before: null, after: newService.description || 'N/A' },
        'service.cost': { before: null, after: newService.cost || 'N/A' },
        'service.status': { before: null, after: newService.status || 'N/A' },
      },
      `Added service: ${newService.name}`
    );

    res.status(201).json(addedService);
  } catch (err) {
    console.error('Error adding service:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/partners/:id/services/:serviceId
router.put('/:id/services/:serviceId', isAuthenticated, upload.array('termSheets', 5), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const service = partner.services.id(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const before = {
      name: service.name,
      description: service.description,
      cost: service.cost,
      status: service.status,
      termSheets: [...(service.termSheets || [])],
    };

    let termSheetUrls = service.termSheets || [];
    if (req.files && req.files.length > 0) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      const maxSize = 10 * 1024 * 1024;

      for (const file of req.files) {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ message: 'Only PDF, DOCX, and XLSX files are allowed.' });
        }
        if (file.size > maxSize) {
          return res.status(400).json({ message: 'File size exceeds 10 MB limit.' });
        }

        const fileExtension = file.originalname.split('.').pop();
        const fileName = `partner-term-sheet/${Date.now()}-${req.params.id}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: fileName,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await s3Client.send(command);
        const termSheetUrl = `https://bge-user-files.s3.amazonaws.com/${fileName}`;
        termSheetUrls.push(termSheetUrl);
        console.log('Term sheet updated and uploaded to S3:', termSheetUrl);
      }
    }

    service.name = req.body.name;
    service.description = req.body.description;
    service.cost = req.body.cost ? Number(req.body.cost) : undefined;
    service.status = req.body.status;
    service.termSheets = termSheetUrls;

    const changes = {};
    if (before.name !== service.name) {
      changes['service.name'] = { before: before.name, after: service.name };
    }
    if (before.description !== service.description) {
      changes['service.description'] = { before: before.description || 'N/A', after: service.description || 'N/A' };
    }
    if (before.cost !== service.cost) {
      changes['service.cost'] = { before: before.cost || 'N/A', after: service.cost || 'N/A' };
    }
    if (before.status !== service.status) {
      changes['service.status'] = { before: before.status || 'N/A', after: service.status || 'N/A' };
    }
    if (JSON.stringify(before.termSheets) !== JSON.stringify(service.termSheets)) {
      changes['service.termSheets'] = { before: before.termSheets.length, after: service.termSheets.length };
    }

    await logActivity(
      req,
      'Service Updated',
      partner._id,
      partner.name,
      partner.projectName,
      Object.keys(changes).length > 0 ? changes : null,
      `Updated service: ${service.name}`
    );

    await partner.save();
    res.json(service);
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/partners/:id/services/:serviceId/term-sheet
router.delete('/:id/services/:serviceId/term-sheet', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const service = partner.services.id(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const { termSheetUrl } = req.body;
    if (!termSheetUrl || !service.termSheets.includes(termSheetUrl)) {
      return res.status(404).json({ message: 'Term Sheet not found in service' });
    }

    try {
      const fileKey = termSheetUrl.split('bge-user-files.s3.amazonaws.com/')[1];
      const deleteParams = {
        Bucket: bucket,
        Key: fileKey,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await s3Client.send(deleteCommand);
      console.log(`Deleted term sheet from S3: ${fileKey}`);
    } catch (deleteError) {
      console.error('Error deleting term sheet from S3:', deleteError);
    }

    service.termSheets = service.termSheets.filter(url => url !== termSheetUrl);

    await logActivity(
      req,
      'Term Sheet Deleted',
      partner._id,
      partner.name,
      partner.projectName,
      null,
      `Deleted term sheet for service: ${service.name}`
    );

    await partner.save();
    res.json({ message: 'Term sheet deleted successfully' });
  } catch (err) {
    console.error('Error deleting term sheet:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/partners/:id/services/:serviceId
router.delete('/:id/services/:serviceId', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const service = partner.services.id(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.termSheets && service.termSheets.length > 0) {
      for (const termSheet of service.termSheets) {
        try {
          const fileKey = termSheet.split('bge-user-files.s3.amazonaws.com/')[1];
          const deleteParams = {
            Bucket: bucket,
            Key: fileKey,
          };
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3Client.send(deleteCommand);
          console.log(`Deleted term sheet from S3: ${fileKey}`);
        } catch (deleteError) {
          console.error('Error deleting term sheet during service deletion:', deleteError);
        }
      }
    }

    await logActivity(
      req,
      'Service Deleted',
      partner._id,
      partner.name,
      partner.projectName,
      null,
      `Deleted service: ${service.name}`
    );

    partner.services.id(req.params.serviceId).deleteOne();
    await partner.save();

    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/partners/:id/milestones
router.post('/:id/milestones', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const newMilestone = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
    };

    partner.milestones.push(newMilestone);
    await partner.save();

    const updatedPartner = await Partner.findById(req.params.id);
    const addedMilestone = updatedPartner.milestones[updatedPartner.milestones.length - 1];

    await logActivity(
      req,
      'Milestone Added',
      partner._id,
      partner.name,
      partner.projectName,
      {
        'milestone.title': { before: null, after: newMilestone.title },
        'milestone.description': { before: null, after: newMilestone.description || 'N/A' },
        'milestone.date': { before: null, after: newMilestone.date },
      },
      `Added milestone: ${newMilestone.title}`
    );

    res.status(201).json(addedMilestone);
  } catch (err) {
    console.error('Error adding milestone:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/partners/:id/milestones/:milestoneId
router.put('/:id/milestones/:milestoneId', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const milestone = partner.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const before = {
      title: milestone.title,
      description: milestone.description,
      date: milestone.date,
    };

    milestone.title = req.body.title;
    milestone.description = req.body.description;
    milestone.date = req.body.date;

    const changes = {};
    if (before.title !== milestone.title) {
      changes['milestone.title'] = { before: before.title, after: milestone.title };
    }
    if (before.description !== milestone.description) {
      changes['milestone.description'] = { before: before.description || 'N/A', after: milestone.description || 'N/A' };
    }
    if (before.date !== milestone.date) {
      changes['milestone.date'] = { before: before.date, after: milestone.date };
    }

    await logActivity(
      req,
      'Milestone Updated',
      partner._id,
      partner.name,
      partner.projectName,
      Object.keys(changes).length > 0 ? changes : null,
      `Updated milestone: ${milestone.title}`
    );

    await partner.save();
    res.json(milestone);
  } catch (err) {
    console.error('Error updating milestone:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/partners/:id/milestones/:milestoneId
router.delete('/:id/milestones/:milestoneId', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const milestone = partner.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    await logActivity(
      req,
      'Milestone Deleted',
      partner._id,
      partner.name,
      partner.projectName,
      null,
      `Deleted milestone: ${milestone.title}`
    );

    partner.milestones.id(req.params.milestoneId).deleteOne();
    await partner.save();

    res.json({ message: 'Milestone deleted successfully' });
  } catch (err) {
    console.error('Error deleting milestone:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/partners/notifications/:id/read
router.post('/notifications/:id/read', isAuthenticated, async (req, res) => {
  try {
    const notification = await PartnerNotification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking partner notification as read:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/partners/:id
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }

    const before = {
      name: partner.name,
      projectName: partner.projectName,
      status: partner.status,
      startDate: partner.startDate,
      endDate: partner.endDate,
      durationStatus: partner.durationStatus,
      durationStatusCustom: partner.durationStatusCustom,
      category: partner.category,
      contact: { ...partner.contact },
    };

    // Validate status if provided
    if (req.body.status && !['Hot', 'Warm', 'Cold'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    partner.name = req.body.name || partner.name;
    partner.projectName = req.body.projectName || partner.projectName;
    partner.status = req.body.overrideStatus && req.body.status ? req.body.status : (req.body.status || partner.status);
    partner.manualStatus = req.body.overrideStatus && req.body.status ? true : partner.manualStatus;
    partner.startDate = req.body.startDate || partner.startDate;
    partner.endDate = req.body.endDate || partner.endDate;
    partner.durationStatus = req.body.durationStatus || partner.durationStatus;
    partner.durationStatusCustom = req.body.durationStatusCustom || partner.durationStatusCustom;
    partner.category = req.body.category || partner.category;
    partner.contact = {
      email: req.body.contact?.email || partner.contact?.email,
      phone: req.body.contact?.phone || partner.contact?.phone,
      person: req.body.contact?.person || partner.contact?.person,
      role: req.body.contact?.role || partner.contact?.role,
    };

    console.log('Updating partner status:', {
      partnerId: req.params.id,
      overrideStatus: req.body.overrideStatus,
      submittedStatus: req.body.status,
      finalStatus: partner.status,
      manualStatus: partner.manualStatus,
    });

    const changes = {};
    ['name', 'projectName', 'status', 'startDate', 'endDate', 'durationStatus', 'durationStatusCustom', 'category'].forEach(field => {
      if (before[field] !== partner[field]) {
        changes[field] = { before: before[field] || 'N/A', after: partner[field] || 'N/A' };
      }
    });
    ['email', 'phone', 'person', 'role'].forEach(field => {
      if (before.contact[field] !== partner.contact[field]) {
        changes[`contact.${field}`] = { before: before.contact[field] || 'N/A', after: partner.contact[field] || 'N/A' };
      }
    });

    await logActivity(
      req,
      'Partner Updated',
      partner._id,
      partner.name,
      partner.projectName,
      Object.keys(changes).length > 0 ? changes : null,
      `Updated partner: ${partner.name} with project: ${partner.projectName}`
    );

    await partner.save();
    res.json(partner);
  } catch (err) {
    console.error('Error updating partner:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;