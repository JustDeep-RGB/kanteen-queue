const MenuItem = require('../models/MenuItem');

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
    const { name, description, price, prepTime, avgDemand, isVeg } = req.body;
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
      isVeg: isVeg !== undefined ? isVeg : true,
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
    const { name, description, price, prepTime, avgDemand, isVeg } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    
    // Build update object dynamically
    const updateData = { name, price, prepTime, avgDemand };
    if (description !== undefined) updateData.description = description;
    if (isVeg !== undefined) updateData.isVeg = isVeg;
    if (image !== undefined) updateData.image = image;

    const updatedItem = await MenuItem.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
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
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
};
