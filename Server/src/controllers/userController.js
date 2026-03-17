import pool from "../utils/db.js"

export const fetchUserRooms = async (req, res) => {
    try {
        const { email } = req.query; 

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await pool.query(
            'SELECT room_id, description, language, created_at FROM rooms WHERE host_email = $1',
            [email]
        );
        
        res.status(200).json({ rooms: result.rows });
    } catch (error) {
        console.error("Error fetching user rooms:", error);
        res.status(500).json({ error: "Failed to fetch user rooms" });
    }
};

export const deleteUserRoom = async (req, res) => {
    try{
        const { roomId } = req.params;

        await pool.query(
            "DELETE FROM rooms WHERE room_id = $1",
            [roomId]
        );

        res.status(200).json({message: "Room Deleted Successfully"});

    } catch (error){
        console.log("Error deleting room from db");
        res.status(500).json({message: "Failed to delete the room"});
    }
}