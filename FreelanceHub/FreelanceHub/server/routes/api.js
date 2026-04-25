const express = require('express');
const router = express.Router();
const {
  getAllServices,
  getServiceById,
  addService,
  saveService,
  unsaveService,
  hireService,
  getSavedServices,
  getHiredServices,
  getCategories
} = require('../controllers/servicesController');

// Services routes
router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);
router.post('/services', addService);

// Save routes
router.post('/save', saveService);
router.delete('/save/:id', unsaveService);
router.get('/saved', getSavedServices);

// Hire routes
router.post('/hire', hireService);
router.get('/hired', getHiredServices);

// Categories
router.get('/categories', getCategories);

module.exports = router;
