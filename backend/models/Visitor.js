import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    personToMeet: { type: String, required: true },
    purpose: { type: String, required: true },
    photo: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['Pending', 'Approved', 'Disapproved'], 
        default: 'Pending' 
    },
    notificationSent: { type: Boolean, default: false },
    approvedAt: { type: Date },  
    disapprovedAt: { type: Date },  
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Visitor', visitorSchema);
