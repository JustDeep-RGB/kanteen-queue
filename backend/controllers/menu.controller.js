const MenuItem = require('../models/MenuItem');
const fs = require('fs');
const path = require('path');

exports.getMenu = async (req, res) => {
  try {
    // Support optional ?veg=true/false filter
    const filter = {};
    if (req.query.veg !== undefined) {
      filter.isVeg = req.query.veg === 'true';
    }
    const menuItems = await MenuItem.find(filter);
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, prepTime, avgDemand, isVeg, isAvailable } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    const newItem = new MenuItem({
      name,
      description,
      price,
      prepTime,
      avgDemand,
      isVeg: isVeg !== undefined ? (isVeg === 'true' || isVeg === true) : true,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
      image
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, prepTime, avgDemand, isVeg, isAvailable } = req.body;
    let image = req.body.image;
    let oldImage = null;
    
    const existingItem = await MenuItem.findById(id);
    if (!existingItem) return res.status(404).json({ error: 'Item not found' });
    
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
      oldImage = existingItem.image;
    } else if (image !== undefined && image !== existingItem.image) {
      oldImage = existingItem.image;
    }
    
    // Build update object dynamically
    const updateData = { name, price, prepTime, avgDemand };
    if (description !== undefined) updateData.description = description;
    if (isVeg !== undefined) updateData.isVeg = (isVeg === 'true' || isVeg === true);
    if (isAvailable !== undefined) updateData.isAvailable = (isAvailable === 'true' || isAvailable === true);
    if (image !== undefined) updateData.image = image;

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });

    // Clean up old image from filesystem if it was replaced
    if (oldImage && oldImage.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', oldImage);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to delete old image:', err);
        }
      });
    }

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await MenuItem.findByIdAndDelete(id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });

    // Clean up image from filesystem
    if (deletedItem.image && deletedItem.image.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', deletedItem.image);
      fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to delete image for deleted item:', err);
        }
      });
    }

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};

exports.deleteMenuItemImage = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (item.image) {
      if (item.image.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '..', item.image);
        fs.unlink(filePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Failed to delete image file:', err);
          }
        });
      }
      item.image = '';
      await item.save();
    }
    
    res.json({ message: 'Image deleted successfully', item });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
};
