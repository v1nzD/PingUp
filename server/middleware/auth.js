export const protect = async (req, res, next) => {
    try {
        // Check if the user is authenticated
        const {userId} = await req.auth;
        if (!userId) {
            return res.status(401).json({success: false, message: 'not authenticated' });
        }
        next();
    } catch (error) {
        return res.status(401).json({sucess: false, message: error.message });
    }
}