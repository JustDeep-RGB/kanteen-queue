const MenuItem = require('../models/MenuItem');
exports.getMenu = async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
};
exports.createMenuItem = async (req, res) => {
  try {
    const { name, price, prepTime, avgDemand } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    const newItem = new MenuItem({ name, price, prepTime, avgDemand, image });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create menu item' });
  }
};
exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, prepTime, avgDemand } = req.body;
    let image = req.body.image;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }
    
    // Build update object dynamically
    const updateData = { name, price, prepTime, avgDemand };
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

