
import { altModel } from './../../../DataBase/models/alternative.model.js';

export const addAlternative = async (req, res) => {
    const { name, price, category, description, image } = req.body; 
    try {
        const isAlternative = await altModel.findOne({ name });
        if (isAlternative) {
            return res.status(400).json({ msg: "Alternative medicine already added" });
        } else {
            await altModel.create({ name, price, category, description, image }); 
                        return res.status(201).json({ msg: "Alternative medicine added successfully" });
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const deleteAlternative = async (req, res) => {
    try {
        const { _id } = req.body;
        const deletedAlternative = await altModel.findById(_id);
        if (deletedAlternative) {
            await altModel.findByIdAndDelete(_id);
            return res.status(200).json({ message: "Deleted successfully" });
        } else {
            return res.status(404).json({ message: "Alternative medicine not found" });
        }
    } catch (error) {
        return res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

export const getAllAlternatives = async (req, res) => {
    try {
        const allAlternatives = await altModel.find();
        return res.json({ message: "success", allAlternatives });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateAlternative = async (req, res) => {
    const { _id, name, price, category, description, image } = req.body; 
    try {
        const alternative = await altModel.findById(_id);
        if (!alternative) {
            return res.status(404).json({ msg: 'Alternative medicine not found' });
        }

        const updatedAlternative = await altModel.findByIdAndUpdate(
            _id,
            { name, price, category, description, image },
            { new: true }
        );

        return res.status(200).json({
            msg: 'Alternative medicine updated successfully',
            alternative: updatedAlternative,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).send('Server error');
    }
};