import User from "../models/User";

// Get user data using userId
export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth;
        const user = await User.findById(userId);
        if(!user){
            return res.json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User found' })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// Update user data using userId
export const updateUserData = async (req, res) => {
    try {
        const { userId } = req.auth;
        const {username, bio, location, full_name} = req.body;  
        const tempUser = await User.findById(userId);

        !username && (username = tempUser.username);

        if(tempUser.username !== username){
            const user = User.findOne({ username });
            if(user){
                // dont change username if already taken
                username = tempUser.username;
                return res.status(400).json({ success: false, message: 'Username already taken' });
            }
        }

        const updatedData = {
            username,
            bio,
            location,
            full_name
        }

        const profile = req.files.profile && req.files.profile[0];
        const cover = req.files.cover && req.files.cover[0];
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: error.message });
    }
}