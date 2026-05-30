const express = require('express');
const router = express.Router();
const CaracteristicaTipo = require('../models/CaracteristicaTipo');

router.put('/:id', async (req, res) => {
  try {
    const updated = await CaracteristicaTipo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Característica no encontrada' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await CaracteristicaTipo.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Característica no encontrada' });
    res.json({ message: 'Característica eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
