const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB (replace with your actual connection string)
mongoose.connect('mongodb+srv://gokulp21cse:upvoj6blPzw0Jn3q@home-pro.kladlew.mongodb.net/homepro?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Sample User Schema and Model
const serviceSchema = new mongoose.Schema({
    serviceType: String,
    amount: Number,
    serviceDate: Date,
    orderStatus: {
        type: String
    },
    
});

const userSchema = new mongoose.Schema({
    userEmail: String,
    services: [serviceSchema], // Array of services
});

const User = mongoose.model('User', userSchema);

app.post('/storeServiceDetails', async (req, res) => {
    try {
        const { userEmail, serviceType, amount, serviceDate, status /* add other required details */ } = req.body;

        // Extract numeric part of the amount and parse it to ensure it's a number
        const numericAmount = parseFloat(amount.replace("Rs.", ""));

        // Find the user by email
        let user = await User.findOne({ userEmail });

        // If the user doesn't exist, create a new user
        if (!user) {
            user = new User({
                userEmail,
                services: [],
            });
        }

        // Add the new service to the user's services array
        user.services.push({
            serviceType,
            amount: numericAmount,
            serviceDate,
            orderStatus: status,
        });

        // Save the user document
        const savedUser = await user.save();

        console.log('Service details saved:', savedUser);
        res.status(200).json({ success: true, message: 'Service details saved successfully' });
    } catch (err) {
        console.error('Error saving service details:', err);
        res.status(500).json({ success: false, message: 'Error saving service details' });
    }
});

// Route to get user orders
app.get('/getUserOrders', async (req, res) => {
    try {
        const userEmail = req.query.userEmail;

        console.log('Received request for orders from user:', userEmail);

        // Find the user by email
        const user = await User.findOne({ userEmail });

        if (!user) {
            console.log('User not found:', userEmail);
            return res.status(404).json({ message: 'User not found' });
        }

        // Send the user's orders
        console.log('User orders fetched:', user.services);
        res.status(200).json(user.services);
    } catch (err) {
        console.error('Error fetching user orders:', err);
        res.status(500).json({ message: 'Error fetching user orders' });
    }
});

app.post('/cancelOrder', async (req, res) => {
    try {
        const { userEmail, serviceType, amount, serviceDate } = req.body;

        // Find the user by email
        const user = await User.findOne({ userEmail });

        if (!user) {
            console.log('User not found:', userEmail);
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the order in the user's services array
        const orderIndex = user.services.findIndex(
            (order) =>
                order.serviceType === serviceType &&
                order.amount === amount &&
                order.serviceDate.toString() === new Date(serviceDate).toString()
        );

        if (orderIndex === -1) {
            console.log('Order not found:', serviceType, amount, serviceDate);
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to 'Cancelled'
        user.services[orderIndex].orderStatus = 'Cancelled';

        // Save the updated user document
        await user.save();

        console.log('Order canceled successfully:', user.services[orderIndex]);
        res.status(200).json({ success: true, message: 'Order canceled successfully' });
    } catch (err) {
        console.error('Error canceling order:', err);
        res.status(500).json({ message: 'Error canceling order' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
