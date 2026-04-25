const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/services.json');

// In-memory stores for saved/hired services
let savedServices = [];
let hiredServices = [];

// Helper to load services
function loadServices() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  return JSON.parse(raw).services;
}

// GET /api/services
const getAllServices = (req, res) => {
  try {
    let services = loadServices();

    const { search, category, minPrice, maxPrice, minRating, sort } = req.query;

    if (search) {
      const q = search.toLowerCase();
      services = services.filter(
        s => s.title.toLowerCase().includes(q) || s.tags.some(t => t.includes(q))
      );
    }
    if (category && category !== 'All') {
      services = services.filter(s => s.category === category);
    }
    if (minPrice) services = services.filter(s => s.price >= Number(minPrice));
    if (maxPrice) services = services.filter(s => s.price <= Number(maxPrice));
    if (minRating) services = services.filter(s => s.rating >= Number(minRating));

    if (sort === 'price_asc') services.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') services.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') services.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') services.sort((a, b) => b.orders - a.orders);

    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch services', error: err.message });
  }
};

// GET /api/services/:id
const getServiceById = (req, res) => {
  try {
    const services = loadServices();
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid service ID' });
    }
    const service = services.find(s => s.id === id);
    if (!service) {
      return res.status(404).json({ success: false, message: `Service with ID ${id} not found` });
    }
    res.status(200).json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/services
const addService = (req, res) => {
  try {
    const { title, category, description, price, deliveryTime, seller } = req.body;

    if (!title || !category || !description || !price || !seller) {
      return res.status(400).json({ success: false, message: 'Missing required fields: title, category, description, price, seller' });
    }
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const db = JSON.parse(raw);
    const newId = db.services.length > 0 ? Math.max(...db.services.map(s => s.id)) + 1 : 1;

    const newService = {
      id: newId,
      title,
      category,
      description,
      price,
      deliveryTime: deliveryTime || 'TBD',
      rating: 0,
      reviews: 0,
      seller,
      sellerAvatar: seller.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      sellerLevel: 'New Seller',
      tags: req.body.tags || [],
      image: category.toLowerCase(),
      features: req.body.features || [],
      orders: 0
    };

    db.services.push(newService);
    fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));

    res.status(201).json({ success: true, message: 'Service created successfully', data: newService });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create service', error: err.message });
  }
};

// POST /api/save
const saveService = (req, res) => {
  try {
    const { serviceId } = req.body;
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required' });
    }

    const services = loadServices();
    const service = services.find(s => s.id === parseInt(serviceId));
    if (!service) {
      return res.status(404).json({ success: false, message: `Service with ID ${serviceId} not found` });
    }

    const alreadySaved = savedServices.find(s => s.id === service.id);
    if (alreadySaved) {
      return res.status(409).json({ success: false, message: 'Service already saved' });
    }

    const savedEntry = { ...service, savedAt: new Date().toISOString() };
    savedServices.push(savedEntry);

    res.status(200).json({ success: true, message: `"${service.title}" saved successfully`, data: savedEntry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save service', error: err.message });
  }
};

// DELETE /api/save/:id
const unsaveService = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const idx = savedServices.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Service not in saved list' });
    }
    savedServices.splice(idx, 1);
    res.status(200).json({ success: true, message: 'Service removed from saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// POST /api/hire
const hireService = (req, res) => {
  try {
    const { serviceId, message } = req.body;
    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'serviceId is required' });
    }

    const services = loadServices();
    const service = services.find(s => s.id === parseInt(serviceId));
    if (!service) {
      return res.status(404).json({ success: false, message: `Service with ID ${serviceId} not found` });
    }

    const alreadyHired = hiredServices.find(h => h.id === service.id);
    if (alreadyHired) {
      return res.status(409).json({ success: false, message: 'Service already hired' });
    }

    const hiredEntry = {
      ...service,
      hiredAt: new Date().toISOString(),
      message: message || '',
      status: 'In Progress',
      orderId: `FH-${Date.now()}`
    };
    hiredServices.push(hiredEntry);

    // Remove from saved if present
    savedServices = savedServices.filter(s => s.id !== service.id);

    res.status(200).json({ success: true, message: `"${service.title}" hired successfully! Order ID: ${hiredEntry.orderId}`, data: hiredEntry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to hire service', error: err.message });
  }
};

// GET /api/saved
const getSavedServices = (req, res) => {
  try {
    res.status(200).json({ success: true, count: savedServices.length, data: savedServices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/hired
const getHiredServices = (req, res) => {
  try {
    res.status(200).json({ success: true, count: hiredServices.length, data: hiredServices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

// GET /api/categories
const getCategories = (req, res) => {
  try {
    const services = loadServices();
    const categories = ['All', ...new Set(services.map(s => s.category))];
    res.status(200).json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  addService,
  saveService,
  unsaveService,
  hireService,
  getSavedServices,
  getHiredServices,
  getCategories
};
