import express from 'express';
import {
    addAlternative,
    deleteAlternative,
    getAllAlternatives,
    updateAlternative
} from './alt.controller.js'; 
export const altRouter = express.Router();

altRouter.post('/addAlternative', addAlternative); 
altRouter.delete('/deleteAlternative', deleteAlternative); 
altRouter.get('/getAllAlternatives', getAllAlternatives); 
altRouter.put('/updateAlternative', updateAlternative); 
export default altRouter; 